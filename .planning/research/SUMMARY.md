# Research Summary: Clinic Prescription PWA

Single-doctor, offline-first PWA for patient management and prescription writing. Unreliable internet, old Windows hardware, non-tech-savvy user.

---

## 1. Recommended Stack

| Layer | Choice | Why |
|-------|--------|-----|
| **Build** | Vite 7.3 + TypeScript 5.7 | Fastest SPA toolchain, native PWA plugin support. No SSR needed. |
| **UI** | React 19.2 + Tailwind 4.2 + shadcn/ui | Ecosystem breadth wins. shadcn gives full component control with zero runtime cost. |
| **Routing** | React Router 7.13 | Trivial routing needs (5 routes). Battle-tested. |
| **Local DB** | Dexie.js 4.3 (IndexedDB) | Promise-based API, schema migrations, reactive queries via `useLiveQuery()`. |
| **Offline/PWA** | vite-plugin-pwa + Workbox 7 | Zero-config PWA. Cache-first static assets, stale-while-revalidate app shell. |
| **Cloud Sync** | Supabase (managed) | PostgreSQL, free tier sufficient for single user. REST API for simple push/pull sync. |
| **Printing** | react-to-print + CSS `@media print` | Browser-native print dialog. No drivers or Electron needed. |
| **Dev Tools** | Vitest, Biome, Playwright | Vite-native testing, Rust-based lint+format, E2E if needed. |

No Redux/Zustand (React state + Dexie covers it), no Next.js (no SSR benefit), no Electron (PWA is sufficient).

---

## 2. Table Stakes Features (v1)

**Must ship or the doctor won't use it:**

1. **Patient registration** with auto-generated unique ID (YYYY-XXXX)
2. **Patient search** by name, ID, or contact (<1s on local data)
3. **Patient profile** with chronological encounter history
4. **Encounter logging** (complaint, examination, diagnosis, auto-timestamped)
5. **Prescription writing** with medication autocomplete from local drug DB
6. **Prescription printing** on small-format paper (non-A4 slip)
7. **Dispensary slip** (medication-only print for the dispenser)
8. **Local drug database** pre-seeded with common medications
9. **100% offline operation** (non-negotiable given clinic internet)
10. **Simple PIN/password login**
11. **Audit trail** (immutable timestamps on all records)
12. **PWA installability** (install from browser, no .exe)

**Key differentiators for v1.x:**
- Sub-2-minute visit workflow (find patient, log encounter, write Rx, print)
- Cloud sync as background backup when online
- Prescription templates / favorites for common diagnoses
- Repeat prescription from history ("prescribe same as last visit")

**Deliberately not building:** appointments, billing, lab integration, multi-doctor, patient portal, AI decision support.

---

## 3. Architecture Overview

```
[React UI] -> [Service Layer] -> [Dexie/IndexedDB] -> [Sync Queue] -> [Supabase]
[Service Worker] -> caches app shell + static assets
[react-to-print] -> browser print dialog -> printer
```

**Layers:**
- **UI Layer**: 10 views (login, dashboard, patient CRUD, encounter form, Rx writer, print previews, settings). Never touches IndexedDB directly.
- **Service Layer**: Business logic, validation, ID generation. Single entry point for all data mutations.
- **Data Layer**: IndexedDB as source of truth. 7 stores: patients, encounters, prescriptions, prescription_items, drugs, sync_queue, meta.
- **Sync Engine**: Store-and-forward. All writes local-first, queued for cloud push. Last-write-wins conflict resolution (acceptable for single user). Prescriptions are append-only/immutable.
- **Cloud Backend**: Dumb pipe. Three endpoints: auth, sync/pull, sync/push.

**Build Order:**
1. Foundation: PWA shell, IndexedDB schema, service worker, login
2. Core data: Patient + encounter services, drug catalog seed, audit trail
3. Prescriptions: Rx writing + medication autocomplete
4. Print: Rx slip + dispensary slip layouts
5. Polish: Speed UX, custom medication management
6. Sync: Cloud backend, sync engine, conflict handling (app must work fully without this)

---

## 4. Critical Pitfalls

1. **IndexedDB eviction**: Browsers can silently purge data. Must call `navigator.storage.persist()` at startup, monitor quota, and implement local backup export before cloud sync exists. Phase 1, non-negotiable.

2. **Patient ID collisions**: Local auto-increment (YYYY-XXXX) can collide on re-install or multi-device. Use UUIDs as internal primary keys, treat YYYY-XXXX as a display ID. Store sequence counter redundantly (IndexedDB + localStorage). Architectural decision, expensive to change later.

3. **Print layout fragility**: CSS `@media print` behaves differently across browsers. Use explicit `@page { size: [mm]; margin: 0; }`, never percentages. Must test on actual printer + paper, not just screen preview.

4. **Service worker update trap**: Aggressive caching can strand the doctor on a stale version. Show "update available" banner, never force-reload mid-session. Include visible version number in settings.

5. **Over-engineering**: Single doctor, one device. No CRDTs, no microservices, no real-time sync. Simple REST push/pull with retry. Measure success by "time to complete a prescription."

---

## 5. Open Questions

| # | Question | Impact | Needs Answer Before |
|---|----------|--------|-------------------|
| 1 | **Exact paper dimensions** for prescription slips | Print CSS `@page` config | Phase 4 (Print) |
| 2 | **Drug database source**: manual entry or existing Pakistani formulary dataset? | Seed data effort | Phase 2 (Core data) |
| 3 | **Sync frequency**: push every write or batch on interval? | Sync engine design | Phase 6 (Sync) |
| 4 | **Multi-device usage**: will the doctor use phone + desktop? | Conflict resolution complexity | Phase 1 (Data model) |
| 5 | **Backup strategy before cloud sync**: auto-export to file, or manual? | Data safety gap in phases 1-5 | Phase 1 |

---

*Synthesized from: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md. Research date: 2026-03-05.*
