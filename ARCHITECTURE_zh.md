# Google Earth Web 重实现 — 架构设计

> **最后更新：** 2026-08-12  
> **技术栈：** TypeScript + Three.js + Next.js  
> **协议权威来源：** Google Earth 内部仓库 1,316 个 `.proto` 文件

---

## 1. 本项目是什么（以及不是什么）

### 我们要构建的是：一个基于浏览器的 Google Earth 客户端

一个单页 Web 应用，能够渲染 3D 地球，支持搜索、知识卡片、要素创建/编辑、街景、时光机、地图图层切换 — 全部使用与 `https://earth.google.com/web/` 完全相同的**线上通信协议**。

### 我们**不**构建：

- ❌ 瓦片服务器 — 我们向 Google 现有的瓦片基础设施请求瓦片
- ❌ 搜索后端 — 我们序列化 `PerformSearch` 命令，以与 earth.google.com 相同的方式发送
- ❌ 知识图谱 — 我们接收 `RenderableEntity` 消息，与真实客户端一样
- ❌ 路由引擎 — proto 文件只定义了路线结果的**数据格式**，而非算法
- ❌ Google 云存储的替代品 — 我们对接其现有的文档/要素 API
- ❌ CesiumJS 应用 — 渲染引擎是 **Three.js**，已明确指定

### 我们实际构建的：

- ✅ **Three.js 渲染引擎**（地球、相机、图层、要素、3D 模型）
- ✅ **Proto 适配层** — 编译后的 proto → 带 JSON 序列化的 TypeScript 类
- ✅ **HTTP 客户端层** — 使用精确的 proto 消息类型进行序列化/反序列化
- ✅ **兼容模拟服务器** — 当 Google 端点不可达时的替代方案

---

## 2. Google Earth Web 实际如何运行

### 2.1 真实协议栈

Google Earth Web 客户端（`earth.google.com/web/`）**并不**使用单一的统一 API。它通过多种协议与不同的后端服务通信：

```
┌─────────────────────────────────────────────────────────────┐
│                  浏览器 (earth.google.com/web/)              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  C++ 渲染引擎 (编译为 WebAssembly)                     │   │
│  │  - 地球曲面细分和 LOD                                 │   │
│  │  - 瓦片解码和纹理映射                                 │   │
│  │  - 3D 建筑拉伸                                        │   │
│  │  - 地形网格生成                                       │   │
│  │  - 相机控制和动画                                     │   │
│  │  - 图层合成                                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  JavaScript 应用壳                                    │   │
│  │  - UI（搜索栏、知识卡片、侧面板）                     │   │
│  │  - 状态管理                                           │   │
│  │  - 命令分发                                           │   │
│  │  - 分析/日志                                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
         ════════════════════╪════════════════════
                             │
    ┌────────────────────────┼────────────────────────────┐
    │                        │                             │
    ▼                        ▼                             ▼
┌────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│  HTTP/JSON │     │  HTTP/Protobuf    │     │  gRPC (HTTP/2)       │
│  (JSPB)    │     │  (binary)         │     │                      │
└────────────┘     └──────────────────┘     └──────────────────────┘
    │                        │                        │
    ▼                        ▼                        ▼
┌────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│ 搜索        │     │ 地图瓦片          │     │ 照片元数据            │
│ 知识卡片     │     │ 服务器            │     │ 街景                  │
│ 要素        │     │ (影像、地形、     │     │ (MetadataService    │
│ 用户状态     │     │  矢量)           │     │  gRPC 服务)          │
└────────────┘     └──────────────────┘     └──────────────────────┘
```

### 2.2 JSPB：关键的序列化格式

JSPB 代表 **Java Server Protobufs** —— 本质上是将 protobuf 消息序列化为 JSON。Google 内部的 Java 服务器将 protobuf 序列化为 JSON 供 Web 客户端消费。线上格式是 JSON，字段名采用与 proto 字段名匹配的 camelCase 格式。

**来自源 proto 的证据：**

`metadataservice.proto` 第 100-105 行：
```protobuf
optional ProtoFormat http_response_format = 3 [default = JSPB];
enum ProtoFormat {
    UNKNOWN_FORMAT = 0;
    BINARY = 1;
    JSPB = 2;
}
```

**默认响应格式是 JSPB** —— 这意味着服务器原生使用 JSON 编码的 protobuf 通信。这是我们必须支持的主要格式。

### 2.3 仅有 2 个 gRPC 服务

在所有 1,316 个 proto 文件中，只有**两个**定义了 gRPC `service` 块：

| 服务 | 文件 | 用途 |
|---------|------|---------|
| `MetadataService` | `geo/photo/proto/metadataservice.proto` | 照片元数据、街景连通性、单图搜索 |
| `Operations` | `google/longrunning/operations.proto`（外部） | 长时间运行的异步任务管理 |

**其他所有内容都是纯消息定义。** 这些消息被序列化为 JSPB JSON 并通过 HTTP POST 端点发送。

### 2.4 基于命令的架构

客户端不直接调用"API 端点"，而是分发 `Command` 消息：

```protobuf
message Commands {
    repeated Command commands = 1;
}

message Command {
    oneof command_type {
        PerformSearch perform_search = 5;
        OpenKnowledgeCard open_knowledge_card = 7;
        FlyToCamera fly_to_camera = 8;
        CreateFeature create_feature = 17;
        DeleteFeature delete_feature = 19;
        ToggleLayer toggle_layer = 16;
        SetBasemapStyle set_basemap_style = 23;
        EnterStreetView enter_street_view = 15;
        // ... 共 34 种命令类型
    }
}
```

每个命令携带精确的参数。服务器解释命令并返回相应的响应类型（也是 proto 消息）。

---

## 3. Proto 文件清单：每个类别的定义

### 核心客户端协议 (`geo/earth/proto/`)

| Proto 文件 | 定义内容 | 在我们客户端中的角色 |
|-----------|---------|-------------------|
| `commands.proto` | 34 种用户操作类型 | **分发系统** — 序列化用户意图发送到服务器 |
| `geometry.proto` | `Camera`, `Location`, `LatLng`, `Rotation`, `Size` | **相机状态** — 基础空间类型 |
| `renderable-entity.proto` | `RenderableEntity`（知识卡片，含图片、事实、营业时间等） | **搜索结果** — 显示来自知识图谱的实体信息 |
| `mapstyle.proto` | `MapStyle`（投影、影像、3D 要素、图层） | **地图配置** — 控制底图外观 |
| `map_type.proto` | `MapType` 枚举（EARTH, MYMAPS） | **文档类型** — 区分项目类型 |
| `error_response.proto` | `ErrorResponse` 含错误 ID | **错误处理** — 解析服务器错误 |
| `photos.proto` | `ThumbnailPhotos`, `ThumbnailImage` | **照片图层** — 显示缩略图聚类 |
| `documentnamespace.proto` | `DocumentNamespace` 枚举 | **项目范围** — EARTH vs MYMAPS |
| `storage_restrictions.proto` | 存储/导出限制标志 | **权限** — 遵守服务器访问控制 |
| `bootstrap_client_config.proto` | 客户端启动配置 | **初始化** — 启动参数 |
| `compile_time_config.proto` | 编译时功能标志 | **功能开关** — 确定可用功能 |
| `processing_instruction.proto` | 服务器处理提示 | **请求元数据** — 告知服务器如何处理 |
| `user_industry.proto` | 用户行业分类 | **个性化** — 用户资料数据 |
| `data_layer_error_detail.proto` | 数据层特定错误 | **错误处理** — 图层错误详情 |

### 要素 CRUD 协议 (`geo/earth/proto/contentcreation/`)

| Proto 文件 | 定义内容 | 在我们客户端中的角色 |
|-----------|---------|-------------------|
| `content_editing_model.proto` | `Feature`, `Placemark`, `Document`, `Geometry`, `PointStyle`, `PolylineStyle`, `PolygonStyle`, `BalloonStyle`, `LabelStyle`, `Color`, `Attribute`, `Column`, `Media`, `GroundOverlay`, `NetworkLink`, `EarthDataLayer`, `Model`, `Track` 等（113 条消息） | **要素数据模型** — 创建/编辑/存储地理要素的所有数据结构 |
| `content_editing_mutations.proto` | `DataMutationSet`, `AddFeature`, `DeleteFeature`, `SetStyle`, `UpdateFeatureProperties` 等 | **变更操作** — 如何批量和应用更改 |
| `content_editing_requests.proto` | `CreateMapRequest/Response`, `MutateDocumentRequest/Response`, `ReadDocumentRequest/Response`, `RequestOptions` | **文档 API** — 创建/变更/读取云端项目 |
| `content_editing_kml_extensions.proto` | KML 特定扩展 | **KML 导入/导出** — 解析旧版 KML 数据 |
| `data_import_errors.proto` | 导入错误类型 | **错误处理** — 导入验证错误 |

### 照片/街景协议 (`geo/photo/proto/`)

| Proto 文件 | 定义内容 | 在我们客户端中的角色 |
|-----------|---------|-------------------|
| `metadataservice.proto` | **gRPC 服务**：`MetadataService` 含 4 个 RPC | **街景** — 我们构建的唯一 gRPC 客户端 |
| `location.proto` | `LatLng`, `LatLngRect` | **照片地理位置** |
| `image_key.proto` | `ImageKey`（照片标识） | **照片查找** |
| `render_info.proto` | 照片渲染参数 | **照片显示** |
| `navigation.proto` | `NavigationChannel`, `Target`（全景导航链接） | **街景导航** |
| `thumbnail_info.proto` | 缩略图元数据 | **照片缩略图** |
| `attribution.proto` | 照片归属数据 | **版权显示** |
| `description.proto` | 照片描述 | **照片信息** |
| `publication_info.proto` | 发布元数据 | **照片来源** |
| `photo_annotation.proto` | 含位置的照片标注 | **标注照片** |
| `pano_semantic_map.proto` | 全景语义分割 | **街景语义标签** |
| `view_parameters.proto` | 照片的视图/相机参数 | **照片视角** |
| `street_view_attributes.proto` | 街景特定元数据 | **SV 信息显示** |
| `statistics.proto` | 照片浏览/贡献统计 | **照片统计** |
| `ocr_info.proto` | 照片中检测到的 OCR 文本 | **照片文字** |
| `photo_label.proto` | 照片标签/分类 | **照片分类** |
| `photo_query_options.proto` | 查询参数 | **照片搜索选项** |
| `photo_by_lat_lng_query.proto` | 基于位置的照片搜索 | **地理照片搜索** |
| `photo_by_feature_query.proto` | 基于要素的照片搜索 | **要素关联照片** |
| `single_image_search.proto` | 单图搜索 | **图片检索** |
| `similarity_options.proto` | 相似照片搜索 | **视觉相似度** |
| `feature_set.proto` | 照片的要素上下文 | **关联要素** |
| `offering_contribution.proto` | 用户贡献数据 | **照片上传** |
| `client_capabilities.proto` | 客户端能力声明 | **服务器协商** |
| `request_context.proto` | 请求元数据 | **请求上下文** |
| `localization_context.proto` | 本地化数据 | **国际化** |
| `date_time.proto` | 日期/时间类型 | **照片日期** |
| `experimental.proto` | 实验性功能 | **选择性功能** |
| `takedown.proto` | 内容下架信息 | **审核** |
| `thumbnail_options.proto` | 缩略图请求选项 | **缩略图参数** |
| `internal_feature_description.proto` | 内部要素引用 | **仅服务器使用** |
| `image_attribute.proto` | 图片属性 | **图片属性** |

### Geostore — 服务器端要素数据库 (`geostore/base/proto/`)

这 156 个 proto 文件定义了 Google 内部的地理要素数据库模式。它们**不**属于客户端-服务器协议的一部分，但记录了所有要素的底层数据模型：

| 类别 | 示例 | 相关性 |
|----------|---------|---------|
| 核心类型 | `feature.proto`, `featureid.proto`, `attribute.proto` | 理解要素图谱 |
| 地址 | `address.proto`, `addresscomponent.proto`, `addresslines.proto` | 地址解析 |
| 建筑 | `building.proto`, `entrance.proto`, `elevation.proto` | 3D 建筑数据 |
| 商业 | `establishment.proto`, `businesshours.proto`, `business_chain.proto` | POI 数据 |
| 交通 | `accesspoint.proto`, `transit_entrance_attachment.proto` | 公共交通数据 |
| 电动车充电 | `ev_charger.proto`, `ev_station.proto`, `emobility_ids.proto` | 充电站 |
| 路线 | `border.proto`, `curvature.proto`, `curve_connection.proto` | 道路几何 |
| 显示 | `display_data.proto`, `doodle.proto` | 视觉数据 |
| 高程 | `elevationmodel.proto` | 地形数据 |
| 城市数据 | `cityjson.proto`, `cityobject_attributes.proto` | 3D 城市模型 |

### 地图 — 瓦片和路由数据 (`maps/`)

定义地图瓦片模式、路线请求/响应格式、交通数据和公共交通路线的 Proto 文件。这些是用于地图瓦片请求和路线计算的数据结构。

### 日志/分析 (`logs/`)

定义分析事件（`EarthEvent`、`EarthLogProto`）、用户设置、实验标志和启动指标的 Proto 文件 — 用于客户端遥测。

### Google 内部依赖

许多 proto 文件导入了 Google 内部包（`storage/datapol`、`net/proto2`、`java/com/google`、`privacy/pattributes`、`util/task`、`frameworks/testing`、`google/longrunning`）。这些导入必须：

1. 编译为 TypeScript 客户端时**剥离**（它们是服务器端注解）
2. 对少数定义实际消息类型的提供**存根**（`google/longrunning/operations.proto`）

---

## 4. 我们的实现架构

### 4.1 分层图

```
┌──────────────────────────────────────────────────────────────────┐
│                    Next.js 应用壳                                  │
│  页面、路由、状态管理、UI 组件                                    │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────┴─────────────────────────────────────┐
│                   Three.js 渲染引擎                                │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ 地球         │  │ 相机         │  │ 图层系统                │  │
│  │ - 球体几何   │  │ - LookAt     │  │ - 底图瓦片              │  │
│  │ - 纹理映射   │  │ - LookFrom   │  │ - 3D 建筑               │  │
│  │ - LOD 级别   │  │ - 动画       │  │ - 地形                  │  │
│  │              │  │   (飞行、    │  │ - 动态云层              │  │
│  │              │  │    环绕、    │  │ - 网格线                │  │
│  │              │  │    瞬移)     │  │ - 照片叠加              │  │
│  └──────────────┘  └──────────────┘  │ - 固定项目              │  │
│                                      │ - 时光机叠加            │  │
│  ┌──────────────┐  ┌──────────────┐  │ - 数据图层              │  │
│  │ 要素         │  │ 街景         │  └────────────────────────┘  │
│  │ - 地标       │  │ - 全景球     │                              │
│  │ - 折线       │  │ - 导航箭头   │  ┌────────────────────────┐  │
│  │ - 多边形     │  │ - 过渡动画   │  │ 知识卡片                │  │
│  │ - 3D 模型    │  │              │  │ - 信息面板              │  │
│  │ - 地面叠加   │  │              │  │ - 图片轮播              │  │
│  └──────────────┘  └──────────────┘  │ - 实体缩略图            │  │
│                                      └────────────────────────┘  │
│                                                                    │
│  所有几何类型（Camera, LatLng, Location, Rotation 等）            │
│  均由 proto 定义的数据结构驱动。                                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────┴─────────────────────────────────────┐
│                     Proto 适配层                                   │
│                                                                    │
│  编译后的 protobuf-ts 带 JSON 序列化：                            │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  来自 `commands.proto`：                                     │ │
│  │  Commands, Command, PerformSearch, FlyToCamera,              │ │
│  │  ToggleLayer, CreateFeature, DeleteFeature, ...              │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  来自 `geometry.proto`：                                     │ │
│  │  Camera, Location, LatLng, Rotation, Size                    │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  来自 `renderable-entity.proto`：                            │ │
│  │  RenderableEntity, Fact, Image, CardSet, Entity, ...         │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  来自 `mapstyle.proto`：                                     │ │
│  │  MapStyle, BaseLayers, Projection, Imagery, ...              │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  来自 `content_editing_model.proto`：                        │ │
│  │  Feature, Placemark, Document, Geometry, PointStyle,         │ │
│  │  PolylineStyle, PolygonStyle, BalloonStyle, LabelStyle,      │ │
│  │  Color, Media, GroundOverlay, Model, Track, ...              │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  来自 `content_editing_mutations.proto`：                    │ │
│  │  DataMutationSet, DataMutation, AddFeature, DeleteFeature,   │ │
│  │  SetStyle, UpdateFeatureProperties, ...                      │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  来自 `content_editing_requests.proto`：                     │ │
│  │  CreateMapRequest/Response, MutateDocumentRequest/Response,  │ │
│  │  ReadDocumentRequest/Response, RequestOptions                │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  来自 `error_response.proto`：                               │ │
│  │  ErrorResponse                                              │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  来自照片 proto：                                            │ │
│  │  ThumbnailPhotos, ThumbnailImage, PhotoMetadata, ...         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  辅助方法（由 protobuf-ts 自动生成）：                            │
│  • PerformSearch.toJson() → {"query": "...", "viewport": {...}}  │
│  • RenderableEntity.fromJson(json) → 带类型的 TypeScript 对象    │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────┴─────────────────────────────────────┐
│                      HTTP 客户端层                                 │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  CommandDispatcher（命令分发器）                              │ │
│  │  • 接收 Command 对象                                         │ │
│  │  • 使用 toJson() 序列化为 JSPB JSON                           │ │
│  │  • POST 到相应端点                                           │ │
│  │  • 使用 fromJson() 反序列化响应                               │ │
│  │  • 返回带类型的响应对象                                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  TileClient（瓦片客户端）                                     │ │
│  │  • 从 MapStyle + 相机视口构建瓦片 URL                         │ │
│  │  • 获取影像/地形/矢量瓦片                                     │ │
│  │  • 解码瓦片数据（JPEG, PNG, protobuf 矢量）                  │ │
│  │  • 返回纹理/几何体供渲染引擎使用                               │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  gRPC 客户端（仅街景）                                        │ │
│  │  • MetadataService 客户端（通过 @protobuf-ts/grpcweb-transport）│ │
│  │  • GetMetadata, GetConnectivity, SingleImageSearch           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  FeatureClient（要素客户端）                                  │ │
│  │  • CreateMap, MutateDocument, ReadDocument                   │ │
│  │  • 使用 content_editing_requests 类型                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬─────────────────────────────────────┘
                             │
         ════════════════════╪════════════════════
                             │
    ┌────────────────────────┼────────────────────────────┐
    │                        │                             │
    ▼                        ▼                             ▼
┌────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│ Google     │     │ Google           │     │ Google 照片           │
│ Earth API  │     │ 瓦片服务器        │     │ 服务器               │
│ (JSPB/JSON)│     │ (HTTP/HTTPS)     │     │ (gRPC)               │
└────────────┘     └──────────────────┘     └──────────────────────┘
    │                        │                        │
    │  不可达时               │  不可达时               │  不可达时
    ▼                        ▼                        ▼
┌────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│ 兼容模拟   │     │ 兼容瓦片代理      │     │ 兼容照片模拟          │
│ API 服务器  │     │ 服务器            │     │ 服务器               │
└────────────┘     └──────────────────┘     └──────────────────────┘
```

### 4.2 数据流：用户搜索

```
1. 用户在搜索栏输入"埃菲尔铁塔"
2. 搜索组件创建：
   PerformSearch {
     query: "埃菲尔铁塔",
     viewport: { north: ..., south: ..., east: ..., west: ... }
   }
3. 包装为 Command { perform_search: performSearch }
4. 包装为 Commands { commands: [command] }
5. CommandDispatcher.toJson(commands) → JSON 字符串
6. POST 到 Google 搜索端点
7. 响应以 JSON 形式到达
8. RenderableEntity.fromJson(response) → 带类型的对象：
   {
     title: "埃菲尔铁塔",
     description: ["锻铁格构塔..."],
     image: { url: "https://...", width: 800, height: 600 },
     latLon: { lat: 48.8584, lon: 2.2945 },
     camera: { location: {...}, rotation: {...}, fieldOfViewY: 45 },
     facts: [...],
     openHours: {...},
     website: {...},
     ...
   }
9. Three.js 相机飞到 entity.camera 坐标
10. 知识卡片面板渲染 entity.title、entity.description、entity.image
```

### 4.3 数据流：创建要素

```
1. 用户点击地球上的"添加地标"（在 lat/lng 位置）
2. 要素编辑器创建：
   Feature {
     placemark: Placemark {
       point: Point { coordinates: [LatLng { lat: x, lng: y }] },
       ...
     },
     featureProperties: FeatureProperties { name: "我的地点", ... },
     featureStyle: FeatureStyle { pointStyle: PointStyle { ... } }
   }
3. 包装为 AddFeature { feature: feature, parentFeatureId: "..." }
4. 包装为 DataMutation { addFeature: addFeature }
5. 包装为 DataMutationSet { dataMutation: [mutation] }
6. 包装为 MutateDocumentRequest { ... }
7. POST 到 Google 文档 API
8. 响应包含更新后的文档状态
9. Three.js 在地球上渲染新地标
```

### 4.4 数据流：地图瓦片加载

```
1. 相机状态变化（用户平移/缩放）
2. 捕获当前 Camera { location, rotation, fieldOfViewY }
3. 读取活动 MapStyle { projection: GLOBE, imagery: SATELLITE, ... }
4. TileClient 计算可见瓦片坐标：
   - 从相机高度 / fieldOfViewY 计算缩放级别
   - 从经纬度边界计算瓦片 (x, y)
5. 构建瓦片 URL：
   https://khms.googleapis.com/...?...
6. 获取瓦片 JPEG/PNG 数据
7. 解码图片 → WebGL 纹理
8. 将纹理映射到地球网格面的正确 UV 坐标
9. 对于矢量瓦片：解码 protobuf → Three.js 几何体（建筑、道路）
```

---

## 5. 开发阶段（已更正）

### 阶段 0：Proto 编译基础设施

**目标：** 所有 1,316 个 proto 文件编译为带 JSON 序列化支持的 TypeScript。

**工作：**
- 剥离 Google 内部依赖（`storage/datapol`、`net/proto2/bridge`、`java/com/google`、`privacy/pattributes`、`frameworks/testing`）
- 为所需的外部类型提供存根 `.proto` 文件（`google/longrunning/operations.proto`、`google/protobuf/timestamp.proto`、`google/type/datetime.proto`）
- 配置 `@protobuf-ts/plugin` 输出 TypeScript 并支持 JSON 序列化
- 生成的 TypeScript 应支持：`Message.toJson()`、`Message.fromJson(json)`、`Message.toBinary()`、`Message.fromBinary(bytes)`
- 验证：所有 proto 消息编译无错误

**关键决策：** protobuf-ts（而非 protobuf.js）— 更好的 TypeScript 集成、可摇树优化、JSON 序列化内置、积极维护。

**输出：** `src/generated/` 目录，包含所有编译后的 TypeScript 类型。

### 阶段 1：Three.js 地球 + 相机

**目标：** 可见的 3D 地球，带相机控制，由 proto `Camera` 和 `MapStyle` 类型驱动。

**工作：**
- 初始化带纹理球体的 Three.js 场景
- 实现接受 `earth.Camera` proto 对象的相机：
  ```
  Camera { location: Location { lat, lng, altitude },
           rotation: Rotation { heading, tilt, roll },
           fieldOfViewY: 45,
           screenSize: Size { width, height } }
  ```
- 来自 `MapStyle.Projection` 的地球投影模式（GLOBE vs MERCATOR）
- 相机动画：瞬移、飞行、环绕（匹配 `FlyToCamera.CameraAnimation` 枚举）
- 基础光照和大气效果

**消费的 Proto 类型：**
- `earth.Camera`、`earth.Location`、`earth.LatLng`、`earth.Rotation`、`earth.Size`（geometry.proto）
- `earth.layers.MapStyle`（mapstyle.proto）

### 阶段 2：命令分发系统

**目标：** 所有 34 种命令类型可构建、序列化、分发，响应可反序列化。

**工作：**
- 实现 `CommandDispatcher` 类
- 每种命令类型的处理器：
  - `PerformSearch` → 搜索端点
  - `OpenKnowledgeCard` → 知识卡片端点
  - `FlyToCamera` → 本地相机更新（无网络调用）
  - `ToggleLayer` → 本地图层状态（无网络调用）
  - `SetBasemapStyle` → 本地地图样式更新（触发阶段 4 瓦片刷新）
  - `CreateFeature` / `DeleteFeature` / `EditFeature` → 文档 API（阶段 3）
  - `EnterStreetView` → 街景（阶段 6）
  - `EnterTimelapse` / `EnterTimeMachine` → 时光机模式
  - 等
- 实现 `CommandHistory` 用于撤销/重做
- 所有消息的 JSPB JSON 序列化/反序列化

**消费的 Proto 类型：**
- `geo.earth.proto.Commands`、`Command`，全部 34 种命令类型（commands.proto）

### 阶段 3：要素 CRUD

**目标：** 用户可在地球上创建、读取、更新和删除地理要素。

**工作：**
- 使用 `content_editing_requests.proto` 类型实现 `FeatureClient`
- `CreateMap` → 创建新的云端项目
- `MutateDocument` 配合 `DataMutationSet` → 批量要素变更
- `ReadDocument` → 加载现有项目
- 实现 `FeatureStore`（文档内容的本地状态缓存）
- 要素类型的 Three.js 渲染器：
  - `Placemark`（带图标/标签的点）
  - `Polyline`（地球表面的线几何体）
  - `Polygon`（地球上的填充/拉伸区域）
  - `GroundOverlay`（贴在地形上的图片）
  - `Model`（位于特定位置的 3D 模型）
  - `Track`（动画路径）
- 样式渲染：`PointStyle`（图标、标签）、`PolylineStyle`（颜色、宽度）、`PolygonStyle`（填充、轮廓）
- `BalloonStyle` → HTML 信息窗口

**消费的 Proto 类型：**
- `content_editing_model.proto` 全部（113 条消息）
- `content_editing_mutations.proto` 全部
- `content_editing_requests.proto` 全部

### 阶段 4：地图瓦片管道

**目标：** 从 Google 瓦片服务器获取卫星影像、地形和 3D 建筑并渲染在地球上。

**工作：**
- 实现 `TileClient`：
  - 瓦片坐标数学（经纬度 → 缩放级别/x/y）
  - 根据 `MapStyle.Imagery` 枚举构建不同影像类型的瓦片 URL
  - 带缓存和请求排队的瓦片获取
- 影像瓦片：JPEG/PNG → WebGL 纹理 → 地球 UV 映射
- 地形瓦片：高度图数据 → 地球顶点位移
- 3D 建筑瓦片：矢量瓦片 protobuf → Three.js 拉伸几何体
- 图层切换匹配 `ToggleLayer.LayerType` 枚举：
  - `LAYER_TYPE_3D_BUILDINGS` → 建筑拉伸 开/关
  - `LAYER_TYPE_TIMELAPSE` → 历史影像
  - `LAYER_TYPE_PHOTOS` → 照片叠加
  - `LAYER_TYPE_GRIDLINES` → 经纬网
  - `LAYER_TYPE_ANIMATED_CLOUDS` → 云层
  - `LAYER_TYPE_PINNED_PROJECTS` → 已保存项目标记

**消费的 Proto 类型：**
- `MapStyle`（影像类型、投影、图层配置）
- `Camera`（用于瓦片计算的视口）

### 阶段 5：搜索 + 知识卡片

**目标：** 完整的搜索功能，带丰富的知识卡片显示。

**工作：**
- 实现 `SearchClient` — 发送 `PerformSearch`，接收搜索结果
- 将搜索结果解析为 `RenderableEntity` 对象
- 渲染知识卡片：
  - 标题、描述、known_for
  - 来自 `imageCarousel` 的图片轮播
  - 来自 `fact` 数组的事实
  - `openHours` 显示含每日时间段
  - `website` 链接
  - `addressLine` 显示
  - `entityThumbnailList`（相关实体）
  - `phoneNumber` 显示
  - `openLocationCode`（Plus Codes）
- "手气不错" / Voyager 集成
- 搜索历史管理

**消费的 Proto 类型：**
- `earth_knowledge.RenderableEntity` 及其所有嵌套类型
- `PerformSearch` 命令

### 阶段 6：街景（gRPC）

**目标：** 带导航的街景全景图 — 项目中唯一的真实 gRPC 客户端。

**工作：**
- 实现 `MetadataService` 的 gRPC 客户端：
  - `GetMetadata` — 按图片密钥获取照片元数据
  - `GetConnectivity` — 获取全景导航图
  - `GetConnectivityZoomLevel` — 获取可用缩放级别
  - `SingleImageSearch` — 按位置或要素查找图片
- 全景渲染：
  - 带全景纹理的等距矩形球体
  - 连接全景之间的导航箭头
  - 平滑的球体到球体过渡
- 缩略图显示
- 照片标注叠加

**消费的 Proto 类型：**
- `metadataservice.proto` 全部请求/响应类型
- `photo.proto` 辅助类型
- 来自 @protobuf-ts 的 `grpcweb-transport`

### 阶段 7：云端项目 + 状态管理

**目标：** 完整的云端文档生命周期 — 创建、保存、加载、分享项目。

**工作：**
- 使用文档 proto 类型实现项目 CRUD
- `OpenCloudProject` / `CreateCloudProject` 命令处理器
- 本地状态持久化（IndexedDB）
- 通过资源密钥分享项目
- `DocumentNamespace.EARTH` vs `MYMAPS` 处理
- 使用 `content_editing_kml_extensions.proto` 进行 KML 导入/导出
- `OpenKmlDocument` / `OpenKmlDocumentFromContent` 处理器
- Earth Mate 聊天集成（`OpenEarthMateChat`）

**消费的 Proto 类型：**
- `documentnamespace.proto`
- `content_editing_kml_extensions.proto`
- 文档相关命令类型

---

## 6. 兼容模拟服务器

当 Google 服务器不可达时（离线开发、测试，或用户选择使用），我们提供使用相同 proto 定义契约的兼容服务器实现：

| 模拟服务器 | 替代 | 实现内容 |
|------------|----------|-----------|
| 模拟搜索 API | Google 搜索后端 | 接受 `PerformSearch`，从本地数据集返回 `RenderableEntity` 对象 |
| 模拟瓦片服务器 | Google 瓦片服务器 | 以正确的 URL 提供预缓存或程序生成的瓦片 |
| 模拟文档 API | Google 云存储 | 使用本地文件存储实现 `CreateMap`、`MutateDocument`、`ReadDocument` |
| 模拟照片服务器 | Google 照片服务 | 使用本地照片数据集实现 `MetadataService` gRPC |

这些模拟服务器使用**完全相同的 proto 消息类型** — 意味着客户端代码无需更改。只有 HTTP 端点 URL 发生变化。

---

## 7. 关键技术决策

| 决策 | 理由 |
|----------|----------|
| **protobuf-ts**（而非 protobuf.js） | 一流的 TypeScript 支持、可摇树优化、内置 JSON 序列化、积极维护 |
| **Three.js**（而非 CesiumJS） | 项目需求明确指定；更轻量；完全控制渲染管线 |
| **JSPB JSON** 作为主要线上格式 | 匹配 Google 服务器实际返回的内容；proto 中的 `ProtoFormat` 默认值就是 `JSPB` |
| **Commands 作为分发原语** | 匹配 Google Earth 的实际架构；所有用户操作都是 `Command` 消息 |
| **Proto 类型驱动渲染** | Camera、MapStyle、Feature 几何体 — 所有渲染状态都是 proto 类型化的；无自定义类型 |
| **gRPC 仅用于照片** | 仅存在 2 个服务定义；对 HTTP JSPB 端点使用完整 gRPC 栈是过度设计 |
| **兼容模拟服务器，而非生产服务器** | 我们构建的是客户端；需要 Google 后端但不可用时，我们模拟它 |

---

## 8. 项目结构

```
earthstudiowasm/
├── ARCHITECTURE.md              ← 本文件（英文）
├── ARCHITECTURE_zh.md           ← 中文翻译
├── proto/                       ← 原始 .proto 文件（只读参考）
│   ├── geo/earth/proto/
│   ├── geo/photo/proto/
│   ├── geostore/base/proto/
│   └── ...
├── src/
│   ├── generated/               ← 从 proto 编译的 TypeScript（自动生成）
│   │   ├── commands.ts
│   │   ├── geometry.ts
│   │   ├── renderable-entity.ts
│   │   ├── mapstyle.ts
│   │   ├── content-editing-model.ts
│   │   ├── content-editing-mutations.ts
│   │   ├── content-editing-requests.ts
│   │   ├── metadataservice.ts
│   │   ├── metadataservice.client.ts   ← MetadataService 的 gRPC 客户端
│   │   └── ...
│   ├── engine/                  ← Three.js 渲染引擎
│   │   ├── Globe.ts             ← 球体几何、纹理映射、LOD
│   │   ├── Camera.ts            ← Proto Camera → Three.js 相机适配器
│   │   ├── CameraAnimation.ts   ← 飞行、瞬移、环绕动画
│   │   ├── layers/
│   │   │   ├── BasemapLayer.ts
│   │   │   ├── BuildingLayer.ts
│   │   │   ├── TerrainLayer.ts
│   │   │   ├── CloudLayer.ts
│   │   │   ├── PhotoLayer.ts
│   │   │   └── FeatureLayer.ts
│   │   ├── features/
│   │   │   ├── PlacemarkRenderer.ts
│   │   │   ├── PolylineRenderer.ts
│   │   │   ├── PolygonRenderer.ts
│   │   │   ├── ModelRenderer.ts
│   │   │   └── GroundOverlayRenderer.ts
│   │   └── streetview/
│   │       ├── PanoramaRenderer.ts
│   │       └── NavigationGraph.ts
│   ├── adapter/                 ← Proto 适配层
│   │   ├── CommandSerializer.ts
│   │   ├── ResponseDeserializer.ts
│   │   └── types.ts
│   ├── client/                  ← HTTP / gRPC 客户端层
│   │   ├── CommandDispatcher.ts
│   │   ├── TileClient.ts
│   │   ├── FeatureClient.ts
│   │   ├── SearchClient.ts
│   │   ├── MetadataServiceClient.ts   ← gRPC 客户端
│   │   └── HttpClient.ts
│   ├── store/                   ← 状态管理
│   │   ├── CameraStore.ts
│   │   ├── MapStyleStore.ts
│   │   ├── FeatureStore.ts
│   │   ├── ProjectStore.ts
│   │   └── LayerStore.ts
│   ├── ui/                      ← Next.js UI 组件
│   │   ├── SearchBar.tsx
│   │   ├── KnowledgeCard.tsx
│   │   ├── LayerPanel.tsx
│   │   ├── FeatureEditor.tsx
│   │   ├── ProjectPanel.tsx
│   │   └── TimelapseControls.tsx
│   └── pages/                   ← Next.js 页面
│       └── index.tsx
├── mock/                        ← 兼容模拟服务器
│   ├── mock-search-server/
│   ├── mock-tile-server/
│   ├── mock-document-server/
│   └── mock-photo-server/
├── scripts/
│   └── compile-protos.ts        ← Proto 编译脚本
└── package.json
```

---

## 9. 总结

| 方面 | 真实情况 |
|------|---------|
| 渲染引擎 | **Three.js**（非 CesiumJS） |
| 协议 | HTTP + JSPB JSON（protobuf 消息序列化为 JSON） |
| gRPC 使用 | 仅 `MetadataService` 用于照片/街景；外加 `Operations` 服务 |
| 瓦片来源 | Google 现有瓦片服务器（我们请求瓦片，不提供服务） |
| 搜索 | 序列化 `PerformSearch` 命令 → Google 搜索后端 |
| 要素 | 序列化 `DataMutationSet` → Google 文档 API |
| 知识卡片 | 从服务器响应反序列化 `RenderableEntity` |
| Proto 文件 | 所有数据结构的唯一权威来源 — 无自定义类型 |
| 模拟服务器 | 使用相同 proto 契约的兼容替代品，用于离线/测试 |
