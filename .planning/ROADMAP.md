# Roadmap: ClinicSoftware

## Milestones

- v1.0 MVP -- 3 phases (shipped 2026-03-06)
- v1.1 Urdu & Backup -- 7 phases (shipped 2026-03-11)
- v1.2 Print Customization -- Phases 10-11 (in progress)

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

### v1.2 Print Customization (In Progress)

**Milestone Goal:** Make print paper sizes configurable per slip type, with layouts that scale to fill the selected page size.

- [x] **Phase 10: Print Infrastructure & Settings** - Paper size persistence, settings UI, dynamic @page injection, and conditional slip rendering (completed 2026-03-11)
- [ ] **Phase 11: Layout Scaling & Preview** - Proportional font/spacing scaling for both slips across all paper sizes, with on-screen preview

## Phase Details

### Phase 10: Print Infrastructure & Settings
**Goal**: User can select independent paper sizes for prescription and dispensary slips, and the browser print dialog uses the correct page dimensions
**Depends on**: Phase 9 (v1.1 complete)
**Requirements**: PRSET-01, PRSET-02, PRSET-03, PRSET-04, PRENG-01, PRENG-02, PRENG-03
**Success Criteria** (what must be TRUE):
  1. User can open a Print Management tab in Settings and select paper size for prescription slip independently from dispensary slip
  2. Browser print dialog renders the correct page dimensions matching the user's selected paper size (not hardcoded A5)
  3. Page margins adjust proportionally when switching between paper sizes (smaller page = smaller margins)
  4. Only the active slip type appears in the printed output (no ghost content from the other slip)
  5. A fresh install or upgrade from pre-v1.2 defaults both slips to A5 with no user action required
**Plans:** 2/2 plans complete

Plans:
- [x] 10-01-PLAN.md -- Print settings data layer, types/constants, and Settings UI with paper size dropdowns
- [x] 10-02-PLAN.md -- Dynamic @page injection, conditional slip rendering, size badge, index.css cleanup

### Phase 11: Layout Scaling & Preview
**Goal**: Prescription and dispensary slip content fills the selected paper size proportionally, including correct Urdu rendering, with a preview before printing
**Depends on**: Phase 10
**Requirements**: SCALE-01, SCALE-02, SCALE-03, SCALE-04
**Success Criteria** (what must be TRUE):
  1. Prescription slip fonts, spacing, and content area visibly scale to fill the selected paper size (A4 content is larger than A5)
  2. Dispensary slip fonts, spacing, and content area scale proportionally to the selected paper size
  3. Urdu/Nastaliq text on printed slips renders with correct line-height and no clipping at every supported paper size
  4. On-screen print preview reflects the selected paper size proportions before the user triggers the browser print dialog
**Plans:** 2 plans

Plans:
- [ ] 11-01-PLAN.md -- A6 removal, calcScale/URDU_LINE_HEIGHTS infrastructure, PrescriptionSlip scaling
- [ ] 11-02-PLAN.md -- DispensarySlip scaling, preview frame, manual print verification

## Progress

**Execution Order:** 10 -> 11

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|---------------|--------|-----------|
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
| 11. Layout Scaling & Preview | v1.2 | 0/2 | Not started | - |

---
*Last updated: 2026-03-12 after Phase 11 planning*
