# Google Earth Web Reimplementation — Architecture

> **Last updated:** 2026-08-12  
> **Stack:** TypeScript + Three.js + Next.js  
> **Protocol source of truth:** 1,316 `.proto` files from Google Earth's internal repository

---

## 1. What This Project Is (and Is Not)

### We are building: a browser-based Google Earth client

A single-page web application that renders a 3D globe, enables search, knowledge cards, feature creation/editing, Street View, time-lapse, and map layer toggling — all using the **exact wire protocol** that `https://earth.google.com/web/` uses.

### We are NOT building:

- ❌ A tile server — we request tiles from Google's existing tile infrastructure
- ❌ A search backend — we serialize `PerformSearch` commands and send them the same way earth.google.com does
- ❌ A Knowledge Graph — we receive `RenderableEntity` messages, just like the real client
- ❌ A routing engine — the proto files define only the *data format* for route results, not the algorithm
- ❌ A replacement for Google's cloud storage — we target their existing document/feature APIs
- ❌ A CesiumJS application — the rendering engine is **Three.js**, as specified

### What we DO build:

- ✅ A **Three.js rendering engine** (globe, camera, layers, features, 3D models)
- ✅ A **proto adapter layer** — compiled proto → TypeScript classes with JSON serialization
- ✅ An **HTTP client layer** that serializes/deserializes using the exact proto message types
- ✅ **Compatible mock servers** for when Google's endpoints are unreachable

---

## 2. How Google Earth Web Actually Works

### 2.1 The Real Protocol Stack

The Google Earth web client (`earth.google.com/web/`) does **not** use a single unified API. It communicates over multiple protocols to different backend services:

```
┌─────────────────────────────────────────────────────────────┐
│                  Browser (earth.google.com/web/)             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  C++ Rendering Engine (compiled to WebAssembly)       │   │
│  │  - Globe tessellation & LOD                          │   │
│  │  - Tile decoding & texture mapping                   │   │
│  │  - 3D building extrusion                             │   │
│  │  - Terrain mesh generation                           │   │
│  │  - Camera control & animation                        │   │
│  │  - Layer compositing                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  JavaScript Application Shell                        │   │
│  │  - UI (search bar, knowledge cards, side panel)      │   │
│  │  - State management                                  │   │
│  │  - Command dispatch                                  │   │
│  │  - Analytics / logging                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
         ════════════════════╪════════════════════
                             │
    ┌────────────────────────┼────────────────────────────┐
    │                        │                             │
    ▼                        ▼                             ▼
┌────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│  HTTP/JSON │     │  HTTP/Protobuf    │     │  gRPC (HTTP/2)       │
│  (JSPB)    │     │  (binary)         │     │                      │
└────────────┘     └──────────────────┘     └──────────────────────┘
    │                        │                        │
    ▼                        ▼                        ▼
┌────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│ Search     │     │ Map Tile         │     │ Photo Metadata       │
│ Knowledge  │     │ Servers          │     │ Street View          │
│ Cards      │     │ (imagery,        │     │ (MetadataService     │
│ Features   │     │  terrain,        │     │  gRPC service)       │
│ User State │     │  vectors)        │     │                      │
└────────────┘     └──────────────────┘     └──────────────────────┘
```

### 2.2 JSPB: The Key Serialization Format

JSPB stands for **Java Server Protobufs** — it is essentially protobuf messages serialized as JSON. Google's internal Java servers serialize protobuf to JSON for web clients to consume. The wire format is JSON with camelCase field names that match the proto field names.

**Evidence from the source protos:**

In `metadataservice.proto` line 100-105:
```protobuf
optional ProtoFormat http_response_format = 3 [default = JSPB];
enum ProtoFormat {
    UNKNOWN_FORMAT = 0;
    BINARY = 1;
    JSPB = 2;
}
```

The **default response format is JSPB** — meaning the servers natively speak JSON-encoded protobuf. This is the primary format we must support.

### 2.3 Only 2 gRPC Services Exist

Of all 1,316 proto files, only **two** define gRPC `service` blocks:

| Service | File | Purpose |
|---------|------|---------|
| `MetadataService` | `geo/photo/proto/metadataservice.proto` | Photo metadata, Street View connectivity, single image search |
| `Operations` | `google/longrunning/operations.proto` (external) | Long-running async task management |

**Everything else is pure message definitions.** These messages are serialized to JSPB JSON and sent over HTTP POST endpoints.

### 2.4 Command-Based Architecture

The client does not call "API endpoints" directly. Instead, it dispatches `Command` messages:

```protobuf
message Commands {
    repeated Command commands = 1;
}

message Command {
    oneof command_type {
        PerformSearch perform_search = 5;
        OpenKnowledgeCard open_knowledge_card = 7;
        FlyToCamera fly_to_camera = 8;
        CreateFeature create_feature = 17;
        DeleteFeature delete_feature = 19;
        ToggleLayer toggle_layer = 16;
        SetBasemapStyle set_basemap_style = 23;
        EnterStreetView enter_street_view = 15;
        // ... 34 command types total
    }
}
```

Each command carries the exact parameters needed. The server interprets the command and returns the appropriate response type (which is also a proto message).

---

## 3. Proto File Inventory: What Each Category Defines

### Core Client Protocol (`geo/earth/proto/`)

| Proto File | Defines | Role in Our Client |
|-----------|---------|-------------------|
| `commands.proto` | 34 user action types | **Dispatch system** — serialize user intent to server |
| `geometry.proto` | `Camera`, `Location`, `LatLng`, `Rotation`, `Size` | **Camera state** — the fundamental spatial types |
| `renderable-entity.proto` | `RenderableEntity` (knowledge card with images, facts, hours, etc.) | **Search results** — display entity info from Knowledge Graph |
| `mapstyle.proto` | `MapStyle` (projection, imagery, 3D features, layers) | **Map configuration** — control basemap appearance |
| `map_type.proto` | `MapType` enum (EARTH, MYMAPS) | **Document type** — distinguish project types |
| `error_response.proto` | `ErrorResponse` with error IDs | **Error handling** — parse server errors |
| `photos.proto` | `ThumbnailPhotos`, `ThumbnailImage` | **Photo layer** — display thumbnail clusters |
| `documentnamespace.proto` | `DocumentNamespace` enum | **Project scope** — EARTH vs MYMAPS |
| `storage_restrictions.proto` | Storage/export restriction flags | **Permissions** — respect server access controls |
| `bootstrap_client_config.proto` | Client bootstrap configuration | **Initialization** — startup parameters |
| `compile_time_config.proto` | Compile-time feature flags | **Feature gating** — determine available features |
| `processing_instruction.proto` | Server processing hints | **Request metadata** — tell server how to process |
| `user_industry.proto` | User industry classification | **Personalization** — user profile data |
| `data_layer_error_detail.proto` | Data layer-specific errors | **Error handling** — layer error details |

### Feature CRUD Protocol (`geo/earth/proto/contentcreation/`)

| Proto File | Defines | Role in Our Client |
|-----------|---------|-------------------|
| `content_editing_model.proto` | `Feature`, `Placemark`, `Document`, `Geometry`, `PointStyle`, `PolylineStyle`, `PolygonStyle`, `BalloonStyle`, `LabelStyle`, `Color`, `Attribute`, `Column`, `Media`, `GroundOverlay`, `NetworkLink`, `EarthDataLayer`, `Model`, `Track`, etc. (113 messages) | **Feature data model** — all shapes for creating/editing/storing geographic features |
| `content_editing_mutations.proto` | `DataMutationSet`, `AddFeature`, `DeleteFeature`, `SetStyle`, `UpdateFeatureProperties`, etc. | **Mutation operations** — how changes are batched and applied |
| `content_editing_requests.proto` | `CreateMapRequest/Response`, `MutateDocumentRequest/Response`, `ReadDocumentRequest/Response`, `RequestOptions` | **Document API** — create/mutate/read cloud projects |
| `content_editing_kml_extensions.proto` | KML-specific extensions | **KML import/export** — parse legacy KML data |
| `data_import_errors.proto` | Import error types | **Error handling** — import validation errors |

### Photo/Street View Protocol (`geo/photo/proto/`)

| Proto File | Defines | Role in Our Client |
|-----------|---------|-------------------|
| `metadataservice.proto` | **gRPC service**: `MetadataService` with 4 RPCs | **Street View** — the ONLY gRPC client we build |
| `location.proto` | `LatLng`, `LatLngRect` | **Photo geolocation** |
| `image_key.proto` | `ImageKey` (photo identification) | **Photo lookup** |
| `render_info.proto` | Photo render parameters | **Photo display** |
| `navigation.proto` | `NavigationChannel`, `Target` (panorama links) | **Street View navigation** |
| `thumbnail_info.proto` | Thumbnail metadata | **Photo thumbnails** |
| `attribution.proto` | Photo attribution data | **Credits display** |
| `description.proto` | Photo descriptions | **Photo info** |
| `publication_info.proto` | Publication metadata | **Photo sourcing** |
| `photo_annotation.proto` | Photo annotations with positions | **Annotated photos** |
| `pano_semantic_map.proto` | Panorama semantic segmentation | **Semantic labels in Street View** |
| `view_parameters.proto` | View/camera parameters for photos | **Photo viewpoint** |
| `street_view_attributes.proto` | Street View-specific metadata | **SV info display** |
| `statistics.proto` | Photo view/contribution stats | **Photo statistics** |
| `ocr_info.proto` | OCR text detected in photos | **Text in photos** |
| `photo_label.proto` | Photo labels/categories | **Photo categorization** |
| `photo_query_options.proto` | Query parameters | **Photo search options** |
| `photo_by_lat_lng_query.proto` | Location-based photo search | **Geographic photo search** |
| `photo_by_feature_query.proto` | Feature-based photo search | **Feature-linked photos** |
| `single_image_search.proto` | Single image search | **Image retrieval** |
| `similarity_options.proto` | Similar photo search | **Visual similarity** |
| `feature_set.proto` | Feature context for photos | **Linked features** |
| `offering_contribution.proto` | User contribution data | **Photo uploads** |
| `client_capabilities.proto` | Client capability declaration | **Server negotiation** |
| `request_context.proto` | Request metadata | **Request context** |
| `localization_context.proto` | Localization data | **i18n** |
| `date_time.proto` | Date/time types | **Photo dates** |
| `experimental.proto` | Experimental features | **Opt-in features** |
| `takedown.proto` | Content takedown info | **Moderation** |
| `thumbnail_options.proto` | Thumbnail request options | **Thumbnail params** |
| `internal_feature_description.proto` | Internal feature references | **Server-only** |
| `image_attribute.proto` | Image attributes | **Image properties** |

### Geostore — Server-Side Feature Database (`geostore/base/proto/`)

These 156 proto files define Google's internal geographic feature database schema. They are **not** part of the client-server protocol, but they document the data model that underlies all features:

| Category | Examples | Relevance |
|----------|---------|-----------|
| Core types | `feature.proto`, `featureid.proto`, `attribute.proto` | Understanding the feature graph |
| Addressing | `address.proto`, `addresscomponent.proto`, `addresslines.proto` | Address parsing |
| Buildings | `building.proto`, `entrance.proto`, `elevation.proto` | 3D building data |
| Businesses | `establishment.proto`, `businesshours.proto`, `business_chain.proto` | POI data |
| Transit | `accesspoint.proto`, `transit_entrance_attachment.proto` | Transit data |
| EV charging | `ev_charger.proto`, `ev_station.proto`, `emobility_ids.proto` | Charging stations |
| Routing | `border.proto`, `curvature.proto`, `curve_connection.proto` | Road geometry |
| Display | `display_data.proto`, `doodle.proto` | Visual data |
| Elevation | `elevationmodel.proto` | Terrain data |
| City data | `cityjson.proto`, `cityobject_attributes.proto` | 3D city models |

### Maps — Tile & Routing Data (`maps/`)

Proto files defining map tile schemas, routing request/response formats, traffic data, and transit routing. These are the data shapes used for map tile requests and route calculations.

### Logging/Analytics (`logs/`)

Proto files defining analytics events (`EarthEvent`, `EarthLogProto`), user settings, experiment flags, and startup metrics — used for client-side telemetry.

### Google Internal Dependencies

Many proto files import from Google-internal packages (`storage/datapol`, `net/proto2`, `java/com/google`, `privacy/pattributes`, `util/task`, `frameworks/testing`, `google/longrunning`). These imports must be:

1. **Stripped** when compiling for our TypeScript client (they're server-side annotations)
2. **Provided as stubs** for the few that define actual message types (`google/longrunning/operations.proto`)

---

## 4. Our Implementation Architecture

### 4.1 Layer Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                    Next.js Application Shell                       │
│  Pages, routing, state management, UI components                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────┴─────────────────────────────────────┐
│                   Three.js Rendering Engine                        │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ Globe        │  │ Camera       │  │ Layer System            │  │
│  │ - Sphere     │  │ - LookAt     │  │ - Basemap tiles         │  │
│  │   geometry   │  │ - LookFrom   │  │ - 3D buildings          │  │
│  │ - Texture    │  │ - Animations │  │ - Terrain               │  │
│  │   mapping    │  │   (fly,      │  │ - Animated clouds       │  │
│  │ - LOD        │  │    orbit,    │  │ - Gridlines             │  │
│  │   levels     │  │    teleport) │  │ - Photos overlay        │  │
│  └──────────────┘  └──────────────┘  │ - Pinned projects       │  │
│                                      │ - Timelapse overlay     │  │
│  ┌──────────────┐  ┌──────────────┐  │ - Data layers           │  │
│  │ Features     │  │ Street View  │  └────────────────────────┘  │
│  │ - Placemarks │  │ - Panorama   │                              │
│  │ - Polylines  │  │   sphere     │  ┌────────────────────────┐  │
│  │ - Polygons   │  │ - Navigation │  │ Knowledge Cards         │  │
│  │ - 3D Models  │  │   arrows     │  │ - Info panels           │  │
│  │ - Ground     │  │ - Transitions│  │ - Image carousels       │  │
│  │   overlays   │  │              │  │ - Entity thumbnails     │  │
│  └──────────────┘  └──────────────┘  └────────────────────────┘  │
│                                                                    │
│  All geometry types (Camera, LatLng, Location, Rotation, etc.)    │
│  are driven by proto-defined data shapes.                         │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────┴─────────────────────────────────────┐
│                     Proto Adapter Layer                            │
│                                                                    │
│  Compiled protobuf-ts with JSON serialization:                    │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  From `commands.proto`:                                      │ │
│  │  Commands, Command, PerformSearch, FlyToCamera,              │ │
│  │  ToggleLayer, CreateFeature, DeleteFeature, ...              │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  From `geometry.proto`:                                      │ │
│  │  Camera, Location, LatLng, Rotation, Size                    │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  From `renderable-entity.proto`:                             │ │
│  │  RenderableEntity, Fact, Image, CardSet, Entity, ...         │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  From `mapstyle.proto`:                                      │ │
│  │  MapStyle, BaseLayers, Projection, Imagery, ...              │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  From `content_editing_model.proto`:                         │ │
│  │  Feature, Placemark, Document, Geometry, PointStyle,         │ │
│  │  PolylineStyle, PolygonStyle, BalloonStyle, LabelStyle,      │ │
│  │  Color, Media, GroundOverlay, Model, Track, ...              │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  From `content_editing_mutations.proto`:                     │ │
│  │  DataMutationSet, DataMutation, AddFeature, DeleteFeature,   │ │
│  │  SetStyle, UpdateFeatureProperties, ...                      │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  From `content_editing_requests.proto`:                      │ │
│  │  CreateMapRequest/Response, MutateDocumentRequest/Response,  │ │
│  │  ReadDocumentRequest/Response, RequestOptions                │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  From `error_response.proto`:                                │ │
│  │  ErrorResponse                                              │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │  From photo protos:                                          │ │
│  │  ThumbnailPhotos, ThumbnailImage, PhotoMetadata, ...         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  Helper methods (auto-generated by protobuf-ts):                  │
│  • PerformSearch.toJson() → {"query": "...", "viewport": {...}}  │
│  • RenderableEntity.fromJson(json) → typed TypeScript object     │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────┴─────────────────────────────────────┐
│                      HTTP Client Layer                             │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  CommandDispatcher                                           │ │
│  │  • Accepts Command objects                                   │ │
│  │  • Serializes to JSPB JSON using toJson()                    │ │
│  │  • POSTs to appropriate endpoint                             │ │
│  │  • Deserializes response using fromJson()                    │ │
│  │  • Returns typed response objects                            │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  TileClient                                                  │ │
│  │  • Constructs tile URLs from MapStyle + camera viewport      │ │
│  │  • Fetches imagery/terrain/vector tiles                      │ │
│  │  • Decodes tile data (JPEG, PNG, protobuf vectors)          │ │
│  │  • Returns textures/geometry for the rendering engine        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  gRPC Client (Street View only)                              │ │
│  │  • MetadataService client via @protobuf-ts/grpcweb-transport │ │
│  │  • GetMetadata, GetConnectivity, SingleImageSearch           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  FeatureClient                                               │ │
│  │  • CreateMap, MutateDocument, ReadDocument                   │ │
│  │  • Uses content_editing_requests types                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬─────────────────────────────────────┘
                             │
         ════════════════════╪════════════════════
                             │
    ┌────────────────────────┼────────────────────────────┐
    │                        │                             │
    ▼                        ▼                             ▼
┌────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│ Google     │     │ Google           │     │ Google Photo         │
│ Earth API  │     │ Tile Servers     │     │ Servers              │
│ (JSPB/JSON)│     │ (HTTP/HTTPS)     │     │ (gRPC)               │
└────────────┘     └──────────────────┘     └──────────────────────┘
    │                        │                        │
    │  When unreachable      │  When unreachable      │  When unreachable
    ▼                        ▼                        ▼
┌────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│ Compatible │     │ Compatible        │     │ Compatible Photo     │
│ Mock API   │     │ Tile Proxy        │     │ Mock Server          │
│ Server     │     │ Server            │     │                      │
└────────────┘     └──────────────────┘     └──────────────────────┘
```

### 4.2 Data Flow: User Searches

```
1. User types "Eiffel Tower" in search bar
2. Search component creates:
   PerformSearch {
     query: "Eiffel Tower",
     viewport: { north: ..., south: ..., east: ..., west: ... }
   }
3. Wrapped in Command { perform_search: performSearch }
4. Wrapped in Commands { commands: [command] }
5. CommandDispatcher.toJson(commands) → JSON string
6. POST to Google Search endpoint
7. Response arrives as JSON
8. RenderableEntity.fromJson(response) → typed object:
   {
     title: "Eiffel Tower",
     description: ["Wrought-iron lattice tower..."],
     image: { url: "https://...", width: 800, height: 600 },
     latLon: { lat: 48.8584, lon: 2.2945 },
     camera: { location: {...}, rotation: {...}, fieldOfViewY: 45 },
     facts: [...],
     openHours: {...},
     website: {...},
     ...
   }
9. Three.js camera flies to entity.camera coordinates
10. Knowledge card panel renders entity.title, entity.description, entity.image
```

### 4.3 Data Flow: Create Feature

```
1. User clicks "Add Placemark" on the globe at lat/lng
2. Feature editor creates:
   Feature {
     placemark: Placemark {
       point: Point { coordinates: [LatLng { lat: x, lng: y }] },
       ...
     },
     featureProperties: FeatureProperties { name: "My Place", ... },
     featureStyle: FeatureStyle { pointStyle: PointStyle { ... } }
   }
3. Wrapped in AddFeature { feature: feature, parentFeatureId: "..." }
4. Wrapped in DataMutation { addFeature: addFeature }
5. Wrapped in DataMutationSet { dataMutation: [mutation] }
6. Wrapped in MutateDocumentRequest { ... }
7. POST to Google Document API
8. Response contains updated document state
9. Three.js renders the new placemark on the globe
```

### 4.4 Data Flow: Map Tile Loading

```
1. Camera state changes (user pans/zooms)
2. Current Camera { location, rotation, fieldOfViewY } captured
3. Active MapStyle { projection: GLOBE, imagery: SATELLITE, ... } read
4. TileClient calculates visible tile coordinates:
   - Zoom level from camera altitude / fieldOfViewY
   - Tile (x, y) from lat/lng bounding box
5. Constructs tile URLs:
   https://khms.googleapis.com/...?...
6. Fetches tile JPEG/PNG data
7. Decodes image → WebGL texture
8. Maps texture onto globe mesh faces at correct UV coordinates
9. For vector tiles: decodes protobuf → Three.js geometry (buildings, roads)
```

---

## 5. Development Phases (Corrected)

### Phase 0: Proto Compilation Infrastructure

**Goal:** All 1,316 proto files compile to TypeScript with JSON serialization support.

**Work:**
- Strip Google-internal dependencies (`storage/datapol`, `net/proto2/bridge`, `java/com/google`, `privacy/pattributes`, `frameworks/testing`)
- Provide stub `.proto` files for external types we need (`google/longrunning/operations.proto`, `google/protobuf/timestamp.proto`, `google/type/datetime.proto`)
- Configure `@protobuf-ts/plugin` for TypeScript output with JSON serialization
- Generated TypeScript should support: `Message.toJson()`, `Message.fromJson(json)`, `Message.toBinary()`, `Message.fromBinary(bytes)`
- Verify: all proto messages compile without errors

**Key decision:** protobuf-ts (NOT protobuf.js) — better TypeScript integration, tree-shakeable, actively maintained.

**Output:** `src/generated/` directory with all compiled TypeScript types.

### Phase 1: Three.js Globe + Camera

**Goal:** Visible 3D globe with camera controls, driven by proto `Camera` and `MapStyle` types.

**Work:**
- Initialize Three.js scene with a textured sphere
- Implement camera that accepts `earth.Camera` proto objects:
  ```
  Camera { location: Location { lat, lng, altitude },
           rotation: Rotation { heading, tilt, roll },
           fieldOfViewY: 45,
           screenSize: Size { width, height } }
  ```
- Globe projection mode from `MapStyle.Projection` (GLOBE vs MERCATOR)
- Camera animations: teleport, fly, orbit (matching `FlyToCamera.CameraAnimation` enum)
- Basic lighting and atmosphere effect

**Proto types consumed:**
- `earth.Camera`, `earth.Location`, `earth.LatLng`, `earth.Rotation`, `earth.Size` (geometry.proto)
- `earth.layers.MapStyle` (mapstyle.proto)

### Phase 2: Command Dispatch System

**Goal:** All 34 command types can be constructed, serialized, dispatched, and responses deserialized.

**Work:**
- Implement `CommandDispatcher` class
- Each command type gets a handler:
  - `PerformSearch` → search endpoint
  - `OpenKnowledgeCard` → knowledge card endpoint
  - `FlyToCamera` → local camera update (no network call)
  - `ToggleLayer` → local layer state (no network call)
  - `SetBasemapStyle` → local map style update (triggers Phase 4 tile refresh)
  - `CreateFeature` / `DeleteFeature` / `EditFeature` → document API (Phase 3)
  - `EnterStreetView` → Street View (Phase 6)
  - `EnterTimelapse` / `EnterTimeMachine` → timelapse mode
  - etc.
- Implement `CommandHistory` for undo/redo
- JSPB JSON serialization/deserialization for all messages

**Proto types consumed:**
- `geo.earth.proto.Commands`, `Command`, all 34 command types (commands.proto)

### Phase 3: Feature CRUD

**Goal:** Users can create, read, update, and delete geographic features on the globe.

**Work:**
- Implement `FeatureClient` using `content_editing_requests.proto` types
- `CreateMap` → creates a new cloud project
- `MutateDocument` with `DataMutationSet` → batch feature mutations
- `ReadDocument` → load existing projects
- Implement `FeatureStore` (local state cache of document contents)
- Three.js renderer for feature types:
  - `Placemark` (point with icon/label)
  - `Polyline` (line geometry on globe surface)
  - `Polygon` (filled/extruded area on globe)
  - `GroundOverlay` (image draped on terrain)
  - `Model` (3D model at location)
  - `Track` (animated path)
- Style rendering: `PointStyle` (icon, label), `PolylineStyle` (color, width), `PolygonStyle` (fill, outline)
- `BalloonStyle` → HTML info windows

**Proto types consumed:**
- All of `content_editing_model.proto` (113 messages)
- All of `content_editing_mutations.proto`
- All of `content_editing_requests.proto`

### Phase 4: Map Tile Pipeline

**Goal:** Satellite imagery, terrain, and 3D buildings render on the globe — fetched from Google's tile servers.

**Work:**
- Implement `TileClient`:
  - Tile coordinate math (lat/lng → zoom/x/y)
  - Tile URL construction for different imagery types from `MapStyle.Imagery` enum
  - Tile fetching with caching and request queuing
- Imagery tiles: JPEG/PNG → WebGL texture → globe UV mapping
- Terrain tiles: heightmap data → displacement of globe vertices
- 3D building tiles: vector tile protobuf → Three.js extruded geometry
- Layer toggling matches `ToggleLayer.LayerType` enum:
  - `LAYER_TYPE_3D_BUILDINGS` → building extrusion on/off
  - `LAYER_TYPE_TIMELAPSE` → historical imagery
  - `LAYER_TYPE_PHOTOS` → photo overlays
  - `LAYER_TYPE_GRIDLINES` → lat/lon grid
  - `LAYER_TYPE_ANIMATED_CLOUDS` → cloud layer
  - `LAYER_TYPE_PINNED_PROJECTS` → saved project markers

**Proto types consumed:**
- `MapStyle` (imagery type, projection, layer config)
- `Camera` (viewport for tile calculation)

### Phase 5: Search + Knowledge Cards

**Goal:** Full search functionality with rich knowledge card display.

**Work:**
- Implement `SearchClient` — sends `PerformSearch`, receives search results
- Parse search results into `RenderableEntity` objects
- Render knowledge cards:
  - Title, description, known_for
  - Image carousel from `imageCarousel`
  - Facts from `fact` array
  - `openHours` display with day intervals
  - `website` link
  - `addressLine` display
  - `entityThumbnailList` (related entities)
  - `phoneNumber` display
  - `openLocationCode` (Plus Codes)
- "I'm Feeling Lucky" / Voyager integration
- Search history management

**Proto types consumed:**
- `earth_knowledge.RenderableEntity` and all nested types
- `PerformSearch` command

### Phase 6: Street View (gRPC)

**Goal:** Street View panoramas with navigation — the ONLY real gRPC client in the project.

**Work:**
- Implement gRPC client for `MetadataService`:
  - `GetMetadata` — get photo metadata by image key
  - `GetConnectivity` — get panorama navigation graph
  - `GetConnectivityZoomLevel` — get available zoom levels
  - `SingleImageSearch` — find images by location or feature
- Panorama rendering:
  - Equirectangular sphere with panoramic texture
  - Navigation arrows between connected panoramas
  - Smooth sphere-to-sphere transitions
- Thumbnail display
- Photo annotations overlay

**Proto types consumed:**
- All of `metadataservice.proto` request/response types
- `photo.proto` supporting types
- `grpcweb-transport` from @protobuf-ts

### Phase 7: Cloud Projects + State Management

**Goal:** Full cloud document lifecycle — create, save, load, share projects.

**Work:**
- Project CRUD using document proto types
- `OpenCloudProject` / `CreateCloudProject` command handlers
- Local state persistence (IndexedDB)
- Project sharing via resource keys
- `DocumentNamespace.EARTH` vs `MYMAPS` handling
- KML import/export using `content_editing_kml_extensions.proto`
- `OpenKmlDocument` / `OpenKmlDocumentFromContent` handlers
- Earth Mate chat integration (`OpenEarthMateChat`)

**Proto types consumed:**
- `documentnamespace.proto`
- `content_editing_kml_extensions.proto`
- Document-related command types

---

## 6. Compatible Mock Servers

When Google's servers are unreachable (offline development, testing, or the user chooses to use them), we provide compatible server implementations that speak the same proto-defined contracts:

| Mock Server | Replaces | Implements |
|------------|----------|-----------|
| Mock Search API | Google search backend | Accepts `PerformSearch`, returns `RenderableEntity` objects from a local dataset |
| Mock Tile Server | Google tile servers | Serves pre-cached or procedurally generated tiles at correct URLs |
| Mock Document API | Google cloud storage | Implements `CreateMap`, `MutateDocument`, `ReadDocument` with local file storage |
| Mock Photo Server | Google Photo services | Implements `MetadataService` gRPC with a local photo dataset |

These mock servers use the **exact same proto message types** — meaning the client code does not change. Only the HTTP endpoint URL changes.

---

## 7. Key Technical Decisions

| Decision | Rationale |
|----------|----------|
| **protobuf-ts** (not protobuf.js) | First-class TypeScript support, tree-shakeable, JSON serialization built-in, actively maintained |
| **Three.js** (not CesiumJS) | Specified by project requirements; lighter weight; full control over rendering pipeline |
| **JSPB JSON** as primary wire format | Matches what Google's servers actually return; the `ProtoFormat` default in the protos is `JSPB` |
| **Commands as the dispatch primitive** | Matches Google Earth's actual architecture; all user actions are `Command` messages |
| **Proto types drive rendering** | Camera, MapStyle, Feature geometry — all rendering state is proto-typed; no made-up types |
| **gRPC only for photos** | Only 2 service definitions exist; full gRPC stack is overkill for HTTP JSPB endpoints |
| **Compatible mock servers, not production servers** | We build a client; where Google's backend is needed but unavailable, we mock it |

---

## 8. Project Structure

```
earthstudiowasm/
├── ARCHITECTURE.md              ← This file
├── ARCHITECTURE_zh.md           ← Chinese translation
├── proto/                       ← Original .proto files (read-only reference)
│   ├── geo/earth/proto/
│   ├── geo/photo/proto/
│   ├── geostore/base/proto/
│   └── ...
├── src/
│   ├── generated/               ← Compiled TypeScript from protos (auto-generated)
│   │   ├── commands.ts
│   │   ├── geometry.ts
│   │   ├── renderable-entity.ts
│   │   ├── mapstyle.ts
│   │   ├── content-editing-model.ts
│   │   ├── content-editing-mutations.ts
│   │   ├── content-editing-requests.ts
│   │   ├── metadataservice.ts
│   │   ├── metadataservice.client.ts   ← gRPC client for MetadataService
│   │   └── ...
│   ├── engine/                  ← Three.js Rendering Engine
│   │   ├── Globe.ts             ← Sphere geometry, texture mapping, LOD
│   │   ├── Camera.ts            ← Proto Camera → Three.js camera adapter
│   │   ├── CameraAnimation.ts   ← Fly, teleport, orbit animations
│   │   ├── layers/
│   │   │   ├── BasemapLayer.ts
│   │   │   ├── BuildingLayer.ts
│   │   │   ├── TerrainLayer.ts
│   │   │   ├── CloudLayer.ts
│   │   │   ├── PhotoLayer.ts
│   │   │   └── FeatureLayer.ts
│   │   ├── features/
│   │   │   ├── PlacemarkRenderer.ts
│   │   │   ├── PolylineRenderer.ts
│   │   │   ├── PolygonRenderer.ts
│   │   │   ├── ModelRenderer.ts
│   │   │   └── GroundOverlayRenderer.ts
│   │   └── streetview/
│   │       ├── PanoramaRenderer.ts
│   │       └── NavigationGraph.ts
│   ├── adapter/                 ← Proto Adapter Layer
│   │   ├── CommandSerializer.ts
│   │   ├── ResponseDeserializer.ts
│   │   └── types.ts
│   ├── client/                  ← HTTP / gRPC Client Layer
│   │   ├── CommandDispatcher.ts
│   │   ├── TileClient.ts
│   │   ├── FeatureClient.ts
│   │   ├── SearchClient.ts
│   │   ├── MetadataServiceClient.ts   ← gRPC client
│   │   └── HttpClient.ts
│   ├── store/                   ← State Management
│   │   ├── CameraStore.ts
│   │   ├── MapStyleStore.ts
│   │   ├── FeatureStore.ts
│   │   ├── ProjectStore.ts
│   │   └── LayerStore.ts
│   ├── ui/                      ← Next.js UI Components
│   │   ├── SearchBar.tsx
│   │   ├── KnowledgeCard.tsx
│   │   ├── LayerPanel.tsx
│   │   ├── FeatureEditor.tsx
│   │   ├── ProjectPanel.tsx
│   │   └── TimelapseControls.tsx
│   └── pages/                   ← Next.js Pages
│       └── index.tsx
├── mock/                        ← Compatible Mock Servers
│   ├── mock-search-server/
│   ├── mock-tile-server/
│   ├── mock-document-server/
│   └── mock-photo-server/
├── scripts/
│   └── compile-protos.ts        ← Proto compilation script
└── package.json
```

---

## 9. Summary

| What | Reality |
|------|---------|
| Rendering engine | **Three.js** (not CesiumJS) |
| Protocol | HTTP + JSPB JSON (protobuf messages serialized as JSON) |
| gRPC usage | Only `MetadataService` for photo/Street View; plus `Operations` service |
| Tile source | Google's existing tile servers (we request tiles, we don't serve them) |
| Search | Serialize `PerformSearch` command → Google's search backend |
| Features | Serialize `DataMutationSet` → Google's document API |
| Knowledge cards | Deserialize `RenderableEntity` from server responses |
| Proto files | Source of truth for ALL data shapes — nothing is made up |
| Mock servers | Compatible stand-ins using same proto contracts, for offline/testing |
