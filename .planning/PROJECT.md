# ClinicSoftware

## What This Is

A lightweight prescription and patient management PWA for a single-doctor clinic. Works fully offline with IndexedDB, supports patient registration with auto-generated IDs, clinical encounter logging, prescription writing with medication autocomplete from a 120+ drug database, and configurable paper size printing (A5/A4/Letter) with proportional layout scaling and Urdu dosage instructions. Includes full database backup/restore and automatic in-app snapshots. Designed for a non-tech-savvy doctor on older Windows hardware.

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

### Active

(No active requirements. Define next milestone with `/gsd:new-milestone`.)

### Out of Scope

- Multi-doctor / multi-role support -- single user only
- Mobile-native app -- PWA covers mobile access
- Billing / payments -- not needed
- Appointment scheduling -- walk-in clinic
- Lab results / imaging -- not needed
- Drug interaction warnings -- complexity not justified
- Real-time sync / CRDTs -- single user, single device
- Cloud sync (Firebase/Supabase) -- deferred to future milestone, local backup covers data safety for now
- Full Urdu UI (menus, buttons, navigation) -- doctor works in English UI, Urdu need is print-only
- BKUP-05 auto-safety-backup before restore -- dropped v1.1, snapshots provide sufficient safety net
- Orientation toggle (landscape) -- prescriptions are always portrait
- Manual margin editor -- auto-calculated margins are safer for non-tech user
- WYSIWYG layout editor -- massive complexity, no value for single-user clinic

## Context

Shipped v1.2 with 10,666 LOC TypeScript/React.
Tech stack: React 19, TypeScript, Vite, TailwindCSS v4, Dexie.js (schema v4), VitePWA, react-router-dom v7.
Deployed to GitHub Pages at https://4qan.github.io/ClinicSoftware/.
236 commits across 9 days of development (v1.0 + v1.1 + v1.2).
Dexie schema progression: v1 (foundation) -> v2 (drugs/visits) -> v3 (dosage->quantity rename) -> v4 (rxNotesLang).
Separate Dexie instance for snapshots (ClinicSoftwareSnapshots).
Print settings stored in Dexie settings table (prescriptionPaperSize, dispensaryPaperSize keys).

Clinic is in an area with unreliable internet. Doctor uses an old Windows system with Chrome/Edge. Health compliance team requires full patient records with unique IDs. Paper sizes now configurable (A5/A4/Letter), two prints per visit (prescription for patient, dispensary for dispenser).

## Constraints

- **Tech**: PWA with offline-first architecture (Service Worker + IndexedDB)
- **UX**: Minimal clicks, large text, obvious navigation. Doctor must not need training.
- **Hardware**: Must work on older Windows machines with Chrome/Edge
- **Data**: All patient data stored locally in IndexedDB
- **Print**: Configurable paper sizes (A5/A4/Letter) with proportional scaling, compact dispensary slips
- **Fonts**: Noto Nastaliq Urdu self-hosted and SW-cached for offline Urdu printing

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PWA over native Windows app | Browser-based, no install, works on any device, offline via Service Worker | Good |
| Offline-first with IndexedDB (no cloud sync in v1) | Unreliable internet, cloud sync deferred to v2 | Good |
| Single-user auth (no roles) | Only the doctor uses the system | Good |
| Local drug database + custom entries | Pre-loaded 120+ drugs, custom entries in settings | Good |
| Patient ID format: YYYY-XXXX | Compliance team recommendation, atomic counter | Good |
| Dexie.js for IndexedDB | Clean API, indexed queries, transaction support | Good |
| PBKDF2 100k iterations via Web Crypto API | Offline auth, no server dependency | Good |
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

---
*Last updated: 2026-03-12 after v1.2 milestone*
