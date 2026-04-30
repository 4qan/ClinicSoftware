# Roadmap: ClinicSoftware

## Milestones

- v1.0 MVP -- 3 phases (shipped 2026-03-06)
- v1.1 Urdu & Backup -- 7 phases (shipped 2026-03-11)
- v1.2 Print Customization -- 2 phases (shipped 2026-03-12)
- v1.3 Keyboard Navigation -- 3 phases (shipped 2026-03-15)
- v1.4 Slip Assignment & Print Settings -- Phases 15-16 (shipped 2026-03-19)
- v1.5 Visit Vitals -- Phase 17 (shipped 2026-03-19)
- v1.6 Unified Medication Management -- Phase 18 (shipped 2026-03-19)
- v2.0 Multi-User Sync -- Phases 19-23 (planned)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-3) -- SHIPPED 2026-03-06</summary>

- [x] Phase 1: Foundation and Patient Management (7/7 plans) -- completed 2026-03-06
- [x] Phase 2: Clinical Workflow (4/4 plans) -- completed 2026-03-06
- [x] Phase 3: Printing and Visit Completion (3/3 plans) -- completed 2026-03-06

</details>

<details>
<summary>v1.1 Urdu & Backup (Phases 4-9) -- SHIPPED 2026-03-11</summary>

- [x] Phase 4: Urdu Foundation (2/2 plans) -- completed 2026-03-06
- [x] Phase 5: Prescription Print Urdu (2/2 plans) -- completed 2026-03-06
- [x] Phase 5.1: Prescription Entry Cleanup (2/2 plans) -- completed 2026-03-06
- [x] Phase 6: Rx Notes Urdu Toggle (2/2 plans) -- completed 2026-03-07
- [x] Phase 7: Backup Export (2/2 plans) -- completed 2026-03-10
- [x] Phase 8: Backup Restore (2/2 plans) -- completed 2026-03-11
- [x] Phase 9: Auto-Snapshots (2/2 plans) -- completed 2026-03-11

</details>

<details>
<summary>v1.2 Print Customization (Phases 10-11) -- SHIPPED 2026-03-12</summary>

- [x] Phase 10: Print Infrastructure & Settings (2/2 plans) -- completed 2026-03-11
- [x] Phase 11: Layout Scaling & Preview (2/2 plans) -- completed 2026-03-12

</details>

<details>
<summary>v1.3 Keyboard Navigation (Phases 12-14) -- SHIPPED 2026-03-15</summary>

- [x] Phase 12: Focus Foundation and Form Submission (2/2 plans) -- completed 2026-03-14
- [x] Phase 13: Keyboard Interactions (3/3 plans) -- completed 2026-03-14
- [x] Phase 14: Print Flow (1/1 plan) -- completed 2026-03-14

</details>

<details>
<summary>v1.4 Slip Assignment & Print Settings (Phases 15-16) -- SHIPPED 2026-03-19</summary>

- [x] Phase 15: Slip Assignment (2/2 plans) -- completed 2026-03-19
- [x] Phase 16: Auto-Print Toggle (1/1 plan) -- completed 2026-03-19

</details>

<details>
<summary>v1.5 Visit Vitals (Phase 17) -- SHIPPED 2026-03-19</summary>

- [x] Phase 17: Visit Vitals (2/2 plans) -- completed 2026-03-19

</details>

<details>
<summary>v1.6 Unified Medication Management (Phase 18) -- SHIPPED 2026-03-19</summary>

- [x] Phase 18: Unified Medication Management (2/2 plans) -- completed 2026-03-19

</details>

### v2.0 Multi-User Sync (Planned)

**Milestone Goal:** Nurse and doctor work on separate computers. Nurse creates patients and records vitals. Doctor sees everything and writes prescriptions. Data syncs over LAN via CouchDB/PouchDB, no internet required.

- [x] **Phase 19: PouchDB Migration** - Replace Dexie with PouchDB and migrate all existing clinic data without loss (completed 2026-03-19)
- [x] **Phase 20: CouchDB Infrastructure** - CouchDB running as a secured Windows service on the doctor's machine, accessible from nurse's machine over LAN (completed 2026-03-19)
- [x] **Phase 21: Auth and Role Enforcement** - Two-user login with CouchDB session auth and role-based access gating (completed 2026-03-19)
- [x] **Phase 22: Live Sync** - Bidirectional real-time sync between machines with visible sync status (completed 2026-03-20)
- [ ] **Phase 22.1: Solo Mode** - Single-machine default deployment with no CouchDB; networked mode preserved as opt-in upgrade
- [ ] **Phase 23: Backup Redesign** - Backup and restore adapted for the synced multi-machine environment

## Phase Details

### Phase 15: Slip Assignment
**Goal**: Doctor can tag each medication as dispensary or prescription, and each slip prints only its tagged medications
**Depends on**: Phase 14
**Requirements**: SLIP-01, SLIP-02, SLIP-03, SLIP-04, SLIP-05
**Success Criteria** (what must be TRUE):
  1. When adding a medication, user sees a dispensary/prescription selector (defaults to dispensary)
  2. Prescription slip prints only medications tagged as "prescription"
  3. Dispensary slip prints only medications tagged as "dispensary"
  4. Slip assignment persists when the encounter is saved and reopened
**Plans:** 2/2 plans complete
Plans:
- [x] 15-01-PLAN.md -- Data model (slipType field) and toggle UI in medication list
- [x] 15-02-PLAN.md -- Print filtering by slip type, empty slip handling, Rx badge in visit history

### Phase 16: Auto-Print Toggle
**Goal**: Doctor can enable or disable auto-print from Print Management settings, and the preference survives sessions
**Depends on**: Phase 15
**Requirements**: PRSET-05, PRSET-06
**Success Criteria** (what must be TRUE):
  1. Print Management settings page shows an auto-print on/off toggle
  2. With auto-print on, slips print automatically on visit save (existing behavior preserved)
  3. With auto-print off, slips do not auto-print; doctor triggers print manually
  4. Auto-print preference persists after page refresh and browser restart
**Plans:** 1/1 plans complete
Plans:
- [x] 16-01-PLAN.md -- Auto-print toggle in settings UI, persistence, and print gate

### Phase 17: Visit Vitals
**Goal**: Doctor can record optional vital signs (temperature, BP, weight, SpO2) per visit; vitals display prominently in visit history cards for quick clinical reference
**Depends on**: Phase 16
**Requirements**: VIT-01 through VIT-06
**Success Criteria** (what must be TRUE):
  1. NewVisitPage and EditVisitPage show a collapsible "Vitals" section above clinical notes with a compact 2x2 grid layout
  2. Temperature input supports Fahrenheit (default) and Celsius with a toggle that converts the value
  3. Blood pressure captured as systolic/diastolic (mmHg) in side-by-side inputs
  4. Weight input in kg, SpO2 input as percentage, all fields optional
  5. Vitals display in VisitCard collapsed state (compact inline badges) and in NewVisitPage inline visit history preview
  6. Vitals persist via DB migration (v6) and survive save/reload cycle
  7. Vitals do NOT appear on printed slips
**Plans:** 2/2 plans complete
Plans:
- [x] 17-01-PLAN.md -- Data model (Visit interface + DB v6), VitalsInput component, wire into NewVisitPage and EditVisitPage
- [x] 17-02-PLAN.md -- Vitals display in VisitCard badges and inline visit history, verify no print impact

### Phase 18: Unified Medication Management
**Goal**: Doctor can manage all medications (predefined and custom) from a dedicated top-level page with full CRUD, search, filtering, and an override model that tracks edits to predefined drugs with reset capability
**Depends on:** Phase 17
**Requirements**: MED-01, MED-02, MED-03, MED-04, MED-05, MED-06, MED-07, MED-08
**Success Criteria** (what must be TRUE):
  1. Top-level Medications page accessible from sidebar shows all drugs in a searchable, filterable table
  2. All drugs (predefined and custom) are fully editable and deletable
  3. Editing a predefined drug sets isOverridden flag; "Reset to default" reverts to seed values
  4. Seeding runs only on first-ever app use (empty drugs table), never re-seeds
  5. Settings medications tab is removed; DrugManagement component replaced by MedicationsPage
**Plans:** 2/2 plans complete

Plans:
- [x] 18-01-PLAN.md -- Data layer: Drug interface update, CRUD functions, seed-once logic
- [x] 18-02-PLAN.md -- Medications page UI, navigation, routing, settings cleanup

### Phase 19: PouchDB Migration
**Goal**: App runs identically to v1.6 but on PouchDB instead of Dexie -- all existing clinic data survives the upgrade, the migration runs exactly once, and drug seeds are idempotent across machines
**Depends on**: Phase 18
**Requirements**: MIGR-01, MIGR-02, MIGR-03
**Success Criteria** (what must be TRUE):
  1. After upgrading, all existing patients, visits, prescriptions, medications, and settings are accessible without any manual data entry
  2. Drug seeds use content-addressable IDs so the same drug is never created twice across machines
  3. Opening the app a second time after migration completes does not re-run the migration or modify any data
  4. App functionality is indistinguishable from v1.6 to the user (no workflow changes)
**Plans:** 3/3 plans complete
Plans:
- [ ] 19-01-PLAN.md -- PouchDB foundation, legacy adapter, one-time migration with tests
- [ ] 19-02-PLAN.md -- Rewrite all DB modules (patients, visits, drugs, settings, seeds) for PouchDB
- [ ] 19-03-PLAN.md -- App integration: boot sequence, consumer updates, backup/snapshot adaptation

### Phase 20: CouchDB Infrastructure
**Goal**: CouchDB 3.5.1 runs as a secured Windows service on the doctor's machine, is accessible from the nurse's machine over LAN, and has two pre-created user accounts with role-based write restrictions enforced at the database level
**Depends on**: Phase 19
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04
**Success Criteria** (what must be TRUE):
  1. CouchDB starts automatically when the doctor's Windows machine boots, without manual intervention
  2. From the nurse's machine, a browser can reach the CouchDB endpoint at the doctor's LAN IP on port 5984
  3. CouchDB rejects unauthenticated requests and requires valid credentials before allowing any data access
  4. A nurse-authenticated request to write a prescription document is rejected by CouchDB, even if attempted directly (not through the app UI)
**Plans:** 2/2 plans complete
Plans:
- [ ] 20-01-PLAN.md -- CouchDB setup scripts, configuration, validate_doc_update, verification
- [ ] 20-02-PLAN.md -- Manual verification on doctor's Windows machine (checkpoint)

### Phase 21: Auth and Role Enforcement
**Goal**: Doctor and nurse each log in with their own username and password via CouchDB session auth; the app enforces role-based access so nurse can only reach patient and vitals pages
**Depends on**: Phase 20
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06
**Success Criteria** (what must be TRUE):
  1. Login screen has both username and password fields; entering wrong credentials shows an error
  2. Logging in as doctor provides full access to all pages (prescriptions, medications, print, settings, backup)
  3. Logging in as nurse restricts navigation to patient search, patient creation, and vitals recording only
  4. Nurse attempting to navigate to a doctor-only route is redirected to an accessible page
  5. App header shows the logged-in user's role label ("Doctor" or "Nurse")
**Plans:** 3/3 plans complete
Plans:
- [ ] 21-01-PLAN.md -- CouchDB auth foundation: useCouchAuth hook, LoginPage rewrite, tests
- [ ] 21-02-PLAN.md -- Role enforcement UI: ProtectedRoute, sidebar filtering, visit form restrictions
- [ ] 21-03-PLAN.md -- Password management, install script defaults, old auth cleanup

### Phase 22: Live Sync
**Goal**: Data created or edited on one machine appears on the other within seconds; both machines keep working if the network drops and sync resumes automatically when connectivity returns
**Depends on**: Phase 21
**Requirements**: SYNC-01, SYNC-02, SYNC-03, SYNC-04
**Success Criteria** (what must be TRUE):
  1. A patient created on the nurse's machine appears on the doctor's machine within seconds without either user taking action
  2. Both machines continue to accept reads and writes normally when the clinic WiFi goes down
  3. After WiFi is restored, changes made offline on either machine sync automatically without user intervention
  4. Settings page shows current sync state (syncing / synced / disconnected) and is accurate when the network is toggled
  5. If the doctor's machine is off, nurse keeps working; her data appears on the doctor's machine once it comes back online
**Plans:** 3/3 plans complete
Plans:
- [ ] 22-01-PLAN.md -- Sync engine: useSyncManager, SyncContext/Provider, Workbox exclusion, App.tsx wiring
- [ ] 22-02-PLAN.md -- Sync UI: SyncIndicator in sidebar, Settings Sync tab with status/retry
- [ ] 22-03-PLAN.md -- Changes feed: auto-refresh useRecentPatients, usePatientSearch, useDrugSearch

### Phase 22.1: Solo Mode
**Goal**: A non-technical doctor can open the app on a freshly set-up machine and use it immediately, with no CouchDB install, no first-run wizard, and no setup decisions; the existing networked (doctor + nurse) mode continues to work as an explicit opt-in upgrade from Settings
**Depends on**: Phase 22
**Requirements**: 9 SPEC requirements (SPEC-22.1-1 through SPEC-22.1-9) — see `.planning/phases/22.1-solo-mode/22.1-SPEC.md` for full text and 13 acceptance criteria
**Success Criteria** (locked in SPEC.md; summary):
  1. Fresh install boots into the working UI; CouchDB is not required
  2. Solo login validates against PBKDF2-hashed local credentials (defaults `doctor`/`doctor123`); zero outbound CouchDB requests
  3. SyncProvider does not mount in solo; replication never starts
  4. SyncIndicator, role chips, ResetNursePassword, and CouchDB URL form are absent from solo DOM
  5. All routes accessible in solo (ProtectedRoute bypassed); Settings shows a disabled "Add a second computer" upgrade scaffold
  6. Solo password change updates the local hash with no CouchDB calls
  7. Backup export schema (SCHEMA_VERSION=2) is byte-equivalent to networked export
  8. Networked path preserved: `localStorage.deploymentMode='networked'` boots the Phase 22 flow unchanged; legacy installs (couchUrl present, no deploymentMode) infer networked
**Plans:** 3/7 plans executed
Plans:
- [x] 22.1-01-PLAN.md -- Settings layer: deploymentMode + soloCredentials accessors with legacy-install inference
- [x] 22.1-02-PLAN.md -- PBKDF2 passwordHash utility (Web Crypto, zero deps) + jsdom polyfill
- [x] 22.1-03-PLAN.md -- useSoloAuth hook (mirrors useCouchAuth shape; zero-fetch contract)
- [ ] 22.1-04-PLAN.md -- Provider tree split (App.tsx / AuthProvider) + SyncContext gating + ProtectedRoute solo bypass
- [ ] 22.1-05-PLAN.md -- LoginPage + Sidebar + Header solo-mode UI gating
- [ ] 22.1-06-PLAN.md -- SettingsPage Networking tab (disabled), ResetNursePassword gating, "Add a second computer" card
- [ ] 22.1-07-PLAN.md -- fetchSpy helper, end-to-end solo workflow test, networked test describe.skip sweep

### Phase 23: Backup Redesign
**Goal**: Manual export still produces a downloadable backup file; restore pushes data to the shared CouchDB so both machines reflect the restored state via sync; auto-snapshots continue working
**Depends on**: Phase 22
**Requirements**: BKUP-01, BKUP-02, BKUP-03
**Success Criteria** (what must be TRUE):
  1. Doctor can export a backup file from Settings; the file contains all clinic data in a downloadable format
  2. After a restore, both the doctor's and nurse's machines show the restored data without manual steps on the nurse's machine
  3. Auto-snapshots continue to trigger and rotate (24h interval, 3-copy rotation) after the PouchDB migration
**Plans:** TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation and Patient Management | v1.0 | 7/7 | Complete | 2026-03-06 |
| 2. Clinical Workflow | v1.0 | 4/4 | Complete | 2026-03-06 |
| 3. Printing and Visit Completion | v1.0 | 3/3 | Complete | 2026-03-06 |
| 4. Urdu Foundation | v1.1 | 2/2 | Complete | 2026-03-06 |
| 5. Prescription Print Urdu | v1.1 | 2/2 | Complete | 2026-03-06 |
| 5.1 Prescription Entry Cleanup | v1.1 | 2/2 | Complete | 2026-03-06 |
| 6. Rx Notes Urdu Toggle | v1.1 | 2/2 | Complete | 2026-03-07 |
| 7. Backup Export | v1.1 | 2/2 | Complete | 2026-03-10 |
| 8. Backup Restore | v1.1 | 2/2 | Complete | 2026-03-11 |
| 9. Auto-Snapshots | v1.1 | 2/2 | Complete | 2026-03-11 |
| 10. Print Infrastructure & Settings | v1.2 | 2/2 | Complete | 2026-03-11 |
| 11. Layout Scaling & Preview | v1.2 | 2/2 | Complete | 2026-03-12 |
| 12. Focus Foundation and Form Submission | v1.3 | 2/2 | Complete | 2026-03-14 |
| 13. Keyboard Interactions | v1.3 | 3/3 | Complete | 2026-03-14 |
| 14. Print Flow | v1.3 | 1/1 | Complete | 2026-03-14 |
| 15. Slip Assignment | v1.4 | 2/2 | Complete | 2026-03-19 |
| 16. Auto-Print Toggle | v1.4 | 1/1 | Complete | 2026-03-19 |
| 17. Visit Vitals | v1.5 | 2/2 | Complete | 2026-03-19 |
| 18. Unified Medication Management | v1.6 | 2/2 | Complete | 2026-03-19 |
| 19. PouchDB Migration | v2.0 | 3/3 | Complete | 2026-03-19 |
| 20. CouchDB Infrastructure | v2.0 | 2/2 | Complete | 2026-03-19 |
| 21. Auth and Role Enforcement | v2.0 | 3/3 | Complete | 2026-03-19 |
| 22. Live Sync | 3/3 | Complete    | 2026-03-20 | - |
| 22.1 Solo Mode | v2.0 | 3/7 | In Progress|  |
| 23. Backup Redesign | v2.0 | 0/TBD | Not started | - |

---
*Last updated: 2026-04-30 -- Phase 22.1 plans created (7 plans, 5 waves)*
