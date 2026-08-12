# Earth Studio WASM - Complete Architecture Analysis Index

Deep analysis of all 1,316 Google official Proto files.
5 analysis reports, 6,048 lines total.

---

## Analysis Reports

| # | Report | Lines | Domain |
|---|---|---|---|
| 1 | geo-earth-analysis.md | 1,016 | Google Earth Studio Core (159 files) |
| 2 | maps-analysis.md | 1,641 | Google Maps Ecosystem (344 files) |
| 3 | logs-analysis.md | 1,005 | Event Logging & Analytics (182 files) |
| 4 | geostore-analysis.md | 1,326 | Geo Data Persistence Layer (162 files) |
| 5 | google-and-others-analysis.md | 1,060 | Standard Types + Internal APIs + Others (~300 files) |

---

## System Architecture Overview

```
                      +---------------------------+
                      |    Earth Studio Client     |
                      |  Studio UI + 60 States     |
                      |  Commands (34) + Model     |
                      +------------+--------------+
                                   |
              +------------------+-------------------+
              |                  |                    |
     +--------v------+  +-------v------+  +---------v------+
     | geo/serving   |  | google/      |  | maps/tactile   |
     | photos/imagery|  | internal/v1  |  | API layer      |
     | search/AR     |  | billing/env  |  | 241 edges      |
     +-------+-------+  +------+-------+  +--------+-------+
             |                 |                   |
             +--------+--------+-------------------+
                      |
             +--------v--------+
             |  geostore/base   |
             |  408 edges       |
             |  FeatureId (S2)  |
             |  Feature (70+)   |
             +--------+--------+
                      |
             +--------v--------+
             |  Foundation      |
             |  protobuf/type   |
             |  api/net/proto2  |
             +--------+--------+
                      |
             +--------v--------+
             |  logs/proto      |
             |  223 edges       |
             |  EarthEvent (89) |
             +------------------+
```

---

## Key Data Flows

### 1. User Action -> State Change -> Rendering
```
User taps "Fly to NYC"
  -> Commands.FlyToCamera (commands.proto)
  -> State/search updates (state/search/searchderivedstate.proto)
  -> Camera presenter animates (studio_presenters/camera/)
  -> EarthEvent logged (logs/proto/geo/earth/app/earth_log.proto)
```

### 2. Feature Creation Pipeline
```
User draws polygon
  -> Commands.CreateFeature (commands.proto)
  -> ContentEditingModel.Feature (content_editing_model.proto)
  -> Document stored (core/document/)
  -> Rendered on globe via MapStyle (mapstyle.proto)
```

### 3. Map Rendering Pipeline
```
Client requests map tiles
  -> maps/tactile API (directions, search, places)
  -> maps/paint renders vector tiles (paint/proto/)
  -> maps/spotlight shows entity cards (spotlight/proto/)
  -> geostore/base provides feature data (FeatureProto)
```

### 4. Route Finding Flow
```
User requests directions
  -> maps/directions request
  -> maps/pathfinder CRP searches (crp/searcher/)
  -> maps/roadtraffic adds traffic (traffic_model_type.proto)
  -> maps/transit adds transit options (transit/api/)
  -> Result returned through maps/tactile
```

### 5. Analytics Pipeline
```
Any user interaction
  -> logs/proto/visual_element/ (UI click tracking)
  -> logs/proto/geo/earth/app/earth_log.proto (89 event types)
  -> logs/proto/maps/ (maps-specific events)
  -> All tagged with storage/datapol annotations (PII governance)
```

---

## Core Domains Deep Dive

### 1. geo/earth/ - Earth Studio Core (159 files)

| Subsystem | Files | Key Artifacts |
|---|---|---|
| Commands | commands.proto | 34 command types: search, fly-to, create/edit/delete features, toggle layers, render designs, Earth Mate chat, image generation, on-demand analysis (slope/aspect/cut-fill/contour) |
| Content Model | content_editing_model.proto | 113 message types: Feature, Placemark, Geometry (Point/Polyline/Polygon), Style (Icon/Line/Poly/Balloon/Label), Earth data layers, color palettes, 3D assets, classification |
| Map Style | mapstyle.proto | Projection (Globe/Mercator), Imagery (Satellite/Roadmap/Terrain), 3D features, clouds, gridlines, layer toggles |
| Camera | geometry.proto | LookAt + LookFrom cameras, latitude/longitude/altitude/heading/tilt/roll/FOV |
| State | 60+ files | Search, document, design, layers, streetview, timemachine, timelapse, measure, drawing, property editor, onboarding, solar, newbuild, building editor, site selection, feedback, Earth Mate |
| Studio | 7 files | Camera animation (10 messages), base layers, property editor, settings, view status |
| Document | 18 files | Metadata, storage, import/export, I/O adapters (local FS, external FS, UMS), roles, capabilities |
| Earth Mate | 7 files | Request/response for Gemini-powered AI assistant, image generation, file attachments |
| Design | 16 files | Design generation, building templates, site selection, legend, lightbox, drawing modes, polygon input |

### 2. maps/ - Google Maps Ecosystem (344 files)

| Subsystem | Files | Key Artifacts |
|---|---|---|
| Tactile | 190 | Full Maps frontend API: directions, entities (places), search, ads, hotels, transit, EV charging, photos, caching, passive assist, internal types |
| Paint | 75 | Tile rendering engine: client vector tiles, styling, labeling rules, 3D output, overlays, feature selectors, layer descriptions |
| Pathfinder | 31 | CRP route-finding: path search, MRP, alternates, autonomous driving, EV routing, replay |
| Directions | 16 | Client stats (35 clients x 47 contexts), customization config, MRP affordances, toll pricing |
| Spotlight | 12 | Entity detail cards: ads, crisis, hotels, search params |
| Transit | 11 | Transit routing: vehicle preferences, fares, personalization, long-distance, booking links |
| Versatile | 10 | Internal vector format: features, render ops, styles, data binding, 3D models |
| Road Traffic | 9 | Traffic ML models (TRAFFIC2VEC), incident metadata, path encoding, disruptions |
| Shared | 9 | Universal geometry (geom.proto), mapcore API, labeling, testing framework |
| GMM | 4 | Mobile network types, promoted pin ads, camera, WebView |
| LIMO | 4 | Local Inventory Maps Onboarding: context, platforms, products |

### 3. geostore/ - Geo Data Storage (162 files)

| Subsystem | Files | Key Artifacts |
|---|---|---|
| FeatureId | featureid.proto | Universal S2-cell + fingerprint addressing (dual 64-bit) |
| Feature | ~70 messages | Single unified container with 70 typed sub-message dispatch fields |
| Segment | segment.proto | Central road model: 15+ enums covering 200+ attributes |
| Lane | lane.proto | HD lane-level model: 20+ lane types, flow connections |
| Restriction | restriction.proto | 20+ restriction types with time scheduling and vehicle filtering |
| Establishment | (embedded) | 400+ business categories |
| PriceInfo | priceinfo.proto | Full restaurant menu system (items, options, allergens, nutrition) |
| TimeSchedule | timeschedule.proto | Rich temporal expressions (30+ occasion categories) |
| FeaturePattern | (matching) | Boolean DSL for feature matching: 30+ pattern types |
| Address | address.proto | Structured addresses with components |
| Route | route.proto | Road route definitions with directions |
| Transit | transit_line_variant.proto | Public transit line variants |

### 4. logs/ - Event Logging (182 files)

| Subsystem | Files | Key Artifacts |
|---|---|---|
| Earth Event Log | earth_log.proto | 89 event type categories, 400+ discrete event values, 30+ sub-messages |
| Visual Element | 14 files | Universal click tracking (VisualElementLiteProto), UI tree grafting, 55 user action types |
| Directions/Pathfinder | 34 files | Full routing request/response, MRP server-side (21 phase tags), counterfactual A/B |
| Navigation | 4 files | 258 symbols: 50+ nav session events, Gemini-in-nav, AR nav, guider events |
| Transit | 21 files | 7-mode connections, fare structures, 50+ penalty cost model |
| Maps Shared | 10 files | Automotive context, geometry, names, lodging pricing |
| Search Box | 6 files | 40 search methods, 46 suggestion sources, 121 experiment stats |

### 5. google/internal/ - Internal Earth APIs (48 files)

| Subsystem | Files | Key Artifacts |
|---|---|---|
| Billing | 6 | Rate cards, plan types, knowledge registry, limits, capabilities |
| Built Environment | 20 | Building edits, block edits, park edits, solar run inputs, new build metrics, raster analysis, design content, geometry |
| Earth Mate | 1 | Earth Mate API request/response models |
| Layers | 1 | Layer configuration API |
| Photos | 1 | Photo serving API |
| User/Settings | 3 | User profiles, settings, metadata |
| Terrain | 1 | Terrain analysis API |
| Classification | 1 | Classification layer API |
| Feature Flags | 1 | Experiment/feature flag system |
| Client Config | 1 | Client configuration bootstrap |

---

## Architectural Patterns

### 1. S2 Cell Indexing
Every geographic entity is keyed by `FeatureIdProto` (cell_id + fingerprint), using Google's S2 geometry library for spatial indexing.

### 2. MessageSet Extension Dispatch
30+ MessageSet extensions in geostore allow dynamic type dispatch without modifying the base FeatureProto container.

### 3. State-Derived Pattern
60+ UI state slices each have their own proto, following a consistent `*derivedstate.proto` naming convention. They observe Commands and Core state, compute derived values.

### 4. Command Pattern
All user actions flow through `Commands` (commands.proto): 34 oneof-dispatched command types. Each command maps 1:1 to a user-facing feature.

### 5. PII Governance Layer
`storage/datapol/annotations/proto/semantic_annotations.proto` (890 imports) provides field-level data classification for privacy compliance across all domains.

### 6. Editions Migration
462 files already use `editions` syntax (the future). 799 remain proto2. 55 are proto3. The migration strategy is: new files -> editions; existing modified files -> migrate to editions.

### 7. Deep Extension Usage
Google's internal `net/proto2/proto/descriptor.proto` extends the standard protobuf descriptor with field presence tracking, UTF-8 validation, JSON format, and security auditing features.

---

## Feature Matrix

| Feature | Commands | Content Model | State | Studio | Maps | Geostore | Logs |
|---|---|---|---|---|---|---|---|
| 3D Globe Rendering | - | MapStyle | layers | baselayer | paint | - | BaseLayerEvent |
| Camera Animation | FlyToCamera | Camera | - | camera | - | - | - |
| Placemarks | CreateFeature | Placemark | propertyeditor | propertyeditor | - | Feature | - |
| Polylines/Polygons | CreateFeature | Polyline/Polygon | drawingtool | - | paint | Segment/Lane | - |
| Search | PerformSearch | - | search | - | tactile | Feature | SuggestionEvent |
| Street View | EnterStreetView | - | streetview | - | - | - | - |
| Time Machine | EnterTimeMachine | - | timemachine | - | - | - | TimeControlsEvent |
| Timelapse | EnterTimelapse | - | timelapse | - | - | - | - |
| 3D Buildings | ToggleLayer | - | layers | - | - | - | - |
| Solar Analysis | ViewDesign | - | solardesigninput | - | - | - | - |
| Building Design | CreateDesigns | 3DAsset/Model | newbuild/buildingeditor | - | - | - | - |
| Measure Tool | - | - | measuretool | - | - | - | MeasureToolEvent |
| Earth Mate AI | OpenEarthMateChat | - | earthmate | - | - | - | EarthMateEvent |
| Image Generation | OpenImageGenerator | - | - | - | - | - | - |
| On-Demand Analysis | ViewOnDemandAnalysis | - | - | - | - | - | LRO events |
| Directions/Routing | - | - | - | - | directions/pathfinder | Route | Full routing log |
| Transit | - | - | - | - | transit | TransitLineVariant | Transit logs |
| Traffic | - | - | - | - | roadtraffic | TrafficFlow | Traffic logs |
| Maps Rendering | - | MapStyle | layers | baselayer | paint/tactile | - | VE logging |
| Billing | ViewRateCard | - | gcpprojectbilling | - | - | - | BillingEvent |
| Cloud Projects | CreateCloudProject | Document | documentmanager | - | - | - | ImportToCloud |
| Onboarding | - | - | onboarding | - | - | - | Onboarding events |
| Accessibility | - | - | - | - | - | - | AccessibilityEvent |

---

## Dependency Stats

| Layer | Files | Internal Edges | Most Depended On |
|---|---|---|---|
| L0 Foundation | ~30 | - | storage/datapol (890 imports) |
| L1 Annotations | ~40 | - | google/api (208), java/JSPB (208) |
| L2 Geostore | 162 | 408 | geostore/base/featureid.proto (71) |
| L3 Base Services | ~200 | 195 cross | geo/serving (195 cross-domain) |
| L4 App Core | ~200 | 175 | geo/earth/proto/commands.proto |
| L5 Internal | ~50 | - | google/internal/earth/v1/shared.proto (14) |
| L6 State | 60+ | - | state/state.proto (11) |
| L7 Logs | 182 | 223 | logs/proto/logs_annotations (137) |

---

## Quick Navigation

- **How does Earth Studio execute a user command?** -> [geo-earth-analysis.md](geo-earth-analysis.md) Section 1 (Commands)
- **How is a map feature stored?** -> [geostore-analysis.md](geostore-analysis.md) Section 2 (FeatureProto)
- **How are map tiles rendered?** -> [maps-analysis.md](maps-analysis.md) Section 2 (Paint)
- **How is a route calculated?** -> [maps-analysis.md](maps-analysis.md) Section 3 (Pathfinder)
- **How are user actions logged?** -> [logs-analysis.md](logs-analysis.md) Section 2 (EarthEvent)
- **How does billing work?** -> [google-and-others-analysis.md](google-and-others-analysis.md) Section Billing
- **How are buildings designed?** -> [google-and-others-analysis.md](google-and-others-analysis.md) Section Built Environment

---

*Analysis generated: 2026-08-12*
*Based on 1,316 official Google proto files, 4,195 import edges*
