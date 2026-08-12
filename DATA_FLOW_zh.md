# Earth Studio WASM — 数据流分析

## earth.google.com/web/ 通信协议解码（基于 proto 文件）

> **来源**: `geo/earth/proto/` 下的 1,316 个 proto 文件定义了 Earth Web 客户端的完整有线协议。

---

### 1. 架构概览

Earth Web 客户端通过**两个不同的通道**与 Google Earth 后端通信：

| 通道 | 协议 | 格式 | 用途 |
|---|---|---|---|
| **Earth RPC（HTTP/REST）** | HTTP POST/GET + JSON | **JSPB**（Java Server Protobufs） | 搜索、知识卡片、要素、文档、KML、AI、分析、启动配置 |
| **照片元数据（gRPC）** | gRPC（二进制 protobuf） | **二进制 protobuf** 或 **JSPB JSON** | 街景全景图元数据与连接图 |

Earth RPC 层将 proto 消息包装为遵循 JSPB 约定（camelCase 字段名）的 JSON。gRPC 层使用标准 proto 二进制编码，同时提供显式的 `JSPB` 格式选项。

---

### 2. 数据层分类

基于 proto 分析，完整的交换数据类别：

| 类别 | Proto 来源 | 方向 | 格式 |
|---|---|---|---|
| 启动配置 | `bootstrap_client_config.proto` | 服务器 → 客户端 | JSPB JSON |
| 地图影像切片 | `mapstyle.proto`（imagery 枚举） | 服务器 → 客户端 | 二进制（JPEG/PNG/WebP）+ proto 元数据 |
| 3D 地形 | —（标准高程切片） | 服务器 → 客户端 | 二进制（量化网格） |
| 3D 建筑 | `ToggleLayer` → `LAYER_TYPE_3D_BUILDINGS` | 服务器 → 客户端 | 二进制（glTF/3D Tiles） |
| 搜索结果 | `PerformSearch` → `RenderableEntity` | 客户端 → 服务器 → 客户端 | JSPB JSON |
| 知识卡片 | `OpenKnowledgeCard` → `RenderableEntity` | 客户端 → 服务器 → 客户端 | JSPB JSON |
| 要素 CRUD | `CreateFeature` / `EditFeature` / `DeleteFeature` | 客户端 → 服务器 | JSPB JSON |
| 文档存储 | `OpenCloudProject` / `CreateCloudProject` / `OpenProjectByKey` | 客户端 → 服务器 → 客户端 | JSPB JSON |
| KML 导入/导出 | `OpenKmlDocument` / `OpenKmlDocumentFromContent` | 客户端 → 服务器 → 客户端 | JSPB JSON |
| Earth Mate AI | `OpenEarthMateChat` → `earth_mate/` | 客户端 → 服务器 → 客户端 | JSPB JSON |
| 图像生成 | `OpenImageGenerator` | 客户端 → 服务器 → 客户端 | JSPB JSON |
| 街景照片 | `MetadataService`（gRPC） | 客户端 ↔ 服务器 | 二进制 protobuf 或 JSPB JSON |
| 分析数据 | `earth_log.proto`（89 种事件类型） | 客户端 → 服务器 | JSPB JSON |
| 用户状态 | `state/*.proto`（60+ 切片） | 客户端 ↔ 服务器 | JSPB JSON |
| 设计/分析 | `ViewDesign` / `CreateDesigns` / `ViewOnDemandAnalysis` | 客户端 → 服务器 → 客户端 | JSPB JSON |

---

### 3. 全部 34 个用户命令（来自 `commands.proto`）

Earth Web 中的每个用户交互都被序列化为带有 oneof 的 `Command` 消息：

| # | 命令 | 用途 | 关键字段 |
|---|---|---|---|
| 1 | `ClearSearchHistory` | 清除用户搜索历史 | — |
| 2 | `OpenSearchHistory` | 打开搜索历史面板 | — |
| 3 | `OpenVoyagerGrid` | **[已弃用]** Voyager 故事浏览器 | `category_id` |
| 4 | `OpenVoyagerStory` | **[已弃用]** 打开故事 | `guid`、`feed_item`、`balloon_feature_id` |
| 5 | `PerformSearch` | 搜索地点 | `query`、`result_group_id`、`viewport`（北南东西边界） |
| 6 | `OpenFeelingLuckyCard` | 打开"手气不错"卡片 | — |
| 7 | `OpenKnowledgeCard` | 打开地点详情卡片 | `fid` 或 `mid`、`metadata.lat_lon`、`card_size` |
| 8 | `FlyToCamera` | 相机飞行动画 | `look_at` 或 `look_from`、`camera_animation`（瞬移/飞行） |
| 9 | `OpenCloudProject` | 打开已保存项目 | `project_id`、`document_namespace`（EARTH/MYMAPS）、`present_mode` |
| 10 | `CreateCloudProject` | 创建新项目 | `folder_id` |
| 11 | `EnterTimeMachine` | 进入历史影像模式 | `date`、`timelapse_enabled`、`timelapse_framerate_multiplier` |
| 12 | `OpenKmlDocument` | 通过 URL 打开 KML | `uri` |
| 13 | `EnterTimelapse` | 切换延时摄影模式 | `enabled`、`expanded`、`framerate_multiplier`、`paused_at_year` |
| 14 | `CreatePointPlacemark` | 在地图上创建点位 | `lat_lng_alt`（纬度、经度、海拔）、`altitude_mode` |
| 15 | `EnterStreetView` | 在指定位置进入街景 | `lat_lng_alt` |
| 16 | `ToggleLayer` | 切换地图叠加层 | `layer_type`（建筑/延时摄影/覆盖范围/照片/经纬网/云层）、`enabled` |
| 17 | `CreateFeature` | 创建命名要素 | `feature_properties`、`feature_style`、`document_key`、`overhead_imagery_properties` |
| 18 | `OpenKmlDocumentFromContent` | 从原始内容打开 KML | `content`（字节） |
| 19 | `DeleteFeature` | 删除要素 | `document_key`、`feature_id` |
| 20 | `EditFeature` | 编辑现有要素 | `document_key`、`feature_id`、`feature_properties`、`feature_style` |
| 21 | `OpenProjectByKey` | 通过文档键打开项目 | `document_key`（整数）、`fly_to_after_load` |
| 22 | `SetHomescreenVisibility` | 显示/隐藏主屏幕 | `is_open` |
| 23 | `SetBasemapStyle` | 更改地图影像类型 | `imagery`（SATELLITE/ROADMAP/TERRAIN） |
| 24 | `CreateFeaturesInFolder` | 在文件夹中批量创建要素 | `commands[]`、`document_key`、`folder_name` |
| 25 | `RenderDesign` | **[已弃用]** 渲染设计 | `design`（字节） |
| 26 | `ViewDesign` | 查看设计详情 | `selected_design_id`、`is_design_details_open` |
| 27 | `CreateDesigns` | 开始太阳能/新建建筑设计 | `design_input_mode`（NEW_BUILD/SOLAR） |
| 28 | `ToggleAvailableLayersUi` | 打开数据目录 | `open_data_catalog` |
| 29 | `PreviewDataLayer` | 预览数据图层 | `earth_data_layer_identifier` |
| 30 | `ViewRateCard` | 打开定价费率卡 | `open_rate_card` |
| 31 | `OpenEarthMateChat` | 打开 AI Earth Mate 聊天 | `is_open`、`initial_query` |
| 32 | `ShowLayerCardDetails` | 显示图层卡片详情 | `earth_data_layer_identifier` |
| 33 | `ViewOnDemandAnalysis` | 地形分析工具 | `open_slope_analysis`、`open_aspect_analysis`、`open_cut_and_fill_analysis`、`open_contour_analysis` |
| 34 | `OpenImageGenerator` | 打开 AI 图像生成器 | `initial_query` |

命令通常在 `Commands { repeated Command commands = 1; }` 中批量发送。

---

### 4. JSPB 格式（Proto → JSON 有线格式）

Google 的 Web 客户端使用 **JSPB**（Java Server Protobufs）——一种 protobuf 消息的 JSON 表示。每个 proto 字段名转换为 **camelCase**。枚举值以**字符串**（其名称）而非整数传输。

#### 4.1 示例：`FlyToCamera`（来自 `commands.proto` 第 136–194 行）

Proto 定义：
```protobuf
message FlyToCamera {
    oneof camera_type {
        LookAt look_at = 1;
        LookFrom look_from = 2;
    }
    optional CameraAnimation camera_animation = 3 [default = CAMERA_ANIMATION_TELEPORT];
    optional CameraPresentationMode camera_presentation_mode = 4;
    optional Panorama panorama = 5;
    optional bool disable_clamping = 6;

    message LookAt {
        optional double latitude = 1;
        optional double longitude = 2;
        optional double altitude = 3;
        optional double range = 4;
        optional double heading = 5;
        optional double tilt = 6;
        optional double roll = 7;
        optional double fovy = 8;
    }
}
```

JSPB JSON 等价物（实际在线路上传输的内容）：
```json
{
  "lookAt": {
    "latitude": 40.7128,
    "longitude": -74.006,
    "altitude": 1000,
    "range": 5000,
    "heading": 45,
    "tilt": 30
  },
  "cameraAnimation": "CAMERA_ANIMATION_TELEPORT",
  "cameraPresentationMode": "PRESENTATION_MODE_STATIC"
}
```

JSPB 关键约定：
- **字段名**：`snake_case` proto → `camelCase` JSON
- **枚举**：以字符串名称传输，而非整数
- **Oneof 字段**：仅存在活动变体
- **可选/缺失字段**：直接从 JSON 中省略
- **默认值**：不传输（客户端将缺失解释为默认值）

---

### 5. 每个功能的请求/响应流程

#### 5.1 应用启动

```
用户导航到 https://earth.google.com/web/
  → 浏览器 GET /（HTML 页面）
  → 下载 Earth Web WASM 包
  → WASM 初始化，请求客户端配置
  → 服务器以 JSPB JSON 返回 BootstrapClientConfig

BootstrapClientConfig（bootstrap_client_config.proto）：
  ├── earth_service_config: ServiceConfig
  │   包含：切片服务器 URL、影像提供者、API 端点、
  │   实验标志（A/B 测试分配）、功能开关、
  │   CompileTimeConfig（基础图层样式、绘制图层、栅格图层）
```

`BootstrapClientConfig` 包装了 `google.internal.earth.v1.config.ServiceConfig` ——这是告诉客户端以下内容的主配置：
- 从哪里获取地图切片
- 调用哪些 API 端点进行搜索、要素等
- 启用了哪些实验功能
- 哪些地图样式和图层可用

#### 5.2 地图切片加载

```
客户端接收 BootstrapClientConfig
  → 从 ServiceConfig 中提取切片服务器 URL
  → 根据相机视口计算所需的切片坐标
  → 从配置的切片服务器请求切片

请求：GET {切片服务器URL}/{缩放}/{x}/{y}?style={MapStyle}
响应：二进制图像（JPEG/PNG/WebP）+ 可选的 proto 元数据

MapStyle（来自 mapstyle.proto）控制：
  projection        : GLOBE | MERCATOR
  imagery           : SATELLITE | NORMAL_ROADMAP | TERRAIN
  three_d_features  : ALL | TERRAIN_ONLY | NONE
  show_clouds       : 布尔值（默认为 true）
  gridlines_layer   : NONE | LAT_LON
  show_three_d_coverage_layer : 布尔值
  show_updated_imagery_layer  : 布尔值
  show_land_parcels_layer     : 布尔值
  show_pinned_projects_layer  : 布尔值
  use_animated_clouds         : 布尔值
  base_layers       : BaseLayers { preset: CLEAN | EXPLORATION | EVERYTHING }
```

ToggleLayer 控制动态叠加层切换：
```
图层类型：
  LAYER_TYPE_3D_BUILDINGS      (1) — 3D 建筑模型（glTF/3D Tiles）
  LAYER_TYPE_TIMELAPSE         (2) — 延时摄影叠加层
  LAYER_TYPE_RECENTLY_UPDATED  (3) — 最近更新的影像
  LAYER_TYPE_3D_COVERAGE       (4) — 3D 覆盖区域叠加层
  LAYER_TYPE_PHOTOS            (5) — 照片缩略图层
  LAYER_TYPE_GRIDLINES         (6) — 经纬度网格
  LAYER_TYPE_ANIMATED_CLOUDS   (7) — 动画云层叠加
  LAYER_TYPE_PINNED_PROJECTS   (10) — 固定项目图层
```

#### 5.3 搜索流程

```
用户输入查询 → 客户端发送 PerformSearch 命令

请求（JSPB JSON）：
{
  "query": "埃菲尔铁塔",
  "resultGroupId": "0",
  "viewport": {
    "north": 51.0,
    "south": 41.0,
    "east": 10.0,
    "west": -5.0
  },
  "suppressFlyToResults": false
}

// 批量：Commands { commands: [{ "performSearch": {...} }] }

响应：RenderableEntity[]（earth_knowledge 包，来自 renderable-entity.proto）
```

**RenderableEntity** 结构（完整，来自 `renderable-entity.proto` 第 11–174 行）：

```
RenderableEntity {
  title                     : 字符串        — 地点名称
  known_for                 : 字符串        — 该地点以什么闻名
  description               : 字符串[]      — 多段落描述
  mid                       : 字符串        — 知识图谱机器 ID
  lat_lon                   : {lat, lon}    — 坐标
  feature_id                : 字符串        — Earth 要素 ID
  is_lat_lon_entity         : 布尔值        — 是否为坐标搜索？

  source[]                  : {anchor_text, url}
  image                     : {url, width, height, attribution, description}
  large_image               : Image
  image_carousel[]           : Image[]
  static_map[]               : Image[]

  camera                    : Camera        — 最佳视图（位置、旋转、视场角）
  bounding_box              : {
    southwest_corner        : LatLon
    northeast_corner        : LatLon
    recommended_zoom        : int32
  }

  address_line[]             : 字符串[]
  phone_number[]             : 字符串[]
  website                   : {url, anchor_text}
  open_location_code        : {global_code, compound_code}  — Plus Code
  maps_url                  : 字符串        — Google Maps 链接

  fact[]                     : {
    name                    : 字符串        — 事实类别
    fact_value[]            : {string_value}
    source[]                : Source
    search_url              : 字符串
  }

  open_hours                : {
    day[]                   : {
      day_name              : 字符串        — "星期一"、"星期二"……
      open_interval[]       : 字符串[]      — "09:00–17:00"
    }
  }

  card_set[]                : {name, card: Entity[]}
  entity_thumbnail_list[]    : {name, entity: Entity[], attribute_id, search_url, entity_type}
  place_attribute[]          : {id, localized_display_name}
  fun_fact[]                 : {text, source[]}

  spotlight_description     : {proto_bytes, entity_class (POINT|AREA), suppress_rendering}  [已弃用]
  pipe_metadata             : {search_pipe_metadata_proto_bytes}
  error[]                   : {msg}
  card_source[]             : Source[]
}
```

#### 5.4 要素 CRUD 流程

要素管理使用 `content_editing_model.proto` 数据模型：

```
Document（第 14–25 行）：
  ├── id                         : 字符串
  ├── metadata                   : {title, description, using_design_feature}
  ├── properties                 : {look_at_camera}
  ├── schema                     : { column[] }
  ├── contents                   : { feature[], feature_tree_continuation[] }
  ├── style                      : ContentStyle
  ├── creation_info              : CreationInfo
  ├── owner_profile              : OwnerProfile
  ├── type                       : MapType（MAP_EARTH | MAP_EARTH_DESIGN）
  └── model_version              : MODEL_VERSION_V1

Feature（第 77–84 行）：
  ├── feature_id                 : 字符串
  ├── is_continued               : 布尔值
  ├── properties                 : FeatureProperties
  ├── media[]                    : Media
  ├── child_feature[]            : Feature          — 树形结构
  └── render_style               : FeatureStyle

FeatureProperties（第 54–75 行）：
  ├── attribute[]                : {name → value}
  ├── look_at_camera             : LookAtCamera
  ├── visible                    : 布尔值（默认为 true）
  ├── title                      : 字符串
  ├── description               : 字符串
  ├── snippet                    : 字符串
  ├── address                    : 字符串
  ├── place_info                 : {mapfacts_feature_id, knowledge_graph_machine_id}
  ├── is_geocoded               : 布尔值
  ├── feature_restrictions       : {export_restrictions, edit_restrictions}
  ├── feature_origin             : FEATUREORIGIN_USER（17）
  ├── feature_model_type         : PLACEMARK | GROUND_OVERLAY | MAP_TILE_PYRAMID | CONTAINER | NETWORK_LINK | SCREEN_OVERLAY | PHOTO_OVERLAY
  ├── placemark                  : Placemark（geometry、model 或 track_set）
  ├── ground_overlay             : GroundOverlay
  ├── map_tile_pyramid           : MapTilePyramid
  ├── container                  : Container
  ├── network_link               : NetworkLink
  ├── screen_overlay             : ScreenOverlay
  └── photo_overlay              : PhotoOverlay

Placemark（第 86–92 行）：
  oneof GeometryRepresentation {
    geometry                     : Geometry   — {points[]、polylines[]、polygons[]}
    model                        : Model     — 3D 模型引用
    track_set                    : TrackSet  — GPS 轨迹
  }

Geometry（第 152–156 行）：
  ├── points[]                   : Point     — {position、altitude、altitude_mode、extrude}
  ├── polylines[]                : Polyline  — {point[]、altitude_mode、extrude、tessellate}
  └── polygons[]                 : Polygon   — {loop[]、altitude_mode、extrude}

LookAtCamera（第 101–118 行）：
  ├── position                   : LatLng
  ├── altitude                   : double
  ├── altitude_mode              : CLAMP_TO_GROUND | RELATIVE_TO_GROUND | ABSOLUTE
  ├── heading                    : double
  ├── tilt                       : double
  ├── range                      : double
  ├── fovy                       : double（默认 35°）
  ├── roll                       : double
  ├── type                       : LOOKATCAMERA_LOOKAT | LOOKATCAMERA_CAMERA
  └── options                    : {enable_streetview、enable_historical_imagery、
                                    enable_sunlight_effects、timestamp、streetview_pano_id}
```

**CRUD 操作：**

```
CreateFeature：
  请求（JSPB）：
  {
    "featureProperties": {
      "title": "我的标记",
      "placemark": { "geometry": { "points": [{"position": {"latitude": 40.7, "longitude": -74.0}}] } }
    },
    "featureStyle": {...},
    "documentKey": 42,
    "overheadImageryProperties": { "image": {...}, "acquisitionTime": "..." }
  }
  响应：Feature（带有服务器分配的 feature_id）

EditFeature：
  请求（JSPB）：
  {
    "documentKey": 42,
    "featureId": "abc123",
    "featureProperties": { "title": "更新后的名称" },
    "featureStyle": {...}
  }
  响应：Feature（已更新）

DeleteFeature：
  请求（JSPB）：
  {
    "documentKey": 42,
    "featureId": "abc123"
  }
  响应：成功或 ErrorResponse

CreateFeaturesInFolder（批量）：
  请求（JSPB）：
  {
    "commands": [{...}, {...}],
    "documentKey": 42,
    "folderName": "我的文件夹"
  }
```

#### 5.5 文档/项目流程

```
文档由以下标识：
  - project_id（字符串）    — 云文档 ID（UUID）
  - document_key（int32）   — 本地文档句柄
  - resource_key（字符串）  — 共享文档的访问密钥
  - document_namespace      — DOCUMENT_NAMESPACE_EARTH（1）| DOCUMENT_NAMESPACE_MYMAPS（2）

OpenCloudProject：
{
  "projectId": "abc-def-123",
  "documentNamespace": "DOCUMENT_NAMESPACE_EARTH",
  "flyToAfterLoad": true,
  "resourceKey": "可选访问密钥",
  "presentMode": { "featureId": "xyz" }  // 直接打开到特定要素
}

CreateCloudProject：
{ "folderId": "父文件夹-id" }

OpenProjectByKey：
{ "documentKey": 42, "flyToAfterLoad": true }

KML 导入：
  OpenKmlDocument：         { "uri": "https://example.com/mydata.kml" }
  OpenKmlDocumentFromContent：  { "content": <原始 KML 字节> }
```

#### 5.6 Earth Mate AI 流程（完整）

Earth Mate 是 Google 为 Earth 提供的 AI 助手。完整协议：

```
用户触发聊天 → OpenEarthMateChat { "isOpen": true, "initialQuery": "给我看看曼哈顿" }

客户端发送 EarthMateQueryRequest（JSPB）：
{
  "queryString": "给我看看曼哈顿",
  "appContext": {
    "creationContext": {
      "documentKey": 42,                     // 活动文档
      "documentId": "abc-def",
      "selectedFeatureIds": ["feat1"],
      "documentModelVersion": "MODEL_VERSION_V1"
    },
    "viewContext": {
      "viewport": { "north": 40.9, "south": 40.6, "east": -73.8, "west": -74.1 },
      "viewportImage": { "mimeType": "image/png", "imageBytes": "..." },
      "groundCoverageWidthMeters": 12000
    },
    "clientMetadata": {...},
    "configId": "...",
    "isOpenVocabToolSelected": false,
    "overheadImagerySearchContext": { "similarityThreshold": 0.8 }
  },
  "chatContext": {
    "chatHistory": {
      "messages": [
        { "text": "这里是什么？", "isBard": true, "requestId": "r1" },
        { "text": "显示最高的建筑", "isBard": false, "requestId": "r2" }
      ]
    },
    "chatId": "chat-abc-123"
  },
  "requestId": "r3"
}

服务器返回 EarthMateQueryResponse（JSPB）：
{
  "commands": [                              // ← Earth Mate 生成命令
    { "flyToCamera": { "lookAt": { "latitude": 40.758, "longitude": -73.985, ... } } },
    { "createFeature": { "featureProperties": {...}, "documentKey": 42 } }
  ],
  "responseString": "这是曼哈顿的时代广场。",
  "queryExecutionMetadata": {
    "responseFeatureLimitReached": false,
    "isPassthroughResponse": false,
    "isSlideshow": false,
    "nonFatalError": null
  },
  "attributions": [{...}],
  "chatId": "chat-abc-123",
  "viewportFileAttachment": { "encodedAttachmentId": "..." }
}

客户端然后执行返回的命令
  → FlyToCamera 飞到位置
  → CreateFeature 添加标记
  → 等等。
```

**Earth Mate 区域描述**（分析感兴趣区域）：

```
请求：{
  "polygons": [{ "loop": [{...}] }],
  "industry": "REAL_ESTATE",
  "format": "FORMAT_SHORT",
  "queryString": "分析该区域的太阳能潜力",
  "appContext": {...}
}

响应：{
  "responseString": "该区域具有极好的太阳能潜力……",
  "suggestedFollowupQueries": ["最佳屋顶角度是多少？"],
  "expandedResponseString": "详细分析……"
}
```

**Earth Mate 错误类型**（来自 `earth_mate_error_detail.proto`）：
```
UNEXPECTED_TOOL_ERROR（1）    — 工具执行失败
RPC_TIMEOUT（2）              — 后端超时
POI_TYPE_SENSITIVE（3）       — 敏感位置
POI_TYPE_NOT_FOUND（4）       — 地点未在知识图谱中
LOCATION_NOT_FOUND（5）       — 位置未识别
ANYTHING_MAPPER_UNAVAILABLE（6）
PROBLEM_TOO_COMPLEX（7）       — 查询对 AI 而言过于复杂
AGENT_FRAMEWORK_OVERLOADED（8）— 后端过载
```

#### 5.7 街景/照片流程（gRPC）

整个 Earth Web 客户端中**唯一的 gRPC 服务**是 `MetadataService`（来自 `metadataservice.proto`）：

```protobuf
service MetadataService {
    rpc GetMetadata(MetadataRequest) returns (MetadataResponse);
    rpc GetConnectivity(AreaConnectivityRequest) returns (AreaConnectivityResponse);
    rpc GetConnectivityZoomLevel(AreaConnectivityZoomLevelRequest) returns (AreaConnectivityZoomLevelResponse);
    rpc SingleImageSearch(SingleImageSearchRequest) returns (SingleImageSearchResponse);
}
```

**流程 1：进入街景**

```
用户点击某个位置 → EnterStreetView { lat_lng_alt: {40.7, -74.0, 100} }

客户端请求连接图：
  GetConnectivity(AreaConnectivityRequest) {
    context: RequestContext,
    polygon: { point: [{lat, lng}, ...] },
    first_point: LatLng,
    date: DateTime,
    navigation_channel: GLOBAL,
    include_target_orientation: true
  }

  → AreaConnectivityResponse {
    graph: {
      vertex: [{
        image_info: Target { image_key, ... },
        image_connection: [uint32, ...]      // 连接顶点的索引
      }, ...]
    },
    token: [{ token: "...", region: {...} }, ...],
    region: LatLngRectangle,
    self_reference_token: "...",
    index_of_first_external_vertex: int32
  }
```

**流程 2：获取照片元数据**

```
GetMetadata(MetadataRequest) {
  context: RequestContext,
  localization_context: LocalizationContext,
  query: [{ image_key: ImageKey, context_feature: FeatureSet }, ...],
  response_specification: {
    component: [RENDER_INFO, DESCRIPTION, ATTRIBUTION, GEOLOCATION,
                NAVIGATION_LINKS, STATISTICS, STREET_VIEW, THUMBNAIL, ...],
    navigation_channel: NavigationChannelKey[],
    http_response_format: BINARY | JSPB,
    thumbnail_options: {...},
    client_capabilities: {...}
  }
}

  → MetadataResponse {
    photo: [{
      image_key: ImageKey,
      render_info: RenderInfo,
      description: Description,
      attribution: Attribution,
      navigation_channel: NavigationChannel[],
      attributes: ImageAttributes,
      statistics: Statistics,
      street_view_attributes: StreetViewAttributes,
      labels: PhotoLabel[],
      thumbnail: ThumbnailInfo[],
      pano_semantic_map: PanoSemanticMap,
      ...
    }, ...]
  }
```

**流程 3：单图像搜索**

```
SingleImageSearchRequest {
  context: RequestContext,
  location: PhotoByLatLngQuery,    // 或 feature: PhotoByFeatureQuery
  image_key: ImageKey,
  query_options: PhotoQueryOptions,
  response_specification: MetadataResponseSpecification,
  pixel_specification: PixelResponseSpecification
}

  → SingleImageSearchResponse {
    metadata: PhotoMetadata,
    view: ViewParameters,
    tile: {
      zoom_level: int32,
      tile_jpeg: bytes              // ← 原始 JPEG 字节
    }
  }
```

**响应格式可根据** `MetadataResponseSpecification` 进行配置：
```protobuf
enum ProtoFormat {
    UNKNOWN_FORMAT = 0;
    BINARY = 1;   // 标准 protobuf 二进制
    JSPB = 2;     // JSON 表示
}
```

#### 5.8 设计与分析流程

```
ViewDesign（设计详情面板）：
{ "selectedDesignId": "design-1", "isDesignDetailsOpen": true, "isDesignViewerOpen": false }

CreateDesigns（开始新设计）：
{ "designInputMode": "DESIGN_INPUT_MODE_NEW_BUILD" }
// 或：{ "designInputMode": "DESIGN_INPUT_MODE_SOLAR" }

ViewOnDemandAnalysis（地形分析，oneof）：
{
  "openSlopeAnalysis": true
  // 或："openAspectAnalysis": true
  // 或："openCutAndFillAnalysis": true
  // 或："openContourAnalysis": true
}
```

---

### 6. 错误处理

所有服务器响应在出错时都可能包含 `ErrorResponse`（来自 `error_response.proto`）：

```protobuf
message ErrorResponse {
    ErrorId error_id：
        UNKNOWN_ERROR_ID (0)
        INTERNAL_ERROR (1)
        NOT_FOUND (2)
        PERMISSION_DENIED (3)
        INVALID_GEOMETRY_IN_S2 (4)
        MAX_LAYERS_REACHED (5)
        QUOTA_EXCEEDED (6)
        DATA_IMPORT_ERROR (7)
        EARTH_MATE_ERROR (8)
        DATA_LAYER_ERROR (9)

    bool is_retryable          // 客户端应该重试吗？
    string message             // 人类可读的错误信息
    bool throttled             // 请求是否被限流？

    oneof detailed_error {
        DataImportErrorStatus data_import_error_status
        EarthMateErrorDetail earth_mate_error_detail
        DataLayerErrorDetail data_layer_error_detail
    }
}
```

**JSPB 表示：**
```json
{
  "errorId": "PERMISSION_DENIED",
  "isRetryable": false,
  "message": "您没有访问此项目的权限。",
  "throttled": false
}
```

---

### 7. Proto → 开放格式转换

#### 7.1 Geometry → GeoJSON

```typescript
// geo/earth/proto/geometry.proto → GeoJSON

function latLngToGeoJSON(latLng: earth.LatLng): GeoJSON.Point {
  return {
    type: "Point",
    coordinates: [latLng.lng, latLng.lat],   // GeoJSON 是 [经度, 纬度]
  };
}

// content_editing_model Placemark → GeoJSON Feature
function placemarkToGeoJSON(pm: Placemark): GeoJSON.Feature {
  if (pm.geometry?.points?.length) {
    return {
      type: "Feature",
      geometry: pointToGeoJSON(pm.geometry.points[0].position),
      properties: {
        name: pm.properties?.title,
        description: pm.properties?.description,
        altitude: pm.geometry.points[0].altitude,
        altitudeMode: pm.geometry.points[0].altitude_mode,
      },
    };
  }
  if (pm.geometry?.polylines?.length) {
    return {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: pm.geometry.polylines[0].point.map(p => [p.position.longitude, p.position.latitude]),
      },
      properties: {},
    };
  }
  if (pm.geometry?.polygons?.length) {
    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: pm.geometry.polygons[0].loop.map(l =>
          l.point.map(p => [p.position.longitude, p.position.latitude])
        ),
      },
      properties: {},
    };
  }
  throw new Error("不支持的几何类型");
}
```

#### 7.2 RenderableEntity → Schema.org / 开放标准

```typescript
function entityToSchemaOrg(entity: RenderableEntity): SchemaOrgPlace {
  return {
    "@type": "Place",
    "name": entity.title,
    "description": entity.description?.join("\n"),
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": entity.lat_lon?.lat,
      "longitude": entity.lat_lon?.lon,
    },
    "image": entity.image?.url,
    "address": entity.address_line?.join(", "),
    "telephone": entity.phone_number?.[0],
    "url": entity.website?.url,
    "openingHoursSpecification": entity.open_hours?.day?.map((d) => ({
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": schemaOrgDay(d.day_name!),
      "opens": d.open_interval?.[0],
      "closes": d.open_interval?.[1],
    })),
    "additionalProperty": entity.fact?.map((f) => ({
      "@type": "PropertyValue",
      "name": f.name,
      "value": f.fact_value?.map(v => v.string_value).join(", "),
    })),
    "subjectOf": entity.card_source?.map((s) => ({
      "@type": "WebPage",
      "url": s.url,
      "name": s.anchor_text,
    })),
  };
}
```

#### 7.3 Camera → 标准 ECEF 参数

```typescript
// LookAt（commands.proto）和 earth.Camera（geometry.proto）→
// 适用于任何渲染引擎的通用相机参数

interface UniversalCamera {
  position: { x: number; y: number; z: number };  // ECEF 米
  target: { x: number; y: number; z: number };     // ECEF 米
  up: { x: number; y: number; z: number };
  fov: number;                                     // 垂直度数
}

function lookAtToUniversal(lookAt: FlyToCamera.LookAt): UniversalCamera {
  const target = latLngAltToEcef(lookAt.latitude!, lookAt.longitude!, lookAt.altitude ?? 0);
  const headingRad = degToRad(lookAt.heading ?? 0);
  const tiltRad = degToRad(lookAt.tilt ?? 0);
  const range = lookAt.range ?? 1000;

  const pos = offsetFromTarget(target, range, headingRad, tiltRad);
  return {
    position: pos,
    target: target,
    up: { x: 0, y: 0, z: 1 },
    fov: lookAt.fovy ?? 35,
  };
}

function earthCameraToUniversal(camera: earth.Camera): UniversalCamera {
  const loc = camera.location!;
  const rot = camera.rotation!;
  const target = latLngAltToEcef(loc.latitude!, loc.longitude!, loc.altitude ?? 0);
  const headingRad = degToRad(rot.heading ?? 0);
  const tiltRad = degToRad(rot.tilt ?? 0);

  const pos = offsetFromTarget(target, 1000, headingRad, tiltRad);
  return {
    position: pos,
    target: target,
    up: { x: 0, y: 0, z: 1 },
    fov: camera.field_of_view_y ?? 35,
  };
}
```

---

### 8. 数据解析管道

```
┌──────────────────────────────────────────────────────────────┐
│                   HTTP 响应（JSPB JSON）                     │
│  { "lookAt": { "latitude": 40.7, "longitude": -74.0 } }     │
└──────────────────────────┬───────────────────────────────────┘
                           │  JSON.parse()
┌──────────────────────────┴───────────────────────────────────┐
│         protobuf-ts / protobuf-es：JSON → Proto 消息         │
│  FlyToCamera.fromJson(response)                              │
│  → 具有所有字段访问器的类型化对象                               │
└──────────────────────────┬───────────────────────────────────┘
                           │  适配器层
┌──────────────────────────┴───────────────────────────────────┐
│              适配器：Proto → 开放格式                         │
│  lookAtToUniversal(cmd.lookAt)                               │
│  entityToGeoJSON(renderableEntity)                           │
│  geometryToWKT(placemark.geometry)                           │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────┴───────────────────────────────────┐
│           输出：平台无关数据                                   │
│  GeoJSON · glTF 引用 · Schema.org · WKT · ECEF 坐标          │
│  → 可供 Three.js、CesiumJS、MapLibre、Unity、Unreal 使用     │
└──────────────────────────────────────────────────────────────┘
```

---

### 9. 实施优先级

构建纯数据层**唯一**需要实现的内容：

#### 阶段 1：Proto → TypeScript 代码生成

```bash
# 使用 @protobuf-ts/plugin（推荐）
protoc \
  --ts_out . \
  --proto_path geo/earth/proto \
  geo/earth/proto/commands.proto \
  geo/earth/proto/renderable-entity.proto \
  geo/earth/proto/contentcreation/content_editing_model.proto \
  geo/earth/proto/bootstrap_client_config.proto \
  geo/earth/proto/mapstyle.proto \
  geo/earth/proto/geometry.proto \
  geo/earth/proto/error_response.proto \
  geo/earth/proto/earth_mate/*.proto \
  geo/photo/proto/metadataservice.proto \
  geo/earth/proto/photos.proto
```

这将为 JSPB 生成带有 `.toJson()` 和 `.fromJson()` 的类型化 TypeScript 类。

#### 阶段 2：HTTP 获取层

```typescript
class EarthDataClient {
  async bootstrap(): Promise<BootstrapClientConfig> { ... }
  async performSearch(query: string, viewport: LatLonBox): Promise<RenderableEntity[]> { ... }
  async openKnowledgeCard(mid: string): Promise<RenderableEntity> { ... }
  async createFeature(docKey: number, props: FeatureProperties): Promise<Feature> { ... }
  async editFeature(docKey: number, featureId: string, props: FeatureProperties): Promise<Feature> { ... }
  async deleteFeature(docKey: number, featureId: string): Promise<void> { ... }
  async openProject(projectId: string): Promise<Document> { ... }
  async earthMateQuery(query: string, context: EarthMateAppContext): Promise<EarthMateQueryResponse> { ... }
}
```

#### 阶段 3：开放格式转换器

```typescript
// 将 proto 消息转换为开放标准的转换器
converters/
  renderable-entity-to-schema-org.ts
  geometry-to-geojson.ts
  camera-to-ecef.ts
  feature-to-geojson.ts
  kml-to-feature.ts
  document-to-geojson-collection.ts
```

#### 阶段 4：数据验证

```typescript
// 运行时验证，确保 API 响应与 proto 模式匹配
// 使用 protobuf-ts 内置的消息验证
import { FlyToCamera } from './generated/commands';

function validateResponse(data: unknown): FlyToCamera {
  return FlyToCamera.fromJson(data);
}
```

#### 阶段 5：模拟数据生成

```typescript
// 生成有效的 proto 消息，无需 Google 服务器即可进行测试
import { RenderableEntityBuilder } from './generated-renderable-entity';
// 使用 protobuf-ts 的消息构造函数
```

---

### 10. 关键 Proto 包依赖

```
包                         | 主要消息/枚举
---------------------------|------------------------------------------
geo.earth.proto            | Command、Commands、FlyToCamera、LatLngAlt、
                           | ToggleLayer、CreateFeature、EnterStreetView、
                           | OpenEarthMateChat、ViewOnDemandAnalysis、
                           | BootstrapClientConfig
earth_knowledge            | RenderableEntity、Image、Fact、OpenHours、Entity
earth.document             | DocumentNamespace、MapType
earth.document.protos      | Document、Feature、FeatureProperties、Placemark、
                           | Geometry、Point、Polyline、Polygon、
                           | LookAtCamera、ErrorResponse
earth.layers               | MapStyle（Imagery、Projection、ThreeDFeatures）
earth                      | Camera、Location、Rotation、LatLng、Size
geo.earth.proto.earth_mate | EarthMateRequestWrapper、EarthMateQueryRequest、
                           | EarthMateQueryResponse、EarthMateChatContext、
                           | EarthMateErrorDetail、FileAttachment
geo_photo_service           | MetadataService（gRPC）、PhotoMetadata、
                           | AreaConnectivityResponse、SingleImageSearchResponse
earth_photos               | ThumbnailPhotos、ThumbnailImage、KmlBalloon
```

---

### 11. 总结

Earth Web 客户端的协议**本质上是基于 proto2 的命令批处理，使用 JSPB JSON 传输**，照片元数据有一个 gRPC 例外。

- **34 种命令类型**定义了每个用户操作——从搜索到 AI 聊天再到地形分析
- **JSPB 解析极其简单**：它就是带有 camelCase 字段名和字符串枚举的 JSON
- **RenderableEntity** 是全面的"知识卡片"格式——标题、事实、照片、营业时间、坐标、相机、边界框、相关实体
- **要素 CRUD** 遵循扁平化的 Document → Feature → Placemark/Geometry 层次结构
- **Earth Mate AI** 发送上下文（视口、文档、相机）并接收可执行命令——不仅仅是文本
- **照片/街景**是唯一的 gRPC 服务，同时提供二进制和 JSPB 格式选项
- **错误处理**有 9 种错误类型，外加数据导入、Earth Mate 和数据图层的详细子错误

这为我们提供了一个**纯数据层**，它：
- 通过 JSPB JSON 与真实的 Google Earth 服务器协同工作
- 输出平台无关的开放格式（GeoJSON、Schema.org、ECEF、WKT）
- 可被任何渲染器或工具使用
- 通过模拟 proto 生成可在无网络访问的情况下进行测试
