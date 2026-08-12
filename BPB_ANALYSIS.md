# Maps VT bpb 参数 — 语义解码

> 来源: `https://www.google.com/maps/vt/proto?bpb=...&token=95292`
> 总大小: 116 bytes, 解码状态: 116/116 ✓

---

## 顶层字段

| 字段 | 含义 | 类型 | 大小 |
|---|---|---|---|
| `tile_coords` | 瓦片坐标 | message | 11B |
| `map_state` | 地图视口和样式状态 | message | 21B |
| `client_context` | 客户端语言/地区/样式配置 | message | 42B |
| `pixel_ratio` | 设备像素比/DPI缩放 | varint | 1 |
| `feature_flags` | 渲染功能开关标记 | message | 25B |
| `trailer` | 尾部数据 | message | 4B |

---

## tile_coords (瓦片坐标, 11B)

```
tile_coords {
    x         = 2       ← 瓦片列号 (column)
    y         = 3       ← 瓦片行号 (row)  
    zoom      = 2       ← 缩放级别
    extra_flag = (空)    ← 附加标记位 (field 25, 0 bytes)
}
```

说明: x=2, y=3, zoom=2 → 这是 Maps 四叉树的第3列、第4行、第2级瓦片。

---

## map_state (地图状态, 21B)

```
map_state {
    viewport_zoom  = 0           ← 当前视口缩放级别
    map_style_key  = "m"         ← 地图样式键值 ("m" = 默认地图)
    request_token  = 790999999   ← 请求令牌/会话ID (0x2F25B3BF)
    active_layer {
        layer_id   = "ndl"       ← 图层标识 ("ndl" = Normal Daylight 标准日间)
        version    = "1"         ← 图层版本号
    }
}
```

说明:
- `viewport_zoom=0` 而 `tile_coords.zoom=2` — 视口比瓦片更远，说明客户端在预加载
- `map_style_key="m"` — 这是 Google Maps 内部的样式键值
- `request_token=790999999` — 用于服务端追踪和缓存的请求ID
- `layer_id="ndl"` — Normal Daylight Layer, 标准日间地图图层

---

## client_context (客户端上下文, 42B)

```
client_context {
    language        = "en-US"           ← 界面语言 (对应 $[hl])
    country         = "US"              ← 用户所在国家 (IP/账号)
    app_platform    = 3                 ← 应用平台标识 (3 = Google Earth Web)
    map_style_config {
        style_id    = 68                ← 样式ID
        style_name {
            prefix  = "set"             ← 操作: "set" = 设置样式
            name    = "RoadmapSatellite"← 样式: 卫星+道路混合
        }
    }
}
```

说明:
- `app_platform=3` — 3 代表 Earth Web (不是 Android Maps=1, iOS Maps=2)
- `style_name="RoadmapSatellite"` — 对应 config 中 38 种图例里的 RoadmapSatellite 样式
- `prefix="set"` — 表示这是样式设置操作而非查询

---

## pixel_ratio (像素比)

```
pixel_ratio = 1    ← 设备像素比 (1x = 标准DPI)
```

---

## feature_flags (功能开关, 25B)

```
feature_flags {
    use_webgl_rendering          = 1    ← f5:  启用 WebGL 渲染
    disable_3d_buildings         = 0    ← f11: 不显示3D建筑 (0=显示)
    enable_traffic_layer         = 1    ← f39: 启用实时交通
    enable_transit_layer         = 1    ← f43: 启用公交图层
    indoor_map_enabled           = 4    ← f44: 室内地图模式 (4=完整)
    enable_bicycling_layer       = 1    ← f45: 启用自行车图层
    enable_satellite_hybrid      = 1    ← f55: 卫星混合模式
    enable_terrain_view          = 1    ← f58: 启用地形视图
    high_dpi_tiles               = 1    ← f91: 请求高DPI瓦片
}
```

说明: 共9个布尔/枚举标记，控制客户端渲染行为和各图层开关。

---

## trailer (尾部, 4B)

```
trailer = (4字节, 空消息)    ← 可能用于未来扩展或对齐
```

---

## 完整语义结构

```
地图矢量瓦片请求 TileRequest (116 bytes)
│
├── tile_coords                        ← 请求哪块瓦片
│   ├── x = 2
│   ├── y = 3
│   └── zoom = 2
│
├── map_state                          ← 地图当前状态
│   ├── viewport_zoom = 0
│   ├── map_style_key = "m"
│   ├── request_token = 790999999
│   └── active_layer = "ndl" v1
│
├── client_context                     ← 客户端环境
│   ├── language = "en-US"
│   ├── country = "US"
│   ├── app_platform = 3 (Earth Web)
│   └── map_style_config
│       └── set RoadmapSatellite (id=68)
│
├── pixel_ratio = 1                    ← 设备DPI
│
├── feature_flags                      ← 功能开关
│   ├── use_webgl_rendering = 1
│   ├── disable_3d_buildings = 0
│   ├── enable_traffic_layer = 1
│   ├── enable_transit_layer = 1
│   ├── indoor_map_enabled = 4
│   ├── enable_bicycling_layer = 1
│   ├── enable_satellite_hybrid = 1
│   ├── enable_terrain_view = 1
│   └── high_dpi_tiles = 1
│
└── trailer (4 bytes, reserved)
```
