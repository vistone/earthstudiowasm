# Earth Google Web — 完整数据协议分析

> 基于所有 proto 文件和真实抓包数据的完整分析

---

## 一、URL 组合机制

### 1.1 Config 模板变量

Config 返回的 URL 包含以下模板变量，运行时替换：

| 变量 | 含义 | 示例值 |
|---|---|---|
| `$[hl]` | 界面语言 | `en-US` |
| `$[gl]` | Google 语言环境 | `en` |
| `$[cc]` | 客户端上下文 | (加密token) |
| `$[lat]`, `$[long]` | 经纬度 | `40.7128`, `-74.006` |
| `$[gcp_project_id]` | Google Cloud 项目 ID | (用户项目) |
| `$[imagery_type]` | 影像类型 | `satellite`, `3d_buildings` |
| `{{x}}`, `{{y}}`, `{{z}}` | 瓦片坐标 | 运行时计算 |

### 1.2 16 个 API 服务 URL 组合方式

| 服务 | URL 模板 | 请求方式 | 数据格式 |
|---|---|---|---|
| `rocktree_service` | `https://kh.google.com/rt` + `/earth/NodeData/pb=!1m2!1s{NODE}!2u{EPOCH}!2e1!3u1037!4b0` | GET | binary proto |
| `earth_gws_service` | `https://earth.google.com/earth/rpc` + channel header | POST | JSPB JSON / binary proto |
| `earth_document_http_service` | `https://earth.google.com/earth/document` + resource path | POST/PUT/DELETE | JSPB JSON |
| `fife_service` | `https://lh5.googleusercontent.com/earth/` + photo path | GET | binary image |
| `streamchat_service` | `https://webchannel-earth-pa.googleapis.com/v1/ai/streamchat` | WebSocket/SSE | streaming JSON |
| `geo_photo_thumbnail_service` | `https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid={id}` | GET | JPEG |
| `geo_photo_tile_service` | `https://streetviewpixels-pa.googleapis.com/v1/tile?panoid={id}&zoom={z}&x={x}&y={y}` | GET | JPEG |
| `geocoding_service` | `https://geogeocoding.googleapis.com` + query params | GET | JSON |
| `scotty_upload_customer_service` | `https://earth.google.com/earth/upload` + multipart | POST | multipart |
| `scotty_download_customer_service` | `https://earth.usercontent.google.com/earth/download` + resource id | GET | binary |
| `picker_service` | `https://docs.google.com/picker` + oauth | POST | JSON |
| `firebase_dynamic_links_service` | `https://firebasedynamiclinks.googleapis.com` | POST | JSON |

---

## 二、Maps VT 矢量瓦片 URL 构造

### 2.1 URL 格式

```
https://www.google.com/maps/vt/proto
  ?bpb=<base64-encoded TileRequest proto>
  &token=<numeric token>
```

### 2.2 TileRequest Proto（反向工程）

bpb 参数是 base64 编码的 protobuf 二进制，结构如下：

```
TileRequest {
  field 1: TileCoord {        ← 瓦片坐标
    x: 2,
    y: 3,
    zoom_level: 2
  }
  
  field 2: ViewportInfo {     ← 视口/样式
    zoom: 0,
    style: "m",               ← 地图样式键
    token_id: 790999999,      ← 会话token
    layer_info: {
      layer_id: "ndl",        ← "normal daylight" 图层
      version: "1"
    }
  }
  
  field 3: LocaleInfo {       ← 语言/地区/样式
    locale: "en-US",          ← $[hl]
    country: "US",            ← 从IP/账号
    app_id: 3,                ← 3 = Google Earth Web
    style_config: {
      style_id: 68,
      style_name: "RoadmapSatellite"
    }
  }
  
  field 4: scale = 1          ← DPI 缩放
  
  field 6: FeatureFlags {     ← 功能开关
    flags: {...}
  }
  
  field 23: unknown           ← 1 byte
}
```

### 2.3 资源版本

所有 Maps 资源的版本号统一为：`e3dec3f84b7764496b89ce7fd835e7f4`

这个 hash 出现在：
- sxforms 样式规则 URL
- 38 种图例图片 URL
- 所有 gstatic.com/maps/res/ 资源

---

## 三、ClientVectorTile 响应解析

### 3.1 响应结构

```
ClientVectorTile {
  tile_options: {
    vertex_encoding: ...,      ← CORD 编码格式
    vertex_resolution: ...,
  }
  multi_zoom_style_table: [    ← 样式ID表 (704B)
    ... style definitions ...
  ]
  point_group: [PointRenderOp]   ← 点标注
  line_group: [LineRenderOp]     ← 道路线条 (50B)
  area_group: [AreaRenderOp]     ← 建筑多边形
  volume_group: [VolumeRenderOp] ← 3D挤出建筑 (24B)
  label_group: [LabelRenderOp]   ← 文字标注
  raster_group: [RasterRenderOp] ← 栅格叠加
  major_epoch: 1                 ← 版本号
}
```

### 3.2 CORD 编码

`ctype = CORD` 是 Google 私有的坐标压缩格式：
- 存储为 delta-encoded varint 序列
- 需要根据 `vertex_encoding` 和 `vertex_resolution` 参数解码
- 解码后得到瓦片局部坐标（0-255 或 0-65535 范围）
- 最终屏幕坐标 = CORD坐标 × 瓦片变换矩阵

---

## 四、3D 地形瓦片（NodeData）解析

### 4.1 变换矩阵

每个 NodeData 包含 4×4 双精度变换矩阵，将局部网格坐标转为 ECEF：

```
Matrix (column-major):
[-27357, -38689, -27357,  9472210]  ← ECEF X (米)
[ 27357, -38689,  27357,   354044]  ← ECEF Y (米)
[-38689,      0,  38689, -3378738]  ← ECEF Z (米)
[     0,      0,      0,        1]
```

### 4.2 网格结构

```
Mesh {
  vertices: 143 点 × int16 xyz = 858B
  indices:  1334 三角形 × uint16 = 2668B
  texture: {
    data:   8550B JPEG (256×256)
    width:  256
    height: 256
  }
  texcoords: 1148B UV坐标
  normals: 79B + 572B 法线
  skirt: 16B 边缘缝合
}
```

---

## 五、sxforms 样式引擎

### 5.1 端点

```
GET https://www.google.com/maps/vt/sxforms?v={resource_hash}
```

返回 588KB 的 `StyleTransforms` proto，定义 80+ 种样式变换规则。

### 5.2 StyleTransforms 结构

```protobuf
message StyleTransforms {
  message Transform {
    int32 tag = 1;                    // 变换类型（80+种）
    repeated int32 input_style_id = 2;  // 输入样式ID
    repeated int32 output_style_id = 3; // 输出样式ID
  }
}
```

### 5.3 变换类型（80+种，从 proto 提取）

| 类别 | 变换 |
|---|---|
| **搜索** | SEARCH_NEARBY, MUTE_NON_RESULT_POIS, PHOTO_PIN, EMPHASIZED_POI_BOLD, HIDE_NON_RESULT_POIS |
| **导航** | 25D_NAV_DESTINATION_HIGHLIGHT, OCCLUDED_NAV_POLYLINE, MANEUVER_LANDMARK_HIGHLIGHT |
| **公交** | TRANSIT_DIRECTIONS_HIDE_STATIONS_ON_ROUTE, TRANSIT_DIRECTIONS_STATIONS_ON_ROUTE, TRANSIT_ENTRANCE_SELECT |
| **旅行** | TRAVEL_AREA_OF_INTEREST, TRAVEL_CORRIDOR_OF_INTEREST, TOURIST_CORRIDOR, TRAVEL_MAP_HIDE_PRIMARY_LAYER |
| **电动车** | EV_COMPATIBLE_STATION_14/15/16/17 |
| **3D** | 3D_BUILDING_HIGHLIGHT, REMOVE_PISA_BUILDING_FOOTPRINT |
| **触觉地图** | TACTILE_HIDE, TACTILE_TRANSITION_POI_ICON |
| **室内** | INDOOR_MAP_AVAILABLE |
| **繁忙度** | AREA_BUSYNESS, MEDIUM_LIVE_BUSYNESS, HIGH_LIVE_BUSYNESS |
| **其他** | PINLET_TO_DOT, BUSINESS_CLOSED, TEMPORARILY_CLOSED, RECENTLY_VIEWED_RESULT, SELECTED, REGULATED_AREA, REMOVE_SUBTITLES, ROUTE_RELEVANT_ROAD_LABELS, REMOVE_BACKGROUND_CONTENT |

### 5.4 38 种地图图例

`https://www.gstatic.com/maps/res/Legend-{STYLE}-{hash}`

| 样式 | 用途 |
|---|---|
| Roadmap | 标准地图 |
| RoadmapDark | 暗色标准 |
| RoadmapSatellite | 卫星混合 |
| Navigation | 导航标准 |
| NavigationLowLight | 导航低光 |
| NavigationSatellite | 导航卫星 |
| NavigationEgmm | 导航EGMM |
| NavigationTunnel | 导航隧道 |
| NavigationGlasses | 导航AR眼镜 |
| NavigationMinMode | 导航精简 |
| NavigationAmbient | 导航环境 |
| NavigationHighDetail | 导航高清 |
| Terrain | 地形 |
| TerrainDark | 暗色地形 |
| TerrainVectorClient | 地形矢量 |
| TransitFocused | 公交聚焦 |
| RouteOverview | 路线概览 |
| Travel | 旅行 |
| AirQualityHeatmap | 空气质量热力图 |
| ImmersiveView | 沉浸视图 |
| BasemapEditingSatellite | 底图编辑卫星 |

---

## 六、完整数据流

```
┌─────────────────────────────────────────────────────────┐
│ 1. 客户端启动                                            │
│    GET earth-pa.../v1/earth/config?alt=proto             │
│    → 获取 16 个服务 URL + 15 个天体 + 38 个样式图例        │
├─────────────────────────────────────────────────────────┤
│ 2. 加载地图                                              │
│    GET kh.google.com/rt/earth/PlanetoidMetadata          │
│    → 行星参数 (半径 6,371km, epoch)                       │
│    GET kh.google.com/rt/earth/BulkMetadata               │
│    → 瓦片树索引 (3层 48节点 S2四叉树)                      │
│    GET kh.google.com/rt/earth/NodeData?pb=...            │
│    → 3D 地形网格 (143顶点 + 1334三角形 + 256×256 JPEG)     │
├─────────────────────────────────────────────────────────┤
│ 3. 矢量地图覆盖                                          │
│    GET www.google.com/maps/vt/sxforms?v={hash}           │
│    → 588KB 样式变换规则 (80+ 种)                           │
│    GET www.google.com/maps/vt/proto?bpb=...&token=...    │
│    → ClientVectorTile (道路/建筑/标注矢量数据 + CORD编码)   │
│    GET www.gstatic.com/maps/res/Legend-{STYLE}-{hash}    │
│    → 图例图片 (38 种样式)                                  │
├─────────────────────────────────────────────────────────┤
│ 4. 用户交互                                              │
│    POST earth.google.com/earth/rpc                       │
│    → 搜索/命令/知识卡片 (Commands proto)                    │
│    POST earth.google.com/earth/document                  │
│    → 地物 CRUD (content_editing_model proto)              │
│    POST webchannel-earth-pa.../v1/ai/streamchat          │
│    → Earth Mate AI 流式聊天                               │
├─────────────────────────────────────────────────────────┤
│ 5. 街景照片                                              │
│    gRPC MetadataService.GetConnectivity                  │
│    → 全景连接图                                           │
│    gRPC MetadataService.GetMetadata                      │
│    → 照片元数据                                           │
│    GET streetviewpixels-pa.../v1/thumbnail?panoid=...    │
│    → 全景缩略图                                           │
└─────────────────────────────────────────────────────────┘
```

---

*基于 1,316 个官方 proto 文件 + 9 个真实 API 端点的完整分析 — 2026-08-12*
