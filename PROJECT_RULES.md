# Earth Studio Implementation — Project Rules & Governance

> **Version:** v0.1.0 | **Scope:** ALL contributors, reviewers, and automation | **Last Updated:** 2026-08-12
>
> This document is the single source of truth for project governance. Every rule is actionable. Any ambiguity in a rule means it is invalid — the rule must be rewritten.

---

## Table of Contents

1. [Version Management](#1-version-management-strict)
2. [CHANGELOG](#2-changelog-mandatory)
3. [OOP Development Rules](#3-oop-development-rules-strict)
4. [Phase Boundaries](#4-phase-boundaries-never-cross)
5. [Frontend/Backend Separation](#5-frontendbackend-separation-strict)
6. [Testing Rules](#6-testing-rules)
7. [Git Workflow](#7-git-workflow)
8. [Code Review Checklist](#8-code-review-checklist)
9. [Directory & File Creation Rules](#9-directory--file-creation-rules)
10. [Dependency Injection & Interfaces](#10-dependency-injection--interfaces)
11. [Proto File Governance](#11-proto-file-governance)
12. [Package Dependency Rules](#12-package-dependency-rules)
13. [TypeScript Strictness](#13-typescript-strictness)
14. [State Management (MobX)](#14-state-management-mobx)
15. [API Design Rules](#15-api-design-rules)
16. [Database Rules](#16-database-rules)
17. [Error Handling](#17-error-handling)
18. [Performance Budgets](#18-performance-budgets)
19. [Security Rules](#19-security-rules)
20. [Documentation Requirements](#20-documentation-requirements)
21. [CI/CD Rules](#21-cicd-rules)
22. [Governance Enforcement](#22-governance-enforcement)

---

## 1. Version Management (STRICT)

### 1.1 Version Numbering: `MAJOR.MINOR.PATCH`

| Trigger | Bump Type | Bump Value | Example |
|---|---|---|---|
| Phase completion (all deliverables done, tests pass, reviewed) | **MINOR** | `+1` | `v0.1.0` → `v0.2.0` |
| Any other commit (feature, fix, refactor, chore, docs, test, style) | **PATCH** | `+1` | `v0.1.0` → `v0.1.1` |
| Breaking proto change (rename field, change field number, change type, remove field without `reserved`) | **MAJOR** | `+1` | `v0.1.0` → `v1.0.0` |
| Hotfix (emergency fix to `main` for a production issue) | **PATCH** | `+1` | `v0.2.1` → `v0.2.2` |

### 1.2 Phase → Version Mapping

| Phase | Version | Week | Acceptance Criteria |
|---|---|---|---|
| 0. Proto Pipeline | `v0.1.0` | 1-2 | All 1,316 protos compile → TypeScript via `protobuf-ts` |
| 1. Foundation (Globe + Camera) | `v0.2.0` | 1-2 | Three.js globe renders WGS84 ellipsoid with satellite texture; camera supports LookAt/LookFrom, TELEPORT/FLY |
| 2. Commands + State | `v0.3.0` | 3-4 | 34 command types dispatch correctly; 40+ MobX stores; undo/redo stack works |
| 3. Content Creation | `v0.4.0` | 5-6 | Feature CRUD (Placemark, Polyline, Polygon, Folder); KML import/export; style editor functional |
| 4. Search + Knowledge | `v0.5.0` | 7 | Geocoding search; knowledge cards render with facts/images/open hours |
| 5. Layers + MapStyle | `v0.6.0` | 8-9 | 9+ layer types toggle; MapStyle projection/imagery/3D features switching |
| 6. Street View + Time | `v0.7.0` | 10 | Street View panorama integration; TimeMachine historical imagery slider; Timelapse playback |
| 7. Design Tools | `v0.8.0` | 11-13 | Solar analysis calculator; 3D building editor (FAR/extrusion); slope/aspect/contour/cut-fill analysis |
| 8. Earth Mate AI | `v0.9.0` | 14 | AI chat with 34 tool-calling functions; streaming SSE; image generation; Gemini-generated layers |
| 9. Cloud + Collab | `v0.10.0` | 15-16 | Cloud projects (create/open/save); document sharing with OWNER/EDITOR/VIEWER roles; mutation conflict resolution |
| 10. Polish + Release | `v1.0.0` | 17-18 | Performance budgets met; accessibility audit; production deploy; all integration tests pass |

### 1.3 Per-Commit Version Rules (EXTREMELY STRICT)

1. **EVERY commit that changes any code** in `packages/` MUST bump the version.
   - Exception: commits that change ONLY documentation files (`*.md`, `README*`, `LICENSE`) do not require a version bump.
2. If a single commit **completes a phase** (last deliverable merged, all phase tests pass), the version MUST bump MINOR.
3. If a commit is ANY other code change (feature within a phase, bug fix, refactor, test addition, chore), the version MUST bump PATCH.
4. The version tag (`git tag vX.Y.Z`) MUST be pushed **in the same commit** as the version change in `package.json`.
5. **NEVER** skip a version number in sequence. `v0.1.0` → `v0.1.1` → `v0.1.2` — no gaps.
6. **NEVER** retroactively change a version that has already been pushed to `main` or any shared branch.
7. If a commit is reverted, the revert commit is a NEW PATCH bump.
8. The version number lives in the **root `package.json`** field `"version"`. All package `package.json` files (`packages/*/package.json`) SHALL mirror this version exactly.
9. Any CI job that detects a version mismatch between root and any package `package.json` SHALL fail the build.

### 1.4 Version Bump Script (REQUIRED)

Every version bump MUST use this script — never manually edit the version field:

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

### 1.5 Version Enforcement in CI

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

## 2. CHANGELOG (MANDATORY)

### 2.1 CHANGELOG.md Format

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

### 2.2 CHANGELOG Rules (STRICT)

1. **EVERY version bump** (whether PATCH, MINOR, or MAJOR) **MUST** have a corresponding CHANGELOG entry.
   - Exception: a version bump that is immediately followed by another version bump in the same commit chain may share an entry (e.g., when squashing).
2. **Phase completion entries** MUST include the phase number, phase name, and a checkmark: `Phase N: Name ✓`.
3. **Semantic headings** MUST be used exactly:
   - `### Added` — for new features, classes, files, capabilities
   - `### Changed` — for changes to existing functionality (behavioral changes, not refactors that preserve behavior)
   - `### Fixed` — for bug fixes
   - `### Deprecated` — for features that will be removed in a future version
   - `### Removed` — for features that were deprecated and are now removed
   - `### Security` — for vulnerability fixes
   - `### Performance` — for performance improvements that are not bug fixes
4. **Every bullet** MUST reference at least one specific file path within the monorepo (e.g., `packages/engine/src/Globe.ts`).
5. `CHANGELOG.md` MUST be updated **in the SAME commit** as the version bump — never in a separate commit.
6. The `CHANGELOG.md` MUST **NEVER** be edited retroactively. If an entry was wrong, add a new entry in the next version explaining the correction.
7. The CHANGELOG MUST list items in order of importance within each section (most impactful first).
8. File paths in bullets MUST use the format: `packages/<package>/src/<path>/<file>.ts` (relative to repo root, backtick-wrapped).
9. If a version has no entries in one section, omit that section entirely (do not write "None").

---

## 3. OOP Development Rules (STRICT)

### 3.1 Class Hierarchy Rules

1. **Every proto `message`** → a TypeScript **class** or **interface** in `packages/core/src/models/`.
   - If the message has behavior (methods), use a class.
   - If the message is a pure data transfer object, use an interface.
2. **Every proto `oneof`** → an **abstract base class** with concrete subclasses, one per case.
   - Example: `Command` is abstract; `FlyToCameraCommand`, `PerformSearchCommand`, etc. are concrete subclasses.
3. **Every proto `enum`** → a TypeScript **enum** with identical name and identical numeric values.
   - Do NOT deviate from proto enum values. The numeric values must match exactly for binary wire compatibility.
4. **All classes that represent state** MUST use MobX decorators:
   - `@observable` for mutable fields (fields that change during the application lifecycle)
   - `@action` for mutation methods (methods that change observable fields)
   - `@computed` for derived getters (values calculated from observables)
5. **Constructor parameters** MUST match proto field definitions in name, type, and optionality.
   - Required proto fields → required constructor parameters.
   - Optional proto fields → optional constructor parameters with `?` suffix.
6. **Every class** MUST implement:
   - `toProto(): <ProtoType>` — serializes the class instance to its proto equivalent
   - `static fromProto(p: <ProtoType>): <ThisType>` — creates a class instance from a proto
7. **Services** (classes in `packages/*/src/services/`) MUST be **stateless singletons**:
   - NO `@observable` fields on services
   - Method parameters carry all mutable state
   - Services may hold configuration (read-only) in constructor

### 3.2 File Organization

```
packages/core/src/models/           ← Exactly ONE class per file
packages/core/src/services/         ← Exactly ONE service per file
packages/core/src/interfaces/       ← Abstract contracts (interfaces)
packages/core/src/validation/       ← Validation logic (one validator per domain)
packages/engine/src/                ← Three.js rendering classes
packages/engine/src/Layers/         ← Layer renderers (one per file)
packages/engine/src/Features/       ← Feature renderers (one per file)
packages/engine/src/Materials/      ← Shader materials (one per file)
packages/engine/src/TileSystem/     ← Tile loading, caching, LOD
packages/engine/src/Effects/        ← Post-processing, atmosphere
packages/engine/src/Utils/          ← Math, constants, helpers
packages/server/src/services/       ← Backend business logic services
packages/server/src/services/db/    ← Database schema, migrations, repositories
packages/server/src/middleware/     ← Express/Next.js middleware
packages/client/src/stores/         ← MobX stores (one per state slice, ~60 total)
packages/client/src/components/     ← React components
packages/client/src/hooks/          ← React hooks
packages/client/src/app/            ← Next.js App Router pages and layouts
```

### 3.3 Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| Classes | `PascalCase`, matches proto message name | `CommandDispatcher`, `FlyToCameraCommand` |
| Files (class files) | `kebab-case`, matches class name | `command-dispatcher.ts` → `CommandDispatcher` |
| Files (test files) | `<source-file>.test.ts` or `<source-file>.spec.ts` | `command-dispatcher.test.ts` |
| Interfaces (abstract contracts) | `PascalCase` with `I` prefix | `IGlobeRenderer`, `ICameraController` |
| Interfaces (data shapes, API types) | `PascalCase`, NO `I` prefix | `SearchRequest`, `FeatureResponse` |
| Enums | `PascalCase`, matches proto enum name | `CameraAnimation`, `AltitudeMode` |
| Methods | `camelCase`, verb-first | `executeCommand()`, `getState()`, `render()` |
| Private fields | `underscore` prefix | `private _tileCache: Map<string, Tile>` |
| Constants | `UPPER_SNAKE_CASE` | `WGS84_RADIUS_MAJOR`, `EARTH_RADIUS_EQUATORIAL` |
| Boolean variables | `is`, `has`, `should`, `can` prefix | `isVisible`, `hasChildren`, `shouldRender` |
| Event handlers | `handle` prefix | `handleLayerToggle`, `handleSearchSubmit` |
| Barrel exports | `index.ts` | `packages/core/src/models/commands/index.ts` |

### 3.4 Inheritance Rules (STRICT)

1. **NEVER** use `any` type in class signatures (extends, implements, method params, return types).
   - Use `unknown` when the type is truly unknown.
   - Use generics when the type varies.
2. **NEVER** break the **Liskov Substitution Principle** (LSP):
   - A subclass MUST be usable anywhere its parent class is expected.
   - A subclass MUST NOT strengthen preconditions (e.g., require more specific input types).
   - A subclass MUST NOT weaken postconditions (e.g., return a broader type or allow more states).
   - A subclass MUST NOT throw exceptions that the parent does not declare.
3. **Subclasses MUST implement ALL abstract methods** from their parent.
   - Failure to compile because of missing abstract method implementation is a CI-blocking error.
4. **`@override` decorator** is REQUIRED on all overridden methods.
   - This provides compile-time verification that the method actually overrides a parent method.
   - Add `"noImplicitOverride": true` to `tsconfig.base.json` to enforce this.

### 3.5 Class Template

Every new class in the codebase MUST follow this template:

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

## 4. Phase Boundaries (NEVER CROSS)

### 4.1 Phase Dependency Graph

```
Phase 0 (Proto Pipeline) ──── REQUIRED BY ALL PHASES
  │
  ├─→ Phase 1 (Foundation: Globe + Camera)
  │     │
  │     └─→ Phase 2 (Commands + State)
  │           │
  │           ├─→ Phase 3 (Content Creation: Features, KML, Documents)
  │           ├─→ Phase 4 (Search + Knowledge Cards)
  │           └─→ Phase 5 (Layers + MapStyle)
  │                 │
  │                 ├─→ Phase 6 (Street View + Time Features)
  │                 ├─→ Phase 7 (Design Tools: Solar, Building, Analysis)
  │                 └─→ Phase 8 (Earth Mate AI Assistant)
  │                       │
  │                       └─→ Phase 9 (Cloud Projects + Collaboration)
  │                             │
  │                             └─→ Phase 10 (Analytics + Polish + Release)
```

### 4.2 Boundary Rules (NEVER Violate)

1. **NEVER implement a Phase N+1 feature** before Phase N is declared **COMPLETE**.
2. **"COMPLETE"** is defined by ALL of the following being true:
   - All classes for the phase are defined (no stubs remaining for core deliverables).
   - All methods are implemented (no `throw new Error('Not implemented')` in core methods).
   - All unit tests pass (`npx vitest run` returns exit code 0).
   - All integration tests pass (if applicable to the phase).
   - Code review is complete and approved (minimum 1 reviewer, no unresolved "request changes").
   - `CHANGELOG.md` has the phase completion entry.
   - Version tag is pushed (`git tag vX.Y.0` for phase completion).
3. **If a later-phase type is needed as a dependency** (e.g., Phase 4 needs `Feature` type from Phase 3), you MAY extract ONLY the **interface** (not the implementation) into the earlier phase.
   - Place the interface stub in `packages/core/src/interfaces/` with method signatures only.
   - Mark it with `// @phase-stub — full implementation in Phase N`.
   - The actual implementation lives in its proper phase.
4. **Stub implementations** are allowed in earlier phases ONLY when they:
   - Return mock/sample data that is clearly documented as such.
   - Are placed in `__stubs__/` directories within the package.
   - Have `// STUB: Phase N — replace with real implementation` comment at the top.
   - Pass TypeScript type checking (return correct types, even if data is fake).
5. **Phase completion checklist** (PR description template for phase-completing PRs):

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

## 5. Frontend/Backend Separation (STRICT)

### 5.1 Communication Contract

```typescript
// packages/core/src/interfaces/api/search.ts
// ─── THIS IS THE ONLY SHARED INTERFACE LAYER ───

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

### 5.2 Import Boundaries (ENFORCEABLE by ESLint)

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

### 5.3 Allowed Import Paths

| Source Package | Allowed Imports |
|---|---|
| `packages/client/` | `@earthstudio/core`, `@earthstudio/engine`, `@earthstudio/proto`, React ecosystem |
| `packages/engine/` | `@earthstudio/core`, `@earthstudio/proto`, Three.js ecosystem |
| `packages/server/` | `@earthstudio/core`, `@earthstudio/proto`, Node.js/DB ecosystem |
| `packages/core/` | `@earthstudio/proto`, standard TypeScript libraries |
| `packages/proto/` | Nothing from other packages (proto is the root dependency) |

### 5.4 API Rules

1. **Every endpoint** MUST have typed request and response interfaces in `packages/core/src/interfaces/api/<domain>.ts`.
2. **Backend validates ALL inputs** using Zod schemas derived from proto field constraints:
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
3. **Frontend handles ALL loading, error, and empty states** — backend never returns partial success that the frontend must silently interpret.
4. **API errors** MUST return the standard error format:
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
5. **NEVER pass raw proto bytes** over the REST API. Always serialize proto to JSON via `toProto()` and send the JSON. The proto wire format (binary) is only used for WebSocket/real-time channels, not REST.
6. All API routes are under `/api/` prefix (Next.js convention).
7. All API responses include `Content-Type: application/json` header.
8. Sensitive data (tokens, passwords, PII) must NEVER appear in query parameters — only in request body for POST/PUT, or in Authorization headers.

---

## 6. Testing Rules

### 6.1 Coverage Thresholds (Enforced by CI)

| Package | Line Coverage | Branch Coverage | Rationale |
|---|---|---|---|
| `packages/core/` | **90%+** | **85%+** | Domain logic is critical; every class, every method, every edge case |
| `packages/engine/` | **70%+** | **60%+** | Rendering code is visual; some tests require manual verification or WebGL mocking |
| `packages/server/` | **80%+** | **75%+** | API and DB logic; mock external services |
| `packages/client/` | **60%+** | **50%+** | UI components; some interactions require Playwright browser tests |
| `packages/proto/` | **95%+** | N/A | Adapter logic and wire compatibility; generated code is excluded from coverage |

### 6.2 Test Organization

```
packages/<package>/src/__tests__/
├── unit/                      ← Pure logic tests; no network, no DOM
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
├── integration/               ← Cross-package or multi-class tests
│   ├── command-execution.test.ts     # Command → State → Render pipeline
│   ├── feature-persistence.test.ts   # Feature → DB → Feature round-trip
│   └── ...
└── e2e/                       ← Full stack Playwright tests
    ├── globe-navigation.spec.ts
    ├── feature-creation.spec.ts
    └── ...
```

### 6.3 Test File Naming

- Unit tests: `<source-file-name>.test.ts` (colocated in `__tests__/unit/`)
- Integration tests: `<scenario-name>.test.ts` (in `__tests__/integration/`)
- E2E tests: `<scenario-name>.spec.ts` (in `__tests__/e2e/`)
- Test fixtures: `<source-file-name>.fixtures.ts` (in `__tests__/fixtures/`)

### 6.4 Test Requirements per Class

For EVERY class in `packages/core/src/models/`:

- [ ] Constructor test (all params, partial params, default values)
- [ ] `toProto()` test (serialize → check proto structure matches expected)
- [ ] `fromProto()` test (create from proto → check class fields match)
- [ ] Round-trip test (`fromProto(toProto(instance))` produces equivalent instance)
- [ ] For classes with methods: each public method tested with normal, edge, and error inputs
- [ ] For observable classes: each `@action` method tested, each `@computed` getter tested

### 6.5 CI Test Execution

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

## 7. Git Workflow

### 7.1 Branch Strategy

```
main                           ← Protected, always deployable, linear history
  ├── phase/0-proto-pipeline   ← Phase branches (one per phase)
  │   ├── feature/X            ← Feature branches (branch off phase, merge to phase)
  │   └── fix/X                ← Bug fix branches (branch off phase, merge to phase)
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
  └── hotfix/X                 ← Emergency fixes (branch off main, merge to main THEN cherry-pick to active phase)
```

### 7.2 Branch Naming Convention

| Branch Type | Format | Example |
|---|---|---|
| Phase branch | `phase/<N>-<kebab-name>` | `phase/2-commands-state` |
| Feature branch | `feature/<kebab-description>` | `feature/globe-atmosphere-shader` |
| Bug fix branch | `fix/<kebab-description>` | `fix/command-dispatcher-undo-stack-overflow` |
| Hotfix branch | `hotfix/<kebab-description>` | `hotfix/tile-loading-crash-production` |
| Chore branch | `chore/<kebab-description>` | `chore/update-node-version` |
| Docs branch | `docs/<kebab-description>` | `docs/api-endpoint-reference` |

### 7.3 Commit Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`, `perf`, `ci`, `build`, `revert`

**Scope:** package name (one of: `proto`, `core`, `engine`, `server`, `client`, `root`)

**Rules:**
- Description MUST start with lowercase and be in imperative mood ("add", not "added" or "adds").
- Description MUST be 72 characters or fewer.
- If the commit closes an issue, include `Closes #N` in the footer.
- If the commit introduces a breaking change, include `BREAKING CHANGE: <description>` in the footer.

**Examples:**

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

### 7.4 Merge Rules (STRICT)

1. **Feature/fix branches → phase branch:** **Squash merge.**
   - Single squashed commit per feature. Keeps phase branch history clean.
   - Squash message: `<type>(<scope>): <description>` from the PR title.
   - Delete the feature branch after merge.
2. **Phase branch → `main`:** **Merge commit** (NO squash, NO rebase).
   - Preserves the individual commits in the phase branch for audit trail.
   - Merge commit message: `chore(merge): merge phase/<N>-<name> into main`.
3. **Tag on `main`** after phase merge.
   - Tag format: `vX.Y.0` (MINOR bump for phase completion).
   - Tag message: `Release vX.Y.0: Phase N — <Phase Name>`.
4. **Hotfix branch → `main`:** **Squash merge.**
   - After merging to `main`, cherry-pick the squashed commit to the active phase branch.
5. **NEVER force push** to `main` or any phase branch.
   - Force pushing is ONLY allowed on personal feature/fix branches.
6. **NEVER rebase** shared branches (`main`, `phase/*`).
   - Rebase is allowed only on personal branches before creating a PR.
7. **Branch protection rules** (enforced in GitHub):
   - `main`: requires 1 approving review, all status checks pass, no direct pushes.
   - `phase/*`: requires 1 approving review, unit tests pass, no direct pushes.
8. **Stale branches:** Delete branches that have been merged. Branches unmerged for >30 days must be either merged or explicitly marked as `[WIP]` in the PR.

---

## 8. Code Review Checklist

### 8.1 REQUIRED Checks per PR

Every pull request MUST satisfy ALL of the following before merge. The reviewer MUST check each item explicitly:

#### Architecture & Design
- [ ] **OOP hierarchy rules followed**: Every proto message maps to a class; proto oneof maps to abstract base + concrete subclasses; proto enum maps to TypeScript enum.
- [ ] **Phase boundary respected**: No feature from Phase N+1 implemented before Phase N is complete. If an interface was extracted, it is marked with `@phase-stub`.
- [ ] **Frontend/backend separation maintained**: No cross-boundary imports. Client doesn't import server code. Server doesn't import engine code.
- [ ] **Package boundaries respected**: No internal imports across packages (always use package name, e.g., `@earthstudio/core` not `../../core/src/...`).
- [ ] **Class file organization**: One class per file (except small private helper classes). File in correct directory per Section 3.2.

#### Code Quality
- [ ] **No `any` types**: Grep the diff for `: any` and `as any`. Every occurrence must be justified in a comment.
- [ ] **MobX decorators used correctly**: `@observable` for state, `@action` for mutations, `@computed` for derivations. No direct mutation of `@observable` outside of `@action`.
- [ ] **`toProto()` implemented**: Every model class has a working `toProto()` method.
- [ ] **`fromProto()` implemented**: Every model class has a working `static fromProto()` method.
- [ ] **`@override` decorator on overridden methods**: Check all `override` keywords exist.
- [ ] **No dead code**: No commented-out blocks of code (except `// STUB` markers per Section 4.2).
- [ ] **No `console.log`**: Use the `EventLogger` for production logging or remove.
- [ ] **No hardcoded secrets**: No API keys, tokens, or passwords in the code. Use environment variables.

#### Testing
- [ ] **Tests added/updated**: New classes have unit tests. Changed behavior has updated tests.
- [ ] **Test coverage meets thresholds**: Run `npx vitest run --coverage` and verify package meets its threshold (Section 6.1).
- [ ] **Tests pass**: CI shows green on all test jobs.
- [ ] **Edge cases covered**: Tests include normal path, error path, and edge cases (null, undefined, empty, boundary).

#### Documentation
- [ ] **CHANGELOG entry added** (if version is bumped in this PR).
- [ ] **Inline documentation**: Public methods have JSDoc comments. Complex logic has explanatory comments.
- [ ] **No misleading comments**: Comments accurately describe the code they accompany.

#### Performance & Security
- [ ] **No obvious performance issues**: No O(n²) where O(n) would work. No synchronous blocking in event handlers.
- [ ] **Input validation**: All user-exposed inputs are validated (Zod schemas on API routes).
- [ ] **No XSS vectors**: User content rendered in React uses proper escaping. No `dangerouslySetInnerHTML` without sanitization.

### 8.2 Reviewer Responsibilities

1. **Do NOT approve a PR with unresolved `// TODO` comments** — TODO must be tracked as an issue.
2. **Do NOT approve a PR with failing CI checks** — all status checks must pass.
3. **Review within 1 business day** — if unable, reassign to another reviewer.
4. **Provide actionable feedback** — say "Change X to Y because Z", not "This doesn't look right".
5. **Be explicit about blocking vs. non-blocking comments** — use `nit:` prefix for stylistic suggestions.

---

## 9. Directory & File Creation Rules

### 9.1 `packages/core/src/models/` Structure

```
packages/core/src/models/
├── commands/
│   ├── command.ts                      ← Abstract base Command class
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
│   └── index.ts                        ← Barrel export (re-exports all 34 commands)
├── camera/
│   ├── camera.ts                       ← Abstract base Camera class
│   ├── look-at-camera.ts
│   ├── look-from-camera.ts
│   ├── camera-animation.ts             ← Enum
│   ├── camera-presentation-mode.ts     ← Enum
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
│   ├── feature.ts                      ← Abstract base
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
│   ├── layer.ts                        ← Abstract base
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
│   ├── document-namespace.ts           ← Enum
│   ├── map-type.ts
│   ├── feature-key.ts
│   ├── io-operation.ts
│   ├── role.ts                         ← Enum
│   └── index.ts
├── mapstyle/
│   ├── map-style.ts
│   ├── projection.ts                   ← Enum
│   ├── imagery.ts                      ← Enum
│   ├── three-d-features.ts             ← Enum
│   ├── base-layers.ts
│   ├── base-layers-preset.ts           ← Enum
│   ├── gridlines-mode.ts               ← Enum
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

### 9.2 `packages/engine/src/` Structure

```
packages/engine/src/
├── globe.ts                           ← Globe controller
├── earth-camera.ts                    ← Camera (LookAt/LookFrom)
├── map-style-controller.ts           ← MapStyle → renderer state
├── coordinate-systems.ts             ← WGS84, Mercator, S2 conversions
├── Layers/
│   ├── layer.ts                       ← Abstract base
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
│   ├── feature-renderer.ts            ← Abstract base
│   ├── placemark-renderer.ts
│   ├── polyline-renderer.ts
│   ├── polygon-renderer.ts
│   ├── model-3d-renderer.ts           ← GLTF/GLB models
│   ├── ground-overlay-renderer.ts
│   ├── screen-overlay-renderer.ts
│   ├── label-renderer.ts
│   ├── balloon-renderer.ts            ← Info windows/popups
│   └── index.ts
├── Materials/
│   ├── earth-material.ts              ← Globe surface shader
│   ├── atmosphere-material.ts         ← Atmospheric scattering
│   ├── water-material.ts
│   ├── cloud-material.ts
│   ├── building-material.ts
│   ├── terrain-material.ts
│   ├── polyline-material.ts
│   ├── polygon-material.ts
│   ├── gridline-material.ts
│   └── index.ts
├── TileSystem/
│   ├── tile-manager.ts                ← Tile loading/caching/LOD
│   ├── tile-coord.ts                  ← x/y/zoom
│   ├── vector-tile-decoder.ts
│   ├── raster-tile-provider.ts
│   ├── elevation-tile-provider.ts
│   ├── tile-cache.ts                  ← LRU in-memory cache
│   └── index.ts
├── Effects/
│   ├── atmosphere.ts                  ← Sky, sun, stars
│   ├── post-processing.ts             ← Bloom, tone mapping
│   ├── water-reflection.ts
│   └── index.ts
└── Utils/
    ├── geo-math.ts                    ← Great-circle, S2 conversions
    ├── interpolation.ts               ← Camera interpolation (slerp, lerp)
    ├── raycasting.ts                  ← Globe pick/intersect
    ├── constants.ts                   ← WGS84 radii, EPSG codes
    └── index.ts
```

### 9.3 `packages/client/src/stores/` Structure

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
└── index.ts                           ← Barrel export
```

### 9.4 NEVER Rules

1. **NEVER** put two public classes in one file. A "public class" is any class exported from the package. Small private helper classes (used only within the file and not exported) are allowed.
2. **NEVER** put MobX stores in `packages/core/`. Stores are client-only (they use React context, browser APIs).
3. **NEVER** put Three.js imports in `packages/server/`. Use geometry types from `packages/core/` for calculations.
4. **NEVER** put database imports (`pg`, `drizzle-orm`, `postgres`) in `packages/client/`.
5. **NEVER** use relative imports across packages. Always use the package name:
   ```typescript
   // ❌ WRONG
   import { Command } from '../../core/src/models/commands/Command';

   // ✅ CORRECT
   import { Command } from '@earthstudio/core';
   ```
6. **NEVER** create circular dependencies. If package A imports from package B, package B MUST NOT import from package A. Use interfaces in a shared package (or the lower-level package) to break cycles.

---

## 10. Dependency Injection & Interfaces

### 10.1 Constructor Injection (REQUIRED)

EVERY service and non-trivial class MUST use constructor injection. NEVER use global singletons or service locators:

```typescript
// ❌ WRONG — global singleton
import { globe } from './global-instances';
export class CommandDispatcher {
  executeCommand(cmd: Command): void {
    globe.flyTo(cmd.camera);  // Implicit, untestable dependency
  }
}

// ✅ CORRECT — constructor injection
export class CommandDispatcher {
  constructor(
    private readonly globe: IGlobe,
    private readonly camera: ICamera,
    private readonly storeRegistry: IStoreRegistry,
    private readonly eventLogger: IEventLogger,
  ) {}

  executeCommand(cmd: Command): void {
    this.globe.flyTo(cmd.camera);  // Explicit, testable dependency
  }
}
```

### 10.2 Interface Definitions

ALL injected dependencies MUST be typed against interfaces, not concrete classes:

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

### 10.3 Interface Rules

1. **Interfaces for DI** (dependency injection) MUST use the `I` prefix: `IGlobeRenderer`, `ICameraController`.
2. **Interfaces for API shapes** (request/response) do NOT use the `I` prefix: `SearchRequest`, `SearchResponse`.
3. **Interfaces for data models** (shared types) do NOT use the `I` prefix: `LatLng`, `BoundingBox`.
4. Every interface MUST be in its own file in `packages/core/src/interfaces/` or co-located with the domain model.
5. Interfaces MUST be minimal — only expose what consumers need. Do not leak implementation details (e.g., `getThreeJsScene()` is bad — it couples consumers to Three.js).

### 10.4 DI Container

For the production app, use a lightweight DI container:

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

## 11. Proto File Governance

### 11.1 Absolute Immutability of Official Protos

The **1,316 existing `.proto` files** from Google Earth are **SACROSANCT**:

| Rule | Enforcement |
|---|---|
| **NEVER** modify any existing `.proto` file under `geo/`, `maps/`, `geostore/`, `logs/`, `google/`, or any subdirectory | CI check: `git diff --name-only origin/main | grep '\.proto$' | grep -v '^devtools/'` — any match fails the build |
| **NEVER** delete any existing `.proto` file | Same CI check as above |
| **NEVER** add new fields to existing `.proto` messages | Code review checklist, pre-commit hook |
| **NEVER** change field numbers, types, or names on existing messages | Code review checklist |
| External proto changes MUST be proposed upstream to Google and synchronized | Document the upstream CL number in the commit message if syncing |

### 11.2 New Proto File Rules (for OUR files only)

When creating **new** `.proto` files (under `devtools/` or new directories):

1. Use `syntax = "editions"` (NOT proto2 or proto3).
2. Standard file header:
   ```protobuf
   // Description: <purpose of this file>
   
   syntax = "editions";
   
   package earthstudio.<domain>;
   
   option java_multiple_files = true;
   option java_package = "com.earthstudio.<domain>";
   ```
3. **NEVER use `required`** — always use `optional`.
4. **Enum first value MUST be 0** — typically `<ENUM_NAME>_UNSPECIFIED = 0`.
5. **Field numbers MUST be immutable** once published. Use `reserved` for removed fields:
   ```protobuf
   reserved 5, 6, 10 to 12;
   reserved "old_field_name", "deprecated_field";
   ```
6. **No reverse dependencies**: L2 cannot import L3. No circular dependencies.
7. **No unused imports**: Every `import` statement must be used by at least one field or option in the file.

### 11.3 Proto Compilation Pipeline

```bash
# Build order (enforced by Turborepo)
# 1. Third-party stubs (packages/proto/src/third_party/)
# 2. Strip internal deps (scripts/clean-protos.sh)
# 3. Convert MessageSet → oneof (scripts/convert-messageset.py)
# 4. Two-pass buf build (editions/proto3 first, then proto2)
# 5. Generate TypeScript (protobuf-ts)
# 6. Validate wire compatibility (packages/proto/src/__tests__/)

# The complete pipeline is:
npm run proto:clean    # Strip Google-internal imports
npm run proto:convert  # MessageSet → oneof conversion
npm run proto:generate # buf generate → TypeScript
npm run proto:validate # Wire compatibility tests
```

### 11.4 Adapter Layer (packages/proto/src/adapters/)

EVERY proto-to-domain-model conversion goes through an adapter. NEVER convert proto to domain model inline:

```typescript
// ❌ WRONG — inline conversion in service
const cmd = new FlyToCameraCommand({
  camera: proto.cameraType?.oneofKind === 'lookAt' 
    ? new LookAtCamera(proto.cameraType.lookAt) 
    : new LookFromCamera(proto.cameraType.lookFrom),
  // ... manual field mapping
});

// ✅ CORRECT — adapter handles it
const cmd = CommandAdapter.fromProto(protoCommand);
```

---

## 12. Package Dependency Rules

### 12.1 Dependency Graph (Enforced by Turborepo)

```
packages/proto/          ← Layer 0: Zero internal dependencies
       │
       ▼
packages/core/           ← Layer 1: Depends only on proto
       │
       ├──────────────────────┐
       ▼                      ▼
packages/engine/       packages/server/     ← Layer 2: Depends on proto + core
       │
       ▼
packages/client/         ← Layer 3: Depends on proto + core + engine
```

### 12.2 Package-Specific Dependency Allowlists

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
- NO dependencies on any other `@earthstudio/*` packages.

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
- NO dependencies on `@earthstudio/engine`, `@earthstudio/server`, `@earthstudio/client`.
- NO Three.js, React, Next.js, or database imports.

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
- NO `@earthstudio/server` or `@earthstudio/client`.

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
- NO `@earthstudio/engine` or `@earthstudio/client`.
- NO Three.js or React.

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
- NO `@earthstudio/server`.
- NO database drivers.

### 12.3 Build Order (Turborepo)

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

## 13. TypeScript Strictness

### 13.1 `tsconfig.base.json` (Shared Base)

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

### 13.2 TypeScript Rules

1. **`strict: true`** in ALL packages. No exceptions.
2. **`noImplicitOverride: true`** — ALL overridden methods MUST use `override` keyword.
3. **`noUncheckedIndexedAccess: true`** — array access and record access returns `T | undefined`.
4. **NEVER use `any`** — use `unknown` and narrow with type guards.
5. **NEVER use `as` cast** to bypass type errors unless the comment explains why TypeScript cannot infer the type.
   ```typescript
   // ❌ WRONG
   const data = response.json() as Feature;

   // ✅ CORRECT — runtime validation
   const raw = await response.json();
   const data = FeatureSchema.parse(raw);
   ```
6. **NEVER use `@ts-ignore`** — use `@ts-expect-error` with a comment explaining why the error is expected.
7. **`// @ts-expect-error: <explanation>`** — explanation is mandatory. CI should flag unexplained `@ts-expect-error`.

---

## 14. State Management (MobX)

### 14.1 Store Template

```typescript
// packages/client/src/stores/search-store.ts
import { makeAutoObservable, runInAction } from 'mobx';
import type { SearchResult } from '@earthstudio/core';

export class SearchStore {
  // ─── Observables (state) ────────────────────────────────
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

  // ─── Computed (derived values) ──────────────────────────
  get hasResults(): boolean {
    return this.results.length > 0;
  }

  get resultCount(): number {
    return this.results.length;
  }

  get isEmpty(): boolean {
    return this.query.length === 0 && this.results.length === 0;
  }

  // ─── Actions (mutations) ────────────────────────────────
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

### 14.2 MobX Rules

1. **`makeAutoObservable(this)`** is the standard. Use `makeObservable(this, { ... })` only when explicit control is needed.
2. **`runInAction`** for ALL async state changes. Never mutate observables outside of actions.
   ```typescript
   // ❌ WRONG — mutating outside action
   async loadData() {
     this.isLoading = true;
     const data = await fetchData();
     this.data = data;  // Mutation outside action!
     this.isLoading = false;
   }

   // ✅ CORRECT — wrapping async results
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
3. **One store per state slice**: Each store corresponds to exactly one area of application state (`SearchStore`, `LayerStore`, `CameraStore`, etc.).
4. **Stores are React context**: Provided via React context in `packages/client/src/app/layout.tsx`, consumed via hooks.
5. **NEVER** put rendering logic in stores. Stores manage state; React components handle rendering.
6. **NEVER** import React or JSX in store files.

---

## 15. API Design Rules

### 15.1 Endpoint Naming

| Convention | Example |
|---|---|
| Collection: `GET /api/<resource>` | `GET /api/features?documentId={id}` |
| Single resource: `GET /api/<resource>/:id` | `GET /api/features/abc-123` |
| Create: `POST /api/<resource>` | `POST /api/features` |
| Update: `PUT /api/<resource>/:id` | `PUT /api/features/abc-123` |
| Partial update: `PATCH /api/<resource>/:id` | `PATCH /api/features/abc-123` |
| Delete: `DELETE /api/<resource>/:id` | `DELETE /api/features/abc-123` |
| Action (non-CRUD): `POST /api/<resource>/:action` | `POST /api/kml/import` |

### 15.2 Request/Response Rules

1. All request bodies MUST be `application/json`.
2. All responses MUST be `application/json` (except binary endpoints like tile serving which return `image/png` or `application/octet-stream`).
3. **GET requests MUST NOT have a body**. Use query parameters.
4. **Pagination** uses `limit` and `offset` query parameters with sensible defaults (limit ≤ 100).
5. **Error responses** always use the `ErrorResponse` format (Section 5.4, rule 4).
6. **HTTP status codes** MUST be semantically correct:
   | Status Code | Usage |
   |---|---|
   | `200` | Successful GET, PUT, PATCH |
   | `201` | Successful POST (resource created) |
   | `204` | Successful DELETE (no content) |
   | `400` | Validation error (bad request body) |
   | `401` | Unauthenticated |
   | `403` | Unauthorized (authenticated but not allowed) |
   | `404` | Resource not found |
   | `409` | Conflict (optimistic concurrency failure) |
   | `422` | Unprocessable entity (valid JSON, invalid semantics) |
   | `429` | Rate limited |
   | `500` | Internal server error (unexpected) |

### 15.3 API File Structure (Next.js App Router)

```
packages/server/src/app/api/
├── features/
│   ├── route.ts                    ← Handles GET (list) and POST (create)
│   └── [featureId]/
│       └── route.ts                ← Handles GET, PUT, PATCH, DELETE
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

## 16. Database Rules

### 16.1 Migration Rules

1. **ALL schema changes** MUST have a migration file generated by `drizzle-kit generate`.
2. **NEVER** manually edit migration SQL files.
3. **Migrations are forward-only** — there is no down migration. Fix mistakes with a new forward migration.
4. **Every migration is tested** in CI against a fresh PostGIS container.
5. **Breaking schema changes** (dropping a column, changing a column type) require a multi-step migration:
   - Step 1: Add new column, deploy
   - Step 2: Migrate data from old to new column, deploy
   - Step 3: Drop old column, deploy

### 16.2 Schema Rules

1. **Use `uuid` for primary keys** — `uuid('id').defaultRandom().primaryKey()`.
2. **Use `timestamp('col', { withTimezone: true })`** for all timestamp columns.
3. **Use `camelCase` for column names** in TypeScript, `snake_case` in the database (Drizzle handles mapping).
4. **Always add relevant indexes** — at minimum on foreign keys and columns used in WHERE clauses.
5. **Spatial columns** use `geometry('col', 4326)` with `GIST` indexes.
6. **JSON columns** use `jsonb` (not `json`).
7. **Never store sensitive data in plaintext** — PII must be encrypted at rest.
8. **Every table** MUST have `created_at` and `updated_at` timestamp columns.

### 16.3 Query Rules

1. **Use Drizzle ORM** — never write raw SQL queries (except for migrations and materialized views).
2. **Always limit results** — no unbounded `SELECT *` queries. Use `.limit()`.
3. **Use PostGIS spatial functions** for geographic queries — `ST_DWithin`, `ST_Intersects`, `ST_Contains`.
4. **Use S2 cell IDs** for spatial indexing when possible (native to FeatureIdProto).
5. **Batch operations** in transactions — use `db.transaction()` for multi-table writes.

---

## 17. Error Handling

### 17.1 Error Hierarchy

```
EarthStudioError (abstract base)
├── ValidationError          ← Input validation failure (400)
├── NotFoundError            ← Resource not found (404)
├── AuthorizationError       ← Authentication/authorization failure (401/403)
├── ConflictError            ← Optimistic concurrency failure (409)
├── RateLimitError           ← Too many requests (429)
├── ProtoSerializationError  ← Proto encode/decode failure
├── RenderingError           ← WebGL/Three.js rendering failure
├── NetworkError             ← Network request failure
└── InternalError            ← Unexpected internal error (500)
```

### 17.2 Error Handling Rules

1. **Catch errors at the API boundary** — every route handler MUST have a try/catch that returns `ErrorResponse`.
2. **Never expose stack traces in production** — only in development mode (`process.env.NODE_ENV === 'development'`).
3. **Log ALL errors** through `EventLogger` with the error type, message, and request ID.
4. **User-facing error messages** MUST be actionable: "Unable to load search results. Check your internet connection and try again."
5. **Frontend components** MUST handle loading, error, and empty states. NEVER render `undefined` or throw to React error boundary for expected error cases.
6. **Promise rejections** MUST be caught. No floating promises (`await` or `.catch()` is required).

---

## 18. Performance Budgets

### 18.1 Bundle Size

| Package | Max Size (gzipped) | Measured By |
|---|---|---|
| `packages/client/` (JS bundle) | 500 KB | `next build` output |
| `packages/engine/` (JS bundle) | 300 KB | Rollup/Vite build |
| `packages/core/` (JS bundle) | 100 KB | Rollup/Vite build |
| Total initial page load (JS + CSS + fonts) | 1 MB | Lighthouse |

### 18.2 Runtime Performance

| Metric | Target | Measured By |
|---|---|---|
| Time to Interactive (TTI) | < 3 seconds | Lighthouse |
| First Contentful Paint (FCP) | < 1.5 seconds | Lighthouse |
| Globe rendering FPS | ≥ 30 FPS (60 FPS on desktop) | Custom `requestAnimationFrame` tracker |
| Camera fly-to animation duration | < 2 seconds (TELEPORT: instant) | Perf measurement in `EarthCamera` |
| Search response time (P95) | < 500ms | Server-side timing middleware |
| API response time (P95) | < 200ms | Server-side timing middleware |
| Tile load time (P95) | < 1 second | Client-side `PerformanceObserver` |

### 18.3 CI Enforcement

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

## 19. Security Rules

### 19.1 Authentication

1. **NextAuth.js** handles all authentication flows. Never implement custom auth.
2. **Session validation** happens on every API request via NextAuth middleware.
3. **CSRF protection** is handled by NextAuth. No additional CSRF tokens needed for same-origin requests.
4. **CORS is restricted** to the production domain only.

### 19.2 Authorization

1. **Document-level authorization**: OWNER, EDITOR, VIEWER roles enforced at the API layer.
2. **Row-Level Security** (RLS) on PostgreSQL for multi-tenant isolation:
   ```sql
   ALTER TABLE features ENABLE ROW LEVEL SECURITY;
   CREATE POLICY feature_isolation ON features
     USING (document_id IN (
       SELECT document_id FROM document_collaborators WHERE user_id = current_setting('app.current_user_id')
     ));
   ```
3. **Never trust client-side authorization checks** — all authorization MUST be enforced server-side.

### 19.3 Input Validation

1. **Zod schemas** validate ALL API inputs before they reach business logic.
2. **Sanitize user-generated HTML** (balloon styles, feature descriptions) using `DOMPurify` on the server before storage.
3. **Validate file uploads**: max file size (KML: 50MB, GLTF: 100MB), allowed MIME types, malware scanning.

### 19.4 Secrets Management

1. **NEVER** hardcode secrets in source code — use environment variables.
2. **API keys** for external services (OpenAI, Mapbox, Cesium ion) are stored in server environment only.
3. **Use `.env.example`** to document required environment variables without values.
4. **Rotate secrets** on a schedule (every 90 days minimum).

### 19.5 Dependency Security

1. **`npm audit`** runs on every CI build. HIGH/CRITICAL vulnerabilities block merge.
2. **Dependabot** is configured for automated dependency updates.
3. **Lockfile (`package-lock.json`)** is committed to the repository.

---

## 20. Documentation Requirements

### 20.1 Code Documentation

1. **Every public class** MUST have a JSDoc comment describing its purpose:
   ```typescript
   /**
    * Dispatches commands to registered handlers, maintains undo/redo stacks,
    * and logs all command execution to the event logger.
    *
    * @example
    * const dispatcher = new CommandDispatcher(globe, camera, stores, logger);
    * dispatcher.registerHandler('flyToCamera', new FlyToCameraHandler(globe, camera));
    * dispatcher.dispatch(new FlyToCameraCommand({ ... }));
    */
   export class CommandDispatcher implements ICommandDispatcher { ... }
   ```
2. **Every public method** MUST have a JSDoc comment describing parameters, return value, and thrown errors.
3. **Complex logic** (algorithms, coordinate transformations, shader code) MUST have inline comments explaining the "why", not the "what".
4. **External references** (Wikipedia pages, papers, Google Earth docs) MUST be linked in comments for geometry/physics algorithms.

### 20.2 Project Documentation

| File | Audience | Update Trigger |
|---|---|---|
| `README.md` | New developers, public | Every phase completion |
| `PROJECT_RULES.md` (this file) | All contributors | Governance changes (rare) |
| `IMPLEMENTATION_PLAN.md` | Developers, architects | Major architectural changes |
| `IMPLEMENTATION_ROADMAP.md` | Developers, PMs | Phase planning changes |
| `DEVELOPMENT_SPEC.md` | Proto developers | New proto files or validation rules |
| `CHANGELOG.md` | All stakeholders | Every version bump |
| `CAPABILITIES.md` | PMs, stakeholders | Phase completion |

### 20.3 API Documentation

1. **All API endpoints** are documented in `packages/core/src/interfaces/api/` as TypeScript interfaces.
2. **API route handlers** include a JSDoc comment with request/response examples.
3. **Swagger/OpenAPI** spec is generated from the TypeScript interfaces (post-Phase 5).
4. **API breaking changes** MUST be documented in `CHANGELOG.md` under `### Changed` with migration guide.

---

## 21. CI/CD Rules

### 21.1 Pipeline Stages

```
Push to any branch:
  1. Lint (ESLint + Prettier)
  2. Type check (tsc --noEmit)
  3. Unit tests (Vitest)
  4. Bundle size check
  5. Dependency audit (npm audit)

Pull request to main or phase/*:
  1. All of the above +
  2. Integration tests (Vitest + PostGIS)
  3. Build check (turbo build)
  4. Version consistency check
  5. Changelog check (if version changed)
  6. Proto immutability check (if .proto files touched)

Merge to main:
  1. All of the above +
  2. E2E tests (Playwright)
  3. Deploy to staging
  4. Smoke tests on staging
  5. Deploy to production (manual approval gate for v0.x.0 releases)
```

### 21.2 Required Status Checks for Merge

- `lint` (ESLint)
- `typecheck` (TypeScript)
- `test-unit` (Vitest)
- `test-integration` (Vitest + PostGIS)
- `build` (Turborepo)
- `version-check` (version consistency)
- `proto-check` (proto immutability, only if `.proto` changed)
- `bundle-size` (performance budgets)
- `audit` (npm audit)

### 21.3 Deployment

| Environment | Branch | Trigger |
|---|---|---|
| **Preview** | All PR branches | Automatic on PR creation/update |
| **Staging** | `main` | Automatic on merge |
| **Production** | `main` | Manual approval + tag push |

---

## 22. Governance Enforcement

### 22.1 Automated Checks

The following rules are AUTOMATED and CANNOT be bypassed by humans:

| Rule | Tool | File |
|---|---|---|
| No `any` types | ESLint | `.eslintrc.js` |
| Import boundaries | ESLint `no-restricted-imports` | `.eslintrc.js` |
| Version consistency | Shell script in CI | `.github/workflows/version-check.yml` |
| Proto file immutability | Shell script in CI | `.github/workflows/proto-check.yml` |
| Test coverage thresholds | Vitest config | `vitest.*.config.ts` |
| Commit format | `commitlint` | `commitlint.config.js` |
| Bundle size | `bundlesize` | `bundlesize.config.json` |
| CHANGELOG update required | CI check (if version changed) | `.github/workflows/changelog-check.yml` |
| TypeScript strict mode | `tsconfig.json` | All `tsconfig.json` files |
| Dependency vulnerability | `npm audit` | `.github/workflows/ci.yml` |

### 22.2 Manual Enforcement (Code Review)

The following rules are enforced by human reviewers (checklist in Section 8):

- Phase boundary adherence
- OOP hierarchy correctness
- MobX decorator usage
- `toProto()` / `fromProto()` completeness
- Interface vs. implementation separation
- File organization (one class per file)
- Test coverage of edge cases
- Documentation quality

### 22.3 Rule Change Process

1. **Propose** a rule change via GitHub issue with label `governance`.
2. **Discuss** in the issue thread. At least 2 maintainers must approve.
3. **Update** `PROJECT_RULES.md` in a PR.
4. **Announce** the change in the team communication channel.
5. **All existing code** that violates the new rule must be fixed OR explicitly grandfathered in the issue.

### 22.4 Escalation

If a contributor repeatedly violates governance rules:

1. **First violation**: Comment on PR pointing to the specific rule. PR is not blocked for minor violations if the fix is trivial.
2. **Second violation (same rule)**: PR is blocked until rule is satisfied. Reviewer provides specific guidance.
3. **Third violation (same rule)**: PR is blocked. Team lead schedules a 1:1 to understand the root cause.
4. **Persistent pattern across rules**: Team lead discusses in retro; may require additional tooling (pre-commit hooks, stricter CI) to automate enforcement.

### 22.5 Governance Versioning

This `PROJECT_RULES.md` document itself follows the versioning rules:

- The governance version is tracked independently from the codebase version in the document header.
- Major governance changes (new rules, removal of rules): bump governance MINOR version.
- Clarifications, wording fixes, examples: bump governance PATCH version.
- Governance version: **v0.1.0** (this revision).

---

> **End of Project Rules & Governance**
>
> *This document is authoritative. When in doubt, this document wins. If this document is unclear, the rule is invalid and must be clarified via the rule change process (Section 22.3).*
