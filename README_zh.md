# Earth Studio WASM — Protocol Buffer 定义仓库

> **Google Earth Studio（WebAssembly 移植版）—— 纯 Protocol Buffer 协议定义仓库**

---

## 概述

本仓库包含 **1316 个 Protocol Buffer（`.proto`）定义文件**，定义了 **Google Earth Studio** 及其相关地理/地图生态系统的完整数据模型、API 契约、事件日志模式和存储格式。尽管仓库名为 `earthstudiowasm`，但这里**并非** Earth Studio 的 WebAssembly 二进制文件或源代码——它仅仅是原生 C++ Earth Studio 客户端与其 WebAssembly 编译版本所**共享的 protobuf 协议层**。

### 核心数据

| 指标 | 数值 |
|---|---|
| `.proto` 文件总数 | **1,316** |
| Proto2 语法 | 799 个（60.7%） |
| Editions 语法 | 462 个（35.1%） |
| Proto3 语法 | 55 个（4.2%） |
| 顶层领域数 | **38** 个 |
| 最深目录层级 | 8 层（`geo/earth/app/cpp/core/state/...`） |

---

## 仓库目录结构

```
earthstudiowasm/
├── geo/               (411 个文件) — Google Earth 核心与地理领域
├── maps/              (344 个文件) — Google 地图生态系统
├── logs/              (181 个文件) — 事件日志与分析数据模型
├── geostore/          (162 个文件) — 地理数据存储与地物建模
├── google/            (72 个文件)  — Google 标准 proto 与内部 API
├── java/              (20 个文件)  — Java 专属 protobuf 扩展（JSPB）
├── gws/               (15 个文件)  — Google Web Server（母舰 API）
├── knowledge/         (11 个文件)  — 知识图谱数据模型
├── storage/           (9 个文件)   — 存储层（Datapol、GoogleSQL、Graph）
├── travel/            (8 个文件)   — 旅行领域（酒店、交通、攻略）
├── search/            (8 个文件)   — 搜索（上下文生成、日志、渲染）
├── privacy/           (8 个文件)   — 隐私与数据治理注解
├── monitoring/        (8 个文件)   — Streamz 监控基础设施
├── net/               (7 个文件)   — 网络层（proto2 桥接、减载）
├── cityblock/         (6 个文件)   — 街景级影像（StreetSmart、姿态 Pose）
├── photos/            (5 个文件)   — 照片服务（FIFE）
├── third_party/       (5 个文件)   — 第三方集成
├── util/              (4 个文件)   — 工具类（几何、任务状态）
├── wireless/          (3 个文件)   — Android 无线（GSA、隐私）
├── webserver/         (3 个文件)   — Web 服务器（GWS 实验）
├── ads/               (3 个文件)   — 广告（旅行/酒店）
├── video/             (2 个文件)   — YouTube 集成
├── searchbox/         (2 个文件)   — 搜索框（AIM）
├── location/          (2 个文件)   — 位置工具
├── frameworks/        (2 个文件)   — 框架（客户端数据、RPC 重放）
├── devtools/          (2 个文件)   — 开发工具（ProtoShop、静态分析）
├── identity/          (1 个文件)   — 身份标识
├── i18n/              (1 个文件)   — 国际化/本地化
├── experiments/       (1 个文件)   — 实验框架（Heterodyne）
├── apps/              (1 个文件)   — 应用框架
├── testing/           (1 个文件)   — MetricStore
├── stats/             (1 个文件)   — 统计 I/O
├── security/          (1 个文件)   — LOAS/L2 安全封装
├── repository/        (1 个文件)   — DocChart 提取
├── quality/           (1 个文件)   — RankLab
├── metaweb/           (1 个文件)   — MetaWeb 主题表
├── localsearch/       (1 个文件)   — 本地搜索（Lite）
├── lens/              (1 个文件)   — Lens 分析隐私
└── webutil/           (1 个文件)   — Web HTML 类型
```

---

## 各领域详解

### 1. `geo/` — Google Earth 核心层（411 个文件）

这是本仓库最大的领域，代表 Google Earth Studio 的核心。分为 16 个子领域：

| 子领域 | 功能说明 |
|---|---|
| `geo/earth/` | **主 Earth 应用** — C++ 核心 + Studio 展示层 |
| `geo/earth/app/cpp/core/` | 核心数据模型：文档、地物、KML、设计、图层、状态管理 |
| `geo/earth/app/cpp/studio_presenters/` | Earth Studio UI：相机、属性编辑器、底图、设置、视图状态 |
| `geo/earth/app/cpp/state/` | 应用状态（60+ 状态切片）：搜索、图层、文档、设计、引导等 |
| `geo/earth/proto/` | 共享 Earth proto：命令、几何、地图样式、照片、内容创作、错误响应 |
| `geo/ar/` | 增强现实 — 姿态追踪 |
| `geo/case/` | 地图搜索 — 图钉样式、细化、搜索协议 |
| `geo/contentflows/` | 内容发布 — 作者、审核、出版 |
| `geo/enterprise/` | 企业功能 |
| `geo/experience/` | 用户体验 |
| `geo/globetrotter/` | 地球探索 |
| `geo/imagery/` | 卫星/航拍影像元数据 |
| `geo/mobrank/` | 移动端排序 |
| `geo/moderation/` | 内容审核 |
| `geo/photo/` | 照片管理 |
| `geo/render/` | 渲染管线 |
| `geo/search/` | 地理搜索 |
| `geo/serving/` | 服务基础设施 |
| `geo/tasking/` | 任务/工作流管理 |
| `geo/transportation/` | 交通数据 |

#### 核心概念（Earth Studio）

- **`Commands`**（`geo/earth/proto/commands.proto`）：用户操作主模型 —— 包含 **34 种命令类型**：搜索、飞行到指定相机位置、创建/编辑/删除地物、切换图层、渲染设计作品、打开 Earth Mate 对话、图像生成、按需分析（坡度、坡向、挖填方、等高线）等。
- **`ContentEditingModel`**（`geo/earth/proto/contentcreation/content_editing_model.proto`）：完整的地物/文档编辑模型 —— 共 **113 种消息类型**，涵盖 Feature（地物）、Placemark（地标）、Geometry（点/折线/多边形）、Style（图标/折线/多边形/气泡/标签）、Earth 数据图层、色彩调色板、3D 资产以及分类图层输入。
- **`MapStyle`**（`geo/earth/proto/mapstyle.proto`）：底图配置 —— 投影方式（Globe 地球/Mercator 墨卡托）、影像类型（卫星/标准地图/地形）、3D 建筑、云层、经纬网格线、图层开关。
- **`Camera`**（`geo/earth/proto/geometry.proto`）：相机模型，支持 **LookAt**（目标点注视模式）和 **LookFrom**（机位定位模式），含经纬度、高度、方向角、俯仰角、翻滚角和视场角。
- **`RenderableEntity`**（`geo/earth/proto/renderable-entity.proto`）：知识卡片渲染 —— 标题、描述、图片、事实信息、营业时间、网站、地址、电话、实体缩略图。
- **`ErrorResponse`**（`geo/earth/proto/error_response.proto`）：标准化错误处理 —— 9 种错误类型（内部错误、未找到、权限拒绝、无效几何、图层上限、配额超限、数据导入错误、Earth Mate 错误、数据图层错误）。

#### 状态管理（60+ 状态切片）

应用状态高度模块化，每个 UI 功能有独立 proto 文件：
- `search/`（搜索）、`document/`（文档）、`designmanager/`（设计管理）、`earthmate/`（Earth Mate 助手）、`homescreen/`（主屏幕）、`layers/`（图层）、`streetview/`（街景）、`timemachine/`（时光机）、`timelapse/`（延时摄影）、`measuretool/`（测量工具）、`drawingtool/`（绘图工具）、`propertyeditor/`（属性编辑器）、`onboarding/`（新手引导）、`spraypaint/`（喷涂工具）、`solardesigninput/`（太阳能设计输入）、`newbuilddesigninput/`（新建建筑设计输入）、`buildingeditor/`（建筑编辑器）、`siteselection/`（选址）、`feedback/`（反馈）、`pinnedprojects/`（固定项目）、`usererrors/`（用户错误）等。

---

### 2. `maps/` — Google 地图生态系统（344 个文件）

涵盖 Google Maps 完整技术栈的 protobuf 定义：

| 子领域 | 功能说明 |
|---|---|
| `maps/api/shared/paint/` | 地图绘制/渲染 API |
| `maps/directions/` | 导航与路径规划 —— MRP（多路径规划）、定制化、收费、瓦片渲染 |
| `maps/roadtraffic/` | 交通数据 —— 模型类型、中断、路段通行 |
| `maps/transit/` | 公共交通 —— API、行程查找器、票价计算 |
| `maps/tactile/` | 触觉地图渲染 —— 导航、地图标注、共享类型（广告、汽车、电动车、酒店、地点、公交） |
| `maps/pathfinder/` | 路径查找引擎 —— CRP（可定制路径规划）、自动驾驶、回放 |
| `maps/gmm/` | Google 移动地图 —— 相机、WebView API |
| `maps/indoor/` | 室内地图 |
| `maps/limo/` | 网约车服务 —— 响应、服务提供商、费用明细 |
| `maps/dynamicworld/` | Dynamic World 环境数据 |
| `maps/crisis/` | 危机响应地图 |
| `maps/spotlight/` | 聚光灯功能 |
| `maps/paint/` | 地图样式绘制（Legendary、Styler） |
| `maps/versatile/` | 通用地图格式 |
| `maps/shared/` | 共享类型 —— 客户端、通用几何、MapCore API、标签器、测试 |
| `maps/logs/` | Maps 专属日志 |
| `maps/util/` | Maps 工具类 |

---

### 3. `logs/` — 事件日志与分析（181 个文件）

面向生产环境的事件日志数据模型，用于分析和监控：

- **`logs/proto/geo/earth/app/earth_log.proto`**：主 Earth 事件日志 —— 共 **89 种消息类型**，覆盖所有用户交互行为（底图切换、时间控制、照片图层、崩溃、分享链接、测量工具、搜索建议、通知、无障碍功能、文档导入、网络请求、Earth Mate、计费、属性编辑器、数据目录等）。
- **`logs/proto/visual_element/`**：UI 元素日志 —— 地点列表、酒店预订、危机信息、点击、用户操作。
- **`logs/proto/maps/`**：Maps 专属日志 —— 导航 MRP、公交、触觉、路况、Pathfinder、室内/网约车。
- **`logs/proto/geo/transportation/`**：交通分析 —— 行程日志、启示向量。
- **`logs/proto/ads/`**：广告日志 —— 酒店价格、注释。
- **`logs/proto/hotels/`**：酒店地物数据。
- **`logs/proto/logs_annotations/`**：日志注解框架。

---

### 4. `geostore/` — 地理数据存储（162 个文件）

所有地理地物的持久化存储层：

| 子领域 | 功能说明 |
|---|---|
| `geostore/base/proto/` | 核心地理类型 —— FeatureId（地物标识）、Address（地址）、Polyline（折线）、Intersection（路口）、Route（路线）、Elevation（高程）、SpeedLimit（限速）、Parking（停车）、Restriction（限行）、OpeningHours（营业时间）、PriceInfo（价格信息）、TrafficFlow（交通流）、Transit（公交）、Signs（标志牌）、Levels（层级）、CityJSON、Doodle |
| `geostore/edit/` | 地物编辑 |
| `geostore/matching/` | 地物匹配/关联 |
| `geostore/ontology/` | 地理本体 —— 原始概念实例 |
| `geostore/client/` | 客户端 geostore（附件） |
| `geostore/tools/` | Geostore 工具链 |

关键类型：
- **`FeatureIdProto`**：基于 S2 单元的地物标识（cell_id + 指纹）
- **`AddressProto`**：带组件的结构化地址
- **`RouteProto`**：道路路线定义
- **`PolylineProto`**：地理折线

---

### 5. `google/` — Google 标准及内部 API（72 个文件）

| 子领域 | 功能说明 |
|---|---|
| `google/protobuf/` | 标准知名类型：Any、Timestamp、Duration、Empty、FieldMask、Struct、Wrappers |
| `google/api/` | API 基础设施：注解、HTTP、认证、审计、客户端、字段行为、可见性、发布阶段、媒体、策略 |
| `google/type/` | 标准类型：LatLng（经纬度）、Money（货币）、Color（颜色）、Date（日期）、DateTime（时间日期）、DayOfWeek（星期）、PostalAddress（邮寄地址）、TimeOfDay（时刻） |
| `google/rpc/` | RPC：Status（状态）、错误扩展 |
| `google/geo/type/` | 地理类型：Viewport（视口） |
| `google/longrunning/` | 长时间运行操作 |
| `google/internal/earth/v1/` | **内部 Earth API**（50 个文件）—— 计费/费率卡、建成环境（建筑、街区、公园、太阳能、指标、栅格）、分类、客户端配置、Earth Mate、功能开关、知识库、图层、照片、配额、共享类型、调查元数据、地形、用户/设置 |
| `google/research/` | 研究项目（GeoFM 自定义评分、俯拍图像查询） |

这是将 Earth Studio 与 Google 更广泛基础设施连接起来的关键集成层。

---

### 6–38. 其余领域

| 领域 | 文件数 | 关键内容 |
|---|---|---|
| `java/` | 20 | Java 专属 protobuf（JSPB、ByteBuffer） |
| `gws/` | 15 | Google Web Server 母舰 API（应用、图片、网络、文本） |
| `knowledge/` | 11 | 知识图谱（数据治理、模式存储、Protomesh、查询理解、危机响应） |
| `storage/` | 9 | Datapol 语义注解、GoogleSQL、Graph/BFG |
| `travel/` | 8 | 酒店（HPS 排名注解）、交通定价、旅行攻略 Attractile |
| `search/` | 8 | 搜索上下文生成、日志传播/脱敏、XUIKit 渲染 |
| `privacy/` | 8 | 数据治理属性、广告用户数据执行、属性容器 |
| `monitoring/` | 8 | Streamz 监控 |
| `net/` | 7 | Proto2 桥接（MessageSet、JS proto、HTTP、验证器、输出源标记）、减载 |
| `cityblock/` | 6 | StreetSmart 影像观察、车辆姿态、集合类型、NERF 全景选择 |
| `photos/` | 5 | FIFE 服务、Protobuff |
| `third_party/` | 5 | 边界代理 proto 比对、Redwood 基础设施、Java protobuf |
| `util/` | 4 | 二维几何、任务 proto_status |
| `wireless/` | 3 | Android GSA 动态更新、隐私注解 |
| `webserver/` | 3 | GWS 实验、Maps 日志 |
| `ads/` | 3 | 旅行酒店设施、酒店定价优惠 |
| `video/` | 2 | YouTube EML 包裹、注解 |
| `searchbox/` | 2 | 搜索框 AIM |
| `location/` | 2 | 特定国家（日本） |
| `frameworks/` | 2 | 客户端数据注解、RPC 重放字段选项 |
| `devtools/` | 2 | ProtoShop 解析选项、静态分析 proto 最佳实践 |
| 其余 | 各 1 | identity、i18n、experiments、apps、testing、stats、security、repository、quality、metaweb、localsearch、lens、webutil |

---

## 技术特征

### Protobuf 语法版本分布

| 语法 | 数量 | 备注 |
|---|---|---|
| `proto2` | 799 | 仓库主导语法，geo/earth 和 geostore 使用最广 |
| `editions` | 462 | 在较新模块中大量使用（logs、google/internal、内容创作） |
| `proto3` | 55 | 选择性使用（google/protobuf 知名类型、部分 maps proto） |

### 自定义扩展与注解

代码库大量依赖 Google 内部 protobuf 基础设施：

- **`net/proto2/proto/descriptor.proto`**：Google 内部扩展版 protobuf 描述符（为标准 `google/protobuf/descriptor.proto` 的超集）。增加了字段存在状态追踪、重复字段编码、UTF-8 校验、JSON 格式、消息编码、Editions 支持以及安全/审计注解。
- **`net/proto2/bridge/proto/message_set.proto`**：Proto2 的 MessageSet 扩展机制。
- **`storage/datapol/annotations/proto/semantic_annotations.proto`**：字段级隐私与合规的数据策略注解。
- **`geo/earth/proto/storage_restrictions.proto`**：自定义存储限制注解，控制字段的持久化位置（DocumentStorageMetadata、Deeplink、LegacyDataState、KML 扩展）。
- **自定义字段选项**：`allowed_sources`（命令来源）、`crawl_feature_id`、`strong_reference`、`has_back_reference`（地物 ID）等。

### Java 与 ObjC 选项

大多数 proto 文件包含以下编译器选项：

- `option java_package` — 用于 Android/JVM 构建
- `option java_multiple_files = true` — 生成独立 Java 文件
- `option objc_class_prefix = "RTH"` — iOS 构建的 Objective-C 前缀（Earth → `RTH*`）
- `option optimize_for = CODE_SIZE` — 在文档/存储相关 proto 中使用

### 交叉引用依赖

依赖关系图深度互联。核心 proto 依赖链如下：

- `geo/earth/proto/*` → 导入 `google/protobuf/*`、`storage/datapol/*`、`net/proto2/*`
- `geo/earth/app/cpp/core/*` → 导入 `geo/earth/proto/*`
- `google/internal/earth/v1/*` → 导入 `geo/earth/*`、`google/api/*`、`google/type/*`
- `logs/proto/*` → 导入几乎所有领域，以完成全面的事件捕获

---

## 构建系统说明

本仓库**不包含任何构建文件**（`BUILD`、`BUILD.bazel`、`CMakeLists.txt`、`Cargo.toml`、`package.json`、`Makefile` 均不存在）。构建配置应在父级 monorepo（大概率是 Google 内部的 Bazel 仓库）中管理。所有 proto 文件遵循 Google 标准 protobuf 路径约定，导入路径均为仓库根目录相对路径。

---

## 与 Earth Studio WASM 的关系

仓库名 `earthstudiowasm` 表明了本项目作为**共享 protobuf 协议层**的角色，连接以下两端：

1. **Google Earth Studio（原生 C++ 版）**：桌面级 Earth Studio 应用，以 C++ 编写，拥有丰富的 UI，用于创建地理空间设计、建筑分析、太阳能研究以及影视级运镜动画。
2. **Earth Studio WASM**：WebAssembly 编译版 Earth Studio 引擎，可在现代 Web 浏览器中运行，无需本地安装即可完成基于浏览器的 3D 地球渲染和设计工具。

Proto 定义文件充当以下各方的契约：

- **客户端 ↔ 服务端**：API 请求/响应消息
- **客户端状态**：可序列化的应用状态（深度链接、文档存储、用户设置）
- **数据分析**：遥测用的事件日志数据模型
- **存储层**：持久化数据格式（文档、地物、地图瓦片）

---

## 数据模型中体现的主要功能

基于 proto 定义分析，Earth Studio 支持以下功能：

- **3D 地球渲染**：多种投影模式（地球/墨卡托）、卫星/标准/地形影像、动态云层、3D 建筑、地形
- **运镜动画**：LookAt/LookFrom 相机、飞行、瞬移、轨道（兴趣点/行星/电影级）、街景全景
- **内容创作**：地标、折线、多边形、3D 模型、地面叠加层、屏幕叠加层、照片叠加层、KML 导入/导出
- **设计工具**：新建建筑设计、太阳能分析、建筑编辑器、喷涂工具、测量工具（距离/面积/坡度）
- **数据图层**：Earth 数据图层（支持分类/范围过滤）、调色板、栅格瓦片图层、绘制地物图层、分类图层
- **按需分析**：坡度分析、坡向分析、挖填方分析、等高线分析
- **Earth Mate 助手**：AI 驱动的对话助手，支持俯拍影像
- **AI 图像生成**：通过自然语言查询生成图像
- **时间功能**：时光机（历史影像回溯）、延时摄影（动态时间序列动画）
- **搜索**：地理搜索（支持知识卡片、"手气不错"、航海者故事）
- **协作**：云项目、云文档、文档共享、文档命名空间
- **计费**：费率卡、套餐类型、配额管理、计费升级对话框
- **离线支持**：本地文件系统适配器、缓存
- **企业功能**：企业级专属功能与配置
- **无障碍**：无障碍事件日志
- **新手引导**：用户入门流程与推广

---

## 问题与发现

### 1. 无构建配置（严重）
没有任何 `BUILD` 文件或构建系统配置，新用户无法确定正确的 protobuf 编译目标、插件版本或依赖解析策略。独立使用本仓库存在显著障碍。

### 2. 目录层级过度嵌套
部分路径深度达 8 层以上（如 `geo/earth/app/cpp/core/state/solardesigninput/`）。虽然反映了应用架构，但使得导航和 proto 导入路径极为冗长。

### 3. 混合语法版本
Proto2（60.7%）、Editions（35.1%）和 Proto3（4.2%）混合使用，需要编译器进行精细配置。Editions 支持（如 `editions = "2023"`）是相对较新的 protobuf 特性，部分工具链可能尚不支持。

### 4. Google 内部依赖（严重）
大量 proto 导入了 Google 内部路径：
- `net/proto2/proto/descriptor.proto`（Google 扩展版描述符）
- `storage/datapol/annotations/proto/semantic_annotations.proto`（内部数据策略）
- `java/com/google/apps/jspb/jspb.proto`（JSPB — Java 服务端 Protobuf）

上述导入在标准 protobuf 工具链中**将直接失败**。外部使用者需要提供桩实现或兼容替代。

### 5. 此前无任何文档
一个拥有 1,316 个文件、38 个顶层领域、如此规模的仓库，此前居然没有任何说明文档来解释其用途、结构或使用方式。

### 6. 无源代码
尽管仓库名为 `earthstudiowasm`，实际的 C++、Java 和 TypeScript 源代码全然不在此处。这是一个纯粹的协议/接口仓库，实现代码位于别处。

### 7. 横切关注点杂糅
某些通常应独立管理的领域（如 `logs/`、`storage/`、`privacy/`）被集中放置在此，说明本仓库是从更大 monorepo 中提取的快照或子树，而非一个独立项目。

### 8. 无版本标记
不存在 git 标签、发布版本或变更日志。Proto 文件也缺少明确的版本标识符，使得 API 兼容性追踪极为困难。

---

## 快速入门

### 前置条件

编译这些 proto 文件需要：

- **Protocol Buffers 编译器**（`protoc`）v25 及以上版本（以支持 Editions 语法）
- Google 内部 proto2 扩展（或兼容的桩实现）
- Java protobuf 插件（用于依赖 JSPB 的 proto）
- Objective-C protobuf 插件（用于 `objc_class_prefix` 选项）

### 建议操作流程

```bash
# 1. 确保所有 proto 导入路径可解析
#    本仓库使用仓库根目录相对路径，如：
#    import "geo/earth/proto/commands.proto";

# 2. 编译时将 proto 路径指向仓库根目录
protoc \
  --proto_path=. \
  --cpp_out=./generated/cpp \
  --java_out=./generated/java \
  geo/earth/proto/commands.proto

# 3. 对于依赖 Google 内部 proto 的文件，可选择：
#    - 为缺失的 import 提供桩 .proto 文件
#    - 使用 descriptor_set_in 引入预编译依赖
```

### 依赖关系图（简化版）

```
google/protobuf/*         ← 标准知名类型
google/api/*              ← API 注解
google/type/*             ← 标准类型
    ↓
net/proto2/proto/*        ← 扩展版描述符
storage/datapol/*         ← 数据策略注解
    ↓
geo/earth/proto/*         ← Earth 核心类型（几何、命令、地图样式等）
    ↓
geo/earth/app/cpp/core/*  ← 应用核心（文档、地物、状态等）
    ↓
logs/proto/*              ← 事件日志（依赖上述所有）
google/internal/earth/*   ← 内部 API（依赖 geo/earth）
```

---

## 许可证

本项目包含 Google 专有 Protocol Buffer 定义。使用需遵守 Google 的相关条款和条件。

---

*最后更新：2026 年 8 月*
