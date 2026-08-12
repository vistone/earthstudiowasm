# Earth Google Web — Config 完整解析

> 从 `earth-pa.clients6.google.com/v1/earth/config` 的 22,075 字节响应中提取的全部配置

---

## 一、API 服务端点（16 个）

| # | 服务名 | URL | 用途 |
|---|---|---|---|
| 1 | `delve_service` | `https://delve.sidewalklabs.com` | 城市设计/AI规划 |
| 2 | `earth_document_http_service` | `https://earth.google.com/earth/document` | 文档CRUD |
| 3 | `earth_gws_service` | `https://earth.google.com/earth/rpc` | 主RPC（搜索/命令） |
| 4 | `fife_service` | `https://lh5.googleusercontent.com/earth/` | 照片前端 |
| 5 | `firebase_dynamic_links_service` | `https://firebasedynamiclinks.googleapis.com` | 动态链接 |
| 6 | `geo_photo_metadata_service` | `https://www.google.com/maps/photometa` | 照片元数据 |
| 7 | `geo_photo_thumbnail_service` | `https://streetviewpixels-pa.googleapis.com/v1/thumbnail` | 街景缩略图 |
| 8 | `geo_photo_tile_service` | `https://streetviewpixels-pa.googleapis.com/v1/tile` | 街景瓦片 |
| 9 | `geocoding_service` | `https://geogeocoding.googleapis.com` | 地理编码 |
| 10 | `mapspro_service` | `https://earth.google.com/earth/rpc/cc` | 企业版RPC |
| 11 | `picker_service` | `https://docs.google.com/picker` | 文件选择器 |
| 12 | `rocktree_service` | `https://kh.google.com/rt` | 3D瓦片树(KH) |
| 13 | `scotty_download_customer_service` | `https://earth.usercontent.google.com/earth/download` | 用户数据下载 |
| 14 | `scotty_upload_customer_service` | `https://earth.google.com/earth/upload` | 用户数据上传 |
| 15 | `streamchat_service` | `https://webchannel-earth-pa.googleapis.com/v1/ai/streamchat` | Earth Mate AI流式聊天 |
| 16 | `onepick_v2_service` | (picker v2) | 新版文件选择器 |

---

## 二、地图瓦片端点（含所有天体）

### Earth 主瓦片
```
https://khms0.googleapis.com/kh?v=1013&hl=en-US&x={{x}}&y={{y}}&z={{z}}
```

### 15 个天体（每个有独立的 API Key 和端点）

| 天体 | API Key | 端点 |
|---|---|---|
| **Mercury** 水星 | `14r435fVs-iaGieom9hnyFKzohpo` | `kh.google.com/rt/he/mercury` |
| **Venus** 金星 | `1eJG0CUPwXrA45kRUXxewd-qHpBs` | `kh.google.com/rt/he/venus` |
| **Moon** 月球 | `1V_p8jILbOyi7FRtWiMMZAQLRDEM` | `kh.google.com/rt/he/moon` |
| **Mars** 火星 | `1NbHMI0JZs5noW147UemBLUPFlvo` | `kh.google.com/rt/he/mars` |
| **Ceres** 谷神星 | `1V2xxOB5xuTerhsMdUAU3J3vwQLA` | `kh.google.com/rt/he/ceres` |
| **Io** 木卫一 | `1KZsT-MghNXGo33uwedis9Ad-da0` | `kh.google.com/rt/he/io` |
| **Europa** 木卫二 | `16fZ8gjlE8dmkTgVAaz2JTouRsqs` | `kh.google.com/rt/he/europa` |
| **Ganymede** 木卫三 | `1S2rzrMvV8Igdq5e-81IjfaP1tt4` | `kh.google.com/rt/he/ganymede` |
| **Mimas** 土卫一 | `1M0JJSsgyiUKnjZWosOr8AxEjkz0` | `kh.google.com/rt/he/mimas` |
| **Enceladus** 土卫二 | `122UiRkDQIxpzPnsG5gHuV-x6bkE` | `kh.google.com/rt/he/enceladus` |
| **Dione** 土卫四 | `1SHbrZP7x1-G2yuwBReXBZp3geAw` | `kh.google.com/rt/he/dione` |
| **Rhea** 土卫五 | `1mDHm_Jn16uBtqoGRyafkin_8SWs` | `kh.google.com/rt/he/rhea` |
| **Titan** 土卫六 | `13WLvGJYlo1HqmBGFhivImkeBmH4` | `kh.google.com/rt/he/titan` |
| **Iapetus** 土卫八 | `1lS1pj2quSzgTCsjwQzgUUfZoXmU` | `kh.google.com/rt/he/iapetus` |
| **Pluto** 冥王星 | `12SXsTuEBJLpen7yejk8g3btFXKI2B` | `kh.google.com/rt/he/pluto` |

---

## 三、功能配置 URL（30+ 个）

### 计费相关
| 配置项 | URL |
|---|---|
| `billing_launch_stages_url` | `developers.google.com/maps/launch-stages#ga` |
| `billing_plan_details_url` | `console.cloud.google.com/earth/billing/manage-plan` |
| `billing_plan_see_features_url` | `mapsplatform.google.com/maps-products/earth/plans/` |
| `billing_purchase_flow_url` | `console.cloud.google.com/earth` |
| `cloud_trial_learn_more_url` | `developers.google.com/.../earth-plans#start-free-trial` |

### 帮助文档
| 配置项 | URL |
|---|---|
| `measurement_help_url` | `developers.google.com/.../measure-distances` |
| `on_demand_analysis_help_url` | `developers.google.com/.../assess-site-overview` |
| `change_detection_help_url` | `developers.google.com/.../detect-change` |
| `classify_help_url` | `developers.google.com/.../classify` |
| `design_new_build_inputs_learn_more_url` | `developers.google.com/.../generate-designs` |
| `tile_overlay_help_url` | `support.google.com/earth/answer/9394930` |
| `time_machine_help_url` | `support.google.com/earth/answer/15468379` |
| `timelapse_help_url` | `support.google.com/earth/?p=timelapse` |
| `user_imported_layer_learn_more_url` | `developers.google.com/.../import-kml` |

### 法律/隐私
| 配置项 | URL |
|---|---|
| `privacy` | `www.google.com/intl/$[hl]/policies/privacy/` |
| `terms` | `www.google.com/help/terms_maps-earth/` |
| `legal_notices` | `www.google.com/help/legalnotices_maps.html` |
| `report_abuse_url` | `drive.google.com/abuse` |

### AI / Earth Mate
| 配置项 | URL |
|---|---|
| `streamchat_service` | `webchannel-earth-pa.googleapis.com/v1/ai/streamchat` |
| `earth_mate_gemini_sign_up_url` | `www.google.com/earth/about/gemini/` |
| `earth_mate_help_url` | `developers.google.com/.../gemini/get-started` |
| `earth_mate_terms_url` | `developers.google.com/.../gemini/overview` |
| `google_one_earth_ai_learn_more_url` | `support.google.com/earth/thread/382609632` |
| `google_one_manage_plan_url` | `one.google.com/manage-membership` |

### 社区/其他
| 配置项 | URL |
|---|---|
| `community` | `support.google.com/earth/community` |
| `discord_url` | `discord.com/invite/6ENMbsXQrF` |
| `earth_gallery` | `maps.google.com/gallery/` |
| `earth_videos_url` | `youtube.com/@googleearth` |
| `earth_pro_download` | `www.google.com/earth/about/versions/#download-pro` |
| `whats_new_url` | `developers.google.com/.../release-notes` |
| `alpha_earth_foundations_url` | `deepmind.google/blog/alphaearth-foundations` |

---

## 四、特殊功能

### 动态云层
```
https://storage.googleapis.com/earth-animated-clouds/root.json
```

### Timelapse 延时摄影
```
模板: storage.googleapis.com/earthengine-timelapse/2023/earth/20230206/{{z}}/{{x}}/{{y}}.webm
时间范围: 1984-07-26 至 2022-07-26
```

### Earth Mate AI 提示词（4 大类，24 个预设提示）

| 类别 | 预设提示 |
|---|---|
| **Gather** 信息收集 | "Map news events from the past week", "Map the 2026 World Cup stadium locations" |
| **Analyze** 分析洞察 | "Create a 200m buffer around every metro station in Paris", "Find parcels >80 acres within 25km of Sydney" |
| **Discover** 数据发现 | "Show me a digital elevation model of Switzerland", "Where is the densest tree canopy?" |
| **Learn** 学习使用 | "Show me how to use the latest Google Earth features", "How do I add my own data sets?" |

### 图像生成器预设
```
Park in empty lot, Redesigned intersection, Site history, Green roofs,
Hillside terracing, Windfarm
```

### Analytics 实验 ID
```
DELAYED_STARTUP_FINISHED_PRO_ADV_PLAN, DELAYED_STARTUP_FINISHED_PRO_PLAN,
DELAYED_STARTUP_FINISHED_STD_PLAN, EARTH_MATE_OIS_RESPONSE_RECEIVED,
EARTH_MATE_OPEN, EARTH_MATE_SUBMIT, DND_NAV_SELECT_INDIVIDUAL_DESIGN
```

### 信任域名白名单
```
ggpht.com, google.com, gstatic.com, googleapis.com, googleusercontent.com
```

---

*从 22,075 字节 Config proto 中完全提取 — 2026-08-12*
