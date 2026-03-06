---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Urdu & Backup
status: completed
last_updated: "2026-03-06T19:11:05.101Z"
last_activity: "2026-03-06 -- Completed 05.1-01: dosage-to-quantity rename"
progress:
  total_phases: 7
  completed_phases: 2
  total_plans: 6
  completed_plans: 5
---

# Project State: ClinicSoftware

## Project Reference
See: .planning/PROJECT.md (updated 2026-03-06)
**Core value:** The doctor can see a patient, write a prescription with medication autocomplete, and print it in under 2 minutes, even with no internet.
**Current focus:** v1.1 Urdu & Backup

## Current Position

Phase: 5.1 (Prescription Entry Cleanup)
Plan: 1/1 complete
Status: Phase 5.1 Plan 01 complete
Last activity: 2026-03-06 -- Completed 05.1-01: dosage-to-quantity rename

## Progress
| Phase | Name | Status | Plans |
| 4 | Urdu Foundation (Font + Translations) | Complete | 2/2 |
| 5 | Prescription Print Urdu | Complete | 2/2 |
| 5.1 | Prescription Entry Cleanup (INSERTED) | In Progress | 1/? |
| 6 | Rx Notes Urdu Toggle | Not Started | -- |
| 7 | Backup Export | Not Started | -- |
| 8 | Backup Restore | Not Started | -- |
| 9 | Auto-Snapshots | Not Started | -- |
|-------|------|--------|-------|

## Decisions
See: .planning/PROJECT.md Key Decisions table
- Phase 5: Used .map() over column array for DRY bilingual header rendering; Urdu header font 9pt (prescription) / 8pt (dispensary)
- Phase 5-02: Form-aware quantity system (form inferred from drug, dosage stores raw quantity). Natural Urdu sentence patterns with form-specific verbs (لیں/لگائیں/ڈالیں/لگوائیں). Duration uses "تک" not "کے لیے". Removed null fallback: always renders Urdu.
- [Phase 05.1]: Dexie v3 stores identical to v2; only upgrade callback renames dosage->quantity property on existing records

## Accumulated Context
- v1.0 shipped with 27/27 requirements, 3 phases, 14 plans
- `src/constants/clinical.ts`: QUANTITY_OPTIONS (by form category), FORM_TO_CATEGORY map, FREQUENCY_OPTIONS, DURATION_OPTIONS, MEDICATION_FORMS
- Field renamed: `dosage` -> `quantity` across all interfaces (VisitMedication, MedicationFormData, MedicationForInstruction). Dexie v3 migration renames on existing records.
- Quantity stores raw value (e.g., "1", "5 ml", "Thin layer"); form comes from drug record. buildDosageUrdu/English construct display from form + quantity.
- Print slips: PrescriptionSlip.tsx (patient-facing) and DispensarySlip.tsx (pharmacist-facing), 5-column layout
- buildUrduInstruction() constructs natural Urdu sentences with form-specific verbs, never returns null
- MedicationEntry: form picker shown only for custom drugs, quantity options filter by form category
- Translation tests in `src/constants/__tests__/translations.test.ts` (26 tests) and `src/constants/translations.test.ts` (15 tests)
- Rx Notes field exists as freeform textarea in NewVisitPage/EditVisitPage
- IndexedDB is origin-scoped and device-local (no cross-device data sharing)

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
*Last updated: 2026-03-06 - Phase 5.1 Plan 01: dosage-to-quantity rename*
