# ClinicSoftware

## What This Is

A lightweight prescription and patient management PWA for a small clinic. Works fully offline with IndexedDB, supports patient registration with auto-generated IDs, clinical encounter logging with vitals, prescription writing with medication autocomplete from a 120+ drug database, and configurable paper size printing (A5/A4/Letter) with proportional layout scaling and Urdu dosage instructions. Includes a dedicated medications management page, full database backup/restore, and automatic in-app snapshots. Full keyboard-only workflow from login through printing. Designed for non-tech-savvy clinic staff on older Windows hardware.

## Core Value

The doctor can see a patient, write a prescription with medication autocomplete, and print it in under 2 minutes, even with no internet.

## Requirements

### Validated

- FOUND-01 through FOUND-05: PWA, offline, service worker, auth, timestamps -- v1.0
- PAT-01 through PAT-04: Patient registration, auto-ID, search, profile -- v1.0
- ENC-01 through ENC-03: Encounter logging, timestamps, history -- v1.0
- RX-01 through RX-04: Prescriptions, medications, autocomplete, performance -- v1.0
- DRUG-01 through DRUG-04: Pre-seeded database, custom drugs, autocomplete integration -- v1.0
- PRINT-01 through PRINT-04: Prescription slip, dispensary slip, print layout, buttons -- v1.0
- VISIT-01 through VISIT-03: Inline patient creation, always-visible form, create-from-search -- v1.0
- URDU-01 through URDU-07: Urdu translations, Nastaliq font, RTL print, bilingual headers, Rx Notes toggle -- v1.1
- RX-CLEANUP-01 through RX-CLEANUP-04: Drug display split, amber indicators, dosage-to-quantity rename -- v1.1
- BKUP-01 through BKUP-04: Database export/import, metadata, restore validation -- v1.1
- BKUP-06, BKUP-07: Auto-snapshots with 24h trigger and 3-copy rotation -- v1.1
- PRSET-01 through PRSET-04: Print Management settings, independent paper sizes, A5 defaults -- v1.2
- PRENG-01 through PRENG-03: Dynamic @page injection, proportional margins, conditional rendering -- v1.2
- SCALE-01 through SCALE-04: Proportional slip scaling, Urdu rendering, on-screen preview -- v1.2
- FOCUS-01 through FOCUS-03: Visible focus indicators, focus-visible keyboard-only, logical tab order -- v1.3
- FORM-01 through FORM-04: Enter-to-submit on login, patient creation, medication add; visit form intentionally skipped (textarea) -- v1.3
- AUTO-01 through AUTO-05: Autocomplete keyboard navigation, Enter/Escape/Tab/Arrow, drug search consolidation -- v1.3
- FMGT-01 through FMGT-03: Focus transitions after drug select, medication add, inline patient create -- v1.3
- ESC-01 through ESC-03: Escape closes dropdowns, inline forms; ESC-03 no-op (no modals exist) -- v1.3
- PRNT-01 through PRNT-03: Tab to print button, Enter to print, focus restore after dialog -- v1.3
- SLIP-01 through SLIP-05: Per-medication slip assignment (dispensary/prescription), stored with snapshot -- v1.4
- PRSET-05, PRSET-06: Auto-print toggle in Print Management, persists across sessions -- v1.4
- VIT-01 through VIT-06: Optional vitals per visit (temp, BP, weight, SpO2), collapsible UI, VisitCard badges, DB v6 -- v1.5
- MED-01 through MED-08: Top-level medications page, full CRUD, override model for predefined drugs, seed-once logic -- v1.5

### Active

#### Current Milestone: v2.0 Multi-User Sync

**Goal:** Nurse and doctor work on separate computers in the same clinic. Nurse creates patients and records vitals. Doctor sees everything and writes prescriptions. Data syncs over LAN via CouchDB/PouchDB, no internet required.

**Target features:**
- Two user roles (Doctor: full access, Nurse: patient creation + vitals)
- CouchDB on doctor's machine as shared database
- Dexie.js replaced with PouchDB (bidirectional LAN sync)
- Role-based route and feature gating
- Backup system adapted for sync-aware restore

### Out of Scope

- Multi-clinic sync -- single clinic only, LAN sync sufficient
- Cloud-hosted database -- LAN CouchDB chosen over cloud for internet independence
- Mobile-native app -- PWA covers mobile access
- Billing / payments -- not needed
- Appointment scheduling -- walk-in clinic
- Lab results / imaging -- not needed
- Drug interaction warnings -- complexity not justified
- Full Urdu UI (menus, buttons, navigation) -- doctor works in English UI, Urdu need is print-only
- BKUP-05 auto-safety-backup before restore -- dropped v1.1, snapshots provide sufficient safety net
- Orientation toggle (landscape) -- prescriptions are always portrait
- Manual margin editor -- auto-calculated margins are safer for non-tech user
- WYSIWYG layout editor -- massive complexity, no value for single-user clinic

## Context

Shipped through v1.5 with TypeScript/React. Phase 19 (PouchDB migration) complete: all DB operations now use PouchDB. Phase 21 (Auth and Role Enforcement) complete: CouchDB-backed login replaces PBKDF2, role-based UI guards enforce doctor/nurse access. Phase 22 (Live Sync) complete: bidirectional PouchDB replication with SyncContext, sidebar sync indicator, Settings Sync tab, and live data refresh via changes feed.
Tech stack: React 19, TypeScript, Vite, TailwindCSS v4, PouchDB 9.0.0 (migrated from Dexie.js), VitePWA, react-router-dom v7.
Deployed to GitHub Pages at https://4qan.github.io/ClinicSoftware/.
Dexie schema progression: v1 (foundation) -> v2 (drugs/visits) -> v3 (dosage->quantity rename) -> v4 (rxNotesLang) -> v5 (slipType) -> v6 (vitals).
Separate Dexie instance for snapshots (ClinicSoftwareSnapshots).
Print settings stored in Dexie settings table (prescriptionPaperSize, dispensaryPaperSize keys).
Keyboard navigation: useAutocompleteKeyboard shared hook, pendingFocus pattern for post-action focus management.
Top-level Medications page with override model for predefined drugs and seed-once logic.

Clinic is in an area with unreliable internet. Doctor uses an old Windows system with Chrome/Edge. A nurse screens patients in a separate room before the doctor sees them. Health compliance team requires full patient records with unique IDs. Paper sizes now configurable (A5/A4/Letter), two prints per visit (prescription for patient, dispensary for dispenser). Both computers are on the same local WiFi network.

## Constraints

- **Tech**: PWA with offline-first architecture (Service Worker + IndexedDB)
- **UX**: Minimal clicks, large text, obvious navigation. Doctor must not need training.
- **Hardware**: Must work on older Windows machines with Chrome/Edge
- **Data**: Patient data in IndexedDB (PouchDB), synced to CouchDB on LAN
- **Print**: Configurable paper sizes (A5/A4/Letter) with proportional scaling, compact dispensary slips
- **Fonts**: Noto Nastaliq Urdu self-hosted and SW-cached for offline Urdu printing

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PWA over native Windows app | Browser-based, no install, works on any device, offline via Service Worker | Good |
| Offline-first with IndexedDB (no cloud sync in v1) | Unreliable internet, cloud sync deferred to v2 | Good |
| CouchDB auth with roles | Replaced PBKDF2 local auth; CouchDB /_session provides login + role extraction | Good (Phase 21) |
| Local drug database + custom entries | Pre-loaded 120+ drugs, custom entries in settings | Good |
| Patient ID format: YYYY-XXXX | Compliance team recommendation, atomic counter | Good |
| Dexie.js for IndexedDB | Clean API, indexed queries, transaction support | Good |
| PBKDF2 removed in Phase 21 | Replaced by CouchDB auth; no longer needed | Superseded |
| Medications as snapshots (not live references) | Decouples prescriptions from drug edits | Good |
| RX-05 deferred to v2 | Single-user clinic doesn't need immutability yet | Good |
| A5 print via @media print + @page | Browser-native, no print library dependency | Good |
| Inline patient creation in visit form | Avoids breaking workflow with page navigation | Good |
| Form-aware quantity system | Form inferred from drug, quantity stores raw value, Urdu verbs vary by form | Good |
| Natural Urdu sentence patterns | Form-specific verbs instead of literal translations, more natural for patients | Good |
| Separate Dexie DB for snapshots | Snapshot data survives main DB restore, no schema conflicts | Good |
| BKUP-05 dropped | Auto-snapshots provide sufficient safety net before restore | Good |
| Smart re-login on restore | Compare auth hash pre/post restore, force logout if credentials changed | Good |
| Toast notifications via createPortal | App-wide, no prop drilling, success auto-dismiss, error manual close | Good |
| calcScale from A5 baseline | A5 is default/common size, all scaling is proportional width ratio | Good |
| CSS named page size keywords | Chrome print dialog respects named keywords better than raw mm dimensions | Good |
| Auto-save print settings | No submit button, saves on dropdown change for minimal friction | Good |
| A6 removed post-Phase 10 | Too narrow for medication table, coerceSize() handles legacy DB values | Good |
| Preview frame always mounted (no-print) | Eliminates brief frameless flash between screen and print modes | Good |
| useRef auto-print guard | Prevents double-fire from React StrictMode remount | Good |
| Global CSS @layer base for focus-visible | Single point of change, scalable across all components | Good |
| useAutocompleteKeyboard shared hook | Single keyboard contract for all 4 autocomplete consumers, DRY | Good |
| pendingFocus flag pattern | Reliable focus transitions after async state changes (React render cycle) | Good |
| tabIndex={-1} on nav chrome | Removes sidebar/header/breadcrumbs from tab flow without hiding visually | Good |
| No form wrapper on visit page | Textarea needs Enter for newlines; FORM-03 intentionally skipped | Good |
| document-level Escape listener | Handles Escape when focus is on unmounted button (inline patient form) | Good |
| LAN CouchDB over cloud | Unreliable internet makes cloud sync unreliable; LAN sync works without internet; nurse-to-doctor handoff must be real-time | — Pending |
| PouchDB over keeping Dexie | PouchDB uses IndexedDB under the hood, has native CouchDB sync protocol, schemaless (simpler migrations) | Good (Phase 19) |
| Pre-created user accounts | Doctor and nurse accounts created during development, no setup wizard needed | — Pending |

---
*Last updated: 2026-03-20 after Phase 22 (Live Sync) complete*
