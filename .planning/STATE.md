---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Urdu & Backup
status: in_progress
last_updated: "2026-03-06T17:36:39Z"
last_activity: 2026-03-06 -- Completed plan 05-02 (Natural Language Urdu Instructions Column), Phase 5 complete
progress:
  total_phases: 6
  completed_phases: 2
  total_plans: 4
  completed_plans: 4
---

# Project State: ClinicSoftware

## Project Reference
See: .planning/PROJECT.md (updated 2026-03-06)
**Core value:** The doctor can see a patient, write a prescription with medication autocomplete, and print it in under 2 minutes, even with no internet.
**Current focus:** v1.1 Urdu & Backup

## Current Position

Phase: 5 (Prescription Print Urdu)
Plan: All complete (2/2)
Status: Phase 5 complete, ready for Phase 6
Last activity: 2026-03-06 -- Completed plan 05-02 (Natural Language Urdu Instructions Column)

## Progress
| Phase | Name | Status | Plans |
| 4 | Urdu Foundation (Font + Translations) | Complete | 2/2 |
| 5 | Prescription Print Urdu | Complete | 2/2 |
| 6 | Rx Notes Urdu Toggle | Not Started | -- |
| 7 | Backup Export | Not Started | -- |
| 8 | Backup Restore | Not Started | -- |
| 9 | Auto-Snapshots | Not Started | -- |
|-------|------|--------|-------|

## Decisions
See: .planning/PROJECT.md Key Decisions table
- Phase 5: Used .map() over column array for DRY bilingual header rendering; Urdu header font 9pt (prescription) / 8pt (dispensary)
- Phase 5-02: Uniform Urdu sentence template with form-awareness from dosage lookup; passthrough detection as fallback trigger

## Accumulated Context
- v1.0 shipped with 27/27 requirements, 3 phases, 14 plans
- Predefined dosage/frequency/duration options in `src/constants/clinical.ts`
- Print slips: PrescriptionSlip.tsx (patient-facing) and DispensarySlip.tsx (pharmacist-facing)
- Both print slips now render 5-column layout with natural Urdu instruction sentences via buildUrduInstruction()
- Translation coverage test in `src/constants/__tests__/translations.test.ts` catches drift
- Rx Notes field exists as freeform textarea in NewVisitPage/EditVisitPage
- IndexedDB is origin-scoped and device-local (no cross-device data sharing)

### Pending Todos
None.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 1 | Set up GitHub remote repo and deploy to GitHub Pages | 2026-03-06 | fa0212f | [1-set-up-github-remote-repo-and-deploy-to-](./quick/1-set-up-github-remote-repo-and-deploy-to-/) |
| 2 | Fix Print CTA alignment | 2026-03-06 | 8de8291 | [2-fix-print-cta-alignment](./quick/2-fix-print-cta-alignment/) |
| 3 | Show full drug details after selection | 2026-03-06 | 0870962 | [3-show-full-drug-details-after-selection-i](./quick/3-show-full-drug-details-after-selection-i/) |
| 4 | Add Save & Print CTA to visit pages | 2026-03-06 | 3aee6f0 | [4-add-save-and-print-cta-to-new-visit-page](./quick/4-add-save-and-print-cta-to-new-visit-page/) |

---
*Last updated: 2026-03-06 - Phase 5 complete (Natural Language Urdu Instructions Column)*
