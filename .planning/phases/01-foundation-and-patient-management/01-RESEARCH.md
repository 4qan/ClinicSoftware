# Phase 1: Foundation and Patient Management - Research

**Researched:** 2026-03-05
**Status:** Complete

## Executive Summary

This phase establishes the entire technical foundation: an offline-first PWA with local auth, patient CRUD, and search. The recommended stack is React + Vite + Dexie.js + vite-plugin-pwa, chosen for maturity, simplicity, and strong offline support on old Windows/Chrome. Every architectural decision here shapes all subsequent phases.

## Tech Stack Recommendations

### Framework: React 19 + TypeScript + Vite

**Why React:** Largest ecosystem, most hiring/support resources, TypeScript-first. Furqan knows it. Vite provides fast builds and native PWA plugin support.

**Why not others:**
- Vue/Svelte: capable but no advantage here, and React is the known quantity.
- Next.js/Remix: SSR frameworks, wrong fit for a fully offline client-side app.

### Recommended Dependencies

| Category | Library | Rationale |
|----------|---------|-----------|
| Build | Vite 6.x | Fast dev server, native PWA plugin |
| PWA | vite-plugin-pwa (Workbox) | Zero-config service worker generation, precaching |
| Database | Dexie.js 4.x | Best IndexedDB wrapper: ~22KB, typed, handles browser bugs, built-in indexing |
| Routing | React Router 7.x | Standard, lightweight |
| Auth hashing | Web Crypto API (PBKDF2) | Native browser API, no library needed |
| UI | Tailwind CSS 4.x | Utility-first, fast iteration, no component library overhead |
| Testing | Vitest + Testing Library + Playwright | Unit/component/E2E coverage |

### What to avoid

- No state management library (React context + Dexie's `useLiveQuery` hook covers it)
- No UI component library (keep bundle small, custom components are simpler for this use case)
- No bcryptjs (unnecessary dependency when PBKDF2 is built into the browser)

## IndexedDB Strategy

### Library: Dexie.js 4.x

Dexie wraps IndexedDB with a clean Promise-based API, handles cross-browser bugs, supports compound indexes, and provides `useLiveQuery` for reactive React hooks that auto-update when data changes.

### Schema Design

```typescript
// db.ts
import Dexie, { type EntityTable } from 'dexie';

interface Patient {
  id: string;           // UUID (internal key)
  patientId: string;    // "2026-0001" (display ID)
  firstName: string;
  lastName: string;
  firstNameLower: string;  // lowercase for case-insensitive search
  lastNameLower: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  contact?: string;
  cnic?: string;
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
}

interface AppSettings {
  key: string;          // e.g., "auth", "patientIdCounter"
  value: any;
}

interface RecentPatient {
  id: string;           // UUID of patient
  viewedAt: string;     // ISO 8601
}

const db = new Dexie('ClinicSoftware') as Dexie & {
  patients: EntityTable<Patient, 'id'>;
  settings: EntityTable<AppSettings, 'key'>;
  recentPatients: EntityTable<RecentPatient, 'id'>;
};

db.version(1).stores({
  patients: 'id, patientId, firstNameLower, lastNameLower, contact, createdAt',
  settings: 'key',
  recentPatients: 'id, viewedAt',
});
```

### Patient ID Generation (2026-XXXX)

Strategy: store a counter in the `settings` table (`key: "patientIdCounter"`). On save (not on form open):

1. Read current counter inside a Dexie transaction.
2. Increment counter.
3. Generate display ID: `2026-${counter.toString().padStart(4, '0')}`.
4. Save patient + updated counter in the same transaction.

This avoids ID gaps from abandoned forms. The counter rolls over naturally (2026-0001, 2026-0002, ..., 2026-9999, then 2026-10000 if needed).

**Year rollover consideration:** The "2026" prefix is a compliance label, not a date-based partition. If the app is used into 2027+, a settings option or automatic year detection could update the prefix. Defer this decision; it is not Phase 1 scope.

## PWA Architecture

### Service Worker Strategy

Use `vite-plugin-pwa` with `generateSW` strategy (not `injectManifest`). Rationale: this is a purely offline app with no API calls. All we need is precaching of static assets.

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      manifest: {
        name: 'Clinic Software',
        short_name: 'Clinic',
        description: 'Patient management for clinic',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});
```

### Installability Checklist (FOUND-01)

Chrome/Edge require: valid manifest with name, icons (192px + 512px), start_url, display: standalone, served over HTTPS (or localhost). The `vite-plugin-pwa` handles manifest generation. For local testing, localhost satisfies the HTTPS requirement.

### Offline Guarantee (FOUND-02, FOUND-03)

The `generateSW` strategy with `globPatterns: ['**/*']` precaches all built assets on first load. After initial visit, the app works entirely offline. No network requests needed for any functionality since all data is in IndexedDB.

## Authentication Approach

### Design (FOUND-04)

Single-user, offline-only auth. No server, no JWT, no session tokens.

**Flow:**
1. First run: `settings.auth` does not exist. App shows login screen with default password (e.g., "clinic123").
2. Doctor logs in with default password. Auth state stored in `sessionStorage` (or a React context flag).
3. `settings.auth` stores: `{ passwordHash, salt, iterations, recoveryCodeHash, recoverySalt }`.
4. On login: derive key from entered password using PBKDF2 with stored salt, compare to stored hash.
5. "Stay logged in" via `localStorage` flag. On app load, if flag exists, skip login. Explicit logout clears it.

### Password Hashing (Web Crypto API, PBKDF2)

```typescript
async function hashPassword(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
}
```

No external library needed. PBKDF2 with 100K iterations and a random salt is sufficient for this threat model (physical access to a clinic PC, not a high-value server-side target).

### Recovery Code

On first password change (or setup), generate a random 8-character alphanumeric code. Hash and store it. Doctor writes it on paper. Entering the recovery code allows setting a new password.

## Search Implementation

### Strategy (PAT-03)

Type-ahead with debounce (200-300ms). Three search paths:

1. **By patient ID:** `db.patients.where('patientId').startsWith(query)` (indexed, instant).
2. **By contact:** `db.patients.where('contact').startsWith(query)` (indexed, instant).
3. **By name:** `db.patients.where('firstNameLower').startsWith(query.toLowerCase())` combined with a scan on `lastNameLower`. For full-name matching ("Ahmed Khan"), split query into tokens and filter.

### Performance

With Dexie indexes on `patientId`, `firstNameLower`, `lastNameLower`, and `contact`, searches over thousands of patients complete in well under 1 second. A typical clinic accumulates ~2,000-5,000 patients per year. IndexedDB handles tens of thousands of records without issue.

For the registration page duplicate check, the same search infrastructure is reused, filtering by name as the doctor types.

### Implementation Pattern

```typescript
function usePatientSearch(query: string) {
  return useLiveQuery(async () => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase().trim();

    // Try patient ID match first
    if (/^\d/.test(q)) {
      return db.patients.where('patientId').startsWith(q).limit(10).toArray();
    }

    // Name search: match first or last name prefix
    const byFirst = db.patients.where('firstNameLower').startsWith(q).limit(10).toArray();
    const byLast = db.patients.where('lastNameLower').startsWith(q).limit(10).toArray();
    const [first, last] = await Promise.all([byFirst, byLast]);

    // Deduplicate by id
    const map = new Map();
    [...first, ...last].forEach(p => map.set(p.id, p));
    return Array.from(map.values()).slice(0, 10);
  }, [query]);
}
```

## Data Model

### Patient Schema (extensible for future phases)

The schema in the IndexedDB Strategy section above is designed for extensibility:

- **Encounters (Phase 2):** Add an `encounters` table with `patientId` as indexed foreign key. No schema migration needed on the `patients` table.
- **Prescriptions (Phase 2):** Add a `prescriptions` table linked to `encounterId`.
- **Drugs (Phase 2):** Add a `drugs` table for the medication database.

Each table follows the same pattern: UUID primary key, timestamps, indexed foreign keys.

### Separation of Concerns

Patient data is normalized. No embedded arrays of encounters inside patient records. This keeps queries fast and updates atomic.

## Audit Trail

### Strategy (FOUND-05)

Every record gets `createdAt` and `updatedAt` fields (ISO 8601 strings).

**Implementation:** A Dexie middleware or wrapper functions that automatically set timestamps:

```typescript
function withTimestamps<T extends { createdAt?: string; updatedAt?: string }>(
  data: T, isNew: boolean
): T {
  const now = new Date().toISOString();
  if (isNew) data.createdAt = now;
  data.updatedAt = now;
  return data;
}
```

Applied at the data access layer, not in UI components. Every `add()` sets both; every `update()` sets `updatedAt`.

**No deletion in UI.** Patient records are never deleted through the app (compliance requirement from CONTEXT.md). A database reset mechanism exists for clearing test data before go-live.

## UI/UX Considerations

### Target User Profile

- Furqan's father, not tech-savvy
- Uses old Windows PC with Chrome/Edge
- Unreliable internet, may be offline for hours
- Needs to register/find patients quickly between appointments

### Design Principles

1. **Large touch targets and text.** Minimum 16px body text, 18-20px for form labels. Buttons at least 44px tall.
2. **Minimal navigation depth.** Three main views: Home (search + recent), Patient Profile, Register Patient. One level deep max.
3. **Obvious actions.** Primary actions are large, colored buttons. No icon-only buttons. Always labeled.
4. **No jargon.** "Patient Visit" not "Encounter." "Save" not "Submit." "Search patients" not "Query."
5. **Error states are friendly.** "No patients found. Register a new patient?" not "0 results."
6. **Offline indicator.** Small, non-intrusive banner when offline (but app works identically).
7. **High contrast.** Dark text on light background. No light-gray-on-white.

### Layout

- **Home page:** Search bar (prominent, centered), recent patients list below.
- **Header:** App name, persistent search (compact), settings gear icon.
- **Patient profile:** Info card (ID, name, age/gender, contact) at top, history section below (empty in Phase 1 with "No visits yet" message).
- **Registration form:** Single page, fields top-to-bottom in priority order: first name, last name, gender, age, contact, CNIC. Patient ID preview at top (read-only). Save button at bottom, large and obvious.

### Responsive Considerations

Primary target is desktop (old Windows PC). But since it is a PWA, ensure it does not break on tablet/mobile viewports. Tailwind's responsive utilities handle this naturally.

## Validation Architecture

### Test Strategy

Three layers, aligned with the bug fix discipline from CLAUDE.md (test where the bugs are):

#### 1. Unit Tests (Vitest)

- **Data layer:** Patient CRUD operations, ID generation, timestamp injection, search queries.
- **Auth:** Password hashing, comparison, recovery code generation/validation.
- **Utilities:** ID formatting, input validation.

Test against an in-memory IndexedDB using `fake-indexeddb` (Dexie supports it for testing).

#### 2. Component Tests (Vitest + Testing Library)

- **Registration form:** Required field validation, duplicate check trigger, patient ID preview, save flow.
- **Search:** Type-ahead behavior, result rendering, empty state, navigation to profile.
- **Patient profile:** Data display, edit mode toggle, field updates.
- **Login:** Default password flow, wrong password error, stay-logged-in persistence.

#### 3. E2E Tests (Playwright)

- **Critical path:** Open app, log in, register patient, search for patient, view profile, edit patient.
- **Offline:** Disconnect network in Playwright, verify all flows still work.
- **PWA installability:** Verify manifest is served, service worker registers.

#### What to Validate Per Requirement

| Requirement | Validation |
|-------------|------------|
| FOUND-01 | Playwright: manifest served, SW registered, install prompt available |
| FOUND-02 | Playwright: all flows work with network disabled |
| FOUND-03 | Unit: SW precache manifest includes all assets |
| FOUND-04 | Component: login flow, wrong password, stay-logged-in, recovery |
| FOUND-05 | Unit: every create/update operation sets timestamps |
| PAT-01 | Component: registration form with all fields, validation |
| PAT-02 | Unit: ID generation is sequential, no gaps on save, correct format |
| PAT-03 | Component: search returns results in <1s, matches name/ID/contact |
| PAT-04 | Component: profile displays patient info (history empty in Phase 1) |

#### Manual QA Checklist (before handoff to doctor)

- Install PWA from Chrome on Windows
- Disconnect Wi-Fi, verify all features work
- Register 20+ test patients, verify search speed
- Close browser, reopen, verify still logged in
- Test on Edge as backup browser

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| IndexedDB data loss (browser clear, update) | Low | High | Phase 1: warn doctor not to clear browser data. v2: cloud sync backup. |
| Old Chrome version missing Web Crypto or IndexedDB features | Low | High | Require Chrome 80+ (2020). Web Crypto and IndexedDB v2 are supported. Verify on actual machine early. |
| Doctor forgets changed password, loses recovery code | Medium | High | Recovery code on paper. Default password documented. Worst case: clear IndexedDB in dev tools (Furqan can assist remotely). |
| Patient ID counter corruption (e.g., concurrent tab) | Low | Medium | Dexie transactions are atomic. Only one tab should be active; add a "tab already open" warning if needed. |
| Service worker caching stale app version | Medium | Low | `registerType: 'autoUpdate'` auto-refreshes. Add a "New version available, refresh" toast as fallback. |
| Tailwind bundle size on old machine | Low | Low | Tailwind 4.x purges unused CSS. Final bundle well under 500KB. |

---
*Phase: 01-foundation-and-patient-management*
*Research completed: 2026-03-05*
