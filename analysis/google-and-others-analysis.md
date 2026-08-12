# Google Earth Studio WASM — Proto Analysis: Google and Additional Domains

> **Generated:** 2026-08-12 | **Project Root:** `/mnt/a740bae8-eadd-474a-857b-17333b55e34a/earthstudiowasm`

---

## 1. `google/internal/earth/v1/` (48 files) — Internal Earth APIs

The core Earth API domain. Package: `google.internal.earth.v1` with sub-packages for billing, built environment, and Earth Mate.

### 1.1 — `google/internal/earth/v1/shared.proto`

| Property | Detail |
|----------|--------|
| **Package** | `google.internal.earth.v1` |
| **Dependencies** | `geo/earth/proto/contentcreation/`, `billing/capability`, `google/protobuf/timestamp`, `net/proto2/contrib/validator`, `storage/datapol`, `wireless/android/privacy` |

**Key Messages:**

- **`ClientMetadata`** — Client identity: country code, version, and `ClientType` (UNKNOWN/ANDROID/IOS/WEB/PROBER/STUDIO/MIRTH_DEMO/MAPS_JS_API). Used across all Earth API requests.
- **`Viewport`** — Geographic bounding box (north/south/east/west doubles). Fundamental spatial query primitive.
- **`RequestRule`** — HTTP request configuration rules (API_KEY, STANDARD_AUTH, PH_SERVER_TOKEN, BILLING_GCP_PROJECT, etc.). Controls how backend requests are constructed.
- **`LookFromCamera`** — Camera pose: lat/lng/alt/heading/tilt/roll/field_of_view_y. Standard 7-DOF camera model.
- **`LatitudeLongitude` / `ImageSize`** — Basic geometry/value types.
- **`DataLayer`** — The central abstraction for map data layers. Supports four backing types (`DmsLayer`, `KmlLayer`, `UrlTemplateLayer`, `VideoRasterLayer`). Carries display metadata, entitlements, governance, styling (`AppliedStyleRules`, `StyleAttribute`, `FilterSet`), geometry types, search metadata, and attribute configuration.
- **`DmsLayer`** — DOMAIN MANAGEMENT SYSTEM layer: vector tiles via `tile_key`, with interactive balloon data support.
- **`DmsLayerMetadata`** — Key/value pairs, attribute configuration (primary/secondary/feature name), thinning stats.
- **`StyleAttribute` / `AppliedStyleRules`** — Fill color, stroke color/width, opacity, icon, scale. Supports categorical values (string/int/double) and interpolated values (int/double numeric ranges).
- **`FilterSet`** — Categorical (discrete options with enable/disables) and Interpolated (DoubleRange/IntRange) filters for data layers.
- **`GeometricFilter`** — Geometric operators (CONTAINS/INTERSECTS) with a `Geometry` parameter.
- **`LayerAttribute`** — Typed attribute schema with 13 types: STRING, ENUM, NUMBER, DATETIME_USEC, BOOLEAN, LAT_LNG, DISTANCE_M, AREA_SQ_M, POWER_W, VOLTAGE_V, MARKDOWN, IMAGE.
- **`GovernanceSecurityInfo` / `TermsOfUseRestriction`** — Legal and governance metadata for data layers.
- **`DataLayerProperties`** — Boolean flags: CAN_STYLE, CAN_ANALYZE, CAN_APPLY_GEOMETRIC_FILTER; plus `LayerInteractivityConfig`.

**Purpose:** Monolithic shared types file — the backbone of all Earth API request/response structures. Defines the data layer lifecycle: from backend metadata (DMS tiles, publishing info) through client display (styling, filtering, attributes, governance) to user interaction.

---

### 1.2 — `google/internal/earth/v1/classification.proto`

| Property | Detail |
|----------|--------|
| **Package** | `google.internal.earth.v1.classification` |
| **Dependencies** | `google/type/color`, `net/proto2/contrib/validator`, `storage/datapol` |

**Key Messages:**

- **`ClassificationSystem`** — Named classification taxonomy (system_id, display_name).
- **`ClassificationSystemClass`** — Individual class within a system (class_id, code, display_name, color).
- **`ListClassificationSystemsRequest/Response`** — List all available classification systems.
- **`ListClassificationSystemClassesRequest/Response`** — List classes within a system.

**Purpose:** Land cover / land use classification system metadata. Feeds the classification layer feature (see `ClassificationLayerOptions` in layers.proto). 4 fields per class.

---

### 1.3 — `google/internal/earth/v1/client_config.proto`

| Property | Detail |
|----------|--------|
| **Package** | `google.internal.earth.v1.config` |
| **Dependencies** | `shared.proto`, `google/protobuf/duration`, `google/type/date`, `logs/proto/geo/earth/app/earth_log`, `maps/paint/proto/paint-parameters`, `net/proto2/contrib/validator`, `storage/datapol`, `wireless/android/privacy` |

**Key Messages:**

- **`GetConfigRequest`** — Client metadata, DPI ratio, renderer version.
- **`ClientConfig`** — Top-level: environment config, country code, paint parameters.
- **`EnvironmentConfig`** — Service configs per service name, external links, feature configs per platform (Android/iOS/Web).
- **`ServiceConfig`** — Service endpoint URL templates with request rules.
- **`FeatureConfig`** — Giant config holder for ALL Earth features:
  - `DocumentConfig` — UMS concurrency, rate limiting, balloon templates, feature limits
  - `SatelliteLayerConfig` — Satellite DB tile path
  - `CelestialBodiesConfig` — Star/planet bodies
  - `NetworkConfig` / `TrustedDomainList` — Domain whitelisting
  - `RocktreeConfig` — Tile epoch override
  - `SuggestConfig` — Search suggest thresholds
  - `BillingConfig` — Cloud console URLs, purchase flow, GA date, promo limits
  - `BuiltenvConfig` — Site area limits per plan tier, design limits per 30-day window
  - `IndustrySelectorConfig` — Call-to-action delay/backoff config
  - `PhotosConfig` — Street View / Photos product IDs
  - `StarterProjectConfig` — Starter project template details
  - `EarthMateConfig` — Max create features count, max features to process
  - `ImageryUpdateRequestConfig` — External URL template, supported imagery types
  - `ChangeDetectionConfig` — Min/max year range
  - `ImageGeneratorPromoConfig` — Promotional image items
- **`PlatformConfig`** — HaTS survey triggers per platform.
- **`AbsoluteUrlTemplate`** — URL template string wrapper.

**Purpose:** Central client configuration delivery. The server sends a single `ClientConfig` that configures every Earth feature — rendering parameters, feature flags, billing UI, plan limits, and service endpoints. Acts as the Earth client's runtime configuration manifest.

---

### 1.4 — `google/internal/earth/v1/feature_flags.proto`

| Property | Detail |
|----------|--------|
| **Package** | `google.internal.earth.v1.featureflags` |
| **Dependencies** | `geo/earth/client_config/experiment_flag`, `shared.proto`, `storage/datapol`, `wireless/android/privacy` |

**Key Messages:**

- **`GetFeatureFlagsRequest`** — Client metadata.
- **`GetFeatureFlagsResponse`** — List of `ExperimentFlag`, report experiment IDs, local override toggle.

**Purpose:** Feature flag/experiment gate remote delivery. Enables server-driven gradual rollouts.

---

### 1.5 — `google/internal/earth/v1/knowledge.proto`

| Property | Detail |
|----------|--------|
| **Package** | `google.internal.earth.v1.knowledge` |
| **Dependencies** | `geo/earth/proto/renderable-entity`, `shared.proto`, `net/proto2/contrib/validator`, `storage/datapol`, `wireless/android/privacy` |

**Key Messages:**

- **`GetKnowledgeCardRequest`** — Location query by MID/FID or lat/lng+query; map sizes, cardset mode.
- **`GetKnowledgeCardResponse`** — `RenderableEntity` containing structured knowledge info.
- **`LatLngWithQuery`** — Geographic point + text query.

**Purpose:** Knowledge card retrieval for places. Returns rich structured entities from the Knowledge Graph for display on the Earth canvas.

---

### 1.6 — `google/internal/earth/v1/layers.proto`

| Property | Detail |
|----------|--------|
| **Package** | `google.internal.earth.v1.layers` |
| **Dependencies** | `geo/earth/proto/contentcreation/`, `google/longrunning/operations`, `shared.proto`, `net/proto2/contrib/validator`, `storage/datapol`, `wireless/android/privacy` |

**Key Messages:**

- **`ListDataLayersRequest/Response`** — Server-side paginated browsing/searching of data layers. Returns layer groups with global layer IDs.
- **`GetDataLayerRequest/Response`** — Fetch a specific data layer with vector styling or classification layer options.
- **`VectorLayerOptions`** — Filters, exposed attributes, attribute stats, and applied styles per geometry type.
- **`ClassificationLayerOptions`** — Custom classification definition: year, class definitions (RGB colors + sample points), area polygon.
- **`GetFeatureDetailsRequest/Response`** — Fetch feature attributes by feature ID and layer identifier.
- **`GetFeaturesInViewportRequest/Response`** — Spatial query: features within a viewport, paginated, with LOD control.
- **`Feature` / `FeatureAttributeValue`** — Runtime feature data with attribute values (int/bool/double/string/datetime).
- **`CreateOnDemandLayerRequest`** — Create analytical layers: elevation contours, slope, cut-and-fill, aspect, change detection.
- **`ImportDatasetToLayerRequest`** — Import KML/GeoJSON/Shapefile datasets.
- **`CreateDocumentAssetLayerRequest`** — Creates layer assets (user-imported, on-demand, spatial operations, Gemini-generated) with quota tracking.
- **`GeminiGeneratedLayer`** — AI-generated dataset layer with CNS path source.
- **`SpatialOperationLayer`** — Clip operations with geometric filters.
- **`Quota`** — Byte-based quota consumption tracking.

**Purpose:** Full CRUD lifecycle for Earth data layers. Covers listing/browsing, detail retrieval, spatial queries, on-demand analysis layers (contour/slope/aspect/change detection), dataset imports, and document asset management. Uses `google.longrunning.Operation` for async operations.

---

### 1.7 — `google/internal/earth/v1/photos.proto`

| Property | Detail |
|----------|--------|
| **Package** | `google.internal.earth.v1.photos` |
| **Dependencies** | `geo/earth/proto/photos`, `geo/earth/proto/renderable-entity`, `shared.proto`, `net/proto2/contrib/validator`, `storage/datapol`, `wireless/android/privacy` |

**Key Messages:**

- **`GetThumbnailsForViewportRequest`** — Viewport-based thumbnail retrieval with max results, distance ratio, size, pano flag.
- **`GetThumbnailsForViewportResponse`** — Returns `ThumbnailImage` list.
- **`GetPhotosForPointRequest`** — Point-radius photos: center point, search radius, max results, image size, pano flag.
- **`GetPhotosForPointResponse`** — Returns `RenderableEntity.Image` list.

**Purpose:** Photo discovery layer for Earth. Enables viewport-based photo browsing (Street View-style) and point-radius photo queries.

---

### 1.8 — `google/internal/earth/v1/quota.proto`

| Property | Detail |
|----------|--------|
| **Package** | `google.internal.earth.v1.quota` |
| **Dependencies** | `billing/plantype`, `storage/datapol` |

**Key Messages:**

- **`GetUserAssetQuotaRequest/Response`** — Get consumed/remaining/max quota per `AccountingUnit`.
- **`ValidateUserAssetQuotaRequest/Response`** — Validate quota deltas against plan limits.
- **`QuotaDelta`** — Accounting unit + amount delta.
- **`QuotaValidationResult`** — Per-unit validation status list.

**Key Enums:**
- **`AccountingUnit`** — BYTES, ON_DEMAND_USAGE, IMAGE_GENERATION_USAGE.
- **`ValidationStatus`** — ASSET_SIZE_BELOW/EXCEEDS_LIMIT, QUOTA_BELOW/EXCEEDS_LIMIT.

**Purpose:** Resource quota management. Tracks and validates user asset consumption against plan limits.

---

### 1.9 — `google/internal/earth/v1/terrain.proto`

| Property | Detail |
|----------|--------|
| **Package** | `google.internal.earth.v1.terrain` |
| **Dependencies** | `shared.proto`, `net/proto2/contrib/validator`, `storage/datapol`, `wireless/android/privacy` |

**Key Messages:**

- **`BatchGetElevationsByPointRequest`** — List of lat/lng points.
- **`BatchGetElevationsByPointResponse`** — Corresponding elevations in meters (packed doubles).

**Purpose:** Terrain elevation API. Simple batch point-to-elevation lookup.

---

### 1.10 — `google/internal/earth/v1/user.proto`

| Property | Detail |
|----------|--------|
| **Package** | `google.internal.earth.v1.user` |
| **Dependencies** | `shared.proto`, `storage/datapol`, `wireless/android/privacy` |

**Key Messages:**

- **`GetUserRequest`** — Client metadata + retry counter.
- **`GetUserResponse`** — User profile: gaia ID, session ID, display name, photo URL, email, Drive/MyMaps/Earth enabled flags.

**Purpose:** User identity and capabilities endpoint.

---

### 1.11 — `google/internal/earth/v1/user_settings.proto`

| Property | Detail |
|----------|--------|
| **Package** | `google.internal.earth.v1.user_settings` |
| **Dependencies** | `shared.proto`, `google/protobuf/field_mask`, `storage/datapol`, `wireless/android/privacy` |

**Key Messages:**

- **`UserSettings`** — Industry, country codes, geographic scales, UX research/feature announcement opt-ins, primary use, MAP use cases.
- **`EarthUserIndustries`** — 63 industries (ADVERTISING, AGRICULTURE, ARCHITECTURE, SOLAR_COMMERCIAL, WIND_ENERGY, etc.).
- **`EarthUserMAPUseCases`** — 79 climate/sustainability use cases (METHANE_EMISSIONS_REDUCTION, SOLAR_PV, WILDFIRE_MANAGEMENT, FOREST_RESTORATION, etc.).
- **`EarthUserGeographicScale`** — LOCAL → REGIONAL → STATE → NATIONAL → MULTI_NATIONAL → GLOBAL.
- **`EarthUserPrimaryUse`** — WORK/LEISURE/PUBLIC_SECTOR/ACADEMIC/ACADEMIC_RESEARCHER/ACADEMIC_STUDENT.

**Purpose:** Rich user profiling for Earth's sustainability/climate-oriented features. Deep taxonomy of industries and climate use cases.

---

### 1.12 — `google/internal/earth/v1/user_metadata.proto`

| Property | Detail |
|----------|--------|
| **Package** | `google.internal.earth.v1.user_metadata` |
| **Dependencies** | `shared.proto`, `survey_metadata`, `google/protobuf/timestamp`, `storage/datapol`, `wireless/android/privacy` |

**Key Messages:**

- **`UserMetadata`** — Survey metadata list + first login timestamp.
- **`UserMetadataUpdate`** — Survey event updates.
- **`GetUserMetadataRequest/UpdateUserMetadataRequest`** — Standard CRUD wrappers.

**Purpose:** Survey tracking and user lifecycle metadata.

---

### 1.13 — `google/internal/earth/v1/survey_metadata.proto`

| Property | Detail |
|----------|--------|
| **Package** | `google.internal.earth.v1.survey_metadata` |
| **Dependencies** | `google/protobuf/timestamp`, `storage/datapol` |

**Key Messages:**

- **`SurveyMetadata`** — Survey name, seen/completed/dismissed timestamps, dismiss count.
- **`SurveyEvent`** — Survey name + status.

**Key Enums:**
- **`SurveyStatus`** — SHOWN → DISMISSED → STARTED → COMPLETED lifecycle.
- **`SurveyName`** — Currently only `INDUSTRY_SELECTOR`.

**Purpose:** HaTS survey lifecycle tracking and event logging.

---

### 1.14 — Billing Subdirectory (`billing/`)

#### 1.14.1 — `billing/billing.proto`
**Package:** `google.internal.earth.v1.billing`

**Key Messages:**
- **`License`** — GCP project binding: project number/ID/display name, plan type, enabled capabilities, limits, Google One subscription info.
- **`GetLicenseRequest` / `ListLicensesRequest/Response` / `DeleteLicenseRequest`** — License CRUD.
- **`GoogleOneSubscriptionInfo`** — Subscription tier mapping.
- **`GoogleOnePlanType`** — NON_PREMIUM / PREMIUM_AI_PRO / PLUS / ULTRA.

**Purpose:** License management — the nexus between GCP projects and Earth plan entitlements.

#### 1.14.2 — `billing/capability.proto`
**Package:** `google.internal.earth.v1.billing` (proto3)

**Enum: `Capability`** — 29 granular capabilities:
- Data layer access tiers: STANDARD / PROFESSIONAL / PROFESSIONAL_ADVANCED
- Area filters, user layers, data tables, tax parcels
- Site area limits per tier
- 30-day design quotas per tier
- Built environment zoning autofill
- On-demand evaluation tiers
- Google One Earth Mate query limits
- Overhead imagery search
- Change detection tiers

**Purpose:** Fine-grained feature capability enumeration for plan tier differentiation.

#### 1.14.3 — `billing/knowledge_registry.proto`
**Package:** `google.internal.earth.v1.billing` (proto3)

**Key Messages:**
- **`KnowledgeRegistry`** — List of `KnowledgeEntry` (entity_id, Category, agent_explanation).
- **`Category`** — CAPABILITY / INDUSTRY / PRODUCT_LIMIT.

**Purpose:** AI agent knowledge base about billing concepts, used for Earth Mate billing-related queries.

#### 1.14.4 — `billing/limit.proto`
**Package:** `google.internal.earth.v1.billing`

**Key Messages:**
- **`Limit`** — Oneof limit types: `UserAssetMaxStorageBytes`, `UserAssetMaxFileSizeBytes`, `OnDemandEvaluationMaxSiteSize` (acres), `ClassificationLayerMaxSiteSize` (km²), `ChangeDetectionMaxSiteSize` (acres).
- **`LimitType`** — Deprecated enum (USER_ASSET_MAX_STORAGE_MB, USER_ASSET_MAX_FILE_SIZE_MB).

**Purpose:** Quantitative plan limits for storage and analysis operations.

#### 1.14.5 — `billing/plantype.proto`
**Package:** `google.internal.earth.v1.billing`

**Enum: `PlanType`** — STANDARD / PROFESSIONAL / PROFESSIONAL_ADVANCED.

**Purpose:** Core plan tier enumeration used across the billing subsystem.

#### 1.14.6 — `billing/rate_card.proto`
**Package:** `google.internal.earth.v1.billing`

**Key Messages:**
- **`RateCard`** — Plans with capabilities + limits, localizable UI display info.
- **`DisplayInfo`** — Plan titles, badges, icons, CTAs, pricing strings.
- **`FeatureDisplayInfo`** — Feature-level display info with chips (EXPERIMENTAL/PROMOTIONAL) and per-plan details.
- **`PlanDisplayInfo`** — Plan type, price, promotional price, disclaimer.

**Purpose:** Pricing UX — provides the complete rate card display data for the Earth billing UI, including multi-tier plan comparison and promotional messaging.

---

### 1.15 — Built Environment Subdirectory (`builtenv/`)

This is the largest subdomain (20 files). It implements Google Earth's **solar potential analysis, new building design generation, and urban planning** tools.

#### 1.15.1 — `builtenv/common.proto`
Simple utility: `Range` (min/max doubles) and `ValueOrRange` (oneof double value or Range). Shared across the built environment domain.

#### 1.15.2 — `builtenv/geometry.proto`
3D geometry primitives:
- **`Polygon`** — Encoded bytes, base/height meters, reference level.
- **`Point`** — lat/lng/alt floats + radius.
- **`Polyline`** — Packed lat/lng/alt/width arrays.
- **`ReferenceLevel`** — RELATIVE_TO_GROUND / RELATIVE_TO_SURFACE_MODEL.

**Purpose:** Spatial primitives for all built environment entities.

#### 1.15.3 — `builtenv/built_entity.proto`
The central entity model of the built environment. A `BuiltEntity` has a oneof `properties` covering:
- **Solar**: `SolarPanel`, `SolarStructure`, `SolarStructureComponent`, `BuildingSolarPanel`, `ParkingSolarPanel` (all with polygon geometry + energy metrics)
- **Land**: `Parcel`, `Block`, `Street`, `ParkingLot`, `Park`, `BuildingLot`
- **Structures**: `Building`, `Floor`, `Core`, `Corridor`, `Roof`, `Amenity`, `BuildingUnit`
- **Analysis**: `Views` (raster collection), `GroundSunlightHours` (raster collection)

Each entity carries geometry, metrics (area, energy, parking counts, sunlight hours, sky access percentage), classification (parking type, open space type, structure display name).

**Purpose:** The universal entity graph for the built environment — every parcel, building, floor, solar panel, tree, and view analysis result is a `BuiltEntity`.

#### 1.15.4 — `builtenv/built_environment.proto`
The main API surface for the built environment engine. Defines the RPC request/response structures.

**Key Messages:**
- `CreateDesignGenerationInputRequest` / `DesignGenerationInput` — A design generation request with state machine (RUNNING/SUCCEEDED/FAILED/DRAFT), common solar/new-build/edit inputs, and query metadata.
- `GenerateDesignsRequest/Response` — Trigger design generation.
- `ListDesignsRequest/Response` / `Design` — Browse generated designs with type (SOLAR/NEW_BUILD), tags (BEST_OVERALL_DESIGN), downloadable files (financial model, Rhino, DXF, images), and timestamps.
- `ListDesignGenerationInputsRequest/Response` — Browse design generation input configurations.
- `ExportToEarthMapRequest/Response` — Export designs to Earth map features.
- `BatchGetUserQuotasRequest/Response` — Quota management for design generation and solar analysis.
- `GetZoningRequest/Response` — Retrieve zoning data for a parcel (zone code, name, type, rules).
- `DesignViewEnumeration` — 7 view presets: SUMMARY, FULL_DESIGN, SOLAR_ENERGY_POTENTIAL, NEW_BUILD_BY_USE_TYPE, NEW_BUILD_BY_APARTMENT_TYPE, NEW_BUILD_SOLAR_ENERGY_POTENTIAL, NEW_BUILD_SUNLIGHT_HOURS.

**Purpose:** The primary CRUD API for the built environment design engine. Manages the full lifecycle: parcel selection → zoning lookup → building template selection → design generation → design browsing → export to Earth maps.

#### 1.15.5 — `builtenv/building_configuration.proto`
Defines **building templates** and their **configuration**:
- **`BuildingTemplate`** — Named template with `BuildingConfiguration` and `BuildingTemplateType` (26 types from POINT_LOADED_WITH_STREET_PODIUM to PARKING_GARAGE).
- **`BuildingConfiguration`** — Floor groups (above/basement-grade), lot size constraints, construction composition.
- **`FloorGroup`** — Use types (by class or ID), height, min/max count, loss factor, floor composition IDs, and **`GeometryConfiguration`**.
- **`GeometryConfiguration`** — Procedural geometry operations: Bar (COURTYARD/L_SHAPED/U_SHAPED/SINGLE_BAR/MULTI_COURTYARD), Setback, Simplify, Floating, Wrap — with detailed parameters for each.
- **`BuildingInput`** — Runtime building configuration with selection/recommendation flags.

**Purpose:** The procedural architecture engine. Describes how buildings are generated — their use types, floor configurations, and geometry operations that produce the 3D models.

#### 1.15.6 — `builtenv/raster.proto`
Raster data plane representation:
- **`Raster`** — Contains one or more `RasterPlane`.
- **`RasterPlane`** — Origin (lat/lng/alt), normal vector, X-axis direction, extents (rx/ry meters), row/col dimensions, channels.
- **`Channel`** — Named float channel with null value handling; either a float buffer or single value.

**Purpose:** Generic 2.5D raster data for views, sunlight, and other spatial analysis.

#### 1.15.7 — `builtenv/metrics.proto`
**Key Messages:**
- **`SummarizedMetrics`** — Solar metrics, new build metrics, operational energy, solar panels yield, sustainability, solar financials, overall score.
- **`OperationalEnergyMetrics`** — Baseline vs. actual annual energy usage in MWh.
- **`SolarPanelsYieldMetrics`** — Annual generated energy (MWh), installation size (MW), panel count, surface area.
- **`SolarFinancialMetrics`** — Purchase and lease scenarios with annual/25-year metrics: NPV, payback period, energy bill savings, incentives, net metering savings, total system cost.
- **`SustainabilityMetrics`** — 10-year, annual, and lifetime emissions with source breakdown (operational/embodied/transportation) and mitigation strategy breakdown (solar/heating electrification/materials/parking reduction).

**Purpose:** Comprehensive sustainability and financial analysis metrics for built environment designs.

#### 1.15.8 — `builtenv/design_content.proto`
**Key Messages:**
- **`DesignContent`** — Design state (SUCCEEDED/FAILED/RUNNING), built entities, summarized metrics, design iteration key, ID map, available view presets.
- **`DesignState`** — State machine for design generation.

**Purpose:** The actual content payload of a generated design.

#### 1.15.9 — `builtenv/new_build_run_inputs.proto`
**Key Messages:**
- **`NewBuildRunInputs`** — The comprehensive inputs for a new build design run:
  - `ZoningInputs` — Per-parcel zoning rules (coverage ratio, FAR, max height, green space ratio, setbacks), with default/overridden states
  - `UseTypeInputs` — Use type definitions with GFA allocation requirements
  - `UnitMixInputs` — Apartment/unit mix distributions per use type
  - `ProgramInputs` — Target GFA (sitewide or per-parcel), green space targets, parking targets (spots per 100 m² or per unit, surface/basement strategies)
  - `SustainabilityInputs` — Rooftop solar toggle, heating electrification, building material sourcing (BEST_PRACTICE/CONSERVATIVE), parking reduction
  - `MetricsInputs` — Raycasting, walkability, financial metric toggles
  - `BuildingInputs` — Building template configurations

**Purpose:** The urban planning input model. Allows users to specify zoning constraints, program targets, sustainability goals, and building preferences for automated design generation.

#### 1.15.10 — `builtenv/solar_run_inputs.proto`
**Key Messages:**
- **`SolarRunInputs`** — Cost parameters (roof/parking lot cost per W), electricity rates and escalators, net metering preference (EXCESS/NOT_APPLICABLE/ALL), financing parameters (debt fraction, loan rate, lease rates, PPA rate), annual electricity/fuel usage.

**Purpose:** Solar installation financial analysis inputs.

#### 1.15.11–1.15.14 — Edit Operations
- **`edit_design_inputs.proto`** — `EditDesignInputs` with `Edit` oneof covering 11 edit types: add/remove floors, convert building/park/parking lot between types, regenerate building, adjust block program.
- **`block_edit.proto`** — `ConvertBlockToParkEdit`, `AdjustBlockProgramEdit`.
- **`building_edit.proto`** — `AddFloorsEdit`, `RemoveFloorEdit`, `ConvertBuildingToParkEdit`, `ConvertBuildingToParkingLotEdit`, `RegenerateBuildingEdit`, `ConvertToBuildingEdit`.
- **`park_edit.proto` / `parking_lot_edit.proto`** — Park/parking lot conversion edits.

**Purpose:** Design iteration — allows users to modify generated designs through a structured edit graph.

#### 1.15.15 — Remaining Supporting Files
- **`use_type_class.proto`** — 10 use type classes: RESIDENTIAL, OFFICE, INDUSTRIAL, RETAIL, COMMUNITY, HOTEL, EDUCATION, MECHANICAL, PARKING, OTHER.
- **`building_far_range.proto`** — Floor area ratio estimates for building inputs and templates.
- **`design_content_id_map.proto`** — Maps internal use type IDs to display names and classes.
- **`design_view_preset.proto`** — View preset types (6 presets for different visualization modes).
- **`new_build_metrics.proto`** — `BuiltEntitySummarizedMetrics` (coverage, street wall, facade area, profit on cost, park quality) and `ParkQualityMetrics` (shadow/sun hours, green access).

---

### 1.16 — `google/internal/earth/v1/earth_mate/earth_mate.proto`

| Property | Detail |
|----------|--------|
| **Package** | `google.internal.earth.v1.earthmate` |
| **Dependencies** | `geo/earth/proto/commands`, `geo/earth/proto/earth_mate/*`, `shared.proto`, `net/proto2/contrib/validator`, `storage/datapol`, `wireless/android/privacy` |

**Key Messages:**

- **`ChatRequestWrapper`** — Client metadata + `EarthMateQueryRequest` (wrapper for Earth Mate chat).
- **`StreamChatRequest`** — Streaming chat with `EarthMateQueryRequest`.
- **`StreamChatResponse`** — Chat ID + oneof `PartialUpdate` or `FinalUpdate`.
- **`PartialUpdate`** — Streaming partial: agent thinking state, commands, output text, attributions, thought trace, status update.
- **`FinalUpdate`** — Final response: commands, output text, query execution metadata, viewport file attachment.
- **`RateRequestWrapper`** — Rating feedback for Earth Mate responses.
- **`AgentStatus`** — THINKING / PROCESSING lifecycle.
- **`AgentThinkingState`** — Status text for agent reasoning display.

**Purpose:** AI assistant ("Earth Mate") streaming chat API. Supports multi-turn conversational AI with streaming partial updates, command execution, attributions, and file attachments.

---

## 2. `google/api/` (11 files) — API Annotations

Standard Google API infrastructure annotations. All are proto3.

| File | Package | Key Content | Purpose |
|------|---------|------------|---------|
| **`annotations.proto`** | `google.api` | Extends `MethodOptions` with `HttpRule` (field 72295728) | Primary HTTP-to-RPC binding annotation |
| **`http.proto`** | `google.api` | `Http`, `HttpRule` (GET/PUT/POST/DELETE/PATCH/CUSTOM patterns, body, response_body, additional_bindings, media_upload/download, authorizations, CORS) | HTTP transcoding rules |
| **`client.proto`** | `google.api` | `Publishing`, `ClientLibrarySettings`, `MethodSettings`, `JavaSettings/CppSettings/PhpSettings/...`, `BatchingConfigProto`, `SelectiveGapicGeneration`, service/method extensions | Client library generation configuration |
| **`field_behavior.proto`** | `google.api` | 11 `FieldBehavior` enum values (OPTIONAL/REQUIRED/OUTPUT_ONLY/INPUT_ONLY/IMMUTABLE/IDENTIFIER/...), extends `FieldOptions` | Field semantics for code generation |
| **`visibility.proto`** | `google.api` | `Visibility`, `VisibilityRule` (selector, restriction, failure_mode), extends Service/Method/Message/Field/Enum/EnumValue options | API visibility control |
| **`launch_stage.proto`** | `google.api` | 8-stage enum: UNIMPLEMENTED→PRELAUNCH→EARLY_ACCESS→ALPHA→BETA→GA→DEPRECATED | API maturity tracking |
| **`policy.proto`** | `google.api` | `FieldPolicy`, `OrgPolicy`, `MethodPolicy`, `PolicyAspect`, `MetadataPolicy`, extends FieldOptions and MethodOptions | Resource policy/IAM integration |
| **`auditing.proto`** | `google.api` | `Auditing`, `AuditingRule` (selector, directive), extends FieldOptions and MethodOptions | Audit logging configuration |
| **`authz.proto`** | `google.api` | `AuthorizationRule` (selector, permissions), extends FieldOptions | Authorization rules |
| **`inclusion.proto`** | `google.api` | `ApiInclusion` (scopes), extends FileOptions | API scope inclusion |
| **`media.proto`** | `google.api` | `MediaUpload` (enabled, mime_types, max_size, resumable support), `MediaDownload` | Media upload/download specs |

**Cross-domain dependency:** These annotations are imported by virtually all Earth API proto files and the `google/longrunning/operations.proto`. They form the foundation of Google's API infrastructure — HTTP transcoding, client library generation, IAM policy, auditing, and visibility control.

---

## 3. `google/protobuf/` (7 files) — Standard Well-Known Types

Standard protobuf well-known types used throughout the codebase:

| File | Key Message(s) | Purpose |
|------|---------------|---------|
| **`any.proto`** | `Any` (type_url + value bytes) | Generic message wrapping |
| **`duration.proto`** | `Duration` (seconds + nanos) | Time durations |
| **`empty.proto`** | `Empty` | Void response placeholder |
| **`field_mask.proto`** | `FieldMask` (paths) | Partial update field selection |
| **`struct.proto`** | `Struct`, `Value`, `ListValue`, `NullValue` | Dynamic JSON-like data |
| **`timestamp.proto`** | `Timestamp` (seconds + nanos) | Absolute time points |
| **`wrappers.proto`** | `DoubleValue`, `FloatValue`, `Int64Value`, `BoolValue`, `StringValue`, `BytesValue` | Nullable primitive wrappers |

**Usage:** Heavily imported across all domains — timestamps for temporal data, durations for timeouts, field masks for partial updates, Any for generic payloads.

---

## 4. `google/type/` (8 files) — Standard Domain Types

Standard Google API common types:

| File | Key Content | Purpose |
|------|------------|---------|
| **`latlng.proto`** | `LatLng` (latitude, longitude doubles) | Geographic coordinates |
| **`color.proto`** | `Color` (RGBA with alpha wrapper) | Color representation |
| **`date.proto`** | `Date` (year, month, day) | Calendar dates |
| **`datetime.proto`** | `DateTime` (with timezone offset and TimeZone) | DateTime with timezone |
| **`dayofweek.proto`** | `DayOfWeek` enum (7 days) | Day enumeration |
| **`timeofday.proto`** | `TimeOfDay` (hours, minutes, seconds, nanos) | Wall-clock time |
| **`money.proto`** | `Money` (currency_code, units, nanos) | Monetary values |
| **`postal_address.proto`** | `PostalAddress` (full address fields) | Physical addresses |

---

## 5. `google/rpc/` (2 files) — Error Handling

| File | Package | Key Content | Purpose |
|------|---------|------------|---------|
| **`status.proto`** | `google.rpc` (proto3) | `Status` (code int32, message string, details []Any) | Standard RPC error status |
| **`error_extension.proto`** | `google.rpc` (proto2) | Extends `proto2.bridge.MessageSet` with `Status error_details_ext` | Error detail extension mechanism |

**Usage:** `Status` is used by `google.longrunning.Operation`, `builtenv.DesignGenerationInput`, and other async/callback patterns across the codebase.

---

## 6. `google/geo/type/viewport.proto`

| Property | Detail |
|----------|--------|
| **Package** | `google.geo.type` (proto3) |
| **Dependencies** | `google/api/field_behavior`, `google/api/inclusion`, `google/type/latlng` |

**Key Messages:**
- **`Viewport`** — Low and high `LatLng` points defining a bounding box.

**Purpose:** Standardized geographic viewport type for Geo APIs. Complementary to the Earth-internal `Viewport` in `shared.proto` (which uses north/south/east/west doubles).

---

## 7. `google/longrunning/operations.proto`

| Property | Detail |
|----------|--------|
| **Package** | `google.longrunning` (proto3) |
| **Dependencies** | `google/api/annotations`, `google/api/client`, `google/api/field_behavior`, `google/protobuf/any`, `google/protobuf/duration`, `google/protobuf/empty`, `google/rpc/status`, `net/proto2/proto/descriptor`, `third_party/boundary_proxy/proto_compare/annotation` |

**Key Messages & Service:**
- **Service `Operations`** — `ListOperations`, `GetOperation`, `DeleteOperation`, `CancelOperation`, `WaitOperation`. Full async operation lifecycle.
- **`Operation`** — name, metadata (Any), done flag, oneof result (error Status or response Any).
- **`OperationInfo`** — response_type, metadata_type — extends `MethodOptions` (field 1049) to annotate long-running RPCs.

**Purpose:** Standard async long-running operation service — used by Earth layer import/creation APIs for async processing.

---

## 8. `google/research/` — Research APIs

**Path:** `google/research/researchpartnerships/v1/rsgeofm/`
**Content:** Research partnerships for Geo Foundation Models (RSGeoFM). Minimal presence in this repository.

---

## 9. `knowledge/` (11 files) — Knowledge Graph

### 9.1 — `knowledge/graph/proto/triple.proto`
**Package:** `knowledge_graph` | **Dependencies:** `devtools/protoshop`, `google/api/inclusion`, `storage/datapol`, `storage/graph/bfg`

**Key Messages:**
- **`Triple`** — Classic RDF triple: subject (sub), predicate (pred), object (TripleObj), is_negation flag. Supports provenance chain, qualifier sets.
- **`TripleObj`** — Typed object values: id, string, URI, bool, int64, uint64, double, datetime, duration, s2cell_id, proto (generic protobuf), nested struct. With locale.
- **`NestedStruct`** — Predicate-object groups for compound values.
- **`Provenance`** — Rich provenance: process, source URL/doc ID, source category (THIRD_PARTY/CURATION/PARTNER_FEED/EXTRACTION), restrictions (REQUIRES_CITATION, REQUIRES_PCOUNSEL_REVIEW), SPII certification, Livegraph metadata, policy metadata.
- **`TripleSet` / `Qualifier` / `QualifierSet`** — Triple collections with qualifiers.
- **`SourceContentReference`** — ID namespace + ID for content provenance.

**Purpose:** Core Knowledge Graph data model. The `Triple` message is the fundamental unit of structured knowledge — subjects linked to objects via predicates with rich provenance tracking. Used as a `MessageSet` extension for embedding in other protos.

### 9.2 — `knowledge/graph/schema/storage/format/options.proto`
**Package:** `kg_schema.fmt`

Extends `MessageOptions` and `FieldOptions` with formatting options (`MessageFormatOptions`: single_line, sort_by; `FieldFormatOptions`: is_sorted). Handles pretty-printing of KG schema storage.

### 9.3 — `knowledge/graph/protomesh/protomesh.proto`
Protomesh integration for Knowledge Graph.

### 9.4 — `knowledge/graph/data_governance/proto/attributes/location.proto`
Data governance location attributes for the Knowledge Graph.

### 9.5 — `knowledge/graph/util/datetime/datetime.proto`
Knowledge Graph DateTime utility type.

### 9.6 — `knowledge/proto/queryunderstandingservice/` (4 files)
Query Understanding Service resolution extensions:
- `query_resolution_extensions.proto` — Query resolution pipeline config
- `result_extensions.proto` — Individual query result extensions
- `result_set_extensions.proto` — Result set metadata
- `per_query_extensions.proto` — Per-query configuration

### 9.7 — `knowledge/verticals/crisisresponse/sos/proto/` (2 files)
Crisis response vertical integration:
- `alert_severity_level.proto` — Alert severity enumeration
- `event_type.proto` — Crisis event type classification

---

## 10. `gws/` (15 files) — Google Web Server

### 10.1 — `gws/mothership/` (Mothership RPC Framework)
**Package:** `gws.mothership`

**Key Files:**
- **`mothership_options.proto`** — Extends Service/Method/Message options with `MothershipRpcOptions`, `MothershipRequestOptions`, `MothershipResponseOptions`. Controls field propagation between client requests and server contexts, streaming behavior, HTTP endpoint load balancing.
- **`http_endpoint_load_balancing_type.proto`** — Load balancing type enumeration.

**API Data Types:**
- `api/v1/common/app/applink.proto` — Application deep links
- `api/v1/common/images/` (5 files) — Image, ImageId, ScalableImage, RasterImage, ImageSource — comprehensive image representation
- `api/v1/common/text/style.proto`, `styled_text.proto` — Text styling
- `api/v1/common/net/url.proto` — URL type

**Purpose:** Google's internal RPC framework ("Mothership") for web serving. Provides field-level control over request/response context propagation, load balancing, and common web data types (images, text, URLs).

### 10.2 — `gws/shared/protos/` (4 files)
Shared GWS context types:
- **`language_context.proto`** — `LanguageContext` (language_code)
- **`web_parameters_request_context.proto`** — Web request parameters
- **`geolocation_context.proto`** — Geolocation context for web requests
- **`user_ip_context.proto`** — User IP address context

**Purpose:** Request context propagation primitives — language, location, IP, and web parameters that flow through the GWS serving stack.

---

## 11. `storage/` (9 files) — Datapol, GoogleSQL, Graph Storage

### 11.1 — `storage/datapol/annotations/proto/` (3 files)

#### `semantic_annotations.proto`
**Package:** `datapol`

The **most widely imported annotation file** in the entire project. Provides:
- **`Qualifier`** — 21 boolean flags for data classification: is_public, is_google, other_user, is_partner, is_publisher, has_explicit_consent, is_encrypted, non_user_location, limited_access, auto_tombstone, auto_delete_within_wipeout, auto_delete_within_180_days, is_access_target, is_user_visible, is_access_grantee, is_actor, is_action_target, is_action_time, is_internal_only, is_quasi_identifier.
- **`LocationQualifier`** — Location precision: non_user_location, user_indirect_location, user_place_of_interest, precise_location, country_level_location.
- **`SemanticType`** — **150+ semantic type enumerations** covering:
  - Pseudonymous IDs (ZWIEBACK, PREF, BISCOTTI, ANALYTICS, etc.)
  - Identifying IDs (EMAIL, NAME, PHONE_NUMBER, GAIA, USERNAME)
  - SPII (GOVERNMENT_ID, HEALTHCARE_INFO, RACE_ETHNICITY, POLITICAL_BELIEFS, etc.)
  - Payments (CHD_PAN, CHD_INFO, PAYMENTS_TRANSACTION_INFO)
  - Network (IP_ADDRESS, HARDWARE_ID, USER_AGENT)
  - Location (PRECISE/COARSE_LOCATION)
  - Content (USER_QUERY, AUDIO, MUSIC, EMAIL_CONTENT, DOCUMENT_CONTENT)
  - Security (SECURITY_KEY, ACCOUNT_CREDENTIAL)
  - Cloud (CLOUD_PROJECT_ID, CLOUD_IAM_ROLE)
  - Google-generated data (OPERATIONAL_METRICS, USER_METADATA)
- **`FieldDetails` / `MessageDetails` / `EnumDetails`** — Detailed annotation containers.
- **Extensions** — Extends FieldOptions (semantic_type, qualifier, location_qualifier, field_details, data_format, retention), MessageOptions, FileOptions, EnumOptions.

**Purpose:** **Data classification and privacy governance framework.** Every proto field in Google can be annotated with its semantic type (what kind of data it contains), qualifiers (who can access it), and location precision. This feeds automated privacy reviews, data retention policies, and access control.

#### `datapol_classification.proto`
**Package:** `datapol.classification`

Extends `EnumValueOptions` with `Options` (implies, description, default_semantic_context) for classification hierarchy.

#### `retention_annotations.proto`
Retention specification annotations.

### 11.2 — `storage/googlesql/public/proto/` (2 files)
- `wire_format_annotation.proto` — GoogleSQL wire format annotations
- `type_annotation.proto` — GoogleSQL type annotations

### 11.3 — `storage/graph/bfg/proto/` (4 files)
Bigstore File Group (BFG) metadata:
- `bfg_data.proto` — Core BFG data structures
- `livegraph_metadata.proto` — Livegraph provenance metadata (imported by Knowledge Graph)
- `policy_metadata.proto` — Policy metadata for BFG files
- `spii_certification.proto` — SPII (Sensitive PII) certification data

---

## 12. `travel/` (8 files) — Hotels, Transport, Attractions

| File | Package | Key Content | Purpose |
|------|---------|------------|---------|
| **`hotels/servers/.../annotation_type.proto`** | Hotel rank annotation type enum | Rank annotation configuration |
| **`frontend/common/proto/amenities/amenities.proto`** | Hotel/place amenity types | Amenity categorization |
| **`frontend/common/proto/image.proto`** | Travel image type | Image representation |
| **`frontend/common/proto/entity_type.proto`** | Travel entity type enum | Entity classification |
| **`guide/attractile/proto/category.proto`** | Attraction category | Points of interest categories |
| **`transport/proto/shared/request_live_pricing_mode.proto`** | Live pricing mode enum | Transport pricing mode |
| **`transport/proto/shared/client_enums.proto`** | Transport client enums | Shared transport enums |
| **`transport/proto/price/booking_module_options.proto`** | Booking module pricing options | Transport booking pricing |

**Purpose:** Google Travel verticals — hotel ranking annotation types, amenity taxonomies, attraction categories, and transport pricing/booking. Used by Earth's travel-related features.

---

## 13. `search/` (8 files) — Search Context, Logging, Rendering

### 13.1 — `search/context/contextgeneration/context_atom_container.proto`
Search context atom container — used for search context propagation.

### 13.2 — `search/logging/` (2 files)
- `propagation/logging_sensitivity.proto` — Logging sensitivity classification
- `redaction/enums.proto` — Log redaction enumerations

### 13.3 — `search/rendering/xuikit/elements/proto/` (5 files)
XUIKit elements protocol for search result rendering:
- `elements_output.proto` — Core elements output
- `elements_output_extensions.proto` — Output extensions
- `data_store_mutation_payload.proto` — Data store mutations
- `data_store_batch_update.proto` — Batch update payload
- `js_module_set_update.proto` — JavaScript module update payload

**Purpose:** Google Search rendering infrastructure — how search results are rendered on the client via XUIKit elements.

---

## 14. `privacy/` (8 files) — Data Governance

### 14.1 — `privacy/data_governance/attributes/proto/` (2 files)

#### `classification.proto`
**Package:** `privacy.data_governance.attributes.classification` (proto3)

**Key Messages:**
- **`Category`** — Data classification: location (with LocationType, Coarse, Traces sub-enums), financial, payment_instrument, health, hipaa, employee, children_product, audio_data, has_xfood, minors_data, user_class (managed accounts), smart_home, children data lifecycle type.
- **`GeoLocation`** — Location type (USER_LOCATION, USER_DIRECT/INDIRECT/CONTEXTUAL LOCATION, USER_PLACE_OF_INTEREST, USER_HOME/WORK_LOCATION, NOT_A_USER_LOCATION), coarse level (COUNTRY-level, 1+1-level, 3+1-level), traces (multiple/single location identification).
- **`MinorData`** — Teens + Children with sub-categories (unicorns, griffins, edu_children).
- **`UserClass`** — Managed (non-edu/edu) and any managed account flags.

**Key Enums:**
- **`Source`** — Data origin: GOOGLE, USER, END_USER, CUSTOMER, PUBLIC, THIRD_PARTY, BUSINESS_USER.
- **`SemanticContext`** — METADATA, CONTENT, CORE_CONTENT, SECURITY_CONFIGURATION, CONFIGURATION, ATTRIBUTE.
- **`Confidentiality`** — PUBLIC, CONFIDENTIAL, NEED_TO_KNOW.
- **`Identifiability`** — IDENTIFIABLE, PSEUDONYMOUS, ANONYMOUS, TWO_PHASE_AGGREGATED.
- **`Pseudonymization`** — 11 levels of anonymization granularity.
- **`DatasetTag`** — HULK, OOLONG, PHOTOS data, GMAIL, PAYMENTS, LOCAL_REVIEWS, etc.

Extends `EnumValueOptions` and `FieldOptions` with label, description, parent, expected_confidentiality, disabled, go_link, deprecated_message fields.

**Purpose:** **Privacy classification framework** — the most comprehensive data governance classification system in the project. Every data field can be annotated with its category, source, identifiability, pseudonymization level, and confidentiality. Feeds privacy review automation.

#### `purpose.proto`
**Package:** `privacy.data_governance.attributes` (proto3)

**Key Messages:**
- **`ProcessingPurpose`** — Cross-product processing, cross-use flags, ads processing purpose.
- **`Purpose` enum** — 33 processing purposes: PROVISION_OF_SERVICE, ADS_RELATED_PROVISION, PRODUCT_PERSONALIZATION, CONTEXTUALIZATION, REVENUE_GENERATION, USER_SUPPORT, CLOUD_PROCESSING_INFRASTRUCTURE, ACCOUNT_MANAGEMENT, MODEL_TRAINING, VERIFICATION_TESTING, DEBUGGING_AND_MONITORING, BUSINESS_ANALYSIS, MARKET_RESEARCH, RESEARCH_EXPERIMENTATION, TRUST_SAFETY (ANTI_FRAUD/ANTI_ABUSE/SECURITY), COMPLIANCE_LEGAL_SUPPORT (TAKEOUT/ELI), and more.

**Purpose:** Processing purpose declaration for privacy compliance — defines why data is being processed under GDPR and similar regulations.

### 14.2 — `privacy/pattributes/` (4 files)
Privacy attributes framework:
- `annotations/proto_field.proto` — Proto field annotation integration
- `containers/proto_field/proto_field_attributes.proto` — Container-specific attributes
- `containers/proto_field/proto_field_upload_justification.proto` — Upload justification
- `public/proto/collection_basis.proto`, `collection_basis_expression.proto` — Collection basis and consent basis expressions

### 14.3 — `privacy/ads/user_data_enforcement/data-usage.proto`
Ads-specific data usage attributes.

---

## 15. `java/` (20 files) — JSPB and Java Protos

### 15.1 — Java Protobuf Bridge (JSPB) — `java/com/google/apps/jspb/`
**Package:** `jspb`

4 files defining the Java Script Protobuf Bridge:
- **`jspb.proto`** — Core JSPB extensions: `JsType` enum (INT52/NUMBER/STRING/GBIGINT), field options (ignore, jstype), message options (message_id, generate_xid), file options (js_namespace, legacy nullable accessors, binary format methods).
- **`jspb_generate_object_format.proto`** — Object format generation
- **`jspb_lazy_extension.proto`** — Lazy extension loading
- **`jspb_disable_randomization.proto`** — Randomization control

**Purpose:** JavaScript protobuf bridge — defines how proto messages are mapped to JavaScript types and serialization behavior.

### 15.2 — Other Java Protos
- **`java/com/google/protobuf/contrib/autoprotocopier/annotations.proto`** — Auto protocopier annotations
- **`java/com/google/protobuf/contrib/j2cl/options/js_enum.proto`** — J2CL JS enum options
- **`java/com/google/i18n/phonenumbers/phonenumber.proto`** — Phone number type
- **`java/com/google/geo/production/antiscraping/`** (2 files) — Anti-scraping geo data type annotations and limited response annotations
- **`java/com/google/geo/earth/operations/proto/`** (4 files) — Earth async operation metadata: `operation_metadata`, `operation_type`, `client_supplied_data`, `operation_progress`
- **`java/com/google/wireless/googlenav/proto/user_event3_enums.proto`** — User event enums
- **`java/com/google/travel/frontend/hotels/search/protos/`** (6 files) — Hotel search: `map`, `notable_category_enum`, `highlight_type`, `notable`, `nearby_entity`, `previous_trigger_decision`

---

## 16. `cityblock/` (6 files) — Street-Level Imagery (CityBlock)

| File | Package | Key Content | Purpose |
|------|---------|------------|---------|
| **`public/pose.proto`** | `cityblock` (editions) | `Pose` (lat/lng/alt + roll/pitch/heading in degrees), `PoseCovariance` (covariance matrix floats) | 6-DOF camera pose for street-level imagery |
| **`base/collection_type.proto`** | CityBlock | Collection type enumeration | Imagery collection type classification |
| **`base/vehicles.proto`** | CityBlock | Vehicle specification type | Collection vehicle definition |
| **`pose/service/version.proto`** | CityBlock | Pose service version | Service versioning |
| **`streetsmart/business_discovery/public/imagery_observation.proto`** | StreetSmart | Imagery observation for business discovery | Business storefront imagery |
| **`streetsmart/business_discovery/tools/nerf/pano_selection_result.proto`** | StreetSmart | NeRF pano selection result | Neural Radiance Field panorama selection |

**Purpose:** Google's street-level imagery and mapping system (CityBlock/StreetSmart). Handles camera poses, vehicle metadata, imagery collection types, and business discovery from street-level photos. Notable for being a proto **editions** file.

---

## 17. `photos/` (5 files) — FIFE Serving

| File | Package | Key Content | Purpose |
|------|---------|------------|---------|
| **`fife/fife_status.proto`** | FIFE | FIFE image serving status | Image serving pipeline status |
| **`fife/logs_types.proto`** | FIFE | FIFE log types | Serving log type definitions |
| **`protobuff/status/retryable_extension.proto`** | Photos | Retryable status extension | Error retry classification |
| **`serving/client/urls/environments/osid_domain.proto`** | Photos | OSID domain configuration | Serving URL domain config |
| **`serving/integrations/identifiers/signing_keys/request_signing_key_info.proto`** | Photos | Request signing key info | Integration security keys |

**Purpose:** Google Photos FIFE (FIFE Is Fast Encoding) image serving infrastructure. Android privacy annotations collection basis definitions.

---

## 18. `net/` (7 files) — Proto2 Infrastructure

| File | Package | Key Content | Purpose |
|------|---------|------------|---------|
| **`proto2/proto/descriptor.proto`** | `proto2` | Full `FileDescriptorSet`, `FileDescriptorProto`, `DescriptorProto`, `FieldDescriptorProto`, all option messages | Protobuf descriptor reflection — the proto2 schema definition |
| **`proto2/bridge/proto/message_set.proto`** | `proto2.bridge` | `MessageSet` — extensible message container | Backward-compatible message extension mechanism |
| **`proto2/contrib/validator/annotations.proto`** | `validator` | `FieldValidationRule` (predicates, oneof, element predicates), `Definitions`, `OneOfGroup`, extends Message/Field/Oneof options | Proto2 field validation framework |
| **`proto2/contrib/http/options.proto`** | HTTP annotations | HTTP protocol options for proto2 |
| **`proto2/contrib/output_source_markup/options.proto`** | Output source markup | Code generation source markup |
| **`proto2/contrib/js_proto/public/field_annotations.proto`** | JSPB | JS proto field annotations |
| **`loadshedding/proto/request_qos.proto`** | Load shedding | Request QoS definitions for load shedding |

**Purpose:** Proto2 infrastructure layer. `descriptor.proto` is the fundamental reflection schema for all proto2 messages. `message_set.proto` enables the `MessageSet` extension mechanism used by Knowledge Graph triples and error details. The validator framework provides runtime field validation.

---

## 19. `third_party/` (5 files)

| File | Key Content | Purpose |
|------|------------|---------|
| **`boundary_proxy/proto_compare/annotation.proto`** | Proto comparison annotations | Boundary proxy testing utilities |
| **`redwood/infrastructure/proto/linear_algebra.proto`** | Linear algebra types (vectors, matrices) | 3D math for rendering |
| **`protobuf/cpp_features.proto`** | C++ protobuf feature flags | Edition-based C++ codegen |
| **`protobuf/internal_options.proto`** | Internal protobuf compiler options | Protoc internal config |
| **`java/protobuf/java_features.proto`** | Java protobuf feature flags | Edition-based Java codegen |

---

## 20. Singletons (<5 files per domain)

### 20.1 — `ads/` (3 files)
- `ads/travel/base/hotel_amenities.proto` — Hotel amenity enumeration
- `ads/travel/base/hotel_set_name_structure_enum.proto` — Hotel set name structure
- `ads/travel/hotelpricing/protos/deals.proto` — Hotel pricing deals

**Purpose:** Ads travel vertical — hotel amenity and pricing structures for ad serving.

### 20.2 — `apps/` (1 file)
- `apps/framework/data/caching_annotations.proto` — App framework data caching annotations

### 20.3 — `devtools/` (2 files)
- `devtools/protoshop/public/parsing_options/parsing_options.proto` — ProtoShop parsing options
- `devtools/staticanalysis/pipeline/analyzers/proto_best_practices/proto/optouts.proto` — Static analysis opt-out definitions

### 20.4 — `experiments/` (1 file)
- `experiments/framework/extensions/heterodyne/proto/experiment_ids.proto` — Experiment ID definitions for the Heterodyne experiment framework.

### 20.5 — `frameworks/` (2 files)
- `frameworks/client/data/data_annotation.proto` — Client data annotation framework
- `frameworks/testing/rpcreplay/processors/rpc_replay_field_option.proto` — RPC replay testing annotations

### 20.6 — `i18n/` (1 file)
- `i18n/localization/proto/localized_text.proto` — Localized text with language support

### 20.7 — `identity/` (1 file)
- `identity/identifiers/proto/namespaced_identifier.proto` — Namespaced identifier type for identity systems

### 20.8 — `lens/` (1 file)
- `lens/infra/analytics/privacy/copy.proto` — Lens analytics privacy attribution

### 20.9 — `localsearch/` (1 file)
- `localsearch/lite/intent.proto` — Local search intent classification

### 20.10 — `location/` (2 files)
- `location/country/telephonenumber.proto` — Country-level phone number type
- `location/japan/jartic/.../jartic_incident_attribution.proto` — Japan traffic incident attribution

### 20.11 — `metaweb/` (1 file)
- `metaweb/data/topictable/topic.proto` — Metaweb topic table data model

### 20.12 — `monitoring/` (8 files — streamz)
- `monitoring/streamz/proto/streamz.proto` — Streamz metric collection framework
- `monitoring/streamz/proto/distribution.proto` — Metric distribution types
- `monitoring/streamz/proto/bucketer.proto` — Bucketing configuration
- `monitoring/streamz/proto/streamz_service_objects.proto` — Service object definitions
- `monitoring/streamz/proto/streamz_announcement.proto` — Streamz announcements
- `monitoring/streamz/proto/visibility.proto` — Metric visibility controls
- `monitoring/streamz/proto/exemplar_extensions.proto` — Metric exemplar extensions
- `monitoring/streamz/public/preset_roots_config.proto` — Preset monitoring roots

### 20.13 — `quality/` (1 file)
- `quality/ranklab/io/proto/proto_options.proto` — RankLab quality annotation options

### 20.14 — `repository/` (1 file)
- `repository/docchart/extraction/businesshours.proto` — Business hours extraction from documentation

### 20.15 — `searchbox/` (2 files)
- `searchbox/protos/log_enums.proto` — Search box logging enums
- `searchbox/protos/aim/tools.proto` — AI Model tools for searchbox

### 20.16 — `security/` (1 file)
- `security/loas/l2/internal/securewrapper/multihop_clients/boundary_proxy.proto` — Boundary proxy security configuration for multi-hop secure wrapper clients.

### 20.17 — `stats/` (1 file)
- `stats/io/proto/expvar_typed.proto` — Typed exported variable definitions for statistics.

### 20.18 — `testing/` (1 file)
- `testing/metricstore/proto/perf.proto` — Performance metric storage definitions.

### 20.19 — `util/` (4 files)
- `util/task/status.proto` — `StatusProto` with code, space, message, canonical_code, MessageSet extension support. Alternative to `google.rpc.Status`.
- `util/task/codes.proto` — Standard status code enumeration
- `util/task/contrib/proto_status/proto_status.proto` — Proto status contribution utilities
- `util/geometry2d/r2.proto` — 2D geometry primitives (R² point)

### 20.20 — `video/` (2 files)
- `video/youtube/utils/elements/templates/proto/eml_parcel.proto` — YouTube EML parcel type
- `video/youtube/utils/elements/proto/annotations.proto` — YouTube element annotations

### 20.21 — `webserver/` (3 files)
- `webserver/shared/gws/eval/gws_eval_proto_options.proto` — GWS evaluation options
- `webserver/shared/gws/experiments/proto/client_data_header.proto` — Client data header for experiments
- `webserver/shared/maps/logging/visibility.proto` — Maps logging visibility controls

### 20.22 — `webutil/` (1 file)
- `webutil/html/types/proto/html.proto` — HTML type representation

### 20.23 — `wireless/` (3 files)
- `wireless/android/privacy/annotations/proto/collection_basis_annotations.proto` — Android privacy collection basis (heavily imported across Earth APIs)
- `wireless/android/privacy/annotations/proto/collection_basis_annotations_enums.proto` — Collection basis enum definitions
- `wireless/android/gsa_dynamic_updates/release/proto/velour_compat.proto` — Velour compatibility for GSA dynamic updates

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    Google Earth Studio WASM                      │
│                     Proto Dependency Graph                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────── APPLICATION LAYER ───────────────────┐    │
│  │  google/internal/earth/v1/ (48 files)                   │    │
│  │  ┌──────────┬──────────┬──────────┬──────────────────┐  │    │
│  │  │  billing │ builtenv │  layers  │ earth_mate (AI)  │  │    │
│  │  │ licenses │  designs │  data    │ chat/streaming   │  │    │
│  │  │ quotas   │ solar P  │ analysis │ agent reasoning  │  │    │
│  │  │ rate cards│ zoning  │ imports  │ commands+attach  │  │    │
│  │  ├──────────┼──────────┼──────────┼──────────────────┤  │    │
│  │  │  shared  │  config  │  photos  │ terrain/user/    │  │    │
│  │  │ DataLayer│ features │ thumbns  │ settings/quota   │  │    │
│  │  └──────────┴──────────┴──────────┴──────────────────┘  │    │
│  └──────────────────────────────────────────────────────────┘    │
│                              │                                    │
│  ┌─────────────────── API INFRASTRUCTURE ───────────────────┐    │
│  │ google/api/ (11 files): HTTP, visibility, policy, audit   │    │
│  │ google/longrunning/: Async operations                     │    │
│  │ google/rpc/: Status error handling                        │    │
│  └──────────────────────────────────────────────────────────┘    │
│                              │                                    │
│  ┌─────────────────── STANDARD TYPES ───────────────────────┐    │
│  │ google/protobuf/: Any, Duration, Empty, FieldMask,       │    │
│  │   Struct, Timestamp, Wrappers                            │    │
│  │ google/type/: LatLng, Color, Date, Money, PostalAddress  │    │
│  │ google/geo/type/: Viewport                               │    │
│  └──────────────────────────────────────────────────────────┘    │
│                              │                                    │
│  ┌─────────────────── PRIVACY & GOVERNANCE ─────────────────┐    │
│  │ storage/datapol/: Semantic types (150+), qualifiers      │    │
│  │ privacy/data_governance/: Classification, purpose        │    │
│  │ privacy/pattributes/: Collection basis, consent          │    │
│  │ wireless/android/privacy/: Android privacy (widely used) │    │
│  └──────────────────────────────────────────────────────────┘    │
│                              │                                    │
│  ┌─────────────────── INFRASTRUCTURE ───────────────────────┐    │
│  │ net/proto2/: descriptor, message_set, validator          │    │
│  │ gws/mothership/: RPC framework, request propagation      │    │
│  │ java/jspb/: JavaScript protobuf bridge                   │    │
│  │ knowledge/graph/: Knowledge Graph triple model           │    │
│  │ third_party/: Editions, linear algebra, proto compare    │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────── VERTICALS ────────────────────────────┐    │
│  │ travel/ hotels, transport, attractions                   │    │
│  │ search/ rendering, logging, context                      │    │
│  │ cityblock/ street-level imagery                          │    │
│  │ photos/ FIFE image serving                               │    │
│  │ ads/ travel hotel pricing                                │    │
│  │ monitoring/ streamz metrics                              │    │
│  │ video/ YouTube elements                                  │    │
│  └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Key Cross-Cutting Dependencies

1. **`storage/datapol/annotations/proto/semantic_annotations.proto`** — Imported by virtually every Earth API proto file. Provides the foundational privacy classification framework.

2. **`wireless/android/privacy/annotations/proto/collection_basis_annotations.proto`** — Android privacy collection basis — imported by most Earth API files.

3. **`net/proto2/proto/descriptor.proto`** — The proto2 reflection schema — basis for all annotation extensions.

4. **`google/protobuf/timestamp.proto`** — Used everywhere for temporal data.

5. **`google/api/*.proto`** — HTTP, field behavior, and visibility annotations used throughout.

### Statistics

| Domain | File Count | Proto Syntax |
|--------|-----------|-------------|
| `google/internal/earth/v1/` | 48 | Mostly proto2; `capability.proto`, `knowledge_registry.proto` proto3 |
| `google/api/` | 11 | All proto3 |
| `google/protobuf/` | 7 | All proto3 |
| `google/type/` | 8 | Mixed proto2/proto3 |
| `knowledge/` | 11 | proto2 |
| `gws/` | 15 | proto2 |
| `storage/` | 9 | proto2 |
| `travel/` | 8 | Mixed |
| `search/` | 8 | proto2 |
| `privacy/` | 8 | proto3 |
| `java/` | 20 | proto2 |
| `cityblock/` | 6 | proto2 (+ 1 editions) |
| `photos/` | 5 | Mixed |
| `net/` | 7 | proto2 |
| `third_party/` | 5 | Mixed |
| Singletons | ~50 | Mixed |
| **Total** | **~226** | **~85% proto2, ~14% proto3, <1% editions** |
