# Earth Web 流量分析指南

> **目标**：使用本仓库中的 proto 定义，捕获并解码 `https://earth.google.com/web/` 的真实 HTTP 流量。

## 前提条件

- Chrome/Chromium 浏览器
- Node.js 18+，已安装 `tsx`（`npm install -g tsx`）
- 本仓库已克隆到本地

---

## 第一步：打开 Chrome DevTools

1. 访问 **https://earth.google.com/web/**
2. 打开 DevTools：`F12` 或 `Ctrl+Shift+I`（Windows）/ `Cmd+Opt+I`（Mac）
3. 进入 **Network**（网络）标签页
4. 勾选 **"Preserve log"**（保留日志），确保页面内导航时请求不丢失
5. 点击 **Fetch/XHR** 过滤按钮，只看 API 调用
6. 测试前先清空日志：点击 🚫（清除）按钮

---

## 第二步：按 URL 模式识别关键请求

基于 1,316 个 proto 文件的分析，以下是需要关注的请求模式：

| 功能 | 可能的 URL 模式 | Proto 消息类型 | 格式 |
|---|---|---|---|
| **启动配置** | `config`, `bootstrap` | `BootstrapClientConfig` | JSPB JSON |
| **搜索自动补全** | `search/suggest`, `autocomplete` | 搜索建议 proto | JSPB JSON |
| **搜索结果 / 知识卡片** | `search`, `knowledge`, `entity` | `RenderableEntity` | JSPB JSON |
| **要素 CRUD**（创建/编辑/删除） | `document`, `feature`, `cloudproject` | `content_editing_model` | JSPB JSON |
| **地图影像瓦片** | `tiles`, `kh/` | `MapStyle` + 二进制瓦片 | 二进制（JPEG/PNG/WebP） |
| **3D 地形 / 高程** | `terrain`, `elevation` | elevation proto | 二进制（quantized mesh） |
| **3D 建筑**（glTF / 3D Tiles） | `3d`, `buildings` | building proto | 二进制（glTF/3D Tiles） |
| **Voyager / Earth Feed** | `earthfeed`, `voyager`, `feed` | `EarthFeedItem` | JSPB JSON |
| **Earth Mate AI 聊天** | `earthmate`, `chat`, `ai` | earth_mate proto | JSPB JSON |
| **分析 / 日志** | `log`, `stats`, `analytics` | `earth_log`（89 种事件类型） | JSPB JSON |
| **用户状态 / 设置** | `state`, `settings`, `preferences` | state/*.proto（60+ 切片） | JSPB JSON |
| **命令**（客户端发送） | `command`, `rpc` | `Command`（34 种，详见下文） | JSPB JSON |
| **KML 导入/导出** | `kml`, `import`, `export` | KML 文档 proto | JSPB JSON |
| **图像生成** | `imagegen`, `image` | 图像生成器 proto | JSPB JSON |
| **设计 / 太阳能 / 分析** | `design`, `solar`, `analysis` | design/analysis proto | JSPB JSON |
| **街景元数据** | `streetview`, `photo`, `pano` | photo/meta proto | 二进制或 JSPB JSON |

### 34 个用户命令（commands.proto）

Earth Web 中的每个用户操作都以 `Command` 消息的形式发送（oneof 包含以下变体）：

| # | 命令 | 触发方式 |
|---|---|---|
| 1 | `ClearSearchHistory` | 点击清除搜索历史 |
| 2 | `OpenSearchHistory` | 打开搜索历史面板 |
| 3 | `OpenVoyagerGrid` | [已废弃] 浏览 Voyager |
| 4 | `OpenVoyagerStory` | [已废弃] 打开故事 |
| 5 | `PerformSearch` | 在搜索框中输入 + 回车 |
| 6 | `OpenFeelingLuckyCard` | 点击"手气不错" |
| 7 | `OpenKnowledgeCard` | 点击地图上的地点 |
| 8 | `FlyToCamera` | 点击搜索结果 / 深度链接 |
| 9 | `OpenCloudProject` | 打开已保存的项目 |
| 10 | `CreateCloudProject` | 创建新项目 |
| 11 | `EnterTimeMachine` | 进入历史影像 |
| 12 | `OpenKmlDocument` | 通过 URL 打开 KML |
| 13 | `EnterTimelapse` | 切换延时模式 |
| 14 | `CreatePointPlacemark` | 点击"添加地标" |
| 15 | `EnterStreetView` | 将小人拖到地图上 |
| 16 | `ToggleLayer` | 在图层面板中切换任意图层 |
| 17 | `CreateFeature` | 在地图上绘制多边形/线条 |
| 18 | `OpenKmlDocumentFromContent` | 粘贴 KML 内容 |
| 19 | `DeleteFeature` | 删除要素 |
| 20 | `EditFeature` | 编辑要素属性 |
| 21 | `OpenProjectByKey` | 通过数字键打开项目 |
| 22 | `SetHomescreenVisibility` | 打开/关闭 Voyager 首页 |
| 23 | `SetBasemapStyle` | 更改地图样式（卫星/路线图/地形） |
| 24 | `CreateFeaturesInFolder` | 在文件夹中批量创建 |
| 25 | `RenderDesign` | [已废弃] |
| 26 | `ViewDesign` | 查看设计详情 |
| 27 | `CreateDesigns` | 开始太阳能/新建建筑 |
| 28 | `ToggleAvailableLayersUi` | 打开数据目录 |
| 29 | `PreviewDataLayer` | 预览数据图层 |
| 30 | `ViewRateCard` | 查看价格卡片 |
| 31 | `OpenEarthMateChat` | 打开 AI Earth Mate |
| 32 | `ShowLayerCardDetails` | 显示图层详情 |
| 33 | `ViewOnDemandAnalysis` | 地形分析（坡度/坡向等） |
| 34 | `OpenImageGenerator` | 打开 AI 图像生成器 |

命令以批处理形式发送：`{ commands: [{ performSearch: {...} }, ...] }`。

---

## 第三步：复制请求/响应数据

对于每个感兴趣的请求：

### 方法 A：复制为 cURL（最适合重放）
1. 在 DevTools 中右键点击请求
2. **复制 → 复制为 cURL**
3. 粘贴到终端中重放完全相同的请求
4. 将响应体保存到文件：`curl ... > response.json`

### 方法 B：直接保存响应
1. 右键点击请求
2. **复制 → 复制响应**
3. 粘贴到文件：`captured-response.json`

### 方法 C：导出整个会话为 HAR
1. 右键点击任意请求
2. **将所有内容保存为 HAR 文件**
3. 使用解码器工具：`npx tsx src/index.ts batch --har earth-traffic.har`

---

## 第四步：确定数据格式

检查 **Content-Type** 响应头：

| Content-Type | 格式 | 解码方式 |
|---|---|---|
| `application/json` | **JSPB JSON** — proto 字段以 camelCase JSON 形式呈现 | `decodeJspbJson()` — 解析 JSON，映射 camelCase → snake_case，解析枚举字符串 |
| `application/x-protobuf` | **二进制 protobuf** | `decodeBinary()` — 使用 protobuf 反序列化器 |
| `application/octet-stream` | 二进制数据（瓦片、地形、glTF） | 原始字节 — 无法 proto 解码 |
| `image/jpeg`、`image/png`、`image/webp` | 地图瓦片图片 | 原始图片 — 无法 proto 解码 |

### JSPB JSON 规范

Earth Web 客户端使用 **JSPB**（Java Server Protobufs）：

| Proto | JSPB JSON | 备注 |
|---|---|---|
| `snake_case` 字段名 | `camelCase` 键名 | `look_at` → `lookAt` |
| 枚举值（整数） | 枚举名称（字符串） | `1` → `"CAMERA_ANIMATION_TELEPORT"` |
| `oneof` 字段 | 仅存在活动变体 | `{ "lookAt": {...} }` 而非同时包含两个 |
| 可选/缺失字段 | 从 JSON 中省略 | 无 `null`，无零默认值 |
| `repeated` 字段 | JSON 数组 | `[{...}, {...}]` |
| 嵌套消息 | 嵌套 JSON 对象 | `{ "lookAt": { "lat": ..., "lng": ... } }` |

#### 示例：Proto → JSPB

Proto（`commands.proto` — `FlyToCamera.LookAt`）：
```protobuf
message LookAt {
    optional double latitude = 1;
    optional double longitude = 2;
    optional double altitude = 3;
    optional double range = 4;
    optional double heading = 5;
    optional double tilt = 6;
}
```

JSPB JSON（实际传输格式）：
```json
{
  "lookAt": {
    "latitude": 40.7128,
    "longitude": -74.006,
    "altitude": 1000,
    "range": 5000,
    "heading": 45,
    "tilt": 30
  },
  "cameraAnimation": "CAMERA_ANIMATION_FLY"
}
```

---

## 第五步：将响应匹配到 Proto 类型

查看字段名称和结构来确定对应的 proto 消息：

### 快速字段匹配指南

| 响应包含字段... | Proto 消息类型 |
|---|---|
| `title`、`description`、`image`、`latLon`、`addressLine` | `RenderableEntity`（知识卡片） |
| `earthServiceConfig`、`serviceConfig` | `BootstrapClientConfig` |
| `projection`、`imagery`、`threeDFeatures`、`showClouds` | `MapStyle` |
| `performSearch`、`flyToCamera`、`toggleLayer`、`openKnowledgeCard` | `Command`（oneof 包装器） |
| `lookAt` 或 `lookFrom` | `FlyToCamera` |
| `featureId`、`featureProperties`、`featureStyle` | `CreateFeature` / `EditFeature` |
| `fid` 或 `mid` | `OpenKnowledgeCard` 或 `RenderableEntity` |
| `latitude`、`longitude`、`altitude`、`heading`、`tilt` | `LookAt` / `LookFrom` / `Location` + `Rotation` |
| `layerType`、`enabled` | `ToggleLayer` |
| `projectId`、`documentNamespace` | `OpenCloudProject` |
| `date`、`timelapseEnabled` | `EnterTimeMachine` |

### 自动匹配：

使用解码器工具的 `--auto` 标志：
```bash
npx tsx src/index.ts decode --file captured-response.json --auto
```

这会尝试每种已知的 proto 类型，根据字段名重叠程度评分，返回最佳匹配及置信度分数。

---

## 第六步：使用流量解码器工具解码

```bash
cd devtools/traffic-decoder

# 安装依赖
npm install

# 将捕获的响应解码为指定类型
npx tsx src/index.ts decode --file captured-response.json --type RenderableEntity

# 自动检测类型
npx tsx src/index.ts decode --file captured-response.json --auto

# 转换为 GeoJSON
npx tsx src/index.ts convert --file captured-response.json --type Placemark --format geojson

# 转换为 Schema.org JSON-LD
npx tsx src/index.ts convert --file captured-response.json --type RenderableEntity --format schema-org

# 批量处理 HAR 文件
npx tsx src/index.ts batch --har earth-traffic.har

# 解码二进制 proto 文件
npx tsx src/index.ts decode --file response.bin --type MapStyle --binary
```

---

## 第七步：使用浏览器拦截器（实时捕获）

在浏览过程中实时拦截：

1. 在文本编辑器中打开 `devtools/traffic-decoder/earth-traffic-intercept.js`
2. 复制整个脚本
3. 在 `earth.google.com/web/` 上打开 Chrome DevTools → **Console**（控制台）标签页
4. 粘贴并按回车
5. 正常使用 Earth —— 所有 XHR/fetch 请求都会以彩色输出记录
6. 在控制台中运行 `exportTraffic()` 获取所有捕获流量的 JSON 导出
7. 运行 `clearTraffic()` 重置

---

## 常见工作流

### 工作流 1：捕获搜索结果

1. 打开 DevTools → Network → 过滤 Fetch/XHR → 清除
2. 在搜索框中输入"埃菲尔铁塔" → 按回车
3. 在请求体中查找 `performSearch`（点击请求，查看"Payload"）
4. 找到包含 `title: "埃菲尔铁塔"`、`latLon`、`description` 的响应
5. 复制响应 → 保存为 `eiffel-tower.json`
6. 解码：
   ```bash
   npx tsx src/index.ts decode --file eiffel-tower.json --auto
   ```
7. 输出应将其识别为 `RenderableEntity`，具有高置信度

### 工作流 2：捕获知识卡片

1. 点击地图上的某个地点（例如城市、地标或商家）
2. 找到 `openKnowledgeCard` 请求
3. 找到包含 `title`、`description[]`、`image`、`fact[]`、`addressLine[]` 的响应
4. 保存并以 `RenderableEntity` 类型解码

### 工作流 3：捕获 FlyTo（导航）

1. 点击搜索结果
2. 在 Command 批处理请求中找到 `flyToCamera`
3. `lookAt` 包含 latitude、longitude、altitude、range、heading、tilt
4. 以 `FlyToCamera` 类型解码

### 工作流 4：捕获地图样式更改

1. 点击"地图样式"按钮 → 从卫星图切换到路线图
2. 找到 `setBasemapStyle` 请求
3. 解码：`{ imagery: "IMAGERY_NORMAL_ROADMAP" }`

---

## 技巧

- **操作间清除**：每次测试前清除 Network 标签页以隔离请求
- **Preserve log 开启**：Earth 内部导航时保留来自之前页面的请求
- **按域名过滤**：添加 `-domain:googleapis.com` 过滤掉无关的 Google API 调用
- **查看 Initiator**：点击请求并查看"Initiator"标签页，了解是哪个 JavaScript 触发的
- **Response 标签页 vs Preview 标签页**："Response"显示原始文本；"Preview"显示格式化 JSON
- **HAR 导出**：将整个会话导出为 HAR，使用 `batch --har` 进行自动处理
