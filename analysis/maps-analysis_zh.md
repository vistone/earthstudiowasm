# Google Maps Protobuf 模式 — 完整分析

> **文件总数：** 344 个 `.proto` 文件，分布在 64 个子目录中
> **生成日期：** 2026-08-12
> **根目录：** `maps/`

---

## 目录

1. [目录概览](#directory-overview)
2. [API 共享层](#1-api-shared-mapsapisharedpaintproto)
3. [危机](#2-crisis-mapscrisisproto)
4. [路线规划](#3-directions-mapsdirections)
5. [动态世界](#4-dynamic-world-mapsdynamicworldproto)
6. [GMM（Google 移动地图）](#5-gmm-mapsgmm)
7. [室内](#6-indoor-mapsindoorproto)
8. [LIMO（本地库存地图入驻）](#7-limo-mapslimoproto)
9. [日志](#8-logs-mapslogs)
10. [绘制引擎](#9-paint-mapspaint)
11. [路径规划器](#10-pathfinder-mapspathfinder)
12. [路况交通](#11-road-traffic-mapsroadtrafficproto)
13. [共享层](#12-shared-mapsshared)
14. [聚光灯](#13-spotlight-mapsspotlightproto)
15. [触觉层](#14-tactile-mapstactile)
16. [公交](#15-transit-mapstransit)
17. [工具](#16-utilities-mapsutil)
18. [通用层](#17-versatile-mapsversatileproto)

---

## 目录概览

| 目录 | 文件数 | 用途 |
|-----------|-------|---------|
| `maps/tactile/` | **190** | Tactile Maps 渲染 API — 最大的子图。包含实体详情、路线规划、搜索、广告、共享类型、照片、公交、酒店、停车、电动汽车等 |
| `maps/paint/` | **75** | 地图绘制/样式/渲染引擎。涵盖客户端矢量瓦片、样式系统、要素选择、标注、元数据 |
| `maps/pathfinder/` | **31** | 路径查找引擎（基于 CRP 的可定制路线规划）。路径搜索、排序、替代路线、自动驾驶、收费、车辆能耗 |
| `maps/directions/` | **16** | 路线规划服务。客户端统计、定制化、收费、MRP（多路线规划）、瓦片渲染 |
| `maps/roadtraffic/` | **9** | 交通模型。事件元数据、交通模型类型、路径编码、出行方式 |
| `maps/shared/` | **9** | Maps 各子系统之间的共享类型。几何、mapcore API、标注、测试 |
| `maps/spotlight/` | **12** | Spotlight 功能（实体详情卡片）。广告、搜索、酒店集成、危机展示 |
| `maps/versatile/` | **10** | Versatile 地图矢量格式。矢量要素、渲染操作、样式、数据绑定值 |
| `maps/transit/` | **11** | 公共交通。选项、票价、路线信号、成本模型、公交实体描述 |
| `maps/gmm/` | **4** | Google 移动地图。网络类型枚举、推广标记广告、摄像头、绘制元数据 |
| `maps/indoor/` | **1** | 室内地图。建筑/楼层/关系/交互实体 proto |
| `maps/limo/` | **4** | 本地库存地图入驻。上下文、平台、产品类型 |
| `maps/crisis/` | **1** | 危机类别枚举（野火、地震、洪水等） |
| `maps/dynamicworld/` | **1** | 地理事件类别（体育、音乐会、会议等） |
| `maps/api/shared/paint/` | **2** | Maps API 共享绘制类型 |
| `maps/util/` | **3** | 工具类型。几何变换、瓦片坐标、瓦片位图 |
| `maps/logs/` | **1** | VE（视觉元素）日志选项 |

---

## 1. API 共享层 (`maps/api/shared/paint/proto/`)

### `maps/api/shared/paint/proto/maps-api-layer.proto`
- **包名：** `maps_api`
- **消息：** `MapsApiLayer`
- **导入：** 无
- **作用：** 为外部 API 消费者定义 Maps API 图层类型，在内部绘制图层与公开 Maps API 接口之间建立桥梁。
- **功能要点：** 公开 API 暴露层、图层抽象

### `maps/api/shared/paint/proto/maps_api_metadata.proto`
- **包名：** `maps_api`
- **消息：** `MapsApiMetadata`
- **导入：** 无
- **作用：** Maps API 响应的元数据结构，为地图瓦片消费提供归属和版权信息。
- **功能要点：** API 元数据、版权追踪

---

## 2. 危机 (`maps/crisis/proto/`)

### `maps/crisis/proto/crisis_category.proto`
- **包名：** `maps.crisis.proto`
- **枚举：** `CrisisCategory`（30+ 值：ATTACK、AVALANCHE、EARTHQUAKE、FLOOD、HURRICANE、PANDEMIC、TSUNAMI、VOLCANO、WILDFIRE 等）
- **导入：** `logs/proto/logs_annotations/logs_annotations.proto`
- **作用：** 对危机/自然灾害事件进行分类，用于危机感知的地图渲染和应急响应功能。
- **功能要点：** 危机地图、应急响应、自然灾害分类

---

## 3. 路线规划 (`maps/directions/`)

### `maps/directions/proto/directions_client_stats.proto`
- **包名：** `maps_directions`
- **消息：** `DirectionsClientStats`
- **枚举：** `DirectionsClient`（35 个值：GMM_NAVIGATION、MAPS_TACTILE、WEB_SPOTLIGHT、NAV_GO、GEMINI_MAPS_EXTENSION、ASK_MAPS 等）、`DirectionsContext`（47 个值：ACTIVE_NAVIGATION、SEARCH_ALONG_ROUTE 等）、`DirectionsClientPlatform`（WEB、ANDROID、IOS、PAINT）
- **导入：** `logs/proto/logs_annotations`、`storage/datapol/annotations`
- **作用：** 路线规划请求的统计和上下文追踪，标识请求来自哪个客户端（覆盖 35+ 客户端，从 GMM Navigation 到 Ask Maps）、哪个使用上下文（47 种上下文）以及哪个平台。
- **功能要点：** 客户端归因、分析、多平台追踪、Gemini 集成

### `maps/directions/customization/config/serving_protos/parameter_value.proto`
- **包名：** `maps_directions.customization`
- **消息：** `ParameterValue`、`ParameterValues`
- **导入：** 无
- **作用：** 路线规划定制化的键值参数存储，允许对每次请求进行路由偏好和约束的调优。
- **功能要点：** 自定义路由参数、每次请求的配置

### `maps/directions/customization/config/serving_protos/passability.proto`
- **包名：** `maps_directions.customization`
- **消息：** `PassabilityAssignment`、`UnconditionalPassabilityAssignment`、`AttributeBasedPassabilityAssignment`、`Passability`、`CutConstraints`
- **枚举：** `VehicleType`（CAR、BIKE、FOOT、SCOOTER）
- **导入：** `maps/directions/customization/config/serving_protos/parameter_value.proto`
- **作用：** 为定制化路线规划定义道路通行性约束（例如道路封闭、车辆限制），支持条件性和无条件通行规则。
- **功能要点：** 道路封闭处理、按车辆类型的通行性、自定义路由约束

### `maps/directions/mrp/proto/affordances.proto`
- **包名：** `maps.mrp`
- **消息：** `AffordanceEnums`
- **枚举：** `Class`（TRUCK、TRUCK_IMPASSABLE、TRUCK_HAZMAT、AVOID、PREFER 等）
- **作用：** 多路线规划（MRP）的功用类别，用于卡车专用路线规划，包括危险品运输、不可通行道路以及基于偏好的避让。
- **功能要点：** 卡车路线规划、危险品运输、路线功用

### `maps/directions/mrp/proto/cost_function_spec_type.proto`
- **包名：** `maps.mrp`
- **消息：** `CostFunctionSpecType`
- **作用：** 定义多路线规划中成本函数的规范类型，决定如何计算和比较路线成本。
- **功能要点：** 多路线成本优化、路线比较

### `maps/directions/mrp/proto/risk_averse_routing_status.proto`
- **包名：** `maps.mrp`
- **枚举：** `RiskAverseRoutingStatus`
- **作用：** MRP 中规避风险路由决策的状态标志，指示何时应优先选择更安全（即使较慢）的路线。
- **功能要点：** 规避风险路由、安全优先导航

### `maps/directions/mrp/server/metrics/path_metrics.proto`
- **包名：** `maps.mrp`
- **消息：** `PathMetrics`
- **导入：** `maps/directions/mrp/proto/cost_function_spec_type.proto`
- **作用：** MRP 路径计算的服务器端指标收集，衡量成本函数性能和路径质量。
- **功能要点：** MRP 指标、路径质量分析、服务器监控

### `maps/directions/tilerenderer/proto/directions_pipe_parameters.proto`
- **包名：** `maps_directions_pipe`
- **消息：** `DirectionsPipeParameters`
- **导入：** `maps/directions/proto/directions_client_stats.proto`
- **作用：** 路线规划瓦片渲染器的管道参数，配置如何为地图显示渲染路线规划瓦片。
- **功能要点：** 基于瓦片的路线渲染、渲染管道配置

### `maps/directions/tilerenderer/proto/simple_directions_request.proto`
- **包名：** `maps_directions_pipe`
- **消息：** `SimpleDirectionsRequest`
- **导入：** `maps/directions/tilerenderer/proto/directions_pipe_parameters.proto`、`maps/shared/common/geom/geom.proto`
- **作用：** 供瓦片渲染器使用的简化路线规划请求格式，包含摄像头、输出选项和管道参数。
- **功能要点：** 轻量级路线请求、对齐瓦片的渲染

### `maps/directions/tolls/proto/client_id.proto`
- **包名：** `maps_tolls`
- **消息：** `ClientId`
- **作用：** 标识收费系统的客户端/发起者，用于收费价格计算的归因。
- **功能要点：** 收费定价、客户端来源追踪

### `maps/directions/tolls/proto/pass_type.proto`
- **包名：** `maps_tolls`
- **枚举：** `PassType`（E-ZPass、SunPass、FasTrak 等）
- **作用：** 跨地区支持的收费通行证类型枚举，根据用户持有的通行证计算准确的通行费用。
- **功能要点：** 收费通行证支持、区域收费计算

### `maps/directions/tolls/proto/pricing_factors.proto`
- **包名：** `maps_tolls`
- **消息：** `PricingFactors`
- **导入：** `maps/directions/tolls/proto/pass_type.proto`、`maps/directions/tolls/proto/vehicle_attributes.proto`
- **作用：** 汇总车辆属性、收费通行证和支付方式，用于计算沿路线的个性化通行费用。
- **功能要点：** 个性化收费定价、按车辆的收费

### `maps/directions/tolls/proto/vehicle_attributes.proto`
- **包名：** `maps_tolls`
- **消息：** `VehicleAttributes`
- **枚举：** `VehicleType`
- **作用：** 收费计算中的车辆分类，包括轴数、重量、高度和车辆类型（轿车、卡车、房车、摩托车）。
- **功能要点：** 基于车辆的收费计算、轴数/重量/高度因素

### `maps/directions/copilot/traffic_report/experiments.proto`
- **包名：** `maps_directions.copilot`
- **消息：** `TrafficReportExperimentalParameters`
- **作用：** Copilot 交通报告的实验参数配置，支持对交通报告功能进行 A/B 测试。
- **功能要点：** 交通报告实验、Copilot 集成

### `maps/directions/copilot/traffic_report/traffic_report_audio_type.proto`
- **包名：** `maps_directions.copilot`
- **枚举：** `TrafficReportAudioType`
- **作用：** Copilot 交通报告的音频内容类型分类（例如语音警报、提示音等）。
- **功能要点：** 音频交通报告、多模态警报

### `maps/directions/copilot/traffic_report/traffic_report_icon.proto`
- **包名：** `maps_directions.copilot`
- **枚举：** `TrafficReportIcon`
- **作用：** Copilot UI 中可视化交通报告显示的图标类型。
- **功能要点：** 交通可视化、Copilot UI 集成

### `maps/directions/copilot/traffic_report/traffic_report_prompt_type.proto`
- **包名：** `maps_directions.copilot`
- **枚举：** `TrafficReportPromptType`
- **作用：** Copilot 中交互式交通报告的提示类型分类，支持不同的交互模式。
- **功能要点：** 交互式交通提示、对话式导航

---

## 4. 动态世界 (`maps/dynamicworld/proto/`)

### `maps/dynamicworld/proto/geo_event_category.proto`
- **包名：** `maps_dynamicworld`
- **枚举：** `GeoEventCategory`（50+ 值：SPORTS、CONCERT、PARADE、ART、FOOD_AND_DRINK、CONVENTION、CRISIS、COMMUNITY 等，含子类别）
- **导入：** `storage/datapol/annotations`
- **作用：** 对地图上展示的真实世界地理事件进行层次化分类，涵盖体育赛事（棒球、足球、赛车）、文化活动（音乐会、剧院）和社区活动。
- **功能要点：** 动态事件地图、地理事件分类、真实世界事件叠加层

---

## 5. GMM (`maps/gmm/`)

### `maps/gmm/api/network_type_enums.proto`
- **包名：** `gmm`
- **枚举：** `NetworkType`（WIFI、CELL、BLUETOOTH、ETHERNET、SATELLITE）、`CellNetworkType`（EDGE、GPRS、UMTS、CDMA、LTE、NR、NRNSA、HSPA 等）
- **导入：** `logs/proto/logs_annotations`、`storage/datapol/annotations`
- **作用：** Google Mobile Maps 的网络连接类型枚举，追踪用户的当前网络状况，以支持自适应地图瓦片加载和离线决策。
- **功能要点：** 自适应地图加载、网络感知瓦片获取、移动端优化

### `maps/gmm/api/promoted_pin_ads_common.proto`
- **包名：** `gmm`
- **消息：** `PromotedPinAdsCommon`
- **导入：** `storage/datapol/annotations`
- **作用：** GMM 中推广标记广告的通用数据结构，携带广告展示和点击数据。
- **功能要点：** 推广标记广告、移动广告集成

### `maps/gmm/camera/proto/camera-fallback-status.proto`
- **包名：** `gmm`
- **枚举：** `CameraFallbackStatus`
- **导入：** `storage/datapol/annotations`
- **作用：** GMM 中摄像头降级场景的状态指示器，例如当设备摄像头不可用于 AR 功能时。
- **功能要点：** AR 摄像头处理、降级管理

### `maps/gmm/webview/api/common/draw-metadata.proto`
- **包名：** `gmm`
- **消息：** `DrawMetadata`
- **导入：** `storage/datapol/annotations`
- **作用：** GMM WebView 绘制操作的元数据，控制嵌入式地图视图中的渲染行为。
- **功能要点：** WebView 渲染、嵌入式地图控制

---

## 6. 室内 (`maps/indoor/proto/`)

### `maps/indoor/proto/indoor.proto`
- **包名：** `maps.indoor`
- **消息：** `IndoorBuildingProto`、`IndoorLevelProto`、`IndoorRelationProto`、`IndoorLevelReference`、`IndoorInteractiveEntityProto`、`IndoorBuildingDirectoryMetadata`
- **导入：** `geostore/base/proto/point.proto`、`geostore/base/proto/rect.proto`、`maps/tactile/api/entity-details-common.proto`、`net/proto2/bridge/proto/message_set.proto`
- **作用：** 全面的室内地图数据模型：具有多层级的建筑、楼层元数据（海拔、视口）、交互实体（特定楼层上的 POI）、建筑名录元数据以及连接跨楼层要素的室内关系。
- **功能要点：** 室内地图、多层建筑、室内 POI 交互、楼层选择器、建筑名录

---

## 7. LIMO (`maps/limo/proto/`)

### `maps/limo/proto/context.proto`
- **包名：** `maps_limo`
- **枚举：** `Context`（GMM、LOCAL_UNIVERSAL、ASSISTANT、SPOTLIGHT）
- **导入：** `logs/proto/logs_annotations`
- **作用：** 本地库存地图入驻（LIMO）的上下文枚举，标识发出请求的是哪个 Maps 界面。
- **功能要点：** LIMO 集成、多界面上下文

### `maps/limo/proto/platform.proto`
- **包名：** `maps_limo`
- **枚举：** `ClientPlatform`（ANDROID、IOS）
- **导入：** `logs/proto/logs_annotations`
- **作用：** LIMO 的平台标识，支持针对平台特定的库存展示和交互行为。
- **功能要点：** 平台特定的 LIMO 行为

### `maps/limo/proto/product_category.proto`
- **包名：** `maps_limo`
- **枚举：** `ProductCategory`
- **导入：** `logs/proto/logs_annotations`
- **作用：** 地图上展示的本地库存项目的产品类别分类。
- **功能要点：** 本地库存分类

### `maps/limo/proto/product_type.proto`
- **包名：** `maps_limo`
- **枚举：** `ProductType`
- **导入：** `logs/proto/logs_annotations`
- **作用：** LIMO 库存展示的细粒度产品类型枚举。
- **功能要点：** 库存产品类型化

---

## 8. 日志 (`maps/logs/`)

### `maps/logs/logging/ve_logging_options.proto`
- **包名：** `maps_logs`
- **消息：** `VeLoggingOptions`
- **作用：** 视觉元素（VE）日志记录的配置，控制如何对地图视觉元素进行日志记录以用于分析和调试。
- **功能要点：** 视觉元素日志、分析、调试

---

## 9. 绘制引擎 (`maps/paint/`)

Paint 子系统是核心的地图渲染引擎，负责：
- **客户端矢量瓦片** — 地图客户端消费的渲染瓦片格式
- **样式系统** — 要素选择、样式映射、视觉元素定义
- **标注引擎** — 标注放置、密度控制、表示形式标记
- **元数据** — 无障碍、空气质量、分类搜索、重大事件、季节性事件、公交入口
- **输出管道** — 图像、矢量、SVG、3D 瓦片、道路图瓦片、版权信息

### Paint 核心

#### `maps/paint/proto/paint-request.proto`
- **包名：** `maps_paint`
- **消息：** `PaintRequest`（附有日志敏感度和预净化请求的扩展）
- **枚举：** `OutputType`（IMAGE、VECTOR、FEATUREMAP、PERTILE、COPYRIGHTS、SVG、ROAD_GRAPH_TILE、OGC_3D_TILES、OGC_3D_TILES_SUBTREE）
- **导入：** `maps/paint/proto/feature-options.proto`、`maps/paint/proto/label-placement-options.proto`、`maps/paint/proto/layer-description.proto`、`maps/paint/proto/output-options.proto`、`maps/paint/proto/paint-style-options.proto`、`maps/paint/proto/pipe-metadata.proto`、`maps/paint/proto/region-description.proto`
- **作用：** 主要的绘制请求消息 — 定义要渲染的区域、要包含的图层、输出格式（栅格、矢量、SVG、3D 瓦片、道路图）、样式、标注和管道元数据。是所有地图渲染的入口点。
- **功能要点：** 地图渲染管道、多格式输出、3D 瓦片、道路图、卫星影像对齐

#### `maps/paint/proto/layer-description.proto`
- **包名：** `maps_paint`
- **消息：** `LayerDescription`、`ThickZoomConfig`
- **枚举：** `Type`（MAP、SATELLITE_IMAGERY、TERRAIN、PLAIN_TERRAIN、TERRAIN_SHADING、TERRAIN_CONTOURS、AUX、ROAD_GRAPH、CANNED）
- **导入：** `maps/api/shared/paint/proto/maps-api-layer.proto`、`maps/paint/proto/overlay.proto`、`maps/spotlight/proto/spotlight-description.proto`
- **作用：** 地图渲染的图层规范 — 内容类型（底图、卫星、地形、道路图）、epoch 版本化、叠加层配置、API 图层集成以及 spotlight 描述。
- **功能要点：** 多图层渲染、地形阴影、卫星叠加、道路图、基于 epoch 的版本化

#### `maps/paint/proto/region-description.proto`
- **包名：** `maps_paint`
- **消息：** `RegionDescription`
- **导入：** 无
- **作用：** 绘制请求的地理区域规范 — 定义目标渲染的边界、缩放级别和瓦片覆盖范围。
- **功能要点：** 基于区域的渲染、瓦片覆盖范围控制

#### `maps/paint/proto/feature-selector.proto`
- **包名：** `maps_paint`
- **消息：** `CustomStylerDescription`、`FeatureSelector`、`FeatureStyleSelector`、`StyleSelector`、`StylerSelector`（+ 嵌套选项消息）
- **枚举：** `StylerType`（TEXT_SCALE、VISIBILITY、COLOR_MODIFYING、DASH_PATTERN_MODIFYING、WIDTH、API_KEY_ZOOM）
- **导入：** `geostore/base/proto/feature.proto`、`maps/paint/proto/legendary/legendary.proto`、`maps/paint/styler/color-modifying-styler.proto`、`maps/versatile/proto/rendering-category.proto`
- **作用：** 基于要素的样式选择引擎 — 根据要素类型和类别将地图要素（道路、建筑、POI）连接到视觉样式器（颜色变换、文字缩放、线宽、虚线图案）。
- **功能要点：** 要素驱动样式、自定义地图样式、基于 API key 的样式、深色模式、可见性控制

#### `maps/paint/proto/feature-options.proto`
- **包名：** `maps_paint`
- **消息：** `FeatureOptions`
- **导入：** `maps/paint/proto/feature-selector.proto`、`maps/paint/proto/label-density-restrictions.proto`
- **作用：** 全局要素渲染选项 — 启用/禁用要素类别、应用要素级别的样式覆盖以及管理标注密度限制。
- **功能要点：** 要素开关、全局样式覆盖、密度管理

#### `maps/paint/proto/paint-style-options.proto`
- **包名：** `maps_paint`
- **消息：** `PaintStyleOptions`
- **枚举：** `MapType`（ROADMAP、SATELLITE、TERRAIN、HYBRID）、`ColorScheme`（LIGHT、DARK、SATELLITE）
- **导入：** `maps/paint/proto/feature-selector.proto`、`maps/paint/proto/fetchable-style-set.proto`、`maps/paint/proto/legend-named-style.proto`、`maps/paint/proto/style-table-mapping.proto`、`maps/paint/proto/styler-description.proto`、`maps/paint/proto/sub-style-tag.proto`
- **作用：** 顶层样式配置 — 地图类型、颜色方案（浅色/深色/卫星）、样式表映射以及命名的图例样式。控制渲染地图的整体视觉外观。
- **功能要点：** 浅色/深色模式、地图类型切换、样式表、主题化

#### `maps/paint/proto/paint-parameters.proto`
- **包名：** `maps_paint`
- **消息：** `PaintParameters`
- **导入：** `maps/paint/proto/paint-request.proto`
- **作用：** Paint 服务的管道参数，携带带有附加服务器端配置的绘制请求。
- **功能要点：** 服务器端绘制配置

#### `maps/paint/proto/output-options.proto`
- **包名：** `maps_paint`
- **消息：** `ImageOptions`、`VectorOptions`、`KmzOptions`（已弃用）、`PerTileOptions`、`FeaturemapOptions`、`CopyrightsOptions`、`SvgOptions`、`RoadGraphTileOptions`、`GlbOptions`
- **导入：** `maps/paint/proto/output-debug-options.proto`
- **作用：** 各格式特定的输出配置 — 图像格式（PNG、JPEG、WebP）、矢量瓦片编码、SVG 生成、道路图瓦片设置以及 GLB（glTF 二进制）3D 模型输出选项。
- **功能要点：** 多格式导出、图像编码、矢量瓦片、3D 模型输出

#### `maps/paint/proto/output-debug-options.proto`
- **包名：** `maps_paint`
- **消息：** `OutputDebugOptions`
- **作用：** 绘制输出的调试配置 — 启用诊断叠加层、调试瓦片和渲染检查功能。
- **功能要点：** 渲染调试、诊断可视化

### Paint 样式系统

#### `maps/paint/proto/visual-element.proto`
- **包名：** `maps_paint`
- **消息：** `VisualElement`
- **作用：** 地图上单个视觉元素的定义 — 将几何、样式和渲染属性组合成一个可渲染单元。
- **功能要点：** 视觉元素抽象、可渲染地图对象

#### `maps/paint/proto/styler-description.proto`
- **包名：** `maps_paint`
- **消息：** `StylerDescription`
- **导入：** `maps/paint/proto/sub-style-tag.proto`
- **作用：** 样式器框架描述 — 定义如何根据标签和条件计算视觉属性并将其应用于地图要素。
- **功能要点：** 动态样式、条件渲染

#### `maps/paint/proto/sub-style-tag.proto`
- **包名：** `maps_paint`
- **消息：** `SubStyleTag`
- **作用：** 子样式的标记系统，支持对特定视觉子组件进行细粒度的样式应用。
- **功能要点：** 子样式定向、组件级别样式

#### `maps/paint/proto/style-table-mapping.proto`
- **包名：** `maps_paint`
- **消息：** `StyleTableMapping`
- **作用：** 将样式表标识符映射到视觉属性，提供索引式查找以在渲染时高效应用样式。
- **功能要点：** 样式索引、高效样式查找

#### `maps/paint/proto/fetchable-style-set.proto`
- **包名：** `maps_paint`
- **消息：** `FetchableStyleSet`
- **导入：** `maps/paint/proto/legend-named-style.proto`
- **作用：** 客户端可按需获取的样式集，支持为自定义地图体验进行动态样式加载。
- **功能要点：** 动态样式获取、自定义地图主题

#### `maps/paint/proto/legend-named-style.proto`
- **包名：** `maps_paint`
- **消息：** `LegendNamedStyle`
- **导入：** `maps/paint/proto/feature-selector.proto`
- **作用：** 地图图例的命名样式，为不同缩放级别和地图类型的地图元素提供一致的视觉标识。
- **功能要点：** 图例样式、一致的视觉标识

#### `maps/paint/proto/resource.proto`
- **包名：** `maps_paint`
- **消息：** `PaintResource`
- **作用：** 绘制资产的资源描述符（纹理、图标、图案），用于地图渲染。
- **功能要点：** 资产管理、纹理加载

#### `maps/paint/proto/texture.proto`
- **包名：** `maps_paint`
- **消息：** `Texture`
- **作用：** 地图渲染的纹理数据规范，包括格式、尺寸和编码图像数据。
- **功能要点：** 地图纹理、图像编码

#### `maps/paint/styler/color-modifying-styler.proto`
- **包名：** `maps_paint`
- **消息：** `ColorTransform`
- **枚举：** `Action`（ADJUST_HUE、ADJUST_SATURATION、ADJUST_LIGHTNESS、ADJUST_GAMMA、INVERT_LIGHTNESS、SET_COLOR）
- **作用：** 地图样式的颜色变换操作 — HSL 调整、伽马校正和直接颜色设置，用于支持动态主题。
- **功能要点：** 颜色主题化、深色模式变换、动态样式

#### `maps/paint/styler/legend/font-properties.proto`
- **包名：** `maps_paint`
- **消息：** `FontProperties`
- **导入：** `maps/paint/proto/font-family.proto`
- **作用：** 地图标注渲染的字体属性规范（字体族、字号、字重、样式）。
- **功能要点：** 地图排版、字体配置

#### `maps/paint/proto/font-family.proto`
- **包名：** `maps_paint`
- **枚举：** `FontFamily`
- **作用：** 地图标注渲染的字体族枚举。
- **功能要点：** 地图排版、字体选择

#### `maps/paint/proto/legendary/legendary.proto`
- **包名：** `maps_paint`
- **消息：** `LegendarySystem`
- **导入：** `maps/paint/proto/texture.proto`
- **作用：** "Legendary" 系统 — 高级地图图例和样式映射基础设施，将要素类型连接到视觉表示，并支持纹理。
- **功能要点：** 高级图例系统、样式映射

### Paint 标注引擎

#### `maps/paint/proto/label-placement-options.proto`
- **包名：** `maps_paint`
- **消息：** `LabelPlacementOptions`
- **导入：** `maps/paint/proto/label-density-restrictions.proto`、`maps/paint/proto/label-representation-tag.proto`
- **作用：** 标注放置引擎的配置 — 控制地图标注在渲染过程中的定位、优先级和去冲突。
- **功能要点：** 标注放置、冲突解决、标注优先级

#### `maps/paint/proto/label-density-restriction.proto`
- **包名：** `maps_paint`
- **消息：** `LabelDensityRestriction`
- **作用：** 每种标注类型的密度限制 — 限制在视口中显示给定类型的标注数量。
- **功能要点：** 标注密度控制、视口优化

#### `maps/paint/proto/label-density-restrictions.proto`
- **包名：** `maps_paint`
- **消息：** `LabelDensityRestrictions`
- **导入：** `maps/paint/proto/label-density-restriction.proto`
- **作用：** 为绘制请求汇总的标注密度限制集合。
- **功能要点：** 聚合密度管理

#### `maps/paint/proto/label-representation-tag.proto`
- **包名：** `maps_paint_client`
- **消息：** `LabelRepresentationTag`
- **作用：** 用于标识和分组标注表示形式的标签，支持按标注类型进行选择性样式设置和密度控制。
- **功能要点：** 标注类型化、表示形式标记

#### `maps/paint/proto/map-element-id.proto`
- **包名：** `maps_paint`
- **消息：** `MapElementId`
- **作用：** 每个渲染地图元素的唯一标识符，支持交互性和日志归因。
- **功能要点：** 元素标识、交互追踪

### Paint 客户端矢量瓦片

#### `maps/paint/proto/client-vector-tile.proto`
- **包名：** `maps_paint_client`
- **消息：** `LineRenderOp`、`PolygonRenderOp`、`PointRenderOp`、`ClientVectorTile`、`ClientVectorRegion`、`ClientVectorSegment`（+ 多种嵌套类型）
- **枚举：** `CapShape`、`JointShape`、`GroundOverlayType` 等
- **导入：** `maps/paint/proto/client-vector-annotation-targeting.proto`、`maps/paint/proto/client-vector-data-bound-value.proto`、`maps/paint/proto/client-vector-label.proto`、`maps/paint/proto/client-vector-style-info.proto`、`maps/paint/proto/client-vector-style.proto`、`maps/paint/proto/client-vector-tile-debug.proto`、`maps/paint/proto/client-vector-tile-serialization.proto`、`maps/paint/proto/maps-metadata-container.proto`、`maps/shared/mapcore/api/proto/pose.proto`、`maps/util/geometry-transform.proto`、`maps/util/tile_coordinate.proto`
- **作用：** 核心的客户端矢量瓦片格式 — 移动端/Web 客户端接收并渲染的内容。定义线、面和点渲染操作，包含顶点数据、样式、z 排序、段级别的多缩放样式 ID、元数据、交互性和数据绑定值。
- **功能要点：** 客户端矢量瓦片、GPU 高效渲染、分段样式、z 排序、多缩放样式

#### `maps/paint/proto/client-vector-tile-extensions.proto`
- **包名：** `maps_paint_client`
- **消息：** 客户端矢量瓦片的各种扩展消息
- **导入：** `maps/paint/proto/client-vector-tile.proto`
- **作用：** 客户端矢量瓦片格式的扩展，增加对附加渲染功能和元数据的支持。
- **功能要点：** 瓦片格式可扩展性

#### `maps/paint/proto/client-vector-tile-serialization.proto`
- **包名：** `maps_paint_client`
- **消息：** 序列化相关消息
- **导入：** `maps/paint/proto/client-vector-tile.proto`
- **作用：** 客户端矢量瓦片的序列化/反序列化辅助，支持高效的线格式传输。
- **功能要点：** 瓦片序列化、线格式

#### `maps/paint/proto/client-vector-tile-debug.proto`
- **包名：** `maps_paint_client`
- **消息：** 客户端矢量瓦片的调试信息
- **导入：** `maps/paint/proto/client-vector-tile.proto`
- **作用：** 嵌入在客户端矢量瓦片中的调试元数据，用于渲染诊断和开发。
- **功能要点：** 渲染调试、瓦片检查

#### `maps/paint/proto/client-vector-tile-ugc-extensions.proto`
- **包名：** `maps_paint_client`
- **消息：** UGC 相关扩展
- **导入：** `maps/paint/proto/client-vector-tile.proto`
- **作用：** 客户端矢量瓦片的用户生成内容（UGC）扩展，支持社区贡献的地图数据显示。
- **功能要点：** UGC 展示、社区贡献

#### `maps/paint/proto/client-vector-style.proto`
- **包名：** `maps_paint_client`
- **消息：** `ClientVectorStyle`
- **导入：** `maps/paint/proto/client-vector-style-info.proto`
- **作用：** 客户端矢量样式定义 — 颜色、描边、填充、图案以及渲染矢量要素的其他视觉属性。
- **功能要点：** 客户端样式、视觉属性定义

#### `maps/paint/proto/client-vector-style-info.proto`
- **包名：** `maps_paint_client`
- **消息：** `ClientVectorStyleInfo`
- **导入：** `maps/paint/proto/client-vector-style.proto`
- **作用：** 客户端矢量渲染的扩展样式信息，包括样式来源和衍生相关的元数据。
- **功能要点：** 样式元数据、样式来源追踪

#### `maps/paint/proto/client-vector-label.proto`
- **包名：** `maps_paint_client`
- **消息：** `ClientVectorLabel`
- **导入：** `maps/paint/proto/client-vector-tile.proto`
- **作用：** 客户端矢量瓦片内的标注数据 — 文本内容、定位、样式和地图标注的分类。
- **功能要点：** 客户端标注、文本渲染

#### `maps/paint/proto/client-vector-data-bound-value.proto`
- **包名：** `maps_paint_client`
- **消息：** `DataBoundValue`
- **作用：** 客户端矢量渲染的数据绑定值 — 根据运行时数据（如交通状况、天气）变化的值，实现动态地图样式。
- **功能要点：** 数据驱动样式、动态地图更新

#### `maps/paint/proto/client-vector-annotation-targeting.proto`
- **包名：** `maps_paint_client`
- **消息：** 标注定向消息
- **导入：** `maps/paint/proto/client-vector-tile.proto`
- **作用：** 矢量标注的定向信息 — 根据实验组和要素属性确定哪些标注适用于哪些要素。
- **功能要点：** 标注定向、基于实验的显示

#### `maps/paint/proto/client-vector-ops.proto`
- **包名：** `maps_paint_client`
- **消息：** 矢量操作消息
- **导入：** `maps/paint/proto/client-vector-tile.proto`
- **作用：** 操作客户端矢量瓦片的功能 — 合并、过滤、变换已渲染的矢量数据。
- **功能要点：** 瓦片操作、矢量操作

#### `maps/paint/proto/client-vector-snapping.proto`
- **包名：** `maps_paint_client`
- **消息：** 矢量吸附消息
- **导入：** `maps/paint/proto/client-vector-tile.proto`
- **作用：** 矢量元素的吸附配置 — 控制地图要素如何对齐到道路、建筑和其他几何体以实现精确放置。
- **功能要点：** 要素吸附、精确放置

#### `maps/paint/proto/client-style-transforms.proto`
- **包名：** `maps_paint_client`
- **消息：** `ClientStyleTransforms`
- **作用：** 客户端样式变换 — 运行时对矢量瓦片应用的样式修改，用于动态主题化和个性化。
- **功能要点：** 动态主题化、运行时样式变换

#### `maps/paint/proto/client-vector-metadata.proto`
- **包名：** `maps_paint_client`
- **消息：** `ClientVectorMetadata`
- **作用：** 客户端矢量渲染的元数据 — 携带有关瓦片来源、处理管道和渲染提示的信息。
- **功能要点：** 渲染元数据、管道追踪

### Paint 元数据

#### `maps/paint/proto/maps-metadata-container.proto`
- **包名：** `maps_paint`
- **消息：** `MapsMetadataContainer`
- **作用：** 各种地图元数据的容器 — 将无障碍、空气质量、搜索、事件、公交和其他元数据聚合到每个地图元素的单一结构中。
- **功能要点：** 元数据聚合、多类型元数据

#### `maps/paint/proto/accessibility-metadata.proto`
- **包名：** `maps_paint`
- **消息：** `AccessibilityMetadata`
- **作用：** 地图要素的无障碍信息（例如轮椅可通行的入口、无障碍公交站），渲染在地图上。
- **功能要点：** 无障碍地图、包容性导航

#### `maps/paint/proto/air-quality-metadata.proto`
- **包名：** `maps_paint`
- **消息：** `AirQualityMetadata`
- **作用：** 用于地图叠层显示的空气质量数据，包括 AQI 值、污染物浓度和监测站数据。
- **功能要点：** 空气质量叠加层、环境地图

#### `maps/paint/proto/air-quality-heatmap-metadata.proto`
- **包名：** `maps_paint`
- **消息：** `AirQualityHeatmapMetadata`
- **作用：** 空气质量可视化的热力图特定元数据，控制颜色渐变和插值。
- **功能要点：** 空气质量热力图、插值可视化

#### `maps/paint/proto/annotation-application-info.proto`
- **包名：** `maps_paint`
- **消息：** `AnnotationApplicationInfo`
- **作用：** 有关标注如何应用到地图要素的信息 — 哪些标注规则匹配以及因何匹配。
- **功能要点：** 标注调试、规则追踪

#### `maps/paint/proto/batch-logging-instruction.proto`
- **包名：** `maps_paint`
- **消息：** `BatchLoggingInstruction`
- **作用：** 将地图交互和展示批量记录到分析系统的指令。
- **功能要点：** 批量日志记录、分析集成

#### `maps/paint/proto/categorical-search-metadata.proto`
- **包名：** `maps_paint`
- **消息：** `CategoricalSearchMetadata`
- **作用：** 地图上显示的分类搜索结果元数据 — 存储搜索类别、结果计数和显示提示。
- **功能要点：** 搜索结果可视化、类别显示

#### `maps/paint/proto/field-options.proto`
- **包名：** `maps_paint`
- **消息：** 字段选项扩展
- **作用：** Paint 子系统的 proto 字段选项扩展，在 proto 字段上提供自定义注解。
- **功能要点：** Proto 自定义、字段注解

#### `maps/paint/proto/interactivity.proto`
- **包名：** `maps_paint`
- **消息：** `InteractivityProto`
- **作用：** 地图元素的交互性数据 — 定义用户点击地图要素时触发的行为（如显示信息卡片、导航、拨打电话等）。
- **功能要点：** 地图交互性、点击处理

#### `maps/paint/proto/major-event-metadata.proto`
- **包名：** `maps_paint`
- **消息：** `MajorEventMetadata`
- **作用：** 地图上重大事件展示的元数据 — 体育赛事、音乐会、游行，含事件时间和场馆信息。
- **功能要点：** 事件地图、实时事件展示

#### `maps/paint/proto/maps_impression_data.proto`
- **包名：** `maps_paint`
- **消息：** `MapsImpressionData`
- **作用：** 地图元素的展示追踪数据，记录哪些要素对用户可见以及可见时长。
- **功能要点：** 展示追踪、可见性分析

#### `maps/paint/proto/overlay.proto`
- **包名：** `maps_paint`
- **消息：** `OverlayLayerProto`
- **作用：** 叠加图层定义 — KMZ/KML 图层、自定义瓦片叠加以及用户定义的地图内容。
- **功能要点：** 自定义叠加层、KML/KMZ 支持

#### `maps/paint/proto/painted-region.proto`
- **包名：** `maps_paint`
- **消息：** `PaintedRegion`
- **作用：** 描述已被绘制/渲染的地图区域，包括覆盖范围和状态信息。
- **功能要点：** 渲染覆盖范围追踪

#### `maps/paint/proto/pipe-metadata.proto`
- **包名：** `maps_paint`
- **消息：** `PipeMetadata`
- **作用：** Paint 渲染管道的管道元数据 — 携带版本、时间和来源信息通过渲染管道。
- **功能要点：** 管道追踪、渲染来源追踪

#### `maps/paint/proto/places-list-metadata.proto`
- **包名：** `maps_paint`
- **消息：** `PlacesListMetadata`
- **作用：** 地图上地点列表显示的元数据 — 收藏列表、想去列表、以地图标记方式渲染的共享列表。
- **功能要点：** 地点列表、已保存地点可视化

#### `maps/paint/proto/poi-logging-instruction.proto`
- **包名：** `maps_paint`
- **消息：** `PoiLoggingInstruction`
- **作用：** 针对 POI（兴趣点）交互的日志指令 — 点击、长按和信息卡片查看。
- **功能要点：** POI 交互日志

#### `maps/paint/proto/promoted-place-logging-metadata.proto`
- **包名：** `maps_paint`
- **消息：** `PromotedPlaceLoggingMetadata`
- **作用：** 地图上推广/广告地点的日志元数据，追踪广告展示和互动。
- **功能要点：** 广告日志、推广地点追踪

#### `maps/paint/proto/promoted-place-navigation-logging-metadata.proto`
- **包名：** `maps_paint`
- **消息：** `PromotedPlaceNavigationLoggingMetadata`
- **作用：** 推广地点的导航专用日志 — 追踪用户何时导航到广告目标地。
- **功能要点：** 广告导航追踪、转化归因

#### `maps/paint/proto/seasonal-event-metadata.proto`
- **包名：** `maps_paint`
- **消息：** `SeasonalEventMetadata`
- **作用：** 地图上季节性/节日事件的元数据（例如圣诞市场、樱花季）。
- **功能要点：** 季节性地图、节日事件

#### `maps/paint/proto/static-realtime-metadata.proto`
- **包名：** `maps_paint`
- **消息：** `StaticRealtimeMetadata`
- **作用：** 将静态地图数据与实时更新相结合的元数据（例如实时公交到站信息、当前交通状况）。
- **功能要点：** 实时叠加层、实时数据集成

#### `maps/paint/proto/transit-station-entrance-metadata.proto`
- **包名：** `maps_paint`
- **消息：** `TransitStationEntranceMetadata`
- **作用：** 公交站入口展示的元数据 — 渲染在地图上的入口位置、类型、无障碍信息。
- **功能要点：** 公交入口地图、站点无障碍

---

## 10. 路径规划器 (`maps/pathfinder/`)

Pathfinder 子系统是基于 CRP（可定制路线规划）框架构建的路径查找引擎。它负责：
- **路径搜索** — 在多个航点之间寻找最优路线
- **MRP** — 多路线规划，包含成本函数和选择器规范
- **替代路线** — 寻找备选路线
- **CRP 模块** — 可配置的寻路、排序和搜索器模块
- **客户端** — 航点、成本模型、定制化、实验、按需交通
- **自动驾驶** — 针对自动驾驶车辆的辅助驾驶支持
- **共享层** — 路线类型、动态配置、替代方案方法

### Pathfinder 客户端

#### `maps/pathfinder/client/find-path-input.proto`
- **包名：** `pathfinder`
- **消息：** `FindPathInput`（主路由请求）、`RequeryInput`、`BetterRouteFoundOptions`、`TrafficReportOptions`、`WaypointPairing`、`DistanceUnits`、`VehicleEnergyOptions`、`TollOptions`、`RoutingConstraint`、`AssistedDrivingOptions`、`RoadsideFacilityOptions`、`RestrictionsOptions`、`SustainabilityOptions`（+ 多种嵌套枚举）
- **枚举：** `WaypointPairing`、`DistanceUnits`、`TextOutputType`、`DirectionsVerbosity`、`MetricsOnlyMode`、`RouteType`、`RequestOrigin`、`TripTrafficReportMode`、`TripsetTrafficReportMode`、`TrafficTrendOptions`、`ConstraintType`
- **导入：** 20+ 个导入，涵盖 EV 选项、辅助驾驶、收费、实验、航点、交通、公交、定制化
- **作用：** 核心的路径查找请求 — 指定航点、成本模型、车辆能源（EV）、收费偏好、路由约束、辅助驾驶选项、交通报告请求、可持续性标签以及所有输出格式偏好。将 Pathfinder 连接到所有其他子系统。
- **功能要点：** 路线查找、EV 路线规划、收费计算、交通感知路线规划、辅助驾驶、可持续性、多航点优化、道路封闭

#### `maps/pathfinder/client/waypoint.proto`
- **包名：** `pathfinder`
- **消息：** `Waypoint`，以及位置规范相关的子消息
- **导入：** `geostore/base/proto/featureid.proto`、`maps/pathfinder/client/anchor_position.proto`、`maps/pathfinder/client/anchor_type.proto`、`maps/pathfinder/client/boarded_transit_vehicle.proto`、`maps/pathfinder/client/cost-model-options.proto`
- **作用：** 路径查找的航点规范 — 位置、锚点类型、到达/出发偏好、已登车公交信息以及每个航点的成本模型覆盖。
- **功能要点：** 航点规范、公交上车、锚点定位

#### `maps/pathfinder/client/cost-model-options.proto`
- **包名：** `pathfinder`
- **消息：** `CostModelOptions`，以及针对不同出行模式的子消息（驾车、步行、骑行、公交）
- **导入：** `maps/pathfinder/client/mrp-cost-function-specification.proto`
- **作用：** 成本模型配置 — 定义如何计算每种出行方式的路线成本，包括时间、距离、燃油、收费和用户偏好权重。
- **功能要点：** 多模态成本模型、基于偏好的路线规划

#### `maps/pathfinder/client/customization_inputs.proto`
- **包名：** `pathfinder`
- **消息：** `CustomizationInputs`
- **导入：** `maps/directions/customization/config/serving_protos/passability.proto`
- **作用：** 将定制化数据（通行性覆盖、车辆偏好）传递给 Pathfinder 以实现个性化路线规划。
- **功能要点：** 路线定制化、通行性覆盖

#### `maps/pathfinder/client/experiments.proto`
- **包名：** `pathfinder`
- **消息：** `ExperimentalParameters`
- **导入：** `maps/pathfinder/client/cost-model-options.proto`
- **作用：** Pathfinder A/B 测试的实验参数容器 — 支持功能开关和实验性成本模型。
- **功能要点：** A/B 测试、实验性路线规划

#### `maps/pathfinder/client/mrp-cost-function-specification.proto`
- **包名：** `pathfinder`
- **消息：** `MrpCostFunctionSpecification`
- **导入：** `maps/directions/mrp/proto/cost_function_spec_type.proto`
- **作用：** 多路线规划中用于对备选路线进行排序和选择的成本函数规范。
- **功能要点：** MRP 成本函数、路线排序

#### `maps/pathfinder/client/mrp-ranking-options.proto`
- **包名：** `pathfinder`
- **消息：** `MrpRankingOptions`
- **作用：** MRP 如何对备选路线进行排序的配置 — 不同标准的权重（速度、简洁、燃油效率）。
- **功能要点：** 路线排序、备选方案评分

#### `maps/pathfinder/client/mrp-selector-specification.proto`
- **包名：** `pathfinder`
- **消息：** `MrpSelectorSpecification`
- **作用：** MRP 路线选择器引擎的规范，决定从搜索池中选择哪些路线。
- **功能要点：** 路线选择、MRP 过滤

#### `maps/pathfinder/client/mrp-vehicle-info.proto`
- **包名：** `pathfinder`
- **消息：** `MrpVehicleInfo`
- **作用：** MRP 路线规划的车辆信息 — 车辆类型、尺寸和能力，用于成本计算。
- **功能要点：** 车辆感知路线规划、MRP 车辆模型

#### `maps/pathfinder/client/on-demand-transportation.proto`
- **包名：** `pathfinder`
- **消息：** `OnDemandTransportationOptions`、`TaxiOptions`、`BikesharingOptions`
- **导入：** 无
- **作用：** 作为路线规划一部分的按需出行方式（网约车、出租车、共享单车）配置。
- **功能要点：** 网约车集成、共享单车路线规划

#### `maps/pathfinder/client/pathfinder-request-building-options.proto`
- **包名：** `pathfinder`
- **消息：** `PathfinderRequestBuildingOptions`
- **作用：** 控制 Pathfinder 如何构建请求的选项，包括批处理和并行化设置。
- **功能要点：** 请求优化、并行寻路

#### `maps/pathfinder/client/polyline-codec.proto`
- **包名：** `pathfinder`
- **消息：** `PolylineCodecOptions`
- **枚举：** `CodecType`
- **作用：** 折线编码选项 — 控制路线折线在响应中的编码方式（压缩格式、精度）。
- **功能要点：** 折线压缩、路线可视化

#### `maps/pathfinder/client/voice-guidance-options.proto`
- **包名：** `pathfinder`
- **消息：** `VoiceGuidanceOptions`
- **作用：** 路线规划期间语音引导生成的配置。
- **功能要点：** 语音导航、逐向引导

#### `maps/pathfinder/client/anchor_position.proto`
- **包名：** `pathfinder`
- **消息：** `AnchorPosition`
- **作用：** 锚点位置规范 — 航点在路段上吸附的位置。
- **功能要点：** 航点吸附、道路锚定

#### `maps/pathfinder/client/anchor_type.proto`
- **包名：** `pathfinder`
- **枚举：** `AnchorType`
- **作用：** 航点定位的锚点类型（例如道路中心、路肩、停车场入口）。
- **功能要点：** 锚点分类

#### `maps/pathfinder/client/boarded_transit_vehicle.proto`
- **包名：** `pathfinder`
- **消息：** `BoardedTransitVehicle`
- **作用：** 关于当前已登车公交车辆的信息，用于实时路线更新。
- **功能要点：** 实时公交路线规划、主动行程追踪

#### `maps/pathfinder/client/building-level.proto`
- **包名：** `pathfinder`
- **消息：** `BuildingLevel`
- **作用：** 室内路线规划的建筑楼层规范 — 航点所在建筑的具体楼层。
- **功能要点：** 室内路线规划、多层导航

#### `maps/pathfinder/client/distance_unit.proto`
- **包名：** `pathfinder`
- **枚举：** `DistanceUnit`
- **作用：** Pathfinder 输出的距离单位枚举（公里、英里）。
- **功能要点：** 单位本地化

#### `maps/pathfinder/client/generator-traffic-usage.proto`
- **包名：** `pathfinder`
- **枚举：** `GeneratorTrafficUsage`
- **作用：** 控制路线生成过程中如何使用交通数据 — 实时、典型或历史数据。
- **功能要点：** 交通数据选择、时间感知路线规划

#### `maps/pathfinder/client/logging-context.proto`
- **包名：** `pathfinder`
- **消息：** `LoggingContext`
- **作用：** Pathfinder 请求的日志上下文 — 携带实验 ID、客户端版本和用于分析的请求元数据。
- **功能要点：** 请求日志、分析上下文

#### `maps/pathfinder/client/request-source.proto`
- **包名：** `pathfinder`
- **枚举：** `RequestSource`
- **作用：** 标识 Pathfinder 请求的来源（例如移动应用、Web、API）。
- **功能要点：** 请求归因

#### `maps/pathfinder/client/travel_advisory.proto`
- **包名：** `pathfinder`
- **消息：** `TravelAdvisory`
- **作用：** 路线的出行提示信息 — 有关道路状况、封闭或限制的警告。
- **功能要点：** 出行提示、路线警告

### Pathfinder CRP（可定制路线规划）

#### `maps/pathfinder/crp/modules/path_finding/path_finding_module_config.proto`
- **包名：** `pathfinder.crp`
- **消息：** `PathFindingModuleConfig`
- **作用：** CRP 寻路模块的配置，控制搜索算法和参数。
- **功能要点：** CRP 搜索配置

#### `maps/pathfinder/crp/modules/ranking/ranking_module_config.proto`
- **包名：** `pathfinder.crp`
- **消息：** `RankingModuleConfig`
- **作用：** CRP 排序模块的配置，控制如何对找到的路径进行评分和排序。
- **功能要点：** CRP 排序配置

#### `maps/pathfinder/crp/path_finding/iterative_search_config.proto`
- **包名：** `pathfinder.crp`
- **消息：** `IterativeSearchConfig`
- **作用：** 迭代路径搜索的配置 — 多阶段搜索细化的参数。
- **功能要点：** 迭代搜索、多阶段路线规划

#### `maps/pathfinder/crp/ranking/maneuver_detector_config.proto`
- **包名：** `pathfinder.crp`
- **消息：** `ManeuverDetectorConfig`
- **作用：** 机动检测的配置 — 从路线几何中识别转弯、合流和其他驾驶动作。
- **功能要点：** 机动检测、转弯识别

#### `maps/pathfinder/crp/ranking/pruning_config.proto`
- **包名：** `pathfinder.crp`
- **消息：** `PruningConfig`
- **作用：** 路线剪枝的配置 — 提前从候选池中移除次优路线以减少计算量。
- **功能要点：** 路线剪枝、性能优化

#### `maps/pathfinder/crp/searcher/alternates/alternates_config.proto`
- **包名：** `pathfinder.crp`
- **消息：** `AlternatesConfig`
- **作用：** 寻找替代路线的配置 — 控制多样性、相似性阈值和替代路线数量。
- **功能要点：** 替代路线、路线多样性

#### `maps/pathfinder/crp/searcher/cost_type.proto`
- **包名：** `pathfinder.crp`
- **枚举：** `CostType`
- **作用：** CRP 搜索的成本类型枚举 — 不同的成本维度（时间、距离、燃油等）。
- **功能要点：** 多维度成本

#### `maps/pathfinder/crp/searcher/highway_ramp_fixup/highway_ramp_fixup_config.proto`
- **包名：** `pathfinder.crp`
- **消息：** `HighwayRampFixupConfig`
- **作用：** 高速匝道修正的配置 — 修正高速公路立交和匝道的路线伪影，使导航更平滑。
- **功能要点：** 高速匝道处理、路线平滑

#### `maps/pathfinder/crp/shared_server/route_attributes.proto`
- **包名：** `pathfinder.crp`
- **消息：** `RouteAttributes`
- **作用：** CRP 服务器的共享路线属性结构 — 携带计算出的路线属性（长度、耗时、机动次数）。
- **功能要点：** 路线元数据、共享属性

#### `maps/pathfinder/crp/costs/cost_provenance.proto`
- **包名：** `pathfinder.crp`
- **消息：** `CostProvenance`
- **作用：** 追踪 CRP 中成本值的来源 — 哪些数据源和模型产生了每个成本估计。
- **功能要点：** 成本归因、模型来源追踪

### Pathfinder 共享层与自动驾驶

#### `maps/pathfinder/shared/proto/route_type.proto`
- **包名：** `pathfinder`
- **枚举：** `RouteType`（MAIN、ALTERNATE、INTERNAL、REQUERY、RISK_AVERSE）
- **作用：** Pathfinder 输出中路线类型的分类 — 区分主路线、替代路线和内部计算路线。
- **功能要点：** 路线分类、输出区分

#### `maps/pathfinder/shared/proto/alternates_method.proto`
- **包名：** `pathfinder`
- **枚举：** `AlternatesMethod`
- **作用：** 用于生成替代路线的方法枚举。
- **功能要点：** 替代路线生成

#### `maps/pathfinder/shared/config/crp_dynamic_config.proto`
- **包名：** `pathfinder`
- **消息：** `CrpDynamicConfig`
- **作用：** CRP 的动态配置 — 路线规划引擎的运行时可调参数。
- **功能要点：** 动态 CRP 调优、运行时配置

#### `maps/pathfinder/shared/config/pathfinder_dynamic_config.proto`
- **包名：** `pathfinder`
- **消息：** `PathfinderDynamicConfig`
- **作用：** 整个 Pathfinder 系统的顶层动态配置。
- **功能要点：** 系统级 Pathfinder 配置

#### `maps/pathfinder/autonomous/proto/assisted_driving_info.proto`
- **包名：** `maps_autonomous`
- **消息：** `AssistedDrivingInfo`
- **作用：** 辅助驾驶的车辆状态信息 — 当前速度、车道位置以及 Pathfinder 用于自动驾驶优化路由的传感器数据。
- **功能要点：** 自动驾驶、辅助导航

#### `maps/pathfinder/autonomous/proto/assisted_driving_state_info.proto`
- **包名：** `maps_autonomous`
- **消息：** `AssistedDrivingStateInfo`
- **作用：** 辅助驾驶功能的运行状态追踪 — ADAS 是否激活、当前使用的自动驾驶级别。
- **功能要点：** ADAS 状态追踪、自动驾驶级别

#### `maps/pathfinder/autonomous/proto/vehicle_info.proto`
- **包名：** `maps_autonomous`
- **消息：** `VehicleInfo`
- **作用：** 自动驾驶路线规划的车辆规格 — 尺寸、传感器套件、能力。
- **功能要点：** 自动驾驶车辆配置文件

#### `maps/pathfinder/replay/proto/replay_metadata.proto`
- **包名：** `pathfinder.replay`
- **消息：** `ReplayMetadata`
- **作用：** Pathfinder 请求重放的元数据 — 支持调试和重放路由请求以进行测试和分析。
- **功能要点：** 请求重放、调试、回归测试

---

## 11. 路况交通 (`maps/roadtraffic/proto/`)

#### `maps/roadtraffic/proto/traffic_model_type.proto`
- **包名：** `maps_roadtraffic`
- **枚举：** `TrafficModelType`（PER_SEGMENT_REGRESSION、GLOBAL_CAR_GLASSBOX、GLOBAL_TWO_WHEELER_GLASSBOX、REMOTE_PREDICTION、SUPERSEGMENT、BLENDING、TRAFFIC2VEC）、`RoadIndexPresence`
- **导入：** `logs/proto/logs_annotations`
- **作用：** 定义所使用的交通预测模型类型 — 从每段回归到神经网络模型（TRAFFIC2VEC），以及道路是否存在于交通索引中。
- **功能要点：** 交通预测、ML 模型选择、道路索引

#### `maps/roadtraffic/proto/trafficproperty.proto`
- **包名：** `maps_roadtraffic`
- **消息：** `TrafficProperty`
- **作用：** 核心的交通属性数据结构 — 路段的速度、拥堵级别和流量状态。
- **功能要点：** 交通状态、速度数据、拥堵级别

#### `maps/roadtraffic/proto/incidentmetadata.proto`
- **包名：** `maps_roadtraffic`
- **消息：** `IncidentMetadata`
- **导入：** `net/proto2/bridge/proto/message_set.proto`
- **作用：** 交通事故的元数据 — 事故 ID、说明、描述、类型分类和用户审核标志。通过桥接方式扩展 MessageSet 以实现跨系统兼容。
- **功能要点：** 交通事故、道路封闭、用户上报事故

#### `maps/roadtraffic/proto/incidentreport_v2_params.proto`
- **包名：** `maps_roadtraffic`
- **消息：** `AnnotateIncidentsParameters`（已弃用），相关的事故报告参数
- **作用：** 事故报告 v2 API 的参数 — 控制交通响应中的事故标注和过滤（已弃用，由更新的机制取代）。
- **功能要点：** 事故标注、v2 API

#### `maps/roadtraffic/proto/incidents_root_cause.proto`
- **包名：** `maps_roadtraffic`
- **枚举：** `IncidentsRootCause`
- **作用：** 交通事故的根本原因分类 — 施工、事故、天气、事件等。
- **功能要点：** 事故分析、根本原因追踪

#### `maps/roadtraffic/proto/encoded_path_params.proto`
- **包名：** `maps_roadtraffic`
- **消息：** `PathEncodingRequestParameters`
- **作用：** 沿路径编码交通信息的参数，用于路线令牌生成和高效的交通数据传输。
- **功能要点：** 路径编码、路线令牌、交通数据压缩

#### `maps/roadtraffic/proto/path_traffic_flavor.proto`
- **包名：** `maps_roadtraffic`
- **枚举：** `PathTrafficFlavor`
- **作用：** 路径显示的交通数据风格 — 控制交通状况如何在路线折线上可视化。
- **功能要点：** 交通可视化、路线着色

#### `maps/roadtraffic/proto/traffic_data_server_log_data.proto`
- **包名：** `maps_roadtraffic`
- **消息：** `TrafficDataServerLogData`
- **作用：** 交通数据服务的服务器端日志数据 — 追踪请求模式、模型使用和数据新鲜度。
- **功能要点：** 交通数据日志、服务监控

#### `maps/roadtraffic/proto/travel_mode.proto`
- **包名：** `maps_roadtraffic`
- **枚举：** `TravelMode`
- **作用：** 交通数据查询的出行方式枚举 — DRIVING、WALKING、BICYCLING、TRANSIT。
- **功能要点：** 多模态交通、出行方式选择

---

## 12. 共享层 (`maps/shared/`)

### 共享通用层

#### `maps/shared/common/geom/geom.proto`
- **包名：** `maps_shared.geom`
- **消息：** `Camera`（包含 Location、Rotation、Size、LookAhead）、`MapsCameraViewportDiffFromExperiment`、`Location`（lat/lng/alt）、`Rotation`（heading/tilt/roll）、`Size`（width/height）、`LookAhead`
- **导入：** `google/api/inclusion.proto`、`java/com/google/apps/jspb/jspb.proto`、`maps/logs/logging/ve_logging_options.proto`、`storage/datapol/annotations`
- **作用：** 所有 Maps 子系统共享的基础几何类型。定义 Camera（视口 + 方向）、Location（3D 坐标）和 Rotation。是 Maps proto 的通用几何词汇。
- **功能要点：** 共享几何、摄像头模型、3D 坐标、视口定义

#### `maps/shared/client/callouts/callouts_logging.proto`
- **包名：** `maps_shared.client`
- **消息：** `CalloutsLogging`
- **作用：** 地图上向用户展示的弹出卡片/提示的日志数据。
- **功能要点：** 弹出卡片交互追踪

### 共享 MapCore

#### `maps/shared/mapcore/api/proto/pose.proto`
- **包名：** `maps_shared.mapcore`
- **消息：** `Pose`
- **作用：** 地图元素的 3D 姿态规范 — AR 和 3D 地图渲染中世界空间的位置和方向。
- **功能要点：** 3D 姿态、AR 放置、世界空间定位

#### `maps/shared/mapcore/api/proto/map_actions.proto`
- **包名：** `maps_shared.mapcore`
- **消息：** `MapActions`
- **作用：** 地图交互的动作定义 — 用户与地图元素交互时可用的动作。
- **功能要点：** 交互式地图动作、用户交互处理

#### `maps/shared/mapcore/api/proto/extensions/draw_pass_override.proto`
- **包名：** `maps_shared.mapcore`
- **消息：** `DrawPassOverride`
- **作用：** 地图绘制通道的覆盖规范 — 为自定义渲染控制渲染顺序和通道分配。
- **功能要点：** 渲染通道控制、自定义绘制顺序

#### `maps/shared/mapcore/labeler/api/client_vector_ops_metadata.proto`
- **包名：** `maps_shared.mapcore.labeler`
- **消息：** `ClientVectorOpsMetadata`
- **作用：** 标注器子系统中客户端矢量操作的元数据，将标注决策连接到渲染输出。
- **功能要点：** 标注操作、矢量渲染集成

#### `maps/shared/mapcore/labeler/api/label_logging.proto`
- **包名：** `maps_shared.mapcore.labeler`
- **消息：** `LabelLogging`
- **作用：** 地图标注子系统的日志数据 — 追踪哪些标注被放置、冲突如何解决以及放置决策。
- **功能要点：** 标注放置分析、冲突追踪

#### `maps/shared/mapcore/testing/mctf/proto/metadata.proto`
- **包名：** `maps_shared.mapcore.testing`
- **消息：** `MctfMetadata`
- **作用：** MapCore 测试框架（MCTF）的测试元数据，支持自动化测试和渲染验证。
- **功能要点：** 自动化测试、渲染验证

---

## 13. 聚光灯 (`maps/spotlight/proto/`)

Spotlight 子系统为 Maps 上的实体详情卡片/知识面板体验提供动力。

#### `maps/spotlight/proto/spotlight-description.proto`
- **包名：** `maps_spotlight`
- **消息：** `SpotlightDescription`（主 spotlight 请求）、`ClientOptions`、`PersonalizedDataPersistenceKey`、`CrisisOptions`、`CrisisFilter`、`HotelOptions`、`ClientSpecifiedCrisis`
- **枚举：** `WaypointClass`（POINT、AREA）、`ClientType`（18 种类型：MOBILE_PHONE、DESKTOP、EARTH、ASSISTANT_TRAVEL 等）、`MapType`、`PersistenceDestination`、`EventType`（TROPICAL_STORM、EARTHQUAKE、FLOOD、WILDFIRE）
- **导入：** `geo/experience/proto/geo_experience_category.proto`、`maps/spotlight/proto/ads-layer-params.proto`、`maps/spotlight/proto/search-params.proto`、`maps/spotlight/proto/selected-item.proto`、`maps/spotlight/proto/spotlight-flags.proto`、`maps/tactile/api/ads-spotlight.proto`、`maps/tactile/api/directions-request.proto`、`maps/tactile/api/entity-details-common.proto`、`maps/tactile/api/geometry.proto`
- **作用：** 主要的 spotlight 描述 — 将实体详情、导航意图、搜索参数、广告配置、危机展示设置、酒店选项和室内楼层选择打包到一个统一的实体详情卡片请求中。
- **功能要点：** 实体详情卡片、知识面板、危机展示、酒店预订集成、从 spotlight 发起导航

#### `maps/spotlight/proto/entity-metadata.proto`
- **包名：** `maps_spotlight`
- **消息：** `EntityMetadata`
- **作用：** Spotlight 展示的实体元数据 — 携带实体类型、属性和展示配置。
- **功能要点：** 实体信息展示

#### `maps/spotlight/proto/spotlight-item-metadata.proto`
- **包名：** `maps_spotlight`
- **消息：** `SpotlightItemMetadata`
- **作用：** Spotlight 结果中每个项目的元数据 — 排序信号、展示提示和交互数据。
- **功能要点：** 项目级展示、排序信号

#### `maps/spotlight/proto/spotlight-flags.proto`
- **包名：** `maps_spotlight`
- **消息：** `SpotlightFlags`
- **作用：** 控制 spotlight 行为的功能标志 — 启用/禁用特定的 spotlight 功能和实验。
- **功能要点：** 功能标志、A/B 测试

#### `maps/spotlight/proto/search-params.proto`
- **包名：** `maps_spotlight`
- **消息：** `SearchParams`
- **作用：** 嵌入在 spotlight 请求中用于实体搜索和发现的搜索参数。
- **功能要点：** 实体搜索、spotlight 搜索集成

#### `maps/spotlight/proto/selected-item.proto`
- **包名：** `maps_spotlight`
- **消息：** `SelectedItem`
- **作用：** 表示用户在 spotlight 界面中选中的项目，追踪用户正在查看的实体。
- **功能要点：** 选择追踪、用户交互状态

#### `maps/spotlight/proto/ads-layer-params.proto`
- **包名：** `maps_spotlight`
- **消息：** `AdsLayerParams`
- **作用：** Spotlight 的广告层参数 — 控制广告在实体详情卡片中的展示方式。
- **功能要点：** Spotlight 广告、广告展示配置

#### `maps/spotlight/proto/ad-metadata.proto`
- **包名：** `maps_spotlight`
- **消息：** `AdMetadata`
- **作用：** Spotlight 实体的广告元数据 — 推广地点信息和广告素材数据。
- **功能要点：** 广告元数据、推广内容

#### `maps/spotlight/proto/alternate-id.proto`
- **包名：** `maps_spotlight`
- **消息：** `AlternateId`
- **作用：** Spotlight 实体的替代标识符 — 在不同 ID 系统之间进行映射（place_id、feature_id、mid）。
- **功能要点：** 实体 ID 解析、跨系统映射

#### `maps/spotlight/proto/directions.proto`
- **包名：** `maps_spotlight`
- **消息：** `SpotlightDirections`
- **作用：** 嵌入在 spotlight 中的路线信息 — 支持从实体详情卡片"获取路线"。
- **功能要点：** Spotlight 导航、从实体卡片发起路线规划

#### `maps/spotlight/proto/hotel-metadata.proto`
- **包名：** `maps_spotlight`
- **消息：** `HotelMetadata`
- **作用：** Spotlight 的酒店专用元数据 — 价格、可用性、设施和预订信息。
- **功能要点：** 酒店预订、价格展示

#### `maps/spotlight/proto/logging-metadata.proto`
- **包名：** `maps_spotlight`
- **消息：** `LoggingMetadata`
- **作用：** Spotlight 交互的日志元数据 — 展示追踪和用户参与分析。
- **功能要点：** Spotlight 分析、用户参与追踪

#### `maps/spotlight/proto/report-a-problem-metadata.proto`
- **包名：** `maps_spotlight`
- **消息：** `ReportAProblemMetadata`
- **作用：** Spotlight 中"报告问题"功能的元数据 — 允许用户举报错误信息。
- **功能要点：** 用户反馈、数据质量报告

---

## 14. 触觉层 (`maps/tactile/`)

Tactile 子系统是 Maps protobuf 模式中**最大**的（190 个文件），代表完整的 Maps 前端 API 接口。它涵盖：

- **路线规划** — 完整的路线请求/响应，包含航点、步骤、摘要、折线、停车、海拔
- **实体详情** — 地点信息、照片、视频、评价
- **搜索** — 搜索限制、参数
- **广告** — 广告横幅、推广标记、广告主操作
- **共享类型** — 几何、货币、日期、体验、要素 ID、停车、公交属性
- **酒店** — 预订、客房、价格、设施、行程
- **地点** — 比较数据、区域关系、地点预览
- **照片/视频** — 预览操作、渲染策略、富内容
- **电动汽车** — 充电站信息、充电可靠性、OEM 支付
- **汽车** — 导航的 EV 选项
- **公交** — 公交属性、车厢信息、长途选项
- **透传** — 被动辅助、出租车、已保存地点
- **URL** — 地点查找补充信息

### Tactile 核心 API

| 文件 | 包名 | 关键消息/枚举 | 作用 |
|------|---------|-------------------|------|
| `api/directions-request.proto` | `maps_tactile` | `DirectionsRequest`、`UpdateRouteParams`、`DirectionsWaypointSearchboxStats` | 主路线规划请求 — 航点、选项、spotlight、广告、公交模式匹配、路线更新 |
| `api/directions-common.proto` | `maps_tactile.directions` | `Distance`、`WaypointQuery`、`Options`、`SpotlightOptions`、`ViaPoint`、`TransitOptions`、`DrivingOptions` | 共享的路线类型 — 距离格式化、含多种查询类型的航点查询、各模式选项 |
| `api/directions-result-common.proto` | `maps_tactile.directions` | `DirectionsResult`、`Trip`、`TransitLeg`、`DrivingLeg`、`WalkingLeg`、`BicyclingLeg` | 路线结果容器 — 保存所有行程结果，包含每种出行方式的各段详情 |
| `api/directions-step.proto` | `maps_tactile.directions` | `Step`、`TransitStep`、`DrivingStep`、`WalkingStep`、`Maneuver` | 每步导航指令 — 逐向机动、公交上车、步行指引 |
| `api/directions-summary.proto` | `maps_tactile.directions` | `TripSummary`、`LegSummary` | 精简路线摘要 — 每个行程和段的总距离、持续时间和概览 |
| `api/directions-polyline.proto` | `maps_tactile.directions` | `Polyline`、`EncodedPolyline` | 地图上路线显示的折线数据 |
| `api/directions-on-demand-transportation.proto` | `maps_tactile.directions` | 按需交通类型 | 路线规划中网约车和共享单车的集成点 |
| `api/entity-details-common.proto` | `maps_tactile` | `Entity`、`EntityClass` | 核心实体定义 — 要素 ID、地点 ID、坐标、分类、交互属性 |
| `api/geometry.proto` | `maps_tactile` | `LatLng`、`LatLngRectangle`、`LatLngPolygon`、`RasterPoint`、`RasterRectangle` | 已弃用的几何类型 — 已被 shared/geom.proto 取代 |
| `api/photo-description.proto` | `maps_tactile` | `PhotoDescription`、`PhotoReference` | 照片元数据 — URL、尺寸、归属信息 |
| `api/video-preview.proto` | `maps_tactile` | `VideoPreview` | 地点的视频预览数据 — 缩略图、时长、播放 URL |
| `api/real-time-common.proto` | `maps_tactile` | 实时数据类型 | 实时数据显示的通用类型（实时繁忙程度、等待时间） |
| `api/scene-constants.proto` | `maps_tactile.scene` | `ContentType`、`ImagerySource`、`ImageryType`、`CoverPhotoType` | 场景/枚举常量 — 内容类型（MAP、PANO、PHOTO、SATELLITE、TOUR、VIDEO）、影像源和类型 |
| `api/camera-options.proto` | `maps_tactile` | `CameraOptions` | Tactile 请求中地图视口的摄像头配置 |
| `api/paint-description-options.proto` | `maps_tactile` | `PaintDescriptionOptions` | 控制 Tactile 响应中绘制/渲染瓦片描述方式的选项 |
| `api/request-context.proto` | `maps_tactile` | `RequestContext` | 请求级上下文 — IP、语言、地理位置、实验 |
| `api/logging-params.proto` | `maps_tactile` | `LoggingParams` | Tactile API 调用的日志参数配置 |
| `api/logged-feature.proto` | `maps_tactile` | `LoggedFeature` | 已记录的地图要素 — 捕获用户与哪些要素发生了交互 |
| `api/logged-link.proto` | `maps_tactile` | `LoggedLink` | 已记录的交互链接 — 捕获用户点击地图链接的操作 |
| `api/url-options.proto` | `maps_tactile` | `UrlOptions` | 可分享地图链接的 URL 生成选项 |
| `api/traffic.proto` | `maps_tactile` | 交通相关消息 | Tactile 显示的交通数据 — 拥堵着色和事故标记 |
| `api/ads-params.proto` | `maps_tactile` | `AdsParams` | Tactile API 请求的广告参数 |
| `api/ads-spotlight.proto` | `maps_tactile` | `AdsEntity` | Spotlight/Tactile 集成的广告实体数据 |
| `api/search-restrict-enums.proto` | `maps_tactile` | 搜索限制枚举 | 搜索过滤和限制的枚举类型 |
| `api/search-restrict-params.proto` | `maps_tactile` | `SearchRestrictParams` | 搜索限制的参数结构 |

### Tactile API — 路线规划子消息

| 文件 | 包名 | 关键消息/枚举 | 作用 |
|------|---------|-------------------|------|
| `api/directions/address.proto` | `maps_tactile.directions` | `Address` | 航点和目的地的结构化地址 |
| `api/directions/destination-landmark.proto` | `maps_tactile.directions` | `DestinationLandmark` | 目的地识别的地标信息 |
| `api/directions/elevation-profile.proto` | `maps_tactile.directions` | `ElevationProfile` | 路线沿线海拔数据，用于海拔剖面图展示 |
| `api/directions/parking-planner.proto` | `maps_tactile.directions` | `ParkingPlanner` | 目的地附近的停车可用性和建议 |
| `api/directions/query-correction.proto` | `maps_tactile.directions` | `QueryCorrection` | 路线的查询纠错/拼写建议 |
| `api/directions/related-location.proto` | `maps_tactile.directions` | `RelatedLocation` | 路线的相关/替代位置 |
| `api/directions/traffic-report-prompt.proto` | `maps_tactile.directions` | `TrafficReportPrompt` | 交互式导航的交通报告提示 |
| `api/directions/trip-update-action.proto` | `maps_tactile.directions` | `TripUpdateAction` | 导航过程中可用的行程更新操作 |
| `api/directions/waypoint-location.proto` | `maps_tactile.directions` | `WaypointLocation` | 已解析的航点位置，带有吸附坐标 |
| `api/directions/waypoint-result.proto` | `maps_tactile.directions` | `WaypointResult` | 路线响应中的每个航点结果数据 |
| `api/directions/zone-info.proto` | `maps_tactile.directions` | `ZoneInfo` | 航点和路线的区域/时区信息 |

### Tactile API — 共享类型

| 文件 | 包名 | 关键消息/枚举 | 作用 |
|------|---------|-------------------|------|
| `api/shared/common.proto` | `maps_tactile` | `LocalizationContext`、`BuildingLevel`、`AliasId`、`Alias`、`DisplayCount`、`SuggestIconType`、`DistanceUnits` | 核心共享类型 — 本地化、别名、图标类型、显示计数 |
| `api/shared/ads.proto` | `maps_tactile.shared` | `PlacesheetCreativeFormat`、`AdSubType`、`ATTManagerAuthorizationStatus` | 广告类型和授权枚举 |
| `api/shared/alias.proto` | `maps_tactile.shared` | `AliasType` enum | 别名类型分类（家、工作、自定义） |
| `api/shared/android-intent.proto` | `maps_tactile.shared` | `AndroidIntent` | 用于深度链接的 Android intent 规范 |
| `api/shared/augmented-reality-geometry.proto` | `maps_tactile.shared` | `ARGeometry` | AR 地图显示的几何类型 |
| `api/shared/caching/caching.proto` | `maps_tactile.shared` | `CacheConfig` | Tactile 数据的缓存配置 |
| `api/shared/crisis-user-mode.proto` | `maps_tactile.shared` | `CrisisUserMode` | 危机事件期间的用户模式选择 |
| `api/shared/date-time.proto` | `maps_tactile.shared` | `DateTime`、`DateTimeRange` | 营业时间、事件的日期/时间表示 |
| `api/shared/ev-info.proto` | `maps_tactile.shared` | `EvInfo` | 电动汽车信息（充电可用性） |
| `api/shared/experience-category.proto` | `maps_tactile.shared` | `ExperienceCategory` | 体验类别分类 |
| `api/shared/experiences.proto` | `maps_tactile.shared` | `Experiences` | 地图上用户体验的集合 |
| `api/shared/feature-id.proto` | `maps_tactile.shared` | `FeatureId` | 要素标识类型 |
| `api/shared/geo-wholepage-type.proto` | `maps_tactile.shared` | `GeoWholepageType` | 地理全页类型分类 |
| `api/shared/geometry-3d.proto` | `maps_tactile.shared` | 3D 几何类型 | 3D 坐标和包围体类型 |
| `api/shared/geometry.proto` | `maps_tactile.shared` | 2D 几何类型 | 2D 坐标和形状类型 |
| `api/shared/logging-common.proto` | `maps_tactile.shared` | 共享日志类型 | Tactile 的通用日志结构 |
| `api/shared/map-label.proto` | `maps_tactile.shared` | `MapLabel` | Tactile 显示的地图标注数据 |
| `api/shared/map-state-enums.proto` | `maps_tactile.shared` | 地图状态枚举 | 地图交互状态类型 |
| `api/shared/maps-activity-persistence-keys.proto` | `maps_tactile.shared` | `PersistenceKeys` | 持久化地图活动状态的键 |
| `api/shared/maps-activity-place-list-common.proto` | `maps_tactile.shared` | 地点列表通用类型 | 活动地点列表的共享类型 |
| `api/shared/money.proto` | `maps_tactile.shared` | `Money` | 货币值表示（币种 + 金额） |
| `api/shared/occupancy-status.proto` | `maps_tactile.shared` | `OccupancyStatus` | 地点实时占用/繁忙程度数据 |
| `api/shared/offering/offering-contribution.proto` | `maps_tactile.shared` | `OfferingContribution` | 用户的商品贡献数据 |
| `api/shared/parking-enums.proto` | `maps_tactile.shared` | 停车枚举 | 停车类型和可用性枚举 |
| `api/shared/parking.proto` | `maps_tactile.shared` | `Parking` | 停车信息 — 位置、类型、定价 |
| `api/shared/passiveassist/passiveassist.proto` | `maps_tactile.shared` | `PassiveAssist` | 被动辅助数据 — 主动建议 |
| `api/shared/platform-intent.proto` | `maps_tactile.shared` | `PlatformIntent` | 平台特定的 intent 处理 |
| `api/shared/position.proto` | `maps_tactile.shared` | `Position` | 位置/追踪数据类型 |
| `api/shared/promoted-pin-ads.proto` | `maps_tactile.shared` | `PromotedPinAdsRequestOptions` | 推广标记广告请求选项 |
| `api/shared/public-list.proto` | `maps_tactile.shared` | `PublicList` | 公开/共享列表数据 |
| `api/shared/query-suggestion.proto` | `maps_tactile.shared` | `QuerySuggestion` | 搜索查询建议类型 |
| `api/shared/real-time-data-type.proto` | `maps_tactile.shared` | 实时数据类型枚举 | 可用的实时数据类型 |
| `api/shared/road-priority.proto` | `maps_tactile.shared` | `RoadPriority` | 道路优先级分类 |
| `api/shared/savedplaces/saved-places-client-id.proto` | `maps_tactile.shared` | `SavedPlacesClientId` | 已保存地点的客户端标识 |
| `api/shared/serialized-data-reference.proto` | `maps_tactile.shared` | `SerializedDataReference` | 序列化数据块的引用 |
| `api/shared/taxi/taxi.proto` | `maps_tactile.shared` | `Taxi` | 出租车服务信息 |
| `api/shared/thumbs-vote.proto` | `maps_tactile.shared` | `ThumbsVote` | 点赞/踩投票数据 |
| `api/shared/user-incident-report.proto` | `maps_tactile.shared` | `UserIncidentReport` | 用户提交的事故报告 |
| `api/shared/webmaps-enums.proto` | `maps_tactile.shared` | Web Maps 枚举 | Web 特定的地图显示枚举 |

### Tactile API — 路线规划共享层

| 文件 | 包名 | 关键消息/枚举 | 作用 |
|------|---------|-------------------|------|
| `api/shared/directions/assisted-driving-options.proto` | `maps_tactile.shared.directions` | `AssistedDrivingOptions` | 路线的辅助驾驶配置 |
| `api/shared/directions/directions-client-stats.proto` | `maps_tactile.shared.directions` | 客户端统计包装器 | Tactile 的路线客户端统计 |
| `api/shared/directions/directions-constants.proto` | `maps_tactile.shared.directions` | 路线常量 | 路线的枚举和常量 |
| `api/shared/directions/dynamic-closure-options.proto` | `maps_tactile.shared.directions` | `DynamicClosureOptions` | 动态道路封闭处理选项 |
| `api/shared/directions/elevation-category.proto` | `maps_tactile.shared.directions` | `ElevationCategory` | 路线的海拔分类 |
| `api/shared/directions/elevation-description.proto` | `maps_tactile.shared.directions` | `ElevationDescription` | 文本海拔描述（多山、平坦等） |
| `api/shared/directions/energy-usage-summary.proto` | `maps_tactile.shared.directions` | `EnergyUsageSummary` | 路线的 EV 能耗摘要 |
| `api/shared/directions/fare.proto` | `maps_tactile.shared.directions` | `Fare` | 公交票价信息 |
| `api/shared/directions/image-options.proto` | `maps_tactile.shared.directions` | `ImageOptions` | 路线的图像渲染选项 |
| `api/shared/directions/monetary-cost-range.proto` | `maps_tactile.shared.directions` | `MonetaryCostRange` | 路线的费用区间（最小-最大） |
| `api/shared/directions/monetary-cost.proto` | `maps_tactile.shared.directions` | `MonetaryCost` | 路线的精确费用 |
| `api/shared/directions/opaque-trip-option.proto` | `maps_tactile.shared.directions` | `OpaqueTripOption` | 不透明的行程选项数据 |
| `api/shared/directions/opaque-trip-options.proto` | `maps_tactile.shared.directions` | `OpaqueTripOptions` | 不透明行程选项的集合 |
| `api/shared/directions/parking-summary.proto` | `maps_tactile.shared.directions` | `ParkingSummary` | 目的地的停车可用性摘要 |
| `api/shared/directions/problem-type.proto` | `maps_tactile.shared.directions` | `ProblemType` | 路线的问题类型分类 |
| `api/shared/directions/recommended-filtering-results.proto` | `maps_tactile.shared.directions` | `RecommendedFilteringResults` | 推荐路线过滤结果 |
| `api/shared/directions/retrieval-client.proto` | `maps_tactile.shared.directions` | `RetrievalClient` | 路线检索的客户端信息 |
| `api/shared/directions/road-stretch.proto` | `maps_tactile.shared.directions` | `RoadStretch` | 命名路段信息（例如 "I-5"、"Highway 101"） |
| `api/shared/directions/roadside-facility-options.proto` | `maps_tactile.shared.directions` | `RoadsideFacilityOptions` | 沿路路边设施搜索（加油站、餐饮、休息区） |
| `api/shared/directions/toll-price-options.proto` | `maps_tactile.shared.directions` | `TollPriceOptions` | 路线的收费价格展示选项 |
| `api/shared/directions/traffic-report-problem-alert-config.proto` | `maps_tactile.shared.directions` | `TrafficReportProblemAlertConfig` | 交通报告问题警报配置 |
| `api/shared/directions/transit-trip-result-display-style.proto` | `maps_tactile.shared.directions` | `TransitTripResultDisplayStyle` | 公交结果的展示样式选项 |
| `api/shared/directions/voice-guidance-options.proto` | `maps_tactile.shared.directions` | `VoiceGuidanceOptions` | 导航的语音引导配置 |

### Tactile API — 酒店

| 文件 | 包名 | 关键消息/枚举 | 作用 |
|------|---------|-------------------|------|
| `api/shared/hotels/annotation-ranking.proto` | `maps_tactile.shared.hotels` | `AnnotationRanking` | 酒店标注排名，用于展示 |
| `api/shared/hotels/hotel-amenity.proto` | `maps_tactile.shared.hotels` | `HotelAmenity` | 酒店设施枚举（泳池、健身房、WiFi 等） |
| `api/shared/hotels/hotel-aspect-type.proto` | `maps_tactile.shared.hotels` | `HotelAspectType` | 评价的酒店方面分类 |
| `api/shared/hotels/hotel-booking-disclosure.proto` | `maps_tactile.shared.hotels` | `HotelBookingDisclosure` | 预订披露/费用信息 |
| `api/shared/hotels/hotel-booking-options.proto` | `maps_tactile.shared.hotels` | `HotelBookingOptions` | 酒店预订配置选项 |
| `api/shared/hotels/hotel-booking.proto` | `maps_tactile.shared.hotels` | `HotelBooking` | 完整的酒店预订数据结构 |
| `api/shared/hotels/hotel-map-layer-options.proto` | `maps_tactile.shared.hotels` | `HotelMapLayerOptions` | 酒店的地图图层展示选项 |
| `api/shared/hotels/itinerary.proto` | `maps_tactile.shared.hotels` | `Itinerary` | 含酒店住宿的旅行行程 |
| `api/shared/hotels/lodging-type.proto` | `maps_tactile.shared.hotels` | `LodgingType` | 住宿类型分类（酒店、汽车旅馆、度假村等） |
| `api/shared/hotels/maps-live-query-config.proto` | `maps_tactile.shared.hotels` | `MapsLiveQueryConfig` | 酒店定价的实时查询配置 |
| `api/shared/hotels/maps-live-query-result.proto` | `maps_tactile.shared.hotels` | `MapsLiveQueryResult` | 酒店可用性的实时查询结果 |
| `api/shared/hotels/rate-features.proto` | `maps_tactile.shared.hotels` | `RateFeatures` | 价格特性详情（免费取消、含早餐等） |
| `api/shared/hotels/room-cluster.proto` | `maps_tactile.shared.hotels` | `RoomCluster` | 酒店展示的客房聚类 |
| `api/shared/hotels/room.proto` | `maps_tactile.shared.hotels` | `Room` | 单个客房规格 |
| `api/shared/hotels/vacation-rental-attributes.proto` | `maps_tactile.shared.hotels` | `VacationRentalAttributes` | 度假租赁的特定属性 |

### Tactile API — 地点数据

| 文件 | 包名 | 关键消息/枚举 | 作用 |
|------|---------|-------------------|------|
| `api/shared/place/cost-details.proto` | `maps_tactile.shared.place` | `CostDetails` | 地点的费用/价格级别详情 |
| `api/shared/place/map-rendering-data.proto` | `maps_tactile.shared.place` | `MapRenderingData` | 地点的地图专用渲染数据 |
| `api/shared/place/maps-place-identifier.proto` | `maps_tactile.shared.place` | `MapsPlaceIdentifier` | 多系统地点标识 |
| `api/shared/place/place-comparison-attribute-ui-style.proto` | `maps_tactile.shared.place` | `PlaceComparisonAttributeUiStyle` | 地点比较属性的 UI 样式 |
| `api/shared/place/place-comparison-badge-type.proto` | `maps_tactile.shared.place` | `PlaceComparisonBadgeType` | 地点比较的徽章类型 |
| `api/shared/place/place-comparison-data-options.proto` | `maps_tactile.shared.place` | `PlaceComparisonDataOptions` | 地点比较数据的选项 |
| `api/shared/place/place-comparison-data.proto` | `maps_tactile.shared.place` | `PlaceComparisonData` | 完整的地点比较数据 |
| `api/shared/place/regional-relation-info.proto` | `maps_tactile.shared.place` | `RegionalRelationInfo` | 区域关系信息 |
| `api/shared/place/regional-relation.proto` | `maps_tactile.shared.place` | `RegionalRelation` | 区域关系（例如城市属于某个州） |

### Tactile API — 地点预览

| 文件 | 包名 | 关键消息/枚举 | 作用 |
|------|---------|-------------------|------|
| `api/shared/placepreview/additional-cuisine-info.proto` | `maps_tactile.shared.placepreview` | `AdditionalCuisineInfo` | 菜系专用的预览信息 |
| `api/shared/placepreview/cost-options.proto` | `maps_tactile.shared.placepreview` | `CostOptions` | 预览的费用级别展示选项 |
| `api/shared/placepreview/photo-preview-options.proto` | `maps_tactile.shared.placepreview` | `PhotoPreviewOptions` | 照片预览配置 |
| `api/shared/placepreview/photo-preview.proto` | `maps_tactile.shared.placepreview` | `PhotoPreview` | 照片预览数据结构 |
| `api/shared/placepreview/place-preview-field-mask.proto` | `maps_tactile.shared.placepreview` | `PlacePreviewFieldMask` | 选择性地点预览加载的字段掩码 |
| `api/shared/placepreview/place-preview.proto` | `maps_tactile.shared.placepreview` | `PlacePreview` | 完整的地点预览数据 |
| `api/shared/placepreview/scalable-attribute-options.proto` | `maps_tactile.shared.placepreview` | `ScalableAttributeOptions` | 可扩展属性展示选项 |

### Tactile API — 照片/视频

| 文件 | 包名 | 关键消息/枚举 | 作用 |
|------|---------|-------------------|------|
| `api/shared/photo/experiment-cohort.proto` | `maps_tactile.shared.photo` | `ExperimentCohort` | 照片功能的实验组 |
| `api/shared/photo/photo-preview-action-type.proto` | `maps_tactile.shared.photo` | `PhotoPreviewActionType` | 照片预览的操作类型 |
| `api/shared/photo/photo-preview-action.proto` | `maps_tactile.shared.photo` | `PhotoPreviewAction` | 照片预览操作定义 |
| `api/shared/photo/render-strategy.proto` | `maps_tactile.shared.photo` | `RenderStrategy` | 照片渲染策略选项 |
| `api/shared/photo/rich-content-data.proto` | `maps_tactile.shared.photo` | `RichContentData` | 嵌入照片的富内容数据 |
| `api/shared/photo/suggested-video-info.proto` | `maps_tactile.shared.photo` | `SuggestedVideoInfo` | 推荐视频内容信息 |

### Tactile API — 公交

| 文件 | 包名 | 关键消息/枚举 | 作用 |
|------|---------|-------------------|------|
| `api/shared/transit/carriage-info.proto` | `maps_tactile.shared.transit` | `CarriageInfo` | 列车车厢/车辆信息 |
| `api/shared/transit/long-distance-options.proto` | `maps_tactile.shared.transit` | `LongDistanceOptions` | 长途公交选项 |
| `api/shared/transit/transit-attribute-display-info.proto` | `maps_tactile.shared.transit` | `TransitAttributeDisplayInfo` | 公交属性的展示信息 |
| `api/shared/transit/transit-attribute-identifier.proto` | `maps_tactile.shared.transit` | `TransitAttributeIdentifier` | 公交属性的标识符 |
| `api/shared/transit/transit-attribute-status.proto` | `maps_tactile.shared.transit` | `TransitAttributeStatus` | 公交属性的状态 |
| `api/shared/transit/transit-attribute-value.proto` | `maps_tactile.shared.transit` | `TransitAttributeValue` | 公交属性的值 |
| `api/shared/transit/transit-logging-context.proto` | `maps_tactile.shared.transit` | `TransitLoggingContext` | 公交交互的日志上下文 |
| `api/shared/transit/transit-service-query.proto` | `maps_tactile.shared.transit` | `TransitServiceQuery` | 公交服务查询参数 |

### Tactile API — EV 与汽车

| 文件 | 包名 | 关键消息/枚举 | 作用 |
|------|---------|-------------------|------|
| `api/shared/automotive/electric-vehicle-options.proto` | `maps_tactile.shared.automotive` | `ElectricVehicleOptions` | EV 专用路线选项 |
| `api/shared/ev/ev-station-reliability.proto` | `maps_tactile.shared.ev` | `EvStationReliability` | EV 充电站可靠性评分 |
| `api/shared/ev/oem-payment-id.proto` | `maps_tactile.shared.ev` | `OemPaymentId` | EV 充电的 OEM 支付标识 |
| `api/shared/ev/predicted-availability-per-eta.proto` | `maps_tactile.shared.ev` | `PredictedAvailabilityPerEta` | 预估到达时间时的充电桩可用性预测 |

### Tactile API — 广告共享层

| 文件 | 包名 | 关键消息/枚举 | 作用 |
|------|---------|-------------------|------|
| `api/shared/ads/ad-banner.proto` | `maps_tactile.shared.ads` | `AdBanner` | 广告横幅素材数据 |
| `api/shared/ads/ads-cache-info.proto` | `maps_tactile.shared.ads` | `AdsCacheInfo` | 广告缓存配置 |
| `api/shared/ads/advertiser-preferred-action.proto` | `maps_tactile.shared.ads` | `AdvertiserPreferredAction` | 广告主的首选操作 |
| `api/shared/ads/map-ads-request-context.proto` | `maps_tactile.shared.ads` | `MapAdsRequestContext` | 地图广告的广告请求上下文 |
| `api/shared/ads/placesheet-ad-type.proto` | `maps_tactile.shared.ads` | `PlacesheetAdType` | 地点卡片广告类型分类 |
| `api/shared/ads/product-offer-list-ad.proto` | `maps_tactile.shared.ads` | `ProductOfferListAd` | 产品推荐列表广告 |
| `api/shared/ads/promoted-pin-ads-callout-info.proto` | `maps_tactile.shared.ads` | `PromotedPinAdsCalloutInfo` | 推广标记广告的呼出信息 |

### Tactile API — 地图上&图层

| 文件 | 包名 | 关键消息/枚举 | 作用 |
|------|---------|-------------------|------|
| `api/onmap/on-map-impression-enums.proto` | `maps_tactile.onmap` | `OnMapImpressionEnums` | 地图上元素的展示追踪枚举 |
| `api/shared/layer/map-layer-type.proto` | `maps_tactile.shared.layer` | `MapLayerType` | 地图图层类型分类 |
| `api/shared/internal/mendel-options.proto` | `maps_tactile.shared.internal` | `MendelOptions` | 内部 Mendel 实验选项 |

### Tactile URL

| 文件 | 包名 | 关键消息/枚举 | 作用 |
|------|---------|-------------------|------|
| `url/proto/place-lookup-supplemental-info.proto` | `maps_tactile.url` | `PlaceLookupSupplementalInfo` | 地点 URL 查找的补充信息 |

---

## 15. 公交 (`maps/transit/`)

#### `maps/transit/api/transit_options.proto`
- **包名：** `maps_transit.api`
- **消息：** `TransitOptions`、`NonTransitOptions`、`NonTransitLegOptions`、`LongDistanceOptions`、`PatagoniaOptions`、`RequestedEntities`、`StationSelectionMethod`
- **枚举：** `BooleanOption`（25+ 值：PREFER_ACCESSIBLE、PREFER_CHEAPER、AVOID_BUS、DISALLOW_TRAIN 等）、`TimeAnchoring`（DEPARTURE、ARRIVAL、LAST_AVAILABLE、CALENDAR）、`StationSelectionMethod`（8 个值）、`TransitApi`、`ForceTravelTransportPrice`
- **导入：** 11+ 个导入，涵盖票价、输入时间、非公交模式、个性化、路线信号、成本模型、预订
- **作用：** 全面的公交路线选项 — 车辆偏好（避免/排除火车、公交、地铁、渡轮）、无障碍偏好、票价类型、时间锚定、站点选择策略、带有旅行交通预订集成的长途选项以及 Patagonia 行程扩展选项。
- **功能要点：** 公交路线规划、无障碍路线规划、票价计算、长途火车/公交、站点个性化、预订集成

#### `maps/transit/api/fare.proto`
- **包名：** `maps_transit.api`
- **消息：** `Fare`
- **作用：** 公交票价数据结构 — 价格、币种、票价类型和有效期。
- **功能要点：** 公交票价、跨机构票价计算

#### `maps/transit/api/input_time.proto`
- **包名：** `maps_transit.api`
- **消息：** `InputTime`
- **作用：** 公交查询的时间规范 — 出发/到达时间，含时区处理。
- **功能要点：** 时间感知路线规划、出发/到达排程

#### `maps/transit/api/non_transit_mode.proto`
- **包名：** `maps_transit.api`
- **消息：** `NonTransitMode`
- **枚举：** `Mode`（WALK、BIKE、CAR、TAXI 等）
- **作用：** 公交行程段组合的非公交出行方式枚举。
- **功能要点：** 多模态公交、首/末公里选项

#### `maps/transit/api/personalization.proto`
- **包名：** `maps_transit.api`
- **消息：** `PersonalizedOptions`
- **作用：** 公交路线规划的个性化数据 — 用户偏好、常用站点、偏好线路。
- **功能要点：** 个性化公交、用户偏好学习

#### `maps/transit/api/result_label.proto`
- **包名：** `maps_transit.api`
- **消息：** `ResultLabel`
- **作用：** UI 中显示的公交行程结果标签/描述。
- **功能要点：** 公交结果展示、路线描述

#### `maps/transit/api/routing_signals.proto`
- **包名：** `maps_transit.api`
- **消息：** `RoutingSignals`
- **作用：** 公交的细粒度路线信号 — 实时延迟、拥挤度、可靠性评分。
- **功能要点：** 实时公交、拥挤度数据、可靠性评分

#### `maps/transit/api/time.proto`
- **包名：** `maps_transit.api`
- **消息：** `Time`
- **作用：** 公交调度的时间表示 — 支持相对和绝对时间规范。
- **功能要点：** 公交调度、时间计算

#### `maps/transit/api/transit_entity_description.proto`
- **包名：** `maps_transit.api`
- **消息：** `TransitEntityDescription`
- **作用：** 公交实体的描述（机构、路线、站点），用于在搜索和路线结果中展示。
- **功能要点：** 公交实体展示、机构/路线元数据

#### `maps/transit/api/transit_logging_context.proto`
- **包名：** `maps_transit.api`
- **消息：** `TransitLoggingContext`
- **作用：** 公交交互的日志上下文 — 捕获站点选择、路线查看和行程规划操作。
- **功能要点：** 公交分析、交互追踪

#### `maps/transit/tripfinder/common/cost_model.proto`
- **包名：** `maps_transit.tripfinder`
- **消息：** `CostModelProto`
- **作用：** 公交行程查找器的成本模型 — 步行、等待、换乘和乘车时间的权重。
- **功能要点：** 公交成本建模、行程优化

---

## 16. 工具 (`maps/util/`)

#### `maps/util/geometry-transform.proto`
- **包名：** `maps_util`
- **消息：** `Transform3D`（缩放、旋转、平移向量）
- **导入：** `storage/datapol/annotations`
- **作用：** 地图几何的 3D 仿射变换 — 用于 3D 地图元素定位和 GLTF 模型放置的缩放、旋转和平移分量。
- **功能要点：** 3D 变换、模型放置、坐标系统转换

#### `maps/util/tile_coordinate.proto`
- **包名：** `maps_util`
- **消息：** `TileCoordinate`
- **作用：** 瓦片坐标系统 — x、y、缩放级别，用于在全局瓦片方案中标识特定地图瓦片。
- **功能要点：** 瓦片寻址、坐标系统

#### `maps/util/tile_bitmap.proto`
- **包名：** `maps_util`
- **消息：** `TileBitmap`
- **作用：** 瓦片位图数据结构 — 栅格地图瓦片的编码图像数据。
- **功能要点：** 栅格瓦片编码、图像数据传输

---

## 17. 通用层 (`maps/versatile/proto/`)

Versatile 子系统定义了用于瓦片生成和渲染的**内部矢量地图数据格式**。

#### `maps/versatile/proto/vector-feature.proto`
- **包名：** `maps_versatile`
- **消息：** `VectorFeatureProto`、`FeatureNameProto`、`FeatureNameTranslation`、`IndoorLevelMetadata`、`FeatureDebugInfo`、`ElectricVehicleChargingStationMetadata`、`AnnotationAttribute`
- **导入：** 20+ 个导入，来自 geostore、数据绑定值、message_set
- **作用：** 核心的矢量要素表示 — 携带要素 ID、名称（多语言）、类型类别、地理边界、建筑数据、室内楼层、EV 充电站元数据、营业时间、时区和标注属性。这是要素的权威源格式，将被转换为客户端瓦片。
- **功能要点：** 矢量地图要素、多语言名称、室内地图、EV 充电、数据绑定、标注属性

#### `maps/versatile/proto/vector-render-op.proto`
- **包名：** `maps_versatile`
- **消息：** `VectorRenderOpProto`、`LabelCandidateSet`、`LabelCandidate`、`LabelPosition`、`TextDescription`、`VectorLabelProto`、`MeshProto`、`GltfModelProto`、`InstanceModelProto`、`Polyline3DProto`、`Mesh3DProto`、`PointProto`、`ExtrudedAreaProto`、`RasterProto`（+ 多种嵌套位置/样式消息）
- **枚举：** `Type`（POLYLINE、POLYGON、MESH、POINT、LABEL_CANDIDATE、PLACED_LABEL、RASTER、EXTRUDED_AREA、SHADER_DATA、GLTF_MODEL、INSTANCE_MODEL、POLYLINE_3D、MESH_3D、TILE_BACKGROUND）
- **导入：** `maps/paint/proto/interactivity.proto`、`maps/paint/proto/label-representation-tag.proto`、`maps/util/geometry-transform.proto`、`maps/versatile/proto/data-bound-value.proto`、`maps/versatile/proto/experimental_render_op_enums.proto`、`maps/versatile/proto/intent.proto`、`maps/versatile/proto/vector-feature.proto`、`maps/versatile/proto/vector-snapping.proto`、`maps/versatile/proto/vector-style.proto`
- **作用：** 完整的渲染操作定义 — 地图上的每个视觉元素都表示为一个渲染操作（折线、面、网格、标注、栅格、3D 模型、挤出区域）。包括具有定位策略、文本换行、密度控制和实验性 A/B 测试支持的复杂标注候选系统。
- **功能要点：** 渲染操作、3D 模型（GLTF）、挤出建筑、标注放置引擎、实验性渲染、增量地图投放、数据绑定样式

#### `maps/versatile/proto/vector-style.proto`
- **包名：** `maps_versatile`
- **消息：** `VectorStyleProto`
- **作用：** 矢量渲染操作的样式定义 — 颜色、描边、填充、图案、图标和文本样式。
- **功能要点：** 矢量样式、图标渲染、文本样式

#### `maps/versatile/proto/vector-snapping.proto`
- **包名：** `maps_versatile`
- **消息：** `GeometrySnapParameters`、`GeometryProjectionParameters`
- **作用：** 矢量几何的吸附配置 — 控制标注和点如何吸附到道路、建筑和地形。
- **功能要点：** 几何吸附、标注到道路的对齐

#### `maps/versatile/proto/vector-annotation.proto`
- **包名：** `maps_versatile`
- **消息：** `VectorAnnotation`
- **作用：** 附加到矢量要素的标注数据 — 用于展示、交互和日志的附加元数据。
- **功能要点：** 矢量标注、要素丰富化

#### `maps/versatile/proto/annotation-enums.proto`
- **包名：** `maps_versatile`
- **枚举：** 标注相关枚举
- **作用：** 矢量标注的枚举类型 — 类别、展示模式和交互类型。
- **功能要点：** 标注类型化、展示类别

#### `maps/versatile/proto/data-bound-value.proto`
- **包名：** `maps_versatile`
- **消息：** `DataBoundValue`、`DataBindingKey`
- **作用：** 数据绑定值系统 — 允许渲染样式引用运行时数据（交通、天气、用户偏好）以实现动态地图渲染。
- **功能要点：** 数据驱动渲染、动态样式

#### `maps/versatile/proto/experimental_render_op_enums.proto`
- **包名：** `maps_versatile`
- **消息：** `ExperimentalRenderOpTriggerId`
- **作用：** 实验性渲染操作的触发 ID — 支持在渲染操作级别对渲染功能进行 A/B 测试。
- **功能要点：** 渲染实验、A/B 测试触发器

#### `maps/versatile/proto/intent.proto`
- **包名：** `maps_versatile`
- **消息：** `IntentProto`
- **作用：** 渲染操作的意图分类 — 识别渲染操作的语义目的（例如导航、探索、搜索结果等）。
- **功能要点：** 语义渲染、意图驱动展示

#### `maps/versatile/proto/rendering-category.proto`
- **包名：** `maps_versatile`
- **消息：** `RenderingCategory`
- **作用：** 渲染类别分类 — 将渲染操作分组到逻辑类别中，用于样式应用和显示控制。
- **功能要点：** 渲染分类、样式定向

---

## 跨领域功能要点总结

### 架构与核心基础设施
- **共享几何**（`maps/shared/common/geom/geom.proto`）：Camera、Location、Rotation — 通用词汇表
- **矢量要素格式**（`maps/versatile/`）：所有地图要素的内部表示
- **渲染引擎**（`maps/paint/`）：瓦片生成、样式系统、标注引擎、输出管道
- **客户端瓦片格式**（`maps/paint/proto/client-vector-tile.proto`）：面向移动端/Web 的 GPU 高效格式

### 导航与路线规划
- **路线查找**（`maps/pathfinder/`）：基于 CRP 的引擎，包含替代路线、EV 路由、辅助驾驶
- **路线 API**（`maps/tactile/api/directions-*.proto`）：完整的请求/响应循环
- **MRP**（`maps/directions/mrp/`）：多路线规划，包含成本函数和风险感知路由
- **收费**（`maps/directions/tolls/`）：个性化收费计算
- **交通**（`maps/roadtraffic/`）：ML 驱动的交通模型（TRAFFIC2VEC）

### 用户体验
- **实体详情卡片**（`maps/spotlight/`）：知识面板，包含广告、危机、酒店
- **室内地图**（`maps/indoor/`）：多层建筑，支持交互实体
- **酒店预订**（`maps/tactile/api/shared/hotels/`）：14 个文件涵盖客房、价格、设施、预订
- **照片/视频**（`maps/tactile/api/shared/photo/`）：富媒体展示和预览
- **地点比较**（`maps/tactile/api/shared/place/`）：并排地点比较
- **地点预览**（`maps/tactile/api/shared/placepreview/`）：地点信息快速预览

### 商业化
- **广告**（`maps/tactile/api/shared/ads/`）：7 个文件涵盖横幅、推广标记、广告主操作
- **推广地点**（`maps/paint/proto/promoted-place-*.proto`）：广告展示和导航追踪
- **LIMO**（`maps/limo/`）：本地库存地图入驻

### 专业功能
- **危机地图**（`maps/crisis/`、`maps/spotlight/`）：30+ 种危机类型，附带专用展示
- **EV 生态系统**（`maps/tactile/api/shared/ev/`）：充电站可靠性、OEM 支付、可用性预测
- **动态事件**（`maps/dynamicworld/`）：50+ 种事件类别，用于真实世界事件叠加
- **无障碍**（`maps/paint/proto/accessibility-metadata.proto`）：轮椅无障碍路线和入口
- **辅助驾驶**（`maps/pathfinder/autonomous/`）：ADAS 感知路线规划
- **可持续性**（`maps/pathfinder/client/find-path-input.proto`）：节能路线标签
- **长途公交**（`maps/transit/`、`maps/tactile/api/shared/transit/`）：城际火车、公交、预订集成

### 分析与实验
- **客户端统计**（`maps/directions/proto/directions_client_stats.proto`）：35 个客户端 × 47 个上下文 × 4 个平台
- **日志**（`maps/paint/proto/*-logging-*.proto`、`maps/shared/`）：全面的交互追踪
- **实验**（`maps/pathfinder/client/experiments.proto`、`maps/versatile/proto/experimental_render_op_enums.proto`）：跨路线规划和渲染的 A/B 测试
- **Gemini/AI 集成**：GEMINI_MAPS_EXTENSION、ASK_MAPS、GEMINI_MAPS_OFFLINE_EVALS 客户端

---

> **分析完成。** 已记录 344 个 `.proto` 文件，覆盖 17 个主要子系统，涵盖完整的 Google Maps 协议缓冲区模式 — 从核心几何到渲染、路线规划、商业化，再到室内地图、危机响应和自动驾驶支持等专业功能。
