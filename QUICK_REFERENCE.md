# Proto 开发速查卡

> 打印或贴在显示器旁边。完整规范见 DEVELOPMENT_SPEC.md

---

## ⚠️ 重要：现有 1,316 个 proto 是 Google 官方文件，禁止直接修改。
## 规范只约束新增文件。见 DEVELOPMENT_SPEC.md 完整说明。

## 🚫 新增文件合并拦截项

```
❌ required 字段             → 改用 optional
❌ enum 第一个值 ≠ 0         → 加 XXX_UNKNOWN = 0
❌ 文件无 package 声明        → 加 package xxx.yyy;
❌ 文件名含大写字母           → 全小写 + 下划线
❌ 循环依赖                  → 调整层级
❌ 删除字段但未 reserved     → 先 deprecated，后 reserved
❌ 修改已有字段编号/类型     → 永久禁止
```

## ✅ 每次 PR 自查

```
□ 文件命名全小写+下划线？
□ package 声明与目录一致？
□ 有 java_package？
□ 新建文件用 editions 语法？
□ 没有新增 required？
□ enum 首值 = 0 (XXX_UNKNOWN)？
□ import 都是真正需要的？
□ 没有反向层级依赖？
□ 删除字段用了 deprecated + 注释原因？
```

## 📋 常用操作

| 操作 | 做法 |
|---|---|
| 新建 proto | `editions` + `package` + `java_package` |
| 新增字段 | `optional Type name = N;`（N = 下一个未用编号） |
| 废弃字段 | `[deprecated = true]` + 注释替换方案 |
| 删除字段 | deprecated → 等 2 个 MINOR 版本 → reserved |
| 改字段名 | 可以（编号不变 = SOURCE 兼容） |
| 改字段类型 | **绝对不行**（BREAKING） |

## 🔢 版本号

```
vMAJOR.MINOR.PATCH

MAJOR++ → 有 BREAKING 变更
MINOR++ → 新增功能（兼容）
PATCH++ → 文档/注释修正
```

## 🏗️ 依赖层级（只许向下）

```
L7 logs        \
L6 state        \  只能 import 下面的
L5 internal      \
L4 earth/proto    /
L3 serving       /
L2 geostore     /
L1 annotations /
L0 protobuf   /
```

## 🔧 运行检查

```bash
./devtools/checks/check-all.sh
```
