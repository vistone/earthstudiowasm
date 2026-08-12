# Earth Studio WASM — 完整架构分析索引

> [English](./INDEX.md) | 中文版

对全部 1,316 个 Google 官方 Proto 文件的深度分析。
包含 5 份分析报告，共计 6,048 行。

---

## 分析报告

| # | 报告 | 行数 | 领域 |
|---|---|---|---|
| 1 | [geo-earth-analysis_zh.md](./geo-earth-analysis_zh.md) ([英文](./geo-earth-analysis.md)) | 1,016 | Google Earth Studio 核心（159 个文件）|
| 2 | [maps-analysis_zh.md](./maps-analysis_zh.md) ([英文](./maps-analysis.md)) | 1,641 | Google Maps 生态系统（344 个文件）|
| 3 | [logs-analysis_zh.md](./logs-analysis_zh.md) ([英文](./logs-analysis.md)) | 1,005 | 事件日志与分析（182 个文件）|
| 4 | [geostore-analysis_zh.md](./geostore-analysis_zh.md) ([英文](./geostore-analysis.md)) | 1,326 | 地理数据持久层（162 个文件）|
| 5 | [google-and-others-analysis_zh.md](./google-and-others-analysis_zh.md) ([英文](./google-and-others-analysis.md)) | 1,060 | 标准类型 + 内部 API + 其他（约 300 个文件）|

## 其他重要文档

| 文档 | 中文 | 英文 | 说明 |
|---|---|---|---|
| **能力分析** | [CAPABILITIES_zh.md](../CAPABILITIES_zh.md) | [CAPABILITIES.md](../CAPABILITIES.md) | Proto 能/不能做什么，迁移指南 |
| **开发规范** | [DEVELOPMENT_SPEC_zh.md](../DEVELOPMENT_SPEC_zh.md) | [DEVELOPMENT_SPEC.md](../DEVELOPMENT_SPEC.md) | Proto 开发规则 |
| **依赖图纸** | [DEPENDENCY_MAP_zh.md](../DEPENDENCY_MAP_zh.md) | [DEPENDENCY_MAP.md](../DEPENDENCY_MAP.md) | Mermaid 依赖流程图 |
| **文件依赖** | - | [DEPENDENCY_FILES.md](../DEPENDENCY_FILES.md) | 逐文件 import 清单 + Top 50 |
| **速查卡** | - | [QUICK_REFERENCE.md](../QUICK_REFERENCE.md) | 一页速查 |
| **交互图表** | - | [diagrams/](../diagrams/) | 可缩放 HTML 依赖图 |

---

## 系统架构概览

```
                      +---------------------------+
                      |    Earth Studio Client     |
                      |  Studio UI + 60 States     |
                      |  Commands (34) + Model     |
                      +------------+--------------+
                                   |
              +------------------+-------------------+
              |                  |                    |
     +--------v------+  +-------v------+  +---------v------+
     | geo/serving   |  | google/      |  | maps/tactile   |
     | photos/imagery|  | internal/v1  |  | API layer      |
     | search/AR     |  | billing/env  |  | 241 edges      |
     +-------+-------+  +------+-------+  +--------+-------+
             |                 |                   |
             +--------+--------+-------------------+
                      |
             +--------v--------+
             |  geostore/base   |
             |  408 edges       |
             |  FeatureId (S2)  |
             |  Feature (70+)   |
             +--------+--------+
                      |
             +--------v--------+
             |  Foundation      |
             |  protobuf/type   |
             |  api/net/proto2  |
             +--------+--------+
                      |
             +--------v--------+
             |  logs/proto      |
             |  223 edges       |
             |  EarthEvent (89) |
             +------------------+
```

---

## 核心数据流

### 1. 用户操作 → 状态变更 → 渲染
```
用户点击 "Fly to NYC"
  -> Commands.FlyToCamera (commands.proto)
  -> State/search 更新 (state/search/searchderivedstate.proto)
  -> Camera presenter 动画 (studio_presenters/camera/)
  -> EarthEvent 日志记录 (logs/proto/geo/earth/app/earth_log.proto)
```

### 2. 要素创建管道
```
用户绘制多边形
  -> Commands.CreateFeature (commands.proto)
  -> ContentEditingModel.Feature (content_editing_model.proto)
  -> Document 存储 (core/document/)
  -> 通过 MapStyle 渲染到地球 (mapstyle.proto)
```

### 3. 地图渲染管道
```
客户端请求地图瓦片
  -> maps/tactile API (directions, search, places)
  -> maps/paint 渲染矢量瓦片 (paint/proto/)
  -> maps/spotlight 展示实体卡片 (spotlight/proto/)
  -> geostore/base 提供要素数据 (FeatureProto)
```

### 4. 路线查找流程
```
用户请求导航
  -> maps/directions 请求
  -> maps/pathfinder CRP 搜索 (crp/searcher/)
  -> maps/roadtraffic 添加交通信息 (traffic_model_type.proto)
  -> maps/transit 添加公交选项 (transit/api/)
  -> 通过 maps/tactile 返回结果
```

### 5. 分析管道
```
任意用户交互
  -> logs/proto/visual_element/（UI 点击追踪）
  -> logs/proto/geo/earth/app/earth_log.proto（89 种事件类型）
  -> logs/proto/maps/（地图专用事件）
  -> 全部带有 storage/datapol 注解标签（PII 治理）
```

---

## 核心领域深入分析

### 1. geo/earth/ — Earth Studio 核心（159 个文件）

| 子系统 | 文件数 | 关键产物 |
|---|---|---|
| Commands | commands.proto | 34 种命令类型：搜索、飞行至、创建/编辑/删除要素、切换图层、渲染设计、Earth Mate 聊天、图像生成、按需分析（坡度/朝向/挖填方/等高线） |
| Content Model | content_editing_model.proto | 113 种消息类型：Feature、Placemark、Geometry（Point/Polyline/Polygon）、Style（Icon/Line/Poly/Balloon/Label）、Earth Data Layer、调色板、3D 资产、分类 |
| Map Style | mapstyle.proto | 投影（Globe/Mercator）、影像（Satellite/Roadmap/Terrain）、3D 要素、云层、网格线、图层开关 |
| Camera | geometry.proto | LookAt + LookFrom 相机、纬度/经度/高度/航向/倾斜/翻滚/视场角 |
| State | 60+ 个文件 | 搜索、文档、设计、图层、街景、时光机、延时摄影、测量、绘图、属性编辑器、新手引导、太阳能、新建建筑、建筑编辑器、选址、反馈、Earth Mate |
| Studio | 7 个文件 | 相机动画（10 种消息）、底图图层、属性编辑器、设置、视图状态 |
| Document | 18 个文件 | 元数据、存储、导入/导出、I/O 适配器（本地文件系统、外部文件系统、UMS）、角色、能力 |
| Earth Mate | 7 个文件 | Gemini 驱动的 AI 助手请求/响应、图像生成、文件附件 |
| Design | 16 个文件 | 设计生成、建筑模板、选址、图例、灯箱、绘图模式、多边形输入 |

### 2. maps/ — Google Maps 生态系统（344 个文件）

| 子系统 | 文件数 | 关键产物 |
|---|---|---|
| Tactile | 190 | 完整的地图前端 API：导航、实体（地点）、搜索、广告、酒店、公交、电动汽车充电、照片、缓存、被动辅助、内部类型 |
| Paint | 75 | 瓦片渲染引擎：客户端矢量瓦片、样式、标注规则、3D 输出、叠加层、要素选择器、图层描述 |
| Pathfinder | 31 | CRP 路线查找：路径搜索、MRP、备选路线、自动驾驶、电动车辆路线、回放 |
| Directions | 16 | 客户端统计（35 个客户端 × 47 种上下文）、自定义配置、MRP 可供性、收费定价 |
| Spotlight | 12 | 实体详情卡片：广告、危机、酒店、搜索参数 |
| Transit | 11 | 公交路线：车辆偏好、票价、个性化、长途、预订链接 |
| Versatile | 10 | 内部矢量格式：要素、渲染操作、样式、数据绑定、3D 模型 |
| Road Traffic | 9 | 交通机器学习模型（TRAFFIC2VEC）、事件元数据、路径编码、中断 |
| Shared | 9 | 通用几何（geom.proto）、mapcore API、标注、测试框架 |
| GMM | 4 | 移动网络类型、推广的图钉广告、相机、WebView |
| LIMO | 4 | 本地库存地图引导：上下文、平台、产品 |

### 3. geostore/ — 地理数据存储（162 个文件）

| 子系统 | 文件数 | 关键产物 |
|---|---|---|
| FeatureId | featureid.proto | 通用 S2 单元 + 指纹寻址（双 64 位） |
| Feature | ~70 种消息 | 统一的容器，带有 70 个类型化子消息分发字段 |
| Segment | segment.proto | 核心道路模型：15+ 个枚举，覆盖 200+ 个属性 |
| Lane | lane.proto | 高精车道级模型：20+ 种车道类型、流向连接 |
| Restriction | restriction.proto | 20+ 种限制类型，带时间调度和车辆过滤 |
| Establishment | （内嵌） | 400+ 种商业类别 |
| PriceInfo | priceinfo.proto | 完整的餐厅菜单系统（菜品、选项、过敏原、营养） |
| TimeSchedule | timeschedule.proto | 丰富的时间表达式（30+ 种场合类别） |
| FeaturePattern | （匹配） | 要素匹配的布尔 DSL：30+ 种模式类型 |
| Address | address.proto | 结构化的地址，带组件 |
| Route | route.proto | 道路路线定义，带方向 |
| Transit | transit_line_variant.proto | 公共交通线路变体 |

### 4. logs/ — 事件日志（182 个文件）

| 子系统 | 文件数 | 关键产物 |
|---|---|---|
| Earth Event Log | earth_log.proto | 89 种事件类型类别，400+ 个离散事件值，30+ 个子消息 |
| Visual Element | 14 个文件 | 通用点击追踪（VisualElementLiteProto）、UI 树嫁接、55 种用户操作类型 |
| Directions/Pathfinder | 34 个文件 | 完整的路线请求/响应、MRP 服务端（21 个阶段标签）、反事实 A/B 测试 |
| Navigation | 4 个文件 | 258 个符号：50+ 导航会话事件、Gemini-in-nav、AR 导航、引导事件 |
| Transit | 21 个文件 | 7 种模式连接、票价结构、50+ 惩罚成本模型 |
| Maps Shared | 10 个文件 | 汽车上下文、几何、名称、住宿定价 |
| Search Box | 6 个文件 | 40 种搜索方法、46 种建议来源、121 项实验统计 |

### 5. google/internal/ — 内部 Earth API（48 个文件）

| 子系统 | 文件数 | 关键产物 |
|---|---|---|
| Billing | 6 | 费率卡、方案类型、知识注册表、限制、能力 |
| Built Environment | 20 | 建筑编辑、区块编辑、公园编辑、太阳能运行输入、新建建筑指标、栅格分析、设计内容、几何 |
| Earth Mate | 1 | Earth Mate API 请求/响应模型 |
| Layers | 1 | 图层配置 API |
| Photos | 1 | 照片服务 API |
| User/Settings | 3 | 用户资料、设置、元数据 |
| Terrain | 1 | 地形分析 API |
| Classification | 1 | 分类图层 API |
| Feature Flags | 1 | 实验/特性标志系统 |
| Client Config | 1 | 客户端配置引导 |

---

## 架构模式

### 1. S2 单元索引
每个地理实体都由 `FeatureIdProto`（cell_id + fingerprint）作为唯一键，使用 Google 的 S2 几何库进行空间索引。

### 2. MessageSet 扩展分发
geostore 中 30+ 个 MessageSet 扩展允许动态类型分发，无需修改基础的 FeatureProto 容器。

### 3. 状态派生模式
60+ 个 UI 状态切片各自拥有自己的 proto，遵循一致的 `*derivedstate.proto` 命名约定。它们观察 Commands 和 Core 状态，计算派生值。

### 4. 命令模式
所有用户操作都通过 `Commands`（commands.proto）流转：34 个 oneof 分发的命令类型。每个命令与用户可见的功能一一对应。

### 5. PII 治理层
`storage/datapol/annotations/proto/semantic_annotations.proto`（890 次导入）提供字段级数据分类，用于跨所有领域的隐私合规。

### 6. Editions 迁移
已有 462 个文件使用 `editions` 语法（未来的标准）。799 个仍为 proto2。55 个为 proto3。迁移策略是：新文件 → editions；修改的现有文件 → 迁移到 editions。

### 7. 深度扩展使用
Google 内部的 `net/proto2/proto/descriptor.proto` 扩展了标准 protobuf 描述符，增加了字段存在性追踪、UTF-8 验证、JSON 格式和安全审计功能。

---

## 功能矩阵

| 功能 | Commands | Content Model | State | Studio | Maps | Geostore | Logs |
|---|---|---|---|---|---|---|---|
| 3D 地球渲染 | - | MapStyle | layers | baselayer | paint | - | BaseLayerEvent |
| 相机动画 | FlyToCamera | Camera | - | camera | - | - | - |
| 地标 | CreateFeature | Placemark | propertyeditor | propertyeditor | - | Feature | - |
| 折线/多边形 | CreateFeature | Polyline/Polygon | drawingtool | - | paint | Segment/Lane | - |
| 搜索 | PerformSearch | - | search | - | tactile | Feature | SuggestionEvent |
| 街景 | EnterStreetView | - | streetview | - | - | - | - |
| 时光机 | EnterTimeMachine | - | timemachine | - | - | - | TimeControlsEvent |
| 延时摄影 | EnterTimelapse | - | timelapse | - | - | - | - |
| 3D 建筑 | ToggleLayer | - | layers | - | - | - | - |
| 太阳能分析 | ViewDesign | - | solardesigninput | - | - | - | - |
| 建筑设计 | CreateDesigns | 3DAsset/Model | newbuild/buildingeditor | - | - | - | - |
| 测量工具 | - | - | measuretool | - | - | - | MeasureToolEvent |
| Earth Mate AI | OpenEarthMateChat | - | earthmate | - | - | - | EarthMateEvent |
| 图像生成 | OpenImageGenerator | - | - | - | - | - | - |
| 按需分析 | ViewOnDemandAnalysis | - | - | - | - | - | LRO 事件 |
| 导航/路线 | - | - | - | - | directions/pathfinder | Route | 完整路线日志 |
| 公交 | - | - | - | - | transit | TransitLineVariant | 公交日志 |
| 交通 | - | - | - | - | roadtraffic | TrafficFlow | 交通日志 |
| 地图渲染 | - | MapStyle | layers | baselayer | paint/tactile | - | VE 日志 |
| 账单 | ViewRateCard | - | gcpprojectbilling | - | - | - | BillingEvent |
| 云端项目 | CreateCloudProject | Document | documentmanager | - | - | - | ImportToCloud |
| 新手引导 | - | - | onboarding | - | - | - | 引导事件 |
| 无障碍 | - | - | - | - | - | - | AccessibilityEvent |

---

## 依赖统计

| 层级 | 文件数 | 内部边 | 被依赖最多 |
|---|---|---|---|
| L0 基础层 | ~30 | - | storage/datapol（890 次导入） |
| L1 注解层 | ~40 | - | google/api（208）、java/JSPB（208） |
| L2 Geostore 层 | 162 | 408 | geostore/base/featureid.proto（71） |
| L3 基础服务层 | ~200 | 195 条交叉 | geo/serving（195 条跨域） |
| L4 应用核心层 | ~200 | 175 | geo/earth/proto/commands.proto |
| L5 内部层 | ~50 | - | google/internal/earth/v1/shared.proto（14） |
| L6 状态层 | 60+ | - | state/state.proto（11） |
| L7 日志层 | 182 | 223 | logs/proto/logs_annotations（137） |

---

## 快速导航

- **Earth Studio 如何执行用户命令？** → [geo-earth-analysis_zh.md](geo-earth-analysis_zh.md) 第 1 节（Commands）
- **地图要素如何存储？** → [geostore-analysis_zh.md](geostore-analysis_zh.md) 第 2 节（FeatureProto）
- **地图瓦片如何渲染？** → [maps-analysis_zh.md](maps-analysis_zh.md) 第 2 节（Paint）
- **路线如何计算？** → [maps-analysis_zh.md](maps-analysis_zh.md) 第 3 节（Pathfinder）
- **用户操作如何记录日志？** → [logs-analysis_zh.md](logs-analysis_zh.md) 第 2 节（EarthEvent）
- **账单系统如何工作？** → [google-and-others-analysis_zh.md](google-and-others-analysis_zh.md) Billing 节
- **建筑如何设计？** → [google-and-others-analysis_zh.md](google-and-others-analysis_zh.md) Built Environment 节

---

*分析生成时间：2026-08-12*
*基于 1,316 个 Google 官方 proto 文件，4,195 条导入边*
