# GeoStore Proto Schema Analysis

> **Total files:** 162 `.proto` files  
> **Root:** `earthstudiowasm/geostore/`  
> **Subdirectories:** `base/proto/`, `base/proto/attachments/transit/`, `base/proto/internal/`, `client/attachments/`, `edit/`, `matching/public/`, `ontology/proto/`, `tools/public/`  

---

## Directory Structure

```
geostore/
├── base/proto/                         (154 files - core schema)
│   ├── attachments/transit/            (1 file)
│   └── internal/                       (5 files)
├── client/attachments/                 (1 file)
├── edit/                               (1 file)
├── matching/public/                    (1 file)
├── ontology/proto/                     (2 files)
└── tools/public/                       (1 file)
```

---

## Core Identification & Feature Model

### `base/proto/featureid.proto` — S2 Cell-Based Feature IDs
- **Package:** `geostore`
- **Imports:** `options.proto`, `google/api/inclusion.proto`, JSPB, ProtoMesh, MessageSet, descriptor, semantic_annotations
- **Messages/Enums:**
  - `FeatureIdProto` — `cell_id` (fixed64, required, S2 cell), `fprint` (fixed64, required, fingerprint within cell), `temporary_data` (MessageSet). This is the universal feature identifier for the entire GeoStore.
- **Extensions:** `crawl_feature_id` (27021333), `strong_reference` (34597257), `has_back_reference` (81429090) on proto2.FieldOptions
- **Role:** The fundamental addressing scheme. Every geo entity is identified by an S2 cell + fingerprint pair, enabling spatial locality in lookups.
- **Feature Points:** Dual 64-bit composite key (S2 cell ID + fingerprint); MessageSet extension hook; field option extensions for link traversal semantics.

### `base/proto/feature.proto` — Universal Feature Container
- **Package:** `geostore`
- **Imports:** ~70+ imports covering nearly every proto in the repo
- **Messages:**
  - `FeatureProto` — The universal container. `id` (FeatureIdProto, required), `bound` (RectProto), `preferred_viewport` (RectProto), `rank` (float), `name` (repeated NameProto), `address` (repeated AddressProto), `point` (repeated PointProto), `polyline` (repeated PolyLineProto), `polygon` (repeated PolygonProto), `track` (repeated TrackProto), `pose` (PoseProto), `polygon_for_display`, `water_removed_polygon`, `geopolitical_geometry`, `child`/`parent` (FeatureIdProto lists for hierarchy), `center` (PointProto), `source_info`, `related_entrance`, `related_feature` (RelationProto), `related_terminal_point`, `related_border`, `related_timezone`. Plus type-specific fields: `establishment`, `border`, `building`, `entrance`, `political`, `schooldistrict`, `elevation`, `segment`, `intersection`, `intersectiongroup`, `restriction`, `restriction_group`, `route`, `transit_station`, `transit_line`, `transit_line_variant`, `parking`, `signpost`, `sign`, `toll_cluster`, `toll_path`, `road_monitor`, `road_disruption`, `skiboundary`, `skilift`, `skitrail`, `level`, `locale`, `landuse`, `vertical_ordering`, `ev_station`, `ev_charger`, `operations`, `display_data`, `data_source`, `existence`, `rank_details`, `gconcept`, `attribute`, `property_value_status`, `trust`, `doodle`, `knowledge_graph_reference`, `three_dimensional_model`, `geometry_store_reference`, `regulated_area`, `service_area`, `business_chain`, `feature_metadata`, `field_metadata`, `attachment`, `raw_gconcept_instance_container`.
- **Role:** The single unified message for all geostore features. Oneof-style dispatch via optional typed fields. The hierarchy mechanism (child/parent) supports containment relationships.
- **Feature Points:** ~70+ type-specific sub-message fields; child/parent hierarchical links; comprehensive geometry support (point/polyline/polygon/track/pose); rich metadata layering.

### `base/proto/featuremetadata.proto` — Feature-Level Metadata
- **Package:** `geostore`
- **Imports:** `feature_field_metadata.proto`, `feature_replacement_info.proto`, `featureidforwardings.proto`, `options.proto`
- **Messages:**
  - `FeatureHistoryMetadataProto` — `feature_birth_timestamp_us`, `removal_timestamp_us`, `last_modification_timestamp_us` (all int64 µs)
  - `FeatureMetadataProto` — `version_token` (bytes), `core_version_token` (bytes), `history` (FeatureHistoryMetadataProto), `bulk_updatable` (enum: NOT_BULK_UPDATABLE / BULK_UPDATABLE), `forwardings` (FeatureIdForwardingsProto), `field_metadata` (FeatureFieldMetadataProto), `feature_replacement_info`
- **Role:** Tracks feature lifecycle, versioning, ID forwarding (duplicate resolution), field provenance, and bulk update eligibility.
- **Feature Points:** µs-precision timestamps; version tokens for optimistic concurrency; ID forwarding chain for duplicate/merge handling.

### `base/proto/featureidforwardings.proto` — Feature ID Forwarding
- **Package:** `geostore`
- **Imports:** `featureid.proto`, `featureidlist.proto`
- **Messages:** `FeatureIdForwardingsProto` — `forwarded_id`, `duplicate_of`, `transitively_duplicate_of`, `replaced_by` (deprecated), `inactive_duplicate` (repeated)
- **Role:** Handles feature deduplication and ID chaining. When features are merged, this maintains the forwarding chain.
- **Feature Points:** Transitive duplicate resolution; inactive duplicate tracking.

### `base/proto/featureidlist.proto` — Feature ID Collection
- **Package:** `geostore`
- **Imports:** `featureid.proto`
- **Messages:** `FeatureIdListProto` — `id` (repeated FeatureIdProto); MessageSet extension at 16709385
- **Role:** Simple repeated collection of feature IDs.

### `base/proto/featurelist.proto` — Feature Batch
- **Package:** `geostore`
- **Imports:** `feature.proto`
- **Messages:** `FeatureListProto` — `key` (bytes), `secondary_key` (bytes), `feature` (repeated FeatureProto); `UnparsedFeatureListProto` — same but with `unparsed_feature` (repeated bytes, CORD type)
- **Role:** Batch container for features with optional secondary key sharding. Unparsed variant for efficient binary transport.

### `base/proto/feature_replacement_info.proto` — Replacement Tracking
- **Package:** `geostore`
- **Imports:** `featureid.proto`
- **Messages:** `FeatureReplacementInfoProto` — `derived_from` (repeated FeatureIdProto), `replaced_by` (repeated FeatureIdProto)
- **Role:** Records which features were derived from or replaced by other features during edits/conflations.

### `base/proto/feature_field_metadata.proto` — Field Provenance
- **Package:** `geostore`
- **Imports:** `datasourceprovider.proto`, `stable_field_path.proto`
- **Messages:** `FeatureFieldMetadataProto` with `FieldProvenance` (field_paths + provenance); `ProvenanceProto` (provider enum + dataset string)
- **Role:** Tracks which provider/dataset contributed each field value.
- **Feature Points:** Extensions 1000 to max for additional metadata; stable field path resolution.

---

## Geometry & Spatial Primitives

### `base/proto/point.proto` — Geographic Point
- **Package:** `geostore`
- **Imports:** `fieldmetadata.proto`
- **Messages:** `PointProto` — `lat_e7` (fixed32, required, 1e7 degrees), `lng_e7` (fixed32, required, 1e7 degrees), `metadata` (FieldMetadataProto), `temporary_data` (MessageSet)
- **Role:** Core coordinate primitive using E7 representation (microdegree precision). MessageSet extension at 14827556.
- **Feature Points:** Compact fixed32 encoding; E7 format for lat/lng.

### `base/proto/polyline.proto` — Polyline Geometry
- **Package:** `geostore`
- **Imports:** `point.proto`, `fieldmetadata.proto`
- **Messages:** `PolyLineProto` — `vertex` (repeated PointProto), `metadata` (FieldMetadataProto), `temporary_data` (MessageSet)
- **Role:** Ordered sequence of points representing a polyline (roads, borders, etc.).

### `base/proto/polygon.proto` — Polygon Geometry
- **Package:** `geostore`
- **Imports:** `polyline.proto`, `fieldmetadata.proto`
- **Messages:** `PolygonProto` — `loop` (repeated PolyLineProto, deprecated), `encoded` (bytes, compressed encoding), `base_meters` (float), `height_meters` (float), `cell_id` (uint64, deprecated), `unsuitable_for_display` (bool), `metadata`; MessageSet extension at 5464057
- **Role:** Polygon with optional extrusion (base/height for 3D), encoded format for efficient storage.
- **Feature Points:** Encoded bytes for compression; 3D extrusion support; display suitability flag.

### `base/proto/rect.proto` — Bounding Rectangle
- **Package:** `geostore`
- **Imports:** `point.proto`
- **Messages:** `RectProto` — `lo` (PointProto, required), `hi` (PointProto, required); MessageSet extension at 26764887
- **Role:** Axis-aligned bounding box defined by southwest and northeast corners.

### `base/proto/pose.proto` — 3D Pose (Position + Orientation)
- **Package:** `geostore`
- **Imports:** `options.proto`
- **Messages:** `PoseProto` — `index` (int32), `lat` (double), `lng` (double), `altitude` (double), `yaw` (double), `pitch` (double), `roll` (double)
- **Role:** 6-DOF pose for 3D object placement: lat/lng/alt + Euler angles.

### `base/proto/track.proto` — Track Geometry
- **Package:** `geostore`
- **Imports:** `pose.proto`
- **Messages:** `TrackProto` — `index` (int32), `pose` (repeated PoseProto)
- **Role:** Indexed sequence of 3D poses, used for vehicle paths/lane centerlines.

### `base/proto/cellcovering.proto` — S2 Cell Covering
- **Package:** `geostore`
- **Imports:** `options.proto`
- **Messages:** `CellCoveringProto` — `cell_id` (repeated uint64)
- **Role:** List of S2 cell IDs representing a spatial region covering. Used for indexing and geo-fencing.

### `base/proto/anchored_geometry.proto` — Anchored Geometry Reference
- **Package:** `geostore`
- **Messages:** `AnchoredGeometryProto` — `geometry_id` (string)
- **Role:** Reference to a separately-stored geometry by string ID.

### `base/proto/inferred_geometry.proto` — Inferred/Computed Geometry
- **Package:** `geostore`
- **Imports:** `featureid.proto`
- **Messages:** `InferredGeometryProto` — `geometry_composition`, `defines_geometry_for` (FeatureIdProto list); `GeometryComposition` — `includes_geometry_of` / `excludes_geometry_of` (FeatureIdProto lists)
- **Role:** Describes geometry that is derived from composing/trimming other features' geometries. Supports polygon boolean operations.

### `base/proto/geometry_store_reference.proto` — External Geometry Store
- **Package:** `geostore`
- **Imports:** `cityjson.proto`
- **Messages:** `GeometryStoreReferenceProto` — `geometry_id` (string), `geometry` (CityJsonProto), `footprint` (bytes)
- **Role:** References 3D building models stored externally, with optional inline CityJSON and footprint.

---

## Road Network & Routing

### `base/proto/segment.proto` — Road Segment (Central Road Model)
- **Package:** `geostore`
- **Imports:** 20+ imports (lane, restriction, speed_limit, gradelevel, pedestriancrossing, slope, etc.)
- **Messages:**
  - `SegmentProto` — `sibling` (paired segment), `route` (repeated FeatureIdProto), `route_association` (display metadata), `endpoint` (enum: UNKNOWN/UNRESTRICTED/UNCONTROLLED/STOP_SIGN/ALL_WAY_STOP/TRAFFIC_LIGHT/YIELD/MERGE/ROUNDABOUT/RAILROAD_CROSSING/NO_EXIT/WRONG_WAY/TOLL_BOOTH), `intersection` (FeatureIdProto), `restriction` (repeated), `lane` (repeated LaneProto), `on_right` (bool, driving side), `max_permitted_speed_kph` (float), `is_max_permitted_speed_derived`, `legal_maximum_speed` / `advisory_maximum_speed` / `legal_minimum_speed` (AppliedSpeedLimitProto lists), `avg_speed_kph`, `elevation` (enum: NORMAL/BRIDGE/TUNNEL/SKYWAY/STAIRWAY/ESCALATOR/ELEVATOR/SLOPEWAY/MOVING_WALKWAY), `surface` (enum: PAVED/ASPHALT/CONCRETE/UNPAVED/GRAVEL/DIRT/SAND...), `priority` (enum: NON_TRAFFIC/TERMINAL/LOCAL/MINOR_ARTERIAL/MAJOR_ARTERIAL/SECONDARY_ROAD/PRIMARY_HIGHWAY/LIMITED_ACCESS/CONTROLLED_ACCESS), `usage` (enum: RAMP/ROUNDABOUT/PEDESTRIAN_MALL/WALKWAY/TRAIL/CROSSING/OVERPASS/UNDERPASS...), `toll_road` (bool), `road_sign`, `grade_level`, `separated_roadways`, `barrier`, `altitude`, `construction_status` (PLANNED/STARTED/COMPLETE), `construction_begin_date`/`construction_end_date`, `condition` (GOOD/POOR), `bicycle_facility`, `bicycle_safety`, `pedestrian_facility`, `pedestrian_crossing`, `covered`, `pedestrian_grade`, `visible_landmark`, `distance_to_edge`, `sweep`, `road_monitor`, `slope`, `ramp`, `accident_prone_spot`, `related_median`, `road_disruption`, `inner_barrier`/`outer_barrier` (RoadBarrierProto), `signpost`, `road_enclosure`, `internal` (InternalSegmentProto)
  - `RouteAssociationProto` — `route`, `display_preference` (PREFERRED/BEST/OK/HIDE), `route_direction` (RouteDirection)
  - `LandmarkReferenceProto` — `landmark` (FeatureIdProto), `feature_type`, `travel_mode`
  - `SweepProto` — `polygon`, `other_segment_feature_id`, `sweep_curve` (CurveConnectionProto), `sweep_token`
  - `AccidentProneSpotProto` — fractions + source authority enum
  - `RoadBarrierProto` — `road_barrier_id`, `barrier_type` (TERRAIN/CURB/FENCE/GUARDRAIL/JERSEY/WALL...), `is_regularly_moved`, start/end fractions
  - `RoadEnclosureProto` — `enclosure_type` (BUILDING/TUBE/HIGHWAY_CAP/OVERHEAD_ROAD), start/end fractions
- **Role:** The central road network model. Represents directed road segments with comprehensive attributes for navigation, safety, and ADAS.
- **Feature Points:** 15+ enums for road attributes; lane-level detail; speed limit layering (legal/advisory/minimum); elevation category for grade separation; bicycle/pedestrian facility classification; construction lifecycle tracking; accident-prone spot markings; barrier typology with physical/legal distinction.

### `base/proto/lane.proto` — Lane-Level Model
- **Package:** `geostore`
- **Imports:** `curvature.proto`, `curve_connection.proto`, `featureid.proto`, `lane_marker.proto`, `restriction.proto`, `traffic_flow_adjustment.proto`, `track.proto`
- **Messages:**
  - `FlowLineProto` — `track` (TrackProto), `curvature` (CurvatureProto)
  - `LaneProto` — `lane_number`, `lane_id` (uint64), `shared`, `type` (NORMAL/PASSING/LEFT_TURN/RIGHT_TURN/BICYCLE/PARKING/EXIT_ENTRANCE/PEDESTRIAN/SIDEWALK_SHOULDER/MEDIAN/REVERSIBLE...), `sometimes_drivable_shoulder`, `lane_divider_crossing` (ALLOWED/DISALLOWED/LEGALLY_DISALLOWED/PHYSICALLY_IMPOSSIBLE), `outer_lane_divider_crossing`, `width`, `distance_to_next_lane`, `restriction`, `lane_connection` (LaneConnection with segment/lane_number/flow/curve/bounding_marker/primary_connection/yield_to_other), `surface` (PAVED/ASPHALT/CONCRETE/UNPAVED/GRAVEL/DIRT/SAND), `flow`, `stop_line`, `bounding_marker`, `conjoined_category` (SPLIT_LEFT/MIDDLE/RIGHT, MERGE variants), `toll_payments`, `traffic_flow_adjustments`, `lane_token`
  - `BoundingMarkerProto` — `bounding_marker_id`, `side` (LEFT/RIGHT), adjacency fractions, token; oneof: bounding_marker_status / bounding_marker (FeatureIdProto) / bounding_marker_pattern (LaneMarkerProto)
- **Role:** Detailed lane-level model for autonomous driving and advanced navigation. Includes lane connections with flow lines, lane dividers, and bounding markers.
- **Feature Points:** 20+ lane types; conjoined lane categories for split/merge; lane connections with curve geometry and flow lines; bounding marker system for physical lane boundaries; toll payment methods per lane; traffic flow adjustments (stop/slowdown).

### `base/proto/lane_marker.proto` — Lane Marking Patterns
- **Package:** `geostore`
- **Imports:** `options.proto`, `version_token_options.proto`
- **Messages:**
  - `LaneMarkerProto` — `linear_pattern`, `crossing_pattern`, `barrier_materials`
  - `LinearStripePatternProto` — repeated `PhysicalLineProto`
  - `PhysicalLineProto` — `pattern` (SOLID/DASHED/DOTTED/DOTTED_DASHED), `dash_length_meters`, `gap_length_meters`, `paint_color`, `gap_color`, `material` (PAINT_STRIPE/ROUND_DOT/SQUARE_DOT), `physical_line_token`
  - `CrossingStripePatternProto` — `stripe_pattern` (LONGITUDINAL/DIAGONAL/LATERAL/SINGLE_CROSSING_LINE/DOUBLE_CROSSING_LINE/TRIANGLE...), `border_pattern`, `border_line`, `color`
  - `BarrierLogicalMaterialProto` — `material` (CONCRETE/METAL/PLASTIC/STONE/TIMBER)
- **Role:** Physical lane marking definition for HD maps. Dash patterns, colors, barrier materials.
- **Feature Points:** 9 paint colors; 5 barrier materials; 10 crossing stripe patterns; version-tokenable for stable identity.

### `base/proto/segmentpath.proto` — Segment Path
- **Package:** `geostore`
- **Imports:** `featureid.proto`
- **Messages:** `SegmentPathProto` — `subpath` (repeated FeatureIdProto)
- **Role:** Ordered list of segment feature IDs forming a path through the road network.

### `base/proto/segment_portion.proto` — Segment Portion
- **Package:** `geostore`
- **Imports:** `featureid.proto`
- **Messages:** `SegmentPortionProto` — `segment_id`, `start_fraction` (default 0), `end_fraction` (default 1)
- **Role:** References a fractional portion of a segment, used for partial disruptions/restrictions.

### `base/proto/route.proto` — Route Proto
- **Package:** `geostore`
- **Messages:** `RouteProto` — `child_type` (int32)
- **Role:** Minimal route container. The child_type enum is extended via fieldtype.proto.
- **Feature Points:** Serves as an enumerated route type key.

### `base/proto/routedirection.proto` — Route Direction Enum
- **Package:** `geostore`
- **Enums:** `RouteDirection` — NONE/NORTH/EAST/SOUTH/WEST/NORTHEAST/NORTHWEST/SOUTHEAST/SOUTHWEST/INNER/OUTER
- **Role:** Cardinal and relative directions for route/signage.

### `base/proto/travel_mode.proto` — Travel Mode Enum
- **Package:** `geostore`
- **Enums:** `TravelMode` — UNSPECIFIED/MOTOR_VEHICLE/BICYCLE/PEDESTRIAN
- **Role:** High-level travel modality.

### `base/proto/travel_pattern.proto` — Travel Pattern (Boolean Logic)
- **Package:** `geostore`
- **Imports:** `timeschedule.proto`, `travel_mode.proto`, `vehicle_attribute_filter.proto`, `vehicle_occupancy_range.proto`
- **Messages:** `TravelPatternProto` — `direction` (IS/NOT), `operation` (MATCH/ALL_OF/ANY_OF), `terms` (recursive TravelPatternProto for boolean trees), oneof criterion: time_schedule / vehicle_attribute_filter / vehicle_occupancy_range / travel_mode
- **Role:** Composable boolean logic for travel restrictions. Supports AND/OR/NOT trees over time schedules, vehicle filters, occupancy, and mode.
- **Feature Points:** Recursive boolean expression tree; four criterion types; direction negation.

---

## Intersection Model

### `base/proto/intersection.proto` — Road Intersection
- **Package:** `geostore`
- **Imports:** `featureid.proto`, ProtoMesh
- **Messages:** `IntersectionProto` — `segment` (repeated FeatureIdProto, incoming), `out_segment` (repeated, outgoing), `intersection_group` (FeatureIdProto), `toll_cluster` (FeatureIdProto)
- **Role:** Represents a road junction. Tracks the set of incoming and outgoing segments, membership in intersection groups and toll clusters.
- **Feature Points:** In/out segment distinction for directed navigation; group and cluster membership.

### `base/proto/intersectiongroup.proto` — Intersection Group
- **Package:** `geostore`
- **Imports:** `featureid.proto`
- **Messages:** `IntersectionGroupProto` — `intersection` (repeated FeatureIdProto), `group_type` (GROUP_ARTIFACT/GROUP_LOGICAL), `child_group` (repeated), `parent_group`
- **Role:** Groups related intersections (e.g., all junction nodes of a complex interchange). Supports hierarchical nesting.
- **Feature Points:** Hierarchical grouping; artifact vs logical distinction.

### `base/proto/tollcluster.proto` — Toll Cluster
- **Package:** `geostore`
- **Imports:** `featureid.proto`, ProtoMesh
- **Messages:** `TollClusterProto` — `intersection` (repeated FeatureIdProto)
- **Role:** Groups intersections that form a toll collection area.

### `base/proto/toll_path.proto` — Toll Path
- **Package:** `geostore`
- **Imports:** `featureid.proto`
- **Messages:** `TollPathProto` with `TollClusterSequence` (indexed toll clusters), `IndexedTollCluster`
- **Role:** Ordered sequence of toll clusters along a path.

---

## Restrictions, Speed Limits & Signs

### `base/proto/restriction.proto` — Travel Restriction
- **Package:** `geostore`
- **Imports:** `autonomous_driving.proto`, `featureid.proto`, `fieldmetadata.proto`, `timeschedule.proto`, `travel_pattern.proto`, `vehicle_attribute_filter.proto`
- **Messages/Enums:**
  - `RestrictionProto` — `restriction_id` (uint64), `subpath` (FeatureIdProto list), `type` (enum: TRAVEL_RESTRICTED/ILLEGAL/PHYSICAL/LOGICAL/GATE/CONSTRUCTION/SEASONAL_CLOSURE/PRIVATE/WRONG_WAY/TERMINAL/PAYMENT_REQUIRED/TOLL_BOOTH/USAGE_FEE_REQUIRED/ENTRANCE_FEE_REQUIRED/VIGNETTE_REQUIRED/TOLL_REQUIRED/TOLL_FULL/TOLL_REDUCED/ADVISORY/HIGH_CRIME/POLITICALLY_SENSITIVE/DISTURBED_BY_MAINTENANCE/CHECKPOINT/REGION_SPECIFIC), `travel_mode` (TravelCategory enum: MOTOR_VEHICLE/AUTO/CARPOOL/MOTORCYCLE/BUS/TRUCK/DELIVERY/TAXI/EMERGENCY/THROUGH_TRAFFIC/AUTONOMOUS_VEHICLE/PEDESTRIAN/BICYCLE), `style` (CONTIGUOUS/SINGLE/TURN/IN_OUT), `intersection_group`, `scope` (DIRECTION/SIDE), `restriction_group`, `vehicle_attribute_filter`, `autonomous_driving_products`, `travel_pattern`, `is_variable`, `restriction_token`, oneof `restriction_timing` (TimeScheduleProto / TimeApplicability enum)
- **Role:** Comprehensive travel restriction model supporting legal, physical, payment, advisory, and region-specific restrictions with temporal and vehicle filtering.
- **Feature Points:** 20+ restriction types; 13 travel categories; 4 restriction styles (contiguous, single, turn, in-out); time-scheduled or local-indicator timing; vehicle attribute filtering; autonomous driving product targeting.

### `base/proto/restriction_group.proto` — Restriction Group
- **Package:** `geostore`
- **Imports:** `featureid.proto`, `restriction.proto`, `travel_pattern.proto`
- **Messages:** `RestrictionGroupProto` — `segment` (FeatureIdProto list), `travel_pattern_restrictions` (TravelPatternRestrictionProto with travel_pattern + restriction_type), `related_signposts`, `is_variable`
- **Role:** Groups related restrictions on a set of segments with travel pattern conditions.
- **Feature Points:** Travel-pattern-specific restriction types; signpost association.

### `base/proto/speed_limit.proto` — Speed Limits
- **Package:** `geostore`
- **Imports:** `timeschedule.proto`, `vehicle_attribute_filter.proto`, `vehicle_type.proto`
- **Messages:**
  - `SpeedProto` — `speed` (float), `unit` (MILES_PER_HOUR/KILOMETERS_PER_HOUR)
  - `VariableSpeedProto` — `fallback_speed`
  - `UnlimitedSpeedProto` — empty (German autobahn)
  - `SpeedLimitProto` — `category` (NONE/SCHOOL/CONSTRUCTION/STATUTORY), `condition` (RoadConditionalProto), `source_type` (EXPLICIT/IMPLICIT/IMPLICIT_FROM_SIGN), oneof: speed_with_unit / variable_speed / unlimited_speed
  - `RoadConditionalProto` — `time_schedule`, `vehicle_type`, `vehicle_attribute`
  - `AppliedSpeedLimitProto` — `speed_limit`, `trust_level` (LOW_QUALITY/HIGH_QUALITY/EXACT)
- **Role:** Speed limit model with conditional application (time/vehicle), variable limits, and trust levels.
- **Feature Points:** Conditional speed limits by time + vehicle; variable speed support; unlimited speed (autobahn); trust level for data quality.

### `base/proto/roadsign.proto` — Road Sign
- **Package:** `geostore`
- **Imports:** `roadsigncomponent.proto`
- **Messages:** `RoadSignProto` — `component` (repeated RoadSignComponentProto)
- **Role:** Container for road sign components. A sign may have multiple semantic components.

### `base/proto/roadsigncomponent.proto` — Road Sign Component
- **Package:** `geostore`
- **Imports:** `featureid.proto`, `name.proto`, `routedirection.proto`
- **Messages:** `RoadSignComponentProto` — `major_position`, `minor_position` (ordering), `semantic_type` (enum: PRIORITY/SPEED_LIMIT/RESTRICTION/WARNING/INFO/AUXILIARY with deep subtypes), `text` (NameProto), `feature_id`, `feature_type`, `route_direction`
- **Role:** Parsed road sign with semantic classification. Over 40 semantic types including priority (stop/yield), speed limits, restrictions (turn/movement/access), warnings, info boundaries, and auxiliary.
- **Feature Points:** Hierarchical semantic type tree; sign component ordering; direction association.

### `base/proto/sign.proto` — Physical Traffic Sign
- **Package:** `geostore`
- **Imports:** `stable_id_options.proto`
- **Messages:** `SignProto` — `sign_id` (uint64), `type` (SignType enum with 200+ values covering AUX_, DANGER_, DIRECTIONAL_, INFO_, PRIORITY_, RESTRICTION_, WARNING_ signs)
- **Role:** Enumerates physical traffic sign types (Vienna Convention + regional variants).
- **Feature Points:** 200+ sign type enumerations with stable IDs.

### `base/proto/signpost.proto` — Signpost (Physical Post)
- **Package:** `geostore`
- **Imports:** `featureid.proto`, `sign.proto`, ProtoMesh
- **Messages:** `SignpostProto` — `segment` (FeatureIdProto), `is_movable_post`, `sign` (repeated SignProto)
- **Role:** Physical signpost on a road segment, holding multiple signs and indicating if it's movable.

### `base/proto/curvature.proto` — Road Curvature
- **Package:** `geostore`
- **Messages:** `PointCurvatureProto` — `start_point_fraction`, oneof: radians_per_meter / curvature_status (UNKNOWN); `CurvatureProto` — repeated point_curvature
- **Role:** Curvature profile along a road segment (radians per meter) for ADAS/dynamics.

### `base/proto/curve_connection.proto` — Curve Connections
- **Package:** `geostore`
- **Messages:** `CurveConnectionProto` — `type` (BEZIER/CIRCLE/STRAIGHT_EDGE), oneof: bezier_params / circle_params
- **Role:** Defines curve types between lane connections (Bezier with control points, circle with radius, straight edge).

### `base/proto/slope.proto` — Road Slope
- **Package:** `geostore`
- **Messages:** `SlopeProto` — `start_point_fraction` (float), `slope_value` (float)
- **Role:** Slope profile along a road segment, referenced by segments.

### `base/proto/gradelevel.proto` — Grade Level Index
- **Package:** `geostore`
- **Messages:** `GradeLevelProto` — `index` (int32, required), `level` (int32, required)
- **Role:** Assigns a grade (elevation) level index to each point in a segment for overpass/underpass disambiguation.

### `base/proto/vertical_ordering.proto` — Vertical Ordering
- **Package:** `geostore`
- **Messages:** `VerticalOrderingProto` — `level` (float)
- **Role:** Assigns a vertical level to a feature for stacking relationships.

---

## Address Model

### `base/proto/address.proto` — Address
- **Package:** `geostore`
- **Imports:** `addresscomponent.proto`, `addresslines.proto`, `fieldmetadata.proto`
- **Messages:** `AddressProto` — `template_id` (string), `component` (repeated AddressComponentProto), `address_lines` (repeated AddressLinesProto), `cross_street` (deprecated), `partial_denormalization` (self-reference for denormalized/partial addresses), `metadata`; MessageSet extension at 12208774
- **Role:** Structured address composed of typed components and formatted lines. Supports partial denormalization for hybrid structured/unstructured addresses.
- **Feature Points:** Template-based address format; component-based structure; denormalization support.

### `base/proto/addresscomponent.proto` — Address Component
- **Package:** `geostore`
- **Imports:** `addressrange.proto`, `featureid.proto`, `name.proto`, `text_affix.proto`
- **Messages:** `AddressComponentProto` — `type` (enum: TYPE_FEATURE/TYPE_POSTAL_CODE_SUFFIX/TYPE_POST_BOX/TYPE_STREET_NUMBER/TYPE_FLOOR/TYPE_ROOM/TYPE_HOUSE_ID/TYPE_DISTANCE_MARKER/TYPE_LANDMARK/TYPE_PLUS_CODE), `parsed_name` (NameProto), `feature_type` (int32), `feature_id`, `range` (AddressRangeProto), `index`, `text_affix`
- **Role:** Typed address component that can reference a geostore feature (e.g., street), include a numeric range, and have text affixes.
- **Feature Points:** 10 component types; feature linking; range support; text affix for prefix/suffix.

### `base/proto/addresslines.proto` — Address Lines
- **Package:** `geostore`
- **Messages:** `AddressLinesProto` — `line` (repeated string), `language` (string)
- **Role:** Formatted address lines in a specific language (display-oriented).

### `base/proto/addressrange.proto` — Address Range
- **Package:** `geostore`
- **Messages:** `AddressRangeProto` — `number` (repeated int32), `parameter` (repeated float for interpolation), `same_parity` (bool, default true), `prefix`, `suffix`
- **Role:** Numeric address range with interpolation parameters and text decorations.
- **Feature Points:** Interpolation via float parameters; parity control.

### `base/proto/text_affix.proto` — Text Affix
- **Package:** `geostore`
- **Messages:** `TextAffixProto` — `language`, `prefix`, `suffix`
- **Role:** Language-specific prefix/suffix for address components.

---

## Names, Locales & Languages

### `base/proto/name.proto` — Feature Name
- **Package:** `geostore`
- **Imports:** `fieldmetadata.proto`
- **Messages:** `NameProto` — `text` (string, required), `language` (string), `flag` (repeated FlagCategory enum: IN_LOCAL_LANGUAGE/PREFERRED/OFFICIAL/OBSCURE/ON_SIGNS/EXIT_NAME_NUMBER/EXIT_NAME/INTERCHANGE_NAME/EXIT_NUMBER/TRANSIT_HEADSIGN/CONNECTS_DIRECTLY/CONNECTS_INDIRECTLY/INTERSECTION_NAME/VANITY/ROUTE_NUMBER/COUNTRY_CODE_2/ABBREVIATED/ID/IATA_ID/ICAO_ID/ISO_3166_2/TIMEZONE_ID/ROUNDABOUT_ROUTE/NEVER_DISPLAY/BICYCLE_ROUTE/MACHINE_GENERATED/TRADITIONAL etc.), `raw_text` (deprecated), `short_text`, `metadata`; MessageSet extension at 308676116
- **Role:** Multilingual feature name with rich flag taxonomy for display logic (signage, routing, IDs).
- **Feature Points:** 30+ name flags; short text variant; ID flags (IATA, ICAO, ISO etc.).

### `base/proto/languagetaggedtext.proto` — Language-Tagged Text
- **Package:** `geostore`
- **Messages:** `LanguageTaggedTextProto` — `text` (string), `language` (string)
- **Role:** Simple text+language pair, used throughout the schema.

### `base/proto/locale.proto` — Locale Definition
- **Package:** `geostore`
- **Imports:** `localelanguage.proto`, ProtoMesh
- **Messages:** `LocaleProto` — `language` (repeated LocaleLanguageProto), `localization_policy_id` (string)
- **Role:** Defines a geographic locale with its languages and localization policy.

### `base/proto/localelanguage.proto` — Locale Language
- **Package:** `geostore`
- **Messages:** `LocaleLanguageProto` — `language` (string, required), `preference` (float), `official` (bool), `speaking_percent` (float), `writing_percent` (float)
- **Role:** Language statistics and preference for a locale.

### `base/proto/bestlocale.proto` — Best Locale Assignment
- **Package:** `geostore`
- **Imports:** `featureid.proto`, `fieldmetadata.proto`, ProtoMesh
- **Messages:** `BestLocaleProto` — `localization_policy_id`, `locale` (FeatureIdProto), `metadata`
- **Role:** Assigns the best-matching locale to a feature for localization decisions.

### `base/proto/region_specific_name.proto` — Region-Specific Name
- **Package:** `geostore`
- **Imports:** `name.proto`
- **Messages:** `RegionSpecificNameProto` — `region_code` (string), `name` (NameProto), `displayable_as_alternative_name` (bool)
- **Role:** Region-coded alternative names (e.g., disputed territory naming).

---

## Buildings & 3D Models

### `base/proto/building.proto` — Building
- **Package:** `geostore`
- **Imports:** `featureid.proto`, `fieldmetadata.proto`, ProtoMesh
- **Messages:** `BuildingProto` — `structure` (enum: TOWER/DOME/CASTLE/SHRINE/TEMPLE/TANK), `floors`, `height_meters`, `base_height_meters_agl` (above ground level), `level` (repeated FeatureIdProto), `default_display_level`
- **Role:** Building attributes including structure type, floor count, height, and indoor level references.

### `base/proto/cityjson.proto` — CityJSON 3D Model
- **Package:** `geostore`
- **Imports:** `cityobject_attributes.proto`
- **Messages:** `CityJsonProto` with nested `Transform` (scale + translate), `CityObject` (id, type: BUILDING/OTHER_CONSTRUCTION, Geometry with LOD, semantics: WINDOW/DOOR, boundaries: MultiPoint/MultiSurface/Solid, Materials, CityObjectAttributes), `Appearance` (materials with diffuse colors, shininess, transparency, smoothness)
- **Role:** CityJSON format for 3D city models. Supports LOD, semantic surfaces, materials, and multiple geometry representations.
- **Feature Points:** Full CityJSON model; LOD support; semantic surface tagging; material system with RGB colors.

### `base/proto/cityobject_attributes.proto` — CityObject Affine Transforms
- **Package:** `geostore`
- **Messages:** `CityObjectAttributes` with `TrsAffineTransform` (scale, rotate, translate)
- **Role:** TRS (translate/rotate/scale) transforms for CityJSON city objects.

### `base/proto/threedimensionalmodel.proto` — 3D Model (Mesh)
- **Package:** `geostore`
- **Imports:** `point.proto`
- **Messages:** `PointWithHeightProto` — `point` (PointProto), `altitude_meters`; `ThreeDimensionalModelProto` — `points` (repeated PointWithHeightProto), `point_indices` (repeated int32 for triangle mesh)
- **Role:** Simple triangle mesh 3D model with indexed vertices and heights.

---

## Establishments & POI

### `base/proto/establishment.proto` — Business/POI Establishment
- **Package:** `geostore`
- **Imports:** `featureid.proto`, `openinghours.proto`, `priceinfo.proto`, `service_area.proto`, `telephone.proto`, `timeschedule.proto`, ProtoMesh
- **Messages:**
  - `EstablishmentProto` — `type` (TypeCategory enum with 400+ business categories: LODGING/HOTEL/RESTAURANT/CAFE/FAST_FOOD/GAS_STATION/PARKING/AIRPORT/HOSPITAL/SCHOOL/POLICE/MUSEUM/PARK/GOLF_COURSE/STADIUM/LIBRARY/CHURCH/MOSQUE/TEMPLE/...), `telephone`, `hours` (TimeScheduleProto), `opening_hours` (OpeningHoursProto), `bizbuilder_reference`, `price_info`, `service_area`, `routing_destination`
  - `BizBuilderReferenceProto` — `id` (int64)
- **Role:** Rich business/POI categorization with over 400 types organized hierarchically. Includes contact, hours, pricing, and service area.
- **Feature Points:** 400+ business categories with multi-level hierarchy; BizBuilder integration.

### `base/proto/business_chain.proto` — Business Chain
- **Package:** `geostore`
- **Imports:** `canonical_gconcept.proto`
- **Messages:** `BusinessChainProto` — `canonical_gconcepts` (repeated CanonicalGConceptProto)
- **Role:** Associates an establishment with business chain knowledge graph concepts.

### `base/proto/service_area.proto` — Service/Delivery Area
- **Package:** `geostore`
- **Imports:** `featureid.proto`, ProtoMesh
- **Messages:** `ServiceAreaProto` — `served_feature` (repeated FeatureIdProto)
- **Role:** Defines the geographic area served by a business (delivery, service coverage).

---

## Parking

### `base/proto/parking.proto` — Parking
- **Package:** `geostore`
- **Imports:** `featureid.proto`, `languagetaggedtext.proto`, `openinghours.proto`, `timebasedrate.proto`, `timeschedule.proto`, Freebase topics
- **Messages/Enums:**
  - `ParkingProto` — `parking_available` (bool), `parking_provider_feature`, `parking_association`, `opening_hours`, `allowance` (ParkingAllowanceProto), `restriction` (ParkingRestrictionProto)
  - `ParkingRestrictionProto` — `restricted_hours`, `service_type` (TravelServiceType: ALL/GENERAL_DRIVER/RIDESHARE/TAXI/COMMERCIAL), `vehicle_type`, `restriction_type` (PARKING/STANDING/STOPPING/PICKUP_GOODS/PICKUP_PASSENGERS)
  - `ParkingAllowanceProto` — `allowance_type` (STANDARD/VALET/PERMIT/PICKUP_GOODS/PICKUP_PASSENGERS), `vehicle_type` (ANY/CAR/MOTORCYCLE/TRUCK), `service_type`, `permit_type` (LanguageTaggedText), `min_purchase_for_validation` (Freebase topics), `is_discount`, `time_based_rate`
  - `ParkingAssociationProto` — `associated_parking_feature`, `is_onsite`
- **Role:** Comprehensive parking model: availability, restrictions (parking/standing/stopping with time/vehicle/service constraints), allowances (valet/permit/discount), and time-based rates.
- **Feature Points:** Parking-onsite association; time-based rates with purchase validation; rideshare/taxi service differentiation.

---

## Opening Hours & Time

### `base/proto/openinghours.proto` — Opening Hours
- **Package:** `geostore`
- **Imports:** `businesshours.proto`, `exceptionalhours.proto`
- **Messages:** `OpeningHoursProto` — `regular_hours` (BusinessHoursProto), `exception` (repeated ExceptionalHoursProto); MessageSet extension at 98510069
- **Role:** Combines regular business hours with exceptional (holiday, special) hours.

### `base/proto/businesshours.proto` — Business Hours (Wrapper)
- **Package:** `geostore`
- **Imports:** `fieldmetadata.proto`, external `repository/docchart/extraction/businesshours.proto`
- **Messages:** `BusinessHoursProto` — `data` (BusinessHours from external proto), `metadata`
- **Role:** Wraps the structured BusinessHours type from the repository system.

### `base/proto/exceptionalhours.proto` — Exceptional Hours
- **Package:** `geostore`
- **Imports:** `businesshours.proto`, `fieldmetadata.proto`, `timeschedule.proto`
- **Messages:** `ExceptionalHoursProto` — `range` (TimeIntervalProto), `hours` (BusinessHoursProto), `metadata`
- **Role:** Hours for a specific date range (holiday, special event).

### `base/proto/openingstatus.proto` — Opening Status Enum
- **Package:** `geostore`
- **Enums:** `OpeningStatus` — UNSPECIFIED/FUTURE_OPENING/OPEN/TEMPORARILY_CLOSED/PERMANENTLY_CLOSED
- **Role:** Simple business status enum.

### `base/proto/timeschedule.proto` — Time Schedule
- **Package:** `geostore`
- **Imports:** (none external)
- **Messages:**
  - `TimeEndpointProto` — `second`, `minute`, `hour`, `day`, `day_type` (DAY_OF_WEEK/DAY_OF_MONTH/DAY_OF_YEAR), `week`, `week_type` (WEEK_OF_MONTH/WEEK_OF_YEAR), `month` (JANUARY-DECEMBER + NEXT_JANUARY), `year`, `DayOfWeek` enum (SUNDAY-SATURDAY + NEXT_SUNDAY)
  - `TimeIntervalProto` — `type` (OCCASION/RANGE), `inverted` (bool), `occasion` (SEASON/DAYS/HOURS/CONDITIONS with deep subtypes: WINTER/SUMMER/SCHOOL/HOLIDAY/PEAK/DUSK_TO_DAWN/HIGH_TIDE/HIGH_WATER/ADVERSE/AVALANCHE/SNOW/ICE...), `begin`/`end` (TimeEndpointProto)
  - `TimeComponentProto` — `interval` (repeated), `component_type` (POSITIVE/MISSING_DATA)
  - `TimeScheduleProto` — `component` (repeated TimeComponentProto); MessageSet extension at 15256124
- **Role:** Sophisticated temporal expression system. Supports recurring schedules, day-of-week/month/year, seasonal occasions, weather conditions, and positive/negative components.
- **Feature Points:** 30+ occasion categories; day-type precision; inverted intervals; component-based composition.

### `base/proto/datetime.proto` — DateTime
- **Package:** `geostore`
- **Messages:** `DateTimeProto` — `seconds` (double, Unix timestamp), `precision` (enum: CENTURY/DECADE/YEAR/MONTH/DAY/HOUR/MINUTE/SECOND); MessageSet extension at 15303159
- **Role:** Timestamp with explicit precision level.

---

## Pricing & Payments

### `base/proto/priceinfo.proto` — Price/Menu Information
- **Package:** `geostore`
- **Imports:** `price_info_category.proto`, `price_info_food_attribute_details.proto`, `pricerange.proto`, `timeschedule.proto`, `url.proto`, `urllist.proto`, `google/protobuf/duration.proto`
- **Messages:**
  - `PriceInfoProto` — `price_list_url`, `price_list` (repeated PriceListProto), `status` (PriceInfoStatus)
  - `PriceInfoStatus` — `is_verified` (bool)
  - `PriceListProto` — `name_info`, `source_url`, `available_time`, `section` (PriceListSectionProto), `cuisines` (PriceInfoFoodCuisine), `aggregator_id`
  - `PriceListSectionProto` — `name_info`, `item_type` (PriceInfoCategory: FOOD/SERVICE/PRODUCT/JOB), `food_item`, `composable_item`, `media`, `call_to_action`
  - `FoodMenuItemProto` — `name_info`, `item_option` (FoodMenuItemOptionProto)
  - `ComposableItemProto` — `name_info`, `media`, `price` (PriceRangeProto), `price_format` (DEFAULT/VARIES), `call_to_action`, `offered`, `ranking_hint`, oneof: `job_metadata`
  - `FoodMenuItemOptionProto` — `name_info`, `price`, `calories`, `spiciness` (NONE/MILD/MEDIUM/HOT), `allergen_present`/`allergen_absent` (DAIRY/EGG/FISH/PEANUT/SHELLFISH/SOY/TREE_NUT/WHEAT), `restriction` (HALAL/KOSHER/ORGANIC/VEGAN/VEGETARIAN), `nutrition_facts`, `ingredients`, `serves_num_people`, `preparation_methods`, `media`, `portion_size`
  - `CallToActionProto` — `cta_type` (BOOK/BUY/ORDER_ONLINE/LEARN_MORE/SIGN_UP/GET_OFFER), oneof payload: url
  - `MediaItemProto` — `google_url`, `media_key`, `media_size` (width/height), `media_format` (PHOTO)
- **Role:** Full restaurant menu and service pricing model. Structured menu items with options, allergens, dietary info, nutrition facts, media, and call-to-action buttons. Supports aggregator-sourced data (verified status).
- **Feature Points:** Structured menu hierarchy (price list → section → item → option); allergen and dietary restriction labeling; nutrition facts; food preparation methods; portion sizes; CTA integration; media photos.

### `base/proto/price_info_category.proto` — Price Info Categories
- **Package:** `geostore`
- **Enums:** `PriceInfoCategory` — TYPE_ANY/TYPE_FOOD/TYPE_SERVICE/TYPE_PRODUCT/TYPE_JOB/TYPE_3P_JOB
- **Role:** Categorizes the type of priced item.

### `base/proto/price_info_food_attribute_details.proto` — Food Details
- **Package:** `geostore`
- **Messages/Enums:**
  - `PriceInfoFoodNutritionFacts` — `calories` (CaloriesFact with range + unit: CALORIE/JOULE), `total_fat`, `cholesterol`, `sodium`, `total_carbohydrate`, `protein` (NutritionFact with range + mass unit: GRAM/MILLIGRAM)
  - `PriceInfoFoodCuisine` — 30 cuisine types (FAST_FOOD/AMERICAN/JAPANESE/ITALIAN/MEXICAN/INDIAN/THAI/FRENCH...)
  - `PriceInfoFoodPreparationMethod` — 25 methods (BAKED/BOILED/GRILLED/FRIED/ROASTED/FERMENTED/MARINATED...)
- **Role:** Nutrition facts, cuisine types, and preparation methods for food menus.

### `base/proto/pricerange.proto` — Price Range
- **Package:** `geostore`
- **Imports:** `options.proto`
- **Messages:** `PriceRangeProto` — `lower_price`, `upper_price`, `currency` (string), `units` (UnitsCategory enum: PER_USE/PER_PHONE_CALL/PER_RIDE/PER_TIME_UNIT→PER_SECOND/MINUTE/HOUR/DAY/WEEK/MONTH/YEAR/PER_VOLUME_UNIT→PER_LITER/GLASS/BOTTLE/PER_LENGTH_UNIT→PER_METER/KILOMETER/PER_MASS_UNIT→PER_GRAM/KILOGRAM/OUNCE/POUND); MessageSet extension at 15000834
- **Role:** Price range with currency and unit specification.
- **Feature Points:** 20+ unit types across use/time/volume/length/mass dimensions.

### `base/proto/durationbasedrate.proto` — Duration-Based Rate
- **Package:** `geostore`
- **Imports:** Freebase topics
- **Messages:** `DurationBasedRateProto` — `range_start_seconds`, `range_end_seconds`, `is_free` (bool), `price` (Freebase Topic), `periodicity_seconds`
- **Role:** Parking/time-based rate with duration ranges and periodicity.

### `base/proto/timebasedrate.proto` — Time-Based Rate
- **Package:** `geostore`
- **Imports:** `durationbasedrate.proto`, `timeschedule.proto`
- **Messages:** `TimeBasedRateProto` — `duration_based_rate` (repeated), `valid_start_within` / `valid_end_within` (TimeScheduleProto), `tax_included`
- **Role:** Groups duration-based rates with validity windows.

---

## Existence & Lifecycle

### `base/proto/existence.proto` — Feature Existence Status
- **Package:** `geostore`
- **Imports:** `datetime.proto`, ProtoMesh
- **Messages:** `ExistenceProto` — `removed` (bool), `removed_reason` (enum: BOGUS/PRIVATE/PRIVATE_MUST_PURGE/SPAM/UNSUPPORTED/PENDING/DUPLICATE/OLD_SCHEMA/REPLACED/ROLLED_BACK/LEGAL_TRADEMARK/LEGAL_OTHER), `closed` (bool), `close_reason` (enum: CLOSED/MOVED/REBRANDED), `start_date`, `end_date`, `end_as_of_date`, `prevent_revival` (bool); MessageSet extension at 1321489
- **Role:** Tracks feature removal/closure with detailed reasons. Supports temporal existence windows and revival prevention.
- **Feature Points:** Separate removed and closed states; legal removal reasons; revival prevention flag.

### `base/proto/existence_confirmation.proto` — Existence Confirmation
- **Package:** `geostore`
- **Imports:** `data_agent.proto`, `datetime.proto`
- **Messages:** `ExistenceConfirmationProto` — `originator` (DataAgentProto), `utc_confirmation_time`, `utc_confirmation_receipt_time`
- **Role:** Records who confirmed a feature's existence and when.

### `base/proto/data_agent.proto` — Data Agent Identity
- **Package:** `geostore`
- **Messages:** `DataAgentProto` — oneof id: `mid` (string)
- **Role:** Identifies a data agent by machine ID.

---

## Transit

### `base/proto/transitline.proto` — Transit Line
- **Package:** `geostore`
- **Imports:** `featureid.proto`, ProtoMesh
- **Messages:** `TransitLineProto` — `agency` (FeatureIdProto list), `vehicle_type` (enum: RAIL/METRO_RAIL/SUBWAY/TRAM/MONORAIL/HEAVY_RAIL/COMMUTER_TRAIN/HIGH_SPEED_TRAIN/LONG_DISTANCE_TRAIN/BUS/INTERCITY_BUS/TROLLEYBUS/FERRY/CABLE_CAR/GONDOLA_LIFT/FUNICULAR/HORSE_CARRIAGE/AIRPLANE), `label_background_color` (fixed32 ARGB), `label_text_color` (fixed32 ARGB), `stations` (FeatureIdProto list)
- **Role:** Transit line with vehicle type, agency, color coding for maps, and station list.
- **Feature Points:** 20 vehicle types; map label colors; station ordering.

### `base/proto/transit_line_variant.proto` — Transit Line Variant
- **Package:** `geostore`
- **Imports:** `featureid.proto`
- **Messages:** `TransitLineVariantProto` — `stops` (repeated ServicedStopProto), `line_concept` (FeatureIdProto); `ServicedStopProto` — `id`, `index`
- **Role:** A specific service pattern (variant) of a transit line with ordered stops.

### `base/proto/transitstation.proto` — Transit Station
- **Package:** `geostore`
- **Imports:** `featureid.proto`
- **Messages:** `TransitStationProto` — `agency_associations` (TransitAgencyAssociationProto: agency feature + station_code), `StationCategory` enum (UNKNOWN/STOP_GROUP)
- **Role:** Transit station with agency associations and station codes.

### `base/proto/attachments/transit/transit_entrance_attachment.proto` — Transit Entrance Attachment
- **Package:** `geostore.attachments`
- **Imports:** `featureid.proto`, `languagetaggedtext.proto`, `tools/public/annotations.proto`
- **Messages:** `TransitEntranceAttachmentProto` — `accessibility` (NONE/WHEELCHAIR), `mode` (ELEVATOR/ESCALATOR/STAIRS/RAMP/WALKWAY), `connected_station_ids`, `heading` (int32), `indoor_connections` (POI references); MessageSet extension at 122556540
- **Role:** Transit entrance details including accessibility, mode of access, heading direction, and indoor POI connections.

---

## EV Charging

### `base/proto/ev_charger.proto` — EV Charger
- **Package:** `geostore`
- **Imports:** `featureid.proto`, ProtoMesh
- **Messages:** `EvChargerProto` — `uid` (OperatorUidProto: operator_id + uid), `evse_id`, `connectors` (ConnectorProto: type enum J_1772/MENNEKES/CHADEMO/CCS_COMBO_1/CCS_COMBO_2/GB_T/WALL_OUTLET/LECCS/TYPE_6/NACS/TYPE_3C/TYPE_3A/IEC_60309 variants, max_power_kw, max_current_amps, max_voltage_volts), `ev_station` (FeatureIdProto)
- **Role:** Individual EV charger with connector types, power ratings, and station association.
- **Feature Points:** 15 connector types including NACS (Tesla); three power dimensions (kW, amps, volts).

### `base/proto/ev_station.proto` — EV Charging Station
- **Package:** `geostore`
- **Imports:** `emobility_ids.proto`, `featureid.proto`, `gelfs_ids.proto`, ProtoMesh
- **Messages:** `EvStationProto` — `external_id` (ExternalStationIdProto: id + source enum TESLA), `ocpi_id` (EMobilityLocationIdProto), `gelfs_id` (GelfsLocationIdProto), `oem_restriction` (NONE/TESLA/NACS_PARTNER/RIVIAN), `associated_host`, `ev_chargers` (FeatureIdProto list)
- **Role:** EV charging station with external IDs (Tesla, OCPI, GELFS), OEM restrictions, charger inventory.
- **Feature Points:** Multi-ID system (OCPI, GELFS, Tesla); OEM access restrictions.

### `base/proto/emobility_ids.proto` — E-Mobility Location IDs
- **Package:** `geostore`
- **Messages:** `EMobilityLocationIdProto` — `country_code`, `party_id`, `location_id`
- **Role:** OCPI-compatible e-mobility location identifier.

### `base/proto/gelfs_ids.proto` — GELFS Location IDs
- **Package:** `geostore`
- **Messages:** `GelfsLocationIdProto` — `provider_id`, `country_code`, `location_id`
- **Role:** GELFS (Google EV Location Feed Specification) location identifier.

---

## Elevation & Terrain

### `base/proto/elevation.proto` — Feature Elevation
- **Package:** `geostore`
- **Imports:** `peak.proto`
- **Messages:** `ElevationProto` — `average_elevation_meters` (double), `peak` (PeakProto)
- **Role:** Average elevation and peak prominence for natural features.

### `base/proto/peak.proto` — Peak Prominence
- **Package:** `geostore`
- **Messages:** `PeakProto` — `prominence_meters` (double)
- **Role:** Topographic prominence of a peak in meters.

### `base/proto/elevationmodel.proto` — Elevation Model
- **Package:** `geostore`
- **Messages:** `ElevationModelProto` — `data_level` (int32, required), `data_maxlevel` (int32, required), `partial_child_data_available` (bool), `full_child_data_available` (bool), `blend_order` (int32), `elevation_data` (MessageSet)
- **Role:** References a tiled elevation model with level-of-detail hierarchy.
- **Feature Points:** Multi-resolution LOD; blend ordering; partial/full child availability.

---

## Borders & Geopolitical

### `base/proto/border.proto` — Border
- **Package:** `geostore`
- **Imports:** `featureid.proto`, ProtoMesh
- **Messages:** `BorderProto` — `type` (int32, required, enumerated via fieldtype), `status` (NORMAL/DISPUTED/UNSURVEYED/INTERNATIONAL_WATER/NEVER_DISPLAY/TREATY/PROVISIONAL/NO_LABEL), `feature_id_left` / `feature_id_right`, `override_status` (OverrideBorderStatusProto: status + country_code), `logical_border` (FeatureIdProto list)
- **Role:** Border with sidedness (left/right features), status including disputed/un-surveyed, per-country status overrides, and logical border composition.
- **Feature Points:** Bilateral border with left/right disambiguation; per-country status overrides for disputed territories; logical border segments.

### `base/proto/logical_border.proto` — Logical Border
- **Package:** `geostore`
- **Imports:** `featureid.proto`, ProtoMesh
- **Messages:** `LogicalBorderProto` — `border_segment` (FeatureIdProto list), `status` (NORMAL/DISPUTED)
- **Role:** Groups border segments into a logical border with unified status.

### `base/proto/geopolitical.proto` — Geopolitical Features
- **Package:** `geostore`
- **Imports:** `featureid.proto`, `polygon.proto`, `region_specific_name.proto`
- **Messages:** `GeopoliticalProto` — `region_specific_name`, `conveys_attribution_to`, `regional_polygon_composing_claims` (region_code + included/excluded claims), `regional_polygon_adjustment` (region_code + polygon_to_add / polygon_to_subtract)
- **Role:** Geopolitical feature modeling for countries/regions with disputed claims support, regional polygon adjustments, and attribution.
- **Feature Points:** Per-region polygon composition from claims; polygon addition/subtraction adjustments; attribution tracking.

### `base/proto/geopolitical_geometry.proto` — Geopolitical Geometry
- **Package:** `geostore`
- **Imports:** `polygon.proto`
- **Messages:** `GeopoliticalGeometryProto` — `self_polygon`, `rest_of_world_polygon`
- **Role:** Pre-computed self and "rest of world" polygons for geopolitical features.

### `base/proto/political.proto` — Political Attributes
- **Package:** `geostore`
- **Imports:** `featureid.proto`
- **Messages:** `PoliticalProto` — `population` (deprecated), `capital` (deprecated), `gross_domestic_product_usd_millions` (deprecated), `literacy_percent` (deprecated), `claim` (FeatureIdProto list)
- **Role:** Political claims association. Most statistical fields deprecated.

### `base/proto/disputed_area.proto` — Disputed Area
- **Package:** `geostore`
- **Imports:** `featureid.proto`
- **Messages:** `DisputedAreaProto` — `administered_by` (string), `claimant` (FeatureIdProto list)
- **Role:** Identifies disputed areas with administrator and claimants.

---

## Relations

### `base/proto/relation.proto` — Feature Relations
- **Package:** `geostore`
- **Imports:** `featureid.proto`, `fieldmetadata.proto`, `name.proto`
- **Messages:** `RelationProto` — `relation` (RelationCategory enum: OVERLAPS/CONTAINED_BY/EQUAL_TO/CAPITAL_OF/DISAMBIGUATED_BY/NEIGHBOR_OF/OPPOSITE_TO/NEXT_TO/RIGHT_OF/LEFT_OF/BEHIND/IN_FRONT_OF/SAME_BUILDING/ABOVE/BELOW/NEAR/ORGANIZATIONALLY_PART_OF/DEPARTMENT_OF/WORKS_AT/INDEPENDENT_ESTABLISHMENT_IN/ON_LEVEL/OCCUPIES/BUSINESS_LIFE_CYCLE/BUSINESS_MOVED/BUSINESS_REBRANDED/MEMBER_OF_CHAIN/AUTHORIZED_DEALER_FOR_CHAIN/SUBSIDIARY_OF/PRIMARILY_OCCUPIED_BY/CLIENT_DEFINED), `other_feature_id`, `other_feature_type` (required int32), `other_feature_country_code`, `other_feature_territorial_administrator`, `other_feature_name`, `relation_is_reversed`
- **Role:** Rich relationship taxonomy between features. Supports spatial (contains, overlaps, neighbor), organizational (part-of, subsidiary, chain), lifecycle (moved, rebranded), and positional (above/below, left/right) relations.
- **Feature Points:** 40+ relation types; spatial, organizational, lifecycle, and positional semantics; reversibility flag.

---

## Access Points & Entrances

### `base/proto/accesspoint.proto` — Access Point
- **Package:** `geostore`
- **Imports:** `featureid.proto`, `fieldmetadata.proto`, `point.proto`
- **Messages:** `AccessPointProto` — `point` (PointProto), `feature_id`, `feature_type`, `segment_position` (float), `point_on_segment`, `point_off_segment`, `can_enter` / `can_exit`, `priority` (PRIMARY/SECONDARY), `unsuitable_travel_mode` (MOTOR_VEHICLE/AUTO/TWO_WHEELER/BICYCLE/PEDESTRIAN/PUBLIC_TRANSIT), `level_feature_id`, `metadata`
- **Role:** Defines how to access a feature from the road network: entry/exit points along a segment with travel mode constraints.
- **Feature Points:** On/off-segment point disambiguation; enter/exit flags; travel mode suitability; primary/secondary priority.

### `base/proto/entrance.proto` — Entrance
- **Package:** `geostore`
- **Imports:** `languagetaggedtext.proto`, `travel_pattern.proto`
- **Messages:** `EntranceProto` — `allowance` (ENTER_AND_EXIT/ENTER_ONLY/EXIT_ONLY), `entry_rule` (EntryRuleProto with travel_pattern), `qualifier_text` (LanguageTaggedTextProto)
- **Role:** Entrance definition with directional allowance, travel pattern rules, and qualifier text.
- **Feature Points:** Entry/exit direction control; travel-pattern-based entry rules.

### `base/proto/entrance_reference.proto` — Entrance Reference
- **Package:** `geostore`
- **Imports:** `featureid.proto`, ProtoMesh
- **Messages:** `EntranceReferenceProto` — `feature_id`
- **Role:** Lightweight reference to an entrance feature.

---

## Data Sources & Provenance

### `base/proto/datasource.proto` — Data Source
- **Package:** `geostore`
- **Imports:** `datasourceprovider.proto`, `datetime.proto`, `rawmetadata.proto`, `url.proto`
- **Messages:** `DataSourceProto` — `description`, `copyright_owner`, `copyright_year`, `release_date`, `release`, `raw_metadata`, `provider` (enum from DataSourceProvider), `importer_timestamp`, `importer_build_info`, `importer_build_target`, `importer_client_info`, `source_dataset`, `attribution_url`, `importer_mpm_version`
- **Role:** Metadata about a data source including provider, copyright, release info, importer details, and attribution URLs.

### `base/proto/datasourceprovider.proto` — Data Source Provider Enum
- **Package:** `geostore` (proto3 syntax)
- **Messages:** `DataSourceProvider` with `Provider` enum — 50+ provider values including NAVTEQ (deprecated), TELE_ATLAS (and subtypes), TELCONTAR, EUROPA, ROYAL_MAIL, GOOGLE (and ~30 subtypes: HAND_EDIT, BORDERS, GT_FUSION, ZAGAT_CMS, BUSINESS_CHAINS, DISTILLERY, MAPSPAM, WIPEOUT, BEEGEES, etc.)
- **Role:** Comprehensive provider taxonomy for data provenance.
- **Feature Points:** 50+ provider enumerations; deprecated providers marked; Google internal tooling providers.

### `base/proto/sourceinfo.proto` — Source Info
- **Package:** `geostore`
- **Imports:** `datetime.proto`, `featureid.proto`, `rawdata.proto`, `url.proto`, `user.proto`
- **Messages:** `SourceInfoProto` — `source_id` (FeatureIdProto), `raw_data` (RawDataProto), `cookie`, `provider` (int32), `release`, `dataset`, `layer`, `ogr_fid` (int64), `gaia_id` (deprecated), `user` (UserProto), `impersonation_user`, `collection_date`, `attribution_url`, `stream_id`; MessageSet extension at 18502900
- **Role:** Per-feature attribution: which provider, dataset, and user contributed this data, with raw data payload and collection timestamp.

### `base/proto/sourceinfolist.proto` — Source Info List
- **Package:** `geostore`
- **Imports:** `sourceinfo.proto`
- **Messages:** `SourceInfoListProto` — `source_info` (repeated SourceInfoProto)
- **Role:** Collection of source info entries.

### `base/proto/rawdata.proto` — Raw Data
- **Package:** `geostore`
- **Messages:** `RawDataProto` — `key` (string, required), `value_string` (string)
- **Role:** Key-value pair for raw source data.

### `base/proto/rawmetadata.proto` — Raw Metadata
- **Package:** `geostore`
- **Messages:** `RawMetadataProto` — `key` (required), `label` (required), `description` (required), `conflation_method` (enum: PICK_FIRST_VALUE/UNION_CSV/SUM)
- **Role:** Metadata about raw data fields including conflation strategy.

### `base/proto/user.proto` — User Identity
- **Package:** `geostore`
- **Imports:** `net/proto2/proto/descriptor.proto`
- **Messages:** `UserProto` — `encrypted_gaia_id` (bytes), `encryption_key_name`, `keystore_config_id`, `username`; field option extensions for encryption_key_name_field and keystore_config_id_field
- **Role:** Encrypted user identity for edit attribution.

---

## Attributes & Knowledge Graph

### `base/proto/attribute.proto` — Generic Attribute
- **Package:** `geostore`
- **Imports:** `fieldmetadata.proto`
- **Messages:**
  - `AttributeProto` — typed key-value pair: `canonical_attribute_id`/`value_space_id` (AttributeIdProto), `value_type` (STRING/INTEGER/DOUBLE/BOOLEAN/INT64/FLOAT/UINT32/ENUM_ID), value fields (string_value/integer_value/int64_value/uint32_value/double_value/float_value/boolean_value/enum_id_value), `attribute_display`/`value_display` (deprecated)
  - `AttributeIdProto` — `id` (string, required), `provider_id` (string, required), `type` (ITEMCLASS/ATTRIBUTE/VALUESPACE/DATASTORE)
- **Role:** Flexible typed attribute system for key-value data with provider-scoped IDs.
- **Feature Points:** 8 value types; provider-scoped attribute IDs; enum ID value type.

### `base/proto/gconceptinstance.proto` — Knowledge Graph Concept Instance
- **Package:** `geostore`
- **Imports:** `fieldmetadata.proto`
- **Messages:** `GConceptInstanceProto` — `gconcept_id` (string), `prominence` (NON_PRIMARY/PRIMARY)
- **Role:** Links features to knowledge graph concepts with prominence weighting.

### `base/proto/canonical_gconcept.proto` — Canonical GConcept
- **Package:** `geostore`
- **Imports:** `gconceptinstance.proto`
- **Messages:** `CanonicalGConceptProto` — `gconcept` (GConceptInstanceProto), `is_required` (bool)
- **Role:** Canonical knowledge graph concept with required flag.

### `base/proto/knowledgegraphreference.proto` — KG Reference
- **Package:** `geostore`
- **Messages:** `KnowledgeGraphReferenceProto` — `id` (string); MessageSet extension at 157211294
- **Role:** Simple KG entity reference by ID.

---

## Trust & Rights

### `base/proto/trustsignals.proto` — Trust Signals
- **Package:** `geostore`
- **Messages:** `SourceTrustProto` — `level` (enum: BLOCKED/NOT_TRUSTED/YP_FEEDS/TRUSTED/SUPER_TRUSTED); `TrustSignalsProto` — `source_trust`; MessageSet extension at 24882046
- **Role:** Source trust classification for data quality.
- **Feature Points:** 6 trust levels from BLOCKED to SUPER_TRUSTED.

### `base/proto/rightslevel.proto` — Rights Level
- **Package:** `geostore`
- **Messages/Enums:** `RightsLevelWrapper` — `rights_level`; `RightsLevel` — UNKNOWN_RIGHTS/GT_RIGHTS/FULL_RIGHTS
- **Role:** Access rights classification for fields.

### `base/proto/property_value_status.proto` — Property Value Status
- **Package:** `geostore`
- **Imports:** `edit/feature_property_id.proto`, `property_value_status_enum.proto`
- **Messages:** `PropertyValueStatusProto` — `property_id` (FeaturePropertyIdProto), `value_status` (PropertyValueStatus)
- **Role:** Tracks whether a property has a known value, unknown value, or no value.

### `base/proto/property_value_status_enum.proto` — Value Status Enum
- **Package:** `geostore`
- **Enums:** `PropertyValueStatus` — UNSPECIFIED/HAS_NO_VALUE/HAS_UNKNOWN_VALUE
- **Role:** Enum for property value presence/absence.

---

## Ranking

### `base/proto/rankdetails.proto` — Rank Details
- **Package:** `geostore`
- **Imports:** `ranksignal.proto`
- **Messages:** `RankDetailsProto` — `signal` (repeated RankSignalProto), `signal_mixer_type` (enum: 40+ mixer types: ADDRESS_AREA/ROUTE_SEGMENT_INTERSECTION/POLITICAL/COUNTRY/LOCALITY/RIVER/PLACERANK/TRANSIT/PEAK/BUILDING/RESERVATION/AIRPORT/AREA...)
- **Role:** Aggregates ranking signals with a configurable mixer. 40+ mixer strategies for different feature types.
- **Feature Points:** 40+ signal mixer types for domain-specific ranking.

### `base/proto/ranksignal.proto` — Rank Signal
- **Package:** `geostore`
- **Imports:** `fieldmetadata.proto`
- **Messages:** `RankSignalProto` — `type` (Signal enum: 60+ signal types: LENGTH/AREA/ROAD_PRIORITY/WEBSCORE/PEAK_ELEVATION_PROMINENCE/POPULATION/GDP/EUROPA_CLASS/TRANSIT_COUNTS/WIKIPEDIA_ARTICLES/KML_PLACEMARKS/GOOGLE_REVIEWS/PLACE_INSIGHTS...), `rank` (float), `raw_scalar`, `raw_string`
- **Role:** Individual ranking signal with type, normalized rank, and raw value.
- **Feature Points:** 60+ signal types covering geometry, web, transit, and place insights.

---

## Disruptions & Closures

### `base/proto/road_disruption.proto` — Road Disruption
- **Package:** `geostore`
- **Imports:** `datetime.proto`, `featureid.proto`, `segment_portion.proto`, `timeschedule.proto`, `travel_mode.proto`, `vehicle_attribute_filter.proto`
- **Messages:** `RoadDisruptionProto` — `cause` (CauseProto: oneof road_disruption_id/event_mid/cause_category with enum: ROAD_OBSTRUCTION/CRASH/CRISIS/WEATHER/FLOODING/FIRE/PLANNED_EVENT/SPORTS_EVENT/PARADE/CONSTRUCTION/DEMONSTRATION/SEASONAL_CLOSURE), `planned_schedule`, `current_state`/`future_state` (TimestampedStateProto: INACTIVE/SUSPECTED_ACTIVE/ACTIVE + utc_datetime), `schedule_resumption_time`, `last_active_start_datetime`, `last_inactive_start_datetime`, `affected_segment_portions`, `affected_intersection_traversals`, `affected_travel_modes`, `affected_vehicle_filter`
- **Role:** Live and planned road disruption model with causes, state tracking, and affected network elements.
- **Feature Points:** 15 cause categories; temporal state tracking (suspected vs confirmed); intersection traversal disruption; travel mode + vehicle filtering.

### `base/proto/road_monitor.proto` — Road Monitor
- **Package:** `geostore`
- **Imports:** `featureid.proto`, ProtoMesh
- **Messages:** `RoadMonitorProto` — `monitored_road` (FeatureIdProto list)
- **Role:** Associates a road monitoring feature (e.g., traffic camera) with monitored roads.

### `base/proto/temporaryclosure.proto` — Temporary Closure
- **Package:** `geostore`
- **Imports:** `datetime.proto`
- **Messages:** `TemporaryClosureProto` — oneof start (start_date/start_as_of_date), oneof end (end_date/end_as_of_date)
- **Role:** Date range for temporary closures with as-of date alternatives.

### `base/proto/operations.proto` — Operations
- **Package:** `geostore`
- **Imports:** `temporaryclosure.proto`
- **Messages:** `OperationsProto` — `temporary_closure` (repeated TemporaryClosureProto)
- **Role:** Container for temporary operational changes.

---

## Regulated Areas & Special Restrictions

### `base/proto/regulated_area.proto` — Regulated Area
- **Package:** `geostore`
- **Imports:** `restriction.proto`
- **Messages:** `RegulatedAreaProto` — `restriction` (RestrictionProto), `required_emissions_sticker` (enum: EURO0-7/ELECTRIC_VEHICLES/DEU_RED/YELLOW/GREEN/FRA_CRITAIR1-5/DNK_RED/GREEN/AUT_EURO_I-VI/SPA_CAT_ECO/ZERO/B/C)
- **Role:** Environmental/low-emission zones with required emissions stickers.
- **Feature Points:** 30+ emissions sticker types across EU countries (Germany, France, Denmark, Austria, Spain).

### `base/proto/specialized_road_restriction.proto` — Region-Specific Restrictions
- **Package:** `geostore`
- **Imports:** `cellcovering.proto`
- **Messages/Extensions:** `SpecializedRoadRestrictionProto` with `RegionSpecificRestrictionIdentifier` (JAKARTA_ODD_EVEN/SAO_PAULO_RODIZIO/MEXICO_CITY_HOY_NO_CIRCULA/MANILA_NUMBER_CODING/SANTIAGO_NUMBER_CODING/BOGOTA_ODD_EVEN/COSTA_RICA_SAN_JOSE/MADRID_ZERO_EMISSION_ZONE); `s2_covering` extension on EnumValueOptions (205836935)
- **Role:** Region-specific traffic restriction schemes with S2 coverings for spatial applicability.
- **Feature Points:** 8 regional restriction schemes; S2 covering attachment for geo-fencing.

---

## Vehicle Attributes

### `base/proto/vehicle_attribute_filter.proto` — Vehicle Attribute Filter
- **Package:** `geostore`
- **Imports:** `toll_pass_type.proto`, `vehicle_emissions_category.proto`, `vehicle_type.proto`, `matching/public/feature_pattern.proto`
- **Messages:**
  - `VehicleAttributeFilterProto` — `vehicle_type` (VehicleTypes.VehicleType), `vehicle_weight` (WeightComparisonProto), `has_trailer`, `vehicle_height/width/length` (DimensionComparisonProto), `trailer_length`, `num_trailers`/`axle_count` (CountComparisonProto), `hazardous_goods` (EXPLOSIVES/GASES/FLAMMABLE/COMBUSTIBLE/ORGANIC/POISON/RADIOACTIVE/CORROSIVE...), `vehicle_emissions_category`, `toll_pass`
  - `WeightComparisonProto` — comparison operator + WeightProto (weight + unit: METRIC_TON/LONG_TON/SHORT_TON/POUND/KILOGRAM)
  - `DimensionComparisonProto` — comparison operator + DimensionProto (dimension + unit: METERS/FEET)
  - `CountComparisonProto` — comparison operator + count
  - `ComparisonOperators` — LESS_THAN/GREATER_THAN
- **Role:** Comprehensive vehicle filtering for restrictions: type, weight, dimensions, trailers, axles, hazardous goods, emissions, and toll passes.
- **Feature Points:** 11 hazardous goods types; 5 weight units; 2 dimension units; numeric comparisons.

### `base/proto/vehicle_type.proto` — Vehicle Types
- **Package:** `geostore`
- **Messages:** `VehicleTypes` with `VehicleType` enum — UNKNOWN/ANY/CAR/MOTORCYCLE/TRUCK/BUS
- **Role:** Basic vehicle type enumeration.

### `base/proto/vehicle_emissions_category.proto` — Emissions Categories
- **Package:** `geostore`
- **Enums:** `VehicleEmissionsCategory` — GAS/DIESEL/ELECTRIC/HYDROGEN/HYBRID/PLUGIN_HYBRID
- **Role:** Vehicle powertrain/fuel type for emissions-based restrictions.

### `base/proto/vehicle_occupancy_range.proto` — Occupancy Range
- **Package:** `geostore`
- **Messages:** `VehicleOccupancyRangeProto` — `min_occupancy`, `max_occupancy`
- **Role:** Minimum/maximum vehicle occupancy for HOV/carpool lane restrictions.

### `base/proto/toll_pass_type.proto` — Toll Pass Types
- **Package:** `geostore`
- **Enums:** `TollPassType` — E_ZPASS/FASTRAK/EXPRESSTOLL/SUNPASS/E_PASS/PEACH_PASS/I_PASS/NC_QUICK_PASS/PIKEPASS/TXTAG/EZ_TAG/EXPRESS_PASS/GOOD_TO_GO/TOLLTAG + FLEX variants + EXEMPTION_DECAL
- **Role:** US toll transponder types with flex/switchable variants.
- **Feature Points:** 19 toll pass types covering major US toll systems.

---

## Autonomous Driving

### `base/proto/autonomous_driving.proto` — Autonomous Driving Product Types
- **Package:** `geostore`
- **Messages/Enums:** `AutonomousDrivingProto` with `ProductType` — UNKNOWN/HD_L4/HD_L2/ADAS/AUTO_DRIVING_EXPERIENCE
- **Role:** Classifies autonomous driving feature levels (L4, L2, ADAS).
- **Feature Points:** 4 product tiers for autonomous driving data.

---

## Traffic Flow

### `base/proto/traffic_flow_adjustment.proto` — Traffic Flow Adjustments
- **Package:** `geostore`
- **Messages:** `TrafficFlowAdjustment` — oneof speed_adjustment: `Stop` / `SlowDown` (both empty messages)
- **Role:** Models traffic control events (stop signs, slowdowns) that affect flow on lanes.

---

## Pedestrian Features

### `base/proto/pedestriancrossing.proto` — Pedestrian Crossing
- **Package:** `geostore`
- **Imports:** `restriction.proto`
- **Messages:** `PedestrianCrossingProto` — `crossing_type` (CROSSABLE/UNMARKED_CROSSING/MARKED_CROSSING/UNCROSSABLE), `restriction`, `offset` (float), `width` (float), `cross_anywhere` (bool), `angle_degrees` (double)
- **Role:** Pedestrian crossing definition on road segments.
- **Feature Points:** Crossing type classification; cross-anywhere flag; angle specification.

---

## Land Use

### `base/proto/landuse.proto` — Land Use
- **Package:** `geostore`
- **Messages:** `LandUseProto` — `land_use_category` (enum: RESIDENTIAL/COMMERCIAL/MIXED)
- **Role:** Simple land use classification for areas.

---

## School Districts

### `base/proto/schooldistrict.proto` — School District
- **Package:** `geostore`
- **Messages:** `SchoolDistrictProto` — `type` (enum: UNIFIED/ELEMENTARY/SECONDARY)
- **Role:** School district boundary classification.

---

## Ski Resort Features

### `base/proto/skiboundary.proto` — Ski Boundary
- **Package:** `geostore`
- **Messages:** `SkiBoundaryProto` — `type` (DANGER/SKI_AREA/SLOW_ZONE)
- **Role:** Ski area boundary types.

### `base/proto/skilift.proto` — Ski Lift
- **Package:** `geostore`
- **Messages:** `SkiLiftProto` — `type` (SURFACE/T_BAR/J_BAR/ROPE_TOW/POMA/CARPET/FUNICULAR/GONDOLA/CHAIR/AERIAL/TRAM)
- **Role:** Ski lift type classification.

### `base/proto/skitrail.proto` — Ski Trail
- **Package:** `geostore`
- **Messages:** `SkiTrailProto` — `type` (GLADE/TRAIL_TERRAIN/TRAIL/RACE_COURSE/BOWL), `difficulty` (EASIEST/EASY/INTERMEDIATE/ADVANCED_INTERMEDIATE/DIFFICULT/ADVANCED_DIFFICULT)
- **Role:** Ski trail classification with difficulty levels.

---

## Medians

### `base/proto/median.proto` — Road Median
- **Package:** `geostore`
- **Imports:** `featureid.proto`
- **Messages:** `MedianProto` with `SegmentLoopProto` (indexed component referencing segment id + begin/end fractions)
- **Role:** Defines a road median as a loop of segment portions.
- **Feature Points:** Fractional segment component references; loop geometry.

---

## Display & Visualization

### `base/proto/display_data.proto` — Display Data
- **Package:** `geostore`
- **Imports:** `point.proto`
- **Messages:** `DisplayDataProto` — `display_location` (PointProto)
- **Role:** Override display location for a feature (e.g., label placement).

### `base/proto/doodle.proto` — Doodle/Annotation
- **Package:** `geostore`
- **Messages:** `DoodleProto` — `type` (enum: USER_DEFINED_LABEL/POINT_ANNOTATION/LINE_ANNOTATION/AREA_ANNOTATION)
- **Role:** User annotation types on the map.

### `base/proto/htmltext.proto` — HTML Text
- **Package:** `geostore`
- **Imports:** `languagetaggedtext.proto`
- **Messages:** `HtmlTextProto` — `type` (HTML_DESCRIPTION), `text` (repeated LanguageTaggedTextProto)
- **Role:** HTML-formatted multilingual description text.

---

## Levels

### `base/proto/level.proto` — Building Level (Floor)
- **Package:** `geostore`
- **Imports:** `featureid.proto`, ProtoMesh
- **Messages:** `LevelProto` — `number` (float, default 0), `building` (FeatureIdProto list)
- **Role:** Floor level in a building, referenced by multiple buildings.

---

## Social Reference

### `base/proto/socialreference.proto` — Social Reference
- **Package:** `geostore`
- **Messages:** `SocialReferenceProto` — `base_gaia_id`, `gaia_id_for_display`, `claimed_gaia_id`
- **Role:** Google account (GAIA) IDs associated with a feature.

---

## Telephone

### `base/proto/telephone.proto` — Telephone
- **Package:** `geostore`
- **Imports:** `featureid.proto`, `fieldmetadata.proto`, `name.proto`, `pricerange.proto`, i18n PhoneNumber
- **Messages:** `TelephoneProto` — `number` (deprecated), `phone_number` (i18n PhoneNumber), `type` (VOICE/FAX/TDD/MESSAGING), `label` (NameProto list), `language`, `is_shared_number`, `flag` (NO_COLD_CALLS/PREFERRED), `call_rate` (PriceRangeProto), `contact_category` (CUSTOMER_SERVICE/RESERVATIONS/SALES), `service_location_feature`; MessageSet extension at 12773310
- **Role:** International phone number with type, flags, rates, and contact categories.
- **Feature Points:** i18n phone number format; cold-call flag; service location linking.

---

## URL

### `base/proto/url.proto` — URL
- **Package:** `geostore`
- **Imports:** `fieldmetadata.proto`
- **Messages:** `UrlProto` — `url` (string, required), `language`, `pagerank` (deprecated), `metadata`; MessageSet extension at 23880165
- **Role:** URL with language and metadata.

### `base/proto/urllist.proto` — URL List
- **Package:** `geostore`
- **Imports:** `url.proto`
- **Messages:** `UrlListProto` — `url` (repeated UrlProto); MessageSet extension at 14251185
- **Role:** Collection of URLs.

---

## Timezone

### `base/proto/timezone.proto` — Timezone
- **Package:** `geostore`
- **Imports:** `fieldmetadata.proto`
- **Messages:** `TimezoneProto` — `id` (string, e.g. "America/New_York"), `metadata`
- **Role:** IANA timezone identifier for a feature.

---

## Field Metadata & Options

### `base/proto/fieldmetadata.proto` — Field Metadata
- **Package:** `geostore`
- **Imports:** `internal/internalfieldmetadata.proto`
- **Messages:** `FieldMetadataProto` — `internal` (InternalFieldMetadataProto); field option extension `metadata_for_tag_id` (1331432)
- **Role:** Wrapper for internal field metadata; allows annotating proto fields with metadata tag IDs.

### `base/proto/fieldtype.proto` — Field Type Enum
- **Package:** `geostore.fieldtype`
- **Enums:** `Type` with 250+ entries — comprehensive enumeration of every feature field type in the system, used for property identification and rights management. Includes FEATURE_*, SEGMENT_*, PARKING_*, BORDER_*, BUILDING_*, LANE_MARKER_*, INTERSECTION_*, RESTRICTION_GROUP_*, ROAD_DISRUPTION_*, TRANSIT_*, EV_*, GEOPOLITICAL_*, DEPRECATED_* entries.
- **Role:** Master field type registry for property identification, field-level rights, and edit precedence.
- **Feature Points:** 250+ field type enumerations; deprecated entries marked; used by FeaturePropertyIdProto.

### `base/proto/options.proto` — Proto Options
- **Package:** `geostore`
- **Imports:** `net/proto2/proto/descriptor.proto`
- **Messages/Extensions:** `FieldIdOptions` — `next_available_field_id`; `field_id_options` extension on MessageOptions (38142873)
- **Role:** Custom proto options for field ID management.

### `base/proto/stable_field_path.proto` — Stable Field Path
- **Package:** `geostore`
- **Messages:** `StableFieldPathProto` with `StableFieldSelector` — `field_num` (int32), `version_token` (string)
- **Role:** Stable field path referencing for provenance tracking across schema versions.

### `base/proto/stable_id_options.proto` — Stable ID Option
- **Package:** `geostore`
- **Extensions:** `stable_id` (bool) on FieldOptions (535801262)
- **Role:** Marks fields with stable identifiers across schema versions.

### `base/proto/version_token_options.proto` — Version Token Option
- **Package:** `geostore`
- **Extensions:** `version_token` (bool) on FieldOptions (433813166)
- **Role:** Marks fields that contribute to version token computation.

---

## Internal Messages

### `base/proto/internal/internalfeature.proto` — Internal Feature Data
- **Package:** `geostore`
- **Imports:** `rightsstatus.proto`, `trustsignals.proto`
- **Messages:** `InternalFeatureProto` — `trust` (TrustSignalsProto), `rights_status` (RightsStatusProto), `polygon_shape_id`, `water_removed_polygon_shape_id`, `self_polygon_shape_id`, `rest_of_world_polygon_shape_id`
- **Role:** Internal-only feature fields: trust signals, rights, and polygon shape store references.

### `base/proto/internal/internalfieldmetadata.proto` — Internal Field Metadata
- **Package:** `geostore`
- **Imports:** `internalsourcesummary.proto`
- **Messages:** `InternalFieldMetadataProto` — `source_summary` (InternalSourceSummaryProto), `is_auto` (bool)
- **Role:** Internal per-field metadata: source summary and automated flag.

### `base/proto/internal/internalsegment.proto` — Internal Segment Data
- **Package:** `geostore`
- **Imports:** `featureid.proto`, `restriction.proto`
- **Messages:** `InternalSegmentProto` — `travel_allowance` (RestrictionProto list), `disallowed_connections` (LaneConnectionReference: segment + from/to lane numbers/IDs), `disallowed_primary_connection`
- **Role:** Internal lane-level connectivity restrictions: travel allowances and disallowed lane-to-lane connections.
- **Feature Points:** Lane-level connection prohibition; primary connection disallowance.

### `base/proto/internal/internalsourcesummary.proto` — Internal Source Summary
- **Package:** `geostore`
- **Imports:** `datasourceprovider.proto`
- **Messages:** `InternalSourceSummaryProto` — `provider` (DataSourceProvider.Provider), `dataset` (string)
- **Role:** Compact provider+dataset summary for internal field metadata.

### `base/proto/internal/rightsstatus.proto` — Rights Status
- **Package:** `geostore`
- **Imports:** `rightslevel.proto`, `edit/feature_property_id.proto`
- **Messages:** `FieldWithRightsProto` — `feature_property_id`, `min_rights_level`, `field_type`, `attribute_id` (deprecated); `RightsStatusProto` — `field_with_rights` (repeated)
- **Role:** Per-field access rights: which properties require which minimum rights level.
- **Feature Points:** Field-level rights granularity.

---

## Edit Subsystem

### `edit/feature_property_id.proto` — Feature Property ID
- **Package:** `geostore`
- **Imports:** `base/proto/fieldtype.proto`
- **Messages:** `FeaturePropertyIdProto` — `field_type` (fieldtype.Type), oneof sub_field: attribute_id / attachment_type_id / kg_property_id / name_language; `FeaturePropertyIdList` — repeated FeaturePropertyIdProto
- **Role:** Identifies a specific property within a feature for edit operations, rights management, and property value status.
- **Feature Points:** Multi-faceted property identification (attribute, attachment, KG, name language).

---

## Matching Subsystem

### `matching/public/feature_pattern.proto` — Feature Pattern Matching
- **Package:** `geostore`
- **Imports:** `featureid.proto`, `featuremetadata.proto`, `fieldtype.proto`, `gconceptinstance.proto`, `property_value_status_enum.proto`, Freebase
- **Messages:** Over 50 pattern types — comprehensive feature matching DSL:
  - `FeaturePatternProto` — Boolean logic (AND/OR/NOT) with 30+ pattern sub-types: name, data_source, address, country_code, bound, rank, segment, geometry, feature_id, related_timezone, relation, border, source_info, telephone, reflection, access_point, transit_line, best_name, existence, gconcept, lint, building, route, level, claim, feature_metadata, kg_property, attachment, best_locale, property_value_status, regulated_area
  - Sub-patterns: `AddressComponentPatternProto`, `AddressLinesPatternProto`, `AddressPatternProto`, `BorderPatternProto`, `BoundPatternProto`, `DataSourcePatternProto`, `FeatureIdPatternProto`, `GeometryPatternProto` (with containment/intersection caps), `NamePatternProto` (regex, language, flags, stemming), `RankPatternProto`, `SegmentPatternProto` (priority, usage, length, speed, surface, bicycle/pedestrian, toll), `SourceInfoPatternProto`, `TelephonePatternProto`, `ReflectionPatternProto`, `ExistencePatternProto`, `AccessPointPatternProto`, `TransitLinePatternProto`, `GConceptPatternProto`, `LintPatternProto`, `BuildingPatternProto`, `RoutePatternProto`, `LevelPatternProto`, `AttachmentPatternProto`, `KGValuePatternProto`, `KGPropertyPatternProto`, `BestLocalePatternProto`, `FeaturePropertyIdPatternProto`, `PropertyValueStatusPatternProto`, `RegulatedAreaPatternProto`
- **Role:** Powerful pattern matching language for querying and transforming features. Used by editing tools, lint rules, and data processing pipelines.
- **Feature Points:** Boolean expression tree (AND/OR/NOT); geometry containment/intersection via cap primitives; name matching with regex + stemming + diacritic-insensitive; reflection-based field introspection; pattern name references for composition.

---

## Ontology Subsystem

### `ontology/proto/rawgconceptinstance.proto` — Raw GConcept Instance
- **Package:** `geostore.ontology`
- **Imports:** `datasourceprovider.proto`, `gconceptinstance.proto`
- **Messages:** `RawGConceptInstanceProto` — `instance` (GConceptInstanceProto), `provider` (deprecated), `source_dataset` (deprecated), `is_inferred` (bool), `is_added_by_edit` (deprecated)
- **Role:** Raw/unprocessed knowledge graph concept instance with inference tracking.

### `ontology/proto/rawgconceptinstancecontainer.proto` — Raw GConcept Container
- **Package:** `geostore.ontology`
- **Imports:** `rawgconceptinstance.proto`
- **Messages:** `RawGConceptInstanceContainerProto` — `instance` (repeated RawGConceptInstanceProto); MessageSet extension at 20497290
- **Role:** Batch container for raw concept instances.

---

## Client/Attachments Subsystem

### `client/attachments/attachment.proto` — Generic Attachment
- **Package:** `geostore.attachments`
- **Imports:** `options.proto`
- **Messages:** `AttachmentProto` — `messages` (MessageSet, lazy), `type_id` (uint64), `attachment_id` (uint64), `client_name_space` (string); `AttachmentListProto` — repeated AttachmentProto
- **Role:** Generic attachment mechanism for extending features with client-specific data via typed MessageSet payloads.
- **Feature Points:** Typed attachment with client namespace; lazy deserialization.

---

## Tools Subsystem

### `tools/public/annotations.proto` — Feature ID Reference Rules
- **Package:** `geostore`
- **Imports:** `net/proto2/proto/descriptor.proto`
- **Enums/Extensions:** `FeatureIdForwardingRule` — DO_NOT_FORWARD_REFERENCE / FORWARD_REFERENCE / FORWARD_REFERENCE_AND_DEDUP; `FeatureIdDanglingReferenceRule` — DO_NOT_DROP_REFERENCE / DELETE_REFERENCE / DELETE_PARENT_MESSAGE; field option extensions at 143183347 and 143183348
- **Role:** Declares how tools should handle FeatureId references during editing: forwarding chains and dangling reference cleanup.
- **Feature Points:** Reference forwarding rules; dangling reference resolution strategies.

---

## Cross-Cutting Concerns

### Common Imports
The most commonly imported files across the schema:
- `google/api/inclusion.proto` — nearly all files
- `storage/datapol/annotations/proto/semantic_annotations.proto` — nearly all files
- `geostore/base/proto/options.proto` — most files
- `geostore/base/proto/featureid.proto` — most feature-type files
- `geostore/base/proto/fieldmetadata.proto` — most value-type files
- `net/proto2/bridge/proto/message_set.proto` — extensible messages
- `java/com/google/apps/jspb/jspb.proto` — Java protobuf library
- `knowledge/graph/protomesh/protomesh.proto` — KG integration

### Proto Syntax Versions
- **proto2**: ~150 files (vast majority)
- **editions** (proto3-based): ~12 files (`ev_charger.proto`, `ev_station.proto`, `emobility_ids.proto`, `gelfs_ids.proto`, `landuse.proto`, `median.proto`, `traffic_flow_adjustment.proto`, `travel_mode.proto`, `travel_pattern.proto`, `toll_pass_type.proto`, `vehicle_emissions_category.proto`, `vehicle_occupancy_range.proto`, `api_inclusion_scopes_nonpublic.proto`)

### MessageSet Extensions
Many proto messages register themselves as MessageSet extensions with unique numeric IDs, enabling dynamic message type dispatch:
- FeatureIdProto: 13258261 | AddressProto: 12208774 | PointProto: 14827556
- PolygonProto: 5464057 | RectProto: 26764887 | FeatureListProto: 1244700
- FeatureIdListProto: 16709385 | PriceRangeProto: 15000834 | SourceInfoProto: 18502900
- TrustSignalsProto: 24882046 | UrlProto: 23880165 | UrlListProto: 14251185
- TimeScheduleProto: 15256124 | DateTimeProto: 15303159 | TelephoneProto: 12773310
- OpeningHoursProto: 98510069 | PriceInfoProto: 49520153 | NameProto: 308676116
- ExistenceProto: 1321489 | KnowledgeGraphReferenceProto: 157211294
- TransitEntranceAttachmentProto: 122556540 | RawGConceptInstanceContainerProto: 20497290

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      FeatureProto                            │
│  (Universal container with ~70 typed sub-message fields)     │
├─────────────────────────────────────────────────────────────┤
│  Identity      │ FeatureIdProto (S2 cell + fingerprint)      │
│  Geometry      │ Point, PolyLine, Polygon, Rect, Track, Pose │
│  Hierarchy     │ child[], parent[], related_feature[]        │
│  Lifecycle     │ ExistenceProto, FeatureMetadataProto        │
│  Provenance    │ SourceInfoProto, DataSourceProvider         │
├─────────────────────────────────────────────────────────────┤
│  ┌─Road─────────────────────────────────────────────────┐   │
│  │ SegmentProto → LaneProto → LaneMarkerProto            │   │
│  │ IntersectionProto → IntersectionGroupProto            │   │
│  │ RestrictionProto, SpeedLimitProto, RoadSignProto      │   │
│  │ PedestrianCrossingProto, RoadDisruptionProto          │   │
│  │ GradeLevelProto, SlopeProto, CurvatureProto           │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌─Place────────────────────────────────────────────────┐   │
│  │ EstablishmentProto (400+ categories)                   │   │
│  │ AddressProto → AddressComponentProto                  │   │
│  │ OpeningHoursProto, PriceInfoProto                     │   │
│  │ ParkingProto, ServiceAreaProto                        │   │
│  │ TelephoneProto, UrlProto                              │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌─Transit──────────────────────────────────────────────┐   │
│  │ TransitLineProto → TransitLineVariantProto            │   │
│  │ TransitStationProto                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌─Border/Geo───────────────────────────────────────────┐   │
│  │ BorderProto, LogicalBorderProto                       │   │
│  │ GeopoliticalProto, PoliticalProto                     │   │
│  │ DisputedAreaProto                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌─3D/Building──────────────────────────────────────────┐   │
│  │ BuildingProto, LevelProto                             │   │
│  │ CityJsonProto, ThreeDimensionalModelProto             │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌─EV Charging──────────────────────────────────────────┐   │
│  │ EvStationProto, EvChargerProto                        │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌─Other────────────────────────────────────────────────┐   │
│  │ SkiBoundary/Lift/Trail, LandUse, SchoolDistrict       │   │
│  │ AttributeProto, GConceptInstanceProto                 │   │
│  │ RankDetailsProto, TrustSignalsProto                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

This is Google's comprehensive geospatial data model covering roads (with HD/lane-level detail for autonomous driving), places/POIs (with rich business data, menus, pricing), transit, borders/geopolitical features, buildings/3D models, EV charging, and more. The schema supports versioning, provenance tracking, rights management, feature deduplication, and a powerful pattern-matching DSL for data processing.
