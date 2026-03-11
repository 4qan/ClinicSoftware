---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Urdu & Backup
status: complete
last_updated: "2026-03-11T07:20:00Z"
last_activity: "2026-03-11 -- Completed 09-02: Snapshot UI integration (v1.1 milestone complete)"
progress:
  total_phases: 7
  completed_phases: 7
  total_plans: 14
  completed_plans: 14
---

# Project State: ClinicSoftware

## Project Reference
See: .planning/PROJECT.md (updated 2026-03-06)
**Core value:** The doctor can see a patient, write a prescription with medication autocomplete, and print it in under 2 minutes, even with no internet.
**Current focus:** v1.1 Urdu & Backup

## Current Position

Phase: 9 (Auto-Snapshots)
Plan: 2/2 complete
Status: Complete
Last activity: 2026-03-11 -- Completed 09-02: Snapshot UI integration (v1.1 milestone complete)

## Progress
| Phase | Name | Status | Plans |
| 4 | Urdu Foundation (Font + Translations) | Complete | 2/2 |
| 5 | Prescription Print Urdu | Complete | 2/2 |
| 5.1 | Prescription Entry Cleanup (INSERTED) | Complete | 2/2 |
| 6 | Rx Notes Urdu Toggle | Complete | 2/2 |
| 7 | Backup Export | Complete | 2/2 |
| 8 | Backup Restore | Complete | 2/2 |
| 9 | Auto-Snapshots | Complete | 2/2 |
|-------|------|--------|-------|

## Decisions
See: .planning/PROJECT.md Key Decisions table
- Phase 5: Used .map() over column array for DRY bilingual header rendering; Urdu header font 9pt (prescription) / 8pt (dispensary)
- Phase 5-02: Form-aware quantity system (form inferred from drug, dosage stores raw quantity). Natural Urdu sentence patterns with form-specific verbs (لیں/لگائیں/ڈالیں/لگوائیں). Duration uses "تک" not "کے لیے". Removed null fallback: always renders Urdu.
- [Phase 05.1]: Dexie v3 stores identical to v2; only upgrade callback renames dosage->quantity property on existing records
- [Phase 05.1-02]: Drug formatters extracted to utility. Amber indicator on Frequency/Duration only (not Qty). Border-only indicator, no hint text (avoids layout shift).
- [Phase 06-01]: Segmented En/Urdu toggle on Rx Notes. Dexie v4 migration adds rxNotesLang. Sticky preference via settings table. Text preserved on toggle.
- [Phase 06-02]: Conditional Nastaliq/RTL print styling for Urdu rx notes on PrescriptionSlip. Hover tooltip on language toggle for keyboard shortcut hint (user-requested instead of dismissable hint).
- [Phase 07-01]: Toast notifications via createPortal (success/info auto-dismiss 5s, error manual close). __APP_VERSION__ via Vite define. exportDatabase iterates db.tables, downloadBackup triggers anchor click download.
- [Phase 07-02]: DataSettings component in Settings Data tab (4th tab). Export button triggers exportDatabase + downloadBackup with progress bar. Last backup timestamp persisted via db.settings key-value store.
- [Phase 08]: [Phase 08-01]: ValidationResult discriminated union (invalid_format/newer_schema). restoreDatabase uses Dexie transaction: clear all tables then bulkPut from backup. downloadBackup filename includes HH-MM (local time).
- [Phase 08-02]: Restore UI in DataSettings: file picker with hidden input, inline confirmation (amber box) with backup date, red destructive Restore button. Smart re-login compares auth hash pre/post restore, clears localStorage session if changed. File input resets after every operation.
- [Phase 09-01]: Separate Dexie instance 'ClinicSoftwareSnapshots' for snapshot isolation. checkAndCreateSnapshot: 24h timer, hard cap 5, silent error. rotateSnapshots keeps 3, deletes oldest by createdAt. formatTimeAgo uses Intl.RelativeTimeFormat with numeric:'auto'.
- [Phase 09-02]: Auto-snapshot fire-and-forget in App.tsx useEffect (parallel with seedDrugDatabase). DataSettings shows "Auto-backup: X ago" status, lists up to 3 snapshots in unified restore section, snapshot restore uses same amber confirmation + smart re-login as file restore. Manual export resets auto-snapshot timer.

## Accumulated Context
- v1.0 shipped with 27/27 requirements, 3 phases, 14 plans
- `src/constants/clinical.ts`: QUANTITY_OPTIONS (by form category), FORM_TO_CATEGORY map, FREQUENCY_OPTIONS, DURATION_OPTIONS, MEDICATION_FORMS
- Field renamed: `dosage` -> `quantity` across all interfaces (VisitMedication, MedicationFormData, MedicationForInstruction). Dexie v3 migration renames on existing records.
- Quantity stores raw value (e.g., "1", "5 ml", "Thin layer"); form comes from drug record. buildDosageUrdu/English construct display from form + quantity.
- Print slips: PrescriptionSlip.tsx (patient-facing) and DispensarySlip.tsx (pharmacist-facing), 5-column layout
- buildUrduInstruction() constructs natural Urdu sentences with form-specific verbs, never returns null
- MedicationEntry: form picker shown only for custom drugs, quantity options filter by form category. Drug input shows brand name only after selection; dropdown shows full detail.
- ComboBox: `showCustomIndicator` prop adds amber border for non-standard values (used on Frequency/Duration)
- Drug display formatters in `src/utils/drugFormatters.ts`: formatDrugSearchResult, formatDrugSelected
- Translation tests in `src/constants/__tests__/translations.test.ts` (26 tests) and `src/constants/translations.test.ts` (15 tests)
- Rx Notes field: RxNotesField component with En/Urdu segmented toggle, RTL Nastaliq styling, rxNotesLang persisted per visit
- IndexedDB is origin-scoped and device-local (no cross-device data sharing)
- Toast system: ToastProvider wraps AppContent in App.tsx, useToast() hook for app-wide access
- Backup utility: `src/utils/backup.ts` exports exportDatabase(), downloadBackup(), validateBackupFile(), restoreDatabase(), BackupFile, BackupMetadata, ValidationResult types
- validateBackupFile checks shape, appName, schemaVersion (rejects newer), returns ValidationResult discriminated union
- restoreDatabase uses `db.transaction('rw', db.tables, ...)` for atomic clear + bulkPut restore
- downloadBackup filename format: `ClinicSoftware-backup-YYYY-MM-DD-HH-MM.json` (local time)
- App version 1.1.0, injected as __APP_VERSION__ build-time constant
- DataSettings component: `src/components/DataSettings.tsx` with export button, progress bar, last backup display
- Settings tab extension pattern: add to SettingsCategory union + TABS array + conditional render
- Snapshot utility: `src/utils/snapshots.ts` exports snapshotDb, checkAndCreateSnapshot, createSnapshot, rotateSnapshots, listSnapshots, getSnapshot, formatTimeAgo, resetSnapshotDatabase, Snapshot type
- Snapshot DB is separate Dexie instance ('ClinicSoftwareSnapshots'), survives main DB restore operations
- DataSettings: auto-backup status line + snapshot list in unified restore section (file + snapshot restore share same UI pattern)
- Auto-snapshot fires on app load via checkAndCreateSnapshot() in App.tsx (fire-and-forget, parallel with seedDrugDatabase)

### Roadmap Evolution
- Phase 5.1 inserted after Phase 5: Prescription Entry Cleanup (URGENT)

### Pending Todos
None.

### Quick Tasks Completed

| # | Description | Date | Commit | Status | Directory |
|---|-------------|------|--------|--------|-----------|
| 1 | Set up GitHub remote repo and deploy to GitHub Pages | 2026-03-06 | fa0212f | | [1-set-up-github-remote-repo-and-deploy-to-](./quick/1-set-up-github-remote-repo-and-deploy-to-/) |
| 2 | Fix Print CTA alignment | 2026-03-06 | 8de8291 | | [2-fix-print-cta-alignment](./quick/2-fix-print-cta-alignment/) |
| 3 | Show full drug details after selection | 2026-03-06 | 0870962 | | [3-show-full-drug-details-after-selection-i](./quick/3-show-full-drug-details-after-selection-i/) |
| 4 | Add Save & Print CTA to visit pages | 2026-03-06 | 3aee6f0 | | [4-add-save-and-print-cta-to-new-visit-page](./quick/4-add-save-and-print-cta-to-new-visit-page/) |
| 5 | Research prescription UX patterns and redesign recommendations | 2026-03-06 | 0ac3084 | Verified | [5-research-prescription-ux-patterns-and-re](./quick/5-research-prescription-ux-patterns-and-re/) |

---
*Last updated: 2026-03-11 - Phase 9 Plan 02: Snapshot UI integration (v1.1 Urdu & Backup milestone complete)*
