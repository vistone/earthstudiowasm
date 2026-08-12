# Earth Studio WASM — Protocol Buffer 开发规范（中文版）

> **版本：v1.0 | 适用范围：本仓库新增/修改的 .proto 文件 | 最后更新：2026-08-12**

---

## ⚠️ 重要声明

本仓库的 **1,316 个 `.proto` 文件是 Google Earth 官方 Protocol Buffer 定义**，来自 Google 内部 monorepo 的镜像/快照。

| 文件类型 | 来源 | 可否修改 |
|---|---|---|
| **现有 1,316 个 proto 文件** | Google 官方 | ❌ **禁止直接修改** |
| **本仓库新增的文件** | 我们 | ✅ 遵循本规范 |
| **文档/图表/工具** | 我们 | ✅ 自由修改 |

**规范作用对象：**
- ✅ 本仓库**新增**的 proto
- ✅ 对现有文件**提议修改**时的审查标准（修改应提交到上游 Google 仓库）
- ❌ **不动**现有的 Google 官方 proto 内容

---

## 一、总纲

### 1.1 五条铁律

| 铁律 | 含义 |
|---|---|
| **官方文件不可侵犯** | 现有 1,316 个 proto 是 Google 官方文件，禁止直接修改 |
| **Schema First** | Proto 定义是唯一契约，优先级高于实现代码 |
| **向后兼容是铁律** | 任何修改不得破坏现有契约，违者 MAJOR 版本 |
| **显式优于隐式** | 字段行为、废弃意图必须显式声明 |
| **最小依赖** | 只 import 真正需要的符号 |

### 1.2 现有文件的合规观察（仅供参考，不构成修改要求）

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

## 二、文件组织（新增文件）

### 2.1 命名规则

| 类型 | 规则 | ✅ | ❌ |
|---|---|---|---|
| 目录名 | 全小写 + 下划线 | `my_tools/` | `MyTools/` |
| 文件名 | 全小写 + 下划线 + `.proto` | `config.proto` | `Config.proto` |
| Package | 小写 + 点号 | `my.domain` | `My.Domain` |
| Message | PascalCase | `CheckResult` | `check_result` |
| Enum 类型 | PascalCase | `Status` | `status` |
| Enum 值 | UPPER_SNAKE_CASE | `STATUS_OK` | `StatusOk` |
| 字段名 | snake_case | `error_count` | `errorCount` |

### 2.2 目录约束

- 最大深度 ≤ 8 层
- 每目录 ≤ 50 文件（建议）
- **不得修改**现有官方文件的目录结构

---

## 三、语法格式（新增文件）

### 3.1 标准文件头

```protobuf
// Description: <用途>

syntax = "editions";

package my.domain;

option java_multiple_files = true;
option java_package = "com.example.my.domain";
```

### 3.2 禁止项

- ❌ 新增 `required` 字段
- ❌ enum 首值 ≠ 0
- ❌ 文件名含大写字母
- ❌ 循环依赖

---

## 四、依赖管理

### 4.1 现有依赖层级（只许向下）

```
L7 logs          \ 
L6 state          \  只能 import
L5 internal        \ 下面的层
L4 earth/proto     /
L3 serving        /
L2 geostore      /
L1 annotations  /
L0 protobuf    /
```

### 4.2 新增文件规则

- ❌ 禁止反向依赖
- ❌ 禁止循环依赖
- ❌ 禁止重复 import
- ⚠️ 禁止未使用的 import

---

## 五、版本兼容性

| ✅ 允许 | ❌ 禁止 |
|---|---|
| 新增 optional 字段 | 删除字段（未 reserved） |
| 新增 message/enum | 修改字段编号 |
| 新增 enum 值 | 修改字段类型 |
| reserved 废弃字段 | 修改 package 名 |

```
vMAJOR.MINOR.PATCH
MAJOR: BREAKING 变更
MINOR: 新增功能
PATCH: 文档修正
```

---

## 六、废弃流程

```
标注 deprecated → 等 ≥2 MINOR 版本 → 确认无引用 → reserved
```

现有 1,937 处 deprecated 来自 Google 官方，**不要自行清理**。

---

## 七、评审清单

### 新增文件 PR 检查

- [ ] 文件名全小写 + 下划线
- [ ] package 声明存在
- [ ] editions 语法
- [ ] 无 required
- [ ] enum 首值 = 0
- [ ] 无循环依赖

### 修改现有文件 PR 检查

- [ ] 有对应上游 Google PR？
- [ ] 非 BREAKING？（BREAKING → MAJOR + 充分理由）
- [ ] 删除字段先 deprecated 再 reserved？

---

## 八、检查工具

```bash
./devtools/checks/check-all.sh
```

- 对**现有官方文件**：只观察，报告 OBSERVE
- 对**新增文件**：强制检查，FAIL 必须清零

CI 会在每个 PR 自动运行。

---

*规范版本：v1.0 | 仓库版本：v0.0.1*
