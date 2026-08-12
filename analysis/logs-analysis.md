# Logs Proto Analysis — Event Logging & Analytics Schema Layer

**Total files analyzed:** 182 `.proto` files across 22 sub-packages.

---

## Directory Structure Overview

```
logs/
├── eventid/           (1 file)   — Event ID infrastructure
├── gws/public/tags/   (1 file)   — GWS tag options for VE logging
├── maps/              (2 files)  — Feature ID, VE logging options
└── proto/
    ├── ads/travel/          (2 files)  — Hotel ads annotations & pricing
    ├── feature/             (2 files)  — TreeRef & offset identifier
    ├── geo/
    │   ├── ar/              (2 files)  — AR location & pose
    │   ├── earth/app/       (9 files)  — Main Earth event log + sub-events
    │   └── transportation/  (2 files)  — Trip logs & affordance vectors
    ├── hotels/              (1 file)   — Hotel feature data
    ├── logs_annotations/    (1 file)   — PII/identifier annotations
    ├── maps/
    │   ├── directions/      (35 files) — Directions MRP, customization, copilot, tolls
    │   ├── geoevents/       (1 file)   — GeoEvents field annotations
    │   ├── limo/proto/      (4 files)  — Ride-hailing (Limo) logging
    │   ├── mobile/          (3 files)  — Navigation session events
    │   ├── pathfinder/      (21 files) — Pathfinder client & server logging
    │   ├── roadtraffic/     (4 files)  — Traffic models & routability
    │   ├── shared/          (10 files) — Shared geometry, travel intent, lodging
    │   ├── tactile/         (13 files) — Directions tactile UI logging
    │   ├── transit/         (21 files) — Transit API, fares, alerts, cost models
    │   └── vms/             (3 files)  — Lane elements, roadview, sensor observations
    ├── searchbox/           (6 files)  — Search box stats & actions
    └── visual_element/      (14 files) — Visual element click tracking & UI logging
```

---

## 1. CORE INFRASTRUCTURE

### 1.1 `logs/eventid/eventid.proto`
- **Package:** _(none)_
- **Key Messages:**
  - `EventIdMessage` — `time_usec`, `server_ip`, `process_id`; extends proto2 MessageSet for global event correlation
  - `ClientEventIdMessage` — wraps `EventIdMessage` + `client_counter`
- **Purpose:** Global event identity — uniquely identifies every logged event across the entire Google logging ecosystem
- **Dependencies:** `jspb`, `message_set`, `semantic_annotations`

### 1.2 `logs/maps/featureid.proto`
- **Package:** `logs_maps`
- **Key Messages:** `FeatureIdProto` — `cell_id` (fixed64), `fprint` (fixed64)
- **Purpose:** S2 cell + fingerprint-based feature identifier for geospatial entities; used by virtually all maps/logging protos
- **Dependencies:** `google/api/inclusion`, `jspb`, `semantic_annotations`

### 1.3 `logs/gws/public/tags/tag_options.proto`
- **Package:** `logs`
- **Key Messages:** `TaggingFieldOptions` — `key_id`, `key`, `contact`, `values_file`, effects enum (EVE, IGSA_DASH, RANKING, AGSA_DASH, GEOEVENTS, SGSESSIONS)
- **Purpose:** GWS tagging metadata for VE (Visual Element) logging field annotations

### 1.4 `maps/logs/logging/ve_logging_options.proto`
- **Package:** `ve_log`
- **Key Extensions:** `msg`, `result`, `fld`, `only`, `ved`, `ei`, `href_attr`, `rewrite_attr`, `ve_whitelist`, `ignored` on FieldOptions/MessageOptions
- **Purpose:** Annotations for VE (Visual Element) logging infrastructure

---

## 2. MAIN EARTH EVENT LOG (89 Event Types)

### 2.1 `logs/proto/geo/earth/app/earth_log.proto` — **THE MAIN FILE**
- **Package:** `geo.earth.app`
- **Key Message:** `EarthEvent` with `Type` enum (L27-L1028, **89 event type categories**, 400+ discrete values)

| Event Category | Range | Count | Coverage |
|---|---|---|---|
| Crash/Load/Startup | 0–107 | ~15 | Earth crashes, load times, memory, cache, startup |
| Knowledge Card (KC) | 201–222 | ~20 | KC open/close/swipe/fly/collapse/expand |
| Search | 301–325 | ~25 | Search open, suggestions, results, history, voice, cloud |
| Earth Feed/Voyager | 401–418 | ~18 | Feed grid, tours, balloons, YouTube, panel |
| Street View | 501–518 | ~18 | Pegman, pano capture/share, timeline |
| Map Style | 601–635 | ~30 | 3D imagery toggle, clouds, gridlines, timelapse |
| Navigation/Controls | 701–764 | ~15 | My location, compass, zoom, nav globe, Pegman |
| Time Controls | 801–803 | 3 | Time controls play/pause/slider |
| Photos Layer | 900–903 | 4 | Photos layer on/off/thumbnails |
| General Actions | 1001–1028 | ~25 | Image save, share, deep links, screenshots, paste |
| Out of Box | 1100–1104 | 5 | Out-of-box experience flow |
| Measure Tool | 1110–1131 | ~25 | Distance, area, slope, units, save to project |
| Lightbox | 1200–1208 | 7 | Media lightbox open/close/gallery |
| Historical Imagery | 1250–1259 | 10 | HI mode enter/exit, date select, step forward/back |
| Timelapse | 1275–1283 | 9 | Timelapse mode, pause/play, speed, switch to HI |
| My Places | 1300–1320 | ~15 | My Places open/close/import from Drive/KML |
| Play Mode | 1350–1362 | ~13 | Play mode start/exit/TOC/share/pick |
| Notifications | 1400–1405 | 6 | Notification enrollment, topics, foreground receipt |
| Toolbar & Shortcuts | 1600–1621 | ~22 | Toolbar actions, shortcuts |
| Nav Menu | 1700–1720 | ~22 | Nav menu items (search, explore, my places, etc.) |
| Native Library | 1800–1802 | 3 | Native library load events |
| Projects View | 2000–2016 | ~15 | Cloud/local project create, import KML, CSV |
| Document Operations | 2100–2232 | ~30 | Doc operations, delete, export, add features, edit |
| Content Creation | 2300–2506 | ~20 | CC toolbar, draw line, drop placemark |
| Save to Project | 2600–2608 | 9 | Save to project flow |
| Feature Preview/Balloon | 2800–3052 | ~20 | Feature cards, balloons, property editor |
| Property Editor | 3100–3173 | ~60 | PE title, description, style, photo, 3D model transforms |
| Icon/Color Pickers | 3500–3801 | ~12 | Icon picker, link dialog, map move, color picker |
| Quick Sharing | 3900–3903 | 4 | Copy, Facebook, Twitter sharing |
| Drawing Tool | 4000–4003 | 4 | Drawing area/distance |
| Document Import/Export | 4050–4074 | ~25 | KML/cloud import/export, style copy/paste |
| Homescreen | 4100–4158 | ~50 | Homescreen shown/dismiss/create/open/sort/filter |
| Feature Info | 5000–5505 | ~10 | Media update, feature info copied/selected/elevation |
| Frame Rate & Startup | 6000–6057 | ~14 | Frame rate buckets, startup time buckets |
| WebGL | 6500–6502 | 3 | WebGL support detection |
| Projects List | 7000–7009 | 10 | Project list sorting (Drive/KML) |
| Earth Mate (AI) | 8000–8042 | ~40 | Earth Mate open/submit/OIS/thumb/generated layers |
| Industry Selector | 9000–9010 | 10 | Industry selector survey flow & map use cases |
| Billing | 10000–10029 | ~30 | Billing plans, rate cards, upgrade dialogs, paygates |
| Layers/Data Catalog | 11000–11042 | ~35 | Layer show/select/filter/style/delete/search |
| Undo/Redo | 12000–12501 | 4 | Global undo/redo |
| Request Access | 13000–13003 | 4 | Access request flow |
| Area Filter | 14000–14004 | 5 | Area filter panel open/close/apply |
| Image Generator | 15000–15014 | ~15 | AI image generation flow |
| User Import | 16000–16010 | ~10 | File import, 3D model loading |
| On-Demand Analysis | 17000–17063 | ~60 | Contour/slope/aspect/cut-fill analysis tools |
| KML Editor | 18000–18002 | 3 | KML editor dialog |
| Classify with AI | 18200–18205 | 6 | AI classification |
| Flight Simulator | 19000–19002 | 3 | Flight simulator start/stop/crash |
| Copy Project | 19100–19109 | 10 | Copy project/mymaps to project |
| Change Detection | 19200–19204 | 5 | Change detection create/success/failure |
| Imagery Update | 19300–19303 | 4 | Imagery update request |

- **Sub-messages with rich data:**
  - `EarthCrashData` — `state_url`, `graphics_vendor/renderer`, `ErrorInfo` (name, msg, stack_trace)
  - `EarthLoadData` — `load_time`, `startup_time`
  - `MeasureToolEvent` — `distance`, `area`, `vertex_count`, `contains_stylus_points`
  - `MeasureToolDistanceUnitChangeEvent` — 11 distance units (cm, m, km, inches, feet, yards, miles, nautical_miles, smoots, auto, pool_length)
  - `MeasureToolAreaUnitChangeEvent` — 10 area units
  - `SuggestionEvent` — `query`, `guid`, `voyager_shown`, `suggested_query`
  - `NotificationEvent` — `Topic` (VOYAGER, POI)
  - `AccessibilityEvent` — `talk_back`, `system_font_size`, `color_correction`
  - `IosSizeEvent` — width/height `SizeClass` (COMPACT, REGULAR)
  - `SearchSuggestResultGroupEvent` — `result_group_id`, `query`, `suggested_query`
  - `ImportToCloudEvent` — `Result` (FAILURE/SUCCESS), detailed `MessageType` errors (26 types for KML parse, unsupported features, broken URLs)
  - `ConfigRequestEvent` — full gRPC `StatusCode` enum, `auto_retries`, `is_manual_retry`, `cached`
  - `NetworkRequestEvent` — 15 request types (config, experiments, search, photos, voyager, etc.) + `http_response_code`
  - `EarthMateRequestEvent` — `submit_to_response_time_seconds`, `is_googler`
  - `EarthMateEvent` — `is_googler`, `edc_access`, `gemini_vector_layers_enabled`, layer counts
  - `LayerStyleUpdate` — feature types (polygon/point/line/label) x properties (stroke_color, fill_color, opacity, scale, visibility, categorical/interpolated ramp)
  - `FeatureInfoCopiedEvent` — 28 known item types (latitude, longitude, altitude, length, perimeter, area, plus_code, elevation, etc.)
  - `FeatureSelectedEvent` — 21 feature types (folder, view, point, path, polygon, 3d_model, etc.)
  - `PropertyEditorEvent` — document type + counts of features
  - `AreaFilterDetails` — layer ID, source view, area source (draw/select), selection type (intersects/contains)
  - `UserImportDetails` — file size, output type (data_layer/map_features/3d_model), import source (Drive/local/paste), MIME type, LRO state, quota, completion status
  - `SelectedLayerDetails` — `layer_logging_id`, `LayerResolveError` (unsupported/insufficient_entitlements), `SourceView`, `FeatureOrigin` (user/gemini), `search_semantic_distance`, `opened_via_deeplink`
  - `SearchDataCatalogDetails` — `search_query_count`, `ResultLayerDetails` (layer ID + semantic distance)
  - `BillingPlanChangedEvent` — prev/new plan types
  - `PaygateCardDetails` — 14 paygate feature types
  - `ElevationContourLroEvent` / `CutAndFillLroEvent` — concurrent LRO runs
- **Top-level enums:**
  - `BillingUpgradeDialogSourceView` — 24 source view origins
  - `PaygateFeatureType` — 14 feature types
  - `DataCatalogDialogSourceView` — 8 source views
  - `ExplorePromotionDialogVariant` — 3 variants (no_gif/small_gif/regular_gif)
- **Dependencies:** 8 sub-event protos (deeplink, earthfeed, experiment_flags, mirthstats, nativelibraryload, settings, startupfinished, usersettings) + privacy + datapol

### 2.2 Sub-Event Protos (geo/earth/app/)

#### `deeplink_event.proto`
- **Package:** `geo.earth.app`
- **Message:** `DeeplinkEvent` — `path`, `utm_source`, `utm_campaign`, `utm_term`
- **Purpose:** Tracks deep link URL paths and UTM campaign parameters

#### `earthfeed_event.proto`
- **Package:** `geo.earth.app`
- **Message:** `EarthFeedEvent` — `item_guid`, `feature_id`, `item_index`, `display_type`, `link_href`
- **Purpose:** Voyager/Earth Feed item interactions

#### `experiment_flags.proto`
- **Package:** `geo.earth.app`
- **Message:** `ExperimentFlags` → repeated `ExperimentFlag` (name + bool value)
- **Key Enums:** ~234 `FlagName` values covering every feature flag in Google Earth (from PHOTOS_LAYER_ENABLED to EARTH_MATE_PERSISTENT_VISION_CONTEXT_ENABLED)
- **Purpose:** Experiment/feature flag gating for A/B testing and gradual rollouts

#### `earth_client_interaction_metadata.proto`
- **Package:** `logs.proto.geo.earth.app`
- **Messages:**
  - `EarthClientInteractionMetadata` — `EarthMateMetadata` (thumbs up/down rating), `RateCardDialogMetadata` (upgrade/downgrade clickthrough type)
  - `ThumbsUpDownRating` enum (THUMB_UP, THUMB_DOWN)
  - `RatecardClickthroughType` enum (UPGRADE_PROF, UPGRADE_PROF_ADV, DOWNGRADE_STANDARD, DOWNGRADE_PROF)
- **Purpose:** Extends `ClientInteractionMetadata` with Earth-specific interaction metadata

#### `mirthstats_event.proto`
- **Package:** `geo.earth.app`
- **Message:** `MirthStatsEvent` — sub-messages: `GraphicsInfo` (vendor, renderer), `RenderingStats` (average_fps, jank30/60 frame counts and percents, video playback/tile stats), `MemoryStats` (total_allocator_memory, gpu_memory), `KmlStats` (29 KML element type counts)
- **Purpose:** Performance telemetry (FPS, memory, KML complexity)

#### `nativelibraryload_event.proto`
- **Package:** `geo.earth.app`
- **Message:** `NativeLibraryLoad` — `source_dir`, `source_name`, `target_file`
- **Purpose:** Tracks native library loading (for WASM/Emscripten builds)

#### `settings_event.proto`
- **Package:** `geo.earth.app`
- **Message:** `SettingsEvent` — `flight_animation_enabled`, `FlightAnimationSpeed` (SLOWEST→FASTEST), `FlyEndAnimation` (STATIC/ORBITAL/CINEMATIC), `MeasurementUnit`, `LatLonFormatting` (DEG_MIN_SEC/DECIMAL/DEG_MIN), `QualitySettings` (FASTEST→HIGHEST), notification toggles, `DarkModeState` (LIGHT/DARK/SYSTEM), `LoadingDestination` (HOMESCREEN/EXPLORE)
- **Purpose:** User settings state at event time

#### `startupfinished_event.proto`
- **Package:** `geo.earth.app`
- **Message:** `StartupFinishedEvent` — notification states, animated_clouds, gridlines, 3d_imagery, photos_layer, dark_mode_state, `default_config_used`
- **Purpose:** Captures application state at startup completion

#### `usersettings_event.proto`
- **Package:** `geo.earth.app`
- **Message:** `IndustrySelectorResponseEvent` — `EarthUserPrimaryUse` (7 values: WORK, LEISURE, PUBLIC_SECTOR, ACADEMIC, etc.), `EarthUserIndustry` (62 industry values), `EarthUserGeographicScale` (6 values: LOCAL→GLOBAL), `EarthUserMAPUseCase` (78 map use cases spanning Methane Emissions Reduction, Solar PV, Wind Power, Wildfire Detection, Carbon Markets, etc.)
- **Purpose:** User industry/use-case profiling for product personalization

---

## 3. VISUAL ELEMENT LOGGING (14 files)

### 3.1 `logs/proto/visual_element/visual_element_lite.proto`
- **Package:** `logs`
- **Key Messages:**
  - `VisualElementLiteProto` — core VE logging proto with `ui_type`, `element_index`, `contains_elements`, `target_url`, `result_index`, `feature_tree_ref`, `Visibility` enum (VISIBLE/HIDDEN/REPRESSED_COUNTERFACTUAL/CHILDREN_HIDDEN/REPRESSED_PRIVACY), `language`, `do_not_log_urls`, `ad_impression_index`, `DataElement`; ~350+ extension fields
  - `ClientRequestContext` — `click_tracking_cgi`, `ved`, `ui_type`, `ve_index`, `primary_user_action`, `cardinal_direction`, `toggle_state`, `interaction_context`, `result_index`, `element_index`, `image_url_referrer`, `thumbnail_id`, `referrer_id`, `ancestry[]`, `client_interaction_metadata`
- **Purpose:** The central proto for visual element (VE) click tracking throughout Google Maps/Earth UI surfaces
- **Dependencies:** tree_ref, click_tracking_cgi, client_interaction_metadata, data_element, tag_options

### 3.2 `logs/proto/visual_element/click_tracking_cgi.proto`
- **Package:** `logs`
- **Key Message:** `ClickTrackingCGI` — `ve_index`, `ve_type`, `element_index`, `result_index`, `page_start`, `do_not_log_url`, `result_fprint`, `ve_event_id` (ClientEventIdMessage), `youtube_ve_counter/identifier`
- **Purpose:** CGI-level click tracking metadata; extends proto2 MessageSet

### 3.3 `logs/proto/visual_element/client_interaction_metadata.proto`
- **Package:** `logs`
- **Message:** `ClientInteractionMetadata` — extension container (extensions 100-375) for pluggable metadata
- **Purpose:** Generic extension point for client-specific interaction metadata (extended by EarthClientInteractionMetadata)

### 3.4 `logs/proto/visual_element/data_element.proto`
- **Package:** `logs`
- **Message:** `DataElement` — `reference` (VisualElementTreeRef)
- **Purpose:** References structured data within VE trees

### 3.5 `logs/proto/visual_element/graft.proto`
- **Package:** `logs`
- **Key Messages:**
  - `VisualElementGrafts` — repeated `VisualElementGraft`
  - `VisualElementGraft` — `target` (TreeRef), `GraftType` (SHOW/HIDE/INSERT/COPY), `clone_tree`, `source_tree`, `graft_time_usec`, `dedupe`
  - `VisualElementTreeRef` — oneof `events` (EventIdMessage/ClientEventIdMessage/ei) + oneof `root` (ClickTrackingCGI/ved)
- **Purpose:** Tracks VE tree modifications (show/hide/insert/copy) for UI state reconstruction
- **Dependencies:** eventid, logs_annotations, click_tracking_cgi

### 3.6 `logs/proto/visual_element/ui_state_enum.proto`
- **Package:** `logs`
- **Enum:** `UIState.ToggleState` — TOGGLE_UNDEFINED/TOGGLE_ON/TOGGLE_OFF
- **Purpose:** Simple UI toggle state enum

### 3.7 `logs/proto/visual_element/user_action_enum.proto`
- **Package:** `logs`
- **Enums:**
  - `UserAction` — 55 values: UNASSIGNED, AUTOMATED, USER, GENERIC_CLICK, TAP, KEYBOARD_ENTER, MOUSE_CLICK, LEFT_CLICK, RIGHT_CLICK, HOVER, PINCH, INPUT_TEXT, INPUT_VOICE, SWIPE, SCROLL_BAR, MOUSE_WHEEL, ARROW_KEYS, NAVIGATE, BACK_BUTTON, SHAKE, DRAG, LONG_PRESS, DOUBLE_CLICK, DOUBLE_TAP, FORCE_TOUCH, TWO_FINGER_DRAG, INPUT_STYLUS, DRAW_CIRCLE, DRAW_STRIKETHROUGH, SNAP, etc.
  - `CardinalDirection` — LEFT/RIGHT/UP/DOWN
- **Purpose:** Standardized user interaction taxonomy

### 3.8 `logs/proto/visual_element/logged_place.proto`
- **Package:** `logs`
- **Messages:**
  - `LoggedPlace` — `feature_id` (FeatureIdProto), `feature_id_scrubbed`, `latitude_e6`, `longitude_e6`, `LoggingContext` (VISITED/NOT_VISITED)
  - `LoggedUserPlace` — extends with `child_visit`, `indoor_visit`, `calibrated_probability`
- **Purpose:** Place-level logging with feature IDs and location

### 3.9 `logs/proto/visual_element/element_value_data.proto`
- **Package:** `logs`
- **Message:** `ElementValueData` — simple `value` string
- **Purpose:** Generic value container for VE data

### 3.10 `logs/proto/visual_element/crisis_info.proto`
- **Package:** `logs`
- **Message:** `CrisisInfo` — `crisis_id`, `CrisisUserMode`, `AlertSeverityLevel`, `CrisisCategory`, `EventType`, `attribution`, `AlertSourceType` (SOS_ALERT/PUBLIC_ALERT)
- **Purpose:** Crisis/SOS alert data for visual elements
- **Dependencies:** crisisresponse, crisis proto, tactile crisis-user-mode

### 3.11 `logs/proto/visual_element/place_list_data.proto`
- **Package:** `logs`
- **Message:** `PlaceListData` — `list_id`, `PlaceListType`, `SharingState`, ownership/follow flags, `UserAddedItemInfo`, `PublishInfo` (source), `ListEntrypointInfo` (entrypoint), `JustificationType`, collaborator flag
- **Purpose:** User-created place list metadata for VE logging

### 3.12 `logs/proto/visual_element/place_comparison_data.proto`
- **Package:** `logs`
- **Message:** `PlaceComparisonData` — `total_comparison_attribute_count`, `missing_comparison_attribute_count`
- **Purpose:** Place comparison feature data

### 3.13 `logs/proto/visual_element/hotel_booking_partner_data.proto`
- **Package:** `logs`
- **Message:** `HotelBookingPartnerData` — `google_hotel_id`, `place_mid`, `LodgingType`, `partner_id`, `partner_hotel_id`, ad/organic supplier flags, check-in date, length of stay, advance booking window, occupancy (adults/children), `price_per_night`, `taxes_and_fees_per_night`, `conversion_rate_to_usd`, crawled/owner flags, `url`, `Refinements`
- **Purpose:** Hotel booking partner impression/click data

### 3.14 `logs/proto/visual_element/disruptions-impression-data.proto`
- **Package:** `logs`
- **Message:** `DisruptionsImpressionData` — `DisruptionsSurface` (DIRECTIONS/NAVIGATION), `IncidentType`
- **Purpose:** Traffic disruptions shown in directions/navigation UI

### 3.15 `logs/proto/visual_element/visual_element_offset_identifier.proto`
- **Package:** `logs`
- **Message:** `VeOffsetIdentifier` — repeated `base` int32 + `offset`
- **Purpose:** Offset-based VE identification scheme

---

## 4. HOTELS & ADS LOGGING

### 4.1 `logs/proto/hotels/hotels_feature_data.proto`
- **Package:** `logs.proto.hotels`
- **Key Messages (21 total):**
  - `EntityKey` — `mid`, `FeatureIdProto`, `hotel_id`, `EntityType`
  - `LoggedHotelSummaryData` — entity_key, `vacation_rental_partner_id`, `primary_concept`, image keys
  - `LoggedHotelHighlightData` — `HighlightType`
  - `LoggedHotelNotableGroupData` — `notable_count`
  - `LoggedHotelNotableData` — category, sentiment type, link target
  - `LoggedHotelAmenityWebSnippetsData` — amenity type
  - `LoggedPartnerRoomsDataProviderData` — partner_id, hotel_id, available_rooms_count
  - `LoggedRoomSummaryOptionData` — room_id, num_rates, max_occupancy, num_photos, lowest_price
  - `LoggedRoomRateData` — partner_id, room_id, price
  - `LoggedHotelPlaceDetailsData` — partner_id, is_supplier, is_crawled, url
  - `LoggedHotelWithoutPriceData` — same as place details
  - `LoggedHotelPriceData` — currency, price_per_night, taxes_and_fees, display setting (WITH/WITHOUT_FEES_AND_TAXES), conversion_rate, is_deal, partner_id, is_composed, booking_window_days, base_price_offender flags, query/event ID, price accuracy, organic pctr, organic quality score
  - `LoggedHotelSearchData` — `Itinerary` (check_in_date, length_of_stay), occupancy, `Refinements` (24 refinement categories including alternative lodging, min_rating, chains, accommodation_type, sort_order, neighborhoods, star_class, refundable_only, eco_certified, amenities, beds, room_styles, smoking, meal_plans, early/late check), `LocationData`, `PriceRange`, EV interest counts, `PreviousTriggerDecision`
  - `LoggedAlternativeHotelsData` — similar/popular alternative hotels
  - `LodgingBrowsyAtomicPacksExtension` — browsy_unit_index, semantic_set_type
  - `HotelLevelBackendData` — hotel_id
  - `PartnerLevelBackendData` — partner_id, total_price, taxes_and_fees, fees, currency, display_result_info, granular_price_accuracy_score, pctr
- **Purpose:** Comprehensive hotel search, pricing, rooms, partners, and refinements logging
- **Dependencies:** 15+ imports across ads/travel, geo/search, travel/frontend

### 4.2 `logs/proto/ads/travel/hotel_annotation.proto`
- **Package:** `ads_travel`
- **Messages:**
  - `HotelAnnotation` — `AnnotationType`, oneof params: `AmenitiesParams` (ranked amenities), `DealParams` (deal magnitude), `DistanceToPoiParams` (distance_in_meters)
- **Purpose:** Hotel ad annotation ranking signals

### 4.3 `logs/proto/ads/travel/hotel_price_details.proto`
- **Package:** `ads_travel`
- **Messages:**
  - `HotelPriceDetails` — partner_name, price, taxes, currency, conversion_rate_to_usd, partner_hotel_id, partner_room_id, is_owner, pos_name, pos_booking_phone_number, discount_percentage, rate_rule_id, `HotelAnnotationsData` (ranked annotations), `HotelImageKey` (frontend type + photo_id)
- **Purpose:** Hotel pricing details for ads display

---

## 5. TRANSPORTATION LOGGING

### 5.1 `logs/proto/geo/transportation/analytics/triplogs/common.proto`
- **Package:** `logs.geo_transportation_analytics.triplogs`
- **Key Messages:**
  - `User` — oneof identifier: zwieback_cookie/uid or pseudonym_id
  - `Location` — LatLng + FeatureIdProto
  - `TimestampedLocation` — Location + timestamp_ms
  - `DestinationLocation` — Location + place_id + point_source
  - `ClientStats` — projected_fraction
  - `Software` — platform, application_name, referrer_id, auto_platform (NONE/CARGO/CARPLAY/EMBEDDED), software_version, nav_sdk_version, cabrio_sdk_version, device_platform_type
  - `WaypointPredictions` — pre/post_dispatch_eta_duration_ms, pre/post_dispatch_predicted_distance_meters
  - `WaypointActivityMeasures` — waypoint start/end/complete, destination, predictions, activity duration/distance
- **Key Enums:**
  - `DestinationPointSource` — DEVELOPER_PROVIDED/CALCULATED_FROM_PLACE
  - `DataSource` — NAV_LOGS/FLEET_ENGINE/LMFS_PROCESSED_LOGS
  - `AutoPlatform`, `DevicePlatformType` (ANDROID/IOS)
  - `LrdPartner` — 20 ride/delivery partners (LYFT, GOJEK, UBER, DIDI, OLA, FREE_NOW, DOORDASH, GETT, DHL, CABIFY, BLABLACAR, CAREEM, GRAB_TAXI, BEAT, etc.)
  - `LrdVertical` — RIDES/DELIVERY/PARCEL_DELIVERY
  - `TripsPoweredLevel` — L1/L2A/L2B
- **Purpose:** Trip log analytics common types for transportation (navigation + ride-hailing trips)
- **Dependencies:** google/type/latlng, featureid

### 5.2 `logs/proto/geo/transportation/locationsignals/affordance_vector.proto`
- **Package:** `logs.proto.geo.transportation.locationsignals`
- **Messages:**
  - `LoggedAffordanceProto` — `affordance_class`
  - `LoggedAffordanceVectorProto` — repeated affordances
- **Purpose:** Affordance vectors for location-based routing signals (e.g., truck/no-truck routes)

---

## 6. MAPS TACTILE: DIRECTIONS UI LOGGING (13 files)

### 6.1 `logs/proto/maps/tactile/directions.proto`
- **Package:** `logs_tactile`
- **Key Messages:**
  - `LoggedDirectionsRequest` — waypoint queries, travel_mode, input_camera, trip_index, detail_level, `DirectionsOptions` (transit/driving/bikesharing/taxi/flights options, traffic, time anchoring, lane guidance, trip groups), distance_units, via_points, update_route_params, searchbox_stats, client_stats
  - `TravelModeOptions` — preferred_travel_mode, filtering (BLENDED), enable_fly/taxi/two_wheeler/bikesharing
  - `DrivingOptions` — avoid_highways, avoid_tolls, traffic_routing_strategy, `TrafficReportOptions` (visual/enabled), prefer_truck_routes, `VehicleTypeOptions` (engine_type)
  - `TransitOptions` — vehicle preferences, multimodal options (car_and_transit, rickshaw_and_transit, two_wheeler_and_transit, ridesharing_and_transit, bicycle_and_transit), scoring_preference
  - `BikesharingOptions` — dockless/docked
  - `TaxiOptions` — regular_ridesharing, long_distance_ridesharing, offline_auto_rickshaw
- **Purpose:** Complete directions request logging for tactile (touch UI) directions
- **Dependencies:** 8 imports from maps/tactile, geo/serving, shared/directions

### 6.2 `logs/proto/maps/tactile/annotations.proto`
- **Package:** `logs_tactile`
- **Extensions:** `feature_id` and `convertable` field option extensions
- **Purpose:** Tactile-specific field annotation extensions

### 6.3 `logs/proto/maps/tactile/directions-common.proto`
- **Package:** `logs_tactile`
- **Messages:**
  - `LoggedSpotlightOptions` — rendering_detail_level, suppress_alternates, show_only_waypoints_vias, suppressed_waypoint/via_index, show_step_inspection_arrows
  - `LoggedTripUpdateInput` — distance_from_start_meters
  - `LoggedCompactPolyline` — differential lat/lng encoding (latitude_e7_diff, longitude_e7_diff)
- **Purpose:** Common directions types: spotlight view options, trip update input, compact polyline encoding

### 6.4 `logs/proto/maps/tactile/geometry.proto`
- **Package:** `logs_tactile`
- **Messages:** `LatLng` (with redacted flag), `LatLngRectangle`, `LoggedRasterPoint` (x/y), `LoggedRasterRectangle`
- **Purpose:** Geometry primitives for tactile logging

### 6.5 `logs/proto/maps/tactile/ad-ref.proto`
- **Package:** `logs_tactile`
- **Message:** `LoggedAdRef` — ads_response_id, text_ad_index, text_ad_location_index, ad_type
- **Purpose:** Ad reference tracking in tactile UI

### 6.6 `logs/proto/maps/tactile/offers.proto`
- **Package:** `logs_tactile`
- **Message:** `OfferData` — id, source, is_promoted
- **Purpose:** Offer/deal logging for map annotations

### 6.7 `logs/proto/maps/tactile/on-map-impression.proto`
- **Package:** `logs_tactile`
- **Message:** `OnMapImpression` — appearance types, personal_appearance, image_key, ad_ref, visibility, visibility_reason, incident_provider, offer_data, haptic_place_list_source, personal_feature_provider, model_id, `AnnotationImpressionData`, establishment_type_id, gas_price (Money), rating, label_content, rendering_category_id, element_value_data, place_list_data, disruptions_impression_data
- **Purpose:** Comprehensive on-map visual impression logging (what users see on the map)
- **Dependencies:** 14 imports from tactile, geoevents, visual_element, photos

### 6.8 `logs/proto/maps/tactile/directions-client-stats.proto`
- **Package:** `logs_tactile`
- **Message:** `LoggedDirectionsClientStats` — directions_client, directions_context
- **Purpose:** Client-side directions statistics

### 6.9 `logs/proto/maps/tactile/annotation-data.proto`
- **Package:** `logs_tactile`
- **Messages:**
  - `AnnotationImpressionData` — use_case, discovery_type, personal_use_case, relative_boost, personal_relative_boost, `AnnotationAttribute` (namespace_id, attribute_id), `BusynessStatus` (7 levels: WAY_MORE_PEOPLE_THAN_USUAL → NOT_BUSY), `DealSubtitleType`, `DealType` (GOOGLE_PAY/PARTNER_PROVIDED/LOCAL_POST/EXTRACTED)
  - `AnnotationData` — logging_ve_ui_type, annotation_impression_data, `ApplicationTarget` (PRIMARY_LABEL_GROUP/SECONDARY_LABEL_GROUP)
- **Purpose:** Map annotation impression data (busyness, deals, use cases)

### 6.10 `logs/proto/maps/tactile/label-content.proto`
- **Package:** `logs_tactile`
- **Message:** `LoggedLabelContent` — `LabelContentType`, `LabelContentLocation`
- **Purpose:** Map label content/position logging

### 6.11 `logs/proto/maps/tactile/recommended-filtering-results.proto`
- **Package:** `logs_tactile`
- **Message:** `LoggedRecommendedFilteringResults` — `TripGroupingRecommendation` with oneof: `TripComparisonGrouping` (comparison_groups) / `TravelModeCentricGrouping` (primary_travel_mode, requested_mode_shift_was_ineligible), `TripGroup` (trip_references, grouping_reason, ranking_reason, group_travel_mode, `ModeNudge`), `TripPreviewRecommendation`
- **Purpose:** Directions recommended filtering/trip grouping analysis

### 6.12 `logs/proto/maps/tactile/directions-counterfactual-recommended-filtering-results.proto`
- **Package:** `logs_tactile`
- **Message:** `DirectionsCounterfactualRecommendedFilteringResults` — counterfactual_id + LoggedRecommendedFilteringResults
- **Purpose:** A/B testing counterfactual for filtering results

### 6.13 `logs/proto/maps/tactile/directions-counterfactual-trip-ranking.proto`
- **Package:** `logs_tactile`
- **Message:** `DirectionsCounterfactualTripRanking` — counterfactual_id + trip_indexes
- **Purpose:** A/B testing counterfactual for trip ranking

---

## 7. MAPS PATHFINDER: ROUTING CLIENT LOGGING (21 files)

### 7.1 `logs/proto/maps/pathfinder/client/find-path-input.proto`
- **Package:** `logs.proto.maps.pathfinder.client`
- **Key Message:** `LoggedFindPathInput` — comprehensive routing request parameters:
  - Waypoints with pairing strategy (IN_ORDER/OPTIMIZE_ORDER/MANY_TO_MANY)
  - `CostModelOptions`, locale, language, country, distance units (KM/MILES)
  - Text output type (XML/HTML/PLAIN/NONE), verbosity (PRINTED/TURN_BY_TURN)
  - Polyline options, alternates, max_trips, lane guidance, step groups, reference trip
  - `MetricsOnlyMode` (5 modes: METRICS_AND_DETAILS → INFERRED_NO_POLYLINE)
  - `TollOptions` (pricing_factors, client_id originator)
  - `DynamicClosure` (feature_ids), `OnDemandTransportationOptions`
  - `TaxiOptions`, `BikesharingOptions`
  - `AssistedDrivingOptions` (want_assisted_driving_path_info)
  - `RoadsideFacilityOptions`, `SustainabilityOptions` (label_least_fuel_consumption_trip)
  - `CustomizationInputs`, `RequeryInput`, `TrafficReportOptions`, experiments, logging_context
- **Purpose:** The complete routing request input logged for analytics
- **Dependencies:** 10 imports across pathfinder, tolls, autonomous, traffic

### 7.2 `logs/proto/maps/pathfinder/client/trip.proto`
- **Package:** `logs.proto.maps.pathfinder.client`
- **Key Messages:**
  - `LoggedTrip` — paths, cost_model_options, timing_summary, transit_connection, dynamic_closure info, MRP selector info, trip_id, cycling_summary, elevation_profile, polyline_decorations, summary_decorations
  - `LoggedPath` — labels_compared_to_tripset, summary_decorations
  - `LoggedPathLabel` — Type enum (TOLLS_YES/NO, TRAFFIC_CONGESTION_MORE/LESS/EVEN_MORE/EVEN_LESS/SIMILAR, LESS_FUEL_CONSUMPTION, FASTEST, MORE_BIKE_LANES, LESS_HIGHWAYS, LESS_STEEP_HILLS, LESS_TURNS, BEST), text, needs_icon
  - `LoggedPolylineDecoration` — identifier (config + decoration_id), location (offset + length), metadata (int/double value)
  - `LoggedTimingSummary` — departure_time, arrival_time, duration_seconds, optimistic/expected durations, realtime_duration, distance
- **Purpose:** Logged trip results from pathfinder

### 7.3 `logs/proto/maps/pathfinder/client/waypoint.proto`
- **Package:** `logs.proto.maps.pathfinder.client`
- **Key Messages:**
  - `LoggedWaypoint` — locations, is_via, feature_type, country_code, snapping_type (NORMAL/TRANSIT_STATION/PARKING_FACILITY), entity_type (MY_LOCATION/HOME/WORK/AD/NICKNAME/CONTACT)
  - `LoggedLocation` — segment location (segment_id, interpolation_fraction, node_id, penalty), point, snap_zoom_level, building_level, heading, access_point, boarded_transit_vehicle, side_of_road_preference, location filters (ELEVATED/FERRY/LIMITED_ACCESS/UNDERGROUND/ALLOW_HOV)
- **Purpose:** Waypoint and location representation for routing

### 7.4 `logs/proto/maps/pathfinder/client/logging-context.proto`
- **Package:** `logs.proto.maps.pathfinder.client`
- **Messages:**
  - `LoggedLoggingContext` — extended_session_id, session_id, software/client_version, platform_id, application_name, referrer_name, experiment_ids, trip/traffic version, project_number, third_party flag, logging_enabled, request_source, replay_metadata, customization_id
  - `LoggedResponseLoggingContext` — extended_session_id, request_id
- **Purpose:** Session and request context for pathfinder logging

### 7.5 `logs/proto/maps/pathfinder/client/customization_inputs.proto`
- **Package:** `logs.proto.maps.pathfinder.client`
- **Message:** `LoggedCustomizationInputs` — id, decoration_ids, parameters map, decoration_parameters map
- **Purpose:** Customization parameters for routing personalization

### 7.6 Other Pathfinder Client Files (16 files):
- `boarded_transit_vehicle.proto` — Boarded transit vehicle info
- `building-level.proto` — Building floor level info
- `cost-model-options.proto` — Cost model travel mode options
- `describer-options.proto` — Trip description options
- `error.proto` — Error codes
- `experiments.proto` — Experiment parameters for pathfinder
- `mode-availability.proto` — Travel mode availability
- `mrp-cost-function-specification.proto` — MRP cost function spec
- `mrp-ranking-options.proto` — MRP ranking options
- `mrp-selector-info.proto` — MRP selector information
- `mrp-selector-specification.proto` — MRP selector spec
- `mrp-vehicle-info.proto` — MRP vehicle information
- `on-demand-transportation.proto` — On-demand transport (ride-hail) options
- `polyline-codec.proto` — Polyline encoding options
- `request-source.proto` — Request origin source
- `step.proto` — Turn-by-turn step data
- `transit.proto` — Transit-specific options
- `tripset.proto` — Trip set data

Additional:
- `autonomous/assisted_driving_info.proto` — Assisted driving data
- `compliance/proto/compliance_prediction_server.proto` — Compliance prediction
- `crp/searcher/request_options.proto` — CRP searcher options
- `replay/proto/replay_metadata.proto` — Replay metadata for debugging

---

## 8. MAPS DIRECTIONS MRP LOGGING (19 files)

### 8.1 `logs/proto/maps/directions/mrp/logging.proto`
- **Package:** `logs.proto.maps.directions.mrp`
- **Message:** `LoggedLogProto` — log entries (severity/context/source), phase timings (21 phase tags: QUERY_REWRITE, HINTING, GENERATION, MIXING, PRE_CULL_ANNOTATION, PREPARE_FOR_REQUERY, TRIP_PROPERTIES, COSTING, SELECTION, PENALTY_FREE_FIXUP, RANKING, CULLING, POST_CULL_ANNOTATION, MEASUREMENT, PREPARE_LOGS, RESULT_REWRITE, RESPONSE_FINALIZE, DECORATE), MRP measures, dark launch logs (control/test trip generator comparison with churn, equivalence stats)
- **Purpose:** Server-side MRP (Multi-Route Planner) internal logging and dark launch A/B testing

### 8.2 `logs/proto/maps/directions/mrp/affordances.proto`
- **Package:** `logs.proto.maps.directions.mrp`
- **Enum:** `LoggedAffordanceEnums.Class` — CLASS_TRUCK (4 subtypes: TRUCK, TRUCK_IMPASSABLE, TRUCK_HAZMAT, TRUCK_AVOID/PREFER/MOST_PREFERRED), CLASS_AVOID, CLASS_PREFER, CLASS_AFFORDANCE_APPLIES
- **Purpose:** Road affordance classification for routing

### 8.3 `logs/proto/maps/directions/mrp/trip.proto`
- **Package:** `logs.proto.maps.directions.mrp`
- **Key Messages:**
  - `LoggedTripProto` — trip_index, generator_index, paths, annotations, properties, costs, selected_trip_info, overall_relevance, label, counterfactual flags, dynamic_closure info, duplicate_trip_infos, customization_annotation_versions
  - `LoggedPathProto` — path_index, snapped_waypoints, segment traversal, generator_data, path annotations, measures, path labels
  - `LoggedTraversedSegmentProto` — feature_id, vertices, offline annotations
  - `LoggedGeneratorData` — oneof: pathserver (cost)
- **Purpose:** Full MRP trip and path logging

### 8.4 `logs/proto/maps/directions/mrp/measure.proto`
- **Package:** `logs.proto.maps.directions.mrp`
- **Message:** `LoggedMrpMeasureProto` — value, type (DISTINCTNESS, COST_ADVANTAGE, NUM_TRIPS, ABSOLUTE_OPTIMALITY_LOSS, PERCENTAGE_OPTIMALITY_LOSS, RELEVANCE, PENALTY_IMPACT, PENALTY_CONTRIBUTION, ROUTE_THROUGH_RESTRICTION, SEGMENT_HINTS_SIZE), selector A/B indices and labels
- **Purpose:** Quantitative MRP quality measures

### 8.5 `logs/proto/maps/directions/mrp/properties.proto`
- **Package:** `logs.proto.maps.directions.mrp`
- **Key Messages:**
  - `LoggedQueryPropertiesProto` — user/client/vehicle/area/destination/time properties
  - `LoggedTripPropertiesProto` — travel_modes, travel_time, distance, toll info, `LoggedTaggedPenalty` (annotator source + tag + penalty milliseconds), customization cost function inputs, passability properties, risk_averse_routing trigger, HOV segments, active closures
- **Purpose:** Query and trip properties for MRP analysis

### 8.6 `logs/proto/maps/directions/mrp/ranking_rule.proto`
- **Package:** `logs.proto.maps.directions.mrp`
- **Messages:** `LoggedSimpleRankingRuleProto`, `LoggedNestedRankingRuleProto` (sub_rule), `LoggedRankingRuleProto` (oneof: simple/nested)
- **Purpose:** Ranking rule logging for MRP

### 8.7 `logs/proto/maps/directions/mrp/ranking_rule_type.proto`
- **Purpose:** Ranking rule type enum definitions

### 8.8 `logs/proto/maps/directions/mrp/ranking_spec.proto`
- **Purpose:** Ranking specification

### 8.9 `logs/proto/maps/directions/mrp/cost_function_spec.proto`
- **Purpose:** Cost function specification

### 8.10 `logs/proto/maps/directions/mrp/relevance_model.proto`
- **Purpose:** Trip relevance model

### 8.11 Other MRP files:
- `annotation_version.proto` — Annotation version tracking
- `annotations.proto` — Trip/path annotation definitions
- `annotator_spec.proto` — Annotator specification
- `offline/annotations.proto` — Offline annotation data
- `metrics/path_metrics.proto` — Path-level metrics
- `money.proto` — Money/toll price logging
- `query_plan.proto` / `query_plan_preset.proto` — Query plan logging
- `requery_token_trip_context.proto` — Requery token context
- `trip_result_status.proto` — Trip result status codes
- `trip_set.proto` — Trip set proto (trips + annotations + session id)
- `trip_set_annotations.proto` — Trip set annotation data
- `mrp_processing_metadata.proto` — Processing metadata
- `decoration_spec.proto` — Decoration specification

---

## 9. DIRECTIONS CUSTOMIZATION CONFIG (13 files)

### 9.1 `logs/proto/maps/directions/customization/config/customization_config.proto`
- **Package:** `maps_directions_customization_logs`
- **Message:** `LoggedCustomizationConfig` — domain, name, trip_property_dependencies, travel_mode (DRIVE/BICYCLE/WALK)
- **Purpose:** Customization configuration logging

### 9.2 `logs/proto/maps/directions/customization/config/` — Configuration files:
- `annotation_api_config.proto` — Annotation API configuration
- `annotation_config.proto` — Annotation configuration
- `customization_config_combined.proto` — Combined customization config
- `domain_config.proto` — Domain-specific config
- `enumeration_config.proto` — Enumeration config
- `parameter_config.proto` — Parameter configuration
- `parameter_gate.proto` — Parameter gating
- `trip_property_config.proto` — Trip property configuration

### 9.3 `logs/proto/maps/directions/customization/config/decorations/` — Decoration configs:
- `decoration_config.proto`
- `decoration_config_combined.proto`
- `summary_decoration.proto`

### 9.4 `logs/proto/maps/directions/customization/config/serving_protos/` — Serving protos:
- `cost_function_inputs.proto` — Cost function inputs for serving
- `parameter_value.proto` — Parameter value logging
- `passability_properties.proto` — Passability properties
- `segment_annotations.proto` — Per-segment annotation data
- `trip_property_inputs.proto` — Trip property inputs
- `trip_time.proto` — Trip time representation

### 9.5 `logs/proto/maps/directions/customization/`
- `active_affordance.proto` — Active affordance state
- `restricted_zones/navlog_restricted_zone_info.proto` — Restricted zone info

---

## 10. DIRECTIONS COPILOT & TOLLS

### 10.1 `logs/proto/maps/directions/copilot/traffic_report.proto`
- **Package:** `logs.proto.maps.directions.copilot`
- **Messages:**
  - `LoggedTrafficReport` — one_liner, prompt, audio
  - `LoggedAudio` — expected_contains_inflection, audio_type
  - `LoggedPrompt` — with_road_closure, with_unavoidable_closure, closure_cause, expected_contains_inflection, prompt_type
  - `LoggedOneLiner` — title, short_title, subtitle (all repeated TrafficReportPiece), icon, road_closure info, expected_contains_inflection
  - `LoggedTrafficReportPiece` — text
- **Purpose:** Traffic incident report logging for Copilot (voice assistant)
- **Dependencies:** maps/directions/copilot traffic_report types, roadtraffic incidents

### 10.2 `logs/proto/maps/directions/tolls/proto/` — Toll logging:
- `client_id.proto` — Toll client identification
- `pass_type.proto` — Toll pass types
- `pricing_factors.proto` — Toll pricing factors
- `vehicle_attributes.proto` — Vehicle attributes for tolls

---

## 11. MAPS TRANSIT LOGGING (21 files)

### 11.1 `logs/proto/maps/transit/api/connection.proto`
- **Package:** `logs.proto.maps_transit.api`
- **Key Messages:**
  - `LoggedWalk` — transfer_key, distance, duration
  - `LoggedRide` — departure, is_critical, stops (with expected/scheduled stop keys, arrival/departure route section keys, time offsets, on_request flag), segments (polyline_key, transit_trip_key, synthetic_polyline), alerts, crowdedness, vehicle_attributes, last_trip_update, boarded_vehicle_token
  - `LoggedLeg` — oneof: Walking, Transit, Driving, OfflineTaxi, OnlineTaxi, Cycling, TwoWheeler
    - `LoggedTransit` — departure/arrival station keys, valid_line_direction_keys, travel_time, periodicity, rides, filtered_departures_query_token, `LoggedVehicleBoardingRecommendation` (vehicle_key, carriages, reason FASTEST_TRANSFER/FASTEST_EXIT, direction_of_motion, orientation)
    - `LoggedDriving` — duration, transfer_key, traffic_flavor, roadtraffic results
    - `LoggedOfflineTaxi` / `LoggedOnlineTaxi` — driving_info + taxi info
  - `LoggedJourney` — departure, arrival time range
  - `LoggedConnection` — journeys, duration, periodicity, transit_leg_count, legs, is_confidential, fare_info, feasibility (FEASIBLE/INFEASIBLE), labels (EARLIEST_ARRIVAL, LATEST_DEPARTURE, SHORTEST_TRAVEL_TIME, FEWEST_TRANSFERS, LEAST_WALKING, LOWEST_FARE, TIGHT, RELAXED, RISKY, SAFE)
- **Purpose:** Complete transit connection + leg logging (walk, transit, driving, taxi, cycling, two-wheeler)
- **Dependencies:** 10 imports across limo, roadtraffic, transit/api

### 11.2 Other Transit API files (20 files):
- `accessibility.proto` — Transit accessibility info
- `attribute_status.proto` — Attribute status
- `core.proto` — `LoggedInt32Range` (low/high/approx)
- `fare.proto` — `LoggedPriceRange`, `LoggedFare`, `LoggedFareInfo`
- `input_time.proto` — Input time representation
- `link.proto` — Link data
- `metadata.proto` — Metadata
- `occupancy_status.proto` — Vehicle occupancy
- `output_time.proto` — Output time
- `payment.proto` — Payment info
- `personalization.proto` — Personalization data
- `position.proto` — Position data
- `region_description.proto` — Region descriptions
- `routing_signals.proto` — Routing signals
- `text.proto` — Text data
- `time.proto` — Time representation
- `transit_options.proto` — Transit options
- `travel_overview.proto` — Travel overview
- `vehicle_attributes.proto` — Vehicle attributes

### 11.3 `logs/proto/maps/transit/fare/fare.proto`
- **Package:** `logs.proto.maps_transit`
- **Message:** `LoggedFareProto` — base_fare_type (NORMAL/CHILD), surcharge_type (NO_SURCHARGE/NON_RESERVED_SEAT/RESERVED_SEAT/FIRST_CLASS/SUITE/SLEEPER/EXPRESS/STANDING/DISCOUNTED_EXPRESS/OTHER), fare names, amount, currency, fare_type, min/max_amount
- **Purpose:** Detailed transit fare structure logging

### 11.4 `logs/proto/maps/transit/tripfinder/common/cost_model.proto`
- **Package:** `logs.proto.maps_transit`
- **Message:** `LoggedCostModelProto` — 50+ penalty factors and base penalties for every travel mode (walking, driving, offline_taxi, online_taxi, cycling, two_wheeler, train, tram, bus, subway, ferry, other), transfer penalties (exit, preferred, safe, timed, cross_datasource), serving penalties (expensive, station, line, fare), avoided vehicles/transfers penalties, non_requested_entities penalties, accessibility penalties
- **Purpose:** Transit trip finder cost model configuration logging (complete penalty configuration)

### 11.5 `logs/proto/maps/transit/realtime/proto/service_alerts_ui.proto`
- **Package:** `logs.proto.maps_transit_realtime.service_alerts.ui`
- **Messages:**
  - `LoggedText` — text + language
  - `LoggedAlert` — affected_resource (CURRENT_STATION/LINE/AGENCY/TRIP/TRIPSET or NAMED), effect (NO_SERVICE/REDUCED_SERVICE/SIGNIFICANT_DELAYS/DETOUR/ADDITIONAL_SERVICE/MODIFIED_SERVICE/OTHER/UNKNOWN/STOP_MOVED/NO_EFFECT/ACCESSIBILITY_ISSUE), additional_text, full_description, more_info_url, is_displayed_to_internal_only, cause (TECHNICAL_PROBLEM/STRIKE/DEMONSTRATION/ACCIDENT/HOLIDAY/WEATHER/MAINTENANCE/CONSTRUCTION/POLICE_ACTIVITY/MEDICAL_EMERGENCY), start/end_time, importance_score
- **Purpose:** Real-time transit service alerts UI logging
- **Dependencies:** shared/url

---

## 12. MAPS ROAD TRAFFIC LOGGING (4 files)

### 12.1 `logs/proto/maps/roadtraffic/proto/traffic.proto`
- **Package:** `logs.proto.maps.roadtraffic.proto`
- **Message:** `LoggedTripSummaryForTrafficFlavor` — elapsed_time_ms, traffic_covered_trip_length_m, delay_category, traffic_level_usualness
- **Purpose:** Trip-level traffic summary

### 12.2 `logs/proto/maps/roadtraffic/proto/traffic_model_type.proto`
- **Package:** `logs.proto.maps.roadtraffic.proto`
- **Enum:** `LoggedTrafficModelType` — 7 models: UNKNOWN, PER_SEGMENT_REGRESSION, GLOBAL_CAR_GLASSBOX, GLOBAL_TWO_WHEELER_GLASSBOX, REMOTE_PREDICTION_SINGLE_SEGMENT, SUPERSEGMENT, BLENDING, TRAFFIC2VEC
- **Purpose:** Traffic prediction model identification

### 12.3 `logs/proto/maps/roadtraffic/proto/path_traffic_flavor.proto`
- **Package:** `logs.proto.maps.roadtraffic.proto`
- **Messages:**
  - `LoggedPathTrafficFlavor` — time_specifier, prediction_timing (TIME_GOES_BY), blending
  - `LoggedTimeSpecifier` — interpretation (ABSOLUTE_UTC/LOCAL_TIMEZONE), seconds, anchoring (DEPARTURE/ARRIVAL)
  - `LoggedBlendingSpecifier` — type (BEST_GUESS, STATIC_HISTORICAL, PESSIMISTIC_STATIC_HISTORICAL, OPTIMISTIC_STATIC_HISTORICAL, FREEFLOW, REALTIME), use_supersegment, use_path_model
- **Purpose:** Traffic flavor configuration for path computation

### 12.4 `logs/proto/maps/roadtraffic/proto/road_routability_disruption.proto`
- **Package:** `logs.proto.maps.roadtraffic.proto`
- **Message:** `LoggedRoadRoutabilityDisruptionInfo` — repeated `LoggedRoadRoutabilityDisruption` (route_overlaps with segment fingerprints and skip distances, schedule, in_serving_road_index)
- **Purpose:** Road disruption/closures impact on routability

---

## 13. MAPS MOBILE LOGGING (3 files)

### 13.1 `logs/proto/maps/mobile/navigation_session_events.proto`
- **Package:** _(varies)_
- **258 symbols** — Massive proto covering **all navigation session events:**
  - `NavigationSessionEvents` — container for all event types
  - **Events (50+ types):** `GuidanceSelectedEvent`, `GuidanceStartedEvent`, `GuidanceStoppedEvent`, `StepChangedEvent`, `ActiveTripChangedEvent`, `TrafficDataUpdatedEvent`, `AlternateTripOfferedEvent`, `AlternateTripAcceptedEvent`, `AlternateTripSelectedEvent`, `RerouteRequestedEvent`, `DroveOntoAlternateEvent`, `PromptShownEvent` (38 prompt types + suppression reasons), `SpeedLimitStartedShowingEvent`, `SpeedLimitStoppedShowingEvent`, `ArrivedEvent`, `DeviceEvent`, `ForegroundEvent`, `GpsAvailabilityEvent`, `StartRecordingEvent`, `StopRecordingEvent`, `SessionEndedEvent`, `StopReasonEvent`, `FeedbackEvent`, `PickupEvent`, `DropoffEvent`, `AndroidActivityRecognitionEvent`, `TransitTripStartedEvent`, `AssistantVoiceActionEvent`, `AssistantStateEvent`, `UiModeStateEvent`, `TrafficRadarStateEvent`, `IncidentReportEvent`, `MapVersusSensorInconsistencyEvent`, `AccelerationEvent`, `AssistedDrivingEvent`, `PostTripUgcAnswerEvent`, `WeatherStateEvent`, `VehicleStateEvent`, `PredictedCurvatureEvent`, `PathUpdateEvent`, `ArModeStateEvent`, `ArLocalizationChangeEvent`, `ArIndoorStateEvent`, `ArElementPlacedEvent`, `BaselineBatteryUsageEvent`, `BatteryConsumptionEvent`, `PlaceEnterEvent`, `PlaceExitEvent`, `PlaceOngoingEvent`, `ActivityStartEvent`, `ActivityEndEvent`, `ActivityOngoingEvent`, `SemanticLocationEvent`, `CameraFramingChangedEvent`, `RoadViewMetricEvent`, `LiveActivityContentAppliedEvent`, `FeatureChangedEvent`, `ThermalStateEvents` (Android/iOS), `CpuUsageStateEvent`, `FpsStateEvent`, `LiteNavTransitUsageEvent`, `RerouteCauseEvent`, `TopErrorStatusEvent`, `InteractionEvent`, `RerouteActionEvent`, `LapSummaryEvent`, `StopEvent`, `DisplayAlternatesEvent`, `GeminiInNavInvocationEvent`, `GeminiInNavQueryEvent`, `GeminiInNavResponseEvent`, `GeminiInNavUserCancelEvent`
  - **Supporting messages:** `LocationSample`, `DifferentialLocationSample`, `StepPointer`, `LoggedSpeedReading`, `LoggedTrafficReportProblem`, `LoggedTrafficData`, `LoggedDirectionsStepCueProto`, `LoggedLaneTurn`, `LoggedLaneGuidance`, `LoggedCannedMessage`, `LoggedVoiceGuidanceTextAnnotation`, `LoggedGuidanceSpokenText`, `LoggedDrivingSummary`, `LoggedSummary`, `LoggedNotice`, `LoggedSpokenText`, `LoggedStep`, `LoggedStepGroup`, `LoggedTransitVehicleDetails`, `LoggedTransitVehicleGroup`, `LoggedSegmentEnergyUsage`, `LoggedRoadsideFacilityInfo`, `LoggedPath`, `LoggedTrip`, `LoggedFindPathLatency`, `LoggedCrpStatus` (56 CRP status types), `LoggedHeuristicPostprocessorData`, `LoggedCrpData`, `LoggedMrpData`, `LoggedCustomizationDataFirstOrThirdParty`, `LoggedTripData`, `LoggedVehicleEnergyModel`, `TripsAndTrafficSentEvent`, `LocationPipelineEvent`, `LoggedPathCost`, `LoggedSpeedInfo`, `CameraState` (orientation/mode/moment/look_ahead), `AndroidThermalStateEvent` (10 states), `IosThermalStateEvent` (5 states), `NavigationAdEvent` (promoted pin impressions/clicks/actions, ad_type, label_visibility), `PostTripUgcAnswerEvent` (questions/answers/multi-select/selected location/entry point)
- **Purpose:** Complete mobile navigation session telemetry — the most comprehensive navigation behavior logging schema
- **Feature points:** Turn-by-turn guidance, lane guidance, voice prompts, traffic reports, rerouting, transit trips, AR navigation, battery/thermal, sensor observations, camera state, path updates, energy usage, Gemini-in-nav, post-trip UGC, ads in navigation

### 13.2 `logs/proto/maps/mobile/map_versus_sensor_inconsistency.proto`
- **Package:** `logs_gmm`
- **Message:** `MapVersusSensorInconsistency` — distance_meters, segment_index, grid coordinates, lat/lng (E5), map_version, barometric_altitude (meters + uncertainty), road_altitude_meters
- **Purpose:** Detects discrepancies between map data and sensor measurements

### 13.3 `logs/proto/maps/mobile/server_version_metadata.proto`
- **Package:** `logs_gmm`
- **Messages:**
  - `NamedServerVersion` — server_tag (GMM_SERVER/MAPS_FE_BOQ/GWS/PAINT/SPOTLIGHT/MAPS_SDK_BOQ/FLEET_ENGINE/SUPERROOT), server_version, enable_stickiness
  - `ServerVersionMetadata` — repeated seen_servers
- **Purpose:** Server version tracking for debugging

### 13.4 `logs/proto/maps/mobile/transportation/navigation_guider_event.proto`
- **Package:** `logs_gmm.transportation`
- **Key Messages:**
  - `NavigationGuiderEvent` — trip_id, trip_progress, errors, last_good_projection, reroute events
  - `GuiderTripProgressEvent` — ETA, duration_to_destination, current_step_group_index, has_departed, yoda_state, oneof: walking (remaining_distance) / transit (vehicle_token, current_stop_index, remaining_stops)
  - `GuiderErrorEvent` — oneof: DeviceOfflineError, NoGpsSignalError
  - `GuiderRerouteEvent` — oneof: BetterMatchingEarlierDeparture, BetterMatchingLaterDeparture, OffRoute (distance_meters, step_group_index), TripInfeasible
- **Purpose:** Turn-by-turn navigation guider (guidance engine) event logging

---

## 14. MAPS LIMO: RIDE-HAILING LOGGING (4 files)

### 14.1 `logs/proto/maps/limo/proto/response.proto`
- **Package:** `logs.proto.maps_limo`
- **Key Messages:**
  - `LoggedOfflineTaxiInfo` — service_provider, fare_estimate, fare_breakdown, display_name, disclaimer, google_confidential
  - `LoggedOnlineTaxiInfo` — service_provider, partner_app_link_text, waiting_time_seconds, fare_estimate, `LoggedSurgePricingInfo` (surge_icon_id, description), product_name, details, disclaimer, show_ad_label, `LoggedAvailableVehiclesInfo` (vehicles_per_km2, vehicle_icon_id), `LoggedProductCategoryInfo` (category, name, category_icon_id), google_confidential, internal_data (product_type)
- **Purpose:** Online/offline taxi (ride-hailing) result logging

### 14.2 `logs/proto/maps/limo/proto/service_provider.proto`
- **Package:** `logs.proto.maps_limo`
- **Message:** `LoggedServiceProvider` — provider_token, provider_name, provider_icon_id
- **Purpose:** Ride-hailing service provider identity

### 14.3 `logs/proto/maps/limo/proto/fare_breakdown.proto`
- **Package:** `logs.proto.maps_limo`
- **Messages:**
  - `LoggedMonetaryCost` — amount, currency, num_legs
  - `LoggedFareBreakdown` — `LoggedFareGroup` → `LoggedFareItem` (description + cost)
- **Purpose:** Detailed fare breakdown for ride-hailing

### 14.4 `logs/proto/maps/limo/proto/monetary_range.proto`
- **Package:** `logs.proto.maps_limo`
- **Message:** `LoggedMonetaryRange` — range for fare estimates

---

## 15. MAPS SHARED TYPES (10 files)

### 15.1 `logs/proto/maps/shared/logged-geom.proto`
- **Package:** `logs_maps_shared.geom`
- **Messages:** `Camera` (location, rotation, screen_size, field_of_view_y), `Location` (longitude/latitude/altitude + redacted), `Rotation` (heading/tilt/roll), `Size` (width/height)
- **Purpose:** Shared geometry types for camera and location

### 15.2 `logs/proto/maps/shared/geometry_e7.proto`
- **Package:** `logs_maps_shared`
- **Messages:** `PointE7` (lat_e7/lng_e7), `RectE7` (lo/hi)
- **Purpose:** E7-encoded geometry primitives

### 15.3 `logs/proto/maps/shared/automotive-context.proto`
- **Package:** `logs_maps_shared`
- **Key Message:** `AutomotiveContext` — comprehensive automotive environment logging:
  - `Platform` (ANDROID_AUTO_PROJECTED, EMBEDDED, APPLE_CARPLAY, EMBEDDED_ADAS, GEO_APIS_FOR_AUTOMOTIVE)
  - `HeadUnit` (make, model, software_version, software_build)
  - `Car` (make, model, model_year, driver_position LEFT/RIGHT/CENTER, powertrain BEV/PHEV/OTHER, vehicle_type CAR/TRUCK/MOTORCYCLE)
  - `CarInputInfo` (rotary_controller, touch_screen, dpad, touchpad, focusing_device, touchpad_size)
  - `UiRestrictions` (keyboard_restricted)
  - `AndroidAutoInfo` (boardwalk, widescreen, experiment IDs, car_connected, projected_display_active)
  - `ActivityContext` (type: MAIN/LIMITED/CLUSTER/PHONE, state: FOREGROUND_ACTIVE/INACTIVE/BACKGROUND)
  - `UiInfo` (pin side, main_display_unreachable)
  - `DataSubscriptionStatus` (INACTIVE/TRIAL/PAID)
  - `PrivacySettingsStatus` (trip_personalization_opt_in_weeks)
  - `CarPlayInfo` (screen dimensions)
  - `NavigationType` (FREE_NAV/GUIDED_NAV)
  - `AllDisplaysInfo` (up to 4 displays with type, dimensions, DPI, scaling, safe areas, touch screen type)
  - `InstrumentClusterSettings` (feature_set: DEFAULT_MAP_ONLY/MAP_AND_NAVIGATION_STATE)
- **Purpose:** Complete automotive context for in-car navigation logging

### 15.4 `logs/proto/maps/shared/directions-notice-data.proto`
- **Package:** `logs_maps_shared.visual_element`
- **Message:** `DirectionsNoticeData` — travel_mode, severity (ALERT/WARNING/INFORMATION/CRITICAL), external summary/details hash, language, agency_id, incident_id, originating_problem_provider (WAZE/USER_REPORT)
- **Purpose:** Directions notice/warning display logging

### 15.5 `logs/proto/maps/shared/geo_doc_fetch_key.proto`
- **Package:** `logs_maps_shared`
- **Message:** `GeoDocFetchKey` — oneof: feature_id/mid, interpolated_geocode (segment_id, street_number/interpolation_param/snapped_point), subpremise, intersection (cross_street_ids, location), truncated_route, interpolated_house_id, plus_code_geocode
- **Purpose:** Geocoding document fetch key (how geocoding results are retrieved)

### 15.6 `logs/proto/maps/shared/lodging_pricing_information.proto`
- **Package:** `logs_maps_shared`
- **Messages:** `LoggedPrice` (price + hps_event_id), `LodgingPricingInformation` — prices displayed in 5 surfaces: search_result, map, preview, placesheet, searchless_map_organic
- **Purpose:** Lodging pricing display tracking across surfaces

### 15.7 `logs/proto/maps/shared/name.proto`
- **Package:** `logs_maps_shared`
- **Message:** `LoggedNameProto` — text, language, 40+ flag categories (FLAG_IN_LOCAL_LANGUAGE, FLAG_PREFERRED, FLAG_OFFICIAL, FLAG_OBSCURE, FLAG_ON_SIGNS, FLAG_EXIT_NAME, FLAG_ROUTE_NUMBER, FLAG_ABBREVIATED, FLAG_TRANSLITERATED, FLAG_BICYCLE_ROUTE, FLAG_SUSPICIOUS, etc.), short_text
- **Purpose:** Place/road name representation with rich flag metadata

### 15.8 `logs/proto/maps/shared/url.proto`
- **Package:** `logs_maps_shared`
- **Message:** `LoggedUrlProto` — url, language, pagerank (deprecated)
- **Purpose:** URL logging

### 15.9 `logs/proto/maps/shared/travel_intent_data.proto`
- **Package:** `logs_maps_shared`
- **Message:** `TravelIntentData` — travel_intent (TRAVEL_PLANNING/IN_DESTINATION/LOCAL), 3 distance buckets (viewport_from_flop, viewport_from_user_location, user_location_from_flop)
- **Purpose:** Travel intent classification signals

---

## 16. MAPS VMS: SENSOR OBSERVATIONS (3 files)

### 16.1 `logs/proto/maps/vms/lane_element_detail.proto`
- **Package:** `logs.vms.databack`
- **Messages:**
  - `LaneElementDetail` — element_type (PHYSICAL_LANE_ELEMENT/LANE_STRIPE_ELEMENT/LINEAR_STRUCTURE_ELEMENT), line_of_extrusion, average_element_width, lane_stripe_element_detail
  - `BodyFrameCoordinateSequence` — x/y/z_meters arrays + y_variances
  - `LaneStripeElementDetail` — logical_color (WHITE/YELLOW/BLUE/RED/GREEN/ORANGE), pattern (SINGLE_LINE_SOLID/DASHED, DOUBLE_LINE_SOLID/DASHED, SOLID_LEFT_DASHED_RIGHT, SOLID_RIGHT_DASHED_LEFT), materials (PAINT_STRIPE/ROUND_DOT/SQUARE_DOT), dash_length, dash_ratio
- **Purpose:** Detailed lane-level mapping element logging (for HD maps)

### 16.2 `logs/proto/maps/vms/roadview_metrics.proto`
- **Package:** `logs.vms.roadview`
- **Messages:**
  - `RoadViewMetric` — metadata + oneof: CoverageMetric / SkipLocationEvent
  - `CoverageMetric` — total_segments, total_length, attributes_coverage (SPEED_LIMIT, CURVATURE, ELEVATION, ALTITUDE, PREDICTED_SPEED, AZIMUTH, LINKED_INDEX, SPEED_LIMIT_SOURCE), segments by functional_road_class
  - `SkipLocationEvent` — segment_id, branch_id, off_main_path_probability
  - `MetaData` — log_source (PUBLISHERS/SDK/LH_PUBLISHERS/HORIZON_SDK), mapfacts_timestamp, sdk_version, session_id
- **Purpose:** RoadView map coverage metrics (what map data is available for rendering)

### 16.3 `logs/proto/maps/vms/sensor_observations.proto`
- **Package:** _(varies)_
- **49 symbols** — Comprehensive sensor observation logging:
  - `SensorObservation` — container
  - `RoadSignObservation` / `RoadSignObservationProbability` / `RoadSignObservationComponent` (127 sign types!), `RoadSignObservationComponentDetail`
  - `MonitoredZoneDetail` — MonitoredZoneType, MonitoringSensorType
  - `SpeedLimit` — SpeedLimitType, speed value
  - `NamedArea`, `AppliesAhead`, `LaneFromSide`
  - `EcefPosition`, `ObservingVehicleRoadSegmentId`
  - `Predicate`, `RoadWeatherPredicate`, `VehiclePredicate` (weight, length, width, height with units), `LocalTimePredicate`, `LocalTimePeriod`, `LocalTimeInterval`, `LocalTimeEndpoint` (MonthOfYear, DayOfWeek)
  - `ObservingVehicleRelativeSignPosition/Orientation`, `ObservingVehicleOrientation`
  - `UniqueRoadSignObservation`
  - `VolvoSignDetectionPacket`, `VolvoSignDetection`, `VolvoPrimarySign` (95 primary sign types!), `VolvoSupplementarySign` (23 supplementary types)
  - `MapPatchObservation`, `DrivenCurvatureObservation`
  - `RoadWeatherCondition` enum
- **Purpose:** Vehicle sensor observations — road sign detection, weather, speed limits, curvature, map patches (for fleet-based map updates)
- **Feature points:** Volvo-specific sign detection, HD mapping from vehicle sensors, road weather detection

---

## 17. SEARCH BOX LOGGING (6 files)

### 17.1 `logs/proto/searchbox/searchbox_stats.proto`
- **Package:** _(varies)_
- **67 symbols** — Comprehensive search box analytics:
  - `SearchboxStats` — `GroupInfo`, `ValidationStatus`, `ParameterValidationStatus`, `SignatureValidationStatus`, `SearchMethod` (40 methods!), `InputMethod` (12 methods), `ExperimentInfo`, `SuggestionInfo` (SuggestionSource — 46 sources, ActionSource, TabType), `RenderedSuggestionsInfo`, `IpaStats` (CorporaDiffStats), `HyperLocalSuggestStats`, `CacheConfig`, `ExperimentStatsV2` (121 stat types!), `QueryConfirmationStats`, `SingleSearchboxContext`, `QueryBuilderTap` (QueryBuilderType), `PromptExpansionTap`, `VascoStats`, `ActionStats`, `EditEventStats`, `OnDeviceSuggestionSuppressionStats`, `SuggestKeyboardDismissStats`, `SuggestionCount`, `SuggestScrollEventStats`, `ErrorStats`, `MoreButtonClickInfo`, `ServerIcingAnswerComparisonInfo`, `AnswerSuggestionStats`, `DoodleStats`, `SuggestionInteraction`, `SliceImpression`, `UntimelyResponseSuppression`, `MapsSuggestAdsStats`, `SuggestEntryPoint` (45 entry points!), `RoundTripTimeStats`, `QueryComposerTapEvent` (ChipTapMode, ChipToggleMode), `QueryComposerData`, `TabSuggestV2DarkStudyData`, `QueryParameter`, `Modality`, `IcingRankingSignals`, `ToastSuggestionRankingSignals`, `OnDeviceContactSuggestionRankingSignals`, `PixelLauncherInfo`, `IcingIndexableInfo`, `SliceInfo` (loading type, display mode), `IpaRenderTimeStats`, `SliceAction`, `UntimelySuggestion`, `OmniboxPosition`
- **Purpose:** Complete search box interaction analytics with suggestion quality, ranking, IPA, and slice tracking

### 17.2 Other searchbox files:
- `action_info.proto` — `ActionInfo` (action_type, package_id, aog_annotation, action_uri, intent_name, kesem_action_type)
- `action_on_google_annotation.proto` — Actions on Google annotation
- `action_type.proto` — Action type enum
- `searchbox_stats_group.proto` — Search box stats grouping
- `smart_compose_stats.proto` — Smart compose stats

---

## 18. FEATURE & LOGS ANNOTATIONS (5 files)

### 18.1 `logs/proto/feature/feature_offset_identifier.proto`
- **Package:** `logs.feature`
- **Message:** `FeatureOffsetIdentifier` — identifier_base[] + offset
- **Purpose:** Offset-based feature identification

### 18.2 `logs/proto/feature/tree_ref.proto`
- **Package:** `logs.feature`
- **Message:** `TreeRef` — oneof event (EventIdMessage/ClientEventIdMessage) + oneof identifier (feature_index/FeatureOffsetIdentifier)
- **Purpose:** Tree-based feature reference for VE/feature tree traversal

### 18.3 `logs/proto/logs_annotations/logs_annotations.proto`
- **Package:** `logs_proto`
- **Key Contents:**
  - `IdentifierType` enum — 36 values: IP_ADDRESS, IP_ADDRESS_INTERNAL, USER_AGENT, SENSITIVE_TIMESTAMP, SENSITIVE_LOCATION, APPROXIMATE_LOCATION, COARSE_LOCATION, OTHER_LOCATION, OTHER_VERSION_ID, REFERER, THIRD_PARTY_PARAMETERS, OTHER_PSEUDONYMOUS_ID, PREF, ZWIEBACK, BISCOTTI, CUSTOM_SESSION_ID, GAIA_ID, EMAIL, USERNAME, PHONE_NUMBER, OTHER_AUTHENTICATED_ID, OTHER_UNAUTHENTICATED_ID, PARTNER_OR_CUSTOMER_ID, PUBLISHER_ID, DASHER_ID, GSERVICES_ANDROID_ID, HARDWARE_ID, MSISDN_ID, BUILD_SERIAL_ID, UDID_ID, ANDROID_LOGGING_ID, SECURE_SETTINGS_ANDROID_ID, OTHER_IDENTIFYING_USER_INFO, USER_INPUT, DEMOGRAPHIC_INFO, GENERIC_KEY, GENERIC_VALUE, COOKIE, URL, HTTPHEADER
  - `TombstoneType` — RETAIN/DROP
  - `MessageDetails` — may_appear_in (source_type + log_type)
  - Field/Message/File option extensions for: `id_type`, `temp_logs_only`, `is_private_log`, `not_logged_in_sawmill`, `is_encrypted`, `max_recursion_depth`, `sawmill_filter_override`, `tombstone_type`, `msg_details`, `field_encryption_key_name`, `file_not_used_for_logging_except_enums`, `file_vetted_for_logs_annotations`
- **Purpose:** **PII classification and logging governance** — annotates every field in the logging schema with its identifier type for data privacy/compliance

### 18.4 `logs/proto/maps/geoevents/annotations.proto`
- **Package:** `logs_geoevents`
- **Extensions:** `expiration_date`, `owners`, `copy_to_geoevents_till` on FieldOptions; `owner`, `generation_end_date`, `ttl_days` on ExtensionRangeOptions
- **Purpose:** GeoEvents-specific field annotations for data lifecycle

---

## 19. AR (AUGMENTED REALITY) LOGGING (2 files)

### 19.1 `logs/proto/geo/ar/location.proto`
- **Package:** `logs.proto.geo.ar`
- **Message:** `LocationProto` — boot/utc_timestamp_ns, location_source (FUSED/GPS/NETWORK/IOS_CORE_LOCATION), latitude/longitude/accuracy, altitude_wgs84_meters, vertical_accuracy, bearing/speed with accuracy
- **Purpose:** AR localization sensor readings

### 19.2 `logs/proto/geo/ar/pose.proto`
- **Package:** `logs.proto.geo.ar`
- **Messages:**
  - `LatLngAlt`, `Orientation` (roll/pitch/yaw), `Pose` (location + orientation)
  - `Vector3dProto`, `QuaternionProto`, `RigidTransformProto` (translation + rotation)
  - `ReferenceFrame` (frame, reference_frame_context)
  - `ReferenceFrameAndState` (reference_frame + server_state)
  - `CovarianceMatrix3Proto` (6-element 3x3 covariance), `CovarianceMatrix6Proto` (21-element 6x6 covariance)
  - `GeodeticPosePrior` (base_t_camera, camera_gravity, base_frame, position_covariance, heading_std_dev, location_readings)
  - `RigidTransformWithConfidence` (rigid_transform + covariance + heading_std_dev)
- **Purpose:** Full 6-DOF pose estimation and uncertainty logging for AR navigation

---

## SUMMARY: FEATURE POINTS COVERED

| Domain | Files | Key Logging Coverage |
|---|---|---|
| **Google Earth** | 9 | 89 event types: startup, search, Earth Feed, measure tool, property editor, projects, content creation, homescreen, Earth Mate (AI), layers/data catalog, billing, on-demand analysis, image generator, flight simulator, change detection, user import |
| **Visual Element (VE)** | 14 | Universal click tracking, UI tree grafting, user actions (55 types), crisis alerts, place lists, hotel booking, disruptions |
| **Hotels & Ads** | 3 | Hotel search, pricing (7 display surfaces), room rates, refinements (24 categories), partner data, ad annotations, deal magnitudes |
| **Transportation** | 2 | Trip logs (navigation + ride-hailing), waypoint activity measures, 20 LRD partners, affordance vectors |
| **Directions Tactile** | 13 | Directions requests, travel mode options, transit/driving/bikesharing/taxi options, compact polylines, on-map impressions, recommended filtering, counterfactual A/B testing |
| **Pathfinder Routing** | 21 | Complete routing request/response, waypoints, locations, cost models, trip/path results, MRP selectors, customization inputs, tolls, sustainability, assisted driving, compliance, CRP search, replay |
| **Directions MRP** | 19 | Server-side routing: log entries, phase timings (21 phases), dark launch A/B, trip/path properties, measures (10 types), ranking rules, cost functions, relevance models, annotations, processors |
| **Customization Config** | 13 | Customization configs, annotations, decorations, serving protos (cost function inputs, parameter values, passability, segment annotations) |
| **Transit** | 21 | Connections + legs (7 modes), rides, stations, fares (surcharge types), service alerts (11 effects, 12 causes), cost model (50+ penalties), accessibility, occupancy, personalization |
| **Road Traffic** | 4 | Traffic models (7 types), path traffic flavors (time/blending), road routability disruptions |
| **Navigation (Mobile)** | 3 | 50+ navigation session events, guider events (walking/transit), map-vs-sensor inconsistency, server version tracking |
| **Limo (Ride-Hailing)** | 4 | Offline/online taxi info, service providers, fare breakdowns, surge pricing, available vehicles |
| **VMS (Sensor)** | 3 | Lane element details, roadview coverage metrics, Volvo sign detection (95+ types), speed limits, curvature, map patches, weather |
| **Search Box** | 6 | Search box analytics: suggestions (46 sources), search methods (40), experiment stats (121), IPA, query composer, slices, entry points (45) |
| **AR** | 2 | Location, 6-DOF pose estimation, covariance matrices, geodetic pose priors |
| **Automotive** | 1 | Complete in-car context: displays, head units, input devices, powertrains, privacy, subscriptions, CarPlay, Android Auto |
| **Infrastructure** | 7 | Event IDs, feature IDs, PII annotations (36 identifier types), tree refs, offset identifiers, VE logging options, GWS tags |

---

## KEY ARCHITECTURAL PATTERNS

1. **Event ID Propagation:** `EventIdMessage`/`ClientEventIdMessage` serve as universal correlation IDs across all logging subsystems
2. **PII Governance:** `logs_annotations.proto` provides field-level identifier type classification (36 types) for data privacy compliance
3. **VE (Visual Element) Layer:** `VisualElementLiteProto` + `ClientRequestContext` provides a universal click-tracking framework reused across Maps and Earth
4. **Counterfactual A/B:** Multiple subsystems (directions, pathfinder, MRP) support counterfactual logging for controlled experiments
5. **Extension-heavy design:** Many protos use proto2 extensions extensively for composability (VE has 350+ extension fields, ClientInteractionMetadata has 275+)
6. **Editions migration:** Mixed proto2/editions syntax — Earth log uses editions, while most Maps logging uses proto2
7. **Feature ID ubiquity:** `FeatureIdProto` (S2 cell + fingerprint) is the universal geospatial entity identifier used across all maps logging
