# Architecture: Offline-First Clinic PWA

Reference: `.planning/PROJECT.md` for requirements and constraints.

## System Overview

```
+----------------------------------------------------------+
|                      PWA Shell                           |
|  (Service Worker + App Manifest + Cache Strategy)        |
+----------------------------------------------------------+
|                                                          |
|  +------------+  +-------------+  +------------------+   |
|  |   UI Layer |  | App Logic   |  | Data Layer       |   |
|  |            |->| (Services)  |->|                  |   |
|  | - Views    |  | - Patient   |  | - IndexedDB      |   |
|  | - Forms    |  | - Encounter |  | - Sync Engine    |   |
|  | - Print    |  | - Rx        |  | - Drug Catalog   |   |
|  +------------+  | - Auth      |  +--------+---------+   |
|                  | - Drug DB   |           |             |
|                  +-------------+           |             |
|                                            | (when online)|
+----------------------------------------------------------+
                                             |
                                    +--------v---------+
                                    |   Cloud Backend   |
                                    |  (DB + Auth API)  |
                                    +------------------+
```

## Components

### 1. PWA Shell

**Responsibility**: Make the app installable, cacheable, and loadable offline.

- **Service Worker**: Caches app shell (HTML/CSS/JS) on install. Uses cache-first strategy for static assets, network-first for API calls.
- **App Manifest**: Name, icons, display mode (`standalone`), theme color.
- **Cache Strategy**: Pre-cache all app assets on first load. Update via SW lifecycle (install -> activate -> claim).

**Boundary**: Owns network interception and asset caching only. Does not touch application data (that is IndexedDB's job).

### 2. UI Layer

**Responsibility**: Render screens, capture input, trigger prints.

**Views** (one per screen):

| View | Purpose |
|------|---------|
| Login | PIN/password entry |
| Dashboard | Quick actions: new patient, search, recent encounters |
| Patient Registration | Form: name, age, gender, contact, CNIC (optional) |
| Patient Search | Search by name, ID, or contact |
| Patient Profile | Demographics + encounter history list |
| Encounter Form | Complaint, examination, diagnosis fields |
| Prescription Writer | Medication autocomplete, dosage/frequency/duration per line |
| Print Preview (Rx) | Small-format prescription layout |
| Print Preview (Dispensary) | Medication-only list for dispenser |
| Settings | Manage custom medications in drug database |

**Boundary**: UI calls Service layer only. Never touches IndexedDB directly. Never makes network calls.

### 3. App Logic (Service Layer)

**Responsibility**: Business rules, validation, ID generation, data orchestration.

| Service | Owns |
|---------|------|
| AuthService | PIN validation, session state |
| PatientService | Patient CRUD, ID generation (2026-XXXX), search |
| EncounterService | Create encounter linked to patient, timestamp |
| PrescriptionService | Create Rx linked to encounter, medication line items |
| DrugService | Query drug catalog, add/edit custom medications |
| PrintService | Compose print-ready data for Rx slip and dispensary slip |

**Boundary**: Services are the single entry point for all data mutations. They call the Data Layer and return results to the UI. They enforce validation (required fields, ID format, etc.).

### 4. Data Layer

**Responsibility**: Persistent storage, sync orchestration.

#### 4a. IndexedDB Store

The local source of truth. All reads and writes go here first.

**Object Stores (tables)**:

| Store | Key | Indexes | Notes |
|-------|-----|---------|-------|
| `patients` | `id` (2026-XXXX) | name, contact | Auto-increment sequence stored separately |
| `encounters` | `uuid` | patientId, date | Linked to patient |
| `prescriptions` | `uuid` | encounterId | Linked to encounter |
| `prescription_items` | `uuid` | prescriptionId | One row per medication line |
| `drugs` | `uuid` | saltName, brandName | Pre-loaded + custom entries |
| `sync_queue` | `uuid` | timestamp, status | Outbound changes pending upload |
| `meta` | `key` | -- | App config: last sync time, next patient sequence, etc. |

**ID Strategy**: Patients get deterministic `YYYY-XXXX` IDs (from a local counter in `meta`). All other entities use client-generated UUIDs (`crypto.randomUUID()`), avoiding ID collisions during sync.

#### 4b. Sync Engine

**Strategy**: Store-and-forward with timestamp-based conflict detection.

1. Every write to IndexedDB also enqueues a record in `sync_queue` (entity type, entity ID, operation, timestamp).
2. When online, the Sync Engine processes the queue in order: POST/PUT/DELETE to cloud API.
3. On success, queue entry marked `synced`. On failure, stays `pending` for retry.
4. Periodic pull from cloud (on reconnect or interval) fetches changes since `lastSyncTimestamp`.
5. **Conflict rule**: Last-write-wins by timestamp. Acceptable for single-doctor system (no concurrent editors). If multi-user is ever added, this must be revisited.

```
Write path:  UI -> Service -> IndexedDB + sync_queue
Sync path:   sync_queue -> Cloud API (when online)
Pull path:   Cloud API -> merge into IndexedDB (on reconnect)
```

**Boundary**: Sync Engine only talks to IndexedDB and the Cloud API. Services do not wait for sync; all operations resolve from local data.

### 5. Cloud Backend

**Responsibility**: Durable backup, potential cross-device access.

Minimal surface:

| Endpoint | Purpose |
|----------|---------|
| `POST /auth` | Validate credentials |
| `GET /sync/pull?since={ts}` | Return records changed after timestamp |
| `POST /sync/push` | Accept batch of changed records |

**Tech options** (decision pending): Firebase/Firestore, Supabase, or a simple Node API + PostgreSQL. Firebase and Supabase both offer offline SDKs, but rolling a thin sync API keeps the client-side simpler and avoids vendor lock on sync logic.

**Boundary**: Backend is a dumb pipe for storage and retrieval. No business logic lives here. The client is authoritative.

### 6. Drug Catalog

**Responsibility**: Provide medication autocomplete data.

- Pre-loaded JSON seed (common medications: salt name, brand name, default dosage forms).
- Stored in the `drugs` IndexedDB store on first app load.
- Custom entries added via Settings, stored in the same store with a `custom: true` flag.
- Autocomplete searches locally (no network needed).

**Boundary**: Read-only from Prescription Writer's perspective. Write-only from Settings.

## Data Flow

### Typical Visit (Happy Path)

```
Doctor opens app (cached, loads instantly)
  -> Login (PIN check against local store)
  -> Dashboard
  -> "New Patient" or "Search" existing
  -> Patient Profile -> "New Encounter"
  -> Fill encounter form (complaint, exam, diagnosis)
  -> Add prescription lines (autocomplete from local drug DB)
  -> Save -> writes to IndexedDB + sync_queue
  -> Print Rx slip -> browser print dialog (small format CSS)
  -> Print Dispensary slip -> browser print dialog
  -> Back to Dashboard
  -> (Background) Sync Engine pushes queue to cloud when online
```

### Offline -> Online Transition

```
App detects connectivity (navigator.onLine + fetch probe)
  -> Sync Engine activates
  -> Reads sync_queue (status: pending), ordered by timestamp
  -> Pushes batch to cloud
  -> Pulls changes since lastSyncTimestamp
  -> Merges into IndexedDB (last-write-wins)
  -> Updates lastSyncTimestamp in meta store
```

## Build Order

Dependencies flow top-to-bottom. Each phase depends on the one above it.

| Phase | Components | Rationale |
|-------|-----------|-----------|
| **1. Foundation** | PWA Shell + IndexedDB schema + Service Worker | Everything depends on the local data layer and offline capability. Build the skeleton first. |
| **2. Core Data** | PatientService + EncounterService + Drug Catalog seed | Patient registration and encounter logging are the minimum viable loop. Drug catalog needed for phase 3. |
| **3. Prescriptions** | PrescriptionService + medication autocomplete | Depends on encounter (phase 2) and drug data (phase 2). This is the core value: fast Rx writing. |
| **4. Print** | PrintService + print CSS layouts (Rx slip + dispensary slip) | Depends on prescription data existing (phase 3). Two layouts: patient-facing Rx, dispenser-facing med list. |
| **5. Auth + Settings** | AuthService (PIN login) + Drug DB management UI | Lower risk. Can be stubbed during phases 1-4. Settings lets doctor customize drug list. |
| **6. Sync** | Sync Engine + Cloud Backend + conflict handling | Deliberately last. The app must work fully without this. Sync is a backup/durability layer, not a dependency. |

### Key Dependency Chain

```
IndexedDB schema -> Services -> UI Views -> Print
                                         -> Sync (independent of UI)
Drug Catalog seed -> Autocomplete (in Prescription Writer)
```

## Tech Stack Candidates (Decision Pending)

| Layer | Options | Notes |
|-------|---------|-------|
| UI Framework | Vanilla JS, Preact, SolidJS | Lightweight matters. React is overkill for this scope. |
| IndexedDB Wrapper | Dexie.js | De facto standard. Cleaner API than raw IndexedDB. Supports versioned migrations. |
| Service Worker | Workbox | Google's SW toolkit. Handles caching strategies, precaching, SW lifecycle. |
| Cloud Backend | Supabase, Firebase, custom Node+Postgres | Pending. Supabase gives Postgres + auth + realtime for free tier. |
| Print | CSS `@media print` + `@page` | No library needed. CSS handles small-format layout. |

---
*Produced: 2026-03-05. Feeds into roadmap phase structure.*
