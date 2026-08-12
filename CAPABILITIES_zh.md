# Earth Studio WASM Proto 文件 — 功能与局限

> **关于 1,316 个 Google Earth Studio proto 定义文件能做什么、不能做什么的权威指南。**
>
> 基于对 `geo/earth/`、`maps/`、`geostore/`、`logs/`、`google/internal/` 以及其他 16 个领域中所有 `.proto` 文件的深入分析。
> 生成日期：2026-08-12

---

## 目录

1. [这些 Proto 文件能做什么](#1-这些-proto-文件能做什么)
2. [这些 Proto 文件不能做什么](#2-这些-proto-文件不能做什么)
3. [实际使用场景](#3-实际使用场景)
4. [关键注意事项和警告](#4-关键注意事项和警告)
5. [迁移与适配指南](#5-迁移与适配指南)

---

## 1. 这些 Proto 文件能做什么

这 1,316 个 `.proto` 文件是 Google Earth Studio、Google Maps 以及相关地理基础设施的**完整接口定义层**——涵盖数据模型、API 契约、有线格式、状态管理 schema、日志 schema 和配置结构。它们定义了**数据在有线传输中的格式**，而非数据的处理方式。

### 1.1 生成客户端 SDK

这些 proto 文件可直接编译（需适配——参见[第 5 节](#5-迁移与适配指南)）为多种语言的客户端库。超过 208 个文件导入了 `java/com/google/apps/jspb/jspb.proto`，证实了对 JavaScript/PB 目标的支持。

**各语言的实战产出：**

| 语言 | 可生成内容 | 关键 Protoc 插件 |
|----------|----------------------|-------------------|
| **JavaScript/TypeScript** | Earth Studio API、Maps Tactile API、日志管线的全类型化 SDK | `protoc-gen-js`、`protobuf-ts` |
| **Go** | 所有 API 接口的 gRPC 客户端/服务端桩代码 | `protoc-gen-go`、`protoc-gen-go-grpc` |
| **Python** | 类似 `dataclass` 的消息对象、gRPC 桩代码 | `protoc-gen-python`、`grpcio-tools` |
| **Kotlin/Java** | Android Maps/Earth SDK 类型、gRPC 桩代码 | `protoc-gen-java`、`protoc-gen-grpc-java` |
| **Swift** | iOS 地理类型 | `protoc-gen-swift` |
| **C++** | 渲染管线类型、geostore 操作 | `protoc-gen-cpp` |
| **Rust** | 类型安全的地理数据模型 | `prost`、`tonic` |

**开箱即用的能力：**
- **509 个 gRPC 服务方法**，涵盖所有 API 接口（文档 CRUD、要素操作、图层列表、计费、用户设置、地形、照片、分类、设计生成、知识卡片、路线规划、公交、搜索、广告、酒店、EV 充电、Earth Mate AI 聊天）
- **约 2000+ 消息类型**，编译时完全类型化并验证
- **约 500+ 枚举类型**，包含完整值集合（无需猜测魔数）
- **与 Google 生产服务的二进制有线格式兼容**（前提是你能访问这些服务）
- **所有消息的 JSON 序列化**（通过标准 proto↔JSON 映射）

### 1.2 构建兼容的 Earth Studio 客户端

`geo/earth/` 领域（159 个文件）定义了构建 Earth Studio 兼容应用所需的**完整客户端-服务端契约**：

| 能力 | 关键 Proto 文件 | 提供内容 |
|-----------|-----------|-------------|
| **命令执行** | `commands.proto`（34 种命令类型） | 所有用户操作模型——搜索、飞抵、创建/编辑/删除要素、切换图层、进入街景、时光机、延时摄影、AI 聊天、图像生成、按需分析 |
| **内容创建** | `content_editing_model.proto`（107 个消息） | 完整的 KML 风格数据模型：文档、要素、地标、折线、多边形、3D 模型、媒体、气泡、样式 |
| **文档编辑** | `content_editing_mutations.proto`（13 种变更类型） | 用于协作编辑的原子变更操作 |
| **相机系统** | `geometry.proto`、`camerapresenter.proto`（10 个动画消息） | LookAt/LookFrom 相机、3 种轨迹类型（线性/抛物线/上下文）、4 种呈现模式、动画插值 |
| **地图样式配置** | `mapstyle.proto` | 球体/墨卡托投影、卫星/路线图/地形影像、3D 建筑开关、云层、网格线、所有可视化图层 |
| **状态管理** | 60+ 状态 proto 文件（`state/`、`core/`） | 完整的 UI 状态 schema——搜索、文档、设计、图层、街景、时光机、测量、绘图、属性编辑器、引导 |
| **文档存储** | 18 个文档 proto 文件 | KML 导入/导出、云端存储、本地文件系统 I/O、角色、能力、元数据、版本控制 |
| **Earth Feed（Voyager）** | `earthfeed.proto`（10 个消息） | 包含 17 种展示类型的内容发现信息流 |
| **知识卡片** | `renderable-entity.proto`（约 40 个消息） | 丰富的地点信息：图片、事实信息、营业时间、相关实体、Open Location Codes |
| **数据图层** | `EarthDataLayer` 模型 + 20+ 色带、6 个调色板 | 与 BigQuery 连接的数据驱动样式，支持分类和插值渲染 |
| **分类** | `classification.proto` + `ClassDefinition` | AI 驱动的土地覆盖分类，支持样本点 |
| **错误处理** | `data_import_errors.proto`（66 种错误类型）、`error_response.proto` | 所有导入和 API 故障的完整错误分类 |
| **客户端配置** | `client_config.proto`、`config.proto`、`experiment_flag.proto` | 运行时功能开关（约 234 个）、服务端点、计费配置、套餐限制 |

**可实现的具体功能：**
- 3D 球体查看器，支持可切换图层（卫星影像、3D 建筑、云层、网格线）
- 地标/折线/多边形/3D 模型的创建和编辑
- 知识卡片展示，支持富媒体（图片、事实信息、相关地点）
- 相机动画系统（飞行动画，支持轨道、电影式和上下文轨迹）
- 街景集成（Pegman、全景截图、时间轴）
- 历史影像浏览器（时光机）
- 延时摄影播放
- 测量工具（距离、面积、坡度、坡向、等高线、挖填方）
- 设计生成工具（太阳能分析、新建建筑设计）
- KML 导入/导出
- 云端项目管理
- 无障碍功能（语音反馈、色彩校正、字号缩放）

### 1.3 构建 Maps 兼容的渲染管线

`maps/` 领域（344 个文件）定义了从服务端瓦片生成到客户端渲染的完整数据流：

| 渲染阶段 | 关键 Proto 文件 | 提供内容 |
|----------------|-----------|-------------|
| **瓦片来源** | `maps/tactile/`（190 个文件） | 完整的 API 接口：实体详情、路线规划、搜索、地点、照片、公交、酒店、EV 充电、广告、停车 |
| **矢量瓦片格式** | `maps/versatile/proto/`（10 个文件） | 内部矢量要素表示，支持多语言名称、室内楼层、EV 元数据、标注属性 |
| **渲染操作** | `vector-render-op.proto` | 14 种渲染操作类型：折线、多边形、网格、点、标签候选集、栅格、拉伸区域、3D GLTF 模型、着色器数据、瓦片背景 |
| **瓦片样式** | `maps/paint/`（75 个文件） | 客户端矢量瓦片、要素选择器、标注规则、3D 输出、叠加层、图层描述、交互性、无障碍元数据 |
| **标注引擎** | `LabelCandidateSet`、`LabelPosition` | 复杂的标注放置，支持定位策略、文字换行、密度控制 |
| **3D 模型** | `GltfModelProto`、`InstanceModelProto`、`Polyline3DProto`、`Mesh3DProto` | GLTF 模型放置、实例化渲染、拉伸建筑 |
| **数据绑定** | `DataBoundValue`、`DataBindingKey` | 运行时数据驱动样式（交通、天气、偏好） |
| **坐标系统** | `TileCoordinate`、`Transform3D` | 瓦片寻址（x/y/zoom）、3D 仿射变换 |
| **吸附** | `GeometrySnapParameters` | 几何图形到地形/道路/建筑的吸附 |

**可实现的具体渲染功能：**
- 从原始要素数据到 GPU 绘制调用的矢量瓦片渲染管线
- 包含拉伸建筑、GLTF 模型、地形的 3D 地图渲染
- 支持碰撞避免的多语言标签放置
- 数据驱动样式（交通颜色、天气叠加层）
- 交互式要素选择和命中测试

### 1.4 构建路径规划引擎

`maps/pathfinder/`（31 个文件）和 `maps/directions/`（16 个文件）领域定义了完整的路由数据模型：

| 路由功能 | 关键 Proto 文件 | 提供内容 |
|----------------|-----------|-------------|
| **路径搜索** | `find-path-input.proto`、`find-path-output.proto` | 完整的请求/响应模型：途经点、位置、成本模型、行程/路径结果、MRP 选择器、自定义输入 |
| **道路网络** | `geostore/segment.proto`（15+ 枚举、200+ 属性）、`lane.proto`（20+ 车道类型） | 有向道路段，包含限速、路面类型、优先级、高程、施工状态、自行车/行人设施、障碍物、事故多发点 |
| **车道级路由** | `lane.proto` + `lane_marker.proto` | HD 车道模型，包含连接关系、流向线、边界标记、穿越规则、按车道计算的通行费 |
| **备选路线** | MRP（Multi-Route Planning）proto 文件 | 成本函数规格、路径指标、风险规避路由、卡车/危险品适配 |
| **交通** | `roadtraffic/`（9 个文件） | TRAFFIC2VEC ML 模型类型、事件元数据、路径编码、交通中断 |
| **公交路由** | `transit/`（11 个文件） | 交通工具偏好、票价类型、时间锚定、站点选择、个性化、长途预订、包含 50+ 惩罚类别的成本模型 |
| **通行费计算** | `tolls/` proto 文件 | 通行证类型（E-ZPass、SunPass、FasTrak 等）、车辆属性（轴数/重量/高度）、个性化定价 |
| **EV 路由** | 电动车专用 pathfinder proto 文件 | 充电站感知路由、能耗模型 |
| **辅助驾驶** | `pathfinder/autonomous/` | ADAS 感知的路线规划 |
| **客户端追踪** | `directions_client_stats.proto` | 35 种客户端类型 × 47 种使用场景 × 4 个平台 |

**路由数据完整度：**
- 道路段模型：端点类型（13 种）、优先级（9 级）、路面（8 种）、高程（9 类）、用途（11 类）
- 车道模型：20+ 车道类型、20+ 并行车道类别、带曲线几何的流向连接
- 限制模型：20+ 限制类型，支持时间调度、车辆属性过滤、行程模式布尔逻辑
- 限制调度：`timeschedule.proto`，包含 30+ 场景类别、日期范围、星期几、小时范围

### 1.5 构建分析/日志管线

`logs/` 领域（182 个文件）提供了生产级遥测 schema：

| 日志功能 | 关键 Proto 文件 | 提供内容 |
|----------------|-----------|-------------|
| **事件关联** | `eventid.proto` | 通用事件 ID，包含微秒时间戳、服务器 IP、进程 ID、客户端计数器 |
| **Earth 事件** | `earth_log.proto` | 89 个事件类型类别、400+ 离散事件值、30+ 子消息，包含丰富的事件特定数据 |
| **可视化元素追踪** | `visual_element_lite.proto`（14 个文件） | 通用点击/展示追踪、UI 树嫁接（显示/隐藏/插入/复制）、55 种用户操作类型、350+ 扩展字段 |
| **路线规划分析** | `logs/proto/maps/directions/`（35 个文件） | 完整的路由请求/响应日志、MRP 服务端阶段（21 个阶段标签）、反事实 A/B 测试、通行费、自定义 |
| **导航事件** | `logs/proto/maps/mobile/`（3 个文件） | 50+ 导航会话事件、引导事件（步行/公交）、Gemini-in-nav |
| **公交分析** | `logs/proto/maps/transit/`（21 个文件） | 7 种交通方式的换乘日志、票价结构、50+ 惩罚成本模型、无障碍、拥挤度 |
| **搜索分析** | `searchbox/`（6 个文件） | 40 种搜索方法、46 个建议来源、121 个实验统计、IPA、查询组合器 |
| **汽车场景** | `automotive-context.proto` | 完整的车载遥测：显示屏、主机单元、输入设备、动力系统、Android Auto、CarPlay |
| **传感器观测** | `sensor_observations.proto` | 127 种道路标志类型、限速、曲率、天气、Volvo 特定标志检测、HD 地图信息流 |
| **性能遥测** | `mirthstats_event.proto` | FPS、卡顿率、内存（CPU+GPU）、KML 复杂度、视频/瓦片统计 |
| **用户画像** | `usersettings_event.proto` | 62 个行业、78 个 MAP 使用场景、6 种地理尺度 |
| **PII 治理** | `logs_annotations.proto` | 36 种标识符类型，用于字段级隐私分类 |

**可收集的具体遥测数据：**
- 每次用户交互（搜索、要素创建、图层切换、相机移动）
- 性能指标（帧率、内存、加载时间、崩溃数据）
- 业务分析（套餐变更、付费墙浏览、升级流程）
- AI 助手使用情况（Earth Mate 提交、评分、生成的图层）
- 实验/功能开关曝光数据

### 1.6 构建地理数据存储系统

`geostore/` 领域（162 个文件）提供了完整的空间数据库 schema：

| 存储功能 | 关键 Proto 文件 | 提供内容 |
|----------------|-----------|-------------|
| **要素标识** | `featureid.proto` | 通用 S2 cell + 指纹寻址（双 64 位），支持空间局部性 |
| **要素容器** | `feature.proto` | 一个统一的消息类型，包含约 70 个类型化子消息分发字段，涵盖：道路、地点、公交、边界、建筑、EV 充电、滑雪、停车、土地利用、管制区域、服务区、连锁商业 |
| **道路网络** | `segment.proto`、`lane.proto`、`restriction.proto` | 有向道路段、HD 车道模型、20+ 限制类型 |
| **地点/POI** | Establishment（400+ 商业类别）、`address.proto`、`openinghours.proto`、`priceinfo.proto` | 完整的餐厅菜单系统（菜品、选项、过敏原、营养信息）、营业时间（30+ 场景类别） |
| **几何图形** | `point.proto`、`polyline.proto`、`polygon.proto`、`rect.proto`、`track.proto`、`pose.proto` | E7 坐标、3D 拉伸、编码多边形压缩、6-DOF 位姿 |
| **要素生命周期** | `featuremetadata.proto`、`featureidforwardings.proto`、`existence.proto` | 微秒精度时间戳、版本令牌、ID 转发链、批量更新资格 |
| **数据溯源** | `feature_field_metadata.proto`、`datasourceprovider.proto` | 字段级数据来源追踪，支持提供商+数据集归属 |
| **要素匹配** | `matching/public/feature_pattern.proto` | 布尔 DSL（AND/OR/NOT），包含 30+ 模式类型：名称（正则+词干提取）、几何（包含/相交）、段属性、地址等 |
| **权限管理** | `rightsstatus.proto`、`fieldtype.proto`（250+ 字段类型） | 每个字段的访问权限，支持最低授权等级 |
| **版本控制** | `version_token_options.proto`、`stable_id_options.proto`、`stable_field_path.proto` | 兼容 schema 版本变化的字段标识 |
| **附件** | `client/attachments/attachment.proto` | 类型化 MessageSet 扩展，支持客户端命名空间隔离 |

### 1.7 构建 AI 助手（Earth Mate）

`geo/earth/proto/earth_mate/` 领域（7 个文件）定义了完整的 Gemini 驱动 AI 助手接口：

| AI 功能 | 关键 Proto 文件 | 提供内容 |
|-----------|-----------|-------------|
| **请求模型** | `earth_mate_request.proto`（14 个消息） | 多轮对话，支持文档/要素上下文、图像查询、俯拍影像请求、文件附件、行业定向 |
| **响应模型** | `earth_mate_response.proto`（5 个消息） | 聊天回复、可执行的 `Command` 生成（34 种命令类型）、引用来源、错误处理 |
| **图像生成** | `OpenImageGenerator` 命令 + 配置 | AI 图像生成，支持推广项展示 |
| **流式传输** | `streaming.proto` | 服务端推送流式实时 AI 响应 |
| **错误处理** | `earth_mate_error_detail.proto` | 结构化错误报告 |

AI 可以生成结构化的 `Command` 消息，由 Earth Studio 直接执行——飞往指定地点、创建要素、切换图层等。数据模型足以支撑：
- 构建带地理上下文的 AI 聊天界面
- 让 AI 生成结构化的地理操作
- 追踪 AI 对话分析（点赞/差评、提交到响应时间）
- AI 生成的矢量图层（GeminiGeneratedLayer，支持 CNS 路径源）

### 1.8 构建设计/规划工具

设计工具领域涵盖太阳能分析和建筑设计：

| 设计功能 | 关键 Proto 文件 | 提供内容 |
|---------------|-----------|-------------|
| **太阳能分析** | `solardesigninput.proto`、`design_input_manager.proto` | 太阳能 PV 设计输入、场地约束 |
| **建筑设计** | `design_manager.proto`、`building_templates.proto`、`buildingeditor.proto` | 设计生成、基于 FAR 的建筑配置、场地选择 |
| **3D 资源** | `ThreeDAsset`、`Model`、`BoundingBox` | 3D 模型放置，支持朝向、缩放、包围盒 |
| **场地选择** | `site_selection.proto` | 场地面积限制、套餐等级约束 |
| **绘图工具** | `drawingtool.proto` | 折线/多边形绘制模式、多边形输入验证 |
| **按需分析** | `ViewOnDemandAnalysis` 命令 | 坡度、坡向、挖填方、等高线、变化检测 |
| **分类** | `ClassificationLayerInputs`、`ClassDefinition` | AI 驱动的土地分类，支持样本点 |
| **影像分析** | `google/internal/earth/v1/built_environment/`（20 个文件） | 建筑编辑、街区编辑、公园编辑、太阳能运行输入、新建指标、栅格分析、设计内容 |

### 1.9 理解 Google 的内部数据模型

这些 proto 文件是以下内容的权威参考：

- **地理寻址：** S2 cell + 指纹作为通用要素 ID
- **地图渲染：** 14 步渲染操作管线：源要素 → 样式瓦片 → GPU 绘制调用
- **路由规划：** 基于 CRP 的路径搜索，支持 HD 车道级细节和交通 ML 集成（TRAFFIC2VEC）
- **地点信息：** 400+ 商业类别、完整菜单系统、30+ 场景时间调度
- **道路信息：** 15+ 枚举，覆盖 200+ 属性——比 OpenStreetMap 详尽得多
- **状态管理：** 60+ UI 状态切片，每个都有独立的 proto 文件，遵循一致的命名规范
- **命令系统：** 34 个 oneof 分发命令类型，每个一一对应一项用户功能
- **配置系统：** 远程下发的 `ClientConfig`，控制每个客户端功能
- **实验开关：** 234 个功能开关，用于渐进式发布和 A/B 测试
- **PII 治理：** 字段级数据分类，包含 36 种标识符类型

### 1.10 逆向工程 API 契约

所有 API 接口都有完整描述：

| API 接口 | Proto 文件 | 暴露的方法 |
|------------|--------------|----------------|
| 文档 CRUD | `content_editing_requests.proto` | Create、Get、Update、Delete、Copy、List 文档；Get/BatchGet 要素；Upload/Download 资源；Import 数据 |
| 数据图层 | `layers.proto` | ListDataLayers、GetDataLayer、GetFeatureDetails、GetFeaturesInViewport、CreateOnDemandLayer、ImportDatasetToLayer、CreateDocumentAssetLayer |
| 知识卡片 | `knowledge.proto` | GetKnowledgeCard（按 MID、FID 或经纬度+查询词） |
| 照片 | `photos.proto` | GetThumbnailsForViewport、GetPhotosForPoint |
| 地形 | `terrain.proto` | BatchGetElevationsByPoint |
| 用户 | `user.proto` | GetUser（个人资料、能力、Drive/MyMaps/Earth 访问权限） |
| 设置 | `user_settings.proto` | Get/Update 用户行业、使用场景、偏好 |
| 分类 | `classification.proto` | ListClassificationSystems、ListClassificationSystemClasses |
| 计费 | `rate_cards.proto`、`quota.proto` | GetRateCards、GetUserAssetQuota、ValidateUserAssetQuota |
| 配置 | `client_config.proto` | GetConfig（完整客户端启动引导） |
| 功能开关 | `feature_flags.proto` | GetFeatureFlags |
| Earth Mate | `earth_mate.proto` | Chat 请求/响应，支持流式传输 |
| Maps 路线规划 | `maps/tactile/api/directions-*.proto` | 路线搜索，支持完整路由选项 |
| Maps 实体 | `maps/tactile/api/entity-*.proto` | 地点详情检索、搜索、照片 |
| Maps 搜索 | `maps/tactile/api/search-*.proto` | 地点/文本搜索，结构化结果 |
| Maps 公交 | `maps/tactile/api/shared/transit/` | 公交路线、站点信息 |
| Maps 酒店 | `maps/tactile/api/shared/hotels/`（14 个文件） | 酒店搜索、房间、房价、设施、预订 |

### 1.11 创建测试用 Mock 服务器

完整的请求/响应契约可用于构建 mock 服务器，支持：
- 为任何 API 调用返回有效、schema 正确的响应
- 模拟所有已文档化的错误条件
- 在不依赖 Google 基础设施的情况下支持集成测试
- 支持离线开发和 CI/CD 管线

---

## 2. 这些 Proto 文件不能做什么

### 2.1 没有实现逻辑

Protobuf schema 是**数据契约，而非代码**。它们定义数据长什么样，而非如何处理数据。你**无法**从中提取：
- 3D 球体的实际 GL 渲染代码
- CRP 路径搜索算法的实现
- TRAFFIC2VEC 机器学习模型
- 相机动画插值数学
- 样式/标注引擎逻辑
- Gemini LLM 提示模板或模型权重
- Earth Mate 上下文组装逻辑
- 计费计算引擎
- 设计生成算法（太阳能 PV 放置、FAR 优化）
- KML 解析器/转换器逻辑（仅提供了错误分类）
- 要素模式匹配评估器（仅定义了 DSL schema）
- PII 检测/脱敏引擎（仅提供了分类 schema）

### 2.2 没有渲染引擎

你**无法**从中提取：
- GPU 着色器代码
- 纹理图集或瓦片图像
- 字体数据或字形图集
- 抗锯齿或防闪烁逻辑
- WebGL/WebGPU 渲染管线
- 相机视锥体裁剪逻辑
- 细节层次选择启发式算法

### 2.3 没有实际地图数据

这些仅仅是**schema 定义**。它们包含：
- 零张地图瓦片图像（卫星、路线图、地形）
- 零个矢量要素几何图形（没有实际的道路坐标、建筑轮廓或 POI 位置）
- 零个高程数据
- 零个 3D 建筑模型
- 零张街景影像
- 零条交通数据
- 零份公交时刻表
- 零张地点照片
- 零条 Knowledge Graph 事实信息

### 2.4 没有服务端业务逻辑

你**无法**从这些 proto 文件中确定：
- 如何根据使用指标计算计费费用
- 如何执行速率限制
- 文档冲突如何解决
- 搜索排名如何计算
- 如何在考虑交通的情况下优化路线
- 如何根据 Earth Mate 请求生成 AI 响应
- 设计生成如何运作（太阳能电池板放置、建筑配置）
- 功能开关如何管理发布
- 实验 A/B 分组如何运作
- PII 检测和脱敏如何运作
- 垃圾/滥用检测如何运作

### 2.5 没有认证/授权逻辑

这些 proto 文件指定了：
- 认证的存在性（`RequestRule` 中的 `STANDARD_AUTH`、`API_KEY`、`PH_SERVER_TOKEN`）
- 客户端身份元数据（`ClientMetadata`，包含国家代码、版本、客户端类型）
- 要素级权限 schema（`RightsStatusProto`、最低权限等级）
- 计费套餐类型和费率卡结构

但它们**不**包含：
- OAuth 令牌验证逻辑
- API 密钥验证
- 会话管理
- 用户身份解析
- 授权决策逻辑
- 速率限制执行代码

### 2.6 没有实际 AI 模型

Earth Mate proto 文件定义了请求/响应契约，但包含：
- 无 LLM 模型权重或架构
- 无提示模板
- 无上下文组装逻辑
- 无工具使用定义
- 无安全/对齐过滤器
- 无模型评估指标

### 2.7 没有客户端 UI 代码

状态管理 proto 文件定义了存在哪些状态及其形状，但包含：
- 无 React/Angular/Vue 组件代码
- 无 CSS 样式表
- 无 HTML 布局
- 无事件处理逻辑
- 无动画曲线或缓动函数
- 无无障碍功能实现（仅存在配置开关）

---

## 3. 实际使用场景

### 3.1 "我想构建一个 3D 球体查看器"

**需要的核心 proto 文件：**

| Proto 文件 | 路径 | 定义内容 |
|-------|------|----------------|
| `mapstyle.proto` | `geo/earth/proto/mapstyle.proto` | 投影（球体/墨卡托）、影像（卫星/路线图/地形）、3D 要素开关、云层、网格线、所有可视化图层 |
| `geometry.proto` | `geo/earth/proto/geometry.proto` | 相机状态（位置、旋转、视场角）、LatLng 基元 |
| `camerapresenter.proto` | `geo/earth/app/cpp/studio_presenters/camera/camerapresenter.proto` | 相机动画：3 种轨迹类型、4 种呈现模式、部分属性更新 |
| `baselayerstyles.proto` | `geo/earth/app/cpp/layers/baselayer/baselayerstyles.proto` | 基础图层视觉样式 |
| `state/layers/` | `geo/earth/app/cpp/core/state/layers/` | 图层可见性状态、开关 |
| `state/search/` | `geo/earth/app/cpp/core/state/search/` | 地点查询的搜索状态 |
| `renderable-entity.proto` | `geo/earth/proto/renderable-entity.proto` | 显示在球体上的知识卡片 |

**仍需自行实现的内容：**
- WebGL/WebGPU 渲染引擎（地形网格生成、瓦片加载、纹理管理）
- 瓦片服务器或瓦片缓存（卫星影像不在这些 proto 文件中——只有 `client_config.proto` 中的 URL 模板模式暗示了瓦片来源）
- 相机数学（四元数插值、大圆导航）
- 输入处理（鼠标/触摸平移、缩放、倾斜、旋转）
- 栅格瓦片解码（WebP、JPEG、PNG）

### 3.2 "我想像 Earth Studio 一样记录用户交互"

**需要的核心 proto 文件：**

| Proto 文件 | 路径 | 定义内容 |
|-------|------|----------------|
| `earth_log.proto` | `logs/proto/geo/earth/app/earth_log.proto` | 89 个事件类型类别，包含 400+ 离散值和 30+ 子消息 |
| `eventid.proto` | `logs/eventid/eventid.proto` | 通用事件关联 ID |
| `visual_element_lite.proto` | `logs/proto/visual_element/visual_element_lite.proto` | 每个 UI 元素的点击/展示追踪 |
| `client_interaction_metadata.proto` | `logs/proto/visual_element/client_interaction_metadata.proto` | 可扩展的交互元数据 |
| `usersettings_event.proto` | `logs/proto/geo/earth/app/usersettings_event.proto` | 用户行业画像（62 个行业、78 个使用场景） |
| `mirthstats_event.proto` | `logs/proto/geo/earth/app/mirthstats_event.proto` | 性能遥测（FPS、内存、KML 复杂度） |
| `logs_annotations.proto` | `logs/proto/logs_annotations/logs_annotations.proto` | PII 字段分类，用于隐私合规 |

**示例：记录搜索事件**

你的代码填充一个 `EarthEvent`：
```
type: SEARCH_PERFORMED（值 301）
search_event: {
  query: "New York City"
  result_count: 15
  search_method: TEXT_SEARCH
  search_source: SEARCH_BOX
}
```

并附加 `EventIdMessage`，包含 `time_usec`、`server_ip`、`process_id` 用于关联。

### 3.3 "我想存储地理要素"

**需要的核心 proto 文件：**

| Proto 文件 | 路径 | 定义内容 |
|-------|------|----------------|
| `featureid.proto` | `geostore/base/proto/featureid.proto` | S2 cell + 指纹要素寻址 |
| `feature.proto` | `geostore/base/proto/feature.proto` | 通用容器，包含约 70 个类型化子消息字段 |
| `point.proto` | `geostore/base/proto/point.proto` | E7 坐标（lat_e7/lng_e7——微度精度） |
| `polyline.proto` | `geostore/base/proto/polyline.proto` | 有序点序列 |
| `polygon.proto` | `geostore/base/proto/polygon.proto` | 多边形，支持编码压缩、3D 拉伸 |
| `rect.proto` | `geostore/base/proto/rect.proto` | 包围盒 |
| `featuremetadata.proto` | `geostore/base/proto/featuremetadata.proto` | 生命周期追踪、版本令牌 |
| `segment.proto` | `geostore/base/proto/segment.proto` | 道路段（15+ 枚举、200+ 属性） |
| `address.proto` | `geostore/base/proto/address.proto` | 结构化地址 |
| `openinghours.proto` | `geostore/base/proto/openinghours.proto` | 营业时间，支持时间调度 |
| `priceinfo.proto` | `geostore/base/proto/priceinfo.proto` | 菜单/价格，支持过敏原和营养信息 |

**示例：存储一家餐厅**

```protobuf
FeatureProto {
  id: FeatureIdProto {
    cell_id: 0x89c2589a3 // NYC 的 S2 cell
    fprint: 0x4a7f1b2c // cell 内唯一标识
  }
  bound: RectProto { lo: {lat_e7: 407489000, lng_e7: -739851000} hi: {...} }
  name: [NameProto { text: "Joe's Pizza", language: "en" }]
  point: [PointProto { lat_e7: 407306000, lng_e7: -739915000 }]
  address: [AddressProto {
    street_number: "7"
    route: "Carmine Street"
    locality: "New York"
    administrative_area_level_1: "NY"
    postal_code: "10014"
  }]
  establishment: EstablishmentProto {
    category: RESTAURANT_PIZZA  // 来自 400+ 类别枚举
  }
  opening_hours: [OpeningHoursProto {
    periods: [
      { day: MONDAY, open_hour: 11, open_minute: 0, close_hour: 3, close_minute: 0 }
    ]
  }]
  price_info: PriceInfoProto {
    price_range: PriceRangeProto { currency: "USD", lower: 1, upper: 2 }
  }
  telephone: [TelephoneProto { number: "+12123665636" }]
  url: [UrlProto { url: "https://joespizzanyc.com" }]
}
```

### 3.4 "我想做路线规划"

**需要的核心 proto 文件：**

| Proto 文件 | 路径 | 定义内容 |
|-------|------|----------------|
| `segment.proto` | `geostore/base/proto/segment.proto` | 完整的道路网络数据模型 |
| `lane.proto` | `geostore/base/proto/lane.proto` | 车道级细节，用于 HD 路由 |
| `restriction.proto` | `geostore/base/proto/restriction.proto` | 转向/时间/车辆限制 |
| `route.proto` | `geostore/base/proto/route.proto` | 路线容器 |
| `segmentpath.proto` | `geostore/base/proto/segmentpath.proto` | 有序段 ID 路径 |
| `travel_mode.proto` | `geostore/base/proto/travel_mode.proto` | 机动车/自行车/行人 |
| `travel_pattern.proto` | `geostore/base/proto/travel_pattern.proto` | 用于限制匹配的布尔逻辑 |
| `find-path-input.proto` | `maps/pathfinder/client/find-path-input.proto` | 路由请求（途经点、选项） |
| `find-path-output.proto` | `maps/pathfinder/client/find-path-output.proto` | 路由结果（路径、成本、备选方案） |
| `traffic_model_type.proto` | `maps/roadtraffic/proto/traffic_model_type.proto` | 交通感知路由类型 |
| `transit_options.proto` | `maps/transit/api/transit_options.proto` | 公交路由偏好 |
| `directions_client_stats.proto` | `maps/directions/proto/directions_client_stats.proto` | 路由的客户端分析 |

**这些 proto 文件提供的内容：**
- **道路图 schema：** 有向段，包含端点类型（13 种）、优先级（9 级）、路面（8 种）、高程（9 类）、用途（11 类）、限速、施工状态、障碍物、事故多发点
- **限制模型：** 时间调度、车辆过滤、布尔可组合的限制树
- **车道连接：** 车道到车道流向连接，带曲线几何
- **交通集成：** 用于实时交通融合的模型类型
- **公交 schema：** 7 种交通方式的换乘、票价结构、无障碍路由、50+ 成本惩罚

**必须自行实现的内容：**
- 从道路段构建图
- 路径搜索算法（A*、Dijkstra、CRP、收缩层级）
- 转向成本计算
- 交通数据集成
- 启发式调优

---

## 4. 关键注意事项和警告

### 4.1 Google 内部依赖使编译变得复杂

这些 proto 文件是为 Google 内部构建系统（Blaze）设计的，并导入了 Google 专有库：

| 内部依赖 | 导入次数 | 用途 | 标准替代方案 |
|--------------------|-------------|-------------|---------------------|
| `storage/datapol/annotations/proto/semantic_annotations.proto` | 约 890 次导入 | PII 字段分类 | 移除或用自定义注解替代 |
| `net/proto2/proto/descriptor.proto` | 约 50+ 次导入 | 扩展 proto 描述符（字段存在性、UTF-8 验证、JSON 格式、安全审计） | 使用标准 `google/protobuf/descriptor.proto` |
| `net/proto2/bridge/proto/message_set.proto` | 约 30+ 次导入 | MessageSet 扩展机制 | 替换为 `google.protobuf.Any` 或 oneof |
| `java/com/google/apps/jspb/jspb.proto` | 约 208 次导入 | JSPB JavaScript 字段选项 | 移除或替换为标准 JS 选项 |
| `knowledge/graph/protomesh/protomesh.proto` | 约 30 次导入 | Knowledge Graph 三元组存储 | 如果不使用 KG 则移除 |
| `wireless/android/privacy/annotations/proto/collection_basis_annotations.proto` | 约 100 次导入 | Android 隐私收集依据 | 移除或替换 |
| `google/api/inclusion.proto` | 约 200 次导入 | API 字段包含规则 | 替换为标准 `google/api/field_behavior.proto` |
| `net/proto2/contrib/validator/annotations.proto` | 约 50 次导入 | 运行时字段验证 | 使用 protoc-gen-validate 或移除 |
| `gws/mothership/` | 约 15 次导入 | Google Web Server RPC 框架 | 替换为标准 gRPC |
| `monitoring/streamz/` | 约 8 次导入 | Google 监控 | 移除 |
| `google/longrunning/operations.proto` | 约 10 次导入 | 异步操作追踪 | 使用标准版本或实现自定义版本 |

### 4.2 Proto2/Editions/Proto3 混合使用，需要特定 protoc 版本

| 语法 | 文件数量 | 问题 |
|--------|-----------|--------|
| **proto2** | 约 799 个文件 | 需要 protoc 启用 `proto2` 模式。group 字段、extensions、required 字段在 proto3 中不可用。 |
| **editions** | 约 462 个文件 | 需要 protoc 25+ 版本支持 editions。正在从 proto2 迁移中。 |
| **proto3** | 约 55 个文件 | 标准，但与 proto2 混合使用需要谨慎处理导入管理。 |

**实际影响：**
- proto2 的 `required` 字段（在 `featureid.proto`、`point.proto` 中大量使用）与 proto3 代码生成不兼容
- proto2 的 `extensions` 和 `MessageSet`（在 `geostore/` 中大量使用）在 proto3 中没有等价物
- proto2 的 `groups` 在 editions 中已弃用
- 必须分别编译 proto2 和 proto3 文件，或使用支持混合模式的 protoc
- Editions 文件引用了第三方特性（`third_party/protobuf/cpp_features.proto`、`java_features.proto`）

### 4.3 MessageSet 扩展需要 Google 的扩展描述符

`geostore/base/proto/feature.proto` 和许多其他核心文件使用 `MessageSet` 扩展进行动态类型分发：

```protobuf
// 在 featureid.proto 中
message FeatureIdProto {
  required fixed64 cell_id = 1;
  required fixed64 fprint = 2;
  extensions 1000 to max [message_set = true];  // MessageSet
}
```

**标准 protobuf 不支持 MessageSet**——它在 proto3 中已完全弃用。你有以下选择：
1. 将所有 MessageSet 扩展转换为 `google.protobuf.Any` 字段（有线层面失去类型安全）
2. 转换为 oneof 分发（需要提前知道所有扩展类型——由于代码库中定义了所有 30+ 扩展类型，这是可行的）
3. 使用 C++ protobuf 并携带 `-lprotobuf-lite` 标志，该标志保留了有限的 MessageSet 支持
4. 接受无法使用扩展分发模式，将 FeatureProto 拆分为单独的消息类型

### 4.4 某些功能引用了外部不存在的 Google 基础设施

| 功能 | Proto 引用 | 外部不可用的原因 |
|---------|----------------|--------------------------|
| S2 cell 索引 | `cell_id`（fixed64）字段 | 需要 S2 几何库——开源但复杂 |
| Knowledge Graph（Freebase） | `knowledge_graph_reference`、`gconcept`、`raw_gconcept_instance` | Google 内部 KG API |
| Streamz 监控 | `monitoring/streamz/` | 内部指标基础设施 |
| Google Web Server（GWS） | `gws/mothership/` | 内部 RPC 框架 |
| DMS 图层 | `DmsLayer`，带 `tile_key` | 域管理系统——内部瓦片服务 |
| UMS 文档 | `ums_document_id` | 通用元数据存储——内部文档存储 |
| FIFE 图像服务 | `photos/fife/` | 内部图像服务管线 |
| CIP pub/sub | `cip/` | 内部变更数据捕获 |
| Sawmill 日志 | `not_logged_in_sawmill` 注解 | 内部日志处理 |
| Heterodyne 实验 | `experiments/framework/extensions/heterodyne/` | 内部 A/B 框架 |
| ProtoShop | `devtools/protoshop/` | 内部 proto 工具 |
| VePub API | `vepub/` | 可视化元素发布平台 |

### 4.5 无 API 稳定性保证

这些是**Google 内部 proto 文件**——它们可以且确实会发生变化：
- 462 个文件已经在从 proto2 迁移到 editions（迁移进行中）
- 字段编号、消息名称和包结构不受任何公开稳定性策略约束
- 已弃用字段保留在 schema 中（例如 `OpenVoyagerGrid`、`OpenVoyagerStory`、`RenderDesign`、各种 `deprecated = true` 标记）
- Google 内部团队独立于外部消费者修改这些 proto 文件
- Earth Studio 客户端 API 不是公开的 Google Cloud API——它没有 SLA、没有弃用策略、没有面向外部用户的迁移指南

### 4.6 法律/知识产权考量

- **版权：** 这些 proto 文件是 Google 的知识产权。`.proto` 格式本身使用 Apache 2.0 许可，但具体的 schema、消息名称和数据模型可能受 Google 服务条款约束。
- **API 条款：** 使用这些 proto 文件构建连接 Google 实际 API 的客户端，需要遵守 Google 的 API 服务条款。
- **商标：** "Google Earth"、"Google Maps"、"Earth Studio"、"Earth Mate"、"Gemini" 是 Google 的商标。
- **数据权利：** 这些 schema 揭示了 PII 数据字段的存在，但你不得收集、处理或存储任何违反隐私法规的数据。
- **竞争使用：** 使用 Google 的 schema 设计构建竞品可能在不同司法管辖区产生法律影响。

---

## 5. 迁移与适配指南

### 5.1 如何剥离 Google 内部依赖

**分步流程：**

#### 第 1 步：为 `storage/datapol/annotations` 创建替代

创建 `third_party/google/storage/datapol/annotations/proto/semantic_annotations.proto`：

```protobuf
syntax = "proto2";
package storage.datapol.annotations.proto;

import "google/protobuf/descriptor.proto";

// 最小化存根——根据需要扩展
extend google.protobuf.FieldOptions {
  optional SemanticType sem_type = 10123456; // 原始字段编号
}

message SemanticType {
  // 空存根；如果系统需要类型分类，可添加字段
}
```

#### 第 2 步：为 `net/proto2/proto/descriptor.proto` 创建替代

创建 `third_party/google/net/proto2/proto/descriptor.proto`：

```protobuf
syntax = "proto2";
package proto2;

// 重新导出 net/proto2 扩展的标准描述符类型
// 实践中，通过 sed/perl 将所有 'import "net/proto2/proto/descriptor.proto"'
// 替换为 'import "google/protobuf/descriptor.proto"'
```

**自动替换命令：**
```bash
find . -name "*.proto" -exec sed -i \
  's|import "net/proto2/proto/descriptor.proto"|import "google/protobuf/descriptor.proto"|g' {} +
```

#### 第 3 步：处理 `net/proto2/bridge/proto/message_set.proto`

选项：
1. **完全移除 MessageSet**（绿色项目推荐）：将 `extensions X to max [message_set = true]` 替换为 `google.protobuf.Any` 或 oneof 字段。
2. **创建存根**（如果需要编译但实际不使用 MessageSet）：

```protobuf
syntax = "proto2";
package proto2.bridge;

message MessageSet {
  // 空存根——MessageSet 扩展点无法工作，
  // 但导入此文件的文件可以编译通过
}
```

#### 第 4 步：剥离 JSPB 注解

移除 `java/com/google/apps/jspb/jspb.proto` 的导入以及所有相关的选项注解：
```bash
find . -name "*.proto" -exec sed -i \
  '/import.*jspb\.proto/d' {} +
find . -name "*.proto" -exec sed -i \
  '/option.*jspb/d' {} +
```

#### 第 5 步：剥离 Android 隐私注解

移除 `wireless/android/privacy/annotations/proto/collection_basis_annotations.proto` 的导入：
```bash
find . -name "*.proto" -exec sed -i \
  '/import.*collection_basis_annotations/d' {} +
```

#### 第 6 步：为剩余内部导入创建存根

对于每个内部依赖，创建一个最小化存根 proto 文件，提供预期的包和消息名称，但不提供实际功能：

| 内部导入 | 需要的最小化存根 |
|----------------|-------------------|
| `google/api/inclusion.proto` | 空文件或扩展 `google.protobuf.FieldOptions` 的存根扩展 |
| `net/proto2/contrib/validator/annotations.proto` | 包含 `FieldValidationRule` 消息（空）的存根 |
| `knowledge/graph/protomesh/protomesh.proto` | 存根 `ProtoMesh` 消息（空） |
| `monitoring/streamz/proto/streamz.proto` | 包含空指标消息的存根 |
| `gws/mothership/` | 完全移除——替换为标准 gRPC |
| `third_party/protobuf/cpp_features.proto` | 仅 editions 文件需要；protoc 25+ 应内置支持 |
| `third_party/protobuf/java_features.proto` | 仅 Java 代码生成需要 |

### 5.2 如何适配标准 protoc

#### 需要的 protoc 版本
- 最低版本：**protoc 27.0+**（用于 editions 支持和 proto2 兼容）
- 推荐版本：**protoc 29.0+**（稳定的 editions 支持）

#### 编译策略

两遍方法：

```bash
# 第一遍：编译所有独立的 proto3 和 proto2 文件
protoc \
  --proto_path=. \
  --proto_path=third_party/google \  # 你的存根目录
  --cpp_out=gen/cpp \
  --go_out=gen/go \
  proto3_files.txt

# 第二遍：编译带 extensions 和 MessageSet 的 proto2 文件
protoc \
  --proto_path=. \
  --proto_path=third_party/google \
  --experimental_allow_proto3_optional \  # 用于 proto2 上下文中的 proto3 optional
  --cpp_out=gen/cpp \
  proto2_files.txt
```

#### 处理 proto2 required 字段

Proto2 的 `required` 关键字是 proto2 语法的永久组成部分。你可以：
1. 为这些文件保留 proto2 语法（protoc 仍然编译 proto2）
2. 将 `required` 转换为 `optional` + 在应用程序中添加验证逻辑
3. 如果你不打算迁移到 proto3 或 editions，则保持原样

#### 处理 extensions

Proto2 extensions 在 proto3 代码生成中不受支持。如果你需要 proto3：
1. 将 extensions 转换为 `google.protobuf.Any`（有损但可移植）
2. 转换为 oneof 分发（需要枚举所有可能的扩展类型）
3. 使用单独的 proto2 编译单元，配合 C++ lite 运行时

### 5.3 用什么替代 `storage/datapol` 注解

对于隐私/治理，你有以下选项：

| Google 注解 | 用途 | 开源替代方案 |
|------------------|---------|-----------------------|
| `storage/datapol/annotations` | 字段级语义类型分类（PII、位置等） | 使用标准 `google.protobuf.FieldOptions` 扩展的自定义注解 |
| `logs/proto/logs_annotations` | 标识符类型分类（36 种类型） | 基于自定义枚举的注解 |
| `wireless/android/privacy/collection_basis_annotations` | 收集目的声明 | 自定义 `CollectionBasis` 枚举注解 |
| `privacy/data_governance/` | 数据分类、目的、策略 | 自定义治理注解 |

创建统一的治理注解：

```protobuf
syntax = "proto2";
package yourproject.governance;

import "google/protobuf/descriptor.proto";

enum DataClassification {
  PUBLIC = 0;
  INTERNAL = 1;
  CONFIDENTIAL = 2;
  PII = 3;
  SENSITIVE_LOCATION = 4;
  FINANCIAL = 5;
  HEALTH = 6;
}

enum RetentionPolicy {
  RETAIN_30_DAYS = 0;
  RETAIN_90_DAYS = 1;
  RETAIN_1_YEAR = 2;
  RETAIN_INDEFINITELY = 3;
}

message GovernanceAnnotation {
  optional DataClassification classification = 1;
  optional RetentionPolicy retention = 2;
  optional string data_subject = 3;
  optional bool encrypted_at_rest = 4;
}

extend google.protobuf.FieldOptions {
  optional GovernanceAnnotation governance = 50000;
}
```

### 5.4 如何在标准 Protobuf 中处理 MessageSet 扩展

**方案 A：Oneof 分发（推荐）**

将 MessageSet 扩展注册转换为 oneof：

```protobuf
// 之前（Google 风格）：
message FeatureIdProto {
  required fixed64 cell_id = 1;
  required fixed64 fprint = 2;
  extensions 1000 to max [message_set = true];  // MessageSet
}

// 在单独文件中（注册为扩展）：
extend FeatureIdProto {
  optional CrawlFeatureIdProto crawl_feature_id = 27021333;
}

// 之后（标准风格）：
message FeatureIdProto {
  fixed64 cell_id = 1;
  fixed64 fprint = 2;
  oneof temporary_data {
    CrawlFeatureIdProto crawl_feature_id = 3;
    StrongReferenceProto strong_reference = 4;
    HasBackReferenceProto has_back_reference = 5;
    // ... 枚举所有已知扩展
  }
}
```

**优点：** 类型安全、各处均支持、无运行时分发开销  
**缺点：** 必须在 schema 设计时知道所有扩展类型；添加新类型需要修改 schema

**方案 B：google.protobuf.Any（可移植）**

```protobuf
import "google/protobuf/any.proto";

message FeatureIdProto {
  fixed64 cell_id = 1;
  fixed64 fprint = 2;
  repeated google.protobuf.Any temporary_data = 3;
}
```

**优点：** 无需修改 schema 即可扩展、完全可移植  
**缺点：** 有线层面失去类型安全、有线体积更大、需要运行时类型检查

**方案 C：Map 结构扩展（混合方案）**

```protobuf
message FeatureIdProto {
  fixed64 cell_id = 1;
  fixed64 fprint = 2;
  map<uint32, bytes> temporary_data = 3;  // key = 原始扩展编号
}
```

**优点：** 保留扩展编号、支持未知扩展  
**缺点：** 所有内容都是 bytes，需要手动序列化/反序列化

### 5.5 推荐的适配工作流

```
1. 盘点：列出所有导入 → 识别哪些是 Google 内部的
2. 剥离：移除所有 `storage/datapol`、`wireless/android`、JSPB 导入
3. 存根：为 `net/proto2/proto/descriptor`、
          `net/proto2/bridge/proto/message_set`、`knowledge/graph/protomesh` 创建最小化存根
4. 转换：用 oneof 或 Any 替换 MessageSet 扩展
5. 编译：两遍编译（先 proto3，后 proto2）
6. 验证：用参考消息进行二进制有线格式兼容性测试
7. 实现：为每个 RPC 方法编写自己的服务端逻辑
8. 测试：用参考请求/响应对搭建 mock 服务器
```

---

## 总结：你能实际构建什么

| 项目 | 可行性 | 工作量 |
|---------|-----------|--------|
| 任意语言的类型安全客户端 SDK | **高** | 数天（剥离内部依赖后） |
| 兼容的 Earth Studio UI 状态管理 | **高** | 数周（定义了 60+ 状态切片） |
| 用于测试的 Mock 服务器 | **高** | 数天至数周（509 个 RPC 方法） |
| 具有正确 schema 的地理数据存储 | **高** | 数天（geostore schema 完整） |
| 分析/日志管线 | **高** | 数天（logs proto 文件全面） |
| 路径规划数据模型 | **高** | 数天（仅 schema——算法需要自行实现） |
| 3D 球体查看器配置 | **中** | 数周（schema 定义了做什么，而非如何渲染） |
| 地图瓦片管线数据模型 | **中** | 数周（versatile/paint schema 丰富，但渲染引擎是外部的） |
| AI 助手接口 | **中** | 数周（schema 定义了契约，LLM 是外部的） |
| 设计/太阳能分析工具数据模型 | **中** | 数周（schema 定义了输入/输出，算法是外部的） |
| 完整的 Google Maps 克隆 | **低** | 数年（仅有 schema——无数据、无渲染引擎、无算法） |
| 直接连接 Google 的生产 API | **低** | 需要有效的 API 密钥、OAuth 令牌，并遵守服务条款 |

---

> **底线：** 这 1,316 个 proto 文件是理解 Google Earth Studio 和 Google Maps 数据架构的罗塞塔石碑。它们可用于构建兼容的客户端、验证器、mock 服务器、存储系统和分析管线。它们不包含任何实现逻辑、渲染代码、实际地图数据或服务端业务逻辑。由于有约 800 个 Google 内部依赖需要剥离或创建存根，预计需要 1-3 周的适配工作才能用标准 protoc 成功编译。这些 schema 是生产验证过的（支撑了 Earth、Maps 和路由的数百万用户），但它们是 Google 内部 schema，不提供稳定性保证。
