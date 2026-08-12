# Google Earth Studio WASM — Proto 分析：Google 及附加领域

> **生成日期：** 2026-08-12 | **项目根目录：** `/mnt/a740bae8-eadd-474a-857b-17333b55e34a/earthstudiowasm`

---

## 1. `google/internal/earth/v1/`（48 个文件）— 内部 Earth API

核心 Earth API 领域。包名为 `google.internal.earth.v1`，包含计费、建筑环境和 Earth Mate 的子包。

### 1.1 — `google/internal/earth/v1/shared.proto`

| 属性 | 详细信息 |
|----------|--------|
| **包名** | `google.internal.earth.v1` |
| **依赖项** | `geo/earth/proto/contentcreation/`、`billing/capability`、`google/protobuf/timestamp`、`net/proto2/contrib/validator`、`storage/datapol`、`wireless/android/privacy` |

**关键消息：**

- **`ClientMetadata`** — 客户端身份：country code、version，以及 `ClientType`（UNKNOWN/ANDROID/IOS/WEB/PROBER/STUDIO/MIRTH_DEMO/MAPS_JS_API）。用于所有 Earth API 请求。
- **`Viewport`** — 地理边界框（north/south/east/west 双精度浮点数）。基础空间查询原语。
- **`RequestRule`** — HTTP 请求配置规则（API_KEY、STANDARD_AUTH、PH_SERVER_TOKEN、BILLING_GCP_PROJECT 等）。控制后端请求的构建方式。
- **`LookFromCamera`** — 相机姿态：lat/lng/alt/heading/tilt/roll/field_of_view_y。标准 7-DOF 相机模型。
- **`LatitudeLongitude` / `ImageSize`** — 基本几何/值类型。
- **`DataLayer`** — 地图数据图层的核心抽象。支持四种后端类型（`DmsLayer`、`KmlLayer`、`UrlTemplateLayer`、`VideoRasterLayer`）。携带展示元数据、授权、治理、样式（`AppliedStyleRules`、`StyleAttribute`、`FilterSet`）、几何类型、搜索元数据和属性配置。
- **`DmsLayer`** — DOMAIN MANAGEMENT SYSTEM 图层：通过 `tile_key` 获取矢量瓦片，支持交互式气球数据。
- **`DmsLayerMetadata`** — 键/值对、属性配置（primary/secondary/feature name）、稀疏化统计。
- **`StyleAttribute` / `AppliedStyleRules`** — 填充颜色、描边颜色/宽度、不透明度、图标、缩放。支持分类值（string/int/double）和插值（int/double 数值范围）。
- **`FilterSet`** — 数据图层的分类筛选器（离散选项带 enable/disables）和插值筛选器（DoubleRange/IntRange）。
- **`GeometricFilter`** — 几何操作符（CONTAINS/INTERSECTS）附 `Geometry` 参数。
- **`LayerAttribute`** — 类型化属性 schema，包含 13 种类型：STRING、ENUM、NUMBER、DATETIME_USEC、BOOLEAN、LAT_LNG、DISTANCE_M、AREA_SQ_M、POWER_W、VOLTAGE_V、MARKDOWN、IMAGE。
- **`GovernanceSecurityInfo` / `TermsOfUseRestriction`** — 数据图层的法律和治理元数据。
- **`DataLayerProperties`** — 布尔标志：CAN_STYLE、CAN_ANALYZE、CAN_APPLY_GEOMETRIC_FILTER；外加 `LayerInteractivityConfig`。

**用途：** 单体共享类型文件 — 所有 Earth API 请求/响应结构的基础。定义了数据图层生命周期：从后端元数据（DMS 瓦片、发布信息）到客户端展示（样式、筛选、属性、治理），再到用户交互。

---

### 1.2 — `google/internal/earth/v1/classification.proto`

| 属性 | 详细信息 |
|----------|--------|
| **包名** | `google.internal.earth.v1.classification` |
| **依赖项** | `google/type/color`、`net/proto2/contrib/validator`、`storage/datapol` |

**关键消息：**

- **`ClassificationSystem`** — 命名的分类分类法（system_id、display_name）。
- **`ClassificationSystemClass`** — 系统中的单个类别（class_id、code、display_name、color）。
- **`ListClassificationSystemsRequest/Response`** — 列出所有可用的分类系统。
- **`ListClassificationSystemClassesRequest/Response`** — 列出系统中的类别。

**用途：** 土地覆盖/土地利用分类系统元数据。为分类图层功能提供数据（参见 layers.proto 中的 `ClassificationLayerOptions`）。每个类别 4 个字段。

---

### 1.3 — `google/internal/earth/v1/client_config.proto`

| 属性 | 详细信息 |
|----------|--------|
| **包名** | `google.internal.earth.v1.config` |
| **依赖项** | `shared.proto`、`google/protobuf/duration`、`google/type/date`、`logs/proto/geo/earth/app/earth_log`、`maps/paint/proto/paint-parameters`、`net/proto2/contrib/validator`、`storage/datapol`、`wireless/android/privacy` |

**关键消息：**

- **`GetConfigRequest`** — 客户端元数据、DPI ratio、渲染器版本。
- **`ClientConfig`** — 顶层：环境配置、country code、绘制参数。
- **`EnvironmentConfig`** — 按服务名称的服务配置、外部链接、按平台（Android/iOS/Web）的功能配置。
- **`ServiceConfig`** — 带请求规则的服务端点 URL 模板。
- **`FeatureConfig`** — 所有 Earth 功能的巨型配置持有者：
  - `DocumentConfig` — UMS 并发、频率限制、气球模板、功能限制
  - `SatelliteLayerConfig` — 卫星数据库瓦片路径
  - `CelestialBodiesConfig` — 恒星/行星天体
  - `NetworkConfig` / `TrustedDomainList` — 域名白名单
  - `RocktreeConfig` — 瓦片 epoch 覆盖
  - `SuggestConfig` — 搜索建议阈值
  - `BillingConfig` — 云控制台 URL、购买流程、GA 日期、促销限制
  - `BuiltenvConfig` — 按计划等级划分的站点面积限制、每 30 天窗口的设计限制
  - `IndustrySelectorConfig` — 行动号召延迟/退避配置
  - `PhotosConfig` — 街景/照片产品 ID
  - `StarterProjectConfig` — 入门项目模板详情
  - `EarthMateConfig` — 最大创建要素数、最大待处理要素数
  - `ImageryUpdateRequestConfig` — 外部 URL 模板、支持的影像类型
  - `ChangeDetectionConfig` — 最小/最大年份范围
  - `ImageGeneratorPromoConfig` — 促销图片条目
- **`PlatformConfig`** — 按平台的 HaTS 调查触发配置。
- **`AbsoluteUrlTemplate`** — URL 模板字符串包装器。

**用途：** 中心化客户端配置下发。服务端发送单个 `ClientConfig`，配置每个 Earth 功能 —— 渲染参数、功能开关、计费 UI、计划限制和服务端点。充当 Earth 客户端的运行时配置清单。

---

### 1.4 — `google/internal/earth/v1/feature_flags.proto`

| 属性 | 详细信息 |
|----------|--------|
| **包名** | `google.internal.earth.v1.featureflags` |
| **依赖项** | `geo/earth/client_config/experiment_flag`、`shared.proto`、`storage/datapol`、`wireless/android/privacy` |

**关键消息：**

- **`GetFeatureFlagsRequest`** — 客户端元数据。
- **`GetFeatureFlagsResponse`** — `ExperimentFlag` 列表、报告实验 ID、本地覆盖开关。

**用途：** 功能开关/实验门控的远程下发。支持服务端驱动的逐步发布。

---

### 1.5 — `google/internal/earth/v1/knowledge.proto`

| 属性 | 详细信息 |
|----------|--------|
| **包名** | `google.internal.earth.v1.knowledge` |
| **依赖项** | `geo/earth/proto/renderable-entity`、`shared.proto`、`net/proto2/contrib/validator`、`storage/datapol`、`wireless/android/privacy` |

**关键消息：**

- **`GetKnowledgeCardRequest`** — 按 MID/FID 或 lat/lng+query 进行位置查询；地图尺寸、卡片集模式。
- **`GetKnowledgeCardResponse`** — 包含结构化知识信息的 `RenderableEntity`。
- **`LatLngWithQuery`** — 地理点 + 文本查询。

**用途：** 地点的知识卡片检索。从知识图谱返回丰富的结构化实体，在 Earth 画布上显示。

---

### 1.6 — `google/internal/earth/v1/layers.proto`

| 属性 | 详细信息 |
|----------|--------|
| **包名** | `google.internal.earth.v1.layers` |
| **依赖项** | `geo/earth/proto/contentcreation/`、`google/longrunning/operations`、`shared.proto`、`net/proto2/contrib/validator`、`storage/datapol`、`wireless/android/privacy` |

**关键消息：**

- **`ListDataLayersRequest/Response`** — 服务端分页浏览/搜索数据图层。返回带全局图层 ID 的图层组。
- **`GetDataLayerRequest/Response`** — 获取特定数据图层，带矢量样式或分类图层选项。
- **`VectorLayerOptions`** — 筛选器、暴露的属性、属性统计以及每种几何类型的应用样式。
- **`ClassificationLayerOptions`** — 自定义分类定义：年份、类别定义（RGB 颜色 + 采样点）、区域多边形。
- **`GetFeatureDetailsRequest/Response`** — 按要素 ID 和图层标识符获取要素属性。
- **`GetFeaturesInViewportRequest/Response`** — 空间查询：视口内的要素，分页，带 LOD 控制。
- **`Feature` / `FeatureAttributeValue`** — 运行时要素数据，带属性值（int/bool/double/string/datetime）。
- **`CreateOnDemandLayerRequest`** — 创建分析图层：高程等高线、坡度、填挖方、坡向、变化检测。
- **`ImportDatasetToLayerRequest`** — 导入 KML/GeoJSON/Shapefile 数据集。
- **`CreateDocumentAssetLayerRequest`** — 创建图层资产（用户导入、按需、空间操作、Gemini 生成），带配额追踪。
- **`GeminiGeneratedLayer`** — AI 生成的数据集图层，带 CNS 路径源。
- **`SpatialOperationLayer`** — 带几何筛选器的裁剪操作。
- **`Quota`** — 基于字节的配额使用追踪。

**用途：** Earth 数据图层的完整 CRUD 生命周期。涵盖列出/浏览、详情检索、空间查询、按需分析图层（等高线/坡度/坡向/变化检测）、数据集导入和文档资产管理。使用 `google.longrunning.Operation` 进行异步操作。

---

### 1.7 — `google/internal/earth/v1/photos.proto`

| 属性 | 详细信息 |
|----------|--------|
| **包名** | `google.internal.earth.v1.photos` |
| **依赖项** | `geo/earth/proto/photos`、`geo/earth/proto/renderable-entity`、`shared.proto`、`net/proto2/contrib/validator`、`storage/datapol`、`wireless/android/privacy` |

**关键消息：**

- **`GetThumbnailsForViewportRequest`** — 基于视口的缩略图检索，包含最大结果数、距离比例、尺寸、全景标志。
- **`GetThumbnailsForViewportResponse`** — 返回 `ThumbnailImage` 列表。
- **`GetPhotosForPointRequest`** — 点半径照片：中心点、搜索半径、最大结果数、图片尺寸、全景标志。
- **`GetPhotosForPointResponse`** — 返回 `RenderableEntity.Image` 列表。

**用途：** Earth 的照片发现图层。支持基于视口的照片浏览（类街景风格）和点半径照片查询。

---

### 1.8 — `google/internal/earth/v1/quota.proto`

| 属性 | 详细信息 |
|----------|--------|
| **包名** | `google.internal.earth.v1.quota` |
| **依赖项** | `billing/plantype`、`storage/datapol` |

**关键消息：**

- **`GetUserAssetQuotaRequest/Response`** — 获取每个 `AccountingUnit` 的已用/剩余/最大配额。
- **`ValidateUserAssetQuotaRequest/Response`** — 根据计划限制验证配额增量。
- **`QuotaDelta`** — 核算单位 + 增量数量。
- **`QuotaValidationResult`** — 每单位验证状态列表。

**关键枚举：**
- **`AccountingUnit`** — BYTES、ON_DEMAND_USAGE、IMAGE_GENERATION_USAGE。
- **`ValidationStatus`** — ASSET_SIZE_BELOW/EXCEEDS_LIMIT、QUOTA_BELOW/EXCEEDS_LIMIT。

**用途：** 资源配额管理。根据计划限制跟踪和验证用户资产消耗。

---

### 1.9 — `google/internal/earth/v1/terrain.proto`

| 属性 | 详细信息 |
|----------|--------|
| **包名** | `google.internal.earth.v1.terrain` |
| **依赖项** | `shared.proto`、`net/proto2/contrib/validator`、`storage/datapol`、`wireless/android/privacy` |

**关键消息：**

- **`BatchGetElevationsByPointRequest`** — lat/lng 点列表。
- **`BatchGetElevationsByPointResponse`** — 相应的米制高程（打包的 double 值）。

**用途：** 地形高程 API。简单的批处理点到高程查询。

---

### 1.10 — `google/internal/earth/v1/user.proto`

| 属性 | 详细信息 |
|----------|--------|
| **包名** | `google.internal.earth.v1.user` |
| **依赖项** | `shared.proto`、`storage/datapol`、`wireless/android/privacy` |

**关键消息：**

- **`GetUserRequest`** — 客户端元数据 + 重试计数器。
- **`GetUserResponse`** — 用户档案：gaia ID、session ID、display name、photo URL、email、Drive/MyMaps/Earth 启用标志。

**用途：** 用户身份和能力端点。

---

### 1.11 — `google/internal/earth/v1/user_settings.proto`

| 属性 | 详细信息 |
|----------|--------|
| **包名** | `google.internal.earth.v1.user_settings` |
| **依赖项** | `shared.proto`、`google/protobuf/field_mask`、`storage/datapol`、`wireless/android/privacy` |

**关键消息：**

- **`UserSettings`** — 行业、国家代码、地理范围、UX 研究/功能公告选择加入、主要用途、MAP 用例。
- **`EarthUserIndustries`** — 63 个行业（ADVERTISING、AGRICULTURE、ARCHITECTURE、SOLAR_COMMERCIAL、WIND_ENERGY 等）。
- **`EarthUserMAPUseCases`** — 79 个气候/可持续性用例（METHANE_EMISSIONS_REDUCTION、SOLAR_PV、WILDFIRE_MANAGEMENT、FOREST_RESTORATION 等）。
- **`EarthUserGeographicScale`** — LOCAL → REGIONAL → STATE → NATIONAL → MULTI_NATIONAL → GLOBAL。
- **`EarthUserPrimaryUse`** — WORK/LEISURE/PUBLIC_SECTOR/ACADEMIC/ACADEMIC_RESEARCHER/ACADEMIC_STUDENT。

**用途：** 为 Earth 的可持续性/气候导向功能提供丰富的用户画像。深度的行业和气候用例分类法。

---

### 1.12 — `google/internal/earth/v1/user_metadata.proto`

| 属性 | 详细信息 |
|----------|--------|
| **包名** | `google.internal.earth.v1.user_metadata` |
| **依赖项** | `shared.proto`、`survey_metadata`、`google/protobuf/timestamp`、`storage/datapol`、`wireless/android/privacy` |

**关键消息：**

- **`UserMetadata`** — 调查元数据列表 + 首次登录时间戳。
- **`UserMetadataUpdate`** — 调查事件更新。
- **`GetUserMetadataRequest/UpdateUserMetadataRequest`** — 标准 CRUD 包装器。

**用途：** 调查追踪和用户生命周期元数据。

---

### 1.13 — `google/internal/earth/v1/survey_metadata.proto`

| 属性 | 详细信息 |
|----------|--------|
| **包名** | `google.internal.earth.v1.survey_metadata` |
| **依赖项** | `google/protobuf/timestamp`、`storage/datapol` |

**关键消息：**

- **`SurveyMetadata`** — 调查名称、已查看/已完成/已关闭时间戳、关闭次数。
- **`SurveyEvent`** — 调查名称 + 状态。

**关键枚举：**
- **`SurveyStatus`** — SHOWN → DISMISSED → STARTED → COMPLETED 生命周期。
- **`SurveyName`** — 目前仅含 `INDUSTRY_SELECTOR`。

**用途：** HaTS 调查生命周期追踪和事件日志。

---

### 1.14 — 计费子目录（`billing/`）

#### 1.14.1 — `billing/billing.proto`
**包名：** `google.internal.earth.v1.billing`

**关键消息：**
- **`License`** — GCP 项目绑定：project number/ID/display name、plan type、enabled capabilities、limits、Google One subscription info。
- **`GetLicenseRequest` / `ListLicensesRequest/Response` / `DeleteLicenseRequest`** — 许可 CRUD。
- **`GoogleOneSubscriptionInfo`** — 订阅等级映射。
- **`GoogleOnePlanType`** — NON_PREMIUM / PREMIUM_AI_PRO / PLUS / ULTRA。

**用途：** 许可管理 — GCP 项目与 Earth 计划授权的连接点。

#### 1.14.2 — `billing/capability.proto`
**包名：** `google.internal.earth.v1.billing`（proto3）

**枚举：`Capability`** — 29 个细粒度能力：
- 数据图层访问等级：STANDARD / PROFESSIONAL / PROFESSIONAL_ADVANCED
- 区域筛选器、用户图层、数据表、税地
- 按等级划分的站点面积限制
- 按等级划分的 30 天设计配额
- 建筑环境 zoning 自动填充
- 按需评估等级
- Google One Earth Mate 查询限制
- 俯视影像搜索
- 变化检测等级

**用途：** 细粒度功能能力枚举，用于计划等级区分。

#### 1.14.3 — `billing/knowledge_registry.proto`
**包名：** `google.internal.earth.v1.billing`（proto3）

**关键消息：**
- **`KnowledgeRegistry`** — `KnowledgeEntry` 列表（entity_id、Category、agent_explanation）。
- **`Category`** — CAPABILITY / INDUSTRY / PRODUCT_LIMIT。

**用途：** 关于计费概念的 AI 代理知识库，用于 Earth Mate 计费相关查询。

#### 1.14.4 — `billing/limit.proto`
**包名：** `google.internal.earth.v1.billing`

**关键消息：**
- **`Limit`** — Oneof 限制类型：`UserAssetMaxStorageBytes`、`UserAssetMaxFileSizeBytes`、`OnDemandEvaluationMaxSiteSize`（英亩）、`ClassificationLayerMaxSiteSize`（km²）、`ChangeDetectionMaxSiteSize`（英亩）。
- **`LimitType`** — 已弃用的枚举（USER_ASSET_MAX_STORAGE_MB、USER_ASSET_MAX_FILE_SIZE_MB）。

**用途：** 存储和分析操作的量化计划限制。

#### 1.14.5 — `billing/plantype.proto`
**包名：** `google.internal.earth.v1.billing`

**枚举：`PlanType`** — STANDARD / PROFESSIONAL / PROFESSIONAL_ADVANCED。

**用途：** 计费子系统中使用的核心计划等级枚举。

#### 1.14.6 — `billing/rate_card.proto`
**包名：** `google.internal.earth.v1.billing`

**关键消息：**
- **`RateCard`** — 带能力和限制的计划、可本地化的 UI 展示信息。
- **`DisplayInfo`** — 计划标题、徽章、图标、CTA、定价字符串。
- **`FeatureDisplayInfo`** — 功能级展示信息，带标签（EXPERIMENTAL/PROMOTIONAL）和每计划详情。
- **`PlanDisplayInfo`** — 计划类型、价格、促销价格、免责声明。

**用途：** 定价 UX — 为 Earth 计费 UI 提供完整的价目表展示数据，包括多层级计划对比和促销信息。

---

### 1.15 — 建筑环境子目录（`builtenv/`）

这是最大的子领域（20 个文件）。它实现了 Google Earth 的**太阳能潜力分析、新建筑设计生成和城市规划**工具。

#### 1.15.1 — `builtenv/common.proto`
简单工具：`Range`（min/max double）和 `ValueOrRange`（oneof double value 或 Range）。在整个建筑环境领域中共享使用。

#### 1.15.2 — `builtenv/geometry.proto`
3D 几何原语：
- **`Polygon`** — Encoded bytes、base/height meters、reference level。
- **`Point`** — lat/lng/alt floats + radius。
- **`Polyline`** — 打包的 lat/lng/alt/width 数组。
- **`ReferenceLevel`** — RELATIVE_TO_GROUND / RELATIVE_TO_SURFACE_MODEL。

**用途：** 所有建筑环境实体的空间原语。

#### 1.15.3 — `builtenv/built_entity.proto`
建筑环境的中心实体模型。一个 `BuiltEntity` 包含 oneof `properties`，涵盖：
- **太阳能**：`SolarPanel`、`SolarStructure`、`SolarStructureComponent`、`BuildingSolarPanel`、`ParkingSolarPanel`（全部带多边形几何 + 能源指标）
- **土地**：`Parcel`、`Block`、`Street`、`ParkingLot`、`Park`、`BuildingLot`
- **结构**：`Building`、`Floor`、`Core`、`Corridor`、`Roof`、`Amenity`、`BuildingUnit`
- **分析**：`Views`（栅格集合）、`GroundSunlightHours`（栅格集合）

每个实体携带几何、指标（area、energy、parking counts、sunlight hours、sky access percentage）、分类（parking type、open space type、structure display name）。

**用途：** 建筑环境的通用实体图 — 每个地块、建筑、楼层、太阳能板、树木和视图分析结果都是一个 `BuiltEntity`。

#### 1.15.4 — `builtenv/built_environment.proto`
建筑环境引擎的主要 API 接口。定义 RPC 请求/响应结构。

**关键消息：**
- `CreateDesignGenerationInputRequest` / `DesignGenerationInput` — 设计生成请求，带状态机（RUNNING/SUCCEEDED/FAILED/DRAFT）、通用 solar/new-build/edit 输入和查询元数据。
- `GenerateDesignsRequest/Response` — 触发设计生成。
- `ListDesignsRequest/Response` / `Design` — 浏览生成的设计，含类型（SOLAR/NEW_BUILD）、标签（BEST_OVERALL_DESIGN）、可下载文件（financial model、Rhino、DXF、images）和时间戳。
- `ListDesignGenerationInputsRequest/Response` — 浏览设计生成输入配置。
- `ExportToEarthMapRequest/Response` — 将设计导出到 Earth 地图要素。
- `BatchGetUserQuotasRequest/Response` — 设计生成和太阳能分析的配额管理。
- `GetZoningRequest/Response` — 检索地块的分区数据（zone code、name、type、rules）。
- `DesignViewEnumeration` — 7 种视图预设：SUMMARY、FULL_DESIGN、SOLAR_ENERGY_POTENTIAL、NEW_BUILD_BY_USE_TYPE、NEW_BUILD_BY_APARTMENT_TYPE、NEW_BUILD_SOLAR_ENERGY_POTENTIAL、NEW_BUILD_SUNLIGHT_HOURS。

**用途：** 建筑环境设计引擎的主要 CRUD API。管理完整生命周期：地块选择 → zoning 查询 → 建筑模板选择 → 设计生成 → 设计浏览 → 导出到 Earth 地图。

#### 1.15.5 — `builtenv/building_configuration.proto`
定义**建筑模板**及其**配置**：
- **`BuildingTemplate`** — 命名模板，含 `BuildingConfiguration` 和 `BuildingTemplateType`（26 种类型，从 POINT_LOADED_WITH_STREET_PODIUM 到 PARKING_GARAGE）。
- **`BuildingConfiguration`** — 楼层组（above/basement-grade）、地块尺寸限制、建筑组合。
- **`FloorGroup`** — 使用类型（按类别或 ID）、高度、最小/最大数量、损失因子、楼层组合 ID，以及 **`GeometryConfiguration`**。
- **`GeometryConfiguration`** — 程序化几何操作：Bar（COURTYARD/L_SHAPED/U_SHAPED/SINGLE_BAR/MULTI_COURTYARD）、Setback、Simplify、Floating、Wrap — 每个操作都有详细参数。
- **`BuildingInput`** — 运行时建筑配置，带选择/推荐标志。

**用途：** 程序化建筑引擎。描述建筑如何生成 — 其使用类型、楼层配置以及生成 3D 模型的几何操作。

#### 1.15.6 — `builtenv/raster.proto`
栅格数据平面表示：
- **`Raster`** — 包含一个或多个 `RasterPlane`。
- **`RasterPlane`** — 原点（lat/lng/alt）、法向量、X 轴方向、范围（rx/ry 米）、行/列维度、通道。
- **`Channel`** — 命名 float 通道，带空值处理；可以是 float 缓冲区或单值。

**用途：** 通用 2.5D 栅格数据，用于视图、日照和其他空间分析。

#### 1.15.7 — `builtenv/metrics.proto`
**关键消息：**
- **`SummarizedMetrics`** — 太阳能指标、新建筑指标、运营能耗、太阳能板产出量、可持续性、太阳能财务、总体评分。
- **`OperationalEnergyMetrics`** — 基准 vs. 实际年能源使用量（MWh）。
- **`SolarPanelsYieldMetrics`** — 年发电量（MWh）、安装规模（MW）、面板数量、表面积。
- **`SolarFinancialMetrics`** — 购买和租赁场景，含年/25 年指标：NPV、投资回收期、电费节省、激励措施、净计量节省、系统总成本。
- **`SustainabilityMetrics`** — 10 年、年度和全生命周期的排放量，含按来源分解（运营/隐含/交通）和按缓解策略分解（太阳能/供暖电气化/材料/停车减少）。

**用途：** 建筑环境设计的全面可持续性和财务分析指标。

#### 1.15.8 — `builtenv/design_content.proto`
**关键消息：**
- **`DesignContent`** — 设计状态（SUCCEEDED/FAILED/RUNNING）、建筑实体、汇总指标、设计迭代键、ID 映射、可用视图预设。
- **`DesignState`** — 设计生成的状态机。

**用途：** 生成设计的实际内容负载。

#### 1.15.9 — `builtenv/new_build_run_inputs.proto`
**关键消息：**
- **`NewBuildRunInputs`** — 新建设计运行的全面输入：
  - `ZoningInputs` — 每地块的分区规则（coverage ratio、FAR、max height、green space ratio、setbacks），含默认/覆盖状态
  - `UseTypeInputs` — 使用类型定义，含 GFA 分配要求
  - `UnitMixInputs` — 每种使用类型的公寓/单元组合分布
  - `ProgramInputs` — 目标 GFA（全场地或每地块）、绿地目标、停车目标（每 100 m² 或每单元的车位、地面/地下策略）
  - `SustainabilityInputs` — 屋顶太阳能开关、供暖电气化、建筑材料来源（BEST_PRACTICE/CONSERVATIVE）、停车减少
  - `MetricsInputs` — 光线追踪、步行性、财务指标开关
  - `BuildingInputs` — 建筑模板配置

**用途：** 城市规划输入模型。允许用户为自动化设计生成指定分区约束、项目目标、可持续性目标和建筑偏好。

#### 1.15.10 — `builtenv/solar_run_inputs.proto`
**关键消息：**
- **`SolarRunInputs`** — 成本参数（roof/parking lot cost per W）、电费费率和升级、净计量偏好（EXCESS/NOT_APPLICABLE/ALL）、融资参数（债务比例、贷款利率、租赁利率、PPA 费率）、年电力/燃料使用量。

**用途：** 太阳能安装财务分析输入。

#### 1.15.11–1.15.14 — 编辑操作
- **`edit_design_inputs.proto`** — `EditDesignInputs` 含 `Edit` oneof，涵盖 11 种编辑类型：添加/移除楼层、在类型之间转换建筑/公园/停车场、重新生成建筑、调整地块项目。
- **`block_edit.proto`** — `ConvertBlockToParkEdit`、`AdjustBlockProgramEdit`。
- **`building_edit.proto`** — `AddFloorsEdit`、`RemoveFloorEdit`、`ConvertBuildingToParkEdit`、`ConvertBuildingToParkingLotEdit`、`RegenerateBuildingEdit`、`ConvertToBuildingEdit`。
- **`park_edit.proto` / `parking_lot_edit.proto`** — 公园/停车场转换编辑。

**用途：** 设计迭代 — 允许用户通过结构化的编辑图修改生成的设计。

#### 1.15.15 — 其余辅助文件
- **`use_type_class.proto`** — 10 种使用类型类别：RESIDENTIAL、OFFICE、INDUSTRIAL、RETAIL、COMMUNITY、HOTEL、EDUCATION、MECHANICAL、PARKING、OTHER。
- **`building_far_range.proto`** — 建筑输入和模板的楼面面积比估算。
- **`design_content_id_map.proto`** — 将内部使用类型 ID 映射到显示名称和类别。
- **`design_view_preset.proto`** — 视图预设类型（6 种预设对应不同可视化模式）。
- **`new_build_metrics.proto`** — `BuiltEntitySummarizedMetrics`（coverage、street wall、facade area、profit on cost、park quality）和 `ParkQualityMetrics`（shadow/sun hours、green access）。

---

### 1.16 — `google/internal/earth/v1/earth_mate/earth_mate.proto`

| 属性 | 详细信息 |
|----------|--------|
| **包名** | `google.internal.earth.v1.earthmate` |
| **依赖项** | `geo/earth/proto/commands`、`geo/earth/proto/earth_mate/*`、`shared.proto`、`net/proto2/contrib/validator`、`storage/datapol`、`wireless/android/privacy` |

**关键消息：**

- **`ChatRequestWrapper`** — 客户端元数据 + `EarthMateQueryRequest`（Earth Mate 聊天的包装器）。
- **`StreamChatRequest`** — 流式聊天，含 `EarthMateQueryRequest`。
- **`StreamChatResponse`** — Chat ID + oneof `PartialUpdate` 或 `FinalUpdate`。
- **`PartialUpdate`** — 流式局部更新：agent thinking state、commands、output text、attributions、thought trace、status update。
- **`FinalUpdate`** — 最终响应：commands、output text、query execution metadata、viewport file attachment。
- **`RateRequestWrapper`** — Earth Mate 响应的评分反馈。
- **`AgentStatus`** — THINKING / PROCESSING 生命周期。
- **`AgentThinkingState`** — 用于代理推理显示的状态文本。

**用途：** AI 助手（"Earth Mate"）流式聊天 API。支持多轮对话式 AI，具有流式局部更新、命令执行、署名和文件附件功能。

---

## 2. `google/api/`（11 个文件）— API 注解

标准 Google API 基础设施注解。全部为 proto3。

| 文件 | 包名 | 关键内容 | 用途 |
|------|---------|------------|---------|
| **`annotations.proto`** | `google.api` | 用 `HttpRule`（field 72295728）扩展 `MethodOptions` | 主要的 HTTP 到 RPC 绑定注解 |
| **`http.proto`** | `google.api` | `Http`、`HttpRule`（GET/PUT/POST/DELETE/PATCH/CUSTOM 模式、body、response_body、additional_bindings、media_upload/download、authorizations、CORS） | HTTP 协议转换规则 |
| **`client.proto`** | `google.api` | `Publishing`、`ClientLibrarySettings`、`MethodSettings`、`JavaSettings/CppSettings/PhpSettings/...`、`BatchingConfigProto`、`SelectiveGapicGeneration`、service/method 扩展 | 客户端库生成配置 |
| **`field_behavior.proto`** | `google.api` | 11 个 `FieldBehavior` 枚举值（OPTIONAL/REQUIRED/OUTPUT_ONLY/INPUT_ONLY/IMMUTABLE/IDENTIFIER/...）、扩展 `FieldOptions` | 用于代码生成的字段语义 |
| **`visibility.proto`** | `google.api` | `Visibility`、`VisibilityRule`（selector、restriction、failure_mode）、扩展 Service/Method/Message/Field/Enum/EnumValue 选项 | API 可见性控制 |
| **`launch_stage.proto`** | `google.api` | 8 阶段枚举：UNIMPLEMENTED→PRELAUNCH→EARLY_ACCESS→ALPHA→BETA→GA→DEPRECATED | API 成熟度追踪 |
| **`policy.proto`** | `google.api` | `FieldPolicy`、`OrgPolicy`、`MethodPolicy`、`PolicyAspect`、`MetadataPolicy`、扩展 FieldOptions 和 MethodOptions | 资源策略/IAM 集成 |
| **`auditing.proto`** | `google.api` | `Auditing`、`AuditingRule`（selector、directive）、扩展 FieldOptions 和 MethodOptions | 审计日志配置 |
| **`authz.proto`** | `google.api` | `AuthorizationRule`（selector、permissions）、扩展 FieldOptions | 授权规则 |
| **`inclusion.proto`** | `google.api` | `ApiInclusion`（scopes）、扩展 FileOptions | API 范围包含 |
| **`media.proto`** | `google.api` | `MediaUpload`（enabled、mime_types、max_size、resumable support）、`MediaDownload` | 媒体上传/下载规范 |

**跨领域依赖：** 几乎所有 Earth API proto 文件和 `google/longrunning/operations.proto` 都导入这些注解。它们构成了 Google API 基础设施的基础 — HTTP 协议转换、客户端库生成、IAM 策略、审计和可见性控制。

---

## 3. `google/protobuf/`（7 个文件）— 标准 Well-Known 类型

整个代码库中使用的标准 protobuf well-known 类型：

| 文件 | 关键消息 | 用途 |
|------|---------------|---------|
| **`any.proto`** | `Any`（type_url + value bytes） | 通用消息包装 |
| **`duration.proto`** | `Duration`（seconds + nanos） | 时间持续时长 |
| **`empty.proto`** | `Empty` | 空响应占位符 |
| **`field_mask.proto`** | `FieldMask`（paths） | 部分更新字段选择 |
| **`struct.proto`** | `Struct`、`Value`、`ListValue`、`NullValue` | 动态 JSON 类数据 |
| **`timestamp.proto`** | `Timestamp`（seconds + nanos） | 绝对时间点 |
| **`wrappers.proto`** | `DoubleValue`、`FloatValue`、`Int64Value`、`BoolValue`、`StringValue`、`BytesValue` | 可空原始类型包装器 |

**使用情况：** 在所有领域被广泛导入 — timestamps 用于时间数据，durations 用于超时，field masks 用于部分更新，Any 用于通用负载。

---

## 4. `google/type/`（8 个文件）— 标准领域类型

标准 Google API 通用类型：

| 文件 | 关键内容 | 用途 |
|------|------------|---------|
| **`latlng.proto`** | `LatLng`（latitude、longitude double） | 地理坐标 |
| **`color.proto`** | `Color`（RGBA 带 alpha 包装器） | 颜色表示 |
| **`date.proto`** | `Date`（year、month、day） | 日历日期 |
| **`datetime.proto`** | `DateTime`（带时区偏移和 TimeZone） | 带时区的 DateTime |
| **`dayofweek.proto`** | `DayOfWeek` 枚举（7 天） | 星期枚举 |
| **`timeofday.proto`** | `TimeOfDay`（hours、minutes、seconds、nanos） | 挂钟时间 |
| **`money.proto`** | `Money`（currency_code、units、nanos） | 货币值 |
| **`postal_address.proto`** | `PostalAddress`（完整地址字段） | 物理地址 |

---

## 5. `google/rpc/`（2 个文件）— 错误处理

| 文件 | 包名 | 关键内容 | 用途 |
|------|---------|------------|---------|
| **`status.proto`** | `google.rpc`（proto3） | `Status`（code int32、message string、details []Any） | 标准 RPC 错误状态 |
| **`error_extension.proto`** | `google.rpc`（proto2） | 用 `Status error_details_ext` 扩展 `proto2.bridge.MessageSet` | 错误详情扩展机制 |

**使用情况：** `Status` 被 `google.longrunning.Operation`、`builtenv.DesignGenerationInput` 以及整个代码库中的其他异步/回调模式使用。

---

## 6. `google/geo/type/viewport.proto`

| 属性 | 详细信息 |
|----------|--------|
| **包名** | `google.geo.type`（proto3） |
| **依赖项** | `google/api/field_behavior`、`google/api/inclusion`、`google/type/latlng` |

**关键消息：**
- **`Viewport`** — 低和高 `LatLng` 点，定义一个边界框。

**用途：** 标准化地理视口类型，用于 Geo API。与 `shared.proto` 中 Earth 内部的 `Viewport`（使用 north/south/east/west double）互为补充。

---

## 7. `google/longrunning/operations.proto`

| 属性 | 详细信息 |
|----------|--------|
| **包名** | `google.longrunning`（proto3） |
| **依赖项** | `google/api/annotations`、`google/api/client`、`google/api/field_behavior`、`google/protobuf/any`、`google/protobuf/duration`、`google/protobuf/empty`、`google/rpc/status`、`net/proto2/proto/descriptor`、`third_party/boundary_proxy/proto_compare/annotation` |

**关键消息与服务：**
- **Service `Operations`** — `ListOperations`、`GetOperation`、`DeleteOperation`、`CancelOperation`、`WaitOperation`。完整的异步操作生命周期。
- **`Operation`** — name、metadata（Any）、done flag、oneof result（error Status 或 response Any）。
- **`OperationInfo`** — response_type、metadata_type — 扩展 `MethodOptions`（field 1049）以注解长时间运行的 RPC。

**用途：** 标准异步长时间运行操作服务 — 被 Earth 图层导入/创建 API 用于异步处理。

---

## 8. `google/research/` — Research API

**路径：** `google/research/researchpartnerships/v1/rsgeofm/`
**内容：** Geo 基础模型（RSGeoFM）的研究合作伙伴关系。在本仓库中存在极少。

---

## 9. `knowledge/`（11 个文件）— 知识图谱

### 9.1 — `knowledge/graph/proto/triple.proto`
**包名：** `knowledge_graph` | **依赖项：** `devtools/protoshop`、`google/api/inclusion`、`storage/datapol`、`storage/graph/bfg`

**关键消息：**
- **`Triple`** — 经典 RDF 三元组：subject（sub）、predicate（pred）、object（TripleObj）、is_negation flag。支持出处链、限定符集。
- **`TripleObj`** — 类型化对象值：id、string、URI、bool、int64、uint64、double、datetime、duration、s2cell_id、proto（通用 protobuf）、nested struct。含 locale。
- **`NestedStruct`** — 用于复合值的谓词-对象组。
- **`Provenance`** — 丰富的出处：process、source URL/doc ID、source category（THIRD_PARTY/CURATION/PARTNER_FEED/EXTRACTION）、restrictions（REQUIRES_CITATION、REQUIRES_PCOUNSEL_REVIEW）、SPII certification、Livegraph metadata、policy metadata。
- **`TripleSet` / `Qualifier` / `QualifierSet`** — 带限定符的三元组集合。
- **`SourceContentReference`** — ID 命名空间 + ID，用于内容出处。

**用途：** 核心知识图谱数据模型。`Triple` 消息是结构化知识的基本单元 — 主体通过谓词与对象链接，并具有丰富的出处追踪。用作嵌入其他 proto 的 `MessageSet` 扩展。

### 9.2 — `knowledge/graph/schema/storage/format/options.proto`
**包名：** `kg_schema.fmt`

扩展 `MessageOptions` 和 `FieldOptions`，包含格式化选项（`MessageFormatOptions`：single_line、sort_by；`FieldFormatOptions`：is_sorted）。处理 KG schema 存储的格式化打印。

### 9.3 — `knowledge/graph/protomesh/protomesh.proto`
知识图谱的 Protomesh 集成。

### 9.4 — `knowledge/graph/data_governance/proto/attributes/location.proto`
知识图谱的数据治理位置属性。

### 9.5 — `knowledge/graph/util/datetime/datetime.proto`
Knowledge Graph DateTime 工具类型。

### 9.6 — `knowledge/proto/queryunderstandingservice/`（4 个文件）
Query Understanding Service 解析扩展：
- `query_resolution_extensions.proto` — 查询解析管道配置
- `result_extensions.proto` — 单个查询结果扩展
- `result_set_extensions.proto` — 结果集元数据
- `per_query_extensions.proto` — 每查询配置

### 9.7 — `knowledge/verticals/crisisresponse/sos/proto/`（2 个文件）
危机响应垂直领域集成：
- `alert_severity_level.proto` — 警报严重级别枚举
- `event_type.proto` — 危机事件类型分类

---

## 10. `gws/`（15 个文件）— Google Web Server

### 10.1 — `gws/mothership/`（Mothership RPC 框架）
**包名：** `gws.mothership`

**关键文件：**
- **`mothership_options.proto`** — 用 `MothershipRpcOptions`、`MothershipRequestOptions`、`MothershipResponseOptions` 扩展 Service/Method/Message 选项。控制客户端请求与服务端上下文之间的字段传播、流式行为、HTTP 端点负载均衡。
- **`http_endpoint_load_balancing_type.proto`** — 负载均衡类型枚举。

**API 数据类型：**
- `api/v1/common/app/applink.proto` — 应用深度链接
- `api/v1/common/images/`（5 个文件）— Image、ImageId、ScalableImage、RasterImage、ImageSource — 全面的图像表示
- `api/v1/common/text/style.proto`、`styled_text.proto` — 文本样式
- `api/v1/common/net/url.proto` — URL 类型

**用途：** Google 内部 RPC 框架（"Mothership"）用于 Web 服务。提供字段级别的请求/响应上下文传播控制、负载均衡和通用 Web 数据类型（images、text、URLs）。

### 10.2 — `gws/shared/protos/`（4 个文件）
共享 GWS 上下文类型：
- **`language_context.proto`** — `LanguageContext`（language_code）
- **`web_parameters_request_context.proto`** — Web 请求参数
- **`geolocation_context.proto`** — Web 请求的地理位置上下文
- **`user_ip_context.proto`** — 用户 IP 地址上下文

**用途：** 请求上下文传播原语 — 语言、位置、IP 和 Web 参数，在 GWS 服务栈中流动。

---

## 11. `storage/`（9 个文件）— Datapol、GoogleSQL、Graph Storage

### 11.1 — `storage/datapol/annotations/proto/`（3 个文件）

#### `semantic_annotations.proto`
**包名：** `datapol`

整个项目中**导入最广泛的注解文件**。提供：
- **`Qualifier`** — 21 个布尔标志，用于数据分类：is_public、is_google、other_user、is_partner、is_publisher、has_explicit_consent、is_encrypted、non_user_location、limited_access、auto_tombstone、auto_delete_within_wipeout、auto_delete_within_180_days、is_access_target、is_user_visible、is_access_grantee、is_actor、is_action_target、is_action_time、is_internal_only、is_quasi_identifier。
- **`LocationQualifier`** — 位置精度：non_user_location、user_indirect_location、user_place_of_interest、precise_location、country_level_location。
- **`SemanticType`** — **150+ 种语义类型枚举**，涵盖：
  - 伪匿名 ID（ZWIEBACK、PREF、BISCOTTI、ANALYTICS 等）
  - 可识别 ID（EMAIL、NAME、PHONE_NUMBER、GAIA、USERNAME）
  - SPII（GOVERNMENT_ID、HEALTHCARE_INFO、RACE_ETHNICITY、POLITICAL_BELIEFS 等）
  - 支付（CHD_PAN、CHD_INFO、PAYMENTS_TRANSACTION_INFO）
  - 网络（IP_ADDRESS、HARDWARE_ID、USER_AGENT）
  - 位置（PRECISE/COARSE_LOCATION）
  - 内容（USER_QUERY、AUDIO、MUSIC、EMAIL_CONTENT、DOCUMENT_CONTENT）
  - 安全（SECURITY_KEY、ACCOUNT_CREDENTIAL）
  - 云（CLOUD_PROJECT_ID、CLOUD_IAM_ROLE）
  - Google 生成的数据（OPERATIONAL_METRICS、USER_METADATA）
- **`FieldDetails` / `MessageDetails` / `EnumDetails`** — 详细注解容器。
- **扩展** — 扩展 FieldOptions（semantic_type、qualifier、location_qualifier、field_details、data_format、retention）、MessageOptions、FileOptions、EnumOptions。

**用途：** **数据分类和隐私治理框架。** Google 中的每个 proto 字段都可以用其语义类型（包含何种数据）、限定符（谁可以访问）和位置精度进行注解。这为自动化隐私审查、数据保留策略和访问控制提供支持。

#### `datapol_classification.proto`
**包名：** `datapol.classification`

用 `Options`（implies、description、default_semantic_context）扩展 `EnumValueOptions`，用于分类层次结构。

#### `retention_annotations.proto`
保留规范注解。

### 11.2 — `storage/googlesql/public/proto/`（2 个文件）
- `wire_format_annotation.proto` — GoogleSQL 有线格式注解
- `type_annotation.proto` — GoogleSQL 类型注解

### 11.3 — `storage/graph/bfg/proto/`（4 个文件）
Bigstore File Group（BFG）元数据：
- `bfg_data.proto` — 核心 BFG 数据结构
- `livegraph_metadata.proto` — Livegraph 出处元数据（被 Knowledge Graph 导入）
- `policy_metadata.proto` — BFG 文件的策略元数据
- `spii_certification.proto` — SPII（敏感 PII）认证数据

---

## 12. `travel/`（8 个文件）— Hotels、Transport、Attractions

| 文件 | 包名 | 关键内容 | 用途 |
|------|---------|------------|---------|
| **`hotels/servers/.../annotation_type.proto`** | 酒店排名注解类型枚举 | 排名注解配置 |
| **`frontend/common/proto/amenities/amenities.proto`** | 酒店/地点设施类型 | 设施分类 |
| **`frontend/common/proto/image.proto`** | 旅行图片类型 | 图片表示 |
| **`frontend/common/proto/entity_type.proto`** | 旅行实体类型枚举 | 实体分类 |
| **`guide/attractile/proto/category.proto`** | 景点类别 | 兴趣点类别 |
| **`transport/proto/shared/request_live_pricing_mode.proto`** | 实时定价模式枚举 | 交通定价模式 |
| **`transport/proto/shared/client_enums.proto`** | 交通客户端枚举 | 共享交通枚举 |
| **`transport/proto/price/booking_module_options.proto`** | 预订模块定价选项 | 交通预订定价 |

**用途：** Google Travel 垂直领域 — 酒店排名注解类型、设施分类法、景点类别和交通定价/预订。被 Earth 的旅行相关功能使用。

---

## 13. `search/`（8 个文件）— Search Context、Logging、Rendering

### 13.1 — `search/context/contextgeneration/context_atom_container.proto`
搜索上下文原子容器 — 用于搜索上下文传播。

### 13.2 — `search/logging/`（2 个文件）
- `propagation/logging_sensitivity.proto` — 日志敏感性分类
- `redaction/enums.proto` — 日志脱敏枚举

### 13.3 — `search/rendering/xuikit/elements/proto/`（5 个文件）
用于搜索结果显示渲染的 XUIKit 元素协议：
- `elements_output.proto` — 核心元素输出
- `elements_output_extensions.proto` — 输出扩展
- `data_store_mutation_payload.proto` — 数据存储变更
- `data_store_batch_update.proto` — 批量更新负载
- `js_module_set_update.proto` — JavaScript 模块更新负载

**用途：** Google 搜索渲染基础设施 — 搜索结果如何通过 XUIKit 元素在客户端渲染。

---

## 14. `privacy/`（8 个文件）— 数据治理

### 14.1 — `privacy/data_governance/attributes/proto/`（2 个文件）

#### `classification.proto`
**包名：** `privacy.data_governance.attributes.classification`（proto3）

**关键消息：**
- **`Category`** — 数据分类：location（含 LocationType、Coarse、Traces 子枚举）、financial、payment_instrument、health、hipaa、employee、children_product、audio_data、has_xfood、minors_data、user_class（managed accounts）、smart_home、children data lifecycle type。
- **`GeoLocation`** — 位置类型（USER_LOCATION、USER_DIRECT/INDIRECT/CONTEXTUAL LOCATION、USER_PLACE_OF_INTEREST、USER_HOME/WORK_LOCATION、NOT_A_USER_LOCATION）、粗粒度级别（COUNTRY-level、1+1-level、3+1-level）、traces（multiple/single location identification）。
- **`MinorData`** — Teens + Children，含子类别（unicorns、griffins、edu_children）。
- **`UserClass`** — 受管（non-edu/edu）和任何受管账户标志。

**关键枚举：**
- **`Source`** — 数据来源：GOOGLE、USER、END_USER、CUSTOMER、PUBLIC、THIRD_PARTY、BUSINESS_USER。
- **`SemanticContext`** — METADATA、CONTENT、CORE_CONTENT、SECURITY_CONFIGURATION、CONFIGURATION、ATTRIBUTE。
- **`Confidentiality`** — PUBLIC、CONFIDENTIAL、NEED_TO_KNOW。
- **`Identifiability`** — IDENTIFIABLE、PSEUDONYMOUS、ANONYMOUS、TWO_PHASE_AGGREGATED。
- **`Pseudonymization`** — 11 级匿名化粒度。
- **`DatasetTag`** — HULK、OOLONG、PHOTOS data、GMAIL、PAYMENTS、LOCAL_REVIEWS 等。

扩展 `EnumValueOptions` 和 `FieldOptions`，包含 label、description、parent、expected_confidentiality、disabled、go_link、deprecated_message 字段。

**用途：** **隐私分类框架** — 项目中最全面的数据治理分类系统。每个数据字段都可以用其类别、来源、可识别性、伪匿名化级别和机密性进行注解。为隐私审查自动化提供支持。

#### `purpose.proto`
**包名：** `privacy.data_governance.attributes`（proto3）

**关键消息：**
- **`ProcessingPurpose`** — 跨产品处理、跨用途标志、广告处理目的。
- **`Purpose` 枚举** — 33 种处理目的：PROVISION_OF_SERVICE、ADS_RELATED_PROVISION、PRODUCT_PERSONALIZATION、CONTEXTUALIZATION、REVENUE_GENERATION、USER_SUPPORT、CLOUD_PROCESSING_INFRASTRUCTURE、ACCOUNT_MANAGEMENT、MODEL_TRAINING、VERIFICATION_TESTING、DEBUGGING_AND_MONITORING、BUSINESS_ANALYSIS、MARKET_RESEARCH、RESEARCH_EXPERIMENTATION、TRUST_SAFETY（ANTI_FRAUD/ANTI_ABUSE/SECURITY）、COMPLIANCE_LEGAL_SUPPORT（TAKEOUT/ELI）等。

**用途：** 隐私合规的处理目的声明 — 定义在 GDPR 和类似法规下处理数据的原因。

### 14.2 — `privacy/pattributes/`（4 个文件）
隐私属性框架：
- `annotations/proto_field.proto` — Proto 字段注解集成
- `containers/proto_field/proto_field_attributes.proto` — 容器特定属性
- `containers/proto_field/proto_field_upload_justification.proto` — 上传理由
- `public/proto/collection_basis.proto`、`collection_basis_expression.proto` — 收集基础和同意基础表达式

### 14.3 — `privacy/ads/user_data_enforcement/data-usage.proto`
广告特定的数据使用属性。

---

## 15. `java/`（20 个文件）— JSPB 和 Java Proto

### 15.1 — Java Protobuf Bridge（JSPB）— `java/com/google/apps/jspb/`
**包名：** `jspb`

定义 Java Script Protobuf Bridge 的 4 个文件：
- **`jspb.proto`** — 核心 JSPB 扩展：`JsType` 枚举（INT52/NUMBER/STRING/GBIGINT）、字段选项（ignore、jstype）、消息选项（message_id、generate_xid）、文件选项（js_namespace、legacy nullable accessors、binary format methods）。
- **`jspb_generate_object_format.proto`** — 对象格式生成
- **`jspb_lazy_extension.proto`** — 延迟扩展加载
- **`jspb_disable_randomization.proto`** — 随机化控制

**用途：** JavaScript protobuf 桥 — 定义 proto 消息如何映射到 JavaScript 类型及序列化行为。

### 15.2 — 其他 Java Proto
- **`java/com/google/protobuf/contrib/autoprotocopier/annotations.proto`** — Auto protocopier 注解
- **`java/com/google/protobuf/contrib/j2cl/options/js_enum.proto`** — J2CL JS 枚举选项
- **`java/com/google/i18n/phonenumbers/phonenumber.proto`** — 电话号码类型
- **`java/com/google/geo/production/antiscraping/`**（2 个文件）— 反爬取地理数据类型注解和受限响应注解
- **`java/com/google/geo/earth/operations/proto/`**（4 个文件）— Earth 异步操作元数据：`operation_metadata`、`operation_type`、`client_supplied_data`、`operation_progress`
- **`java/com/google/wireless/googlenav/proto/user_event3_enums.proto`** — 用户事件枚举
- **`java/com/google/travel/frontend/hotels/search/protos/`**（6 个文件）— 酒店搜索：`map`、`notable_category_enum`、`highlight_type`、`notable`、`nearby_entity`、`previous_trigger_decision`

---

## 16. `cityblock/`（6 个文件）— 街景影像（CityBlock）

| 文件 | 包名 | 关键内容 | 用途 |
|------|---------|------------|---------|
| **`public/pose.proto`** | `cityblock`（editions） | `Pose`（lat/lng/alt + roll/pitch/heading in degrees）、`PoseCovariance`（covariance matrix floats） | 街景影像的 6-DOF 相机姿态 |
| **`base/collection_type.proto`** | CityBlock | 采集类型枚举 | 影像采集类型分类 |
| **`base/vehicles.proto`** | CityBlock | 车辆规格类型 | 采集车辆定义 |
| **`pose/service/version.proto`** | CityBlock | 姿态服务版本 | 服务版本管理 |
| **`streetsmart/business_discovery/public/imagery_observation.proto`** | StreetSmart | 用于商业发现的影像观测 | 商业店面影像 |
| **`streetsmart/business_discovery/tools/nerf/pano_selection_result.proto`** | StreetSmart | NeRF 全景选择结果 | 神经辐射场全景选择 |

**用途：** Google 的街景影像和地图系统（CityBlock/StreetSmart）。处理相机姿态、车辆元数据、影像采集类型和来自街景照片的商业发现。值得注意的是，这是一个 proto **editions** 文件。

---

## 17. `photos/`（5 个文件）— FIFE Serving

| 文件 | 包名 | 关键内容 | 用途 |
|------|---------|------------|---------|
| **`fife/fife_status.proto`** | FIFE | FIFE 图片服务状态 | 图片服务管道状态 |
| **`fife/logs_types.proto`** | FIFE | FIFE 日志类型 | 服务日志类型定义 |
| **`protobuff/status/retryable_extension.proto`** | Photos | 可重试状态扩展 | 错误重试分类 |
| **`serving/client/urls/environments/osid_domain.proto`** | Photos | OSID 域配置 | 服务 URL 域配置 |
| **`serving/integrations/identifiers/signing_keys/request_signing_key_info.proto`** | Photos | 请求签名密钥信息 | 集成安全密钥 |

**用途：** Google Photos FIFE（FIFE Is Fast Encoding）图片服务基础设施。Android 隐私注解收集基础定义。

---

## 18. `net/`（7 个文件）— Proto2 基础设施

| 文件 | 包名 | 关键内容 | 用途 |
|------|---------|------------|---------|
| **`proto2/proto/descriptor.proto`** | `proto2` | 完整的 `FileDescriptorSet`、`FileDescriptorProto`、`DescriptorProto`、`FieldDescriptorProto`、所有选项消息 | Protobuf 描述符反射 — proto2 schema 定义 |
| **`proto2/bridge/proto/message_set.proto`** | `proto2.bridge` | `MessageSet` — 可扩展消息容器 | 向后兼容的消息扩展机制 |
| **`proto2/contrib/validator/annotations.proto`** | `validator` | `FieldValidationRule`（predicates、oneof、element predicates）、`Definitions`、`OneOfGroup`、扩展 Message/Field/Oneof 选项 | Proto2 字段验证框架 |
| **`proto2/contrib/http/options.proto`** | HTTP 注解 | Proto2 的 HTTP 协议选项 |
| **`proto2/contrib/output_source_markup/options.proto`** | 输出源标记 | 代码生成源标记 |
| **`proto2/contrib/js_proto/public/field_annotations.proto`** | JSPB | JS proto 字段注解 |
| **`loadshedding/proto/request_qos.proto`** | 负载削减 | 负载削减的请求 QoS 定义 |

**用途：** Proto2 基础设施层。`descriptor.proto` 是所有 proto2 消息的基本反射 schema。`message_set.proto` 启用了知识图谱三元组和错误详情所使用的 `MessageSet` 扩展机制。validator 框架提供运行时字段验证。

---

## 19. `third_party/`（5 个文件）

| 文件 | 关键内容 | 用途 |
|------|------------|---------|
| **`boundary_proxy/proto_compare/annotation.proto`** | Proto 对比注解 | 边界代理测试工具 |
| **`redwood/infrastructure/proto/linear_algebra.proto`** | 线性代数类型（vectors、matrices） | 渲染的 3D 数学 |
| **`protobuf/cpp_features.proto`** | C++ protobuf 功能标志 | 基于 Edition 的 C++ 代码生成 |
| **`protobuf/internal_options.proto`** | 内部 protobuf 编译器选项 | Protoc 内部配置 |
| **`java/protobuf/java_features.proto`** | Java protobuf 功能标志 | 基于 Edition 的 Java 代码生成 |

---

## 20. 单例（每个领域 <5 个文件）

### 20.1 — `ads/`（3 个文件）
- `ads/travel/base/hotel_amenities.proto` — 酒店设施枚举
- `ads/travel/base/hotel_set_name_structure_enum.proto` — 酒店集合名称结构
- `ads/travel/hotelpricing/protos/deals.proto` — 酒店定价交易

**用途：** 广告旅行垂直领域 — 用于广告投放的酒店设施和定价结构。

### 20.2 — `apps/`（1 个文件）
- `apps/framework/data/caching_annotations.proto` — 应用框架数据缓存注解

### 20.3 — `devtools/`（2 个文件）
- `devtools/protoshop/public/parsing_options/parsing_options.proto` — ProtoShop 解析选项
- `devtools/staticanalysis/pipeline/analyzers/proto_best_practices/proto/optouts.proto` — 静态分析退出定义

### 20.4 — `experiments/`（1 个文件）
- `experiments/framework/extensions/heterodyne/proto/experiment_ids.proto` — Heterodyne 实验框架的实验 ID 定义。

### 20.5 — `frameworks/`（2 个文件）
- `frameworks/client/data/data_annotation.proto` — 客户端数据注解框架
- `frameworks/testing/rpcreplay/processors/rpc_replay_field_option.proto` — RPC 回放测试注解

### 20.6 — `i18n/`（1 个文件）
- `i18n/localization/proto/localized_text.proto` — 带语言支持的本地化文本

### 20.7 — `identity/`（1 个文件）
- `identity/identifiers/proto/namespaced_identifier.proto` — 用于身份系统的命名空间标识符类型

### 20.8 — `lens/`（1 个文件）
- `lens/infra/analytics/privacy/copy.proto` — Lens 分析隐私来源

### 20.9 — `localsearch/`（1 个文件）
- `localsearch/lite/intent.proto` — 本地搜索意图分类

### 20.10 — `location/`（2 个文件）
- `location/country/telephonenumber.proto` — 国家级电话号码类型
- `location/japan/jartic/.../jartic_incident_attribution.proto` — 日本交通事件来源

### 20.11 — `metaweb/`（1 个文件）
- `metaweb/data/topictable/topic.proto` — Metaweb 主题表数据模型

### 20.12 — `monitoring/`（8 个文件 — streamz）
- `monitoring/streamz/proto/streamz.proto` — Streamz 指标采集框架
- `monitoring/streamz/proto/distribution.proto` — 指标分布类型
- `monitoring/streamz/proto/bucketer.proto` — 分桶配置
- `monitoring/streamz/proto/streamz_service_objects.proto` — 服务对象定义
- `monitoring/streamz/proto/streamz_announcement.proto` — Streamz 公告
- `monitoring/streamz/proto/visibility.proto` — 指标可见性控制
- `monitoring/streamz/proto/exemplar_extensions.proto` — 指标示例扩展
- `monitoring/streamz/public/preset_roots_config.proto` — 预设监控根

### 20.13 — `quality/`（1 个文件）
- `quality/ranklab/io/proto/proto_options.proto` — RankLab 质量注解选项

### 20.14 — `repository/`（1 个文件）
- `repository/docchart/extraction/businesshours.proto` — 从文档中提取的营业时间

### 20.15 — `searchbox/`（2 个文件）
- `searchbox/protos/log_enums.proto` — 搜索框日志枚举
- `searchbox/protos/aim/tools.proto` — 搜索框的 AI Model 工具

### 20.16 — `security/`（1 个文件）
- `security/loas/l2/internal/securewrapper/multihop_clients/boundary_proxy.proto` — 多跳安全包装客户端的边界代理安全配置。

### 20.17 — `stats/`（1 个文件）
- `stats/io/proto/expvar_typed.proto` — 用于统计的类型化导出变量定义。

### 20.18 — `testing/`（1 个文件）
- `testing/metricstore/proto/perf.proto` — 性能指标存储定义。

### 20.19 — `util/`（4 个文件）
- `util/task/status.proto` — `StatusProto` 含 code、space、message、canonical_code、MessageSet 扩展支持。`google.rpc.Status` 的替代方案。
- `util/task/codes.proto` — 标准状态码枚举
- `util/task/contrib/proto_status/proto_status.proto` — Proto 状态贡献工具
- `util/geometry2d/r2.proto` — 2D 几何原语（R² 点）

### 20.20 — `video/`（2 个文件）
- `video/youtube/utils/elements/templates/proto/eml_parcel.proto` — YouTube EML parcel 类型
- `video/youtube/utils/elements/proto/annotations.proto` — YouTube 元素注解

### 20.21 — `webserver/`（3 个文件）
- `webserver/shared/gws/eval/gws_eval_proto_options.proto` — GWS 评估选项
- `webserver/shared/gws/experiments/proto/client_data_header.proto` — 实验的客户端数据头
- `webserver/shared/maps/logging/visibility.proto` — Maps 日志可见性控制

### 20.22 — `webutil/`（1 个文件）
- `webutil/html/types/proto/html.proto` — HTML 类型表示

### 20.23 — `wireless/`（3 个文件）
- `wireless/android/privacy/annotations/proto/collection_basis_annotations.proto` — Android 隐私收集基础（被 Earth API 广泛导入）
- `wireless/android/privacy/annotations/proto/collection_basis_annotations_enums.proto` — 收集基础枚举定义
- `wireless/android/gsa_dynamic_updates/release/proto/velour_compat.proto` — GSA 动态更新的 Velour 兼容性

---

## 架构总结

```
┌─────────────────────────────────────────────────────────────────┐
│                    Google Earth Studio WASM                      │
│                     Proto 依赖关系图                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────── 应用层 ──────────────────────────────┐    │
│  │  google/internal/earth/v1/ (48 个文件)                   │    │
│  │  ┌──────────┬──────────┬──────────┬──────────────────┐  │    │
│  │  │  billing │ builtenv │  layers  │ earth_mate (AI)  │  │    │
│  │  │ licenses │ designs  │  data    │ chat/streaming   │  │    │
│  │  │ quotas   │ solar P  │ analysis │ agent reasoning  │  │    │
│  │  │ rate cards│ zoning  │ imports  │ commands+attach  │  │    │
│  │  ├──────────┼──────────┼──────────┼──────────────────┤  │    │
│  │  │  shared  │  config  │  photos  │ terrain/user/    │  │    │
│  │  │ DataLayer│ features │ thumbns  │ settings/quota   │  │    │
│  │  └──────────┴──────────┴──────────┴──────────────────┘  │    │
│  └──────────────────────────────────────────────────────────┘    │
│                              │                                    │
│  ┌─────────────────── API 基础设施 ─────────────────────────┐    │
│  │ google/api/ (11 个文件): HTTP, visibility, policy, audit  │    │
│  │ google/longrunning/: 异步操作                              │    │
│  │ google/rpc/: Status 错误处理                               │    │
│  └──────────────────────────────────────────────────────────┘    │
│                              │                                    │
│  ┌─────────────────── 标准类型 ─────────────────────────────┐    │
│  │ google/protobuf/: Any, Duration, Empty, FieldMask,       │    │
│  │   Struct, Timestamp, Wrappers                            │    │
│  │ google/type/: LatLng, Color, Date, Money, PostalAddress  │    │
│  │ google/geo/type/: Viewport                               │    │
│  └──────────────────────────────────────────────────────────┘    │
│                              │                                    │
│  ┌─────────────────── 隐私与治理 ───────────────────────────┐    │
│  │ storage/datapol/: 语义类型 (150+), 限定符                 │    │
│  │ privacy/data_governance/: 分类, 目的                      │    │
│  │ privacy/pattributes/: 收集基础, 同意                      │    │
│  │ wireless/android/privacy/: Android 隐私 (广泛使用)        │    │
│  └──────────────────────────────────────────────────────────┘    │
│                              │                                    │
│  ┌─────────────────── 基础设施 ─────────────────────────────┐    │
│  │ net/proto2/: descriptor, message_set, validator          │    │
│  │ gws/mothership/: RPC 框架, 请求传播                       │    │
│  │ java/jspb/: JavaScript protobuf 桥                       │    │
│  │ knowledge/graph/: 知识图谱三元组模型                      │    │
│  │ third_party/: Editions, 线性代数, proto compare          │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────── 垂直领域 ─────────────────────────────┐    │
│  │ travel/ 酒店, 交通, 景点                           │    │
│  │ search/ 渲染, 日志, 上下文                           │    │
│  │ cityblock/ 街景影像                              │    │
│  │ photos/ FIFE 图片服务                               │    │
│  │ ads/ 旅行酒店定价                                    │    │
│  │ monitoring/ streamz 指标                              │    │
│  │ video/ YouTube 元素                                  │    │
│  └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 关键跨领域依赖

1. **`storage/datapol/annotations/proto/semantic_annotations.proto`** — 几乎每个 Earth API proto 文件都导入。提供基础隐私分类框架。

2. **`wireless/android/privacy/annotations/proto/collection_basis_annotations.proto`** — Android 隐私收集基础 — 大多数 Earth API 文件都导入。

3. **`net/proto2/proto/descriptor.proto`** — Proto2 反射 schema — 所有注解扩展的基础。

4. **`google/protobuf/timestamp.proto`** — 被各处用于时间数据。

5. **`google/api/*.proto`** — HTTP、field behavior 和 visibility 注解，在整个代码库中被广泛使用。

### 统计信息

| 领域 | 文件数 | Proto 语法 |
|--------|-----------|-------------|
| `google/internal/earth/v1/` | 48 | 大多数 proto2；`capability.proto`、`knowledge_registry.proto` 为 proto3 |
| `google/api/` | 11 | 全部 proto3 |
| `google/protobuf/` | 7 | 全部 proto3 |
| `google/type/` | 8 | 混合 proto2/proto3 |
| `knowledge/` | 11 | proto2 |
| `gws/` | 15 | proto2 |
| `storage/` | 9 | proto2 |
| `travel/` | 8 | 混合 |
| `search/` | 8 | proto2 |
| `privacy/` | 8 | proto3 |
| `java/` | 20 | proto2 |
| `cityblock/` | 6 | proto2（+ 1 个 editions） |
| `photos/` | 5 | 混合 |
| `net/` | 7 | proto2 |
| `third_party/` | 5 | 混合 |
| 单例 | ~50 | 混合 |
| **总计** | **~226** | **~85% proto2，~14% proto3，<1% editions** |
