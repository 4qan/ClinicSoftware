---
gsd_state_version: 1.0
milestone: v1.5
milestone_name: Visit Vitals
status: planning
stopped_at: Completed 18-01-PLAN.md
last_updated: "2026-03-19T11:57:29.228Z"
last_activity: 2026-03-19 -- Roadmap created
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 7
  completed_plans: 4
  percent: 0
---

# Project State: ClinicSoftware

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-19)

**Core value:** The doctor can see a patient, write a prescription with medication autocomplete, and print it in under 2 minutes, even with no internet.
**Current focus:** Phase 15 -- Slip Assignment

## Current Position

Phase: 15 of 16 (v1.4)
Plan: -- (not yet planned)
Status: Ready to plan
Last activity: 2026-03-19 -- Roadmap created

Progress: [░░░░░░░░░░░░░░░░░░░░] 0% (v1.4)

## Accumulated Context

### Decisions

- v1.0 through v1.3 decisions logged in PROJECT.md Key Decisions table
- Medications stored as snapshots: SLIP-05 (slip assignment) stores with snapshot, follows existing pattern
- Print settings in Dexie settings table: PRSET-06 (auto-print persistence) follows same pattern as paper size settings
- Auto-print double-fire guard uses useRef: relevant context for PRSET-05 toggle behavior
- [Phase 15-slip-assignment]: slipType optional on VisitMedication, not indexed; missing value = dispensary by convention
- [Phase 15-slip-assignment]: Toggle lives in MedicationList next to Actions, not in MedicationEntry form
- [Phase 15-slip-assignment]: prescriptionMeds and dispensaryMeds derived inline in PrintVisitPage; no separate util file
- [Phase 15-slip-assignment]: Auto-print skip checks targetMeds.length before scheduling window.print(); empty slip skipped silently
- [Phase 15-slip-assignment]: prescriptionMeds and dispensaryMeds derived inline in PrintVisitPage; no separate utility file
- [Phase 15-slip-assignment]: Rx badge shown only for prescription; dispensary (default) gets no badge
- [Phase 15-slip-assignment]: Auto-print skip: check targetMeds.length before scheduling window.print(); empty slip skipped silently
- [Phase 16-auto-print-toggle]: autoPrint defaults true when key absent from DB; page style injected regardless of autoPrint so manual print always works
- [Phase 18-unified-medication-management]: isOverridden is optional on Drug interface for backward compatibility with existing records
- [Phase 18-unified-medication-management]: backup.ts needs no changes: seed-once logic (count > 0 = skip) handles restore interaction
- [Phase 18-unified-medication-management]: updateCustomDrug/deleteCustomDrug kept as deprecated wrappers; SEED_VERSION removed, seeding now count-based

### Roadmap Evolution

- Phase 17 added: Visit Vitals (optional vital signs per visit with history display)
- Phase 18 added: Unified Medication Management (top-level medications page, override model for predefined drugs, hardened seeding)

### Pending Todos

None.

### Blockers/Concerns

- login.test.tsx: 4 pre-existing failures due to BrowserRouter basename="/ClinicSoftware" mismatch in jsdom (carried from v1.3)

## Session Continuity

Last session: 2026-03-19T11:57:29.226Z
Stopped at: Completed 18-01-PLAN.md
Resume file: None

---
*Last updated: 2026-03-19 -- v1.4 roadmap created*
