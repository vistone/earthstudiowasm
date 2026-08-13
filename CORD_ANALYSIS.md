# CORD 编码研究

> 基于 maps/paint/proto/client-vector-tile-serialization.proto 的权威定义

---

## 1. CORD 是什么

`ctype = CORD` 是 protobuf 的字段选项，出现在 `maps/paint/proto/client-vector-tile.proto` 中：

```protobuf
message LineRenderOp {
    optional bytes vertex_data = 1 [ctype = CORD];
    ...
}
message PolyPolyline {
    optional bytes vertex_data = 1 [ctype = CORD];
    ...
}
```

**关键结论**: `ctype = CORD` 是 C++ 的内存存储优化（使用 `absl::Cord` 而非 `std::string`），**不改变 wire format**。线上传输的 `vertex_data` 就是普通 bytes，内部是坐标压缩数据。

---

## 2. 真正的坐标编码

坐标压缩由 `TileOptions` 的两个枚举决定：

```protobuf
message TileOptions {
    optional VertexEncoding vertex_encoding = 1;
    optional VertexResolution vertex_resolution = 2;
    optional Line3DEncoding line_3d_encoding = 3 [default = DRACO];
}

enum VertexEncoding {
    ENCODING_UNKNOWN = 0;
    ENCODING_SEQUENTIAL_VARINT = 1;   // 顺序 varint
    ENCODING_SEQUENTIAL_FIXED16 = 2;  // 顺序固定16位
    ENCODING_DELTA_VARINT = 3;        // 增量 varint（zigzag）
}

enum VertexResolution {
    RESOLUTION_4TH_PIXEL = 2;    // 1/4 像素
    RESOLUTION_8TH_PIXEL = 3;    // 1/8 像素
    RESOLUTION_16TH_PIXEL = 1;   // 1/16 像素
    RESOLUTION_32ND_PIXEL = 4;   // 1/32 像素
    ... 一直到 RESOLUTION_4MTH_PIXEL = 21 (1/4百万像素)
}
```

---

## 3. 三种编码算法

### 3.1 ENCODING_SEQUENTIAL_VARINT (1)

```
每个坐标作为 varint 顺序存储
坐标值 = varint 原始值 / resolution_divisor
```

### 3.2 ENCODING_SEQUENTIAL_FIXED16 (2)

```
每个坐标作为 int16 顺序存储
坐标值 = int16 值 / resolution_divisor
```

### 3.3 ENCODING_DELTA_VARINT (3)

```
每个坐标是 zigzag 编码的 varint 增量
实际值 = 前一个值 + zigzag_decode(varint)
最终坐标 = 实际值 / resolution_divisor
```

---

## 4. 解码流程

```
ClientVectorTile (812 bytes)
    ↓ 跳过外层 wrapper (field 1, 809 bytes)
    ↓ 解析 tile_options (field 2)
    │   ├── vertex_encoding = 1/2/3
    │   └── vertex_resolution = 1..21
    ↓ 解析 line_group (field 7)
    │   └── line_op (field 1, repeated)
    │       ├── vertex_data (field 1) → CORD bytes
    │       ├── vertex_count (field 7)
    │       └── vertex_break (field 2) → 分段标记
    ↓ 按 encoding 解码 vertex_data
    ↓ 除以 resolution divisor
    ↓ 得到瓦片局部像素坐标
    ↓ 转为经纬度（Web Mercator）
    ↓ GeoJSON LineString
```

---

## 5. 已实现

`devtools/cord-decode.js` 包含三种解码算法的完整实现：

| 编码 | 函数 | 说明 |
|---|---|---|
| SEQUENTIAL_VARINT | `decodeSequentialVarint()` | varint → 坐标 |
| SEQUENTIAL_FIXED16 | `decodeSequentialFixed16()` | int16 → 坐标 |
| DELTA_VARINT | `decodeDeltaVarint()` | zigzag varint 增量累加 |

以及 `zigzagDecode()`、`ResolutionDivisor` 查找表。

---

## 6. 剩余问题

当前解码器的挑战：ClientVectorTile 响应的外层结构比预期复杂，`tile_options` 字段定位需要修正。响应结构分析：

```
原始响应 (812B)
  0a → field 1, wire 2, length = 809
  → 内部数据 (809B) 不是直接 ClientVectorTile
  → 15 00 a0 4b 45 ... (field 2 wire 5 = fixed32?)
```

需要进一步确认服务器返回的确切 proto 类型。但坐标编码算法已经从 proto 定义中完全确认。

---

## 7. 结论

| 项目 | 状态 |
|---|---|
| CORD 是什么 | ✅ `ctype=CORD` = absl::Cord 内存优化, 不影响 wire format |
| 坐标编码枚举 | ✅ 3 种 (SEQUENTIAL_VARINT, FIXED16, DELTA_VARINT) |
| 分辨率枚举 | ✅ 21 种 (1/4 到 1/4M 像素) |
| 解码算法 | ✅ 三种算法已实现 |
| 响应结构定位 | ⚠️ tile_options 字段定位需修正 |
| 完整 GeoJSON | ⚠️ 待响应结构修正后即可完成 |
