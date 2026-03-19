# Roadmap: ClinicSoftware

## Milestones

- v1.0 MVP -- 3 phases (shipped 2026-03-06)
- v1.1 Urdu & Backup -- 7 phases (shipped 2026-03-11)
- v1.2 Print Customization -- 2 phases (shipped 2026-03-12)
- v1.3 Keyboard Navigation -- 3 phases (shipped 2026-03-15)
- v1.4 Slip Assignment & Print Settings -- Phases 15-16 (shipped 2026-03-19)
- v1.5 Visit Vitals -- Phase 17 (in progress)

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

<details>
<summary>v1.4 Slip Assignment & Print Settings (Phases 15-16) -- SHIPPED 2026-03-19</summary>

- [x] Phase 15: Slip Assignment (2/2 plans) -- completed 2026-03-19
- [x] Phase 16: Auto-Print Toggle (1/1 plan) -- completed 2026-03-19

</details>

### v1.5 Visit Vitals (In Progress)

**Milestone Goal:** Record optional vital signs per visit (temperature, blood pressure, weight, SpO2) and surface them in visit history for quick clinical reference.

- [x] **Phase 17: Visit Vitals** - Vital signs data model, input UI, and visit history display (completed 2026-03-19)

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
**Plans:** 2/2 plans complete
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
**Plans:** 1/1 plans complete
Plans:
- [ ] 16-01-PLAN.md -- Auto-print toggle in settings UI, persistence, and print gate

### Phase 17: Visit Vitals
**Goal**: Doctor can record optional vital signs (temperature, BP, weight, SpO2) per visit; vitals display prominently in visit history cards for quick clinical reference
**Depends on**: Phase 16
**Requirements**: VIT-01 through VIT-06
**Success Criteria** (what must be TRUE):
  1. NewVisitPage and EditVisitPage show a collapsible "Vitals" section above clinical notes with a compact 2x2 grid layout
  2. Temperature input supports Fahrenheit (default) and Celsius with a toggle that converts the value
  3. Blood pressure captured as systolic/diastolic (mmHg) in side-by-side inputs
  4. Weight input in kg, SpO2 input as percentage, all fields optional
  5. Vitals display in VisitCard collapsed state (compact inline badges) and in NewVisitPage inline visit history preview
  6. Vitals persist via DB migration (v6) and survive save/reload cycle
  7. Vitals do NOT appear on printed slips
**Plans:** 2/2 plans complete
Plans:
- [ ] 17-01-PLAN.md -- Data model (Visit interface + DB v6), VitalsInput component, wire into NewVisitPage and EditVisitPage
- [ ] 17-02-PLAN.md -- Vitals display in VisitCard badges and inline visit history, verify no print impact

### Phase 18: Unified Medication Management
**Goal**: Doctor can manage all medications (predefined and custom) from a dedicated top-level page with full CRUD, search, filtering, and an override model that tracks edits to predefined drugs with reset capability
**Depends on:** Phase 17
**Requirements**: MED-01, MED-02, MED-03, MED-04, MED-05, MED-06, MED-07, MED-08
**Success Criteria** (what must be TRUE):
  1. Top-level Medications page accessible from sidebar shows all drugs in a searchable, filterable table
  2. All drugs (predefined and custom) are fully editable and deletable
  3. Editing a predefined drug sets isOverridden flag; "Reset to default" reverts to seed values
  4. Seeding runs only on first-ever app use (empty drugs table), never re-seeds
  5. Settings medications tab is removed; DrugManagement component replaced by MedicationsPage
**Plans:** 2/2 plans complete

Plans:
- [ ] 18-01-PLAN.md -- Data layer: Drug interface update, CRUD functions, seed-once logic
- [ ] 18-02-PLAN.md -- Medications page UI, navigation, routing, settings cleanup

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
| 15. Slip Assignment | v1.4 | 2/2 | Complete | 2026-03-19 |
| 16. Auto-Print Toggle | v1.4 | 1/1 | Complete | 2026-03-19 |
| 17. Visit Vitals | 2/2 | Complete   | 2026-03-19 | - |
| 18. Unified Medication Management | 2/2 | Complete    | 2026-03-19 | - |

---
*Last updated: 2026-03-19 -- Phase 17 planned (Visit Vitals)*
