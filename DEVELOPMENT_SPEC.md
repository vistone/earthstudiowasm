# Earth Studio WASM — Protocol Buffer 开发规范

> **版本：v1.0 | 适用范围：本仓库新增/修改的 .proto 文件 | 最后更新：2026-08-12**

---

## ⚠️ 重要声明

本仓库的 **1,316 个 `.proto` 文件是 Google Earth 官方 Protocol Buffer 定义**，属于上游 Google 仓库的镜像/快照。

| 文件类型 | 来源 | 可否修改 |
|---|---|---|
| **现有 1,316 个 proto 文件** | Google 官方 | ❌ **禁止直接修改** — 需通过上游 Google 仓库提交变更后同步 |
| **本仓库新增的文件** | 我们自己 | ✅ 遵循本规范 |
| **文档/图表/工具**（README, diagrams, devtools） | 我们自己 | ✅ 自由修改 |

**规范的作用对象：**
- ✅ 本仓库**新增**的 proto 文件
- ✅ 对现有文件**提议修改**时的审查标准（修改应提交到上游）
- ✅ 文档、图表、检查工具
- ❌ **不动**现有的 Google 官方 proto 内容

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
| **官方文件不可侵犯** | 现有 1,316 个 proto 是 Google 官方文件，禁止直接修改 |
| **Schema First** | Proto 定义是客户端与服务端的唯一契约 |
| **向后兼容是铁律** | 任何修改不得以破坏性方式改变现有契约 |
| **显式优于隐式** | 字段行为、存储策略、废弃意图必须显式声明 |
| **最小依赖** | 只 import 真正需要的符号 |

### 1.2 现有文件的合规观察（仅供参考）

以下数据是对现有 Google 官方文件的**被动观察**，不构成修改要求：

| 观察项 | 数量 |
|---|---|
| proto2 语法 | 799 (60.7%) |
| editions 语法 | 462 (35.1%) |
| proto3 语法 | 55 (4.2%) |
| 无 package 声明 | 3 |
| 无 java_package | 189 |
| `required` 字段 | 79 处 |
| deprecated 标记 | 1,937 处 |
| enum 首值 ≠ 0 | 79 个 |
| 循环依赖 | 0 ✅ |

---

## 二、文件组织

### 2.1 命名规则（新增文件）

| 类型 | 规则 | ✅ 正确 | ❌ 错误 |
|---|---|---|---|
| 目录名 | 全小写 + 下划线 | `devtools/checks/` | `DevTools/Checks/` |
| 文件名 | 全小写 + 下划线 + `.proto` | `my_check.proto` | `MyCheck.proto` |
| Package | 小写 + 点号分隔 | `devtools.checks` | `DevTools.Checks` |
| Message | PascalCase | `ComplianceReport` | `compliance_report` |
| Enum 类型 | PascalCase | `CheckStatus` | `check_status` |
| Enum 值 | UPPER_SNAKE_CASE | `CHECK_PASSED` | `CheckPassed` |
| 字段名 | snake_case | `error_count` | `errorCount` |

### 2.2 目录约束（新增文件）

- **最大深度**：≤ 8 层
- **每目录文件数**：建议 ≤ 50
- **不得修改**现有官方文件的目录结构

---

## 三、语法格式

### 3.1 语法版本（新增文件）

```
新增文件 → editions（默认）
```

### 3.2 标准文件头（新增文件）

```protobuf
// Description: <本文件用途>

syntax = "editions";

package my.domain;

option java_multiple_files = true;
option java_package = "com.example.my.domain";
```

---

## 四、Message 与 Enum 设计

### 4.1 字段规则（新增文件）

| 规则 | 说明 |
|---|---|
| **禁止 `required`** | 一律使用 `optional` |
| **字段编号永不变** | 一旦发布，永久不可重用 |
| **删除字段用 reserved** | 必须同时 `reserved` 编号和名称 |

### 4.2 Enum 规则（新增文件）

```protobuf
enum Status {
    STATUS_UNKNOWN = 0;  // ← 第一个值必须是 0
    STATUS_ACTIVE = 1;
    STATUS_DONE = 2;
}
```

---

## 五、依赖管理

### 5.1 现有依赖层级（观察结果）

```
L7: logs/proto/         ← 顶层消费者
L6: geo/earth/app/state
L5: google/internal/
L4: geo/earth/proto/
L3: geo/serving/
L2: geostore/base/
L1: google/api/
L0: google/protobuf/    ← 零依赖基石
```

### 5.2 新增文件依赖规则

| 规则 | 严重程度 |
|---|---|
| **禁止反向依赖**（L2 依赖 L3） | ❌ 拒绝合并 |
| **禁止循环依赖** | ❌ 拒绝合并 |
| **禁止未使用的 import** | ⚠️ 警告 |
| **禁止重复 import** | ❌ 拒绝合并 |

---

## 六、版本兼容性

### 6.1 三级兼容性

| 级别 | 含义 | 示例 |
|---|---|---|
| **BINARY** ✅ | 二进制兼容 | 新增 optional 字段 |
| **SOURCE** ⚠️ | 需重新编译 | 重命名字段但编号不变 |
| **BREAKING** ❌ | 不兼容 | 删除字段、改编号、改类型 |

### 6.2 禁止操作（任何情况下）

- ❌ 修改已有字段编号
- ❌ 修改已有字段类型
- ❌ 删除未 reserved 的字段
- ❌ 修改 package 名

### 6.3 版本号

```
v<MAJOR>.<MINOR>.<PATCH>

MAJOR: BREAKING 变更
MINOR: 新增兼容功能
PATCH: 文档/工具修正
```

---

## 七、废弃与清理

### 7.1 现有文件的废弃字段

现有 1,937 处 `deprecated` 标记来自 Google 官方，**不要自行清理**。如需清理，提交到上游 Google 仓库。

### 7.2 新增文件的废弃流程

```
标注 deprecated → 等待 ≥2 MINOR 版本 → 确认无引用 → reserved
```

```protobuf
optional string old_field = 5 [deprecated = true];
// 替换为: new_field（原因说明）
optional string new_field = 10;
```

---

## 八、评审清单

每个 PR 必须通过以下检查：

### 新增文件检查
- [ ] 文件命名全小写 + 下划线
- [ ] package 声明存在
- [ ] 使用 editions 语法
- [ ] 无 required 字段
- [ ] enum 首值 = 0 (XXX_UNKNOWN)
- [ ] 无循环依赖

### 修改现有文件检查
- [ ] 是否有对应的上游 Google PR？
- [ ] 是否 BREAKING？（BREAKING 需要 MAJOR 版本 + 充分理由）
- [ ] 删除字段是否先 deprecated 再 reserved？

---

## 九、治理执行

### 9.1 本地检查

```bash
./devtools/checks/check-all.sh
```

检查器会区分**官方文件（豁免）**和**新增文件（强制）**。

### 9.2 CI 自动拦截

每个 PR 自动运行检查。**新增文件的 FAIL 项必须清零**。

### 9.3 例外流程

违反规范的变更需：
1. PR 描述中标注 `## Exception Request`
2. 说明原因和缓解措施
3. 获得批准

---

*规范版本：v1.0*
