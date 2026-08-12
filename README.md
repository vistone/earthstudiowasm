# Earth Studio WASM — Protocol Buffer Definitions

> **Google Earth Studio (WebAssembly port) — Pure Protocol Buffer schema repository**

---

## Overview

This repository contains **1,316 Protocol Buffer (`.proto`) definition files** that define the complete data model, API contracts, event logging schemas, and storage formats for **Google Earth Studio** and its related geo/mapping ecosystem. Despite the `earthstudiowasm` name, this is **not** the Earth Studio WebAssembly binary or source code — it is exclusively the **shared protobuf schema layer** used by both the native C++ Earth Studio client and its WebAssembly-compiled counterpart.

### Key Statistics

| Metric | Value |
|---|---|
| Total `.proto` files | **1,316** |
| Proto2 syntax | 799 (60.7%) |
| Editions syntax | 462 (35.1%) |
| Proto3 syntax | 55 (4.2%) |
| Top-level domains | **38** |
| Deepest nesting | 8 levels (`geo/earth/app/cpp/core/state/...`) |

---

## Repository Structure

```
earthstudiowasm/
├── geo/               (411 files)  — Core Google Earth & Geo domain
├── maps/              (344 files)  — Google Maps ecosystem
├── logs/              (181 files)  — Event logging & analytics schemas
├── geostore/          (162 files)  — Geo data storage & feature modeling
├── google/            (72 files)   — Google standard protos & internal APIs
├── java/              (20 files)   — Java-specific protobuf extensions (JSPB)
├── gws/               (15 files)   — Google Web Server (Mothership API)
├── knowledge/         (11 files)   — Knowledge Graph data model
├── storage/           (9 files)    — Storage layer (Datapol, GoogleSQL, Graph)
├── travel/            (8 files)    — Travel domain (hotels, transport, guides)
├── search/            (8 files)    — Search (context generation, logging, rendering)
├── privacy/           (8 files)    — Privacy & data governance annotations
├── monitoring/        (8 files)    — Streamz monitoring infrastructure
├── net/               (7 files)    — Networking (proto2 bridge, load shedding)
├── cityblock/         (6 files)    — Street-level imagery (StreetSmart, Pose)
├── photos/            (5 files)    — Photos serving (FIFE)
├── third_party/       (5 files)    — Third-party integrations
├── util/              (4 files)    — Utilities (geometry, task status)
├── wireless/          (3 files)    — Android wireless (GSA, privacy)
├── webserver/         (3 files)    — Web server (GWS experiments)
├── ads/               (3 files)    — Ads (travel/hotel)
├── video/             (2 files)    — YouTube integration
├── searchbox/         (2 files)    — Searchbox (AIM)
├── location/          (2 files)    — Location utilities
├── frameworks/        (2 files)    — Framework (client data, RPC replay)
├── devtools/          (2 files)    — Developer tools (ProtoShop, static analysis)
├── identity/          (1 file)     — Identity/identifier
├── i18n/              (1 file)     — Localization
├── experiments/       (1 file)     — Experiment framework (Heterodyne)
├── apps/              (1 file)     — App framework
├── testing/           (1 file)     — MetricStore
├── stats/             (1 file)     — Statistics I/O
├── security/          (1 file)     — LOAS/L2 secure wrapper
├── repository/        (1 file)     — DocChart extraction
├── quality/           (1 file)     — RankLab
├── metaweb/           (1 file)     — MetaWeb topic table
├── localsearch/       (1 file)     — Local search (Lite)
├── lens/              (1 file)     — Lens analytics privacy
└── webutil/           (1 file)     — Web HTML types
```

---

## Domain Breakdown

### 1. `geo/` — Google Earth Core (411 files)

The largest domain, representing the heart of Google Earth Studio. Organized into 16 subdomains:

| Subdomain | Description |
|---|---|
| `geo/earth/` | **Primary Earth app** — C++ core + Studio presenters |
| `geo/earth/app/cpp/core/` | Core data model: documents, features, KML, design, layers, state management |
| `geo/earth/app/cpp/studio_presenters/` | Earth Studio UI: camera, property editor, base layer, settings, view status |
| `geo/earth/app/cpp/state/` | Application state (60+ state slices): search, layers, document, design, onboarding, etc. |
| `geo/earth/proto/` | Shared Earth protos: commands, geometry, map style, photos, content creation, error responses |
| `geo/ar/` | Augmented Reality — pose tracking |
| `geo/case/` | Map search — pin styles, refinements, search protos |
| `geo/contentflows/` | Content publishing — authors, moderation, publications |
| `geo/enterprise/` | Enterprise features |
| `geo/experience/` | User experience |
| `geo/globetrotter/` | Globe exploration |
| `geo/imagery/` | Satellite/aerial imagery metadata |
| `geo/mobrank/` | Mobile ranking |
| `geo/moderation/` | Content moderation |
| `geo/photo/` | Photo management |
| `geo/render/` | Rendering pipeline |
| `geo/search/` | Geo search |
| `geo/serving/` | Serving infrastructure |
| `geo/tasking/` | Task/workflow management |
| `geo/transportation/` | Transportation data |

#### Core Concepts (Earth Studio)

- **`Commands`** (`geo/earth/proto/commands.proto`): The primary user action model — 34 command types including search, fly-to-camera, create/edit/delete features, toggle layers, render designs, open Earth Mate chat, image generation, on-demand analysis (slope, aspect, cut-and-fill, contour).
- **`ContentEditingModel`** (`geo/earth/proto/contentcreation/content_editing_model.proto`): The complete feature/document editing model — 113 message types covering Feature, Placemark, Geometry (Point/Polyline/Polygon), Style (Icon/Polyline/Polygon/Balloon/Label), Earth data layers, color palettes, 3D assets, and classification layer inputs.
- **`MapStyle`** (`geo/earth/proto/mapstyle.proto`): Base map configuration — projection (Globe/Mercator), imagery type (Satellite/Roadmap/Terrain), 3D features, clouds, gridlines, layer toggles.
- **`Camera`** (`geo/earth/proto/geometry.proto`): Camera model supporting LookAt (target-based) and LookFrom (position-based) with latitude, longitude, altitude, heading, tilt, roll, FOV.
- **`RenderableEntity`** (`geo/earth/proto/renderable-entity.proto`): Knowledge card rendering — title, description, images, facts, open hours, website, address, phone, entity thumbnails.
- **`ErrorResponse`** (`geo/earth/proto/error_response.proto`): Standardized error handling with 9 error types (internal, not found, permission denied, invalid geometry, max layers, quota exceeded, data import, Earth Mate, data layer).

#### State Management (60+ state slices)

The application state is highly modular with individual proto files per UI feature:
- `search/`, `document/`, `designmanager/`, `earthmate/`, `homescreen/`, `layers/`, `streetview/`, `timemachine/`, `timelapse/`, `measuretool/`, `drawingtool/`, `propertyeditor/`, `onboarding/`, `spraypaint/`, `solardesigninput/`, `newbuilddesigninput/`, `buildingeditor/`, `siteselection/`, `feedback/`, `pinnedprojects/`, `usererrors/`, etc.

---

### 2. `maps/` — Google Maps Ecosystem (344 files)

Comprehensive Google Maps protobuf definitions covering the full Maps stack:

| Subdomain | Description |
|---|---|
| `maps/api/shared/paint/` | Map paint/rendering API |
| `maps/directions/` | Directions and routing — MRP (Multi-Route Planning), customization, tolls, tile rendering |
| `maps/roadtraffic/` | Traffic data — model types, disruptions, path traffic |
| `maps/transit/` | Public transit — API, trip finder, fare calculation |
| `maps/tactile/` | Tactile Maps rendering — directions, on-map, shared types (ads, automotive, EV, hotels, places, transit) |
| `maps/pathfinder/` | Route-finding engine — CRP (Customizable Route Planning), autonomous driving, replay |
| `maps/gmm/` | Google Mobile Maps — camera, webview API |
| `maps/indoor/` | Indoor mapping |
| `maps/limo/` | Ride services — response, service providers, fare breakdown |
| `maps/dynamicworld/` | Dynamic World environmental data |
| `maps/crisis/` | Crisis response maps |
| `maps/spotlight/` | Spotlight feature |
| `maps/paint/` | Map paint styling (legendary, styler) |
| `maps/versatile/` | Versatile map format |
| `maps/shared/` | Shared types — client, common/geom, mapcore API, labeler, testing |
| `maps/logs/` | Maps-specific logging |
| `maps/util/` | Maps utilities |

---

### 3. `logs/` — Event Logging & Analytics (181 files)

Production event logging schemas for analytics and monitoring:
- **`logs/proto/geo/earth/app/earth_log.proto`**: The primary Earth event log — 89 message types covering all user interactions (base layer changes, time controls, photo layers, crashes, share links, measure tools, suggestions, notifications, accessibility, search, document import, network requests, Earth Mate, billing, property editor, data catalog, etc.)
- **`logs/proto/visual_element/`**: UI element logging — place lists, hotel bookings, crisis info, clicks, user actions
- **`logs/proto/maps/`**: Maps-specific logging — directions MRP, transit, tactile, road traffic, pathfinder, indoor/limo
- **`logs/proto/geo/transportation/`**: Transportation analytics — trip logs, affordance vectors
- **`logs/proto/ads/`**: Ads logging — hotel pricing, annotations
- **`logs/proto/hotels/`**: Hotel feature data
- **`logs/proto/logs_annotations/`**: Log annotation framework

---

### 4. `geostore/` — Geo Data Storage (162 files)

The persistent storage layer for all geographic features:

| Subdomain | Description |
|---|---|
| `geostore/base/proto/` | Core geo types — FeatureId, address, polyline, intersection, route, elevation, speed limits, parking, restrictions, opening hours, price info, traffic flow, transit, signs, levels, CityJSON, doodle |
| `geostore/edit/` | Feature editing |
| `geostore/matching/` | Feature matching/linking |
| `geostore/ontology/` | Geo ontology — raw concept instances |
| `geostore/client/` | Client-side geostore (attachments) |
| `geostore/tools/` | Geostore tooling |

Key types:
- **`FeatureIdProto`**: S2 cell-based feature identification (cell_id + fingerprint)
- **`AddressProto`**: Structured addresses with components
- **`RouteProto`**: Road route definitions
- **`PolylineProto`**: Geographic polylines

---

### 5. `google/` — Google Standard & Internal APIs (72 files)

| Subdomain | Description |
|---|---|
| `google/protobuf/` | Standard well-known types: Any, Timestamp, Duration, Empty, FieldMask, Struct, Wrappers |
| `google/api/` | API infrastructure: annotations, HTTP, auth, auditing, client, field behavior, visibility, launch stage, media, policy |
| `google/type/` | Standard types: LatLng, Money, Color, Date, DateTime, DayOfWeek, PostalAddress, TimeOfDay |
| `google/rpc/` | RPC: Status, error extensions |
| `google/geo/type/` | Geo types: Viewport |
| `google/longrunning/` | Long-running operations |
| `google/internal/earth/v1/` | **Internal Earth APIs** (50 files) — billing/rate cards, built environment (buildings, blocks, parks, solar, metrics, raster), classification, client config, Earth Mate, feature flags, knowledge, layers, photos, quota, shared types, survey metadata, terrain, user/settings |
| `google/research/` | Research (GeoFM custom scoring, overhead imagery) |

This is the key integration layer that connects Earth Studio to Google's broader infrastructure.

---

### 6–38. Remaining Domains

| Domain | Files | Key Contents |
|---|---|---|
| `java/` | 20 | Java-specific protobuf (JSPB, ByteBuffer) |
| `gws/` | 15 | Google Web Server Mothership API (app, images, net, text) |
| `knowledge/` | 11 | Knowledge Graph (data governance, schema storage, protomesh, query understanding, crisis response) |
| `storage/` | 9 | Datapol semantic annotations, GoogleSQL, Graph/BFG |
| `travel/` | 8 | Hotels (HPS rank annotations), transport pricing, travel guide attractile |
| `search/` | 8 | Search context generation, logging propagation/redaction, XUIKit rendering |
| `privacy/` | 8 | Data governance attributes, ads user data enforcement, pattributes containers |
| `monitoring/` | 8 | Streamz monitoring |
| `net/` | 7 | Proto2 bridge (MessageSet, JS proto, HTTP, validator, output source markup), load shedding |
| `cityblock/` | 6 | StreetSmart imagery observation, pose (vehicle), collection types, NERF pano selection |
| `photos/` | 5 | FIFE serving, protobuff |
| `third_party/` | 5 | Boundary proxy proto compare, Redwood infrastructure, Java protobuf |
| `util/` | 4 | 2D geometry, proto_status task |
| `wireless/` | 3 | Android GSA dynamic updates, privacy annotations |
| `webserver/` | 3 | GWS experiments, Maps logging |
| `ads/` | 3 | Travel hotel amenities, hotel pricing deals |
| `video/` | 2 | YouTube EML parcel, annotations |
| `searchbox/` | 2 | Searchbox AIM |
| `location/` | 2 | Country-specific (Japan) |
| `frameworks/` | 2 | Client data annotations, RPC replay field options |
| `devtools/` | 2 | ProtoShop parsing options, static analysis proto best practices |
| Others | 1 each | identity, i18n, experiments, apps, testing, stats, security, repository, quality, metaweb, localsearch, lens, webutil |

---

## Technical Characteristics

### Protobuf Syntax Versions

| Syntax | Count | Notes |
|---|---|---|
| `proto2` | 799 | The dominant syntax across the codebase, especially for geo/earth and geostore |
| `editions` | 462 | Used extensively in newer modules (logs, google/internal, content creation) |
| `proto3` | 55 | Used selectively (google/protobuf well-known types, some maps protos) |

### Custom Extensions & Annotations

The codebase makes heavy use of Google's internal protobuf infrastructure:

- **`net/proto2/proto/descriptor.proto`**: Google's internal extended protobuf descriptor (superset of the standard `descriptor.proto` from `google/protobuf/`). Adds field presence tracking, repeated field encoding, UTF-8 validation, JSON format, message encoding, editions support, and security/auditing annotations.
- **`net/proto2/bridge/proto/message_set.proto`**: MessageSet extension mechanism for proto2.
- **`storage/datapol/annotations/proto/semantic_annotations.proto`**: Data policy annotations for field-level privacy and compliance.
- **`geo/earth/proto/storage_restrictions.proto`**: Custom storage restriction annotations controlling where fields can be persisted (DocumentStorageMetadata, Deeplink, LegacyDataState, KML extension).
- **Custom field options**: `allowed_sources` (Command), `crawl_feature_id`, `strong_reference`, `has_back_reference` (FeatureId), etc.

### Java & ObjC Options

Most proto files include:
- `option java_package` — for Android/JVM builds
- `option java_multiple_files = true` — generates separate Java files
- `option objc_class_prefix = "RTH"` — Objective-C prefix for iOS builds (Earth → `RTH*`)
- `option optimize_for = CODE_SIZE` — used in document/storage protos

### Cross-References

The dependency graph is deeply interconnected. Core proto dependencies include:
- `geo/earth/proto/*` imports `google/protobuf/*`, `storage/datapol/*`, `net/proto2/*`
- `geo/earth/app/cpp/core/*` imports `geo/earth/proto/*`
- `google/internal/earth/v1/*` imports `geo/earth/*`, `google/api/*`, `google/type/*`
- `logs/proto/*` imports from virtually all domains for comprehensive event capture

---

## Build System Note

This repository contains **no build files** (`BUILD`, `BUILD.bazel`, `CMakeLists.txt`, `Cargo.toml`, `package.json`, `Makefile`). Build configuration is expected to be managed in the parent monorepo (likely a Bazel-based Google internal repository). The proto files follow Google's standard protobuf path conventions, with imports using repo-root-relative paths.

---

## Relationship to Earth Studio WASM

The repository name `earthstudiowasm` reflects the project's role as the **shared protobuf schema layer** between:

1. **Google Earth Studio (Native C++)** — The desktop-class Earth Studio application written in C++ with a rich UI for creating geo-spatial designs, building analysis, solar studies, and cinematic camera animations.
2. **Earth Studio WASM** — A WebAssembly-compiled version of the Earth Studio engine for running in modern web browsers, enabling browser-based 3D globe rendering and design tools without native installation.

The proto definitions serve as the contract between:
- **Client ↔ Server**: API request/response messages
- **Client State**: Serializable application state (deep links, document storage, user settings)
- **Analytics**: Event logging schemas for telemetry
- **Storage**: Persistent data formats (documents, features, map tiles)

---

## Key Features Represented in the Schemas

Based on the proto definitions, Earth Studio supports:

- **3D Globe Rendering**: Projection modes (globe/mercator), satellite/roadmap/terrain imagery, animated clouds, 3D buildings, terrain
- **Camera Animation**: LookAt/LookFrom cameras, fly-to, teleport, orbit (POI/planet/cinematic), street view panorama
- **Content Creation**: Placemarks, polylines, polygons, 3D models, ground overlays, screen overlays, photo overlays, KML import/export
- **Design Tools**: New building design, solar analysis, building editor, spray paint, measure tool (distance/area/slope)
- **Data Layers**: Earth data layers with categorical/range filtering, color palettes, raster tile layers, paint feature layers, classification layers
- **On-Demand Analysis**: Slope, aspect, cut-and-fill, contour analysis
- **Earth Mate**: AI-powered assistant chat with overhead imagery support
- **Image Generation**: AI image generation from queries
- **Time Features**: Time Machine (historical imagery), Timelapse (animated time series)
- **Search**: Geo search with knowledge cards, feeling lucky, voyager stories
- **Collaboration**: Cloud projects, cloud documents, document sharing, document namespaces
- **Billing**: Rate cards, plan types, quota management, billing upgrade dialogs
- **Offline Support**: Local file system adapter, caching
- **Enterprise**: Enterprise-specific features and configurations
- **Accessibility**: Accessibility event logging
- **Onboarding**: User onboarding flows and promotions

---

## Issues & Observations

### 1. **No Build Configuration**
Without `BUILD` files or any build system configuration, new users cannot determine the correct protobuf compilation targets, plugin versions, or dependency resolution strategy. This is a significant barrier to using this repo independently.

### 2. **Deeply Nested Directory Structure**
Some paths reach 8+ levels deep (e.g., `geo/earth/app/cpp/core/state/solardesigninput/`). While this reflects the application's architecture, it makes navigation and proto import paths verbose.

### 3. **Mixed Syntax Versions**
The mixture of proto2 (60.7%), editions (35.1%), and proto3 (4.2%) requires careful compiler configuration. Editions support (`editions = "2023"` or similar) is a relatively new protobuf feature and may not be supported by all toolchains.

### 4. **Google-Internal Dependencies**
Many protos import internal Google paths like:
- `net/proto2/proto/descriptor.proto` (Google's extended descriptor)
- `storage/datapol/annotations/proto/semantic_annotations.proto` (internal data policy)
- `java/com/google/apps/jspb/jspb.proto` (JSPB — Java Server Protobufs)

These imports would fail in a standard protobuf toolchain. External consumers would need to provide stub or compatible implementations.

### 5. **No README Until Now**
A repository of this scale with 1,316 files and 38 top-level domains previously had no documentation explaining its purpose, structure, or usage.

### 6. **No Source Code**
Despite the `earthstudiowasm` name, the actual C++, Java, and TypeScript source code is absent. This is purely a schema/interface repository. Implementation files live elsewhere.

### 7. **Cross-Cutting Concerns**
Some domains that would typically be separate (like `logs/`, `storage/`, `privacy/`) are co-located here, suggesting this is a snapshot or subtree from a larger monorepo rather than a standalone project.

### 8. **No Version Tagging**
There are no git tags, release versions, or changelogs. The proto files lack explicit version identifiers, making API compatibility tracking difficult.

---

## Getting Started

### Prerequisites

To compile these protos, you'll need:
- **Protocol Buffers compiler** (`protoc`) v25+ (for editions support)
- Google's internal proto2 extensions (or compatible stubs)
- Java protobuf plugin (for JSPB-dependent protos)
- Objective-C protobuf plugin (for `objc_class_prefix` option)

### Suggested Workflow

```bash
# 1. Ensure all proto import paths are resolvable
#    This repo uses repo-root-relative paths like:
#    import "geo/earth/proto/commands.proto";

# 2. Compile with proto paths pointing to repo root
protoc \
  --proto_path=. \
  --cpp_out=./generated/cpp \
  --java_out=./generated/java \
  geo/earth/proto/commands.proto

# 3. For protos with internal Google deps, either:
#    - Provide stub .proto files for missing imports
#    - Use descriptor_set_in to include pre-compiled dependencies
```

### Dependency Graph (Simplified)

```
google/protobuf/*         ← Standard well-known types
google/api/*              ← API annotations
google/type/*             ← Standard types
    ↓
net/proto2/proto/*        ← Extended descriptor
storage/datapol/*         ← Data policy annotations
    ↓
geo/earth/proto/*         ← Core Earth types (geometry, commands, map style, etc.)
    ↓
geo/earth/app/cpp/core/*  ← Application core (document, features, state, etc.)
    ↓
logs/proto/*              ← Event logging (depends on all above)
google/internal/earth/*   ← Internal APIs (depends on geo/earth)
```

---

## Documentation Map

This repository includes comprehensive documentation organized by purpose:

### For Newcomers
| Document | Description |
|---|---|
| [README.md](./README.md) | Project overview, structure, and quick start |
| [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) | One-page cheat sheet for daily development |

### Architecture & Deep Analysis
| Document | EN | ZH | Lines |
|---|---|---|---|
| **Master Index** | [INDEX.md](./analysis/INDEX.md) | [INDEX_zh.md](./analysis/INDEX_zh.md) | 274 |
| Earth Studio Core | [geo-earth-analysis.md](./analysis/geo-earth-analysis.md) | [zh](./analysis/geo-earth-analysis_zh.md) | 1,016 |
| Google Maps | [maps-analysis.md](./analysis/maps-analysis.md) | [zh](./analysis/maps-analysis_zh.md) | 1,641 |
| Event Logging | [logs-analysis.md](./analysis/logs-analysis.md) | [zh](./analysis/logs-analysis_zh.md) | 1,005 |
| Geo Data Storage | [geostore-analysis.md](./analysis/geostore-analysis.md) | [zh](./analysis/geostore-analysis_zh.md) | 1,326 |
| Internal APIs + Others | [google-and-others-analysis.md](./analysis/google-and-others-analysis.md) | [zh](./analysis/google-and-others-analysis_zh.md) | 1,060 |

### Capabilities & Constraints
| Document | EN | ZH |
|---|---|---|
| What protos CAN/CANNOT do | [CAPABILITIES.md](./CAPABILITIES.md) | [CAPABILITIES_zh.md](./CAPABILITIES_zh.md) |

### Development Standards
| Document | EN | ZH |
|---|---|---|
| Development specification | [DEVELOPMENT_SPEC.md](./DEVELOPMENT_SPEC.md) | [DEVELOPMENT_SPEC_zh.md](./DEVELOPMENT_SPEC_zh.md) |

### Dependency Analysis
| Document | Description |
|---|---|
| [DEPENDENCY_MAP.md](./DEPENDENCY_MAP.md) | Full dependency diagrams (Mermaid flowcharts) |
| [DEPENDENCY_MAP_zh.md](./DEPENDENCY_MAP_zh.md) | Chinese version |
| [DEPENDENCY_FILES.md](./DEPENDENCY_FILES.md) | File-level dependency listing + Top 50 |

### Interactive Diagrams
| File | Description |
|---|---|
| [diagrams/domain-deps.html](./diagrams/domain-deps.html) | 38-domain dependency map (zoomable, theme toggle) |
| [diagrams/topology-layers.html](./diagrams/topology-layers.html) | 8-layer topological hierarchy |
| [diagrams/earth-core.html](./diagrams/earth-core.html) | geo/earth core internal dependencies |

### Automated Tools
| Tool | Purpose |
|---|---|
| [devtools/checks/check-all.sh](./devtools/checks/check-all.sh) | 12-item proto compliance checker |
| [.github/workflows/proto-check.yml](./.github/workflows/proto-check.yml) | CI auto-check on every PR |

---

## License

This project contains Google proprietary protocol buffer definitions. Usage is subject to Google's terms and conditions.

---

*Last updated: August 2026*
