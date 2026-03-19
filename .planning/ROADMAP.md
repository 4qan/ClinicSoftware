# Roadmap: ClinicSoftware

## Milestones

- v1.0 MVP -- 3 phases (shipped 2026-03-06)
- v1.1 Urdu & Backup -- 7 phases (shipped 2026-03-11)
- v1.2 Print Customization -- 2 phases (shipped 2026-03-12)
- v1.3 Keyboard Navigation -- 3 phases (shipped 2026-03-15)
- v1.4 Slip Assignment & Print Settings -- Phases 15-16 (in progress)

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

### v1.4 Slip Assignment & Print Settings (In Progress)

**Milestone Goal:** Let the doctor control which medicines appear on which printed slip, and toggle auto-print behavior.

- [ ] **Phase 15: Slip Assignment** - Per-medication slip designation with print filtering
- [ ] **Phase 16: Auto-Print Toggle** - Auto-print on/off setting with persistent preference

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
**Plans:** 1/2 plans executed
Plans:
- [ ] 15-01-PLAN.md -- Data model (slipType field) and toggle UI in medication list
- [ ] 15-02-PLAN.md -- Print filtering by slip type, empty slip handling, Rx badge in visit history

### Phase 16: Auto-Print Toggle
**Goal**: Doctor can enable or disable auto-print from Print Management settings, and the preference survives sessions
**Depends on**: Phase 15
**Requirements**: PRSET-05, PRSET-06
**Success Criteria** (what must be TRUE):
  1. Print Management settings page shows an auto-print on/off toggle
  2. With auto-print on, slips print automatically on visit save (existing behavior preserved)
  3. With auto-print off, slips do not auto-print; doctor triggers print manually
  4. Auto-print preference persists after page refresh and browser restart
**Plans**: TBD

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
| 15. Slip Assignment | 1/2 | In Progress|  | - |
| 16. Auto-Print Toggle | v1.4 | 0/? | Not started | - |

---
*Last updated: 2026-03-19 -- Phase 15 planned (2 plans)*
