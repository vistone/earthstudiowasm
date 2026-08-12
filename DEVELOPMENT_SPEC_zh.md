# Earth Studio WASM — Protocol Buffer 开发规范（中文版）

> **版本：v1.0 | 适用范围：earthstudiowasm 全部 1,316 .proto 文件 | 最后更新：2026-08-12**

---

## 目录

1. [总纲](#一总纲)
2. [文件组织](#二文件组织)
3. [语法格式](#三语法格式)
4. [Message 与 Enum 设计](#四message-与-enum-设计)
5. [依赖管理](#五依赖管理)
6. [版本兼容性](#六版本兼容性)
7. [废弃与清理](#七废弃与清理)
8. [文档注解](#八文档注解)
9. [评审清单](#九评审清单)
10. [治理执行](#十治理执行)

---

## 一、总纲

### 1.1 五条铁律

| 铁律 | 含义 |
|---|---|
| **Schema First** | Proto 定义是唯一契约，优先级高于任何实现代码 |
| **向后兼容是铁律** | 已发布的 proto 不得以破坏性方式修改，违者 MAJOR 版本 |
| **显式优于隐式** | 字段行为、存储策略、废弃意图必须显式声明 |
| **最小依赖** | 只 import 真正需要的符号 |
| **单一职责** | 一个 `.proto` 文件只负责一个清晰的概念边界 |

### 1.2 当前基线 vs 目标

| 指标 | 当前值 | 目标 |
|---|---|---|
| proto2 文件 | 799 (60.7%) | 逐步迁移到 editions |
| editions 文件 | 462 (35.1%) | 新文件默认 |
| proto3 文件 | 55 (4.2%) | **不再新增** |
| 无 package 声明 | ~~3~~ **0 ✅** | 0 |
| 无 java_package | 189 | **0** |
| `required` 字段 | 79 处 | **0** |
| deprecated 标记 | 1,937 处 | 定期审计清理 |
| 循环依赖 | 0 ✅ | 保持 0 |

---

## 二、文件组织

### 2.1 命名规则

| 类型 | 规则 | ✅ 正确 | ❌ 错误 |
|---|---|---|---|
| 目录名 | 全小写 + 下划线 | `geo/earth/proto/` | `geo/Earth/Proto/` |
| 文件名 | 全小写 + 下划线 + `.proto` | `feature_id.proto` | `FeatureId.proto` |
| Package | 小写 + 点号分隔 | `geo.earth.proto` | `Geo.Earth.Proto` |
| Message | PascalCase | `OpenKnowledgeCard` | `open_knowledge_card` |
| Enum 类型 | PascalCase | `CardSize` | `card_size` |
| Enum 值 | UPPER_SNAKE_CASE | `CARD_SIZE_NORMAL` | `CardSizeNormal` |
| 字段名 | snake_case | `card_size` | `cardSize` |

### 2.2 目录约束

- **最大深度**：≤ 8 层。当前最深处已达 8 层，不得更深
- **每目录文件数**：建议 ≤ 50。超过应考虑拆分
- **领域归属**：新增文件按决策树判断（见英文版 §2.2）

### 2.3 禁止事项

- ❌ 不相关的 message 塞入同一文件
- ❌ 非 `google/` 目录下声明 `google.protobuf` package
- ❌ 文件路径与 package 声明不一致
- ❌ 文件名包含大写字母

---

## 三、语法格式

### 3.1 语法版本决策

```
新建文件    → editions（默认，无需讨论）
修改 proto2 → 保持 proto2（除非全文件迁移）
修改 proto3 → 优先迁移到 editions 再改
纯枚举文件  → editions 或 proto2 均可
```

### 3.2 标准文件头（每个文件必备）

```protobuf
// Copyright 2026 Google LLC
//
// Description: <一句话描述本文件的用途>

syntax = "editions";

package geo.earth.proto;

import "google/protobuf/timestamp.proto";

option java_multiple_files = true;
option java_package = "com.google.geo.earth.proto";
option objc_class_prefix = "RTH";

message MyMessage { ... }
```

**当前违规**：189 个文件缺少 `java_package`，分批补齐。

### 3.3 格式

- **缩进**：2 空格（不用 tab）
- **字段编号**：从 1 开始连续，不跳号（除非 reserved）
- **括号**：`{` 同行，`}` 单独一行
- **每字段一行**

---

## 四、Message 与 Enum 设计

### 4.1 字段规则

| 规则 | 说明 |
|---|---|
| **禁止 `required`** | 一律使用 `optional` 或 `repeated`。79 处历史遗留需修复 |
| **字段编号永不变** | 一旦发布，永久不可重用或改变含义 |
| **删除字段用 reserved** | 必须同时 `reserved` 编号和名称 |
| **编号范围** | 1-15 给高频字段（1 字节编码），16-2047 给普通字段 |
| **oneof 慎用** | 向 oneof 添加字段安全；删除需 MAJOR 版本 |

### 4.2 Enum 规则（铁律）

```protobuf
enum CameraAnimation {
    CAMERA_ANIMATION_UNKNOWN = 0;   // ← 第一个值必须是 0
    CAMERA_ANIMATION_TELEPORT = 1;
    CAMERA_ANIMATION_FLY = 2;
}
```

| 规则 | 违反后果 |
|---|---|
| **第一个值必须是 0** | 当前 79 个 enum 违规，影响序列化默认值 |
| **命名为 `XXX_UNKNOWN` 或 `XXX_UNSPECIFIED`** | 语义清晰 |
| **连续递增（0, 1, 2...）** | 不要跳号 |
| **废弃用 reserved，不删除值** | 保证旧代码兼容 |

### 4.3 嵌套限制

- **Message 嵌套**：≤ 3 层。当前部分文件达 9 层，需重构
- **超过 3 层的嵌套 message 应提取为顶层或独立文件**

---

## 五、依赖管理

### 5.1 依赖层级（从上到下只能单向）

```
L7: logs/proto/         ← 可依赖 L0-L6（顶层消费者）
L6: geo/earth/app/state ← 可依赖 L0-L5
L5: google/internal/    ← 可依赖 L0-L4
L4: geo/earth/proto/    ← 可依赖 L0-L3
L3: geo/serving/        ← 可依赖 L0-L2
L2: geostore/base/      ← 可依赖 L0-L1
L1: google/api/         ← 可依赖 L0
L0: google/protobuf/    ← 零依赖（系统基石）
```

### 5.2 依赖规则

| 规则 | 严重程度 |
|---|---|
| **禁止反向依赖**（L2 → L3） | ❌ 拒绝合并 |
| **禁止循环依赖** | ❌ 拒绝合并 |
| **禁止未使用的 import** | ⚠️ 警告 |
| **禁止重复 import** | ❌ 拒绝合并 |
| **跨 `geo/` ↔ `maps/` 依赖** | 🔶 需 RFC 审批 |

### 5.3 每次新增 import 的自查

- [ ] 被导入文件的层级 ≤ 我的层级？
- [ ] 不会形成循环？
- [ ] 确实引用了被导入文件的类型？
- [ ] import 路径是最精简的？

---

## 六、版本兼容性

### 6.1 三级兼容性

| 级别 | 含义 | 示例 |
|---|---|---|
| **BINARY** ✅ | 二进制完全兼容 | 新增 optional 字段 |
| **SOURCE** ⚠️ | 源码兼容（需重新编译） | 重命名字段但编号不变 |
| **BREAKING** ❌ | 不兼容 → MAJOR 版本 | 删除字段、改编号、改类型 |

### 6.2 允许 vs 禁止

| ✅ 允许（BINARY 兼容） | ❌ 禁止（BREAKING） |
|---|---|
| 新增 optional 字段 | 删除字段（未 reserved） |
| 新增 message/enum | 修改字段编号 |
| 新增 RPC 方法 | 修改字段类型 |
| 向 oneof 添加字段 | 删除 enum 值 |
| 新增 enum 值 | 删除 message |
| 删除 reserved 字段 | 将 repeated 改 optional |
| | 修改 package 名 |

### 6.3 版本号

```
v<MAJOR>.<MINOR>.<PATCH>

MAJOR: 任何 BREAKING 变更
MINOR: 新增功能（新 message、新 RPC）
PATCH: 文档修正、注释完善
```

---

## 七、废弃与清理

### 7.1 废弃生命周期

```
1. 标注 deprecated  ──→  2. 等待 ≥2 个 MINOR 版本  ──→  3. 确认无引用  ──→  4. reserved 删除
```

### 7.2 废弃标注示例

```protobuf
// 旧字段（已废弃）
optional string old_field = 5 [deprecated = true];
// 替换为: new_field（原因：命名歧义，新名更准确）
optional string new_field = 10;
```

### 7.3 reserved 示例

```protobuf
reserved 5;
reserved "old_field";
```

### 7.4 required 迁移路径（79 处需处理）

```
Step 1: required → optional  ← BREAKING，需 MAJOR 版本
Step 2: 服务端添加校验逻辑（替代 required 的运行时保证）
Step 3: 发布 MAJOR 版本
```

---

## 八、文档注解

### 8.1 文件头注释（必须）

```protobuf
// Description: 定义 Earth Studio 的相机指令模型。
//   - FlyToCamera: 支持 LookAt 和 LookFrom 两种模式
//   - CameraAnimation: 瞬移 vs 飞行过渡
//
// Owning Team: geo-earth-studio
// Last Change: 2026-01-15 (新增 Panorama 支持)
```

### 8.2 Message 注释（必须）

```protobuf
// OpenKnowledgeCard 打开一个地点的知识卡片。
// 支持通过 fid（feature id）或 mid（machine id）定位地点。
message OpenKnowledgeCard { ... }
```

### 8.3 字段注释（非显而易见的字段必须）

```protobuf
// 若为 true，允许相机高度低于地形。
// 默认值: false（相机会被限制在最低高度以上）。
optional bool disable_clamping = 6;
```

---

## 九、评审清单

每个 PR 必须通过 **12 项检查**：

### 结构（4 项）
- [ ] 文件命名全小写 + 下划线
- [ ] 目录深度 ≤ 8 层
- [ ] package 声明存在且与目录一致
- [ ] 有 `java_package`（Earth 文件还需 `objc_class_prefix = "RTH"`）

### 语法（3 项）
- [ ] 新建文件使用 `editions`
- [ ] 无 `required` 字段
- [ ] Enum 第一个值为 0（`XXX_UNKNOWN`）

### 依赖（3 项）
- [ ] 无循环依赖
- [ ] 无反向层级依赖
- [ ] 所有 import 均被实际使用

### 兼容性（2 项）
- [ ] 无修改已有字段编号/类型
- [ ] deprecated 字段标注了原因和替代方案

---

## 十、治理执行

### 10.1 角色

| 角色 | 人数 | 职责 |
|---|---|---|
| **Schema Owner** | 每领域 1 人 | 审批本领域 proto 变更 |
| **Proto Council** | 3-5 人 | 审批跨领域变更、RFC |
| **Contributor** | 不限 | 提交符合规范 PR |

### 10.2 例外流程

违反规范的变更必须：
1. PR 描述中标注 `## Exception Request`
2. 说明原因
3. 说明缓解措施
4. Proto Council ≥ 2 人批准

### 10.3 自动检查

```bash
# 每次提交前运行
./devtools/checks/check-all.sh
```

CI 会在每个 PR 上自动运行此脚本。**所有 ❌ FAIL 项必须在合并前清零。**

### 10.4 季度审计

- 每季度自动生成合规报告
- deprecated 字段超过 2 个 MINOR 版本的自动提醒清理
- proto3 文件数量趋势监控

---

## 附录：快速参考

| 我想做什么 | 怎么做 |
|---|---|
| 新建一个 proto 文件 | 用 editions 语法，加 package + java_package，文件名小写 |
| 新增一个字段 | 直接加 `optional`，给下一个未使用的编号 |
| 删除一个字段 | 先 `[deprecated = true]`，等 2 个 MINOR 版本再 `reserved` |
| 确认是否有循环依赖 | `./devtools/checks/check-all.sh` |
| 申请跨域依赖例外 | PR 中标注 `## Exception Request` + 原因 |

---

*规范版本：v1.0 | 仓库版本：v0.0.1*
