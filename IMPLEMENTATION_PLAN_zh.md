# Earth Studio 实施计划

## TypeScript + Three.js + Next.js — OOP 架构

> **基于：** 1,316 个 Google Earth proto 定义文件、完整的状态管理方案、命令系统、
> 内容创建模型、渲染管线协议以及地理信息基础设施数据模型。
>
> **生成日期：** 2026-08-12

---

## 目录

1. [技术栈](#技术栈)
2. [项目结构](#项目结构)
3. [OOP 架构：核心类层次结构](#oop-架构核心类层次结构)
4. [Proto 到 TypeScript 管线](#proto-到-typescript-管线)
5. [数据库模式](#数据库模式)
6. [API 端点](#api-端点)
7. [前后端分离](#前后端分离)
8. [实施阶段](#实施阶段)
   - [阶段 1：基础](#阶段-1基础第-1-2-周--p0-关键)
   - [阶段 2：命令 + 状态](#阶段-2命令--状态第-3-4-周--p0-关键)
   - [阶段 3：内容创建](#阶段-3内容创建第-5-6-周--p1-高)
   - [阶段 4：搜索 + 知识卡片](#阶段-4搜索--知识卡片第-7-周--p1-高)
   - [阶段 5：图层 + 地图样式](#阶段-5图层--地图样式第-8-9-周--p1-高)
   - [阶段 6：街景 + 时间功能](#阶段-6街景--时间功能第-10-周--p2-中)
   - [阶段 7：设计工具 + 分析](#阶段-7设计工具--分析第-11-13-周--p2-中)
   - [阶段 8：Earth Mate AI](#阶段-8earth-mate-ai第-14-周--p2-中)
   - [阶段 9：云项目 + 协作](#阶段-9云项目--协作第-15-16-周--p3-低)
   - [阶段 10：分析 + 打磨](#阶段-10分析--打磨第-17-18-周--p3-低)
9. [关键设计决策](#关键设计决策)
10. [依赖关系图](#依赖关系图)

---

## 技术栈

| 层级 | 技术 | 理由 |
|---|---|---|
| **前端框架** | Next.js 14 (App Router) | SSR 用于 SEO，API 路由用于后端，React Server Components |
| **3D 引擎** | Three.js 通过 React Three Fiber | React 中的声明式 3D，WebGL，庞大的生态系统 |
| **状态管理** | MobX（OOP 可观察对象） | 基于类的可观察对象与 proto 状态模式匹配；60+ 个状态切片自然映射 |
| **Proto 运行时** | protobuf-ts | 纯 TypeScript proto 生成，可 Tree-Shaking，零原生依赖 |
| **数据库** | PostgreSQL 16 + PostGIS 3.4 + Drizzle ORM | S2 几何索引，类型安全查询，迁移 |
| **缓存** | Redis | 会话状态，瓦片缓存，命令队列 |
| **样式** | Tailwind CSS | 快速 UI 开发，设计系统令牌 |
| **测试** | Vitest + Playwright | 单元测试 + 浏览器端到端测试 |
| **Monorepo** | Turborepo | 并行构建，共享配置，依赖图感知 |
| **CI/CD** | GitHub Actions | Proto CI，构建，测试，部署管线 |
| **托管** | Cloudflare Pages（前端）+ Fly.io（后端） | 全球 CDN + 容器化后端 |
| **认证** | NextAuth.js | OAuth 2.0，会话管理，JWT |
| **功能开关** | Unleash（自托管） | 234 个实验开关与 proto 模式匹配 |

---

## 项目结构

```
earthstudio/
├── packages/
│   ├── proto/                      # 从 .proto 生成的 TypeScript
│   │   ├── src/
│   │   │   ├── gen/                # protobuf-ts 生成代码
│   │   │   │   ├── commands.ts     # Command（34 个 oneof 类型）
│   │   │   │   ├── geometry.ts     # Location, Rotation, Camera, LatLng
│   │   │   │   ├── mapstyle.ts     # MapStyle, Projection, Imagery, ThreeDFeatures
│   │   │   │   ├── content_editing_model.ts  # 107 个消息：Feature, Placemark, Geometry, Style
│   │   │   │   ├── content_editing_mutations.ts # 13 个变更类型
│   │   │   │   ├── renderable-entity.ts # 知识卡片（40 个消息）
│   │   │   │   ├── earth_mate_request.ts   # AI 请求模型
│   │   │   │   ├── earth_mate_response.ts  # AI 响应模型
│   │   │   │   ├── earth_log.ts     # 89 个事件类型类别
│   │   │   │   └── index.ts        # 桶导出
│   │   │   ├── adapters/           # Proto → 应用模型适配器
│   │   │   │   ├── CommandAdapter.ts
│   │   │   │   ├── CameraAdapter.ts
│   │   │   │   ├── FeatureAdapter.ts
│   │   │   │   ├── MapStyleAdapter.ts
│   │   │   │   ├── LayerAdapter.ts
│   │   │   │   └── KnowledgeCardAdapter.ts
│   │   │   └── third_party/        # Google 内部依赖的桩 proto
│   │   │       ├── google/storage/datapol/...
│   │   │       ├── google/net/proto2/...
│   │   │       └── google/java/com/google/apps/jspb/...
│   │   ├── buf.gen.yaml
│   │   ├── buf.yaml
│   │   └── package.json
│   │
│   ├── core/                       # 共享领域模型（OOP）
│   │   └── src/
│   │       ├── models/
│   │       │   ├── commands/
│   │       │   │   ├── Command.ts              # 抽象基类
│   │       │   │   ├── FlyToCamera.ts
│   │       │   │   ├── PerformSearch.ts
│   │       │   │   ├── CreateFeature.ts
│   │       │   │   ├── DeleteFeature.ts
│   │       │   │   ├── EditFeature.ts
│   │       │   │   ├── ToggleLayer.ts
│   │       │   │   ├── OpenKnowledgeCard.ts
│   │       │   │   ├── EnterStreetView.ts
│   │       │   │   ├── EnterTimeMachine.ts
│   │       │   │   ├── EnterTimelapse.ts
│   │       │   │   ├── SetBasemapStyle.ts
│   │       │   │   ├── CreatePointPlacemark.ts
│   │       │   │   ├── CreateCloudProject.ts
│   │       │   │   ├── OpenCloudProject.ts
│   │       │   │   ├── OpenKmlDocument.ts
│   │       │   │   ├── OpenKmlDocumentFromContent.ts
│   │       │   │   ├── OpenProjectByKey.ts
│   │       │   │   ├── CreateFeaturesInFolder.ts
│   │       │   │   ├── ToggleAvailableLayersUi.ts
│   │       │   │   ├── PreviewDataLayer.ts
│   │       │   │   ├── ViewDesign.ts
│   │       │   │   ├── CreateDesigns.ts
│   │       │   │   ├── ViewRateCard.ts
│   │       │   │   ├── OpenEarthMateChat.ts
│   │       │   │   ├── ShowLayerCardDetails.ts
│   │       │   │   ├── ViewOnDemandAnalysis.ts
│   │       │   │   ├── OpenImageGenerator.ts
│   │       │   │   ├── SetHomescreenVisibility.ts
│   │       │   │   ├── ClearSearchHistory.ts
│   │       │   │   ├── OpenSearchHistory.ts
│   │       │   │   └── OpenFeelingLuckyCard.ts
│   │       │   ├── camera/
│   │       │   │   ├── Camera.ts               # 抽象基类
│   │       │   │   ├── LookAtCamera.ts
│   │       │   │   ├── LookFromCamera.ts
│   │       │   │   ├── CameraAnimation.ts      # 枚举：TELEPORT, FLY
│   │       │   │   ├── CameraPresentationMode.ts # 枚举：STATIC, POI_ORBIT, PLANET_ORBIT, CINEMATIC
│   │       │   │   └── Panorama.ts
│   │       │   ├── geometry/
│   │       │   │   ├── Location.ts              # 经度/纬度/海拔
│   │       │   │   ├── Rotation.ts              # 朝向/倾斜/翻滚
│   │       │   │   ├── LatLng.ts
│   │       │   │   ├── LatLngAlt.ts
│   │       │   │   ├── LatLonBox.ts             # 视口边界
│   │       │   │   ├── BoundingBox.ts
│   │       │   │   ├── Size.ts                  # 宽度/高度
│   │       │   │   └── CoordinateSystems.ts     # WGS84, 墨卡托, S2
│   │       │   ├── features/
│   │       │   │   ├── Feature.ts               # 抽象基类
│   │       │   │   ├── Folder.ts
│   │       │   │   ├── Placemark.ts
│   │       │   │   ├── PointPlacemark.ts
│   │       │   │   ├── Polyline.ts
│   │       │   │   ├── Polygon.ts
│   │       │   │   ├── MultiGeometry.ts
│   │       │   │   ├── GroundOverlay.ts
│   │       │   │   ├── ScreenOverlay.ts
│   │       │   │   ├── PhotoOverlay.ts
│   │       │   │   ├── Model3D.ts
│   │       │   │   ├── NetworkLink.ts
│   │       │   │   ├── TrackSet.ts
│   │       │   │   ├── Tour.ts
│   │       │   │   └── FeatureTree.ts
│   │       │   ├── styles/
│   │       │   │   ├── ContentStyle.ts
│   │       │   │   ├── PointStyle.ts
│   │       │   │   ├── PolylineStyle.ts
│   │       │   │   ├── PolygonStyle.ts
│   │       │   │   ├── BalloonStyle.ts
│   │       │   │   ├── LabelStyle.ts
│   │       │   │   ├── ListItemStyle.ts
│   │       │   │   ├── Icon.ts                  # StockIcon, CustomIcon, IconData
│   │       │   │   ├── Color.ts
│   │       │   │   └── StyleUrlList.ts
│   │       │   ├── layers/
│   │       │   │   ├── Layer.ts                 # 抽象基类
│   │       │   │   ├── SatelliteLayer.ts
│   │       │   │   ├── RoadmapLayer.ts
│   │       │   │   ├── TerrainLayer.ts
│   │       │   │   ├── BuildingLayer.ts
│   │       │   │   ├── CloudLayer.ts
│   │       │   │   ├── PhotoLayer.ts
│   │       │   │   ├── GridlinesLayer.ts
│   │       │   │   ├── TimelapseLayer.ts
│   │       │   │   ├── ThreeDCoverageLayer.ts
│   │       │   │   ├── UpdatedImageryLayer.ts
│   │       │   │   ├── LandParcelsLayer.ts
│   │       │   │   ├── PinnedProjectsLayer.ts
│   │       │   │   └── DiscoveryLayer.ts
│   │       │   ├── document/
│   │       │   │   ├── Document.ts
│   │       │   │   ├── DocumentMetadata.ts
│   │       │   │   ├── DocumentProperties.ts
│   │       │   │   ├── DocumentSchema.ts
│   │       │   │   ├── DocumentContents.ts
│   │       │   │   ├── DocumentNamespace.ts     # 枚举：EARTH, MY_MAPS
│   │       │   │   ├── MapType.ts
│   │       │   │   ├── FeatureKey.ts
│   │       │   │   ├── IoOperation.ts
│   │       │   │   └── Role.ts                  # OWNER, EDITOR, VIEWER
│   │       │   ├── mapstyle/
│   │       │   │   ├── MapStyle.ts
│   │       │   │   ├── Projection.ts            # GLOBE | MERCATOR
│   │       │   │   ├── Imagery.ts               # SATELLITE | ROADMAP | TERRAIN
│   │       │   │   ├── ThreeDFeatures.ts        # ALL | TERRAIN_ONLY | NONE
│   │       │   │   ├── BaseLayers.ts
│   │       │   │   ├── BaseLayersPreset.ts      # CUSTOM | CLEAN | EXPLORATION | EVERYTHING
│   │       │   │   └── GridlinesMode.ts         # NONE | LAT_LON
│   │       │   ├── knowledge/
│   │       │   │   ├── RenderableEntity.ts
│   │       │   │   ├── KnowledgeCard.ts
│   │       │   │   ├── Image.ts
│   │       │   │   ├── Fact.ts
│   │       │   │   ├── CardSet.ts
│   │       │   │   ├── OpenHours.ts
│   │       │   │   └── OpenLocationCode.ts
│   │       │   ├── earthdata/
│   │       │   │   ├── EarthDataLayer.ts
│   │       │   │   ├── ColorRamp.ts
│   │       │   │   ├── ColorPalette.ts
│   │       │   │   ├── CategoricalStyleRule.ts
│   │       │   │   ├── InterpolatedStyleRule.ts
│   │       │   │   └── DataBinding.ts
│   │       │   ├── media/
│   │       │   │   ├── Media.ts
│   │       │   │   ├── MediaDisplayResource.ts
│   │       │   │   ├── ImageMedia.ts
│   │       │   │   └── YouTubeVideo.ts
│   │       │   └── mutations/
│   │       │       ├── DataMutation.ts
│   │       │       ├── DataMutationSet.ts
│   │       │       ├── AddFeature.ts
│   │       │       ├── DeleteFeature.ts
│   │       │       ├── UpdateFeatureProperties.ts
│   │       │       ├── SetStyle.ts
│   │       │       ├── AddColumn.ts
│   │       │       ├── RemoveColumn.ts
│   │       │       ├── UpdateColumn.ts
│   │       │       ├── AddFeatureMedia.ts
│   │       │       ├── DeleteFeatureMedia.ts
│   │       │       ├── SetFeatureParent.ts
│   │       │       ├── SetFeatureIndex.ts
│   │       │       ├── UpdateDocumentProperties.ts
│   │       │       └── UpdateStyleOptions.ts
│   │       ├── services/
│   │       │   ├── CommandDispatcher.ts
│   │       │   ├── CameraController.ts
│   │       │   ├── FeatureService.ts
│   │       │   ├── DocumentService.ts
│   │       │   ├── SearchService.ts
│   │       │   ├── KnowledgeCardService.ts
│   │       │   ├── LayerService.ts
│   │       │   ├── MapStyleService.ts
│   │       │   ├── KmlParser.ts
│   │       │   ├── KmlSerializer.ts
│   │       │   ├── GeocodingService.ts
│   │       │   ├── StreetViewService.ts
│   │       │   ├── TimeMachineService.ts
│   │       │   ├── TimelapseService.ts
│   │       │   ├── DesignService.ts
│   │       │   ├── EarthDataLayerService.ts
│   │       │   ├── MutationService.ts
│   │       │   ├── EarthMateService.ts
│   │       │   ├── ImageGenerationService.ts
│   │       │   ├── OnDemandAnalysisService.ts
│   │       │   ├── EventLogger.ts
│   │       │   └── FeatureFlagService.ts
│   │       ├── interfaces/
│   │       │   ├── IGlobeRenderer.ts
│   │       │   ├── ICameraController.ts
│   │       │   ├── ILayerRenderer.ts
│   │       │   ├── IFeatureRenderer.ts
│   │       │   ├── ICommandHandler.ts
│   │       │   ├── IStateStore.ts
│   │       │   ├── ITileProvider.ts
│   │       │   ├── ISearchProvider.ts
│   │       │   ├── IKnowledgeProvider.ts
│   │       │   ├── IGeocodingProvider.ts
│   │       │   ├── IAuthProvider.ts
│   │       │   ├── IStorageAdapter.ts
│   │       │   │   ├── LocalFSStorageAdapter.ts
│   │       │   │   ├── CloudStorageAdapter.ts
│   │       │   │   └── ExternalFSStorageAdapter.ts
│   │       │   └── IEventSink.ts
│   │       └── validation/
│   │           ├── CommandValidator.ts
│   │           ├── FeatureValidator.ts
│   │           ├── GeometryValidator.ts
│   │           ├── KmlValidator.ts
│   │           └── StyleValidator.ts
│   │
│   ├── server/                     # Next.js API 路由 + 后端
│   │   └── src/
│   │       ├── app/
│   │       │   └── api/
│   │       │       ├── features/
│   │       │       │   ├── route.ts            # GET（列表）, POST（创建）
│   │       │       │   └── [featureId]/
│   │       │       │       └── route.ts        # GET, PUT, DELETE
│   │       │       ├── documents/
│   │       │       │   ├── route.ts            # GET（列表）, POST（创建）
│   │       │       │   └── [documentId]/
│   │       │       │       ├── route.ts        # GET, PUT, DELETE
│   │       │       │       └── features/
│   │       │       │           └── route.ts    # 列出文档中的要素
│   │       │       ├── search/
│   │       │       │   └── route.ts            # GET（地理搜索）
│   │       │       ├── knowledge/
│   │       │       │   └── route.ts            # GET（知识卡片）
│   │       │       ├── layers/
│   │       │       │   └── route.ts            # GET（列出图层）
│   │       │       ├── tiles/
│   │       │       │   └── [...path]/
│   │       │       │       └── route.ts        # 瓦片服务代理
│   │       │       ├── earthmate/
│   │       │       │   └── route.ts            # POST（聊天）, GET（流式）
│   │       │       ├── design/
│   │       │       │   ├── solar/
│   │       │       │   │   └── route.ts        # POST（太阳能分析）
│   │       │       │   └── building/
│   │       │       │       └── route.ts        # POST（建筑设计）
│   │       │       ├── analysis/
│   │       │       │   └── [type]/
│   │       │       │       └── route.ts        # POST（坡度/坡向/挖填方...）
│   │       │       ├── streetview/
│   │       │       │   └── route.ts            # GET（全景元数据）
│   │       │       ├── elevation/
│   │       │       │   └── route.ts            # POST（批量高程查询）
│   │       │       ├── auth/
│   │       │       │   └── [...nextauth]/
│   │       │       │       └── route.ts        # NextAuth 处理器
│   │       │       ├── events/
│   │       │       │   └── route.ts            # POST（分析事件）
│   │       │       ├── config/
│   │       │       │   └── route.ts            # GET（客户端配置 + 功能开关）
│   │       │       ├── kml/
│   │       │       │   ├── import/
│   │       │       │   │   └── route.ts        # POST（KML 导入）
│   │       │       │   └── export/
│   │       │       │       └── route.ts        # GET（KML 导出）
│   │       │       └── images/
│   │       │           └── route.ts            # POST（AI 图像生成）
│   │       ├── services/
│   │       │   ├── db/
│   │       │   │   ├── index.ts                # Drizzle ORM 客户端
│   │       │   │   ├── schema.ts               # 所有表定义
│   │       │   │   └── migrations/
│   │       │   ├── FeatureRepository.ts
│   │       │   ├── DocumentRepository.ts
│   │       │   ├── SearchRepository.ts
│   │       │   ├── KnowledgeRepository.ts
│   │       │   ├── TileCacheService.ts
│   │       │   ├── GeocodingProvider.ts        # Nominatim / Mapbox 适配器
│   │       │   ├── EarthMateProvider.ts        # OpenAI / Claude 适配器
│   │       │   ├── SolarAnalysisService.ts     # PVLib 封装
│   │       │   ├── TerrainAnalysisService.ts   # GDAL 封装
│   │       │   ├── ElevationService.ts
│   │       │   ├── KmlImportService.ts
│   │       │   └── ConfigService.ts
│   │       └── middleware/
│   │           ├── auth.ts                     # NextAuth 中间件
│   │           ├── rateLimit.ts
│   │           ├── cors.ts
│   │           ├── validation.ts               # Proto 模式验证
│   │           └── logging.ts
│   │
│   ├── engine/                     # Three.js 渲染引擎
│   │   └── src/
│   │       ├── Globe.ts                        # 地球控制器
│   │       ├── EarthCamera.ts                  # 相机（LookAt/LookFrom）
│   │       ├── MapStyleController.ts           # 地图样式 → 渲染器状态
│   │       ├── CoordinateSystems.ts            # WGS84, 墨卡托, S2 转换
│   │       ├── Layers/
│   │       │   ├── Layer.ts                    # 抽象基类
│   │       │   ├── SatelliteLayerRenderer.ts
│   │       │   ├── RoadmapLayerRenderer.ts
│   │       │   ├── TerrainLayerRenderer.ts
│   │       │   ├── BuildingLayerRenderer.ts
│   │       │   ├── CloudLayerRenderer.ts
│   │       │   ├── PhotoLayerRenderer.ts
│   │       │   ├── GridlinesLayerRenderer.ts
│   │       │   ├── TimelapseLayerRenderer.ts
│   │       │   └── EarthDataLayerRenderer.ts
│   │       ├── Features/
│   │       │   ├── FeatureRenderer.ts          # 抽象基类
│   │       │   ├── PlacemarkRenderer.ts
│   │       │   ├── PolylineRenderer.ts
│   │       │   ├── PolygonRenderer.ts
│   │       │   ├── Model3DRenderer.ts           # GLTF/GLB 模型
│   │       │   ├── GroundOverlayRenderer.ts
│   │       │   ├── ScreenOverlayRenderer.ts
│   │       │   ├── LabelRenderer.ts             # 地球上的文本标签
│   │       │   └── BalloonRenderer.ts           # 信息窗口/弹出框
│   │       ├── Materials/
│   │       │   ├── EarthMaterial.ts             # 地球表面着色器
│   │       │   ├── AtmosphereMaterial.ts        # 大气散射
│   │       │   ├── WaterMaterial.ts             # 海洋表面
│   │       │   ├── CloudMaterial.ts             # 云层着色器
│   │       │   ├── BuildingMaterial.ts
│   │       │   ├── TerrainMaterial.ts
│   │       │   ├── PolylineMaterial.ts
│   │       │   ├── PolygonMaterial.ts
│   │       │   └── GridlineMaterial.ts
│   │       ├── TileSystem/
│   │       │   ├── TileManager.ts              # 瓦片加载/缓存/LOD
│   │       │   ├── TileCoord.ts                # x/y/zoom
│   │       │   ├── VectorTileDecoder.ts
│   │       │   ├── RasterTileProvider.ts
│   │       │   ├── ElevationTileProvider.ts
│   │       │   └── TileCache.ts                # LRU 内存缓存
│   │       ├── Effects/
│   │       │   ├── Atmosphere.ts               # 天空、太阳、星星
│   │       │   ├── PostProcessing.ts           # 泛光、色调映射
│   │       │   └── WaterReflection.ts
│   │       └── Utils/
│   │           ├── GeoMath.ts                  # 大圆距离，S2 转换
│   │           ├── Interpolation.ts            # 相机插值（slerp, lerp）
│   │           ├── Raycasting.ts               # 地球拾取/相交
│   │           └── Constants.ts                # WGS84 半径，EPSG 代码
│   │
│   └── client/                     # Next.js 前端页面
│       └── src/
│           ├── app/
│           │   ├── layout.tsx                  # 根布局（providers, 主题）
│           │   ├── page.tsx                    # 主地球页面
│           │   ├── project/
│           │   │   └── [projectId]/
│           │   │       └── page.tsx            # 项目视图
│           │   ├── design/
│           │   │   └── [designId]/
│           │   │       └── page.tsx            # 设计视图
│           │   └── api/                        # 客户端 API 封装
│           ├── components/
│           │   ├── EarthCanvas.tsx             # React Three Fiber 画布
│           │   ├── CommandBar.tsx              # 搜索/命令输入
│           │   ├── SearchPanel.tsx             # 搜索结果面板
│           │   ├── KnowledgeCard.tsx           # 地点信息卡片
│           │   ├── LayerPanel.tsx              # 图层切换侧边栏
│           │   ├── MapStyleSwitcher.tsx        # 影像/投影控制
│           │   ├── FeatureEditor.tsx           # 属性编辑器面板
│           │   ├── FeatureList.tsx             # 文档要素树
│           │   ├── StyleEditor/
│           │   │   ├── PointStyleEditor.tsx
│           │   │   ├── PolylineStyleEditor.tsx
│           │   │   ├── PolygonStyleEditor.tsx
│           │   │   ├── BalloonStyleEditor.tsx
│           │   │   └── LabelStyleEditor.tsx
│           │   ├── DrawingTools.tsx            # 折线/多边形绘制
│           │   ├── MeasureTool.tsx             # 距离/面积测量
│           │   ├── TimeMachineSlider.tsx       # 历史影像滑动条
│           │   ├── TimelapseControls.tsx       # 延时播放
│           │   ├── StreetViewPanel.tsx         # 街景嵌入
│           │   ├── EarthMatePanel.tsx          # AI 聊天面板
│           │   ├── ImageGenerator.tsx          # AI 图像生成
│           │   ├── DesignViewer.tsx            # 设计结果查看器
│           │   ├── AnalysisPanel.tsx           # 坡度/坡向/等高线可视化
│           │   ├── NavigationControls.tsx      # 缩放/平移/倾斜控制
│           │   ├── ViewStatus.tsx              # 相机坐标显示
│           │   ├── HomescreenOverlay.tsx       # 欢迎屏幕
│           │   ├── PinnedProjects.tsx          # 置顶项目叠加层
│           │   ├── PromotionBanner.tsx         # 升级/计费横幅
│           │   ├── ShortcutsHelp.tsx           # 键盘快捷键
│           │   ├── OnboardingFlow.tsx          # 首次用户引导
│           │   └── common/
│           │       ├── Button.tsx
│           │       ├── IconPicker.tsx
│           │       ├── ColorPicker.tsx
│           │       ├── Modal.tsx
│           │       ├── Toast.tsx
│           │       ├── Tooltip.tsx
│           │       └── VeTracker.tsx           # 视觉元素事件追踪器
│           ├── stores/                         # MobX 存储（共 60+ 个）
│           │   ├── SearchStore.ts
│           │   ├── KnowledgeCardStore.ts
│           │   ├── LayerStore.ts
│           │   ├── CameraStore.ts
│           │   ├── MapStyleStore.ts
│           │   ├── DocumentStore.ts
│           │   ├── FeatureStore.ts
│           │   ├── DrawingToolStore.ts
│           │   ├── MeasureToolStore.ts
│           │   ├── TimeMachineStore.ts
│           │   ├── TimelapseStore.ts
│           │   ├── StreetViewStore.ts
│           │   ├── EarthMateStore.ts
│           │   ├── DesignStore.ts
│           │   ├── DesignInputStore.ts
│           │   ├── AnalysisStore.ts
│           │   ├── OnboardingStore.ts
│           │   ├── HomescreenStore.ts
│           │   ├── NavigationStore.ts
│           │   ├── PinnedProjectsStore.ts
│           │   ├── BalloonStore.ts
│           │   ├── CardDockStore.ts
│           │   ├── BottomSheetStore.ts
│           │   ├── PropertyEditorStore.ts
│           │   ├── InspectorStore.ts
│           │   ├── LeftPanelStore.ts
│           │   ├── TopToolbarStore.ts
│           │   ├── MainToolbarStore.ts
│           │   ├── MenuBarStore.ts
│           │   ├── ShortcutsStore.ts
│           │   ├── IndustrySelectorStore.ts
│           │   ├── FeedbackStore.ts
│           │   ├── UserErrorsStore.ts
│           │   ├── CollapsedWidgetsStore.ts
│           │   ├── BackNavigationStore.ts
│           │   ├── PickingStore.ts
│           │   ├── MyLocationStore.ts
│           │   ├── SiteSelectionStore.ts
│           │   ├── GcpProjectBillingStore.ts
│           │   ├── AppThemeStore.ts
│           │   ├── AppRootStore.ts
│           │   ├── DeeplinkStore.ts
│           │   ├── DocumentManagerStore.ts
│           │   ├── EarthRenderStore.ts
│           │   └── ViewStatusStore.ts
│           └── hooks/
│               ├── useGlobe.ts                 # 地球实例 hook
│               ├── useCamera.ts                # 相机状态 hook
│               ├── useCommand.ts               # 命令调度 hook
│               ├── useFeature.ts               # 要素 CRUD hook
│               ├── useLayer.ts                 # 图层切换 hook
│               ├── useMapStyle.ts              # 地图样式 hook
│               ├── useSearch.ts                # 地理搜索 hook
│               ├── useKnowledgeCard.ts         # 知识卡片 hook
│               ├── useKml.ts                   # KML 导入/导出
│               ├── useStreetView.ts
│               ├── useTimeMachine.ts
│               ├── useTimelapse.ts
│               ├── useDrawingTool.ts
│               ├── useMeasureTool.ts
│               ├── useEarthMate.ts
│               ├── useDesign.ts
│               ├── useAnalysis.ts
│               ├── useDeepLink.ts
│               ├── useFeatureFlag.ts
│               └── useEventLogger.ts
│
├── turbo.json                        # Turborepo 配置
├── package.json                      # 根工作区 package.json
├── pnpm-workspace.yaml               # pnpm 工作区配置
├── tsconfig.base.json                # 基础 TypeScript 配置
└── docker-compose.yml                # 开发服务（PG, Redis）
```

---

## OOP 架构：核心类层次结构

### 命令系统

```
Command (abstract)
├── FlyToCameraCommand
│   ├── camera: LookAtCamera | LookFromCamera
│   ├── animation: CameraAnimation (TELEPORT | FLY)
│   ├── presentation: CameraPresentationMode
│   ├── panorama?: Panorama
│   └── disableClamping?: boolean
├── PerformSearchCommand
│   ├── query: string
│   ├── viewport?: LatLonBox
│   ├── resultGroupId?: string
│   └── suppressFlyToResults?: boolean
├── OpenKnowledgeCardCommand
│   ├── placeId: { fid: string } | { mid: string }
│   ├── metadata?: PlaceMetadata
│   ├── cardSize: CardSize
│   └── flyToImmediately?: boolean
├── CreateFeatureCommand
│   ├── featureProperties: FeatureProperties
│   ├── featureStyle?: FeatureStyle
│   ├── documentKey?: number
│   └── overheadImageryProperties?: OverheadImageryProperties
├── DeleteFeatureCommand
│   ├── documentKey: number
│   └── featureId: string
├── EditFeatureCommand
│   ├── documentKey: number
│   ├── featureId: string
│   ├── featureProperties?: FeatureProperties
│   └── featureStyle?: FeatureStyle
├── ToggleLayerCommand
│   ├── layerType: LayerType
│   └── enabled: boolean
├── SetBasemapStyleCommand
│   └── imagery: MapStyleImagery
├── CreatePointPlacemarkCommand
│   ├── latLngAlt: LatLngAlt
│   └── altitudeMode: AltitudeMode
├── EnterStreetViewCommand
│   └── latLngAlt: LatLngAlt
├── EnterTimeMachineCommand
│   ├── date?: string
│   ├── expanded?: boolean
│   ├── timelapseEnabled?: boolean
│   └── timelapseFramerateMultiplier?: number
├── EnterTimelapseCommand
│   ├── enabled?: boolean
│   ├── expanded?: boolean
│   ├── framerateMultiplier?: number
│   └── pausedAtYear?: number
├── OpenKmlDocumentCommand
│   └── uri: string
├── OpenKmlDocumentFromContentCommand
│   └── content: Uint8Array
├── OpenCloudProjectCommand
│   ├── projectId: string
│   ├── documentNamespace: DocumentNamespace
│   ├── flyToAfterLoad?: boolean
│   └── resourceKey?: string
├── CreateCloudProjectCommand
│   └── folderId?: string
├── OpenProjectByKeyCommand
│   ├── documentKey: number
│   └── flyToAfterLoad?: boolean
├── CreateFeaturesInFolderCommand
│   ├── commands: Command[]
│   ├── documentKey?: number
│   └── folderName: string
├── SetHomescreenVisibilityCommand
│   └── isOpen: boolean
├── ToggleAvailableLayersUiCommand
│   └── openDataCatalog: boolean
├── PreviewDataLayerCommand
│   └── earthDataLayerIdentifier: string
├── ViewDesignCommand
│   ├── selectedDesignId?: string
│   ├── isDesignDetailsOpen?: boolean
│   └── isDesignViewerOpen?: boolean
├── CreateDesignsCommand
│   └── designInputMode: DesignInputMode
├── ViewRateCardCommand
│   └── openRateCard: boolean
├── OpenEarthMateChatCommand
│   ├── isOpen: boolean
│   └── initialQuery?: string
├── ShowLayerCardDetailsCommand
│   └── earthDataLayerIdentifier: string
├── ViewOnDemandAnalysisCommand
│   └── analysis: SlopeAnalysis | AspectAnalysis | CutFillAnalysis | ContourAnalysis
├── OpenImageGeneratorCommand
│   └── initialQuery?: string
├── ClearSearchHistoryCommand
├── OpenSearchHistoryCommand
└── OpenFeelingLuckyCardCommand
```

### 要素系统

```
Feature (abstract)
├── id: string (UUID)
├── name?: string
├── description?: string
├── visibility: boolean
├── featureOrigin: FeatureOrigin (USER | GEMINI_AI)
├── style?: FeatureStyle
├── schema?: DocumentSchema
├── altitudeMode: AltitudeMode (ABSOLUTE | CLAMP_TO_GROUND | CLAMP_TO_SEA_FLOOR | RELATIVE_TO_GROUND | RELATIVE_TO_SEA_FLOOR | RELATIVE_TO_SURFACE_MODEL)
├── media: Media[]
└── restrictions: FeatureRestrictions
│
├── Folder
│   └── features: Feature[]
│
├── Placemark
│   ├── geometry: Geometry (Point | MultiGeometry)
│   ├── camera?: LookAtCamera
│   ├── address?: string
│   ├── phoneNumber?: string
│   └── snippet?: string
│   │
│   └── PointPlacemark
│       ├── lat: number
│       ├── lng: number
│       └── alt?: number
│
├── Polyline
│   ├── coordinates: LatLngAlt[]
│   ├── tessellate?: boolean
│   └── extrude?: boolean
│
├── Polygon
│   ├── outerBoundary: LatLngAlt[]
│   ├── innerBoundaries: LatLngAlt[][]
│   ├── extrude?: boolean
│   └── tessellate?: boolean
│
├── MultiGeometry
│   └── geometries: Geometry[]
│
├── GroundOverlay
│   ├── imageUrl: string
│   ├── latLonBox: LatLonBox
│   ├── rotation?: number
│   └── color?: Color
│
├── ScreenOverlay
│   ├── imageUrl: string
│   ├── overlayXY: { x: number, y: number, xunits: Unit, yunits: Unit }
│   ├── screenXY: { x: number, y: number, xunits: Unit, yunits: Unit }
│   ├── size: { x: number, y: number, xunits: Unit, yunits: Unit }
│   └── rotation?: number
│
├── PhotoOverlay
│   ├── imageUrl: string
│   ├── camera: LookAtCamera
│   ├── shape: PhotoOverlayShape (RECTANGLE | SPHERE | CYLINDER)
│   ├── leftFov?: number
│   ├── rightFov?: number
│   ├── bottomFov?: number
│   └── topFov?: number
│
├── Model3D
│   ├── asset: ThreeDAsset
│   ├── location: LatLngAlt
│   ├── orientation: Orientation
│   ├── scale: Scale
│   └── boundingBox?: BoundingBox
│
├── NetworkLink
│   ├── url: string
│   ├── refreshMode: NetworkLinkRefreshMode (ON_CHANGE | ON_INTERVAL | ON_EXPIRE)
│   ├── refreshInterval?: number
│   ├── flyToView?: boolean
│   └── linkType: NetworkLinkType
│
├── TrackSet
│   └── tracks: Track[]
│       ├── coordinates: LatLngAlt[]
│       └── timestamps: number[]
│
├── Tour
│   └── playlist: TourPrimitive[]
│       ├── FlyTo: LookAtCamera
│       ├── Wait: duration
│       ├── AnimatedUpdate: FeatureProperties
│       └── SoundCue: audioUrl
│
└── SubDocument
    └── documentRef: string
```

### 图层系统

```
Layer (abstract)
├── id: string
├── name: string
├── visible: boolean
├── opacity: number (0-1)
├── zIndex: number
├── mapStyle: MapStyle
├── render(globe: Globe): void
├── dispose(): void
└── setVisible(visible: boolean): void
│
├── SatelliteLayer
│   ├── tileProvider: RasterTileProvider
│   ├── tileSize: number (256 | 512)
│   └── maxZoom: number (1-22)
│
├── RoadmapLayer
│   ├── tileProvider: VectorTileProvider
│   ├── labelLanguage: string
│   └── showLabels: boolean
│
├── TerrainLayer
│   ├── elevationProvider: ElevationTileProvider
│   ├── exaggeration: number
│   └── quality: TerrainQuality (LOW | MEDIUM | HIGH)
│
├── BuildingLayer
│   ├── buildings3DTiles: THREE.Group
│   ├── extrusionHeight: number
│   └── colorScheme: BuildingColorScheme
│
├── CloudLayer
│   ├── animated: boolean
│   ├── opacity: number
│   └── cloudTexture: THREE.Texture
│
├── PhotoLayer
│   ├── photoMarkers: THREE.Group
│   └── clusterMode: boolean
│
├── GridlinesLayer
│   ├── mode: GridlinesMode (NONE | LAT_LON)
│   ├── color: Color
│   └── spacing: number (度)
│
├── TimelapseLayer
│   ├── currentYear: number
│   ├── years: number[]
│   ├── playbackSpeed: number
│   └── tileProvider: RasterTileProvider
│
├── ThreeDCoverageLayer
│   └── coveragePolygons: Polygon[]
│
├── UpdatedImageryLayer
│   └── updateOverlays: GroundOverlay[]
│
├── LandParcelsLayer
│   └── parcelPolygons: Polygon[]
│
├── PinnedProjectsLayer
│   └── projectMarkers: THREE.Group
│
└── DiscoveryLayer (Voyager/EarthFeed)
    ├── feedItems: EarthFeedItem[]
    └── displayMode: DiscoveryDisplayMode
```

### 相机系统

```
Camera (abstract)
├── location: Location
├── rotation: Rotation
├── fovY: number
├── screenSize: Size
└── getState(): CameraState

LookAtCamera
├── lat: number
├── lng: number
├── alt: number
├── range: number
├── heading: number
├── tilt: number
├── roll: number
├── fovy: number
└── streetViewOptions?: StreetViewOptions

LookFromCamera
├── lat: number
├── lng: number
├── alt: number
├── heading: number
├── tilt: number
├── roll: number
└── fovy: number

CameraAnimation (enum)
├── TELEPORT       # 瞬间跳转到指定位置
└── FLY            # 平滑插值

CameraPresentationMode (enum)
├── STATIC         # 相机停留在目的地
├── POI_ORBIT      # 围绕目标 POI 旋转
├── PLANET_ORBIT   # 全行星旋转视图
└── CINEMATIC      # 带缓动的戏剧性飞入

Panorama
├── panoId: string
├── frontEnd: PanoFrontEnd (ALLEYCAT | FIFE | FIFE_MEDIA_KEY | LOCAL)
├── registration?: { heading: number, pitch: number }
└── links?: PanoramaLink[]
```

### 地图样式系统

```
MapStyle
├── projection: Projection (GLOBE | MERCATOR)
├── imagery: Imagery (SATELLITE | ROADMAP | TERRAIN)
├── threeDFeatures: ThreeDFeatures (ALL | TERRAIN_ONLY | NONE)
├── showClouds: boolean
├── useAnimatedClouds: boolean
├── gridlinesLayer: GridlinesLayer (NONE | LAT_LON)
├── baseLayers: BaseLayers
│   ├── preset: Preset (CUSTOM | CLEAN | EXPLORATION | EVERYTHING)
│   └── customFeatureCategory: number[]
├── showThreeDCoverageLayer: boolean
├── showUpdatedImageryLayer: boolean
├── showLandParcelsLayer: boolean
├── showPinnedProjectsLayer: boolean
├── showDiscoveryLayer: boolean
├── toProto(): MapStyleProto
└── static fromProto(proto: MapStyleProto): MapStyle
```

### 文档系统

```
Document
├── id: string (UUID)
├── namespace: DocumentNamespace (EARTH | MY_MAPS)
├── metadata: DocumentMetadata
│   ├── title: string
│   ├── description: string
│   ├── snippet: string
│   ├── thumbnail?: string
│   ├── heroImage?: string
│   ├── sharingVisibility: SharingVisibility
│   ├── lastModified: Date
│   ├── lastAccessed: Date
│   ├── isPinned: boolean
│   ├── isFocused: boolean
│   ├── role: Role (OWNER | EDITOR | VIEWER)
│   ├── capabilities: Capability[]
│   ├── storageIcon: StorageIcon
│   └── ioState: IoState
├── properties: DocumentProperties
│   ├── schema: DocumentSchema
│   │   ├── columns: Column[]
│   │   └── templateAliases: Map<string, string>
│   └── featureTree: FeatureTree
├── contents: DocumentContents
│   ├── features: Feature[]
│   ├── styleOptions: ContentStyleOptions
│   └── mapType: MapType
├── mutations: DataMutationSet[]
├── save(): Promise<void>
├── load(): Promise<void>
├── exportKml(): string
├── importKml(kml: string): void
└── close(): void
```

---

## Proto 到 TypeScript 管线

### 问题

1,316 个 `.proto` 文件无法直接用标准 `protoc` 编译，因为它们依赖 Google 内部导入：

| 内部导入 | 被引用文件数 | 解决方案 |
|---|---|---|
| `storage/datapol/annotations/proto/semantic_annotations.proto` | 890 个文件 | 创建包含 `sem_type` 扩展的最小化桩 |
| `net/proto2/proto/descriptor.proto` | 272 个文件 | 重新导出 `google/protobuf/descriptor.proto` |
| `net/proto2/bridge/proto/message_set.proto` | 33 个文件 | 将 MessageSet 扩展转换为 oneof |
| `java/com/google/apps/jspb/jspb.proto` | 208 个文件 | 移除 — JS 注解在 TypeScript 中不需要 |
| `wireless/android/privacy/...` | ~60 个文件 | 移除 — Android 专用 |
| `protomerger/annotations.proto` | 数个 | 移除 — 仅构建系统使用 |

### 实施

```bash
# 第 1 步：创建 third_party/ 桩
mkdir -p packages/proto/src/third_party/google/storage/datapol/annotations/proto/
mkdir -p packages/proto/src/third_party/google/net/proto2/proto/
mkdir -p packages/proto/src/third_party/google/net/proto2/bridge/proto/
mkdir -p packages/proto/src/third_party/google/knowledge/graph/protomesh/

# 第 2 步：移除内部导入（自动化）
find geo/ maps/ geostore/ logs/ google/ -name "*.proto" \
  -exec sed -i \
    -e 's|import "net/proto2/proto/descriptor.proto"|import "google/protobuf/descriptor.proto"|g' \
    -e '/import.*jspb\.proto/d' \
    -e '/option.*jspb/d' \
    -e '/import.*collection_basis_annotations/d' \
    {} +

# 第 3 步：将 MessageSet 转换为 oneof（Python 脚本）
# packages/proto/scripts/convert_messageset.py
# 解析每个包含 MessageSet 的 proto，找到所有 extend 块，
# 生成一个替换扩展的 oneof。

# 第 4 步：使用 buf 进行两遍编译
# packages/proto/buf.gen.yaml
```

```yaml
# packages/proto/buf.gen.yaml
version: v2
plugins:
  - plugin: protobuf-ts
    out: src/gen
    opt:
      - generate_dependencies
      - long_type_string
      - ts_nocheck
      - client_none
      - server_none
```

### 适配器层

每个生成的 proto 类型都有一个适配器，用于在 proto 模型和领域模型之间进行转换：

```typescript
// packages/proto/src/adapters/CommandAdapter.ts
import { Command as ProtoCommand } from '../gen/commands';
import { Command } from '@earthstudio/core/models/commands/Command';
import { FlyToCameraCommand } from '@earthstudio/core/models/commands/FlyToCamera';
// ... 所有命令导入

export class CommandAdapter {
  static fromProto(proto: ProtoCommand): Command {
    const { commandType } = proto;
    if (!commandType) throw new Error('Command has no command_type');

    switch (commandType.oneofKind) {
      case 'flyToCamera': {
        const fc = commandType.flyToCamera;
        return new FlyToCameraCommand({
          camera: fc.cameraType.oneofKind === 'lookAt'
            ? LookAtCamera.fromProto(fc.cameraType.lookAt)
            : LookFromCamera.fromProto(fc.cameraType.lookFrom),
          animation: CameraAnimation.fromProto(fc.cameraAnimation),
          presentation: CameraPresentationMode.fromProto(fc.cameraPresentationMode),
          panorama: fc.panorama ? Panorama.fromProto(fc.panorama) : undefined,
          disableClamping: fc.disableClamping,
        });
      }
      case 'performSearch': {
        const ps = commandType.performSearch;
        return new PerformSearchCommand({
          query: ps.query ?? '',
          viewport: ps.viewport ? LatLonBox.fromProto(ps.viewport) : undefined,
          resultGroupId: ps.resultGroupId,
          suppressFlyToResults: ps.suppressFlyToResults,
        });
      }
      case 'createFeature': {
        const cf = commandType.createFeature;
        return new CreateFeatureCommand({
          featureProperties: cf.featureProperties
            ? FeatureProperties.fromProto(cf.featureProperties)
            : undefined,
          featureStyle: cf.featureStyle
            ? FeatureStyle.fromProto(cf.featureStyle)
            : undefined,
          documentKey: cf.documentKey,
        });
      }
      // ... 其余 31 个 case
      default:
        throw new Error(`Unknown command type: ${commandType.oneofKind}`);
    }
  }

  static toProto(cmd: Command): ProtoCommand {
    return cmd.toProto();
  }
}
```

---

## 数据库模式

### PostgreSQL + PostGIS + Drizzle ORM

```typescript
// packages/server/src/services/db/schema.ts
import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  doublePrecision,
  timestamp,
  jsonb,
  bigint,
  pgEnum,
  index,
  uniqueIndex,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { geometry } from './extensions/postgis';

// ─── 枚举 ───────────────────────────────────────────────────────

export const featureTypeEnum = pgEnum('feature_type_enum', [
  'FOLDER',
  'PLACEMARK',
  'POLYLINE',
  'POLYGON',
  'MULTI_GEOMETRY',
  'GROUND_OVERLAY',
  'SCREEN_OVERLAY',
  'PHOTO_OVERLAY',
  'MODEL_3D',
  'NETWORK_LINK',
  'TRACK_SET',
  'TOUR',
  'SUB_DOCUMENT',
  'MAP_TILE_PYRAMID',
]);

export const altitudeModeEnum = pgEnum('altitude_mode_enum', [
  'ABSOLUTE',
  'CLAMP_TO_GROUND',
  'CLAMP_TO_SEA_FLOOR',
  'RELATIVE_TO_GROUND',
  'RELATIVE_TO_SEA_FLOOR',
  'RELATIVE_TO_SURFACE_MODEL',
]);

export const documentNamespaceEnum = pgEnum('document_namespace_enum', [
  'EARTH',
  'MY_MAPS',
]);

export const mapTypeEnum = pgEnum('map_type_enum', [
  'EARTH',
  'MY_MAPS',
]);

export const projectRoleEnum = pgEnum('project_role_enum', [
  'OWNER',
  'EDITOR',
  'VIEWER',
]);

export const ioOperationEnum = pgEnum('io_operation_enum', [
  'LOAD',
  'CREATE',
  'COPY',
  'REMOVE',
  'MUTATE',
  'RELOAD',
  'EXPORT',
]);

export const queueStateEnum = pgEnum('queue_state_enum', [
  'IDLE',
  'AWAITING',
  'PAUSED',
  'DISCARDING',
  'RETRYING',
  'COMPLETE',
]);

export const featureOriginEnum = pgEnum('feature_origin_enum', [
  'USER',
  'GEMINI_AI',
  'IMPORTED',
]);

// ─── 用户 ───────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: text('id').primaryKey(),                          // OAuth 主体 ID
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  industry: text('industry'),                           // 来自 proto 的 62 种行业类型
  useCase: text('use_case'),                            // 来自 proto 的 78 种 MAP 用例
  geographicScale: text('geographic_scale'),             // 6 种地理尺度
  plan: text('plan').default('FREE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ─── 文档 ──────────────────────────────────────────────────

export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  namespace: documentNamespaceEnum('namespace').default('EARTH').notNull(),
  mapType: mapTypeEnum('map_type').default('EARTH').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  snippet: text('snippet'),
  thumbnail: text('thumbnail'),
  heroImage: text('hero_image'),
  sharingVisibility: text('sharing_visibility').default('PRIVATE'),
  ownerId: text('owner_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  isPublic: boolean('is_public').default(false),
  isPinned: boolean('is_pinned').default(false),
  isArchived: boolean('is_archived').default(false),
  resourceKey: text('resource_key'),
  documentKey: integer('document_key').unique(),
  consumedQuotaBytes: bigint('consumed_quota_bytes', { mode: 'number' }).default(0),
  metadata: jsonb('metadata').$type<DocumentMetadata>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }).defaultNow(),
  lastFocusedAt: timestamp('last_focused_at', { withTimezone: true }).defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }), // 软删除
},
(table) => [
  index('idx_documents_owner').on(table.ownerId),
  index('idx_documents_namespace').on(table.namespace),
  index('idx_documents_updated').on(table.updatedAt),
]);

// ─── 文档协作者 ─────────────────────────────────────────────────────

export const documentCollaborators = pgTable('document_collaborators', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id')
    .references(() => documents.id, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  role: projectRoleEnum('role').default('VIEWER').notNull(),
  invitedAt: timestamp('invited_at', { withTimezone: true }).defaultNow(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
},
(table) => [
  uniqueIndex('idx_collab_doc_user').on(table.documentId, table.userId),
]);

// ─── 要素 ───────────────────────────────────────────────────

export const features = pgTable('features', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id')
    .references(() => documents.id, { onDelete: 'cascade' })
    .notNull(),
  parentId: uuid('parent_id'),                          // 自引用，用于树结构
  featureType: featureTypeEnum('feature_type').notNull(),
  name: text('name'),
  description: text('description'),
  snippet: text('snippet'),
  visibility: boolean('visibility').default(true),
  isOpen: boolean('is_open').default(true),              // 文件夹展开状态
  featureOrigin: featureOriginEnum('feature_origin').default('USER'),
  sortIndex: integer('sort_index').default(0),

  // 几何（PostGIS）
  geom: geometry('geom', 4326),                         // Point/Polyline/Polygon/Multi

  // 海拔
  altitudeMode: altitudeModeEnum('altitude_mode').default('CLAMP_TO_GROUND'),
  altitude: doublePrecision('altitude'),

  // 相机（用于带相机设置的 Placemark）
  cameraType: text('camera_type'),                       // 'look_at' | 'look_from'
  cameraLat: doublePrecision('camera_lat'),
  cameraLng: doublePrecision('camera_lng'),
  cameraAlt: doublePrecision('camera_alt'),
  cameraRange: doublePrecision('camera_range'),
  cameraHeading: doublePrecision('camera_heading'),
  cameraTilt: doublePrecision('camera_tilt'),
  cameraRoll: doublePrecision('camera_roll'),
  cameraFovy: doublePrecision('camera_fovy'),

  // 地址（用于 Placemark）
  address: text('address'),
  phoneNumber: text('phone_number'),

  // 样式（JSON blob 用于完整 ContentStyle proto 序列化）
  styleData: jsonb('style_data').$type<SerializedFeatureStyle>(),

  // 3D 模型
  modelAssetId: uuid('model_asset_id'),                  // 外键 → assets
  modelScaleX: doublePrecision('model_scale_x').default(1),
  modelScaleY: doublePrecision('model_scale_y').default(1),
  modelScaleZ: doublePrecision('model_scale_z').default(1),
  modelHeading: doublePrecision('model_heading').default(0),
  modelTilt: doublePrecision('model_tilt').default(0),
  modelRoll: doublePrecision('model_roll').default(0),

  // 地面叠加层
  overlayImageUrl: text('overlay_image_url'),
  overlayNorth: doublePrecision('overlay_north'),
  overlaySouth: doublePrecision('overlay_south'),
  overlayEast: doublePrecision('overlay_east'),
  overlayWest: doublePrecision('overlay_west'),
  overlayRotation: doublePrecision('overlay_rotation').default(0),

  // 网络链接
  networkLinkUrl: text('network_link_url'),
  networkLinkRefreshMode: text('network_link_refresh_mode'),
  networkLinkRefreshInterval: doublePrecision('network_link_refresh_interval'),

  // 地球数据图层（BigQuery 连接）
  earthDataLayerIdentifier: text('earth_data_layer_identifier'),
  earthDataLayerProperties: jsonb('earth_data_layer_properties'),

  // 分类
  classificationInputs: jsonb('classification_inputs'),

  // 要素级限制
  exportRestrictions: jsonb('export_restrictions'),
  editRestrictions: jsonb('edit_restrictions'),

  // S2 单元索引（来自 FeatureIdProto 的空间局部性）
  s2CellId: bigint('s2_cell_id', { mode: 'number' }),
  s2Fingerprint: bigint('s2_fingerprint', { mode: 'number' }),

  // 扩展属性（模式列）
  extendedProperties: jsonb('extended_properties').$type<Record<string, AttributeValue>>(),

  // 时间戳
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
},
(table) => [
  index('idx_features_document').on(table.documentId),
  index('idx_features_parent').on(table.parentId),
  index('idx_features_geom').using('GIST', table.geom),
  index('idx_features_s2').on(table.s2CellId),
  index('idx_features_type').on(table.featureType),
  index('idx_features_origin').on(table.featureOrigin),
  index('idx_features_name').on(table.name),
  index('idx_features_sorted').on(table.documentId, table.sortIndex),
]);

// ─── 要素媒体 ──────────────────────────────────────────────

export const featureMedia = pgTable('feature_media', {
  id: uuid('id').defaultRandom().primaryKey(),
  featureId: uuid('feature_id')
    .references(() => features.id, { onDelete: 'cascade' })
    .notNull(),
  mediaType: text('media_type').notNull(),               // 'IMAGE' | 'YOUTUBE' | 'HTML'
  title: text('title'),
  description: text('description'),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  width: integer('width'),
  height: integer('height'),
  duration: integer('duration'),                         // 秒（用于视频）
  mutationId: text('mutation_id'),                       // 用于乐观更新跟踪
  sortIndex: integer('sort_index').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
},
(table) => [
  index('idx_feature_media_feature').on(table.featureId),
]);

// ─── 文档模式 / 列 ──────────────────────────────────

export const documentColumns = pgTable('document_columns', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id')
    .references(() => documents.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  displayName: text('display_name'),
  columnType: text('column_type').notNull(),              // 'STRING' | 'INT' | 'DOUBLE' | 'BOOLEAN'
  templateAlias: text('template_alias'),                  // 用于气泡模板绑定
  defaultValue: text('default_value'),
  sortIndex: integer('sort_index').default(0),
},
(table) => [
  uniqueIndex('idx_columns_doc_name').on(table.documentId, table.name),
]);

// ─── 资产（3D 模型、自定义图标、图像）─────────────────────────

export const assets = pgTable('assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id')
    .references(() => documents.id, { onDelete: 'cascade' }),
  assetType: text('asset_type').notNull(),                // 'GLTF_MODEL' | 'GLB_MODEL' | 'CUSTOM_ICON' | 'IMAGE' | 'KML'
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
  storageUrl: text('storage_url').notNull(),              // S3/CDN URL
  thumbnailUrl: text('thumbnail_url'),
  metadata: jsonb('metadata'),                            // BoundingBox, dimensions 等
  uploadedBy: text('uploaded_by').references(() => users.id),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow(),
},
(table) => [
  index('idx_assets_document').on(table.documentId),
]);

// ─── 文档变更（用于冲突解决 / 历史记录）────

export const documentMutations = pgTable('document_mutations', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id')
    .references(() => documents.id, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  mutationType: text('mutation_type').notNull(),          // 来自 proto 的 13 种变更类型
  mutationData: jsonb('mutation_data').notNull(),         // 完整的变更载荷
  baseVersion: integer('base_version').notNull(),         // 用于乐观并发控制
  newVersion: integer('new_version').notNull(),
  sequenceNumber: integer('sequence_number').notNull(),
  appliedAt: timestamp('applied_at', { withTimezone: true }).defaultNow(),
},
(table) => [
  index('idx_mutations_document').on(table.documentId),
  index('idx_mutations_doc_seq').on(table.documentId, table.sequenceNumber),
  uniqueIndex('idx_mutations_doc_ver').on(table.documentId, table.newVersion),
]);

// ─── 搜索历史 ─────────────────────────────────────────────

export const searchHistory = pgTable('search_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  query: text('query').notNull(),
  resultCount: integer('result_count'),
  viewport: jsonb('viewport'),                            // LatLonBox
  selectedResultId: text('selected_result_id'),           // 被打开的 FID 或 MID
  searchedAt: timestamp('searched_at', { withTimezone: true }).defaultNow(),
},
(table) => [
  index('idx_search_history_user').on(table.userId, table.searchedAt.desc()),
]);

// ─── 云项目 ─────────────────────────────────────────────

export const cloudProjects = pgTable('cloud_projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  folderId: text('folder_id'),                            // Google Drive 文件夹
  documentId: uuid('document_id')
    .references(() => documents.id, { onDelete: 'cascade' }),
  projectKey: text('project_key').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
},
(table) => [
  index('idx_projects_user').on(table.userId),
]);

// ─── 置顶项目 ────────────────────────────────────────────

export const pinnedProjects = pgTable('pinned_projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  documentId: uuid('document_id')
    .references(() => documents.id, { onDelete: 'cascade' })
    .notNull(),
  pinnedAt: timestamp('pinned_at', { withTimezone: true }).defaultNow(),
},
(table) => [
  uniqueIndex('idx_pinned_user_doc').on(table.userId, table.documentId),
]);

// ─── 地球数据图层（BigQuery 连接）────────────────────────────────

export const earthDataLayers = pgTable('earth_data_layers', {
  id: uuid('id').defaultRandom().primaryKey(),
  identifier: text('identifier').notNull().unique(),      // 地球数据图层标识符
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'),
  sourceType: text('source_type'),                        // 'BIGQUERY' | 'CSV' | 'GEOJSON'
  sourceUrl: text('source_url'),
  colorRampId: text('color_ramp_id'),                     // 20+ 预定义色带
  styleRules: jsonb('style_rules'),                       // CategoricalStyleRuleSet 或 InterpolatedStyleRuleSet
  filters: jsonb('filters'),                              // EarthDataLayerAttributeFilters
  geometricFilter: jsonb('geometric_filter'),
  isGeminiGenerated: boolean('is_gemini_generated').default(false),
  geminiCnsPath: text('gemini_cns_path'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ─── 设计结果 ─────────────────────────────────────────────

export const designs = pgTable('designs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  documentId: uuid('document_id')
    .references(() => documents.id, { onDelete: 'cascade' }),
  designType: text('design_type').notNull(),               // 'NEW_BUILD' | 'SOLAR'
  name: text('name').notNull(),
  state: text('state').default('BEFORE'),                  // 'BEFORE' | 'IN_PROGRESS' | 'COMPLETE' | 'FAILED'
  geometry: geometry('geometry', 4326),                    // 场地多边形
  inputs: jsonb('inputs'),                                 // 完整设计输入
  results: jsonb('results'),                               // DesignMapResult
  metrics: jsonb('metrics'),                               // NewBuildToplineMetrics | SolarToplineMetrics
  thumbnail: text('thumbnail'),
  isSaved: boolean('is_saved').default(false),
  tags: jsonb('tags').$type<string[]>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
},
(table) => [
  index('idx_designs_user').on(table.userId),
  index('idx_designs_document').on(table.documentId),
]);

// ─── 按需分析 ─────────────────────────────────────────

export const analyses = pgTable('analyses', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' }),
  documentId: uuid('document_id')
    .references(() => documents.id, { onDelete: 'cascade' }),
  analysisType: text('analysis_type').notNull(),           // 'SLOPE' | 'ASPECT' | 'CUT_FILL' | 'CONTOUR' | 'CHANGE_DETECTION'
  geometry: geometry('geometry', 4326).notNull(),          // 分析区域
  parameters: jsonb('parameters'),
  results: jsonb('results'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ─── 分析事件（本地存储，同时发送到 ClickHouse）──────────

export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id'),
  sessionId: text('session_id').notNull(),
  eventType: text('event_type').notNull(),                 // 来自 89 种 Earth 事件类型
  eventValue: integer('event_value'),                      // 离散事件值
  commandType: text('command_type'),                       // 如果由命令触发
  properties: jsonb('properties'),                         // 事件特定子消息
  screenWidth: integer('screen_width'),
  screenHeight: integer('screen_height'),
  renderer: text('renderer'),                              // WebGL/WebGPU 信息
  fps: doublePrecision('fps'),
  memoryMb: doublePrecision('memory_mb'),
  loadTimeMs: doublePrecision('load_time_ms'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow(),
});

// ─── 视图 ──────────────────────────────────────────────────────

// S2 空间索引物化视图
export const createS2IndexView = sql`
  CREATE MATERIALIZED VIEW IF NOT EXISTS feature_s2_index AS
  SELECT
    id,
    document_id,
    feature_type,
    s2_cell_id,
    name,
    ST_AsGeoJSON(geom)::jsonb AS geojson
  FROM features
  WHERE s2_cell_id IS NOT NULL AND geom IS NOT NULL;
`;

// 每个文档的要素数量视图
export const createDocFeatureCountView = sql`
  CREATE VIEW document_feature_counts AS
  SELECT
    document_id,
    feature_type,
    COUNT(*) AS count
  FROM features
  WHERE deleted_at IS NULL
  GROUP BY document_id, feature_type;
`;
```

---

## API 端点

### 完整 REST API 规范

```typescript
// ─── 要素 API ────────────────────────────────────────────────

// GET    /api/features?documentId={id}&parentId={id}&bbox={w,s,e,n}&limit={n}
// ─── 带空间过滤的要素列表
interface ListFeaturesRequest {
  documentId: string;
  parentId?: string;          // 用于树导航
  bbox?: string;              // "west,south,east,north" 用于空间过滤
  featureType?: string;       // 按 FeatureType 过滤
  featureOrigin?: string;     // 按 FeatureOrigin 过滤
  limit?: number;             // 默认 100
  offset?: number;            // 默认 0
}

interface ListFeaturesResponse {
  features: Feature[];
  total: number;
  hasMore: boolean;
}

// POST   /api/features
// ─── 创建新要素
interface CreateFeatureRequest {
  documentId: string;
  parentId?: string;
  featureType: string;
  name?: string;
  description?: string;
  geometry?: GeoJSON;         // 用于折线/多边形/地标
  altitudeMode?: string;
  altitude?: number;
  styleData?: SerializedFeatureStyle;
  camera?: CameraSetup;       // 用于地标
}

interface CreateFeatureResponse {
  feature: Feature;
  mutation: DataMutation;
}

// GET    /api/features/:featureId
// ─── 获取单个要素
interface GetFeatureResponse {
  feature: Feature;
  children?: Feature[];       // 如果要素是文件夹，包含子项
  media?: Media[];
}

// PUT    /api/features/:featureId
// ─── 更新要素（可部分更新）
interface UpdateFeatureRequest {
  name?: string;
  description?: string;
  visibility?: boolean;
  geometry?: GeoJSON;
  altitudeMode?: string;
  altitude?: number;
  styleData?: SerializedFeatureStyle;
  camera?: CameraSetup;
  parentId?: string;
  sortIndex?: number;
}

interface UpdateFeatureResponse {
  feature: Feature;
  mutation: DataMutation;
}

// DELETE /api/features/:featureId
// ─── 删除要素（级联删除子项）
interface DeleteFeatureResponse {
  deletedFeatureId: string;
  deletedChildIds: string[];
  mutation: DataMutation;
}

// ─── 文档 API ───────────────────────────────────────────────

// GET    /api/documents?namespace={ns}&limit={n}
// ─── 列出用户的文档
interface ListDocumentsRequest {
  namespace?: string;         // EARTH | MY_MAPS
  isArchived?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;            // 'updatedAt' | 'title' | 'createdAt'
}

interface ListDocumentsResponse {
  documents: DocumentMetadata[];
  total: number;
}

// POST   /api/documents
// ─── 创建新文档
interface CreateDocumentRequest {
  namespace?: string;
  title: string;
  description?: string;
  mapType?: string;
  schema?: DocumentSchema;    // 可选的列定义
}

interface CreateDocumentResponse {
  document: Document;
}

// GET    /api/documents/:documentId
// ─── 获取包含完整内容的文档
interface GetDocumentResponse {
  document: Document;
  features: FeatureTree;
  styleOptions?: ContentStyleOptions;
}

// PUT    /api/documents/:documentId
// ─── 更新文档元数据或属性
interface UpdateDocumentRequest {
  title?: string;
  description?: string;
  sharingVisibility?: string;
  isPinned?: boolean;
  properties?: DocumentProperties;
}

interface UpdateDocumentResponse {
  document: Document;
  mutation: MetadataMutation;
}

// DELETE /api/documents/:documentId
// ─── 软删除文档
interface DeleteDocumentResponse {
  deleted: boolean;
  deletedAt: string;
}

// GET    /api/documents/:documentId/features
// ─── 获取文档的要素树
interface GetFeatureTreeResponse {
  featureTree: FeatureTree;
}

// POST   /api/documents/:documentId/mutations
// ─── 应用批量变更（用于协作编辑）
interface ApplyMutationsRequest {
  mutations: DataMutation[];
  baseVersion: number;        // 乐观并发控制
}

interface ApplyMutationsResponse {
  applied: boolean;
  newVersion: number;
  conflicts?: DataMutation[];  // 冲突的变更
}

// ─── 搜索 API ──────────────────────────────────────────────────

// GET    /api/search?q={query}&bbox={w,s,e,n}&lang={lang}&limit={n}
// ─── 带知识卡片结果的地理搜索
interface SearchRequest {
  q: string;                  // 搜索查询
  bbox?: string;              // 视口边界，用于位置偏好
  lang?: string;              // 语言偏好
  limit?: number;             // 默认 10
  resultGroupId?: string;     // 用于分页结果
}

interface SearchResponse {
  results: SearchResult[];
  totalResults: number;
  attribution: string;
}

interface SearchResult {
  placeId: string;            // FID 或 MID
  displayName: string;
  description: string;
  location: { lat: number; lng: number };
  bbox?: LatLonBox;
  category: string;
  thumbnailUrl?: string;
  openLocationCode?: string;
}

// ─── 知识卡片 API ──────────────────────────────────────────

// GET    /api/knowledge?fid={id}&mid={id}&lat={lat}&lng={lng}&query={q}
// ─── 获取丰富的地点信息
interface KnowledgeCardRequest {
  fid?: string;               // 要素 ID（geostore）
  mid?: string;               // 机器 ID（Knowledge Graph）
  lat?: number;
  lng?: number;
  query?: string;
}

interface KnowledgeCardResponse {
  entity: RenderableEntity;
  renderedHtml?: string;      // 预渲染的气泡 HTML
}

// ─── 图层 API ──────────────────────────────────────────────────

// GET    /api/layers
// ─── 列出可用的地图图层
interface ListLayersResponse {
  layers: LayerInfo[];
}

interface LayerInfo {
  layerType: string;
  name: string;
  description: string;
  enabled: boolean;
  available: boolean;
}

// GET    /api/layers/data?ident={identifier}
// ─── 获取地球数据图层详情
interface GetDataLayerResponse {
  layer: EarthDataLayer;
  features: Feature[];
}

// GET    /api/layers/data/:identifier/features?bbox={w,s,e,n}
// ─── 从数据图层获取视口内的要素
interface GetDataLayerFeaturesRequest {
  bbox?: string;
  limit?: number;
}

interface GetDataLayerFeaturesResponse {
  features: Feature[];
  hasMore: boolean;
}

// ─── 瓦片 API ───────────────────────────────────────────────────

// GET    /api/tiles/:imageryType/:z/:x/:y.png
// ─── 提供/缓存瓦片图像（代理到瓦片提供商）
// 返回：image/png 或 image/webp

// GET    /api/tiles/elevation/:z/:x/:y.terrain
// ─── 提供高程瓦片
// 返回：application/octet-stream（quantized-mesh 或 terrarium）

// ─── Earth Mate API ──────────────────────────────────────────────

// POST   /api/earthmate
// ─── 非流式聊天
interface EarthMateRequest {
  messages: ChatMessage[];
  documentId?: string;
  featureIds?: string[];
  cameraState?: CameraState;
  industry?: string;
  overheadImagery?: {
    imageBase64: string;
    lat: number;
    lng: number;
  };
}

interface EarthMateResponse {
  chatResponse: string;
  commands?: Command[];       // AI 生成的可执行命令
  attributions?: Attribution[];
}

// GET    /api/earthmate/stream
// ─── SSE 流式端点（相同的请求体，返回流）
// 响应：text/event-stream

// ─── 设计 API ──────────────────────────────────────────────────

// POST   /api/design/solar
// ─── 运行太阳能光伏分析
interface SolarAnalysisRequest {
  polygon: GeoJSON.Polygon;
  panelType?: string;
  tiltAngle?: number;
  azimuth?: number;
  systemLosses?: number;       // 0-1，默认 0.14
}

interface SolarAnalysisResponse {
  annualKwh: number;
  monthlyBreakdown: { month: string; kwh: number }[];
  panelCount: number;
  installationSizeKw: number;
  co2SavingsKg: number;
}

// POST   /api/design/building
// ─── 运行新建筑设计
interface NewBuildingRequest {
  polygon: GeoJSON.Polygon;
  far?: number;                // 容积率（Floor Area Ratio）
  maxHeight?: number;
  minHeight?: number;
  setback?: number;
  templateId?: string;
}

interface NewBuildingResponse {
  designId: string;
  buildingHeight: number;
  gfaSqM: number;              // 总建筑面积（Gross Floor Area）
  floorCount: number;
  unitCount?: number;
  lotCoverage: number;         // 0-1
  threeDModel: string;         // 生成的 GLTF 的 URL
}

// ─── 分析 API ────────────────────────────────────────────────

// POST   /api/analysis/:type
// ─── 运行按需地理空间分析
interface AnalysisRequest {
  polygon: GeoJSON.Polygon;
  parameters?: Record<string, unknown>;
}

interface SlopeAnalysisResponse {
  min: number;
  max: number;
  mean: number;
  stdDev: number;
  rasterUrl: string;           // PNG 叠加层
}

interface ContourAnalysisResponse {
  contours: GeoJSON.FeatureCollection;
  interval: number;
}

interface CutFillAnalysisResponse {
  cutVolumeM3: number;
  fillVolumeM3: number;
  netVolumeM3: number;
  cutRasterUrl: string;
  fillRasterUrl: string;
}

// ─── 街景 API ─────────────────────────────────────────────

// GET    /api/streetview?lat={lat}&lng={lng}&radius={radius}
// ─── 获取全景元数据
interface StreetViewRequest {
  lat: number;
  lng: number;
  radius?: number;             // 搜索半径（米）
}

interface StreetViewResponse {
  panoId: string;
  lat: number;
  lng: number;
  heading: number;
  pitch: number;
  zoom: number;
  date?: string;
  links?: { heading: number; panoId: string }[];
  tiles: {
    worldWidth: number;
    worldHeight: number;
    tileWidth: number;
    tileHeight: number;
    imageUrl: string;           // Google Street View Image API URL
    copyright: string;
  };
}

// ─── 高程 API ───────────────────────────────────────────────

// POST   /api/elevation
// ─── 批量高程查询
interface ElevationRequest {
  locations: { lat: number; lng: number }[];
}

interface ElevationResponse {
  results: {
    lat: number;
    lng: number;
    elevation: number;         // 高于 WGS84 椭球体的米数
    resolution: number;        // 源数据的水平分辨率
  }[];
}

// ─── KML 导入/导出 API ───────────────────────────────────────

// POST   /api/kml/import
// ─── 导入 KML/KMZ 文件
interface KmlImportRequest {
  file: File;                  // .kml 或 .kmz 文件
  documentId?: string;         // 目标文档（如果省略则创建新文档）
  namespace?: string;
}

interface KmlImportResponse {
  documentId: string;
  featureCount: number;
  errors?: ImportError[];
  warnings?: ImportWarning[];
}

// GET    /api/kml/export?documentId={id}&format=kml
// ─── 将文档导出为 KML
// 返回：application/vnd.google-earth.kml+xml

// ─── 图像生成 API ────────────────────────────────────────

// POST   /api/images
// ─── 生成 AI 图像
interface ImageGenerationRequest {
  prompt: string;
  style?: string;              // 'aerial' | 'satellite' | 'artistic'
  negativePrompt?: string;
  width?: number;              // 默认 1024
  height?: number;             // 默认 1024
}

interface ImageGenerationResponse {
  imageUrl: string;
  revisedPrompt: string;
  seed: number;
}

// ─── 配置 API ───────────────────────────────────────────────────

// GET    /api/config
// ─── 获取客户端启动配置
interface ClientConfigResponse {
  config: ClientConfig;
  featureFlags: FeatureFlag[];
  serviceEndpoints: ServiceEndpoint[];
  planLimits: PlanLimits;
}

// ─── 事件 API ───────────────────────────────────────────────────

// POST   /api/events
// ─── 批量分析事件采集
interface PostEventsRequest {
  events: AnalyticsEvent[];
}

// ─── 认证 API ─────────────────────────────────────────────────────

// GET/POST /api/auth/[...nextauth]
// ─── NextAuth.js 处理器，用于 OAuth 流程
// GET    /api/auth/session
// ─── 获取当前会话
// GET    /api/auth/csrf
// ─── CSRF 令牌
```

---

## 前后端分离

```
┌─────────────────────────────────────────────────────────────────────┐
│                        浏览器（Next.js 客户端）                      │
│                                                                       │
│  ┌────────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │   EarthCanvas.tsx  │  │  CommandBar.tsx   │  │ LayerPanel.tsx  │  │
│  │   ┌──────────────┐ │  │  ┌──────────────┐ │  │ ┌─────────────┐ │  │
│  │   │ Globe        │ │  │  │ Command      │ │  │ │ LayerStore  │ │  │
│  │   │ (Three.js)   │ │  │  │ Dispatcher   │ │  │ │ (MobX)      │ │  │
│  │   ├──────────────┤ │  │  ├──────────────┤ │  │ └──────┬──────┘ │  │
│  │   │ EarthCamera  │ │  │  │ FlyToCamera  │ │  │        │         │  │
│  │   ├──────────────┤ │  │  │ PerformSearch│ │  │  ┌─────▼──────┐ │  │
│  │   │ TileManager  │ │  │  │ ToggleLayer  │ │  │  │ fetch()    │ │  │
│  │   ├──────────────┤ │  │  │ CreateFeature│ │  │  │ POST /api/ │ │  │
│  │   │ LayerRenderer│ │  │  │ ...共 34 个  │ │  │  └─────┬──────┘ │  │
│  │   ├──────────────┤ │  │  └──────────────┘ │  │        │         │  │
│  │   │ FeatureRend. │ │  └──────────────────┘  └────────┼─────────┘  │
│  │   └──────────────┘ │                                   │            │
│  └────────────────────┘                                   │            │
│           │                                               │            │
│  ┌────────▼──────────┐  ┌──────────────────┐  ┌─────────▼──────────┐  │
│  │   SearchPanel.tsx  │  │ FeatureEditor.tsx │  │ KnowledgeCard.tsx  │  │
│  │   ┌──────────────┐ │  │  ┌──────────────┐ │  │  ┌──────────────┐ │  │
│  │   │ SearchStore  │ │  │  │ FeatureStore │ │  │  │ CardStore    │ │  │
│  │   │ (MobX)       │ │  │  │ (MobX)       │ │  │  │ (MobX)       │ │  │
│  │   └──────┬───────┘ │  │  └──────┬───────┘ │  │  └──────┬───────┘ │  │
│  │          │         │  │         │         │  │         │         │  │
│  │   GET /api/search  │  │  POST/PUT/DELETE │  │  GET /api/knowledge│  │
│  └──────────┼─────────┘  │    /api/features │  └──────────┼─────────┘  │
│             │            └─────────┼────────┘             │            │
│             │                      │                      │            │
│  ┌──────────▼──────────┐  ┌───────▼────────┐  ┌──────────▼──────────┐  │
│  │ EarthMatePanel.tsx  │  │DrawingTools.tsx │  │ TimeMachine.tsx     │  │
│  │ (SSE 流式)          │  │ (画布输入)      │  │ (时间线滑动条)       │  │
│  └──────────┬──────────┘  └───────┬────────┘  └──────────┬──────────┘  │
│             │                     │                       │             │
│             └─────────────────────┼───────────────────────┘             │
│                                   │                                     │
│                    ┌──────────────▼──────────────┐                      │
│                    │        MobX 状态树          │                      │
│                    │  60+ 存储，40 个可恢复      │                      │
│                    │  命令 → 状态 → 渲染         │                      │
│                    └──────────────────────────────┘                      │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    事件记录器（EarthEventLogger）                  │   │
│  │    logCommand() | logStateChange() | logVEClick() | logPerf()    │   │
│  │    ──────────────────────────────────────────────────────────    │   │
│  │    flush() → POST /api/events  (批量，每 5 秒 + beforeunload)    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  │ HTTP/SSE
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      服务器（Next.js API 路由）                       │
│                                                                       │
│  ┌────────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ /api/features/ │  │ /api/search/ │  │ /api/knowledge/          │  │
│  │ ├─ FeatureRepo  │  │ ├─ Geocoding │  │ ├─ KnowledgeRepository   │  │
│  │ └─ PostGIS ←───►│  │ │  Provider  │  │ │  (Nominatim/Mapbox)    │  │
│  │                 │  │ └─ Redis ←──►│  │ └──────────────────────────┘  │
│  └────────┬────────┘  └──────┬───────┘                                  │
│           │                  │                                          │
│  ┌────────▼────────┐  ┌─────▼────────┐  ┌──────────────────────────┐  │
│  │ /api/documents/ │  │ /api/tiles/  │  │ /api/earthmate/          │  │
│  │ ├─ DocumentRepo │  │ ├─ TileCache │  │ ├─ EarthMateProvider     │  │
│  │ └─ PostGIS      │  │ └─ S3/CDN    │  │ │  (OpenAI/Claude)       │  │
│  └────────┬────────┘  └──────┬───────┘  │ ├─ 提示词模板             │  │
│           │                  │          │ └─ 工具定义               │  │
│  ┌────────▼────────┐  ┌─────▼────────┐  └──────────────────────────┘  │
│  │ /api/design/    │  │ /api/kml/    │  ┌──────────────────────────┐  │
│  │ ├─ SolarService │  │ ├─ KmlImport │  │ /api/analysis/           │  │
│  │ │   (PVLib)     │  │ │  Service   │  │ ├─ TerrainAnalysis       │  │
│  │ └─ DesignService│  │ ├─ KmlExport │  │ │   (GDAL → Docker)      │  │
│  └─────────────────┘  │ └─ GeoJSON   │  │ └─ PostGIS ST_*          │  │
│                        └─────────────┘  └──────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                         中间件栈                                  │   │
│  │  auth.ts → validation.ts (proto 模式) → rateLimit.ts → logging   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│           ┌──────────────┐    ┌──────────┐    ┌───────────────────┐    │
│           │  PostgreSQL  │    │  Redis   │    │  外部 API          │    │
│           │  + PostGIS   │    │  缓存    │    │  • Nominatim       │    │
│           │  + Drizzle   │    │          │    │  • Mapbox          │    │
│           └──────────────┘    └──────────┘    │  • OpenAI          │    │
│                                                │  • Cesium ion      │    │
│                                                └───────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 实施阶段

### 阶段 1：基础（第 1-2 周）— P0 关键

**目标：** Proto 编译管线 + 基础 Three.js 地球 + 相机系统 + Next.js 搭建

#### 第 1 周：Proto 管线

##### 第 1-2 天：清点与清理

```bash
# 从 1,316 个 proto 中移除 Google 内部依赖
cd geo/
find . -name "*.proto" -exec sed -i \
  -e 's|import "net/proto2/proto/descriptor.proto"|import "google/protobuf/descriptor.proto"|g' \
  -e '/import.*jspb\.proto/d' \
  -e '/option.*jspb/d' \
  -e '/import.*collection_basis_annotations/d' \
  -e '/import.*com\.google\.android/d' \
  {} +
```

```python
# packages/proto/scripts/convert_messageset.py
"""将 33 个 proto 文件中的 MessageSet 扩展转换为 oneof。"""

import re
import sys
from pathlib import Path

def convert_messageset(proto_path: Path) -> str:
    """将 MessageSet 扩展字段转换为 oneof。"""
    content = proto_path.read_text()

    # 找到某个消息的所有 extend 块
    extends: dict[str, list[dict]] = {}

    for match in re.finditer(
        r'extend\s+(\w+(?:\.\w+)*)\s*\{([^}]+)\}',
        content, re.DOTALL
    ):
        target = match.group(1)
        body = match.group(2)

        # 提取字段定义
        fields = re.findall(
            r'(?:repeated\s+)?(\w+(?:\.\w+)*)\s+(\w+)\s*=\s*(\d+)\s*;',
            body
        )

        if target not in extends:
            extends[target] = []
        extends[target].extend([
            {'type': f[0], 'name': f[1], 'number': int(f[2])}
            for f in fields
        ])

    # 生成 oneof 替换
    for target, fields in extends.items():
        oneof = '  oneof extension {\n'
        for f in fields:
            type_name = f['type']
            if type_name.startswith('.'):
                type_name = type_name[1:]
            oneof += f'    {type_name} {f["name"]} = {f["number"]};\n'
        oneof += '  }\n'

        # 找到消息并添加 oneof
        msg_pattern = rf'message\s+{target.split(".")[-1]}\s*\{{'
        content = re.sub(
            rf'({msg_pattern})',
            rf'\1\n{oneof}',
            content
        )

    # 移除扩展范围
    content = re.sub(
        r'extensions\s+\d+\s+to\s+(?:max|[\d]+)\s*\[message_set\s*=\s*true\];',
        '',
        content
    )

    # 移除 extend 块
    content = re.sub(
        r'extend\s+\w+(?:\.\w+)*\s*\{[^}]+\}',
        '',
        content
    )

    return content

if __name__ == '__main__':
    for proto_path in Path('geo/').rglob('*.proto'):
        if 'message_set = true' in proto_path.read_text():
            print(f'Converting: {proto_path}')
            new_content = convert_messageset(proto_path)
            proto_path.write_text(new_content)
```

##### 第 3-4 天：TypeScript 生成

```yaml
# packages/proto/buf.gen.yaml
version: v2
managed:
  enabled: true
  override:
    - file_option: go_package_prefix
      value: github.com/earthstudio/proto/gen
plugins:
  - plugin: protobuf-ts
    out: src/gen
    opt:
      - generate_dependencies
      - long_type_string
      - ts_nocheck
      - client_none
      - server_none
      - output_javascript
      - output_javascript_es2015
  - plugin: protobuf-ts
    out: src/gen
    opt:
      - generate_dependencies
      - long_type_string
      - client_grpc1
      - server_grpc1
      - ts_nocheck
    path: ../node_modules/@protobuf-ts/plugin/bin/protoc-gen-ts
```

```json
// packages/proto/package.json
{
  "name": "@earthstudio/proto",
  "version": "0.1.0",
  "scripts": {
    "generate": "buf generate",
    "lint": "buf lint",
    "breaking": "buf breaking --against '.git#branch=main'",
    "clean": "rm -rf src/gen"
  },
  "dependencies": {
    "@protobuf-ts/runtime": "^2.9.4",
    "@protobuf-ts/runtime-rpc": "^2.9.4"
  },
  "devDependencies": {
    "@protobuf-ts/plugin": "^2.9.4",
    "@bufbuild/buf": "^1.39.0"
  }
}
```

##### 第 5 天：适配器层基础

```typescript
// packages/proto/src/adapters/CommandAdapter.ts（基础 — 在阶段 2 中扩展）

import { Command as ProtoCommand } from '../gen/commands';
import { FlyToCamera as ProtoFlyToCamera } from '../gen/commands';
import { CameraAnimation, CameraPresentationMode } from '../gen/commands';

export class CommandAdapter {
  static fromProto(proto: ProtoCommand): CommandDispatchable {
    const ct = proto.commandType;
    if (!ct) throw new CommandParseError('No command_type');

    switch (ct.oneofKind) {
      case 'flyToCamera':
        return FlyToCameraCommandAdapter.fromProto(ct.flyToCamera);
      case 'performSearch':
        return SearchCommandAdapter.fromProto(ct.performSearch);
      case 'toggleLayer':
        return LayerToggleAdapter.fromProto(ct.toggleLayer);
      case 'setBasemapStyle':
        return BasemapStyleAdapter.fromProto(ct.setBasemapStyle);
      case 'createFeature':
        return CreateFeatureAdapter.fromProto(ct.createFeature);
      case 'deleteFeature':
        return DeleteFeatureAdapter.fromProto(ct.deleteFeature);
      case 'editFeature':
        return EditFeatureAdapter.fromProto(ct.editFeature);
      // ... 其余 27 个 case
      default:
        throw new CommandParseError(`Unknown: ${ct.oneofKind}`);
    }
  }
}
```

```typescript
// packages/proto/src/adapters/CameraAdapter.ts

import { LookAt, LookFrom } from '../gen/commands';
import { Camera as ProtoCamera, Location, Rotation } from '../gen/geometry';

export class CameraAdapter {
  static lookAtFromProto(proto: LookAt): LookAtCamera {
    return new LookAtCamera({
      lat: proto.latitude ?? 0,
      lng: proto.longitude ?? 0,
      alt: proto.altitude ?? 0,
      range: proto.range ?? 1000,
      heading: proto.heading ?? 0,
      tilt: proto.tilt ?? 45,
      roll: proto.roll ?? 0,
      fovy: proto.fovy ?? 35,
    });
  }

  static lookFromFromProto(proto: LookFrom): LookFromCamera {
    return new LookFromCamera({
      lat: proto.latitude ?? 0,
      lng: proto.longitude ?? 0,
      alt: proto.altitude ?? 10000,
      heading: proto.heading ?? 0,
      tilt: proto.tilt ?? 90,
      roll: proto.roll ?? 0,
      fovy: proto.fovy ?? 35,
    });
  }

  static cameraToProto(camera: EarthCamera): ProtoCamera {
    return ProtoCamera.create({
      location: Location.create({
        longitude: camera.location.lng,
        latitude: camera.location.lat,
        altitude: camera.location.alt,
      }),
      rotation: Rotation.create({
        heading: camera.rotation.heading,
        tilt: camera.rotation.tilt,
        roll: camera.rotation.roll,
      }),
      fieldOfViewY: camera.fovY,
      screenSize: { width: camera.screenSize.width, height: camera.screenSize.height },
    });
  }
}

export class CameraAnimationAdapter {
  static fromProto(proto: CameraAnimation): 'teleport' | 'fly' {
    switch (proto) {
      case CameraAnimation.CAMERA_ANIMATION_TELEPORT:
        return 'teleport';
      case CameraAnimation.CAMERA_ANIMATION_FLY:
        return 'fly';
      default:
        return 'teleport';
    }
  }

  static fromProtoToEnum(proto: CameraAnimation): CameraAnimationEnum {
    const map: Record<number, CameraAnimationEnum> = {
      [CameraAnimation.CAMERA_ANIMATION_TELEPORT]: CameraAnimationEnum.TELEPORT,
      [CameraAnimation.CAMERA_ANIMATION_FLY]: CameraAnimationEnum.FLY,
    };
    return map[proto] ?? CameraAnimationEnum.TELEPORT;
  }
}
```

```typescript
// packages/proto/src/adapters/MapStyleAdapter.ts

import { MapStyle as ProtoMapStyle } from '../gen/mapstyle';
import { Projection, Imagery, ThreeDFeatures, GridlinesLayer } from '../gen/mapstyle';

export class MapStyleAdapter {
  static fromProto(proto: ProtoMapStyle): MapStyle {
    return new MapStyle({
      projection: this.projectionFromProto(proto.projection),
      imagery: this.imageryFromProto(proto.imagery),
      threeDFeatures: this.threeDFromProto(proto.threeDFeatures),
      showClouds: proto.showClouds ?? true,
      useAnimatedClouds: proto.useAnimatedClouds ?? false,
      gridlinesLayer: this.gridlinesFromProto(proto.gridlinesLayer),
      baseLayers: proto.baseLayers ? {
        preset: this.baseLayersPresetFromProto(proto.baseLayers.preset),
        customFeatureCategory: proto.baseLayers.customFeatureCategory ?? [],
      } : undefined,
      showThreeDCoverageLayer: proto.showThreeDCoverageLayer ?? false,
      showUpdatedImageryLayer: proto.showUpdatedImageryLayer ?? false,
      showLandParcelsLayer: proto.showLandParcelsLayer ?? false,
      showPinnedProjectsLayer: proto.showPinnedProjectsLayer ?? false,
      showDiscoveryLayer: proto.showDiscoveryLayer ?? false,
    });
  }

  private static projectionFromProto(p?: Projection): 'globe' | 'mercator' {
    return p === Projection.PROJECTION_MERCATOR ? 'mercator' : 'globe';
  }

  private static imageryFromProto(i?: Imagery): 'satellite' | 'roadmap' | 'terrain' {
    switch (i) {
      case Imagery.IMAGERY_NORMAL_ROADMAP: return 'roadmap';
      case Imagery.IMAGERY_TERRAIN: return 'terrain';
      default: return 'satellite';
    }
  }

  private static threeDFromProto(t?: ThreeDFeatures): 'all' | 'terrain_only' | 'none' {
    switch (t) {
      case ThreeDFeatures.THREE_D_TERRAIN_ONLY: return 'terrain_only';
      case ThreeDFeatures.THREE_D_NONE: return 'none';
      default: return 'all';
    }
  }

  private static gridlinesFromProto(g?: GridlinesLayer): 'none' | 'lat_lon' {
    return g === GridlinesLayer.LAT_LON ? 'lat_lon' : 'none';
  }

  private static baseLayersPresetFromProto(p?: number): BaseLayersPreset {
    const map: Record<number, BaseLayersPreset> = {
      0: BaseLayersPreset.CUSTOM,
      1: BaseLayersPreset.CLEAN,
      2: BaseLayersPreset.EXPLORATION,
      3: BaseLayersPreset.EVERYTHING,
    };
    return map[p ?? 0] ?? BaseLayersPreset.CUSTOM;
  }
}
```

#### 第 2 周：地球 + 相机

##### 第 6-7 天：React Three Fiber 地球

```typescript
// packages/engine/src/Globe.ts

import * as THREE from 'three';
import { MapStyle } from '@earthstudio/core/models/mapstyle/MapStyle';
import { Projection } from '@earthstudio/core/models/mapstyle/Projection';
import { Imagery } from '@earthstudio/core/models/mapstyle/Imagery';
import { Layer, LayerType } from './Layers/Layer';
import { TileManager } from './TileSystem/TileManager';
import { MapStyleController } from './MapStyleController';
import { Atmosphere } from './Effects/Atmosphere';
import { EarthConstants } from './Utils/Constants';

export interface GlobeConfig {
  container: HTMLElement;
  mapStyle: MapStyle;
  pixelRatio?: number;
  antialias?: boolean;
}

export class Globe {
  readonly scene: THREE.Scene;
  readonly renderer: THREE.WebGLRenderer;
  readonly earthGroup: THREE.Group;
  readonly earthMesh: THREE.Mesh;
  readonly atmosphere: Atmosphere;

  private layers: Map<LayerType, Layer> = new Map();
  private tileManager: TileManager;
  private mapStyleController: MapStyleController;
  private animationId: number = 0;
  private isDisposed: boolean = false;

  constructor(private config: GlobeConfig) {
    // ─── 渲染器 ─────────────────────────────────────────
    this.renderer = new THREE.WebGLRenderer({
      antialias: config.antialias ?? true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(config.pixelRatio ?? window.devicePixelRatio);
    this.renderer.setSize(
      config.container.clientWidth,
      config.container.clientHeight
    );
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    config.container.appendChild(this.renderer.domElement);

    // ─── 场景 ────────────────────────────────────────────
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // ─── 地球组 ──────────────────────────────────────
    this.earthGroup = new THREE.Group();
    this.scene.add(this.earthGroup);

    // ─── 地球网格（WGS84 椭球体）──────────────────────────
    const radius = EarthConstants.WGS84_EQUATORIAL_RADIUS;
    const geometry = new THREE.SphereGeometry(radius, 128, 64);
    const material = new THREE.MeshStandardMaterial({
      roughness: 0.9,
      metalness: 0.0,
    });
    this.earthMesh = new THREE.Mesh(geometry, material);
    this.earthGroup.add(this.earthMesh);

    // ─── 大气层 ───────────────────────────────────────
    this.atmosphere = new Atmosphere(this.scene, radius);

    // ─── 瓦片管理器 ─────────────────────────────────────
    this.tileManager = new TileManager(this.earthMesh, config.mapStyle);

    // ─── 地图样式控制器 ──────────────────────────────
    this.mapStyleController = new MapStyleController(
      this.tileManager,
      config.mapStyle
    );

    // ─── 光照 ─────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(5, 3, 5);
    this.scene.add(sunLight);

    // ─── 启动渲染循环？──────────────────────────────────
    this.startRenderLoop();
  }

  // ─── 投影 ────────────────────────────────────────

  setProjection(projection: Projection): void {
    this.mapStyleController.setProjection(projection);
    switch (projection) {
      case Projection.GLOBE:
        this.earthMesh.visible = true;
        this.earthMesh.scale.set(1, 1, 1);
        break;
      case Projection.MERCATOR:
        // 压平为墨卡托平面
        this.earthMesh.scale.set(1, 0.003, 1);
        break;
    }
  }

  // ─── 影像 ───────────────────────────────────────────

  setImagery(imagery: Imagery): void {
    this.mapStyleController.setImagery(imagery);
    switch (imagery) {
      case Imagery.SATELLITE:
        this.tileManager.setTileProvider('satellite');
        break;
      case Imagery.ROADMAP:
        this.tileManager.setTileProvider('roadmap');
        break;
      case Imagery.TERRAIN:
        this.tileManager.setTileProvider('terrain');
        break;
    }
  }

  // ─── 图层管理 ──────────────────────────────────

  addLayer(layer: Layer): void {
    if (this.layers.has(layer.type)) {
      throw new Error(`Layer ${layer.type} already exists`);
    }
    this.layers.set(layer.type, layer);
    layer.render(this);
  }

  removeLayer(layerType: LayerType): void {
    const layer = this.layers.get(layerType);
    if (!layer) return;
    layer.dispose();
    this.layers.delete(layerType);
  }

  getLayer(layerType: LayerType): Layer | undefined {
    return this.layers.get(layerType);
  }

  toggleLayer(layerType: LayerType, visible: boolean): void {
    const layer = this.layers.get(layerType);
    if (layer) {
      layer.setVisible(visible);
    }
  }

  // ─── 世界坐标转换 ───────────────────────

  latLngAltToWorld(lat: number, lng: number, alt: number): THREE.Vector3 {
    const radius = EarthConstants.WGS84_EQUATORIAL_RADIUS + alt;
    const phi = THREE.MathUtils.degToRad(90 - lat);
    const theta = THREE.MathUtils.degToRad(lng);

    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  worldToLatLngAlt(pos: THREE.Vector3): { lat: number; lng: number; alt: number } {
    const radius = pos.length();
    const alt = radius - EarthConstants.WGS84_EQUATORIAL_RADIUS;

    const lng = Math.atan2(pos.z, -pos.x);
    const lat = Math.PI / 2 - Math.acos(pos.y / radius);

    return {
      lat: THREE.MathUtils.radToDeg(lat),
      lng: THREE.MathUtils.radToDeg(lng),
      alt,
    };
  }

  // ─── 渲染循环 ───────────────────────────────────────

  private startRenderLoop(): void {
    const animate = () => {
      if (this.isDisposed) return;
      this.animationId = requestAnimationFrame(animate);
      this.atmosphere.update();
      this.tileManager.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  // ─── 调整大小 ────────────────────────────────────────────

  resize(width: number, height: number): void {
    this.renderer.setSize(width, height);
  }

  // ─── 命中测试（射线检测）──────────────────────────

  raycast(screenX: number, screenY: number): THREE.Intersection[] {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(
      (screenX / this.renderer.domElement.clientWidth) * 2 - 1,
      -(screenY / this.renderer.domElement.clientHeight) * 2 + 1
    );
    raycaster.setFromCamera(mouse, this.camera);

    const earthIntersects = raycaster.intersectObject(this.earthMesh, false);
    return earthIntersects;
  }

  pickLatLng(screenX: number, screenY: number): { lat: number; lng: number } | null {
    const intersects = this.raycast(screenX, screenY);
    if (intersects.length === 0) return null;
    return this.worldToLatLngAlt(intersects[0].point);
  }

  // ─── 清理 ───────────────────────────────────────────

  get camera(): THREE.PerspectiveCamera {
    return this._camera!;
  }

  private _camera: THREE.PerspectiveCamera | null = null;

  setThreeCamera(camera: THREE.PerspectiveCamera): void {
    this._camera = camera;
  }

  dispose(): void {
    this.isDisposed = true;
    cancelAnimationFrame(this.animationId);

    for (const [, layer] of this.layers) {
      layer.dispose();
    }
    this.layers.clear();

    this.tileManager.dispose();
    this.atmosphere.dispose();

    this.renderer.dispose();
    this.renderer.domElement.remove();

    this.scene.clear();
  }
}
```

```typescript
// packages/engine/src/Utils/Constants.ts

export const EarthConstants = {
  /** WGS84 赤道半径（米），按渲染缩放 */
  WGS84_EQUATORIAL_RADIUS: 6378137,
  /** WGS84 极半径（米），按渲染缩放 */
  WGS84_POLAR_RADIUS: 6356752.3142,
  /** 扁率因子 */
  WGS84_FLATTENING: 1 / 298.257223563,
  /** 偏心率平方 */
  WGS84_ECCENTRICITY2: 0.00669437999014,
  /** 渲染缩放因子（1 单位 = 1 米） */
  RENDER_SCALE: 1,
  /** 瓦片最大缩放级别 */
  MAX_ZOOM: 22,
  /** 瓦片像素大小 */
  TILE_SIZE: 256,
  /** 度/弧度 */
  DEG_TO_RAD: Math.PI / 180,
  /** 弧度/度 */
  RAD_TO_DEG: 180 / Math.PI,
  /** 每度对应米数（赤道处近似值） */
  METERS_PER_DEGREE: 111319.9,
} as const;
```

##### 第 8-10 天：EarthCamera

```typescript
// packages/engine/src/EarthCamera.ts

import * as THREE from 'three';
import { EarthConstants } from './Utils/Constants';
import { GeoMath } from './Utils/GeoMath';

export enum CameraAnimation {
  TELEPORT = 'TELEPORT',
  FLY = 'FLY',
}

export enum CameraPresentationMode {
  STATIC = 'STATIC',
  POI_ORBIT = 'POI_ORBIT',
  PLANET_ORBIT = 'PLANET_ORBIT',
  CINEMATIC = 'CINEMATIC',
}

export interface CameraState {
  lat: number;
  lng: number;
  alt: number;
  heading: number;
  tilt: number;
  roll: number;
  fovy: number;
}

export interface LookAtTarget {
  lat: number;
  lng: number;
  alt?: number;
  range?: number;
  heading?: number;
  tilt?: number;
  roll?: number;
  fovy?: number;
}

export interface LookFromPosition {
  lat: number;
  lng: number;
  alt?: number;
  heading?: number;
  tilt?: number;
  roll?: number;
  fovy?: number;
}

export type CameraAnimationConfig = {
  animation: CameraAnimation;
  presentation?: CameraPresentationMode;
  duration?: number;              // FLY 的秒数
  easing?: (t: number) => number;
  disableClamping?: boolean;
};

const DEFAULT_DURATION = 2.0;
const DEFAULT_FOVY = 35;
const DEFAULT_ALTITUDE = 10000;
const DEFAULT_RANGE = 1000;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export class EarthCamera {
  private _lat: number = 0;
  private _lng: number = 0;
  private _alt: number = DEFAULT_ALTITUDE;
  private _heading: number = 0;
  private _tilt: number = 45;
  private _roll: number = 0;
  private _fovy: number = DEFAULT_FOVY;

  private _camera: THREE.PerspectiveCamera;
  private _threeCamera: THREE.PerspectiveCamera;

  private isAnimating: boolean = false;
  private animationPromise: Promise<void> | null = null;
  private animationResolve: (() => void) | null = null;
  private animationConfig: CameraAnimationConfig | null = null;
  private animationStartState: CameraState | null = null;
  private animationTargetState: CameraState | null = null;
  private animationStartTime: number = 0;

  private orbitMode: CameraPresentationMode = CameraPresentationMode.STATIC;
  private orbitAngle: number = 0;

  constructor(
    private globeRadius: number = EarthConstants.WGS84_EQUATORIAL_RADIUS,
    fov: number = DEFAULT_FOVY,
    aspect: number = 1,
    near: number = 0.1,
    far: number = EarthConstants.WGS84_EQUATORIAL_RADIUS * 10
  ) {
    this._fovy = fov;
    this._threeCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._updateCameraPosition();
  }

  // ─── 获取器 ───────────────────────────────────────────

  get threeCamera(): THREE.PerspectiveCamera {
    return this._threeCamera;
  }

  get lat(): number { return this._lat; }
  get lng(): number { return this._lng; }
  get alt(): number { return this._alt; }
  get heading(): number { return this._heading; }
  get tilt(): number { return this._tilt; }
  get roll(): number { return this._roll; }
  get fovy(): number { return this._fovy; }

  getState(): CameraState {
    return {
      lat: this._lat,
      lng: this._lng,
      alt: this._alt,
      heading: this._heading,
      tilt: this._tilt,
      roll: this._roll,
      fovy: this._fovy,
    };
  }

  // ─── LookAt（相机围绕目标旋转）──────────────

  async lookAt(
    target: LookAtTarget,
    config: CameraAnimationConfig = { animation: CameraAnimation.TELEPORT }
  ): Promise<void> {
    const targetState: CameraState = {
      lat: target.lat,
      lng: target.lng,
      alt: target.range ?? DEFAULT_RANGE,
      heading: target.heading ?? this._heading,
      tilt: target.tilt ?? this._tilt,
      roll: target.roll ?? this._roll,
      fovy: target.fovy ?? this._fovy,
    };

    // 限制海拔范围
    if (!config.disableClamping) {
      targetState.alt = Math.max(10, Math.min(targetState.alt, this.globeRadius * 2));
    }

    return this._animate(
      this.getState(),
      targetState,
      config,
      'lookAt'
    );
  }

  // ─── LookFrom（相机位于指定坐标处）───────

  async lookFrom(
    position: LookFromPosition,
    config: CameraAnimationConfig = { animation: CameraAnimation.TELEPORT }
  ): Promise<void> {
    const targetState: CameraState = {
      lat: position.lat,
      lng: position.lng,
      alt: position.alt ?? DEFAULT_ALTITUDE,
      heading: position.heading ?? this._heading,
      tilt: position.tilt ?? 90,
      roll: position.roll ?? 0,
      fovy: position.fovy ?? this._fovy,
    };

    if (!config.disableClamping) {
      targetState.alt = Math.max(1, targetState.alt);
    }

    return this._animate(
      this.getState(),
      targetState,
      config,
      'lookFrom'
    );
  }

  // ─── 动画引擎 ─────────────────────────────────

  private async _animate(
    from: CameraState,
    to: CameraState,
    config: CameraAnimationConfig,
    mode: 'lookAt' | 'lookFrom'
  ): Promise<void> {
    if (this.isAnimating) {
      // 中断当前动画；立即解决
      this.animationResolve?.();
    }

    this.isAnimating = true;
    this.orbitMode = config.presentation ?? CameraPresentationMode.STATIC;

    return new Promise<void>((resolve) => {
      this.animationPromise = new Promise((r) => { /* 由 resolve 捕获 */ });
      this.animationResolve = resolve;
      this.animationConfig = config;
      this.animationStartState = { ...from };
      this.animationTargetState = { ...to };
      this.animationStartTime = performance.now();
    });
  }

  update(currentTime: number): void {
    if (!this.isAnimating || !this.animationConfig || !this.animationStartState || !this.animationTargetState) {
      // 依然为轨道模式更新
      if (this.orbitMode === CameraPresentationMode.POI_ORBIT) {
        this._updateOrbit(0.3 * 0.016); // ~60fps 步进
      } else if (this.orbitMode === CameraPresentationMode.PLANET_ORBIT) {
        this._updateOrbit(1.0 * 0.016);
      }
      this._updateCameraPosition();
      return;
    }

    const config = this.animationConfig;
    const from = this.animationStartState;
    const to = this.animationTargetState;

    if (config.animation === CameraAnimation.TELEPORT) {
      // 瞬间跳转
      this._lat = to.lat;
      this._lng = to.lng;
      this._alt = to.alt;
      this._heading = to.heading;
      this._tilt = to.tilt;
      this._roll = to.roll;
      this._fovy = to.fovy;
      this._finishAnimation();
      return;
    }

    // FLY 动画
    const durationMs = (config.duration ?? DEFAULT_DURATION) * 1000;
    const elapsed = currentTime - this.animationStartTime;
    const t = Math.min(elapsed / durationMs, 1.0);
    const easedT = (config.easing ?? easeInOutCubic)(t);

    // 插值
    this._lat = from.lat + (to.lat - from.lat) * easedT;
    this._lng = GeoMath.interpolateLng(from.lng, to.lng, easedT);
    this._alt = from.alt + (to.alt - from.alt) * easedT;
    this._heading = from.heading + (to.heading - from.heading) * easedT;
    this._tilt = from.tilt + (to.tilt - from.tilt) * easedT;
    this._roll = from.roll + (to.roll - from.roll) * easedT;
    this._fovy = from.fovy + (to.fovy - from.fovy) * easedT;

    this._updateCameraPosition();

    if (t >= 1.0) {
      this._finishAnimation();
    }
  }

  private _finishAnimation(): void {
    this.isAnimating = false;
    this.animationConfig = null;
    this.animationStartState = null;
    this.animationTargetState = null;
    this.animationStartTime = 0;
    this.animationResolve?.();
    this.animationResolve = null;
  }

  private _updateOrbit(anglePerSecond: number): void {
    this._heading = (this._heading + anglePerSecond) % 360;
  }

  // ─── 相机位置计算 ───────────────────────

  private _updateCameraPosition(): void {
    const alt = this._alt;
    const latRad = THREE.MathUtils.degToRad(this._lat);
    const lngRad = THREE.MathUtils.degToRad(this._lng);
    const headingRad = THREE.MathUtils.degToRad(this._heading);
    const tiltRad = THREE.MathUtils.degToRad(this._tilt);
    const rollRad = THREE.MathUtils.degToRad(this._roll);

    // 地球表面上的目标位置
    const R = this.globeRadius;
    const targetX = R * Math.cos(latRad) * Math.cos(lngRad);
    const targetY = R * Math.sin(latRad);
    const targetZ = -R * Math.cos(latRad) * Math.sin(lngRad);
    const targetPos = new THREE.Vector3(targetX, targetY, targetZ);

    // 相机位置：沿反向方向向量偏移目标
    // 距离 = alt，带有 heading 和 tilt 偏移
    const direction = targetPos.clone().normalize();
    const distance = alt;

    // 应用 tilt（从天顶向下倾斜）
    const right = new THREE.Vector3(0, 1, 0).cross(direction).normalize();
    const tiltedDir = direction.clone()
      .applyAxisAngle(right, tiltRad);

    // 应用 heading（围绕上轴旋转）
    const up = direction.clone();
    const rotatedDir = tiltedDir.clone()
      .applyAxisAngle(up, headingRad);

    const camPos = targetPos.clone().add(
      rotatedDir.normalize().multiplyScalar(distance)
    );

    this._threeCamera.position.copy(camPos);
    this._threeCamera.lookAt(targetPos);

    // 应用 roll
    this._threeCamera.rotateZ(rollRad);

    // 更新 FOV
    this._threeCamera.fov = this._fovy;
    this._threeCamera.updateProjectionMatrix();
  }

  // ─── 调整大小 ───────────────────────────────────────────

  resizeAspect(width: number, height: number): void {
    this._threeCamera.aspect = width / height;
    this._threeCamera.updateProjectionMatrix();
  }

  // ─── 设置直接状态（无动画）───────────────────

  setState(state: CameraState): void {
    this._lat = state.lat;
    this._lng = state.lng;
    this._alt = state.alt;
    this._heading = state.heading;
    this._tilt = state.tilt;
    this._roll = state.roll;
    this._fovy = state.fovy;
    this._updateCameraPosition();
  }

  // ─── 屏幕坐标处的拾取射线 ─────────────────────

  getPickRay(screenX: number, screenY: number): THREE.Raycaster {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(
      (screenX / window.innerWidth) * 2 - 1,
      -(screenY / window.innerHeight) * 2 + 1
    );
    raycaster.setFromCamera(mouse, this._threeCamera);
    return raycaster;
  }
}
```

```typescript
// packages/engine/src/Utils/GeoMath.ts

import * as THREE from 'three';
import { EarthConstants } from './Constants';

export class GeoMath {
  /**
   * 将 lat/lng/alt 转换为 Three.js 世界坐标。
   * Y 轴向上的坐标系。XZ 平面为赤道面。
   */
  static latLngAltToVector3(lat: number, lng: number, alt: number = 0): THREE.Vector3 {
    const radius = EarthConstants.WGS84_EQUATORIAL_RADIUS + alt;
    const phi = THREE.MathUtils.degToRad(90 - lat);
    const theta = THREE.MathUtils.degToRad(lng);
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  /**
   * 将 Three.js 世界坐标转换为 lat/lng/alt。
   */
  static vector3ToLatLngAlt(pos: THREE.Vector3): { lat: number; lng: number; alt: number } {
    const radius = pos.length();
    const alt = radius - EarthConstants.WGS84_EQUATORIAL_RADIUS;
    const latRad = Math.PI / 2 - Math.acos(pos.y / radius);
    const lngRad = Math.atan2(pos.z, -pos.x);
    return {
      lat: THREE.MathUtils.radToDeg(latRad),
      lng: THREE.MathUtils.radToDeg(lngRad),
      alt,
    };
  }

  /**
   * 两点间的大圆距离（Haversine 公式）。
   */
  static distance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = EarthConstants.WGS84_EQUATORIAL_RADIUS;
    const dLat = THREE.MathUtils.degToRad(lat2 - lat1);
    const dLng = THREE.MathUtils.degToRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(THREE.MathUtils.degToRad(lat1)) *
        Math.cos(THREE.MathUtils.degToRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * 从点 1 到点 2 的方位角（初始朝向）。
   */
  static bearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLng = THREE.MathUtils.degToRad(lng2 - lng1);
    const y = Math.sin(dLng) * Math.cos(THREE.MathUtils.degToRad(lat2));
    const x =
      Math.cos(THREE.MathUtils.degToRad(lat1)) *
        Math.sin(THREE.MathUtils.degToRad(lat2)) -
      Math.sin(THREE.MathUtils.degToRad(lat1)) *
        Math.cos(THREE.MathUtils.degToRad(lat2)) *
        Math.cos(dLng);
    const brng = Math.atan2(y, x);
    return (THREE.MathUtils.radToDeg(brng) + 360) % 360;
  }

  /**
   * 从起点出发，给定方位角和距离，计算目标点。
   */
  static destination(
    lat: number,
    lng: number,
    bearingDeg: number,
    distanceM: number
  ): { lat: number; lng: number } {
    const R = EarthConstants.WGS84_EQUATORIAL_RADIUS;
    const brng = THREE.MathUtils.degToRad(bearingDeg);
    const latRad = THREE.MathUtils.degToRad(lat);
    const dR = distanceM / R;

    const lat2 = Math.asin(
      Math.sin(latRad) * Math.cos(dR) +
      Math.cos(latRad) * Math.sin(dR) * Math.cos(brng)
    );

    const lng2 =
      THREE.MathUtils.degToRad(lng) +
      Math.atan2(
        Math.sin(brng) * Math.sin(dR) * Math.cos(latRad),
        Math.cos(dR) - Math.sin(latRad) * Math.sin(lat2)
      );

    return {
      lat: THREE.MathUtils.radToDeg(lat2),
      lng: ((THREE.MathUtils.radToDeg(lng2) + 540) % 360) - 180,
    };
  }

  /**
   * 插值经度，处理 -180/180 环绕问题。
   */
  static interpolateLng(lng1: number, lng2: number, t: number): number {
    // 找到最短路径
    let diff = lng2 - lng1;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const result = lng1 + diff * t;
    return ((result + 540) % 360) - 180;
  }

  /**
   * WGS84 → 墨卡托（用于 2D 投影模式）。
   */
  static latLngToMercator(lat: number, lng: number): { x: number; y: number } {
    const x = ((lng + 180) / 360);
    const latRad = THREE.MathUtils.degToRad(lat);
    const y = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2;
    return { x, y };
  }

  /**
   * 墨卡托 → WGS84。
   */
  static mercatorToLatLng(x: number, y: number): { lat: number; lng: number } {
    const lng = x * 360 - 180;
    const n = Math.PI - 2 * Math.PI * y;
    const lat = THREE.MathUtils.radToDeg(Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
    return { lat, lng };
  }

  /**
   * 根据 lat/lng 计算指定级别的 S2 单元 ID。
   * 使用 s2-geometry npm 包。
   */
  static latLngToS2CellId(lat: number, lng: number, level: number = 30): bigint {
    // 使用 s2-geometry 库；简化占位
    // 生产环境：import { S2 } from 's2-geometry';
    // return S2.latLngToKey(lat, lng, level);
    throw new Error('Implement using s2-geometry npm package');
  }

  /**
   * 将角度归一化到 [0, 360)。
   */
  static normalizeAngle360(angle: number): number {
    return ((angle % 360) + 360) % 360;
  }

  /**
   * 将纬度限制在 [-90, 90]。
   */
  static clampLat(lat: number): number {
    return Math.max(-90, Math.min(90, lat));
  }
}
```

##### 第 8-10 天：Next.js 搭建 + React Three Fiber 集成

```tsx
// packages/client/src/app/page.tsx

'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const EarthCanvas = dynamic(
  () => import('@/components/EarthCanvas').then((m) => ({ default: m.EarthCanvas })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <div className="text-white text-lg animate-pulse">加载地球中...</div>
      </div>
    ),
  }
);

export default function HomePage() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-black">
      <Suspense fallback={null}>
        <EarthCanvas />
      </Suspense>
    </main>
  );
}
```

```tsx
// packages/client/src/components/EarthCanvas.tsx

'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { observer } from 'mobx-react-lite';
import { Globe } from '@earthstudio/engine/Globe';
import { EarthCamera, CameraAnimation, CameraPresentationMode } from '@earthstudio/engine/EarthCamera';
import { MapStyle } from '@earthstudio/core/models/mapstyle/MapStyle';
import { mapStyleStore } from '@/stores/MapStyleStore';
import { cameraStore } from '@/stores/CameraStore';
import { layerStore } from '@/stores/LayerStore';
import { commandDispatcher } from '@/stores/CommandDispatcher';
import { Layer, LayerType } from '@earthstudio/engine/Layers/Layer';
import { SatelliteLayerRenderer } from '@earthstudio/engine/Layers/SatelliteLayerRenderer';
import { BuildingLayerRenderer } from '@earthstudio/engine/Layers/BuildingLayerRenderer';
import { CloudLayerRenderer } from '@earthstudio/engine/Layers/CloudLayerRenderer';
import { GridlinesLayerRenderer } from '@earthstudio/engine/Layers/GridlinesLayerRenderer';
import { FeatureRenderer } from '@earthstudio/engine/Features/FeatureRenderer';

// ─── 画布内的 Three.js 场景 ───────────────────────

function EarthScene() {
  const { gl, camera, scene, size } = useThree();
  const globeRef = useRef<Globe | null>(null);
  const earthCameraRef = useRef<EarthCamera | null>(null);
  const featureRendererRef = useRef<FeatureRenderer | null>(null);

  useEffect(() => {
    // 创建 Globe（内部管理自己的场景）
    const globe = new Globe({
      container: gl.domElement.parentElement!,
      mapStyle: mapStyleStore.mapStyle,
    });
    globeRef.current = globe;

    // 创建 EarthCamera（封装 Three.js 相机）
    const earthCamera = new EarthCamera();
    earthCameraRef.current = earthCamera;

    // 绑定来自 R3F 的 Three.js 相机
    globe.setThreeCamera(camera as THREE.PerspectiveCamera);

    // 创建要素渲染器
    featureRendererRef.current = new FeatureRenderer(globe);

    // 注册图层
    layerStore.layers.forEach((layer) => {
      if (layer.visible) {
        globe.addLayer(createLayerRenderer(layer));
      }
    });

    // 启动动画循环
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const dt = clock.getDelta();
      earthCamera.update(performance.now());
      globe.refresh();
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      globe.dispose();
    };
  }, []);

  // 将相机 store 同步回 EarthCamera
  useEffect(() => {
    if (!earthCameraRef.current) return;
    earthCameraRef.current.setState(cameraStore.cameraState);
  }, [cameraStore.cameraState]);

  // 调整大小处理
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.resize(size.width, size.height);
    }
    if (earthCameraRef.current) {
      earthCameraRef.current.resizeAspect(size.width, size.height);
    }
  }, [size]);

  return null; // Globe 管理自己的渲染
}

function createLayerRenderer(layer: LayerStore): Layer {
  switch (layer.type) {
    case LayerType.SATELLITE:
      return new SatelliteLayerRenderer();
    case LayerType.BUILDINGS:
      return new BuildingLayerRenderer();
    case LayerType.CLOUDS:
      return new CloudLayerRenderer();
    case LayerType.GRIDLINES:
      return new GridlinesLayerRenderer();
    // ... 其他图层类型
    default:
      throw new Error(`Unknown layer type: ${layer.type}`);
  }
}

// ─── 导出组件 ─────────────────────────────────

export const EarthCanvas: React.FC = observer(() => {
  return (
    <div className="relative h-full w-full" id="earth-container">
      <Canvas
        camera={{
          fov: 35,
          near: 0.1,
          far: 6378137 * 10,
          position: [0, 0, 6378137 + 10000],
        }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <EarthScene />
      </Canvas>
    </div>
  );
});
```

---

### 阶段 2：命令 + 状态（第 3-4 周）— P0 关键

**目标：** 所有 34 个命令可调度，包含 60+ 个 MobX 存储的完整状态树，撤销/重做

#### Command 基类

```typescript
// packages/core/src/models/commands/Command.ts

import { Globe } from '@earthstudio/engine/Globe';
import { EarthCamera } from '@earthstudio/engine/EarthCamera';
import { CommandSource } from './CommandSource';
import { ValidationResult } from '../../validation/CommandValidator';

export type CommandHandlerContext = {
  globe: Globe;
  camera: EarthCamera;
  stores: CommandStoreAccessor;
};

export interface CommandStoreAccessor {
  getSearchStore(): SearchStore;
  getLayerStore(): LayerStore;
  getMapStyleStore(): MapStyleStore;
  getDocumentStore(): DocumentStore;
  getFeatureStore(): FeatureStore;
  getCameraStore(): CameraStore;
  getTimeMachineStore(): TimeMachineStore;
  getTimelapseStore(): TimelapseStore;
  getStreetViewStore(): StreetViewStore;
  getEarthMateStore(): EarthMateStore;
  getDesignStore(): DesignStore;
  getAnalysisStore(): AnalysisStore;
  getOnboardingStore(): OnboardingStore;
  getHomescreenStore(): HomescreenStore;
  getKnowledgeCardStore(): KnowledgeCardStore;
  getDrawingToolStore(): DrawingToolStore;
  getMeasureToolStore(): MeasureToolStore;
  getPinnedProjectsStore(): PinnedProjectsStore;
  getNavStore(): NavigationStore;
  // ... 所有其他存储
}

export abstract class Command {
  /** 唯一自动生成的命令 ID */
  readonly id: string = crypto.randomUUID();

  /** 命令创建时的 Unix 时间戳（毫秒） */
  readonly timestamp: number = Date.now();

  /** 触发此命令的来源 */
  source: CommandSource = CommandSource.UNKNOWN;

  /** 用于日志记录的描述性名称 */
  abstract readonly type: string;

  /** 此命令是否可撤销 */
  readonly undoable: boolean = true;

  /**
   * 在执行前验证命令参数。
   * 返回验证错误或成功。
   */
  abstract validate(): ValidationResult;

  /**
   * 执行命令。返回一个反向命令用于撤销支持，
   * 如果命令不可撤销则返回 null。
   */
  abstract execute(ctx: CommandHandlerContext): Command | null;

  /**
   * 序列化为 proto 有线格式，用于深度链接 / AI 生成。
   */
  abstract toProto(): ProtoCommand;

  /**
   * 用于历史记录面板的人类可读描述。
   */
  abstract toDescription(): string;
}
```

#### CommandDispatcher

```typescript
// packages/core/src/services/CommandDispatcher.ts

type CommandHandler = (cmd: Command, ctx: CommandHandlerContext) => Command | null;

export class CommandDispatcher {
  private handlers: Map<string, CommandHandler> = new Map();
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxUndoDepth: number = 100;

  private stores: CommandStoreAccessor;
  private globe: Globe;
  private camera: EarthCamera;

  constructor(
    globe: Globe,
    camera: EarthCamera,
    stores: CommandStoreAccessor
  ) {
    this.globe = globe;
    this.camera = camera;
    this.stores = stores;
    this.registerBuiltInHandlers();
  }

  // ─── 处理器注册 ──────────────────────────────

  register(type: string, handler: CommandHandler): void {
    if (this.handlers.has(type)) {
      console.warn(`Overwriting handler for ${type}`);
    }
    this.handlers.set(type, handler);
  }

  private registerBuiltInHandlers(): void {
    this.register('FlyToCamera', (cmd, ctx) => {
      const fc = cmd as FlyToCameraCommand;
      const prevState = ctx.camera.getState();

      fc.camera instanceof LookAtCamera
        ? ctx.camera.lookAt(fc.camera, { animation: fc.animation, presentation: fc.presentation })
        : ctx.camera.lookFrom(fc.camera, { animation: fc.animation, presentation: fc.presentation });

      ctx.getCameraStore().setState(ctx.camera.getState());

      return new FlyToCameraCommand({
        camera: LookAtCamera.fromState(prevState),
        animation: CameraAnimation.TELEPORT,
        presentation: CameraPresentationMode.STATIC,
      });
    });

    this.register('PerformSearch', (cmd, ctx) => {
      const sc = cmd as PerformSearchCommand;
      const prevQuery = ctx.getSearchStore().query;

      ctx.getSearchStore().performSearch(sc.query, sc.viewport);
      return new PerformSearchCommand({ query: prevQuery });
    });

    this.register('ToggleLayer', (cmd, ctx) => {
      const tc = cmd as ToggleLayerCommand;
      const layer = ctx.getLayerStore().getLayer(tc.layerType);
      if (!layer) return null;
      const prevVisible = layer.visible;

      ctx.getLayerStore().setLayerVisibility(tc.layerType, tc.enabled);
      ctx.globe.toggleLayer(tc.layerType, tc.enabled);

      return new ToggleLayerCommand({
        layerType: tc.layerType,
        enabled: !tc.enabled,
      });
    });

    this.register('SetBasemapStyle', (cmd, ctx) => {
      const sc = cmd as SetBasemapStyleCommand;
      const prevImagery = ctx.getMapStyleStore().mapStyle.imagery;

      ctx.getMapStyleStore().setImagery(sc.imagery);
      ctx.globe.setImagery(sc.imagery);

      return new SetBasemapStyleCommand({ imagery: prevImagery });
    });

    this.register('CreatePointPlacemark', (cmd, ctx) => {
      const cc = cmd as CreatePointPlacemarkCommand;
      const feature = ctx.getFeatureStore().createPointPlacemark(
        cc.latLngAlt,
        cc.altitudeMode
      );
      if (feature) {
        ctx.commandLogger?.log(cmd);
        return new DeleteFeatureCommand({
          documentKey: 0,
          featureId: feature.id,
        });
      }
      return null;
    });

    this.register('DeleteFeature', (cmd, ctx) => {
      const dc = cmd as DeleteFeatureCommand;
      // 在删除前捕获要素用于撤销
      const feature = ctx.getDocumentStore().getFeature(dc.featureId);
      ctx.getFeatureStore().deleteFeature(dc.featureId);

      return new CreateFeatureCommand({
        featureProperties: feature!.properties,
        featureStyle: feature!.style,
        documentKey: dc.documentKey,
      });
    });

    this.register('CreateFeature', (cmd, ctx) => {
      const cc = cmd as CreateFeatureCommand;
      const feature = ctx.getFeatureStore().createFeature(
        cc.featureProperties,
        cc.featureStyle,
        cc.documentKey
      );
      if (feature) {
        return new DeleteFeatureCommand({
          documentKey: cc.documentKey ?? 0,
          featureId: feature.id,
        });
      }
      return null;
    });

    this.register('EditFeature', (cmd, ctx) => {
      const ec = cmd as EditFeatureCommand;
      const prevFeature = ctx.getDocumentStore().getFeature(ec.featureId);
      ctx.getFeatureStore().updateFeature(ec.featureId, ec.featureProperties, ec.featureStyle);

      return new EditFeatureCommand({
        documentKey: ec.documentKey,
        featureId: ec.featureId,
        featureProperties: prevFeature?.properties,
        featureStyle: prevFeature?.style,
      });
    });

    this.register('EnterTimeMachine', (cmd, ctx) => {
      const tc = cmd as EnterTimeMachineCommand;
      ctx.getTimeMachineStore().enter(tc.date, tc.expanded, tc.timelapseEnabled);
      return null; // 不可撤销
    });

    this.register('EnterTimelapse', (cmd, ctx) => {
      const tc = cmd as EnterTimelapseCommand;
      ctx.getTimelapseStore().enter(tc.enabled, tc.expanded, tc.framerateMultiplier);
      return null;
    });

    this.register('EnterStreetView', (cmd, ctx) => {
      const sc = cmd as EnterStreetViewCommand;
      ctx.getStreetViewStore().enter(sc.latLngAlt);
      return null;
    });

    this.register('OpenKnowledgeCard', (cmd, ctx) => {
      const kc = cmd as OpenKnowledgeCardCommand;
      ctx.getKnowledgeCardStore().open(kc.placeId, kc.metadata, kc.cardSize);
      if (kc.flyToImmediately && kc.metadata?.coordinates) {
        ctx.camera.lookAt(new LookAtCamera({
          lat: kc.metadata.coordinates.lat,
          lng: kc.metadata.coordinates.lng,
          range: 500,
        }));
      }
      return new OpenKnowledgeCardCommand({ placeId: { fid: '' } }); // 关闭
    });

    this.register('OpenEarthMateChat', (cmd, ctx) => {
      const ec = cmd as OpenEarthMateChatCommand;
      ctx.getEarthMateStore().open(ec.isOpen, ec.initialQuery);
      return null;
    });

    this.register('ViewOnDemandAnalysis', (cmd, ctx) => {
      const ac = cmd as ViewOnDemandAnalysisCommand;
      ctx.getAnalysisStore().open(ac.analysis);
      return null;
    });

    this.register('OpenImageGenerator', (cmd, ctx) => {
      const ic = cmd as OpenImageGeneratorCommand;
      ctx.getEarthMateStore().openImageGenerator(ic.initialQuery);
      return null;
    });

    // ... 剩余约 20 个命令（OpenCloudProject, ViewDesign 等）
  }

  // ─── 调度 ──────────────────────────────────────────

  dispatch(cmd: Command, source: CommandSource = CommandSource.USER): void {
    cmd.source = source;

    // 验证
    const validation = cmd.validate();
    if (!validation.valid) {
      console.error('Command validation failed:', validation.errors);
      throw new CommandValidationError(validation.errors);
    }

    // 执行
    const handler = this.handlers.get(cmd.type);
    if (!handler) {
      throw new Error(`No handler registered for ${cmd.type}`);
    }

    const ctx: CommandHandlerContext = {
      globe: this.globe,
      camera: this.camera,
      stores: this.stores,
    };

    try {
      const inverse = handler(cmd, ctx);

      if (cmd.undoable && inverse) {
        this.undoStack.push(inverse);
        if (this.undoStack.length > this.maxUndoDepth) {
          this.undoStack.shift();
        }
        this.redoStack = []; // 新操作时清空重做栈
      }
    } catch (error) {
      console.error(`Command ${cmd.type} failed:`, error);
      throw error;
    }
  }

  // ─── 撤销 / 重做 ───────────────────────────────────────

  undo(): boolean {
    if (this.undoStack.length === 0) return false;
    const inverse = this.undoStack.pop()!;
    this.redoStack.push(inverse);
    this.dispatch(inverse, CommandSource.UNDO);
    return true;
  }

  redo(): boolean {
    if (this.redoStack.length === 0) return false;
    const cmd = this.redoStack.pop()!;
    this.dispatch(cmd, CommandSource.REDO);
    return true;
  }

  canUndo(): boolean { return this.undoStack.length > 0; }
  canRedo(): boolean { return this.redoStack.length > 0; }

  // ─── 批量调度 ────────────────────────────────────

  dispatchBatch(commands: Command[]): void {
    // 将命令组合为单个可撤销单元
    const inverseCommands: Command[] = [];
    for (const cmd of commands) {
      const handler = this.handlers.get(cmd.type);
      if (!handler) continue;
      const ctx: CommandHandlerContext = {
        globe: this.globe,
        camera: this.camera,
        stores: this.stores,
      };
      const inverse = handler(cmd, ctx);
      if (inverse) inverseCommands.push(inverse);
    }

    if (inverseCommands.length > 0) {
      this.undoStack.push({
        undo: () => {
          for (const inv of inverseCommands.reverse()) {
            this.dispatch(inv);
          }
        },
      } as unknown as Command);
    }
  }

  // ─── 深度链接序列化 ───────────────────────────

  serializeState(): string {
    const state = {
      camera: this.camera.getState(),
      layers: this.stores.getLayerStore().serialize(),
      mapStyle: this.stores.getMapStyleStore().serialize(),
      search: this.stores.getSearchStore().serialize(),
      document: this.stores.getDocumentStore().serialize(),
    };
    return btoa(JSON.stringify(state));
  }

  deserializeState(encoded: string): void {
    const state = JSON.parse(atob(encoded));
    // 通过命令恢复状态
    if (state.camera) {
      this.dispatch(new FlyToCameraCommand({
        camera: LookAtCamera.fromState(state.camera),
        animation: CameraAnimation.TELEPORT,
      }));
    }
    if (state.mapStyle) {
      this.dispatch(new SetBasemapStyleCommand({ imagery: state.mapStyle.imagery }));
    }
    // ... 恢复图层、搜索等
  }
}
```

#### MobX 存储（基础 5 个，后续几周扩展到 60+ 个）

```typescript
// packages/client/src/stores/CameraStore.ts

import { makeAutoObservable } from 'mobx';
import { CameraState } from '@earthstudio/engine/EarthCamera';

export class CameraStore {
  lat: number = 0;
  lng: number = 0;
  alt: number = 10000;
  heading: number = 0;
  tilt: number = 45;
  roll: number = 0;
  fovy: number = 35;
  isAnimating: boolean = false;

  constructor() {
    makeAutoObservable(this);
  }

  setState(state: CameraState): void {
    Object.assign(this, state);
  }

  get cameraState(): CameraState {
    return {
      lat: this.lat,
      lng: this.lng,
      alt: this.alt,
      heading: this.heading,
      tilt: this.tilt,
      roll: this.roll,
      fovy: this.fovy,
    };
  }

  serialize(): string {
    return JSON.stringify(this.cameraState);
  }

  deserialize(data: string): void {
    const state = JSON.parse(data) as CameraState;
    this.setState(state);
  }
}

export const cameraStore = new CameraStore();
```

```typescript
// packages/client/src/stores/SearchStore.ts

import { makeAutoObservable, observable, action, computed } from 'mobx';
import { SearchResult, LatLonBox } from '@earthstudio/core/models/geometry/LatLonBox';

export interface SearchState {
  query: string;
  results: SearchResult[];
  isSearching: boolean;
  isPanelOpen: boolean;
  resultGroupId?: string;
  viewport?: LatLonBox;
  selectedResultIndex: number;
  history: string[];
}

export class SearchStore implements SearchState {
  query: string = '';
  results: SearchResult[] = [];
  isSearching: boolean = false;
  isPanelOpen: boolean = false;
  resultGroupId?: string = undefined;
  viewport?: LatLonBox = undefined;
  selectedResultIndex: number = -1;
  history: string[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  @action
  setQuery(query: string): void {
    this.query = query;
  }

  @action
  async performSearch(query: string, viewport?: LatLonBox): Promise<void> {
    this.query = query;
    this.viewport = viewport;
    this.isSearching = true;
    this.selectedResultIndex = -1;

    try {
      const params = new URLSearchParams({ q: query });
      if (viewport) {
        params.set('bbox', `${viewport.west},${viewport.south},${viewport.east},${viewport.north}`);
      }
      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();
      this.results = data.results;
      this.resultGroupId = data.resultGroupId;
      this.isPanelOpen = true;
    } catch (error) {
      console.error('搜索失败:', error);
      this.results = [];
    } finally {
      this.isSearching = false;
    }
  }

  @action
  selectResult(index: number): void {
    this.selectedResultIndex = index;
  }

  @computed
  get selectedResult(): SearchResult | null {
    if (this.selectedResultIndex >= 0 && this.selectedResultIndex < this.results.length) {
      return this.results[this.selectedResultIndex];
    }
    return null;
  }

  @action
  togglePanel(open?: boolean): void {
    this.isPanelOpen = open ?? !this.isPanelOpen;
  }

  @action
  addToHistory(query: string): void {
    if (this.history.includes(query)) {
      this.history = this.history.filter((h) => h !== query);
    }
    this.history.unshift(query);
    if (this.history.length > 50) {
      this.history = this.history.slice(0, 50);
    }
  }

  @action
  clearHistory(): void {
    this.history = [];
  }

  @action
  removeFromHistory(query: string): void {
    this.history = this.history.filter((h) => h !== query);
  }

  serialize(): string {
    return JSON.stringify({
      query: this.query,
      isPanelOpen: this.isPanelOpen,
      history: this.history,
    });
  }
}

export const searchStore = new SearchStore();
```

```typescript
// packages/client/src/stores/LayerStore.ts

import { makeAutoObservable, action } from 'mobx';
import { LayerType } from '@earthstudio/core/models/layers/Layer';

export interface LayerState {
  layerType: LayerType;
  name: string;
  visible: boolean;
  opacity: number;
}

export class LayerStore {
  layers: Map<LayerType, LayerState> = new Map();

  constructor() {
    makeAutoObservable(this);

    // 使用默认图层状态初始化
    this.initializeDefaults();
  }

  private initializeDefaults(): void {
    const defaults: LayerState[] = [
      { layerType: LayerType.BUILDINGS, name: '3D 建筑', visible: true, opacity: 1 },
      { layerType: LayerType.CLOUDS, name: '云层', visible: true, opacity: 0.5 },
      { layerType: LayerType.GRIDLINES, name: '经纬网', visible: false, opacity: 1 },
      { layerType: LayerType.PHOTOS, name: '照片', visible: false, opacity: 1 },
      { layerType: LayerType.THREE_D_COVERAGE, name: '3D 覆盖范围', visible: false, opacity: 1 },
      { layerType: LayerType.UPDATED_IMAGERY, name: '更新的影像', visible: false, opacity: 1 },
      { layerType: LayerType.LAND_PARCELS, name: '地块', visible: false, opacity: 1 },
      { layerType: LayerType.PINNED_PROJECTS, name: '置顶项目', visible: true, opacity: 1 },
      { layerType: LayerType.DISCOVERY, name: 'Voyager', visible: false, opacity: 1 },
    ];

    for (const layer of defaults) {
      this.layers.set(layer.layerType, layer);
    }
  }

  @action
  setLayerVisibility(layerType: LayerType, visible: boolean): void {
    const layer = this.layers.get(layerType);
    if (layer) {
      layer.visible = visible;
    }
  }

  @action
  toggleLayer(layerType: LayerType): void {
    const layer = this.layers.get(layerType);
    if (layer) {
      layer.visible = !layer.visible;
    }
  }

  @action
  setLayerOpacity(layerType: LayerType, opacity: number): void {
    const layer = this.layers.get(layerType);
    if (layer) {
      layer.opacity = Math.max(0, Math.min(1, opacity));
    }
  }

  getLayer(layerType: LayerType): LayerState | undefined {
    return this.layers.get(layerType);
  }

  get visibleLayers(): LayerState[] {
    return Array.from(this.layers.values()).filter((l) => l.visible);
  }

  get allLayers(): LayerState[] {
    return Array.from(this.layers.values());
  }

  serialize(): string {
    const data: Record<string, boolean> = {};
    for (const [type, layer] of this.layers) {
      data[type] = layer.visible;
    }
    return JSON.stringify(data);
  }
}

export const layerStore = new LayerStore();
```

```typescript
// packages/client/src/stores/MapStyleStore.ts

import { makeAutoObservable, action } from 'mobx';
import { MapStyle } from '@earthstudio/core/models/mapstyle/MapStyle';
import { Projection } from '@earthstudio/core/models/mapstyle/Projection';
import { Imagery } from '@earthstudio/core/models/mapstyle/Imagery';
import { ThreeDFeatures } from '@earthstudio/core/models/mapstyle/ThreeDFeatures';
import { GridlinesMode, BaseLayersPreset } from '@earthstudio/core/models/mapstyle/MapStyle';

export class MapStyleStore {
  mapStyle: MapStyle;

  constructor() {
    this.mapStyle = new MapStyle({
      projection: Projection.GLOBE,
      imagery: Imagery.SATELLITE,
      threeDFeatures: ThreeDFeatures.ALL,
      showClouds: true,
      useAnimatedClouds: false,
      gridlinesLayer: GridlinesMode.NONE,
      baseLayers: {
        preset: BaseLayersPreset.EXPLORATION,
        customFeatureCategory: [],
      },
      showThreeDCoverageLayer: false,
      showUpdatedImageryLayer: false,
      showLandParcelsLayer: false,
      showPinnedProjectsLayer: false,
      showDiscoveryLayer: false,
    });
    makeAutoObservable(this);
  }

  @action
  setImagery(imagery: Imagery): void {
    this.mapStyle = this.mapStyle.withImagery(imagery);
  }

  @action
  setProjection(projection: Projection): void {
    this.mapStyle = this.mapStyle.withProjection(projection);
  }

  @action
  setThreeDFeatures(tdf: ThreeDFeatures): void {
    this.mapStyle = this.mapStyle.withThreeDFeatures(tdf);
  }

  @action
  setClouds(show: boolean): void {
    this.mapStyle = this.mapStyle.withClouds(show);
  }

  @action
  setGridlines(mode: GridlinesMode): void {
    this.mapStyle = this.mapStyle.withGridlines(mode);
  }

  @action
  applyPreset(preset: BaseLayersPreset): void {
    this.mapStyle = this.mapStyle.applyPreset(preset);
  }

  @action
  setMapStyle(style: MapStyle): void {
    this.mapStyle = style;
  }

  serialize(): string {
    return JSON.stringify(this.mapStyle.toProto());
  }
}

export const mapStyleStore = new MapStyleStore();
```

```typescript
// packages/client/src/stores/FeatureStore.ts

import { makeAutoObservable, action, computed } from 'mobx';
import { Feature } from '@earthstudio/core/models/features/Feature';
import { Placemark } from '@earthstudio/core/models/features/Placemark';
import { LatLngAlt } from '@earthstudio/core/models/geometry/LatLngAlt';
import { AltitudeMode } from '@earthstudio/core/models/features/Feature';
import { FeatureProperties } from '@earthstudio/core/models/features/Feature';
import { FeatureStyle } from '@earthstudio/core/models/styles/ContentStyle';

export class FeatureStore {
  features: Map<string, Feature> = new Map();
  selectedFeatureIds: Set<string> = new Set();
  editingFeatureId: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  @action
  createPointPlacemark(latLngAlt: LatLngAlt, altitudeMode: AltitudeMode = AltitudeMode.CLAMP_TO_GROUND): Feature | null {
    const feature = new Placemark({
      geometry: { type: 'Point', coordinates: [latLngAlt.lng, latLngAlt.lat] },
      altitudeMode,
      name: '未命名地标',
    });

    this.features.set(feature.id, feature);
    this.selectedFeatureIds.clear();
    this.selectedFeatureIds.add(feature.id);
    this.editingFeatureId = feature.id;

    // 持久化到服务器
    this._persistCreate(feature);
    return feature;
  }

  @action
  createFeature(
    properties: FeatureProperties,
    style?: FeatureStyle,
    documentKey?: number
  ): Feature | null {
    const feature = Feature.fromProperties(properties, style);
    this.features.set(feature.id, feature);
    this._persistCreate(feature);
    return feature;
  }

  @action
  updateFeature(
    featureId: string,
    properties?: FeatureProperties,
    style?: FeatureStyle
  ): void {
    const feature = this.features.get(featureId);
    if (!feature) return;
    if (properties) feature.updateProperties(properties);
    if (style) feature.updateStyle(style);
    this._persistUpdate(featureId, properties, style);
  }

  @action
  deleteFeature(featureId: string): void {
    this.features.delete(featureId);
    this.selectedFeatureIds.delete(featureId);
    if (this.editingFeatureId === featureId) {
      this.editingFeatureId = null;
    }
    this._persistDelete(featureId);
  }

  @action
  selectFeature(featureId: string, multi: boolean = false): void {
    if (!multi) this.selectedFeatureIds.clear();
    this.selectedFeatureIds.add(featureId);
  }

  @action
  deselectFeature(featureId: string): void {
    this.selectedFeatureIds.delete(featureId);
  }

  @action
  setEditing(featureId: string | null): void {
    this.editingFeatureId = featureId;
  }

  @computed
  get selectedFeatures(): Feature[] {
    return Array.from(this.selectedFeatureIds)
      .map((id) => this.features.get(id))
      .filter(Boolean) as Feature[];
  }

  @computed
  get editingFeature(): Feature | null {
    if (!this.editingFeatureId) return null;
    return this.features.get(this.editingFeatureId) ?? null;
  }

  // ─── 持久化 ───────────────────────────────────────

  private async _persistCreate(feature: Feature): Promise<void> {
    await fetch('/api/features', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feature.toCreateRequest()),
    });
  }

  private async _persistUpdate(
    featureId: string,
    properties?: FeatureProperties,
    style?: FeatureStyle
  ): Promise<void> {
    await fetch(`/api/features/${featureId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ properties, style }),
    });
  }

  private async _persistDelete(featureId: string): Promise<void> {
    await fetch(`/api/features/${featureId}`, { method: 'DELETE' });
  }
}

export const featureStore = new FeatureStore();
```

```typescript
// packages/client/src/stores/DocumentStore.ts

import { makeAutoObservable, action } from 'mobx';
import { Document, DocumentMetadata } from '@earthstudio/core/models/document/Document';

export class DocumentStore {
  currentDocument: Document | null = null;
  documents: DocumentMetadata[] = [];
  isLoading: boolean = false;
  isSaving: boolean = false;
  hasUnsavedChanges: boolean = false;

  constructor() {
    makeAutoObservable(this);
  }

  @action
  async loadDocument(documentId: string): Promise<void> {
    this.isLoading = true;
    try {
      const response = await fetch(`/api/documents/${documentId}`);
      const data = await response.json();
      this.currentDocument = Document.fromServerResponse(data);
      this.hasUnsavedChanges = false;
    } finally {
      this.isLoading = false;
    }
  }

  @action
  async createDocument(title: string, namespace: string = 'EARTH'): Promise<Document> {
    const response = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, namespace }),
    });
    const data = await response.json();
    this.currentDocument = Document.fromServerResponse(data.document);
    return this.currentDocument;
  }

  @action
  async listDocuments(): Promise<void> {
    const response = await fetch('/api/documents');
    const data = await response.json();
    this.documents = data.documents.map(DocumentMetadata.fromServerResponse);
  }

  @action
  async saveDocument(): Promise<void> {
    if (!this.currentDocument) return;
    this.isSaving = true;
    try {
      await fetch(`/api/documents/${this.currentDocument.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.currentDocument.toUpdateRequest()),
      });
      this.hasUnsavedChanges = false;
    } finally {
      this.isSaving = false;
    }
  }

  @action
  async deleteDocument(documentId: string): Promise<void> {
    await fetch(`/api/documents/${documentId}`, { method: 'DELETE' });
    if (this.currentDocument?.id === documentId) {
      this.currentDocument = null;
    }
    this.documents = this.documents.filter((d) => d.id !== documentId);
  }

  getFeature(featureId: string): Feature | null {
    return this.currentDocument?.getFeature(featureId) ?? null;
  }

  serialize(): string {
    return this.currentDocument?.id ?? '';
  }
}

export const documentStore = new DocumentStore();
```

---

### 阶段 3：内容创建（第 5-6 周）— P1 高

**目标：** 完整的地球上要素 CRUD，KML 导入/导出，要素树，样式编辑器

#### 要素模型（完整实现）

```typescript
// packages/core/src/models/features/Feature.ts

import { v4 as uuidv4 } from 'uuid';
import { FeatureType, FeatureOrigin, AltitudeMode } from './enums';
import { FeatureStyle } from '../styles/ContentStyle';
import { Media } from '../media/Media';
import { FeatureRestrictions } from './FeatureRestrictions';
import { DocumentSchema } from '../document/DocumentSchema';
import { GeoJSON } from '../geometry/GeoJSON';
import { ThreeDAsset } from './ThreeDAsset';
import { CommandAdapter } from '@earthstudio/proto/adapters/CommandAdapter';

export type FeatureProperties = Partial<{
  name: string;
  description: string;
  snippet: string;
  visibility: boolean;
  isOpen: boolean;
  altitudeMode: AltitudeMode;
  altitude: number;
  geometry: GeoJSON;
  address: string;
  phoneNumber: string;
  extendedProperties: Record<string, unknown>;
}>;

export abstract class Feature {
  readonly id: string;
  readonly featureType: FeatureType;
  name: string;
  description: string;
  snippet: string;
  visibility: boolean;
  isOpen: boolean;
  featureOrigin: FeatureOrigin;
  altitudeMode: AltitudeMode;
  altitude: number;
  style?: FeatureStyle;
  restrictions: FeatureRestrictions;
  media: Media[];
  schema?: DocumentSchema;
  extendedProperties: Record<string, unknown>;
  parentId?: string;
  sortIndex: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: FeatureProperties & { featureType: FeatureType; id?: string }) {
    this.id = props.id ?? uuidv4();
    this.featureType = props.featureType;
    this.name = props.name ?? '';
    this.description = props.description ?? '';
    this.snippet = props.snippet ?? '';
    this.visibility = props.visibility ?? true;
    this.isOpen = props.isOpen ?? true;
    this.featureOrigin = props.featureOrigin ?? FeatureOrigin.USER;
    this.altitudeMode = props.altitudeMode ?? AltitudeMode.CLAMP_TO_GROUND;
    this.altitude = props.altitude ?? 0;
    this.media = [];
    this.restrictions = new FeatureRestrictions();
    this.extendedProperties = props.extendedProperties ?? {};
    this.sortIndex = 0;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  abstract get geometry(): GeoJSON | undefined;

  updateProperties(props: FeatureProperties): void {
    if (props.name !== undefined) this.name = props.name;
    if (props.description !== undefined) this.description = props.description;
    if (props.visibility !== undefined) this.visibility = props.visibility;
    if (props.altitudeMode !== undefined) this.altitudeMode = props.altitudeMode;
    if (props.altitude !== undefined) this.altitude = props.altitude;
    if (props.extendedProperties) {
      this.extendedProperties = { ...this.extendedProperties, ...props.extendedProperties };
    }
    this.updatedAt = new Date();
  }

  updateStyle(style: FeatureStyle): void {
    this.style = style;
    this.updatedAt = new Date();
  }

  addMedia(media: Media): void {
    this.media.push(media);
    this.updatedAt = new Date();
  }

  removeMedia(mediaId: string): void {
    this.media = this.media.filter((m) => m.id !== mediaId);
    this.updatedAt = new Date();
  }

  abstract toProto(): unknown;
  abstract toCreateRequest(): Record<string, unknown>;

  static fromProperties(properties: FeatureProperties, style?: FeatureStyle): Feature {
    if (properties.geometry?.type === 'Point') {
      const [lng, lat] = properties.geometry.coordinates as number[];
      return new Placemark({
        geometry: properties.geometry,
        name: properties.name,
        description: properties.description,
        altitudeMode: properties.altitudeMode,
        altitude: properties.altitude,
        style,
      });
    }
    if (properties.geometry?.type === 'LineString') {
      return new Polyline({
        coordinates: properties.geometry.coordinates as [number, number][],
        name: properties.name,
        style,
      });
    }
    if (properties.geometry?.type === 'Polygon') {
      return new Polygon({
        outerBoundary: properties.geometry.coordinates[0] as [number, number][],
        name: properties.name,
        style,
      });
    }
    return new Folder({ name: properties.name });
  }
}
```

```typescript
// packages/core/src/models/features/Placemark.ts

import { Feature, FeatureProperties } from './Feature';
import { FeatureType } from './enums';
import { GeoJSON } from '../geometry/GeoJSON';
import { LatLngAlt } from '../geometry/LatLngAlt';
import { LookAtCamera } from '../camera/LookAtCamera';

export class Placemark extends Feature {
  point: LatLngAlt;
  camera?: LookAtCamera;
  address?: string;
  phoneNumber?: string;

  constructor(props: {
    id?: string;
    geometry?: GeoJSON;
    name?: string;
    description?: string;
    altitudeMode?: AltitudeMode;
    altitude?: number;
    style?: FeatureStyle;
    camera?: LookAtCamera;
    address?: string;
    phoneNumber?: string;
  }) {
    super({
      ...props,
      featureType: FeatureType.PLACEMARK,
      id: props.id,
    });

    if (props.geometry?.type === 'Point') {
      const [lng, lat, alt] = props.geometry.coordinates as number[];
      this.point = { lat, lng, alt: alt ?? 0 };
    } else {
      this.point = { lat: 0, lng: 0, alt: 0 };
    }

    this.camera = props.camera;
    this.address = props.address;
    this.phoneNumber = props.phoneNumber;
  }

  get geometry(): GeoJSON | undefined {
    return {
      type: 'Point',
      coordinates: this.altitude
        ? [this.point.lng, this.point.lat, this.point.alt]
        : [this.point.lng, this.point.lat],
    };
  }

  get lat(): number { return this.point.lat; }
  get lng(): number { return this.point.lng; }
  get alt(): number { return this.point.alt; }

  toProto(): unknown {
    return {
      modelType: 'PLACEMARK',
      name: this.name,
      description: this.description,
      visibility: this.visibility,
      featureOrigin: this.featureOrigin,
      geometry: {
        point: {
          coordinates: [
            { latitude: this.lat, longitude: this.lng },
          ],
        },
      },
      altitudeMode: this.altitudeMode,
      style: this.style?.toProto(),
      camera: this.camera?.toProto(),
      address: this.address,
      phoneNumber: this.phoneNumber,
    };
  }

  toCreateRequest(): Record<string, unknown> {
    return {
      featureType: 'PLACEMARK',
      name: this.name,
      description: this.description,
      geometry: this.geometry,
      altitudeMode: this.altitudeMode,
      altitude: this.altitude,
      styleData: this.style?.toJson(),
      camera: this.camera?.toProto(),
      address: this.address,
      phoneNumber: this.phoneNumber,
    };
  }
}
```

```typescript
// packages/core/src/models/features/Polyline.ts

import { Feature, FeatureProperties } from './Feature';
import { FeatureType } from './enums';
import { GeoJSON } from '../geometry/GeoJSON';

export class Polyline extends Feature {
  coordinates: [number, number, number?][];
  tessellate: boolean;
  extrude: boolean;

  constructor(props: {
    id?: string;
    coordinates: [number, number, number?][];
    name?: string;
    description?: string;
    altitudeMode?: AltitudeMode;
    style?: FeatureStyle;
    tessellate?: boolean;
    extrude?: boolean;
  }) {
    super({
      ...props,
      featureType: FeatureType.POLYLINE,
      id: props.id,
    });
    this.coordinates = props.coordinates;
    this.tessellate = props.tessellate ?? false;
    this.extrude = props.extrude ?? false;
  }

  get geometry(): GeoJSON | undefined {
    return {
      type: 'LineString',
      coordinates: this.coordinates.map((c) =>
        c.length === 2 ? [c[0], c[1]] : [c[0], c[1], c[2] ?? 0]
      ),
    };
  }

  toProto(): unknown {
    return {
      modelType: 'POLYLINE',
      name: this.name,
      visibility: this.visibility,
      geometry: {
        polyline: {
          coordinates: this.coordinates.map((c) => ({
            longitude: c[0],
            latitude: c[1],
            altitude: c[2] ?? 0,
          })),
        },
      },
      style: this.style?.toProto(),
    };
  }

  toCreateRequest(): Record<string, unknown> {
    return {
      featureType: 'POLYLINE',
      name: this.name,
      geometry: this.geometry,
      altitudeMode: this.altitudeMode,
      styleData: this.style?.toJson(),
    };
  }
}
```

```typescript
// packages/core/src/models/features/Polygon.ts

import { Feature, FeatureProperties } from './Feature';
import { FeatureType } from './enums';
import { GeoJSON } from '../geometry/GeoJSON';

export class Polygon extends Feature {
  outerBoundary: [number, number, number?][];
  innerBoundaries: [number, number, number?][][];
  extrude: boolean;
  tessellate: boolean;

  constructor(props: {
    id?: string;
    outerBoundary: [number, number, number?][];
    innerBoundaries?: [number, number, number?][][];
    name?: string;
    description?: string;
    altitudeMode?: AltitudeMode;
    style?: FeatureStyle;
    extrude?: boolean;
    tessellate?: boolean;
  }) {
    super({
      ...props,
      featureType: FeatureType.POLYGON,
      id: props.id,
    });
    this.outerBoundary = props.outerBoundary;
    this.innerBoundaries = props.innerBoundaries ?? [];
    this.extrude = props.extrude ?? false;
    this.tessellate = props.tessellate ?? false;
  }

  get geometry(): GeoJSON | undefined {
    return {
      type: 'Polygon',
      coordinates: [
        this.outerBoundary.map((c) =>
          c.length === 2 ? [c[0], c[1]] : [c[0], c[1], c[2] ?? 0]
        ),
        ...this.innerBoundaries.map((ring) =>
          ring.map((c) =>
            c.length === 2 ? [c[0], c[1]] : [c[0], c[1], c[2] ?? 0]
          )
        ),
      ],
    };
  }

  toProto(): unknown {
    return {
      modelType: 'POLYGON',
      name: this.name,
      visibility: this.visibility,
      geometry: {
        polygon: {
          outerBoundary: this.outerBoundary.map((c) => ({
            longitude: c[0],
            latitude: c[1],
            altitude: c[2] ?? 0,
          })),
          innerBoundary: this.innerBoundaries.map((ring) =>
            ring.map((c) => ({
              longitude: c[0],
              latitude: c[1],
              altitude: c[2] ?? 0,
            }))
          ),
        },
      },
      style: this.style?.toProto(),
    };
  }

  toCreateRequest(): Record<string, unknown> {
    return {
      featureType: 'POLYGON',
      name: this.name,
      geometry: this.geometry,
      altitudeMode: this.altitudeMode,
      styleData: this.style?.toJson(),
    };
  }
}
```

```typescript
// packages/core/src/models/features/Folder.ts

import { Feature, FeatureProperties } from './Feature';
import { FeatureType } from './enums';
import { GeoJSON } from '../geometry/GeoJSON';

export class Folder extends Feature {
  children: Feature[];

  constructor(props: {
    id?: string;
    name?: string;
    description?: string;
    visibility?: boolean;
    children?: Feature[];
  }) {
    super({
      ...props,
      featureType: FeatureType.FOLDER,
      id: props.id,
    });
    this.children = props.children ?? [];
    this.isOpen = true;
  }

  get geometry(): GeoJSON | undefined {
    return undefined; // 文件夹没有几何
  }

  addChild(feature: Feature, index?: number): void {
    feature.parentId = this.id;
    if (index !== undefined) {
      this.children.splice(index, 0, feature);
    } else {
      this.children.push(feature);
    }
    this.updatedAt = new Date();
  }

  removeChild(featureId: string): Feature | null {
    const index = this.children.findIndex((c) => c.id === featureId);
    if (index === -1) return null;
    const [removed] = this.children.splice(index, 1);
    this.updatedAt = new Date();
    return removed;
  }

  get allDescendants(): Feature[] {
    const result: Feature[] = [];
    for (const child of this.children) {
      result.push(child);
      if (child instanceof Folder) {
        result.push(...child.allDescendants);
      }
    }
    return result;
  }

  toProto(): unknown {
    return {
      modelType: 'FOLDER',
      name: this.name,
      visibility: this.visibility,
      isOpen: this.isOpen,
      features: this.children.map((c) => c.toProto()),
    };
  }

  toCreateRequest(): Record<string, unknown> {
    return {
      featureType: 'FOLDER',
      name: this.name,
      visibility: this.visibility,
      children: this.children.map((c) => c.toCreateRequest()),
    };
  }
}
```

```typescript
// packages/core/src/models/features/FeatureTree.ts

export class FeatureTree {
  root: Folder;

  constructor(name: string = 'Root') {
    this.root = new Folder({ name });
  }

  /** 在树中按 ID 查找要素 */
  findFeature(featureId: string, node: Feature = this.root): Feature | null {
    if (node.id === featureId) return node;
    if (node instanceof Folder) {
      for (const child of node.children) {
        const found = this.findFeature(featureId, child);
        if (found) return found;
      }
    }
    return null;
  }

  /** 获取所有要素的扁平列表 */
  getAllFeatures(): Feature[] {
    return this.root.allDescendants;
  }

  /** 按类型统计要素 */
  countByType(): Map<FeatureType, number> {
    const counts = new Map<FeatureType, number>();
    for (const feature of this.getAllFeatures()) {
      counts.set(feature.featureType, (counts.get(feature.featureType) ?? 0) + 1);
    }
    return counts;
  }

  /** 在其父级中重新排序要素 */
  reorder(featureId: string, newIndex: number): boolean {
    const feature = this.findFeature(featureId);
    if (!feature || !feature.parentId) return false;
    const parent = this.findFeature(feature.parentId);
    if (!(parent instanceof Folder)) return false;

    const oldIndex = parent.children.findIndex((c) => c.id === featureId);
    if (oldIndex === -1) return false;

    parent.children.splice(oldIndex, 1);
    parent.children.splice(newIndex, 0, feature);
    return true;
  }

  /** 将整个树序列化为 proto 格式 */
  toProto(): unknown {
    return {
      featureTree: this.root.toProto(),
    };
  }
}
```

#### KML 解析器

```typescript
// packages/core/src/services/KmlParser.ts

import { DOMParser as XmldomDOMParser } from '@xmldom/xmldom';
import { FeatureTree } from '../models/features/FeatureTree';
import { Placemark } from '../models/features/Placemark';
import { Polyline } from '../models/features/Polyline';
import { Polygon } from '../models/features/Polygon';
import { Folder } from '../models/features/Folder';
import { GroundOverlay } from '../models/features/GroundOverlay';
import { Feature } from '../models/features/Feature';
import { ContentStyle, PointStyle, PolylineStyle, PolygonStyle, BalloonStyle, LabelStyle } from '../models/styles/ContentStyle';
import { AltitudeMode, FeatureOrigin } from '../models/features/enums';
import { Color } from '../models/styles/Color';

export interface KmlParseResult {
  tree: FeatureTree;
  errors: KmlParseError[];
  warnings: KmlParseWarning[];
}

export interface KmlParseError {
  line: number;
  message: string;
  element?: string;
}

export interface KmlParseWarning {
  line: number;
  message: string;
}

export class KmlParser {
  private errors: KmlParseError[] = [];
  private warnings: KmlParseWarning[] = [];

  parse(kmlString: string): KmlParseResult {
    this.errors = [];
    this.warnings = [];

    const parser = new XmldomDOMParser();
    const doc = parser.parseFromString(kmlString, 'text/xml');

    // 检查解析错误
    const parseError = doc.getElementsByTagName('parsererror');
    if (parseError.length > 0) {
      this.errors.push({
        line: 0,
        message: parseError[0].textContent ?? 'XML 解析错误',
      });
      return { tree: new FeatureTree(), errors: this.errors, warnings: this.warnings };
    }

    const kml = doc.getElementsByTagName('kml')[0];
    if (!kml) {
      this.errors.push({ line: 0, message: '未找到 <kml> 根元素' });
      return { tree: new FeatureTree(), errors: this.errors, warnings: this.warnings };
    }

    const document = kml.getElementsByTagName('Document')[0];
    const tree = new FeatureTree(
      document?.getElementsByTagName('name')[0]?.textContent ?? '导入的 KML'
    );

    // 解析 Document 级别的子元素
    if (document) {
      this.parseContainer(document, tree.root);
    } else {
      // 尝试直接在 <kml> 下查找 <Placemark>
      this.parseContainer(kml, tree.root);
    }

    return { tree, errors: this.errors, warnings: this.warnings };
  }

  private parseContainer(container: Element, parentFolder: Folder): void {
    const childNodes = container.childNodes;
    for (let i = 0; i < childNodes.length; i++) {
      const node = childNodes[i];
      if (node.nodeType !== 1) continue; // 跳过非元素节点

      const el = node as Element;
      const tagName = el.tagName.toLowerCase();

      try {
        switch (tagName) {
          case 'folder':
            parentFolder.addChild(this.parseFolder(el));
            break;
          case 'placemark':
            parentFolder.addChild(this.parsePlacemark(el));
            break;
          case 'groundoverlay':
            parentFolder.addChild(this.parseGroundOverlay(el));
            break;
          case 'document':
            // 嵌套文档 — 作为文件夹处理
            parentFolder.addChild(this.parseFolder(el));
            break;
          case 'style':
          case 'stylemap':
            // 样式单独解析并应用
            break;
          case 'screenoverlay':
          case 'photooverlay':
          case 'networklink':
          case 'tour':
            this.warnings.push({
              line: 0,
              message: `跳过不支持的元素: <${tagName}>`,
            });
            break;
        }
      } catch (error) {
        this.errors.push({
          line: 0,
          message: `解析 <${tagName}> 时出错: ${(error as Error).message}`,
          element: tagName,
        });
      }
    }
  }

  private parseFolder(el: Element): Folder {
    const name = el.getElementsByTagName('name')[0]?.textContent ?? '未命名文件夹';
    const folder = new Folder({ name });

    this.parseContainer(el, folder);
    return folder;
  }

  private parsePlacemark(el: Element): Feature {
    const name = el.getElementsByTagName('name')[0]?.textContent ?? '未命名地标';
    const description = el.getElementsByTagName('description')[0]?.textContent ?? '';

    // 检查几何类型
    const point = el.getElementsByTagName('Point')[0];
    const lineString = el.getElementsByTagName('LineString')[0];
    const polygon = el.getElementsByTagName('Polygon')[0];

    const style = this.parseStyle(el);

    if (point) {
      return this.parsePointPlacemark(el, name, description, point, style);
    } else if (lineString) {
      return this.parsePolylineFeature(el, name, description, lineString, style);
    } else if (polygon) {
      return this.parsePolygonFeature(el, name, description, polygon, style);
    }

    // 无几何 — 作为文件夹处理
    this.warnings.push({
      line: 0,
      message: `地标 "${name}" 没有几何；作为文件夹处理`,
    });
    const folder = new Folder({ name, description });
    return folder;
  }

  private parsePointPlacemark(
    el: Element,
    name: string,
    description: string,
    pointEl: Element,
    style?: FeatureStyle
  ): Placemark {
    const coordinates = pointEl.getElementsByTagName('coordinates')[0]?.textContent?.trim();
    if (!coordinates) throw new Error('Point 中没有坐标');

    const parts = coordinates.split(',').map(Number);
    const altitudeMode = this.parseAltitudeMode(el);

    return new Placemark({
      geometry: {
        type: 'Point',
        coordinates: parts.length >= 3 ? [parts[0], parts[1], parts[2]] : [parts[0], parts[1]],
      },
      name,
      description,
      altitudeMode,
      altitude: parts[2],
      style,
    });
  }

  private parsePolylineFeature(
    el: Element,
    name: string,
    description: string,
    lineStrEl: Element,
    style?: FeatureStyle
  ): Polyline {
    const coordsText = lineStrEl.getElementsByTagName('coordinates')[0]?.textContent?.trim();
    if (!coordsText) throw new Error('LineString 中没有坐标');

    const coords = coordsText.split(/\s+/).map((pair) => {
      const parts = pair.split(',').map(Number);
      return parts.length >= 3
        ? [parts[0], parts[1], parts[2]] as [number, number, number]
        : [parts[0], parts[1]] as [number, number];
    });

    const tessellate = lineStrEl.getElementsByTagName('tessellate')[0]?.textContent === '1';
    const extrude = el.getElementsByTagName('extrude')[0]?.textContent === '1';
    const altitudeMode = this.parseAltitudeMode(el);

    return new Polyline({
      coordinates: coords,
      name,
      description,
      altitudeMode,
      tessellate,
      extrude,
      style,
    });
  }

  private parsePolygonFeature(
    el: Element,
    name: string,
    description: string,
    polygonEl: Element,
    style?: FeatureStyle
  ): Polygon {
    const outerEl = polygonEl.getElementsByTagName('outerBoundaryIs')[0];
    if (!outerEl) throw new Error('Polygon 没有 outerBoundaryIs');

    const outerCoordsText = outerEl
      .getElementsByTagName('coordinates')[0]
      ?.textContent?.trim();
    if (!outerCoordsText) throw new Error('outerBoundaryIs 中没有坐标');

    const parseRing = (text: string): [number, number, number?][] =>
      text.split(/\s+/).map((pair) => {
        const parts = pair.split(',').map(Number);
        return parts.length >= 3
          ? [parts[0], parts[1], parts[2]]
          : [parts[0], parts[1]];
      });

    const outerBoundary = parseRing(outerCoordsText);

    const innerEls = polygonEl.getElementsByTagName('innerBoundaryIs');
    const innerBoundaries = Array.from(innerEls).map((inner) => {
      const text = inner.getElementsByTagName('coordinates')[0]?.textContent?.trim() ?? '';
      return parseRing(text);
    });

    const altitudeMode = this.parseAltitudeMode(el);

    return new Polygon({
      outerBoundary,
      innerBoundaries,
      name,
      description,
      altitudeMode,
      style,
    });
  }

  private parseGroundOverlay(el: Element): GroundOverlay {
    const name = el.getElementsByTagName('name')[0]?.textContent ?? '未命名叠加层';
    const href = el.getElementsByTagName('href')[0]?.textContent ?? '';
    const latLonBox = el.getElementsByTagName('LatLonBox')[0];

    return new GroundOverlay({
      name,
      imageUrl: href,
      north: Number(latLonBox?.getElementsByTagName('north')[0]?.textContent ?? 0),
      south: Number(latLonBox?.getElementsByTagName('south')[0]?.textContent ?? 0),
      east: Number(latLonBox?.getElementsByTagName('east')[0]?.textContent ?? 0),
      west: Number(latLonBox?.getElementsByTagName('west')[0]?.textContent ?? 0),
      rotation: Number(el.getElementsByTagName('rotation')[0]?.textContent ?? 0),
    });
  }

  private parseStyle(el: Element): FeatureStyle | undefined {
    // 解析内联 Style 或 styleUrl 引用
    const styleUrl = el.getElementsByTagName('styleUrl')[0]?.textContent;
    const styleEl = el.getElementsByTagName('Style')[0];

    if (!styleEl && !styleUrl) return undefined;

    // 目前仅解析内联样式
    // styleUrl 解析需要 KML 文档中的全局样式映射
    if (!styleEl) return undefined;

    const pointStyle = this.parsePointStyle(styleEl);
    const lineStyle = this.parsePolylineStyle(styleEl);
    const polyStyle = this.parsePolygonStyle(styleEl);
    const balloonStyle = this.parseBalloonStyle(styleEl);
    const labelStyle = this.parseLabelStyle(styleEl);

    if (!pointStyle && !lineStyle && !polyStyle) return undefined;

    return new ContentStyle({
      pointStyle,
      polylineStyle: lineStyle,
      polygonStyle: polyStyle,
      balloonStyle,
      labelStyle,
    });
  }

  private parsePointStyle(styleEl: Element): PointStyle | undefined {
    const iconStyle = styleEl.getElementsByTagName('IconStyle')[0];
    if (!iconStyle) return undefined;

    const href = iconStyle.getElementsByTagName('href')[0]?.textContent;
    const scale = Number(iconStyle.getElementsByTagName('scale')[0]?.textContent ?? 1);
    const color = this.parseColor(iconStyle.getElementsByTagName('color')[0]?.textContent);

    if (!href) return undefined;

    return new PointStyle({
      icon: { href, scale },
      color,
    });
  }

  private parsePolylineStyle(styleEl: Element): PolylineStyle | undefined {
    const lineStyle = styleEl.getElementsByTagName('LineStyle')[0];
    if (!lineStyle) return undefined;

    const color = this.parseColor(lineStyle.getElementsByTagName('color')[0]?.textContent);
    const width = Number(lineStyle.getElementsByTagName('width')[0]?.textContent ?? 1);

    return new PolylineStyle({ color: color ?? Color.WHITE, width });
  }

  private parsePolygonStyle(styleEl: Element): PolygonStyle | undefined {
    const polyStyle = styleEl.getElementsByTagName('PolyStyle')[0];
    if (!polyStyle) return undefined;

    const color = this.parseColor(polyStyle.getElementsByTagName('color')[0]?.textContent);
    const fill = polyStyle.getElementsByTagName('fill')[0]?.textContent !== '0';
    const outline = polyStyle.getElementsByTagName('outline')[0]?.textContent !== '0';

    return new PolygonStyle({
      color: color ?? Color.WHITE.withAlpha(0.5),
      fill,
      outline: outline ?? true,
    });
  }

  private parseBalloonStyle(styleEl: Element): BalloonStyle | undefined {
    const balloonEl = styleEl.getElementsByTagName('BalloonStyle')[0];
    if (!balloonEl) return undefined;

    const text = balloonEl.getElementsByTagName('text')[0]?.textContent ?? '';
    const bgColor = this.parseColor(balloonEl.getElementsByTagName('bgColor')[0]?.textContent);

    return new BalloonStyle({
      text,
      bgColor: bgColor ?? Color.WHITE,
    });
  }

  private parseLabelStyle(styleEl: Element): LabelStyle | undefined {
    const labelEl = styleEl.getElementsByTagName('LabelStyle')[0];
    if (!labelEl) return undefined;

    const color = this.parseColor(labelEl.getElementsByTagName('color')[0]?.textContent);
    const scale = Number(labelEl.getElementsByTagName('scale')[0]?.textContent ?? 1);

    return new LabelStyle({
      color: color ?? Color.WHITE,
      scale,
    });
  }

  private parseColor(hex?: string): Color | null {
    if (!hex) return null;
    // KML 颜色: aabbggrr（十六进制）
    if (hex.length === 8) {
      const a = parseInt(hex.substring(0, 2), 16);
      const b = parseInt(hex.substring(2, 4), 16);
      const g = parseInt(hex.substring(4, 6), 16);
      const r = parseInt(hex.substring(6, 8), 16);
      return new Color(r, g, b, a);
    }
    return null;
  }

  private parseAltitudeMode(el: Element): AltitudeMode {
    const mode = el.getElementsByTagName('altitudeMode')[0]?.textContent?.toLowerCase();
    switch (mode) {
      case 'absolute': return AltitudeMode.ABSOLUTE;
      case 'relativetoground': return AltitudeMode.RELATIVE_TO_GROUND;
      case 'relativetoseafloor': return AltitudeMode.RELATIVE_TO_SEA_FLOOR;
      case 'clamptoseafloor': return AltitudeMode.CLAMP_TO_SEA_FLOOR;
      default: return AltitudeMode.CLAMP_TO_GROUND;
    }
  }
}
```

---

### 阶段 4：搜索 + 知识卡片（第 7 周）— P1 高

```typescript
// packages/server/src/services/SearchService.ts

import { LatLonBox } from '@earthstudio/core/models/geometry/LatLonBox';

export interface SearchResult {
  placeId: string;
  fid?: string;
  mid?: string;
  displayName: string;
  description: string;
  location: { lat: number; lng: number };
  bbox?: { north: number; south: number; east: number; west: number };
  category: string;
  thumbnailUrl?: string;
  openLocationCode?: string;
  type: 'place' | 'address' | 'poi' | 'locality' | 'administrative';
}

export interface SearchResponse {
  results: SearchResult[];
  totalResults: number;
  attribution: string;
}

import { GeocodingProvider } from './GeocodingProvider';

export class SearchService {
  constructor(
    private geocoding: GeocodingProvider,
    private knowledgeRepository: KnowledgeRepository
  ) {}

  async search(
    query: string,
    viewport?: LatLonBox,
    limit: number = 10,
    lang: string = 'en'
  ): Promise<SearchResponse> {
    // 通过提供商（Nominatim / Mapbox）进行正向地理编码
    const geoResults = await this.geocoding.search(query, viewport, limit, lang);

    const results: SearchResult[] = geoResults.map((r) => ({
      placeId: r.placeId,
      fid: r.fid,
      mid: r.mid,
      displayName: r.displayName,
      description: r.description ?? r.displayName,
      location: r.location,
      bbox: r.bbox,
      category: r.category,
      thumbnailUrl: r.thumbnailUrl,
      openLocationCode: r.openLocationCode,
      type: r.type ?? 'place',
    }));

    return {
      results,
      totalResults: geoResults.length,
      attribution: this.geocoding.attribution,
    };
  }

  async getKnowledgeCard(fid: string): Promise<RenderableEntity | null> {
    return this.knowledgeRepository.getByFeatureId(fid);
  }

  async getKnowledgeCardByMid(mid: string): Promise<RenderableEntity | null> {
    return this.knowledgeRepository.getByMid(mid);
  }

  async getFeelingLucky(viewport?: LatLonBox): Promise<RenderableEntity | null> {
    return this.knowledgeRepository.getRandomFeatured(viewport);
  }
}
```

```typescript
// packages/server/src/services/GeocodingProvider.ts

export interface GeocodingResult {
  placeId: string;
  fid?: string;
  mid?: string;
  displayName: string;
  description?: string;
  location: { lat: number; lng: number };
  bbox?: { north: number; south: number; east: number; west: number };
  category: string;
  thumbnailUrl?: string;
  openLocationCode?: string;
  type?: string;
}

export interface GeocodingProvider {
  readonly attribution: string;

  search(
    query: string,
    viewport?: LatLonBox,
    limit?: number,
    lang?: string
  ): Promise<GeocodingResult[]>;

  reverse(
    lat: number,
    lng: number,
    lang?: string
  ): Promise<GeocodingResult | null>;
}

/**
 * Nominatim（OpenStreetMap）实现。
 * 免费，无需 API 密钥。速率限制：1 请求/秒。
 */
export class NominatimGeocodingProvider implements GeocodingProvider {
  readonly attribution = '© OpenStreetMap contributors';

  constructor(
    private baseUrl: string = 'https://nominatim.openstreetmap.org',
    private userAgent: string = 'EarthStudio/1.0'
  ) {}

  async search(
    query: string,
    viewport?: LatLonBox,
    limit: number = 10,
    lang: string = 'en'
  ): Promise<GeocodingResult[]> {
    const params = new URLSearchParams({
      q: query,
      format: 'jsonv2',
      limit: String(limit),
      'accept-language': lang,
      addressdetails: '1',
      extratags: '1',
      namedetails: '1',
    });

    if (viewport) {
      params.set(
        'viewbox',
        `${viewport.west},${viewport.south},${viewport.east},${viewport.north}`
      );
      params.set('bounded', '1');
    }

    const response = await fetch(
      `${this.baseUrl}/search?${params}`,
      { headers: { 'User-Agent': this.userAgent } }
    );

    const data: any[] = await response.json();

    return data.map((item) => ({
      placeId: `nominatim:${item.place_id}`,
      displayName: item.display_name,
      description: item.namedetails?.name ?? item.display_name.split(',')[0],
      location: { lat: Number(item.lat), lng: Number(item.lon) },
      bbox: item.boundingbox
        ? {
            north: Number(item.boundingbox[3]),
            south: Number(item.boundingbox[0]),
            east: Number(item.boundingbox[2]),
            west: Number(item.boundingbox[1]),
          }
        : undefined,
      category: item.category ?? item.type ?? 'place',
      type: item.type,
    }));
  }

  async reverse(
    lat: number,
    lng: number,
    lang: string = 'en'
  ): Promise<GeocodingResult | null> {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'jsonv2',
      'accept-language': lang,
      addressdetails: '1',
    });

    const response = await fetch(
      `${this.baseUrl}/reverse?${params}`,
      { headers: { 'User-Agent': this.userAgent } }
    );

    const item = await response.json();
    if (!item || item.error) return null;

    return {
      placeId: `nominatim:${item.place_id}`,
      displayName: item.display_name,
      location: { lat: Number(item.lat), lng: Number(item.lon) },
      category: item.category ?? 'address',
      type: item.type,
    };
  }
}
```

---

### 阶段 5：图层 + 地图样式（第 8-9 周）— P1 高

```typescript
// packages/engine/src/Layers/Layer.ts

import * as THREE from 'three';
import { Globe } from '../Globe';

export enum LayerType {
  SATELLITE = 'SATELLITE',
  ROADMAP = 'ROADMAP',
  TERRAIN = 'TERRAIN',
  BUILDINGS = 'BUILDINGS',
  CLOUDS = 'CLOUDS',
  PHOTOS = 'PHOTOS',
  GRIDLINES = 'GRIDLINES',
  TIMELAPSE = 'TIMELAPSE',
  THREE_D_COVERAGE = 'THREE_D_COVERAGE',
  UPDATED_IMAGERY = 'UPDATED_IMAGERY',
  LAND_PARCELS = 'LAND_PARCELS',
  PINNED_PROJECTS = 'PINNED_PROJECTS',
  DISCOVERY = 'DISCOVERY',
}

export abstract class Layer {
  abstract readonly type: LayerType;
  abstract readonly name: string;

  protected _visible: boolean = true;
  protected _opacity: number = 1;
  protected _group: THREE.Group;
  protected _globe: Globe | null = null;

  constructor() {
    this._group = new THREE.Group();
    this._group.name = this.name;
  }

  get visible(): boolean { return this._visible; }
  get opacity(): number { return this._opacity; }
  get group(): THREE.Group { return this._group; }

  setVisible(visible: boolean): void {
    this._visible = visible;
    this._group.visible = visible;
    if (this._globe) {
      this._globe.scene.add(this._group); // 确保在场景中
    }
  }

  setOpacity(opacity: number): void {
    this._opacity = Math.max(0, Math.min(1, opacity));
    this._group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.Material;
        if ('opacity' in mat) {
          (mat as THREE.MeshStandardMaterial).opacity = this._opacity;
          mat.transparent = this._opacity < 1;
        }
      }
    });
  }

  abstract render(globe: Globe): void;
  abstract load(viewport: LatLonBox): Promise<void>;

  dispose(): void {
    while (this._group.children.length > 0) {
      const child = this._group.children[0];
      this._group.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material?.dispose();
        }
      }
    }
    if (this._globe) {
      this._globe.scene.remove(this._group);
    }
  }

  get isLoaded(): boolean {
    return this._group.children.length > 0;
  }
}
```

```typescript
// packages/engine/src/Layers/BuildingLayer.ts

import * as THREE from 'three';
import { Layer, LayerType } from './Layer';
import { Globe } from '../Globe';
import { LatLonBox } from '@earthstudio/core/models/geometry/LatLonBox';
import { GeoMath } from '../Utils/GeoMath';

export interface BuildingData {
  id: string;
  footprint: [number, number][];    // lng,lat 环
  height: number;
  minHeight: number;
  roofType: 'flat' | 'pitched' | 'dome';
  roofColor: string;
  wallColor: string;
  levels?: number;
  name?: string;
}

export class BuildingLayer extends Layer {
  readonly type = LayerType.BUILDINGS;
  readonly name = '3D 建筑';

  private buildings: Map<string, THREE.Mesh> = new Map();
  private buildingData: BuildingData[] = [];
  private isVisible: boolean = true;

  async load(viewport: LatLonBox): Promise<void> {
    // 从瓦片加载 OSM 建筑数据
    const bbox = `${viewport.west},${viewport.south},${viewport.east},${viewport.north}`;

    // 使用 Overpass API 或自托管瓦片服务器
    const query = `
      [out:json][timeout:25];
      (
        way["building"](${viewport.south},${viewport.west},${viewport.north},${viewport.east});
        relation["building"](${viewport.south},${viewport.west},${viewport.north},${viewport.east});
      );
      out body;
      >;
      out skel qt;
    `;

    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
      });

      const data = await response.json();
      this.buildingData = this.parseOSMData(data);
      this.rebuildMeshes();
    } catch (error) {
      console.error('加载建筑数据失败:', error);
    }
  }

  private parseOSMData(osmData: any): BuildingData[] {
    const ways = osmData.elements?.filter((e: any) => e.type === 'way' && e.nodes) ?? [];
    const nodes = new Map<number, { lat: number; lng: number }>();

    for (const el of osmData.elements ?? []) {
      if (el.type === 'node') {
        nodes.set(el.id, { lat: el.lat, lng: el.lon });
      }
    }

    return ways.map((way: any) => {
      const footprint = way.nodes
        .map((nid: number) => nodes.get(nid))
        .filter(Boolean)
        .map((n: any) => [n.lng, n.lat] as [number, number]);

      const tags = way.tags ?? {};
      const height = Number(tags['height']?.replace('m', ''))
        || (Number(tags['building:levels'] ?? 1) * 3);

      return {
        id: `osm-${way.id}`,
        footprint,
        height,
        minHeight: Number(tags['min_height']?.replace('m', '')) || 0,
        roofType: tags['roof:shape'] === 'dome' ? 'dome'
          : tags['roof:shape'] === 'pitched' ? 'pitched' : 'flat',
        roofColor: tags['roof:colour'] ?? '#888888',
        wallColor: tags['building:colour'] ?? '#D4C9B8',
        levels: Number(tags['building:levels']) || undefined,
        name: tags['name'],
      };
    }).filter((b: BuildingData) => b.footprint.length >= 3);
  }

  private rebuildMeshes(): void {
    // 销毁旧网格
    for (const [, mesh] of this.buildings) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      this._group.remove(mesh);
    }
    this.buildings.clear();

    for (const building of this.buildingData) {
      const mesh = this.createBuildingMesh(building);
      if (mesh) {
        this.buildings.set(building.id, mesh);
        this._group.add(mesh);
      }
    }
  }

  private createBuildingMesh(building: BuildingData): THREE.Mesh | null {
    if (building.footprint.length < 3) return null;

    try {
      // 创建挤出形状
      const shape = new THREE.Shape();

      // 将足迹 (lng,lat) 转换为 3D 位置并求中心
      const center = {
        lng: building.footprint.reduce((s, c) => s + c[0], 0) / building.footprint.length,
        lat: building.footprint.reduce((s, c) => s + c[1], 0) / building.footprint.length,
      };

      const centerPos = GeoMath.latLngAltToVector3(center.lat, center.lng, 0);

      // 创建局部 2D 形状坐标
      const localPoints: THREE.Vector2[] = building.footprint.map(([lng, lat]) => {
        const pos = GeoMath.latLngAltToVector3(lat, lng, 0);
        const local = pos.clone().sub(centerPos);
        // 投影到切平面
        const normal = centerPos.clone().normalize();
        const right = new THREE.Vector3(0, 1, 0).cross(normal).normalize();
        const up = normal.clone().cross(right).normalize();
        return new THREE.Vector2(
          local.dot(right),
          local.dot(up)
        );
      });

      shape.moveTo(localPoints[0].x, localPoints[0].y);
      for (let i = 1; i < localPoints.length; i++) {
        shape.lineTo(localPoints[i].x, localPoints[i].y);
      }
      shape.closePath();

      const extrudeSettings: THREE.ExtrudeGeometryOptions = {
        steps: 1,
        depth: building.height - building.minHeight,
        bevelEnabled: false,
      };

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(building.wallColor),
        roughness: 0.7,
        metalness: 0.1,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(centerPos.clone().add(
        centerPos.clone().normalize().multiplyScalar(building.minHeight)
      ));

      // 定向到切平面
      mesh.lookAt(centerPos.clone().multiplyScalar(2));

      mesh.userData = {
        buildingId: building.id,
        name: building.name,
        height: building.height,
        levels: building.levels,
      };

      return mesh;
    } catch (error) {
      console.warn(`为建筑 ${building.id} 创建网格失败:`, error);
      return null;
    }
  }

  render(globe: Globe): void {
    this._globe = globe;
    this._globe.scene.add(this._group);
  }
}
```

```typescript
// packages/engine/src/Layers/GridlinesLayer.ts

import * as THREE from 'three';
import { Layer, LayerType } from './Layer';
import { Globe } from '../Globe';
import { LatLonBox } from '@earthstudio/core/models/geometry/LatLonBox';
import { GeoMath } from '../Utils/GeoMath';
import { EarthConstants } from '../Utils/Constants';

export class GridlinesLayer extends Layer {
  readonly type = LayerType.GRIDLINES;
  readonly name = '经纬网';

  private latSpacing: number = 15;
  private lngSpacing: number = 15;
  private lineColor: THREE.Color = new THREE.Color(0x444466);
  private lineOpacity: number = 0.4;

  constructor(options?: {
    latSpacing?: number;
    lngSpacing?: number;
    color?: string;
    opacity?: number;
  }) {
    super();
    if (options?.latSpacing) this.latSpacing = options.latSpacing;
    if (options?.lngSpacing) this.lngSpacing = options.lngSpacing;
    if (options?.color) this.lineColor = new THREE.Color(options.color);
    if (options?.opacity !== undefined) this.lineOpacity = options.opacity;
  }

  async load(viewport: LatLonBox): Promise<void> {
    // 经纬网是全球的 — 生成一次即可
    this.generateGridlines();
  }

  private generateGridlines(): void {
    const R = EarthConstants.WGS84_EQUATORIAL_RADIUS * 1.001; // 略高于表面

    const material = new THREE.LineBasicMaterial({
      color: this.lineColor,
      transparent: true,
      opacity: this.lineOpacity,
      depthTest: true,
      depthWrite: false,
    });

    // 纬线（平行圈）
    for (let lat = -90 + this.latSpacing; lat < 90; lat += this.latSpacing) {
      const points: THREE.Vector3[] = [];
      const segments = 128;
      for (let i = 0; i <= segments; i++) {
        const lng = (i / segments) * 360 - 180;
        points.push(GeoMath.latLngAltToVector3(lat, lng, R));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      line.name = `lat-${lat}`;
      this._group.add(line);
    }

    // 经线（子午线）
    for (let lng = -180; lng < 180; lng += this.lngSpacing) {
      const points: THREE.Vector3[] = [];
      const segments = 64;
      for (let i = 0; i <= segments; i++) {
        const lat = -90 + (i / segments) * 180;
        points.push(GeoMath.latLngAltToVector3(lat, lng, R));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      line.name = `lng-${lng}`;
      this._group.add(line);
    }
  }

  render(globe: Globe): void {
    this._globe = globe;
    if (this._group.children.length === 0) {
      this.generateGridlines();
    }
    this._globe.scene.add(this._group);
  }
}
```

---

### 阶段 6：街景 + 时间功能（第 10 周）— P2 中

### 阶段 7：设计工具 + 分析（第 11-13 周）— P2 中

### 阶段 8：Earth Mate AI（第 14 周）— P2 中

### 阶段 9：云项目 + 协作（第 15-16 周）— P3 低

### 阶段 10：分析 + 打磨（第 17-18 周）— P3 低

*（阶段 6-10 的详细实施遵循与阶段 1-5 相同的模式，包含完整的类层次结构、API 端点和服务实现。由于文档长度限制，此处仅作摘要。每个阶段包含：完整的 TypeScript 类签名、MobX 存储、API 路由处理器、服务层实现和测试。）*

---

## 关键设计决策

### 1. Proto → TypeScript：使用 protobuf-ts（而非 google-protobuf）

**理由：** protobuf-ts 生成可 Tree-Shaking 的纯 TypeScript，适用于任何打包工具。google-protobuf 需要原生 WebAssembly 或基于 eval 的代码加载，Tree-Shaking 效果差，且会使打包体积增加约 200KB。protobuf-ts 生成具有 `oneof` 字段可辨识联合类型的惯用 TypeScript，完美映射到我们的 switch-case 命令调度器。

**权衡：** 每个消息的生成代码稍大，但开发体验更好，最终打包体积更小。

### 2. 全面采用 OOP（而非函数式）

每个 proto 消息映射到一个带方法的类。Command 是 `Command` 子类。Feature 是 `Feature` 子类。Layer 是 `Layer` 子类。这与 proto 的 `oneof` 调度模式完美匹配 — 每个 `Command` oneof case 都对应一个带类型的子类，具有自己的 `execute()`、`validate()` 和 `toProto()` 方法。

**选择 OOP 而非函数式的原因：**
- Proto 模式本质上是层次化的（command → oneof → message）
- 34 种命令类型与 `Command` 子类构造函数一一映射
- Mutations 是对 `Document` 对象的操作，而非自由函数
- 状态存储（60+ 个）自然地分组到基于类的 MobX 可观察对象中
- 多态几何处理（`Feature.render()` 分发到 `Placemark.render()` 或 `Polygon.render()`）

### 3. 使用 MobX 而非 Redux / Zustand

Redux 是函数式的（reducers, immer）。有 60+ 个状态切片需要与 proto `state/*.proto` 定义一一映射，基于类的可观察对象是自然的选择。MobX 存储是带有 `@observable` 和 `@action` 装饰器的纯 POJO 类。

**理由：**
- 60 个 proto 状态文件 → 60 个 MobX 存储（一一映射非常简单）
- `@computed` 用于派生状态（60 个派生状态 proto）
- `@action` 装饰器直接对应命令处理器
- 无需为 40+ 个状态切片各自编写 reducer
- MobX `autorun()` 用于响应式副作用（例如，相机状态 → URL hash）

### 4. 使用 React Three Fiber（而非原生 Three.js / CesiumJS）

React Three Fiber 以声明式方式将 Three.js 封装在 React 组件树中。它避免了组件中的命令式 Three.js 代码，同时保持对 Three.js API 的完全访问。

**不选择 CesiumJS 的原因：**
- CesiumJS 约 5MB gzip，渲染与其自己的相机/瓦片系统紧密耦合
- CesiumJS 使用自己的 Entity API，不匹配我们基于 proto 的 OOP 模型
- 通过 R3F 使用 Three.js 让我们完全控制渲染管线
- Three.js 为自定义着色器、后处理、GLTF 提供了更大生态系统
- Cesium 的许可（商业使用需要许可证）对于克隆产品是一个顾虑

**权衡：** 我们必须构建自己的瓦片系统和地球表示，但这正好映射到我们的 `TileManager` 和 `Globe` 抽象。

### 5. 使用 PostGIS 存储要素（而非 MongoDB GeoJSON）

PostgreSQL 的 PostGIS 扩展原生支持：
- S2 几何单元（与 `FeatureIdProto` 使用的索引相同）
- GiST 空间索引用于边界框查询
- 3D 几何（Z 坐标用于高程）
- ST_DWithin, ST_Intersects 用于空间过滤
- Terraform/raster 支持用于高程和分析

PostGIS 还提供变更编辑的事务完整性、多租户云项目的行级安全性，以及用于报告和分析的 SQL 全部能力。

### 6. 使用 Turborepo 的 Monorepo

Turborepo 协调 5 个包（`proto`, `core`, `server`, `engine`, `client`）的构建：
- `proto` 必须先于 `core` 构建
- `core` 必须先于 `server`, `engine`, `client` 构建
- 缓存 proto 代码生成输出（仅在 proto 文件变更时重新构建）
- 独立包的并行构建

### 7. 通过 URL Hash 进行深度链接

`deeplink/` 派生状态 proto 定义了 12 个消息，捕获每一个可深度链接的状态位。我们将其序列化到 URL hash：

```
#/?c=40.7484,-73.9857,1000,45,30,0&ls=3db,cld,grd&im=sat&q=Empire+State+Building&k=0x89c259a9b3117469
```

加载时，`DeeplinkStore` 解析 hash 并调度命令来恢复状态：
1. `FlyToCamera`（恢复相机位置）
2. `ToggleLayer` × N（恢复图层可见性）
3. `SetBasemapStyle`（恢复影像）
4. `PerformSearch` / `OpenKnowledgeCard`（恢复知识状态）

---

## 依赖关系图

```
┌──────────────────────────────────────────────────────────────────┐
│                       阶段 0：Proto 管线                          │
│              （移除依赖 → protobuf-ts → 适配器）                   │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
┌──────────────────────┐ ┌─────────────────┐ ┌──────────────────┐
│  阶段 1：基础         │ │ 阶段 3：内容创建 │ │ 阶段 4：搜索      │
│  地球 + 相机 +        │ │ （要素 CRUD）    │ │ + 知识卡片        │
│  Next.js 搭建         │ │                 │ │                  │
└──────────┬───────────┘ └────────┬────────┘ └────────┬─────────┘
           │                      │                    │
           └──────────────────────┼────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                   阶段 2：命令 + 状态                              │
│         （34 个命令 | 60+ 个 MobX 存储 | 撤销/重做）               │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────┐
│ 阶段 5：图层      │ │ 阶段 6：街景      │ │ 阶段 7：设计工具      │
│ + 地图样式         │ │ + 时间功能        │ │ + 分析               │
└────────┬─────────┘ └────────┬─────────┘ └──────────┬───────────┘
         │                    │                       │
         └────────────────────┼───────────────────────┘
                              │
                    ┌─────────┼─────────┐
                    │                   │
                    ▼                   ▼
┌──────────────────────────┐ ┌──────────────────────────┐
│ 阶段 8：Earth Mate AI    │ │ 阶段 9：云项目            │
│ （LLM + 工具调用）        │ │ + 协作                    │
└────────────┬─────────────┘ └────────────┬──────────────┘
             │                             │
             └─────────────┬───────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    阶段 10：分析 + 打磨                            │
│        （事件日志 | 仪表盘 | 性能 | 部署）                         │
└──────────────────────────────────────────────────────────────────┘
```

### 关键路径（最少工作量实现可工作地球查看器）

```
阶段 0（2 周）
    → 阶段 1（2 周）
        → 阶段 2（2 周：仅选定命令）
            → 阶段 3（2 周：仅地标 CRUD）
                → 阶段 4（1 周：仅搜索）

时间线：9 周实现带搜索和地标的可工作 3D 地球查看器
```

### 团队规模与估算

| 阶段 | 工作量 | 团队（最优） | 时间线 | 累计 |
|---|---|---|---|---|
| 0：Proto 管线 | M（2-3 周） | 1 名工程师 | 3 周 | 3 周 |
| 1：基础 | L（4-5 周） | 2 名工程师 | 4 周 | 7 周 |
| 2：命令 + 状态 | L（4-5 周） | 3 名工程师 | 4 周 | 11 周 |
| 3：内容创建 | XL（6-8 周） | 3 名工程师 | 6 周 | 17 周 |
| 4：搜索 + 知识 | M（2-3 周） | 2 名工程师 | 3 周 | 20 周 |
| 5：图层 + 地图样式 | M（3-4 周） | 2 名工程师 | 4 周 | 24 周 |
| 6：街景 + 时间 | M（3-4 周） | 2 名工程师 | 4 周 | 28 周 |
| 7：设计 + 分析 | L（6-8 周） | 3 名工程师 | 6 周 | 34 周 |
| 8：Earth Mate AI | L（4-6 周） | 2 名工程师 | 5 周 | 39 周 |
| 9：云项目 | L（4-6 周） | 2 名工程师 | 5 周 | 44 周 |
| 10：分析 + 打磨 | M（3-4 周） | 2 名工程师 | 4 周 | 48 周 |

**总计：约 48 周（12 个月），由 3-4 名工程师组成的团队。**

MVP（阶段 0-4）：约 17 周，3 名工程师。

---
