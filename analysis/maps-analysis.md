# Google Maps Protobuf Schema — Complete Analysis

> **Total files:** 344 `.proto` files across 64 subdirectories
> **Generated:** 2026-08-12
> **Root:** `maps/`

---

## Table of Contents

1. [Directory Overview](#directory-overview)
2. [API Shared](#1-api-shared-mapsapisharedpaintproto)
3. [Crisis](#2-crisis-mapscrisisproto)
4. [Directions](#3-directions-mapsdirections)
5. [Dynamic World](#4-dynamic-world-mapsdynamicworldproto)
6. [GMM (Google Mobile Maps)](#5-gmm-mapsgmm)
7. [Indoor](#6-indoor-mapsindoorproto)
8. [LIMO (Local Inventory Maps Onboarding)](#7-limo-mapslimoproto)
9. [Logs](#8-logs-mapslogs)
10. [Paint](#9-paint-mapspaint)
11. [Pathfinder](#10-pathfinder-mapspathfinder)
12. [Road Traffic](#11-road-traffic-mapsroadtrafficproto)
13. [Shared](#12-shared-mapsshared)
14. [Spotlight](#13-spotlight-mapsspotlightproto)
15. [Tactile](#14-tactile-mapstactile)
16. [Transit](#15-transit-mapstransit)
17. [Utilities](#16-utilities-mapsutil)
18. [Versatile](#17-versatile-mapsversatileproto)

---

## Directory Overview

| Directory | Files | Purpose |
|-----------|-------|---------|
| `maps/tactile/` | **190** | Tactile Maps rendering API — the largest subgraph. Entity details, directions, search, ads, shared types, photo, transit, hotels, parking, EV |
| `maps/paint/` | **75** | Map painting/styling/rendering engine. Client vector tiles, styling, feature selection, labeling, metadata |
| `maps/pathfinder/` | **31** | Route-finding engine (CRP-based). Path search, ranking, alternates, autonomous driving, tolls, vehicle energy |
| `maps/directions/` | **16** | Directions service. Client stats, customization, tolls, MRP (multi-route planning), tilerendering |
| `maps/roadtraffic/` | **9** | Traffic models. Incident metadata, traffic model types, path encoding, travel modes |
| `maps/shared/` | **9** | Shared types across Maps subsystems. Geometry, mapcore API, labeling, testing |
| `maps/spotlight/` | **12** | Spotlight feature (entity detail cards). Ads, search, hotel integration, crisis display |
| `maps/versatile/` | **10** | Versatile map vector format. Vector features, render ops, styles, data-bound values |
| `maps/transit/` | **11** | Public transit. Options, fares, routing signals, cost models, transit entity descriptions |
| `maps/gmm/` | **4** | Google Mobile Maps. Network type enums, promoted pin ads, camera, draw metadata |
| `maps/indoor/` | **1** | Indoor mapping. Building/level/relation/interactive entity protos |
| `maps/limo/` | **4** | Local Inventory Maps Onboarding. Context, platform, product types |
| `maps/crisis/` | **1** | Crisis category enums (wildfire, earthquake, flood, etc.) |
| `maps/dynamicworld/` | **1** | Geo event categories (sports, concerts, conventions, etc.) |
| `maps/api/shared/paint/` | **2** | Maps API shared paint types |
| `maps/util/` | **3** | Utility types. Geometry transforms, tile coordinates, tile bitmaps |
| `maps/logs/` | **1** | VE (Visual Elements) logging options |

---

## 1. API Shared (`maps/api/shared/paint/proto/`)

### `maps/api/shared/paint/proto/maps-api-layer.proto`
- **Package:** `maps_api`
- **Messages:** `MapsApiLayer`
- **Imports:** None
- **Role:** Defines the Maps API layer type for external API consumers, providing a bridge between internal paint layers and the public Maps API surface.
- **Feature Points:** Public API exposure, layer abstraction

### `maps/api/shared/paint/proto/maps_api_metadata.proto`
- **Package:** `maps_api`
- **Messages:** `MapsApiMetadata`
- **Imports:** None
- **Role:** Metadata structure for Maps API responses, carrying attribution and copyright information for map tile consumption.
- **Feature Points:** API metadata, copyright tracking

---

## 2. Crisis (`maps/crisis/proto/`)

### `maps/crisis/proto/crisis_category.proto`
- **Package:** `maps.crisis.proto`
- **Enums:** `CrisisCategory` (30+ values: ATTACK, AVALANCHE, EARTHQUAKE, FLOOD, HURRICANE, PANDEMIC, TSUNAMI, VOLCANO, WILDFIRE, etc.)
- **Imports:** `logs/proto/logs_annotations/logs_annotations.proto`
- **Role:** Categorization of crisis/natural disaster events for crisis-aware map rendering and emergency response features.
- **Feature Points:** Crisis mapping, emergency response, natural disaster classification

---

## 3. Directions (`maps/directions/`)

### `maps/directions/proto/directions_client_stats.proto`
- **Package:** `maps_directions`
- **Messages:** `DirectionsClientStats`
- **Enums:** `DirectionsClient` (35 values: GMM_NAVIGATION, MAPS_TACTILE, WEB_SPOTLIGHT, NAV_GO, GEMINI_MAPS_EXTENSION, ASK_MAPS, etc.), `DirectionsContext` (47 values: ACTIVE_NAVIGATION, SEARCH_ALONG_ROUTE, etc.), `DirectionsClientPlatform` (WEB, ANDROID, IOS, PAINT)
- **Imports:** `logs/proto/logs_annotations`, `storage/datapol/annotations`
- **Role:** Statistics and context tracking for directions requests, identifying which client (35+ clients from GMM Navigation to Ask Maps), which usage context (47 contexts), and which platform originated the request.
- **Feature Points:** Client attribution, analytics, multi-platform tracking, Gemini integration

### `maps/directions/customization/config/serving_protos/parameter_value.proto`
- **Package:** `maps_directions.customization`
- **Messages:** `ParameterValue`, `ParameterValues`
- **Imports:** None
- **Role:** Key-value parameter storage for directions customization, allowing per-request tuning of routing preferences and constraints.
- **Feature Points:** Custom routing parameters, per-request configuration

### `maps/directions/customization/config/serving_protos/passability.proto`
- **Package:** `maps_directions.customization`
- **Messages:** `PassabilityAssignment`, `UnconditionalPassabilityAssignment`, `AttributeBasedPassabilityAssignment`, `Passability`, `CutConstraints`
- **Enums:** `VehicleType` (CAR, BIKE, FOOT, SCOOTER)
- **Imports:** `maps/directions/customization/config/serving_protos/parameter_value.proto`
- **Role:** Defines road passability constraints (e.g., road closures, vehicle restrictions) for customized routing, supporting conditional and unconditional passability rules.
- **Feature Points:** Road closure handling, vehicle-type passability, custom routing constraints

### `maps/directions/mrp/proto/affordances.proto`
- **Package:** `maps.mrp`
- **Messages:** `AffordanceEnums`
- **Enums:** `Class` (TRUCK, TRUCK_IMPASSABLE, TRUCK_HAZMAT, AVOID, PREFER, etc.)
- **Role:** Multi-Route Planning (MRP) affordance classes for truck-specific routing, including hazardous materials, impassable roads, and preference-based avoidance.
- **Feature Points:** Truck routing, hazardous materials, route affordances

### `maps/directions/mrp/proto/cost_function_spec_type.proto`
- **Package:** `maps.mrp`
- **Messages:** `CostFunctionSpecType`
- **Role:** Defines the specification types for cost functions in multi-route planning, determining how route costs are computed and compared.
- **Feature Points:** Multi-route cost optimization, route comparison

### `maps/directions/mrp/proto/risk_averse_routing_status.proto`
- **Package:** `maps.mrp`
- **Enums:** `RiskAverseRoutingStatus`
- **Role:** Status flags for risk-averse routing decisions in MRP, indicating when safer (even if slower) routes should be preferred.
- **Feature Points:** Risk-averse routing, safety-prioritized navigation

### `maps/directions/mrp/server/metrics/path_metrics.proto`
- **Package:** `maps.mrp`
- **Messages:** `PathMetrics`
- **Imports:** `maps/directions/mrp/proto/cost_function_spec_type.proto`
- **Role:** Server-side metrics collection for MRP path computation, measuring cost function performance and path quality.
- **Feature Points:** MRP metrics, path quality analysis, server monitoring

### `maps/directions/tilerenderer/proto/directions_pipe_parameters.proto`
- **Package:** `maps_directions_pipe`
- **Messages:** `DirectionsPipeParameters`
- **Imports:** `maps/directions/proto/directions_client_stats.proto`
- **Role:** Pipeline parameters for the directions tilerenderer, configuring how directions tiles are rendered for map display.
- **Feature Points:** Tile-based directions rendering, render pipeline configuration

### `maps/directions/tilerenderer/proto/simple_directions_request.proto`
- **Package:** `maps_directions_pipe`
- **Messages:** `SimpleDirectionsRequest`
- **Imports:** `maps/directions/tilerenderer/proto/directions_pipe_parameters.proto`, `maps/shared/common/geom/geom.proto`
- **Role:** Simplified directions request format for tilerenderer consumption, containing camera, output options, and pipe parameters.
- **Feature Points:** Lightweight directions requests, tile-aligned rendering

### `maps/directions/tolls/proto/client_id.proto`
- **Package:** `maps_tolls`
- **Messages:** `ClientId`
- **Role:** Identifies the toll system client/originator, used for toll price calculation attribution.
- **Feature Points:** Toll pricing, client origin tracking

### `maps/directions/tolls/proto/pass_type.proto`
- **Package:** `maps_tolls`
- **Enums:** `PassType` (E-ZPass, SunPass, FasTrak, etc.)
- **Role:** Enumeration of supported toll pass types across different regions, enabling accurate toll cost estimation based on user's pass.
- **Feature Points:** Toll pass support, regional toll calculation

### `maps/directions/tolls/proto/pricing_factors.proto`
- **Package:** `maps_tolls`
- **Messages:** `PricingFactors`
- **Imports:** `maps/directions/tolls/proto/pass_type.proto`, `maps/directions/tolls/proto/vehicle_attributes.proto`
- **Role:** Aggregates vehicle attributes, toll passes, and payment method for computing personalized toll prices along a route.
- **Feature Points:** Personalized toll pricing, vehicle-specific tolls

### `maps/directions/tolls/proto/vehicle_attributes.proto`
- **Package:** `maps_tolls`
- **Messages:** `VehicleAttributes`
- **Enums:** `VehicleType`
- **Role:** Vehicle classification for toll calculation including axle count, weight, height, and vehicle type (car, truck, RV, motorcycle).
- **Feature Points:** Vehicle-based toll computation, axle/weight/height factors

### `maps/directions/copilot/traffic_report/experiments.proto`
- **Package:** `maps_directions.copilot`
- **Messages:** `TrafficReportExperimentalParameters`
- **Role:** Experimental parameter configuration for Copilot traffic reports, enabling A/B testing of traffic reporting features.
- **Feature Points:** Traffic report experiments, Copilot integration

### `maps/directions/copilot/traffic_report/traffic_report_audio_type.proto`
- **Package:** `maps_directions.copilot`
- **Enums:** `TrafficReportAudioType`
- **Role:** Classification of audio content types for Copilot traffic reports (e.g., spoken alerts, chimes).
- **Feature Points:** Audio traffic reports, multimodal alerts

### `maps/directions/copilot/traffic_report/traffic_report_icon.proto`
- **Package:** `maps_directions.copilot`
- **Enums:** `TrafficReportIcon`
- **Role:** Icon types for visual traffic report display in the Copilot UI.
- **Feature Points:** Traffic visualization, Copilot UI integration

### `maps/directions/copilot/traffic_report/traffic_report_prompt_type.proto`
- **Package:** `maps_directions.copilot`
- **Enums:** `TrafficReportPromptType`
- **Role:** Prompt type classification for interactive traffic reports in Copilot, enabling different interaction modes.
- **Feature Points:** Interactive traffic prompts, conversational navigation

---

## 4. Dynamic World (`maps/dynamicworld/proto/`)

### `maps/dynamicworld/proto/geo_event_category.proto`
- **Package:** `maps_dynamicworld`
- **Enums:** `GeoEventCategory` (50+ values: SPORTS, CONCERT, PARADE, ART, FOOD_AND_DRINK, CONVENTION, CRISIS, COMMUNITY, etc. with sub-categories)
- **Imports:** `storage/datapol/annotations`
- **Role:** Hierarchical categorization of real-world geo-events shown on maps, covering sports events (baseball, soccer, racing), cultural events (concerts, theater), and community events.
- **Feature Points:** Dynamic event mapping, geo-event categorization, real-world event overlay

---

## 5. GMM (`maps/gmm/`)

### `maps/gmm/api/network_type_enums.proto`
- **Package:** `gmm`
- **Enums:** `NetworkType` (WIFI, CELL, BLUETOOTH, ETHERNET, SATELLITE), `CellNetworkType` (EDGE, GPRS, UMTS, CDMA, LTE, NR, NRNSA, HSPA, etc.)
- **Imports:** `logs/proto/logs_annotations`, `storage/datapol/annotations`
- **Role:** Network connectivity type enumerations for Google Mobile Maps, tracking the user's current network for adaptive map tile loading and offline support decisions.
- **Feature Points:** Adaptive map loading, network-aware tile fetching, mobile optimization

### `maps/gmm/api/promoted_pin_ads_common.proto`
- **Package:** `gmm`
- **Messages:** `PromotedPinAdsCommon`
- **Imports:** `storage/datapol/annotations`
- **Role:** Common data structures for promoted pin advertisements in GMM, carrying ad impression and click-through data.
- **Feature Points:** Promoted pin ads, mobile ad integration

### `maps/gmm/camera/proto/camera-fallback-status.proto`
- **Package:** `gmm`
- **Enums:** `CameraFallbackStatus`
- **Imports:** `storage/datapol/annotations`
- **Role:** Status indicator for camera fallback scenarios in GMM, e.g., when the device camera is unavailable for AR features.
- **Feature Points:** AR camera handling, fallback management

### `maps/gmm/webview/api/common/draw-metadata.proto`
- **Package:** `gmm`
- **Messages:** `DrawMetadata`
- **Imports:** `storage/datapol/annotations`
- **Role:** Metadata for GMM WebView draw operations, controlling rendering behavior in embedded map views.
- **Feature Points:** WebView rendering, embedded map control

---

## 6. Indoor (`maps/indoor/proto/`)

### `maps/indoor/proto/indoor.proto`
- **Package:** `maps.indoor`
- **Messages:** `IndoorBuildingProto`, `IndoorLevelProto`, `IndoorRelationProto`, `IndoorLevelReference`, `IndoorInteractiveEntityProto`, `IndoorBuildingDirectoryMetadata`
- **Imports:** `geostore/base/proto/point.proto`, `geostore/base/proto/rect.proto`, `maps/tactile/api/entity-details-common.proto`, `net/proto2/bridge/proto/message_set.proto`
- **Role:** Comprehensive indoor mapping data model: buildings with multiple levels, level metadata (elevation, viewport), interactive entities (POIs on specific levels), building directory metadata, and indoor relations connecting features across levels.
- **Feature Points:** Indoor maps, multi-level buildings, indoor POI interaction, floor picker, building directories

---

## 7. LIMO (`maps/limo/proto/`)

### `maps/limo/proto/context.proto`
- **Package:** `maps_limo`
- **Enums:** `Context` (GMM, LOCAL_UNIVERSAL, ASSISTANT, SPOTLIGHT)
- **Imports:** `logs/proto/logs_annotations`
- **Role:** Context enumeration for Local Inventory Maps Onboarding (LIMO), identifying which Maps surface is making the request.
- **Feature Points:** LIMO integration, multi-surface context

### `maps/limo/proto/platform.proto`
- **Package:** `maps_limo`
- **Enums:** `ClientPlatform` (ANDROID, IOS)
- **Imports:** `logs/proto/logs_annotations`
- **Role:** Platform identification for LIMO to enable platform-specific inventory display and interaction behavior.
- **Feature Points:** Platform-specific LIMO behavior

### `maps/limo/proto/product_category.proto`
- **Package:** `maps_limo`
- **Enums:** `ProductCategory`
- **Imports:** `logs/proto/logs_annotations`
- **Role:** Product category classification for local inventory items shown on maps.
- **Feature Points:** Local inventory categorization

### `maps/limo/proto/product_type.proto`
- **Package:** `maps_limo`
- **Enums:** `ProductType`
- **Imports:** `logs/proto/logs_annotations`
- **Role:** Fine-grained product type enumeration for LIMO inventory display.
- **Feature Points:** Inventory product typing

---

## 8. Logs (`maps/logs/`)

### `maps/logs/logging/ve_logging_options.proto`
- **Package:** `maps_logs`
- **Messages:** `VeLoggingOptions`
- **Role:** Configuration for Visual Elements (VE) logging, controlling how map visual elements are logged for analytics and debugging.
- **Feature Points:** Visual element logging, analytics, debugging

---

## 9. Paint (`maps/paint/`)

The paint subsystem is the core map rendering engine, responsible for:
- **Client vector tiles** — the rendered tile format consumed by map clients
- **Style system** — feature selection, style mapping, visual element definitions
- **Label engine** — label placement, density control, representation tagging
- **Metadata** — accessibility, air quality, categorical search, major events, seasonal events, transit entrances
- **Output pipeline** — image, vector, SVG, 3D tiles, road graph tiles, copyrights

### Paint Core

#### `maps/paint/proto/paint-request.proto`
- **Package:** `maps_paint`
- **Messages:** `PaintRequest` (with extensions for logging sensitivity and pre-sanitized request)
- **Enums:** `OutputType` (IMAGE, VECTOR, FEATUREMAP, PERTILE, COPYRIGHTS, SVG, ROAD_GRAPH_TILE, OGC_3D_TILES, OGC_3D_TILES_SUBTREE)
- **Imports:** `maps/paint/proto/feature-options.proto`, `maps/paint/proto/label-placement-options.proto`, `maps/paint/proto/layer-description.proto`, `maps/paint/proto/output-options.proto`, `maps/paint/proto/paint-style-options.proto`, `maps/paint/proto/pipe-metadata.proto`, `maps/paint/proto/region-description.proto`
- **Role:** Master paint request message — defines regions to render, layers to include, output format (raster, vector, SVG, 3D tiles, road graph), styling, labeling, and pipeline metadata. The entry point for all map rendering.
- **Feature Points:** Map rendering pipeline, multi-format output, 3D tiles, road graph, satellite imagery alignment

#### `maps/paint/proto/layer-description.proto`
- **Package:** `maps_paint`
- **Messages:** `LayerDescription`, `ThickZoomConfig`
- **Enums:** `Type` (MAP, SATELLITE_IMAGERY, TERRAIN, PLAIN_TERRAIN, TERRAIN_SHADING, TERRAIN_CONTOURS, AUX, ROAD_GRAPH, CANNED)
- **Imports:** `maps/api/shared/paint/proto/maps-api-layer.proto`, `maps/paint/proto/overlay.proto`, `maps/spotlight/proto/spotlight-description.proto`
- **Role:** Layer specification for map rendering — what type of content (base map, satellite, terrain, road graph), epoch versioning, overlay configuration, API layer integration, and spotlight description.
- **Feature Points:** Multi-layer rendering, terrain shading, satellite overlay, road graph, epoch-based versioning

#### `maps/paint/proto/region-description.proto`
- **Package:** `maps_paint`
- **Messages:** `RegionDescription`
- **Imports:** None
- **Role:** Geographic region specification for paint requests — defines bounds, zoom level, and tile coverage for targeted rendering.
- **Feature Points:** Region-based rendering, tile coverage control

#### `maps/paint/proto/feature-selector.proto`
- **Package:** `maps_paint`
- **Messages:** `CustomStylerDescription`, `FeatureSelector`, `FeatureStyleSelector`, `StyleSelector`, `StylerSelector` (+ nested option messages)
- **Enums:** `StylerType` (TEXT_SCALE, VISIBILITY, COLOR_MODIFYING, DASH_PATTERN_MODIFYING, WIDTH, API_KEY_ZOOM)
- **Imports:** `geostore/base/proto/feature.proto`, `maps/paint/proto/legendary/legendary.proto`, `maps/paint/styler/color-modifying-styler.proto`, `maps/versatile/proto/rendering-category.proto`
- **Role:** Feature-based style selection engine — connects map features (roads, buildings, POIs) to visual stylers (color transforms, text scaling, line widths, dash patterns) based on feature types and categories.
- **Feature Points:** Feature-driven styling, custom map styles, API key-based styling, dark mode, visibility control

#### `maps/paint/proto/feature-options.proto`
- **Package:** `maps_paint`
- **Messages:** `FeatureOptions`
- **Imports:** `maps/paint/proto/feature-selector.proto`, `maps/paint/proto/label-density-restrictions.proto`
- **Role:** Global feature rendering options — enables/disables feature categories, applies feature-level styling overrides, and manages label density restrictions.
- **Feature Points:** Feature toggling, global style overrides, density management

#### `maps/paint/proto/paint-style-options.proto`
- **Package:** `maps_paint`
- **Messages:** `PaintStyleOptions`
- **Enums:** `MapType` (ROADMAP, SATELLITE, TERRAIN, HYBRID), `ColorScheme` (LIGHT, DARK, SATELLITE)
- **Imports:** `maps/paint/proto/feature-selector.proto`, `maps/paint/proto/fetchable-style-set.proto`, `maps/paint/proto/legend-named-style.proto`, `maps/paint/proto/style-table-mapping.proto`, `maps/paint/proto/styler-description.proto`, `maps/paint/proto/sub-style-tag.proto`
- **Role:** Top-level style configuration — map type, color scheme (light/dark/satellite), style table mapping, and named legend styles. Controls the overall visual appearance of the rendered map.
- **Feature Points:** Light/dark mode, map type switching, style tables, theming

#### `maps/paint/proto/paint-parameters.proto`
- **Package:** `maps_paint`
- **Messages:** `PaintParameters`
- **Imports:** `maps/paint/proto/paint-request.proto`
- **Role:** Pipeline parameters for the paint service, carrying paint requests with additional server-side configuration.
- **Feature Points:** Server-side paint configuration

#### `maps/paint/proto/output-options.proto`
- **Package:** `maps_paint`
- **Messages:** `ImageOptions`, `VectorOptions`, `KmzOptions` (deprecated), `PerTileOptions`, `FeaturemapOptions`, `CopyrightsOptions`, `SvgOptions`, `RoadGraphTileOptions`, `GlbOptions`
- **Imports:** `maps/paint/proto/output-debug-options.proto`
- **Role:** Format-specific output configuration — image format (PNG, JPEG, WebP), vector tile encoding, SVG generation, road graph tile settings, and GLB (glTF binary) 3D model output options.
- **Feature Points:** Multi-format export, image encoding, vector tiles, 3D model output

#### `maps/paint/proto/output-debug-options.proto`
- **Package:** `maps_paint`
- **Messages:** `OutputDebugOptions`
- **Role:** Debug configuration for paint output — enables diagnostic overlays, debug tiles, and rendering inspection features.
- **Feature Points:** Render debugging, diagnostic visualization

### Paint Styling

#### `maps/paint/proto/visual-element.proto`
- **Package:** `maps_paint`
- **Messages:** `VisualElement`
- **Role:** Definition of a single visual element on the map — combines geometry, style, and rendering properties into one renderable unit.
- **Feature Points:** Visual element abstraction, renderable map objects

#### `maps/paint/proto/styler-description.proto`
- **Package:** `maps_paint`
- **Messages:** `StylerDescription`
- **Imports:** `maps/paint/proto/sub-style-tag.proto`
- **Role:** Styler framework description — defines how visual properties are computed and applied to map features based on tags and conditions.
- **Feature Points:** Dynamic styling, conditional rendering

#### `maps/paint/proto/sub-style-tag.proto`
- **Package:** `maps_paint`
- **Messages:** `SubStyleTag`
- **Role:** Tagging system for sub-styles, enabling fine-grained style application to specific visual sub-components.
- **Feature Points:** Sub-style targeting, component-level styling

#### `maps/paint/proto/style-table-mapping.proto`
- **Package:** `maps_paint`
- **Messages:** `StyleTableMapping`
- **Role:** Maps style table identifiers to visual properties, providing an indexed lookup for efficient style application at render time.
- **Feature Points:** Style indexing, efficient style lookup

#### `maps/paint/proto/fetchable-style-set.proto`
- **Package:** `maps_paint`
- **Messages:** `FetchableStyleSet`
- **Imports:** `maps/paint/proto/legend-named-style.proto`
- **Role:** Style sets that can be fetched on-demand by clients, supporting dynamic style loading for custom map experiences.
- **Feature Points:** Dynamic style fetching, custom map themes

#### `maps/paint/proto/legend-named-style.proto`
- **Package:** `maps_paint`
- **Messages:** `LegendNamedStyle`
- **Imports:** `maps/paint/proto/feature-selector.proto`
- **Role:** Named styles for map legends, providing consistent visual identity for map elements across different zoom levels and map types.
- **Feature Points:** Legend styling, consistent visual identity

#### `maps/paint/proto/resource.proto`
- **Package:** `maps_paint`
- **Messages:** `PaintResource`
- **Role:** Resource descriptor for paint assets (textures, icons, patterns) used in map rendering.
- **Feature Points:** Asset management, texture loading

#### `maps/paint/proto/texture.proto`
- **Package:** `maps_paint`
- **Messages:** `Texture`
- **Role:** Texture data specification for map rendering, including format, dimensions, and encoded image data.
- **Feature Points:** Map textures, image encoding

#### `maps/paint/styler/color-modifying-styler.proto`
- **Package:** `maps_paint`
- **Messages:** `ColorTransform`
- **Enums:** `Action` (ADJUST_HUE, ADJUST_SATURATION, ADJUST_LIGHTNESS, ADJUST_GAMMA, INVERT_LIGHTNESS, SET_COLOR)
- **Role:** Color transformation operations for map styling — HSL adjustments, gamma correction, and direct color setting for dynamic theme support.
- **Feature Points:** Color theming, dark mode transforms, dynamic styling

#### `maps/paint/styler/legend/font-properties.proto`
- **Package:** `maps_paint`
- **Messages:** `FontProperties`
- **Imports:** `maps/paint/proto/font-family.proto`
- **Role:** Font property specifications (family, size, weight, style) for map label rendering.
- **Feature Points:** Map typography, font configuration

#### `maps/paint/proto/font-family.proto`
- **Package:** `maps_paint`
- **Enums:** `FontFamily`
- **Role:** Font family enumeration for map label rendering.
- **Feature Points:** Map typography, font selection

#### `maps/paint/proto/legendary/legendary.proto`
- **Package:** `maps_paint`
- **Messages:** `LegendarySystem`
- **Imports:** `maps/paint/proto/texture.proto`
- **Role:** The "Legendary" system — advanced map legend and style mapping infrastructure connecting feature types to visual representations with texture support.
- **Feature Points:** Advanced legend system, style mapping

### Paint Labeling

#### `maps/paint/proto/label-placement-options.proto`
- **Package:** `maps_paint`
- **Messages:** `LabelPlacementOptions`
- **Imports:** `maps/paint/proto/label-density-restrictions.proto`, `maps/paint/proto/label-representation-tag.proto`
- **Role:** Configuration for the label placement engine — controls how map labels are positioned, prioritized, and deconflicted during rendering.
- **Feature Points:** Label placement, conflict resolution, label prioritization

#### `maps/paint/proto/label-density-restriction.proto`
- **Package:** `maps_paint`
- **Messages:** `LabelDensityRestriction`
- **Role:** Per-label-type density restriction — limits how many labels of a given type can be displayed in a viewport.
- **Feature Points:** Label density control, viewport optimization

#### `maps/paint/proto/label-density-restrictions.proto`
- **Package:** `maps_paint`
- **Messages:** `LabelDensityRestrictions`
- **Imports:** `maps/paint/proto/label-density-restriction.proto`
- **Role:** Collection of label density restrictions, aggregated for the paint request.
- **Feature Points:** Aggregate density management

#### `maps/paint/proto/label-representation-tag.proto`
- **Package:** `maps_paint_client`
- **Messages:** `LabelRepresentationTag`
- **Role:** Tags used to identify and group label representations, enabling selective styling and density control by label type.
- **Feature Points:** Label typing, representation tagging

#### `maps/paint/proto/map-element-id.proto`
- **Package:** `maps_paint`
- **Messages:** `MapElementId`
- **Role:** Unique identifier for each rendered map element, supporting interactivity and logging attribution.
- **Feature Points:** Element identification, interaction tracking

### Paint Client Vector Tiles

#### `maps/paint/proto/client-vector-tile.proto`
- **Package:** `maps_paint_client`
- **Messages:** `LineRenderOp`, `PolygonRenderOp`, `PointRenderOp`, `ClientVectorTile`, `ClientVectorRegion`, `ClientVectorSegment` (+ many nested types)
- **Enums:** `CapShape`, `JointShape`, `GroundOverlayType`, etc.
- **Imports:** `maps/paint/proto/client-vector-annotation-targeting.proto`, `maps/paint/proto/client-vector-data-bound-value.proto`, `maps/paint/proto/client-vector-label.proto`, `maps/paint/proto/client-vector-style-info.proto`, `maps/paint/proto/client-vector-style.proto`, `maps/paint/proto/client-vector-tile-debug.proto`, `maps/paint/proto/client-vector-tile-serialization.proto`, `maps/paint/proto/maps-metadata-container.proto`, `maps/shared/mapcore/api/proto/pose.proto`, `maps/util/geometry-transform.proto`, `maps/util/tile_coordinate.proto`
- **Role:** The core client-side vector tile format — what mobile/web clients receive and render. Defines line, polygon, and point render operations with vertex data, styles, z-ordering, segment-level multi-zoom style IDs, metadata, interactivity, and data-bound values.
- **Feature Points:** Client vector tiles, GPU-efficient rendering, segment styling, z-ordering, multi-zoom styles

#### `maps/paint/proto/client-vector-tile-extensions.proto`
- **Package:** `maps_paint_client`
- **Messages:** Various extension messages for client vector tiles
- **Imports:** `maps/paint/proto/client-vector-tile.proto`
- **Role:** Extensions to the client vector tile format, adding support for additional rendering features and metadata.
- **Feature Points:** Tile format extensibility

#### `maps/paint/proto/client-vector-tile-serialization.proto`
- **Package:** `maps_paint_client`
- **Messages:** Serialization-related messages
- **Imports:** `maps/paint/proto/client-vector-tile.proto`
- **Role:** Serialization/deserialization helpers for client vector tiles, enabling efficient wire-format transfer.
- **Feature Points:** Tile serialization, wire format

#### `maps/paint/proto/client-vector-tile-debug.proto`
- **Package:** `maps_paint_client`
- **Messages:** Debug information for client vector tiles
- **Imports:** `maps/paint/proto/client-vector-tile.proto`
- **Role:** Debug metadata embedded in client vector tiles for rendering diagnostics and development.
- **Feature Points:** Render debugging, tile inspection

#### `maps/paint/proto/client-vector-tile-ugc-extensions.proto`
- **Package:** `maps_paint_client`
- **Messages:** UGC-related extensions
- **Imports:** `maps/paint/proto/client-vector-tile.proto`
- **Role:** User-Generated Content extensions for client vector tiles, supporting community-contributed map data display.
- **Feature Points:** UGC display, community contributions

#### `maps/paint/proto/client-vector-style.proto`
- **Package:** `maps_paint_client`
- **Messages:** `ClientVectorStyle`
- **Imports:** `maps/paint/proto/client-vector-style-info.proto`
- **Role:** Client-side vector style definitions — colors, strokes, fills, patterns, and other visual properties for rendered vector features.
- **Feature Points:** Client-side styling, visual property definitions

#### `maps/paint/proto/client-vector-style-info.proto`
- **Package:** `maps_paint_client`
- **Messages:** `ClientVectorStyleInfo`
- **Imports:** `maps/paint/proto/client-vector-style.proto`
- **Role:** Extended style information for client vector rendering, including metadata about style origin and derivation.
- **Feature Points:** Style metadata, style provenance

#### `maps/paint/proto/client-vector-label.proto`
- **Package:** `maps_paint_client`
- **Messages:** `ClientVectorLabel`
- **Imports:** `maps/paint/proto/client-vector-tile.proto`
- **Role:** Label data within client vector tiles — text content, positioning, styling, and categorization of map labels.
- **Feature Points:** Client-side labels, text rendering

#### `maps/paint/proto/client-vector-data-bound-value.proto`
- **Package:** `maps_paint_client`
- **Messages:** `DataBoundValue`
- **Role:** Data-bound values for client vector rendering — values that change based on runtime data (e.g., traffic conditions, weather), enabling dynamic map styling.
- **Feature Points:** Data-driven styling, dynamic map updates

#### `maps/paint/proto/client-vector-annotation-targeting.proto`
- **Package:** `maps_paint_client`
- **Messages:** Annotation targeting messages
- **Imports:** `maps/paint/proto/client-vector-tile.proto`
- **Role:** Targeting information for vector annotations — determines which annotations apply to which features based on experiment cohorts and feature attributes.
- **Feature Points:** Annotation targeting, experiment-based display

#### `maps/paint/proto/client-vector-ops.proto`
- **Package:** `maps_paint_client`
- **Messages:** Vector operation messages
- **Imports:** `maps/paint/proto/client-vector-tile.proto`
- **Role:** Operations for manipulating client vector tiles — merging, filtering, transforming rendered vector data.
- **Feature Points:** Tile operations, vector manipulation

#### `maps/paint/proto/client-vector-snapping.proto`
- **Package:** `maps_paint_client`
- **Messages:** Vector snapping messages
- **Imports:** `maps/paint/proto/client-vector-tile.proto`
- **Role:** Snapping configuration for vector elements — controls how map features align to roads, buildings, and other geometry for precise placement.
- **Feature Points:** Feature snapping, precise placement

#### `maps/paint/proto/client-style-transforms.proto`
- **Package:** `maps_paint_client`
- **Messages:** `ClientStyleTransforms`
- **Role:** Client-side style transformations — runtime style modifications applied to vector tiles for dynamic theming and personalization.
- **Feature Points:** Dynamic theming, runtime style transforms

#### `maps/paint/proto/client-vector-metadata.proto`
- **Package:** `maps_paint_client`
- **Messages:** `ClientVectorMetadata`
- **Role:** Metadata for client vector rendering — carries information about tile origin, processing pipeline, and rendering hints.
- **Feature Points:** Rendering metadata, pipeline tracking

### Paint Metadata

#### `maps/paint/proto/maps-metadata-container.proto`
- **Package:** `maps_paint`
- **Messages:** `MapsMetadataContainer`
- **Role:** Container for various types of map metadata — aggregates accessibility, air quality, search, events, transit, and other metadata into a single structure per map element.
- **Feature Points:** Metadata aggregation, multi-type metadata

#### `maps/paint/proto/accessibility-metadata.proto`
- **Package:** `maps_paint`
- **Messages:** `AccessibilityMetadata`
- **Role:** Accessibility information for map features (e.g., wheelchair-accessible entrances, accessible transit stations) rendered on the map.
- **Feature Points:** Accessibility mapping, inclusive navigation

#### `maps/paint/proto/air-quality-metadata.proto`
- **Package:** `maps_paint`
- **Messages:** `AirQualityMetadata`
- **Role:** Air quality data for map overlay display, including AQI values, pollutant concentrations, and monitoring station data.
- **Feature Points:** Air quality overlay, environmental mapping

#### `maps/paint/proto/air-quality-heatmap-metadata.proto`
- **Package:** `maps_paint`
- **Messages:** `AirQualityHeatmapMetadata`
- **Role:** Heatmap-specific metadata for air quality visualization, controlling color ramps and interpolation.
- **Feature Points:** Air quality heatmaps, interpolated visualization

#### `maps/paint/proto/annotation-application-info.proto`
- **Package:** `maps_paint`
- **Messages:** `AnnotationApplicationInfo`
- **Role:** Information about how annotations are applied to map features — which annotation rules matched and why.
- **Feature Points:** Annotation debugging, rule tracking

#### `maps/paint/proto/batch-logging-instruction.proto`
- **Package:** `maps_paint`
- **Messages:** `BatchLoggingInstruction`
- **Role:** Instructions for batch-logging map interactions and impressions to analytics systems.
- **Feature Points:** Batch logging, analytics integration

#### `maps/paint/proto/categorical-search-metadata.proto`
- **Package:** `maps_paint`
- **Messages:** `CategoricalSearchMetadata`
- **Role:** Metadata for categorical search results displayed on the map — stores search categories, result counts, and display hints.
- **Feature Points:** Search results visualization, category display

#### `maps/paint/proto/field-options.proto`
- **Package:** `maps_paint`
- **Messages:** Field option extensions
- **Role:** Proto field option extensions for the paint subsystem, providing custom annotations on proto fields.
- **Feature Points:** Proto customization, field annotations

#### `maps/paint/proto/interactivity.proto`
- **Package:** `maps_paint`
- **Messages:** `InteractivityProto`
- **Role:** Interactivity data for map elements — defines what happens when a user taps/clicks a map feature (e.g., show info card, navigate, call).
- **Feature Points:** Map interactivity, tap/click handling

#### `maps/paint/proto/major-event-metadata.proto`
- **Package:** `maps_paint`
- **Messages:** `MajorEventMetadata`
- **Role:** Metadata for major event display on maps — sports games, concerts, parades with event timing and venue information.
- **Feature Points:** Event mapping, live event display

#### `maps/paint/proto/maps_impression_data.proto`
- **Package:** `maps_paint`
- **Messages:** `MapsImpressionData`
- **Role:** Impression tracking data for map elements, logging which features were visible to the user and for how long.
- **Feature Points:** Impression tracking, visibility analytics

#### `maps/paint/proto/overlay.proto`
- **Package:** `maps_paint`
- **Messages:** `OverlayLayerProto`
- **Role:** Overlay layer definition — KMZ/KML layers, custom tile overlays, and user-defined map content.
- **Feature Points:** Custom overlays, KML/KMZ support

#### `maps/paint/proto/painted-region.proto`
- **Package:** `maps_paint`
- **Messages:** `PaintedRegion`
- **Role:** Describes regions of the map that have been painted/rendered, including coverage and status information.
- **Feature Points:** Render coverage tracking

#### `maps/paint/proto/pipe-metadata.proto`
- **Package:** `maps_paint`
- **Messages:** `PipeMetadata`
- **Role:** Pipeline metadata for the paint rendering pipeline — carries version, timing, and provenance information through the render pipeline.
- **Feature Points:** Pipeline tracking, render provenance

#### `maps/paint/proto/places-list-metadata.proto`
- **Package:** `maps_paint`
- **Messages:** `PlacesListMetadata`
- **Role:** Metadata for place list display on maps — favorite lists, want-to-go lists, shared lists rendered as map markers.
- **Feature Points:** Place lists, saved places visualization

#### `maps/paint/proto/poi-logging-instruction.proto`
- **Package:** `maps_paint`
- **Messages:** `PoiLoggingInstruction`
- **Role:** Logging instructions specific to POI (Point of Interest) interactions — tap, long-press, and info card views.
- **Feature Points:** POI interaction logging

#### `maps/paint/proto/promoted-place-logging-metadata.proto`
- **Package:** `maps_paint`
- **Messages:** `PromotedPlaceLoggingMetadata`
- **Role:** Logging metadata for promoted/advertised places on the map, tracking ad impressions and interactions.
- **Feature Points:** Ad logging, promoted place tracking

#### `maps/paint/proto/promoted-place-navigation-logging-metadata.proto`
- **Package:** `maps_paint`
- **Messages:** `PromotedPlaceNavigationLoggingMetadata`
- **Role:** Navigation-specific logging for promoted places — tracks when users navigate to advertised destinations.
- **Feature Points:** Ad navigation tracking, conversion attribution

#### `maps/paint/proto/seasonal-event-metadata.proto`
- **Package:** `maps_paint`
- **Messages:** `SeasonalEventMetadata`
- **Role:** Metadata for seasonal/holiday events shown on maps (e.g., Christmas markets, cherry blossom season).
- **Feature Points:** Seasonal mapping, holiday events

#### `maps/paint/proto/static-realtime-metadata.proto`
- **Package:** `maps_paint`
- **Messages:** `StaticRealtimeMetadata`
- **Role:** Metadata for combining static map data with real-time updates (e.g., live transit arrivals, current traffic).
- **Feature Points:** Real-time overlays, live data integration

#### `maps/paint/proto/transit-station-entrance-metadata.proto`
- **Package:** `maps_paint`
- **Messages:** `TransitStationEntranceMetadata`
- **Role:** Metadata for transit station entrance display — entrance locations, types, accessibility info rendered on the map.
- **Feature Points:** Transit entrance mapping, station accessibility

---

## 10. Pathfinder (`maps/pathfinder/`)

The pathfinder subsystem is the route-finding engine, built on the CRP (Customizable Route Planning) framework. It handles:
- **Path search** — finding optimal routes between waypoints
- **MRP** — Multi-Route Planning with cost functions and selector specifications
- **Alternates** — finding alternative routes
- **CRP modules** — configurable pathfinding, ranking, and searcher modules
- **Client** — waypoints, cost models, customization, experiments, on-demand transport
- **Autonomous** — assisted driving support for autonomous vehicles
- **Shared** — route types, dynamic config, alternates methods

### Pathfinder Client

#### `maps/pathfinder/client/find-path-input.proto`
- **Package:** `pathfinder`
- **Messages:** `FindPathInput` (the master route request), `RequeryInput`, `BetterRouteFoundOptions`, `TrafficReportOptions`, `WaypointPairing`, `DistanceUnits`, `VehicleEnergyOptions`, `TollOptions`, `RoutingConstraint`, `AssistedDrivingOptions`, `RoadsideFacilityOptions`, `RestrictionsOptions`, `SustainabilityOptions` (+ many nested enums)
- **Enums:** `WaypointPairing`, `DistanceUnits`, `TextOutputType`, `DirectionsVerbosity`, `MetricsOnlyMode`, `RouteType`, `RequestOrigin`, `TripTrafficReportMode`, `TripsetTrafficReportMode`, `TrafficTrendOptions`, `ConstraintType`
- **Imports:** 20+ imports covering EV options, assisted driving, tolls, experiments, waypoints, traffic, transit, customization
- **Role:** The central route-finding request — specifies waypoints, cost models, vehicle energy (EV), toll preferences, routing constraints, assisted driving options, traffic report requests, sustainability labeling, and all output format preferences. Connects pathfinder to every other subsystem.
- **Feature Points:** Route finding, EV routing, toll calculation, traffic-aware routing, assisted driving, sustainability, multi-waypoint optimization, road closures

#### `maps/pathfinder/client/waypoint.proto`
- **Package:** `pathfinder`
- **Messages:** `Waypoint`, along with sub-messages for location specification
- **Imports:** `geostore/base/proto/featureid.proto`, `maps/pathfinder/client/anchor_position.proto`, `maps/pathfinder/client/anchor_type.proto`, `maps/pathfinder/client/boarded_transit_vehicle.proto`, `maps/pathfinder/client/cost-model-options.proto`
- **Role:** Waypoint specification for pathfinding — location, anchor type, arrival/departure preferences, boarded transit vehicle info, and per-waypoint cost model overrides.
- **Feature Points:** Waypoint specification, transit boarding, anchor positioning

#### `maps/pathfinder/client/cost-model-options.proto`
- **Package:** `pathfinder`
- **Messages:** `CostModelOptions`, with sub-messages for different cost models (driving, walking, biking, transit)
- **Imports:** `maps/pathfinder/client/mrp-cost-function-specification.proto`
- **Role:** Cost model configuration — defines how route costs are computed for each travel mode, including time, distance, fuel, toll, and user preference weightings.
- **Feature Points:** Multi-modal cost models, preference-based routing

#### `maps/pathfinder/client/customization_inputs.proto`
- **Package:** `pathfinder`
- **Messages:** `CustomizationInputs`
- **Imports:** `maps/directions/customization/config/serving_protos/passability.proto`
- **Role:** Passes customization data (passability overrides, vehicle preferences) to the pathfinder for personalized routing.
- **Feature Points:** Route customization, passability overrides

#### `maps/pathfinder/client/experiments.proto`
- **Package:** `pathfinder`
- **Messages:** `ExperimentalParameters`
- **Imports:** `maps/pathfinder/client/cost-model-options.proto`
- **Role:** Experimental parameter container for pathfinder A/B testing — enables feature flags and experimental cost models.
- **Feature Points:** A/B testing, experimental routing

#### `maps/pathfinder/client/mrp-cost-function-specification.proto`
- **Package:** `pathfinder`
- **Messages:** `MrpCostFunctionSpecification`
- **Imports:** `maps/directions/mrp/proto/cost_function_spec_type.proto`
- **Role:** Specification of cost functions used in Multi-Route Planning for ranking and selecting among alternative routes.
- **Feature Points:** MRP cost functions, route ranking

#### `maps/pathfinder/client/mrp-ranking-options.proto`
- **Package:** `pathfinder`
- **Messages:** `MrpRankingOptions`
- **Role:** Configuration for how MRP ranks alternative routes — weighting of different criteria (speed, simplicity, fuel efficiency).
- **Feature Points:** Route ranking, alternative scoring

#### `maps/pathfinder/client/mrp-selector-specification.proto`
- **Package:** `pathfinder`
- **Messages:** `MrpSelectorSpecification`
- **Role:** Specification for the MRP route selector engine, determining which routes are selected from the search pool.
- **Feature Points:** Route selection, MRP filtering

#### `maps/pathfinder/client/mrp-vehicle-info.proto`
- **Package:** `pathfinder`
- **Messages:** `MrpVehicleInfo`
- **Role:** Vehicle information for MRP routing — vehicle type, dimensions, and capabilities for cost calculation.
- **Feature Points:** Vehicle-aware routing, MRP vehicle models

#### `maps/pathfinder/client/on-demand-transportation.proto`
- **Package:** `pathfinder`
- **Messages:** `OnDemandTransportationOptions`, `TaxiOptions`, `BikesharingOptions`
- **Imports:** None
- **Role:** Configuration for on-demand transportation modes (ride-hailing, taxi, bike-sharing) as part of route planning.
- **Feature Points:** Ride-hailing integration, bike-sharing routing

#### `maps/pathfinder/client/pathfinder-request-building-options.proto`
- **Package:** `pathfinder`
- **Messages:** `PathfinderRequestBuildingOptions`
- **Role:** Options controlling how the pathfinder builds requests, including batching and parallelization settings.
- **Feature Points:** Request optimization, parallel pathfinding

#### `maps/pathfinder/client/polyline-codec.proto`
- **Package:** `pathfinder`
- **Messages:** `PolylineCodecOptions`
- **Enums:** `CodecType`
- **Role:** Polyline encoding options — controls how route polylines are encoded (compressed format, precision) for the response.
- **Feature Points:** Polyline compression, route visualization

#### `maps/pathfinder/client/voice-guidance-options.proto`
- **Package:** `pathfinder`
- **Messages:** `VoiceGuidanceOptions`
- **Role:** Configuration for voice guidance generation during route planning.
- **Feature Points:** Voice navigation, turn-by-turn guidance

#### `maps/pathfinder/client/anchor_position.proto`
- **Package:** `pathfinder`
- **Messages:** `AnchorPosition`
- **Role:** Anchor position specification — where on a road segment a waypoint is anchored for snapping.
- **Feature Points:** Waypoint snapping, road anchoring

#### `maps/pathfinder/client/anchor_type.proto`
- **Package:** `pathfinder`
- **Enums:** `AnchorType`
- **Role:** Type of anchor for waypoint positioning (e.g., road center, shoulder, parking entrance).
- **Feature Points:** Anchor classification

#### `maps/pathfinder/client/boarded_transit_vehicle.proto`
- **Package:** `pathfinder`
- **Messages:** `BoardedTransitVehicle`
- **Role:** Information about a currently-boarded transit vehicle for real-time route updates.
- **Feature Points:** Real-time transit routing, active journey tracking

#### `maps/pathfinder/client/building-level.proto`
- **Package:** `pathfinder`
- **Messages:** `BuildingLevel`
- **Role:** Building level specification for indoor routing — which floor of a building the waypoint is on.
- **Feature Points:** Indoor routing, multi-level navigation

#### `maps/pathfinder/client/distance_unit.proto`
- **Package:** `pathfinder`
- **Enums:** `DistanceUnit`
- **Role:** Distance unit enumeration for pathfinder output (kilometers, miles).
- **Feature Points:** Unit localization

#### `maps/pathfinder/client/generator-traffic-usage.proto`
- **Package:** `pathfinder`
- **Enums:** `GeneratorTrafficUsage`
- **Role:** Controls how traffic data is used during route generation — live, typical, or historical.
- **Feature Points:** Traffic data selection, time-aware routing

#### `maps/pathfinder/client/logging-context.proto`
- **Package:** `pathfinder`
- **Messages:** `LoggingContext`
- **Role:** Logging context for pathfinder requests — carries experiment IDs, client version, and request metadata for analytics.
- **Feature Points:** Request logging, analytics context

#### `maps/pathfinder/client/request-source.proto`
- **Package:** `pathfinder`
- **Enums:** `RequestSource`
- **Role:** Identifies the source of pathfinder requests (e.g., mobile app, web, API).
- **Feature Points:** Request attribution

#### `maps/pathfinder/client/travel_advisory.proto`
- **Package:** `pathfinder`
- **Messages:** `TravelAdvisory`
- **Role:** Travel advisory information for routes — warnings about road conditions, closures, or restrictions.
- **Feature Points:** Travel advisories, route warnings

### Pathfinder CRP (Customizable Route Planning)

#### `maps/pathfinder/crp/modules/path_finding/path_finding_module_config.proto`
- **Package:** `pathfinder.crp`
- **Messages:** `PathFindingModuleConfig`
- **Role:** Configuration for the CRP path-finding module, controlling search algorithms and parameters.
- **Feature Points:** CRP search configuration

#### `maps/pathfinder/crp/modules/ranking/ranking_module_config.proto`
- **Package:** `pathfinder.crp`
- **Messages:** `RankingModuleConfig`
- **Role:** Configuration for the CRP ranking module, controlling how found paths are scored and ordered.
- **Feature Points:** CRP ranking configuration

#### `maps/pathfinder/crp/path_finding/iterative_search_config.proto`
- **Package:** `pathfinder.crp`
- **Messages:** `IterativeSearchConfig`
- **Role:** Configuration for iterative path search — parameters for multi-phase search refinement.
- **Feature Points:** Iterative search, multi-phase routing

#### `maps/pathfinder/crp/ranking/maneuver_detector_config.proto`
- **Package:** `pathfinder.crp`
- **Messages:** `ManeuverDetectorConfig`
- **Role:** Configuration for maneuver detection — identifies turns, merges, and other driving maneuvers from route geometry.
- **Feature Points:** Maneuver detection, turn identification

#### `maps/pathfinder/crp/ranking/pruning_config.proto`
- **Package:** `pathfinder.crp`
- **Messages:** `PruningConfig`
- **Role:** Configuration for route pruning — removes suboptimal routes from the candidate pool early to reduce computation.
- **Feature Points:** Route pruning, performance optimization

#### `maps/pathfinder/crp/searcher/alternates/alternates_config.proto`
- **Package:** `pathfinder.crp`
- **Messages:** `AlternatesConfig`
- **Role:** Configuration for finding alternative routes — controls diversity, similarity thresholds, and number of alternates.
- **Feature Points:** Alternative routes, route diversity

#### `maps/pathfinder/crp/searcher/cost_type.proto`
- **Package:** `pathfinder.crp`
- **Enums:** `CostType`
- **Role:** Cost type enumeration for CRP search — different cost dimensions (time, distance, fuel, etc.).
- **Feature Points:** Multi-dimensional cost

#### `maps/pathfinder/crp/searcher/highway_ramp_fixup/highway_ramp_fixup_config.proto`
- **Package:** `pathfinder.crp`
- **Messages:** `HighwayRampFixupConfig`
- **Role:** Configuration for highway ramp fixup — corrects route artifacts at highway interchanges and ramps for smoother navigation.
- **Feature Points:** Highway ramp handling, route smoothing

#### `maps/pathfinder/crp/shared_server/route_attributes.proto`
- **Package:** `pathfinder.crp`
- **Messages:** `RouteAttributes`
- **Role:** Shared route attributes structure for CRP server — carries computed route properties (length, duration, maneuver count).
- **Feature Points:** Route metadata, shared attributes

#### `maps/pathfinder/crp/costs/cost_provenance.proto`
- **Package:** `pathfinder.crp`
- **Messages:** `CostProvenance`
- **Role:** Tracks the provenance of cost values in CRP — which data source and model produced each cost estimate.
- **Feature Points:** Cost attribution, model provenance

### Pathfinder Shared & Autonomous

#### `maps/pathfinder/shared/proto/route_type.proto`
- **Package:** `pathfinder`
- **Enums:** `RouteType` (MAIN, ALTERNATE, INTERNAL, REQUERY, RISK_AVERSE)
- **Role:** Classification of route types in pathfinder output — distinguishes primary routes from alternates and internal computation routes.
- **Feature Points:** Route classification, output differentiation

#### `maps/pathfinder/shared/proto/alternates_method.proto`
- **Package:** `pathfinder`
- **Enums:** `AlternatesMethod`
- **Role:** Enumeration of methods used to generate alternative routes.
- **Feature Points:** Alternate route generation

#### `maps/pathfinder/shared/config/crp_dynamic_config.proto`
- **Package:** `pathfinder`
- **Messages:** `CrpDynamicConfig`
- **Role:** Dynamic configuration for CRP — runtime-tunable parameters for the route planning engine.
- **Feature Points:** Dynamic CRP tuning, runtime configuration

#### `maps/pathfinder/shared/config/pathfinder_dynamic_config.proto`
- **Package:** `pathfinder`
- **Messages:** `PathfinderDynamicConfig`
- **Role:** Top-level dynamic config for the entire pathfinder system.
- **Feature Points:** System-wide pathfinder configuration

#### `maps/pathfinder/autonomous/proto/assisted_driving_info.proto`
- **Package:** `maps_autonomous`
- **Messages:** `AssistedDrivingInfo`
- **Role:** Vehicle state information for assisted driving — current speed, lane position, sensor data used by the pathfinder for autonomous-optimized routing.
- **Feature Points:** Autonomous driving, assisted navigation

#### `maps/pathfinder/autonomous/proto/assisted_driving_state_info.proto`
- **Package:** `maps_autonomous`
- **Messages:** `AssistedDrivingStateInfo`
- **Role:** State tracking for assisted driving features — whether ADAS is active, which level of autonomy is engaged.
- **Feature Points:** ADAS state tracking, autonomy levels

#### `maps/pathfinder/autonomous/proto/vehicle_info.proto`
- **Package:** `maps_autonomous`
- **Messages:** `VehicleInfo`
- **Role:** Vehicle specifications for autonomous routing — dimensions, sensor suite, capabilities.
- **Feature Points:** Autonomous vehicle profiles

#### `maps/pathfinder/replay/proto/replay_metadata.proto`
- **Package:** `pathfinder.replay`
- **Messages:** `ReplayMetadata`
- **Role:** Metadata for pathfinder request replay — enables debugging and replay of routing requests for testing and analysis.
- **Feature Points:** Request replay, debugging, regression testing

---

## 11. Road Traffic (`maps/roadtraffic/proto/`)

#### `maps/roadtraffic/proto/traffic_model_type.proto`
- **Package:** `maps_roadtraffic`
- **Enums:** `TrafficModelType` (PER_SEGMENT_REGRESSION, GLOBAL_CAR_GLASSBOX, GLOBAL_TWO_WHEELER_GLASSBOX, REMOTE_PREDICTION, SUPERSEGMENT, BLENDING, TRAFFIC2VEC), `RoadIndexPresence`
- **Imports:** `logs/proto/logs_annotations`
- **Role:** Defines the types of traffic prediction models used — from per-segment regression to neural network models (TRAFFIC2VEC), and whether roads exist in the traffic index.
- **Feature Points:** Traffic prediction, ML model selection, road indexing

#### `maps/roadtraffic/proto/trafficproperty.proto`
- **Package:** `maps_roadtraffic`
- **Messages:** `TrafficProperty`
- **Role:** Core traffic property data structure — speed, congestion level, and flow state for road segments.
- **Feature Points:** Traffic state, speed data, congestion levels

#### `maps/roadtraffic/proto/incidentmetadata.proto`
- **Package:** `maps_roadtraffic`
- **Messages:** `IncidentMetadata`
- **Imports:** `net/proto2/bridge/proto/message_set.proto`
- **Role:** Incident metadata for traffic disruptions — incident ID, caption, description, type classification, and user moderation flags. Extends bridge MessageSet for cross-system compatibility.
- **Feature Points:** Traffic incidents, road closures, user-reported incidents

#### `maps/roadtraffic/proto/incidentreport_v2_params.proto`
- **Package:** `maps_roadtraffic`
- **Messages:** `AnnotateIncidentsParameters` (deprecated), related incident report parameters
- **Role:** Parameters for incident report v2 API — controls incident annotation and filtering in traffic responses (deprecated in favor of newer mechanisms).
- **Feature Points:** Incident annotation, v2 API

#### `maps/roadtraffic/proto/incidents_root_cause.proto`
- **Package:** `maps_roadtraffic`
- **Enums:** `IncidentsRootCause`
- **Role:** Root cause classification for traffic incidents — construction, accident, weather, event, etc.
- **Feature Points:** Incident analysis, root cause tracking

#### `maps/roadtraffic/proto/encoded_path_params.proto`
- **Package:** `maps_roadtraffic`
- **Messages:** `PathEncodingRequestParameters`
- **Role:** Parameters for encoding traffic information along a path, used for route token generation and efficient traffic data transfer.
- **Feature Points:** Path encoding, route tokens, traffic data compression

#### `maps/roadtraffic/proto/path_traffic_flavor.proto`
- **Package:** `maps_roadtraffic`
- **Enums:** `PathTrafficFlavor`
- **Role:** Flavor of traffic data for path display — controls how traffic conditions are visualized on route polylines.
- **Feature Points:** Traffic visualization, route coloring

#### `maps/roadtraffic/proto/traffic_data_server_log_data.proto`
- **Package:** `maps_roadtraffic`
- **Messages:** `TrafficDataServerLogData`
- **Role:** Server-side logging data for traffic data service — tracks request patterns, model usage, and data freshness.
- **Feature Points:** Traffic data logging, service monitoring

#### `maps/roadtraffic/proto/travel_mode.proto`
- **Package:** `maps_roadtraffic`
- **Enums:** `TravelMode`
- **Role:** Travel mode enumeration for traffic data queries — DRIVING, WALKING, BICYCLING, TRANSIT.
- **Feature Points:** Multi-modal traffic, travel mode selection

---

## 12. Shared (`maps/shared/`)

### Shared Common

#### `maps/shared/common/geom/geom.proto`
- **Package:** `maps_shared.geom`
- **Messages:** `Camera` (with Location, Rotation, Size, LookAhead), `MapsCameraViewportDiffFromExperiment`, `Location` (lat/lng/alt), `Rotation` (heading/tilt/roll), `Size` (width/height), `LookAhead`
- **Imports:** `google/api/inclusion.proto`, `java/com/google/apps/jspb/jspb.proto`, `maps/logs/logging/ve_logging_options.proto`, `storage/datapol/annotations`
- **Role:** Foundational geometry types shared across ALL Maps subsystems. Defines Camera (viewport + orientation), Location (3D coordinates), and Rotation. The universal geometry vocabulary for Maps protos.
- **Feature Points:** Shared geometry, camera model, 3D coordinates, viewport definition

#### `maps/shared/client/callouts/callouts_logging.proto`
- **Package:** `maps_shared.client`
- **Messages:** `CalloutsLogging`
- **Role:** Logging data for map callouts (info cards, tooltips) shown to users on the map.
- **Feature Points:** Callout interaction tracking

### Shared MapCore

#### `maps/shared/mapcore/api/proto/pose.proto`
- **Package:** `maps_shared.mapcore`
- **Messages:** `Pose`
- **Role:** 3D pose specification for map elements — position and orientation in world space for AR and 3D map rendering.
- **Feature Points:** 3D pose, AR placement, world-space positioning

#### `maps/shared/mapcore/api/proto/map_actions.proto`
- **Package:** `maps_shared.mapcore`
- **Messages:** `MapActions`
- **Role:** Action definitions for map interaction — what actions are available when a user interacts with a map element.
- **Feature Points:** Interactive map actions, user interaction handling

#### `maps/shared/mapcore/api/proto/extensions/draw_pass_override.proto`
- **Package:** `maps_shared.mapcore`
- **Messages:** `DrawPassOverride`
- **Role:** Override specifications for map draw passes — controls rendering order and pass assignment for custom rendering.
- **Feature Points:** Render pass control, custom draw ordering

#### `maps/shared/mapcore/labeler/api/client_vector_ops_metadata.proto`
- **Package:** `maps_shared.mapcore.labeler`
- **Messages:** `ClientVectorOpsMetadata`
- **Role:** Metadata for client-side vector operations in the labeler subsystem, connecting labeling decisions to rendered output.
- **Feature Points:** Label operations, vector rendering integration

#### `maps/shared/mapcore/labeler/api/label_logging.proto`
- **Package:** `maps_shared.mapcore.labeler`
- **Messages:** `LabelLogging`
- **Role:** Logging data for the map labeling subsystem — tracks which labels were placed, conflicts resolved, and placement decisions.
- **Feature Points:** Label placement analytics, conflict tracking

#### `maps/shared/mapcore/testing/mctf/proto/metadata.proto`
- **Package:** `maps_shared.mapcore.testing`
- **Messages:** `MctfMetadata`
- **Role:** Testing metadata for the MapCore Testing Framework (MCTF), enabling test automation and rendering verification.
- **Feature Points:** Automated testing, rendering verification

---

## 13. Spotlight (`maps/spotlight/proto/`)

The spotlight subsystem powers the entity detail card / knowledge panel experience on Maps.

#### `maps/spotlight/proto/spotlight-description.proto`
- **Package:** `maps_spotlight`
- **Messages:** `SpotlightDescription` (the master spotlight request), `ClientOptions`, `PersonalizedDataPersistenceKey`, `CrisisOptions`, `CrisisFilter`, `HotelOptions`, `ClientSpecifiedCrisis`
- **Enums:** `WaypointClass` (POINT, AREA), `ClientType` (18 types: MOBILE_PHONE, DESKTOP, EARTH, ASSISTANT_TRAVEL, etc.), `MapType`, `PersistenceDestination`, `EventType` (TROPICAL_STORM, EARTHQUAKE, FLOOD, WILDFIRE)
- **Imports:** `geo/experience/proto/geo_experience_category.proto`, `maps/spotlight/proto/ads-layer-params.proto`, `maps/spotlight/proto/search-params.proto`, `maps/spotlight/proto/selected-item.proto`, `maps/spotlight/proto/spotlight-flags.proto`, `maps/tactile/api/ads-spotlight.proto`, `maps/tactile/api/directions-request.proto`, `maps/tactile/api/entity-details-common.proto`, `maps/tactile/api/geometry.proto`
- **Role:** The main spotlight description — bundles entity details, navigation intent, search parameters, ad configuration, crisis display settings, hotel options, and indoor level selection into a unified entity detail card request.
- **Feature Points:** Entity detail cards, knowledge panels, crisis display, hotel booking integration, navigation from spotlight

#### `maps/spotlight/proto/entity-metadata.proto`
- **Package:** `maps_spotlight`
- **Messages:** `EntityMetadata`
- **Role:** Entity metadata for spotlight display — carries entity type, attributes, and display configuration.
- **Feature Points:** Entity information display

#### `maps/spotlight/proto/spotlight-item-metadata.proto`
- **Package:** `maps_spotlight`
- **Messages:** `SpotlightItemMetadata`
- **Role:** Per-item metadata within a spotlight result — ranking signals, display hints, and interaction data.
- **Feature Points:** Item-level display, ranking signals

#### `maps/spotlight/proto/spotlight-flags.proto`
- **Package:** `maps_spotlight`
- **Messages:** `SpotlightFlags`
- **Role:** Feature flags controlling spotlight behavior — enables/disables specific spotlight features and experiments.
- **Feature Points:** Feature flagging, A/B testing

#### `maps/spotlight/proto/search-params.proto`
- **Package:** `maps_spotlight`
- **Messages:** `SearchParams`
- **Role:** Search parameters embedded in spotlight requests for entity search and discovery.
- **Feature Points:** Entity search, spotlight search integration

#### `maps/spotlight/proto/selected-item.proto`
- **Package:** `maps_spotlight`
- **Messages:** `SelectedItem`
- **Role:** Represents a user-selected item within the spotlight interface, tracking which entity the user is viewing.
- **Feature Points:** Selection tracking, user interaction state

#### `maps/spotlight/proto/ads-layer-params.proto`
- **Package:** `maps_spotlight`
- **Messages:** `AdsLayerParams`
- **Role:** Advertisement layer parameters for spotlight — controls how ads are displayed within the entity detail card.
- **Feature Points:** Spotlight ads, ad display configuration

#### `maps/spotlight/proto/ad-metadata.proto`
- **Package:** `maps_spotlight`
- **Messages:** `AdMetadata`
- **Role:** Advertisement metadata for spotlight entities — promoted place information and ad creative data.
- **Feature Points:** Ad metadata, promoted content

#### `maps/spotlight/proto/alternate-id.proto`
- **Package:** `maps_spotlight`
- **Messages:** `AlternateId`
- **Role:** Alternative identifier for spotlight entities — maps between different ID systems (place_id, feature_id, mid).
- **Feature Points:** Entity ID resolution, cross-system mapping

#### `maps/spotlight/proto/directions.proto`
- **Package:** `maps_spotlight`
- **Messages:** `SpotlightDirections`
- **Role:** Directions information embedded in spotlight — enables "get directions" from the entity detail card.
- **Feature Points:** Spotlight navigation, directions from entity cards

#### `maps/spotlight/proto/hotel-metadata.proto`
- **Package:** `maps_spotlight`
- **Messages:** `HotelMetadata`
- **Role:** Hotel-specific metadata for spotlight — pricing, availability, amenities, and booking information.
- **Feature Points:** Hotel booking, pricing display

#### `maps/spotlight/proto/logging-metadata.proto`
- **Package:** `maps_spotlight`
- **Messages:** `LoggingMetadata`
- **Role:** Logging metadata for spotlight interactions — impression tracking and user engagement analytics.
- **Feature Points:** Spotlight analytics, engagement tracking

#### `maps/spotlight/proto/report-a-problem-metadata.proto`
- **Package:** `maps_spotlight`
- **Messages:** `ReportAProblemMetadata`
- **Role:** Metadata for the "Report a Problem" feature within spotlight — enables users to flag incorrect information.
- **Feature Points:** User feedback, data quality reporting

---

## 14. Tactile (`maps/tactile/`)

The tactile subsystem is the **largest** in the Maps protobuf schema (190 files), representing the complete Maps frontend API surface. It covers:

- **Directions** — full routing request/response with waypoints, steps, summaries, polylines, parking, elevation
- **Entity Details** — place information, photos, videos, reviews
- **Search** — search restrictions, parameters
- **Ads** — ad banners, promoted pins, advertiser actions
- **Shared Types** — geometry, money, dates, experiences, feature IDs, parking, transit attributes
- **Hotels** — booking, rooms, rates, amenities, itinerary
- **Places** — comparison data, regional relations, place previews
- **Photo/Video** — preview actions, render strategies, rich content
- **EV** — electric vehicle station info, charging reliability, OEM payments
- **Automotive** — EV options for navigation
- **Transit** — transit attributes, carriage info, long-distance options
- **Passthrough** — passive assist, taxi, saved places
- **URL** — place lookup supplemental info

### Tactile Core API

| File | Package | Key Messages/Enums | Role |
|------|---------|-------------------|------|
| `api/directions-request.proto` | `maps_tactile` | `DirectionsRequest`, `UpdateRouteParams`, `DirectionsWaypointSearchboxStats` | Master directions request — waypoints, options, spotlight, ads, transit pattern matching, route updates |
| `api/directions-common.proto` | `maps_tactile.directions` | `Distance`, `WaypointQuery`, `Options`, `SpotlightOptions`, `ViaPoint`, `TransitOptions`, `DrivingOptions` | Shared directions types — distance formatting, waypoint queries with multiple query types, per-mode options |
| `api/directions-result-common.proto` | `maps_tactile.directions` | `DirectionsResult`, `Trip`, `TransitLeg`, `DrivingLeg`, `WalkingLeg`, `BicyclingLeg` | Directions result container — holds all trip results with per-leg details for each travel mode |
| `api/directions-step.proto` | `maps_tactile.directions` | `Step`, `TransitStep`, `DrivingStep`, `WalkingStep`, `Maneuver` | Per-step navigation instructions — turn-by-turn maneuvers, transit boarding, walking directions |
| `api/directions-summary.proto` | `maps_tactile.directions` | `TripSummary`, `LegSummary` | Condensed route summary — total distance, duration, and overview for each trip and leg |
| `api/directions-polyline.proto` | `maps_tactile.directions` | `Polyline`, `EncodedPolyline` | Polyline data for route display on the map |
| `api/directions-on-demand-transportation.proto` | `maps_tactile.directions` | On-demand transport types | Integration points for ride-hailing and bike-sharing in directions |
| `api/entity-details-common.proto` | `maps_tactile` | `Entity`, `EntityClass` | Core entity definition — feature ID, place ID, coordinate, classification, interactive properties |
| `api/geometry.proto` | `maps_tactile` | `LatLng`, `LatLngRectangle`, `LatLngPolygon`, `RasterPoint`, `RasterRectangle` | Deprecated geometry types — replaced by shared/geom.proto |
| `api/photo-description.proto` | `maps_tactile` | `PhotoDescription`, `PhotoReference` | Photo metadata — URLs, dimensions, attribution for place photos |
| `api/video-preview.proto` | `maps_tactile` | `VideoPreview` | Video preview data for places — thumbnail, duration, playback URL |
| `api/real-time-common.proto` | `maps_tactile` | Real-time data types | Common types for real-time data display (live busyness, wait times) |
| `api/scene-constants.proto` | `maps_tactile.scene` | `ContentType`, `ImagerySource`, `ImageryType`, `CoverPhotoType` | Scene/enum constants — content types (MAP, PANO, PHOTO, SATELLITE, TOUR, VIDEO), imagery sources and types |
| `api/camera-options.proto` | `maps_tactile` | `CameraOptions` | Camera configuration for the map viewport in tactile requests |
| `api/paint-description-options.proto` | `maps_tactile` | `PaintDescriptionOptions` | Options controlling how painted/rendered tiles are described in tactile responses |
| `api/request-context.proto` | `maps_tactile` | `RequestContext` | Request-level context — IP, language, geolocation, experiments |
| `api/logging-params.proto` | `maps_tactile` | `LoggingParams` | Logging parameter configuration for tactile API calls |
| `api/logged-feature.proto` | `maps_tactile` | `LoggedFeature` | Logged map feature — captures which features were interacted with |
| `api/logged-link.proto` | `maps_tactile` | `LoggedLink` | Logged interaction link — captures user taps/clicks on map links |
| `api/url-options.proto` | `maps_tactile` | `UrlOptions` | URL generation options for shareable map links |
| `api/traffic.proto` | `maps_tactile` | Traffic-related messages | Traffic data for tactile display — congestion coloring and incident markers |
| `api/ads-params.proto` | `maps_tactile` | `AdsParams` | Advertisement parameters for tactile API requests |
| `api/ads-spotlight.proto` | `maps_tactile` | `AdsEntity` | Ad entity data for spotlight/tactile integration |
| `api/search-restrict-enums.proto` | `maps_tactile` | Search restriction enums | Enumerations for search filtering and restriction |
| `api/search-restrict-params.proto` | `maps_tactile` | `SearchRestrictParams` | Parameter structure for search restrictions |

### Tactile API — Directions Sub-messages

| File | Package | Key Messages/Enums | Role |
|------|---------|-------------------|------|
| `api/directions/address.proto` | `maps_tactile.directions` | `Address` | Structured address for waypoints and destinations |
| `api/directions/destination-landmark.proto` | `maps_tactile.directions` | `DestinationLandmark` | Landmark information for destination identification |
| `api/directions/elevation-profile.proto` | `maps_tactile.directions` | `ElevationProfile` | Elevation data along a route for elevation profile display |
| `api/directions/parking-planner.proto` | `maps_tactile.directions` | `ParkingPlanner` | Parking availability and suggestion near destinations |
| `api/directions/query-correction.proto` | `maps_tactile.directions` | `QueryCorrection` | Query correction/spelling suggestions for directions |
| `api/directions/related-location.proto` | `maps_tactile.directions` | `RelatedLocation` | Related/alternative locations for directions |
| `api/directions/traffic-report-prompt.proto` | `maps_tactile.directions` | `TrafficReportPrompt` | Traffic report prompts for interactive navigation |
| `api/directions/trip-update-action.proto` | `maps_tactile.directions` | `TripUpdateAction` | Actions available for trip updates during navigation |
| `api/directions/waypoint-location.proto` | `maps_tactile.directions` | `WaypointLocation` | Resolved waypoint location with snapped coordinates |
| `api/directions/waypoint-result.proto` | `maps_tactile.directions` | `WaypointResult` | Per-waypoint result data in directions responses |
| `api/directions/zone-info.proto` | `maps_tactile.directions` | `ZoneInfo` | Zone/timezone information for waypoints and routes |

### Tactile API — Shared Types

| File | Package | Key Messages/Enums | Role |
|------|---------|-------------------|------|
| `api/shared/common.proto` | `maps_tactile` | `LocalizationContext`, `BuildingLevel`, `AliasId`, `Alias`, `DisplayCount`, `SuggestIconType`, `DistanceUnits` | Core shared types — localization, aliases, icon types, display counts |
| `api/shared/ads.proto` | `maps_tactile.shared` | `PlacesheetCreativeFormat`, `AdSubType`, `ATTManagerAuthorizationStatus` | Ad type and authorization enums |
| `api/shared/alias.proto` | `maps_tactile.shared` | `AliasType` enum | Alias type classification (home, work, custom) |
| `api/shared/android-intent.proto` | `maps_tactile.shared` | `AndroidIntent` | Android intent specification for deep-linking |
| `api/shared/augmented-reality-geometry.proto` | `maps_tactile.shared` | `ARGeometry` | Geometry types for AR map display |
| `api/shared/caching/caching.proto` | `maps_tactile.shared` | `CacheConfig` | Caching configuration for tactile data |
| `api/shared/crisis-user-mode.proto` | `maps_tactile.shared` | `CrisisUserMode` | User mode selection during crisis events |
| `api/shared/date-time.proto` | `maps_tactile.shared` | `DateTime`, `DateTimeRange` | Date/time representation for opening hours, events |
| `api/shared/ev-info.proto` | `maps_tactile.shared` | `EvInfo` | Electric vehicle information (charging availability) |
| `api/shared/experience-category.proto` | `maps_tactile.shared` | `ExperienceCategory` | Experience category classification |
| `api/shared/experiences.proto` | `maps_tactile.shared` | `Experiences` | Collection of user experiences on the map |
| `api/shared/feature-id.proto` | `maps_tactile.shared` | `FeatureId` | Feature identification types |
| `api/shared/geo-wholepage-type.proto` | `maps_tactile.shared` | `GeoWholepageType` | Geo whole-page type classification |
| `api/shared/geometry-3d.proto` | `maps_tactile.shared` | 3D geometry types | 3D coordinate and bounding volume types |
| `api/shared/geometry.proto` | `maps_tactile.shared` | 2D geometry types | 2D coordinate and shape types |
| `api/shared/logging-common.proto` | `maps_tactile.shared` | Shared logging types | Common logging structures for tactile |
| `api/shared/map-label.proto` | `maps_tactile.shared` | `MapLabel` | Map label data for tactile display |
| `api/shared/map-state-enums.proto` | `maps_tactile.shared` | Map state enumerations | Map interaction state types |
| `api/shared/maps-activity-persistence-keys.proto` | `maps_tactile.shared` | `PersistenceKeys` | Keys for persisting map activity state |
| `api/shared/maps-activity-place-list-common.proto` | `maps_tactile.shared` | Place list common types | Shared types for activity place lists |
| `api/shared/money.proto` | `maps_tactile.shared` | `Money` | Monetary value representation (currency + amount) |
| `api/shared/occupancy-status.proto` | `maps_tactile.shared` | `OccupancyStatus` | Live occupancy/busyness data for places |
| `api/shared/offering/offering-contribution.proto` | `maps_tactile.shared` | `OfferingContribution` | User contribution data for offerings |
| `api/shared/parking-enums.proto` | `maps_tactile.shared` | Parking enumerations | Parking type and availability enums |
| `api/shared/parking.proto` | `maps_tactile.shared` | `Parking` | Parking information — location, type, pricing |
| `api/shared/passiveassist/passiveassist.proto` | `maps_tactile.shared` | `PassiveAssist` | Passive assistance data — proactive suggestions |
| `api/shared/platform-intent.proto` | `maps_tactile.shared` | `PlatformIntent` | Platform-specific intent handling |
| `api/shared/position.proto` | `maps_tactile.shared` | `Position` | Position/tracking data types |
| `api/shared/promoted-pin-ads.proto` | `maps_tactile.shared` | `PromotedPinAdsRequestOptions` | Promoted pin ad request options |
| `api/shared/public-list.proto` | `maps_tactile.shared` | `PublicList` | Public/shared list data |
| `api/shared/query-suggestion.proto` | `maps_tactile.shared` | `QuerySuggestion` | Search query suggestion types |
| `api/shared/real-time-data-type.proto` | `maps_tactile.shared` | Real-time data type enum | Types of real-time data available |
| `api/shared/road-priority.proto` | `maps_tactile.shared` | `RoadPriority` | Road priority classification |
| `api/shared/savedplaces/saved-places-client-id.proto` | `maps_tactile.shared` | `SavedPlacesClientId` | Client identification for saved places |
| `api/shared/serialized-data-reference.proto` | `maps_tactile.shared` | `SerializedDataReference` | Reference to serialized data blobs |
| `api/shared/taxi/taxi.proto` | `maps_tactile.shared` | `Taxi` | Taxi service information |
| `api/shared/thumbs-vote.proto` | `maps_tactile.shared` | `ThumbsVote` | Thumbs up/down voting data |
| `api/shared/user-incident-report.proto` | `maps_tactile.shared` | `UserIncidentReport` | User-submitted incident reports |
| `api/shared/webmaps-enums.proto` | `maps_tactile.shared` | Web Maps enumerations | Web-specific map display enums |

### Tactile API — Directions Shared

| File | Package | Key Messages/Enums | Role |
|------|---------|-------------------|------|
| `api/shared/directions/assisted-driving-options.proto` | `maps_tactile.shared.directions` | `AssistedDrivingOptions` | Assisted driving configuration for directions |
| `api/shared/directions/directions-client-stats.proto` | `maps_tactile.shared.directions` | Client stats wrappers | Directions client statistics for tactile |
| `api/shared/directions/directions-constants.proto` | `maps_tactile.shared.directions` | Directions constants | Enumerations and constants for directions |
| `api/shared/directions/dynamic-closure-options.proto` | `maps_tactile.shared.directions` | `DynamicClosureOptions` | Dynamic road closure handling options |
| `api/shared/directions/elevation-category.proto` | `maps_tactile.shared.directions` | `ElevationCategory` | Elevation classification for routes |
| `api/shared/directions/elevation-description.proto` | `maps_tactile.shared.directions` | `ElevationDescription` | Textual elevation descriptions (hilly, flat, etc.) |
| `api/shared/directions/energy-usage-summary.proto` | `maps_tactile.shared.directions` | `EnergyUsageSummary` | EV energy consumption summary for routes |
| `api/shared/directions/fare.proto` | `maps_tactile.shared.directions` | `Fare` | Transit fare information |
| `api/shared/directions/image-options.proto` | `maps_tactile.shared.directions` | `ImageOptions` | Image rendering options for directions |
| `api/shared/directions/monetary-cost-range.proto` | `maps_tactile.shared.directions` | `MonetaryCostRange` | Cost range (min-max) for routes |
| `api/shared/directions/monetary-cost.proto` | `maps_tactile.shared.directions` | `MonetaryCost` | Exact monetary cost for routes |
| `api/shared/directions/opaque-trip-option.proto` | `maps_tactile.shared.directions` | `OpaqueTripOption` | Opaque trip option data |
| `api/shared/directions/opaque-trip-options.proto` | `maps_tactile.shared.directions` | `OpaqueTripOptions` | Collection of opaque trip options |
| `api/shared/directions/parking-summary.proto` | `maps_tactile.shared.directions` | `ParkingSummary` | Parking availability summary for destinations |
| `api/shared/directions/problem-type.proto` | `maps_tactile.shared.directions` | `ProblemType` | Problem type classification for routes |
| `api/shared/directions/recommended-filtering-results.proto` | `maps_tactile.shared.directions` | `RecommendedFilteringResults` | Recommended route filtering results |
| `api/shared/directions/retrieval-client.proto` | `maps_tactile.shared.directions` | `RetrievalClient` | Client info for directions retrieval |
| `api/shared/directions/road-stretch.proto` | `maps_tactile.shared.directions` | `RoadStretch` | Named road stretch information (e.g., "I-5", "Highway 101") |
| `api/shared/directions/roadside-facility-options.proto` | `maps_tactile.shared.directions` | `RoadsideFacilityOptions` | Roadside facility search along route (gas, food, rest areas) |
| `api/shared/directions/toll-price-options.proto` | `maps_tactile.shared.directions` | `TollPriceOptions` | Toll price display options for routes |
| `api/shared/directions/traffic-report-problem-alert-config.proto` | `maps_tactile.shared.directions` | `TrafficReportProblemAlertConfig` | Traffic report problem alert configuration |
| `api/shared/directions/transit-trip-result-display-style.proto` | `maps_tactile.shared.directions` | `TransitTripResultDisplayStyle` | Display style options for transit results |
| `api/shared/directions/voice-guidance-options.proto` | `maps_tactile.shared.directions` | `VoiceGuidanceOptions` | Voice guidance configuration for navigation |

### Tactile API — Hotels

| File | Package | Key Messages/Enums | Role |
|------|---------|-------------------|------|
| `api/shared/hotels/annotation-ranking.proto` | `maps_tactile.shared.hotels` | `AnnotationRanking` | Hotel annotation ranking for display |
| `api/shared/hotels/hotel-amenity.proto` | `maps_tactile.shared.hotels` | `HotelAmenity` | Hotel amenity enumeration (pool, gym, wifi, etc.) |
| `api/shared/hotels/hotel-aspect-type.proto` | `maps_tactile.shared.hotels` | `HotelAspectType` | Hotel aspect classification for reviews |
| `api/shared/hotels/hotel-booking-disclosure.proto` | `maps_tactile.shared.hotels` | `HotelBookingDisclosure` | Booking disclosure/fee information |
| `api/shared/hotels/hotel-booking-options.proto` | `maps_tactile.shared.hotels` | `HotelBookingOptions` | Hotel booking configuration options |
| `api/shared/hotels/hotel-booking.proto` | `maps_tactile.shared.hotels` | `HotelBooking` | Complete hotel booking data structure |
| `api/shared/hotels/hotel-map-layer-options.proto` | `maps_tactile.shared.hotels` | `HotelMapLayerOptions` | Map layer display options for hotels |
| `api/shared/hotels/itinerary.proto` | `maps_tactile.shared.hotels` | `Itinerary` | Travel itinerary with hotel stays |
| `api/shared/hotels/lodging-type.proto` | `maps_tactile.shared.hotels` | `LodgingType` | Lodging type classification (hotel, motel, resort, etc.) |
| `api/shared/hotels/maps-live-query-config.proto` | `maps_tactile.shared.hotels` | `MapsLiveQueryConfig` | Live query configuration for hotel pricing |
| `api/shared/hotels/maps-live-query-result.proto` | `maps_tactile.shared.hotels` | `MapsLiveQueryResult` | Live query results for hotel availability |
| `api/shared/hotels/rate-features.proto` | `maps_tactile.shared.hotels` | `RateFeatures` | Rate feature details (free cancellation, breakfast, etc.) |
| `api/shared/hotels/room-cluster.proto` | `maps_tactile.shared.hotels` | `RoomCluster` | Room clustering for hotel display |
| `api/shared/hotels/room.proto` | `maps_tactile.shared.hotels` | `Room` | Individual room specification |
| `api/shared/hotels/vacation-rental-attributes.proto` | `maps_tactile.shared.hotels` | `VacationRentalAttributes` | Vacation rental specific attributes |

### Tactile API — Place Data

| File | Package | Key Messages/Enums | Role |
|------|---------|-------------------|------|
| `api/shared/place/cost-details.proto` | `maps_tactile.shared.place` | `CostDetails` | Cost/price level details for places |
| `api/shared/place/map-rendering-data.proto` | `maps_tactile.shared.place` | `MapRenderingData` | Map-specific rendering data for places |
| `api/shared/place/maps-place-identifier.proto` | `maps_tactile.shared.place` | `MapsPlaceIdentifier` | Multi-system place identification |
| `api/shared/place/place-comparison-attribute-ui-style.proto` | `maps_tactile.shared.place` | `PlaceComparisonAttributeUiStyle` | UI style for place comparison attributes |
| `api/shared/place/place-comparison-badge-type.proto` | `maps_tactile.shared.place` | `PlaceComparisonBadgeType` | Badge types for place comparison |
| `api/shared/place/place-comparison-data-options.proto` | `maps_tactile.shared.place` | `PlaceComparisonDataOptions` | Options for place comparison data |
| `api/shared/place/place-comparison-data.proto` | `maps_tactile.shared.place` | `PlaceComparisonData` | Complete place comparison data |
| `api/shared/place/regional-relation-info.proto` | `maps_tactile.shared.place` | `RegionalRelationInfo` | Regional relationship information |
| `api/shared/place/regional-relation.proto` | `maps_tactile.shared.place` | `RegionalRelation` | Regional relationship (e.g., city belongs to state) |

### Tactile API — Place Preview

| File | Package | Key Messages/Enums | Role |
|------|---------|-------------------|------|
| `api/shared/placepreview/additional-cuisine-info.proto` | `maps_tactile.shared.placepreview` | `AdditionalCuisineInfo` | Cuisine-specific preview information |
| `api/shared/placepreview/cost-options.proto` | `maps_tactile.shared.placepreview` | `CostOptions` | Cost level display options for preview |
| `api/shared/placepreview/photo-preview-options.proto` | `maps_tactile.shared.placepreview` | `PhotoPreviewOptions` | Photo preview configuration |
| `api/shared/placepreview/photo-preview.proto` | `maps_tactile.shared.placepreview` | `PhotoPreview` | Photo preview data structure |
| `api/shared/placepreview/place-preview-field-mask.proto` | `maps_tactile.shared.placepreview` | `PlacePreviewFieldMask` | Field mask for selective place preview loading |
| `api/shared/placepreview/place-preview.proto` | `maps_tactile.shared.placepreview` | `PlacePreview` | Complete place preview data |
| `api/shared/placepreview/scalable-attribute-options.proto` | `maps_tactile.shared.placepreview` | `ScalableAttributeOptions` | Scalable attribute display options |

### Tactile API — Photo/Video

| File | Package | Key Messages/Enums | Role |
|------|---------|-------------------|------|
| `api/shared/photo/experiment-cohort.proto` | `maps_tactile.shared.photo` | `ExperimentCohort` | Experiment cohort for photo features |
| `api/shared/photo/photo-preview-action-type.proto` | `maps_tactile.shared.photo` | `PhotoPreviewActionType` | Action types for photo previews |
| `api/shared/photo/photo-preview-action.proto` | `maps_tactile.shared.photo` | `PhotoPreviewAction` | Photo preview action definitions |
| `api/shared/photo/render-strategy.proto` | `maps_tactile.shared.photo` | `RenderStrategy` | Photo rendering strategy options |
| `api/shared/photo/rich-content-data.proto` | `maps_tactile.shared.photo` | `RichContentData` | Rich content embedding in photos |
| `api/shared/photo/suggested-video-info.proto` | `maps_tactile.shared.photo` | `SuggestedVideoInfo` | Suggested video content information |

### Tactile API — Transit

| File | Package | Key Messages/Enums | Role |
|------|---------|-------------------|------|
| `api/shared/transit/carriage-info.proto` | `maps_tactile.shared.transit` | `CarriageInfo` | Train carriage/vehicle information |
| `api/shared/transit/long-distance-options.proto` | `maps_tactile.shared.transit` | `LongDistanceOptions` | Long-distance transit options |
| `api/shared/transit/transit-attribute-display-info.proto` | `maps_tactile.shared.transit` | `TransitAttributeDisplayInfo` | Display info for transit attributes |
| `api/shared/transit/transit-attribute-identifier.proto` | `maps_tactile.shared.transit` | `TransitAttributeIdentifier` | Identifier for transit attributes |
| `api/shared/transit/transit-attribute-status.proto` | `maps_tactile.shared.transit` | `TransitAttributeStatus` | Status for transit attributes |
| `api/shared/transit/transit-attribute-value.proto` | `maps_tactile.shared.transit` | `TransitAttributeValue` | Value for transit attributes |
| `api/shared/transit/transit-logging-context.proto` | `maps_tactile.shared.transit` | `TransitLoggingContext` | Logging context for transit interactions |
| `api/shared/transit/transit-service-query.proto` | `maps_tactile.shared.transit` | `TransitServiceQuery` | Transit service query parameters |

### Tactile API — EV & Automotive

| File | Package | Key Messages/Enums | Role |
|------|---------|-------------------|------|
| `api/shared/automotive/electric-vehicle-options.proto` | `maps_tactile.shared.automotive` | `ElectricVehicleOptions` | EV-specific routing options |
| `api/shared/ev/ev-station-reliability.proto` | `maps_tactile.shared.ev` | `EvStationReliability` | EV charging station reliability score |
| `api/shared/ev/oem-payment-id.proto` | `maps_tactile.shared.ev` | `OemPaymentId` | OEM payment identification for EV charging |
| `api/shared/ev/predicted-availability-per-eta.proto` | `maps_tactile.shared.ev` | `PredictedAvailabilityPerEta` | Predicted charger availability at estimated arrival time |

### Tactile API — Ads Shared

| File | Package | Key Messages/Enums | Role |
|------|---------|-------------------|------|
| `api/shared/ads/ad-banner.proto` | `maps_tactile.shared.ads` | `AdBanner` | Ad banner creative data |
| `api/shared/ads/ads-cache-info.proto` | `maps_tactile.shared.ads` | `AdsCacheInfo` | Ad caching configuration |
| `api/shared/ads/advertiser-preferred-action.proto` | `maps_tactile.shared.ads` | `AdvertiserPreferredAction` | Preferred action from advertiser |
| `api/shared/ads/map-ads-request-context.proto` | `maps_tactile.shared.ads` | `MapAdsRequestContext` | Ad request context for map ads |
| `api/shared/ads/placesheet-ad-type.proto` | `maps_tactile.shared.ads` | `PlacesheetAdType` | Placesheet ad type classification |
| `api/shared/ads/product-offer-list-ad.proto` | `maps_tactile.shared.ads` | `ProductOfferListAd` | Product offer list advertisement |
| `api/shared/ads/promoted-pin-ads-callout-info.proto` | `maps_tactile.shared.ads` | `PromotedPinAdsCalloutInfo` | Callout info for promoted pin ads |

### Tactile API — On-Map & Layer

| File | Package | Key Messages/Enums | Role |
|------|---------|-------------------|------|
| `api/onmap/on-map-impression-enums.proto` | `maps_tactile.onmap` | `OnMapImpressionEnums` | Impression tracking enums for on-map elements |
| `api/shared/layer/map-layer-type.proto` | `maps_tactile.shared.layer` | `MapLayerType` | Map layer type classification |
| `api/shared/internal/mendel-options.proto` | `maps_tactile.shared.internal` | `MendelOptions` | Internal Mendel experiment options |

### Tactile URL

| File | Package | Key Messages/Enums | Role |
|------|---------|-------------------|------|
| `url/proto/place-lookup-supplemental-info.proto` | `maps_tactile.url` | `PlaceLookupSupplementalInfo` | Supplemental information for place URL lookup |

---

## 15. Transit (`maps/transit/`)

#### `maps/transit/api/transit_options.proto`
- **Package:** `maps_transit.api`
- **Messages:** `TransitOptions`, `NonTransitOptions`, `NonTransitLegOptions`, `LongDistanceOptions`, `PatagoniaOptions`, `RequestedEntities`, `StationSelectionMethod`
- **Enums:** `BooleanOption` (25+ values: PREFER_ACCESSIBLE, PREFER_CHEAPER, AVOID_BUS, DISALLOW_TRAIN, etc.), `TimeAnchoring` (DEPARTURE, ARRIVAL, LAST_AVAILABLE, CALENDAR), `StationSelectionMethod` (8 values), `TransitApi`, `ForceTravelTransportPrice`
- **Imports:** 11+ imports covering fares, input time, non-transit modes, personalization, routing signals, cost models, booking
- **Role:** Comprehensive transit routing options — vehicle preferences (avoid/disallow train, bus, subway, ferry), accessibility preferences, fare types, time anchoring, station selection strategy, long-distance options with travel transport booking integration, and Patagonia trip expansion options.
- **Feature Points:** Transit routing, accessibility routing, fare calculation, long-distance trains/buses, station personalization, booking integration

#### `maps/transit/api/fare.proto`
- **Package:** `maps_transit.api`
- **Messages:** `Fare`
- **Role:** Transit fare data structure — price, currency, fare type, and validity period.
- **Feature Points:** Transit fares, multi-agency fare calculation

#### `maps/transit/api/input_time.proto`
- **Package:** `maps_transit.api`
- **Messages:** `InputTime`
- **Role:** Time specification for transit queries — departure/arrival time with timezone handling.
- **Feature Points:** Time-aware routing, departure/arrival scheduling

#### `maps/transit/api/non_transit_mode.proto`
- **Package:** `maps_transit.api`
- **Messages:** `NonTransitMode`
- **Enums:** `Mode` (WALK, BIKE, CAR, TAXI, etc.)
- **Role:** Non-transit travel mode enumeration for transit trip leg combinations.
- **Feature Points:** Multi-modal transit, first/last mile options

#### `maps/transit/api/personalization.proto`
- **Package:** `maps_transit.api`
- **Messages:** `PersonalizedOptions`
- **Role:** Personalization data for transit routing — user preferences, frequently used stations, preferred lines.
- **Feature Points:** Personalized transit, user preference learning

#### `maps/transit/api/result_label.proto`
- **Package:** `maps_transit.api`
- **Messages:** `ResultLabel`
- **Role:** Label/description for transit trip results displayed in the UI.
- **Feature Points:** Transit result display, route descriptions

#### `maps/transit/api/routing_signals.proto`
- **Package:** `maps_transit.api`
- **Messages:** `RoutingSignals`
- **Role:** Fine-grained routing signals for transit — real-time delays, crowding, reliability scores.
- **Feature Points:** Real-time transit, crowding data, reliability scoring

#### `maps/transit/api/time.proto`
- **Package:** `maps_transit.api`
- **Messages:** `Time`
- **Role:** Time representation for transit scheduling — supports relative and absolute time specifications.
- **Feature Points:** Transit scheduling, time calculations

#### `maps/transit/api/transit_entity_description.proto`
- **Package:** `maps_transit.api`
- **Messages:** `TransitEntityDescription`
- **Role:** Description of transit entities (agencies, routes, stops) for display in search and directions results.
- **Feature Points:** Transit entity display, agency/route metadata

#### `maps/transit/api/transit_logging_context.proto`
- **Package:** `maps_transit.api`
- **Messages:** `TransitLoggingContext`
- **Role:** Logging context for transit interactions — captures station selections, route views, and trip planning actions.
- **Feature Points:** Transit analytics, interaction tracking

#### `maps/transit/tripfinder/common/cost_model.proto`
- **Package:** `maps_transit.tripfinder`
- **Messages:** `CostModelProto`
- **Role:** Cost model for the transit trip finder — weights for walking, waiting, transfers, and in-vehicle time.
- **Feature Points:** Transit cost modeling, trip optimization

---

## 16. Utilities (`maps/util/`)

#### `maps/util/geometry-transform.proto`
- **Package:** `maps_util`
- **Messages:** `Transform3D` (scale, rotation, translation vectors)
- **Imports:** `storage/datapol/annotations`
- **Role:** 3D affine transformation for map geometry — scale, rotation, and translation components used for 3D map element positioning and GLTF model placement.
- **Feature Points:** 3D transforms, model placement, coordinate system conversion

#### `maps/util/tile_coordinate.proto`
- **Package:** `maps_util`
- **Messages:** `TileCoordinate`
- **Role:** Tile coordinate system — x, y, zoom level for identifying specific map tiles in the global tiling scheme.
- **Feature Points:** Tile addressing, coordinate system

#### `maps/util/tile_bitmap.proto`
- **Package:** `maps_util`
- **Messages:** `TileBitmap`
- **Role:** Tile bitmap data structure — encoded image data for raster map tiles.
- **Feature Points:** Raster tile encoding, image data transfer

---

## 17. Versatile (`maps/versatile/proto/`)

The versatile subsystem defines the **internal vector map data format** used for tile generation and rendering.

#### `maps/versatile/proto/vector-feature.proto`
- **Package:** `maps_versatile`
- **Messages:** `VectorFeatureProto`, `FeatureNameProto`, `FeatureNameTranslation`, `IndoorLevelMetadata`, `FeatureDebugInfo`, `ElectricVehicleChargingStationMetadata`, `AnnotationAttribute`
- **Imports:** 20+ imports from geostore, data-bound values, message_set
- **Role:** The core vector feature representation — carries feature IDs, names (multi-language), type categories, geographic bounds, building data, indoor levels, EV charging station metadata, opening hours, timezone, and annotation attributes. This is the source-of-truth feature format that gets transformed into client tiles.
- **Feature Points:** Vector map features, multi-language names, indoor mapping, EV charging, data binding, annotation attributes

#### `maps/versatile/proto/vector-render-op.proto`
- **Package:** `maps_versatile`
- **Messages:** `VectorRenderOpProto`, `LabelCandidateSet`, `LabelCandidate`, `LabelPosition`, `TextDescription`, `VectorLabelProto`, `MeshProto`, `GltfModelProto`, `InstanceModelProto`, `Polyline3DProto`, `Mesh3DProto`, `PointProto`, `ExtrudedAreaProto`, `RasterProto` (+ many nested position/style messages)
- **Enums:** `Type` (POLYLINE, POLYGON, MESH, POINT, LABEL_CANDIDATE, PLACED_LABEL, RASTER, EXTRUDED_AREA, SHADER_DATA, GLTF_MODEL, INSTANCE_MODEL, POLYLINE_3D, MESH_3D, TILE_BACKGROUND)
- **Imports:** `maps/paint/proto/interactivity.proto`, `maps/paint/proto/label-representation-tag.proto`, `maps/util/geometry-transform.proto`, `maps/versatile/proto/data-bound-value.proto`, `maps/versatile/proto/experimental_render_op_enums.proto`, `maps/versatile/proto/intent.proto`, `maps/versatile/proto/vector-feature.proto`, `maps/versatile/proto/vector-snapping.proto`, `maps/versatile/proto/vector-style.proto`
- **Role:** The complete render operation definition — every visual element on the map is represented as a render op (polyline, polygon, mesh, label, raster, 3D model, extruded area). Includes sophisticated label candidate system with positioning strategies, text wrapping, density control, and experimental A/B testing support.
- **Feature Points:** Render operations, 3D models (GLTF), extruded buildings, label placement engine, experimental rendering, additive maps drops, data-bound styling

#### `maps/versatile/proto/vector-style.proto`
- **Package:** `maps_versatile`
- **Messages:** `VectorStyleProto`
- **Role:** Style definitions for vector render operations — colors, strokes, fills, patterns, icons, and text styles.
- **Feature Points:** Vector styling, icon rendering, text styles

#### `maps/versatile/proto/vector-snapping.proto`
- **Package:** `maps_versatile`
- **Messages:** `GeometrySnapParameters`, `GeometryProjectionParameters`
- **Role:** Snapping configuration for vector geometry — controls how labels and points snap to roads, buildings, and terrain.
- **Feature Points:** Geometry snapping, label-to-road alignment

#### `maps/versatile/proto/vector-annotation.proto`
- **Package:** `maps_versatile`
- **Messages:** `VectorAnnotation`
- **Role:** Annotation data attached to vector features — additional metadata for display, interactivity, and logging.
- **Feature Points:** Vector annotations, feature enrichment

#### `maps/versatile/proto/annotation-enums.proto`
- **Package:** `maps_versatile`
- **Enums:** Annotation-related enumerations
- **Role:** Enumeration types for vector annotations — categories, display modes, and interaction types.
- **Feature Points:** Annotation typing, display categories

#### `maps/versatile/proto/data-bound-value.proto`
- **Package:** `maps_versatile`
- **Messages:** `DataBoundValue`, `DataBindingKey`
- **Role:** Data-bound value system — allows render styles to reference runtime data (traffic, weather, user preferences) for dynamic map rendering.
- **Feature Points:** Data-driven rendering, dynamic styles

#### `maps/versatile/proto/experimental_render_op_enums.proto`
- **Package:** `maps_versatile`
- **Messages:** `ExperimentalRenderOpTriggerId`
- **Role:** Trigger IDs for experimental render operations — enables A/B testing of rendering features at the render-op level.
- **Feature Points:** Rendering experiments, A/B test triggers

#### `maps/versatile/proto/intent.proto`
- **Package:** `maps_versatile`
- **Messages:** `IntentProto`
- **Role:** Intent classification for render operations — identifies the semantic purpose of render ops (e.g., navigation, exploration, search results).
- **Feature Points:** Semantic rendering, intent-driven display

#### `maps/versatile/proto/rendering-category.proto`
- **Package:** `maps_versatile`
- **Messages:** `RenderingCategory`
- **Role:** Rendering category classification — groups render operations into logical categories for style application and display control.
- **Feature Points:** Render categorization, style targeting

---

## Cross-Cutting Feature Points Summary

### Architecture & Core Infrastructure
- **Shared geometry** (`maps/shared/common/geom/geom.proto`): Camera, Location, Rotation — the universal vocabulary
- **Vector feature format** (`maps/versatile/`): Internal representation of all map features
- **Render engine** (`maps/paint/`): Tile generation, styling, labeling, output pipeline
- **Client tile format** (`maps/paint/proto/client-vector-tile.proto`): GPU-efficient format for mobile/web

### Navigation & Routing
- **Route finding** (`maps/pathfinder/`): CRP-based engine with alternates, EV routing, assisted driving
- **Directions API** (`maps/tactile/api/directions-*.proto`): Full request/response cycle
- **MRP** (`maps/directions/mrp/`): Multi-Route Planning with cost functions and risk-aware routing
- **Tolls** (`maps/directions/tolls/`): Personalized toll calculation
- **Traffic** (`maps/roadtraffic/`): ML-driven traffic models (TRAFFIC2VEC)

### User Experience
- **Entity detail cards** (`maps/spotlight/`): Knowledge panels with ads, crisis, hotels
- **Indoor maps** (`maps/indoor/`): Multi-level buildings with interactive entities
- **Hotel booking** (`maps/tactile/api/shared/hotels/`): 14 files covering rooms, rates, amenities, booking
- **Photo/Video** (`maps/tactile/api/shared/photo/`): Rich media display and preview
- **Place comparison** (`maps/tactile/api/shared/place/`): Side-by-side place comparison
- **Place preview** (`maps/tactile/api/shared/placepreview/`): Quick-look place information

### Monetization
- **Ads** (`maps/tactile/api/shared/ads/`): 7 files covering banners, promoted pins, advertiser actions
- **Promoted places** (`maps/paint/proto/promoted-place-*.proto`): Ad impression and navigation tracking
- **LIMO** (`maps/limo/`): Local Inventory Maps Onboarding

### Specialized Features
- **Crisis mapping** (`maps/crisis/`, `maps/spotlight/`): 30+ crisis types with specialized display
- **EV ecosystem** (`maps/tactile/api/shared/ev/`): Charging station reliability, OEM payments, availability prediction
- **Dynamic events** (`maps/dynamicworld/`): 50+ event categories for real-world event overlay
- **Accessibility** (`maps/paint/proto/accessibility-metadata.proto`): Wheelchair-accessible routing and entrances
- **Assisted driving** (`maps/pathfinder/autonomous/`): ADAS-aware route planning
- **Sustainability** (`maps/pathfinder/client/find-path-input.proto`): Fuel-efficient routing labels
- **Long-distance transit** (`maps/transit/`, `maps/tactile/api/shared/transit/`): Inter-city trains, buses, booking integration

### Analytics & Experimentation
- **Client stats** (`maps/directions/proto/directions_client_stats.proto`): 35 clients × 47 contexts × 4 platforms
- **Logging** (`maps/paint/proto/*-logging-*.proto`, `maps/shared/`): Comprehensive interaction tracking
- **Experiments** (`maps/pathfinder/client/experiments.proto`, `maps/versatile/proto/experimental_render_op_enums.proto`): A/B testing across routing and rendering
- **Gemini/AI integration**: GEMINI_MAPS_EXTENSION, ASK_MAPS, GEMINI_MAPS_OFFLINE_EVALS clients

---

> **Analysis complete.** 344 `.proto` files documented across 17 major subsystems covering the complete Google Maps protocol buffer schema — from core geometry through rendering, routing, monetization, to specialized features like indoor mapping, crisis response, and autonomous driving support.
