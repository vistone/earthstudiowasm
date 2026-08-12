# Earth Studio Clone — Implementation Roadmap

> **Goal:** Build a working Earth Studio clone using the 1,316 Google proto definitions as the schema foundation.
> **Audience:** Actual developers. Every decision has a concrete rationale and measurable scope.
> **Generated:** 2026-08-12

---

## Table of Contents

- [Priority Matrix: MVP vs Full Scope](#priority-matrix-mvp-vs-full-scope)
- [Phase 0: Proto Foundation](#phase-0-proto-foundation)
- [Phase 1: 3D Globe Rendering](#phase-1-3d-globe-rendering)
- [Phase 2: Command System](#phase-2-command-system)
- [Phase 3: Content Creation](#phase-3-content-creation)
- [Phase 4: Maps Integration](#phase-4-maps-integration)
- [Phase 5: Design Tools](#phase-5-design-tools)
- [Phase 6: AI Assistant (Earth Mate)](#phase-6-ai-assistant-earth-mate)
- [Phase 7: Analytics & Logging](#phase-7-analytics--logging)
- [Phase 8: Build & Deploy](#phase-8-build--deploy)
- [Dependency Map](#dependency-map)

---

## Priority Matrix: MVP vs Full Scope

> **The MVP is "Google Earth viewer, not Google Earth Studio editor."** You can't build an editing suite in weeks. You *can* build a globe viewer with search and basic placemarks in 6-8 weeks.

| Feature | MVP | Full Scope | Phase |
|---|---|---|---|
| 3D globe (satellite, terrain, buildings) | ✅ | ✅ | 1 |
| Camera navigation (zoom, pan, tilt, fly-to) | ✅ | ✅ | 1, 2 |
| Search & knowledge cards | ✅ | ✅ | 2 |
| Placemark creation (point drop) | ✅ | ✅ | 3 |
| Layer toggles (buildings, clouds, grid) | ✅ | ✅ | 1 |
| KML import | ✅ | ✅ | 3 |
| Command system (dispatch, state, undo) | ✅ | ✅ | 2 |
| Analytics / event logging | Minimal | ✅ | 7 |
| Polyline/Polygon drawing | ❌ | ✅ | 3 |
| Full feature editor (styles, balloons, media) | ❌ | ✅ | 3 |
| Street View | ❌ | ✅ | 2 |
| Time Machine (historical imagery) | ❌ | ✅ | 2 |
| Timelapse | ❌ | ✅ | 2 |
| Directions / routing | ❌ | ✅ | 4 |
| Transit | ❌ | ✅ | 4 |
| Traffic overlay | ❌ | ✅ | 4 |
| Solar analysis | ❌ | ✅ | 5 |
| Building design (FAR, templates) | ❌ | ✅ | 5 |
| On-demand analysis (slope/aspect/contour) | ❌ | ✅ | 5 |
| Earth Mate AI assistant | ❌ | ✅ | 6 |
| Image generation | ❌ | ✅ | 6 |
| Billing / rate cards | ❌ | ✅ | 8 |
| Cloud projects / sync | ❌ | ✅ | 3, 8 |
| Deep linking | ❌ | ✅ | 2 |
| Mobile (responsive) | ❌ | ✅ | 8 |

**MVP Team:** 2 frontend + 1 backend, 6-8 weeks.  
**Full Scope Team:** 6-8 engineers, 12-18 months.

---

## Phase 0: Proto Foundation

### What the Protos Give Us

**Schema inventory — 1,316 `.proto` files in the repo:**

| Domain | Path | Files | Key contents |
|---|---|---|---|
| Earth Core | `geo/earth/proto/` | 14 | Commands (34 types), content model (113 msgs), map style, geometry, cameras, knowledge cards |
| Earth Mate | `geo/earth/proto/earth_mate/` | 5 | AI request/response, streaming, attribution, file attachment |
| Content Creation | `geo/earth/proto/contentcreation/` | 4 | Document model, mutations (13 types), API requests, KML extensions |
| State Mgmt | `geo/earth/app/cpp/core/state/` | 60+ | 40 non-restorable state slices, 60 derived states |
| Document | `geo/earth/app/cpp/core/document/` | 18 | Metadata, storage, I/O adapters, roles |
| Design | `geo/earth/app/cpp/core/protos/` | 16 | Building templates, site selection, drawing modes |
| Studio | `geo/earth/app/cpp/studio_presenters/` | 7 | Camera animation, base layers, property editor |
| Maps | `maps/` | 344 | Tactile API, paint/rendering, pathfinder, directions, transit, traffic |
| GeoStore | `geostore/` | 162 | FeatureId (S2), Feature container (70 fields), road/lane/restriction models |
| Logs | `logs/` | 182 | Earth events (89 types), VE tracking, directions analytics |
| Internal APIs | `google/internal/earth/v1/` | 48 | Billing, built env, layers, photos, terrain, user, config |

**Problem:** These protos don't compile with standard `protoc`. They depend on ~800 Google-internal imports.

### What We Need to Build

**A compilable proto tree stripped of Google-internal dependencies.**

The blocking imports:
- `storage/datapol/annotations/proto/semantic_annotations.proto` — used by **890 files** (PII annotations)
- `net/proto2/proto/descriptor.proto` — used by **272 files** (extended descriptor with field presence, UTF-8 validation)
- `net/proto2/bridge/proto/message_set.proto` — used by **33 files** (MessageSet extension dispatch)
- `java/com/google/apps/jspb/jspb.proto` — used by **208 files** (JS protobuf annotations)
- `wireless/android/privacy/...` — used by **~60 files** (Android privacy annotations)

### Technology Choices

| Choice | Rationale |
|---|---|
| **protoc 29.0+** | Required for `editions` syntax (462 files) + proto2 compatibility + `cpp_features.proto` built-in support |
| **buf.build** | Linting, breaking change detection, remote plugin execution — eliminates local protoc setup for most flows |
| **Custom proto plugin** | Generate TypeScript types directly from the adapted schema using `protobuf-ts` |
| **sed/awk + Python** | Strip internal deps programmatically; Python script handles the complex cases (MessageSet→oneof conversion) |

### Step-by-Step Implementation

#### Step 0.1: Inventory Internal Dependencies
```bash
# Find all imports that won't resolve with standard protobuf
grep -rh "^import" geo/ maps/ geostore/ logs/ google/ | sort -u > all_imports.txt
grep -E "(storage/datapol|net/proto2|jspb|wireless/android)" all_imports.txt > internal_imports.txt
```

#### Step 0.2: Create `third_party/` Stub Directory
```
third_party/google/
├── storage/datapol/annotations/proto/
│   └── semantic_annotations.proto   # Minimal stub with sem_type extension
├── net/proto2/proto/
│   └── descriptor.proto              # Re-export google/protobuf/descriptor.proto
├── net/proto2/bridge/proto/
│   └── message_set.proto             # Empty MessageSet message
├── knowledge/graph/protomesh/
│   └── protomesh.proto               # Empty ProtoMesh stub
├── net/proto2/contrib/validator/
│   └── annotations.proto             # Empty FieldValidationRule
└── monitoring/streamz/proto/
    └── streamz.proto                 # Empty metric stubs
```

#### Step 0.3: Automated Strip + Replace
```bash
# 1. Replace net/proto2 descriptor import → standard descriptor
find . -name "*.proto" -exec sed -i \
  's|import "net/proto2/proto/descriptor.proto"|import "google/protobuf/descriptor.proto"|g' {} +

# 2. Strip JSPB
find . -name "*.proto" -exec sed -i \
  '/import.*jspb\.proto/d; /option.*jspb/d' {} +

# 3. Strip Android privacy annotations
find . -name "*.proto" -exec sed -i \
  '/import.*collection_basis_annotations/d' {} +
```

#### Step 0.4: Convert MessageSet Extensions → Oneof
The 33 files using MessageSet (most critically `geostore/base/proto/featureid.proto` and `feature.proto`) need conversion. Write a Python script:
1. Parse each proto that has `extensions X to max [message_set = true]`
2. Find all `extend` blocks that register into it
3. Generate a oneof with all known extension types
4. Output the converted file

#### Step 0.5: Two-Pass Compilation
```bash
# Pass 1: Proto3 + Editions files (simpler, fewer extensions)
buf build --path proto3_editions_files.txt -o gen/descriptors.bin

# Pass 2: Proto2 files with extensions
buf build --path proto2_files.txt --exclude-path gen/ -o gen/descriptors2.bin
```

#### Step 0.6: Generate TypeScript SDK
```bash
# Using protobuf-ts for TypeScript codegen
npx @protobuf-ts/plugin \
  --proto_path . \
  --proto_path third_party/google \
  --ts_out src/generated/ \
  proto_files_list.txt
```

#### Step 0.7: Validate Binary Wire Compatibility
Create a test suite that:
1. Encodes known message structures
2. Compares binary output against reference Google-encoded bytes (if available)
3. Validates round-trip encode→decode for all message types

### Estimated Effort: **M (2-3 weeks)**

- Week 1: Inventory, stub creation, automated strip scripts
- Week 2: MessageSet conversion, compilation debugging, 2-pass build
- Week 3: Codegen validation, wire compatibility tests, CI integration

---

## Phase 1: 3D Globe Rendering

### What the Protos Give Us

| Proto File | Key Definitions |
|---|---|
| `geo/earth/proto/mapstyle.proto` | `MapStyle` — `Projection` (Globe/Mercator), `Imagery` (Satellite/Roadmap/Terrain), `ThreeDFeatures` (All/TerrainOnly/None), `GridlinesLayer`, cloud toggle, 8 visual layers |
| `geo/earth/proto/geometry.proto` | `Camera` (location + rotation + screen_size + fov_y), `Location` (lon/lat/alt), `Rotation` (heading/tilt/roll) |
| `geo/earth/proto/commands.proto` | `FlyToCamera` — LookAt/LookFrom cameras, teleport/fly animations, 4 presentation modes (Static/POI Orbit/Planet Orbit/Cinematic), panorama support |
| `geo/earth/app/cpp/studio_presenters/` | 10 camera animation messages, 3 trajectory types (linear/parabolic/contextual) |

### What We Need to Build

A full WebGL/WebGPU globe renderer with:
1. **Ellipsoid globe** (WGS84) with satellite imagery texture
2. **Terrain** (elevation-mapped mesh)
3. **3D buildings** (extruded polygons from OSM or Cesium OSM Buildings)
4. **Camera system** mapping proto types to 3D transforms
5. **Layer toggling** (buildings, clouds, gridlines, timelapse)
6. **Projection switching** (Globe ↔ Mercator)

### Technology Choices

| Option | Pros | Cons | Recommendation |
|---|---|---|---|
| **CesiumJS** | Full-featured, OSS (Apache 2.0), WGS84 ellipsoid, terrain, 3D buildings, camera API matches proto model closely, huge ecosystem | Heavy bundle (~5MB gzipped), complex API surface | **✅ RECOMMENDED for MVP** — closest match to proto schema, fastest path to working globe |
| **MapLibre GL JS** | Lightweight (~500KB), vector tiles, Mercator | 2D-first, no globe/ellipsoid mode, no true 3D buildings out of box, poor camera model match | Maybe for Phase 4 maps rendering |
| **Custom Three.js + globe** | Full control, small bundle, WebGPU support | 6+ months to build terrain, tiling, LOD, imagery, buildings yourself | Only if you have a dedicated rendering team |
| **Babylon.js** | Good WebGPU support, 3D-first | Smaller globe/geo ecosystem, less tile infrastructure | Viable alternative if Cesium license is an issue |

**Final choice: CesiumJS for MVP, with MapLibre GL JS as the 2D/Mercator fallback.**

### Proto-to-Renderer Mapping

```
MapStyle.Projection.GLOBE    → Cesium.SceneMode.SCENE3D
MapStyle.Projection.MERCATOR → Cesium.SceneMode.SCENE2D
MapStyle.Imagery.SATELLITE   → Cesium.IonWorldImageryStyle or Cesium.UrlTemplateImageryProvider
MapStyle.Imagery.ROADMAP     → Cesium.createWorldTerrainAsync() + Cesium.OpenStreetMapImageryProvider
MapStyle.Imagery.TERRAIN     → Cesium.CesiumTerrainProvider (quantized-mesh)
MapStyle.ThreeDFeatures.ALL  → Cesium.Cesium3DTileset (OSM Buildings via ion)
MapStyle.ThreeDFeatures.NONE → tileset.show = false

FlyToCamera.LookAt           → camera.setView({ destination: Cartesian3, orientation: { heading, pitch, roll } })
FlyToCamera.LookFrom         → camera.flyTo({ destination, orientation })
CameraAnimation.TELEPORT     → camera.setView (instant)
CameraAnimation.FLY          → camera.flyTo({ duration: 2.0 })

ToggleLayer                  → MapStyle field toggle → layer visibility
```

### Tile Data Sources

| Imagery Type | MVP Source | Full Scope Source |
|---|---|---|
| Satellite | Cesium ion (free tier: 1M tiles/month) | Self-hosted (AWS S3 + CloudFront, ~$200/mo at scale) |
| Roadmap | OpenStreetMap (free) | MapTiler ($49/mo+) |
| Terrain | Cesium World Terrain (ion, free tier) | MapTiler Terrain RGB |
| 3D Buildings | Cesium OSM Buildings (ion, free tier) | Self-hosted 3D Tiles from OSM exports |
| Gridlines | Canvas-generated overlay | Same |
| Clouds | Static texture or NOAA imagery | Animated cloud loop from satellite data |

### Step-by-Step Implementation

#### Step 1.1: Create Cesium Viewer Shell
```bash
npm install cesium vite
```
Create a minimal HTML/JS app that initializes a Cesium `Viewer` with default imagery and terrain.

#### Step 1.2: Implement Camera Bridge
```typescript
// Map FlyToCamera proto to Cesium camera
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

#### Step 1.3: Implement MapStyle Layer Controller
```typescript
class MapStyleController {
  apply(style: MapStyle): void {
    // Projection
    viewer.scene.mode = style.projection === 'GLOBE'
      ? Cesium.SceneMode.SCENE3D
      : Cesium.SceneMode.SCENE2D;

    // Imagery
    this.setImageryProvider(style.imagery);

    // 3D Features
    this.tileset.show = style.threeDFeatures !== 'NONE';

    // Layer toggles
    this.cloudsLayer.show = style.cloudsEnabled;
    this.gridlinesLayer.show = style.gridlines !== 'NONE';
  }
}
```

#### Step 1.4: Implement Layer Toggle Commands
Map each of the 9 `ToggleLayer` types to Cesium primitive visibility:
- `THREE_D_BUILDINGS` → tileset.show
- `TIMELAPSE` → imagery split position
- `PHOTOS` → photo overlay entity
- `GRIDLINES` → grid entity
- `CLOUDS` → cloud billboard collection
- `PINNED_PROJECTS` → project overlay
- `DISCOVERY_LAYER` → Voyager feed overlay

#### Step 1.5: Add MapStyle Presets
Implement the `BaseLayers.Preset` enum:
- `CLEAN` — satellite + terrain only
- `EXPLORATION` — satellite + terrain + 3D buildings + labels
- `EVERYTHING` — all layers enabled

### Estimated Effort: **L (4-6 weeks)**

- Week 1-2: Cesium integration, basic globe with satellite + terrain
- Week 3: Camera system, fly-to, orbit controls
- Week 4: Layer toggling, presets, projection switching
- Week 5-6: Gridlines, clouds, performance tuning, mobile

---

## Phase 2: Command System

### What the Protos Give Us

| Proto File | Key Definitions |
|---|---|
| `geo/earth/proto/commands.proto` | 34 oneof-dispatched command types with full message schemas |
| `geo/earth/app/cpp/core/state/state.proto` | 40 non-restorable state slices — complete UI state schema |
| `geo/earth/app/cpp/core/state/**/` | 60+ derived state protos for each UI component |

### What We Need to Build

A command dispatcher with:
1. **Type-safe command handler** for all 34 command types
2. **State management** (Redux/MobX/Zustand) mirroring the 40 state slices
3. **Undo/redo stack** using command pattern
4. **Deep linking** — serialize/deserialize state to URL
5. **Command logging** (feeds into Phase 7 analytics)

### Technology Choices

| Choice | Rationale |
|---|---|
| **Zustand** | Lightweight (~1KB), no boilerplate, works with vanilla TS — simpler than Redux Toolkit for this use case |
| **Immer** | Immutable state updates without verbose spread operators |
| **TypeScript strict mode** | Type-safe; generated types from Phase 0 prevent command/state mismatches |

### The 34 Commands — Implementation Map

| # | Command | MVP? | Implementation Complexity | Dependencies |
|---|---|---|---|---|
| 1 | `ClearSearchHistory` | ✅ | Trivial — clear array | LocalStorage |
| 2 | `OpenSearchHistory` | ✅ | Simple — toggle panel | UI state |
| 3 | `OpenVoyagerGrid` | ❌ | Deprecated — skip | — |
| 4 | `OpenVoyagerStory` | ❌ | Deprecated — skip | — |
| 5 | `PerformSearch` | ✅ | Medium — call Places/Geocoding API, show results | Search backend (Phase 4) |
| 6 | `OpenFeelingLuckyCard` | ✅ | Medium — random featured place | Knowledge cards |
| 7 | `OpenKnowledgeCard` | ✅ | Medium — fetch/render entity | Knowledge graph API |
| 8 | `FlyToCamera` | ✅ | Medium — map proto to Cesium camera | Phase 1 |
| 9 | `OpenCloudProject` | ❌ | Hard — cloud auth + doc fetch | Phase 3, auth |
| 10 | `CreateCloudProject` | ❌ | Hard — document creation API | Phase 3, auth |
| 11 | `EnterTimeMachine` | ❌ | Hard — historical imagery slider | Phase 1 extended |
| 12 | `OpenKmlDocument` | ✅ | Medium — KML parser | Phase 3 |
| 13 | `EnterTimelapse` | ❌ | Hard — timelapse playback | Phase 1 extended |
| 14 | `CreatePointPlacemark` | ✅ | Medium — add pin to globe | Phase 3 |
| 15 | `EnterStreetView` | ❌ | Hard — Street View integration | Google Maps API |
| 16 | `ToggleLayer` | ✅ | Simple — toggle visibility | Phase 1 |
| 17 | `CreateFeature` | ✅ | Medium — create placemark/poly/polygon | Phase 3 |
| 18 | `OpenKmlDocumentFromContent` | ✅ | Medium — parse KML string | Phase 3 |
| 19 | `DeleteFeature` | ✅ | Simple — remove from state | Phase 3 |
| 20 | `EditFeature` | ✅ | Medium — property editor | Phase 3 |
| 21 | `OpenProjectByKey` | ❌ | Hard — cloud auth + doc fetch | Phase 3 |
| 22 | `SetHomescreenVisibility` | ✅ | Simple — boolean toggle | UI state |
| 23 | `SetBasemapStyle` | ✅ | Simple — switch imagery provider | Phase 1 |
| 24 | `CreateFeaturesInFolder` | ❌ | Medium — batch creation | Phase 3 |
| 25 | `RenderDesign` | ❌ | Deprecated — skip | — |
| 26 | `ViewDesign` | ❌ | Hard — design viewport | Phase 5 |
| 27 | `CreateDesigns` | ❌ | Hard — solar/new build | Phase 5 |
| 28 | `ToggleAvailableLayersUi` | ❌ | Simple — UI toggle | UI state |
| 29 | `PreviewDataLayer` | ❌ | Hard — BigQuery layer preview | Phase 4 |
| 30 | `ViewRateCard` | ❌ | Medium — billing UI | Phase 8 billing |
| 31 | `OpenEarthMateChat` | ❌ | Hard — AI chat interface | Phase 6 |
| 32 | `ShowLayerCardDetails` | ❌ | Simple — layer metadata card | Phase 4 |
| 33 | `ViewOnDemandAnalysis` | ❌ | Hard — terrain analysis | Phase 5 |
| 34 | `OpenImageGenerator` | ❌ | Hard — AI image gen | Phase 6 |
| **(reserved)** | `35, 36` | — | Skip | — |

**MVP commands: 14 out of 34** (excluding 3 deprecated and 2 reserved).

### Step-by-Step Implementation

#### Step 2.1: TypeScript Type Generation
From Phase 0 output, generate TypeScript interfaces:
```typescript
// Generated from Commands proto
interface Command {
  commandType:
    | { $case: 'clearSearchHistory'; clearSearchHistory: ClearSearchHistory }
    | { $case: 'performSearch'; performSearch: PerformSearch }
    | { $case: 'flyToCamera'; flyToCamera: FlyToCamera }
    // ... 34 cases
}
```

#### Step 2.2: Create Command Dispatcher
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
    this.logCommand(cmd);  // Feeds Phase 7
  }

  undo(): void { ... }
  redo(): void { ... }
}
```

#### Step 2.3: Implement State Store
```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface AppState {
  // 40 non-restorable state slices from state.proto
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

#### Step 2.4: Implement Undo/Redo
Each command handler returns an "inverse command" for undo:
```typescript
class CreateFeatureHandler implements CommandHandler {
  execute(cmd: CreateFeature): Command | null {
    const featureId = state.addFeature(cmd.feature);
    return DeleteFeature.create({ featureIds: [featureId] });
  }
}
```

#### Step 2.5: Deep Link Serialization
Use the `deeplink/` derived state proto (12 messages) to serialize state to URL hash:
```
#/?camera=40.7484,-73.9857,1000,45,30,0&layers=b3d,cld&search="empire state"
```

### Estimated Effort: **M for MVP (2-3 weeks), XL for full (6-8 weeks)**

MVP scope (14 commands, basic state) is 2-3 weeks. Full scope (34 commands, undo/redo, deep links, 40 state slices) is 6-8 weeks.

---

## Phase 3: Content Creation (Features, KML, Documents)

### What the Protos Give Us

| Proto File | Key Definitions |
|---|---|
| `geo/earth/proto/contentcreation/content_editing_model.proto` | 113 messages: `Feature`, `Placemark`, `Geometry` (Point/Polyline/Polygon), `Style` (Icon/Line/Poly/Balloon/Label), `ThreeDAsset`, `Model`, `EarthDataLayer`, 6 altitude modes, 9 feature types |
| `geo/earth/proto/contentcreation/content_editing_mutations.proto` | 13 atomic mutation types: AddFeature, DeleteFeature, UpdateFeatureProperties, SetStyle, etc. |
| `geo/earth/proto/contentcreation/content_editing_requests.proto` | 62 messages: full gRPC CRUD for documents, features, assets |
| `geo/earth/proto/contentcreation/content_editing_kml_extensions.proto` | KML bridge: cascading styles, style maps, materialized layers |
| `geo/earth/proto/contentcreation/data_import_errors.proto` | 66 structured error types for import failures |
| `geostore/base/proto/feature.proto` | FeatureProto — universal container with 70 typed sub-message fields |

### What We Need to Build

1. **Feature CRUD** — create, read, update, delete placemarks, polylines, polygons
2. **KML parser** — import/export Google Earth KML with extensions
3. **Style editor** — icon, line, polygon, balloon, label styles
4. **Document store** — persist projects to database
5. **3D model placement** — ThreeDAsset orientation/scale/bounding box

### Technology Choices

| Choice | Rationale |
|---|---|
| **PostgreSQL + PostGIS** | Best open-source geospatial DB; supports S2 cell indexing via extension, 3D geometries, mature ecosystem |
| **SpatiaLite** (local) | For offline/desktop mode; SQLite with spatial — zero-config, embeddable in browser via sql.js |
| **@tmcw/togeojson** | KML→GeoJSON converter (npm library) |
| **tokml** | GeoJSON→KML converter |
| **IndexedDB** (browser) | Local document cache for offline editing; Dexie.js as wrapper |

**Database Mapping — `content_editing_model.proto` → SQL:**

```sql
-- Feature to PostgreSQL
CREATE TABLE features (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  parent_id       UUID REFERENCES features(id),
  feature_type    feature_type_enum NOT NULL,       -- Placemark, Folder, Polygon, etc.
  name            TEXT,
  description     TEXT,
  visibility      BOOLEAN DEFAULT true,
  sort_index      INTEGER DEFAULT 0,
  feature_origin  feature_origin_enum DEFAULT 'USER', -- User or Gemini AI

  -- Geometry (PostGIS)
  geom            GEOMETRY(Geometry, 4326),          -- Point/Polyline/Polygon/Multi

  -- Altitude
  altitude_mode   altitude_mode_enum DEFAULT 'CLAMP_TO_GROUND',
  altitude        DOUBLE PRECISION,

  -- Camera (for Placemarks)
  camera_type     camera_type_enum,                  -- LookAt or LookFrom
  camera_lat      DOUBLE PRECISION,
  camera_lng      DOUBLE PRECISION,
  camera_alt      DOUBLE PRECISION,
  camera_heading  DOUBLE PRECISION,
  camera_tilt     DOUBLE PRECISION,
  camera_roll     DOUBLE PRECISION,
  camera_range    DOUBLE PRECISION,
  camera_fovy     DOUBLE PRECISION,

  -- Style (JSON blob for flexibility)
  style_data      JSONB,                             -- Full ContentStyle serialized

  -- 3D model
  model_asset_id  UUID REFERENCES assets(id),
  model_scale_x   DOUBLE PRECISION DEFAULT 1,
  model_scale_y   DOUBLE PRECISION DEFAULT 1,
  model_scale_z   DOUBLE PRECISION DEFAULT 1,

  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  -- S2 cell indexing
  s2_cell_id      BIGINT                             -- For spatial locality
);

CREATE INDEX idx_features_geom ON features USING GIST (geom);
CREATE INDEX idx_features_s2 ON features (s2_cell_id);
CREATE INDEX idx_features_document ON features (document_id);
```

**S2 vs GeoHash vs H3 for spatial indexing:**
- S2 is what Google uses (native in FeatureIdProto)
- S2 has better properties for spherical earth (equal area, no singularities at poles)
- Use `s2-geometry` npm package for JS or PostGIS `s2` extension

### Step-by-Step Implementation

#### Step 3.1: Feature CRUD API
```typescript
// Backend: Express/Fastify + PostGIS
POST   /api/documents/:docId/features          → CreateFeature
GET    /api/documents/:docId/features           → ListFeatures
GET    /api/documents/:docId/features/:featId   → GetFeature
PATCH  /api/documents/:docId/features/:featId   → UpdateFeature
DELETE /api/documents/:docId/features/:featId   → DeleteFeature
```

#### Step 3.2: KML Parser
```typescript
import { kml } from '@tmcw/togeojson';

function parseKml(kmlString: string): Feature[] {
  const dom = new DOMParser().parseFromString(kmlString, 'text/xml');
  const geojson = kml(dom);  // Convert to GeoJSON
  return geojsonToProtoFeatures(geojson);  // Map to content_editing_model.proto types
}
```

Handle Google Earth KML extensions (gx:Tour, gx:Track, gx:TimeSpan, gx:TimeStamp) via custom parser logic.

#### Step 3.3: Feature Rendering on Globe
```typescript
// Map content_editing_model Feature to Cesium Entity
function featureToCesiumEntity(feature: Feature): Cesium.Entity {
  const entity: Cesium.Entity = {
    id: feature.id,
    name: feature.name,
    position: pointToCartesian(feature.geometry),
    // Style mapping
    point: feature.style?.pointStyle ? pointStyleToCesium(feature.style.pointStyle) : undefined,
    polyline: feature.style?.polylineStyle ? polylineStyleToCesium(feature.style.polylineStyle) : undefined,
    polygon: feature.style?.polygonStyle ? polygonStyleToCesium(feature.style.polygonStyle) : undefined,
    // Balloon (info window)
    description: feature.style?.balloonStyle?.htmlContent,
  };
  return entity;
}
```

#### Step 3.4: Style Editor
Build a property editor panel that maps every `ContentStyle` sub-field to form controls:
- `PointStyle` → icon picker (stock icons, custom uploads, text overlay)
- `PolylineStyle` → color picker, width slider, occlusion toggle
- `PolygonStyle` → fill color, border color/width, surface flattening
- `BalloonStyle` → HTML template editor, display mode selector
- `LabelStyle` → font, size, color

#### Step 3.5: Document Store
```sql
CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  namespace       document_namespace_enum DEFAULT 'EARTH',
  title           TEXT NOT NULL,
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  owner_id        TEXT,                              -- OAuth user ID
  is_public       BOOLEAN DEFAULT false,
  metadata        JSONB                              -- DocumentMetadata proto
);
```

### Estimated Effort: **XL (8-12 weeks)**

- Weeks 1-2: Database schema, basic CRUD API
- Weeks 3-4: KML import/export, Cesium entity mapping
- Weeks 5-6: Full style editor (6 style types), property panel
- Weeks 7-8: Cloud document store, mutations, conflict resolution
- Weeks 9-10: 3D model import (GLTF), placement tools
- Weeks 11-12: EarthDataLayer support, CSV/GeoJSON import

---

## Phase 4: Maps Integration (Directions, Transit, Traffic)

### What the Protos Give Us

| Domain | Path | Key Definitions |
|---|---|---|
| Directions | `maps/directions/` (16 files) | 35 client types, 47 contexts, routing customization, tolls, MRP affordances |
| Pathfinder | `maps/pathfinder/` (31 files) | Path search I/O, CRP routing data model, alternates, autonomous driving |
| Transit | `maps/transit/` (11 files) | Vehicle preferences, fares, cost models (50+ penalty categories), booking links |
| Road Traffic | `maps/roadtraffic/` (9 files) | TRAFFIC2VEC ML model types, incident metadata, path encoding, disruptions |
| Tactile API | `maps/tactile/` (190 files) | Full Maps frontend API: directions, entities, search, hotels, transit, EV |
| GeoStore Road | `geostore/base/proto/segment.proto` | 15+ enums, 200+ attributes (speed, surface, elevation, priority, bicycle, pedestrian) |
| GeoStore Lane | `geostore/base/proto/lane.proto` | 20+ lane types, HD lane connections, flow lines, bounding markers |
| GeoStore Restriction | `geostore/base/proto/restriction.proto` | 20+ restriction types, time scheduling, vehicle filters |

### What We Need to Build

1. **Routing engine** — calculate routes between waypoints
2. **Transit routing** — multi-modal (bus, train, subway, ferry)
3. **Traffic overlay** — real-time and historical traffic visualization
4. **Directions UI** — step-by-step turn instructions
5. **Toll calculation** — region-specific toll passes and pricing

### Technology Choices

| Need | Option | Rationale |
|---|---|---|
| **Routing engine** | **OSRM** (Open Source Routing Machine) | Fastest open-source router; C++ engine, Node.js bindings; uses OSM data; excellent car/bike/foot profiles |
| **Routing engine (alt)** | **GraphHopper** | Java-based, more flexible profiles, truck routing, matrix API; slightly slower than OSRM |
| **Transit routing** | **OpenTripPlanner** (OTP) | Best open-source transit router; GTFS ingestion, multi-modal; used by TriMet, NYC MTA |
| **Transit data** | **Transitland** (transit.land) | Aggregated GTFS feeds; API and bulk download |
| **Traffic data** | **TomTom/Here API** | Commercial; OSRM has basic traffic support with live traffic data; self-hosted = OpenTraffic + Valhalla |
| **Map data** | **OpenStreetMap** | The universal source. Download planet extracts from GeoFabrik (per-region) or use full planet (~70GB PBF) |
| **Tile server** | **MapTiler** / self-hosted | For road map tiles to display on top of the globe |

**Recommended stack for MVP routing:**
- OSRM (car/bike/foot routing) + OpenTripPlanner (transit)
- OSM data loaded from GeoFabrik regional extract
- Simple traffic proxy using TomTom Traffic API (cheaper than Google)

### Proto-to-API Mapping

```
Tactile Directions Request → OSRM RouteRequest
  waypoints                   → coordinates[]
  travelMode (DRIVE/WALK/BIKE/TRANSIT) → profile
  avoidTolls, avoidHighways   → exclude flags
  departureTime               → departure datetime (for transit/traffic)

Pathfinder FindPathInput → OSRM TableRequest
  origins, destinations       → sources[], destinations[]
  costModelPreferences        → weight factors in Lua profile

Transit preferredVehicleType  → OTP mode filters (BUS, RAIL, SUBWAY, FERRY, TRAM)

Traffic SegmentProto attributes → post-processed route with traffic speeds
```

### Step-by-Step Implementation

#### Step 4.1: Deploy OSRM
```bash
# Download OSM data
wget https://download.geofabrik.de/north-america/us-northeast-latest.osm.pbf

# Build OSRM graph
docker run -v $(pwd):/data osrm/osrm-backend osrm-extract -p /opt/car.lua /data/region.osm.pbf
docker run -v $(pwd):/data osrm/osrm-backend osrm-partition /data/region.osrm
docker run -v $(pwd):/data osrm/osrm-backend osrm-customize /data/region.osrm

# Run
docker run -p 5000:5000 -v $(pwd):/data osrm/osrm-backend osrm-routed --algorithm mld /data/region.osrm
```

#### Step 4.2: Build Directions API Adapter
```typescript
// Map Tactile proto to OSRM API
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

#### Step 4.3: Deploy OpenTripPlanner
```bash
# Download GTFS feeds for region
# Build OTP graph with OSM + GTFS
java -Xmx8G -jar otp-2.5.0-shaded.jar --build --save /data/graphs/nyc /data/nyc.osm.pbf /data/nyc-gtfs.zip

# Run
java -Xmx4G -jar otp-2.5.0-shaded.jar --load /data/graphs/nyc --port 8080
```

#### Step 4.4: Traffic Overlay
For MVP: Use TomTom Traffic API to fetch live traffic flow tiles, overlay as a Cesium `ImageryLayer` with transparency.

For full scope: Ingest OSM road segments into PostGIS, join with TomTom/Here traffic speeds, render as colored polylines using `PolylineGlowMaterialProperty` or a custom shader.

#### Step 4.5: Route Visualization on Globe
```typescript
function renderRoute(route: Route): void {
  const positions = route.geometry.coordinates.map(c => Cesium.Cartesian3.fromDegrees(c[0], c[1]));
  viewer.entities.add({
    polyline: {
      positions,
      width: 5,
      material: new Cesium.PolylineGlowMaterialProperty({ glowPower: 0.25, color: Cesium.Color.DODGERBLUE }),
    },
    // Add waypoint markers, turn indicators
  });
}
```

### Estimated Effort: **XL (10-14 weeks)**

- Weeks 1-2: OSRM deployment, OSM data pipeline
- Weeks 3-4: Directions API adapter, route rendering
- Weeks 5-6: Transit (OTP deployment, GTFS ingestion, transit proto mapping)
- Weeks 7-8: Traffic data integration, live overlay
- Weeks 9-10: Toll calculation, MRP alternates, vehicle-specific routing
- Weeks 11-12: EV routing, lane-level detail
- Weeks 13-14: Performance, caching, planet-scale OSM ingestion

**Note:** This phase is the most infrastructure-heavy. Standing up reliable routing at scale is a dedicated project. For MVP, defer entirely — the globe viewer works without routing.

---

## Phase 5: Design Tools (Solar, Buildings, Analysis)

### What the Protos Give Us

| Proto File | Key Definitions |
|---|---|
| `google/internal/earth/v1/builtenv/solar_run_inputs.proto` | Solar PV design inputs, panel placement, irradiance calculation parameters |
| `google/internal/earth/v1/builtenv/building_configuration.proto` | Building FAR (Floor Area Ratio), height, setback, template config |
| `google/internal/earth/v1/builtenv/built_entity.proto` | Built entity model — building/parking lot/park with metrics |
| `google/internal/earth/v1/builtenv/new_build_metrics.proto` | FAR, GFA (Gross Floor Area), lot coverage, unit counts |
| `google/internal/earth/v1/builtenv/metrics.proto` | Energy, carbon, water, cost metrics |
| `google/internal/earth/v1/builtenv/raster.proto` | Raster analysis primitives (elevation, solar irradiance) |
| `geo/earth/app/cpp/core/protos/design_manager.proto` | Design generation pipeline |
| `geo/earth/app/cpp/core/protos/building_templates.proto` | Pre-configured building layout templates |
| `geo/earth/app/cpp/core/protos/site_selection.proto` | Site selection with area limits per plan tier |
| `geo/earth/app/cpp/core/protos/units.proto` | Unit systems (metric/imperial) for measurement display |

### What We Need to Build

1. **Solar irradiance calculator** — annual/monthly kWh/m² for any rooftop
2. **3D building editor** — extrude footprints, adjust FAR, place on terrain
3. **Terrain analysis** — slope, aspect, contour generation, cut-and-fill
4. **Site selection** — area constraints per billing plan tier
5. **Change detection** — compare imagery between two dates

### Technology Choices

| Tool | Purpose | Rationale |
|---|---|---|
| **SunCalc** (JS) | Solar position at any time/location | Simple, accurate enough for PV estimates |
| **PVLib Python** (via API) | Solar irradiance on tilted surfaces | Industry-standard from NREL; Python microservice with FastAPI |
| **Three.js raycasting** (in Cesium) | Shadow analysis on 3D buildings | Cesium uses Three.js-style rendering; can compute shadows via GPU |
| **GDAL** (via Python) | Raster analysis: slope, aspect, contours | The standard; callable via subprocess or Python API |
| **Turf.js** | Geospatial analysis (buffer, intersect, area) | In-browser computation, works with GeoJSON |
| **Deck.GL + Cesium** | 3D building editing overlays | Deck.GL layers integrate with Cesium for editing primitives |

### Proto-to-Implementation Mapping

```
SolarRunInputs:
  rooftop_polygon        → Turf.js polygon area + SunCalc solar position
  panel_type             → lookup panel specs (watts, dimensions)
  tilt_angle             → PVLib transposition model
  azimuth                → derived from rooftop orientation
  Output: kWh/year       → simple model: area × efficiency × irradiance × 0.75 (derating)

BuildingConfiguration:
  FAR (Floor Area Ratio) → building_height = FAR × lot_area / floor_area_per_story
  height_limit           → clamp building height
  setback                → offset footprint inward by setback distance
  Output: 3D extruded building mesh

ViewOnDemandAnalysis:
  SLOPE                  → GDAL gdaldem slope on DEM
  ASPECT                 → GDAL gdaldem aspect
  CONTOUR                → GDAL gdal_contour
  CUT_AND_FILL           → subtract two DEMs, compute volume
  CHANGE_DETECTION       → NDVI diff between two satellite image dates
```

### Step-by-Step Implementation

#### Step 5.1: Solar Calculator Microservice
```python
# FastAPI service wrapping PVLib
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

#### Step 5.2: 3D Building Editor
```typescript
// In Cesium, extrude a building from a footprint
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

#### Step 5.3: Terrain Analysis — Contour Generation
```bash
# GDAL contour from elevation raster
gdal_contour -a elevation -i 10.0 input_dem.tif output_contours.geojson
```
Render contours as polylines on the Cesium globe, color-coded by elevation.

#### Step 5.4: Cut-and-Fill Calculation
```python
def cut_fill(existing_dem: np.ndarray, proposed_dem: np.ndarray, pixel_area_m2: float):
    diff = proposed_dem - existing_dem
    cut_volume = np.sum(diff[diff < 0]) * pixel_area_m2 * -1  # material to remove
    fill_volume = np.sum(diff[diff > 0]) * pixel_area_m2       # material to add
    return {'cut_m3': cut_volume, 'fill_m3': fill_volume, 'net_m3': fill_volume - cut_volume}
```

#### Step 5.5: Change Detection
Use Sentinel-2 imagery (free via Copernicus) for NDVI change detection:
```python
def ndvi_diff(before_red, before_nir, after_red, after_nir):
    ndvi_before = (before_nir - before_red) / (before_nir + before_red)
    ndvi_after = (after_nir - after_red) / (after_nir + after_red)
    return ndvi_after - ndvi_before
```

### Estimated Effort: **XL (10-14 weeks)**

- Weeks 1-3: Solar calculator, PVLib integration, irradiance UI
- Weeks 4-6: 3D building editor (extrude, FAR, templates, shadow viz)
- Weeks 7-9: Terrain analysis pipeline (GDAL, contours, slope/aspect)
- Weeks 10-12: Cut-and-fill, change detection, site selection
- Weeks 13-14: Integration, performance, GPU compute for analysis

---

## Phase 6: AI Assistant (Earth Mate)

### What the Protos Give Us

| Proto File | Key Definitions |
|---|---|
| `geo/earth/proto/earth_mate/earth_mate_request.proto` | 14 messages: multi-turn chat, document/feature context, image queries, overhead imagery, industry targeting |
| `geo/earth/proto/earth_mate/earth_mate_response.proto` | 5 messages: chat response, executable `Commands` (34 types), attributions, error handling |
| `geo/earth/proto/earth_mate/earth_mate_attribution.proto` | Source attribution for AI content |
| `geo/earth/proto/earth_mate/streaming.proto` | Server-sent streaming for real-time AI responses |
| `geo/earth/proto/earth_mate/file_attachment.proto` | File/image upload in chat |
| `google/internal/earth/v1/layers.proto` | `GeminiGeneratedLayer` — AI-created data layers with CNS path |

### What We Need to Build

1. **LLM integration** with function/tool calling
2. **Chat interface** with geo context (camera position, visible features)
3. **Prompt engineering** for structured `Commands` output
4. **Streaming** responses (server-sent events)
5. **File upload** for image analysis
6. **AI-generated layers** (vector data from LLM)

### Technology Choices

| Choice | Rationale |
|---|---|
| **OpenAI GPT-4o** | Best function calling, vision capabilities for image analysis, 128K context; cost ~$5-15/MTok |
| **Anthropic Claude 3.5 Sonnet** (alt) | Better structured output, longer context (200K); no native vision in API yet |
| **Open-source LLM** (alt) | **Mistral Large 2** or **Llama 3.1 70B** via Groq for speed or self-hosted via vLLM; function calling is less reliable |
| **LangChain.js** or **Vercel AI SDK** | LLM orchestration, tool calling, streaming; Vercel AI SDK is simpler for web |
| **Server-Sent Events** (SSE) | Streaming chat responses (matches proto `streaming.proto`) |

**Recommendation:** Start with OpenAI GPT-4o for best tool-calling quality. Add Claude as fallback. Reserve open-source for cost optimization later.

### Proto-to-LLM Mapping

```
EarthMateRequest              → OpenAI Chat Completion
  messages[] (role + content) → messages[] (system/user/assistant)
  document_context             → injected as system prompt with document summary
  feature_context              → injected as system prompt with feature details
  camera_lat, camera_lng       → system: "User is looking at {lat}, {lng} at altitude {alt}m"
  industry                     → system: "Assistant specializes in {industry}"
  overhead_imagery             → vision-enabled model analyzes satellite image

EarthMateResponse             → OpenAI Response
  chat_response                → assistant message content
  commands[]                   → tool_calls[] mapped to function definitions
  attributions                 → extracted from tool call metadata
```

### Function Definitions for Tool Calling

Define 34 functions matching each `Commands` oneof case:
```typescript
const earthMateTools = [
  {
    name: 'fly_to_camera',
    description: 'Fly the camera to a specific location on Earth',
    parameters: {
      type: 'object',
      properties: {
        latitude: { type: 'number', description: 'Latitude in degrees' },
        longitude: { type: 'number', description: 'Longitude in degrees' },
        altitude: { type: 'number', description: 'Altitude in meters' },
        heading: { type: 'number', description: 'Camera heading 0-360°' },
        tilt: { type: 'number', description: 'Camera tilt 0-90°' },
        animation: { type: 'string', enum: ['TELEPORT', 'FLY'] },
      },
      required: ['latitude', 'longitude'],
    },
  },
  {
    name: 'perform_search',
    description: 'Search for places on Earth',
    parameters: { ... },
  },
  {
    name: 'create_placemark',
    description: 'Drop a pin or create a placemark at a location',
    parameters: { ... },
  },
  {
    name: 'toggle_layer',
    description: 'Show or hide map layers',
    parameters: {
      type: 'object',
      properties: {
        layer: { type: 'string', enum: ['3D_BUILDINGS', 'CLOUDS', 'GRIDLINES', 'PHOTOS'] },
        visible: { type: 'boolean' },
      },
    },
  },
  // ... 30 more tools
];
```

### Step-by-Step Implementation

#### Step 6.1: LLM Integration
```typescript
import { generateText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';

async function chatWithEarthMate(
  messages: ChatMessage[],
  context: EarthMateContext
): Promise<EarthMateResponse> {
  const systemPrompt = buildSystemPrompt(context); // camera, features, industry

  const result = await generateText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    tools: earthMateTools.reduce((acc, t) => ({ ...acc, [t.name]: tool(t) }), {}),
    maxSteps: 5, // allow multi-step tool calls
  });

  return {
    chatResponse: result.text,
    commands: result.toolCalls.map(tc => toolCallToCommand(tc)),
    // attributions from tool call metadata
  };
}
```

#### Step 6.2: System Prompt Template
```
You are Earth Mate, an AI assistant integrated into a 3D Earth globe viewer.

CURRENT VIEW:
- Camera position: {lat}, {lng}, altitude {alt}m
- Map style: {mapStyle} ({projection})
- Active layers: {layers}

DOCUMENT CONTEXT:
{docSummary}

FEATURE CONTEXT:
{features}

USER INDUSTRY: {industry}

You help users navigate Earth, create features, analyze places, and answer geo questions.
Always use tools to take actions (fly to, search, create features) rather than just describing.
```

#### Step 6.3: Streaming Chat UI
```typescript
// SSE endpoint for streaming
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

#### Step 6.4: Image Generation (OpenImageGenerator)
Use OpenAI DALL-E 3 or Stable Diffusion via Replicate:
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

#### Step 6.5: Gemini-Generated Layers
For the `GeminiGeneratedLayer` feature, use the LLM to generate GeoJSON from natural language:
```
User: "Show me all national parks in California"
→ LLM generates GeoJSON FeatureCollection with park boundaries
→ Rendered as a Cesium GeoJsonDataSource layer
```

### Estimated Effort: **L (6-8 weeks)**

- Weeks 1-2: OpenAI integration, system prompt, basic chat UI
- Weeks 3-4: All 34 tool definitions, tool call → command dispatch
- Weeks 5-6: Context assembly (camera, features, document), streaming, file upload
- Weeks 7-8: Image generation, Gemini layers, error handling, rate limiting

---

## Phase 7: Analytics & Logging

### What the Protos Give Us

| Proto File | Key Definitions |
|---|---|
| `logs/proto/geo/earth/app/earth_log.proto` | **89 event type categories**, 400+ discrete event values, 30+ sub-messages |
| `logs/proto/visual_element/` (14 files) | Universal click tracking, 55 user action types, UI tree grafting |
| `logs/proto/maps/directions/` (35 files) | Full routing request/response logging, MRP phases, A/B testing |
| `logs/proto/maps/mobile/` (3 files) | 50+ navigation session events, Gemini-in-nav |
| `logs/proto/maps/transit/` (21 files) | 7-mode connection logging, fare structures |
| `logs/eventid/eventid.proto` | Universal event IDs with μs timestamps |
| `logs/proto/logs_annotations/` | 36 identifier types for field-level PII classification |

### What We Need to Build

1. **Event collection pipeline** — capture 89 Earth event types
2. **Client-side event logger** — intercept all commands, state changes, UI interactions
3. **Event aggregation & storage** — time-series database
4. **Analytics dashboard** — visualize usage patterns
5. **Performance monitoring** — FPS, memory, load times

### Technology Choices

| Need | Self-Hosted | SaaS | Recommendation |
|---|---|---|---|
| **Event storage** | **ClickHouse** — columnar, real-time, handles billions of events; horizontal scaling | BigQuery, Snowflake | **ClickHouse** — free, absurdly fast for analytics workloads |
| **Dashboard** | **Grafana** + ClickHouse plugin | Mixpanel, Amplitude, PostHog | **Grafana** — open source; or **PostHog** (self-hosted) |
| **Client SDK** | Custom TypeScript logger | PostHog JS, RudderStack | Custom — proto types give us exact event schemas |
| **Performance** | browser Performance API + custom metrics | Sentry, Datadog RUM | **Sentry** for errors; custom for perf |

### Event Pipeline Architecture

```
Browser (Cesium + React)
  → CommandDispatcher.logCommand(cmd)
  → StateObserver.onStateChange(stateSlice)
  → VETracker.trackClick(VisualElementId)
      │
      ▼ (batch POST every 5s or on page unload)
Collector Service (FastAPI/Node.js)
  → Validate against proto schema
  → Enrich with server IP, timestamp, session
  → Publish to Kafka / direct insert
      │
      ▼
ClickHouse
  → earth_events table (partitioned by date, sorted by event_type)
  → ve_events table
  → performance_events table
      │
      ▼
Grafana Dashboard
  → DAU/MAU, feature usage, command distribution
  → Performance: P50/P95 FPS, load times, memory
  → Funnel analysis: search → knowledge card → fly-to
```

### Proto-to-ClickHouse Mapping

```sql
CREATE TABLE earth_events (
  event_id          String,           -- UUID v7 (time-sortable)
  event_time        DateTime64(3),    -- From EventIdMessage.time_usec
  session_id        String,
  user_id           String,
  event_type        LowCardinality(String),  -- EarthEvent.Type enum: 89 values
  event_value       UInt32,           -- Discrete event value (0-20000+)
  command_type      LowCardinality(String),  -- If triggered by a command
  state_before      String,           -- JSON of relevant state slice
  state_after       String,
  properties        JSON,             -- Event-specific sub-message as JSON
  client_ip         IPv6,
  user_agent        String,
  screen_width      UInt16,
  screen_height     UInt16,
  renderer          String,           -- WebGL/WebGPU renderer string
  fps               Float32,          -- For perf events
  memory_mb         Float32,
  load_time_ms      Float32,
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (event_type, event_time)
TTL event_time + INTERVAL 90 DAY;
```

### Step-by-Step Implementation

#### Step 7.1: Client-Side Event Logger
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

#### Step 7.2: Collector Service
```python
@app.post("/api/events")
async def collect_events(events: list[EarthEvent]):
    # Validate, enrich, insert
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

#### Step 7.3: Visual Element Tracking
Implement click/interaction tracking matching the `visual_element_lite.proto` schema:
```typescript
// Attach to all UI elements via React's onClick
function VeTracker({ elementId, elementType, children }) {
  const handleClick = (e) => {
    earthEventLogger.logVEClick({
      elementId,
      elementType,       // BUTTON, TAB, CARD, MENU_ITEM, etc.
      actionType: 'CLICK',  // 55 action types from proto
      timestamp: Date.now() * 1000,
    });
  };
  return <div onClick={handleClick}>{children}</div>;
}
```

#### Step 7.4: Grafana Dashboard
Create dashboards for:
1. **Executive:** DAU, MAU, retention, session duration
2. **Feature usage:** Command distribution pie chart, layer toggle frequency
3. **Performance:** P50/P95/P99 FPS by device, memory usage, load time histogram
4. **Errors:** Crash rate, WebGL errors, API error rate
5. **Earth Mate:** Chat sessions, thumbs up/down ratio, command execution rate

### Estimated Effort: **M (3-4 weeks)**

- Week 1: ClickHouse setup, event schema, collector service
- Week 2: Client-side logger, command/state/VE tracking
- Week 3: Grafana dashboards, performance monitoring
- Week 4: PII redaction, data retention policies, alerting

---

## Phase 8: Build & Deploy

### What the Protos Give Us

| Proto File | Key Definitions |
|---|---|
| `geo/earth/proto/compile_time_config.proto` | Compile-time config baked into builds |
| `geo/earth/proto/bootstrap_client_config.proto` | Initial client config before full config fetch |
| `google/internal/earth/v1/client_config.proto` | Runtime feature config (234 flags), service endpoints, plan limits |
| `google/internal/earth/v1/feature_flags.proto` | Experiment/feature flag remote delivery |

### What We Need to Build

1. **Proto compilation pipeline** — CI/CD that rebuilds TypeScript SDK on proto changes
2. **WebAssembly compilation** — C++ globe core → WASM (optional, for performance)
3. **CI/CD** — lint, test, build, deploy
4. **Deployment** — CDN for static frontend, Docker/containers for backend services
5. **Feature flag system** — server-controlled feature gates

### Technology Choices

| Need | Choice | Rationale |
|---|---|---|
| **CI/CD** | **GitHub Actions** | Free for public repos, 2000 min/month, easy Docker/matrix builds |
| **Frontend hosting** | **Cloudflare Pages** or **Vercel** | Free tier, global CDN, instant cache invalidation, HTTP/3 |
| **Backend hosting** | **Fly.io** or **Railway** | Simple Docker deployment, auto-scaling, PostgreSQL included |
| **Container registry** | **GitHub Container Registry** (ghcr.io) | Free, integrated with Actions |
| **Feature flags** | **LaunchDarkly** (free tier) or **Unleash** (self-hosted) | Unleash is open source, matches 234-flag proto model |
| **WASM compilation** | **Emscripten 3.1+** | Standard C++→WASM toolchain; compiles protobuf C++ runtime to WASM |
| **Monorepo** | **Turborepo** or **Nx** | Coordinate builds across frontend, backend, proto packages |

### Build Pipeline

```
[Proto Changes]
     │
     ▼
buf lint → buf breaking → buf generate (TypeScript + Go + Python)
     │
     ├──→ frontend/ (TypeScript SDK) ──→ Vite build ──→ CDN
     ├──→ backend/  (Go gRPC stubs)  ──→ Docker build ──→ Container Registry
     └──→ wasm/     (C++ protos)     ──→ Emscripten compile ──→ npm package
```

### WASM Compilation (Optional but Valuable)

For performance-critical paths (tile decoding, geometry processing, spatial indexing):

```dockerfile
# Dockerfile.wasm
FROM emscripten/emsdk:3.1.50

RUN apt-get update && apt-get install -y protobuf-compiler

# Compile protos to C++
RUN protoc --cpp_out=gen/cpp $(find proto/ -name "*.proto")

# Compile C++ to WASM
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

Use cases for WASM:
- **Protobuf decode** — faster than JS protobuf-ts for large message batches
- **S2 geometry** — spatial indexing in WASM (Google's S2 library is C++)
- **Tile decoding** — decompress and parse vector tile format
- **Terrain processing** — elevation queries, raycasting

### Step-by-Step Implementation

#### Step 8.1: Proto CI Pipeline
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

#### Step 8.2: Frontend Build & Deploy
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

#### Step 8.3: Backend Deploy
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

#### Step 8.4: Feature Flag System
```typescript
// Client-side feature flag evaluation
const flags = await fetchConfig().then(c => c.featureFlags);

if (flags.PHOTOS_LAYER_ENABLED) {
  enablePhotosLayer();
}
if (flags.EARTH_MATE_PERSISTENT_VISION_CONTEXT_ENABLED) {
  enableVisionContext();
}
```

Use **Unleash** (self-hosted) to manage 234 feature flags:
```yaml
# docker-compose.yml
services:
  unleash:
    image: unleashorg/unleash-server:latest
    ports: ['4242:4242']
    environment:
      DATABASE_URL: postgres://unleash:password@postgres:5432/unleash
```

### Deployment Topology

```
                           ┌──────────────────┐
     Users ───────────────▶│ Cloudflare CDN    │
                           │ (static frontend) │
                           └──────┬───────────┘
                                  │ API calls
                           ┌──────▼───────────┐
                           │ Fly.io / Railway  │
                           │ ┌──────────────┐ │
                           │ │ API Gateway   │ │  (Fastify / Express)
                           │ ├──────────────┤ │
                           │ │ Auth Service  │ │  (OAuth 2.0 + JWT)
                           │ ├──────────────┤ │
                           │ │ Feature CRUD  │ │  → PostgreSQL + PostGIS
                           │ ├──────────────┤ │
                           │ │ Search Proxy  │ │  → Nominatim / Photon
                           │ ├──────────────┤ │
                           │ │ Solar Service │ │  → PVLib (Python)
                           │ ├──────────────┤ │
                           │ │ Earth Mate    │ │  → OpenAI API
                           │ ├──────────────┤ │
                           │ │ Event Logger  │ │  → ClickHouse
                           │ ├──────────────┤ │
                           │ │ OSRM Router   │ │  (separate container)
                           │ └──────────────┘ │
                           └──────────────────┘
```

### Estimated Effort: **M (3-4 weeks)**

- Week 1: Proto CI/CD pipeline, buf integration, TypeScript codegen automation
- Week 2: Frontend CDN deploy, backend Docker setup, container registry
- Week 3: Feature flags (Unleash), WASM compilation pipeline
- Week 4: Multi-environment (dev/staging/prod), monitoring, SSL, secrets management

---

## Dependency Map

```
Phase 0 (Proto Foundation) ──────────────────────────────────────────────┐
    │                                                                     │
    ├── Phase 1 (3D Globe) ◄── Phase 0 types                              │
    │       │                                                             │
    │       ├── Phase 2 (Commands) ◄── Phase 1 camera + Phase 0 commands  │
    │       │       │                                                     │
    │       │       ├── Phase 3 (Content) ◄── Phase 2 state + Phase 0 model│
    │       │       │       │                                             │
    │       │       │       ├── Phase 4 (Maps) ◄── Phase 1 globe + Ph 0 maps│
    │       │       │       │       │                                     │
    │       │       │       │       ├── Phase 5 (Design) ◄── Phase 3 features│
    │       │       │       │       │       │                             │
    │       │       │       │       │       ├── Phase 6 (AI) ◄── Phase 2 cmd│
    │       │       │       │       │       │       │                     │
    │       │       │       │       │       │       ├── Phase 7 (Analytics)│
    │       │       │       │       │       │       │       │             │
    │       │       │       │       │       │       │       └── Phase 8 (Deploy)
    │       │       │       │       │       │       │                     │
    └───────┴───────┴───────┴───────┴───────┴───────┴─────────────────────┘
    All phases depend on Phase 0 generated types.
```

**Parallelization opportunities:**
- Phase 1 + Phase 2 can overlap (camera + command dispatch are interdependent but both UI-side)
- Phase 4 can start immediately after Phase 0 (maps domain is independent of Earth core)
- Phase 7 can start as soon as Phase 2 command dispatch exists (logging hooks into commands)
- Phase 6 needs Phase 2 (command execution) but can develop in parallel with mock commands
- Phase 8 is a continuous process starting from day 1 (CI/CD should exist before code)

---

## Summary: Total Estimated Effort

| Phase | MVP Scope | Full Scope | Team Size |
|---|---|---|---|
| 0: Proto Foundation | **M** (2-3 weeks) | M (2-3 weeks) | 1 backend |
| 1: 3D Globe Rendering | **L** (4-6 weeks) | L (4-6 weeks) | 1-2 frontend |
| 2: Command System | **M** (2-3 weeks) | XL (6-8 weeks) | 1-2 frontend |
| 3: Content Creation | **S** (1-2 weeks, KML only) | XL (8-12 weeks) | 1 frontend + 1 backend |
| 4: Maps Integration | — | XL (10-14 weeks) | 2 backend + 1 frontend |
| 5: Design Tools | — | XL (10-14 weeks) | 1 backend + 1 frontend |
| 6: AI Assistant | — | L (6-8 weeks) | 1 backend + 1 frontend |
| 7: Analytics | **S** (1 week, basic) | M (3-4 weeks) | 1 backend |
| 8: Build & Deploy | **S** (1 week, basic) | M (3-4 weeks) | 1 DevOps |

| | MVP | Full Scope |
|---|---|---|
| **Total calendar time** | **10-16 weeks** (2 engineers) | **12-18 months** (6-8 engineers) |
| **Total person-weeks** | ~18-28 person-weeks | ~52-73 person-weeks |

### MVP Deliverable

A browser-based 3D globe viewer with:
- Satellite + terrain + 3D buildings (CesiumJS)
- Camera navigation (zoom, pan, tilt, fly-to with LookAt/LookFrom)
- Search for places + knowledge cards
- Drop placemarks + KML import
- Layer toggling (buildings, clouds, gridlines)
- Basic command system with undo/redo
- Minimal analytics (page views, commands)

**This is Google Earth (viewer), not Google Earth Studio (editor).** It's a working 3D globe you can navigate and annotate. That's the right MVP — prove the proto-to-renderer pipeline works, then layer on editing, routing, design, and AI in subsequent iterations.

---

> **Next step:** Start Phase 0. Set up the proto compilation pipeline. Without compilable types, nothing else works.
