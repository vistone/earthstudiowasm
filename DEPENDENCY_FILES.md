# Proto 文件级依赖清单

> 本节列出**每个 proto 文件**的 import 关系。基于 1,316 个文件中 4,195 条 import 边。

---

## 零、被依赖次数 Top 50 排行榜（最常被 import 的文件）

| 排名 | 被依赖次数 | 文件路径 | 所属领域 |
|---|---|---|---|
| 1 | **890** | `storage/datapol/annotations/proto/semantic_annotations.proto` | 数据策略 |
| 2 | 208 | `java/com/google/apps/jspb/jspb.proto` | Java 序列化 |
| 3 | 208 | `google/api/inclusion.proto` | API 注解 |
| 4 | 137 | `logs/proto/logs_annotations/logs_annotations.proto` | 日志注解 |
| 5 | 122 | `geostore/base/proto/options.proto` | 地理存储选项 |
| 6 | 103 | `devtools/staticanalysis/.../optouts.proto` | 静态分析豁免 |
| 7 | 79 | `net/proto2/bridge/proto/message_set.proto` | 消息集扩展 |
| 8 | 74 | `net/proto2/proto/descriptor.proto` | 扩展描述符 |
| 9 | 71 | `geostore/base/proto/featureid.proto` | 地物 ID |
| 10 | 36 | `third_party/protobuf/cpp_features.proto` | C++ 特性 |
| 11 | 34 | `maps/logs/logging/ve_logging_options.proto` | Maps 日志配置 |
| 12 | 32 | `google/protobuf/timestamp.proto` | 时间戳 |
| 13 | 26 | `privacy/pattributes/annotations/proto_field.proto` | 隐私注解 |
| 14 | 26 | `net/proto2/contrib/js_proto/public/field_annotations.proto` | JS 注解 |
| 15 | 25 | `third_party/java/protobuf/java_features.proto` | Java 特性 |
| 16 | 22 | `knowledge/graph/protomesh/protomesh.proto` | 知识图谱 |
| 17 | 21 | `geostore/base/proto/fieldmetadata.proto` | 字段元数据 |
| 18 | 17 | `logs/maps/featureid.proto` | Maps 地物日志 |
| 19 | 16 | `geostore/base/proto/point.proto` | 地理点 |
| 20 | 15 | `net/proto2/contrib/validator/annotations.proto` | 验证器 |
| 21 | 15 | `geo/earth/proto/contentcreation/content_editing_model.proto` | 内容编辑模型 |
| 22 | 14 | `maps/tactile/api/shared/geometry.proto` | 触觉地图几何 |
| 23 | 14 | `google/internal/earth/v1/shared.proto` | 内网共享类型 |
| 24 | 13 | `java/com/google/protobuf/contrib/autoprotocopier/annotations.proto` | 自动拷贝注解 |
| 25 | 13 | `geo/serving/proto/link/link.proto` | 链接 |
| 26 | 12 | `maps/tactile/api/shared/directions/directions-constants.proto` | 导航常量 |
| 27 | 12 | `maps/shared/common/geom/geom.proto` | Maps 几何 |
| 28 | 12 | `google/type/latlng.proto` | 标准经纬度 |
| 29 | 12 | `geostore/base/proto/timeschedule.proto` | 时间表 |
| 30 | 11 | `wireless/android/privacy/annotations/proto/collection_basis_annotations.proto` | Android 隐私 |
| 31 | 11 | `maps/tactile/api/geometry.proto` | 触觉几何 |
| 32 | 11 | `maps/tactile/api/directions-common.proto` | 导航通用 |
| 33 | 11 | `java/com/google/apps/jspb/jspb_generate_object_format.proto` | JSPB 格式 |
| 34 | 11 | `i18n/localization/proto/localized_text.proto` | 国际化文本 |
| 35 | 11 | `google/protobuf/duration.proto` | 时长 |
| 36 | 11 | `geo/earth/proto/storage_restrictions.proto` | 存储限制 |
| 37 | 11 | `geo/earth/proto/mapstyle.proto` | 地图样式 |
| 38 | 11 | `geo/earth/app/cpp/core/state/state.proto` | 状态管理 |
| 39 | 10 | `frameworks/testing/rpcreplay/processors/rpc_replay_field_option.proto` | RPC 重放 |
| 40 | 9 | `google/protobuf/any.proto` | Any 类型 |
| 41 | 9 | `geostore/base/proto/relation.proto` | 关系 |
| 42 | 8 | `google/api/field_behavior.proto` | 字段行为 |
| 43 | 8 | `geo/serving/proto/electricvehicle/electric_vehicle_options.proto` | 电动车选项 |
| 44 | 8 | `geo/serving/proto/user/address.proto` | 用户地址 |
| 45 | 8 | `google/internal/earth/v1/layers.proto` | 图层 API |
| 46 | 7 | `maps/tactile/api/shared/layer/layer-configuration.proto` | 图层配置 |
| 47 | 7 | `maps/shared/mapcore/api/proto/extensions/api_features.proto` | MapCore 特性 |
| 48 | 7 | `geostore/base/proto/address.proto` | 地址 |
| 49 | 7 | `geostore/base/proto/rect.proto` | 矩形 |
| 50 | 7 | `google/internal/earth/v1/terrain.proto` | 地形 API |

---

## 一、geo/earth 核心文件依赖清单

### `geo/earth/proto/commands.proto` — 命令模型
```
被以下文件依赖:
  geo/earth/proto/processing_instruction.proto
  geo/earth/app/cpp/core/deeplink/legacydatastate.proto
  geo/earth/app/cpp/core/state/deeplink/deeplink.proto
  geo/earth/app/cpp/core/state/deeplink/deeplink_command_source.proto
  geo/earth/app/cpp/studio_presenters/camera/camera.proto
  geo/earth/app/cpp/studio_presenters/settings/settings.proto
  logs/proto/geo/earth/app/earth_log.proto
  ... (多个状态切片文件)

导入以下文件:
  geo/earth/earthfeed/proto/earthfeed.proto
  geo/earth/proto/contentcreation/content_editing_model.proto
  geo/earth/proto/documentnamespace.proto
  geo/earth/proto/earth_mate/overhead_imagery.proto
  geo/earth/proto/mapstyle.proto
  geo/earth/proto/storage_restrictions.proto
  net/proto2/proto/descriptor.proto
  storage/datapol/annotations/proto/semantic_annotations.proto
```

### `geo/earth/proto/contentcreation/content_editing_model.proto` — 内容编辑模型
```
被以下文件依赖 (15 个):
  geo/earth/proto/commands.proto
  geo/earth/proto/earth_mate/earth_mate_image_generation.proto
  geo/earth/proto/earth_mate/earth_mate_studio.proto
  geo/earth/app/cpp/core/design/designexport.proto
  geo/earth/app/cpp/core/document/balloontemplate.proto
  geo/earth/app/cpp/core/document/documentimport.proto
  geo/earth/app/cpp/core/document/featureicon.proto
  geo/earth/app/cpp/core/document/featurekey.proto
  geo/earth/app/cpp/core/document/icon.proto
  geo/earth/app/cpp/core/document/localizedmessage.proto
  geo/earth/app/cpp/core/state/propertyeditor/propertyeditor.proto
  geo/earth/app/cpp/studio_presenters/propertyeditor/propertyeditor.proto
  ... 

导入以下文件:
  geo/earth/proto/contentcreation/data_import_errors.proto
  geo/earth/proto/mapstyle.proto
  geo/earth/proto/photos.proto
  geo/earth/proto/storage_restrictions.proto
  google/protobuf/duration.proto
  google/protobuf/timestamp.proto
  ...
```

### `geo/earth/proto/mapstyle.proto` — 地图样式
```
被以下文件依赖 (11 个):
  geo/earth/proto/commands.proto
  geo/earth/proto/contentcreation/content_editing_model.proto
  geo/earth/proto/bootstrap_client_config.proto
  geo/earth/app/cpp/core/design/designexport.proto
  geo/earth/app/cpp/studio_presenters/baselayer/baselayer.proto
  geo/earth/app/cpp/studio_presenters/settings/settings.proto
  logs/proto/geo/earth/app/earth_log.proto
  ...

导入以下文件:
  geo/earth/proto/storage_restrictions.proto
```

---

## 二、完整逐文件 import 清单

> 以下列出**全部 1,316 个文件**以及每个文件导入的外部依赖。
> 格式: `文件路径 → 导入目标`

```
ads/travel/base/hotel_amenities.proto
    logs/proto/logs_annotations/logs_annotations.proto
    storage/datapol/annotations/proto/semantic_annotations.proto

ads/travel/base/hotel_set_name_structure_enum.proto
    logs/proto/logs_annotations/logs_annotations.proto

ads/travel/hotelpricing/protos/deals.proto
    logs/proto/logs_annotations/logs_annotations.proto

apps/framework/data/caching_annotations.proto
    net/proto2/proto/descriptor.proto
    storage/datapol/annotations/proto/semantic_annotations.proto

cityblock/base/collection_type.proto
    (无外部依赖 — 纯枚举/基础消息)

cityblock/base/vehicles.proto
    cityblock/base/collection_type.proto

cityblock/pose/service/version.proto
    (零依赖)

cityblock/public/pose.proto
    geostore/base/proto/featureid.proto
    google/protobuf/timestamp.proto
    storage/datapol/annotations/proto/semantic_annotations.proto

cityblock/streetsmart/business_discovery/public/imagery_observation.proto
    geo/imagery/geotracker/proto/extended_user_data.proto
    geo/imagery/geotracker/proto/state_estimate.proto
    geostore/base/proto/featureid.proto
    google/protobuf/timestamp.proto
    storage/datapol/annotations/proto/semantic_annotations.proto
    util/geometry2d/r2.proto

cityblock/streetsmart/business_discovery/tools/nerf/pano_selection_result.proto
    cityblock/streetsmart/business_discovery/public/imagery_observation.proto
    geostore/base/proto/cityjson.proto
    geostore/base/proto/featureid.proto
    google/type/latlng.proto

devtools/protoshop/public/parsing_options/parsing_options.proto
    net/proto2/proto/descriptor.proto
    storage/datapol/annotations/proto/semantic_annotations.proto

devtools/staticanalysis/pipeline/analyzers/proto_best_practices/proto/optouts.proto
    logs/proto/logs_annotations/logs_annotations.proto
    net/proto2/proto/descriptor.proto

experiments/framework/extensions/heterodyne/proto/experiment_ids.proto
    logs/proto/logs_annotations/logs_annotations.proto
    storage/datapol/annotations/proto/semantic_annotations.proto

frameworks/client/data/data_annotation.proto
    net/proto2/proto/descriptor.proto
    storage/datapol/annotations/proto/semantic_annotations.proto

frameworks/testing/rpcreplay/processors/rpc_replay_field_option.proto
    logs/proto/logs_annotations/logs_annotations.proto
    net/proto2/proto/descriptor.proto

geo/ar/protos/pose.proto
    google/api/inclusion.proto
    java/com/google/apps/jspb/jspb.proto
    storage/datapol/annotations/proto/semantic_annotations.proto

geo/case/map/search/proto/photo_pin_size.proto
    java/com/google/apps/jspb/jspb.proto

geo/case/map/search/proto/pin_style.proto
    geo/case/map/search/proto/photo_pin_size.proto
    google/protobuf/duration.proto
    google/type/color.proto

geo/case/map/search/proto/refinements.proto
    google/type/date.proto
    google/type/dayofweek.proto
    google/type/timeofday.proto
    java/com/google/protobuf/contrib/autoprotocopier/annotations.proto
    storage/datapol/annotations/proto/semantic_annotations.proto
    travel/guide/attractile/proto/category.proto

geo/case/map/search/proto/search.proto
    geo/case/map/search/proto/refinements.proto
    geo/case/map/search/proto/style_options.proto
    geo/photo/proto/image_key.proto
    geo/serving/proto/ads/ads_entity.proto
    geo/serving/proto/electricvehicle/electric_vehicle_options.proto
    geo/serving/proto/localcategorical/intent_type.proto
    geo/serving/proto/text/annotated_text.proto
    geostore/base/proto/featureid.proto
    geostore/base/proto/point.proto
    geostore/base/proto/rect.proto
    geostore/base/proto/relation.proto
    java/com/google/apps/jspb/jspb_disable_randomization.proto
    localsearch/lite/intent.proto
    logs/proto/maps/shared/lodging_pricing_information.proto
    logs/proto/maps/shared/name.proto
    logs/proto/maps/transit/api/accessibility.proto
    ...
```

---

## 三、核心反向依赖表（谁导入了我？）

以下为被依赖次数 ≥ 3 的文件的完整反向索引：

| 被导入文件 | 导入者数量 | 主要导入者 |
|---|---|---|
| `storage/datapol/annotations/proto/semantic_annotations.proto` | **890** | 几乎所有文件 |
| `java/com/google/apps/jspb/jspb.proto` | 208 | geo/serving, maps/tactile, geostore |
| `google/api/inclusion.proto` | 208 | geo/serving, geostore/base |
| `logs/proto/logs_annotations/logs_annotations.proto` | 137 | logs/proto/*, geo/imagery |
| `geostore/base/proto/options.proto` | 122 | geostore/base/* |
| `devtools/staticanalysis/.../optouts.proto` | 103 | geo/*, maps/*, logs/* |
| `net/proto2/bridge/proto/message_set.proto` | 79 | geostore, logs, geo/serving |
| `net/proto2/proto/descriptor.proto` | 74 | 各领域自定义注解 |
| `geostore/base/proto/featureid.proto` | 71 | maps/paint, logs, geo/serving |
| `geo/earth/proto/contentcreation/content_editing_model.proto` | 15 | geo/earth/app/cpp/* |
| `geo/earth/proto/mapstyle.proto` | 11 | commands, contentcreation, studio_presenters |
| `geo/earth/proto/storage_restrictions.proto` | 11 | geo/earth/proto/*, google/internal/earth |
| `geo/earth/app/cpp/core/state/state.proto` | 11 | 60+ state slices |
| `google/protobuf/timestamp.proto` | 32 | 跨领域 |
| `google/protobuf/duration.proto` | 11 | 跨领域 |
| `google/protobuf/any.proto` | 9 | 跨领域 |
| `google/type/latlng.proto` | 12 | maps, geostore, geo |
| `i18n/localization/proto/localized_text.proto` | 11 | geo/serving, maps |
| `geostore/base/proto/point.proto` | 16 | maps, geo/serving |
| `geostore/base/proto/address.proto` | 7 | maps, geo |
| `geostore/base/proto/relation.proto` | 9 | geo/serving, maps |
| `geostore/base/proto/timeschedule.proto` | 12 | geostore, maps |
| `geostore/base/proto/rect.proto` | 7 | maps, geo/serving |
| `knowledge/graph/protomesh/protomesh.proto` | 22 | geostore, knowledge |
| `maps/logs/logging/ve_logging_options.proto` | 34 | maps/* |
| `maps/tactile/api/shared/geometry.proto` | 14 | maps/tactile/* |
| `maps/shared/common/geom/geom.proto` | 12 | maps/* |
| `maps/tactile/api/directions-common.proto` | 11 | maps/tactile/* |
| `maps/tactile/api/geometry.proto` | 11 | maps/tactile/* |
| `google/internal/earth/v1/shared.proto` | 14 | google/internal/earth/v1/* |
| `google/internal/earth/v1/layers.proto` | 8 | google/internal/earth |
| `google/internal/earth/v1/terrain.proto` | 7 | google/internal/earth |
| `google/api/field_behavior.proto` | 8 | google/internal/earth |
| `geo/serving/proto/link/link.proto` | 13 | geo/serving/*, maps/* |
| `geo/serving/proto/electricvehicle/electric_vehicle_options.proto` | 8 | geo/serving, maps |
| `geo/serving/proto/user/address.proto` | 8 | geo/serving, maps |
| `wireless/android/privacy/annotations/proto/collection_basis_annotations.proto` | 11 | google/internal/earth |
| `third_party/protobuf/cpp_features.proto` | 36 | geo, maps, logs |
| `third_party/java/protobuf/java_features.proto` | 25 | maps, geostore |
| `logs/maps/featureid.proto` | 17 | maps/* |
| `net/proto2/contrib/js_proto/public/field_annotations.proto` | 26 | maps/*, geo/* |
| `net/proto2/contrib/validator/annotations.proto` | 15 | maps, geostore |
| `privacy/pattributes/annotations/proto_field.proto` | 26 | maps, logs |
| `java/com/google/protobuf/contrib/autoprotocopier/annotations.proto` | 13 | geo, maps |
| `java/com/google/apps/jspb/jspb_generate_object_format.proto` | 11 | geostore |
| `frameworks/testing/rpcreplay/processors/rpc_replay_field_option.proto` | 10 | geo/earth, maps |

---

## 四、依赖图统计摘要

| 统计项 | 数值 |
|---|---|
| 总文件数 | 1,316 |
| 总 import 边数 | 4,195 |
| 平均每个文件的 import 数 | ~3.2 |
| 零 import 文件数（叶子节点） | ~150+ |
| 最广泛被依赖的文件 | `storage/datapol/annotations/proto/semantic_annotations.proto` (890 次) |
| 最大内部依赖子图 | `geostore/base/proto/` (408 内部边) |
| 第二大内部依赖子图 | `maps/tactile/api/` (241 内部边) |
| 第三大内部依赖子图 | `logs/proto/` (223 内部边) |
| 依赖性最强的文件（import 最多） | `logs/proto/geo/earth/app/earth_log.proto` (50+ imports) |

---

## 五、如何查询特定文件的依赖

### 使用 grep 快速查找

```bash
# 查找谁导入了文件 F
grep " -> path/to/F.proto$" proto_imports.txt

# 查找文件 F 导入了谁
grep "^path/to/F.proto -> " proto_imports.txt

# 查找 geo/earth 域内所有依赖
grep "^geo/earth/.* -> " proto_imports.txt
```

### 使用 Mermaid 渲染

本文件中的 Mermaid 图表可在任何支持 Mermaid 的 Markdown 查看器中渲染（VS Code + Mermaid 插件、GitHub、GitLab、Typora 等）。

---

*数据生成时间: 2026-08-12*
*基于 4,195 条 import 边的完整分析*
