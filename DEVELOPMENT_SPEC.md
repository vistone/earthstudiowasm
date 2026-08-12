# Earth Studio WASM — Protocol Buffer 开发规范

> **版本：v1.0 | 适用范围：earthstudiowasm 全部 1,316 .proto 文件 | 最后更新：2026-08-12**

---

## 目录

1. [规范总纲](#一规范总纲)
2. [文件组织规范](#二文件组织规范)
3. [语法与格式规范](#三语法与格式规范)
4. [Message 与 Enum 设计规范](#四message-与-enum-设计规范)
5. [依赖管理规范](#五依赖管理规范)
6. [版本兼容性规范](#六版本兼容性规范)
7. [废弃与清理规范](#七废弃与清理规范)
8. [文档与注解规范](#八文档与注解规范)
9. [评审检查清单](#九评审检查清单)
10. [治理与执行](#十治理与执行)

---

## 一、规范总纲

### 1.1 核心原则

| 原则 | 含义 |
|---|---|
| **Schema First** | Proto 定义是客户端与服务端的唯一契约，优先级高于任何实现代码 |
| **向后兼容是铁律** | 任何已发布的 proto 不得以破坏性方式修改 |
| **显式优于隐式** | 所有字段行为、存储策略、废弃意图必须显式声明 |
| **最小依赖** | 每个 proto 文件只 import 它真正需要的符号 |
| **单一职责** | 一个 `.proto` 文件只负责一个清晰的概念边界 |

### 1.2 当前状态基线（2026-08-12）

| 指标 | 当前值 | 目标 |
|---|---|---|
| proto2 文件 | 799 (60.7%) | 逐步迁移到 editions |
| editions 文件 | 462 (35.1%) | 新文件默认 |
| proto3 文件 | 55 (4.2%) | 不再新增 |
| 无 package 文件 | 3 | **0（立即修复）** |
| 无 java_package 文件 | 189 | **0（逐步补齐）** |
| `required` 字段 | 79 处 | **0** |
| deprecated 标记 | 1,937 处 | 定期清理 |
| 循环依赖 | 0 ✅ | 保持 0 |
| 重复 import | 0 ✅ | 保持 0 |

---

## 二、文件组织规范

### 2.1 目录结构

```
domain/subdomain/sub-subdomain/
├── proto/              # proto 定义（如有嵌套）
│   └── feature.proto
└── feature.proto       # 或直接放在子域根目录
```

**规则：**

1. **目录命名**：全小写，单词间用下划线（snake_case），不得使用大写字母
2. **文件命名**：全小写 + 下划线，后缀 `.proto`。禁止大写、禁止连字符
   - ✅ `featureid.proto` `speed_limit.proto`
   - ❌ `FeatureId.proto` `speed-limit.proto`
3. **路径深度**：不超过 8 层。当前最深路径已达 8 层（`geo/earth/app/cpp/core/state/...`），新增不得更深
4. **每目录文件数**：建议 ≤50 个。当前 `logs/proto/` 下超过 100 个，应拆分

### 2.2 领域归属决策树

新增 proto 文件时，按以下顺序判断归属：

```
1. 是否属于已有 Google 标准类型？
   → 是 → google/type/ 或 google/protobuf/
   → 否 ↓

2. 是否定义持久化存储格式？
   → 是 → geostore/ 下对应子域
   → 否 ↓

3. 是否定义日志/分析事件？
   → 是 → logs/ 下对应子域
   → 否 ↓

4. 是否属于 Maps 功能？
   → 是 → maps/ 下对应子域
   → 否 ↓

5. 是否属于 Earth 核心功能？
   → 是 → geo/earth/ 下对应子域
   → 否 ↓

6. 是否是跨域共享类型？
   → 是 → google/internal/earth/ （仅限内部） 或提出新增顶层域的 RFC
```

### 2.3 禁止事项

- ❌ 将完全不相关的 message 塞入同一个文件（如把 User 和 Layer 放在同一个 proto）
- ❌ 在非 `google/` 目录下直接定义 `google.protobuf` 或 `google.api` package
- ❌ 文件路径与 package 声明不一致（如文件在 `geo/maps/` 但 package 声明为 `earth.core`）

---

## 三、语法与格式规范

### 3.1 语法版本选择

| 场景 | 使用语法 |
|---|---|
| 新建文件 | **`editions`**（默认） |
| 修改已有 proto2 文件 | 保持 proto2，除非进行全文件迁移 |
| 修改已有 proto3 文件 | 优先迁移到 editions 再修改 |
| 定义纯枚举（无 message） | `editions` 或 `proto2`（统一即可） |

### 3.2 package 声明（强制）

**每个 .proto 文件必须声明 package**。当前 3 个缺失文件需立即修复：

- `logs/eventid/eventid.proto`
- `repository/docchart/extraction/businesshours.proto`
- `location/country/telephonenumber.proto`

**规则：**
1. package 必须与目录结构一致（深度 ≥ 项目根以下 2 级）
2. 使用 `.` 分隔符，全小写，单词间不用下划线
3. `geo/earth/proto/commands.proto` → `package geo.earth.proto;`

### 3.3 标准文件头（强制）

每个 `.proto` 文件必须按以下顺序包含：

```protobuf
syntax = "editions";

package geo.earth.proto;

// （所有 import 语句）
import "google/protobuf/timestamp.proto";
import "geo/earth/proto/geometry.proto";

// （标准选项）
option java_multiple_files = true;
option java_package = "com.google.geo.earth.proto";
option objc_class_prefix = "RTH";  // Earth 专属前缀

// （消息定义）
message MyMessage { ... }
```

**当前违规**：189 个文件缺少 `java_package`，应逐步补齐。

### 3.4 缩进格式

- 使用 **2 空格** 缩进（不是 tab）
- message/enum 的 `{` 与声明同行，`}` 独立一行
- 每个 field 一行
- 字段编号从 1 开始，无跳号（除非 reserved）

```protobuf
message Camera {
    optional double latitude = 1;
    optional double longitude = 2;
    optional double altitude = 3;
    optional double heading = 4;
    optional double tilt = 5;
    optional double roll = 6;
}
```

---

## 四、Message 与 Enum 设计规范

### 4.1 字段规则

| 规则 | 说明 |
|---|---|
| **禁止 `required`** | proto2 的 `required` 破坏兼容性，一律使用 `optional` 或 `repeated`。当前有 79 处违规需修复 |
| **字段编号永久不变** | 一旦发布，永远不能重用或改变含义 |
| **删除字段用 reserved** | 删除字段时必须同时 `reserved` 编号和名称 |
| **编号范围** | 1-15 用于最频繁使用的字段（1字节编码），16-2047 用于普通字段，19000-19999 保留不用 |
| **oneof 慎用** | oneof 内的字段编号不可与 oneof 外的冲突；向 oneof 添加字段是安全的 |

### 4.2 Enum 规则

```protobuf
enum CameraAnimation {
    CAMERA_ANIMATION_UNKNOWN = 0;   // 0 值必须是 UNKNOWN 或 UNSPECIFIED
    CAMERA_ANIMATION_TELEPORT = 1;
    CAMERA_ANIMATION_FLY = 2;
}
```

| 规则 | 说明 |
|---|---|
| **第一个值必须是 0** | 且命名为 `XXX_UNKNOWN` 或 `XXX_UNSPECIFIED` |
| **不要跳过枚举值** | 0, 1, 2, 3... 连续递增 |
| **枚举值全大写** | `ENUM_NAME_VALUE` 格式，用下划线分隔 |
| **废弃用 reserved** | 不要删除枚举值，用 `reserved` |

### 4.3 嵌套深度限制

| 层级 | 限制 |
|---|---|
| message 嵌套 | **≤ 3 层**。当前部分文件达 9 层，需重构 |
| 目录嵌套 | **≤ 8 层**（已达标） |
| import 链长度 | **≤ 7 层**（基于拓扑分析已达标） |

超过 3 层的嵌套 message 应提取为顶层 message 或拆分为独立文件。

### 4.4 命名约定

| 类型 | 规则 | 示例 |
|---|---|---|
| Message | PascalCase | `OpenKnowledgeCard` |
| Enum 类型 | PascalCase | `CardSize` |
| Enum 值 | UPPER_SNAKE_CASE | `CARD_SIZE_NORMAL` |
| 字段名 | snake_case | `card_size` |
| 文件名 | snake_case | `knowledge_card.proto` |
| Package | lowercase.dotted | `geo.earth.proto` |

---

## 五、依赖管理规范

### 5.1 Import 规则

```
┌────────────────────────────────────────────────┐
│  依赖层级（从上到下只允许单向依赖）              │
├────────────────────────────────────────────────┤
│  L7: logs/proto/         ← 可依赖 L0-L6        │
│  L6: geo/earth/app/state ← 可依赖 L0-L5        │
│  L5: google/internal/    ← 可依赖 L0-L4        │
│  L4: geo/earth/proto/    ← 可依赖 L0-L3        │
│  L3: geo/serving/        ← 可依赖 L0-L2        │
│  L2: geostore/base/      ← 可依赖 L0-L1        │
│  L1: google/api/         ← 可依赖 L0           │
│  L0: google/protobuf/    ← 零依赖              │
└────────────────────────────────────────────────┘
```

**规则：**

1. **禁止反向依赖**：L2 不得 import L3 或更高层的任何内容
2. **禁止循环依赖**（当前 0 个 ✅，保持）
3. **最小 import 原则**：如果只用了 `Timestamp`，就不要 import 整个 `google/protobuf/` 下的其他类型
4. **禁止未使用的 import**：import 的内容必须在文件中被引用（message field、extend、option）
5. **禁止重复 import**（当前 0 个 ✅）

### 5.2 跨域依赖审批

| 跨域方向 | 是否需要审批 |
|---|---|
| L(N) → L(N-1)（向下依赖） | 自动允许 |
| L(N) → L(N+1)（向上依赖） | ❌ **禁止** |
| `geo/earth/` → `maps/` | 需 RFC 审批 |
| `maps/` → `geo/` | 需 RFC 审批 |
| 任何 → `storage/datapol/` | 自动允许（语义注解无运行时影响） |

### 5.3 新增 Import 检查清单

每次新增 import 前确认：

- [ ] 被导入的文件层级 ≤ 当前文件层级？
- [ ] 没有形成循环？
- [ ] 确实引用了被导入文件的类型/扩展（不是注释掉的引用）？
- [ ] import 路径是最精简的（不是 `import "a/b/c/d/e.proto"` 但只用了 `e.proto` 的一个枚举，可以提取到共享层）？

---

## 六、版本兼容性规范

### 6.1 兼容性级别

| 级别 | 含义 | 示例 |
|---|---|---|
| **BINARY** | 二进制完全兼容 | 新增 optional 字段 |
| **SOURCE** | 源码兼容（需重新编译但无需改代码） | 重命名字段但编号不变 |
| **BREAKING** | 不兼容 — 需主版本号递增 | 删除字段、改编号、改类型 |

### 6.2 允许的修改（BINARY 兼容）

| 操作 | 兼容性 |
|---|---|
| 新增 optional 字段 | ✅ BINARY |
| 新增 message/enum | ✅ BINARY |
| 新增 RPC 方法 | ✅ BINARY |
| 向 oneof 添加字段 | ✅ BINARY |
| 删除 reserved 字段 | ✅ BINARY |
| 将 optional 改为 repeated | ⚠️ SOURCE |
| 重命名字段（编号不变） | ⚠️ SOURCE |
| 新增 enum 值 | ✅ BINARY（旧代码会忽略） |

### 6.3 禁止的修改（BREAKING）

| 操作 | 后果 |
|---|---|
| **删除字段**（未 reserved） | ❌ 编号可能被重用，数据损坏 |
| **修改字段编号** | ❌ 数据错乱 |
| **修改字段类型** | ❌ 如 int32 → string |
| **删除 enum 值** | ❌ 旧代码可能崩溃 |
| **删除 message** | ❌ 引用它的代码全部失效 |
| **将 repeated 改为 optional** | ❌ 多值变单值，数据丢失 |
| **修改 package 名** | ❌ 所有引用失效 |

### 6.4 版本标记策略

```
Tag 格式: v<MAJOR>.<MINOR>.<PATCH>

MAJOR: 任何 BREAKING 变更（当前为 0，首个 BREAKING 变更升为 1）
MINOR: 新增 BINARY 兼容功能（新 message、新 RPC）
PATCH: 文档修正、注释完善、纯粹兼容性修补
```

当前版本：**v0.0.1**（初始发布，proto 文件尚在稳定化中）

---

## 七、废弃与清理规范

### 7.1 废弃标记

当前仓库有 **1,937 处 deprecated 标记**。任何废弃必须遵循：

```
废弃生命周期：
  标注 deprecated → 等待 ≥2 个 MINOR 版本 → 确认无引用 → reserved 删除
```

**规则：**

1. 废弃必须标注原因和替代方案：
   ```protobuf
   optional string old_field = 5 [deprecated = true];
   // 替换为: optional string new_field = 10;  // 原因：old_field 命名歧义
   ```

2. **禁止静默删除**。必须先标记 `deprecated`，至少保留 2 个 MINOR 版本后才能 reserved

3. **reserved 声明**：
   ```protobuf
   reserved 5;
   reserved "old_field";
   ```

### 7.2 required 字段迁移路径

当前 79 处 `required` 必须按以下路径迁移：

```
Step 1: required → optional（BREAKING → 需 MAJOR 版本）
Step 2: 在服务端添加校验逻辑（替代 required 的运行时保证）
Step 3: 发布 MAJOR 版本
```

### 7.3 清理节奏

| 频率 | 操作 |
|---|---|
| 每次 PR | 检查是否有新 deprecated 但未注明原因 |
| 每个 MINOR 版本 | 审计 deprecated ≥ 2 版本的字段是否可 reserved |
| 每个 MAJOR 版本 | 清理所有可 reserved 的废弃字段 |

---

## 八、文档与注解规范

### 8.1 文件级注释（强制）

每个 `.proto` 文件必须以注释开头：

```protobuf
// Copyright 2026 Google LLC
//
// Description: Defines the camera command model for Earth Studio.
//   - FlyToCamera: supports LookAt and LookFrom modes
//   - CameraAnimation: teleport vs fly transitions
//
// Owning Team: geo-earth-studio
// Last Significant Change: 2026-01-15 (added Panorama support)
```

### 8.2 Message 注释

```protobuf
// FlyToCamera moves the viewport to a specified location.
// Supports two camera modes:
//   - LookAt: target point + range/distance
//   - LookFrom: explicit camera position
// Setting disable_clamping to true allows the camera to go below terrain.
message FlyToCamera { ... }
```

### 8.3 字段注释

每个非显而易见的字段必须有注释：

```protobuf
message FlyToCamera {
    // If true, allows camera altitude to go below terrain level.
    // Default: false (camera is clamped to minimum altitude).
    optional bool disable_clamping = 6;  // 添加于 2025-11
}
```

### 8.4 Enum 值注释

```protobuf
enum CameraAnimation {
    CAMERA_ANIMATION_UNKNOWN = 0;   // Should never be used
    CAMERA_ANIMATION_TELEPORT = 1;  // Instant jump (default)
    CAMERA_ANIMATION_FLY = 2;       // Smooth fly-through animation
}
```

---

## 九、评审检查清单

### 9.1 每个 PR 必须通过的检查

#### 结构检查
- [ ] 文件命名全小写 + 下划线
- [ ] 目录路径 ≤ 8 层
- [ ] package 声明存在且与目录一致
- [ ] 有 `java_package` 选项（Earth 文件还需 `objc_class_prefix = "RTH"`）

#### 语法检查
- [ ] 新建文件使用 `editions` 语法
- [ ] 无 `required` 字段
- [ ] 无硬删除字段（必须 reserved）
- [ ] Enum 第一个值为 0 且命名为 `XXX_UNKNOWN`

#### 依赖检查
- [ ] 无循环依赖
- [ ] 无反向层级依赖（L(N) 不 import L(>N)）
- [ ] 所有 import 均被实际使用
- [ ] 无重复 import

#### 兼容性检查
- [ ] 无修改已有字段的编号
- [ ] 无修改已有字段的类型
- [ ] 无删除已有 enum 值（除非标记 deprecated ≥ 2 版本）
- [ ] 新增字段编号未与 reserved 冲突

#### 文档检查
- [ ] 文件头有描述注释
- [ ] 新增 message 有用途说明
- [ ] 非显而易见的字段有注释
- [ ] deprecated 字段标注了原因和替代方案

### 9.2 自动化检查

```bash
# 请在 PR 前运行以下检查脚本
# (脚本待添加到 devtools/ 目录)

# 1. 语法版本合规
./devtools/check-syntax.sh

# 2. 依赖层级检查
./devtools/check-dependency-layers.sh

# 3. required 字段检出
./devtools/check-no-required.sh

# 4. 缺失 package/java_package 检出
./devtools/check-missing-options.sh
```

---

## 十、治理与执行

### 10.1 角色

| 角色 | 职责 |
|---|---|
| **Schema Owner**（每领域 1 人） | 审批本领域的 proto 变更 |
| **Proto Council**（3-5 人） | 审批跨领域变更、RFC、语法迁移 |
| **Contributor** | 提交符合本规范的 PR |

### 10.2 例外流程

任何需要违反本规范的变更，必须：

1. 在 PR 描述中明确标注 `## Exception Request`
2. 说明原因（为什么无法遵守规范）
3. 说明缓解措施（如何降低风险）
4. 获得 Proto Council 至少 2 人批准

### 10.3 规范演进

| 机制 | 说明 |
|---|---|
| **RFC 流程** | 任何人对规范有修改建议，提交 RFC 文档到仓库根目录 `rfcs/` |
| **季度审计** | 每季度自动运行合规检查，生成合规报告 |
| **规范版本** | 本规范文件使用语义化版本，与仓库版本独立 |

---

## 附录 A：快速修复清单（优先级排序）

| 优先级 | 项目 | 数量 | 措施 |
|---|---|---|---|
| 🔴 P0 | 补齐缺失 package 声明 | 3 个文件 | 立即 PR |
| 🔴 P0 | 修复 required 字段 | 79 处 | 本期清理 |
| 🟡 P1 | 补齐缺失 java_package | 189 个文件 | 分批 PR |
| 🟡 P1 | 新建文件统一 editions | 规范执行 | 持续 |
| 🟢 P2 | 深度嵌套 message 重构 | 若干 | 下次 MAJOR |
| 🟢 P2 | deprecated 字段审计清理 | 1,937 处 | 定期进行 |

## 附录 B：依赖层级参考图

参见仓库内 `diagrams/topology-layers.html`（可交互）和 `DEPENDENCY_MAP.md`（Mermaid 静态图）。
