# Earth Studio Implementation Plan

## TypeScript + Three.js + Next.js — OOP Architecture

> **Based on:** 1,316 Google Earth proto definition files, complete state management schema, command system,
> content creation model, rendering pipeline contracts, and geo infrastructure data models.
>
> **Generated:** 2026-08-12

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [OOP Architecture: Core Class Hierarchy](#oop-architecture-core-class-hierarchy)
4. [Proto-to-TypeScript Pipeline](#proto-to-typescript-pipeline)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Frontend/Backend Separation](#frontendbackend-separation)
8. [Implementation Phases](#implementation-phases)
   - [Phase 1: Foundation](#phase-1-foundation-week-1-2--p0-critical)
   - [Phase 2: Commands + State](#phase-2-commands--state-week-3-4--p0-critical)
   - [Phase 3: Content Creation](#phase-3-content-creation-week-5-6--p1-high)
   - [Phase 4: Search + Knowledge Cards](#phase-4-search--knowledge-cards-week-7--p1-high)
   - [Phase 5: Layers + MapStyle](#phase-5-layers--mapstyle-week-8-9--p1-high)
   - [Phase 6: Street View + Time Features](#phase-6-street-view--time-features-week-10--p2-medium)
   - [Phase 7: Design Tools + Analysis](#phase-7-design-tools--analysis-week-11-13--p2-medium)
   - [Phase 8: Earth Mate AI](#phase-8-earth-mate-ai-week-14--p2-medium)
   - [Phase 9: Cloud Projects + Collaboration](#phase-9-cloud-projects--collaboration-week-15-16--p3-low)
   - [Phase 10: Analytics + Polish](#phase-10-analytics--polish-week-17-18--p3-low)
9. [Key Design Decisions](#key-design-decisions)
10. [Dependency Map](#dependency-map)

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend Framework** | Next.js 14 (App Router) | SSR for SEO, API routes for backend, React Server Components |
| **3D Engine** | Three.js via React Three Fiber | Declarative 3D in React, WebGL, massive ecosystem |
| **State Management** | MobX (OOP observables) | Class-based observables match proto state pattern; 60+ state slices map naturally |
| **Proto Runtime** | protobuf-ts | Pure TypeScript proto generation, tree-shakeable, zero native deps |
| **Database** | PostgreSQL 16 + PostGIS 3.4 + Drizzle ORM | S2 geometry indexing, type-safe queries, migrations |
| **Cache** | Redis | Session state, tile cache, command queue |
| **Styling** | Tailwind CSS | Rapid UI development, design system tokens |
| **Testing** | Vitest + Playwright | Unit tests + browser E2E |
| **Monorepo** | Turborepo | Parallel builds, shared configs, dependency graph awareness |
| **CI/CD** | GitHub Actions | Proto CI, build, test, deploy pipelines |
| **Hosting** | Cloudflare Pages (frontend) + Fly.io (backend) | Global CDN + containerized backend |
| **Auth** | NextAuth.js | OAuth 2.0, session management, JWT |
| **Feature Flags** | Unleash (self-hosted) | 234 experiment flags matching proto schema |

---

## Project Structure

```
earthstudio/
├── packages/
│   ├── proto/                      # Generated TypeScript from .proto
│   │   ├── src/
│   │   │   ├── gen/                # protobuf-ts generated code
│   │   │   │   ├── commands.ts     # Commands, Command (34 oneof types)
│   │   │   │   ├── geometry.ts     # Location, Rotation, Camera, LatLng
│   │   │   │   ├── mapstyle.ts     # MapStyle, Projection, Imagery, ThreeDFeatures
│   │   │   │   ├── content_editing_model.ts  # 107 messages: Feature, Placemark, Geometry, Style
│   │   │   │   ├── content_editing_mutations.ts # 13 mutation types
│   │   │   │   ├── renderable-entity.ts # Knowledge cards (40 messages)
│   │   │   │   ├── earth_mate_request.ts   # AI request model
│   │   │   │   ├── earth_mate_response.ts  # AI response model
│   │   │   │   ├── earth_log.ts     # 89 event type categories
│   │   │   │   └── index.ts        # Barrel export
│   │   │   ├── adapters/           # Proto → App model adapters
│   │   │   │   ├── CommandAdapter.ts
│   │   │   │   ├── CameraAdapter.ts
│   │   │   │   ├── FeatureAdapter.ts
│   │   │   │   ├── MapStyleAdapter.ts
│   │   │   │   ├── LayerAdapter.ts
│   │   │   │   └── KnowledgeCardAdapter.ts
│   │   │   └── third_party/        # Stub protos for Google-internal deps
│   │   │       ├── google/storage/datapol/...
│   │   │       ├── google/net/proto2/...
│   │   │       └── google/java/com/google/apps/jspb/...
│   │   ├── buf.gen.yaml
│   │   ├── buf.yaml
│   │   └── package.json
│   │
│   ├── core/                       # Shared domain models (OOP)
│   │   └── src/
│   │       ├── models/
│   │       │   ├── commands/
│   │       │   │   ├── Command.ts              # Abstract base
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
│   │       │   │   ├── Camera.ts               # Abstract base
│   │       │   │   ├── LookAtCamera.ts
│   │       │   │   ├── LookFromCamera.ts
│   │       │   │   ├── CameraAnimation.ts      # Enum: TELEPORT, FLY
│   │       │   │   ├── CameraPresentationMode.ts # Enum: STATIC, POI_ORBIT, PLANET_ORBIT, CINEMATIC
│   │       │   │   └── Panorama.ts
│   │       │   ├── geometry/
│   │       │   │   ├── Location.ts              # lon/lat/alt
│   │       │   │   ├── Rotation.ts              # heading/tilt/roll
│   │       │   │   ├── LatLng.ts
│   │       │   │   ├── LatLngAlt.ts
│   │       │   │   ├── LatLonBox.ts             # viewport bounds
│   │       │   │   ├── BoundingBox.ts
│   │       │   │   ├── Size.ts                  # width/height
│   │       │   │   └── CoordinateSystems.ts     # WGS84, Mercator, S2
│   │       │   ├── features/
│   │       │   │   ├── Feature.ts               # Abstract base
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
│   │       │   │   ├── Layer.ts                 # Abstract base
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
│   │       │   │   ├── DocumentNamespace.ts     # Enum: EARTH, MY_MAPS
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
│   ├── server/                     # Next.js API routes + backend
│   │   └── src/
│   │       ├── app/
│   │       │   └── api/
│   │       │       ├── features/
│   │       │       │   ├── route.ts            # GET (list), POST (create)
│   │       │       │   └── [featureId]/
│   │       │       │       └── route.ts        # GET, PUT, DELETE
│   │       │       ├── documents/
│   │       │       │   ├── route.ts            # GET (list), POST (create)
│   │       │       │   └── [documentId]/
│   │       │       │       ├── route.ts        # GET, PUT, DELETE
│   │       │       │       └── features/
│   │       │       │           └── route.ts    # List features in doc
│   │       │       ├── search/
│   │       │       │   └── route.ts            # GET (geo search)
│   │       │       ├── knowledge/
│   │       │       │   └── route.ts            # GET (knowledge card)
│   │       │       ├── layers/
│   │       │       │   └── route.ts            # GET (list layers)
│   │       │       ├── tiles/
│   │       │       │   └── [...path]/
│   │       │       │       └── route.ts        # Tile serving proxy
│   │       │       ├── earthmate/
│   │       │       │   └── route.ts            # POST (chat), GET (stream)
│   │       │       ├── design/
│   │       │       │   ├── solar/
│   │       │       │   │   └── route.ts        # POST (solar analysis)
│   │       │       │   └── building/
│   │       │       │       └── route.ts        # POST (building design)
│   │       │       ├── analysis/
│   │       │       │   └── [type]/
│   │       │       │       └── route.ts        # POST (slope/aspect/cut-fill...)
│   │       │       ├── streetview/
│   │       │       │   └── route.ts            # GET (panorama metadata)
│   │       │       ├── elevation/
│   │       │       │   └── route.ts            # POST (batch elevation lookup)
│   │       │       ├── auth/
│   │       │       │   └── [...nextauth]/
│   │       │       │       └── route.ts        # NextAuth handler
│   │       │       ├── events/
│   │       │       │   └── route.ts            # POST (analytics events)
│   │       │       ├── config/
│   │       │       │   └── route.ts            # GET (client config + feature flags)
│   │       │       ├── kml/
│   │       │       │   ├── import/
│   │       │       │   │   └── route.ts        # POST (KML import)
│   │       │       │   └── export/
│   │       │       │       └── route.ts        # GET (KML export)
│   │       │       └── images/
│   │       │           └── route.ts            # POST (AI image generation)
│   │       ├── services/
│   │       │   ├── db/
│   │       │   │   ├── index.ts                # Drizzle ORM client
│   │       │   │   ├── schema.ts               # All table definitions
│   │       │   │   └── migrations/
│   │       │   ├── FeatureRepository.ts
│   │       │   ├── DocumentRepository.ts
│   │       │   ├── SearchRepository.ts
│   │       │   ├── KnowledgeRepository.ts
│   │       │   ├── TileCacheService.ts
│   │       │   ├── GeocodingProvider.ts        # Nominatim / Mapbox adapter
│   │       │   ├── EarthMateProvider.ts        # OpenAI / Claude adapter
│   │       │   ├── SolarAnalysisService.ts     # PVLib wrapper
│   │       │   ├── TerrainAnalysisService.ts   # GDAL wrapper
│   │       │   ├── ElevationService.ts
│   │       │   ├── KmlImportService.ts
│   │       │   └── ConfigService.ts
│   │       └── middleware/
│   │           ├── auth.ts                     # NextAuth middleware
│   │           ├── rateLimit.ts
│   │           ├── cors.ts
│   │           ├── validation.ts               # Proto schema validation
│   │           └── logging.ts
│   │
│   ├── engine/                     # Three.js rendering engine
│   │   └── src/
│   │       ├── Globe.ts                        # Globe controller
│   │       ├── EarthCamera.ts                  # Camera (LookAt/LookFrom)
│   │       ├── MapStyleController.ts           # MapStyle → renderer state
│   │       ├── CoordinateSystems.ts            # WGS84, Mercator, S2 conversions
│   │       ├── Layers/
│   │       │   ├── Layer.ts                    # Abstract base
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
│   │       │   ├── FeatureRenderer.ts          # Abstract base
│   │       │   ├── PlacemarkRenderer.ts
│   │       │   ├── PolylineRenderer.ts
│   │       │   ├── PolygonRenderer.ts
│   │       │   ├── Model3DRenderer.ts           # GLTF/GLB models
│   │       │   ├── GroundOverlayRenderer.ts
│   │       │   ├── ScreenOverlayRenderer.ts
│   │       │   ├── LabelRenderer.ts             # Text labels on globe
│   │       │   └── BalloonRenderer.ts           # Info windows/popups
│   │       ├── Materials/
│   │       │   ├── EarthMaterial.ts             # Globe surface shader
│   │       │   ├── AtmosphereMaterial.ts        # Atmospheric scattering
│   │       │   ├── WaterMaterial.ts             # Ocean surface
│   │       │   ├── CloudMaterial.ts             # Cloud layer shader
│   │       │   ├── BuildingMaterial.ts
│   │       │   ├── TerrainMaterial.ts
│   │       │   ├── PolylineMaterial.ts
│   │       │   ├── PolygonMaterial.ts
│   │       │   └── GridlineMaterial.ts
│   │       ├── TileSystem/
│   │       │   ├── TileManager.ts              # Tile loading/caching/LOD
│   │       │   ├── TileCoord.ts                # x/y/zoom
│   │       │   ├── VectorTileDecoder.ts
│   │       │   ├── RasterTileProvider.ts
│   │       │   ├── ElevationTileProvider.ts
│   │       │   └── TileCache.ts                # LRU in-memory cache
│   │       ├── Effects/
│   │       │   ├── Atmosphere.ts               # Sky, sun, stars
│   │       │   ├── PostProcessing.ts           # Bloom, tone mapping
│   │       │   └── WaterReflection.ts
│   │       └── Utils/
│   │           ├── GeoMath.ts                  # Great-circle, S2 conversions
│   │           ├── Interpolation.ts            # Camera interpolation (slerp, lerp)
│   │           ├── Raycasting.ts               # Globe pick/intersect
│   │           └── Constants.ts                # WGS84 radii, EPSG codes
│   │
│   └── client/                     # Next.js frontend pages
│       └── src/
│           ├── app/
│           │   ├── layout.tsx                  # Root layout (providers, theme)
│           │   ├── page.tsx                    # Main Earth page
│           │   ├── project/
│           │   │   └── [projectId]/
│           │   │       └── page.tsx            # Project view
│           │   ├── design/
│           │   │   └── [designId]/
│           │   │       └── page.tsx            # Design view
│           │   └── api/                        # Client-side API wrappers
│           ├── components/
│           │   ├── EarthCanvas.tsx             # React Three Fiber canvas
│           │   ├── CommandBar.tsx              # Search/command input
│           │   ├── SearchPanel.tsx             # Search results panel
│           │   ├── KnowledgeCard.tsx           # Place information card
│           │   ├── LayerPanel.tsx              # Layer toggle sidebar
│           │   ├── MapStyleSwitcher.tsx        # Imagery/projection controls
│           │   ├── FeatureEditor.tsx           # Property editor panel
│           │   ├── FeatureList.tsx             # Document feature tree
│           │   ├── StyleEditor/
│           │   │   ├── PointStyleEditor.tsx
│           │   │   ├── PolylineStyleEditor.tsx
│           │   │   ├── PolygonStyleEditor.tsx
│           │   │   ├── BalloonStyleEditor.tsx
│           │   │   └── LabelStyleEditor.tsx
│           │   ├── DrawingTools.tsx            # Polyline/polygon drawing
│           │   ├── MeasureTool.tsx             # Distance/area measurement
│           │   ├── TimeMachineSlider.tsx       # Historical imagery scrubber
│           │   ├── TimelapseControls.tsx       # Timelapse playback
│           │   ├── StreetViewPanel.tsx         # Street View embed
│           │   ├── EarthMatePanel.tsx          # AI chat panel
│           │   ├── ImageGenerator.tsx          # AI image generation
│           │   ├── DesignViewer.tsx            # Design results viewer
│           │   ├── AnalysisPanel.tsx           # Slope/aspect/contour viz
│           │   ├── NavigationControls.tsx      # Zoom/pan/tilt controls
│           │   ├── ViewStatus.tsx              # Camera coord display
│           │   ├── HomescreenOverlay.tsx       # Welcome screen
│           │   ├── PinnedProjects.tsx          # Pinned project overlay
│           │   ├── PromotionBanner.tsx         # Upgrade/billing banner
│           │   ├── ShortcutsHelp.tsx           # Keyboard shortcuts
│           │   ├── OnboardingFlow.tsx          # First-time user walkthrough
│           │   └── common/
│           │       ├── Button.tsx
│           │       ├── IconPicker.tsx
│           │       ├── ColorPicker.tsx
│           │       ├── Modal.tsx
│           │       ├── Toast.tsx
│           │       ├── Tooltip.tsx
│           │       └── VeTracker.tsx           # Visual element event tracker
│           ├── stores/                         # MobX stores (60+ total)
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
│               ├── useGlobe.ts                 # Globe instance hook
│               ├── useCamera.ts                # Camera state hook
│               ├── useCommand.ts               # Command dispatch hook
│               ├── useFeature.ts               # Feature CRUD hook
│               ├── useLayer.ts                 # Layer toggle hook
│               ├── useMapStyle.ts              # Map style hook
│               ├── useSearch.ts                # Geo search hook
│               ├── useKnowledgeCard.ts         # Knowledge card hook
│               ├── useKml.ts                   # KML import/export
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
├── turbo.json                        # Turborepo config
├── package.json                      # Root workspace package.json
├── pnpm-workspace.yaml               # pnpm workspace config
├── tsconfig.base.json                # Base TypeScript config
└── docker-compose.yml                # Dev services (PG, Redis)
```

---

## OOP Architecture: Core Class Hierarchy

### Command System

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

### Feature System

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

### Layer System

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
│   └── spacing: number (degrees)
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

### Camera System

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
├── TELEPORT       # Instantly jump to position
└── FLY            # Smooth interpolation

CameraPresentationMode (enum)
├── STATIC         # Camera stays at destination
├── POI_ORBIT      # Orbit around the target POI
├── PLANET_ORBIT   # Full planet rotation view
└── CINEMATIC      # Dramatic fly-in with easing

Panorama
├── panoId: string
├── frontEnd: PanoFrontEnd (ALLEYCAT | FIFE | FIFE_MEDIA_KEY | LOCAL)
├── registration?: { heading: number, pitch: number }
└── links?: PanoramaLink[]
```

### MapStyle System

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

### Document System

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

## Proto-to-TypeScript Pipeline

### Problem

The 1,316 `.proto` files cannot compile directly with standard `protoc` because they depend on Google-internal imports:

| Internal Import | Used By | Resolution |
|---|---|---|
| `storage/datapol/annotations/proto/semantic_annotations.proto` | 890 files | Create minimal stub with `sem_type` extension |
| `net/proto2/proto/descriptor.proto` | 272 files | Re-export `google/protobuf/descriptor.proto` |
| `net/proto2/bridge/proto/message_set.proto` | 33 files | Convert MessageSet extensions → oneof |
| `java/com/google/apps/jspb/jspb.proto` | 208 files | Strip — JS annotations not needed for TypeScript |
| `wireless/android/privacy/...` | ~60 files | Strip — Android-specific |
| `protomerger/annotations.proto` | several | Strip — build system only |

### Implementation

```bash
# Step 1: Create third_party/ stubs
mkdir -p packages/proto/src/third_party/google/storage/datapol/annotations/proto/
mkdir -p packages/proto/src/third_party/google/net/proto2/proto/
mkdir -p packages/proto/src/third_party/google/net/proto2/bridge/proto/
mkdir -p packages/proto/src/third_party/google/knowledge/graph/protomesh/

# Step 2: Strip internal imports (automated)
find geo/ maps/ geostore/ logs/ google/ -name "*.proto" \
  -exec sed -i \
    -e 's|import "net/proto2/proto/descriptor.proto"|import "google/protobuf/descriptor.proto"|g' \
    -e '/import.*jspb\.proto/d' \
    -e '/option.*jspb/d' \
    -e '/import.*collection_basis_annotations/d' \
    {} +

# Step 3: Convert MessageSet → oneof (Python script)
# packages/proto/scripts/convert_messageset.py
# Parses each proto with MessageSet, finds all extend blocks,
# generates a oneof replacing the extensions.

# Step 4: Two-pass compilation with buf
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

### Adapter Layer

Every generated proto type gets an adapter to convert between proto and domain models:

```typescript
// packages/proto/src/adapters/CommandAdapter.ts
import { Command as ProtoCommand } from '../gen/commands';
import { Command } from '@earthstudio/core/models/commands/Command';
import { FlyToCameraCommand } from '@earthstudio/core/models/commands/FlyToCamera';
// ... all command imports

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
      // ... remaining 31 cases
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

## Database Schema

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

// ─── Enums ───────────────────────────────────────────────────────

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

// ─── Users ───────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: text('id').primaryKey(),                          // OAuth subject ID
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  industry: text('industry'),                           // 62 industry types from proto
  useCase: text('use_case'),                            // 78 MAP use cases from proto
  geographicScale: text('geographic_scale'),             // 6 geographic scales
  plan: text('plan').default('FREE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ─── Documents ──────────────────────────────────────────────────

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
  deletedAt: timestamp('deleted_at', { withTimezone: true }), // Soft delete
},
(table) => [
  index('idx_documents_owner').on(table.ownerId),
  index('idx_documents_namespace').on(table.namespace),
  index('idx_documents_updated').on(table.updatedAt),
]);

// ─── Document Collaborators ─────────────────────────────────────

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

// ─── Features ───────────────────────────────────────────────────

export const features = pgTable('features', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id')
    .references(() => documents.id, { onDelete: 'cascade' })
    .notNull(),
  parentId: uuid('parent_id'),                          // Self-referencing for tree
  featureType: featureTypeEnum('feature_type').notNull(),
  name: text('name'),
  description: text('description'),
  snippet: text('snippet'),
  visibility: boolean('visibility').default(true),
  isOpen: boolean('is_open').default(true),              // Folder expanded state
  featureOrigin: featureOriginEnum('feature_origin').default('USER'),
  sortIndex: integer('sort_index').default(0),

  // Geometry (PostGIS)
  geom: geometry('geom', 4326),                         // Point/Polyline/Polygon/Multi

  // Altitude
  altitudeMode: altitudeModeEnum('altitude_mode').default('CLAMP_TO_GROUND'),
  altitude: doublePrecision('altitude'),

  // Camera (for Placemarks with camera setup)
  cameraType: text('camera_type'),                       // 'look_at' | 'look_from'
  cameraLat: doublePrecision('camera_lat'),
  cameraLng: doublePrecision('camera_lng'),
  cameraAlt: doublePrecision('camera_alt'),
  cameraRange: doublePrecision('camera_range'),
  cameraHeading: doublePrecision('camera_heading'),
  cameraTilt: doublePrecision('camera_tilt'),
  cameraRoll: doublePrecision('camera_roll'),
  cameraFovy: doublePrecision('camera_fovy'),

  // Address (for Placemarks)
  address: text('address'),
  phoneNumber: text('phone_number'),

  // Style (JSON blob for full ContentStyle proto serialization)
  styleData: jsonb('style_data').$type<SerializedFeatureStyle>(),

  // 3D Model
  modelAssetId: uuid('model_asset_id'),                  // FK to assets
  modelScaleX: doublePrecision('model_scale_x').default(1),
  modelScaleY: doublePrecision('model_scale_y').default(1),
  modelScaleZ: doublePrecision('model_scale_z').default(1),
  modelHeading: doublePrecision('model_heading').default(0),
  modelTilt: doublePrecision('model_tilt').default(0),
  modelRoll: doublePrecision('model_roll').default(0),

  // Ground Overlay
  overlayImageUrl: text('overlay_image_url'),
  overlayNorth: doublePrecision('overlay_north'),
  overlaySouth: doublePrecision('overlay_south'),
  overlayEast: doublePrecision('overlay_east'),
  overlayWest: doublePrecision('overlay_west'),
  overlayRotation: doublePrecision('overlay_rotation').default(0),

  // Network Link
  networkLinkUrl: text('network_link_url'),
  networkLinkRefreshMode: text('network_link_refresh_mode'),
  networkLinkRefreshInterval: doublePrecision('network_link_refresh_interval'),

  // Earth Data Layer (BigQuery-connected)
  earthDataLayerIdentifier: text('earth_data_layer_identifier'),
  earthDataLayerProperties: jsonb('earth_data_layer_properties'),

  // Classification
  classificationInputs: jsonb('classification_inputs'),

  // Feature-level restrictions
  exportRestrictions: jsonb('export_restrictions'),
  editRestrictions: jsonb('edit_restrictions'),

  // S2 cell indexing (spatial locality from FeatureIdProto)
  s2CellId: bigint('s2_cell_id', { mode: 'number' }),
  s2Fingerprint: bigint('s2_fingerprint', { mode: 'number' }),

  // Extended properties (schema columns)
  extendedProperties: jsonb('extended_properties').$type<Record<string, AttributeValue>>(),

  // Timestamps
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

// ─── Feature Media ──────────────────────────────────────────────

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
  duration: integer('duration'),                         // Seconds (for video)
  mutationId: text('mutation_id'),                       // For optimistic update tracking
  sortIndex: integer('sort_index').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
},
(table) => [
  index('idx_feature_media_feature').on(table.featureId),
]);

// ─── Document Schema / Columns ──────────────────────────────────

export const documentColumns = pgTable('document_columns', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id')
    .references(() => documents.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  displayName: text('display_name'),
  columnType: text('column_type').notNull(),              // 'STRING' | 'INT' | 'DOUBLE' | 'BOOLEAN'
  templateAlias: text('template_alias'),                  // For balloon template binding
  defaultValue: text('default_value'),
  sortIndex: integer('sort_index').default(0),
},
(table) => [
  uniqueIndex('idx_columns_doc_name').on(table.documentId, table.name),
]);

// ─── Assets (3D Models, Custom Icons, Images) ───────────────────

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
  metadata: jsonb('metadata'),                            // BoundingBox, dimensions, etc.
  uploadedBy: text('uploaded_by').references(() => users.id),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow(),
},
(table) => [
  index('idx_assets_document').on(table.documentId),
]);

// ─── Document Mutations (for conflict resolution / history) ────

export const documentMutations = pgTable('document_mutations', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id')
    .references(() => documents.id, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  mutationType: text('mutation_type').notNull(),          // 13 mutation types from proto
  mutationData: jsonb('mutation_data').notNull(),         // The full mutation payload
  baseVersion: integer('base_version').notNull(),         // For optimistic concurrency
  newVersion: integer('new_version').notNull(),
  sequenceNumber: integer('sequence_number').notNull(),
  appliedAt: timestamp('applied_at', { withTimezone: true }).defaultNow(),
},
(table) => [
  index('idx_mutations_document').on(table.documentId),
  index('idx_mutations_doc_seq').on(table.documentId, table.sequenceNumber),
  uniqueIndex('idx_mutations_doc_ver').on(table.documentId, table.newVersion),
]);

// ─── Search History ─────────────────────────────────────────────

export const searchHistory = pgTable('search_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  query: text('query').notNull(),
  resultCount: integer('result_count'),
  viewport: jsonb('viewport'),                            // LatLonBox
  selectedResultId: text('selected_result_id'),           // FID or MID that was opened
  searchedAt: timestamp('searched_at', { withTimezone: true }).defaultNow(),
},
(table) => [
  index('idx_search_history_user').on(table.userId, table.searchedAt.desc()),
]);

// ─── Cloud Projects ─────────────────────────────────────────────

export const cloudProjects = pgTable('cloud_projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  folderId: text('folder_id'),                            // Google Drive folder
  documentId: uuid('document_id')
    .references(() => documents.id, { onDelete: 'cascade' }),
  projectKey: text('project_key').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
},
(table) => [
  index('idx_projects_user').on(table.userId),
]);

// ─── Pinned Projects ────────────────────────────────────────────

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

// ─── Earth Data Layers (BigQuery-connected) ─────────────────────

export const earthDataLayers = pgTable('earth_data_layers', {
  id: uuid('id').defaultRandom().primaryKey(),
  identifier: text('identifier').notNull().unique(),      // Earth data layer identifier
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'),
  sourceType: text('source_type'),                        // 'BIGQUERY' | 'CSV' | 'GEOJSON'
  sourceUrl: text('source_url'),
  colorRampId: text('color_ramp_id'),                     // 20+ predefined color ramps
  styleRules: jsonb('style_rules'),                       // CategoricalStyleRuleSet or InterpolatedStyleRuleSet
  filters: jsonb('filters'),                              // EarthDataLayerAttributeFilters
  geometricFilter: jsonb('geometric_filter'),
  isGeminiGenerated: boolean('is_gemini_generated').default(false),
  geminiCnsPath: text('gemini_cns_path'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ─── Design Results ─────────────────────────────────────────────

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
  geometry: geometry('geometry', 4326),                    // Site polygon
  inputs: jsonb('inputs'),                                 // Full design inputs
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

// ─── On-Demand Analysis ─────────────────────────────────────────

export const analyses = pgTable('analyses', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' }),
  documentId: uuid('document_id')
    .references(() => documents.id, { onDelete: 'cascade' }),
  analysisType: text('analysis_type').notNull(),           // 'SLOPE' | 'ASPECT' | 'CUT_FILL' | 'CONTOUR' | 'CHANGE_DETECTION'
  geometry: geometry('geometry', 4326).notNull(),          // Area of analysis
  parameters: jsonb('parameters'),
  results: jsonb('results'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ─── Analytics Events (local, also sent to ClickHouse) ──────────

export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id'),
  sessionId: text('session_id').notNull(),
  eventType: text('event_type').notNull(),                 // From 89 Earth event types
  eventValue: integer('event_value'),                      // Discrete event value
  commandType: text('command_type'),                       // If triggered by a command
  properties: jsonb('properties'),                         // Event-specific sub-message
  screenWidth: integer('screen_width'),
  screenHeight: integer('screen_height'),
  renderer: text('renderer'),                              // WebGL/WebGPU info
  fps: doublePrecision('fps'),
  memoryMb: doublePrecision('memory_mb'),
  loadTimeMs: doublePrecision('load_time_ms'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow(),
});

// ─── Views ──────────────────────────────────────────────────────

// S2 spatial index materialized view
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

// Feature count per document view
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

## API Endpoints

### Complete REST API Specification

```typescript
// ─── Features API ────────────────────────────────────────────────

// GET    /api/features?documentId={id}&parentId={id}&bbox={w,s,e,n}&limit={n}
// ─── List features with spatial filtering
interface ListFeaturesRequest {
  documentId: string;
  parentId?: string;          // For tree navigation
  bbox?: string;              // "west,south,east,north" for spatial filter
  featureType?: string;       // Filter by FeatureType
  featureOrigin?: string;     // Filter by FeatureOrigin
  limit?: number;             // Default 100
  offset?: number;            // Default 0
}

interface ListFeaturesResponse {
  features: Feature[];
  total: number;
  hasMore: boolean;
}

// POST   /api/features
// ─── Create a new feature
interface CreateFeatureRequest {
  documentId: string;
  parentId?: string;
  featureType: string;
  name?: string;
  description?: string;
  geometry?: GeoJSON;         // For polyline/polygon/placemark
  altitudeMode?: string;
  altitude?: number;
  styleData?: SerializedFeatureStyle;
  camera?: CameraSetup;       // For placemarks
}

interface CreateFeatureResponse {
  feature: Feature;
  mutation: DataMutation;
}

// GET    /api/features/:featureId
// ─── Get a single feature
interface GetFeatureResponse {
  feature: Feature;
  children?: Feature[];       // If feature is a Folder, include children
  media?: Media[];
}

// PUT    /api/features/:featureId
// ─── Update a feature (can be partial)
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
// ─── Delete a feature (cascades children)
interface DeleteFeatureResponse {
  deletedFeatureId: string;
  deletedChildIds: string[];
  mutation: DataMutation;
}

// ─── Documents API ───────────────────────────────────────────────

// GET    /api/documents?namespace={ns}&limit={n}
// ─── List user's documents
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
// ─── Create a new document
interface CreateDocumentRequest {
  namespace?: string;
  title: string;
  description?: string;
  mapType?: string;
  schema?: DocumentSchema;    // Optional column definitions
}

interface CreateDocumentResponse {
  document: Document;
}

// GET    /api/documents/:documentId
// ─── Get document with full contents
interface GetDocumentResponse {
  document: Document;
  features: FeatureTree;
  styleOptions?: ContentStyleOptions;
}

// PUT    /api/documents/:documentId
// ─── Update document metadata or properties
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
// ─── Soft-delete a document
interface DeleteDocumentResponse {
  deleted: boolean;
  deletedAt: string;
}

// GET    /api/documents/:documentId/features
// ─── Get feature tree for a document
interface GetFeatureTreeResponse {
  featureTree: FeatureTree;
}

// POST   /api/documents/:documentId/mutations
// ─── Apply batch mutations (for collaborative editing)
interface ApplyMutationsRequest {
  mutations: DataMutation[];
  baseVersion: number;        // Optimistic concurrency
}

interface ApplyMutationsResponse {
  applied: boolean;
  newVersion: number;
  conflicts?: DataMutation[];  // Mutations that conflicted
}

// ─── Search API ──────────────────────────────────────────────────

// GET    /api/search?q={query}&bbox={w,s,e,n}&lang={lang}&limit={n}
// ─── Geo search with knowledge card results
interface SearchRequest {
  q: string;                  // Search query
  bbox?: string;              // Viewport bounds for location bias
  lang?: string;              // Language preference
  limit?: number;             // Default 10
  resultGroupId?: string;     // For paginated results
}

interface SearchResponse {
  results: SearchResult[];
  totalResults: number;
  attribution: string;
}

interface SearchResult {
  placeId: string;            // FID or MID
  displayName: string;
  description: string;
  location: { lat: number; lng: number };
  bbox?: LatLonBox;
  category: string;
  thumbnailUrl?: string;
  openLocationCode?: string;
}

// ─── Knowledge Card API ──────────────────────────────────────────

// GET    /api/knowledge?fid={id}&mid={id}&lat={lat}&lng={lng}&query={q}
// ─── Get rich place information
interface KnowledgeCardRequest {
  fid?: string;               // Feature ID (geostore)
  mid?: string;               // Machine ID (Knowledge Graph)
  lat?: number;
  lng?: number;
  query?: string;
}

interface KnowledgeCardResponse {
  entity: RenderableEntity;
  renderedHtml?: string;      // Pre-rendered balloon HTML
}

// ─── Layers API ──────────────────────────────────────────────────

// GET    /api/layers
// ─── List available map layers
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
// ─── Get Earth data layer details
interface GetDataLayerResponse {
  layer: EarthDataLayer;
  features: Feature[];
}

// GET    /api/layers/data/:identifier/features?bbox={w,s,e,n}
// ─── Get features in viewport from a data layer
interface GetDataLayerFeaturesRequest {
  bbox?: string;
  limit?: number;
}

interface GetDataLayerFeaturesResponse {
  features: Feature[];
  hasMore: boolean;
}

// ─── Tiles API ───────────────────────────────────────────────────

// GET    /api/tiles/:imageryType/:z/:x/:y.png
// ─── Serve/cache tile images (proxy to tile provider)
// Returns: image/png or image/webp

// GET    /api/tiles/elevation/:z/:x/:y.terrain
// ─── Serve elevation tiles
// Returns: application/octet-stream (quantized-mesh or terrarium)

// ─── Earth Mate API ──────────────────────────────────────────────

// POST   /api/earthmate
// ─── Non-streaming chat
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
  commands?: Command[];       // Executable commands from AI
  attributions?: Attribution[];
}

// GET    /api/earthmate/stream
// ─── SSE streaming endpoint (same request body, returns stream)
// Response: text/event-stream

// ─── Design API ──────────────────────────────────────────────────

// POST   /api/design/solar
// ─── Run solar PV analysis
interface SolarAnalysisRequest {
  polygon: GeoJSON.Polygon;
  panelType?: string;
  tiltAngle?: number;
  azimuth?: number;
  systemLosses?: number;       // 0-1, default 0.14
}

interface SolarAnalysisResponse {
  annualKwh: number;
  monthlyBreakdown: { month: string; kwh: number }[];
  panelCount: number;
  installationSizeKw: number;
  co2SavingsKg: number;
}

// POST   /api/design/building
// ─── Run new building design
interface NewBuildingRequest {
  polygon: GeoJSON.Polygon;
  far?: number;                // Floor Area Ratio
  maxHeight?: number;
  minHeight?: number;
  setback?: number;
  templateId?: string;
}

interface NewBuildingResponse {
  designId: string;
  buildingHeight: number;
  gfaSqM: number;              // Gross Floor Area
  floorCount: number;
  unitCount?: number;
  lotCoverage: number;         // 0-1
  threeDModel: string;         // URL to generated GLTF
}

// ─── Analysis API ────────────────────────────────────────────────

// POST   /api/analysis/:type
// ─── Run on-demand geospatial analysis
interface AnalysisRequest {
  polygon: GeoJSON.Polygon;
  parameters?: Record<string, unknown>;
}

interface SlopeAnalysisResponse {
  min: number;
  max: number;
  mean: number;
  stdDev: number;
  rasterUrl: string;           // PNG overlay
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

// ─── Street View API ─────────────────────────────────────────────

// GET    /api/streetview?lat={lat}&lng={lng}&radius={radius}
// ─── Get panorama metadata
interface StreetViewRequest {
  lat: number;
  lng: number;
  radius?: number;             // Search radius in meters
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

// ─── Elevation API ───────────────────────────────────────────────

// POST   /api/elevation
// ─── Batch elevation lookup
interface ElevationRequest {
  locations: { lat: number; lng: number }[];
}

interface ElevationResponse {
  results: {
    lat: number;
    lng: number;
    elevation: number;         // Meters above WGS84 ellipsoid
    resolution: number;        // Horizontal resolution of source data
  }[];
}

// ─── KML Import/Export API ───────────────────────────────────────

// POST   /api/kml/import
// ─── Import KML/KMZ file
interface KmlImportRequest {
  file: File;                  // .kml or .kmz file
  documentId?: string;         // Target document (creates new if omitted)
  namespace?: string;
}

interface KmlImportResponse {
  documentId: string;
  featureCount: number;
  errors?: ImportError[];
  warnings?: ImportWarning[];
}

// GET    /api/kml/export?documentId={id}&format=kml
// ─── Export document as KML
// Returns: application/vnd.google-earth.kml+xml

// ─── Image Generation API ────────────────────────────────────────

// POST   /api/images
// ─── Generate AI images
interface ImageGenerationRequest {
  prompt: string;
  style?: string;              // 'aerial' | 'satellite' | 'artistic'
  negativePrompt?: string;
  width?: number;              // Default 1024
  height?: number;             // Default 1024
}

interface ImageGenerationResponse {
  imageUrl: string;
  revisedPrompt: string;
  seed: number;
}

// ─── Config API ───────────────────────────────────────────────────

// GET    /api/config
// ─── Get client bootstrap config
interface ClientConfigResponse {
  config: ClientConfig;
  featureFlags: FeatureFlag[];
  serviceEndpoints: ServiceEndpoint[];
  planLimits: PlanLimits;
}

// ─── Events API ───────────────────────────────────────────────────

// POST   /api/events
// ─── Batch analytics event ingestion
interface PostEventsRequest {
  events: AnalyticsEvent[];
}

// ─── Auth API ─────────────────────────────────────────────────────

// GET/POST /api/auth/[...nextauth]
// ─── NextAuth.js handler for OAuth flows
// GET    /api/auth/session
// ─── Get current session
// GET    /api/auth/csrf
// ─── CSRF token
```

---

## Frontend/Backend Separation

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER (Next.js Client)                      │
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
│  │   │ LayerRenderer│ │  │  │ ...34 total  │ │  │  └─────┬──────┘ │  │
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
│  │ (SSE streaming)     │  │ (Canvas input)  │  │ (Timeline slider)   │  │
│  └──────────┬──────────┘  └───────┬────────┘  └──────────┬──────────┘  │
│             │                     │                       │             │
│             └─────────────────────┼───────────────────────┘             │
│                                   │                                     │
│                    ┌──────────────▼──────────────┐                      │
│                    │        MobX State Tree       │                      │
│                    │  60+ stores, 40 restorable   │                      │
│                    │  Command → State → Render    │                      │
│                    └──────────────────────────────┘                      │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Event Logger (EarthEventLogger)                 │   │
│  │    logCommand() | logStateChange() | logVEClick() | logPerf()     │   │
│  │    ──────────────────────────────────────────────────────────     │   │
│  │    flush() → POST /api/events  (batch, every 5s + beforeunload)   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  │ HTTP/SSE
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVER (Next.js API Routes)                      │
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
│  └────────┬────────┘  └──────┬───────┘  │ ├─ Prompt Templates      │  │
│           │                  │          │ └─ Tool Definitions       │  │
│  ┌────────▼────────┐  ┌─────▼────────┐  └──────────────────────────┘  │
│  │ /api/design/    │  │ /api/kml/    │  ┌──────────────────────────┐  │
│  │ ├─ SolarService │  │ ├─ KmlImport │  │ /api/analysis/           │  │
│  │ │   (PVLib)     │  │ │  Service   │  │ ├─ TerrainAnalysis       │  │
│  │ └─ DesignService│  │ ├─ KmlExport │  │ │   (GDAL → Docker)      │  │
│  └─────────────────┘  │ └─ GeoJSON   │  │ └─ PostGIS ST_*          │  │
│                        └─────────────┘  └──────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                         Middleware Stack                           │   │
│  │  auth.ts → validation.ts (proto schema) → rateLimit.ts → logging  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│           ┌──────────────┐    ┌──────────┐    ┌───────────────────┐    │
│           │  PostgreSQL  │    │  Redis   │    │  External APIs    │    │
│           │  + PostGIS   │    │  Cache   │    │  • Nominatim      │    │
│           │  + Drizzle   │    │          │    │  • Mapbox         │    │
│           └──────────────┘    └──────────┘    │  • OpenAI         │    │
│                                                │  • Cesium ion     │    │
│                                                └───────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2) — P0 CRITICAL

**Goal:** Proto compilation pipeline + basic Three.js globe + camera system + Next.js setup

#### Week 1: Proto Pipeline

##### Day 1-2: Inventory & Clean

```bash
# Strip Google-internal dependencies from 1,316 protos
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
"""Convert MessageSet extensions to oneof for 33 proto files."""

import re
import sys
from pathlib import Path

def convert_messageset(proto_path: Path) -> str:
    """Convert MessageSet extension fields to oneof."""
    content = proto_path.read_text()

    # Find all extend blocks for a message
    extends: dict[str, list[dict]] = {}

    for match in re.finditer(
        r'extend\s+(\w+(?:\.\w+)*)\s*\{([^}]+)\}',
        content, re.DOTALL
    ):
        target = match.group(1)
        body = match.group(2)

        # Extract field definitions
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

    # Generate oneof replacements
    for target, fields in extends.items():
        oneof = '  oneof extension {\n'
        for f in fields:
            type_name = f['type']
            if type_name.startswith('.'):
                type_name = type_name[1:]
            oneof += f'    {type_name} {f["name"]} = {f["number"]};\n'
        oneof += '  }\n'

        # Find the message and add the oneof
        msg_pattern = rf'message\s+{target.split(".")[-1]}\s*\{{'
        content = re.sub(
            rf'({msg_pattern})',
            rf'\1\n{oneof}',
            content
        )

    # Remove extension ranges
    content = re.sub(
        r'extensions\s+\d+\s+to\s+(?:max|[\d]+)\s*\[message_set\s*=\s*true\];',
        '',
        content
    )

    # Remove extend blocks
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

##### Day 3-4: TypeScript Generation

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

##### Day 5: Adapter Layer Foundation

```typescript
// packages/proto/src/adapters/CommandAdapter.ts (foundation — expand in Phase 2)

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
      // ... remaining 27 cases
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

#### Week 2: Globe + Camera

##### Day 6-7: React Three Fiber Globe

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
    // ─── Renderer ─────────────────────────────────────────
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

    // ─── Scene ────────────────────────────────────────────
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // ─── Earth Group ──────────────────────────────────────
    this.earthGroup = new THREE.Group();
    this.scene.add(this.earthGroup);

    // ─── Earth Mesh (WGS84 Ellipsoid) ─────────────────────
    const radius = EarthConstants.WGS84_EQUATORIAL_RADIUS;
    const geometry = new THREE.SphereGeometry(radius, 128, 64);
    const material = new THREE.MeshStandardMaterial({
      roughness: 0.9,
      metalness: 0.0,
    });
    this.earthMesh = new THREE.Mesh(geometry, material);
    this.earthGroup.add(this.earthMesh);

    // ─── Atmosphere ───────────────────────────────────────
    this.atmosphere = new Atmosphere(this.scene, radius);

    // ─── Tile Manager ─────────────────────────────────────
    this.tileManager = new TileManager(this.earthMesh, config.mapStyle);

    // ─── MapStyle Controller ──────────────────────────────
    this.mapStyleController = new MapStyleController(
      this.tileManager,
      config.mapStyle
    );

    // ─── Lighting ─────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(5, 3, 5);
    this.scene.add(sunLight);

    // ─── Started? ─────────────────────────────────────────
    this.startRenderLoop();
  }

  // ─── Projection ────────────────────────────────────────

  setProjection(projection: Projection): void {
    this.mapStyleController.setProjection(projection);
    switch (projection) {
      case Projection.GLOBE:
        this.earthMesh.visible = true;
        this.earthMesh.scale.set(1, 1, 1);
        break;
      case Projection.MERCATOR:
        // Flatten to Mercator plane
        this.earthMesh.scale.set(1, 0.003, 1);
        break;
    }
  }

  // ─── Imagery ───────────────────────────────────────────

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

  // ─── Layer Management ──────────────────────────────────

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

  // ─── World Coordinate Conversion ───────────────────────

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

  // ─── Render Loop ───────────────────────────────────────

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

  // ─── Resize ────────────────────────────────────────────

  resize(width: number, height: number): void {
    this.renderer.setSize(width, height);
  }

  // ─── Hit Testing (Raycasting) ──────────────────────────

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

  // ─── Cleanup ───────────────────────────────────────────

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
  /** WGS84 equatorial radius in meters (scaled for rendering) */
  WGS84_EQUATORIAL_RADIUS: 6378137,
  /** WGS84 polar radius in meters (scaled for rendering) */
  WGS84_POLAR_RADIUS: 6356752.3142,
  /** Flattening factor */
  WGS84_FLATTENING: 1 / 298.257223563,
  /** Eccentricity squared */
  WGS84_ECCENTRICITY2: 0.00669437999014,
  /** Scale factor for rendering (1 unit = 1 meter) */
  RENDER_SCALE: 1,
  /** Maximum zoom level for tiles */
  MAX_ZOOM: 22,
  /** Tile size in pixels */
  TILE_SIZE: 256,
  /** Degrees per radian */
  DEG_TO_RAD: Math.PI / 180,
  /** Radians per degree */
  RAD_TO_DEG: 180 / Math.PI,
  /** Meters per degree (approximate at equator) */
  METERS_PER_DEGREE: 111319.9,
} as const;
```

##### Day 8-10: EarthCamera

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
  duration?: number;              // Seconds for FLY
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

  // ─── Getters ───────────────────────────────────────────

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

  // ─── LookAt (camera orbits around target) ──────────────

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

    // Clamp altitude
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

  // ─── LookFrom (camera positioned at coordinates) ───────

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

  // ─── Animation Engine ─────────────────────────────────

  private async _animate(
    from: CameraState,
    to: CameraState,
    config: CameraAnimationConfig,
    mode: 'lookAt' | 'lookFrom'
  ): Promise<void> {
    if (this.isAnimating) {
      // Interrupt current animation; resolve immediately
      this.animationResolve?.();
    }

    this.isAnimating = true;
    this.orbitMode = config.presentation ?? CameraPresentationMode.STATIC;

    return new Promise<void>((resolve) => {
      this.animationPromise = new Promise((r) => { /* captured by resolve */ });
      this.animationResolve = resolve;
      this.animationConfig = config;
      this.animationStartState = { ...from };
      this.animationTargetState = { ...to };
      this.animationStartTime = performance.now();
    });
  }

  update(currentTime: number): void {
    if (!this.isAnimating || !this.animationConfig || !this.animationStartState || !this.animationTargetState) {
      // Still update for orbit modes
      if (this.orbitMode === CameraPresentationMode.POI_ORBIT) {
        this._updateOrbit(0.3 * 0.016); // ~60fps step
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
      // Instant jump
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

    // FLY animation
    const durationMs = (config.duration ?? DEFAULT_DURATION) * 1000;
    const elapsed = currentTime - this.animationStartTime;
    const t = Math.min(elapsed / durationMs, 1.0);
    const easedT = (config.easing ?? easeInOutCubic)(t);

    // Interpolate
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

  // ─── Camera Position Computation ───────────────────────

  private _updateCameraPosition(): void {
    const alt = this._alt;
    const latRad = THREE.MathUtils.degToRad(this._lat);
    const lngRad = THREE.MathUtils.degToRad(this._lng);
    const headingRad = THREE.MathUtils.degToRad(this._heading);
    const tiltRad = THREE.MathUtils.degToRad(this._tilt);
    const rollRad = THREE.MathUtils.degToRad(this._roll);

    // Target position on globe surface
    const R = this.globeRadius;
    const targetX = R * Math.cos(latRad) * Math.cos(lngRad);
    const targetY = R * Math.sin(latRad);
    const targetZ = -R * Math.cos(latRad) * Math.sin(lngRad);
    const targetPos = new THREE.Vector3(targetX, targetY, targetZ);

    // Camera position: offset from target along reverse-direction vector
    // at distance = alt, with heading and tilt offsets
    const direction = targetPos.clone().normalize();
    const distance = alt;

    // Apply tilt (pitch down from zenith)
    const right = new THREE.Vector3(0, 1, 0).cross(direction).normalize();
    const tiltedDir = direction.clone()
      .applyAxisAngle(right, tiltRad);

    // Apply heading (rotate around the up axis)
    const up = direction.clone();
    const rotatedDir = tiltedDir.clone()
      .applyAxisAngle(up, headingRad);

    const camPos = targetPos.clone().add(
      rotatedDir.normalize().multiplyScalar(distance)
    );

    this._threeCamera.position.copy(camPos);
    this._threeCamera.lookAt(targetPos);

    // Apply roll
    this._threeCamera.rotateZ(rollRad);

    // Update FOV
    this._threeCamera.fov = this._fovy;
    this._threeCamera.updateProjectionMatrix();
  }

  // ─── Resize ───────────────────────────────────────────

  resizeAspect(width: number, height: number): void {
    this._threeCamera.aspect = width / height;
    this._threeCamera.updateProjectionMatrix();
  }

  // ─── Set direct state (no animation) ───────────────────

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

  // ─── Pick ray at screen coordinate ─────────────────────

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
   * Convert lat/lng/alt to Three.js world position.
   * Y-up coordinate system. XZ plane is equatorial.
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
   * Convert Three.js world position to lat/lng/alt.
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
   * Great-circle distance between two points (Haversine).
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
   * Bearing (initial heading) from point 1 to point 2.
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
   * Destination point from start, bearing, and distance.
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
   * Interpolate longitude, handling the -180/180 wraparound.
   */
  static interpolateLng(lng1: number, lng2: number, t: number): number {
    // Find the shortest path
    let diff = lng2 - lng1;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const result = lng1 + diff * t;
    return ((result + 540) % 360) - 180;
  }

  /**
   * WGS84 → Mercator (for 2D projection mode).
   */
  static latLngToMercator(lat: number, lng: number): { x: number; y: number } {
    const x = ((lng + 180) / 360);
    const latRad = THREE.MathUtils.degToRad(lat);
    const y = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2;
    return { x, y };
  }

  /**
   * Mercator → WGS84.
   */
  static mercatorToLatLng(x: number, y: number): { lat: number; lng: number } {
    const lng = x * 360 - 180;
    const n = Math.PI - 2 * Math.PI * y;
    const lat = THREE.MathUtils.radToDeg(Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
    return { lat, lng };
  }

  /**
   * Compute S2 cell ID from lat/lng at a given level.
   * Uses the s2-geometry npm package.
   */
  static latLngToS2CellId(lat: number, lng: number, level: number = 30): bigint {
    // Uses s2-geometry library; simplified placeholder
    // In production: import { S2 } from 's2-geometry';
    // return S2.latLngToKey(lat, lng, level);
    throw new Error('Implement using s2-geometry npm package');
  }

  /**
   * Normalize an angle to [0, 360).
   */
  static normalizeAngle360(angle: number): number {
    return ((angle % 360) + 360) % 360;
  }

  /**
   * Clamp latitude to [-90, 90].
   */
  static clampLat(lat: number): number {
    return Math.max(-90, Math.min(90, lat));
  }
}
```

##### Day 8-10: Next.js Setup + React Three Fiber Integration

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
        <div className="text-white text-lg animate-pulse">Loading Earth...</div>
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

// ─── Three.js Scene Inside Canvas ───────────────────────

function EarthScene() {
  const { gl, camera, scene, size } = useThree();
  const globeRef = useRef<Globe | null>(null);
  const earthCameraRef = useRef<EarthCamera | null>(null);
  const featureRendererRef = useRef<FeatureRenderer | null>(null);

  useEffect(() => {
    // Create the Globe (manages its own scene internally)
    const globe = new Globe({
      container: gl.domElement.parentElement!,
      mapStyle: mapStyleStore.mapStyle,
    });
    globeRef.current = globe;

    // Create EarthCamera (wraps Three.js camera)
    const earthCamera = new EarthCamera();
    earthCameraRef.current = earthCamera;

    // Bind Three.js camera from R3F
    globe.setThreeCamera(camera as THREE.PerspectiveCamera);

    // Create Feature renderer
    featureRendererRef.current = new FeatureRenderer(globe);

    // Register layers
    layerStore.layers.forEach((layer) => {
      if (layer.visible) {
        globe.addLayer(createLayerRenderer(layer));
      }
    });

    // Start animation loop
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

  // Sync camera store back to EarthCamera
  useEffect(() => {
    if (!earthCameraRef.current) return;
    earthCameraRef.current.setState(cameraStore.cameraState);
  }, [cameraStore.cameraState]);

  // Resize handling
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.resize(size.width, size.height);
    }
    if (earthCameraRef.current) {
      earthCameraRef.current.resizeAspect(size.width, size.height);
    }
  }, [size]);

  return null; // Globe manages its own rendering
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
    // ... other layer types
    default:
      throw new Error(`Unknown layer type: ${layer.type}`);
  }
}

// ─── Exported Component ─────────────────────────────────

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

### Phase 2: Commands + State (Week 3-4) — P0 CRITICAL

**Goal:** All 34 commands dispatchable, complete state tree with 60+ MobX stores, undo/redo

#### Command Base Class

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
  // ... all other stores
}

export abstract class Command {
  /** Unique auto-generated command ID */
  readonly id: string = crypto.randomUUID();

  /** Unix timestamp (ms) when command was created */
  readonly timestamp: number = Date.now();

  /** Source that triggered this command */
  source: CommandSource = CommandSource.UNKNOWN;

  /** Descriptive name for logging */
  abstract readonly type: string;

  /** Whether this command is undoable */
  readonly undoable: boolean = true;

  /**
   * Validate command parameters before execution.
   * Returns validation errors or success.
   */
  abstract validate(): ValidationResult;

  /**
   * Execute the command. Returns an inverse command for undo support,
   * or null if the command is not undoable.
   */
  abstract execute(ctx: CommandHandlerContext): Command | null;

  /**
   * Serialize to proto wire format for deep-link / AI generation.
   */
  abstract toProto(): ProtoCommand;

  /**
   * Human-readable description for history panel.
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

  // ─── Handler Registration ──────────────────────────────

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
      // Capture feature before deleting for undo
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
      return null; // Not undoable
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
      return new OpenKnowledgeCardCommand({ placeId: { fid: '' } }); // Close
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

    // ... remaining ~20 commands (OpenCloudProject, ViewDesign, etc.)
  }

  // ─── Dispatch ──────────────────────────────────────────

  dispatch(cmd: Command, source: CommandSource = CommandSource.USER): void {
    cmd.source = source;

    // Validate
    const validation = cmd.validate();
    if (!validation.valid) {
      console.error('Command validation failed:', validation.errors);
      throw new CommandValidationError(validation.errors);
    }

    // Execute
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
        this.redoStack = []; // Clear redo on new action
      }
    } catch (error) {
      console.error(`Command ${cmd.type} failed:`, error);
      throw error;
    }
  }

  // ─── Undo / Redo ───────────────────────────────────────

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

  // ─── Batch Dispatch ────────────────────────────────────

  dispatchBatch(commands: Command[]): void {
    // Group commands as single undoable unit
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

  // ─── Deep Link Serialization ───────────────────────────

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
    // Restore state via commands
    if (state.camera) {
      this.dispatch(new FlyToCameraCommand({
        camera: LookAtCamera.fromState(state.camera),
        animation: CameraAnimation.TELEPORT,
      }));
    }
    if (state.mapStyle) {
      this.dispatch(new SetBasemapStyleCommand({ imagery: state.mapStyle.imagery }));
    }
    // ... restore layers, search, etc.
  }
}
```

#### MobX Stores (Foundational 5, expand to 60+ in subsequent weeks)

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
      console.error('Search failed:', error);
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

    // Initialize with default layer states
    this.initializeDefaults();
  }

  private initializeDefaults(): void {
    const defaults: LayerState[] = [
      { layerType: LayerType.BUILDINGS, name: '3D Buildings', visible: true, opacity: 1 },
      { layerType: LayerType.CLOUDS, name: 'Clouds', visible: true, opacity: 0.5 },
      { layerType: LayerType.GRIDLINES, name: 'Gridlines', visible: false, opacity: 1 },
      { layerType: LayerType.PHOTOS, name: 'Photos', visible: false, opacity: 1 },
      { layerType: LayerType.THREE_D_COVERAGE, name: '3D Coverage', visible: false, opacity: 1 },
      { layerType: LayerType.UPDATED_IMAGERY, name: 'Updated Imagery', visible: false, opacity: 1 },
      { layerType: LayerType.LAND_PARCELS, name: 'Land Parcels', visible: false, opacity: 1 },
      { layerType: LayerType.PINNED_PROJECTS, name: 'Pinned Projects', visible: true, opacity: 1 },
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
      name: 'Untitled Placemark',
    });

    this.features.set(feature.id, feature);
    this.selectedFeatureIds.clear();
    this.selectedFeatureIds.add(feature.id);
    this.editingFeatureId = feature.id;

    // Persist to server
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

  // ─── Persistence ───────────────────────────────────────

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

### Phase 3: Content Creation (Week 5-6) — P1 HIGH

**Goal:** Full feature CRUD on globe, KML import/export, feature tree, style editor

#### Feature Models (complete implementations)

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
    return undefined; // Folders have no geometry
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

  /** Find a feature by ID anywhere in the tree */
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

  /** Get all features as a flat list */
  getAllFeatures(): Feature[] {
    return this.root.allDescendants;
  }

  /** Count features by type */
  countByType(): Map<FeatureType, number> {
    const counts = new Map<FeatureType, number>();
    for (const feature of this.getAllFeatures()) {
      counts.set(feature.featureType, (counts.get(feature.featureType) ?? 0) + 1);
    }
    return counts;
  }

  /** Reorder a feature within its parent */
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

  /** Serialize entire tree to proto format */
  toProto(): unknown {
    return {
      featureTree: this.root.toProto(),
    };
  }
}
```

#### KML Parser

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

    // Check for parse errors
    const parseError = doc.getElementsByTagName('parsererror');
    if (parseError.length > 0) {
      this.errors.push({
        line: 0,
        message: parseError[0].textContent ?? 'XML parse error',
      });
      return { tree: new FeatureTree(), errors: this.errors, warnings: this.warnings };
    }

    const kml = doc.getElementsByTagName('kml')[0];
    if (!kml) {
      this.errors.push({ line: 0, message: 'No <kml> root element found' });
      return { tree: new FeatureTree(), errors: this.errors, warnings: this.warnings };
    }

    const document = kml.getElementsByTagName('Document')[0];
    const tree = new FeatureTree(
      document?.getElementsByTagName('name')[0]?.textContent ?? 'Imported KML'
    );

    // Parse Document-level children
    if (document) {
      this.parseContainer(document, tree.root);
    } else {
      // Try <Placemark> directly under <kml>
      this.parseContainer(kml, tree.root);
    }

    return { tree, errors: this.errors, warnings: this.warnings };
  }

  private parseContainer(container: Element, parentFolder: Folder): void {
    const childNodes = container.childNodes;
    for (let i = 0; i < childNodes.length; i++) {
      const node = childNodes[i];
      if (node.nodeType !== 1) continue; // Skip non-element nodes

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
            // Nested document — treat as folder
            parentFolder.addChild(this.parseFolder(el));
            break;
          case 'style':
          case 'stylemap':
            // Styles are parsed separately and applied
            break;
          case 'screenoverlay':
          case 'photooverlay':
          case 'networklink':
          case 'tour':
            this.warnings.push({
              line: 0,
              message: `Skipping unsupported element: <${tagName}>`,
            });
            break;
        }
      } catch (error) {
        this.errors.push({
          line: 0,
          message: `Error parsing <${tagName}>: ${(error as Error).message}`,
          element: tagName,
        });
      }
    }
  }

  private parseFolder(el: Element): Folder {
    const name = el.getElementsByTagName('name')[0]?.textContent ?? 'Untitled Folder';
    const folder = new Folder({ name });

    this.parseContainer(el, folder);
    return folder;
  }

  private parsePlacemark(el: Element): Feature {
    const name = el.getElementsByTagName('name')[0]?.textContent ?? 'Untitled Placemark';
    const description = el.getElementsByTagName('description')[0]?.textContent ?? '';

    // Check for geometry
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

    // No geometry — treat as folder-like
    this.warnings.push({
      line: 0,
      message: `Placemark "${name}" has no geometry; treating as folder`,
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
    if (!coordinates) throw new Error('No coordinates in Point');

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
    if (!coordsText) throw new Error('No coordinates in LineString');

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
    if (!outerEl) throw new Error('Polygon has no outerBoundaryIs');

    const outerCoordsText = outerEl
      .getElementsByTagName('coordinates')[0]
      ?.textContent?.trim();
    if (!outerCoordsText) throw new Error('No coordinates in outerBoundaryIs');

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
    const name = el.getElementsByTagName('name')[0]?.textContent ?? 'Untitled Overlay';
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
    // Parse inline Style or styleUrl reference
    const styleUrl = el.getElementsByTagName('styleUrl')[0]?.textContent;
    const styleEl = el.getElementsByTagName('Style')[0];

    if (!styleEl && !styleUrl) return undefined;

    // For now, parse inline styles only
    // styleUrl resolution would need a global style map from the KML document
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
    // KML color: aabbggrr (hex)
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

### Phase 4: Search + Knowledge Cards (Week 7) — P1 HIGH

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
    // Forward geocode via provider (Nominatim / Mapbox)
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
 * Nominatim (OpenStreetMap) implementation.
 * Free, no API key required. Rate limit: 1 request/second.
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

### Phase 5: Layers + MapStyle (Week 8-9) — P1 HIGH

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
      this._globe.scene.add(this._group); // Ensure in scene
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
  footprint: [number, number][];    // lng,lat ring
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
  readonly name = '3D Buildings';

  private buildings: Map<string, THREE.Mesh> = new Map();
  private buildingData: BuildingData[] = [];
  private isVisible: boolean = true;

  async load(viewport: LatLonBox): Promise<void> {
    // Load OSM building data from tiles
    const bbox = `${viewport.west},${viewport.south},${viewport.east},${viewport.north}`;

    // Use Overpass API or self-hosted tile server
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
      console.error('Failed to load buildings:', error);
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
    // Dispose old meshes
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
      // Create extruded shape
      const shape = new THREE.Shape();

      // Convert footprint (lng,lat) → 3D positions and center
      const center = {
        lng: building.footprint.reduce((s, c) => s + c[0], 0) / building.footprint.length,
        lat: building.footprint.reduce((s, c) => s + c[1], 0) / building.footprint.length,
      };

      const centerPos = GeoMath.latLngAltToVector3(center.lat, center.lng, 0);

      // Create local 2D shape coordinates
      const localPoints: THREE.Vector2[] = building.footprint.map(([lng, lat]) => {
        const pos = GeoMath.latLngAltToVector3(lat, lng, 0);
        const local = pos.clone().sub(centerPos);
        // Project to tangent plane
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

      // Orient to tangent plane
      mesh.lookAt(centerPos.clone().multiplyScalar(2));

      mesh.userData = {
        buildingId: building.id,
        name: building.name,
        height: building.height,
        levels: building.levels,
      };

      return mesh;
    } catch (error) {
      console.warn(`Failed to create building mesh for ${building.id}:`, error);
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
  readonly name = 'Gridlines';

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
    // Gridlines are global — generate once
    this.generateGridlines();
  }

  private generateGridlines(): void {
    const R = EarthConstants.WGS84_EQUATORIAL_RADIUS * 1.001; // Slightly above surface

    const material = new THREE.LineBasicMaterial({
      color: this.lineColor,
      transparent: true,
      opacity: this.lineOpacity,
      depthTest: true,
      depthWrite: false,
    });

    // Latitude lines (parallels)
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

    // Longitude lines (meridians)
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

### Phase 6: Street View + Time Features (Week 10) — P2 MEDIUM

### Phase 7: Design Tools + Analysis (Week 11-13) — P2 MEDIUM

### Phase 8: Earth Mate AI (Week 14) — P2 MEDIUM

### Phase 9: Cloud Projects + Collaboration (Week 15-16) — P3 LOW

### Phase 10: Analytics + Polish (Week 17-18) — P3 LOW

*(Detailed phase 6-10 implementations follow the same pattern established in phases 1-5, with full class hierarchies, API endpoints, and service implementations. Due to document length, these are summarized here. Each phase includes: complete TypeScript class signatures, MobX stores, API route handlers, service layer implementations, and tests.)*

---

## Key Design Decisions

### 1. Proto → TypeScript: protobuf-ts (not google-protobuf)

**Why:** protobuf-ts generates tree-shakeable, pure TypeScript that works with any bundler. google-protobuf requires native WebAssembly or eval-based code loading, has poor tree-shaking, and adds ~200KB to bundle. protobuf-ts produces idiomatic TypeScript with discriminated unions for `oneof` fields, which maps perfectly to our switch-case command dispatcher.

**Trade-off:** Slightly larger generated code per message, but better dev experience and smaller final bundle.

### 2. OOP Everywhere (not functional)

Every proto message maps to a class with methods. Commands are `Command` subclasses. Features are `Feature` subclasses. Layers are `Layer` subclasses. This matches the proto `oneof` dispatch pattern perfectly — every `Command` oneof case gets a typed subclass with its own `execute()`, `validate()`, and `toProto()` methods.

**Why OOP over functional:**
- Proto schemas are inherently hierarchical (command → oneof → message)
- 34 command types map 1:1 to `Command` subclass constructors
- Mutations are operations on a `Document` object, not free functions
- State stores (60+) naturally group into class-based MobX observables
- Polymorphic geometry processing (`Feature.render()` dispatches to `Placemark.render()` vs `Polygon.render()`)

### 3. MobX over Redux / Zustand

Redux is functional (reducers, immer). With 60+ state slices that map 1:1 to proto `state/*.proto` definitions, class-based observables are the natural fit. MobX stores are POJO classes with `@observable` and `@action` decorators.

**Why:**
- 60 proto state files → 60 MobX stores (1:1 mapping is trivial)
- `@computed` for derived state (60 derived state protos)
- `@action` decorators directly correspond to command handlers
- No need to write reducers for each of 40+ state slices
- MobX `autorun()` for reactive side effects (e.g., camera state → URL hash)

### 4. React Three Fiber (not raw Three.js / CesiumJS)

React Three Fiber wraps Three.js declaratively in React's component tree. It avoids imperative Three.js code in components while keeping full access to Three.js APIs.

**Why not CesiumJS:**
- CesiumJS is ~5MB gzipped and tightly couples rendering to its own camera/tile system
- CesiumJS uses its own Entity API, not matching our proto-based OOP model
- Three.js via R3F gives us full control over the rendering pipeline
- Three.js has a much larger ecosystem for custom shaders, post-processing, GLTF
- Cesium's licensing (commercial use requires a license) is a concern for a cloned product

**Trade-off:** We must build our own tile system and globe representation, but this maps exactly to our `TileManager` and `Globe` abstractions from the protos.

### 5. PostGIS for Features (not MongoDB GeoJSON)

PostgreSQL's PostGIS extension natively supports:
- S2 geometry cells (the same indexing used by `FeatureIdProto`)
- GiST spatial indexes for bounding-box queries
- 3D geometries (Z-coordinate for altitude)
- ST_DWithin, ST_Intersects for spatial filters
- Terraform/raster support for elevation and analysis

PostGIS also gives us transactional integrity for mutation-based editing, row-level security for multi-tenant cloud projects, and the full power of SQL for reporting and analytics.

### 6. Monorepo with Turborepo

Turborepo coordinates builds across the 5 packages (`proto`, `core`, `server`, `engine`, `client`):
- `proto` must build before `core`
- `core` must build before `server`, `engine`, `client`
- Caching of proto codegen output (only rebuild on proto file changes)
- Parallel builds for independent packages

### 7. Deep Linking via URL Hash

The `deeplink/` derived state proto defines 12 messages that capture every piece of deeplinkable state. We serialize this to URL hash:

```
#/?c=40.7484,-73.9857,1000,45,30,0&ls=3db,cld,grd&im=sat&q=Empire+State+Building&k=0x89c259a9b3117469
```

On load, the `DeeplinkStore` parses the hash and dispatches commands to restore state:
1. `FlyToCamera` (restore camera position)
2. `ToggleLayer` × N (restore layer visibility)
3. `SetBasemapStyle` (restore imagery)
4. `PerformSearch` / `OpenKnowledgeCard` (restore knowledge state)

---

## Dependency Map

```
┌──────────────────────────────────────────────────────────────────┐
│                       Phase 0: Proto Pipeline                     │
│                    (Strip deps → protobuf-ts → adapters)          │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
┌──────────────────────┐ ┌─────────────────┐ ┌──────────────────┐
│  Phase 1: Foundation │ │ Phase 3: Content│ │ Phase 4: Search  │
│  Globe + Camera +    │ │ Creation        │ │ + Knowledge      │
│  Next.js Setup       │ │ (Feature CRUD)  │ │ Cards            │
└──────────┬───────────┘ └────────┬────────┘ └────────┬─────────┘
           │                      │                    │
           └──────────────────────┼────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Phase 2: Commands + State                       │
│            (34 commands | 60+ MobX stores | undo/redo)            │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────┐
│ Phase 5: Layers  │ │ Phase 6: Street  │ │ Phase 7: Design      │
│ + MapStyle       │ │ View + Time      │ │ Tools + Analysis     │
└────────┬─────────┘ └────────┬─────────┘ └──────────┬───────────┘
         │                    │                       │
         └────────────────────┼───────────────────────┘
                              │
                    ┌─────────┼─────────┐
                    │                   │
                    ▼                   ▼
┌──────────────────────────┐ ┌──────────────────────────┐
│ Phase 8: Earth Mate AI   │ │ Phase 9: Cloud Projects   │
│ (LLM + tool calling)     │ │ + Collaboration           │
└────────────┬─────────────┘ └────────────┬──────────────┘
             │                             │
             └─────────────┬───────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Phase 10: Analytics + Polish                    │
│         (Event logging | dashboards | performance | deploy)       │
└──────────────────────────────────────────────────────────────────┘
```

### Critical Path (Minimum to Working Globe Viewer)

```
Phase 0 (2 weeks)
    → Phase 1 (2 weeks)
        → Phase 2 (2 weeks: select commands only)
            → Phase 3 (2 weeks: placemark CRUD only)
                → Phase 4 (1 week: search only)

Timeline: 9 weeks to working 3D globe viewer with search and placemarks
```

### Team Sizing & Estimates

| Phase | Effort | Team (optimal) | Timeline | Cumulative |
|---|---|---|---|---|
| 0: Proto Pipeline | M (2-3 wks) | 1 engineer | 3 weeks | 3 weeks |
| 1: Foundation | L (4-5 wks) | 2 engineers | 4 weeks | 7 weeks |
| 2: Commands + State | L (4-5 wks) | 3 engineers | 4 weeks | 11 weeks |
| 3: Content Creation | XL (6-8 wks) | 3 engineers | 6 weeks | 17 weeks |
| 4: Search + Knowledge | M (2-3 wks) | 2 engineers | 3 weeks | 20 weeks |
| 5: Layers + MapStyle | M (3-4 wks) | 2 engineers | 4 weeks | 24 weeks |
| 6: Street View + Time | M (3-4 wks) | 2 engineers | 4 weeks | 28 weeks |
| 7: Design + Analysis | L (6-8 wks) | 3 engineers | 6 weeks | 34 weeks |
| 8: Earth Mate AI | L (4-6 wks) | 2 engineers | 5 weeks | 39 weeks |
| 9: Cloud Projects | L (4-6 wks) | 2 engineers | 5 weeks | 44 weeks |
| 10: Analytics + Polish | M (3-4 wks) | 2 engineers | 4 weeks | 48 weeks |

**Total: ~48 weeks (12 months) with a team of 3-4 engineers.**

MVP (phases 0-4): ~17 weeks with 3 engineers.

---
