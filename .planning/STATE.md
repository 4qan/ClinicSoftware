---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Urdu & Backup
status: active
last_updated: "2026-03-06"
progress:
  total_phases: 6
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# Project State: ClinicSoftware

## Project Reference
See: .planning/PROJECT.md (updated 2026-03-06)
**Core value:** The doctor can see a patient, write a prescription with medication autocomplete, and print it in under 2 minutes, even with no internet.
**Current focus:** v1.1 Urdu & Backup

## Current Position

Phase: 4 (Urdu Foundation)
Plan: --
Status: Roadmap defined, ready to start phase 4
Last activity: 2026-03-06 -- v1.1 roadmap created (phases 4-9)

## Progress
| Phase | Name | Status | Plans |
| 4 | Urdu Foundation (Font + Translations) | Not Started | -- |
| 5 | Prescription Print Urdu | Not Started | -- |
| 6 | Rx Notes Urdu Toggle | Not Started | -- |
| 7 | Backup Export | Not Started | -- |
| 8 | Backup Restore | Not Started | -- |
| 9 | Auto-Snapshots | Not Started | -- |
|-------|------|--------|-------|

## Decisions
See: .planning/PROJECT.md Key Decisions table

## Accumulated Context
- v1.0 shipped with 27/27 requirements, 3 phases, 14 plans
- Predefined dosage/frequency/duration options in `src/constants/clinical.ts`
- Print slips: PrescriptionSlip.tsx (patient-facing) and DispensarySlip.tsx (pharmacist-facing)
- Rx Notes field exists as freeform textarea in NewVisitPage/EditVisitPage
- IndexedDB is origin-scoped and device-local (no cross-device data sharing)

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 1 | Set up GitHub remote repo and deploy to GitHub Pages | 2026-03-06 | fa0212f | [1-set-up-github-remote-repo-and-deploy-to-](./quick/1-set-up-github-remote-repo-and-deploy-to-/) |

---
*Last updated: 2026-03-06 - v1.1 roadmap created (phases 4-9)*
