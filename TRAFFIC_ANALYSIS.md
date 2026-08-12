# Earth Google Web — 真实流量分析报告

> **分析时间**: 2026-08-12 | **分析工具**: Puppeteer headless browser
> **目标**: https://earth.google.com/web/?mt=1 (WASM Multi-Threaded)

---

## 一、发现的全部 API 端点

通过 Puppeteer 无头浏览器实际加载 Earth Web WASM 版本，拦截到以下 API 请求：

### 1.1 核心 API 端点（从 Bootstrap Config 解码）

Config 端点 `earth-pa.clients6.google.com/v1/earth/config?alt=proto` 返回 base64 编码的 proto，解码后得到：

| 服务名 | URL | 用途 |
|---|---|---|
| `delve_service` | `https://delve.sidewalklabs.com` | Delve 城市设计服务（Sidewalk Labs） |
| `earth_document_http_service` | `https://earth.google.com/earth/document` | **文档 CRUD**（创建/读取/更新/删除项目） |
| `earth_gws_service` | `https://earth.google.com/earth/rpc` | **主 RPC 端点**（搜索、命令执行、知识卡片等） |
| `fife_service` | `https://earth-pa.clients6.google.com` | **照片/街景服务**（FIFE = Foto Image FrontEnd） |
| `experiments` | `go/earth/web` | A/B 实验配置 |
| `earth_enterprise_url` | `https://earthenterprise.com` | 企业版入口 |

### 1.2 地图瓦片端点

| URL 模式 | Content-Type | 说明 |
|---|---|---|
| `kh.google.com/rt/earth/PlanetoidMetadata` | `application/x-protobuffer` | 行星元数据（瓦片索引） |
| `kh.google.com/rt/earth/BulkMetadata/pb=...` | `application/x-protobuffer` | 批量元数据 |
| `kh.google.com/rt/earth/NodeData/pb=!1m2!1s{NODE}!2u{EPOCH}!2e1!3u1037!4b0` | `application/x-protobuffer` | **3D 地形/建筑节点数据**（每瓦片一个请求） |
| `mw1.gstatic.com/mw-weather/clouds-cubemap/root.json` | `application/json` | 云层立方体贴图索引 |
| `mw1.gstatic.com/mw-weather/static/stars-cubemap-v2/root.json` | `application/json` | 星空立方体贴图索引 |

### 1.3 其他端点

| URL | 用途 |
|---|---|
| `earth-pa.clients6.google.com/v1/earth/getuser?alt=proto` | 用户信息（登录后返回） |
| `earth-pa.clients6.google.com/v1/billing/activeratecard?alt=proto` | 当前费率卡 |
| `htapi.google.com/experimentsandconfigs/v1/getExperimentsAndConfigs` | 实验开关/A/B 测试配置 |
| `firebase.googleapis.com/v1alpha/projects/.../webConfig` | Firebase 配置 |
| `firebaseinstallations.googleapis.com/v1/projects/earth-10-prod/installations` | Firebase 安装注册 |
| `accounts.google.com/ListAccounts` | Google 账号检测 |
| `earth.google.com/balloon_components/base/.../card_template.kml` | KML 气泡模板 |

---

## 二、API 请求/响应格式分析

### 2.1 Config API（启动配置）

```
请求: GET https://earth-pa.clients6.google.com/v1/earth/config?alt=proto&dpi_ratio=1.0&renderer_version=1.1
响应: Content-Type: text/plain
      内容: base64 编码的 protobuf 二进制数据
```

解码后的字段（对应 `bootstrap_client_config.proto`）:
```
delve_service → "https://delve.sidewalklabs.com"
earth_document_http_service → "https://earth.google.com/earth/document"
earth_gws_service → "https://earth.google.com/earth/rpc"  [channels: 4, 7, 12]
fife_service → "https://earth-pa.clients6.google.com"
experiments → "go/earth/web"
earth_enterprise_url → "https://earthenterprise.com"
```

### 2.2 地图瓦片 API

```
请求: GET https://kh.google.com/rt/earth/NodeData/pb=!1m2!1s{NODE_ID}!2u{EPOCH}!2e1!3u1037!4b0
响应: Content-Type: application/x-protobuffer
      内容: 二进制 protobuf（地形网格 + 影像纹理数据）
```

URL 参数解析:
- `!1m2!1s{NODE_ID}` → S2 单元节点 ID
- `!2u{EPOCH}` → 数据版本/时间戳
- `!2e1` → 编码格式（1 = 默认）
- `!3u1037` → 数据类型（1037 = 3D 地形+建筑）
- `!4b0` → 布尔参数

观察到的节点 ID 模式（树结构）:
```
Node 1013 → 子节点: 21, 20, 02, 13, 12, 03, 31, 30, 034, 316, 216, 124, 306...
Node 1005 → 子节点: 0343, 1242, 2161, 3060, 2160...
```

### 2.3 Earth RPC API（主功能入口）

```
主端点: https://earth.google.com/earth/rpc
支持的 channels: 4 (搜索), 7 (知识), 12 (命令)
```

这个端点对应的 proto 是 `commands.proto` 中的 `Commands` 消息。
客户端将用户操作序列化为 `Commands` proto，通过 HTTP POST 发送到 `/earth/rpc`。

### 2.4 Document API（文档存储）

```
端点: https://earth.google.com/earth/document
```

对应 `content_editing_model.proto` 和 `document/` 下的 proto。
客户端通过此端点进行 Feature CRUD 和 KML 导入导出。

---

## 三、Proto 文件到 API 端点的映射

| Proto 文件 | 对应 API 端点 | HTTP Method | 数据流向 |
|---|---|---|---|
| `bootstrap_client_config.proto` | `earth-pa.../v1/earth/config` | GET | Server→Client |
| `commands.proto` | `earth.google.com/earth/rpc` | POST | Client→Server |
| `renderable-entity.proto` | `earth.google.com/earth/rpc` | POST response | Server→Client |
| `content_editing_model.proto` | `earth.google.com/earth/document` | POST/PUT/DELETE | 双向 |
| `earth_log.proto` | `earth.google.com/earth/rpc` (channel?) | POST | Client→Server |
| `google/internal/earth/v1/user.proto` | `earth-pa.../v1/earth/getuser` | GET | Server→Client |
| `google/internal/earth/v1/billing/rate_card.proto` | `earth-pa.../v1/billing/activeratecard` | GET | Server→Client |
| 瓦片相关 (maps/*) | `kh.google.com/rt/earth/NodeData` | GET | Server→Client |
| 瓦片元数据 | `kh.google.com/rt/earth/PlanetoidMetadata` | GET | Server→Client |

---

## 四、数据格式

### 4.1 Config API → `text/plain` (base64 proto)

```javascript
// 解码方式
const base64 = responseText;
const binary = Buffer.from(base64, 'base64');
// binary 是标准 protobuf 二进制格式
const config = BootstrapClientConfig.fromBinary(binary);
```

### 4.2 Earth RPC → `application/x-protobuf` 或 `application/json+protobuf`

```javascript
// 二进制 proto
const command = Commands.fromBinary(binaryBody);

// JSPB JSON
const command = Commands.fromJson(JSON.parse(jsonBody));
```

### 4.3 地图瓦片 → `application/x-protobuffer`

```javascript
// 二进制 proto（含地形网格 + 纹理引用）
const nodeData = NodeData.fromBinary(binaryBody);
// nodeData 包含:
// - 顶点数据 (terrain mesh)
// - 纹理 URL (imagery tiles)
// - 建筑模型引用 (3D buildings)
```

---

## 五、关键发现

### 5.1 WASM 版本信息
```
版本路径: /static/multi-threaded/versions/20260717_1143_RC01/
构建日期: 2026-07-17
构建类型: RC01 (Release Candidate)
线程模式: Multi-Threaded (via Web Workers + SharedArrayBuffer)
```

### 5.2 Firebase 集成
```
项目: earth-10-prod
App ID: 1:803760840513:web:c731a2b451e3e1ebde19dc
用途: Analytics (G-3R2QCKWMJR), Cloud Messaging, 崩溃报告
```

### 5.3 KML 模板
```
URL: earth.google.com/balloon_components/base/1.1.0.0/card_template.kml
用途: 知识卡片的气泡渲染模板
```

### 5.4 天气/星空
```
云层: mw1.gstatic.com/mw-weather/clouds-cubemap/
星空: mw1.gstatic.com/mw-weather/static/stars-cubemap-v2/
```

---

## 六、下一步：构建数据层

基于以上分析，数据层实现顺序：

### Phase 0: Config 解码
```typescript
// 1. 请求 config
const configResp = await fetch('https://earth-pa.clients6.google.com/v1/earth/config?alt=proto');
const configBase64 = await configResp.text();
const configBinary = Buffer.from(configBase64, 'base64');

// 2. 用 proto 解码
const config = BootstrapClientConfig.fromBinary(configBinary);
// → { delve_service, earth_document_http_service, earth_gws_service, fife_service, experiments }

// 3. 保存端点地址供后续使用
```

### Phase 1: 地图瓦片抓取
```typescript
// 1. 获取行星元数据
const metaResp = await fetch('https://kh.google.com/rt/earth/PlanetoidMetadata');
const metadata = PlanetoidMetadata.fromBinary(await metaResp.arrayBuffer());

// 2. 根据相机位置计算需要的瓦片节点
// 3. 请求每个 NodeData
// 4. 解码为 3D 网格 + 纹理数据
```

### Phase 2: RPC 命令执行
```typescript
// 构造搜索命令
const cmd = Commands.create({
  commandType: { oneofKind: 'performSearch', performSearch: { query: 'Eiffel Tower' } }
});

// 发送到 Earth RPC
const rpcResp = await fetch(config.earth_gws_service, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-protobuf' },
  body: Commands.toBinary(cmd)
});

// 解析响应
const result = RenderableEntity.fromBinary(await rpcResp.arrayBuffer());
```

---

*分析基于真实抓包数据，所有 URL 和格式均来自 earth.google.com/web/ 的实际请求。*
