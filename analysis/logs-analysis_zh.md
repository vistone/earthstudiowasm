# Logs Proto 分析 — 事件日志与分析 Schema 层

**分析的 proto 文件总数：** 182 个，涵盖 22 个子包。

---

## 目录结构概览

```
logs/
├── eventid/           (1 个文件) — 事件 ID 基础设施
├── gws/public/tags/   (1 个文件) — GWS 标签选项，用于 VE 日志记录
├── maps/              (2 个文件) — 特征 ID、VE 日志选项
└── proto/
    ├── ads/travel/          (2 个文件) — 酒店广告注解与定价
    ├── feature/             (2 个文件) — TreeRef 与偏移标识符
    ├── geo/
    │   ├── ar/              (2 个文件) — AR 位置与姿态
    │   ├── earth/app/       (9 个文件) — 主 Earth 事件日志 + 子事件
    │   └── transportation/  (2 个文件) — 行程日志与 affordance 向量
    ├── hotels/              (1 个文件) — 酒店特征数据
    ├── logs_annotations/    (1 个文件) — PII/标识符注解
    ├── maps/
    │   ├── directions/      (35 个文件) — 路线 MRP、定制化、copilot、收费
    │   ├── geoevents/       (1 个文件) — GeoEvents 字段注解
    │   ├── limo/proto/      (4 个文件) — 打车（Limo）日志
    │   ├── mobile/          (3 个文件) — 导航会话事件
    │   ├── pathfinder/      (21 个文件) — Pathfinder 客户端和服务端日志
    │   ├── roadtraffic/     (4 个文件) — 交通模型与道路通行性
    │   ├── shared/          (10 个文件) — 共享几何、出行意图、住宿
    │   ├── tactile/         (13 个文件) — 路线触控 UI 日志
    │   ├── transit/         (21 个文件) — 公交 API、票价、提醒、成本模型
    │   └── vms/             (3 个文件) — 车道元素、道路视图、传感器观测
    ├── searchbox/           (6 个文件) — 搜索框统计与操作
    └── visual_element/      (14 个文件) — 视觉元素点击追踪与 UI 日志
```

---

## 1. 核心基础设施

### 1.1 `logs/eventid/eventid.proto`
- **包名：** _(无)_
- **关键消息：**
  - `EventIdMessage` — `time_usec`、`server_ip`、`process_id`；扩展 proto2 MessageSet 以实现全局事件关联
  - `ClientEventIdMessage` — 包装 `EventIdMessage` + `client_counter`
- **用途：** 全局事件标识 —— 在整个 Google 日志生态系统中唯一标识每一条记录的事件
- **依赖项：** `jspb`、`message_set`、`semantic_annotations`

### 1.2 `logs/maps/featureid.proto`
- **包名：** `logs_maps`
- **关键消息：** `FeatureIdProto` — `cell_id`（fixed64）、`fprint`（fixed64）
- **用途：** 基于 S2 单元 + 指纹的地理空间实体特征标识符；几乎所有 maps/logging proto 均使用
- **依赖项：** `google/api/inclusion`、`jspb`、`semantic_annotations`

### 1.3 `logs/gws/public/tags/tag_options.proto`
- **包名：** `logs`
- **关键消息：** `TaggingFieldOptions` — `key_id`、`key`、`contact`、`values_file`、effects 枚举（EVE、IGSA_DASH、RANKING、AGSA_DASH、GEOEVENTS、SGSESSIONS）
- **用途：** 用于 VE（视觉元素）日志字段注解的 GWS 标签元数据

### 1.4 `maps/logs/logging/ve_logging_options.proto`
- **包名：** `ve_log`
- **关键扩展：** 在 FieldOptions/MessageOptions 上的 `msg`、`result`、`fld`、`only`、`ved`、`ei`、`href_attr`、`rewrite_attr`、`ve_whitelist`、`ignored`
- **用途：** VE（视觉元素）日志基础设施的注解

---

## 2. 主 Earth 事件日志（89 种事件类型）

### 2.1 `logs/proto/geo/earth/app/earth_log.proto` — **主文件**
- **包名：** `geo.earth.app`
- **关键消息：** `EarthEvent` 与 `Type` 枚举（L27-L1028，**89 个事件类型类别**，400+ 个离散值）

| 事件类别 | 范围 | 数量 | 覆盖内容 |
|---|---|---|---|
| 崩溃/加载/启动 | 0–107 | ~15 | Earth 崩溃、加载时间、内存、缓存、启动 |
| 知识卡片（KC） | 201–222 | ~20 | KC 打开/关闭/滑动/飞行/折叠/展开 |
| 搜索 | 301–325 | ~25 | 搜索打开、建议、结果、历史、语音、云端 |
| Earth Feed/Voyager | 401–418 | ~18 | Feed 网格、导览、气球、YouTube、面板 |
| 街景 | 501–518 | ~18 | Pegman、全景图捕捉/分享、时间线 |
| 地图样式 | 601–635 | ~30 | 3D 影像开关、云层、网格线、Timelapse |
| 导航/控件 | 701–764 | ~15 | 我的位置、罗盘、缩放、导航地球、Pegman |
| 时间控件 | 801–803 | 3 | 时间控件播放/暂停/滑块 |
| 照片图层 | 900–903 | 4 | 照片图层开/关/缩略图 |
| 通用操作 | 1001–1028 | ~25 | 图像保存、分享、深度链接、截图、粘贴 |
| 开箱体验 | 1100–1104 | 5 | 开箱体验流程 |
| 测量工具 | 1110–1131 | ~25 | 距离、面积、坡度、单位、保存到项目 |
| Lightbox | 1200–1208 | 7 | 媒体 Lightbox 打开/关闭/图库 |
| 历史影像 | 1250–1259 | 10 | HI 模式进入/退出、日期选择、前进/后退 |
| Timelapse | 1275–1283 | 9 | Timelapse 模式、暂停/播放、速度、切换到 HI |
| 我的地点 | 1300–1320 | ~15 | 我的地点打开/关闭/从 Drive/KML 导入 |
| 播放模式 | 1350–1362 | ~13 | 播放模式开始/退出/TOC/分享/选择 |
| 通知 | 1400–1405 | 6 | 通知注册、主题、前台接收 |
| 工具栏与快捷键 | 1600–1621 | ~22 | 工具栏操作、快捷键 |
| 导航菜单 | 1700–1720 | ~22 | 导航菜单项（搜索、探索、我的地点等） |
| 原生库 | 1800–1802 | 3 | 原生库加载事件 |
| 项目视图 | 2000–2016 | ~15 | 云端/本地项目创建、导入 KML、CSV |
| 文档操作 | 2100–2232 | ~30 | 文档操作、删除、导出、添加要素、编辑 |
| 内容创作 | 2300–2506 | ~20 | CC 工具栏、绘制线条、添加地标 |
| 保存到项目 | 2600–2608 | 9 | 保存到项目流程 |
| 要素预览/气球 | 2800–3052 | ~20 | 要素卡片、气球、属性编辑器 |
| 属性编辑器 | 3100–3173 | ~60 | PE 标题、描述、样式、照片、3D 模型变换 |
| 图标/颜色选择器 | 3500–3801 | ~12 | 图标选择器、链接对话框、地图移动、颜色选择器 |
| 快速分享 | 3900–3903 | 4 | 复制、Facebook、Twitter 分享 |
| 绘图工具 | 4000–4003 | 4 | 绘制面积/距离 |
| 文档导入/导出 | 4050–4074 | ~25 | KML/云导入/导出、样式复制/粘贴 |
| 主屏幕 | 4100–4158 | ~50 | 主屏幕显示/关闭/创建/打开/排序/筛选 |
| 要素信息 | 5000–5505 | ~10 | 媒体更新、要素信息复制/选择/高程 |
| 帧率与启动 | 6000–6057 | ~14 | 帧率分桶、启动时间分桶 |
| WebGL | 6500–6502 | 3 | WebGL 支持检测 |
| 项目列表 | 7000–7009 | 10 | 项目列表排序（Drive/KML） |
| Earth Mate（AI） | 8000–8042 | ~40 | Earth Mate 打开/提交/OIS/缩略图/生成图层 |
| 行业选择器 | 9000–9010 | 10 | 行业选择器调查流程与地图用例 |
| 计费 | 10000–10029 | ~30 | 计费计划、价格卡、升级对话框、付费门 |
| 图层/数据目录 | 11000–11042 | ~35 | 图层显示/选择/筛选/样式/删除/搜索 |
| 撤销/重做 | 12000–12501 | 4 | 全局撤销/重做 |
| 请求访问 | 13000–13003 | 4 | 访问请求流程 |
| 区域筛选 | 14000–14004 | 5 | 区域筛选面板打开/关闭/应用 |
| 图像生成器 | 15000–15014 | ~15 | AI 图像生成流程 |
| 用户导入 | 16000–16010 | ~10 | 文件导入、3D 模型加载 |
| 按需分析 | 17000–17063 | ~60 | 等高线/坡度/坡向/填挖方分析工具 |
| KML 编辑器 | 18000–18002 | 3 | KML 编辑器对话框 |
| AI 分类 | 18200–18205 | 6 | AI 分类 |
| 飞行模拟器 | 19000–19002 | 3 | 飞行模拟器启动/停止/崩溃 |
| 复制项目 | 19100–19109 | 10 | 复制项目/mymaps 到项目 |
| 变化检测 | 19200–19204 | 5 | 变化检测创建/成功/失败 |
| 影像更新 | 19300–19303 | 4 | 影像更新请求 |

- **含丰富数据的子消息：**
  - `EarthCrashData` — `state_url`、`graphics_vendor/renderer`、`ErrorInfo`（name、msg、stack_trace）
  - `EarthLoadData` — `load_time`、`startup_time`
  - `MeasureToolEvent` — `distance`、`area`、`vertex_count`、`contains_stylus_points`
  - `MeasureToolDistanceUnitChangeEvent` — 11 种距离单位（cm、m、km、inches、feet、yards、miles、nautical_miles、smoots、auto、pool_length）
  - `MeasureToolAreaUnitChangeEvent` — 10 种面积单位
  - `SuggestionEvent` — `query`、`guid`、`voyager_shown`、`suggested_query`
  - `NotificationEvent` — `Topic`（VOYAGER、POI）
  - `AccessibilityEvent` — `talk_back`、`system_font_size`、`color_correction`
  - `IosSizeEvent` — 宽/高 `SizeClass`（COMPACT、REGULAR）
  - `SearchSuggestResultGroupEvent` — `result_group_id`、`query`、`suggested_query`
  - `ImportToCloudEvent` — `Result`（FAILURE/SUCCESS），详细的 `MessageType` 错误（26 种类型，涵盖 KML 解析、不支持的功能、损坏的 URL）
  - `ConfigRequestEvent` — 完整的 gRPC `StatusCode` 枚举、`auto_retries`、`is_manual_retry`、`cached`
  - `NetworkRequestEvent` — 15 种请求类型（config、experiments、search、photos、voyager 等）+ `http_response_code`
  - `EarthMateRequestEvent` — `submit_to_response_time_seconds`、`is_googler`
  - `EarthMateEvent` — `is_googler`、`edc_access`、`gemini_vector_layers_enabled`、图层数量
  - `LayerStyleUpdate` — 要素类型（polygon/point/line/label）× 属性（stroke_color、fill_color、opacity、scale、visibility、categorical/interpolated ramp）
  - `FeatureInfoCopiedEvent` — 28 种已知条目类型（latitude、longitude、altitude、length、perimeter、area、plus_code、elevation 等）
  - `FeatureSelectedEvent` — 21 种要素类型（folder、view、point、path、polygon、3d_model 等）
  - `PropertyEditorEvent` — 文档类型 + 要素数量
  - `AreaFilterDetails` — 图层 ID、源视图、区域来源（draw/select）、选择类型（intersects/contains）
  - `UserImportDetails` — 文件大小、输出类型（data_layer/map_features/3d_model）、导入来源（Drive/local/paste）、MIME 类型、LRO 状态、配额、完成状态
  - `SelectedLayerDetails` — `layer_logging_id`、`LayerResolveError`（unsupported/insufficient_entitlements）、`SourceView`、`FeatureOrigin`（user/gemini）、`search_semantic_distance`、`opened_via_deeplink`
  - `SearchDataCatalogDetails` — `search_query_count`、`ResultLayerDetails`（图层 ID + semantic distance）
  - `BillingPlanChangedEvent` — 之前/之后计划类型
  - `PaygateCardDetails` — 14 种付费门要素类型
  - `ElevationContourLroEvent` / `CutAndFillLroEvent` — 并发 LRO 运行数
- **顶层枚举：**
  - `BillingUpgradeDialogSourceView` — 24 个源视图起点
  - `PaygateFeatureType` — 14 种要素类型
  - `DataCatalogDialogSourceView` — 8 个源视图
  - `ExplorePromotionDialogVariant` — 3 种变体（no_gif/small_gif/regular_gif）
- **依赖项：** 8 个子事件 proto（deeplink、earthfeed、experiment_flags、mirthstats、nativelibraryload、settings、startupfinished、usersettings）+ privacy + datapol

### 2.2 子事件 Proto（geo/earth/app/）

#### `deeplink_event.proto`
- **包名：** `geo.earth.app`
- **消息：** `DeeplinkEvent` — `path`、`utm_source`、`utm_campaign`、`utm_term`
- **用途：** 追踪深度链接 URL 路径和 UTM 营销活动参数

#### `earthfeed_event.proto`
- **包名：** `geo.earth.app`
- **消息：** `EarthFeedEvent` — `item_guid`、`feature_id`、`item_index`、`display_type`、`link_href`
- **用途：** Voyager/Earth Feed 条目交互

#### `experiment_flags.proto`
- **包名：** `geo.earth.app`
- **消息：** `ExperimentFlags` → 重复 `ExperimentFlag`（name + bool value）
- **关键枚举：** ~234 个 `FlagName` 值，涵盖 Google Earth 中每个功能开关（从 PHOTOS_LAYER_ENABLED 到 EARTH_MATE_PERSISTENT_VISION_CONTEXT_ENABLED）
- **用途：** 实验/功能开关门控，用于 A/B 测试和逐步发布

#### `earth_client_interaction_metadata.proto`
- **包名：** `logs.proto.geo.earth.app`
- **消息：**
  - `EarthClientInteractionMetadata` — `EarthMateMetadata`（点赞/点踩评分）、`RateCardDialogMetadata`（升/降级点击类型）
  - `ThumbsUpDownRating` 枚举（THUMB_UP、THUMB_DOWN）
  - `RatecardClickthroughType` 枚举（UPGRADE_PROF、UPGRADE_PROF_ADV、DOWNGRADE_STANDARD、DOWNGRADE_PROF）
- **用途：** 用 Earth 特定的交互元数据扩展 `ClientInteractionMetadata`

#### `mirthstats_event.proto`
- **包名：** `geo.earth.app`
- **消息：** `MirthStatsEvent` — 子消息：`GraphicsInfo`（vendor、renderer）、`RenderingStats`（average_fps、jank30/60 帧数和百分比、视频播放/瓦片统计）、`MemoryStats`（total_allocator_memory、gpu_memory）、`KmlStats`（29 种 KML 元素类型计数）
- **用途：** 性能遥测（FPS、内存、KML 复杂度）

#### `nativelibraryload_event.proto`
- **包名：** `geo.earth.app`
- **消息：** `NativeLibraryLoad` — `source_dir`、`source_name`、`target_file`
- **用途：** 追踪原生库加载（用于 WASM/Emscripten 构建）

#### `settings_event.proto`
- **包名：** `geo.earth.app`
- **消息：** `SettingsEvent` — `flight_animation_enabled`、`FlightAnimationSpeed`（SLOWEST→FASTEST）、`FlyEndAnimation`（STATIC/ORBITAL/CINEMATIC）、`MeasurementUnit`、`LatLonFormatting`（DEG_MIN_SEC/DECIMAL/DEG_MIN）、`QualitySettings`（FASTEST→HIGHEST）、通知开关、`DarkModeState`（LIGHT/DARK/SYSTEM）、`LoadingDestination`（HOMESCREEN/EXPLORE）
- **用途：** 事件发生时的用户设置状态

#### `startupfinished_event.proto`
- **包名：** `geo.earth.app`
- **消息：** `StartupFinishedEvent` — 通知状态、animated_clouds、gridlines、3d_imagery、photos_layer、dark_mode_state、`default_config_used`
- **用途：** 捕获启动完成时的应用状态

#### `usersettings_event.proto`
- **包名：** `geo.earth.app`
- **消息：** `IndustrySelectorResponseEvent` — `EarthUserPrimaryUse`（7 个值：WORK、LEISURE、PUBLIC_SECTOR、ACADEMIC 等）、`EarthUserIndustry`（62 个行业值）、`EarthUserGeographicScale`（6 个值：LOCAL→GLOBAL）、`EarthUserMAPUseCase`（78 个地图用例，涵盖甲烷减排、太阳能光伏、风力发电、野火检测、碳市场等）
- **用途：** 用户行业/用例画像，用于产品个性化

---

## 3. 视觉元素日志（14 个文件）

### 3.1 `logs/proto/visual_element/visual_element_lite.proto`
- **包名：** `logs`
- **关键消息：**
  - `VisualElementLiteProto` — 核心 VE 日志 proto，包含 `ui_type`、`element_index`、`contains_elements`、`target_url`、`result_index`、`feature_tree_ref`、`Visibility` 枚举（VISIBLE/HIDDEN/REPRESSED_COUNTERFACTUAL/CHILDREN_HIDDEN/REPRESSED_PRIVACY）、`language`、`do_not_log_urls`、`ad_impression_index`、`DataElement`；约 350+ 个扩展字段
  - `ClientRequestContext` — `click_tracking_cgi`、`ved`、`ui_type`、`ve_index`、`primary_user_action`、`cardinal_direction`、`toggle_state`、`interaction_context`、`result_index`、`element_index`、`image_url_referrer`、`thumbnail_id`、`referrer_id`、`ancestry[]`、`client_interaction_metadata`
- **用途：** 横跨 Google Maps/Earth UI 界面的视觉元素（VE）点击追踪的中心 proto
- **依赖项：** tree_ref、click_tracking_cgi、client_interaction_metadata、data_element、tag_options

### 3.2 `logs/proto/visual_element/click_tracking_cgi.proto`
- **包名：** `logs`
- **关键消息：** `ClickTrackingCGI` — `ve_index`、`ve_type`、`element_index`、`result_index`、`page_start`、`do_not_log_url`、`result_fprint`、`ve_event_id`（ClientEventIdMessage）、`youtube_ve_counter/identifier`
- **用途：** CGI 级别的点击追踪元数据；扩展 proto2 MessageSet

### 3.3 `logs/proto/visual_element/client_interaction_metadata.proto`
- **包名：** `logs`
- **消息：** `ClientInteractionMetadata` — 扩展容器（扩展 100-375），用于可插拔的元数据
- **用途：** 用于客户端特定交互元数据的通用扩展点（由 EarthClientInteractionMetadata 扩展）

### 3.4 `logs/proto/visual_element/data_element.proto`
- **包名：** `logs`
- **消息：** `DataElement` — `reference`（VisualElementTreeRef）
- **用途：** 引用 VE 树内的结构化数据

### 3.5 `logs/proto/visual_element/graft.proto`
- **包名：** `logs`
- **关键消息：**
  - `VisualElementGrafts` — 重复 `VisualElementGraft`
  - `VisualElementGraft` — `target`（TreeRef）、`GraftType`（SHOW/HIDE/INSERT/COPY）、`clone_tree`、`source_tree`、`graft_time_usec`、`dedupe`
  - `VisualElementTreeRef` — oneof `events`（EventIdMessage/ClientEventIdMessage/ei）+ oneof `root`（ClickTrackingCGI/ved）
- **用途：** 追踪 VE 树修改（show/hide/insert/copy），用于 UI 状态重建
- **依赖项：** eventid、logs_annotations、click_tracking_cgi

### 3.6 `logs/proto/visual_element/ui_state_enum.proto`
- **包名：** `logs`
- **枚举：** `UIState.ToggleState` — TOGGLE_UNDEFINED/TOGGLE_ON/TOGGLE_OFF
- **用途：** 简单的 UI 开关状态枚举

### 3.7 `logs/proto/visual_element/user_action_enum.proto`
- **包名：** `logs`
- **枚举：**
  - `UserAction` — 55 个值：UNASSIGNED、AUTOMATED、USER、GENERIC_CLICK、TAP、KEYBOARD_ENTER、MOUSE_CLICK、LEFT_CLICK、RIGHT_CLICK、HOVER、PINCH、INPUT_TEXT、INPUT_VOICE、SWIPE、SCROLL_BAR、MOUSE_WHEEL、ARROW_KEYS、NAVIGATE、BACK_BUTTON、SHAKE、DRAG、LONG_PRESS、DOUBLE_CLICK、DOUBLE_TAP、FORCE_TOUCH、TWO_FINGER_DRAG、INPUT_STYLUS、DRAW_CIRCLE、DRAW_STRIKETHROUGH、SNAP 等
  - `CardinalDirection` — LEFT/RIGHT/UP/DOWN
- **用途：** 标准化的用户交互分类法

### 3.8 `logs/proto/visual_element/logged_place.proto`
- **包名：** `logs`
- **消息：**
  - `LoggedPlace` — `feature_id`（FeatureIdProto）、`feature_id_scrubbed`、`latitude_e6`、`longitude_e6`、`LoggingContext`（VISITED/NOT_VISITED）
  - `LoggedUserPlace` — 扩展了 `child_visit`、`indoor_visit`、`calibrated_probability`
- **用途：** 地点级别的日志记录，包含特征 ID 和位置

### 3.9 `logs/proto/visual_element/element_value_data.proto`
- **包名：** `logs`
- **消息：** `ElementValueData` — 简单的 `value` 字符串
- **用途：** 通用值容器，用于 VE 数据

### 3.10 `logs/proto/visual_element/crisis_info.proto`
- **包名：** `logs`
- **消息：** `CrisisInfo` — `crisis_id`、`CrisisUserMode`、`AlertSeverityLevel`、`CrisisCategory`、`EventType`、`attribution`、`AlertSourceType`（SOS_ALERT/PUBLIC_ALERT）
- **用途：** 危机/SOS 警报数据，用于视觉元素
- **依赖项：** crisisresponse、crisis proto、tactile crisis-user-mode

### 3.11 `logs/proto/visual_element/place_list_data.proto`
- **包名：** `logs`
- **消息：** `PlaceListData` — `list_id`、`PlaceListType`、`SharingState`、归属/关注标志、`UserAddedItemInfo`、`PublishInfo`（source）、`ListEntrypointInfo`（entrypoint）、`JustificationType`、协作者标志
- **用途：** 用户创建的地点列表元数据，用于 VE 日志

### 3.12 `logs/proto/visual_element/place_comparison_data.proto`
- **包名：** `logs`
- **消息：** `PlaceComparisonData` — `total_comparison_attribute_count`、`missing_comparison_attribute_count`
- **用途：** 地点比较功能数据

### 3.13 `logs/proto/visual_element/hotel_booking_partner_data.proto`
- **包名：** `logs`
- **消息：** `HotelBookingPartnerData` — `google_hotel_id`、`place_mid`、`LodgingType`、`partner_id`、`partner_hotel_id`、广告/自然供应商标志、入住日期、住宿时长、提前预订窗口、入住人数（成人/儿童）、`price_per_night`、`taxes_and_fees_per_night`、`conversion_rate_to_usd`、抓取/自有标志、`url`、`Refinements`
- **用途：** 酒店预订合作伙伴的展示/点击数据

### 3.14 `logs/proto/visual_element/disruptions-impression-data.proto`
- **包名：** `logs`
- **消息：** `DisruptionsImpressionData` — `DisruptionsSurface`（DIRECTIONS/NAVIGATION）、`IncidentType`
- **用途：** 路线/导航 UI 中展示的交通中断信息

### 3.15 `logs/proto/visual_element/visual_element_offset_identifier.proto`
- **包名：** `logs`
- **消息：** `VeOffsetIdentifier` — 重复 `base` int32 + `offset`
- **用途：** 基于偏移的 VE 标识方案

---

## 4. 酒店与广告日志

### 4.1 `logs/proto/hotels/hotels_feature_data.proto`
- **包名：** `logs.proto.hotels`
- **关键消息（共 21 个）：**
  - `EntityKey` — `mid`、`FeatureIdProto`、`hotel_id`、`EntityType`
  - `LoggedHotelSummaryData` — entity_key、`vacation_rental_partner_id`、`primary_concept`、图片键
  - `LoggedHotelHighlightData` — `HighlightType`
  - `LoggedHotelNotableGroupData` — `notable_count`
  - `LoggedHotelNotableData` — 类别、情感类型、链接目标
  - `LoggedHotelAmenityWebSnippetsData` — 设施类型
  - `LoggedPartnerRoomsDataProviderData` — partner_id、hotel_id、available_rooms_count
  - `LoggedRoomSummaryOptionData` — room_id、num_rates、max_occupancy、num_photos、lowest_price
  - `LoggedRoomRateData` — partner_id、room_id、price
  - `LoggedHotelPlaceDetailsData` — partner_id、is_supplier、is_crawled、url
  - `LoggedHotelWithoutPriceData` — 与地点详情相同
  - `LoggedHotelPriceData` — currency、price_per_night、taxes_and_fees、展示设置（WITH/WITHOUT_FEES_AND_TAXES）、conversion_rate、is_deal、partner_id、is_composed、booking_window_days、base_price_offender 标志、query/event ID、价格准确度、organic pctr、organic quality score
  - `LoggedHotelSearchData` — `Itinerary`（check_in_date、length_of_stay）、入住人数、`Refinements`（24 个筛选类别，包括 alternative lodging、min_rating、chains、accommodation_type、sort_order、neighborhoods、star_class、refundable_only、eco_certified、amenities、beds、room_styles、smoking、meal_plans、early/late check）、`LocationData`、`PriceRange`、EV interest counts、`PreviousTriggerDecision`
  - `LoggedAlternativeHotelsData` — 相似/热门替代酒店
  - `LodgingBrowsyAtomicPacksExtension` — browsy_unit_index、semantic_set_type
  - `HotelLevelBackendData` — hotel_id
  - `PartnerLevelBackendData` — partner_id、total_price、taxes_and_fees、fees、currency、display_result_info、granular_price_accuracy_score、pctr
- **用途：** 全面的酒店搜索、定价、房间、合作伙伴和筛选条件日志
- **依赖项：** 15+ 个导入项，跨越 ads/travel、geo/search、travel/frontend

### 4.2 `logs/proto/ads/travel/hotel_annotation.proto`
- **包名：** `ads_travel`
- **消息：**
  - `HotelAnnotation` — `AnnotationType`，oneof params：`AmenitiesParams`（排名设施）、`DealParams`（deal magnitude）、`DistanceToPoiParams`（distance_in_meters）
- **用途：** 酒店广告注解排名信号

### 4.3 `logs/proto/ads/travel/hotel_price_details.proto`
- **包名：** `ads_travel`
- **消息：**
  - `HotelPriceDetails` — partner_name、price、taxes、currency、conversion_rate_to_usd、partner_hotel_id、partner_room_id、is_owner、pos_name、pos_booking_phone_number、discount_percentage、rate_rule_id、`HotelAnnotationsData`（排名注解）、`HotelImageKey`（frontend type + photo_id）
- **用途：** 酒店定价详情，用于广告展示

---

## 5. 交通日志

### 5.1 `logs/proto/geo/transportation/analytics/triplogs/common.proto`
- **包名：** `logs.geo_transportation_analytics.triplogs`
- **关键消息：**
  - `User` — oneof 标识符：zwieback_cookie/uid 或 pseudonym_id
  - `Location` — LatLng + FeatureIdProto
  - `TimestampedLocation` — Location + timestamp_ms
  - `DestinationLocation` — Location + place_id + point_source
  - `ClientStats` — projected_fraction
  - `Software` — platform、application_name、referrer_id、auto_platform（NONE/CARGO/CARPLAY/EMBEDDED）、software_version、nav_sdk_version、cabrio_sdk_version、device_platform_type
  - `WaypointPredictions` — pre/post_dispatch_eta_duration_ms、pre/post_dispatch_predicted_distance_meters
  - `WaypointActivityMeasures` — 路径点 start/end/complete、destination、predictions、activity duration/distance
- **关键枚举：**
  - `DestinationPointSource` — DEVELOPER_PROVIDED/CALCULATED_FROM_PLACE
  - `DataSource` — NAV_LOGS/FLEET_ENGINE/LMFS_PROCESSED_LOGS
  - `AutoPlatform`、`DevicePlatformType`（ANDROID/IOS）
  - `LrdPartner` — 20 个出行/配送合作伙伴（LYFT、GOJEK、UBER、DIDI、OLA、FREE_NOW、DOORDASH、GETT、DHL、CABIFY、BLABLACAR、CAREEM、GRAB_TAXI、BEAT 等）
  - `LrdVertical` — RIDES/DELIVERY/PARCEL_DELIVERY
  - `TripsPoweredLevel` — L1/L2A/L2B
- **用途：** 交通（导航 + 打车出行）的行程日志分析通用类型
- **依赖项：** google/type/latlng、featureid

### 5.2 `logs/proto/geo/transportation/locationsignals/affordance_vector.proto`
- **包名：** `logs.proto.geo.transportation.locationsignals`
- **消息：**
  - `LoggedAffordanceProto` — `affordance_class`
  - `LoggedAffordanceVectorProto` — 重复 affordances
- **用途：** 用于基于位置的路由信号的 affordance 向量（例如卡车/非卡车路线）

---

## 6. MAPS TACTILE：路线 UI 日志（13 个文件）

### 6.1 `logs/proto/maps/tactile/directions.proto`
- **包名：** `logs_tactile`
- **关键消息：**
  - `LoggedDirectionsRequest` — 路径点查询、travel_mode、input_camera、trip_index、detail_level、`DirectionsOptions`（公交/驾车/共享单车/出租车/航班选项、traffic、time anchoring、lane guidance、trip groups）、distance_units、via_points、update_route_params、searchbox_stats、client_stats
  - `TravelModeOptions` — preferred_travel_mode、filtering（BLENDED）、enable_fly/taxi/two_wheeler/bikesharing
  - `DrivingOptions` — avoid_highways、avoid_tolls、traffic_routing_strategy、`TrafficReportOptions`（visual/enabled）、prefer_truck_routes、`VehicleTypeOptions`（engine_type）
  - `TransitOptions` — vehicle preferences、multimodal options（car_and_transit、rickshaw_and_transit、two_wheeler_and_transit、ridesharing_and_transit、bicycle_and_transit）、scoring_preference
  - `BikesharingOptions` — dockless/docked
  - `TaxiOptions` — regular_ridesharing、long_distance_ridesharing、offline_auto_rickshaw
- **用途：** 触控 UI 路线的完整路线请求日志
- **依赖项：** 8 个导入项，来自 maps/tactile、geo/serving、shared/directions

### 6.2 `logs/proto/maps/tactile/annotations.proto`
- **包名：** `logs_tactile`
- **扩展：** `feature_id` 和 `convertable` 字段选项扩展
- **用途：** Tactile 特定的字段注解扩展

### 6.3 `logs/proto/maps/tactile/directions-common.proto`
- **包名：** `logs_tactile`
- **消息：**
  - `LoggedSpotlightOptions` — rendering_detail_level、suppress_alternates、show_only_waypoints_vias、suppressed_waypoint/via_index、show_step_inspection_arrows
  - `LoggedTripUpdateInput` — distance_from_start_meters
  - `LoggedCompactPolyline` — 差分 lat/lng 编码（latitude_e7_diff、longitude_e7_diff）
- **用途：** 通用路线类型：聚焦视图选项、行程更新输入、紧凑折线编码

### 6.4 `logs/proto/maps/tactile/geometry.proto`
- **包名：** `logs_tactile`
- **消息：** `LatLng`（带 redacted 标志）、`LatLngRectangle`、`LoggedRasterPoint`（x/y）、`LoggedRasterRectangle`
- **用途：** Tactile 日志的几何基元

### 6.5 `logs/proto/maps/tactile/ad-ref.proto`
- **包名：** `logs_tactile`
- **消息：** `LoggedAdRef` — ads_response_id、text_ad_index、text_ad_location_index、ad_type
- **用途：** Tactile UI 中的广告引用追踪

### 6.6 `logs/proto/maps/tactile/offers.proto`
- **包名：** `logs_tactile`
- **消息：** `OfferData` — id、source、is_promoted
- **用途：** 地图注解的优惠/交易日志

### 6.7 `logs/proto/maps/tactile/on-map-impression.proto`
- **包名：** `logs_tactile`
- **消息：** `OnMapImpression` — appearance types、personal_appearance、image_key、ad_ref、visibility、visibility_reason、incident_provider、offer_data、haptic_place_list_source、personal_feature_provider、model_id、`AnnotationImpressionData`、establishment_type_id、gas_price（Money）、rating、label_content、rendering_category_id、element_value_data、place_list_data、disruptions_impression_data
- **用途：** 全面的地图上视觉展示日志（用户在地图上看到的内容）
- **依赖项：** 14 个导入项，来自 tactile、geoevents、visual_element、photos

### 6.8 `logs/proto/maps/tactile/directions-client-stats.proto`
- **包名：** `logs_tactile`
- **消息：** `LoggedDirectionsClientStats` — directions_client、directions_context
- **用途：** 客户端路线统计

### 6.9 `logs/proto/maps/tactile/annotation-data.proto`
- **包名：** `logs_tactile`
- **消息：**
  - `AnnotationImpressionData` — use_case、discovery_type、personal_use_case、relative_boost、personal_relative_boost、`AnnotationAttribute`（namespace_id、attribute_id）、`BusynessStatus`（7 个级别：WAY_MORE_PEOPLE_THAN_USUAL → NOT_BUSY）、`DealSubtitleType`、`DealType`（GOOGLE_PAY/PARTNER_PROVIDED/LOCAL_POST/EXTRACTED）
  - `AnnotationData` — logging_ve_ui_type、annotation_impression_data、`ApplicationTarget`（PRIMARY_LABEL_GROUP/SECONDARY_LABEL_GROUP）
- **用途：** 地图注解展示数据（繁忙度、交易、用例）

### 6.10 `logs/proto/maps/tactile/label-content.proto`
- **包名：** `logs_tactile`
- **消息：** `LoggedLabelContent` — `LabelContentType`、`LabelContentLocation`
- **用途：** 地图标签内容/位置日志

### 6.11 `logs/proto/maps/tactile/recommended-filtering-results.proto`
- **包名：** `logs_tactile`
- **消息：** `LoggedRecommendedFilteringResults` — `TripGroupingRecommendation` 含 oneof：`TripComparisonGrouping`（comparison_groups）/ `TravelModeCentricGrouping`（primary_travel_mode、requested_mode_shift_was_ineligible）、`TripGroup`（trip_references、grouping_reason、ranking_reason、group_travel_mode、`ModeNudge`）、`TripPreviewRecommendation`
- **用途：** 路线推荐筛选/行程分组分析

### 6.12 `logs/proto/maps/tactile/directions-counterfactual-recommended-filtering-results.proto`
- **包名：** `logs_tactile`
- **消息：** `DirectionsCounterfactualRecommendedFilteringResults` — counterfactual_id + LoggedRecommendedFilteringResults
- **用途：** 筛选结果的反事实 A/B 测试

### 6.13 `logs/proto/maps/tactile/directions-counterfactual-trip-ranking.proto`
- **包名：** `logs_tactile`
- **消息：** `DirectionsCounterfactualTripRanking` — counterfactual_id + trip_indexes
- **用途：** 行程排名的反事实 A/B 测试

---

## 7. MAPS PATHFINDER：路线客户端日志（21 个文件）

### 7.1 `logs/proto/maps/pathfinder/client/find-path-input.proto`
- **包名：** `logs.proto.maps.pathfinder.client`
- **关键消息：** `LoggedFindPathInput` — 综合路由请求参数：
  - 路径点及配对策略（IN_ORDER/OPTIMIZE_ORDER/MANY_TO_MANY）
  - `CostModelOptions`、locale、language、country、distance units（KM/MILES）
  - 文本输出类型（XML/HTML/PLAIN/NONE）、verbosity（PRINTED/TURN_BY_TURN）
  - 折线选项、alternates、max_trips、lane guidance、step groups、reference trip
  - `MetricsOnlyMode`（5 种模式：METRICS_AND_DETAILS → INFERRED_NO_POLYLINE）
  - `TollOptions`（pricing_factors、client_id originator）
  - `DynamicClosure`（feature_ids）、`OnDemandTransportationOptions`
  - `TaxiOptions`、`BikesharingOptions`
  - `AssistedDrivingOptions`（want_assisted_driving_path_info）
  - `RoadsideFacilityOptions`、`SustainabilityOptions`（label_least_fuel_consumption_trip）
  - `CustomizationInputs`、`RequeryInput`、`TrafficReportOptions`、experiments、logging_context
- **用途：** 用于分析日志记录的完整路由请求输入
- **依赖项：** 10 个导入项，跨越 pathfinder、tolls、autonomous、traffic

### 7.2 `logs/proto/maps/pathfinder/client/trip.proto`
- **包名：** `logs.proto.maps.pathfinder.client`
- **关键消息：**
  - `LoggedTrip` — paths、cost_model_options、timing_summary、transit_connection、dynamic_closure info、MRP selector info、trip_id、cycling_summary、elevation_profile、polyline_decorations、summary_decorations
  - `LoggedPath` — labels_compared_to_tripset、summary_decorations
  - `LoggedPathLabel` — Type 枚举（TOLLS_YES/NO、TRAFFIC_CONGESTION_MORE/LESS/EVEN_MORE/EVEN_LESS/SIMILAR、LESS_FUEL_CONSUMPTION、FASTEST、MORE_BIKE_LANES、LESS_HIGHWAYS、LESS_STEEP_HILLS、LESS_TURNS、BEST）、text、needs_icon
  - `LoggedPolylineDecoration` — identifier（config + decoration_id）、location（offset + length）、metadata（int/double value）
  - `LoggedTimingSummary` — departure_time、arrival_time、duration_seconds、optimistic/expected durations、realtime_duration、distance
- **用途：** 来自 pathfinder 的日志记录行程结果

### 7.3 `logs/proto/maps/pathfinder/client/waypoint.proto`
- **包名：** `logs.proto.maps.pathfinder.client`
- **关键消息：**
  - `LoggedWaypoint` — locations、is_via、feature_type、country_code、snapping_type（NORMAL/TRANSIT_STATION/PARKING_FACILITY）、entity_type（MY_LOCATION/HOME/WORK/AD/NICKNAME/CONTACT）
  - `LoggedLocation` — segment location（segment_id、interpolation_fraction、node_id、penalty）、point、snap_zoom_level、building_level、heading、access_point、boarded_transit_vehicle、side_of_road_preference、location filters（ELEVATED/FERRY/LIMITED_ACCESS/UNDERGROUND/ALLOW_HOV）
- **用途：** 路由的路径点和位置表示

### 7.4 `logs/proto/maps/pathfinder/client/logging-context.proto`
- **包名：** `logs.proto.maps.pathfinder.client`
- **消息：**
  - `LoggedLoggingContext` — extended_session_id、session_id、software/client_version、platform_id、application_name、referrer_name、experiment_ids、trip/traffic version、project_number、third_party flag、logging_enabled、request_source、replay_metadata、customization_id
  - `LoggedResponseLoggingContext` — extended_session_id、request_id
- **用途：** Pathfinder 日志的会话和请求上下文

### 7.5 `logs/proto/maps/pathfinder/client/customization_inputs.proto`
- **包名：** `logs.proto.maps.pathfinder.client`
- **消息：** `LoggedCustomizationInputs` — id、decoration_ids、parameters map、decoration_parameters map
- **用途：** 路由个性化定制参数

### 7.6 其他 Pathfinder 客户端文件（16 个文件）：
- `boarded_transit_vehicle.proto` — 已登车车辆信息
- `building-level.proto` — 建筑楼层信息
- `cost-model-options.proto` — 成本模型出行方式选项
- `describer-options.proto` — 行程描述选项
- `error.proto` — 错误码
- `experiments.proto` — Pathfinder 实验参数
- `mode-availability.proto` — 出行方式可用性
- `mrp-cost-function-specification.proto` — MRP 成本函数规范
- `mrp-ranking-options.proto` — MRP 排名选项
- `mrp-selector-info.proto` — MRP 选择器信息
- `mrp-selector-specification.proto` — MRP 选择器规范
- `mrp-vehicle-info.proto` — MRP 车辆信息
- `on-demand-transportation.proto` — 按需出行（打车）选项
- `polyline-codec.proto` — 折线编码选项
- `request-source.proto` — 请求来源
- `step.proto` — 逐向导航步骤数据
- `transit.proto` — 公交特定选项
- `tripset.proto` — 行程集合数据

额外：
- `autonomous/assisted_driving_info.proto` — 辅助驾驶数据
- `compliance/proto/compliance_prediction_server.proto` — 合规性预测
- `crp/searcher/request_options.proto` — CRP 搜索器选项
- `replay/proto/replay_metadata.proto` — 用于调试的重放元数据

---

## 8. MAPS DIRECTIONS MRP 日志（19 个文件）

### 8.1 `logs/proto/maps/directions/mrp/logging.proto`
- **包名：** `logs.proto.maps.directions.mrp`
- **消息：** `LoggedLogProto` — 日志条目（severity/context/source）、阶段计时（21 个阶段标签：QUERY_REWRITE、HINTING、GENERATION、MIXING、PRE_CULL_ANNOTATION、PREPARE_FOR_REQUERY、TRIP_PROPERTIES、COSTING、SELECTION、PENALTY_FREE_FIXUP、RANKING、CULLING、POST_CULL_ANNOTATION、MEASUREMENT、PREPARE_LOGS、RESULT_REWRITE、RESPONSE_FINALIZE、DECORATE）、MRP measures、dark launch logs（control/test trip generator 对比，含 churn、equivalence stats）
- **用途：** 服务端 MRP（多路线规划器）内部日志和 dark launch A/B 测试

### 8.2 `logs/proto/maps/directions/mrp/affordances.proto`
- **包名：** `logs.proto.maps.directions.mrp`
- **枚举：** `LoggedAffordanceEnums.Class` — CLASS_TRUCK（4 个子类型：TRUCK、TRUCK_IMPASSABLE、TRUCK_HAZMAT、TRUCK_AVOID/PREFER/MOST_PREFERRED）、CLASS_AVOID、CLASS_PREFER、CLASS_AFFORDANCE_APPLIES
- **用途：** 路由的道路 affordance 分类

### 8.3 `logs/proto/maps/directions/mrp/trip.proto`
- **包名：** `logs.proto.maps.directions.mrp`
- **关键消息：**
  - `LoggedTripProto` — trip_index、generator_index、paths、annotations、properties、costs、selected_trip_info、overall_relevance、label、counterfactual flags、dynamic_closure info、duplicate_trip_infos、customization_annotation_versions
  - `LoggedPathProto` — path_index、snapped_waypoints、segment traversal、generator_data、path annotations、measures、path labels
  - `LoggedTraversedSegmentProto` — feature_id、vertices、offline annotations
  - `LoggedGeneratorData` — oneof：pathserver（cost）
- **用途：** 完整的 MRP 行程和路径日志

### 8.4 `logs/proto/maps/directions/mrp/measure.proto`
- **包名：** `logs.proto.maps.directions.mrp`
- **消息：** `LoggedMrpMeasureProto` — value、type（DISTINCTNESS、COST_ADVANTAGE、NUM_TRIPS、ABSOLUTE_OPTIMALITY_LOSS、PERCENTAGE_OPTIMALITY_LOSS、RELEVANCE、PENALTY_IMPACT、PENALTY_CONTRIBUTION、ROUTE_THROUGH_RESTRICTION、SEGMENT_HINTS_SIZE）、selector A/B indices and labels
- **用途：** 定量 MRP 质量度量

### 8.5 `logs/proto/maps/directions/mrp/properties.proto`
- **包名：** `logs.proto.maps.directions.mrp`
- **关键消息：**
  - `LoggedQueryPropertiesProto` — user/client/vehicle/area/destination/time properties
  - `LoggedTripPropertiesProto` — travel_modes、travel_time、distance、toll info、`LoggedTaggedPenalty`（annotator source + tag + penalty milliseconds）、customization cost function inputs、passability properties、risk_averse_routing trigger、HOV segments、active closures
- **用途：** 用于 MRP 分析的查询和行程属性

### 8.6 `logs/proto/maps/directions/mrp/ranking_rule.proto`
- **包名：** `logs.proto.maps.directions.mrp`
- **消息：** `LoggedSimpleRankingRuleProto`、`LoggedNestedRankingRuleProto`（sub_rule）、`LoggedRankingRuleProto`（oneof：simple/nested）
- **用途：** MRP 排名规则日志

### 8.7 `logs/proto/maps/directions/mrp/ranking_rule_type.proto`
- **用途：** 排名规则类型枚举定义

### 8.8 `logs/proto/maps/directions/mrp/ranking_spec.proto`
- **用途：** 排名规范

### 8.9 `logs/proto/maps/directions/mrp/cost_function_spec.proto`
- **用途：** 成本函数规范

### 8.10 `logs/proto/maps/directions/mrp/relevance_model.proto`
- **用途：** 行程相关性模型

### 8.11 其他 MRP 文件：
- `annotation_version.proto` — 注解版本追踪
- `annotations.proto` — 行程/路径注解定义
- `annotator_spec.proto` — 注解器规范
- `offline/annotations.proto` — 离线注解数据
- `metrics/path_metrics.proto` — 路径级别指标
- `money.proto` — 金额/收费价格日志
- `query_plan.proto` / `query_plan_preset.proto` — 查询计划日志
- `requery_token_trip_context.proto` — 重新查询令牌上下文
- `trip_result_status.proto` — 行程结果状态码
- `trip_set.proto` — 行程集合 proto（trips + annotations + session id）
- `trip_set_annotations.proto` — 行程集注解数据
- `mrp_processing_metadata.proto` — 处理元数据
- `decoration_spec.proto` — 装饰规范

---

## 9. DIRECTIONS CUSTOMIZATION CONFIG（13 个文件）

### 9.1 `logs/proto/maps/directions/customization/config/customization_config.proto`
- **包名：** `maps_directions_customization_logs`
- **消息：** `LoggedCustomizationConfig` — domain、name、trip_property_dependencies、travel_mode（DRIVE/BICYCLE/WALK）
- **用途：** 定制化配置日志

### 9.2 `logs/proto/maps/directions/customization/config/` — 配置文件：
- `annotation_api_config.proto` — 注解 API 配置
- `annotation_config.proto` — 注解配置
- `customization_config_combined.proto` — 组合定制化配置
- `domain_config.proto` — 域特定配置
- `enumeration_config.proto` — 枚举配置
- `parameter_config.proto` — 参数配置
- `parameter_gate.proto` — 参数门控
- `trip_property_config.proto` — 行程属性配置

### 9.3 `logs/proto/maps/directions/customization/config/decorations/` — 装饰配置：
- `decoration_config.proto`
- `decoration_config_combined.proto`
- `summary_decoration.proto`

### 9.4 `logs/proto/maps/directions/customization/config/serving_protos/` — 服务 proto：
- `cost_function_inputs.proto` — 服务端成本函数输入
- `parameter_value.proto` — 参数值日志
- `passability_properties.proto` — 通行性属性
- `segment_annotations.proto` — 每段注解数据
- `trip_property_inputs.proto` — 行程属性输入
- `trip_time.proto` — 行程时间表示

### 9.5 `logs/proto/maps/directions/customization/`
- `active_affordance.proto` — 活跃 affordance 状态
- `restricted_zones/navlog_restricted_zone_info.proto` — 限制区域信息

---

## 10. DIRECTIONS COPILOT 与 TOLLS

### 10.1 `logs/proto/maps/directions/copilot/traffic_report.proto`
- **包名：** `logs.proto.maps.directions.copilot`
- **消息：**
  - `LoggedTrafficReport` — one_liner、prompt、audio
  - `LoggedAudio` — expected_contains_inflection、audio_type
  - `LoggedPrompt` — with_road_closure、with_unavoidable_closure、closure_cause、expected_contains_inflection、prompt_type
  - `LoggedOneLiner` — title、short_title、subtitle（均为重复 TrafficReportPiece）、icon、road_closure info、expected_contains_inflection
  - `LoggedTrafficReportPiece` — text
- **用途：** Copilot（语音助手）的交通事件报告日志
- **依赖项：** maps/directions/copilot traffic_report types、roadtraffic incidents

### 10.2 `logs/proto/maps/directions/tolls/proto/` — 收费日志：
- `client_id.proto` — 收费客户端标识
- `pass_type.proto` — 收费通行证类型
- `pricing_factors.proto` — 收费定价因素
- `vehicle_attributes.proto` — 收费车辆属性

---

## 11. MAPS TRANSIT 日志（21 个文件）

### 11.1 `logs/proto/maps/transit/api/connection.proto`
- **包名：** `logs.proto.maps_transit.api`
- **关键消息：**
  - `LoggedWalk` — transfer_key、distance、duration
  - `LoggedRide` — departure、is_critical、stops（含 expected/scheduled stop keys、arrival/departure route section keys、time offsets、on_request flag）、segments（polyline_key、transit_trip_key、synthetic_polyline）、alerts、crowdedness、vehicle_attributes、last_trip_update、boarded_vehicle_token
  - `LoggedLeg` — oneof：Walking、Transit、Driving、OfflineTaxi、OnlineTaxi、Cycling、TwoWheeler
    - `LoggedTransit` — departure/arrival station keys、valid_line_direction_keys、travel_time、periodicity、rides、filtered_departures_query_token、`LoggedVehicleBoardingRecommendation`（vehicle_key、carriages、reason FASTEST_TRANSFER/FASTEST_EXIT、direction_of_motion、orientation）
    - `LoggedDriving` — duration、transfer_key、traffic_flavor、roadtraffic results
    - `LoggedOfflineTaxi` / `LoggedOnlineTaxi` — driving_info + taxi info
  - `LoggedJourney` — departure、arrival time range
  - `LoggedConnection` — journeys、duration、periodicity、transit_leg_count、legs、is_confidential、fare_info、feasibility（FEASIBLE/INFEASIBLE）、labels（EARLIEST_ARRIVAL、LATEST_DEPARTURE、SHORTEST_TRAVEL_TIME、FEWEST_TRANSFERS、LEAST_WALKING、LOWEST_FARE、TIGHT、RELAXED、RISKY、SAFE）
- **用途：** 完整的公交连接 + 行程段日志（步行、公交、驾车、出租车、骑行、摩托车）
- **依赖项：** 10 个导入项，跨越 limo、roadtraffic、transit/api

### 11.2 其他 Transit API 文件（20 个文件）：
- `accessibility.proto` — 公交无障碍信息
- `attribute_status.proto` — 属性状态
- `core.proto` — `LoggedInt32Range`（low/high/approx）
- `fare.proto` — `LoggedPriceRange`、`LoggedFare`、`LoggedFareInfo`
- `input_time.proto` — 输入时间表示
- `link.proto` — 链接数据
- `metadata.proto` — 元数据
- `occupancy_status.proto` — 车辆满载度
- `output_time.proto` — 输出时间
- `payment.proto` — 支付信息
- `personalization.proto` — 个性化数据
- `position.proto` — 位置数据
- `region_description.proto` — 区域描述
- `routing_signals.proto` — 路由信号
- `text.proto` — 文本数据
- `time.proto` — 时间表示
- `transit_options.proto` — 公交选项
- `travel_overview.proto` — 行程概览
- `vehicle_attributes.proto` — 车辆属性

### 11.3 `logs/proto/maps/transit/fare/fare.proto`
- **包名：** `logs.proto.maps_transit`
- **消息：** `LoggedFareProto` — base_fare_type（NORMAL/CHILD）、surcharge_type（NO_SURCHARGE/NON_RESERVED_SEAT/RESERVED_SEAT/FIRST_CLASS/SUITE/SLEEPER/EXPRESS/STANDING/DISCOUNTED_EXPRESS/OTHER）、fare names、amount、currency、fare_type、min/max_amount
- **用途：** 详细的公交票价结构日志

### 11.4 `logs/proto/maps/transit/tripfinder/common/cost_model.proto`
- **包名：** `logs.proto.maps_transit`
- **消息：** `LoggedCostModelProto` — 50+ 个惩罚因子和基本惩罚，涵盖每种出行方式（walking、driving、offline_taxi、online_taxi、cycling、two_wheeler、train、tram、bus、subway、ferry、other）、换乘惩罚（exit、preferred、safe、timed、cross_datasource）、服务惩罚（expensive、station、line、fare）、避免的车辆/换乘惩罚、非请求实体惩罚、无障碍惩罚
- **用途：** 公交行程查找器成本模型配置日志（完整的惩罚配置）

### 11.5 `logs/proto/maps/transit/realtime/proto/service_alerts_ui.proto`
- **包名：** `logs.proto.maps_transit_realtime.service_alerts.ui`
- **消息：**
  - `LoggedText` — text + language
  - `LoggedAlert` — affected_resource（CURRENT_STATION/LINE/AGENCY/TRIP/TRIPSET 或 NAMED）、effect（NO_SERVICE/REDUCED_SERVICE/SIGNIFICANT_DELAYS/DETOUR/ADDITIONAL_SERVICE/MODIFIED_SERVICE/OTHER/UNKNOWN/STOP_MOVED/NO_EFFECT/ACCESSIBILITY_ISSUE）、additional_text、full_description、more_info_url、is_displayed_to_internal_only、cause（TECHNICAL_PROBLEM/STRIKE/DEMONSTRATION/ACCIDENT/HOLIDAY/WEATHER/MAINTENANCE/CONSTRUCTION/POLICE_ACTIVITY/MEDICAL_EMERGENCY）、start/end_time、importance_score
- **用途：** 实时公交服务警报 UI 日志
- **依赖项：** shared/url

---

## 12. MAPS ROAD TRAFFIC 日志（4 个文件）

### 12.1 `logs/proto/maps/roadtraffic/proto/traffic.proto`
- **包名：** `logs.proto.maps.roadtraffic.proto`
- **消息：** `LoggedTripSummaryForTrafficFlavor` — elapsed_time_ms、traffic_covered_trip_length_m、delay_category、traffic_level_usualness
- **用途：** 行程级交通摘要

### 12.2 `logs/proto/maps/roadtraffic/proto/traffic_model_type.proto`
- **包名：** `logs.proto.maps.roadtraffic.proto`
- **枚举：** `LoggedTrafficModelType` — 7 种模型：UNKNOWN、PER_SEGMENT_REGRESSION、GLOBAL_CAR_GLASSBOX、GLOBAL_TWO_WHEELER_GLASSBOX、REMOTE_PREDICTION_SINGLE_SEGMENT、SUPERSEGMENT、BLENDING、TRAFFIC2VEC
- **用途：** 交通预测模型标识

### 12.3 `logs/proto/maps/roadtraffic/proto/path_traffic_flavor.proto`
- **包名：** `logs.proto.maps.roadtraffic.proto`
- **消息：**
  - `LoggedPathTrafficFlavor` — time_specifier、prediction_timing（TIME_GOES_BY）、blending
  - `LoggedTimeSpecifier` — interpretation（ABSOLUTE_UTC/LOCAL_TIMEZONE）、seconds、anchoring（DEPARTURE/ARRIVAL）
  - `LoggedBlendingSpecifier` — type（BEST_GUESS、STATIC_HISTORICAL、PESSIMISTIC_STATIC_HISTORICAL、OPTIMISTIC_STATIC_HISTORICAL、FREEFLOW、REALTIME）、use_supersegment、use_path_model
- **用途：** 路径计算的交通 flavor 配置

### 12.4 `logs/proto/maps/roadtraffic/proto/road_routability_disruption.proto`
- **包名：** `logs.proto.maps.roadtraffic.proto`
- **消息：** `LoggedRoadRoutabilityDisruptionInfo` — 重复 `LoggedRoadRoutabilityDisruption`（route_overlaps 包含段指纹和跳过距离、schedule、in_serving_road_index）
- **用途：** 道路中断/封闭对可通行性的影响

---

## 13. MAPS MOBILE 日志（3 个文件）

### 13.1 `logs/proto/maps/mobile/navigation_session_events.proto`
- **包名：** _(多种)_
- **258 个符号** — 巨型 proto，涵盖**所有导航会话事件：**
  - `NavigationSessionEvents` — 所有事件类型的容器
  - **事件类型（50+ 种）：** `GuidanceSelectedEvent`、`GuidanceStartedEvent`、`GuidanceStoppedEvent`、`StepChangedEvent`、`ActiveTripChangedEvent`、`TrafficDataUpdatedEvent`、`AlternateTripOfferedEvent`、`AlternateTripAcceptedEvent`、`AlternateTripSelectedEvent`、`RerouteRequestedEvent`、`DroveOntoAlternateEvent`、`PromptShownEvent`（38 种提示类型 + 抑制原因）、`SpeedLimitStartedShowingEvent`、`SpeedLimitStoppedShowingEvent`、`ArrivedEvent`、`DeviceEvent`、`ForegroundEvent`、`GpsAvailabilityEvent`、`StartRecordingEvent`、`StopRecordingEvent`、`SessionEndedEvent`、`StopReasonEvent`、`FeedbackEvent`、`PickupEvent`、`DropoffEvent`、`AndroidActivityRecognitionEvent`、`TransitTripStartedEvent`、`AssistantVoiceActionEvent`、`AssistantStateEvent`、`UiModeStateEvent`、`TrafficRadarStateEvent`、`IncidentReportEvent`、`MapVersusSensorInconsistencyEvent`、`AccelerationEvent`、`AssistedDrivingEvent`、`PostTripUgcAnswerEvent`、`WeatherStateEvent`、`VehicleStateEvent`、`PredictedCurvatureEvent`、`PathUpdateEvent`、`ArModeStateEvent`、`ArLocalizationChangeEvent`、`ArIndoorStateEvent`、`ArElementPlacedEvent`、`BaselineBatteryUsageEvent`、`BatteryConsumptionEvent`、`PlaceEnterEvent`、`PlaceExitEvent`、`PlaceOngoingEvent`、`ActivityStartEvent`、`ActivityEndEvent`、`ActivityOngoingEvent`、`SemanticLocationEvent`、`CameraFramingChangedEvent`、`RoadViewMetricEvent`、`LiveActivityContentAppliedEvent`、`FeatureChangedEvent`、`ThermalStateEvents`（Android/iOS）、`CpuUsageStateEvent`、`FpsStateEvent`、`LiteNavTransitUsageEvent`、`RerouteCauseEvent`、`TopErrorStatusEvent`、`InteractionEvent`、`RerouteActionEvent`、`LapSummaryEvent`、`StopEvent`、`DisplayAlternatesEvent`、`GeminiInNavInvocationEvent`、`GeminiInNavQueryEvent`、`GeminiInNavResponseEvent`、`GeminiInNavUserCancelEvent`
  - **辅助消息：** `LocationSample`、`DifferentialLocationSample`、`StepPointer`、`LoggedSpeedReading`、`LoggedTrafficReportProblem`、`LoggedTrafficData`、`LoggedDirectionsStepCueProto`、`LoggedLaneTurn`、`LoggedLaneGuidance`、`LoggedCannedMessage`、`LoggedVoiceGuidanceTextAnnotation`、`LoggedGuidanceSpokenText`、`LoggedDrivingSummary`、`LoggedSummary`、`LoggedNotice`、`LoggedSpokenText`、`LoggedStep`、`LoggedStepGroup`、`LoggedTransitVehicleDetails`、`LoggedTransitVehicleGroup`、`LoggedSegmentEnergyUsage`、`LoggedRoadsideFacilityInfo`、`LoggedPath`、`LoggedTrip`、`LoggedFindPathLatency`、`LoggedCrpStatus`（56 种 CRP 状态类型）、`LoggedHeuristicPostprocessorData`、`LoggedCrpData`、`LoggedMrpData`、`LoggedCustomizationDataFirstOrThirdParty`、`LoggedTripData`、`LoggedVehicleEnergyModel`、`TripsAndTrafficSentEvent`、`LocationPipelineEvent`、`LoggedPathCost`、`LoggedSpeedInfo`、`CameraState`（orientation/mode/moment/look_ahead）、`AndroidThermalStateEvent`（10 个状态）、`IosThermalStateEvent`（5 个状态）、`NavigationAdEvent`（promoted pin impressions/clicks/actions、ad_type、label_visibility）、`PostTripUgcAnswerEvent`（questions/answers/multi-select/selected location/entry point）
- **用途：** 完整的移动端导航会话遥测 — 最全面的导航行为日志 schema
- **功能要点：** 逐向导航指引、车道指引、语音提示、交通报告、重新规划路线、公交行程、AR 导航、电池/温度、传感器观测、相机状态、路径更新、能耗、导航中 Gemini、行程后 UGC、导航中广告

### 13.2 `logs/proto/maps/mobile/map_versus_sensor_inconsistency.proto`
- **包名：** `logs_gmm`
- **消息：** `MapVersusSensorInconsistency` — distance_meters、segment_index、grid coordinates、lat/lng（E5）、map_version、barometric_altitude（meters + uncertainty）、road_altitude_meters
- **用途：** 检测地图数据与传感器测量之间的差异

### 13.3 `logs/proto/maps/mobile/server_version_metadata.proto`
- **包名：** `logs_gmm`
- **消息：**
  - `NamedServerVersion` — server_tag（GMM_SERVER/MAPS_FE_BOQ/GWS/PAINT/SPOTLIGHT/MAPS_SDK_BOQ/FLEET_ENGINE/SUPERROOT）、server_version、enable_stickiness
  - `ServerVersionMetadata` — 重复 seen_servers
- **用途：** 服务端版本追踪，用于调试

### 13.4 `logs/proto/maps/mobile/transportation/navigation_guider_event.proto`
- **包名：** `logs_gmm.transportation`
- **关键消息：**
  - `NavigationGuiderEvent` — trip_id、trip_progress、errors、last_good_projection、reroute events
  - `GuiderTripProgressEvent` — ETA、duration_to_destination、current_step_group_index、has_departed、yoda_state、oneof：walking（remaining_distance）/ transit（vehicle_token、current_stop_index、remaining_stops）
  - `GuiderErrorEvent` — oneof：DeviceOfflineError、NoGpsSignalError
  - `GuiderRerouteEvent` — oneof：BetterMatchingEarlierDeparture、BetterMatchingLaterDeparture、OffRoute（distance_meters、step_group_index）、TripInfeasible
- **用途：** 逐向导航 guider（引导引擎）事件日志

---

## 14. MAPS LIMO：打车日志（4 个文件）

### 14.1 `logs/proto/maps/limo/proto/response.proto`
- **包名：** `logs.proto.maps_limo`
- **关键消息：**
  - `LoggedOfflineTaxiInfo` — service_provider、fare_estimate、fare_breakdown、display_name、disclaimer、google_confidential
  - `LoggedOnlineTaxiInfo` — service_provider、partner_app_link_text、waiting_time_seconds、fare_estimate、`LoggedSurgePricingInfo`（surge_icon_id、description）、product_name、details、disclaimer、show_ad_label、`LoggedAvailableVehiclesInfo`（vehicles_per_km2、vehicle_icon_id）、`LoggedProductCategoryInfo`（category、name、category_icon_id）、google_confidential、internal_data（product_type）
- **用途：** 在线/离线出租车（打车）结果日志

### 14.2 `logs/proto/maps/limo/proto/service_provider.proto`
- **包名：** `logs.proto.maps_limo`
- **消息：** `LoggedServiceProvider` — provider_token、provider_name、provider_icon_id
- **用途：** 打车服务提供商标识

### 14.3 `logs/proto/maps/limo/proto/fare_breakdown.proto`
- **包名：** `logs.proto.maps_limo`
- **消息：**
  - `LoggedMonetaryCost` — amount、currency、num_legs
  - `LoggedFareBreakdown` — `LoggedFareGroup` → `LoggedFareItem`（description + cost）
- **用途：** 打车的详细费用明细

### 14.4 `logs/proto/maps/limo/proto/monetary_range.proto`
- **包名：** `logs.proto.maps_limo`
- **消息：** `LoggedMonetaryRange` — 费用估算范围

---

## 15. MAPS 共享类型（10 个文件）

### 15.1 `logs/proto/maps/shared/logged-geom.proto`
- **包名：** `logs_maps_shared.geom`
- **消息：** `Camera`（location、rotation、screen_size、field_of_view_y）、`Location`（longitude/latitude/altitude + redacted）、`Rotation`（heading/tilt/roll）、`Size`（width/height）
- **用途：** 相机和位置的共享几何类型

### 15.2 `logs/proto/maps/shared/geometry_e7.proto`
- **包名：** `logs_maps_shared`
- **消息：** `PointE7`（lat_e7/lng_e7）、`RectE7`（lo/hi）
- **用途：** E7 编码的几何基元

### 15.3 `logs/proto/maps/shared/automotive-context.proto`
- **包名：** `logs_maps_shared`
- **关键消息：** `AutomotiveContext` — 综合车载环境日志：
  - `Platform`（ANDROID_AUTO_PROJECTED、EMBEDDED、APPLE_CARPLAY、EMBEDDED_ADAS、GEO_APIS_FOR_AUTOMOTIVE）
  - `HeadUnit`（make、model、software_version、software_build）
  - `Car`（make、model、model_year、driver_position LEFT/RIGHT/CENTER、powertrain BEV/PHEV/OTHER、vehicle_type CAR/TRUCK/MOTORCYCLE）
  - `CarInputInfo`（rotary_controller、touch_screen、dpad、touchpad、focusing_device、touchpad_size）
  - `UiRestrictions`（keyboard_restricted）
  - `AndroidAutoInfo`（boardwalk、widescreen、experiment IDs、car_connected、projected_display_active）
  - `ActivityContext`（type：MAIN/LIMITED/CLUSTER/PHONE、state：FOREGROUND_ACTIVE/INACTIVE/BACKGROUND）
  - `UiInfo`（pin side、main_display_unreachable）
  - `DataSubscriptionStatus`（INACTIVE/TRIAL/PAID）
  - `PrivacySettingsStatus`（trip_personalization_opt_in_weeks）
  - `CarPlayInfo`（screen dimensions）
  - `NavigationType`（FREE_NAV/GUIDED_NAV）
  - `AllDisplaysInfo`（最多 4 块显示屏，包含 type、dimensions、DPI、scaling、safe areas、touch screen type）
  - `InstrumentClusterSettings`（feature_set：DEFAULT_MAP_ONLY/MAP_AND_NAVIGATION_STATE）
- **用途：** 车载导航日志的完整汽车上下文

### 15.4 `logs/proto/maps/shared/directions-notice-data.proto`
- **包名：** `logs_maps_shared.visual_element`
- **消息：** `DirectionsNoticeData` — travel_mode、severity（ALERT/WARNING/INFORMATION/CRITICAL）、external summary/details hash、language、agency_id、incident_id、originating_problem_provider（WAZE/USER_REPORT）
- **用途：** 路线通知/警告展示日志

### 15.5 `logs/proto/maps/shared/geo_doc_fetch_key.proto`
- **包名：** `logs_maps_shared`
- **消息：** `GeoDocFetchKey` — oneof：feature_id/mid、interpolated_geocode（segment_id、street_number/interpolation_param/snapped_point）、subpremise、intersection（cross_street_ids、location）、truncated_route、interpolated_house_id、plus_code_geocode
- **用途：** 地理编码文档获取键（定义如何检索地理编码结果）

### 15.6 `logs/proto/maps/shared/lodging_pricing_information.proto`
- **包名：** `logs_maps_shared`
- **消息：** `LoggedPrice`（price + hps_event_id）、`LodgingPricingInformation` — 在 5 个界面上展示的价格：search_result、map、preview、placesheet、searchless_map_organic
- **用途：** 跨界面的住宿价格展示追踪

### 15.7 `logs/proto/maps/shared/name.proto`
- **包名：** `logs_maps_shared`
- **消息：** `LoggedNameProto` — text、language、40+ 个标志类别（FLAG_IN_LOCAL_LANGUAGE、FLAG_PREFERRED、FLAG_OFFICIAL、FLAG_OBSCURE、FLAG_ON_SIGNS、FLAG_EXIT_NAME、FLAG_ROUTE_NUMBER、FLAG_ABBREVIATED、FLAG_TRANSLITERATED、FLAG_BICYCLE_ROUTE、FLAG_SUSPICIOUS 等）、short_text
- **用途：** 地点/道路名称表示，包含丰富的标志元数据

### 15.8 `logs/proto/maps/shared/url.proto`
- **包名：** `logs_maps_shared`
- **消息：** `LoggedUrlProto` — url、language、pagerank（已弃用）
- **用途：** URL 日志

### 15.9 `logs/proto/maps/shared/travel_intent_data.proto`
- **包名：** `logs_maps_shared`
- **消息：** `TravelIntentData` — travel_intent（TRAVEL_PLANNING/IN_DESTINATION/LOCAL）、3 个距离分桶（viewport_from_flop、viewport_from_user_location、user_location_from_flop）
- **用途：** 出行意图分类信号

---

## 16. MAPS VMS：传感器观测（3 个文件）

### 16.1 `logs/proto/maps/vms/lane_element_detail.proto`
- **包名：** `logs.vms.databack`
- **消息：**
  - `LaneElementDetail` — element_type（PHYSICAL_LANE_ELEMENT/LANE_STRIPE_ELEMENT/LINEAR_STRUCTURE_ELEMENT）、line_of_extrusion、average_element_width、lane_stripe_element_detail
  - `BodyFrameCoordinateSequence` — x/y/z_meters 数组 + y_variances
  - `LaneStripeElementDetail` — logical_color（WHITE/YELLOW/BLUE/RED/GREEN/ORANGE）、pattern（SINGLE_LINE_SOLID/DASHED、DOUBLE_LINE_SOLID/DASHED、SOLID_LEFT_DASHED_RIGHT、SOLID_RIGHT_DASHED_LEFT）、materials（PAINT_STRIPE/ROUND_DOT/SQUARE_DOT）、dash_length、dash_ratio
- **用途：** 详细的车道级地图元素日志（用于 HD 地图）

### 16.2 `logs/proto/maps/vms/roadview_metrics.proto`
- **包名：** `logs.vms.roadview`
- **消息：**
  - `RoadViewMetric` — metadata + oneof：CoverageMetric / SkipLocationEvent
  - `CoverageMetric` — total_segments、total_length、attributes_coverage（SPEED_LIMIT、CURVATURE、ELEVATION、ALTITUDE、PREDICTED_SPEED、AZIMUTH、LINKED_INDEX、SPEED_LIMIT_SOURCE）、按 functional_road_class 分段的 segments
  - `SkipLocationEvent` — segment_id、branch_id、off_main_path_probability
  - `MetaData` — log_source（PUBLISHERS/SDK/LH_PUBLISHERS/HORIZON_SDK）、mapfacts_timestamp、sdk_version、session_id
- **用途：** RoadView 地图覆盖率指标（哪些地图数据可用于渲染）

### 16.3 `logs/proto/maps/vms/sensor_observations.proto`
- **包名：** _(多种)_
- **49 个符号** — 综合传感器观测日志：
  - `SensorObservation` — 容器
  - `RoadSignObservation` / `RoadSignObservationProbability` / `RoadSignObservationComponent`（127 种标志类型！）、`RoadSignObservationComponentDetail`
  - `MonitoredZoneDetail` — MonitoredZoneType、MonitoringSensorType
  - `SpeedLimit` — SpeedLimitType、speed value
  - `NamedArea`、`AppliesAhead`、`LaneFromSide`
  - `EcefPosition`、`ObservingVehicleRoadSegmentId`
  - `Predicate`、`RoadWeatherPredicate`、`VehiclePredicate`（weight、length、width、height 带单位）、`LocalTimePredicate`、`LocalTimePeriod`、`LocalTimeInterval`、`LocalTimeEndpoint`（MonthOfYear、DayOfWeek）
  - `ObservingVehicleRelativeSignPosition/Orientation`、`ObservingVehicleOrientation`
  - `UniqueRoadSignObservation`
  - `VolvoSignDetectionPacket`、`VolvoSignDetection`、`VolvoPrimarySign`（95 种主要标志类型！）、`VolvoSupplementarySign`（23 种补充类型）
  - `MapPatchObservation`、`DrivenCurvatureObservation`
  - `RoadWeatherCondition` 枚举
- **用途：** 车辆传感器观测 — 道路标志检测、天气、限速、曲率、地图补丁（用于基于车队的 map 更新）
- **功能要点：** Volvo 专用标志检测、来自车辆传感器的 HD 地图、道路天气检测

---

## 17. 搜索框日志（6 个文件）

### 17.1 `logs/proto/searchbox/searchbox_stats.proto`
- **包名：** _(多种)_
- **67 个符号** — 综合搜索框分析：
  - `SearchboxStats` — `GroupInfo`、`ValidationStatus`、`ParameterValidationStatus`、`SignatureValidationStatus`、`SearchMethod`（40 种方法！）、`InputMethod`（12 种方法）、`ExperimentInfo`、`SuggestionInfo`（SuggestionSource — 46 种来源、ActionSource、TabType）、`RenderedSuggestionsInfo`、`IpaStats`（CorporaDiffStats）、`HyperLocalSuggestStats`、`CacheConfig`、`ExperimentStatsV2`（121 种统计类型！）、`QueryConfirmationStats`、`SingleSearchboxContext`、`QueryBuilderTap`（QueryBuilderType）、`PromptExpansionTap`、`VascoStats`、`ActionStats`、`EditEventStats`、`OnDeviceSuggestionSuppressionStats`、`SuggestKeyboardDismissStats`、`SuggestionCount`、`SuggestScrollEventStats`、`ErrorStats`、`MoreButtonClickInfo`、`ServerIcingAnswerComparisonInfo`、`AnswerSuggestionStats`、`DoodleStats`、`SuggestionInteraction`、`SliceImpression`、`UntimelyResponseSuppression`、`MapsSuggestAdsStats`、`SuggestEntryPoint`（45 个入口点！）、`RoundTripTimeStats`、`QueryComposerTapEvent`（ChipTapMode、ChipToggleMode）、`QueryComposerData`、`TabSuggestV2DarkStudyData`、`QueryParameter`、`Modality`、`IcingRankingSignals`、`ToastSuggestionRankingSignals`、`OnDeviceContactSuggestionRankingSignals`、`PixelLauncherInfo`、`IcingIndexableInfo`、`SliceInfo`（loading type、display mode）、`IpaRenderTimeStats`、`SliceAction`、`UntimelySuggestion`、`OmniboxPosition`
- **用途：** 完整的搜索框交互分析，包含建议质量、排名、IPA 和切片追踪

### 17.2 其他搜索框文件：
- `action_info.proto` — `ActionInfo`（action_type、package_id、aog_annotation、action_uri、intent_name、kesem_action_type）
- `action_on_google_annotation.proto` — Actions on Google 注解
- `action_type.proto` — 操作类型枚举
- `searchbox_stats_group.proto` — 搜索框统计分组
- `smart_compose_stats.proto` — 智能撰写统计

---

## 18. FEATURE 与 LOGS ANNOTATIONS（5 个文件）

### 18.1 `logs/proto/feature/feature_offset_identifier.proto`
- **包名：** `logs.feature`
- **消息：** `FeatureOffsetIdentifier` — identifier_base[] + offset
- **用途：** 基于偏移的要素标识

### 18.2 `logs/proto/feature/tree_ref.proto`
- **包名：** `logs.feature`
- **消息：** `TreeRef` — oneof event（EventIdMessage/ClientEventIdMessage）+ oneof identifier（feature_index/FeatureOffsetIdentifier）
- **用途：** 用于 VE/要素树遍历的基于树的要素引用

### 18.3 `logs/proto/logs_annotations/logs_annotations.proto`
- **包名：** `logs_proto`
- **关键内容：**
  - `IdentifierType` 枚举 — 36 个值：IP_ADDRESS、IP_ADDRESS_INTERNAL、USER_AGENT、SENSITIVE_TIMESTAMP、SENSITIVE_LOCATION、APPROXIMATE_LOCATION、COARSE_LOCATION、OTHER_LOCATION、OTHER_VERSION_ID、REFERER、THIRD_PARTY_PARAMETERS、OTHER_PSEUDONYMOUS_ID、PREF、ZWIEBACK、BISCOTTI、CUSTOM_SESSION_ID、GAIA_ID、EMAIL、USERNAME、PHONE_NUMBER、OTHER_AUTHENTICATED_ID、OTHER_UNAUTHENTICATED_ID、PARTNER_OR_CUSTOMER_ID、PUBLISHER_ID、DASHER_ID、GSERVICES_ANDROID_ID、HARDWARE_ID、MSISDN_ID、BUILD_SERIAL_ID、UDID_ID、ANDROID_LOGGING_ID、SECURE_SETTINGS_ANDROID_ID、OTHER_IDENTIFYING_USER_INFO、USER_INPUT、DEMOGRAPHIC_INFO、GENERIC_KEY、GENERIC_VALUE、COOKIE、URL、HTTPHEADER
  - `TombstoneType` — RETAIN/DROP
  - `MessageDetails` — may_appear_in（source_type + log_type）
  - 字段/消息/文件选项扩展：`id_type`、`temp_logs_only`、`is_private_log`、`not_logged_in_sawmill`、`is_encrypted`、`max_recursion_depth`、`sawmill_filter_override`、`tombstone_type`、`msg_details`、`field_encryption_key_name`、`file_not_used_for_logging_except_enums`、`file_vetted_for_logs_annotations`
- **用途：** **PII 分类和日志治理** — 为日志 schema 中的每个字段标注标识符类型，以实现数据隐私/合规

### 18.4 `logs/proto/maps/geoevents/annotations.proto`
- **包名：** `logs_geoevents`
- **扩展：** FieldOptions 上的 `expiration_date`、`owners`、`copy_to_geoevents_till`；ExtensionRangeOptions 上的 `owner`、`generation_end_date`、`ttl_days`
- **用途：** GeoEvents 特定的数据生命周期字段注解

---

## 19. AR（增强现实）日志（2 个文件）

### 19.1 `logs/proto/geo/ar/location.proto`
- **包名：** `logs.proto.geo.ar`
- **消息：** `LocationProto` — boot/utc_timestamp_ns、location_source（FUSED/GPS/NETWORK/IOS_CORE_LOCATION）、latitude/longitude/accuracy、altitude_wgs84_meters、vertical_accuracy、bearing/speed with accuracy
- **用途：** AR 定位传感器读数

### 19.2 `logs/proto/geo/ar/pose.proto`
- **包名：** `logs.proto.geo.ar`
- **消息：**
  - `LatLngAlt`、`Orientation`（roll/pitch/yaw）、`Pose`（location + orientation）
  - `Vector3dProto`、`QuaternionProto`、`RigidTransformProto`（translation + rotation）
  - `ReferenceFrame`（frame、reference_frame_context）
  - `ReferenceFrameAndState`（reference_frame + server_state）
  - `CovarianceMatrix3Proto`（6 元素 3x3 协方差）、`CovarianceMatrix6Proto`（21 元素 6x6 协方差）
  - `GeodeticPosePrior`（base_t_camera、camera_gravity、base_frame、position_covariance、heading_std_dev、location_readings）
  - `RigidTransformWithConfidence`（rigid_transform + covariance + heading_std_dev）
- **用途：** AR 导航的完整 6-DOF 姿态估计和不确定性日志

---

## 总结：涵盖的功能要点

| 领域 | 文件数 | 主要日志覆盖内容 |
|---|---|---|
| **Google Earth** | 9 | 89 种事件类型：启动、搜索、Earth Feed、测量工具、属性编辑器、项目、内容创作、主屏幕、Earth Mate（AI）、图层/数据目录、计费、按需分析、图像生成器、飞行模拟器、变化检测、用户导入 |
| **Visual Element（VE）** | 14 | 通用点击追踪、UI 树嫁接、用户操作（55 种类型）、危机警报、地点列表、酒店预订、中断 |
| **Hotels & Ads** | 3 | 酒店搜索、定价（7 个展示界面）、房价、筛选条件（24 个类别）、合作伙伴数据、广告注解、交易量级 |
| **Transportation** | 2 | 行程日志（导航 + 打车）、路径点活动度量、20 个 LRD 合作伙伴、affordance 向量 |
| **Directions Tactile** | 13 | 路线请求、出行方式选项、公交/驾车/共享单车/出租车选项、紧凑折线、地图上展示、推荐筛选、反事实 A/B 测试 |
| **Pathfinder Routing** | 21 | 完整路由请求/响应、路径点、位置、成本模型、行程/路径结果、MRP 选择器、定制输入、收费、可持续性、辅助驾驶、合规、CRP 搜索、重放 |
| **Directions MRP** | 19 | 服务端路由：日志条目、阶段计时（21 个阶段）、dark launch A/B、行程/路径属性、度量（10 种类型）、排名规则、成本函数、相关性模型、注解、处理器 |
| **Customization Config** | 13 | 定制配置、注解、装饰、服务 proto（成本函数输入、参数值、通行性、分段注解） |
| **Transit** | 21 | 连接 + 行程段（7 种模式）、乘车段、车站、票价（附加费类型）、服务警报（11 种影响、12 种原因）、成本模型（50+ 惩罚项）、无障碍、满载度、个性化 |
| **Road Traffic** | 4 | 交通模型（7 种类型）、路径交通 flavor（时间/混合）、道路通行性中断 |
| **Navigation（Mobile）** | 3 | 50+ 种导航会话事件、引导器事件（步行/公交）、地图与传感器不一致、服务端版本追踪 |
| **Limo（Ride-Hailing）** | 4 | 离线/在线出租车信息、服务提供商、费用明细、高峰定价、可用车辆 |
| **VMS（Sensor）** | 3 | 车道元素详情、道路视图覆盖率指标、Volvo 标志检测（95+ 种类型）、限速、曲率、地图补丁、天气 |
| **Search Box** | 6 | 搜索框分析：建议（46 种来源）、搜索方法（40 种）、实验统计（121 种）、IPA、查询编辑器、切片、入口点（45 种） |
| **AR** | 2 | 定位、6-DOF 姿态估计、协方差矩阵、大地姿态先验 |
| **Automotive** | 1 | 完整车载上下文：显示屏、车机、输入设备、动力总成、隐私、订阅、CarPlay、Android Auto |
| **Infrastructure** | 7 | 事件 ID、特征 ID、PII 注解（36 种标识符类型）、树引用、偏移标识符、VE 日志选项、GWS 标签 |

---

## 关键架构模式

1. **事件 ID 传播：** `EventIdMessage`/`ClientEventIdMessage` 作为所有日志子系统中的通用关联 ID
2. **PII 治理：** `logs_annotations.proto` 提供字段级别的标识符类型分类（36 种类型），用于数据隐私合规
3. **VE（视觉元素）层：** `VisualElementLiteProto` + `ClientRequestContext` 提供了在 Maps 和 Earth 中复用的通用点击追踪框架
4. **反事实 A/B 测试：** 多个子系统（路线、pathfinder、MRP）支持反事实日志，用于受控实验
5. **扩展密集型设计：** 许多 proto 广泛使用 proto2 扩展来实现可组合性（VE 有 350+ 个扩展字段，ClientInteractionMetadata 有 275+ 个）
6. **Editions 迁移：** 混合使用 proto2/editions 语法 — Earth log 使用 editions，而大多数 Maps 日志使用 proto2
7. **特征 ID 的普遍使用：** `FeatureIdProto`（S2 单元 + 指纹）是整个 maps 日志中使用的通用地理空间实体标识符
