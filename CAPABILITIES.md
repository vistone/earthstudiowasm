# Earth Studio WASM Proto Files — Capabilities & Limitations

> **Authoritative guide to what 1,316 Google Earth Studio proto definition files can and cannot be used for.**
>
> Based on deep analysis of all `.proto` files across `geo/earth/`, `maps/`, `geostore/`, `logs/`, `google/internal/`, and 16 other domains.
> Generated: 2026-08-12

---

## Table of Contents

1. [What These Proto Files Enable](#1-what-these-proto-files-enable)
2. [What These Proto Files Cannot Do](#2-what-these-proto-files-cannot-do)
3. [Practical Use Cases](#3-practical-use-cases)
4. [Key Caveats and Warnings](#4-key-caveats-and-warnings)
5. [Migration and Adaptation Guide](#5-migration-and-adaptation-guide)

---

## 1. WHAT THESE PROTO FILES ENABLE

These 1,316 `.proto` files are the **complete interface definition layer** for Google Earth Studio, Google Maps, and related geo-infrastructure — data models, API contracts, wire formats, state management schemas, logging schemas, and configuration structures. They define **what data looks like on the wire**, not how it is processed.

### 1.1 Generating Client SDKs

The protos are directly compilable (with adaptation — see [Section 5](#5-migration-and-adaptation-guide)) into client libraries for multiple languages. Over 208 files import `java/com/google/apps/jspb/jspb.proto`, confirming JavaScript/PB target support.

**Practical output per language:**

| Language | What You Can Generate | Key Protoc Plugin |
|----------|----------------------|-------------------|
| **JavaScript/TypeScript** | Full typed SDK for Earth Studio API, Maps Tactile API, logging pipeline | `protoc-gen-js`, `protobuf-ts` |
| **Go** | gRPC client/server stubs for all API surfaces | `protoc-gen-go`, `protoc-gen-go-grpc` |
| **Python** | `dataclass`-like message objects, gRPC stubs | `protoc-gen-python`, `grpcio-tools` |
| **Kotlin/Java** | Android Maps/Earth SDK types, gRPC stubs | `protoc-gen-java`, `protoc-gen-grpc-java` |
| **Swift** | iOS geo types | `protoc-gen-swift` |
| **C++** | Rendering pipeline types, geostore operations | `protoc-gen-cpp` |
| **Rust** | Type-safe geo data models | `prost`, `tonic` |

**What you get for free:**
- **509 gRPC service methods** across all API surfaces (document CRUD, feature operations, layer listing, billing, user settings, terrain, photos, classification, design generation, knowledge cards, directions, transit, search, ads, hotels, EV charging, Earth Mate AI chat)
- **~2000+ message types** fully typed and validated at compile time
- **~500+ enum types** with exhaustive value sets (no guessing at magic numbers)
- **Binary wire format compatibility** with Google's production services (if you have access)
- **JSON serialization** for all messages (via standard proto↔JSON mapping)

### 1.2 Building a Compatible Earth Studio Client

The `geo/earth/` domain (159 files) defines the **complete client-server contract** for building an Earth Studio-compatible application:

| Capability | Key Protos | What You Get |
|-----------|-----------|-------------|
| **Command execution** | `commands.proto` (34 command types) | Every user action model — search, fly-to, create/edit/delete features, toggle layers, enter Street View, time machine, timelapse, AI chat, image generation, on-demand analysis |
| **Content creation** | `content_editing_model.proto` (107 messages) | Complete KML-like data model: documents, features, placemarks, polylines, polygons, 3D models, media, balloons, styles |
| **Document editing** | `content_editing_mutations.proto` (13 mutation types) | Atomic mutation operations for collaborative editing |
| **Camera system** | `geometry.proto`, `camerapresenter.proto` (10 animation messages) | LookAt/LookFrom cameras, 3 trajectory types (linear/parabolic/contextual), 4 presentation modes, animation interpolation |
| **Map style config** | `mapstyle.proto` | Globe/Mercator projection, satellite/roadmap/terrain imagery, 3D buildings toggle, clouds, gridlines, all visual layers |
| **State management** | 60+ state protos (`state/`, `core/`) | Complete UI state schema — search, document, design, layers, streetview, timemachine, measure, drawing, property editor, onboarding |
| **Document storage** | 18 document protos | KML import/export, cloud storage, local FS I/O, roles, capabilities, metadata, versioning |
| **Earth Feed (Voyager)** | `earthfeed.proto` (10 messages) | Content discovery feed with 17 display types |
| **Knowledge cards** | `renderable-entity.proto` (~40 messages) | Rich place information: images, facts, hours, related entities, Open Location Codes |
| **Data layers** | `EarthDataLayer` model + 20+ color ramps, 6 palettes | BigQuery-connected data-driven styling with categorical and interpolated rendering |
| **Classification** | `classification.proto` + `ClassDefinition` | AI-powered land cover classification with sample points |
| **Error handling** | `data_import_errors.proto` (66 error types), `error_response.proto` | Complete error taxonomy for all import and API failures |
| **Client config** | `client_config.proto`, `config.proto`, `experiment_flag.proto` | Runtime feature flags (~234), service endpoints, billing config, plan limits |

**Specific features you can implement:**
- 3D globe viewer with togglable layers (satellite imagery, 3D buildings, clouds, gridlines)
- Placemark/polyline/polygon/3D model creation and editing
- Knowledge card display with rich media (images, facts, related places)
- Camera animation system (fly-to with orbit, cinematic, and contextual trajectories)
- Street View integration (Pegman, panorama capture, timeline)
- Historical imagery browser (time machine)
- Timelapse playback
- Measure tool (distance, area, slope, aspect, contour, cut-and-fill)
- Design generation tools (solar analysis, new building design)
- KML import/export
- Cloud project management
- Accessibility features (talk-back, color correction, font scaling)

### 1.3 Building a Maps-Compatible Rendering Pipeline

The `maps/` domain (344 files) defines the complete data flow from server-side tile generation through client-side rendering:

| Rendering Stage | Key Protos | What You Get |
|----------------|-----------|-------------|
| **Tile sources** | `maps/tactile/` (190 files) | Complete API surface: entity details, directions, search, places, photos, transit, hotels, EV charging, ads, parking |
| **Vector tile format** | `maps/versatile/proto/` (10 files) | Internal vector feature representation with multi-language names, indoor levels, EV metadata, annotation attributes |
| **Render operations** | `vector-render-op.proto` | 14 render op types: polyline, polygon, mesh, point, label candidates, raster, extruded area, 3D GLTF models, shader data, tile background |
| **Tile styling** | `maps/paint/` (75 files) | Client vector tiles, feature selectors, labeling rules, 3D output, overlays, layer descriptions, interactivity, accessibility metadata |
| **Labeling engine** | `LabelCandidateSet`, `LabelPosition` | Sophisticated label placement with positioning strategies, text wrapping, density control |
| **3D models** | `GltfModelProto`, `InstanceModelProto`, `Polyline3DProto`, `Mesh3DProto` | GTLF model placement, instanced rendering, extruded buildings |
| **Data binding** | `DataBoundValue`, `DataBindingKey` | Runtime data-driven styling (traffic, weather, preferences) |
| **Coordinate systems** | `TileCoordinate`, `Transform3D` | Tile addressing (x/y/zoom), 3D affine transforms |
| **Snapping** | `GeometrySnapParameters` | Geometry-to-terrain/road/building snapping |

**Specific rendering features you can implement:**
- Vector tile rendering pipeline from raw feature data to GPU draw calls
- 3D map rendering with extruded buildings, GLTF models, terrain
- Multi-language label placement with collision avoidance
- Data-driven styling (traffic colors, weather overlays)
- Interactive feature selection and hit testing

### 1.4 Building a Route-Finding Engine

The `maps/pathfinder/` (31 files) and `maps/directions/` (16 files) domains define the complete routing data model:

| Routing Feature | Key Protos | What You Get |
|----------------|-----------|-------------|
| **Path search** | `find-path-input.proto`, `find-path-output.proto` | Full request/response: waypoints, locations, cost models, trip/path results, MRP selectors, customization inputs |
| **Road network** | `geostore/segment.proto` (15+ enums, 200+ attributes), `lane.proto` (20+ lane types) | Directed road segments with speed limits, surface types, priorities, elevation, construction status, bicycle/pedestrian facilities, barriers, accident spots |
| **Lane-level routing** | `lane.proto` + `lane_marker.proto` | HD lane model with connections, flow lines, bounding markers, crossing rules, toll payments per lane |
| **Route alternates** | MRP (Multi-Route Planning) protos | Cost function specs, path metrics, risk-averse routing, truck/HazMat affordances |
| **Traffic** | `roadtraffic/` (9 files) | TRAFFIC2VEC ML model types, incident metadata, path encoding, disruptions |
| **Transit routing** | `transit/` (11 files) | Vehicle preferences, fare types, time anchoring, station selection, personalization, long-distance booking, cost models with 50+ penalty categories |
| **Toll calculation** | `tolls/` protos | Pass types (E-ZPass, SunPass, FasTrak...), vehicle attributes (axle/weight/height), personalized pricing |
| **EV routing** | EV-specific pathfinder protos | Charger-aware routing, energy consumption models |
| **Assisted driving** | `pathfinder/autonomous/` | ADAS-aware route planning |
| **Client tracking** | `directions_client_stats.proto` | 35 client types × 47 usage contexts × 4 platforms |

**Data completeness for routing:**
- Road segment model: endpoint type (13 types), priority (9 levels), surface (8 types), elevation (9 categories), usage (11 categories)
- Lane model: 20+ lane types, 20+ conjoined lane categories, flow connections with curve geometry
- Restriction model: 20+ restriction types with time scheduling, vehicle attribute filters, travel pattern boolean logic
- Restriction scheduling: `timeschedule.proto` with 30+ occasion categories, date ranges, day-of-week, hour ranges

### 1.5 Building an Analytics/Logging Pipeline

The `logs/` domain (182 files) provides a production-grade telemetry schema:

| Logging Feature | Key Protos | What You Get |
|----------------|-----------|-------------|
| **Event correlation** | `eventid.proto` | Universal event IDs with µs timestamps, server IP, process IDs, client counters |
| **Earth events** | `earth_log.proto` | 89 event type categories, 400+ discrete event values, 30+ sub-messages with rich event-specific data |
| **Visual element tracking** | `visual_element_lite.proto` (14 files) | Universal click/impression tracking, UI tree grafting (show/hide/insert/copy), 55 user action types, 350+ extension fields |
| **Directions analytics** | `logs/proto/maps/directions/` (35 files) | Full routing request/response logging, MRP server-side phases (21 phase tags), counterfactual A/B testing, tolls, customization |
| **Navigation events** | `logs/proto/maps/mobile/` (3 files) | 50+ navigation session events, guider events (walking/transit), Gemini-in-nav |
| **Transit analytics** | `logs/proto/maps/transit/` (21 files) | 7-mode connection logging, fare structures, 50+ penalty cost model, accessibility, occupancy |
| **Search analytics** | `searchbox/` (6 files) | 40 search methods, 46 suggestion sources, 121 experiment stats, IPA, query composer |
| **Automotive context** | `automotive-context.proto` | Complete in-car telemetry: displays, head units, input devices, powertrains, Android Auto, CarPlay |
| **Sensor observations** | `sensor_observations.proto` | 127 road sign types, speed limits, curvature, weather, Volvo-specific sign detection, HD mapping feeds |
| **Performance telemetry** | `mirthstats_event.proto` | FPS, jank rates, memory (CPU+GPU), KML complexity, video/tile stats |
| **User profiling** | `usersettings_event.proto` | 62 industries, 78 MAP use cases, 6 geographic scales |
| **PII governance** | `logs_annotations.proto` | 36 identifier types for field-level privacy classification |

**Concrete telemetry you can collect:**
- Every user interaction (searches, feature creation, layer toggles, camera moves)
- Performance metrics (frame rate, memory, load times, crash data)
- Business analytics (billing plan changes, paygate views, upgrade flows)
- AI assistant usage (Earth Mate submissions, ratings, generated layers)
- Experiment/feature flag exposure data

### 1.6 Building a Geo Data Storage System

The `geostore/` domain (162 files) provides a full spatial database schema:

| Storage Feature | Key Protos | What You Get |
|----------------|-----------|-------------|
| **Feature identity** | `featureid.proto` | Universal S2 cell + fingerprint addressing (dual 64-bit) enabling spatial locality |
| **Feature container** | `feature.proto` | Single unified message with ~70 typed sub-message dispatch fields covering: roads, places, transit, borders, buildings, EV charging, ski, parking, land use, regulated areas, service areas, business chains |
| **Road network** | `segment.proto`, `lane.proto`, `restriction.proto` | Directed road segments, HD lane model, 20+ restriction types |
| **Places/POIs** | Establishment (400+ business categories), `address.proto`, `openinghours.proto`, `priceinfo.proto` | Full restaurant menu system (items, options, allergens, nutrition), opening hours with 30+ occasion categories |
| **Geometry** | `point.proto`, `polyline.proto`, `polygon.proto`, `rect.proto`, `track.proto`, `pose.proto` | E7 coordinates, 3D extrusion, encoded polygon compression, 6-DOF poses |
| **Feature lifecycle** | `featuremetadata.proto`, `featureidforwardings.proto`, `existence.proto` | µs-precision timestamps, version tokens, ID forwarding chains, bulk update eligibility |
| **Provenance** | `feature_field_metadata.proto`, `datasourceprovider.proto` | Field-level data source tracking with provider+dataset attribution |
| **Feature matching** | `matching/public/feature_pattern.proto` | Boolean DSL (AND/OR/NOT) with 30+ pattern types for: name (regex+stemming), geometry (containment/intersection), segment attributes, addresses, etc. |
| **Rights management** | `rightsstatus.proto`, `fieldtype.proto` (250+ field types) | Per-field access rights with minimum entitlement levels |
| **Versioning** | `version_token_options.proto`, `stable_id_options.proto`, `stable_field_path.proto` | Schema-version-tolerant field identification |
| **Attachments** | `client/attachments/attachment.proto` | Typed MessageSet extensions with client namespace isolation |

### 1.7 Building an AI Assistant (Earth Mate)

The `geo/earth/proto/earth_mate/` domain (7 files) defines the complete Gemini-powered AI assistant interface:

| AI Feature | Key Protos | What You Get |
|-----------|-----------|-------------|
| **Request model** | `earth_mate_request.proto` (14 messages) | Multi-turn chat with document/feature context, image queries, overhead imagery requests, file attachments, industry targeting |
| **Response model** | `earth_mate_response.proto` (5 messages) | Chat responses, executable `Command` generation (34 command types), attributions, error handling |
| **Image generation** | `OpenImageGenerator` command + config | AI image generation with promotional item display |
| **Streaming** | `streaming.proto` | Server-sent streaming for real-time AI responses |
| **Error handling** | `earth_mate_error_detail.proto` | Structured error reporting |

The AI can generate structured `Command` messages that Earth Studio executes directly — flying to locations, creating features, toggling layers, and more. The data model is complete for:
- Building an AI chat interface with geo context
- Having AI generate structured geo operations
- Tracking AI conversation analytics (thumbs up/down, submit-to-response time)
- AI-generated vector layers (GeminiGeneratedLayer with CNS path source)

### 1.8 Building Design/Planning Tools

The design tool domain covers solar analysis and architectural design:

| Design Feature | Key Protos | What You Get |
|---------------|-----------|-------------|
| **Solar analysis** | `solardesigninput.proto`, `design_input_manager.proto` | Solar PV design inputs, site constraints |
| **Building design** | `design_manager.proto`, `building_templates.proto`, `buildingeditor.proto` | Design generation, FAR-based building configurations, site selection |
| **3D assets** | `ThreeDAsset`, `Model`, `BoundingBox` | 3D model placement with orientation, scale, bounding box |
| **Site selection** | `site_selection.proto` | Site area limits, plan tier constraints |
| **Drawing tools** | `drawingtool.proto` | Polyline/polygon drawing modes, polygon input validation |
| **On-demand analysis** | `ViewOnDemandAnalysis` command | Slope, aspect, cut-and-fill, contour, change detection |
| **Classification** | `ClassificationLayerInputs`, `ClassDefinition` | AI-powered land classification with sample points |
| **Imagery analysis** | `google/internal/earth/v1/built_environment/` (20 files) | Building edits, block edits, park edits, solar run inputs, new build metrics, raster analysis, design content |

### 1.9 Understanding Google's Internal Data Models

These protos are the definitive reference for how Google models:

- **Geo addressing:** S2 cell + fingerprint as universal feature ID
- **Map rendering:** 14-render-op pipeline from source features → styled tiles → GPU draw calls
- **Routing:** CRP-based pathfinding with HD lane-level detail and traffic ML integration (TRAFFIC2VEC)
- **Places:** 400+ business categories, full menu systems, 30+ occasion time scheduling
- **Roads:** 15+ enums covering 200+ attributes — far more detailed than OpenStreetMap
- **State management:** 60+ UI state slices, each with its own proto, following consistent naming conventions
- **Commands:** 34 oneof-dispatched command types, each mapping 1:1 to user features
- **Configuration:** Remote-delivered `ClientConfig` that controls every client feature
- **Experiment flags:** 234 feature flags for gradual rollouts and A/B testing
- **PII governance:** Field-level data classification with 36 identifier types

### 1.10 Reverse-Engineering API Contracts

Every API surface is fully described:

| API Surface | Proto File(s) | Methods Exposed |
|------------|--------------|----------------|
| Document CRUD | `content_editing_requests.proto` | Create, Get, Update, Delete, Copy, List documents; Get/BatchGet features; Upload/Download assets; Import data |
| Data Layers | `layers.proto` | ListDataLayers, GetDataLayer, GetFeatureDetails, GetFeaturesInViewport, CreateOnDemandLayer, ImportDatasetToLayer, CreateDocumentAssetLayer |
| Knowledge Cards | `knowledge.proto` | GetKnowledgeCard (by MID, FID, or lat/lng+query) |
| Photos | `photos.proto` | GetThumbnailsForViewport, GetPhotosForPoint |
| Terrain | `terrain.proto` | BatchGetElevationsByPoint |
| User | `user.proto` | GetUser (profile, capabilities, Drive/MyMaps/Earth access) |
| Settings | `user_settings.proto` | Get/Update user industry, use cases, preferences |
| Classification | `classification.proto` | ListClassificationSystems, ListClassificationSystemClasses |
| Billing | `rate_cards.proto`, `quota.proto` | GetRateCards, GetUserAssetQuota, ValidateUserAssetQuota |
| Config | `client_config.proto` | GetConfig (complete client bootstrap) |
| Feature Flags | `feature_flags.proto` | GetFeatureFlags |
| Earth Mate | `earth_mate.proto` | Chat request/response with streaming |
| Maps Directions | `maps/tactile/api/directions-*.proto` | Directions search with full routing options |
| Maps Entities | `maps/tactile/api/entity-*.proto` | Place detail retrieval, search, photos |
| Maps Search | `maps/tactile/api/search-*.proto` | Place/text search with structured results |
| Maps Transit | `maps/tactile/api/shared/transit/` | Transit directions, station info |
| Maps Hotels | `maps/tactile/api/shared/hotels/` (14 files) | Hotel search, rooms, rates, amenities, booking |

### 1.11 Creating Mock Servers for Testing

The complete request/response contracts enable building mock servers that:
- Return valid, schema-correct responses for any API call
- Simulate all documented error conditions
- Support integration testing without Google infrastructure
- Enable offline development and CI/CD pipelines

---

## 2. WHAT THESE PROTO FILES CANNOT DO

### 2.1 No Implementation Logic

Protobuf schemas are **data contracts, not code**. They define what data looks like, not how it is processed. You **cannot** extract:
- The actual GL rendering code for the 3D globe
- The CRP route-finding algorithm implementation
- The TRAFFIC2VEC machine learning model
- The camera animation interpolation math
- The styling/labeling engine logic
- The Gemini LLM prompt templates or model weights
- The Earth Mate context assembly logic
- The billing calculation engine
- The design generation algorithms (solar PV placement, FAR optimization)
- The KML parser/converter logic (only the error taxonomy is provided)
- The feature pattern matching evaluator (only the DSL schema is defined)
- The PII detection/redaction engine (only the classification schema)

### 2.2 No Rendering Engine

You **cannot** extract:
- GPU shader code
- Texture atlases or tile images
- Font data or glyph atlases
- Anti-aliasing or anti-flicker logic
- The WebGL/WebGPU rendering pipeline
- Camera frustum culling logic
- Level-of-detail selection heuristics

### 2.3 No Actual Map Data

These are **schema definitions only**. They contain:
- Zero map tile images (satellite, roadmap, terrain)
- Zero vector feature geometries (no actual road coordinates, building footprints, or POI locations)
- Zero elevation data
- Zero 3D building models
- Zero street-level imagery
- Zero traffic data
- Zero transit schedules
- Zero place photos
- Zero Knowledge Graph facts

### 2.4 No Server-Side Business Logic

You **cannot** determine from these protos:
- How billing charges are computed from usage metrics
- How rate limits are enforced
- How document conflict resolution works
- How search ranking is calculated
- How directions are optimized for traffic
- How AI responses are generated from Earth Mate requests
- How design generation works (solar panel placement, building configuration)
- How feature flag rollouts are managed
- How experiment A/B assignment works
- How PII detection and redaction operates
- How spam/abuse detection works

### 2.5 No Authentication/Authorization Logic

The protos specify:
- That authentication exists (`STANDARD_AUTH`, `API_KEY`, `PH_SERVER_TOKEN` in `RequestRule`)
- Client identity metadata (`ClientMetadata` with country code, version, client type)
- Feature-level rights schemas (`RightsStatusProto`, minimum rights levels)
- Billing plan types and rate card structures

But they do **not** contain:
- OAuth token validation logic
- API key verification
- Session management
- User identity resolution
- Authorization decision logic
- Rate limit enforcement code

### 2.6 No Actual AI Models

The Earth Mate protos define the request/response contract, but contain:
- No LLM model weights or architectures
- No prompt templates
- No context assembly logic
- No tool-use definitions
- No safety/alignment filters
- No model evaluation metrics

### 2.7 No Client UI Code

The state management protos define what state exists and its shape, but contain:
- No React/Angular/Vue component code
- No CSS stylesheets
- No HTML layout
- No event handling logic
- No animation curves or easing functions
- No accessibility implementation (only configuration flags exist)

---

## 3. PRACTICAL USE CASES

### 3.1 "I want to build a 3D globe viewer"

**Core protos you need:**

| Proto | Path | What It Defines |
|-------|------|----------------|
| `mapstyle.proto` | `geo/earth/proto/mapstyle.proto` | Projection (Globe/Mercator), Imagery (Satellite/Roadmap/Terrain), 3D Features toggle, Clouds, Gridlines, all visual layers |
| `geometry.proto` | `geo/earth/proto/geometry.proto` | Camera state (location, rotation, field-of-view), LatLng primitive |
| `camerapresenter.proto` | `geo/earth/app/cpp/studio_presenters/camera/camerapresenter.proto` | Camera animation: 3 trajectory types, 4 presentation modes, partial property updates |
| `baselayerstyles.proto` | `geo/earth/app/cpp/layers/baselayer/baselayerstyles.proto` | Base layer visual styles |
| `state/layers/` | `geo/earth/app/cpp/core/state/layers/` | Layer visibility state, toggles |
| `state/search/` | `geo/earth/app/cpp/core/state/search/` | Search state for place lookups |
| `renderable-entity.proto` | `geo/earth/proto/renderable-entity.proto` | Knowledge cards to display on the globe |

**What you still need to build yourself:**
- WebGL/WebGPU rendering engine (terrain mesh generation, tile loading, texture management)
- Tile server or tile cache (satellite imagery is not in these protos — only the URL template patterns in `client_config.proto` suggest where tiles come from)
- Camera math (quaternion interpolation, great-circle navigation)
- Input handling (mouse/touch pan, zoom, tilt, rotate)
- Raster tile decoding (WebP, JPEG, PNG)

### 3.2 "I want to log user interactions like Earth Studio"

**Core protos you need:**

| Proto | Path | What It Defines |
|-------|------|----------------|
| `earth_log.proto` | `logs/proto/geo/earth/app/earth_log.proto` | 89 event type categories with 400+ discrete values and 30+ sub-messages |
| `eventid.proto` | `logs/eventid/eventid.proto` | Universal event correlation IDs |
| `visual_element_lite.proto` | `logs/proto/visual_element/visual_element_lite.proto` | Click/impression tracking for every UI element |
| `client_interaction_metadata.proto` | `logs/proto/visual_element/client_interaction_metadata.proto` | Extensible interaction metadata |
| `usersettings_event.proto` | `logs/proto/geo/earth/app/usersettings_event.proto` | User industry profiling (62 industries, 78 use cases) |
| `mirthstats_event.proto` | `logs/proto/geo/earth/app/mirthstats_event.proto` | Performance telemetry (FPS, memory, KML complexity) |
| `logs_annotations.proto` | `logs/proto/logs_annotations/logs_annotations.proto` | PII field classification for privacy compliance |

**Example: Logging a search event**

Your code populates an `EarthEvent` with:
```
type: SEARCH_PERFORMED (value 301)
search_event: {
  query: "New York City"
  result_count: 15
  search_method: TEXT_SEARCH
  search_source: SEARCH_BOX
}
```

And attaches `EventIdMessage` with `time_usec`, `server_ip`, `process_id` for correlation.

### 3.3 "I want to store geographic features"

**Core protos you need:**

| Proto | Path | What It Defines |
|-------|------|----------------|
| `featureid.proto` | `geostore/base/proto/featureid.proto` | S2 cell + fingerprint feature addressing |
| `feature.proto` | `geostore/base/proto/feature.proto` | Universal container with ~70 typed sub-message fields |
| `point.proto` | `geostore/base/proto/point.proto` | E7 coordinate (lat_e7/lng_e7 — microdegree precision) |
| `polyline.proto` | `geostore/base/proto/polyline.proto` | Ordered point sequences |
| `polygon.proto` | `geostore/base/proto/polygon.proto` | Polygons with encoded compression, 3D extrusion |
| `rect.proto` | `geostore/base/proto/rect.proto` | Bounding boxes |
| `featuremetadata.proto` | `geostore/base/proto/featuremetadata.proto` | Lifecycle tracking, version tokens |
| `segment.proto` | `geostore/base/proto/segment.proto` | Road segments (15+ enums, 200+ attributes) |
| `address.proto` | `geostore/base/proto/address.proto` | Structured addresses |
| `openinghours.proto` | `geostore/base/proto/openinghours.proto` | Business hours with time scheduling |
| `priceinfo.proto` | `geostore/base/proto/priceinfo.proto` | Menu/pricing with allergens and nutrition |

**Example: Storing a restaurant**

```protobuf
FeatureProto {
  id: FeatureIdProto {
    cell_id: 0x89c2589a3 // S2 cell for NYC
    fprint: 0x4a7f1b2c // unique within cell
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
    category: RESTAURANT_PIZZA  // from 400+ category enum
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

### 3.4 "I want to do route planning"

**Core protos you need:**

| Proto | Path | What It Defines |
|-------|------|----------------|
| `segment.proto` | `geostore/base/proto/segment.proto` | Complete road network data model |
| `lane.proto` | `geostore/base/proto/lane.proto` | Lane-level detail for HD routing |
| `restriction.proto` | `geostore/base/proto/restriction.proto` | Turn/time/vehicle restrictions |
| `route.proto` | `geostore/base/proto/route.proto` | Route container |
| `segmentpath.proto` | `geostore/base/proto/segmentpath.proto` | Ordered segment ID paths |
| `travel_mode.proto` | `geostore/base/proto/travel_mode.proto` | Motor vehicle/bicycle/pedestrian |
| `travel_pattern.proto` | `geostore/base/proto/travel_pattern.proto` | Boolean logic for restriction matching |
| `find-path-input.proto` | `maps/pathfinder/client/find-path-input.proto` | Routing request (waypoints, options) |
| `find-path-output.proto` | `maps/pathfinder/client/find-path-output.proto` | Routing result (paths, costs, alternates) |
| `traffic_model_type.proto` | `maps/roadtraffic/proto/traffic_model_type.proto` | Traffic-aware routing types |
| `transit_options.proto` | `maps/transit/api/transit_options.proto` | Transit routing preferences |
| `directions_client_stats.proto` | `maps/directions/proto/directions_client_stats.proto` | Client analytics for routing |

**What this gives you:**
- **Road graph schema:** Directed segments with endpoint types (13), priorities (9 levels), surfaces (8 types), elevations (9 categories), usages (11 categories), speed limits, construction status, barriers, accident spots
- **Restriction model:** Time-scheduled, vehicle-filtered, boolean-composable restriction trees
- **Lane connectivity:** Lane-to-lane flow connections with curve geometry
- **Traffic integration:** Model types for real-time traffic blending
- **Transit schema:** 7-mode connections, fare structures, accessibility routing, 50+ cost penalties

**What you must implement yourself:**
- Graph construction from road segments
- Path-finding algorithm (A*, Dijkstra, CRP, contraction hierarchies)
- Turn cost computation
- Traffic data integration
- Heuristic tuning

---

## 4. KEY CAVEATS AND WARNINGS

### 4.1 Google-Internal Dependencies Make Compilation Non-Trivial

These protos were designed for Google's internal build system (Blaze) and import Google-proprietary libraries:

| Internal Dependency | Import Count | What It Does | Standard Replacement |
|--------------------|-------------|-------------|---------------------|
| `storage/datapol/annotations/proto/semantic_annotations.proto` | ~890 imports | PII field classification | Strip or replace with custom annotations |
| `net/proto2/proto/descriptor.proto` | ~50+ imports | Extended proto descriptor (field presence, UTF-8 validation, JSON format, security auditing) | Use standard `google/protobuf/descriptor.proto` |
| `net/proto2/bridge/proto/message_set.proto` | ~30+ imports | MessageSet extension mechanism | Replace with `google.protobuf.Any` or oneof |
| `java/com/google/apps/jspb/jspb.proto` | ~208 imports | JSPB JavaScript field options | Remove or replace with standard JS options |
| `knowledge/graph/protomesh/protomesh.proto` | ~30 imports | Knowledge Graph triple storage | Remove if not using KG |
| `wireless/android/privacy/annotations/proto/collection_basis_annotations.proto` | ~100 imports | Android privacy collection basis | Strip or replace |
| `google/api/inclusion.proto` | ~200 imports | API field inclusion rules | Replace with standard `google/api/field_behavior.proto` |
| `net/proto2/contrib/validator/annotations.proto` | ~50 imports | Runtime field validation | Use protoc-gen-validate or strip |
| `gws/mothership/` | ~15 imports | Google Web Server RPC framework | Replace with standard gRPC |
| `monitoring/streamz/` | ~8 imports | Google monitoring | Remove |
| `google/longrunning/operations.proto` | ~10 imports | Async operation tracking | Use standard version or implement custom |

### 4.2 Proto2/Editions/Proto3 Mix Requires Specific protoc Versions

| Syntax | File Count | Issues |
|--------|-----------|--------|
| **proto2** | ~799 files | Requires `proto2` mode in protoc. Group fields, extensions, required fields not available in proto3. |
| **editions** | ~462 files | Requires protoc 25+ with editions support. Migration from proto2 in progress. |
| **proto3** | ~55 files | Standard, but mix with proto2 requires careful import management. |

**Practical implications:**
- proto2's `required` fields (used extensively in `featureid.proto`, `point.proto`) are incompatible with proto3 codegen
- proto2 `extensions` and `MessageSet` (used extensively in `geostore/`) have no proto3 equivalent
- proto2 `groups` are deprecated in editions
- You must compile proto2 and proto3 files separately or use a protoc that supports mixed modes
- Editions files reference third-party features (`third_party/protobuf/cpp_features.proto`, `java_features.proto`)

### 4.3 MessageSet Extensions Require Google's Extended Descriptor

The `geostore/base/proto/feature.proto` and many other core files use `MessageSet` extensions for dynamic type dispatch:

```protobuf
// In featureid.proto
message FeatureIdProto {
  required fixed64 cell_id = 1;
  required fixed64 fprint = 2;
  extensions 1000 to max [message_set = true];  // MessageSet
}
```

**Standard protobuf does not support MessageSet** — it was deprecated from proto3 entirely. You have these options:
1. Convert all MessageSet extensions to `google.protobuf.Any` fields (loss of type safety at wire level)
2. Convert to oneof dispatch (requires knowing all extension types ahead of time — feasible since all 30+ extension types are defined in the codebase)
3. Use C++ protobuf with `-lprotobuf-lite` flag that retains limited MessageSet support
4. Accept that you cannot use the extension dispatch pattern and flatten the FeatureProto into separate message types

### 4.4 Some Features Reference Google Infrastructure That Doesn't Exist Externally

| Feature | Proto Reference | Why Unavailable Externally |
|---------|----------------|--------------------------|
| S2 cell indexing | `cell_id` (fixed64) fields | Requires S2 geometry library — open-source but complex |
| Knowledge Graph (Freebase) | `knowledge_graph_reference`, `gconcept`, `raw_gconcept_instance` | Internal Google KG API |
| Streamz monitoring | `monitoring/streamz/` | Internal metrics infrastructure |
| Google Web Server (GWS) | `gws/mothership/` | Internal RPC framework |
| DMS layers | `DmsLayer` with `tile_key` | Domain Management System — internal tile serving |
| UMS documents | `ums_document_id` | Universal Metadata Store — internal document storage |
| FIFE image serving | `photos/fife/` | Internal image serving pipeline |
| CIP pub/sub | `cip/` | Internal change data capture |
| Sawmill logging | `not_logged_in_sawmill` annotations | Internal log processing |
| Heterodyne experiments | `experiments/framework/extensions/heterodyne/` | Internal A/B framework |
| ProtoShop | `devtools/protoshop/` | Internal proto tooling |
| VePub API | `vepub/` | Visual Elements publishing platform |

### 4.5 No Guarantee of API Stability

These are **internal Google protos** — they can and do change:
- 462 files are already migrating from proto2 to editions (ongoing migration)
- Field numbers, message names, and package structures are not governed by any public stability policy
- Deprecated fields remain in the schema (e.g., `OpenVoyagerGrid`, `OpenVoyagerStory`, `RenderDesign`, various `deprecated = true` markers)
- Internal Google teams modify these protos independently of external consumers
- The Earth Studio client API is not a public Google Cloud API — it has no SLA, no deprecation policy, no migration guides for external users

### 4.6 Legal/IP Considerations

- **Copyright:** These proto files are Google's intellectual property. The `.proto` format itself is Apache 2.0 licensed, but the specific schemas, message names, and data models may be subject to Google's terms of service.
- **API Terms:** Using these protos to build clients that connect to Google's actual APIs requires compliance with Google's API Terms of Service.
- **Trademark:** "Google Earth", "Google Maps", "Earth Studio", "Earth Mate", "Gemini" are Google trademarks.
- **Data Rights:** The schemas reveal the existence of fields for PII data, but you must not collect, process, or store any data that would violate privacy regulations.
- **Competitive Use:** Building a competing product using Google's schema designs may have legal implications depending on jurisdiction.

---

## 5. MIGRATION AND ADAPTATION GUIDE

### 5.1 How to Strip Google-Internal Dependencies

**Step-by-step process:**

#### Step 1: Create a Replacement for `storage/datapol/annotations`

Create `third_party/google/storage/datapol/annotations/proto/semantic_annotations.proto`:

```protobuf
syntax = "proto2";
package storage.datapol.annotations.proto;

import "google/protobuf/descriptor.proto";

// Minimal stub — extend as needed
extend google.protobuf.FieldOptions {
  optional SemanticType sem_type = 10123456; // original field number
}

message SemanticType {
  // Empty stub; add fields if your system needs type classification
}
```

#### Step 2: Create a Replacement for `net/proto2/proto/descriptor.proto`

Create `third_party/google/net/proto2/proto/descriptor.proto`:

```protobuf
syntax = "proto2";
package proto2;

// Re-export standard descriptor types that net/proto2 extends
// In practice, replace all 'import "net/proto2/proto/descriptor.proto"'
// with 'import "google/protobuf/descriptor.proto"' via sed/perl
```

**Automated replacement command:**
```bash
find . -name "*.proto" -exec sed -i \
  's|import "net/proto2/proto/descriptor.proto"|import "google/protobuf/descriptor.proto"|g' {} +
```

#### Step 3: Handle `net/proto2/bridge/proto/message_set.proto`

Options:
1. **Remove MessageSet entirely** (recommended for greenfield projects): Replace `extensions X to max [message_set = true]` with `google.protobuf.Any` or oneof fields.
2. **Stub it** (if you need compilation but don't actually use MessageSet):

```protobuf
syntax = "proto2";
package proto2.bridge;

message MessageSet {
  // Empty stub — MessageSet extension points won't work,
  // but files that import this will compile
}
```

#### Step 4: Strip JSPB Annotations

Remove imports of `java/com/google/apps/jspb/jspb.proto` and all associated option annotations:
```bash
find . -name "*.proto" -exec sed -i \
  '/import.*jspb\.proto/d' {} +
find . -name "*.proto" -exec sed -i \
  '/option.*jspb/d' {} +
```

#### Step 5: Strip Android Privacy Annotations

Remove imports of `wireless/android/privacy/annotations/proto/collection_basis_annotations.proto`:
```bash
find . -name "*.proto" -exec sed -i \
  '/import.*collection_basis_annotations/d' {} +
```

#### Step 6: Create Stubs for Remaining Internal Imports

For each internal dependency, create a minimal stub proto that provides the expected package and message names but no actual functionality:

| Internal Import | Minimal Stub Needed |
|----------------|-------------------|
| `google/api/inclusion.proto` | Empty file or extend `google.protobuf.FieldOptions` with stub extension |
| `net/proto2/contrib/validator/annotations.proto` | Stub with `FieldValidationRule` message (empty) |
| `knowledge/graph/protomesh/protomesh.proto` | Stub `ProtoMesh` message (empty) |
| `monitoring/streamz/proto/streamz.proto` | Stub with empty metric messages |
| `gws/mothership/` | Remove entirely — replace with standard gRPC |
| `third_party/protobuf/cpp_features.proto` | Only needed for editions files; protoc 25+ should have built-in support |
| `third_party/protobuf/java_features.proto` | Only needed for Java codegen |

### 5.2 How to Adapt for Standard protoc

#### Required protoc version
- Minimum: **protoc 27.0+** (for editions support and proto2 compatibility)
- Recommended: **protoc 29.0+** (stable editions support)

#### Compilation strategy

Two-pass approach:

```bash
# Pass 1: Compile all standalone proto3 and proto2 files
protoc \
  --proto_path=. \
  --proto_path=third_party/google \  # your stub directory
  --cpp_out=gen/cpp \
  --go_out=gen/go \
  proto3_files.txt

# Pass 2: Compile proto2 files with extensions and MessageSet
protoc \
  --proto_path=. \
  --proto_path=third_party/google \
  --experimental_allow_proto3_optional \  # for proto3 optional in proto2 context
  --cpp_out=gen/cpp \
  proto2_files.txt
```

#### Handling proto2 required fields

Proto2's `required` keyword is permanently part of proto2 syntax. You can:
1. Keep proto2 syntax for those files (protoc still compiles proto2)
2. Convert `required` to `optional` + add validation logic in your application
3. Keep as-is if you never plan to migrate to proto3 or editions

#### Handling extensions

Proto2 extensions are not supported in proto3 codegen. If you need proto3:
1. Convert extensions to `google.protobuf.Any` (lossy but portable)
2. Convert to oneof dispatch (requires enumerating all possible extension types)
3. Use a separate proto2 compilation unit with C++ lite runtime

### 5.3 What to Replace `storage/datapol` Annotations With

For privacy/governance, these are your options:

| Google Annotation | Purpose | Open-Source Replacement |
|------------------|---------|-----------------------|
| `storage/datapol/annotations` | Field-level semantic type classification (PII, location, etc.) | Custom annotations using standard `google.protobuf.FieldOptions` extensions |
| `logs/proto/logs_annotations` | Identifier type classification (36 types) | Custom enum-based annotation |
| `wireless/android/privacy/collection_basis_annotations` | Collection purpose declaration | Custom `CollectionBasis` enum annotation |
| `privacy/data_governance/` | Data classification, purpose, policy | Custom governance annotations |

Create a unified governance annotation:

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

### 5.4 How to Handle MessageSet Extensions in Standard Protobuf

**Option A: Oneof Dispatch (Recommended)**

Convert MessageSet extension registrations to oneof:

```protobuf
// Before (Google style):
message FeatureIdProto {
  required fixed64 cell_id = 1;
  required fixed64 fprint = 2;
  extensions 1000 to max [message_set = true];  // MessageSet
}

// In a separate file (registering as extension):
extend FeatureIdProto {
  optional CrawlFeatureIdProto crawl_feature_id = 27021333;
}

// After (standard style):
message FeatureIdProto {
  fixed64 cell_id = 1;
  fixed64 fprint = 2;
  oneof temporary_data {
    CrawlFeatureIdProto crawl_feature_id = 3;
    StrongReferenceProto strong_reference = 4;
    HasBackReferenceProto has_back_reference = 5;
    // ... enumerate all known extensions
  }
}
```

**Pros:** Type-safe, supported everywhere, no runtime dispatch overhead  
**Cons:** Must know all extension types at schema design time; adding new types requires schema change

**Option B: google.protobuf.Any (Portable)**

```protobuf
import "google/protobuf/any.proto";

message FeatureIdProto {
  fixed64 cell_id = 1;
  fixed64 fprint = 2;
  repeated google.protobuf.Any temporary_data = 3;
}
```

**Pros:** Extensible without schema changes, fully portable  
**Cons:** Loss of type safety at wire level, larger wire size, runtime type checking required

**Option C: Map-Structured Extension (Hybrid)**

```protobuf
message FeatureIdProto {
  fixed64 cell_id = 1;
  fixed64 fprint = 2;
  map<uint32, bytes> temporary_data = 3;  // key = original extension number
}
```

**Pros:** Preserves extension numbering, supports unknown extensions  
**Cons:** Everything is bytes, requires manual serialization/deserialization

### 5.5 Recommended Adaptation Workflow

```
1. Inventory: List all imports → identify which are Google-internal
2. Strip: Remove all `storage/datapol`, `wireless/android`, JSPB imports
3. Stub: Create minimal stubs for `net/proto2/proto/descriptor`,
          `net/proto2/bridge/proto/message_set`, `knowledge/graph/protomesh`
4. Convert: Replace MessageSet extensions with oneof or Any
5. Compile: Two-pass compilation (proto3 first, proto2 second)
6. Validate: Binary wire format compatibility test with reference messages
7. Implement: Your own server-side logic for each RPC method
8. Test: Mock server with reference request/response pairs
```

---

## Summary: What You Can Realistically Build

| Project | Feasibility | Effort |
|---------|-----------|--------|
| Type-safe client SDK for any language | **High** | Days (after stripping internal deps) |
| Compatible Earth Studio UI state management | **High** | Weeks (60+ state slices defined) |
| Mock server for testing | **High** | Days to weeks (509 RPC methods) |
| Geo data storage with proper schema | **High** | Days (geostore schemas are complete) |
| Analytics/logging pipeline | **High** | Days (logs protos are comprehensive) |
| Route-finding data model | **High** | Days (schemas only — algorithm is yours to implement) |
| 3D globe viewer configuration | **Medium** | Weeks (schemas define what, not how to render) |
| Map tiling pipeline data model | **Medium** | Weeks (versatile/paint schemas are rich but rendering engine is external) |
| AI assistant interface | **Medium** | Weeks (schemas define contract, LLM is external) |
| Design/solar analysis tool data model | **Medium** | Weeks (schemas define inputs/outputs, algorithms are external) |
| Full Google Maps clone | **Low** | Years (schema only — no data, no rendering engine, no algorithms) |
| Direct connection to Google's production APIs | **Low** | Requires valid API keys, OAuth tokens, and compliance with ToS |

---

> **Bottom line:** These 1,316 proto files are the Rosetta Stone for understanding Google Earth Studio's and Google Maps' data architecture. They enable building compatible clients, validators, mock servers, storage systems, and analytics pipelines. They do not contain any implementation logic, rendering code, actual map data, or server-side business logic. With ~800 Google-internal dependencies that must be stripped or stubbed, expect 1-3 weeks of adaptation work before compilation succeeds with standard protoc. The schemas are production-proven (supporting millions of users across Earth, Maps, and routing), but they are internal Google schemas with no stability guarantees.
