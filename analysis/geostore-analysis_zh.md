# GeoStore Proto 模式分析

> **文件总数：** 162 个 `.proto` 文件  
> **根目录：** `earthstudiowasm/geostore/`  
> **子目录：** `base/proto/`、`base/proto/attachments/transit/`、`base/proto/internal/`、`client/attachments/`、`edit/`、`matching/public/`、`ontology/proto/`、`tools/public/`  

---

## 目录结构

```
geostore/
├── base/proto/                         (154 个文件 - 核心模式)
│   ├── attachments/transit/            (1 个文件)
│   └── internal/                       (5 个文件)
├── client/attachments/                 (1 个文件)
├── edit/                               (1 个文件)
├── matching/public/                    (1 个文件)
├── ontology/proto/                     (2 个文件)
└── tools/public/                       (1 个文件)
```

---

## 核心标识与要素模型

### `base/proto/featureid.proto` — 基于 S2 细胞的要素 ID
- **包名：** `geostore`
- **导入：** `options.proto`、`google/api/inclusion.proto`、JSPB、ProtoMesh、MessageSet、descriptor、semantic_annotations
- **消息/枚举：**
  - `FeatureIdProto` — `cell_id`（fixed64，必填，S2 细胞）、`fprint`（fixed64，必填，细胞内指纹）、`temporary_data`（MessageSet）。这是整个 GeoStore 的通用要素标识符。
- **扩展：** `crawl_feature_id`（27021333）、`strong_reference`（34597257）、`has_back_reference`（81429090），作用于 proto2.FieldOptions
- **作用：** 基础的寻址方案。每个地理实体均由 S2 细胞 + 指纹对标识，使查找具有空间局部性。
- **功能要点：** 双 64 位复合键（S2 细胞 ID + 指纹）；MessageSet 扩展钩子；用于链接遍历语义的字段选项扩展。

### `base/proto/feature.proto` — 通用要素容器
- **包名：** `geostore`
- **导入：** ~70+ 个导入，涵盖代码库中几乎每个 proto
- **消息：**
  - `FeatureProto` — 通用容器。`id`（FeatureIdProto，必填）、`bound`（RectProto）、`preferred_viewport`（RectProto）、`rank`（float）、`name`（repeated NameProto）、`address`（repeated AddressProto）、`point`（repeated PointProto）、`polyline`（repeated PolyLineProto）、`polygon`（repeated PolygonProto）、`track`（repeated TrackProto）、`pose`（PoseProto）、`polygon_for_display`、`water_removed_polygon`、`geopolitical_geometry`、`child`/`parent`（FeatureIdProto 列表，用于层次结构）、`center`（PointProto）、`source_info`、`related_entrance`、`related_feature`（RelationProto）、`related_terminal_point`、`related_border`、`related_timezone`。以及类型专用字段：`establishment`、`border`、`building`、`entrance`、`political`、`schooldistrict`、`elevation`、`segment`、`intersection`、`intersectiongroup`、`restriction`、`restriction_group`、`route`、`transit_station`、`transit_line`、`transit_line_variant`、`parking`、`signpost`、`sign`、`toll_cluster`、`toll_path`、`road_monitor`、`road_disruption`、`skiboundary`、`skilift`、`skitrail`、`level`、`locale`、`landuse`、`vertical_ordering`、`ev_station`、`ev_charger`、`operations`、`display_data`、`data_source`、`existence`、`rank_details`、`gconcept`、`attribute`、`property_value_status`、`trust`、`doodle`、`knowledge_graph_reference`、`three_dimensional_model`、`geometry_store_reference`、`regulated_area`、`service_area`、`business_chain`、`feature_metadata`、`field_metadata`、`attachment`、`raw_gconcept_instance_container`。
- **作用：** 所有 geostore 要素的统一消息。通过可选类型字段实现类似 oneof 的分派。层次结构机制（child/parent）支持包含关系。
- **功能要点：** ~70+ 个类型专用子消息字段；child/parent 层次链接；全面的几何支持（point/polyline/polygon/track/pose）；丰富的元数据分层。

### `base/proto/featuremetadata.proto` — 要素级元数据
- **包名：** `geostore`
- **导入：** `feature_field_metadata.proto`、`feature_replacement_info.proto`、`featureidforwardings.proto`、`options.proto`
- **消息：**
  - `FeatureHistoryMetadataProto` — `feature_birth_timestamp_us`、`removal_timestamp_us`、`last_modification_timestamp_us`（均为 int64 µs 精度）
  - `FeatureMetadataProto` — `version_token`（bytes）、`core_version_token`（bytes）、`history`（FeatureHistoryMetadataProto）、`bulk_updatable`（枚举：NOT_BULK_UPDATABLE / BULK_UPDATABLE）、`forwardings`（FeatureIdForwardingsProto）、`field_metadata`（FeatureFieldMetadataProto）、`feature_replacement_info`
- **作用：** 追踪要素生命周期、版本管理、ID 转发（去重解析）、字段来源和批量更新资格。
- **功能要点：** µs 精度时间戳；用于乐观并发的版本令牌；用于重复/合并处理的 ID 转发链。

### `base/proto/featureidforwardings.proto` — 要素 ID 转发
- **包名：** `geostore`
- **导入：** `featureid.proto`、`featureidlist.proto`
- **消息：** `FeatureIdForwardingsProto` — `forwarded_id`、`duplicate_of`、`transitively_duplicate_of`、`replaced_by`（已弃用）、`inactive_duplicate`（repeated）
- **作用：** 处理要素去重和 ID 链接。当要素合并时，此消息维护转发链。
- **功能要点：** 传递性重复解析；非活跃重复追踪。

### `base/proto/featureidlist.proto` — 要素 ID 集合
- **包名：** `geostore`
- **导入：** `featureid.proto`
- **消息：** `FeatureIdListProto` — `id`（repeated FeatureIdProto）；MessageSet 扩展位于 16709385
- **作用：** 要素 ID 的简单 repeat 集合。

### `base/proto/featurelist.proto` — 要素批次
- **包名：** `geostore`
- **导入：** `feature.proto`
- **消息：** `FeatureListProto` — `key`（bytes）、`secondary_key`（bytes）、`feature`（repeated FeatureProto）；`UnparsedFeatureListProto` — 类似但使用 `unparsed_feature`（repeated bytes，CORD 类型）
- **作用：** 要素的批次容器，具有可选的二级键分片。未解析变体用于高效二进制传输。

### `base/proto/feature_replacement_info.proto` — 替换追踪
- **包名：** `geostore`
- **导入：** `featureid.proto`
- **消息：** `FeatureReplacementInfoProto` — `derived_from`（repeated FeatureIdProto）、`replaced_by`（repeated FeatureIdProto）
- **作用：** 记录编辑/合并过程中哪些要素衍生自或被哪些要素替换。

### `base/proto/feature_field_metadata.proto` — 字段来源追踪
- **包名：** `geostore`
- **导入：** `datasourceprovider.proto`、`stable_field_path.proto`
- **消息：** `FeatureFieldMetadataProto` 包含 `FieldProvenance`（field_paths + provenance）；`ProvenanceProto`（provider 枚举 + dataset 字符串）
- **作用：** 追踪每个字段值由哪个提供者/数据集贡献。
- **功能要点：** 扩展 1000 到 max 用于附加元数据；稳定字段路径解析。

---

## 几何与空间原语

### `base/proto/point.proto` — 地理点
- **包名：** `geostore`
- **导入：** `fieldmetadata.proto`
- **消息：** `PointProto` — `lat_e7`（fixed32，必填，1e7 度）、`lng_e7`（fixed32，必填，1e7 度）、`metadata`（FieldMetadataProto）、`temporary_data`（MessageSet）
- **作用：** 核心坐标原语，使用 E7 表示（微度精度）。MessageSet 扩展位于 14827556。
- **功能要点：** 紧凑的 fixed32 编码；经纬度的 E7 格式。

### `base/proto/polyline.proto` — 折线几何
- **包名：** `geostore`
- **导入：** `point.proto`、`fieldmetadata.proto`
- **消息：** `PolyLineProto` — `vertex`（repeated PointProto）、`metadata`（FieldMetadataProto）、`temporary_data`（MessageSet）
- **作用：** 表示折线（道路、边界等）的有序点序列。

### `base/proto/polygon.proto` — 面几何
- **包名：** `geostore`
- **导入：** `polyline.proto`、`fieldmetadata.proto`
- **消息：** `PolygonProto` — `loop`（repeated PolyLineProto，已弃用）、`encoded`（bytes，压缩编码）、`base_meters`（float）、`height_meters`（float）、`cell_id`（uint64，已弃用）、`unsuitable_for_display`（bool）、`metadata`；MessageSet 扩展位于 5464057
- **作用：** 带有可选挤出（base/height 用于 3D）的面，使用编码格式进行高效存储。
- **功能要点：** 编码字节用于压缩；3D 挤出支持；显示适用性标志。

### `base/proto/rect.proto` — 边界矩形
- **包名：** `geostore`
- **导入：** `point.proto`
- **消息：** `RectProto` — `lo`（PointProto，必填）、`hi`（PointProto，必填）；MessageSet 扩展位于 26764887
- **作用：** 由西南角和东北角定义的轴对齐包围盒。

### `base/proto/pose.proto` — 3D 姿态（位置 + 方向）
- **包名：** `geostore`
- **导入：** `options.proto`
- **消息：** `PoseProto` — `index`（int32）、`lat`（double）、`lng`（double）、`altitude`（double）、`yaw`（double）、`pitch`（double）、`roll`（double）
- **作用：** 6-DOF 姿态，用于 3D 对象放置：经纬度/高度 + 欧拉角。

### `base/proto/track.proto` — 轨迹几何
- **包名：** `geostore`
- **导入：** `pose.proto`
- **消息：** `TrackProto` — `index`（int32）、`pose`（repeated PoseProto）
- **作用：** 3D 姿态的索引序列，用于车辆路径/车道中心线。

### `base/proto/cellcovering.proto` — S2 细胞覆盖
- **包名：** `geostore`
- **导入：** `options.proto`
- **消息：** `CellCoveringProto` — `cell_id`（repeated uint64）
- **作用：** 表示空间区域覆盖的 S2 细胞 ID 列表。用于索引和地理围栏。

### `base/proto/anchored_geometry.proto` — 锚定几何引用
- **包名：** `geostore`
- **消息：** `AnchoredGeometryProto` — `geometry_id`（string）
- **作用：** 通过字符串 ID 引用单独存储的几何。

### `base/proto/inferred_geometry.proto` — 推断/计算几何
- **包名：** `geostore`
- **导入：** `featureid.proto`
- **消息：** `InferredGeometryProto` — `geometry_composition`、`defines_geometry_for`（FeatureIdProto 列表）；`GeometryComposition` — `includes_geometry_of` / `excludes_geometry_of`（FeatureIdProto 列表）
- **作用：** 描述通过组合/修剪其他要素的几何而派生的几何。支持面布尔运算。

### `base/proto/geometry_store_reference.proto` — 外部几何存储
- **包名：** `geostore`
- **导入：** `cityjson.proto`
- **消息：** `GeometryStoreReferenceProto` — `geometry_id`（string）、`geometry`（CityJsonProto）、`footprint`（bytes）
- **作用：** 引用外部存储的 3D 建筑模型，附有可选的内联 CityJSON 和足迹。

---

## 道路网络与路线

### `base/proto/segment.proto` — 路段（中央道路模型）
- **包名：** `geostore`
- **导入：** 20+ 个导入（lane、restriction、speed_limit、gradelevel、pedestriancrossing、slope 等）
- **消息：**
  - `SegmentProto` — `sibling`（配对路段）、`route`（repeated FeatureIdProto）、`route_association`（展示元数据）、`endpoint`（枚举：UNKNOWN/UNRESTRICTED/UNCONTROLLED/STOP_SIGN/ALL_WAY_STOP/TRAFFIC_LIGHT/YIELD/MERGE/ROUNDABOUT/RAILROAD_CROSSING/NO_EXIT/WRONG_WAY/TOLL_BOOTH）、`intersection`（FeatureIdProto）、`restriction`（repeated）、`lane`（repeated LaneProto）、`on_right`（bool，靠右行驶）、`max_permitted_speed_kph`（float）、`is_max_permitted_speed_derived`、`legal_maximum_speed` / `advisory_maximum_speed` / `legal_minimum_speed`（AppliedSpeedLimitProto 列表）、`avg_speed_kph`、`elevation`（枚举：NORMAL/BRIDGE/TUNNEL/SKYWAY/STAIRWAY/ESCALATOR/ELEVATOR/SLOPEWAY/MOVING_WALKWAY）、`surface`（枚举：PAVED/ASPHALT/CONCRETE/UNPAVED/GRAVEL/DIRT/SAND...）、`priority`（枚举：NON_TRAFFIC/TERMINAL/LOCAL/MINOR_ARTERIAL/MAJOR_ARTERIAL/SECONDARY_ROAD/PRIMARY_HIGHWAY/LIMITED_ACCESS/CONTROLLED_ACCESS）、`usage`（枚举：RAMP/ROUNDABOUT/PEDESTRIAN_MALL/WALKWAY/TRAIL/CROSSING/OVERPASS/UNDERPASS...）、`toll_road`（bool）、`road_sign`、`grade_level`、`separated_roadways`、`barrier`、`altitude`、`construction_status`（PLANNED/STARTED/COMPLETE）、`construction_begin_date`/`construction_end_date`、`condition`（GOOD/POOR）、`bicycle_facility`、`bicycle_safety`、`pedestrian_facility`、`pedestrian_crossing`、`covered`、`pedestrian_grade`、`visible_landmark`、`distance_to_edge`、`sweep`、`road_monitor`、`slope`、`ramp`、`accident_prone_spot`、`related_median`、`road_disruption`、`inner_barrier`/`outer_barrier`（RoadBarrierProto）、`signpost`、`road_enclosure`、`internal`（InternalSegmentProto）
  - `RouteAssociationProto` — `route`、`display_preference`（PREFERRED/BEST/OK/HIDE）、`route_direction`（RouteDirection）
  - `LandmarkReferenceProto` — `landmark`（FeatureIdProto）、`feature_type`、`travel_mode`
  - `SweepProto` — `polygon`、`other_segment_feature_id`、`sweep_curve`（CurveConnectionProto）、`sweep_token`
  - `AccidentProneSpotProto` — 分数 + 来源权威枚举
  - `RoadBarrierProto` — `road_barrier_id`、`barrier_type`（TERRAIN/CURB/FENCE/GUARDRAIL/JERSEY/WALL...）、`is_regularly_moved`、起止分数
  - `RoadEnclosureProto` — `enclosure_type`（BUILDING/TUBE/HIGHWAY_CAP/OVERHEAD_ROAD）、起止分数
- **作用：** 中央道路网络模型。表示具有全面属性的有向路段，用于导航、安全和 ADAS。
- **功能要点：** 15+ 枚举用于道路属性；车道级细节；速度限制分层（法定/建议/最低）；用于立交桥分离的高程类别；自行车/行人设施分类；施工生命周期追踪；事故多发点标注；具有物理/法律区分的护栏类型学。

### `base/proto/lane.proto` — 车道级模型
- **包名：** `geostore`
- **导入：** `curvature.proto`、`curve_connection.proto`、`featureid.proto`、`lane_marker.proto`、`restriction.proto`、`traffic_flow_adjustment.proto`、`track.proto`
- **消息：**
  - `FlowLineProto` — `track`（TrackProto）、`curvature`（CurvatureProto）
  - `LaneProto` — `lane_number`、`lane_id`（uint64）、`shared`、`type`（NORMAL/PASSING/LEFT_TURN/RIGHT_TURN/BICYCLE/PARKING/EXIT_ENTRANCE/PEDESTRIAN/SIDEWALK_SHOULDER/MEDIAN/REVERSIBLE...）、`sometimes_drivable_shoulder`、`lane_divider_crossing`（ALLOWED/DISALLOWED/LEGALLY_DISALLOWED/PHYSICALLY_IMPOSSIBLE）、`outer_lane_divider_crossing`、`width`、`distance_to_next_lane`、`restriction`、`lane_connection`（LaneConnection 包含 segment/lane_number/flow/curve/bounding_marker/primary_connection/yield_to_other）、`surface`（PAVED/ASPHALT/CONCRETE/UNPAVED/GRAVEL/DIRT/SAND）、`flow`、`stop_line`、`bounding_marker`、`conjoined_category`（SPLIT_LEFT/MIDDLE/RIGHT、MERGE 变体）、`toll_payments`、`traffic_flow_adjustments`、`lane_token`
  - `BoundingMarkerProto` — `bounding_marker_id`、`side`（LEFT/RIGHT）、邻接分数、令牌；oneof：bounding_marker_status / bounding_marker（FeatureIdProto） / bounding_marker_pattern（LaneMarkerProto）
- **作用：** 用于自动驾驶和高级导航的详细车道级模型。包括带有流线的车道连接、车道分隔线和边界标志。
- **功能要点：** 20+ 种车道类型；用于分离/合流的联合车道类别；带有曲线几何和流线的车道连接；物理车道边界的边界标志系统；每车道收费支付方式；交通流调整（停止/减速）。

### `base/proto/lane_marker.proto` — 车道标线模式
- **包名：** `geostore`
- **导入：** `options.proto`、`version_token_options.proto`
- **消息：**
  - `LaneMarkerProto` — `linear_pattern`、`crossing_pattern`、`barrier_materials`
  - `LinearStripePatternProto` — repeated `PhysicalLineProto`
  - `PhysicalLineProto` — `pattern`（SOLID/DASHED/DOTTED/DOTTED_DASHED）、`dash_length_meters`、`gap_length_meters`、`paint_color`、`gap_color`、`material`（PAINT_STRIPE/ROUND_DOT/SQUARE_DOT）、`physical_line_token`
  - `CrossingStripePatternProto` — `stripe_pattern`（LONGITUDINAL/DIAGONAL/LATERAL/SINGLE_CROSSING_LINE/DOUBLE_CROSSING_LINE/TRIANGLE...）、`border_pattern`、`border_line`、`color`
  - `BarrierLogicalMaterialProto` — `material`（CONCRETE/METAL/PLASTIC/STONE/TIMBER）
- **作用：** HD 地图的物理车道标线定义。虚线模式、颜色、护栏材料。
- **功能要点：** 9 种油漆颜色；5 种护栏材料；10 种交叉标线模式；可加版本令牌以实现稳定标识。

### `base/proto/segmentpath.proto` — 路段路径
- **包名：** `geostore`
- **导入：** `featureid.proto`
- **消息：** `SegmentPathProto` — `subpath`（repeated FeatureIdProto）
- **作用：** 形成道路网络路径的路段要素 ID 的有序列表。

### `base/proto/segment_portion.proto` — 路段部分
- **包名：** `geostore`
- **导入：** `featureid.proto`
- **消息：** `SegmentPortionProto` — `segment_id`、`start_fraction`（默认 0）、`end_fraction`（默认 1）
- **作用：** 引用路段的分数部分，用于部分中断/限制。

### `base/proto/route.proto` — 路线 Proto
- **包名：** `geostore`
- **消息：** `RouteProto` — `child_type`（int32）
- **作用：** 最简路线容器。child_type 枚举通过 fieldtype.proto 扩展。
- **功能要点：** 充当枚举路线类型键。

### `base/proto/routedirection.proto` — 路线方向枚举
- **包名：** `geostore`
- **枚举：** `RouteDirection` — NONE/NORTH/EAST/SOUTH/WEST/NORTHEAST/NORTHWEST/SOUTHEAST/SOUTHWEST/INNER/OUTER
- **作用：** 路线/指示牌的方位和相对方向。

### `base/proto/travel_mode.proto` — 出行方式枚举
- **包名：** `geostore`
- **枚举：** `TravelMode` — UNSPECIFIED/MOTOR_VEHICLE/BICYCLE/PEDESTRIAN
- **作用：** 高层次的出行方式。

### `base/proto/travel_pattern.proto` — 出行模式（布尔逻辑）
- **包名：** `geostore`
- **导入：** `timeschedule.proto`、`travel_mode.proto`、`vehicle_attribute_filter.proto`、`vehicle_occupancy_range.proto`
- **消息：** `TravelPatternProto` — `direction`（IS/NOT）、`operation`（MATCH/ALL_OF/ANY_OF）、`terms`（递归 TravelPatternProto 用于布尔树）、oneof criterion：time_schedule / vehicle_attribute_filter / vehicle_occupancy_range / travel_mode
- **作用：** 出行限制的可组合布尔逻辑。支持基于时间调度、车辆过滤器、载客量和方式使用 AND/OR/NOT 树结构。
- **功能要点：** 递归布尔表达式树；四种条件类型；方向取反。

---

## 交叉口模型

### `base/proto/intersection.proto` — 道路交叉口
- **包名：** `geostore`
- **导入：** `featureid.proto`、ProtoMesh
- **消息：** `IntersectionProto` — `segment`（repeated FeatureIdProto，进入方向）、`out_segment`（repeated，驶出方向）、`intersection_group`（FeatureIdProto）、`toll_cluster`（FeatureIdProto）
- **作用：** 表示道路交叉口。追踪输入和输出路段的集合，以及交叉口组和收费集群的成员关系。
- **功能要点：** 有向导航的输入/输出路段区分；组和集群成员关系。

### `base/proto/intersectiongroup.proto` — 交叉口组
- **包名：** `geostore`
- **导入：** `featureid.proto`
- **消息：** `IntersectionGroupProto` — `intersection`（repeated FeatureIdProto）、`group_type`（GROUP_ARTIFACT/GROUP_LOGICAL）、`child_group`（repeated）、`parent_group`
- **作用：** 对相关交叉口进行分组（例如复杂立交桥的所有交叉节点）。支持层次嵌套。
- **功能要点：** 层次化分组；人工组合 vs 逻辑组合的区分。

### `base/proto/tollcluster.proto` — 收费集群
- **包名：** `geostore`
- **导入：** `featureid.proto`、ProtoMesh
- **消息：** `TollClusterProto` — `intersection`（repeated FeatureIdProto）
- **作用：** 对构成收费区域的交叉口进行分组。

### `base/proto/toll_path.proto` — 收费路径
- **包名：** `geostore`
- **导入：** `featureid.proto`
- **消息：** `TollPathProto` 包含 `TollClusterSequence`（索引的收费集群）、`IndexedTollCluster`
- **作用：** 沿路径排序的收费集群序列。

---

## 限制、速度限制和标志

### `base/proto/restriction.proto` — 出行限制
- **包名：** `geostore`
- **导入：** `autonomous_driving.proto`、`featureid.proto`、`fieldmetadata.proto`、`timeschedule.proto`、`travel_pattern.proto`、`vehicle_attribute_filter.proto`
- **消息/枚举：**
  - `RestrictionProto` — `restriction_id`（uint64）、`subpath`（FeatureIdProto 列表）、`type`（枚举：TRAVEL_RESTRICTED/ILLEGAL/PHYSICAL/LOGICAL/GATE/CONSTRUCTION/SEASONAL_CLOSURE/PRIVATE/WRONG_WAY/TERMINAL/PAYMENT_REQUIRED/TOLL_BOOTH/USAGE_FEE_REQUIRED/ENTRANCE_FEE_REQUIRED/VIGNETTE_REQUIRED/TOLL_REQUIRED/TOLL_FULL/TOLL_REDUCED/ADVISORY/HIGH_CRIME/POLITICALLY_SENSITIVE/DISTURBED_BY_MAINTENANCE/CHECKPOINT/REGION_SPECIFIC）、`travel_mode`（TravelCategory 枚举：MOTOR_VEHICLE/AUTO/CARPOOL/MOTORCYCLE/BUS/TRUCK/DELIVERY/TAXI/EMERGENCY/THROUGH_TRAFFIC/AUTONOMOUS_VEHICLE/PEDESTRIAN/BICYCLE）、`style`（CONTIGUOUS/SINGLE/TURN/IN_OUT）、`intersection_group`、`scope`（DIRECTION/SIDE）、`restriction_group`、`vehicle_attribute_filter`、`autonomous_driving_products`、`travel_pattern`、`is_variable`、`restriction_token`、oneof `restriction_timing`（TimeScheduleProto / TimeApplicability enum）
- **作用：** 综合出行限制模型，支持法律、物理、付费、建议性以及特定区域的限制，并带有时段和车辆过滤功能。
- **功能要点：** 20+ 种限制类型；13 种出行类别；4 种限制样式（连续、单一、转向、出入）；按时间计划或本地指示器定时；车辆属性过滤；自动驾驶产品定向。

### `base/proto/restriction_group.proto` — 限制组
- **包名：** `geostore`
- **导入：** `featureid.proto`、`restriction.proto`、`travel_pattern.proto`
- **消息：** `RestrictionGroupProto` — `segment`（FeatureIdProto 列表）、`travel_pattern_restrictions`（TravelPatternRestrictionProto 包含 travel_pattern + restriction_type）、`related_signposts`、`is_variable`
- **作用：** 在出行模式条件下对一组路段的相关限制进行分组。
- **功能要点：** 出行模式特定的限制类型；路标杆关联。

### `base/proto/speed_limit.proto` — 速度限制
- **包名：** `geostore`
- **导入：** `timeschedule.proto`、`vehicle_attribute_filter.proto`、`vehicle_type.proto`
- **消息：**
  - `SpeedProto` — `speed`（float）、`unit`（MILES_PER_HOUR/KILOMETERS_PER_HOUR）
  - `VariableSpeedProto` — `fallback_speed`
  - `UnlimitedSpeedProto` — 空消息（德国高速公路）
  - `SpeedLimitProto` — `category`（NONE/SCHOOL/CONSTRUCTION/STATUTORY）、`condition`（RoadConditionalProto）、`source_type`（EXPLICIT/IMPLICIT/IMPLICIT_FROM_SIGN）、oneof：speed_with_unit / variable_speed / unlimited_speed
  - `RoadConditionalProto` — `time_schedule`、`vehicle_type`、`vehicle_attribute`
  - `AppliedSpeedLimitProto` — `speed_limit`、`trust_level`（LOW_QUALITY/HIGH_QUALITY/EXACT）
- **作用：** 速度限制模型，支持有条件应用（时间/车辆）、可变限制和可信度级别。
- **功能要点：** 按时间 + 车辆的条件速度限制；可变速度支持；无限速（高速公路）；数据质量的可信度级别。

### `base/proto/roadsign.proto` — 道路标志
- **包名：** `geostore`
- **导入：** `roadsigncomponent.proto`
- **消息：** `RoadSignProto` — `component`（repeated RoadSignComponentProto）
- **作用：** 道路标志组件的容器。一个标志可能有多个语义组件。

### `base/proto/roadsigncomponent.proto` — 道路标志组件
- **包名：** `geostore`
- **导入：** `featureid.proto`、`name.proto`、`routedirection.proto`
- **消息：** `RoadSignComponentProto` — `major_position`、`minor_position`（排序）、`semantic_type`（枚举：PRIORITY/SPEED_LIMIT/RESTRICTION/WARNING/INFO/AUXILIARY，带有深层子类型）、`text`（NameProto）、`feature_id`、`feature_type`、`route_direction`
- **作用：** 带有语义分类的已解析道路标志。超过 40 种语义类型，包括优先级（停止/让行）、速度限制、限制（转弯/移动/通行）、警告、信息边界和辅助标志。
- **功能要点：** 层次化语义类型树；标志组件排序；方向关联。

### `base/proto/sign.proto` — 物理交通标志
- **包名：** `geostore`
- **导入：** `stable_id_options.proto`
- **消息：** `SignProto` — `sign_id`（uint64）、`type`（SignType 枚举，200+ 值，涵盖 AUX_、DANGER_、DIRECTIONAL_、INFO_、PRIORITY_、RESTRICTION_、WARNING_ 标志）
- **作用：** 枚举物理交通标志类型（维也纳公约 + 区域变体）。
- **功能要点：** 200+ 种标志类型枚举，带有稳定 ID。

### `base/proto/signpost.proto` — 路标杆（物理标杆）
- **包名：** `geostore`
- **导入：** `featureid.proto`、`sign.proto`、ProtoMesh
- **消息：** `SignpostProto` — `segment`（FeatureIdProto）、`is_movable_post`、`sign`（repeated SignProto）
- **作用：** 路段上的物理路标杆，可容纳多个标志并标明是否可移动。

### `base/proto/curvature.proto` — 道路曲率
- **包名：** `geostore`
- **消息：** `PointCurvatureProto` — `start_point_fraction`、oneof：radians_per_meter / curvature_status（UNKNOWN）；`CurvatureProto` — repeated point_curvature
- **作用：** 路段沿线曲率剖面（弧度每米），用于 ADAS/车辆动力学。

### `base/proto/curve_connection.proto` — 曲线连接
- **包名：** `geostore`
- **消息：** `CurveConnectionProto` — `type`（BEZIER/CIRCLE/STRAIGHT_EDGE）、oneof：bezier_params / circle_params
- **作用：** 定义车道连接之间的曲线类型（含控制点的贝塞尔曲线、带半径的圆曲线、直边）。

### `base/proto/slope.proto` — 道路坡度
- **包名：** `geostore`
- **消息：** `SlopeProto` — `start_point_fraction`（float）、`slope_value`（float）
- **作用：** 路段沿线坡度剖面，由路段引用。

### `base/proto/gradelevel.proto` — 高程级别索引
- **包名：** `geostore`
- **消息：** `GradeLevelProto` — `index`（int32，必填）、`level`（int32，必填）
- **作用：** 为路段中每个点分配高程级别索引，用于区分天桥/地下通道。

### `base/proto/vertical_ordering.proto` — 垂直排序
- **包名：** `geostore`
- **消息：** `VerticalOrderingProto` — `level`（float）
- **作用：** 为要素分配垂直级别，用于堆叠关系。

---

## 地址模型

### `base/proto/address.proto` — 地址
- **包名：** `geostore`
- **导入：** `addresscomponent.proto`、`addresslines.proto`、`fieldmetadata.proto`
- **消息：** `AddressProto` — `template_id`（string）、`component`（repeated AddressComponentProto）、`address_lines`（repeated AddressLinesProto）、`cross_street`（已弃用）、`partial_denormalization`（自引用，用于非规范化/部分地址）、`metadata`；MessageSet 扩展位于 12208774
- **作用：** 由类型化组件和格式化行构成的结���化地址。支持混合结构化/非结构化地址的部分非规范化。
- **功能要点：** 基于模板的地址格式；基于组件的结构；非规范化支持。

### `base/proto/addresscomponent.proto` — 地址组件
- **包名：** `geostore`
- **导入：** `addressrange.proto`、`featureid.proto`、`name.proto`、`text_affix.proto`
- **消息：** `AddressComponentProto` — `type`（枚举：TYPE_FEATURE/TYPE_POSTAL_CODE_SUFFIX/TYPE_POST_BOX/TYPE_STREET_NUMBER/TYPE_FLOOR/TYPE_ROOM/TYPE_HOUSE_ID/TYPE_DISTANCE_MARKER/TYPE_LANDMARK/TYPE_PLUS_CODE）、`parsed_name`（NameProto）、`feature_type`（int32）、`feature_id`、`range`（AddressRangeProto）、`index`、`text_affix`
- **作用：** 类型化的地址组件，可引用 geostore 要素（例如街道）、包含数字范围以及带有文本前后缀。
- **功能要点：** 10 种组件类型；要素链接；范围支持；前缀/后缀的文本词缀。

### `base/proto/addresslines.proto` — 地址行
- **包名：** `geostore`
- **消息：** `AddressLinesProto` — `line`（repeated string）、`language`（string）
- **作用：** 特定语言的格式化地址行（面向显示）。

### `base/proto/addressrange.proto` — 地址范围
- **包名：** `geostore`
- **消息：** `AddressRangeProto` — `number`（repeated int32）、`parameter`（repeated float 用于插值）、`same_parity`（bool，默认 true）、`prefix`、`suffix`
- **作用：** 带插值参数和文本装饰的数字地址范围。
- **功能要点：** 通过浮点参数插值；奇偶性控制。

### `base/proto/text_affix.proto` — 文本词缀
- **包名：** `geostore`
- **消息：** `TextAffixProto` — `language`、`prefix`、`suffix`
- **作用：** 地址组件的按语言前缀/后缀。

---

## 名称、区域设置和语言

### `base/proto/name.proto` — 要素名称
- **包名：** `geostore`
- **导入：** `fieldmetadata.proto`
- **消息：** `NameProto` — `text`（string，必填）、`language`（string）、`flag`（repeated FlagCategory 枚举：IN_LOCAL_LANGUAGE/PREFERRED/OFFICIAL/OBSCURE/ON_SIGNS/EXIT_NAME_NUMBER/EXIT_NAME/INTERCHANGE_NAME/EXIT_NUMBER/TRANSIT_HEADSIGN/CONNECTS_DIRECTLY/CONNECTS_INDIRECTLY/INTERSECTION_NAME/VANITY/ROUTE_NUMBER/COUNTRY_CODE_2/ABBREVIATED/ID/IATA_ID/ICAO_ID/ISO_3166_2/TIMEZONE_ID/ROUNDABOUT_ROUTE/NEVER_DISPLAY/BICYCLE_ROUTE/MACHINE_GENERATED/TRADITIONAL 等）、`raw_text`（已弃用）、`short_text`、`metadata`；MessageSet 扩展位于 308676116
- **作用：** 多语言要素名称，具有丰富的标志分类法用于展示逻辑（路标、路线、ID）。
- **功能要点：** 30+ 种名称标志；短文本变体；ID 标志（IATA、ICAO、ISO 等）。

### `base/proto/languagetaggedtext.proto` — 语言标记文本
- **包名：** `geostore`
- **消息：** `LanguageTaggedTextProto` — `text`（string）、`language`（string）
- **作用：** 简单的文本+语言对，在整个模式中使用。

### `base/proto/locale.proto` — 区域定义
- **包名：** `geostore`
- **导入：** `localelanguage.proto`、ProtoMesh
- **消息：** `LocaleProto` — `language`（repeated LocaleLanguageProto）、`localization_policy_id`（string）
- **作用：** 定义地理区域及其语言和本地化策略。

### `base/proto/localelanguage.proto` — 区域语言
- **包名：** `geostore`
- **消息：** `LocaleLanguageProto` — `language`（string，必填）、`preference`（float）、`official`（bool）、`speaking_percent`（float）、`writing_percent`（float）
- **作用：** 区域的语言统计和偏好。

### `base/proto/bestlocale.proto` — 最佳区域分配
- **包名：** `geostore`
- **导入：** `featureid.proto`、`fieldmetadata.proto`、ProtoMesh
- **消息：** `BestLocaleProto` — `localization_policy_id`、`locale`（FeatureIdProto）、`metadata`
- **作用：** 为要素分配最佳匹配的区域以作出本地化决策。

### `base/proto/region_specific_name.proto` — 特定区域名称
- **包名：** `geostore`
- **导入：** `name.proto`
- **消息：** `RegionSpecificNameProto` — `region_code`（string）、`name`（NameProto）、`displayable_as_alternative_name`（bool）
- **作用：** 按区域编码的替代名称（例如争议领土命名）。

---

## 建筑与 3D 模型

### `base/proto/building.proto` — 建筑
- **包名：** `geostore`
- **导入：** `featureid.proto`、`fieldmetadata.proto`、ProtoMesh
- **消息：** `BuildingProto` — `structure`（枚举：TOWER/DOME/CASTLE/SHRINE/TEMPLE/TANK）、`floors`、`height_meters`、`base_height_meters_agl`（地面以上高度）、`level`（repeated FeatureIdProto）、`default_display_level`
- **作用：** 建筑属性，包括结构类型、楼层数、高度和室内楼层引用。

### `base/proto/cityjson.proto` — CityJSON 3D 模型
- **包名：** `geostore`
- **导入：** `cityobject_attributes.proto`
- **消息：** `CityJsonProto` 包含嵌套的 `Transform`（缩放 + 平移）、`CityObject`（id、type：BUILDING/OTHER_CONSTRUCTION、Geometry 包含 LOD、语义：WINDOW/DOOR、边界：MultiPoint/MultiSurface/Solid、Materials、CityObjectAttributes）、`Appearance`（材质包含漫反射颜色、光泽度、透明度、平滑度）
- **作用：** 用于 3D 城市模型的 CityJSON 格式。支持 LOD、语义表面、材质和多种几何表示。
- **功能要点：** 完整的 CityJSON 模型；LOD 支持；语义表面标记；带有 RGB 颜色的材质系统。

### `base/proto/cityobject_attributes.proto` — CityObject 仿射变换
- **包名：** `geostore`
- **消息：** `CityObjectAttributes` 包含 `TrsAffineTransform`（缩放、旋转、平移）
- **作用：** CityJSON 城市对象的 TRS（平移/旋转/缩放）变换。

### `base/proto/threedimensionalmodel.proto` — 3D 模型（网格）
- **包名：** `geostore`
- **导入：** `point.proto`
- **消息：** `PointWithHeightProto` — `point`（PointProto）、`altitude_meters`；`ThreeDimensionalModelProto` — `points`（repeated PointWithHeightProto）、`point_indices`（repeated int32 用于三角网格）
- **作用：** 简单三角形网格 3D 模型，带有索引顶点和高度。

---

## 商家与 POI

### `base/proto/establishment.proto` — 企业/POI 商家
- **包名：** `geostore`
- **导入：** `featureid.proto`、`openinghours.proto`、`priceinfo.proto`、`service_area.proto`、`telephone.proto`、`timeschedule.proto`、ProtoMesh
- **消息：**
  - `EstablishmentProto` — `type`（TypeCategory 枚举，400+ 企业类别：LODGING/HOTEL/RESTAURANT/CAFE/FAST_FOOD/GAS_STATION/PARKING/AIRPORT/HOSPITAL/SCHOOL/POLICE/MUSEUM/PARK/GOLF_COURSE/STADIUM/LIBRARY/CHURCH/MOSQUE/TEMPLE/...）、`telephone`、`hours`（TimeScheduleProto）、`opening_hours`（OpeningHoursProto）、`bizbuilder_reference`、`price_info`、`service_area`、`routing_destination`
  - `BizBuilderReferenceProto` — `id`（int64）
- **作用：** 丰富的企业/POI 分类，超过 400 种类型以层次结构组织。包括联系方式、营业时间、定价和服务区域。
- **功能要点：** 400+ 种企业类别，含多级层次结构；BizBuilder 集成。

### `base/proto/business_chain.proto` — 企业连锁
- **包名：** `geostore`
- **导入：** `canonical_gconcept.proto`
- **消息：** `BusinessChainProto` — `canonical_gconcepts`（repeated CanonicalGConceptProto）
- **作用：** 将商家与业务连锁知识图谱概念关联起来。

### `base/proto/service_area.proto` — 服务/配送区域
- **包名：** `geostore`
- **导入：** `featureid.proto`、ProtoMesh
- **消息：** `ServiceAreaProto` — `served_feature`（repeated FeatureIdProto）
- **作用：** 定义企业服务的地理区域（配送、服务覆盖范围）。

---

## 停车

### `base/proto/parking.proto` — 停车
- **包名：** `geostore`
- **导入：** `featureid.proto`、`languagetaggedtext.proto`、`openinghours.proto`、`timebasedrate.proto`、`timeschedule.proto`、Freebase topics
- **消息/枚举：**
  - `ParkingProto` — `parking_available`（bool）、`parking_provider_feature`、`parking_association`、`opening_hours`、`allowance`（ParkingAllowanceProto）、`restriction`（ParkingRestrictionProto）
  - `ParkingRestrictionProto` — `restricted_hours`、`service_type`（TravelServiceType：ALL/GENERAL_DRIVER/RIDESHARE/TAXI/COMMERCIAL）、`vehicle_type`、`restriction_type`（PARKING/STANDING/STOPPING/PICKUP_GOODS/PICKUP_PASSENGERS）
  - `ParkingAllowanceProto` — `allowance_type`（STANDARD/VALET/PERMIT/PICKUP_GOODS/PICKUP_PASSENGERS）、`vehicle_type`（ANY/CAR/MOTORCYCLE/TRUCK）、`service_type`、`permit_type`（LanguageTaggedText）、`min_purchase_for_validation`（Freebase topics）、`is_discount`、`time_based_rate`
  - `ParkingAssociationProto` — `associated_parking_feature`、`is_onsite`
- **作用：** 全面的停车模型：可用性、限制（停车/临时停靠/停靠，含时间/车辆/服务约束）、许可（代客/许可证/折扣）以及按时间计费。
- **功能要点：** 停车场内关联；含消费验证的按时段计费；网约车/出租车服务区分。

---

## 营业时间与时间

### `base/proto/openinghours.proto` — 营业时间
- **包名：** `geostore`
- **导入：** `businesshours.proto`、`exceptionalhours.proto`
- **消息：** `OpeningHoursProto` — `regular_hours`（BusinessHoursProto）、`exception`（repeated ExceptionalHoursProto）；MessageSet 扩展位于 98510069
- **作用：** 将常规营业时间与例外（假期、特殊）时间结合。

### `base/proto/businesshours.proto` — 营业时间（包装器）
- **包名：** `geostore`
- **导入：** `fieldmetadata.proto`、外部 `repository/docchart/extraction/businesshours.proto`
- **消息：** `BusinessHoursProto` — `data`（来自外部 proto 的 BusinessHours）、`metadata`
- **作用：** 包装来自仓库系统的结构化 BusinessHours 类型。

### `base/proto/exceptionalhours.proto` — 例外时间
- **包名：** `geostore`
- **导入：** `businesshours.proto`、`fieldmetadata.proto`、`timeschedule.proto`
- **消息：** `ExceptionalHoursProto` — `range`（TimeIntervalProto）、`hours`（BusinessHoursProto）、`metadata`
- **作用：** 特定日期范围内的营业时间（假期、特殊活动）。

### `base/proto/openingstatus.proto` — 营业状态枚举
- **包名：** `geostore`
- **枚举：** `OpeningStatus` — UNSPECIFIED/FUTURE_OPENING/OPEN/TEMPORARILY_CLOSED/PERMANENTLY_CLOSED
- **作用：** 简单的企业经营状态枚举。

### `base/proto/timeschedule.proto` — 时间计划
- **包名：** `geostore`
- **导入：**（无外部）
- **消息：**
  - `TimeEndpointProto` — `second`、`minute`、`hour`、`day`、`day_type`（DAY_OF_WEEK/DAY_OF_MONTH/DAY_OF_YEAR）、`week`、`week_type`（WEEK_OF_MONTH/WEEK_OF_YEAR）、`month`（JANUARY-DECEMBER + NEXT_JANUARY）、`year`、`DayOfWeek` 枚举（SUNDAY-SATURDAY + NEXT_SUNDAY）
  - `TimeIntervalProto` — `type`（OCCASION/RANGE）、`inverted`（bool）、`occasion`（SEASON/DAYS/HOURS/CONDITIONS，深层子类型：WINTER/SUMMER/SCHOOL/HOLIDAY/PEAK/DUSK_TO_DAWN/HIGH_TIDE/HIGH_WATER/ADVERSE/AVALANCHE/SNOW/ICE...）、`begin`/`end`（TimeEndpointProto）
  - `TimeComponentProto` — `interval`（repeated）、`component_type`（POSITIVE/MISSING_DATA）
  - `TimeScheduleProto` — `component`（repeated TimeComponentProto）；MessageSet 扩展位于 15256124
- **作用：** 复杂的时间表达式系统。支持重复计划、按星期/月/年、季节性时段、天气条件以及正/负组件。
- **功能要点：** 30+ 种时段类别；日期类型精度；倒置间隔；基于组件的组合。

### `base/proto/datetime.proto` — 日期时间
- **包名：** `geostore`
- **消息：** `DateTimeProto` — `seconds`（double，Unix 时间戳）、`precision`（枚举：CENTURY/DECADE/YEAR/MONTH/DAY/HOUR/MINUTE/SECOND）；MessageSet 扩展位于 15303159
- **作用：** 带有明确精度级别的时间戳。

---

## 定价与支付

### `base/proto/priceinfo.proto` — 价格/菜单信息
- **包名：** `geostore`
- **导入：** `price_info_category.proto`、`price_info_food_attribute_details.proto`、`pricerange.proto`、`timeschedule.proto`、`url.proto`、`urllist.proto`、`google/protobuf/duration.proto`
- **消息：**
  - `PriceInfoProto` — `price_list_url`、`price_list`（repeated PriceListProto）、`status`（PriceInfoStatus）
  - `PriceInfoStatus` — `is_verified`（bool）
  - `PriceListProto` — `name_info`、`source_url`、`available_time`、`section`（PriceListSectionProto）、`cuisines`（PriceInfoFoodCuisine）、`aggregator_id`
  - `PriceListSectionProto` — `name_info`、`item_type`（PriceInfoCategory：FOOD/SERVICE/PRODUCT/JOB）、`food_item`、`composable_item`、`media`、`call_to_action`
  - `FoodMenuItemProto` — `name_info`、`item_option`（FoodMenuItemOptionProto）
  - `ComposableItemProto` — `name_info`、`media`、`price`（PriceRangeProto）、`price_format`（DEFAULT/VARIES）、`call_to_action`、`offered`、`ranking_hint`、oneof：`job_metadata`
  - `FoodMenuItemOptionProto` — `name_info`、`price`、`calories`、`spiciness`（NONE/MILD/MEDIUM/HOT）、`allergen_present`/`allergen_absent`（DAIRY/EGG/FISH/PEANUT/SHELLFISH/SOY/TREE_NUT/WHEAT）、`restriction`（HALAL/KOSHER/ORGANIC/VEGAN/VEGETARIAN）、`nutrition_facts`、`ingredients`、`serves_num_people`、`preparation_methods`、`media`、`portion_size`
  - `CallToActionProto` — `cta_type`（BOOK/BUY/ORDER_ONLINE/LEARN_MORE/SIGN_UP/GET_OFFER）、oneof payload：url
  - `MediaItemProto` — `google_url`、`media_key`、`media_size`（width/height）、`media_format`（PHOTO）
- **作用：** 完整的餐厅菜单和服务定价模型。结构化菜单项，包含选项、过敏原、饮食信息、营养事实、媒体和行动号召按钮。支持来自聚合器的数据（已验证状态）。
- **功能要点：** 结构化菜单层级（价目表 → 分区 → 项目 → 选项）；过敏原和饮食限制标注；营养事实；食品制备方法；份量；CTA 集成；媒体照片。

### `base/proto/price_info_category.proto` — 价格信息类别
- **包名：** `geostore`
- **枚举：** `PriceInfoCategory` — TYPE_ANY/TYPE_FOOD/TYPE_SERVICE/TYPE_PRODUCT/TYPE_JOB/TYPE_3P_JOB
- **作用：** 对定价项目类型进行分类。

### `base/proto/price_info_food_attribute_details.proto` — 食品详情
- **包名：** `geostore`
- **消息/枚举：**
  - `PriceInfoFoodNutritionFacts` — `calories`（CaloriesFact 包含 range + unit：CALORIE/JOULE）、`total_fat`、`cholesterol`、`sodium`、`total_carbohydrate`、`protein`（NutritionFact 包含 range + mass unit：GRAM/MILLIGRAM）
  - `PriceInfoFoodCuisine` — 30 种菜系类型（FAST_FOOD/AMERICAN/JAPANESE/ITALIAN/MEXICAN/INDIAN/THAI/FRENCH...）
  - `PriceInfoFoodPreparationMethod` — 25 种方法（BAKED/BOILED/GRILLED/FRIED/ROASTED/FERMENTED/MARINATED...）
- **作用：** 食品菜单的营养事实、菜系类型和制备方法。

### `base/proto/pricerange.proto` — 价格区间
- **包名：** `geostore`
- **导入：** `options.proto`
- **消息：** `PriceRangeProto` — `lower_price`、`upper_price`、`currency`（string）、`units`（UnitsCategory 枚举：PER_USE/PER_PHONE_CALL/PER_RIDE/PER_TIME_UNIT→PER_SECOND/MINUTE/HOUR/DAY/WEEK/MONTH/YEAR/PER_VOLUME_UNIT→PER_LITER/GLASS/BOTTLE/PER_LENGTH_UNIT→PER_METER/KILOMETER/PER_MASS_UNIT→PER_GRAM/KILOGRAM/OUNCE/POUND）；MessageSet 扩展位于 15000834
- **作用：** 带货币和单位规格的价格区间。
- **功能要点：** 20+ 种单位类型，涵盖使用/时间/体积/长度/质量维度。

### `base/proto/durationbasedrate.proto` — 按时长计费
- **包名：** `geostore`
- **导入：** Freebase topics
- **消息：** `DurationBasedRateProto` — `range_start_seconds`、`range_end_seconds`、`is_free`（bool）、`price`（Freebase Topic）、`periodicity_seconds`
- **作用：** 带时间段区间和周期性的停车/按时计费。

### `base/proto/timebasedrate.proto` — 按时段计费
- **包名：** `geostore`
- **导入：** `durationbasedrate.proto`、`timeschedule.proto`
- **消息：** `TimeBasedRateProto` — `duration_based_rate`（repeated）、`valid_start_within` / `valid_end_within`（TimeScheduleProto）、`tax_included`
- **作用：** 将按时长计费的费率与有效期窗口组合。

---

## 存在状态与生命周期

### `base/proto/existence.proto` — 要素存在状态
- **包名：** `geostore`
- **导入：** `datetime.proto`、ProtoMesh
- **消息：** `ExistenceProto` — `removed`（bool）、`removed_reason`（枚举：BOGUS/PRIVATE/PRIVATE_MUST_PURGE/SPAM/UNSUPPORTED/PENDING/DUPLICATE/OLD_SCHEMA/REPLACED/ROLLED_BACK/LEGAL_TRADEMARK/LEGAL_OTHER）、`closed`（bool）、`close_reason`（枚举：CLOSED/MOVED/REBRANDED）、`start_date`、`end_date`、`end_as_of_date`、`prevent_revival`（bool）；MessageSet 扩展位于 1321489
- **作用：** 追踪要素的移除/关闭，带有详细原因。支持时间存在窗口和防止重新激活的功能。
- **功能要点：** 独立的移除和关闭状态；法律移除原因；防止重新激活标志。

### `base/proto/existence_confirmation.proto` — 存在确认
- **包名：** `geostore`
- **导入：** `data_agent.proto`、`datetime.proto`
- **消息：** `ExistenceConfirmationProto` — `originator`（DataAgentProto）、`utc_confirmation_time`、`utc_confirmation_receipt_time`
- **作用：** 记录谁以及何时确认了要素的存在。

### `base/proto/data_agent.proto` — 数据代理身份
- **包名：** `geostore`
- **消息：** `DataAgentProto` — oneof id：`mid`（string）
- **作用：** 通过机器 ID 标识数据代理。

---

## 公交

### `base/proto/transitline.proto` — 公交线路
- **包名：** `geostore`
- **导入：** `featureid.proto`、ProtoMesh
- **消息：** `TransitLineProto` — `agency`（FeatureIdProto 列表）、`vehicle_type`（枚举：RAIL/METRO_RAIL/SUBWAY/TRAM/MONORAIL/HEAVY_RAIL/COMMUTER_TRAIN/HIGH_SPEED_TRAIN/LONG_DISTANCE_TRAIN/BUS/INTERCITY_BUS/TROLLEYBUS/FERRY/CABLE_CAR/GONDOLA_LIFT/FUNICULAR/HORSE_CARRIAGE/AIRPLANE）、`label_background_color`（fixed32 ARGB）、`label_text_color`（fixed32 ARGB）、`stations`（FeatureIdProto 列表）
- **作用：** 公交线路，包含车辆类型、运营机构、地图颜色编码和站点列表。
- **功能要点：** 20 种车辆类型；地图标注颜色；站点排序。

### `base/proto/transit_line_variant.proto` — 公交线路变体
- **包名：** `geostore`
- **导入：** `featureid.proto`
- **消息：** `TransitLineVariantProto` — `stops`（repeated ServicedStopProto）、`line_concept`（FeatureIdProto）；`ServicedStopProto` — `id`、`index`
- **作用：** 公交线路的特定服务模式（变体），带有有序站点。

### `base/proto/transitstation.proto` — 公交车站
- **包名：** `geostore`
- **导入：** `featureid.proto`
- **消息：** `TransitStationProto` — `agency_associations`（TransitAgencyAssociationProto：agency feature + station_code）、`StationCategory` 枚举（UNKNOWN/STOP_GROUP）
- **作用：** 公交车��，带有运营机构关联和站点代码。

### `base/proto/attachments/transit/transit_entrance_attachment.proto` — 公交入口附件
- **包名：** `geostore.attachments`
- **导入：** `featureid.proto`、`languagetaggedtext.proto`、`tools/public/annotations.proto`
- **消息：** `TransitEntranceAttachmentProto` — `accessibility`（NONE/WHEELCHAIR）、`mode`（ELEVATOR/ESCALATOR/STAIRS/RAMP/WALKWAY）、`connected_station_ids`、`heading`（int32）、`indoor_connections`（POI 引用）；MessageSet 扩展位于 122556540
- **作用：** 公交入口详情，包括无障碍设施、进入方式、朝向和室内 POI 连接。

---

## EV 充电

### `base/proto/ev_charger.proto` — EV 充电桩
- **包名：** `geostore`
- **导入：** `featureid.proto`、ProtoMesh
- **消息：** `EvChargerProto` — `uid`（OperatorUidProto：operator_id + uid）、`evse_id`、`connectors`（ConnectorProto：type 枚举 J_1772/MENNEKES/CHADEMO/CCS_COMBO_1/CCS_COMBO_2/GB_T/WALL_OUTLET/LECCS/TYPE_6/NACS/TYPE_3C/TYPE_3A/IEC_60309 变体、max_power_kw、max_current_amps、max_voltage_volts）、`ev_station`（FeatureIdProto）
- **作用：** 单个 EV 充电桩，包含连接器类型、功率规格和站点关联。
- **功能要点：** 15 种连接器类型，包括 NACS（Tesla）；三个功率维度（kW、A、V）。

### `base/proto/ev_station.proto` — EV 充电站
- **包名：** `geostore`
- **导入：** `emobility_ids.proto`、`featureid.proto`、`gelfs_ids.proto`、ProtoMesh
- **消息：** `EvStationProto` — `external_id`（ExternalStationIdProto：id + source enum TESLA）、`ocpi_id`（EMobilityLocationIdProto）、`gelfs_id`（GelfsLocationIdProto）、`oem_restriction`（NONE/TESLA/NACS_PARTNER/RIVIAN）、`associated_host`、`ev_chargers`（FeatureIdProto 列表）
- **作用：** EV 充电站，包含外部 ID（Tesla、OCPI、GELFS）、OEM 限制和充电桩列表。
- **功能要点：** 多 ID 系统（OCPI、GELFS、Tesla）；OEM 访问限制。

### `base/proto/emobility_ids.proto` — 电动出行位置 ID
- **包名：** `geostore`
- **消息：** `EMobilityLocationIdProto` — `country_code`、`party_id`、`location_id`
- **作用：** 兼容 OCPI 的电动出行位置标识符。

### `base/proto/gelfs_ids.proto` — GELFS 位置 ID
- **包名：** `geostore`
- **消息：** `GelfsLocationIdProto` — `provider_id`、`country_code`、`location_id`
- **作用：** GELFS（Google EV Location Feed Specification）位置标识符。

---

## 高程与地形

### `base/proto/elevation.proto` — 要素高程
- **包名：** `geostore`
- **导入：** `peak.proto`
- **消息：** `ElevationProto` — `average_elevation_meters`（double）、`peak`（PeakProto）
- **作用：** 自然要素的平均海拔和山峰突出度。

### `base/proto/peak.proto` — 山峰突出度
- **包名：** `geostore`
- **消息：** `PeakProto` — `prominence_meters`（double）
- **作用：** 以米为单位的山峰地形突出度。

### `base/proto/elevationmodel.proto` — 高程模型
- **包名：** `geostore`
- **消息：** `ElevationModelProto` — `data_level`（int32，必填）、`data_maxlevel`（int32，必填）、`partial_child_data_available`（bool）、`full_child_data_available`（bool）、`blend_order`（int32）、`elevation_data`（MessageSet）
- **作用：** 引用带有细节层次结构的分块高程模型。
- **功能要点：** 多分辨率 LOD；混合排序；部分/完整子数据可用性。

---

## 边界与地缘政治

### `base/proto/border.proto` — 边界
- **包名：** `geostore`
- **导入：** `featureid.proto`、ProtoMesh
- **消息：** `BorderProto` — `type`（int32，必填，通过 fieldtype 枚举）、`status`（NORMAL/DISPUTED/UNSURVEYED/INTERNATIONAL_WATER/NEVER_DISPLAY/TREATY/PROVISIONAL/NO_LABEL）、`feature_id_left` / `feature_id_right`、`override_status`（OverrideBorderStatusProto：status + country_code）、`logical_border`（FeatureIdProto 列表）
- **作用：** 边界，包含左右两侧（left/right 要素）、状态（包括争议/未勘定）、按国家状态覆盖以及逻辑边界组成。
- **功能要点：** 带左右区分的双边边界；争议领土的按国家状态覆盖；逻辑边界段。

### `base/proto/logical_border.proto` — 逻辑边界
- **包名：** `geostore`
- **导入：** `featureid.proto`、ProtoMesh
- **消息：** `LogicalBorderProto` — `border_segment`（FeatureIdProto 列表）、`status`（NORMAL/DISPUTED）
- **作用：** 将边界段分组为具有统一状态的逻辑边界。

### `base/proto/geopolitical.proto` — 地缘政治要素
- **包名：** `geostore`
- **导入：** `featureid.proto`、`polygon.proto`、`region_specific_name.proto`
- **消息：** `GeopoliticalProto` — `region_specific_name`、`conveys_attribution_to`、`regional_polygon_composing_claims`（region_code + included/excluded claims）、`regional_polygon_adjustment`（region_code + polygon_to_add / polygon_to_subtract）
- **作用：** 国家/地区的地缘政治要素模型，支持争议主张、区域面调整和归属信息。
- **功能要点：** 按区域的主张组合多边形；面加减调整；归属追踪。

### `base/proto/geopolitical_geometry.proto` — 地缘政治几何
- **包名：** `geostore`
- **导入：** `polygon.proto`
- **消息：** `GeopoliticalGeometryProto` — `self_polygon`、`rest_of_world_polygon`
- **作用：** 地缘政治要素的预计算自身和"其他地区"多边形。

### `base/proto/political.proto` — 政治属性
- **包名：** `geostore`
- **导入：** `featureid.proto`
- **消息：** `PoliticalProto` — `population`（已弃用）、`capital`（已弃用）、`gross_domestic_product_usd_millions`（已弃用）、`literacy_percent`（已弃用）、`claim`（FeatureIdProto 列表）
- **作用：** 政治主张关联。大多数统计字段已弃用。

### `base/proto/disputed_area.proto` — 争议区域
- **包名：** `geostore`
- **导入：** `featureid.proto`
- **消息：** `DisputedAreaProto` — `administered_by`（string）、`claimant`（FeatureIdProto 列表）
- **作用：** 标识争议区域及其管理者和声索方。

---

## 关系

### `base/proto/relation.proto` — 要素关系
- **包名：** `geostore`
- **导入：** `featureid.proto`、`fieldmetadata.proto`、`name.proto`
- **消息：** `RelationProto` — `relation`（RelationCategory 枚举：OVERLAPS/CONTAINED_BY/EQUAL_TO/CAPITAL_OF/DISAMBIGUATED_BY/NEIGHBOR_OF/OPPOSITE_TO/NEXT_TO/RIGHT_OF/LEFT_OF/BEHIND/IN_FRONT_OF/SAME_BUILDING/ABOVE/BELOW/NEAR/ORGANIZATIONALLY_PART_OF/DEPARTMENT_OF/WORKS_AT/INDEPENDENT_ESTABLISHMENT_IN/ON_LEVEL/OCCUPIES/BUSINESS_LIFE_CYCLE/BUSINESS_MOVED/BUSINESS_REBRANDED/MEMBER_OF_CHAIN/AUTHORIZED_DEALER_FOR_CHAIN/SUBSIDIARY_OF/PRIMARILY_OCCUPIED_BY/CLIENT_DEFINED）、`other_feature_id`、`other_feature_type`（必填 int32）、`other_feature_country_code`、`other_feature_territorial_administrator`、`other_feature_name`、`relation_is_reversed`
- **作用：** 要素之间丰富的关系分类法。支持空间关系（包含、重叠、相邻）、组织关系（属于、子公司、连锁品牌）、生命周期关系（搬迁、更名）以及位置关系（上/下、左/右）。
- **功能要点：** 40+ 种关系类型；空间、组织、生命周期和位置语义；可逆性标志。

---

## 访问点与入口

### `base/proto/accesspoint.proto` — 访问点
- **包名：** `geostore`
- **导入：** `featureid.proto`、`fieldmetadata.proto`、`point.proto`
- **消息：** `AccessPointProto` — `point`（PointProto）、`feature_id`、`feature_type`、`segment_position`（float）、`point_on_segment`、`point_off_segment`、`can_enter` / `can_exit`、`priority`（PRIMARY/SECONDARY）、`unsuitable_travel_mode`（MOTOR_VEHICLE/AUTO/TWO_WHEELER/BICYCLE/PEDESTRIAN/PUBLIC_TRANSIT）、`level_feature_id`、`metadata`
- **作用：** 定义如何从道路网络访问要素：沿路段的进入/退出点，带有出行方式约束。
- **功能要点：** 在/离路段点的区分；进入/退出标志；出行方式适用性；主要/次要优先级。

### `base/proto/entrance.proto` — 入口
- **包名：** `geostore`
- **导入：** `languagetaggedtext.proto`、`travel_pattern.proto`
- **消息：** `EntranceProto` — `allowance`（ENTER_AND_EXIT/ENTER_ONLY/EXIT_ONLY）、`entry_rule`（EntryRuleProto 包含 travel_pattern）、`qualifier_text`（LanguageTaggedTextProto）
- **作用：** 入口定义，包含方向许可、出行模式规则和限定文本。
- **功能要点：** 进入/退出方向控制；基于出行模式的进入规则。

### `base/proto/entrance_reference.proto` — 入口引用
- **包名：** `geostore`
- **导入：** `featureid.proto`、ProtoMesh
- **消息：** `EntranceReferenceProto` — `feature_id`
- **作用：** 入口要素的轻量级引用。

---

## 数据来源与溯源

### `base/proto/datasource.proto` — 数据源
- **包名：** `geostore`
- **导入：** `datasourceprovider.proto`、`datetime.proto`、`rawmetadata.proto`、`url.proto`
- **消息：** `DataSourceProto` — `description`、`copyright_owner`、`copyright_year`、`release_date`、`release`、`raw_metadata`、`provider`（来自 DataSourceProvider 的枚举）、`importer_timestamp`、`importer_build_info`、`importer_build_target`、`importer_client_info`、`source_dataset`、`attribution_url`、`importer_mpm_version`
- **作用：** 关于数据源的元数据，包括提供者、版权、发布信息、导入者详情和归属 URL。

### `base/proto/datasourceprovider.proto` — 数据源提供者枚举
- **包名：** `geostore`（proto3 语法）
- **消息：** `DataSourceProvider` 包含 `Provider` 枚举 — 50+ 提供者值，包括 NAVTEQ（已弃用）、TELE_ATLAS（及子类型）、TELCONTAR、EUROPA、ROYAL_MAIL、GOOGLE（及 ~30 种子类型：HAND_EDIT、BORDERS、GT_FUSION、ZAGAT_CMS、BUSINESS_CHAINS、DISTILLERY、MAPSPAM、WIPEOUT、BEEGEES 等）
- **作用：** 用于数据溯源的综合提供者分类法。
- **功能要点：** 50+ 提供者枚举；已弃用的提供者已标注；Google 内部工具提供者。

### `base/proto/sourceinfo.proto` — 来源信息
- **包名：** `geostore`
- **导入：** `datetime.proto`、`featureid.proto`、`rawdata.proto`、`url.proto`、`user.proto`
- **消息：** `SourceInfoProto` — `source_id`（FeatureIdProto）、`raw_data`（RawDataProto）、`cookie`、`provider`（int32）、`release`、`dataset`、`layer`、`ogr_fid`（int64）、`gaia_id`（已弃用）、`user`（UserProto）、`impersonation_user`、`collection_date`、`attribution_url`、`stream_id`；MessageSet 扩展位于 18502900
- **作用：** 每个要素的归属信息：哪个提供者、数据集和用户贡献了此数据，以及原始数据负载和采集时间戳。

### `base/proto/sourceinfolist.proto` — 来源信息列表
- **包名：** `geostore`
- **导入：** `sourceinfo.proto`
- **消息：** `SourceInfoListProto` — `source_info`（repeated SourceInfoProto）
- **作用：** 来源信息条目的集合。

### `base/proto/rawdata.proto` — 原始数据
- **包名：** `geostore`
- **消息：** `RawDataProto` — `key`（string，必填）、`value_string`（string）
- **作用：** 原始源数据的键值对。

### `base/proto/rawmetadata.proto` — 原始元数据
- **包名：** `geostore`
- **消息：** `RawMetadataProto` — `key`（必填）、`label`（必填）、`description`（必填）、`conflation_method`（枚举：PICK_FIRST_VALUE/UNION_CSV/SUM）
- **作用：** 原始数据字段的元数据，包括合并策略。

### `base/proto/user.proto` — 用户身份
- **包名：** `geostore`
- **导入：** `net/proto2/proto/descriptor.proto`
- **消息：** `UserProto` — `encrypted_gaia_id`（bytes）、`encryption_key_name`、`keystore_config_id`、`username`；encryption_key_name_field 和 keystore_config_id_field 的字段选项扩展
- **作用：** 用于编辑归因的加密用户身份。

---

## 属性与知识图谱

### `base/proto/attribute.proto` — 通用属性
- **包名：** `geostore`
- **导入：** `fieldmetadata.proto`
- **消息：**
  - `AttributeProto` — 类型化键值对：`canonical_attribute_id`/`value_space_id`（AttributeIdProto）、`value_type`（STRING/INTEGER/DOUBLE/BOOLEAN/INT64/FLOAT/UINT32/ENUM_ID）、值字段（string_value/integer_value/int64_value/uint32_value/double_value/float_value/boolean_value/enum_id_value）、`attribute_display`/`value_display`（已弃用）
  - `AttributeIdProto` — `id`（string，必填）、`provider_id`（string，必填）、`type`（ITEMCLASS/ATTRIBUTE/VALUESPACE/DATASTORE）
- **作用：** 灵活的带类型属性系统，用于键值数据，具有提供者作用域的 ID。
- **功能要点：** 8 种值类型；提供者作用域的属性 ID；枚举 ID 值类型。

### `base/proto/gconceptinstance.proto` — 知识图谱概念实例
- **包名：** `geostore`
- **导入：** `fieldmetadata.proto`
- **消息：** `GConceptInstanceProto` — `gconcept_id`（string）、`prominence`（NON_PRIMARY/PRIMARY）
- **作用：** 将要素链接到知识图谱概念，并带有突出度权重。

### `base/proto/canonical_gconcept.proto` — 规范 GConcept
- **包名：** `geostore`
- **导入：** `gconceptinstance.proto`
- **消息：** `CanonicalGConceptProto` — `gconcept`（GConceptInstanceProto）、`is_required`（bool）
- **作用：** 规范化的知识图谱概念，带有必填标志。

### `base/proto/knowledgegraphreference.proto` — KG 引用
- **包名：** `geostore`
- **消息：** `KnowledgeGraphReferenceProto` — `id`（string）；MessageSet 扩展位于 157211294
- **作用：** 通过 ID 进行的简单 KG 实体引用。

---

## 信任与权限

### `base/proto/trustsignals.proto` — 信任信号
- **包名：** `geostore`
- **消息：** `SourceTrustProto` — `level`（枚举：BLOCKED/NOT_TRUSTED/YP_FEEDS/TRUSTED/SUPER_TRUSTED）；`TrustSignalsProto` — `source_trust`；MessageSet 扩展位于 24882046
- **作用：** 数据质量的来源信任分类。
- **功能要点：** 6 个信任级别，从 BLOCKED 到 SUPER_TRUSTED。

### `base/proto/rightslevel.proto` — 权限级别
- **包名：** `geostore`
- **消息/枚举：** `RightsLevelWrapper` — `rights_level`；`RightsLevel` — UNKNOWN_RIGHTS/GT_RIGHTS/FULL_RIGHTS
- **作用：** 字段的访问权限分类。

### `base/proto/property_value_status.proto` — 属性值状态
- **包名：** `geostore`
- **导入：** `edit/feature_property_id.proto`、`property_value_status_enum.proto`
- **消息：** `PropertyValueStatusProto` — `property_id`（FeaturePropertyIdProto）、`value_status`（PropertyValueStatus）
- **作用：** 追踪属性是否具有已知值、未知值或无值。

### `base/proto/property_value_status_enum.proto` — 值状态枚举
- **包名：** `geostore`
- **枚举：** `PropertyValueStatus` — UNSPECIFIED/HAS_NO_VALUE/HAS_UNKNOWN_VALUE
- **作用：** 属性值存在/缺失的枚举。

---

## 排序

### `base/proto/rankdetails.proto` — 排序详情
- **包名：** `geostore`
- **导入：** `ranksignal.proto`
- **消息：** `RankDetailsProto` — `signal`（repeated RankSignalProto）、`signal_mixer_type`（枚举：40+ 种混合器类型：ADDRESS_AREA/ROUTE_SEGMENT_INTERSECTION/POLITICAL/COUNTRY/LOCALITY/RIVER/PLACERANK/TRANSIT/PEAK/BUILDING/RESERVATION/AIRPORT/AREA...）
- **作用：** 汇总排序信号，配有可配置的混合器。40+ 种混合策略适用于不同的要素类型。
- **功能要点：** 40+ 种信号混合器类型，用于领域特定的排序。

### `base/proto/ranksignal.proto` — 排序信号
- **包名：** `geostore`
- **导入：** `fieldmetadata.proto`
- **消息：** `RankSignalProto` — `type`（Signal 枚举：60+ 种信号类型：LENGTH/AREA/ROAD_PRIORITY/WEBSCORE/PEAK_ELEVATION_PROMINENCE/POPULATION/GDP/EUROPA_CLASS/TRANSIT_COUNTS/WIKIPEDIA_ARTICLES/KML_PLACEMARKS/GOOGLE_REVIEWS/PLACE_INSIGHTS...）、`rank`（float）、`raw_scalar`、`raw_string`
- **作用：** 单个排序信号，包含类型、标准化排序值和原始值。
- **功能要点：** 60+ 种信号类型，涵盖几何、网络、公交和地点洞察。

---

## 中断与封闭

### `base/proto/road_disruption.proto` — 道路中断
- **包名：** `geostore`
- **导入：** `datetime.proto`、`featureid.proto`、`segment_portion.proto`、`timeschedule.proto`、`travel_mode.proto`、`vehicle_attribute_filter.proto`
- **消息：** `RoadDisruptionProto` — `cause`（CauseProto：oneof road_disruption_id/event_mid/cause_category，枚举：ROAD_OBSTRUCTION/CRASH/CRISIS/WEATHER/FLOODING/FIRE/PLANNED_EVENT/SPORTS_EVENT/PARADE/CONSTRUCTION/DEMONSTRATION/SEASONAL_CLOSURE）、`planned_schedule`、`current_state`/`future_state`（TimestampedStateProto：INACTIVE/SUSPECTED_ACTIVE/ACTIVE + utc_datetime）、`schedule_resumption_time`、`last_active_start_datetime`、`last_inactive_start_datetime`、`affected_segment_portions`、`affected_intersection_traversals`、`affected_travel_modes`、`affected_vehicle_filter`
- **作用：** 实时和计划性道路中断模型，包含原因、状态追踪和受影响的网络元素。
- **功能要点：** 15 种原因类别；时间状态追踪（疑似 vs 确认）；交叉口通行中断；出行方式 + 车辆过滤。

### `base/proto/road_monitor.proto` — 道路监控器
- **包名：** `geostore`
- **导入：** `featureid.proto`、ProtoMesh
- **消息：** `RoadMonitorProto` — `monitored_road`（FeatureIdProto 列表）
- **作用：** 将道路监控要素（例如交通摄像头）与被监控的道路关联。

### `base/proto/temporaryclosure.proto` — 临时关闭
- **包名：** `geostore`
- **导入：** `datetime.proto`
- **消息：** `TemporaryClosureProto` — oneof start（start_date/start_as_of_date）、oneof end（end_date/end_as_of_date）
- **作用：** 临时关闭的日期范围，带有近似日期替代项。

### `base/proto/operations.proto` — 运营操作
- **包名：** `geostore`
- **导入：** `temporaryclosure.proto`
- **消息：** `OperationsProto` — `temporary_closure`（repeated TemporaryClosureProto）
- **作用：** 临时运营变更的容器。

---

## 管制区域与特殊限制

### `base/proto/regulated_area.proto` — 管制区域
- **包名：** `geostore`
- **导入：** `restriction.proto`
- **消息：** `RegulatedAreaProto` — `restriction`（RestrictionProto）、`required_emissions_sticker`（枚举：EURO0-7/ELECTRIC_VEHICLES/DEU_RED/YELLOW/GREEN/FRA_CRITAIR1-5/DNK_RED/GREEN/AUT_EURO_I-VI/SPA_CAT_ECO/ZERO/B/C）
- **作用：** 环境/低排放区域，带有要求的排放标签。
- **功能要点：** 30+ 种排放标签类型，涵盖多个欧盟国家（德国、法国、丹麦、奥地利、西班牙）。

### `base/proto/specialized_road_restriction.proto` — 区域特定限制
- **包名：** `geostore`
- **导入：** `cellcovering.proto`
- **消息/扩展：** `SpecializedRoadRestrictionProto` 包含 `RegionSpecificRestrictionIdentifier`（JAKARTA_ODD_EVEN/SAO_PAULO_RODIZIO/MEXICO_CITY_HOY_NO_CIRCULA/MANILA_NUMBER_CODING/SANTIAGO_NUMBER_CODING/BOGOTA_ODD_EVEN/COSTA_RICA_SAN_JOSE/MADRID_ZERO_EMISSION_ZONE）；`s2_covering` 扩展在 EnumValueOptions 上（205836935）
- **作用：** 特定区域的交通限制方案，带有 S2 覆盖范围用于空间适用性。
- **功能要点：** 8 种区域限制方案；S2 覆盖范围附加用于地理围栏。

---

## 车辆属性

### `base/proto/vehicle_attribute_filter.proto` — 车辆属性过滤器
- **包名：** `geostore`
- **导入：** `toll_pass_type.proto`、`vehicle_emissions_category.proto`、`vehicle_type.proto`、`matching/public/feature_pattern.proto`
- **消息：**
  - `VehicleAttributeFilterProto` — `vehicle_type`（VehicleTypes.VehicleType）、`vehicle_weight`（WeightComparisonProto）、`has_trailer`、`vehicle_height/width/length`（DimensionComparisonProto）、`trailer_length`、`num_trailers`/`axle_count`（CountComparisonProto）、`hazardous_goods`（EXPLOSIVES/GASES/FLAMMABLE/COMBUSTIBLE/ORGANIC/POISON/RADIOACTIVE/CORROSIVE...）、`vehicle_emissions_category`、`toll_pass`
  - `WeightComparisonProto` — 比较运算符 + WeightProto（weight + unit：METRIC_TON/LONG_TON/SHORT_TON/POUND/KILOGRAM）
  - `DimensionComparisonProto` — 比较运算符 + DimensionProto（dimension + unit：METERS/FEET）
  - `CountComparisonProto` — 比较运算符 + count
  - `ComparisonOperators` — LESS_THAN/GREATER_THAN
- **作用：** 综合车辆过滤，用于限制检查：类型、重量、尺寸、拖车、轴数、危险品、排放和收费通行证。
- **功能要点：** 11 种危险品类型；5 种重量单位；2 种尺寸单位；数值比较。

### `base/proto/vehicle_type.proto` — 车辆类型
- **包名：** `geostore`
- **消息：** `VehicleTypes` 包含 `VehicleType` 枚举 — UNKNOWN/ANY/CAR/MOTORCYCLE/TRUCK/BUS
- **作用：** 基本车辆类型枚举。

### `base/proto/vehicle_emissions_category.proto` — 排放类别
- **包名：** `geostore`
- **枚举：** `VehicleEmissionsCategory` — GAS/DIESEL/ELECTRIC/HYDROGEN/HYBRID/PLUGIN_HYBRID
- **作用：** 车辆动力系统/燃料类型，用于基于排放的限制。

### `base/proto/vehicle_occupancy_range.proto` — 载客量范围
- **包名：** `geostore`
- **消息：** `VehicleOccupancyRangeProto` — `min_occupancy`、`max_occupancy`
- **作用：** HOV/拼车车道限制的最小/最大车辆载客量。

### `base/proto/toll_pass_type.proto` — 收费通行证类型
- **包名：** `geostore`
- **枚举：** `TollPassType` — E_ZPASS/FASTRAK/EXPRESSTOLL/SUNPASS/E_PASS/PEACH_PASS/I_PASS/NC_QUICK_PASS/PIKEPASS/TXTAG/EZ_TAG/EXPRESS_PASS/GOOD_TO_GO/TOLLTAG + FLEX 变体 + EXEMPTION_DECAL
- **作用：** 美国收费转发器类型，带有 flex/可切换变体。
- **功能要点：** 19 种收费通行证类型，覆盖美国主要收费系统。

---

## 自动驾驶

### `base/proto/autonomous_driving.proto` — 自动驾驶产品类型
- **包名：** `geostore`
- **消息/枚举：** `AutonomousDrivingProto` 包含 `ProductType` — UNKNOWN/HD_L4/HD_L2/ADAS/AUTO_DRIVING_EXPERIENCE
- **作用：** 分类自动驾驶功能级别（L4、L2、ADAS）。
- **功能要点：** 4 个自动驾驶数据的产品等级。

---

## 交通流

### `base/proto/traffic_flow_adjustment.proto` — 交通流调整
- **包名：** `geostore`
- **消息：** `TrafficFlowAdjustment` — oneof speed_adjustment：`Stop` / `SlowDown`（均为空消息）
- **作用：** 对影响车道交通流的交通控制事件（停车标志、减速区）进行建模。

---

## 行人设施

### `base/proto/pedestriancrossing.proto` — 人行横道
- **包名：** `geostore`
- **导入：** `restriction.proto`
- **消息：** `PedestrianCrossingProto` — `crossing_type`（CROSSABLE/UNMARKED_CROSSING/MARKED_CROSSING/UNCROSSABLE）、`restriction`、`offset`（float）、`width`（float）、`cross_anywhere`（bool）、`angle_degrees`（double）
- **作用：** 路段上的人行横道定义。
- **功能要点：** 横道类型分类；任意穿越标志；角度规范。

---

## 土地利用

### `base/proto/landuse.proto` — 土地利用
- **包名：** `geostore`
- **消息：** `LandUseProto` — `land_use_category`（枚举：RESIDENTIAL/COMMERCIAL/MIXED）
- **作用：** 区域的简单土地利用分类。

---

## 学区

### `base/proto/schooldistrict.proto` — 学区
- **包名：** `geostore`
- **消息：** `SchoolDistrictProto` — `type`（枚举：UNIFIED/ELEMENTARY/SECONDARY）
- **作用：** 学区边界分类。

---

## 滑雪度假村设施

### `base/proto/skiboundary.proto` — 滑雪场地边界
- **包名：** `geostore`
- **消息：** `SkiBoundaryProto` — `type`（DANGER/SKI_AREA/SLOW_ZONE）
- **作用：** 滑雪场地边界类型。

### `base/proto/skilift.proto` — 滑雪缆车
- **包名：** `geostore`
- **消息：** `SkiLiftProto` — `type`（SURFACE/T_BAR/J_BAR/ROPE_TOW/POMA/CARPET/FUNICULAR/GONDOLA/CHAIR/AERIAL/TRAM）
- **作用：** 滑雪缆车类型分类。

### `base/proto/skitrail.proto` — 滑雪道
- **包名：** `geostore`
- **消息：** `SkiTrailProto` — `type`（GLADE/TRAIL_TERRAIN/TRAIL/RACE_COURSE/BOWL）、`difficulty`（EASIEST/EASY/INTERMEDIATE/ADVANCED_INTERMEDIATE/DIFFICULT/ADVANCED_DIFFICULT）
- **作用：** 滑雪道分类，带难度级别。

---

## 中央隔离带

### `base/proto/median.proto` — 道路中央隔离带
- **包名：** `geostore`
- **导入：** `featureid.proto`
- **消息：** `MedianProto` 包含 `SegmentLoopProto`（索引组件，引用 segment id + begin/end fractions）
- **作用：** 将道路中央隔离带定义为路段部分的环形。
- **功能要点：** 分数段组件引用；环形几何。

---

## 显示与可视化

### `base/proto/display_data.proto` — 显示数据
- **包名：** `geostore`
- **导入：** `point.proto`
- **消息：** `DisplayDataProto` — `display_location`（PointProto）
- **作用：** 要素的覆盖显示位置（例如标注放置）。

### `base/proto/doodle.proto` — 涂鸦/标注
- **包名：** `geostore`
- **消息：** `DoodleProto` — `type`（枚举：USER_DEFINED_LABEL/POINT_ANNOTATION/LINE_ANNOTATION/AREA_ANNOTATION）
- **作用：** 地图上的用户标注类型。

### `base/proto/htmltext.proto` — HTML 文本
- **包名：** `geostore`
- **导入：** `languagetaggedtext.proto`
- **消息：** `HtmlTextProto` — `type`（HTML_DESCRIPTION）、`text`（repeated LanguageTaggedTextProto）
- **作用：** HTML 格式的多语言描述文本。

---

## 楼层

### `base/proto/level.proto` — 建筑楼层
- **包名：** `geostore`
- **导入：** `featureid.proto`、ProtoMesh
- **消息：** `LevelProto` — `number`（float，默认 0）、`building`（FeatureIdProto 列表）
- **作用：** 建筑中的楼层，可被多个建筑引用。

---

## 社交引用

### `base/proto/socialreference.proto` — 社交引用
- **包名：** `geostore`
- **消息：** `SocialReferenceProto` — `base_gaia_id`、`gaia_id_for_display`、`claimed_gaia_id`
- **作用：** 与要素关联的 Google 账户（GAIA）ID。

---

## 电话

### `base/proto/telephone.proto` — 电话
- **包名：** `geostore`
- **导入：** `featureid.proto`、`fieldmetadata.proto`、`name.proto`、`pricerange.proto`、i18n PhoneNumber
- **消息：** `TelephoneProto` — `number`（已弃用）、`phone_number`（i18n PhoneNumber）、`type`（VOICE/FAX/TDD/MESSAGING）、`label`（NameProto 列表）、`language`、`is_shared_number`、`flag`（NO_COLD_CALLS/PREFERRED）、`call_rate`（PriceRangeProto）、`contact_category`（CUSTOMER_SERVICE/RESERVATIONS/SALES）、`service_location_feature`；MessageSet 扩展位于 12773310
- **作用：** 国际电话号码，包含类型、标志、费率和服务类别。
- **功能要点：** i18n 电话号码格式；免骚扰电话标志；服务地点链接。

---

## URL

### `base/proto/url.proto` — URL
- **包名：** `geostore`
- **导入：** `fieldmetadata.proto`
- **消息：** `UrlProto` — `url`（string，必填）、`language`、`pagerank`（已弃用）、`metadata`；MessageSet 扩展位于 23880165
- **作用：** 带有语言和元数据的 URL。

### `base/proto/urllist.proto` — URL 列表
- **包名：** `geostore`
- **导入：** `url.proto`
- **消息：** `UrlListProto` — `url`（repeated UrlProto）；MessageSet 扩展位于 14251185
- **作用：** URL 的集合。

---

## 时区

### `base/proto/timezone.proto` — 时区
- **包名：** `geostore`
- **导入：** `fieldmetadata.proto`
- **消息：** `TimezoneProto` — `id`（string，例如 "America/New_York"）、`metadata`
- **作用：** 要素的 IANA 时区标识符。

---

## 字段元数据与选项

### `base/proto/fieldmetadata.proto` — 字段元数据
- **包名：** `geostore`
- **导入：** `internal/internalfieldmetadata.proto`
- **消息：** `FieldMetadataProto` — `internal`（InternalFieldMetadataProto）；字段选项扩展 `metadata_for_tag_id`（1331432）
- **作用：** 内部字段元数据的包装器；允许用元数据标签 ID 标注 proto 字段。

### `base/proto/fieldtype.proto` — 字段类型枚举
- **包名：** `geostore.fieldtype`
- **枚举：** `Type` 含 250+ 条目 — 系统中每个要素字段类型的全面枚举，用于属性识别和权限管理。包括 FEATURE_*、SEGMENT_*、PARKING_*、BORDER_*、BUILDING_*、LANE_MARKER_*、INTERSECTION_*、RESTRICTION_GROUP_*、ROAD_DISRUPTION_*、TRANSIT_*、EV_*、GEOPOLITICAL_*、DEPRECATED_* 条目。
- **作用：** 属性识别、字段级权限和编辑优先级的主字段类型注册表。
- **功能要点：** 250+ 种字段类型枚举；已弃用条目已标注；被 FeaturePropertyIdProto 使用。

### `base/proto/options.proto` — Proto 选项
- **包名：** `geostore`
- **导入：** `net/proto2/proto/descriptor.proto`
- **消息/扩展：** `FieldIdOptions` — `next_available_field_id`；`field_id_options` 扩展在 MessageOptions 上（38142873）
- **作用：** 用于字段 ID 管理的自定义 proto 选项。

### `base/proto/stable_field_path.proto` — 稳定字段路径
- **包名：** `geostore`
- **消息：** `StableFieldPathProto` 包含 `StableFieldSelector` — `field_num`（int32）、`version_token`（string）
- **作用：** 跨模式版本的稳定字段路径引用，用于来源追踪。

### `base/proto/stable_id_options.proto` — 稳定 ID 选项
- **包名：** `geostore`
- **扩展：** `stable_id`（bool）在 FieldOptions 上（535801262）
- **作用：** 标记跨模式版本具有稳定标识符的字段。

### `base/proto/version_token_options.proto` — 版本令牌选项
- **包名：** `geostore`
- **扩展：** `version_token`（bool）在 FieldOptions 上（433813166）
- **作用：** 标记参与版本令牌计算的字段。

---

## 内部消息

### `base/proto/internal/internalfeature.proto` — 内部要素数据
- **包名：** `geostore`
- **导入：** `rightsstatus.proto`、`trustsignals.proto`
- **消息：** `InternalFeatureProto` — `trust`（TrustSignalsProto）、`rights_status`（RightsStatusProto）、`polygon_shape_id`、`water_removed_polygon_shape_id`、`self_polygon_shape_id`、`rest_of_world_polygon_shape_id`
- **作用：** 仅供内部使用的要素字段：信任信号、权限和面形状存储引用。

### `base/proto/internal/internalfieldmetadata.proto` — 内部字段元数据
- **包名：** `geostore`
- **导入：** `internalsourcesummary.proto`
- **消息：** `InternalFieldMetadataProto` — `source_summary`（InternalSourceSummaryProto）、`is_auto`（bool）
- **作用：** 内部每个字段的元数据：来源摘要和自动标志。

### `base/proto/internal/internalsegment.proto` — 内部路段数据
- **包名：** `geostore`
- **导入：** `featureid.proto`、`restriction.proto`
- **消息：** `InternalSegmentProto` — `travel_allowance`（RestrictionProto 列表）、`disallowed_connections`（LaneConnectionReference：segment + from/to lane numbers/IDs）、`disallowed_primary_connection`
- **作用：** 内部车道级连通性限制：出行许可和被禁止的车道到车道连接。
- **功能要点：** 车道级禁止连接；主连接禁止。

### `base/proto/internal/internalsourcesummary.proto` — 内部来源摘要
- **包名：** `geostore`
- **导入：** `datasourceprovider.proto`
- **消息：** `InternalSourceSummaryProto` — `provider`（DataSourceProvider.Provider）、`dataset`（string）
- **作用：** 内部字段元数据的紧凑型提供者+数据集摘要。

### `base/proto/internal/rightsstatus.proto` — 权限状态
- **包名：** `geostore`
- **导入：** `rightslevel.proto`、`edit/feature_property_id.proto`
- **消息：** `FieldWithRightsProto` — `feature_property_id`、`min_rights_level`、`field_type`、`attribute_id`（已弃用）；`RightsStatusProto` — `field_with_rights`（repeated）
- **作用：** 每个字段的访问权限：哪些属性需要哪些最低权限级别。
- **功能要点：** 字段级权限粒度。

---

## 编辑子系统

### `edit/feature_property_id.proto` — 要素属性 ID
- **包名：** `geostore`
- **导入：** `base/proto/fieldtype.proto`
- **消息：** `FeaturePropertyIdProto` — `field_type`（fieldtype.Type）、oneof sub_field：attribute_id / attachment_type_id / kg_property_id / name_language；`FeaturePropertyIdList` — repeated FeaturePropertyIdProto
- **作用：** 标识要素中的特定属性，用于编辑操作、权限管理和属性值状态。
- **功能要点：** 多维度属性标识（属性、附件、KG、名称语言）。

---

## 匹配子系统

### `matching/public/feature_pattern.proto` — 要素模式匹配
- **包名：** `geostore`
- **导入：** `featureid.proto`、`featuremetadata.proto`、`fieldtype.proto`、`gconceptinstance.proto`、`property_value_status_enum.proto`、Freebase
- **消息：** 50+ 种模式类型 — 全面的要素匹配 DSL：
  - `FeaturePatternProto` — 布尔逻辑（AND/OR/NOT），含 30+ 种模式子类型：name、data_source、address、country_code、bound、rank、segment、geometry、feature_id、related_timezone、relation、border、source_info、telephone、reflection、access_point、transit_line、best_name、existence、gconcept、lint、building、route、level、claim、feature_metadata、kg_property、attachment、best_locale、property_value_status、regulated_area
  - 子模式：`AddressComponentPatternProto`、`AddressLinesPatternProto`、`AddressPatternProto`、`BorderPatternProto`、`BoundPatternProto`、`DataSourcePatternProto`、`FeatureIdPatternProto`、`GeometryPatternProto`（包含 containment/intersection caps）、`NamePatternProto`（regex、language、flags、stemming）、`RankPatternProto`、`SegmentPatternProto`（priority、usage、length、speed、surface、bicycle/pedestrian、toll）、`SourceInfoPatternProto`、`TelephonePatternProto`、`ReflectionPatternProto`、`ExistencePatternProto`、`AccessPointPatternProto`、`TransitLinePatternProto`、`GConceptPatternProto`、`LintPatternProto`、`BuildingPatternProto`、`RoutePatternProto`、`LevelPatternProto`、`AttachmentPatternProto`、`KGValuePatternProto`、`KGPropertyPatternProto`、`BestLocalePatternProto`、`FeaturePropertyIdPatternProto`、`PropertyValueStatusPatternProto`、`RegulatedAreaPatternProto`
- **作用：** 用于查询和转换要素的强大模式匹配语言。被编辑工具、lint 规则和数据处理管道使用。
- **功能要点：** 布尔表达式树（AND/OR/NOT）；通过 cap 原语的几何包含/相交；带正则表达式 + 词干提取 + 忽略变音符的名称匹配；基于反射的字段自省；用于组合的模式名称引用。

---

## 本体子系统

### `ontology/proto/rawgconceptinstance.proto` — 原始 GConcept 实例
- **包名：** `geostore.ontology`
- **导入：** `datasourceprovider.proto`、`gconceptinstance.proto`
- **消息：** `RawGConceptInstanceProto` — `instance`（GConceptInstanceProto）、`provider`（已弃用）、`source_dataset`（已弃用）、`is_inferred`（bool）、`is_added_by_edit`（已弃用）
- **作用：** 原始/未处理的知识图谱概念实例，带推理追踪。

### `ontology/proto/rawgconceptinstancecontainer.proto` — 原始 GConcept 容器
- **包名：** `geostore.ontology`
- **导入：** `rawgconceptinstance.proto`
- **消息：** `RawGConceptInstanceContainerProto` — `instance`（repeated RawGConceptInstanceProto）；MessageSet 扩展位于 20497290
- **作用：** 原始概念实例的批次容器。

---

## 客户端/附件子系统

### `client/attachments/attachment.proto` — 通用附件
- **包名：** `geostore.attachments`
- **导入：** `options.proto`
- **消息：** `AttachmentProto` — `messages`（MessageSet，lazy）、`type_id`（uint64）、`attachment_id`（uint64）、`client_name_space`（string）；`AttachmentListProto` — repeated AttachmentProto
- **作用：** 通用附件机制，通过类型化 MessageSet 载荷用客户端特定数据扩展要素。
- **功能要点：** 带客户端命名空间的类型化附件；延迟反序列化。

---

## 工具子系统

### `tools/public/annotations.proto` — 要素 ID 引用规则
- **包名：** `geostore`
- **导入：** `net/proto2/proto/descriptor.proto`
- **枚举/扩展：** `FeatureIdForwardingRule` — DO_NOT_FORWARD_REFERENCE / FORWARD_REFERENCE / FORWARD_REFERENCE_AND_DEDUP；`FeatureIdDanglingReferenceRule` — DO_NOT_DROP_REFERENCE / DELETE_REFERENCE / DELETE_PARENT_MESSAGE；field option 扩展位于 143183347 和 143183348
- **作用：** 声明工具在编辑过程中应如何处理 FeatureId 引用：转发链和悬空引用清理。
- **功能要点：** 引用转发规则；悬空引用解析策略。

---

## 跨领域关注点

### 通用导入
整个模式中最常被导入的文件：
- `google/api/inclusion.proto` — 几乎所有文件
- `storage/datapol/annotations/proto/semantic_annotations.proto` — 几乎所有文件
- `geostore/base/proto/options.proto` — 大多数文件
- `geostore/base/proto/featureid.proto` — 大多数要素类型文件
- `geostore/base/proto/fieldmetadata.proto` — 大多数值类型文件
- `net/proto2/bridge/proto/message_set.proto` — 可扩展消息
- `java/com/google/apps/jspb/jspb.proto` — Java protobuf 库
- `knowledge/graph/protomesh/protomesh.proto` — KG 集成

### Proto 语法版本
- **proto2**：~150 个文件（绝大多数）
- **editions**（基于 proto3）：~12 个文件（`ev_charger.proto`、`ev_station.proto`、`emobility_ids.proto`、`gelfs_ids.proto`、`landuse.proto`、`median.proto`、`traffic_flow_adjustment.proto`、`travel_mode.proto`、`travel_pattern.proto`、`toll_pass_type.proto`、`vehicle_emissions_category.proto`、`vehicle_occupancy_range.proto`、`api_inclusion_scopes_nonpublic.proto`）

### MessageSet 扩展
许多 proto 消息使用唯一的数字 ID 注册为 MessageSet 扩展，从而实现动态消息类型分派：
- FeatureIdProto：13258261 | AddressProto：12208774 | PointProto：14827556
- PolygonProto：5464057 | RectProto：26764887 | FeatureListProto：1244700
- FeatureIdListProto：16709385 | PriceRangeProto：15000834 | SourceInfoProto：18502900
- TrustSignalsProto：24882046 | UrlProto：23880165 | UrlListProto：14251185
- TimeScheduleProto：15256124 | DateTimeProto：15303159 | TelephoneProto：12773310
- OpeningHoursProto：98510069 | PriceInfoProto：49520153 | NameProto：308676116
- ExistenceProto：1321489 | KnowledgeGraphReferenceProto：157211294
- TransitEntranceAttachmentProto：122556540 | RawGConceptInstanceContainerProto：20497290

---

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                      FeatureProto                            │
│  （通用容器，包含 ~70 个类型化子消息字段）                     │
├─────────────────────────────────────────────────────────────┤
│  标识          │ FeatureIdProto（S2 细胞 + 指纹）             │
│  几何          │ Point、PolyLine、Polygon、Rect、Track、Pose  │
│  层次结构      │ child[]、parent[]、related_feature[]         │
│  生命周期      │ ExistenceProto、FeatureMetadataProto         │
│  溯源          │ SourceInfoProto、DataSourceProvider           │
├─────────────────────────────────────────────────────────────┤
│  ┌─道路─────────────────────────────────────────────────┐   │
│  │ SegmentProto → LaneProto → LaneMarkerProto            │   │
│  │ IntersectionProto → IntersectionGroupProto            │   │
│  │ RestrictionProto、SpeedLimitProto、RoadSignProto       │   │
│  │ PedestrianCrossingProto、RoadDisruptionProto           │   │
│  │ GradeLevelProto、SlopeProto、CurvatureProto            │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌─地点─────────────────────────────────────────────────┐   │
│  │ EstablishmentProto（400+ 类别）                        │   │
│  │ AddressProto → AddressComponentProto                  │   │
│  │ OpeningHoursProto、PriceInfoProto                      │   │
│  │ ParkingProto、ServiceAreaProto                         │   │
│  │ TelephoneProto、UrlProto                               │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌─公交─────────────────────────────────────────────────┐   │
│  │ TransitLineProto → TransitLineVariantProto            │   │
│  │ TransitStationProto                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌─边界/地缘政治───────────────────────────────────────┐   │
│  │ BorderProto、LogicalBorderProto                       │   │
│  │ GeopoliticalProto、PoliticalProto                      │   │
│  │ DisputedAreaProto                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌─3D/建筑──────────────────────────────────────────────┐   │
│  │ BuildingProto、LevelProto                             │   │
│  │ CityJsonProto、ThreeDimensionalModelProto              │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌─EV 充电──────────────────────────────────────────────┐   │
│  │ EvStationProto、EvChargerProto                         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌─其他─────────────────────────────────────────────────┐   │
│  │ SkiBoundary/Lift/Trail、LandUse、SchoolDistrict        │   │
│  │ AttributeProto、GConceptInstanceProto                  │   │
│  │ RankDetailsProto、TrustSignalsProto                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

这是 Google 的综合地理空间数据模型，涵盖道路（具有面向自动驾驶的 HD/车道级细节）、地点/POI（具有丰富的商业数据、菜单、定价）、公交、边界/地缘政治要素、建筑/3D 模型、EV 充电等。该模式支持版本管理、溯源追踪、权限管理、要素去重以及用于数据处理的强大模式匹配 DSL。
