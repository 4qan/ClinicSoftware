# Roadmap: ClinicSoftware

## Milestones

- v1.0 MVP -- 3 phases (shipped 2026-03-06)
- v1.1 Urdu & Backup -- 6 phases (phases 4-9)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-3) -- SHIPPED 2026-03-06</summary>

- [x] Phase 1: Foundation and Patient Management (7/7 plans) -- completed 2026-03-06
- [x] Phase 2: Clinical Workflow (4/4 plans) -- completed 2026-03-06
- [x] Phase 3: Printing and Visit Completion (3/3 plans) -- completed 2026-03-06

</details>

### v1.1 Urdu & Backup (Phases 4-9)

#### Phase 4: Urdu Foundation (Font + Translations)

**Requirements:** URDU-01, URDU-03
**Depends on:** Nothing
**Track:** Urdu

Install and configure the Nastaliq font for offline use. Build the English-to-Urdu translation map for dosage, frequency, and duration values.

**Scope:**
- Install `@fontsource-variable/noto-nastaliq-urdu`, import in app entry point
- Add `.urdu-cell` print CSS: Nastaliq font family, `font-display: swap`, `line-height: 2.0-2.4`, `overflow: visible`, minimum vertical padding
- Verify service worker precaches the woff2 font file
- Create `src/constants/translations.ts` with `Record<string, string>` maps (~50 entries)
- Export `toUrdu(value: string): string` helper (falls through to English for unknown values)

**Success criteria:**
1. Font file loads and renders Urdu text correctly in a test print (no clipped diacritics)
2. `toUrdu()` returns correct Urdu for all predefined clinical values in `clinical.ts`
3. `toUrdu()` returns the original English string for unknown/custom values
4. Font is available offline after first load (SW cache verification)

---

#### Phase 5: Prescription Print Urdu

**Requirements:** URDU-02, URDU-04, URDU-05
**Depends on:** Phase 4
**Track:** Urdu

Modify `PrescriptionSlip.tsx` and `DispensarySlip.tsx` to render dosage, frequency, and duration in Urdu with correct RTL handling.

**Scope:**
- Apply `toUrdu()` to dosage, frequency, and duration values in both print components
- Add per-cell `dir="rtl"` and `unicode-bidi: isolate` on Urdu content cells
- Replace `text-left`/`text-right` with logical properties in print styles
- Render column headers in Urdu (e.g., دوا, خوراک, دورانیہ)
- Ensure English drug names (LTR) coexist with Urdu dosage (RTL) without layout breakage

**Success criteria:**
1. Printed prescription shows dosage, frequency, and duration in Urdu Nastaliq script
2. Column headers display in Urdu on both prescription and dispensary slips
3. English drug names remain left-aligned while Urdu text renders right-to-left, no visual overlap
4. Actual Ctrl+P print output matches screen preview (tested on Chrome/Edge)

---

#### Phase 6: Rx Notes Urdu Toggle

**Requirements:** URDU-06, URDU-07
**Depends on:** Phase 4
**Track:** Urdu

Add an English/Urdu toggle to the Rx Notes field, persist the language choice, and render notes in the correct direction/font on print.

**Scope:**
- Dexie schema v3 migration: add `rxNotesLang: 'en' | 'ur'` field to Visit table (default `'en'`)
- Build or modify Rx Notes textarea with language toggle button
- Toggle switches `dir`, font-family, and `text-align` on the textarea
- Wire `rxNotesLang` into NewVisitPage and EditVisitPage form state
- Print components read `rxNotesLang` and apply correct direction + Nastaliq font for Urdu notes

**Success criteria:**
1. Rx Notes textarea switches between LTR English and RTL Urdu input when toggled
2. Language preference is saved with the visit record and persists on page reload
3. Rx Notes print in Urdu with Nastaliq font when written in Urdu mode
4. Rx Notes print in English with default font when written in English mode

---

#### Phase 7: Backup Export

**Requirements:** BKUP-01, BKUP-03
**Depends on:** Phase 6 (schema v3 must settle first)
**Track:** Backup

Build the database export functionality in Settings.

**Scope:**
- Install `dexie-export-import`
- Create `src/utils/backup.ts` with `exportDatabase()` function
- Include metadata: export date, app version, schema version, record counts per table
- Download via `URL.createObjectURL` + anchor click
- Add "Export Backup" button to Settings page
- File naming: `ClinicSoftware-backup-YYYY-MM-DD.json`

**Success criteria:**
1. Clicking "Export Backup" in Settings downloads a backup file to the user's machine
2. Backup file contains all database tables with complete data
3. Backup file includes metadata (export date, app version, schema version, record counts)

---

#### Phase 8: Backup Restore

**Requirements:** BKUP-02, BKUP-04, BKUP-05
**Depends on:** Phase 7
**Track:** Backup

Build the database restore functionality with validation and safety measures.

**Scope:**
- Create `restoreDatabase()` in `backup.ts` using `dexie-export-import`
- File picker UI in Settings for selecting backup file
- Validation: parse file, check format, extract metadata, verify schema version compatibility
- Pre-restore confirmation dialog with backup date, record counts, schema version, overwrite warning
- Auto-safety-backup: silently export current DB before restore
- Schema version handling: reject newer schema with "update app" message, handle older via migration
- All-or-nothing restore inside Dexie transaction

**Success criteria:**
1. User can select a backup file and restore the full database from Settings
2. Metadata preview (date, record counts, version) is shown before restore proceeds
3. Invalid or incompatible files are rejected with a clear error message
4. A safety backup of the current database is automatically downloaded before restore executes
5. After restore, all data matches the backup file contents

---

#### Phase 9: Auto-Snapshots

**Requirements:** BKUP-06, BKUP-07
**Depends on:** Phase 7
**Track:** Backup

Implement silent in-app backup snapshots that run automatically and rotate old copies.

**Scope:**
- Store snapshots in a dedicated IndexedDB table (or separate Dexie database)
- Trigger snapshot every 24 hours (check on app load, compare last snapshot timestamp)
- Silent operation: no user interaction, no download, no blocking UI
- Auto-rotate: keep only the last 3 snapshots, delete oldest when creating new one
- Same export format as manual backup (phase 7)

**Success criteria:**
1. App silently creates a backup snapshot within 24 hours of the last one (on app load)
2. No more than 3 snapshots exist at any time (oldest deleted when new one created)
3. Snapshot creation does not block or slow down the UI
4. Snapshots use the same format as manual export and can be used for restore

---

## Dependency Graph (v1.1)

```
Phase 4 (Font + Translations)
  |--- Phase 5 (Prescription Print Urdu)
  |--- Phase 6 (Rx Notes Toggle)
            |--- Phase 7 (Backup Export)
                    |--- Phase 8 (Backup Restore)
                    |--- Phase 9 (Auto-Snapshots)
```

Phases 5 and 6 can run in parallel. Phases 8 and 9 can run in parallel.

## Requirement Coverage (v1.1)

| Requirement | Phase | Description |
|-------------|-------|-------------|
| URDU-01 | 4 | Translation map |
| URDU-02 | 5 | Prescription Urdu print |
| URDU-03 | 4 | Nastaliq font setup |
| URDU-04 | 5 | RTL print layout |
| URDU-05 | 5 | Urdu column headers |
| URDU-06 | 6 | Rx Notes toggle |
| URDU-07 | 6 | Rx Notes print |
| BKUP-01 | 7 | Database export |
| BKUP-02 | 8 | Database restore |
| BKUP-03 | 7 | Backup metadata |
| BKUP-04 | 8 | Restore validation |
| BKUP-05 | 8 | Auto-safety-backup |
| BKUP-06 | 9 | Auto-snapshots |
| BKUP-07 | 9 | Snapshot rotation |

**14/14 requirements mapped.**

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|---------------|--------|-----------|
| 1. Foundation and Patient Management | v1.0 | 7/7 | Complete | 2026-03-06 |
| 2. Clinical Workflow | v1.0 | 4/4 | Complete | 2026-03-06 |
| 3. Printing and Visit Completion | v1.0 | 3/3 | Complete | 2026-03-06 |
| 4. Urdu Foundation | v1.1 | 2/2 | Complete | 2026-03-06 |
| 5. Prescription Print Urdu | v1.1 | 2/2 | Complete | 2026-03-06 |
| 6. Rx Notes Urdu Toggle | v1.1 | 0/? | Not Started | -- |
| 7. Backup Export | v1.1 | 0/? | Not Started | -- |
| 8. Backup Restore | v1.1 | 0/? | Not Started | -- |
| 9. Auto-Snapshots | v1.1 | 0/? | Not Started | -- |

---
*Last updated: 2026-03-06 after Phase 5 completion*
