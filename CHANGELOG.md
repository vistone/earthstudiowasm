# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v0.0.1] - 2026-08-12 — Initial proto analysis release

### Added
- 1,316 Google official Earth Studio proto files (38 domains, 4,195 import edges)
- English + Chinese README with full project overview
- English + Chinese development specification (DEVELOPMENT_SPEC)
- Quick reference card for daily development
- Dependency map documents with Mermaid flowcharts (EN+ZH)
- Per-file dependency listing with Top 50 most-depended-on ranking
- 3 interactive HTML dependency diagrams (zoomable, theme toggle)
- 12-item automated compliance checker (check-all.sh)
- CI workflow for proto compliance on every PR
- Complete architecture analysis: 5 reports covering all 1,316 files (EN+ZH, 12,640 lines total)
- Capabilities analysis: what proto files can/cannot do + migration guide (EN+ZH)
- Implementation roadmap: 8-phase plan from proto to working clone (EN+ZH)
- Complete implementation plan: TS+Three.js+Next.js OOP architecture, 6,034 lines (EN+ZH)
- Bilingual documentation with cross-links and language switchers

### Changed
- Restored 3 accidentally modified Google official proto files to original state
- Compliance checker now distinguishes Google official files (OBSERVE) from our files (FAIL)

---

## Version Guide

| Version | When | Example |
|---|---|---|
| MAJOR +1 | Breaking proto change | v0.1.0 → v1.0.0 |
| MINOR +1 | Phase completion | v0.1.0 → v0.2.0 |
| PATCH +1 | Any other change | v0.1.0 → v0.1.1 |
