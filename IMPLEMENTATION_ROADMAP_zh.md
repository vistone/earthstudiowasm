# Earth Studio 克隆项目 — 实施路线图

> **目标：** 以 1,316 个 Google proto 定义为模式基础，构建一个可用的 Earth Studio 克隆。
> **受众：** 面向实际开发者。每个决定都有具体的理由和可衡量的范围。
> **生成日期：** 2026-08-12

---

## 目录

- [优先级矩阵：MVP vs 完整范围](#优先级矩阵mvp-vs-完整范围)
- [Phase 0: Proto 基础](#phase-0-proto-基础)
- [Phase 1: 3D 地球渲染](#phase-1-3d-地球渲染)
- [Phase 2: 命令系统](#phase-2-命令系统)
- [Phase 3: 内容创作](#phase-3-内容创作)
- [Phase 4: 地图集成](#phase-4-地图集成)
- [Phase 5: 设计工具](#phase-5-设计工具)
- [Phase 6: AI 助手 (Earth Mate)](#phase-6-ai-助手-earth-mate)
- [Phase 7: 分析与日志](#phase-7-分析与日志)
- [Phase 8: 构建与部署](#phase-8-构建与部署)
- [依赖关系图](#依赖关系图)

---

## 优先级矩阵：MVP vs 完整范围

> **MVP 是"Google Earth 查看器"，而非"Google Earth Studio 编辑器"。** 你无法在几周内构建一套编辑套件。但*可以*在 6-8 周内构建一个带有搜索和基本地标功能的地球查看器。

| 功能 | MVP | 完整范围 | Phase |
|---|---|---|---|
| 3D 地球（卫星、地形、建筑） | ✅ | ✅ | 1 |
| 相机导航（缩放、平移、倾斜、飞行） | ✅ | ✅ | 1, 2 |
| 搜索与知识卡片 | ✅ | ✅ | 2 |
| 地标创建（点放置） | ✅ | ✅ | 3 |
| 图层切换（建筑、云层、网格） | ✅ | ✅ | 1 |
| KML 导入 | ✅ | ✅ | 3 |
| 命令系统（分发、状态、撤销） | ✅ | ✅ | 2 |
| 分析/事件日志 | 最小化 | ✅ | 7 |
| 折线/多边形绘制 | ❌ | ✅ | 3 |
| 完整功能编辑器（样式、气泡、媒体） | ❌ | ✅ | 3 |
| 街景 | ❌ | ✅ | 2 |
| 时光机（历史影像） | ❌ | ✅ | 2 |
| 延时摄影 | ❌ | ✅ | 2 |
| 导航/路线规划 | ❌ | ✅ | 4 |
| 公共交通 | ❌ | ✅ | 4 |
| 交通覆盖层 | ❌ | ✅ | 4 |
| 太阳能分析 | ❌ | ✅ | 5 |
| 建筑设计（容积率、模板） | ❌ | ✅ | 5 |
| 按需分析（坡度/坡向/等高线） | ❌ | ✅ | 5 |
| Earth Mate AI 助手 | ❌ | ✅ | 6 |
| 图像生成 | ❌ | ✅ | 6 |
| 计费/费率卡 | ❌ | ✅ | 8 |
| 云端项目/同步 | ❌ | ✅ | 3, 8 |
| 深度链接 | ❌ | ✅ | 2 |
| 移动端（响应式） | ❌ | ✅ | 8 |

**MVP 团队：** 2 名前端 + 1 名后端，6-8 周。  
**完整范围团队：** 6-8 名工程师，12-18 个月。

---

## Phase 0: Proto 基础

### Proto 提供了什么

**模式清单 — 仓库中 1,316 个 `.proto` 文件：**

| 领域 | 路径 | 文件数 | 关键内容 |
|---|---|---|---|
| Earth Core | `geo/earth/proto/` | 14 | 命令（34 种类型）、内容模型（113 条消息）、地图样式、几何、相机、知识卡片 |
| Earth Mate | `geo/earth/proto/earth_mate/` | 5 | AI 请求/响应、流式传输、归因、文件附件 |
| 内容创作 | `geo/earth/proto/contentcreation/` | 4 | 文档模型、变更（13 种类型）、API 请求、KML 扩展 |
| 状态管理 | `geo/earth/app/cpp/core/state/` | 60+ | 40 个不可恢复的状态切片、60 个派生状态 |
| 文档 | `geo/earth/app/cpp/core/document/` | 18 | 元数据、存储、I/O 适配器、角色 |
| 设计 | `geo/earth/app/cpp/core/protos/` | 16 | 建筑模板、选址、绘制模式 |
| Studio | `geo/earth/app/cpp/studio_presenters/` | 7 | 相机动画、基础图层、属性编辑器 |
| 地图 | `maps/` | 344 | 触觉 API、绘制/渲染、路径查找、导航、公共交通、交通 |
| GeoStore | `geostore/` | 162 | FeatureId (S2)、Feature 容器（70 个字段）、道路/车道/限行模型 |
| 日志 | `logs/` | 182 | Earth 事件（89 种类型）、VE 追踪、导航分析 |
| 内部 API | `google/internal/earth/v1/` | 48 | 计费、建筑环境、图层、照片、地形、用户、配置 |

**问题：** 这些 proto 文件无法用标准的 `protoc` 编译。它们依赖约 800 个 Google 内部导入。

### 我们需要构建什么

**一个剥离了 Google 内部依赖的可编译 proto 树。**

阻塞性导入：
- `storage/datapol/annotations/proto/semantic_annotations.proto` — 被 **890 个文件**使用（PII 注解）
- `net/proto2/proto/descriptor.proto` — 被 **272 个文件**使用（带字段存在性和 UTF-8 验证的扩展描述符）
- `net/proto2/bridge/proto/message_set.proto` — 被 **33 个文件**使用（MessageSet 扩展分发）
- `java/com/google/apps/jspb/jspb.proto` — 被 **208 个文件**使用（JS protobuf 注解）
- `wireless/android/privacy/...` — 被 **约 60 个文件**使用（Android 隐私注解）

### 技术选型

| 选择 | 理由 |
|---|---|
| **protoc 29.0+** | `editions` 语法（462 个文件）+ proto2 兼容性 + `cpp_features.proto` 内置支持所必需 |
| **buf.build** | 代码检查、破坏性变更检测、远程插件执行 — 消除了大多数流程中本地 protoc 的配置需求 |
| **自定义 proto 插件** | 使用 `protobuf-ts` 直接从适配后的模式生成 TypeScript 类型 |
| **sed/awk + Python** | 以编程方式剥离内部依赖；Python 脚本处理复杂情况（MessageSet→oneof 转换） |

### 分步实施

#### Step 0.1: 盘点内部依赖
```bash
# 找出所有无法用标准 protobuf 解析的导入
grep -rh "^import" geo/ maps/ geostore/ logs/ google/ | sort -u > all_imports.txt
grep -E "(storage/datapol|net/proto2|jspb|wireless/android)" all_imports.txt > internal_imports.txt
```

#### Step 0.2: 创建 `third_party/` 桩目录
```
third_party/google/
├── storage/datapol/annotations/proto/
│   └── semantic_annotations.proto   # 包含 sem_type 扩展的最小桩
├── net/proto2/proto/
│   └── descriptor.proto              # 重新导出 google/protobuf/descriptor.proto
├── net/proto2/bridge/proto/
│   └── message_set.proto             # 空的 MessageSet 消息
├── knowledge/graph/protomesh/
│   └── protomesh.proto               # 空的 ProtoMesh 桩
├── net/proto2/contrib/validator/
│   └── annotations.proto             # 空的 FieldValidationRule
└── monitoring/streamz/proto/
    └── streamz.proto                 # 空的指标桩
```

#### Step 0.3: 自动剥离 + 替换
```bash
# 1. 将 net/proto2 descriptor 导入替换为标准 descriptor
find . -name "*.proto" -exec sed -i \
  's|import "net/proto2/proto/descriptor.proto"|import "google/protobuf/descriptor.proto"|g' {} +

# 2. 剥离 JSPB
find . -name "*.proto" -exec sed -i \
  '/import.*jspb\.proto/d; /option.*jspb/d' {} +

# 3. 剥离 Android 隐私注解
find . -name "*.proto" -exec sed -i \
  '/import.*collection_basis_annotations/d' {} +
```

#### Step 0.4: 将 MessageSet 扩展转换为 Oneof
使用 MessageSet 的 33 个文件（最关键的是 `geostore/base/proto/featureid.proto` 和 `feature.proto`）需要转换。编写一个 Python 脚本：
1. 解析每个具有 `extensions X to max [message_set = true]` 的 proto
2. 找到所有注册到其中的 `extend` 块
3. 生成一个包含所有已知扩展类型的 oneof
4. 输出转换后的文件

#### Step 0.5: 两遍编译
```bash
# 第 1 遍：Proto3 + Editions 文件（更简单，扩展更少）
buf build --path proto3_editions_files.txt -o gen/descriptors.bin

# 第 2 遍：带扩展的 Proto2 文件
buf build --path proto2_files.txt --exclude-path gen/ -o gen/descriptors2.bin
```

#### Step 0.6: 生成 TypeScript SDK
```bash
# 使用 protobuf-ts 进行 TypeScript 代码生成
npx @protobuf-ts/plugin \
  --proto_path . \
  --proto_path third_party/google \
  --ts_out src/generated/ \
  proto_files_list.txt
```

#### Step 0.7: 验证二进制线兼容性
创建一个测试套件：
1. 编码已知的消息结构
2. 将二进制输出与参考的 Google 编码字节进行比较（如果可用）
3. 验证所有消息类型的往返编码→解码

### 预估工作量：**M（2-3 周）**

- 第 1 周：盘点、创建桩、自动剥离脚本
- 第 2 周：MessageSet 转换、编译调试、2 遍构建
- 第 3 周：代码生成验证、线兼容性测试、CI 集成

---

## Phase 1: 3D 地球渲染

### Proto 提供了什么

| Proto 文件 | 关键定义 |
|---|---|
| `geo/earth/proto/mapstyle.proto` | `MapStyle` — `Projection`（Globe/Mercator）、`Imagery`（Satellite/Roadmap/Terrain）、`ThreeDFeatures`（All/TerrainOnly/None）、`GridlinesLayer`、云层开关、8 个可视化图层 |
| `geo/earth/proto/geometry.proto` | `Camera`（位置 + 旋转 + screen_size + fov_y）、`Location`（经度/纬度/海拔）、`Rotation`（航向/俯仰/翻滚） |
| `geo/earth/proto/commands.proto` | `FlyToCamera` — LookAt/LookFrom 相机、瞬移/飞行动画、4 种演示模式（Static/POI Orbit/Planet Orbit/Cinematic）、全景支持 |
| `geo/earth/app/cpp/studio_presenters/` | 10 个相机动画消息、3 种轨迹类型（线性/抛物线/上下文） |

### 我们需要构建什么

一个完整的 WebGL/WebGPU 地球渲染器，具备：
1. **椭球地球**（WGS84）与卫星影像纹理
2. **地形**（高程映射网格）
3. **3D 建筑**（来自 OSM 或 Cesium OSM Buildings 的拉伸多边形）
4. **相机系统**，将 proto 类型映射到 3D 变换
5. **图层切换**（建筑、云层、网格线、延时摄影）
6. **投影切换**（Globe ↔ Mercator）

### 技术选型

| 选项 | 优点 | 缺点 | 推荐 |
|---|---|---|---|
| **CesiumJS** | 功能完整、开源（Apache 2.0）、WGS84 椭球、地形、3D 建筑、相机 API 与 proto 模型高度匹配、生态系统庞大 | 包体积较大（约 5MB 压缩后）、API 面复杂 | **✅ 推荐用于 MVP** — 与 proto 模式最匹配，最快实现可运行的地球 |
| **MapLibre GL JS** | 轻量（约 500KB）、矢量瓦片、墨卡托投影 | 以 2D 为主、无地球/椭球模式、开箱即用无真正的 3D 建筑、相机模型匹配度差 | 可能用于 Phase 4 地图渲染 |
| **自定义 Three.js + globe** | 完全控制、小体积、WebGPU 支持 | 需 6 个月以上自行构建地形、瓦片、LOD、影像、建筑 | 仅当你拥有专门的渲染团队时 |
| **Babylon.js** | 良好的 WebGPU 支持、3D 优先 | 地球/地理生态系统较小、瓦片基础设施较少 | 如果 Cesium 许可证有问题，可作为可行的替代方案 |

**最终选择：MVP 使用 CesiumJS，MapLibre GL JS 作为 2D/Mercator 的回退方案。**

### Proto 到渲染器的映射

```
MapStyle.Projection.GLOBE    → Cesium.SceneMode.SCENE3D
MapStyle.Projection.MERCATOR → Cesium.SceneMode.SCENE2D
MapStyle.Imagery.SATELLITE   → Cesium.IonWorldImageryStyle 或 Cesium.UrlTemplateImageryProvider
MapStyle.Imagery.ROADMAP     → Cesium.createWorldTerrainAsync() + Cesium.OpenStreetMapImageryProvider
MapStyle.Imagery.TERRAIN     → Cesium.CesiumTerrainProvider (quantized-mesh)
MapStyle.ThreeDFeatures.ALL  → Cesium.Cesium3DTileset (通过 ion 的 OSM Buildings)
MapStyle.ThreeDFeatures.NONE → tileset.show = false

FlyToCamera.LookAt           → camera.setView({ destination: Cartesian3, orientation: { heading, pitch, roll } })
FlyToCamera.LookFrom         → camera.flyTo({ destination, orientation })
CameraAnimation.TELEPORT     → camera.setView (即时)
CameraAnimation.FLY          → camera.flyTo({ duration: 2.0 })

ToggleLayer                  → MapStyle 字段开关 → 图层可见性
```

### 瓦片数据源

| 影像类型 | MVP 来源 | 完整范围来源 |
|---|---|---|
| 卫星 | Cesium ion（免费层：100 万瓦片/月） | 自托管（AWS S3 + CloudFront，规模化约 $200/月） |
| 路线图 | OpenStreetMap（免费） | MapTiler（$49/月+） |
| 地形 | Cesium World Terrain（ion，免费层） | MapTiler Terrain RGB |
| 3D 建筑 | Cesium OSM Buildings（ion，免费层） | 来自 OSM 导出的自托管 3D Tiles |
| 网格线 | Canvas 生成的覆盖层 | 同上 |
| 云层 | 静态纹理或 NOAA 影像 | 来自卫星数据的动画云层循环 |

### 分步实施

#### Step 1.1: 创建 Cesium Viewer 壳子
```bash
npm install cesium vite
```
创建一个最小化的 HTML/JS 应用，用默认的影像和地形初始化 Cesium `Viewer`。

#### Step 1.2: 实现相机桥接
```typescript
// 将 FlyToCamera proto 映射到 Cesium 相机
function applyCommand(cmd: FlyToCamera): void {
  const destination = cmd.cameraType === 'look_at'
    ? lookAtToCartesian(cmd.lookAt!)
    : lookFromToCartesian(cmd.lookFrom!);
  const orientation = { heading: cmd.heading, pitch: cmd.tilt, roll: cmd.roll };

  if (cmd.cameraAnimation === 'FLY') {
    viewer.camera.flyTo({ destination, orientation, duration: 2.0 });
  } else {
    viewer.camera.setView({ destination, orientation });
  }
}
```

#### Step 1.3: 实现 MapStyle 图层控制器
```typescript
class MapStyleController {
  apply(style: MapStyle): void {
    // 投影
    viewer.scene.mode = style.projection === 'GLOBE'
      ? Cesium.SceneMode.SCENE3D
      : Cesium.SceneMode.SCENE2D;

    // 影像
    this.setImageryProvider(style.imagery);

    // 3D 要素
    this.tileset.show = style.threeDFeatures !== 'NONE';

    // 图层开关
    this.cloudsLayer.show = style.cloudsEnabled;
    this.gridlinesLayer.show = style.gridlines !== 'NONE';
  }
}
```

#### Step 1.4: 实现图层切换命令
将 9 种 `ToggleLayer` 类型分别映射到 Cesium 图元可见性：
- `THREE_D_BUILDINGS` → tileset.show
- `TIMELAPSE` → 影像分割位置
- `PHOTOS` → 照片覆盖层实体
- `GRIDLINES` → 网格实体
- `CLOUDS` → 云层广告牌集合
- `PINNED_PROJECTS` → 项目覆盖层
- `DISCOVERY_LAYER` → Voyager 资讯覆盖层

#### Step 1.5: 添加 MapStyle 预设
实现 `BaseLayers.Preset` 枚举：
- `CLEAN` — 仅卫星 + 地形
- `EXPLORATION` — 卫星 + 地形 + 3D 建筑 + 标签
- `EVERYTHING` — 所有图层启用

### 预估工作量：**L（4-6 周）**

- 第 1-2 周：Cesium 集成、带卫星 + 地形的基础地球
- 第 3 周：相机系统、飞行、轨道控制
- 第 4 周：图层切换、预设、投影切换
- 第 5-6 周：网格线、云层、性能调优、移动端

---

## Phase 2: 命令系统

### Proto 提供了什么

| Proto 文件 | 关键定义 |
|---|---|
| `geo/earth/proto/commands.proto` | 34 个 oneof 分发的命令类型及其完整消息模式 |
| `geo/earth/app/cpp/core/state/state.proto` | 40 个不可恢复的状态切片 — 完整的 UI 状态模式 |
| `geo/earth/app/cpp/core/state/**/` | 每个 UI 组件 60+ 个派生状态 proto |

### 我们需要构建什么

一个命令分发器，具备：
1. 针对所有 34 种命令类型的**类型安全命令处理器**
2. **状态管理**（Redux/MobX/Zustand），映射 40 个状态切片
3. 使用命令模式的**撤销/重做栈**
4. **深度链接** — 将状态序列化/反序列化到 URL
5. **命令日志记录**（为 Phase 7 分析提供数据）

### 技术选型

| 选择 | 理由 |
|---|---|
| **Zustand** | 轻量（约 1KB）、无需样板代码、可与原生 TS 一起使用 — 比 Redux Toolkit 更适合此用例 |
| **Immer** | 不可变状态更新，无需冗长的展开运算符 |
| **TypeScript strict 模式** | 类型安全；Phase 0 生成的类型可防止命令/状态不匹配 |

### 34 条命令 — 实施映射表

| # | 命令 | MVP？ | 实施复杂度 | 依赖项 |
|---|---|---|---|---|
| 1 | `ClearSearchHistory` | ✅ | 简单 — 清空数组 | LocalStorage |
| 2 | `OpenSearchHistory` | ✅ | 简单 — 切换面板 | UI 状态 |
| 3 | `OpenVoyagerGrid` | ❌ | 已弃用 — 跳过 | — |
| 4 | `OpenVoyagerStory` | ❌ | 已弃用 — 跳过 | — |
| 5 | `PerformSearch` | ✅ | 中等 — 调用 Places/Geocoding API，显示结果 | 搜索后端（Phase 4） |
| 6 | `OpenFeelingLuckyCard` | ✅ | 中等 — 随机推荐地点 | 知识卡片 |
| 7 | `OpenKnowledgeCard` | ✅ | 中等 — 获取/渲染实体 | 知识图谱 API |
| 8 | `FlyToCamera` | ✅ | 中等 — 将 proto 映射到 Cesium 相机 | Phase 1 |
| 9 | `OpenCloudProject` | ❌ | 困难 — 云端认证 + 文档获取 | Phase 3、认证 |
| 10 | `CreateCloudProject` | ❌ | 困难 — 文档创建 API | Phase 3、认证 |
| 11 | `EnterTimeMachine` | ❌ | 困难 — 历史影像滑块 | Phase 1 扩展 |
| 12 | `OpenKmlDocument` | ✅ | 中等 — KML 解析器 | Phase 3 |
| 13 | `EnterTimelapse` | ❌ | 困难 — 延时摄影播放 | Phase 1 扩展 |
| 14 | `CreatePointPlacemark` | ✅ | 中等 — 在地球上放置图钉 | Phase 3 |
| 15 | `EnterStreetView` | ❌ | 困难 — 街景集成 | Google Maps API |
| 16 | `ToggleLayer` | ✅ | 简单 — 切换可见性 | Phase 1 |
| 17 | `CreateFeature` | ✅ | 中等 — 创建地标/折线/多边形 | Phase 3 |
| 18 | `OpenKmlDocumentFromContent` | ✅ | 中等 — 解析 KML 字符串 | Phase 3 |
| 19 | `DeleteFeature` | ✅ | 简单 — 从状态中移除 | Phase 3 |
| 20 | `EditFeature` | ✅ | 中等 — 属性编辑器 | Phase 3 |
| 21 | `OpenProjectByKey` | ❌ | 困难 — 云端认证 + 文档获取 | Phase 3 |
| 22 | `SetHomescreenVisibility` | ✅ | 简单 — 布尔值切换 | UI 状态 |
| 23 | `SetBasemapStyle` | ✅ | 简单 — 切换影像提供者 | Phase 1 |
| 24 | `CreateFeaturesInFolder` | ❌ | 中等 — 批量创建 | Phase 3 |
| 25 | `RenderDesign` | ❌ | 已弃用 — 跳过 | — |
| 26 | `ViewDesign` | ❌ | 困难 — 设计视口 | Phase 5 |
| 27 | `CreateDesigns` | ❌ | 困难 — 太阳能/新建建筑 | Phase 5 |
| 28 | `ToggleAvailableLayersUi` | ❌ | 简单 — UI 切换 | UI 状态 |
| 29 | `PreviewDataLayer` | ❌ | 困难 — BigQuery 图层预览 | Phase 4 |
| 30 | `ViewRateCard` | ❌ | 中等 — 计费 UI | Phase 8 计费 |
| 31 | `OpenEarthMateChat` | ❌ | 困难 — AI 聊天界面 | Phase 6 |
| 32 | `ShowLayerCardDetails` | ❌ | 简单 — 图层元数据卡片 | Phase 4 |
| 33 | `ViewOnDemandAnalysis` | ❌ | 困难 — 地形分析 | Phase 5 |
| 34 | `OpenImageGenerator` | ❌ | 困难 — AI 图像生成 | Phase 6 |
| **（保留）** | `35, 36` | — | 跳过 | — |

**MVP 命令：34 条中的 14 条**（不包括 3 条已弃用和 2 条保留的）。

### 分步实施

#### Step 2.1: TypeScript 类型生成
从 Phase 0 的输出生成 TypeScript 接口：
```typescript
// 从 Commands proto 生成
interface Command {
  commandType:
    | { $case: 'clearSearchHistory'; clearSearchHistory: ClearSearchHistory }
    | { $case: 'performSearch'; performSearch: PerformSearch }
    | { $case: 'flyToCamera'; flyToCamera: FlyToCamera }
    // ... 34 种情况
}
```

#### Step 2.2: 创建命令分发器
```typescript
class CommandDispatcher {
  private handlers = new Map<string, CommandHandler>();
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];

  register(type: string, handler: CommandHandler): void { ... }

  dispatch(cmd: Command): void {
    const handler = this.handlers.get(cmd.commandType.$case);
    const inverse = handler!.execute(cmd);
    if (inverse) {
      this.undoStack.push(inverse);
      this.redoStack = [];
    }
    this.logCommand(cmd);  // 为 Phase 7 提供数据
  }

  undo(): void { ... }
  redo(): void { ... }
}
```

#### Step 2.3: 实现状态存储
```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface AppState {
  // 来自 state.proto 的 40 个不可恢复的状态切片
  knowledgeCard: KnowledgeCardState;
  search: SearchState;
  streetView: StreetViewState;
  drawingTool: DrawingToolState;
  measureTool: MeasureToolState;
  timeMachine: TimeMachineState;
  timelapse: TimelapseState;
  earthMate: EarthMateState;
  mapStyle: MapStyleState;
  designInput: DesignInputState;
  // ...
}
```

#### Step 2.4: 实现撤销/重做
每个命令处理器返回一个用于撤销的"逆向命令"：
```typescript
class CreateFeatureHandler implements CommandHandler {
  execute(cmd: CreateFeature): Command | null {
    const featureId = state.addFeature(cmd.feature);
    return DeleteFeature.create({ featureIds: [featureId] });
  }
}
```

#### Step 2.5: 深度链接序列化
使用 `deeplink/` 派生状态 proto（12 条消息）将状态序列化到 URL hash：
```
#/?camera=40.7484,-73.9857,1000,45,30,0&layers=b3d,cld&search="empire state"
```

### 预估工作量：**MVP 为 M（2-3 周），完整范围为 XL（6-8 周）**

MVP 范围（14 条命令、基础状态）为 2-3 周。完整范围（34 条命令、撤销/重做、深度链接、40 个状态切片）为 6-8 周。

---

## Phase 3: 内容创作（要素、KML、文档）

### Proto 提供了什么

| Proto 文件 | 关键定义 |
|---|---|
| `geo/earth/proto/contentcreation/content_editing_model.proto` | 113 条消息：`Feature`、`Placemark`、`Geometry`（Point/Polyline/Polygon）、`Style`（Icon/Line/Poly/Balloon/Label）、`ThreeDAsset`、`Model`、`EarthDataLayer`、6 种海拔模式、9 种要素类型 |
| `geo/earth/proto/contentcreation/content_editing_mutations.proto` | 13 种原子变更类型：AddFeature、DeleteFeature、UpdateFeatureProperties、SetStyle 等 |
| `geo/earth/proto/contentcreation/content_editing_requests.proto` | 62 条消息：针对文档、要素、资产的完整 gRPC CRUD |
| `geo/earth/proto/contentcreation/content_editing_kml_extensions.proto` | KML 桥接：级联样式、样式映射、物化图层 |
| `geo/earth/proto/contentcreation/data_import_errors.proto` | 66 种导入失败的结构化错误类型 |
| `geostore/base/proto/feature.proto` | FeatureProto — 通用容器，包含 70 个带类型的子消息字段 |

### 我们需要构建什么

1. **要素 CRUD** — 创建、读取、更新、删除地标、折线、多边形
2. **KML 解析器** — 导入/导出带有扩展的 Google Earth KML
3. **样式编辑器** — 图标、线条、多边形、气泡、标签样式
4. **文档存储** — 将项目持久化到数据库
5. **3D 模型放置** — ThreeDAsset 方向/缩放/包围盒

### 技术选型

| 选择 | 理由 |
|---|---|
| **PostgreSQL + PostGIS** | 最佳开源地理空间数据库；通过扩展支持 S2 单元格索引、3D 几何、成熟的生态系统 |
| **SpatiaLite**（本地） | 用于离线/桌面模式；SQLite 与空间扩展 — 零配置，可通过 sql.js 嵌入浏览器 |
| **@tmcw/togeojson** | KML→GeoJSON 转换器（npm 库） |
| **tokml** | GeoJSON→KML 转换器 |
| **IndexedDB**（浏览器） | 用于离线编辑的本地文档缓存；Dexie.js 作为包装器 |

**数据库映射 — `content_editing_model.proto` → SQL：**

```sql
-- Feature 到 PostgreSQL
CREATE TABLE features (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  parent_id       UUID REFERENCES features(id),
  feature_type    feature_type_enum NOT NULL,       -- Placemark、Folder、Polygon 等
  name            TEXT,
  description     TEXT,
  visibility      BOOLEAN DEFAULT true,
  sort_index      INTEGER DEFAULT 0,
  feature_origin  feature_origin_enum DEFAULT 'USER', -- 用户 或 Gemini AI

  -- 几何（PostGIS）
  geom            GEOMETRY(Geometry, 4326),          -- Point/Polyline/Polygon/Multi

  -- 海拔
  altitude_mode   altitude_mode_enum DEFAULT 'CLAMP_TO_GROUND',
  altitude        DOUBLE PRECISION,

  -- 相机（用于地标）
  camera_type     camera_type_enum,                  -- LookAt 或 LookFrom
  camera_lat      DOUBLE PRECISION,
  camera_lng      DOUBLE PRECISION,
  camera_alt      DOUBLE PRECISION,
  camera_heading  DOUBLE PRECISION,
  camera_tilt     DOUBLE PRECISION,
  camera_roll     DOUBLE PRECISION,
  camera_range    DOUBLE PRECISION,
  camera_fovy     DOUBLE PRECISION,

  -- 样式（JSON blob 以提供灵活性）
  style_data      JSONB,                             -- 序列化的完整 ContentStyle

  -- 3D 模型
  model_asset_id  UUID REFERENCES assets(id),
  model_scale_x   DOUBLE PRECISION DEFAULT 1,
  model_scale_y   DOUBLE PRECISION DEFAULT 1,
  model_scale_z   DOUBLE PRECISION DEFAULT 1,

  -- 时间戳
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  -- S2 单元格索引
  s2_cell_id      BIGINT                             -- 用于空间局部性
);

CREATE INDEX idx_features_geom ON features USING GIST (geom);
CREATE INDEX idx_features_s2 ON features (s2_cell_id);
CREATE INDEX idx_features_document ON features (document_id);
```

**S2 vs GeoHash vs H3 空间索引：**
- S2 是 Google 使用的方案（在 FeatureIdProto 中原生支持）
- S2 对球面地球有更好的属性（等面积、极点无奇异性）
- 使用 `s2-geometry` npm 包用于 JS，或 PostGIS `s2` 扩展

### 分步实施

#### Step 3.1: 要素 CRUD API
```typescript
// 后端：Express/Fastify + PostGIS
POST   /api/documents/:docId/features          → CreateFeature
GET    /api/documents/:docId/features           → ListFeatures
GET    /api/documents/:docId/features/:featId   → GetFeature
PATCH  /api/documents/:docId/features/:featId   → UpdateFeature
DELETE /api/documents/:docId/features/:featId   → DeleteFeature
```

#### Step 3.2: KML 解析器
```typescript
import { kml } from '@tmcw/togeojson';

function parseKml(kmlString: string): Feature[] {
  const dom = new DOMParser().parseFromString(kmlString, 'text/xml');
  const geojson = kml(dom);  // 转换为 GeoJSON
  return geojsonToProtoFeatures(geojson);  // 映射到 content_editing_model.proto 类型
}
```

通过自定义解析器逻辑处理 Google Earth KML 扩展（gx:Tour、gx:Track、gx:TimeSpan、gx:TimeStamp）。

#### Step 3.3: 在地球上渲染要素
```typescript
// 将 content_editing_model Feature 映射到 Cesium Entity
function featureToCesiumEntity(feature: Feature): Cesium.Entity {
  const entity: Cesium.Entity = {
    id: feature.id,
    name: feature.name,
    position: pointToCartesian(feature.geometry),
    // 样式映射
    point: feature.style?.pointStyle ? pointStyleToCesium(feature.style.pointStyle) : undefined,
    polyline: feature.style?.polylineStyle ? polylineStyleToCesium(feature.style.polylineStyle) : undefined,
    polygon: feature.style?.polygonStyle ? polygonStyleToCesium(feature.style.polygonStyle) : undefined,
    // 气泡（信息窗口）
    description: feature.style?.balloonStyle?.htmlContent,
  };
  return entity;
}
```

#### Step 3.4: 样式编辑器
构建一个属性编辑器面板，将每个 `ContentStyle` 子字段映射到表单控件：
- `PointStyle` → 图标选择器（内置图标、自定义上传、文字覆盖）
- `PolylineStyle` → 颜色选择器、宽度滑块、遮挡开关
- `PolygonStyle` → 填充颜色、边框颜色/宽度、表面展平
- `BalloonStyle` → HTML 模板编辑器、显示模式选择器
- `LabelStyle` → 字体、大小、颜色

#### Step 3.5: 文档存储
```sql
CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  namespace       document_namespace_enum DEFAULT 'EARTH',
  title           TEXT NOT NULL,
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  owner_id        TEXT,                              -- OAuth 用户 ID
  is_public       BOOLEAN DEFAULT false,
  metadata        JSONB                              -- DocumentMetadata proto
);
```

### 预估工作量：**XL（8-12 周）**

- 第 1-2 周：数据库模式、基础 CRUD API
- 第 3-4 周：KML 导入/导出、Cesium 实体映射
- 第 5-6 周：完整的样式编辑器（6 种样式类型）、属性面板
- 第 7-8 周：云端文档存储、变更、冲突解决
- 第 9-10 周：3D 模型导入（GLTF）、放置工具
- 第 11-12 周：EarthDataLayer 支持、CSV/GeoJSON 导入

---

## Phase 4: 地图集成（导航、公共交通、交通）

### Proto 提供了什么

| 领域 | 路径 | 关键定义 |
|---|---|---|
| 导航 | `maps/directions/`（16 个文件） | 35 种客户端类型、47 种上下文、路线定制、收费站、MRP 可支付性 |
| 路径查找 | `maps/pathfinder/`（31 个文件） | 路径搜索 I/O、CRP 路由数据模型、备选方案、自动驾驶 |
| 公共交通 | `maps/transit/`（11 个文件） | 车辆偏好、票价、成本模型（50+ 个惩罚类别）、预订链接 |
| 道路交通 | `maps/roadtraffic/`（9 个文件） | TRAFFIC2VEC ML 模型类型、事件元数据、路径编码、中断 |
| 触觉 API | `maps/tactile/`（190 个文件） | 完整的 Maps 前端 API：导航、实体、搜索、酒店、公共交通、EV |
| GeoStore 道路 | `geostore/base/proto/segment.proto` | 15+ 枚举、200+ 属性（速度、路面、海拔、优先级、自行车、行人） |
| GeoStore 车道 | `geostore/base/proto/lane.proto` | 20+ 车道类型、HD 车道连接、流向线、边界标记 |
| GeoStore 限行 | `geostore/base/proto/restriction.proto` | 20+ 限行类型、时间调度、车辆过滤 |

### 我们需要构建什么

1. **路线引擎** — 计算途径点之间的路线
2. **公共交通路线** — 多模式（公交、火车、地铁、轮渡）
3. **交通覆盖层** — 实时和历史交通可视化
4. **导航 UI** — 逐步转向指示
5. **收费计算** — 区域特定的通行卡和定价

### 技术选型

| 需求 | 选项 | 理由 |
|---|---|---|
| **路线引擎** | **OSRM**（开源路线机器） | 最快的开源路线器；C++ 引擎，Node.js 绑定；使用 OSM 数据；优秀的汽车/自行车/步行配置文件 |
| **路线引擎（替代）** | **GraphHopper** | 基于 Java，更灵活的配置文件、卡车路线、矩阵 API；比 OSRM 略慢 |
| **公共交通路线** | **OpenTripPlanner**（OTP） | 最佳开源公共交通路线器；GTFS 导入、多模式；被 TriMet、NYC MTA 使用 |
| **公共交通数据** | **Transitland**（transit.land） | 聚合的 GTFS feeds；API 和批量下载 |
| **交通数据** | **TomTom/Here API** | 商业方案；OSRM 通过实时交通数据具有基础交通支持；自托管 = OpenTraffic + Valhalla |
| **地图数据** | **OpenStreetMap** | 通用来源。从 GeoFabrik 下载区域提取（按区域）或使用完整的全球数据（约 70GB PBF） |
| **瓦片服务器** | **MapTiler** / 自托管 | 用于在地球上显示的道路地图瓦片 |

**MVP 路线的推荐技术栈：**
- OSRM（汽车/自行车/步行路线）+ OpenTripPlanner（公共交通）
- 从 GeoFabrik 区域提取加载 OSM 数据
- 使用 TomTom Traffic API 作为简单的交通代理（比 Google 便宜）

### Proto 到 API 的映射

```
Tactile Directions 请求 → OSRM RouteRequest
  waypoints                   → coordinates[]
  travelMode (DRIVE/WALK/BIKE/TRANSIT) → profile
  avoidTolls, avoidHighways   → exclude 标志
  departureTime               → 出发日期时间（用于公共交通/交通）

Pathfinder FindPathInput → OSRM TableRequest
  origins, destinations       → sources[], destinations[]
  costModelPreferences        → Lua profile 中的权重因子

Transit preferredVehicleType  → OTP mode 过滤器（BUS、RAIL、SUBWAY、FERRY、TRAM）

Traffic SegmentProto 属性 → 带有交通速度的后处理路线
```

### 分步实施

#### Step 4.1: 部署 OSRM
```bash
# 下载 OSM 数据
wget https://download.geofabrik.de/north-america/us-northeast-latest.osm.pbf

# 构建 OSRM 图
docker run -v $(pwd):/data osrm/osrm-backend osrm-extract -p /opt/car.lua /data/region.osm.pbf
docker run -v $(pwd):/data osrm/osrm-backend osrm-partition /data/region.osrm
docker run -v $(pwd):/data osrm/osrm-backend osrm-customize /data/region.osrm

# 运行
docker run -p 5000:5000 -v $(pwd):/data osrm/osrm-backend osrm-routed --algorithm mld /data/region.osrm
```

#### Step 4.2: 构建导航 API 适配器
```typescript
// 将 Tactile proto 映射到 OSRM API
async function getDirections(req: DirectionsRequest): Promise<DirectionsResponse> {
  const osrmReq = {
    coordinates: req.waypoints.map(wp => [wp.lng, wp.lat]),
    steps: true,
    geometries: 'geojson',
    overview: 'full',
    alternatives: req.numAlternates > 0,
    exclude: [
      ...(req.avoidTolls ? ['toll'] : []),
      ...(req.avoidHighways ? ['motorway'] : []),
    ],
  };

  const response = await fetch(`http://osrm:5000/route/v1/${profile(req.travelMode)}/...`);
  return mapOsrmToDirectionsProto(response);
}
```

#### Step 4.3: 部署 OpenTripPlanner
```bash
# 下载区域的 GTFS feeds
# 使用 OSM + GTFS 构建 OTP 图
java -Xmx8G -jar otp-2.5.0-shaded.jar --build --save /data/graphs/nyc /data/nyc.osm.pbf /data/nyc-gtfs.zip

# 运行
java -Xmx4G -jar otp-2.5.0-shaded.jar --load /data/graphs/nyc --port 8080
```

#### Step 4.4: 交通覆盖层
MVP：使用 TomTom Traffic API 获取实时交通流量瓦片，以透明方式叠加为 Cesium `ImageryLayer`。

完整范围：将 OSM 道路段导入 PostGIS，与 TomTom/Here 交通速度关联，使用 `PolylineGlowMaterialProperty` 或自定义着色器渲染为彩色折线。

#### Step 4.5: 在地球上可视化路线
```typescript
function renderRoute(route: Route): void {
  const positions = route.geometry.coordinates.map(c => Cesium.Cartesian3.fromDegrees(c[0], c[1]));
  viewer.entities.add({
    polyline: {
      positions,
      width: 5,
      material: new Cesium.PolylineGlowMaterialProperty({ glowPower: 0.25, color: Cesium.Color.DODGERBLUE }),
    },
    // 添加途经点标记、转向指示器
  });
}
```

### 预估工作量：**XL（10-14 周）**

- 第 1-2 周：OSRM 部署、OSM 数据管道
- 第 3-4 周：导航 API 适配器、路线渲染
- 第 5-6 周：公共交通（OTP 部署、GTFS 导入、公共交通 proto 映射）
- 第 7-8 周：交通数据集成、实时覆盖层
- 第 9-10 周：收费计算、MRP 备选方案、特定车辆路线
- 第 11-12 周：EV 路线、车道级细节
- 第 13-14 周：性能、缓存、全球级 OSM 导入

**注意：** 这个阶段是基础设施最重的。大规模搭建可靠的路由系统本身就是一个独立项目。对于 MVP，完全推迟 — 地球查看器无需路由也能工作。

---

## Phase 5: 设计工具（太阳能、建筑、分析）

### Proto 提供了什么

| Proto 文件 | 关键定义 |
|---|---|
| `google/internal/earth/v1/builtenv/solar_run_inputs.proto` | 太阳能 PV 设计输入、面板放置、辐照度计算参数 |
| `google/internal/earth/v1/builtenv/building_configuration.proto` | 建筑 FAR（容积率）、高度、退距、模板配置 |
| `google/internal/earth/v1/builtenv/built_entity.proto` | 建筑实体模型 — 建筑/停车场/公园及其指标 |
| `google/internal/earth/v1/builtenv/new_build_metrics.proto` | FAR、GFA（总建筑面积）、地块覆盖率、单元数量 |
| `google/internal/earth/v1/builtenv/metrics.proto` | 能源、碳、水、成本指标 |
| `google/internal/earth/v1/builtenv/raster.proto` | 栅格分析原语（高程、太阳辐照度） |
| `geo/earth/app/cpp/core/protos/design_manager.proto` | 设计生成管道 |
| `geo/earth/app/cpp/core/protos/building_templates.proto` | 预配置的建筑布局模板 |
| `geo/earth/app/cpp/core/protos/site_selection.proto` | 按计划层级设置面积限制的选址 |
| `geo/earth/app/cpp/core/protos/units.proto` | 用于测量显示的单位制（公制/英制） |

### 我们需要构建什么

1. **太阳辐照度计算器** — 任意屋顶的年/月 kWh/m²
2. **3D 建筑编辑器** — 拉伸基底轮廓、调整 FAR、放置在地形上
3. **地形分析** — 坡度、坡向、等高线生成、挖填方
4. **选址** — 按计费计划层级设置面积约束
5. **变化检测** — 比较两个日期间的影像

### 技术选型

| 工具 | 用途 | 理由 |
|---|---|---|
| **SunCalc**（JS） | 任意时间/地点的太阳位置 | 简单，对 PV 估算足够准确 |
| **PVLib Python**（通过 API） | 倾斜面上的太阳辐照度 | 来自 NREL 的行业标准；使用 FastAPI 的 Python 微服务 |
| **Three.js 光线投射**（在 Cesium 中） | 3D 建筑的阴影分析 | Cesium 使用类似 Three.js 的渲染；可通过 GPU 计算阴影 |
| **GDAL**（通过 Python） | 栅格分析：坡度、坡向、等高线 | 标准工具；可通过子进程或 Python API 调用 |
| **Turf.js** | 地理空间分析（缓冲区、相交、面积） | 浏览器内计算，支持 GeoJSON |
| **Deck.GL + Cesium** | 3D 建筑编辑覆盖层 | Deck.GL 图层与 Cesium 集成用于编辑图元 |

### Proto 到实现的映射

```
SolarRunInputs:
  rooftop_polygon        → Turf.js polygon area + SunCalc solar position
  panel_type             → 查找面板规格（瓦数、尺寸）
  tilt_angle             → PVLib 转化模型
  azimuth                → 从屋顶朝向推导
  输出：kWh/year         → 简单模型：面积 × 效率 × 辐照度 × 0.75（降额）

BuildingConfiguration:
  FAR（容积率）           → building_height = FAR × lot_area / floor_area_per_story
  height_limit           → 限制建筑高度
  setback                → 按退距距离向内偏移基底轮廓
  输出：3D 拉伸建筑网格

ViewOnDemandAnalysis:
  SLOPE                  → 在 DEM 上执行 GDAL gdaldem slope
  ASPECT                 → GDAL gdaldem aspect
  CONTOUR                → GDAL gdal_contour
  CUT_AND_FILL           → 减去两个 DEM，计算体积
  CHANGE_DETECTION       → 两个卫星影像日期间的 NDVI 差值
```

### 分步实施

#### Step 5.1: 太阳能计算器微服务
```python
# 包装 PVLib 的 FastAPI 服务
@app.post("/solar/irradiance")
async def solar_irradiance(req: SolarRunInputs):
    location = (req.polygon.centroid.lat, req.polygon.centroid.lng)
    solar_position = pvlib.solarposition.get_solarposition(
        times, location[0], location[1]
    )
    irradiance = pvlib.irradiance.get_total_irradiance(
        req.tilt_angle, req.azimuth,
        solar_position['apparent_zenith'], solar_position['azimuth'],
        dni, dhi, ghi
    )
    return {
        'annual_kwh_per_m2': irradiance['poa_global'].sum() / 1000,
        'monthly_breakdown': monthly_irradiance,
    }
```

#### Step 5.2: 3D 建筑编辑器
```typescript
// 在 Cesium 中，从基底轮廓拉伸建筑
function createBuilding(footprint: Polygon, config: BuildingConfiguration): Cesium.Entity {
  const height = computeBuildingHeight(config.far, turf.area(footprint));
  return viewer.entities.add({
    polygon: {
      hierarchy: turfToCesiumPositions(footprint),
      extrudedHeight: height,
      material: Cesium.Color.WHITESMOKE,
      outline: true,
      outlineColor: Cesium.Color.DARKGRAY,
    },
  });
}
```

#### Step 5.3: 地形分析 — 等高线生成
```bash
# 从高程栅格生成 GDAL 等高线
gdal_contour -a elevation -i 10.0 input_dem.tif output_contours.geojson
```
在 Cesium 地球上将等高线渲染为折线，按高程着色。

#### Step 5.4: 挖填方计算
```python
def cut_fill(existing_dem: np.ndarray, proposed_dem: np.ndarray, pixel_area_m2: float):
    diff = proposed_dem - existing_dem
    cut_volume = np.sum(diff[diff < 0]) * pixel_area_m2 * -1  # 需移除的材料
    fill_volume = np.sum(diff[diff > 0]) * pixel_area_m2       # 需添加的材料
    return {'cut_m3': cut_volume, 'fill_m3': fill_volume, 'net_m3': fill_volume - cut_volume}
```

#### Step 5.5: 变化检测
使用 Sentinel-2 影像（通过 Copernicus 免费获取）进行 NDVI 变化检测：
```python
def ndvi_diff(before_red, before_nir, after_red, after_nir):
    ndvi_before = (before_nir - before_red) / (before_nir + before_red)
    ndvi_after = (after_nir - after_red) / (after_nir + after_red)
    return ndvi_after - ndvi_before
```

### 预估工作量：**XL（10-14 周）**

- 第 1-3 周：太阳能计算器、PVLib 集成、辐照度 UI
- 第 4-6 周：3D 建筑编辑器（拉伸、FAR、模板、阴影可视化）
- 第 7-9 周：地形分析管道（GDAL、等高线、坡度/坡向）
- 第 10-12 周：挖填方、变化检测、选址
- 第 13-14 周：集成、性能、用于分析的 GPU 计算

---

## Phase 6: AI 助手 (Earth Mate)

### Proto 提供了什么

| Proto 文件 | 关键定义 |
|---|---|
| `geo/earth/proto/earth_mate/earth_mate_request.proto` | 14 条消息：多轮对话、文档/要素上下文、图像查询、俯视影像、行业定向 |
| `geo/earth/proto/earth_mate/earth_mate_response.proto` | 5 条消息：聊天回复、可执行的 `Commands`（34 种类型）、归因、错误处理 |
| `geo/earth/proto/earth_mate/earth_mate_attribution.proto` | AI 内容的来源归因 |
| `geo/earth/proto/earth_mate/streaming.proto` | 用于实时 AI 响应的服务器推送流 |
| `geo/earth/proto/earth_mate/file_attachment.proto` | 聊天中的文件/图像上传 |
| `google/internal/earth/v1/layers.proto` | `GeminiGeneratedLayer` — AI 创建的数据图层，包含 CNS 路径 |

### 我们需要构建什么

1. **LLM 集成**（带函数/工具调用）
2. **聊天界面**（带地理上下文：相机位置、可见要素）
3. **提示工程**（用于结构化的 `Commands` 输出）
4. **流式响应**（服务器推送事件）
5. **文件上传**（用于图像分析）
6. **AI 生成的图层**（来自 LLM 的矢量数据）

### 技术选型

| 选择 | 理由 |
|---|---|
| **OpenAI GPT-4o** | 最佳函数调用、用于图像分析的视觉能力、128K 上下文；成本约 $5-15/百万 token |
| **Anthropic Claude 3.5 Sonnet**（替代） | 更好的结构化输出、更长的上下文（200K）；暂无原生视觉 API |
| **开源 LLM**（替代） | **Mistral Large 2** 或 **Llama 3.1 70B**，通过 Groq 提速或通过 vLLM 自托管；函数调用不够可靠 |
| **LangChain.js** 或 **Vercel AI SDK** | LLM 编排、工具调用、流式传输；Vercel AI SDK 对 Web 更简单 |
| **Server-Sent Events**（SSE） | 流式聊天响应（匹配 proto `streaming.proto`） |

**推荐：** 从 OpenAI GPT-4o 开始以获得最佳的工具调用质量。添加 Claude 作为回退。保留开源方案用于后期成本优化。

### Proto 到 LLM 的映射

```
EarthMateRequest              → OpenAI Chat Completion
  messages[]（role + content） → messages[]（system/user/assistant）
  document_context             → 作为系统提示注入，附带文档摘要
  feature_context              → 作为系统提示注入，附带要素详情
  camera_lat, camera_lng       → system："用户正在查看海拔 {alt}m 处的 {lat}、{lng}"
  industry                     → system："助手专精于 {industry}"
  overhead_imagery             → 支持视觉的模型分析卫星图像

EarthMateResponse             → OpenAI 响应
  chat_response                → 助手的消息内容
  commands[]                   → 映射到函数定义的 tool_calls[]
  attributions                 → 从工具调用元数据中提取
```

### 用于工具调用的函数定义

定义 34 个函数，匹配每个 `Commands` oneof 情况：
```typescript
const earthMateTools = [
  {
    name: 'fly_to_camera',
    description: '将相机飞行到地球上的特定位置',
    parameters: {
      type: 'object',
      properties: {
        latitude: { type: 'number', description: '纬度（度）' },
        longitude: { type: 'number', description: '经度（度）' },
        altitude: { type: 'number', description: '海拔（米）' },
        heading: { type: 'number', description: '相机航向 0-360°' },
        tilt: { type: 'number', description: '相机俯仰 0-90°' },
        animation: { type: 'string', enum: ['TELEPORT', 'FLY'] },
      },
      required: ['latitude', 'longitude'],
    },
  },
  {
    name: 'perform_search',
    description: '搜索地球上的地点',
    parameters: { ... },
  },
  {
    name: 'create_placemark',
    description: '在某个位置放置图钉或创建地标',
    parameters: { ... },
  },
  {
    name: 'toggle_layer',
    description: '显示或隐藏地图图层',
    parameters: {
      type: 'object',
      properties: {
        layer: { type: 'string', enum: ['3D_BUILDINGS', 'CLOUDS', 'GRIDLINES', 'PHOTOS'] },
        visible: { type: 'boolean' },
      },
    },
  },
  // ... 另外 30 个工具
];
```

### 分步实施

#### Step 6.1: LLM 集成
```typescript
import { generateText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';

async function chatWithEarthMate(
  messages: ChatMessage[],
  context: EarthMateContext
): Promise<EarthMateResponse> {
  const systemPrompt = buildSystemPrompt(context); // 相机、要素、行业

  const result = await generateText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    tools: earthMateTools.reduce((acc, t) => ({ ...acc, [t.name]: tool(t) }), {}),
    maxSteps: 5, // 允许多步工具调用
  });

  return {
    chatResponse: result.text,
    commands: result.toolCalls.map(tc => toolCallToCommand(tc)),
    // 来自工具调用元数据的归因信息
  };
}
```

#### Step 6.2: 系统提示模板
```
你是 Earth Mate，一个集成到 3D 地球查看器中的 AI 助手。

当前视图：
- 相机位置：{lat}、{lng}，海拔 {alt}m
- 地图样式：{mapStyle}（{projection}）
- 活跃图层：{layers}

文档上下文：
{docSummary}

要素上下文：
{features}

用户行业：{industry}

你帮助用户导航地球、创建要素、分析地点并回答地理问题。
始终使用工具来执行操作（飞行到、搜索、创建要素），而不仅仅是描述。
```

#### Step 6.3: 流式聊天 UI
```typescript
// 用于流式传输的 SSE 端点
app.post('/api/earth-mate/chat', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: req.body.messages,
    tools: earthMateTools,
    stream: true,
  });

  for await (const chunk of stream) {
    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  }
  res.end();
});
```

#### Step 6.4: 图像生成 (OpenImageGenerator)
使用 OpenAI DALL-E 3 或通过 Replicate 使用 Stable Diffusion：
```typescript
async function generateImage(prompt: string, style: string): Promise<string> {
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: `Aerial/satellite style visualization: ${prompt}`,
    size: '1024x1024',
  });
  return response.data[0].url!;
}
```

#### Step 6.5: Gemini 生成的图层
对于 `GeminiGeneratedLayer` 功能，使用 LLM 从自然语言生成 GeoJSON：
```
用户："显示加利福尼亚所有的国家公园"
→ LLM 生成带有公园边界的 GeoJSON FeatureCollection
→ 渲染为 Cesium GeoJsonDataSource 图层
```

### 预估工作量：**L（6-8 周）**

- 第 1-2 周：OpenAI 集成、系统提示、基础聊天 UI
- 第 3-4 周：全部 34 个工具定义、工具调用 → 命令分发
- 第 5-6 周：上下文组装（相机、要素、文档）、流式传输、文件上传
- 第 7-8 周：图像生成、Gemini 图层、错误处理、速率限制

---

## Phase 7: 分析与日志

### Proto 提供了什么

| Proto 文件 | 关键定义 |
|---|---|
| `logs/proto/geo/earth/app/earth_log.proto` | **89 种事件类型类别**、400+ 离散事件值、30+ 子消息 |
| `logs/proto/visual_element/`（14 个文件） | 通用点击追踪、55 种用户操作类型、UI 树嫁接 |
| `logs/proto/maps/directions/`（35 个文件） | 完整的路线请求/响应日志、MRP 阶段、A/B 测试 |
| `logs/proto/maps/mobile/`（3 个文件） | 50+ 导航会话事件、导航中的 Gemini |
| `logs/proto/maps/transit/`（21 个文件） | 7 种模式的连接日志、票价结构 |
| `logs/eventid/eventid.proto` | 带微秒时间戳的通用事件 ID |
| `logs/proto/logs_annotations/` | 36 种标识符类型，用于字段级 PII 分类 |

### 我们需要构建什么

1. **事件采集管道** — 捕获 89 种 Earth 事件类型
2. **客户端事件日志器** — 拦截所有命令、状态变更、UI 交互
3. **事件聚合与存储** — 时序数据库
4. **分析仪表板** — 可视化使用模式
5. **性能监控** — FPS、内存、加载时间

### 技术选型

| 需求 | 自托管 | SaaS | 推荐 |
|---|---|---|---|
| **事件存储** | **ClickHouse** — 列式、实时、可处理数十亿事件；水平扩展 | BigQuery、Snowflake | **ClickHouse** — 免费，对分析工作负载极快 |
| **仪表板** | **Grafana** + ClickHouse 插件 | Mixpanel、Amplitude、PostHog | **Grafana** — 开源；或 **PostHog**（自托管） |
| **客户端 SDK** | 自定义 TypeScript 日志器 | PostHog JS、RudderStack | 自定义 — proto 类型提供了确切的事件模式 |
| **性能** | 浏览器 Performance API + 自定义指标 | Sentry、Datadog RUM | **Sentry** 用于错误；自定义用于性能 |

### 事件管道架构

```
浏览器（Cesium + React）
  → CommandDispatcher.logCommand(cmd)
  → StateObserver.onStateChange(stateSlice)
  → VETracker.trackClick(VisualElementId)
      │
      ▼ （每 5 秒或在页面卸载时批量 POST）
采集服务（FastAPI/Node.js）
  → 根据 proto 模式验证
  → 用服务器 IP、时间戳、会话丰富数据
  → 发布到 Kafka / 直接插入
      │
      ▼
ClickHouse
  → earth_events 表（按日期分区，按 event_type 排序）
  → ve_events 表
  → performance_events 表
      │
      ▼
Grafana 仪表板
  → DAU/MAU、功能使用、命令分布
  → 性能：P50/P95 FPS、加载时间、内存
  → 漏斗分析：搜索 → 知识卡片 → 飞行到
```

### Proto 到 ClickHouse 的映射

```sql
CREATE TABLE earth_events (
  event_id          String,           -- UUID v7（可按时间排序）
  event_time        DateTime64(3),    -- 来自 EventIdMessage.time_usec
  session_id        String,
  user_id           String,
  event_type        LowCardinality(String),  -- EarthEvent.Type 枚举：89 个值
  event_value       UInt32,           -- 离散事件值（0-20000+）
  command_type      LowCardinality(String),  -- 如果由命令触发
  state_before      String,           -- 相关状态切片的 JSON
  state_after       String,
  properties        JSON,             -- 事件特定的子消息（JSON 格式）
  client_ip         IPv6,
  user_agent        String,
  screen_width      UInt16,
  screen_height     UInt16,
  renderer          String,           -- WebGL/WebGPU 渲染器字符串
  fps               Float32,          -- 用于性能事件
  memory_mb         Float32,
  load_time_ms      Float32,
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (event_type, event_time)
TTL event_time + INTERVAL 90 DAY;
```

### 分步实施

#### Step 7.1: 客户端事件日志器
```typescript
class EarthEventLogger {
  private buffer: EarthEvent[] = [];
  private sessionId = uuidv7();
  private sendInterval: number;

  logCommand(cmd: Command): void {
    this.buffer.push({
      eventType: this.commandToEventType(cmd),
      eventValue: this.commandToEventValue(cmd),
      commandType: cmd.commandType.$case,
      eventTime: Date.now() * 1000,
      sessionId: this.sessionId,
    });
  }

  logPerformance(stats: RenderingStats): void {
    this.buffer.push({
      eventType: 'MIRTH_STATS',
      fps: stats.averageFps,
      memoryMb: stats.gpuMemory / 1024 / 1024,
      properties: { jankCount: stats.jank30Count },
    });
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const events = this.buffer.splice(0);
    navigator.sendBeacon('/api/events', JSON.stringify({ events }));
  }

  start(): void {
    this.sendInterval = setInterval(() => this.flush(), 5000);
    window.addEventListener('beforeunload', () => this.flush());
  }
}
```

#### Step 7.2: 采集服务
```python
@app.post("/api/events")
async def collect_events(events: list[EarthEvent]):
    # 验证、丰富、插入
    rows = []
    for evt in events:
        rows.append({
            'event_id': evt.event_id,
            'event_time': datetime.fromtimestamp(evt.event_time / 1_000_000, tz=timezone.utc),
            'event_type': evt.event_type,
            'event_value': evt.event_value,
            # ...
        })
    client.execute('INSERT INTO earth_events VALUES', rows)
    return {'status': 'ok', 'count': len(rows)}
```

#### Step 7.3: 视觉元素追踪
实现与 `visual_element_lite.proto` 模式匹配的点击/交互追踪：
```typescript
// 通过 React 的 onClick 附加到所有 UI 元素
function VeTracker({ elementId, elementType, children }) {
  const handleClick = (e) => {
    earthEventLogger.logVEClick({
      elementId,
      elementType,       // BUTTON、TAB、CARD、MENU_ITEM 等
      actionType: 'CLICK',  // proto 中的 55 种操作类型
      timestamp: Date.now() * 1000,
    });
  };
  return <div onClick={handleClick}>{children}</div>;
}
```

#### Step 7.4: Grafana 仪表板
为以下内容创建仪表板：
1. **管理层：** DAU、MAU、留存率、会话时长
2. **功能使用：** 命令分布饼图、图层切换频率
3. **性能：** 按设备分组的 P50/P95/P99 FPS、内存使用、加载时间直方图
4. **错误：** 崩溃率、WebGL 错误、API 错误率
5. **Earth Mate：** 聊天会话数、点赞/踩比率、命令执行率

### 预估工作量：**M（3-4 周）**

- 第 1 周：ClickHouse 搭建、事件模式、采集服务
- 第 2 周：客户端日志器、命令/状态/VE 追踪
- 第 3 周：Grafana 仪表板、性能监控
- 第 4 周：PII 脱敏、数据保留策略、告警

---

## Phase 8: 构建与部署

### Proto 提供了什么

| Proto 文件 | 关键定义 |
|---|---|
| `geo/earth/proto/compile_time_config.proto` | 编译时配置，嵌入构建产物 |
| `geo/earth/proto/bootstrap_client_config.proto` | 完整配置获取前的初始客户端配置 |
| `google/internal/earth/v1/client_config.proto` | 运行时功能配置（234 个标志）、服务端点、计划限制 |
| `google/internal/earth/v1/feature_flags.proto` | 实验/功能标志的远程下发 |

### 我们需要构建什么

1. **Proto 编译管道** — CI/CD，在 proto 变更时重建 TypeScript SDK
2. **WebAssembly 编译** — C++ 地球核心 → WASM（可选，用于性能优化）
3. **CI/CD** — 代码检查、测试、构建、部署
4. **部署** — 静态前端的 CDN、后端服务的 Docker/容器
5. **功能标志系统** — 服务器控制的功能开关

### 技术选型

| 需求 | 选择 | 理由 |
|---|---|---|
| **CI/CD** | **GitHub Actions** | 对公共仓库免费、2000 分钟/月、轻松支持 Docker/矩阵构建 |
| **前端托管** | **Cloudflare Pages** 或 **Vercel** | 免费层、全球 CDN、即时缓存失效、HTTP/3 |
| **后端托管** | **Fly.io** 或 **Railway** | 简单的 Docker 部署、自动扩展、包含 PostgreSQL |
| **容器注册表** | **GitHub Container Registry**（ghcr.io） | 免费，与 Actions 集成 |
| **功能标志** | **LaunchDarkly**（免费层）或 **Unleash**（自托管） | Unleash 是开源的，匹配 234 个标志的 proto 模型 |
| **WASM 编译** | **Emscripten 3.1+** | 标准的 C++→WASM 工具链；将 protobuf C++ 运行时编译为 WASM |
| **Monorepo** | **Turborepo** 或 **Nx** | 协调前端、后端、proto 包之间的构建 |

### 构建管道

```
[Proto 变更]
     │
     ▼
buf lint → buf breaking → buf generate（TypeScript + Go + Python）
     │
     ├──→ frontend/（TypeScript SDK）──→ Vite 构建 ──→ CDN
     ├──→ backend/ （Go gRPC 桩）    ──→ Docker 构建 ──→ 容器注册表
     └──→ wasm/    （C++ protos）    ──→ Emscripten 编译 ──→ npm 包
```

### WASM 编译（可选但有价值）

用于性能关键路径（瓦片解码、几何处理、空间索引）：

```dockerfile
# Dockerfile.wasm
FROM emscripten/emsdk:3.1.50

RUN apt-get update && apt-get install -y protobuf-compiler

# 将 protos 编译为 C++
RUN protoc --cpp_out=gen/cpp $(find proto/ -name "*.proto")

# 将 C++ 编译为 WASM
RUN emcc \
  -O3 \
  -s WASM=1 \
  -s EXPORTED_FUNCTIONS='["_process_tile","_spatial_query","_free_result"]' \
  -s EXPORTED_RUNTIME_METHODS='["cwrap","ccall","getValue"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -o dist/earth_core.js \
  src/tile_processor.cpp \
  gen/cpp/*.cc
```

WASM 的用例：
- **Protobuf 解码** — 对大批量消息比 JS protobuf-ts 更快
- **S2 几何** — WASM 中的空间索引（Google 的 S2 库是 C++）
- **瓦片解码** — 解压和解析矢量瓦片格式
- **地形处理** — 高程查询、光线投射

### 分步实施

#### Step 8.1: Proto CI 管道
```yaml
# .github/workflows/proto-ci.yml
name: Proto CI
on:
  push:
    paths: ['proto/**', 'buf.yaml', 'buf.gen.yaml']

jobs:
  lint-and-generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: bufbuild/buf-setup-action@v1
      - run: buf lint
      - run: buf breaking --against 'https://github.com/user/repo.git#branch=main'
      - run: buf generate
      - uses: actions/upload-artifact@v4
        with:
          name: generated-sdk
          path: gen/
```

#### Step 8.2: 前端构建与部署
```yaml
# .github/workflows/deploy-frontend.yml
name: Deploy Frontend
on:
  push:
    branches: [main]
    paths: ['frontend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
        working-directory: frontend
      - run: npm run build
        working-directory: frontend
      - uses: cloudflare/pages-action@v1
        with:
          directory: frontend/dist
          projectName: earth-studio
```

#### Step 8.3: 后端部署
```yaml
# .github/workflows/deploy-backend.yml
name: Deploy Backend
jobs:
  deploy:
    steps:
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/org/earth-backend:${{ github.sha }}
      - uses: superfly/flyctl-actions@v1
        with:
          args: deploy --image ghcr.io/org/earth-backend:${{ github.sha }}
```

#### Step 8.4: 功能标志系统
```typescript
// 客户端功能标志评估
const flags = await fetchConfig().then(c => c.featureFlags);

if (flags.PHOTOS_LAYER_ENABLED) {
  enablePhotosLayer();
}
if (flags.EARTH_MATE_PERSISTENT_VISION_CONTEXT_ENABLED) {
  enableVisionContext();
}
```

使用 **Unleash**（自托管）管理 234 个功能标志：
```yaml
# docker-compose.yml
services:
  unleash:
    image: unleashorg/unleash-server:latest
    ports: ['4242:4242']
    environment:
      DATABASE_URL: postgres://unleash:password@postgres:5432/unleash
```

### 部署拓扑

```
                           ┌──────────────────┐
     用户 ─────────────────▶│ Cloudflare CDN    │
                           │（静态前端）         │
                           └──────┬───────────┘
                                  │ API 调用
                           ┌──────▼───────────┐
                           │ Fly.io / Railway  │
                           │ ┌──────────────┐ │
                           │ │ API 网关      │ │  （Fastify / Express）
                           │ ├──────────────┤ │
                           │ │ 认证服务      │ │  （OAuth 2.0 + JWT）
                           │ ├──────────────┤ │
                           │ │ 要素 CRUD     │ │  → PostgreSQL + PostGIS
                           │ ├──────────────┤ │
                           │ │ 搜索代理      │ │  → Nominatim / Photon
                           │ ├──────────────┤ │
                           │ │ 太阳能服务    │ │  → PVLib（Python）
                           │ ├──────────────┤ │
                           │ │ Earth Mate   │ │  → OpenAI API
                           │ ├──────────────┤ │
                           │ │ 事件日志器    │ │  → ClickHouse
                           │ ├──────────────┤ │
                           │ │ OSRM 路线器   │ │  （独立容器）
                           │ └──────────────┘ │
                           └──────────────────┘
```

### 预估工作量：**M（3-4 周）**

- 第 1 周：Proto CI/CD 管道、buf 集成、TypeScript 代码生成自动化
- 第 2 周：前端 CDN 部署、后端 Docker 配置、容器注册表
- 第 3 周：功能标志（Unleash）、WASM 编译管道
- 第 4 周：多环境（dev/staging/prod）、监控、SSL、密钥管理

---

## 依赖关系图

```
Phase 0（Proto 基础）──────────────────────────────────────────────┐
    │                                                                │
    ├── Phase 1（3D 地球）◄── Phase 0 类型                           │
    │       │                                                        │
    │       ├── Phase 2（命令）◄── Phase 1 相机 + Phase 0 命令       │
    │       │       │                                                │
    │       │       ├── Phase 3（内容）◄── Phase 2 状态 + Phase 0 模型│
    │       │       │       │                                        │
    │       │       │       ├── Phase 4（地图）◄── Phase 1 地球 + Ph 0 maps│
    │       │       │       │       │                                │
    │       │       │       │       ├── Phase 5（设计）◄── Phase 3 要素│
    │       │       │       │       │       │                        │
    │       │       │       │       │       ├── Phase 6（AI）◄── Phase 2 cmd│
    │       │       │       │       │       │       │                │
    │       │       │       │       │       │       ├── Phase 7（分析）│
    │       │       │       │       │       │       │       │        │
    │       │       │       │       │       │       │       └── Phase 8（部署）
    │       │       │       │       │       │       │                │
    └───────┴───────┴───────┴───────┴───────┴───────┴────────────────┘
    所有 Phase 都依赖 Phase 0 生成的类型。
```

**可并行化的机会：**
- Phase 1 + Phase 2 可以重叠（相机 + 命令分发相互依赖但都在 UI 侧）
- Phase 4 可以在 Phase 0 完成后立即开始（地图领域独立于 Earth core）
- Phase 7 可以在 Phase 2 命令分发存在后立即开始（日志钩入命令）
- Phase 6 需要 Phase 2（命令执行），但可以用 mock 命令并行开发
- Phase 8 是从第 1 天开始的持续过程（CI/CD 应该在代码之前就存在）

---

## 总结：总预估工作量

| Phase | MVP 范围 | 完整范围 | 团队规模 |
|---|---|---|---|
| 0: Proto 基础 | **M**（2-3 周） | M（2-3 周） | 1 名后端 |
| 1: 3D 地球渲染 | **L**（4-6 周） | L（4-6 周） | 1-2 名前端 |
| 2: 命令系统 | **M**（2-3 周） | XL（6-8 周） | 1-2 名前端 |
| 3: 内容创作 | **S**（1-2 周，仅 KML） | XL（8-12 周） | 1 名前端 + 1 名后端 |
| 4: 地图集成 | — | XL（10-14 周） | 2 名后端 + 1 名前端 |
| 5: 设计工具 | — | XL（10-14 周） | 1 名后端 + 1 名前端 |
| 6: AI 助手 | — | L（6-8 周） | 1 名后端 + 1 名前端 |
| 7: 分析 | **S**（1 周，基础） | M（3-4 周） | 1 名后端 |
| 8: 构建与部署 | **S**（1 周，基础） | M（3-4 周） | 1 名 DevOps |

| | MVP | 完整范围 |
|---|---|---|
| **总日历时间** | **10-16 周**（2 名工程师） | **12-18 个月**（6-8 名工程师） |
| **总人周数** | 约 18-28 人周 | 约 52-73 人周 |

### MVP 交付物

一个基于浏览器的 3D 地球查看器，具备：
- 卫星 + 地形 + 3D 建筑（CesiumJS）
- 相机导航（缩放、平移、倾斜、使用 LookAt/LookFrom 飞行到）
- 地点搜索 + 知识卡片
- 放置地标 + KML 导入
- 图层切换（建筑、云层、网格线）
- 基础的命令系统，带撤销/重做
- 最小化分析（页面浏览、命令）

**这是 Google Earth（查看器），而非 Google Earth Studio（编辑器）。** 它是一个可运行的 3D 地球，你可以导航和标注。这才是正确的 MVP — 证明 proto 到渲染器的管道可行，然后在后续迭代中叠加编辑、路线、设计和 AI。

---

> **下一步：** 开始 Phase 0。搭建 proto 编译管道。没有可编译的类型，其他一切都无法工作。
