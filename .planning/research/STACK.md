# Stack Recommendation: ClinicSoftware PWA

> Context: Single-doctor clinic prescription/patient management PWA. Offline-first (unreliable internet, hours-long outages). Runs on old Windows machines with Chrome/Edge. Non-tech-savvy user.

## Decision Summary

| Layer | Choice | Version | Confidence |
|-------|--------|---------|------------|
| Build Tool | Vite | 7.3.x | High |
| UI Framework | React | 19.2.x | High |
| Routing | React Router | 7.13.x | High |
| Styling | Tailwind CSS | 4.2.x | High |
| Components | shadcn/ui | latest | High |
| Local DB | Dexie.js | 4.3.x | High |
| Service Worker | vite-plugin-pwa (Workbox 7) | 0.21.x | High |
| Cloud Sync Backend | Supabase (Cloud, Free/Pro) | - | Medium |
| Printing | react-to-print + CSS @media print | 3.3.x | High |
| Type Safety | TypeScript | 5.7.x | High |

---

## Layer-by-Layer Rationale

### 1. Build Tool: Vite 7.3.x

**Why Vite:** Fastest dev server and build pipeline for SPAs. Native ESM, HMR under 50ms. First-class PWA plugin ecosystem (vite-plugin-pwa). No webpack complexity.

**Why not Next.js:** This is a single-user offline-first SPA, not a content site. SSR/SSG adds complexity with zero benefit. Next.js PWA support requires workarounds; Vite's is native. The app never needs SEO, server components, or API routes baked into the framework.

**Why not CRA:** Dead project. Vite is its spiritual successor.

### 2. UI Framework: React 19.2.x

**Why React:** Largest ecosystem, most library compatibility, easiest to hire for if needed later. React 19's `use()` hook and server actions are available but optional for this SPA use case.

**Why not Vue/Svelte:** Both are viable. React wins on ecosystem breadth (printing libraries, component libraries, IndexedDB hooks). For a solo project this is a wash, but React's library availability tips the scale.

### 3. Routing: React Router 7.13.x

**Why:** De facto standard for React SPAs. v7 merges Remix capabilities but works perfectly as a simple client-side router. For this app, we only need 4-5 routes (login, patient list, patient profile, new encounter, settings).

**Why not TanStack Router:** Newer, type-safe, excellent. But React Router is battle-tested and this app's routing needs are trivial. No benefit to adopting the newer option here.

### 4. Styling: Tailwind CSS 4.2.x

**Why:** Utility-first approach is fast for building simple, large-text UIs. No context switching between files. v4.2 has a new high-performance engine (5x faster builds). Perfect for the "big buttons, obvious navigation" requirement.

**Why not plain CSS/CSS Modules:** Tailwind is faster to iterate on for a single developer. The utility approach reduces decision fatigue for spacing, typography, and responsive design.

### 5. Component Library: shadcn/ui

**Why:** Copy-paste model means zero runtime dependency, full control over components. Built on Radix UI primitives (accessibility baked in). Styled with Tailwind, so it integrates seamlessly. Large buttons, dialogs, comboboxes (for medication autocomplete) are all available out of the box.

**Why not MUI/Ant Design:** Both are heavyweight runtime dependencies. MUI's theming system is overkill. shadcn gives us exactly the components we need with no bundle bloat. The doctor's old Windows machine will thank us.

### 6. Local Database: Dexie.js 4.3.x

**Why Dexie over raw IndexedDB:** IndexedDB's native API is callback-based and painful. Dexie wraps it with a clean promise-based API, supports compound indexes, bulk operations, and has `liveQuery()` for reactive UI updates (critical: when a prescription is saved, the patient profile updates automatically).

**Why Dexie over idb:** `idb` is a thin wrapper (~1KB). Dexie provides querying, schema versioning, migration support, and reactive hooks via `dexie-react-hooks`. For a data-heavy app (patients, encounters, prescriptions, medications), the richer abstraction pays for itself.

**Why not SQLite (wa-sqlite/sql.js):** SQLite-in-browser via WASM is maturing but adds ~1MB+ to the bundle and has more complex setup. Dexie's IndexedDB approach is lighter, better supported across browsers, and sufficient for this data model. SQLite would be worth considering if we needed complex JOINs or full-text search, but our queries are simple (lookup by patient ID, list encounters by date).

**Why not Dexie Cloud:** Dexie Cloud is a commercial SaaS that adds sync + auth. It's convenient but creates vendor lock-in for a critical feature (data sync). For this project, we control sync explicitly via Supabase, keeping the architecture transparent and the cost predictable.

**Companion package:** `dexie-react-hooks` for `useLiveQuery()` in components.

### 7. Service Worker: vite-plugin-pwa + Workbox 7

**Why:** `vite-plugin-pwa` is zero-config PWA integration for Vite. Under the hood it uses Workbox 7 (Google's service worker toolkit, used by 54% of mobile sites). Handles:
- App shell caching (the HTML/JS/CSS)
- Offline fallback
- Cache-first strategies for static assets
- Manifest generation for PWA installability

**Why not Serwist:** Serwist (v9.2.x) is a solid alternative, but `vite-plugin-pwa` has tighter Vite integration, more documentation, and a larger community. For a straightforward caching strategy, it's the safer pick.

**Caching strategy:**
- Static assets: CacheFirst (JS, CSS, images, fonts)
- App shell: StaleWhileRevalidate
- API calls: NetworkFirst with IndexedDB fallback (handled by our sync layer, not Workbox)

### 8. Cloud Sync Backend: Supabase (Cloud)

**Why Supabase:** PostgreSQL-based, open source, generous free tier (50K MAU, 500MB DB). REST API that works with simple `fetch()`. Row Level Security for data isolation if multi-tenancy ever matters. Pro plan is $25/month if the free tier is outgrown.

**Why Cloud, not self-hosted:** Self-hosting requires DevOps maintenance. For a single-doctor clinic, the managed service is the right tradeoff. Free tier is likely sufficient indefinitely for one user's patient data.

**Why not Firebase/Firestore:** Firebase has better built-in offline sync, but: (a) Firestore's data model (document/collection) is awkward for relational patient data, (b) vendor lock-in to Google, (c) pricing is per-read which can surprise you. Supabase gives us a real PostgreSQL database that we own and can export.

**Why not Dexie Cloud:** Commercial pricing, less control over the backend, and we'd still need a separate auth solution. Supabase gives us DB + Auth + Storage in one.

**Sync architecture (custom, simple):**
1. All writes go to Dexie (IndexedDB) first. UI is always local-first.
2. A sync queue records every mutation (create/update) with a timestamp.
3. When online, a background process pushes queued changes to Supabase via REST.
4. Conflict resolution: last-write-wins by timestamp (acceptable for single-user).
5. On app startup (when online), pull latest from Supabase to catch any edge cases.

### 9. Printing: react-to-print 3.3.x + CSS @media print

**Why react-to-print:** Renders a React component to the browser's native print dialog. No drivers, no electron, no thermal printer SDK. The doctor clicks "Print", the browser print dialog opens with the prescription slip pre-rendered. Works on any printer connected to the Windows machine.

**Why CSS @media print:** Controls what shows on the printed page (hide nav, hide buttons, set page size). Combined with custom CSS for small-format paper, this handles the prescription slip and dispensary slip layouts.

**Why not react-thermal-printer:** The project requirements specify a small-format slip, not necessarily a thermal/POS printer. `react-to-print` with CSS page-size rules works with any printer type. If the clinic does use a thermal printer, the browser print dialog still works, just needs the correct paper size configured once in Windows printer settings.

**Approach:**
- Two print templates as React components: `PrescriptionSlip` and `DispensarySlip`
- CSS `@page { size: 80mm 200mm; }` (adjust to actual paper size)
- `react-to-print` triggers `window.print()` scoped to the template component

### 10. TypeScript 5.7.x

**Why:** Catches bugs at write-time, not runtime. Critical for a medical app where a typo in a field name could mean lost patient data. Dexie has excellent TypeScript support for typed table schemas.

---

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| **Next.js / Remix (full-stack)** | SSR/SSG adds complexity with no benefit for a single-user offline SPA. No SEO needed. |
| **Electron** | Requires packaging, distribution, updates. A PWA eliminates all of this. |
| **Redux / Zustand** | Overkill for single-user state. React's built-in `useState`/`useContext` + Dexie's `useLiveQuery` covers all state needs. |
| **GraphQL** | Two entities (patients, encounters) with simple queries. REST is simpler and sufficient. |
| **MongoDB Atlas / DynamoDB** | Cloud-only, no offline story. Supabase + Dexie handles both layers. |
| **Capacitor / Ionic** | Native wrapper not needed. PWA installability via Chrome/Edge is sufficient for a desktop-first app. |
| **Jest** | Vitest is Vite-native, faster, and API-compatible. Use Vitest for unit/integration tests. |
| **Prettier** | Biome is faster (Rust-based) and handles both formatting and linting. Single tool instead of Prettier + ESLint. |

---

## Dev Tooling

| Tool | Purpose | Version |
|------|---------|---------|
| Vitest | Unit + integration tests | 3.x |
| Biome | Linting + formatting | 1.9.x |
| Playwright | E2E tests (if needed later) | 1.50.x |

---

## Package Install Command (Starter)

```bash
# Scaffold
npm create vite@latest clinic-software -- --template react-ts

# Core
npm i react-router dexie dexie-react-hooks react-to-print

# Styling
npx shadcn@latest init

# PWA
npm i -D vite-plugin-pwa

# Cloud sync (when ready)
npm i @supabase/supabase-js

# Dev tooling
npm i -D vitest @biomejs/biome
```

---

## Architecture Diagram (Conceptual)

```
[React UI] --> reads/writes --> [Dexie.js (IndexedDB)]
                                       |
                                  [Sync Queue]
                                       |
                              (when online) |
                                       v
                                  [Supabase REST API]
                                       |
                                  [PostgreSQL]

[Service Worker (Workbox)] --> caches --> [App Shell + Static Assets]
[react-to-print] --> triggers --> [Browser Print Dialog] --> [Printer]
```

---

## Open Questions

1. **Paper size:** Exact dimensions of the prescription slip paper needed to configure `@page` CSS. Need to measure the physical paper.
2. **Drug database source:** Where does the initial medication list come from? Manual entry, or is there a Pakistani drug formulary dataset available?
3. **Backup frequency:** How often should cloud sync attempt to push? Every write, or batched every N minutes? Recommendation: every write when online, queued when offline.

---

*Research date: 2026-03-05. Versions verified via npm and official release pages.*
