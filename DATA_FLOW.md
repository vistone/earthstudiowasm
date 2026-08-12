# Earth Studio WASM — Data Flow Analysis

## How earth.google.com/web/ communicates, decoded from proto files

> **Source**: 1,316 proto files under `geo/earth/proto/` define the complete wire protocol of the Earth web client.

---

### 1. Architectural Overview

The Earth web client communicates with Google's Earth backend through **two distinct channels**:

| Channel | Protocol | Format | Used For |
|---|---|---|---|
| **Earth RPC (HTTP/REST)** | HTTP POST/GET + JSON | **JSPB** (Java Server Protobufs) | Search, knowledge cards, features, documents, KML, AI, analytics, bootstrap |
| **Photo Metadata (gRPC)** | gRPC (binary protobuf) | **Binary protobuf** or **JSPB JSON** | Street View panorama metadata & connectivity |

The Earth RPC layer wraps proto messages as JSON following JSPB conventions (camelCase field names). The gRPC layer uses standard proto binary encoding, with an explicit `JSPB` format option available.

---

### 2. Data Layer Categories

Based on proto analysis, the complete data categories exchanged:

| Category | Proto Source | Direction | Format |
|---|---|---|---|
| Bootstrap Config | `bootstrap_client_config.proto` | Server → Client | JSPB JSON |
| Map Imagery Tiles | `mapstyle.proto` (imagery enum) | Server → Client | Binary (JPEG/PNG/WebP) + proto metadata |
| 3D Terrain | — (standard elevation tiles) | Server → Client | Binary (quantized mesh) |
| 3D Buildings | `ToggleLayer` → `LAYER_TYPE_3D_BUILDINGS` | Server → Client | Binary (glTF/3D Tiles) |
| Search Results | `PerformSearch` → `RenderableEntity` | Client → Server → Client | JSPB JSON |
| Knowledge Cards | `OpenKnowledgeCard` → `RenderableEntity` | Client → Server → Client | JSPB JSON |
| Feature CRUD | `CreateFeature` / `EditFeature` / `DeleteFeature` | Client → Server | JSPB JSON |
| Document Storage | `OpenCloudProject` / `CreateCloudProject` / `OpenProjectByKey` | Client → Server → Client | JSPB JSON |
| KML Import/Export | `OpenKmlDocument` / `OpenKmlDocumentFromContent` | Client → Server → Client | JSPB JSON |
| Earth Mate AI | `OpenEarthMateChat` → `earth_mate/` | Client → Server → Client | JSPB JSON |
| Image Generation | `OpenImageGenerator` | Client → Server → Client | JSPB JSON |
| Street View Photos | `MetadataService` (gRPC) | Client ↔ Server | Binary protobuf or JSPB JSON |
| Analytics | `earth_log.proto` (89 event types) | Client → Server | JSPB JSON |
| User State | `state/*.proto` (60+ slices) | Client ↔ Server | JSPB JSON |
| Design/Analysis | `ViewDesign` / `CreateDesigns` / `ViewOnDemandAnalysis` | Client → Server → Client | JSPB JSON |

---

### 3. All 34 User Commands (from `commands.proto`)

Every user interaction in Earth Web is serialized as a `Command` message with a oneof:

| # | Command | Purpose | Key Fields |
|---|---|---|---|
| 1 | `ClearSearchHistory` | Clear user's search history | — |
| 2 | `OpenSearchHistory` | Open search history panel | — |
| 3 | `OpenVoyagerGrid` | **[deprecated]** Voyager story browser | `category_id` |
| 4 | `OpenVoyagerStory` | **[deprecated]** Open a story | `guid`, `feed_item`, `balloon_feature_id` |
| 5 | `PerformSearch` | Search for places | `query`, `result_group_id`, `viewport` (N,S,E,W bounds) |
| 6 | `OpenFeelingLuckyCard` | Open "I'm Feeling Lucky" card | — |
| 7 | `OpenKnowledgeCard` | Open place details card | `fid` or `mid`, `metadata.lat_lon`, `card_size` |
| 8 | `FlyToCamera` | Animate camera to position | `look_at` or `look_from`, `camera_animation` (teleport/fly) |
| 9 | `OpenCloudProject` | Open a saved project | `project_id`, `document_namespace` (EARTH/MYMAPS), `present_mode` |
| 10 | `CreateCloudProject` | Create a new project | `folder_id` |
| 11 | `EnterTimeMachine` | Enter historical imagery mode | `date`, `timelapse_enabled`, `timelapse_framerate_multiplier` |
| 12 | `OpenKmlDocument` | Open KML by URL | `uri` |
| 13 | `EnterTimelapse` | Toggle timelapse mode | `enabled`, `expanded`, `framerate_multiplier`, `paused_at_year` |
| 14 | `CreatePointPlacemark` | Create a point on the map | `lat_lng_alt` (lat, lng, altitude), `altitude_mode` |
| 15 | `EnterStreetView` | Enter Street View at location | `lat_lng_alt` |
| 16 | `ToggleLayer` | Toggle map overlay layers | `layer_type` (buildings/timelapse/coverage/photos/gridlines/clouds), `enabled` |
| 17 | `CreateFeature` | Create named feature | `feature_properties`, `feature_style`, `document_key`, `overhead_imagery_properties` |
| 18 | `OpenKmlDocumentFromContent` | Open KML from raw content | `content` (bytes) |
| 19 | `DeleteFeature` | Delete a feature | `document_key`, `feature_id` |
| 20 | `EditFeature` | Edit existing feature | `document_key`, `feature_id`, `feature_properties`, `feature_style` |
| 21 | `OpenProjectByKey` | Open project by document key | `document_key` (int), `fly_to_after_load` |
| 22 | `SetHomescreenVisibility` | Show/hide homescreen | `is_open` |
| 23 | `SetBasemapStyle` | Change map imagery type | `imagery` (SATELLITE/ROADMAP/TERRAIN) |
| 24 | `CreateFeaturesInFolder` | Batch create features in folder | `commands[]`, `document_key`, `folder_name` |
| 25 | `RenderDesign` | **[deprecated]** Render a design | `design` (bytes) |
| 26 | `ViewDesign` | View design details | `selected_design_id`, `is_design_details_open` |
| 27 | `CreateDesigns` | Start solar/new build design | `design_input_mode` (NEW_BUILD/SOLAR) |
| 28 | `ToggleAvailableLayersUi` | Open data catalog | `open_data_catalog` |
| 29 | `PreviewDataLayer` | Preview a data layer | `earth_data_layer_identifier` |
| 30 | `ViewRateCard` | Open pricing rate card | `open_rate_card` |
| 31 | `OpenEarthMateChat` | Open AI Earth Mate chat | `is_open`, `initial_query` |
| 32 | `ShowLayerCardDetails` | Show layer card details | `earth_data_layer_identifier` |
| 33 | `ViewOnDemandAnalysis` | Terrain analysis tools | `open_slope_analysis`, `open_aspect_analysis`, `open_cut_and_fill_analysis`, `open_contour_analysis` |
| 34 | `OpenImageGenerator` | Open AI image generator | `initial_query` |

Commands are typically batched in `Commands { repeated Command commands = 1; }`.

---

### 4. JSPB Format (Proto → JSON Wire Format)

Google's web client uses **JSPB** (Java Server Protobufs) — a JSON representation of protobuf messages. Each proto field name is converted to **camelCase**. Enum values are transmitted as **strings** (their names), not integers.

#### 4.1 Example: `FlyToCamera` (from `commands.proto` lines 136–194)

Proto definition:
```protobuf
message FlyToCamera {
    oneof camera_type {
        LookAt look_at = 1;
        LookFrom look_from = 2;
    }
    optional CameraAnimation camera_animation = 3 [default = CAMERA_ANIMATION_TELEPORT];
    optional CameraPresentationMode camera_presentation_mode = 4;
    optional Panorama panorama = 5;
    optional bool disable_clamping = 6;

    message LookAt {
        optional double latitude = 1;
        optional double longitude = 2;
        optional double altitude = 3;
        optional double range = 4;
        optional double heading = 5;
        optional double tilt = 6;
        optional double roll = 7;
        optional double fovy = 8;
    }
}
```

JSPB JSON equivalent (what actually goes over the wire):
```json
{
  "lookAt": {
    "latitude": 40.7128,
    "longitude": -74.006,
    "altitude": 1000,
    "range": 5000,
    "heading": 45,
    "tilt": 30
  },
  "cameraAnimation": "CAMERA_ANIMATION_TELEPORT",
  "cameraPresentationMode": "PRESENTATION_MODE_STATIC"
}
```

Key JSPB conventions:
- **Field names**: `snake_case` proto → `camelCase` JSON
- **Enums**: transmitted as string names, not integers
- **Oneof fields**: only the active variant is present
- **Optional/absent fields**: simply omitted from JSON
- **Defaults**: not transmitted (client interprets absence as default)

---

### 5. Request/Response Flow for Each Feature

#### 5.1 Application Bootstrap

```
User navigates to https://earth.google.com/web/
  → Browser GET / (HTML page)
  → Downloads Earth Web WASM bundle
  → WASM initializes, requests client configuration
  → Server returns BootstrapClientConfig as JSPB JSON

BootstrapClientConfig (bootstrap_client_config.proto):
  ├── earth_service_config: ServiceConfig
  │   Contains: tile server URLs, imagery providers, API endpoints,
  │   experiment flags (A/B test assignments), feature gates,
  │   CompileTimeConfig (base layer styles, paint layers, raster layers)
```

The `BootstrapClientConfig` wraps a `google.internal.earth.v1.config.ServiceConfig` — this is the master configuration that tells the client:
- Where to fetch map tiles
- Which API endpoints to call for search, features, etc.
- Which experimental features are enabled
- What map styles and layers are available

#### 5.2 Map Tile Loading

```
Client receives BootstrapClientConfig
  → Extracts tile server URLs from ServiceConfig
  → Computes required tile coordinates based on camera viewport
  → Requests tiles from configured tile server

Request:  GET {tile_server_url}/{zoom}/{x}/{y}?style={MapStyle}
Response: Binary image (JPEG/PNG/WebP) + optional proto metadata

MapStyle (from mapstyle.proto) controls:
  projection        : GLOBE | MERCATOR
  imagery           : SATELLITE | NORMAL_ROADMAP | TERRAIN
  three_d_features  : ALL | TERRAIN_ONLY | NONE
  show_clouds       : bool (default true)
  gridlines_layer   : NONE | LAT_LON
  show_three_d_coverage_layer : bool
  show_updated_imagery_layer  : bool
  show_land_parcels_layer     : bool
  show_pinned_projects_layer  : bool
  use_animated_clouds         : bool
  base_layers       : BaseLayers { preset: CLEAN | EXPLORATION | EVERYTHING }
```

ToggleLayer controls dynamic overlay toggling:
```
Layer types:
  LAYER_TYPE_3D_BUILDINGS      (1) — 3D building models (glTF/3D Tiles)
  LAYER_TYPE_TIMELAPSE         (2) — timelapse overlay
  LAYER_TYPE_RECENTLY_UPDATED  (3) — recently updated imagery
  LAYER_TYPE_3D_COVERAGE       (4) — 3D coverage area overlay
  LAYER_TYPE_PHOTOS            (5) — photo thumbnails layer
  LAYER_TYPE_GRIDLINES         (6) — latitude/longitude grid
  LAYER_TYPE_ANIMATED_CLOUDS   (7) — animated cloud overlay
  LAYER_TYPE_PINNED_PROJECTS   (10) — pinned projects layer
```

#### 5.3 Search Flow

```
User types query → Client sends PerformSearch command

Request (JSPB JSON):
{
  "query": "Eiffel Tower",
  "resultGroupId": "0",
  "viewport": {
    "north": 51.0,
    "south": 41.0,
    "east": 10.0,
    "west": -5.0
  },
  "suppressFlyToResults": false
}

// Batch: Commands { commands: [{ "performSearch": {...} }] }

Response: RenderableEntity[] (earth_knowledge package, from renderable-entity.proto)
```

**RenderableEntity** structure (complete, from `renderable-entity.proto` lines 11–174):

```
RenderableEntity {
  title                     : string         — place name
  known_for                 : string         — what the place is known for
  description               : string[]        — multi-paragraph description
  mid                       : string         — Knowledge Graph machine ID
  lat_lon                   : {lat, lon}     — coordinates
  feature_id                : string         — Earth feature ID
  is_lat_lon_entity         : bool           — was this a coordinate search?

  source[]                  : {anchor_text, url}
  image                     : {url, width, height, attribution, description}
  large_image               : Image
  image_carousel[]           : Image[]
  static_map[]               : Image[]

  camera                    : Camera         — best view (location, rotation, fov)
  bounding_box              : {
    southwest_corner        : LatLon
    northeast_corner        : LatLon
    recommended_zoom        : int32
  }

  address_line[]             : string[]
  phone_number[]             : string[]
  website                   : {url, anchor_text}
  open_location_code        : {global_code, compound_code}  — Plus Code
  maps_url                  : string         — Google Maps link

  fact[]                     : {
    name                    : string         — fact category
    fact_value[]            : {string_value}
    source[]                : Source
    search_url              : string
  }

  open_hours                : {
    day[]                   : {
      day_name              : string         — "Monday", "Tuesday", ...
      open_interval[]       : string[]       — "09:00–17:00"
    }
  }

  card_set[]                : {name, card: Entity[]}
  entity_thumbnail_list[]    : {name, entity: Entity[], attribute_id, search_url, entity_type}
  place_attribute[]          : {id, localized_display_name}
  fun_fact[]                 : {text, source[]}

  spotlight_description     : {proto_bytes, entity_class (POINT|AREA), suppress_rendering}  [deprecated]
  pipe_metadata             : {search_pipe_metadata_proto_bytes}
  error[]                   : {msg}
  card_source[]             : Source[]
}
```

#### 5.4 Feature CRUD Flow

Feature management uses the `content_editing_model.proto` data model:

```
Document (lines 14–25):
  ├── id                         : string
  ├── metadata                   : {title, description, using_design_feature}
  ├── properties                 : {look_at_camera}
  ├── schema                     : { column[] }
  ├── contents                   : { feature[], feature_tree_continuation[] }
  ├── style                      : ContentStyle
  ├── creation_info              : CreationInfo
  ├── owner_profile              : OwnerProfile
  ├── type                       : MapType (MAP_EARTH | MAP_EARTH_DESIGN)
  └── model_version              : MODEL_VERSION_V1

Feature (lines 77–84):
  ├── feature_id                 : string
  ├── is_continued               : bool
  ├── properties                 : FeatureProperties
  ├── media[]                    : Media
  ├── child_feature[]            : Feature          — tree structure
  └── render_style               : FeatureStyle

FeatureProperties (lines 54–75):
  ├── attribute[]                : {name → value}
  ├── look_at_camera             : LookAtCamera
  ├── visible                    : bool (default true)
  ├── title                      : string
  ├── description               : string
  ├── snippet                    : string
  ├── address                    : string
  ├── place_info                 : {mapfacts_feature_id, knowledge_graph_machine_id}
  ├── is_geocoded               : bool
  ├── feature_restrictions       : {export_restrictions, edit_restrictions}
  ├── feature_origin             : FEATUREORIGIN_USER (17)
  ├── feature_model_type         : PLACEMARK | GROUND_OVERLAY | MAP_TILE_PYRAMID | CONTAINER | NETWORK_LINK | SCREEN_OVERLAY | PHOTO_OVERLAY
  ├── placemark                  : Placemark (geometry, model, or track_set)
  ├── ground_overlay             : GroundOverlay
  ├── map_tile_pyramid           : MapTilePyramid
  ├── container                  : Container
  ├── network_link               : NetworkLink
  ├── screen_overlay             : ScreenOverlay
  └── photo_overlay              : PhotoOverlay

Placemark (lines 86–92):
  oneof GeometryRepresentation {
    geometry                     : Geometry   — {points[], polylines[], polygons[]}
    model                        : Model     — 3D model reference
    track_set                    : TrackSet  — GPS tracks
  }

Geometry (lines 152–156):
  ├── points[]                   : Point     — {position, altitude, altitude_mode, extrude}
  ├── polylines[]                : Polyline  — {point[], altitude_mode, extrude, tessellate}
  └── polygons[]                 : Polygon   — {loop[], altitude_mode, extrude}

LookAtCamera (lines 101–118):
  ├── position                   : LatLng
  ├── altitude                   : double
  ├── altitude_mode              : CLAMP_TO_GROUND | RELATIVE_TO_GROUND | ABSOLUTE
  ├── heading                    : double
  ├── tilt                       : double
  ├── range                      : double
  ├── fovy                       : double (default 35°)
  ├── roll                       : double
  ├── type                       : LOOKATCAMERA_LOOKAT | LOOKATCAMERA_CAMERA
  └── options                    : {enable_streetview, enable_historical_imagery,
                                    enable_sunlight_effects, timestamp, streetview_pano_id}
```

**CRUD Operations:**

```
CreateFeature:
  Request (JSPB):
  {
    "featureProperties": {
      "title": "My Marker",
      "placemark": { "geometry": { "points": [{"position": {"latitude": 40.7, "longitude": -74.0}}] } }
    },
    "featureStyle": {...},
    "documentKey": 42,
    "overheadImageryProperties": { "image": {...}, "acquisitionTime": "..." }
  }
  Response: Feature (with server-assigned feature_id)

EditFeature:
  Request (JSPB):
  {
    "documentKey": 42,
    "featureId": "abc123",
    "featureProperties": { "title": "Updated Name" },
    "featureStyle": {...}
  }
  Response: Feature (updated)

DeleteFeature:
  Request (JSPB):
  {
    "documentKey": 42,
    "featureId": "abc123"
  }
  Response: success or ErrorResponse

CreateFeaturesInFolder (batch):
  Request (JSPB):
  {
    "commands": [{...}, {...}],
    "documentKey": 42,
    "folderName": "My Folder"
  }
```

#### 5.5 Document / Project Flow

```
Documents are identified by:
  - project_id (string)     — cloud document ID (UUID)
  - document_key (int32)    — local document handle
  - resource_key (string)   — access key for shared documents
  - document_namespace      — DOCUMENT_NAMESPACE_EARTH (1) | DOCUMENT_NAMESPACE_MYMAPS (2)

OpenCloudProject:
{
  "projectId": "abc-def-123",
  "documentNamespace": "DOCUMENT_NAMESPACE_EARTH",
  "flyToAfterLoad": true,
  "resourceKey": "optional-access-key",
  "presentMode": { "featureId": "xyz" }  // opens directly to specific feature
}

CreateCloudProject:
{ "folderId": "parent-folder-id" }

OpenProjectByKey:
{ "documentKey": 42, "flyToAfterLoad": true }

KML Import:
  OpenKmlDocument:         { "uri": "https://example.com/mydata.kml" }
  OpenKmlDocumentFromContent:  { "content": <raw KML bytes> }
```

#### 5.6 Earth Mate AI Flow (Complete)

Earth Mate is Google's AI assistant for Earth. The full protocol:

```
User triggers chat → OpenEarthMateChat { "isOpen": true, "initialQuery": "Show me Manhattan" }

Client sends EarthMateQueryRequest (JSPB):
{
  "queryString": "Show me Manhattan",
  "appContext": {
    "creationContext": {
      "documentKey": 42,                     // active document
      "documentId": "abc-def",
      "selectedFeatureIds": ["feat1"],
      "documentModelVersion": "MODEL_VERSION_V1"
    },
    "viewContext": {
      "viewport": { "north": 40.9, "south": 40.6, "east": -73.8, "west": -74.1 },
      "viewportImage": { "mimeType": "image/png", "imageBytes": "..." },
      "groundCoverageWidthMeters": 12000
    },
    "clientMetadata": {...},
    "configId": "...",
    "isOpenVocabToolSelected": false,
    "overheadImagerySearchContext": { "similarityThreshold": 0.8 }
  },
  "chatContext": {
    "chatHistory": {
      "messages": [
        { "text": "What's here?", "isBard": true, "requestId": "r1" },
        { "text": "Show the tallest building", "isBard": false, "requestId": "r2" }
      ]
    },
    "chatId": "chat-abc-123"
  },
  "requestId": "r3"
}

Server returns EarthMateQueryResponse (JSPB):
{
  "commands": [                              // ← Earth Mate generates COMMANDS
    { "flyToCamera": { "lookAt": { "latitude": 40.758, "longitude": -73.985, ... } } },
    { "createFeature": { "featureProperties": {...}, "documentKey": 42 } }
  ],
  "responseString": "Here's Times Square in Manhattan.",
  "queryExecutionMetadata": {
    "responseFeatureLimitReached": false,
    "isPassthroughResponse": false,
    "isSlideshow": false,
    "nonFatalError": null
  },
  "attributions": [{...}],
  "chatId": "chat-abc-123",
  "viewportFileAttachment": { "encodedAttachmentId": "..." }
}

Client then EXECUTES the returned commands
  → FlyToCamera flies to location
  → CreateFeature adds a marker
  → etc.
```

**Earth Mate Area Description** (analyze an area of interest):

```
Request: {
  "polygons": [{ "loop": [{...}] }],
  "industry": "REAL_ESTATE",
  "format": "FORMAT_SHORT",
  "queryString": "Analyze this area for solar potential",
  "appContext": {...}
}

Response: {
  "responseString": "This area has excellent solar potential...",
  "suggestedFollowupQueries": ["What are the best roof angles?"],
  "expandedResponseString": "Detailed analysis..."
}
```

**Earth Mate Error Types** (from `earth_mate_error_detail.proto`):
```
UNEXPECTED_TOOL_ERROR (1)    — tool execution failed
RPC_TIMEOUT (2)               — backend timeout
POI_TYPE_SENSITIVE (3)        — sensitive location
POI_TYPE_NOT_FOUND (4)        — place not in knowledge graph
LOCATION_NOT_FOUND (5)        — location not recognized
ANYTHING_MAPPER_UNAVAILABLE (6)
PROBLEM_TOO_COMPLEX (7)       — query too complex for AI
AGENT_FRAMEWORK_OVERLOADED (8) — backend overloaded
```

#### 5.7 Street View / Photo Flow (gRPC)

The **ONLY gRPC service** in the entire Earth web client is `MetadataService` (from `metadataservice.proto`):

```protobuf
service MetadataService {
    rpc GetMetadata(MetadataRequest) returns (MetadataResponse);
    rpc GetConnectivity(AreaConnectivityRequest) returns (AreaConnectivityResponse);
    rpc GetConnectivityZoomLevel(AreaConnectivityZoomLevelRequest) returns (AreaConnectivityZoomLevelResponse);
    rpc SingleImageSearch(SingleImageSearchRequest) returns (SingleImageSearchResponse);
}
```

**Flow 1: Entering Street View**

```
User clicks a location → EnterStreetView { lat_lng_alt: {40.7, -74.0, 100} }

Client requests connectivity graph:
  GetConnectivity(AreaConnectivityRequest) {
    context: RequestContext,
    polygon: { point: [{lat, lng}, ...] },
    first_point: LatLng,
    date: DateTime,
    navigation_channel: GLOBAL,
    include_target_orientation: true
  }

  → AreaConnectivityResponse {
    graph: {
      vertex: [{
        image_info: Target { image_key, ... },
        image_connection: [uint32, ...]      // indices of connected vertices
      }, ...]
    },
    token: [{ token: "...", region: {...} }, ...],
    region: LatLngRectangle,
    self_reference_token: "...",
    index_of_first_external_vertex: int32
  }
```

**Flow 2: Getting Photo Metadata**

```
GetMetadata(MetadataRequest) {
  context: RequestContext,
  localization_context: LocalizationContext,
  query: [{ image_key: ImageKey, context_feature: FeatureSet }, ...],
  response_specification: {
    component: [RENDER_INFO, DESCRIPTION, ATTRIBUTION, GEOLOCATION,
                NAVIGATION_LINKS, STATISTICS, STREET_VIEW, THUMBNAIL, ...],
    navigation_channel: NavigationChannelKey[],
    http_response_format: BINARY | JSPB,
    thumbnail_options: {...},
    client_capabilities: {...}
  }
}

  → MetadataResponse {
    photo: [{
      image_key: ImageKey,
      render_info: RenderInfo,
      description: Description,
      attribution: Attribution,
      navigation_channel: NavigationChannel[],
      attributes: ImageAttributes,
      statistics: Statistics,
      street_view_attributes: StreetViewAttributes,
      labels: PhotoLabel[],
      thumbnail: ThumbnailInfo[],
      pano_semantic_map: PanoSemanticMap,
      ...
    }, ...]
  }
```

**Flow 3: Single Image Search**

```
SingleImageSearchRequest {
  context: RequestContext,
  location: PhotoByLatLngQuery,    // or feature: PhotoByFeatureQuery
  image_key: ImageKey,
  query_options: PhotoQueryOptions,
  response_specification: MetadataResponseSpecification,
  pixel_specification: PixelResponseSpecification
}

  → SingleImageSearchResponse {
    metadata: PhotoMetadata,
    view: ViewParameters,
    tile: {
      zoom_level: int32,
      tile_jpeg: bytes              // ← RAW JPEG BYTES
    }
  }
```

**Response format is configurable** per `MetadataResponseSpecification`:
```protobuf
enum ProtoFormat {
    UNKNOWN_FORMAT = 0;
    BINARY = 1;   // standard protobuf binary
    JSPB = 2;     // JSON representation
}
```

#### 5.8 Design & Analysis Flow

```
ViewDesign (design detail panel):
{ "selectedDesignId": "design-1", "isDesignDetailsOpen": true, "isDesignViewerOpen": false }

CreateDesigns (start new design):
{ "designInputMode": "DESIGN_INPUT_MODE_NEW_BUILD" }
// or: { "designInputMode": "DESIGN_INPUT_MODE_SOLAR" }

ViewOnDemandAnalysis (terrain analysis, oneof):
{
  "openSlopeAnalysis": true
  // or: "openAspectAnalysis": true
  // or: "openCutAndFillAnalysis": true
  // or: "openContourAnalysis": true
}
```

---

### 6. Error Handling

All server responses can contain an `ErrorResponse` (from `error_response.proto`) when something goes wrong:

```protobuf
message ErrorResponse {
    ErrorId error_id:
        UNKNOWN_ERROR_ID (0)
        INTERNAL_ERROR (1)
        NOT_FOUND (2)
        PERMISSION_DENIED (3)
        INVALID_GEOMETRY_IN_S2 (4)
        MAX_LAYERS_REACHED (5)
        QUOTA_EXCEEDED (6)
        DATA_IMPORT_ERROR (7)
        EARTH_MATE_ERROR (8)
        DATA_LAYER_ERROR (9)

    bool is_retryable          // should client retry?
    string message             // human-readable error
    bool throttled             // was request throttled?

    oneof detailed_error {
        DataImportErrorStatus data_import_error_status
        EarthMateErrorDetail earth_mate_error_detail
        DataLayerErrorDetail data_layer_error_detail
    }
}
```

**JSPB representation:**
```json
{
  "errorId": "PERMISSION_DENIED",
  "isRetryable": false,
  "message": "You do not have access to this project.",
  "throttled": false
}
```

---

### 7. Proto → Open Format Conversion

#### 7.1 Geometry → GeoJSON

```typescript
// geo/earth/proto/geometry.proto → GeoJSON

function latLngToGeoJSON(latLng: earth.LatLng): GeoJSON.Point {
  return {
    type: "Point",
    coordinates: [latLng.lng, latLng.lat],   // GeoJSON is [lon, lat]
  };
}

// content_editing_model Placemark → GeoJSON Feature
function placemarkToGeoJSON(pm: Placemark): GeoJSON.Feature {
  if (pm.geometry?.points?.length) {
    return {
      type: "Feature",
      geometry: pointToGeoJSON(pm.geometry.points[0].position),
      properties: {
        name: pm.properties?.title,
        description: pm.properties?.description,
        altitude: pm.geometry.points[0].altitude,
        altitudeMode: pm.geometry.points[0].altitude_mode,
      },
    };
  }
  if (pm.geometry?.polylines?.length) {
    return {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: pm.geometry.polylines[0].point.map(p => [p.position.longitude, p.position.latitude]),
      },
      properties: {},
    };
  }
  if (pm.geometry?.polygons?.length) {
    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: pm.geometry.polygons[0].loop.map(l =>
          l.point.map(p => [p.position.longitude, p.position.latitude])
        ),
      },
      properties: {},
    };
  }
  throw new Error("Unsupported geometry type");
}
```

#### 7.2 RenderableEntity → Schema.org / Open Standard

```typescript
function entityToSchemaOrg(entity: RenderableEntity): SchemaOrgPlace {
  return {
    "@type": "Place",
    "name": entity.title,
    "description": entity.description?.join("\n"),
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": entity.lat_lon?.lat,
      "longitude": entity.lat_lon?.lon,
    },
    "image": entity.image?.url,
    "address": entity.address_line?.join(", "),
    "telephone": entity.phone_number?.[0],
    "url": entity.website?.url,
    "openingHoursSpecification": entity.open_hours?.day?.map((d) => ({
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": schemaOrgDay(d.day_name!),
      "opens": d.open_interval?.[0],
      "closes": d.open_interval?.[1],
    })),
    "additionalProperty": entity.fact?.map((f) => ({
      "@type": "PropertyValue",
      "name": f.name,
      "value": f.fact_value?.map(v => v.string_value).join(", "),
    })),
    "subjectOf": entity.card_source?.map((s) => ({
      "@type": "WebPage",
      "url": s.url,
      "name": s.anchor_text,
    })),
  };
}
```

#### 7.3 Camera → Standard ECEF Parameters

```typescript
// Both LookAt (commands.proto) and earth.Camera (geometry.proto) →
// Universal camera parameters for any rendering engine

interface UniversalCamera {
  position: { x: number; y: number; z: number };  // ECEF meters
  target: { x: number; y: number; z: number };     // ECEF meters
  up: { x: number; y: number; z: number };
  fov: number;                                     // degrees vertical
}

function lookAtToUniversal(lookAt: FlyToCamera.LookAt): UniversalCamera {
  const target = latLngAltToEcef(lookAt.latitude!, lookAt.longitude!, lookAt.altitude ?? 0);
  const headingRad = degToRad(lookAt.heading ?? 0);
  const tiltRad = degToRad(lookAt.tilt ?? 0);
  const range = lookAt.range ?? 1000;

  const pos = offsetFromTarget(target, range, headingRad, tiltRad);
  return {
    position: pos,
    target: target,
    up: { x: 0, y: 0, z: 1 },
    fov: lookAt.fovy ?? 35,
  };
}

function earthCameraToUniversal(camera: earth.Camera): UniversalCamera {
  const loc = camera.location!;
  const rot = camera.rotation!;
  const target = latLngAltToEcef(loc.latitude!, loc.longitude!, loc.altitude ?? 0);
  const headingRad = degToRad(rot.heading ?? 0);
  const tiltRad = degToRad(rot.tilt ?? 0);

  const pos = offsetFromTarget(target, 1000, headingRad, tiltRad);
  return {
    position: pos,
    target: target,
    up: { x: 0, y: 0, z: 1 },
    fov: camera.field_of_view_y ?? 35,
  };
}
```

---

### 8. Data Parsing Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│                   HTTP Response (JSPB JSON)                   │
│  { "lookAt": { "latitude": 40.7, "longitude": -74.0 } }     │
└──────────────────────────┬───────────────────────────────────┘
                           │  JSON.parse()
┌──────────────────────────┴───────────────────────────────────┐
│         protobuf-ts / protobuf-es: JSON → Proto Message      │
│  FlyToCamera.fromJson(response)                              │
│  → Typed object with all field accessors                     │
└──────────────────────────┬───────────────────────────────────┘
                           │  Adapter layer
┌──────────────────────────┴───────────────────────────────────┐
│              Adapter: Proto → Open Format                    │
│  lookAtToUniversal(cmd.lookAt)                               │
│  entityToGeoJSON(renderableEntity)                           │
│  geometryToWKT(placemark.geometry)                           │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────┴───────────────────────────────────┐
│           Output: Platform-Independent Data                  │
│  GeoJSON · glTF references · Schema.org · WKT · ECEF coords │
│  → usable by Three.js, CesiumJS, MapLibre, Unity, Unreal    │
└──────────────────────────────────────────────────────────────┘
```

---

### 9. Implementation Priority

The **ONLY** thing to implement for a pure data layer:

#### Phase 1: Proto → TypeScript Codegen

```bash
# Using @protobuf-ts/plugin (recommended)
protoc \
  --ts_out . \
  --proto_path geo/earth/proto \
  geo/earth/proto/commands.proto \
  geo/earth/proto/renderable-entity.proto \
  geo/earth/proto/contentcreation/content_editing_model.proto \
  geo/earth/proto/bootstrap_client_config.proto \
  geo/earth/proto/mapstyle.proto \
  geo/earth/proto/geometry.proto \
  geo/earth/proto/error_response.proto \
  geo/earth/proto/earth_mate/*.proto \
  geo/photo/proto/metadataservice.proto \
  geo/earth/proto/photos.proto
```

This generates typed TypeScript classes with `.toJson()` and `.fromJson()` for JSPB.

#### Phase 2: HTTP Fetch Layer

```typescript
class EarthDataClient {
  async bootstrap(): Promise<BootstrapClientConfig> { ... }
  async performSearch(query: string, viewport: LatLonBox): Promise<RenderableEntity[]> { ... }
  async openKnowledgeCard(mid: string): Promise<RenderableEntity> { ... }
  async createFeature(docKey: number, props: FeatureProperties): Promise<Feature> { ... }
  async editFeature(docKey: number, featureId: string, props: FeatureProperties): Promise<Feature> { ... }
  async deleteFeature(docKey: number, featureId: string): Promise<void> { ... }
  async openProject(projectId: string): Promise<Document> { ... }
  async earthMateQuery(query: string, context: EarthMateAppContext): Promise<EarthMateQueryResponse> { ... }
}
```

#### Phase 3: Open Format Converters

```typescript
// Converters that transform proto messages → open standards
converters/
  renderable-entity-to-schema-org.ts
  geometry-to-geojson.ts
  camera-to-ecef.ts
  feature-to-geojson.ts
  kml-to-feature.ts
  document-to-geojson-collection.ts
```

#### Phase 4: Data Validation

```typescript
// Runtime validation ensuring API responses match proto schemas
// Uses protobuf-ts built-in message validation
import { FlyToCamera } from './generated/commands';

function validateResponse(data: unknown): FlyToCamera {
  return FlyToCamera.fromJson(data);
}
```

#### Phase 5: Mock Data Generation

```typescript
// Generate valid proto messages for testing without Google servers
import { RenderableEntityBuilder } from './generated-renderable-entity';
// Uses protobuf-ts's message constructor
```

---

### 10. Key Proto Package Dependencies

```
Package                    | Primary Messages / Enums
---------------------------|------------------------------------------
geo.earth.proto            | Command, Commands, FlyToCamera, LatLngAlt,
                           | ToggleLayer, CreateFeature, EnterStreetView,
                           | OpenEarthMateChat, ViewOnDemandAnalysis,
                           | BootstrapClientConfig
earth_knowledge            | RenderableEntity, Image, Fact, OpenHours, Entity
earth.document             | DocumentNamespace, MapType
earth.document.protos      | Document, Feature, FeatureProperties, Placemark,
                           | Geometry, Point, Polyline, Polygon,
                           | LookAtCamera, ErrorResponse
earth.layers               | MapStyle (Imagery, Projection, ThreeDFeatures)
earth                      | Camera, Location, Rotation, LatLng, Size
geo.earth.proto.earth_mate | EarthMateRequestWrapper, EarthMateQueryRequest,
                           | EarthMateQueryResponse, EarthMateChatContext,
                           | EarthMateErrorDetail, FileAttachment
geo_photo_service           | MetadataService (gRPC), PhotoMetadata,
                           | AreaConnectivityResponse, SingleImageSearchResponse
earth_photos               | ThumbnailPhotos, ThumbnailImage, KmlBalloon
```

---

### 11. Summary

The Earth web client's protocol is **fundamentally proto2-based command batching over JSPB JSON**, with a single gRPC exception for photo metadata.

- **34 command types** define every user action — from search to AI chat to terrain analysis
- **JSPB is trivial to parse**: it's just JSON with camelCase field names and string enums
- **RenderableEntity** is the comprehensive "knowledge card" format — title, facts, photos, hours, coordinates, camera, bounding box, related entities
- **Feature CRUD** follows a flat Document → Feature → Placemark/Geometry hierarchy
- **Earth Mate AI** sends context (viewport, document, camera) and receives back executable Commands — not just text
- **Photo/Street View** is the only gRPC service, with both binary and JSPB format options
- **Error handling** has 9 error types plus detailed sub-errors for data import, Earth Mate, and data layers

This gives us a **pure data layer** that:
- Works with the real Google Earth servers via JSPB JSON
- Outputs platform-independent open formats (GeoJSON, Schema.org, ECEF, WKT)
- Can be consumed by ANY renderer or tool
- Is testable without network access via mock proto generation
