# Earth Studio 实现 — 项目规则与治理

> **版本：** v0.1.0 | **适用范围：** 所有贡献者、审查者及自动化流程 | **最后更新：** 2026-08-12
>
> 本文档是项目治理的唯一权威来源。每条规则均可执行。任何模糊不清的规则意味着它无效——必须重写。

---

## 目录

1. [版本管理](#1-版本管理-严格)
2. [变更日志](#2-变更日志-强制)
3. [面向对象开发规则](#3-面向对象开发规则-严格)
4. [阶段边界](#4-阶段边界-不可跨越)
5. [前后端分离](#5-前后端分离-严格)
6. [测试规则](#6-测试规则)
7. [Git 工作流](#7-git-工作流)
8. [代码审查清单](#8-代码审查清单)
9. [目录与文件创建规则](#9-目录与文件创建规则)
10. [依赖注入与接口](#10-依赖注入与接口)
11. [Proto 文件治理](#11-proto-文件治理)
12. [包依赖规则](#12-包依赖规则)
13. [TypeScript 严格模式](#13-typescript-严格模式)
14. [状态管理 (MobX)](#14-状态管理-mobx)
15. [API 设计规则](#15-api-设计规则)
16. [数据库规则](#16-数据库规则)
17. [错误处理](#17-错误处理)
18. [性能预算](#18-性能预算)
19. [安全规则](#19-安全规则)
20. [文档要求](#20-文档要求)
21. [CI/CD 规则](#21-cicd-规则)
22. [治理执行](#22-治理执行)

---

## 1. 版本管理（严格）

### 1.1 版本编号：`MAJOR.MINOR.PATCH`

| 触发条件 | 升级类型 | 升级值 | 示例 |
|---|---|---|---|
| 阶段完成（所有交付物完成、测试通过、已审查） | **MINOR** | `+1` | `v0.1.0` → `v0.2.0` |
| 任何其他提交（功能、修复、重构、杂项、文档、测试、样式） | **PATCH** | `+1` | `v0.1.0` → `v0.1.1` |
| 破坏性 proto 变更（重命名字段、修改字段编号、修改类型、删除字段而未使用 `reserved`） | **MAJOR** | `+1` | `v0.1.0` → `v1.0.0` |
| 热修复（针对生产环境问题的紧急修复，直接提交到 `main`） | **PATCH** | `+1` | `v0.2.1` → `v0.2.2` |

### 1.2 阶段 → 版本映射

| 阶段 | 版本 | 周数 | 验收标准 |
|---|---|---|---|
| 0. Proto 流水线 | `v0.1.0` | 1-2 | 全部 1,316 个 proto 文件通过 `protobuf-ts` 编译为 TypeScript |
| 1. 基础（地球 + 相机） | `v0.2.0` | 1-2 | Three.js 地球渲染 WGS84 椭球体并带有卫星纹理；相机支持 LookAt/LookFrom、TELEPORT/FLY |
| 2. 命令 + 状态 | `v0.3.0` | 3-4 | 34 种命令类型正确分发；40+ 个 MobX store；撤销/重做栈正常工作 |
| 3. 内容创建 | `v0.4.0` | 5-6 | 要素 CRUD（地标、折线、多边形、文件夹）；KML 导入/导出；样式编辑器功能正常 |
| 4. 搜索 + 知识 | `v0.5.0` | 7 | 地理编码搜索；知识卡片渲染事实/图片/营业时间 |
| 5. 图层 + 地图样式 | `v0.6.0` | 8-9 | 9+ 种图层类型可切换；MapStyle 投影/影像/3D 要素切换 |
| 6. 街景 + 时间 | `v0.7.0` | 10 | 街景全景集成；TimeMachine 历史影像滑块；延时摄影播放 |
| 7. 设计工具 | `v0.8.0` | 11-13 | 日照分析计算器；3D 建筑编辑器（容积率/拉伸）；坡度/坡向/等高线/填挖方分析 |
| 8. Earth Mate AI | `v0.9.0` | 14 | 具备 34 个工具调用函数的 AI 聊天；流式 SSE；图像生成；Gemini 生成的图层 |
| 9. 云端 + 协作 | `v0.10.0` | 15-16 | 云端项目（创建/打开/保存）；文档共享（OWNER/EDITOR/VIEWER 角色）；变更冲突解决 |
| 10. 打磨 + 发布 | `v1.0.0` | 17-18 | 满足性能预算；无障碍审计通过；生产环境部署；所有集成测试通过 |

### 1.3 每次提交的版本规则（极其严格）

1. **每次修改 `packages/` 中任何代码的提交**都必须升级版本。
   - 例外：仅修改文档文件（`*.md`、`README*`、`LICENSE`）的提交不需要升级版本。
2. 如果某次提交**完成了一个阶段**（最后一个交付物合并，所有阶段测试通过），版本必须升级 MINOR。
3. 如果提交是任何其他代码变更（阶段内的功能、Bug 修复、重构、测试添加、杂项），版本必须升级 PATCH。
4. 版本标签（`git tag vX.Y.Z`）必须与 `package.json` 中的版本变更**在同一次提交中**推送。
5. **严禁**跳过序列中的版本号。`v0.1.0` → `v0.1.1` → `v0.1.2`——不能有间隔。
6. **严禁**回溯修改已推送到 `main` 或任何共享分支的版本。
7. 如果提交被回滚，回滚提交是一次新的 PATCH 升级。
8. 版本号存放在**根目录 `package.json`** 的 `"version"` 字段中。所有包的 `package.json` 文件（`packages/*/package.json`）应与此版本完全一致。
9. 任何检测到根目录与任一包 `package.json` 之间版本不一致的 CI 作业都必须使构建失败。

### 1.4 版本升级脚本（必须使用）

每次版本升级都必须使用此脚本——禁止手动编辑版本字段：

```bash
#!/bin/bash
# scripts/bump-version.sh
# Usage: ./scripts/bump-version.sh <major|minor|patch> [--phase "Phase N: Name"]

set -euo pipefail

BUMP_TYPE="$1"
PHASE_LABEL="${2:-}"

# 1. Bump root version
npm version "$BUMP_TYPE" --no-git-tag-version

# 2. Read new version
NEW_VERSION=$(node -p "require('./package.json').version")

# 3. Update all workspace packages
for pkg in packages/*/package.json; do
  tmp=$(mktemp)
  jq --arg v "$NEW_VERSION" '.version = $v' "$pkg" > "$tmp" && mv "$tmp" "$pkg"
done

# 4. Update CHANGELOG.md header
DATE=$(date +%Y-%m-%d)
if [ -n "$PHASE_LABEL" ]; then
  sed -i "2i\\\n## [v${NEW_VERSION}] - ${DATE} — ${PHASE_LABEL} ✓\n" CHANGELOG.md
else
  sed -i "2i\\\n## [v${NEW_VERSION}] - ${DATE}\n" CHANGELOG.md
fi

# 5. Commit and tag
git add package.json packages/*/package.json CHANGELOG.md
git commit -m "chore(release): bump version to v${NEW_VERSION} ${PHASE_LABEL}"
git tag -a "v${NEW_VERSION}" -m "Release v${NEW_VERSION}${PHASE_LABEL:+: $PHASE_LABEL}"
git push origin HEAD --tags

echo "✅ Version bumped to v${NEW_VERSION}"
```

### 1.5 CI 中的版本强制执行

```yaml
# .github/workflows/version-check.yml
name: Version Check

on: [push, pull_request]

jobs:
  version-consistency:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check version consistency
        run: |
          ROOT_VERSION=$(node -p "require('./package.json').version")
          for pkg in packages/*/package.json; do
            PKG_VERSION=$(node -p "require('./$pkg').version")
            if [ "$ROOT_VERSION" != "$PKG_VERSION" ]; then
              echo "❌ Version mismatch: root=${ROOT_VERSION} vs ${pkg}=${PKG_VERSION}"
              exit 1
            fi
          done
          echo "✅ All versions consistent at v${ROOT_VERSION}"
```

---

## 2. 变更日志（强制）

### 2.1 CHANGELOG.md 格式

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.3.0] - 2026-08-20 — Phase 2: Commands + State ✓

### Added
- `CommandDispatcher` class in `packages/core/src/services/CommandDispatcher.ts` with 34 command handlers
- Undo/redo stack with infinite history in `CommandDispatcher`
- MobX stores: `SearchStore`, `LayerStore`, `CameraStore`, `DocumentStore` in `packages/client/src/stores/`
- Command serialization to/from proto via `CommandAdapter.toProto()` / `.fromProto()`
- Deep link generation from command sequences in `packages/client/src/stores/DeeplinkStore.ts`
- 34 command handler classes: `FlyToCameraHandler`, `PerformSearchHandler`, `CreateFeatureHandler`, etc.

### Changed
- `Globe` class (packages/engine/src/Globe.ts): added `executeCommand()` method that accepts `Command` instances
- `EarthCamera` class (packages/engine/src/EarthCamera.ts): `flyTo()` now accepts `CameraAnimation` enum parameter

### Fixed
- Globe tile loading race condition on fast camera moves (packages/engine/src/TileSystem/TileManager.ts:152-178)
- Camera roll calculation producing NaN at polar regions (packages/engine/src/EarthCamera.ts:89-112)

## [v0.2.2] - 2026-08-18

### Added
- Globe atmosphere shader in `packages/engine/src/Materials/AtmosphereMaterial.ts`
- Camera orbit mode `POI_ORBIT` in `packages/engine/src/EarthCamera.ts`

### Fixed
- Mercator projection tile seams at antimeridian (packages/engine/src/TileSystem/TileCoord.ts:45)

## [v0.2.1] - 2026-08-16

### Fixed
- Camera roll calculation for polar regions (packages/engine/src/EarthCamera.ts:89-112)
```

### 2.2 变更日志规则（严格）

1. **每次版本升级**（无论是 PATCH、MINOR 还是 MAJOR）**都必须**有对应的 CHANGELOG 条目。
   - 例外：紧接着在同一次提交链中再次升级的版本可以共享一个条目（例如 squash 合并时）。
2. **阶段完成条目**必须包含阶段编号、阶段名称和勾选标记：`Phase N: Name ✓`。
3. **语义标题**必须严格使用：
   - `### Added` — 用于新功能、新类、新文件、新能力
   - `### Changed` — 用于对现有功能的变更（行为变更，而非保持行为不变的重构）
   - `### Fixed` — 用于 Bug 修复
   - `### Deprecated` — 用于将在未来版本中移除的功能
   - `### Removed` — 用于已弃用并已移除的功能
   - `### Security` — 用于漏洞修复
   - `### Performance` — 用于非 Bug 修复类的性能改进
4. **每条项目**必须引用至少一个 monorepo 内的具体文件路径（例如 `packages/engine/src/Globe.ts`）。
5. `CHANGELOG.md` 必须在版本升级的**同一次提交**中更新——禁止分开提交。
6. `CHANGELOG.md` **严禁**回溯修改。如果某条目有误，在下一个版本中新增条目说明更正。
7. CHANGELOG 必须在每个章节内按重要性排序（影响最大的排在前面）。
8. 项目中的文件路径必须使用格式：`packages/<package>/src/<path>/<file>.ts`（相对于仓库根目录，用反引号包裹）。
9. 如果某一版本在某个章节下没有条目，完全省略该章节（不要写"None"）。

---

## 3. 面向对象开发规则（严格）

### 3.1 类层次结构规则

1. **每个 proto `message`** → 一个 TypeScript **类**或**接口**，位于 `packages/core/src/models/`。
   - 如果消息具有行为（方法），使用类。
   - 如果消息是纯数据传输对象，使用接口。
2. **每个 proto `oneof`** → 一个**抽象基类**，包含每个分支对应的具体子类。
   - 示例：`Command` 是抽象的；`FlyToCameraCommand`、`PerformSearchCommand` 等是具体子类。
3. **每个 proto `enum`** → 一个 TypeScript **枚举**，具有相同的名称和相同的数值。
   - 严禁与 proto 枚举值不一致。数值必须完全匹配，以保证二进制协议兼容性。
4. **所有表示状态的类**必须使用 MobX 装饰器：
   - `@observable` 用于可变字段（在应用生命周期中会变化的字段）
   - `@action` 用于变更方法（修改 observable 字段的方法）
   - `@computed` 用于派生 getter（从 observable 计算得出的值）
5. **构造函数参数**必须在名称、类型和可选性上与 proto 字段定义匹配。
   - 必需的 proto 字段 → 必需的构造函数参数。
   - 可选的 proto 字段 → 带 `?` 后缀的可选构造函数参数。
6. **每个类**必须实现：
   - `toProto(): <ProtoType>` — 将类实例序列化为其 proto 等价物
   - `static fromProto(p: <ProtoType>): <ThisType>` — 从 proto 创建类实例
7. **服务类**（位于 `packages/*/src/services/` 的类）必须是**无状态单例**：
   - 服务类上不能有 `@observable` 字段
   - 所有可变状态通过方法参数传递
   - 服务可以在构造函数中持有配置（只读）

### 3.2 文件组织

```
packages/core/src/models/           ← 每个文件一个类
packages/core/src/services/         ← 每个文件一个服务
packages/core/src/interfaces/       ← 抽象契约（接口）
packages/core/src/validation/       ← 验证逻辑（每个领域一个验证器）
packages/engine/src/                ← Three.js 渲染类
packages/engine/src/Layers/         ← 图层渲染器（每个文件一个）
packages/engine/src/Features/       ← 要素渲染器（每个文件一个）
packages/engine/src/Materials/      ← 着色器材质（每个文件一个）
packages/engine/src/TileSystem/     ← 瓦片加载、缓存、LOD
packages/engine/src/Effects/        ← 后处理、大气效果
packages/engine/src/Utils/          ← 数学、常量、辅助函数
packages/server/src/services/       ← 后端业务逻辑服务
packages/server/src/services/db/    ← 数据库模式、迁移、仓储
packages/server/src/middleware/     ← Express/Next.js 中间件
packages/client/src/stores/         ← MobX store（每个状态切片一个，共约 60 个）
packages/client/src/components/     ← React 组件
packages/client/src/hooks/          ← React hooks
packages/client/src/app/            ← Next.js App Router 页面和布局
```

### 3.3 命名约定

| 实体 | 约定 | 示例 |
|---|---|---|
| 类 | `PascalCase`，匹配 proto 消息名称 | `CommandDispatcher`、`FlyToCameraCommand` |
| 文件（类文件） | `kebab-case`，匹配类名 | `command-dispatcher.ts` → `CommandDispatcher` |
| 文件（测试文件） | `<source-file>.test.ts` 或 `<source-file>.spec.ts` | `command-dispatcher.test.ts` |
| 接口（抽象契约） | `PascalCase` 带 `I` 前缀 | `IGlobeRenderer`、`ICameraController` |
| 接口（数据形态、API 类型） | `PascalCase`，不带 `I` 前缀 | `SearchRequest`、`FeatureResponse` |
| 枚举 | `PascalCase`，匹配 proto 枚举名称 | `CameraAnimation`、`AltitudeMode` |
| 方法 | `camelCase`，动词开头 | `executeCommand()`、`getState()`、`render()` |
| 私有字段 | `underscore` 前缀 | `private _tileCache: Map<string, Tile>` |
| 常量 | `UPPER_SNAKE_CASE` | `WGS84_RADIUS_MAJOR`、`EARTH_RADIUS_EQUATORIAL` |
| 布尔变量 | `is`、`has`、`should`、`can` 前缀 | `isVisible`、`hasChildren`、`shouldRender` |
| 事件处理函数 | `handle` 前缀 | `handleLayerToggle`、`handleSearchSubmit` |
| 桶导出 | `index.ts` | `packages/core/src/models/commands/index.ts` |

### 3.4 继承规则（严格）

1. **严禁**在类签名（extends、implements、方法参数、返回类型）中使用 `any` 类型。
   - 当类型确实未知时，使用 `unknown`。
   - 当类型可变时，使用泛型。
2. **严禁**违反**里氏替换原则**（LSP）：
   - 子类必须能在任何期望父类的地方使用。
   - 子类不能加强前置条件（例如要求更具体的输入类型）。
   - 子类不能削弱后置条件（例如返回更宽泛的类型或允许更多状态）。
   - 子类不能抛出父类未声明的异常。
3. **子类必须实现**其父类的所有抽象方法。
   - 因缺少抽象方法实现而导致编译失败是 CI 阻断级错误。
4. **所有重写的方法必须使用 `@override` 装饰器**。
   - 这提供编译时验证，确保该方法确实重写了父类方法。
   - 在 `tsconfig.base.json` 中添加 `"noImplicitOverride": true` 以强制执行此规则。

### 3.5 类模板

代码库中每个新类都必须遵循此模板：

```typescript
// packages/core/src/models/commands/fly-to-camera-command.ts

import { makeObservable, observable, action, computed } from 'mobx';
import { Command } from './Command';
import { LookAtCamera } from '../camera/LookAtCamera';
import { LookFromCamera } from '../camera/LookFromCamera';
import { CameraAnimation } from '../camera/CameraAnimation';
import { CameraPresentationMode } from '../camera/CameraPresentationMode';
import { Panorama } from '../camera/Panorama';
import type { FlyToCamera as FlyToCameraProto } from '@earthstudio/proto/gen/commands';

export class FlyToCameraCommand extends Command {
  @observable private _camera: LookAtCamera | LookFromCamera;
  @observable private _animation: CameraAnimation;
  @observable private _presentation: CameraPresentationMode;
  @observable private _panorama?: Panorama;
  @observable private _disableClamping: boolean;

  constructor(params: {
    camera: LookAtCamera | LookFromCamera;
    animation: CameraAnimation;
    presentation: CameraPresentationMode;
    panorama?: Panorama;
    disableClamping?: boolean;
  }) {
    super();
    this._camera = params.camera;
    this._animation = params.animation;
    this._presentation = params.presentation;
    this._panorama = params.panorama;
    this._disableClamping = params.disableClamping ?? false;

    makeObservable(this);
  }

  @computed get camera(): LookAtCamera | LookFromCamera {
    return this._camera;
  }

  @action setCamera(camera: LookAtCamera | LookFromCamera): void {
    this._camera = camera;
  }

  @computed get animation(): CameraAnimation {
    return this._animation;
  }

  // ... additional getters/setters

  @override
  toProto(): FlyToCameraProto {
    return {
      cameraType: this._camera instanceof LookAtCamera
        ? { oneofKind: 'lookAt', lookAt: this._camera.toProto() }
        : { oneofKind: 'lookFrom', lookFrom: (this._camera as LookFromCamera).toProto() },
      cameraAnimation: this._animation as number,
      cameraPresentationMode: this._presentation as number,
      panorama: this._panorama?.toProto(),
      disableClamping: this._disableClamping,
    };
  }

  @override
  static fromProto(proto: FlyToCameraProto): FlyToCameraCommand {
    const camera = proto.cameraType?.oneofKind === 'lookAt'
      ? LookAtCamera.fromProto(proto.cameraType.lookAt)
      : LookFromCamera.fromProto(proto.cameraType!.lookFrom!);

    return new FlyToCameraCommand({
      camera,
      animation: proto.cameraAnimation as CameraAnimation,
      presentation: proto.cameraPresentationMode as CameraPresentationMode,
      panorama: proto.panorama ? Panorama.fromProto(proto.panorama) : undefined,
      disableClamping: proto.disableClamping,
    });
  }
}
```

---

## 4. 阶段边界（不可跨越）

### 4.1 阶段依赖图

```
Phase 0 (Proto 流水线) ──── 所有阶段的必要前提
  │
  ├─→ Phase 1 (基础：地球 + 相机)
  │     │
  │     └─→ Phase 2 (命令 + 状态)
  │           │
  │           ├─→ Phase 3 (内容创建：要素、KML、文档)
  │           ├─→ Phase 4 (搜索 + 知识卡片)
  │           └─→ Phase 5 (图层 + 地图样式)
  │                 │
  │                 ├─→ Phase 6 (街景 + 时间功能)
  │                 ├─→ Phase 7 (设计工具：日照、建筑、分析)
  │                 └─→ Phase 8 (Earth Mate AI 助手)
  │                       │
  │                       └─→ Phase 9 (云端项目 + 协作)
  │                             │
  │                             └─→ Phase 10 (分析 + 打磨 + 发布)
```

### 4.2 边界规则（严禁违反）

1. **严禁**在 Phase N 被宣布为**完成**之前实现 Phase N+1 的功能。
2. **"完成"**的定义是以下所有条件均为真：
   - 该阶段的所有类均已定义（核心交付物没有剩余 stub）。
   - 所有方法均已实现（核心方法中没有 `throw new Error('Not implemented')`）。
   - 所有单元测试通过（`npx vitest run` 返回退出码 0）。
   - 所有集成测试通过（如果该阶段适用）。
   - 代码审查完成并批准（至少 1 位审查者，没有未解决的"要求修改"）。
   - `CHANGELOG.md` 有该阶段完成条目。
   - 版本标签已推送（阶段完成时为 `git tag vX.Y.0`）。
3. **如果需要后期阶段的类型作为依赖**（例如 Phase 4 需要 Phase 3 中的 `Feature` 类型），你可以仅将**接口**（而非实现）提取到早期阶段。
   - 将接口 stub 放在 `packages/core/src/interfaces/` 中，仅包含方法签名。
   - 标记为 `// @phase-stub — full implementation in Phase N`。
   - 实际实现放在其所属的阶段。
4. **Stub 实现**在早期阶段中仅允许在以下情况下使用：
   - 返回明确标注为模拟/示例数据的数据。
   - 放在包内的 `__stubs__/` 目录中。
   - 文件顶部有 `// STUB: Phase N — replace with real implementation` 注释。
   - 通过 TypeScript 类型检查（返回正确的类型，即使数据是假的）。
5. **阶段完成检查清单**（阶段完成 PR 的描述模板）：

```markdown
## Phase N Completion Checklist

- [ ] All classes defined in `packages/core/src/models/`
- [ ] All methods implemented (no `throw new Error('Not implemented')`)
- [ ] All unit tests pass: `npx vitest run --coverage`
- [ ] Coverage meets phase thresholds
- [ ] All integration tests pass: `npx vitest run --config vitest.integration.config.ts`
- [ ] Code review approved by at least 1 reviewer
- [ ] CHANGELOG.md updated with phase completion entry
- [ ] Version bumped to vX.Y.0 (MINOR)
- [ ] Version tag pushed
- [ ] No remaining `// STUB` comments in phase deliverables
- [ ] No cross-phase feature creep (features from later phases not sneakily included)
```

---

## 5. 前后端分离（严格）

### 5.1 通信契约

```typescript
// packages/core/src/interfaces/api/search.ts
// ─── 这是唯一的共享接口层 ───

export interface SearchRequest {
  q: string;
  bbox?: string;           // "west,south,east,north"
  lang?: string;
  limit?: number;          // default 10
  resultGroupId?: string;  // for paginated results
}

export interface SearchResponse {
  results: SearchResult[];
  totalResults: number;
  attribution: string;
}

export interface SearchResult {
  placeId: string;         // FID or MID
  displayName: string;
  description: string;
  location: { lat: number; lng: number };
  bbox?: LatLonBox;
  category: string;
  thumbnailUrl?: string;
  openLocationCode?: string;
}
```

### 5.2 导入边界（ESLint 强制执行）

```javascript
// .eslintrc.js — import boundary rules
module.exports = {
  rules: {
    // packages/client/ SHALL NOT import from packages/server/
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['@earthstudio/server/**', 'packages/server/**'],
          message: 'Client code MUST NOT import server code. Use @earthstudio/core for shared types.',
        },
        {
          group: ['@earthstudio/engine/**'],
          message: 'Server code MUST NOT import engine code. Use @earthstudio/core for shared types.',
        },
        {
          group: ['three', 'three/**'],
          message: 'Server code MUST NOT import Three.js. Use @earthstudio/core for geometry types.',
        },
        {
          group: ['pg', 'drizzle-orm', 'postgres'],
          message: 'Client code MUST NOT import database drivers.',
        },
      ],
    }],
  },
};
```

### 5.3 允许的导入路径

| 源包 | 允许的导入 |
|---|---|
| `packages/client/` | `@earthstudio/core`、`@earthstudio/engine`、`@earthstudio/proto`、React 生态 |
| `packages/engine/` | `@earthstudio/core`、`@earthstudio/proto`、Three.js 生态 |
| `packages/server/` | `@earthstudio/core`、`@earthstudio/proto`、Node.js/DB 生态 |
| `packages/core/` | `@earthstudio/proto`、标准 TypeScript 库 |
| `packages/proto/` | 不依赖其他包（proto 是根依赖） |

### 5.4 API 规则

1. **每个端点**必须在 `packages/core/src/interfaces/api/<domain>.ts` 中有类型化的请求和响应接口。
2. **后端验证所有输入**，使用从 proto 字段约束派生的 Zod schema：
   ```typescript
   // packages/server/src/middleware/validation.ts
   import { z } from 'zod';

   export const SearchRequestSchema = z.object({
     q: z.string().min(1).max(500),
     bbox: z.string().regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?$/).optional(),
     lang: z.string().length(2).optional(),
     limit: z.number().int().min(1).max(100).optional().default(10),
     resultGroupId: z.string().optional(),
   });
   ```
3. **前端处理所有加载、错误和空状态**——后端绝不返回需要前端静默解释的部分成功状态。
4. **API 错误**必须返回标准错误格式：
   ```typescript
   // packages/core/src/interfaces/api/errors.ts
   export interface ErrorResponse {
     error: {
       code: string;         // e.g., 'FEATURE_NOT_FOUND', 'VALIDATION_ERROR', 'RATE_LIMITED'
       message: string;      // Human-readable description
       details?: unknown;    // Optional structured error details (field-level for validation)
       requestId: string;    // UUID for tracing
     };
   }
   ```
5. **严禁通过 REST API 传递原始 proto 字节**。始终通过 `toProto()` 将 proto 序列化为 JSON 并发送 JSON。proto 二进制格式仅用于 WebSocket/实时通道，不用于 REST。
6. 所有 API 路由位于 `/api/` 前缀下（Next.js 约定）。
7. 所有 API 响应包含 `Content-Type: application/json` 头。
8. 敏感数据（令牌、密码、个人身份信息）严禁出现在查询参数中——仅允许放在 POST/PUT 的请求体中或 Authorization 头中。

---

## 6. 测试规则

### 6.1 覆盖率阈值（CI 强制执行）

| 包 | 行覆盖率 | 分支覆盖率 | 理由 |
|---|---|---|---|
| `packages/core/` | **90%+** | **85%+** | 领域逻辑至关重要；每个类、每个方法、每个边界情况 |
| `packages/engine/` | **70%+** | **60%+** | 渲染代码是可视化的；部分测试需要人工验证或 WebGL mock |
| `packages/server/` | **80%+** | **75%+** | API 和数据库逻辑；模拟外部服务 |
| `packages/client/` | **60%+** | **50%+** | UI 组件；部分交互需要 Playwright 浏览器测试 |
| `packages/proto/` | **95%+** | 不适用 | 适配器逻辑和协议兼容性；生成的代码不计入覆盖率 |

### 6.2 测试组织

```
packages/<package>/src/__tests__/
├── unit/                      ← 纯逻辑测试；无网络、无 DOM
│   ├── models/
│   │   ├── commands/
│   │   │   ├── fly-to-camera-command.test.ts
│   │   │   ├── perform-search-command.test.ts
│   │   │   └── ...
│   │   ├── features/
│   │   │   ├── placemark.test.ts
│   │   │   ├── polyline.test.ts
│   │   │   └── ...
│   │   └── ...
│   └── services/
│       ├── command-dispatcher.test.ts
│       ├── kml-parser.test.ts
│       └── ...
├── integration/               ← 跨包或多类测试
│   ├── command-execution.test.ts     # 命令 → 状态 → 渲染流水线
│   ├── feature-persistence.test.ts   # 要素 → 数据库 → 要素往返
│   └── ...
└── e2e/                       ← 全栈 Playwright 测试
    ├── globe-navigation.spec.ts
    ├── feature-creation.spec.ts
    └── ...
```

### 6.3 测试文件命名

- 单元测试：`<source-file-name>.test.ts`（放在 `__tests__/unit/` 中）
- 集成测试：`<scenario-name>.test.ts`（放在 `__tests__/integration/` 中）
- E2E 测试：`<scenario-name>.spec.ts`（放在 `__tests__/e2e/` 中）
- 测试 fixture：`<source-file-name>.fixtures.ts`（放在 `__tests__/fixtures/` 中）

### 6.4 每个类的测试要求

对于 `packages/core/src/models/` 中的每个类：

- [ ] 构造函数测试（所有参数、部分参数、默认值）
- [ ] `toProto()` 测试（序列化 → 检查 proto 结构是否与预期匹配）
- [ ] `fromProto()` 测试（从 proto 创建 → 检查类字段是否匹配）
- [ ] 往返测试（`fromProto(toProto(instance))` 生成等价实例）
- [ ] 对于有方法的类：用正常、边界和错误输入测试每个公开方法
- [ ] 对于 observable 类：测试每个 `@action` 方法、每个 `@computed` getter

### 6.5 CI 测试执行

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx vitest run --config vitest.unit.config.ts --coverage
        env:
          CI: true

  integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:16-3.4
        env:
          POSTGRES_DB: earthstudio_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run db:migrate -- --env test
      - run: npx vitest run --config vitest.integration.config.ts
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/earthstudio_test

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npx playwright test
```

---

## 7. Git 工作流

### 7.1 分支策略

```
main                           ← 受保护，始终可部署，线性历史
  ├── phase/0-proto-pipeline   ← 阶段分支（每个阶段一个）
  │   ├── feature/X            ← 功能分支（从阶段分支创建，合并到阶段分支）
  │   └── fix/X                ← Bug 修复分支（从阶段分支创建，合并到阶段分支）
  ├── phase/1-foundation
  ├── phase/2-commands-state
  ├── phase/3-content-creation
  ├── phase/4-search-knowledge
  ├── phase/5-layers-mapstyle
  ├── phase/6-streetview-time
  ├── phase/7-design-tools
  ├── phase/8-earth-mate-ai
  ├── phase/9-cloud-collab
  ├── phase/10-polish-release
  └── hotfix/X                 ← 紧急修复（从 main 创建，合并到 main 然后 cherry-pick 到活动阶段分支）
```

### 7.2 分支命名约定

| 分支类型 | 格式 | 示例 |
|---|---|---|
| 阶段分支 | `phase/<N>-<kebab-name>` | `phase/2-commands-state` |
| 功能分支 | `feature/<kebab-description>` | `feature/globe-atmosphere-shader` |
| Bug 修复分支 | `fix/<kebab-description>` | `fix/command-dispatcher-undo-stack-overflow` |
| 热修复分支 | `hotfix/<kebab-description>` | `hotfix/tile-loading-crash-production` |
| 杂项分支 | `chore/<kebab-description>` | `chore/update-node-version` |
| 文档分支 | `docs/<kebab-description>` | `docs/api-endpoint-reference` |

### 7.3 提交格式

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**类型：** `feat`、`fix`、`docs`、`refactor`、`test`、`chore`、`style`、`perf`、`ci`、`build`、`revert`

**范围：** 包名称（以下之一：`proto`、`core`、`engine`、`server`、`client`、`root`）

**规则：**
- 描述必须以小写开头并使用祈使语气（"add"，而非 "added" 或 "adds"）。
- 描述不得超过 72 个字符。
- 如果提交关闭了一个 issue，在 footer 中包含 `Closes #N`。
- 如果提交引入了破坏性变更，在 footer 中包含 `BREAKING CHANGE: <description>`。

**示例：**

```
feat(engine): implement Globe atmosphere scattering shader

Adds Rayleigh and Mie scattering calculations in AtmosphereMaterial to
produce realistic atmospheric glow effect visible from orbit.

Closes #42
```

```
fix(core): prevent CommandDispatcher undo stack overflow

The undo stack would grow unbounded when rapid successive commands were
dispatched. Added a maxUndoStackSize config (default: 100) that drops
the oldest entry when exceeded.

Fixes #128
```

```
chore(release): bump version to v0.2.0 — Phase 1: Foundation ✓

Closes #55
```

### 7.4 合并规则（严格）

1. **功能/修复分支 → 阶段分支：** **Squash 合并。**
   - 每个功能一个 squash 提交。保持阶段分支历史干净。
   - Squash 消息：从 PR 标题中取 `<type>(<scope>): <description>`。
   - 合并后删除功能分支。
2. **阶段分支 → `main`：** **Merge commit**（禁止 squash、禁止 rebase）。
   - 保留阶段分支中的各个提交以用于审计追溯。
   - Merge commit 消息：`chore(merge): merge phase/<N>-<name> into main`。
3. **阶段合并后在 `main` 上打标签。**
   - 标签格式：`vX.Y.0`（阶段完成时 MINOR 升级）。
   - 标签消息：`Release vX.Y.0: Phase N — <Phase Name>`。
4. **热修复分支 → `main`：** **Squash 合并。**
   - 合并到 `main` 后，将 squash 后的提交 cherry-pick 到活动阶段分支。
5. **严禁**对 `main` 或任何阶段分支进行 force push。
   - Force push 仅允许在个人功能/修复分支上使用。
6. **严禁** rebase 共享分支（`main`、`phase/*`）。
   - Rebase 仅允许在创建 PR 前的个人分支上使用。
7. **分支保护规则**（在 GitHub 中强制执行）：
   - `main`：需要 1 个批准审查、所有状态检查通过、禁止直接推送。
   - `phase/*`：需要 1 个批准审查、单元测试通过、禁止直接推送。
8. **过期分支：** 删除已合并的分支。超过 30 天未合并的分支必须要么合并，要么在 PR 中明确标记为 `[WIP]`。

---

## 8. 代码审查清单

### 8.1 每个 PR 必须检查的项目

每个 Pull Request 必须在合并前满足以下所有条件。审查者必须逐项明确检查：

#### 架构与设计
- [ ] **OOP 层次结构规则遵守**：每个 proto message 映射到一个类；proto oneof 映射到抽象基类 + 具体子类；proto enum 映射到 TypeScript 枚举。
- [ ] **阶段边界遵守**：没有在 Phase N 完成前实现 Phase N+1 的功能。如果提取了接口，已标记为 `@phase-stub`。
- [ ] **前后端分离保持**：没有跨边界导入。客户端不导入服务端代码。服务端不导入引擎代码。
- [ ] **包边界遵守**：没有跨包的内部导入（始终使用包名，如 `@earthstudio/core` 而非 `../../core/src/...`）。
- [ ] **类文件组织**：每个文件一个类（小型私有辅助类除外）。文件按第 3.2 节规定放在正确的目录中。

#### 代码质量
- [ ] **没有 `any` 类型**：在 diff 中 grep 搜索 `: any` 和 `as any`。每个出现都必须有注释说明理由。
- [ ] **MobX 装饰器使用正确**：`@observable` 用于状态，`@action` 用于变更，`@computed` 用于派生。禁止在 `@action` 之外直接修改 `@observable`。
- [ ] **`toProto()` 已实现**：每个模型类都有可工作的 `toProto()` 方法。
- [ ] **`fromProto()` 已实现**：每个模型类都有可工作的 `static fromProto()` 方法。
- [ ] **重写方法上有 `@override` 装饰器**：检查所有 `override` 关键字存在。
- [ ] **没有死代码**：没有注释掉的代码块（第 4.2 节规定的 `// STUB` 标记除外）。
- [ ] **没有 `console.log`**：使用 `EventLogger` 进行生产日志记录或移除。
- [ ] **没有硬编码的密钥**：代码中没有 API 密钥、令牌或密码。使用环境变量。

#### 测试
- [ ] **测试已添加/更新**：新类有单元测试。变更的行为有更新的测试。
- [ ] **测试覆盖率满足阈值**：运行 `npx vitest run --coverage` 并验证包满足其阈值（第 6.1 节）。
- [ ] **测试通过**：CI 在所有测试作业上显示绿色。
- [ ] **边界情况已覆盖**：测试包括正常路径、错误路径和边界情况（null、undefined、空、边界值）。

#### 文档
- [ ] **CHANGELOG 条目已添加**（如果此 PR 中升级了版本）。
- [ ] **内联文档**：公开方法有 JSDoc 注释。复杂逻辑有解释性注释。
- [ ] **没有误导性注释**：注释准确描述其伴随的代码。

#### 性能与安全
- [ ] **没有明显的性能问题**：没有 O(n²) 而 O(n) 可行的情况。事件处理程序中没有同步阻塞。
- [ ] **输入验证**：所有用户暴露的输入都经过验证（API 路由上的 Zod schema）。
- [ ] **没有 XSS 向量**：React 中渲染的用户内容使用适当的转义。没有未经清理的 `dangerouslySetInnerHTML`。

### 8.2 审查者职责

1. **不要批准有未解决的 `// TODO` 注释的 PR**——TODO 必须作为 issue 跟踪。
2. **不要批准 CI 检查失败的 PR**——所有状态检查必须通过。
3. **在 1 个工作日内完成审查**——如果无法完成，重新分配给其他审查者。
4. **提供可操作的反馈**——说"将 X 改为 Y，因为 Z"，而不是"这看起来不对"。
5. **明确区分阻塞性意见和非阻塞性意见**——对风格建议使用 `nit:` 前缀。

---

## 9. 目录与文件创建规则

### 9.1 `packages/core/src/models/` 结构

```
packages/core/src/models/
├── commands/
│   ├── command.ts                      ← 抽象基类 Command
│   ├── clear-search-history-command.ts
│   ├── create-cloud-project-command.ts
│   ├── create-designs-command.ts
│   ├── create-feature-command.ts
│   ├── create-features-in-folder-command.ts
│   ├── create-point-placemark-command.ts
│   ├── delete-feature-command.ts
│   ├── edit-feature-command.ts
│   ├── enter-street-view-command.ts
│   ├── enter-time-machine-command.ts
│   ├── enter-timelapse-command.ts
│   ├── fly-to-camera-command.ts
│   ├── open-cloud-project-command.ts
│   ├── open-earth-mate-chat-command.ts
│   ├── open-feeling-lucky-card-command.ts
│   ├── open-image-generator-command.ts
│   ├── open-knowledge-card-command.ts
│   ├── open-kml-document-command.ts
│   ├── open-kml-document-from-content-command.ts
│   ├── open-project-by-key-command.ts
│   ├── open-search-history-command.ts
│   ├── perform-search-command.ts
│   ├── preview-data-layer-command.ts
│   ├── set-basemap-style-command.ts
│   ├── set-homescreen-visibility-command.ts
│   ├── show-layer-card-details-command.ts
│   ├── toggle-available-layers-ui-command.ts
│   ├── toggle-layer-command.ts
│   ├── view-design-command.ts
│   ├── view-on-demand-analysis-command.ts
│   ├── view-rate-card-command.ts
│   └── index.ts                        ← 桶导出（重新导出全部 34 个命令）
├── camera/
│   ├── camera.ts                       ← 抽象基类 Camera
│   ├── look-at-camera.ts
│   ├── look-from-camera.ts
│   ├── camera-animation.ts             ← 枚举
│   ├── camera-presentation-mode.ts     ← 枚举
│   ├── panorama.ts
│   └── index.ts
├── geometry/
│   ├── location.ts
│   ├── rotation.ts
│   ├── lat-lng.ts
│   ├── lat-lng-alt.ts
│   ├── lat-lon-box.ts
│   ├── bounding-box.ts
│   ├── size.ts
│   ├── coordinate-systems.ts
│   └── index.ts
├── features/
│   ├── feature.ts                      ← 抽象基类
│   ├── folder.ts
│   ├── placemark.ts
│   ├── point-placemark.ts
│   ├── polyline.ts
│   ├── polygon.ts
│   ├── multi-geometry.ts
│   ├── ground-overlay.ts
│   ├── screen-overlay.ts
│   ├── photo-overlay.ts
│   ├── model-3d.ts
│   ├── network-link.ts
│   ├── track-set.ts
│   ├── tour.ts
│   ├── feature-tree.ts
│   └── index.ts
├── styles/
│   ├── content-style.ts
│   ├── point-style.ts
│   ├── polyline-style.ts
│   ├── polygon-style.ts
│   ├── balloon-style.ts
│   ├── label-style.ts
│   ├── list-item-style.ts
│   ├── icon.ts
│   ├── color.ts
│   ├── style-url-list.ts
│   └── index.ts
├── layers/
│   ├── layer.ts                        ← 抽象基类
│   ├── satellite-layer.ts
│   ├── roadmap-layer.ts
│   ├── terrain-layer.ts
│   ├── building-layer.ts
│   ├── cloud-layer.ts
│   ├── photo-layer.ts
│   ├── gridlines-layer.ts
│   ├── timelapse-layer.ts
│   ├── three-d-coverage-layer.ts
│   ├── updated-imagery-layer.ts
│   ├── land-parcels-layer.ts
│   ├── pinned-projects-layer.ts
│   ├── discovery-layer.ts
│   └── index.ts
├── document/
│   ├── document.ts
│   ├── document-metadata.ts
│   ├── document-properties.ts
│   ├── document-schema.ts
│   ├── document-contents.ts
│   ├── document-namespace.ts           ← 枚举
│   ├── map-type.ts
│   ├── feature-key.ts
│   ├── io-operation.ts
│   ├── role.ts                         ← 枚举
│   └── index.ts
├── mapstyle/
│   ├── map-style.ts
│   ├── projection.ts                   ← 枚举
│   ├── imagery.ts                      ← 枚举
│   ├── three-d-features.ts             ← 枚举
│   ├── base-layers.ts
│   ├── base-layers-preset.ts           ← 枚举
│   ├── gridlines-mode.ts               ← 枚举
│   └── index.ts
├── knowledge/
│   ├── renderable-entity.ts
│   ├── knowledge-card.ts
│   ├── image.ts
│   ├── fact.ts
│   ├── card-set.ts
│   ├── open-hours.ts
│   ├── open-location-code.ts
│   └── index.ts
├── earthdata/
│   ├── earth-data-layer.ts
│   ├── color-ramp.ts
│   ├── color-palette.ts
│   ├── categorical-style-rule.ts
│   ├── interpolated-style-rule.ts
│   ├── data-binding.ts
│   └── index.ts
├── media/
│   ├── media.ts
│   ├── media-display-resource.ts
│   ├── image-media.ts
│   ├── youtube-video.ts
│   └── index.ts
└── mutations/
    ├── data-mutation.ts
    ├── data-mutation-set.ts
    ├── add-feature.ts
    ├── delete-feature.ts
    ├── update-feature-properties.ts
    ├── set-style.ts
    ├── add-column.ts
    ├── remove-column.ts
    ├── update-column.ts
    ├── add-feature-media.ts
    ├── delete-feature-media.ts
    ├── set-feature-parent.ts
    ├── set-feature-index.ts
    ├── update-document-properties.ts
    ├── update-style-options.ts
    └── index.ts
```

### 9.2 `packages/engine/src/` 结构

```
packages/engine/src/
├── globe.ts                           ← 地球控制器
├── earth-camera.ts                    ← 相机（LookAt/LookFrom）
├── map-style-controller.ts           ← MapStyle → 渲染器状态
├── coordinate-systems.ts             ← WGS84、Mercator、S2 坐标转换
├── Layers/
│   ├── layer.ts                       ← 抽象基类
│   ├── satellite-layer-renderer.ts
│   ├── roadmap-layer-renderer.ts
│   ├── terrain-layer-renderer.ts
│   ├── building-layer-renderer.ts
│   ├── cloud-layer-renderer.ts
│   ├── photo-layer-renderer.ts
│   ├── gridlines-layer-renderer.ts
│   ├── timelapse-layer-renderer.ts
│   ├── earth-data-layer-renderer.ts
│   └── index.ts
├── Features/
│   ├── feature-renderer.ts            ← 抽象基类
│   ├── placemark-renderer.ts
│   ├── polyline-renderer.ts
│   ├── polygon-renderer.ts
│   ├── model-3d-renderer.ts           ← GLTF/GLB 模型
│   ├── ground-overlay-renderer.ts
│   ├── screen-overlay-renderer.ts
│   ├── label-renderer.ts
│   ├── balloon-renderer.ts            ← 信息窗口/弹出框
│   └── index.ts
├── Materials/
│   ├── earth-material.ts              ← 地球表面着色器
│   ├── atmosphere-material.ts         ← 大气散射
│   ├── water-material.ts
│   ├── cloud-material.ts
│   ├── building-material.ts
│   ├── terrain-material.ts
│   ├── polyline-material.ts
│   ├── polygon-material.ts
│   ├── gridline-material.ts
│   └── index.ts
├── TileSystem/
│   ├── tile-manager.ts                ← 瓦片加载/缓存/LOD
│   ├── tile-coord.ts                  ← x/y/zoom
│   ├── vector-tile-decoder.ts
│   ├── raster-tile-provider.ts
│   ├── elevation-tile-provider.ts
│   ├── tile-cache.ts                  ← LRU 内存缓存
│   └── index.ts
├── Effects/
│   ├── atmosphere.ts                  ← 天空、太阳、星星
│   ├── post-processing.ts             ← Bloom、色调映射
│   ├── water-reflection.ts
│   └── index.ts
└── Utils/
    ├── geo-math.ts                    ← 大圆、S2 转换
    ├── interpolation.ts               ← 相机插值（slerp、lerp）
    ├── raycasting.ts                  ← 地球拾取/相交
    ├── constants.ts                   ← WGS84 半径、EPSG 代码
    └── index.ts
```

### 9.3 `packages/client/src/stores/` 结构

```
packages/client/src/stores/
├── search-store.ts
├── knowledge-card-store.ts
├── layer-store.ts
├── camera-store.ts
├── map-style-store.ts
├── document-store.ts
├── feature-store.ts
├── drawing-tool-store.ts
├── measure-tool-store.ts
├── time-machine-store.ts
├── timelapse-store.ts
├── street-view-store.ts
├── earth-mate-store.ts
├── design-store.ts
├── design-input-store.ts
├── analysis-store.ts
├── onboarding-store.ts
├── homescreen-store.ts
├── navigation-store.ts
├── pinned-projects-store.ts
├── balloon-store.ts
├── card-dock-store.ts
├── bottom-sheet-store.ts
├── property-editor-store.ts
├── inspector-store.ts
├── left-panel-store.ts
├── top-toolbar-store.ts
├── main-toolbar-store.ts
├── menu-bar-store.ts
├── shortcuts-store.ts
├── industry-selector-store.ts
├── feedback-store.ts
├── user-errors-store.ts
├── collapsed-widgets-store.ts
├── back-navigation-store.ts
├── picking-store.ts
├── my-location-store.ts
├── site-selection-store.ts
├── gcp-project-billing-store.ts
├── app-theme-store.ts
├── app-root-store.ts
├── deeplink-store.ts
├── document-manager-store.ts
├── earth-render-store.ts
├── view-status-store.ts
└── index.ts                           ← 桶导出
```

### 9.4 禁止规则

1. **严禁**在一个文件中放置两个公开类。"公开类"是指从包中导出的任何类。小型私有辅助类（仅在文件内部使用且不导出）是允许的。
2. **严禁**将 MobX store 放在 `packages/core/` 中。Store 仅限客户端使用（它们使用 React context、浏览器 API）。
3. **严禁**在 `packages/server/` 中导入 Three.js。使用 `packages/core/` 中的几何类型进行计算。
4. **严禁**在 `packages/client/` 中导入数据库（`pg`、`drizzle-orm`、`postgres`）。
5. **严禁**跨包使用相对导入。始终使用包名：
   ```typescript
   // ❌ 错误
   import { Command } from '../../core/src/models/commands/Command';

   // ✅ 正确
   import { Command } from '@earthstudio/core';
   ```
6. **严禁**创建循环依赖。如果包 A 从包 B 导入，包 B 禁止从包 A 导入。使用共享包（或较低层级包）中的接口来打破循环。

---

## 10. 依赖注入与接口

### 10.1 构造函数注入（必须）

每个服务和非平凡类都必须使用构造函数注入。严禁使用全局单例或服务定位器：

```typescript
// ❌ 错误 — 全局单例
import { globe } from './global-instances';
export class CommandDispatcher {
  executeCommand(cmd: Command): void {
    globe.flyTo(cmd.camera);  // 隐式的、不可测试的依赖
  }
}

// ✅ 正确 — 构造函数注入
export class CommandDispatcher {
  constructor(
    private readonly globe: IGlobe,
    private readonly camera: ICamera,
    private readonly storeRegistry: IStoreRegistry,
    private readonly eventLogger: IEventLogger,
  ) {}

  executeCommand(cmd: Command): void {
    this.globe.flyTo(cmd.camera);  // 显式的、可测试的依赖
  }
}
```

### 10.2 接口定义

所有注入的依赖必须基于接口进行类型标注，而非具体类：

```typescript
// packages/core/src/interfaces/IGlobeRenderer.ts
export interface IGlobeRenderer {
  getCamera(): ICameraController;
  addFeature(feature: IFeature): void;
  removeFeature(id: string): void;
  updateFeature(id: string, feature: Partial<IFeature>): void;
  addLayer(layer: ILayer): void;
  removeLayer(id: string): void;
  setMapStyle(style: MapStyle): void;
  flyTo(camera: FlyToCameraCommand): Promise<void>;
  dispose(): void;
}
```

### 10.3 接口规则

1. **用于 DI（依赖注入）的接口**必须使用 `I` 前缀：`IGlobeRenderer`、`ICameraController`。
2. **用于 API 形态（请求/响应）的接口**不使用 `I` 前缀：`SearchRequest`、`SearchResponse`。
3. **用于数据模型（共享类型）的接口**不使用 `I` 前缀：`LatLng`、`BoundingBox`。
4. 每个接口必须放在 `packages/core/src/interfaces/` 中的独立文件中，或与领域模型放在一起。
5. 接口必须保持最小化——仅暴露消费者需要的内容。不要泄露实现细节（例如 `getThreeJsScene()` 是不好的——它使消费者与 Three.js 耦合）。

### 10.4 DI 容器

对于生产环境应用，使用轻量级 DI 容器：

```typescript
// packages/core/src/services/service-container.ts
import { Globe } from '@earthstudio/engine';
import { CommandDispatcher } from './CommandDispatcher';
import { CameraController } from './CameraController';
// ...

export class ServiceContainer {
  readonly globe: IGlobe;
  readonly camera: ICamera;
  readonly commandDispatcher: ICommandDispatcher;
  readonly featureService: IFeatureService;
  // ...

  constructor(config: AppConfig) {
    this.globe = new Globe(config.globe);
    this.camera = new CameraController(this.globe.getCamera());
    this.commandDispatcher = new CommandDispatcher(
      this.globe, this.camera, this.stores, this.eventLogger
    );
    // ...
  }

  dispose(): void {
    this.globe.dispose();
    // ...
  }
}
```

---

## 11. Proto 文件治理

### 11.1 官方 Proto 文件的绝对不可修改性

来自 Google Earth 的 **1,316 个现有 `.proto` 文件**是**神圣不可侵犯的**：

| 规则 | 执行方式 |
|---|---|
| **严禁**修改 `geo/`、`maps/`、`geostore/`、`logs/`、`google/` 或任何子目录下的任何现有 `.proto` 文件 | CI 检查：`git diff --name-only origin/main | grep '\.proto$' | grep -v '^devtools/'`——任何匹配项都会导致构建失败 |
| **严禁**删除任何现有 `.proto` 文件 | 同上 CI 检查 |
| **严禁**在现有 `.proto` 消息中添加新字段 | 代码审查清单、pre-commit hook |
| **严禁**修改现有消息的字段编号、类型或名称 | 代码审查清单 |
| 对外部 proto 的更改必须向上游 Google 提出，然后同步 | 同步时在提交消息中记录上游 CL 编号 |

### 11.2 新 Proto 文件规则（仅适用于我们的文件）

在创建**新的** `.proto` 文件时（位于 `devtools/` 或新目录下）：

1. 使用 `syntax = "editions"`（不要使用 proto2 或 proto3）。
2. 标准文件头：
   ```protobuf
   // Description: <purpose of this file>
   
   syntax = "editions";
   
   package earthstudio.<domain>;
   
   option java_multiple_files = true;
   option java_package = "com.earthstudio.<domain>";
   ```
3. **严禁使用 `required`**——始终使用 `optional`。
4. **枚举的第一个值必须为 0**——通常为 `<ENUM_NAME>_UNSPECIFIED = 0`。
5. **字段编号一旦发布就不可更改**。对已删除的字段使用 `reserved`：
   ```protobuf
   reserved 5, 6, 10 to 12;
   reserved "old_field_name", "deprecated_field";
   ```
6. **禁止反向依赖**：L2 不能导入 L3。禁止循环依赖。
7. **禁止未使用的导入**：每个 `import` 语句必须被文件中的至少一个字段或选项使用。

### 11.3 Proto 编译流水线

```bash
# 构建顺序（由 Turborepo 强制执行）
# 1. 第三方 stub（packages/proto/src/third_party/）
# 2. 剥离内部依赖（scripts/clean-protos.sh）
# 3. MessageSet → oneof 转换（scripts/convert-messageset.py）
# 4. 两遍 buf build（先 editions/proto3，再 proto2）
# 5. 生成 TypeScript（protobuf-ts）
# 6. 验证协议兼容性（packages/proto/src/__tests__/）

# 完整流水线如下：
npm run proto:clean    # 剥离 Google 内部导入
npm run proto:convert  # MessageSet → oneof 转换
npm run proto:generate # buf generate → TypeScript
npm run proto:validate # 协议兼容性测试
```

### 11.4 适配器层（packages/proto/src/adapters/）

每次 proto 到领域模型的转换都必须通过适配器。严禁内联进行 proto 到领域模型的转换：

```typescript
// ❌ 错误 — 在服务中进行内联转换
const cmd = new FlyToCameraCommand({
  camera: proto.cameraType?.oneofKind === 'lookAt' 
    ? new LookAtCamera(proto.cameraType.lookAt) 
    : new LookFromCamera(proto.cameraType.lookFrom),
  // ... 手动字段映射
});

// ✅ 正确 — 适配器处理
const cmd = CommandAdapter.fromProto(protoCommand);
```

---

## 12. 包依赖规则

### 12.1 依赖图（Turborepo 强制执行）

```
packages/proto/          ← 第 0 层：零内部依赖
       │
       ▼
packages/core/           ← 第 1 层：仅依赖 proto
       │
       ├──────────────────────┐
       ▼                      ▼
packages/engine/       packages/server/     ← 第 2 层：依赖 proto + core
       │
       ▼
packages/client/         ← 第 3 层：依赖 proto + core + engine
```

### 12.2 各包依赖白名单

#### `packages/proto/package.json`
```json
{
  "dependencies": {
    "@protobuf-ts/runtime": "^2.9.0",
    "@protobuf-ts/runtime-rpc": "^2.9.0"
  },
  "devDependencies": {
    "@protobuf-ts/plugin": "^2.9.0",
    "@bufbuild/buf": "^1.28.0"
  }
}
```
- 不依赖任何其他 `@earthstudio/*` 包。

#### `packages/core/package.json`
```json
{
  "dependencies": {
    "@earthstudio/proto": "workspace:*",
    "mobx": "^6.12.0",
    "zod": "^3.22.0"
  }
}
```
- 不依赖 `@earthstudio/engine`、`@earthstudio/server`、`@earthstudio/client`。
- 不导入 Three.js、React、Next.js 或数据库。

#### `packages/engine/package.json`
```json
{
  "dependencies": {
    "@earthstudio/proto": "workspace:*",
    "@earthstudio/core": "workspace:*",
    "three": "^0.170.0",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.92.0"
  }
}
```
- 不依赖 `@earthstudio/server` 或 `@earthstudio/client`。

#### `packages/server/package.json`
```json
{
  "dependencies": {
    "@earthstudio/proto": "workspace:*",
    "@earthstudio/core": "workspace:*",
    "drizzle-orm": "^0.29.0",
    "postgres": "^3.4.0",
    "next-auth": "^4.24.0",
    "zod": "^3.22.0"
  }
}
```
- 不依赖 `@earthstudio/engine` 或 `@earthstudio/client`。
- 不导入 Three.js 或 React。

#### `packages/client/package.json`
```json
{
  "dependencies": {
    "@earthstudio/proto": "workspace:*",
    "@earthstudio/core": "workspace:*",
    "@earthstudio/engine": "workspace:*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.2.0",
    "mobx": "^6.12.0",
    "mobx-react-lite": "^4.0.0"
  }
}
```
- 不依赖 `@earthstudio/server`。
- 不导入数据库驱动。

### 12.3 构建顺序（Turborepo）

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    }
  }
}
```

---

## 13. TypeScript 严格模式

### 13.1 `tsconfig.base.json`（共享基础配置）

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noImplicitOverride": true,
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true,
    "exactOptionalPropertyTypes": false,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "incremental": true
  }
}
```

### 13.2 TypeScript 规则

1. **所有包中 `strict: true`**。没有例外。
2. **`noImplicitOverride: true`**——所有重写的方法必须使用 `override` 关键字。
3. **`noUncheckedIndexedAccess: true`**——数组访问和记录访问返回 `T | undefined`。
4. **严禁使用 `any`**——使用 `unknown` 并通过类型守卫进行窄化。
5. **严禁使用 `as` 强制类型转换**来绕过类型错误，除非注释解释了为什么 TypeScript 无法推断该类型。
   ```typescript
   // ❌ 错误
   const data = response.json() as Feature;

   // ✅ 正确 — 运行时验证
   const raw = await response.json();
   const data = FeatureSchema.parse(raw);
   ```
6. **严禁使用 `@ts-ignore`**——使用 `@ts-expect-error` 并附带注释解释为什么预期会有错误。
7. **`// @ts-expect-error: <explanation>`**——说明是必需的。CI 应标记未说明的 `@ts-expect-error`。

---

## 14. 状态管理（MobX）

### 14.1 Store 模板

```typescript
// packages/client/src/stores/search-store.ts
import { makeAutoObservable, runInAction } from 'mobx';
import type { SearchResult } from '@earthstudio/core';

export class SearchStore {
  // ─── Observables（状态）────────────────────────────────
  query: string = '';
  results: SearchResult[] = [];
  isLoading: boolean = false;
  error: string | null = null;
  isHistoryOpen: boolean = false;
  history: string[] = [];

  constructor() {
    makeAutoObservable(this);
    this.loadHistory();
  }

  // ─── Computed（派生值）─────────────────────────────────
  get hasResults(): boolean {
    return this.results.length > 0;
  }

  get resultCount(): number {
    return this.results.length;
  }

  get isEmpty(): boolean {
    return this.query.length === 0 && this.results.length === 0;
  }

  // ─── Actions（变更）────────────────────────────────────
  setQuery(q: string): void {
    this.query = q;
  }

  async performSearch(): Promise<void> {
    if (!this.query.trim()) return;

    this.isLoading = true;
    this.error = null;

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(this.query)}`);
      if (!response.ok) throw new Error(`Search failed: ${response.status}`);

      const data = await response.json();
      runInAction(() => {
        this.results = data.results;
        this.isLoading = false;
        this.addToHistory(this.query);
      });
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'Search failed';
        this.isLoading = false;
      });
    }
  }

  clearResults(): void {
    this.results = [];
    this.query = '';
    this.error = null;
  }

  toggleHistory(): void {
    this.isHistoryOpen = !this.isHistoryOpen;
  }

  clearHistory(): void {
    this.history = [];
    localStorage.removeItem('search-history');
  }

  // ─── Private ────────────────────────────────────────────
  private addToHistory(query: string): void {
    this.history = [query, ...this.history.filter(h => h !== query)].slice(0, 50);
    localStorage.setItem('search-history', JSON.stringify(this.history));
  }

  private loadHistory(): void {
    try {
      const stored = localStorage.getItem('search-history');
      if (stored) this.history = JSON.parse(stored);
    } catch {
      this.history = [];
    }
  }
}
```

### 14.2 MobX 规则

1. **`makeAutoObservable(this)`** 是标准方式。仅在需要显式控制时使用 `makeObservable(this, { ... })`。
2. **所有异步状态变更使用 `runInAction`**。禁止在 action 之外修改 observable。
   ```typescript
   // ❌ 错误 — 在 action 之外修改
   async loadData() {
     this.isLoading = true;
     const data = await fetchData();
     this.data = data;  // 在 action 之外修改！
     this.isLoading = false;
   }

   // ✅ 正确 — 包装异步结果
   async loadData() {
     this.isLoading = true;
     try {
       const data = await fetchData();
       runInAction(() => {
         this.data = data;
         this.isLoading = false;
       });
     } catch (err) {
       runInAction(() => {
         this.error = err;
         this.isLoading = false;
       });
     }
   }
   ```
3. **每个状态切片一个 store**：每个 store 对应应用状态的恰好一个领域（`SearchStore`、`LayerStore`、`CameraStore` 等）。
4. **Store 通过 React context 提供**：在 `packages/client/src/app/layout.tsx` 中通过 React context 提供，通过 hooks 消费。
5. **严禁**在 store 中放置渲染逻辑。Store 管理状态；React 组件处理渲染。
6. **严禁**在 store 文件中导入 React 或 JSX。

---

## 15. API 设计规则

### 15.1 端点命名

| 约定 | 示例 |
|---|---|
| 集合：`GET /api/<resource>` | `GET /api/features?documentId={id}` |
| 单个资源：`GET /api/<resource>/:id` | `GET /api/features/abc-123` |
| 创建：`POST /api/<resource>` | `POST /api/features` |
| 更新：`PUT /api/<resource>/:id` | `PUT /api/features/abc-123` |
| 部分更新：`PATCH /api/<resource>/:id` | `PATCH /api/features/abc-123` |
| 删除：`DELETE /api/<resource>/:id` | `DELETE /api/features/abc-123` |
| 操作（非 CRUD）：`POST /api/<resource>/:action` | `POST /api/kml/import` |

### 15.2 请求/响应规则

1. 所有请求体必须为 `application/json`。
2. 所有响应必须为 `application/json`（除了返回 `image/png` 或 `application/octet-stream` 的二进制端点，如瓦片服务）。
3. **GET 请求禁止有请求体**。使用查询参数。
4. **分页**使用 `limit` 和 `offset` 查询参数，带有合理的默认值（limit ≤ 100）。
5. **错误响应**始终使用 `ErrorResponse` 格式（第 5.4 节，规则 4）。
6. **HTTP 状态码**必须语义正确：
   | 状态码 | 用途 |
   |---|---|
   | `200` | 成功的 GET、PUT、PATCH |
   | `201` | 成功的 POST（资源已创建） |
   | `204` | 成功的 DELETE（无内容） |
   | `400` | 验证错误（错误的请求体） |
   | `401` | 未认证 |
   | `403` | 未授权（已认证但不被允许） |
   | `404` | 资源未找到 |
   | `409` | 冲突（乐观并发失败） |
   | `422` | 无法处理的实体（合法 JSON，语义无效） |
   | `429` | 请求限流 |
   | `500` | 内部服务器错误（意外） |

### 15.3 API 文件结构（Next.js App Router）

```
packages/server/src/app/api/
├── features/
│   ├── route.ts                    ← 处理 GET（列表）和 POST（创建）
│   └── [featureId]/
│       └── route.ts                ← 处理 GET、PUT、PATCH、DELETE
├── documents/
│   ├── route.ts
│   └── [documentId]/
│       ├── route.ts
│       └── features/
│           └── route.ts
├── search/
│   └── route.ts
├── knowledge/
│   └── route.ts
├── layers/
│   └── route.ts
├── tiles/
│   └── [...path]/
│       └── route.ts
├── earthmate/
│   └── route.ts
├── design/
│   ├── solar/
│   │   └── route.ts
│   └── building/
│       └── route.ts
├── analysis/
│   └── [type]/
│       └── route.ts
├── streetview/
│   └── route.ts
├── elevation/
│   └── route.ts
├── auth/
│   └── [...nextauth]/
│       └── route.ts
├── events/
│   └── route.ts
├── config/
│   └── route.ts
├── kml/
│   ├── import/
│   │   └── route.ts
│   └── export/
│       └── route.ts
└── images/
    └── route.ts
```

---

## 16. 数据库规则

### 16.1 迁移规则

1. **所有模式变更**必须有一个由 `drizzle-kit generate` 生成的迁移文件。
2. **严禁**手动编辑迁移 SQL 文件。
3. **迁移仅支持正向**——没有向下迁移。用新的正向迁移修复错误。
4. **每次迁移**都在 CI 中针对全新的 PostGIS 容器进行测试。
5. **破坏性模式变更**（删除列、修改列类型）需要多步迁移：
   - 第 1 步：添加新列，部署
   - 第 2 步：将数据从旧列迁移到新列，部署
   - 第 3 步：删除旧列，部署

### 16.2 模式规则

1. **使用 `uuid` 作为主键**——`uuid('id').defaultRandom().primaryKey()`。
2. **所有时间戳列使用 `timestamp('col', { withTimezone: true })`**。
3. **TypeScript 中使用 `camelCase` 命名列**，数据库中使用 `snake_case`（Drizzle 处理映射）。
4. **始终添加相关索引**——至少在外键和 WHERE 子句中使用的列上。
5. **空间列**使用 `geometry('col', 4326)` 并带有 `GIST` 索引。
6. **JSON 列**使用 `jsonb`（而非 `json`）。
7. **禁止以明文存储敏感数据**——个人身份信息必须在存储时加密。
8. **每个表**必须有 `created_at` 和 `updated_at` 时间戳列。

### 16.3 查询规则

1. **使用 Drizzle ORM**——禁止编写原始 SQL 查询（迁移和物化视图除外）。
2. **始终限制结果数量**——禁止无限制的 `SELECT *` 查询。使用 `.limit()`。
3. **使用 PostGIS 空间函数**进行地理查询——`ST_DWithin`、`ST_Intersects`、`ST_Contains`。
4. **在可能的情况下使用 S2 单元格 ID**进行空间索引（FeatureIdProto 原生支持）。
5. **批量操作使用事务**——多表写入使用 `db.transaction()`。

---

## 17. 错误处理

### 17.1 错误层次结构

```
EarthStudioError（抽象基类）
├── ValidationError          ← 输入验证失败（400）
├── NotFoundError            ← 资源未找到（404）
├── AuthorizationError       ← 认证/授权失败（401/403）
├── ConflictError            ← 乐观并发失败（409）
├── RateLimitError           ← 请求过多（429）
├── ProtoSerializationError  ← Proto 编码/解码失败
├── RenderingError           ← WebGL/Three.js 渲染失败
├── NetworkError             ← 网络请求失败
└── InternalError            ← 意外内部错误（500）
```

### 17.2 错误处理规则

1. **在 API 边界捕获错误**——每个路由处理程序必须有 try/catch 并返回 `ErrorResponse`。
2. **禁止在生产环境中暴露堆栈跟踪**——仅在开发模式下（`process.env.NODE_ENV === 'development'`）暴露。
3. **通过 `EventLogger` 记录所有错误**，包含错误类型、消息和请求 ID。
4. **面向用户的错误消息**必须可操作："无法加载搜索结果。请检查网络连接后重试。"
5. **前端组件**必须处理加载、错误和空状态。对于预期的错误情况，禁止渲染 `undefined` 或抛到 React 错误边界。
6. **Promise rejection 必须被捕获**。不允许有未处理的 Promise（需要 `await` 或 `.catch()`）。

---

## 18. 性能预算

### 18.1 打包大小

| 包 | 最大大小（gzip 压缩后） | 测量方式 |
|---|---|---|
| `packages/client/`（JS 打包） | 500 KB | `next build` 输出 |
| `packages/engine/`（JS 打包） | 300 KB | Rollup/Vite 构建 |
| `packages/core/`（JS 打包） | 100 KB | Rollup/Vite 构建 |
| 初始页面加载总计（JS + CSS + 字体） | 1 MB | Lighthouse |

### 18.2 运行时性能

| 指标 | 目标 | 测量方式 |
|---|---|---|
| 可交互时间（TTI） | < 3 秒 | Lighthouse |
| 首次内容绘制（FCP） | < 1.5 秒 | Lighthouse |
| 地球渲染帧率 | ≥ 30 FPS（桌面端 60 FPS） | 自定义 `requestAnimationFrame` 追踪器 |
| 相机飞行动画时长 | < 2 秒（TELEPORT：瞬时） | `EarthCamera` 中的性能测量 |
| 搜索响应时间（P95） | < 500 毫秒 | 服务端计时中间件 |
| API 响应时间（P95） | < 200 毫秒 | 服务端计时中间件 |
| 瓦片加载时间（P95） | < 1 秒 | 客户端 `PerformanceObserver` |

### 18.3 CI 强制执行

```yaml
# .github/workflows/perf.yml
name: Performance Budgets

on: [pull_request]

jobs:
  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - name: Check bundle sizes
        run: |
          npx bundlesize
```

---

## 19. 安全规则

### 19.1 认证

1. **NextAuth.js** 处理所有认证流程。禁止实现自定义认证。
2. **会话验证**通过 NextAuth 中间件在每个 API 请求上进行。
3. **CSRF 保护**由 NextAuth 处理。同源请求不需要额外的 CSRF 令牌。
4. **CORS 限制**仅限生产域名。

### 19.2 授权

1. **文档级授权**：OWNER、EDITOR、VIEWER 角色在 API 层强制执行。
2. **PostgreSQL 行级安全**（RLS）用于多租户隔离：
   ```sql
   ALTER TABLE features ENABLE ROW LEVEL SECURITY;
   CREATE POLICY feature_isolation ON features
     USING (document_id IN (
       SELECT document_id FROM document_collaborators WHERE user_id = current_setting('app.current_user_id')
     ));
   ```
3. **禁止信任客户端授权检查**——所有授权必须在服务端执行。

### 19.3 输入验证

1. **Zod schema** 在所有 API 输入进入业务逻辑之前进行验证。
2. **清理用户生成的 HTML**（气泡样式、要素描述），在存储前使用服务端的 `DOMPurify`。
3. **验证文件上传**：最大文件大小（KML：50MB，GLTF：100MB）、允许的 MIME 类型、恶意软件扫描。

### 19.4 密钥管理

1. **严禁**在源代码中硬编码密钥——使用环境变量。
2. **外部服务的 API 密钥**（OpenAI、Mapbox、Cesium ion）仅存储在服务端环境中。
3. **使用 `.env.example`** 记录所需的环境变量而不包含值。
4. **定期轮换密钥**（至少每 90 天一次）。

### 19.5 依赖安全

1. **每次 CI 构建运行 `npm audit`**。HIGH/CRITICAL 级别漏洞阻止合并。
2. **Dependabot** 配置用于自动化依赖更新。
3. **锁定文件（`package-lock.json`）**已提交到仓库。

---

## 20. 文档要求

### 20.1 代码文档

1. **每个公开类**必须有描述其用途的 JSDoc 注释：
   ```typescript
   /**
    * 将命令分发给注册的处理程序，维护撤销/重做栈，
    * 并将所有命令执行记录到事件日志中。
    *
    * @example
    * const dispatcher = new CommandDispatcher(globe, camera, stores, logger);
    * dispatcher.registerHandler('flyToCamera', new FlyToCameraHandler(globe, camera));
    * dispatcher.dispatch(new FlyToCameraCommand({ ... }));
    */
   export class CommandDispatcher implements ICommandDispatcher { ... }
   ```
2. **每个公开方法**必须有描述参数、返回值和抛出错误的 JSDoc 注释。
3. **复杂逻辑**（算法、坐标转换、着色器代码）必须有内联注释解释"为什么"而非"是什么"。
4. **外部参考资料**（维基百科页面、论文、Google Earth 文档）必须在几何/物理算法的注释中提供链接。

### 20.2 项目文档

| 文件 | 受众 | 更新触发条件 |
|---|---|---|
| `README.md` | 新开发者、公众 | 每个阶段完成时 |
| `PROJECT_RULES.md`（本文件） | 所有贡献者 | 治理变更（罕见） |
| `IMPLEMENTATION_PLAN.md` | 开发者、架构师 | 重大架构变更 |
| `IMPLEMENTATION_ROADMAP.md` | 开发者、项目经理 | 阶段规划变更 |
| `DEVELOPMENT_SPEC.md` | Proto 开发者 | 新 proto 文件或验证规则 |
| `CHANGELOG.md` | 所有利益相关者 | 每次版本升级 |
| `CAPABILITIES.md` | 项目经理、利益相关者 | 阶段完成 |

### 20.3 API 文档

1. **所有 API 端点**在 `packages/core/src/interfaces/api/` 中作为 TypeScript 接口记录。
2. **API 路由处理程序**包含带有请求/响应示例的 JSDoc 注释。
3. **Swagger/OpenAPI** 规范从 TypeScript 接口生成（Phase 5 之后）。
4. **API 破坏性变更**必须在 `CHANGELOG.md` 的 `### Changed` 下记录，并附迁移指南。

---

## 21. CI/CD 规则

### 21.1 流水线阶段

```
推送到任意分支：
  1. Lint（ESLint + Prettier）
  2. 类型检查（tsc --noEmit）
  3. 单元测试（Vitest）
  4. 打包大小检查
  5. 依赖审计（npm audit）

Pull Request 到 main 或 phase/*：
  1. 以上全部 +
  2. 集成测试（Vitest + PostGIS）
  3. 构建检查（turbo build）
  4. 版本一致性检查
  5. 变更日志检查（如果版本变更）
  6. Proto 不可修改性检查（如果涉及 .proto 文件）

合并到 main：
  1. 以上全部 +
  2. E2E 测试（Playwright）
  3. 部署到 staging
  4. Staging 环境冒烟测试
  5. 部署到生产环境（v0.x.0 发布需要人工批准门禁）
```

### 21.2 合并所需的状态检查

- `lint`（ESLint）
- `typecheck`（TypeScript）
- `test-unit`（Vitest）
- `test-integration`（Vitest + PostGIS）
- `build`（Turborepo）
- `version-check`（版本一致性）
- `proto-check`（proto 不可修改性，仅在 `.proto` 变更时）
- `bundle-size`（性能预算）
- `audit`（npm audit）

### 21.3 部署

| 环境 | 分支 | 触发条件 |
|---|---|---|
| **Preview** | 所有 PR 分支 | PR 创建/更新时自动 |
| **Staging** | `main` | 合并时自动 |
| **Production** | `main` | 人工批准 + 标签推送 |

---

## 22. 治理执行

### 22.1 自动化检查

以下规则是自动化的，人类无法绕过：

| 规则 | 工具 | 文件 |
|---|---|---|
| 禁止 `any` 类型 | ESLint | `.eslintrc.js` |
| 导入边界 | ESLint `no-restricted-imports` | `.eslintrc.js` |
| 版本一致性 | CI 中的 Shell 脚本 | `.github/workflows/version-check.yml` |
| Proto 文件不可修改性 | CI 中的 Shell 脚本 | `.github/workflows/proto-check.yml` |
| 测试覆盖率阈值 | Vitest 配置 | `vitest.*.config.ts` |
| 提交格式 | `commitlint` | `commitlint.config.js` |
| 打包大小 | `bundlesize` | `bundlesize.config.json` |
| 变更日志更新要求 | CI 检查（如果版本变更） | `.github/workflows/changelog-check.yml` |
| TypeScript 严格模式 | `tsconfig.json` | 所有 `tsconfig.json` 文件 |
| 依赖漏洞 | `npm audit` | `.github/workflows/ci.yml` |

### 22.2 人工执行（代码审查）

以下规则由审查者人工执行（检查清单见第 8 节）：

- 阶段边界遵守
- OOP 层次结构正确性
- MobX 装饰器使用
- `toProto()` / `fromProto()` 完整性
- 接口与实现分离
- 文件组织（每个文件一个类）
- 边界情况测试覆盖
- 文档质量

### 22.3 规则变更流程

1. **提议**规则变更，通过 GitHub issue 提交，标签为 `governance`。
2. **讨论**在 issue 讨论串中进行。至少 2 位维护者必须批准。
3. **更新** `PROJECT_RULES.md`，通过 PR 提交。
4. **宣布**变更，在团队沟通渠道中发布。
5. **所有违反新规则的现有代码**必须修复，或在 issue 中明确豁免。

### 22.4 升级处理

如果贡献者反复违反治理规则：

1. **第一次违规**：在 PR 上评论指出具体规则。如果修复简单，不阻止 PR 合并（非严重违规）。
2. **第二次违规（同一规则）**：阻止 PR 直到满足规则。审查者提供具体指导。
3. **第三次违规（同一规则）**：阻止 PR。团队负责人安排一对一沟通了解根本原因。
4. **跨规则的持续性违规**：团队负责人在回顾会议中讨论；可能需要额外工具（pre-commit hooks、更严格的 CI）来自动化执行。

### 22.5 治理版本管理

本 `PROJECT_RULES.md` 文档本身也遵循版本规则：

- 治理版本在文档头部独立于代码库版本进行跟踪。
- 重大治理变更（新规则、删除规则）：升级治理 MINOR 版本。
- 澄清、措辞修正、示例：升级治理 PATCH 版本。
- 治理版本：**v0.1.0**（本次修订）。

---

> **项目规则与治理 — 全文完**
>
> *本文档具有权威性。如有疑问，以本文档为准。如果本文档的表述不清晰，该规则即为无效，必须通过规则变更流程（第 22.3 节）加以澄清。*
