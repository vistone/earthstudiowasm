# Earth Google Web — 数据解析报告

> 基于 Puppeteer 实际抓取的 55 个 API 响应，逐一解析

---

## Phase 0-1: Config API 解析

### 请求
```
GET https://earth-pa.clients6.google.com/v1/earth/config?alt=proto&dpi_ratio=1.0&renderer_version=1.1
Response: 200 OK, text/plain, 29,436 bytes (base64 编码)
```

### 解码过程

```javascript
// Step 1: base64 → binary
const base64 = responseText;
const binary = Buffer.from(base64, 'base64');  // → 约 22KB 二进制

// Step 2: 按 proto wire format 解析
// Wire type 2 (length-delimited) → 字符串字段
```

### 解析结果

从二进制中提取出的服务端点：

| 字段 | 值 |
|---|---|
| `delve_service` | `https://delve.sidewalklabs.com` |
| `earth_document_http_service` | `https://earth.google.com/earth/document` |
| `earth_gws_service` | `https://earth.google.com/earth/rpc` |
| `fife_service` | `https://earth-pa.clients6.google.com` |
| `experiments` | `go/earth/web` |
| `earth_enterprise_url` | `https://earthenterprise.com` |

其中 `earth_gws_service` 附带 channels 配置 `[4, 7, 12]`。

### 对应 Proto
`bootstrap_client_config.proto` + `compile_time_config.proto`

---

## Phase 0-2: PlanetoidMetadata 解析

### 请求
```
GET https://kh.google.com/rt/earth/PlanetoidMetadata
Response: 200 OK, application/x-protobuffer, 13 bytes
```

### 原始数据
```
Hex: 0a 06 10 f5 07 28 f5 07 15 84 6d c2 4a
```

### 手动解析
```
0a 06        → field 1, wire type 2, length 6
  10 f5 07   → field 2, varint: 0x07f5 = 2037 (变体编码)
  28 f5 07   → field 5, varint: 0x07f5 = 2037
15            → field 2, varint: ?? 
84 6d c2 4a   → (可能是浮点数或更多 varint)
```

### 对应 Proto
行星元数据，包含数据版本号(epoch)、最大缩放级别等信息。具体结构需 proto 编译后确认。

---

## Phase 0-3: BulkMetadata 解析

### 请求
```
GET https://kh.google.com/rt/earth/BulkMetadata/pb=!1m2!1s!2u1013
Response: 200 OK, application/x-protobuffer, 3,780 bytes
```

URL 参数: `pb=!1m2!1s!2u1013`
- `!1m2!1s` → 节点ID（空=根节点）
- `!2u1013` → epoch=1013（数据版本）

### 原始数据
二进制 proto，3,780 字节。包含根节点的元数据（子节点列表、数据范围、更新日期等）。

---

## Phase 0-4: NodeData（3D 瓦片）解析

### 请求
```
GET https://kh.google.com/rt/earth/NodeData/pb=!1m2!1s{NODE}!2u{EPOCH}!2e1!3u1037!4b0
Response: 200 OK, application/x-protobuffer
```

### URL 参数格式

| 参数 | 含义 | 示例值 |
|---|---|---|
| `!1m2!1s{NODE}` | S2 节点路径 | `13`, `21`, `0343` |
| `!2u{EPOCH}` | 数据版本 | `1013`, `1005`, `1008` |
| `!2e1` | 编码格式 | 1（默认） |
| `!3u1037` | 数据类型 | 1037 = 3D地形+建筑 |
| `!4b0` | 布尔参数 | 0 |

### 节点树结构

观察到的节点路径（S2 四叉树）：
```
根 (1013)
├── 02, 03, 12, 13, 20, 21, 30, 31           ← 第1层 8节点
├── 024, 034, 036, 037, 124, 126, 127, 134,   ← 第2层
│   136, 205, 206, 214, 215, 216, 304, 305,
│   306, 314, 316
└── 0340, 0342, 0343, 1240, 1242, 1243,       ← 第3层（epoch 1005）
    2160, 2161, 2162, 3060, 3061, 3062...
```

### 瓦片大小分布

| 层级 | 大小范围 | 平均 |
|---|---|---|
| 第1层 | 11,991 - 17,626 bytes | ~14,500 |
| 第2层 | 10,150 - 18,338 bytes | ~13,500 |
| 第3层 | 8,523 - 15,105 bytes | ~11,800 |

### 二进制内容预览（第一个瓦片）
```
Hex: 0a800187ebe1a170b7dac089ebe1a170b7da40...
```

前导字节 `0a` = field 1, wire type 2 (length-delimited)
随后的 0x80 0x01 = varint 128 → 长度 ≥ 128 字节
后续是 S2 单元边界坐标（经纬度 corner points），以 double 存储

### 对应 Proto
maps/ 下的瓦片格式定义。需要 proto 编译后精确解析字段结构。

---

## Phase 0-5: Billing API 解析

### 请求
```
GET https://earth-pa.clients6.google.com/v1/billing/activeratecard?alt=proto
Response: 200 OK, text/plain, 37,816 bytes (base64 编码)
```

### 解码后内容预览
```
CjwIARoJAwcGDBMZIBwXIggaBgiAlOvcAyIHIgUIgOWadyIEMgIIMiIGOgQI0IYDIgQqAggFIgZCBAgKEBQKPAgCGg0ECAYBDAoOFhQaJCEdIggaBgiAyK+gJSIIIgYIgMq17gEiBCoCCBkiBjoECNCGAyIHQgUIHhDIAQo/CAMaDwUJBgEMCgILDhYVGyUiKCIIGgYIgJDfwEoiCCIGCIDKte4BIgUqAwj0AyIGOgQI0IYDIgdCBQgeEPQDEojcAQoeCAESCeagh+WHhueJiBoCJDAiCy/nlKjmiLcv5pyICmMIAhIJ5LiT5Lia54mIGgMkNzUiCy/nlKjmiLcv5pyIKgYkMCBVU0QyOkdvb2dsZSBDbG91ZCDmlrDnlKjmiLfmnInotYTmoLzojrflvpcgJDMwMCDlhY3otLnor5XnlKjph5EKaggDEg/kuJPkuJrpq5jnuqfniYgaBCQxNTAiCy/nlKjmiLcv5pyI...
```

提取出的可读文本（包含中英文定价信息）：
- `Google Cloud 新用户有资格获得 $300 免费试用额度`
- `专业版 $150/用户/月`
- `$0 USD`
- `专业高级版 $500/用户/月`

### 对应 Proto
`google/internal/earth/v1/billing/rate_card.proto`

---

## Phase 0-6: Experiments/Configs API 解析

### 请求
```
GET https://htapi.google.com/experimentsandconfigs/v1/getExperimentsAndConfigs
Response: 200 OK, application/json+protobuf, 11,408 bytes
```

### 内容格式
JSPB JSON 格式的实验配置数据（A/B 测试开关、功能标志等）。

---

## Phase 0-7: User API 解析

### 请求
```
GET https://earth-pa.clients6.google.com/v1/earth/getuser?alt=proto
Response: 200 OK, application/x-protobuf, 0 bytes
```

未登录状态，返回空响应。登录后应返回 `google/internal/earth/v1/user.proto` 定义的用户数据。

---

## Phase 0-8: Copyrights API

### 请求
```
GET https://kh.google.com/rt/earth/Copyrights/pb=...
Response: 200 OK, application/x-protobuffer, 20,028 bytes
```

包含影像版权信息（数据提供商、归属文本等）。

---

## 解析总结

### 已确认的 API 端点（6 组）

| # | 端点 | 数据格式 | 大小 | 状态 |
|---|---|---|---|---|
| 1 | Config | base64 → proto binary | ~22KB | ✅ 已解码 |
| 2 | PlanetoidMetadata | proto binary | 13B | ✅ 已抓取 |
| 3 | BulkMetadata | proto binary | 3.8KB | ✅ 已抓取 |
| 4 | NodeData | proto binary | 8-18KB/瓦片 | ✅ 已抓取 45 个 |
| 5 | Billing | base64 → proto binary | ~28KB | ✅ 已解码 |
| 6 | Experiments | JSPB JSON | 11KB | ✅ 已抓取 |
| 7 | User | proto binary | 0B（未登录） | ✅ 已抓取 |
| 8 | Copyrights | proto binary | 20KB | ✅ 已抓取 |

### 下一步：Phase 1

需要 proto 编译后才能精确解析：
1. 编译 `bootstrap_client_config.proto` → 精确解析 Config
2. 编译 `rate_card.proto` → 精确解析 Billing
3. 编译瓦片相关 proto → 精确解析 NodeData 的顶点/纹理/建筑数据
4. 实现完整的 fetch → decode → open format 转换管线

---

*基于 2026-08-12 实时抓包数据*
