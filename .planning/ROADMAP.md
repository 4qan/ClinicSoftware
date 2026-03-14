# Roadmap: ClinicSoftware

## Milestones

- v1.0 MVP -- 3 phases (shipped 2026-03-06)
- v1.1 Urdu & Backup -- 7 phases (shipped 2026-03-11)
- v1.2 Print Customization -- 2 phases (shipped 2026-03-12)
- v1.3 Keyboard Navigation -- Phases 12-14 (in progress)

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

### v1.3 Keyboard Navigation (In Progress)

**Milestone Goal:** The doctor can complete the entire critical path (login to patient to visit to prescription to print) without touching the mouse.

- [x] **Phase 12: Focus Foundation and Form Submission** - Visible focus indicators, logical tab order, Enter-to-submit on all critical-path forms (completed 2026-03-14)
- [ ] **Phase 13: Keyboard Interactions** - Fully keyboard-operable autocomplete, DrugComboBox consolidation, focus management after all actions, Escape to dismiss everywhere
- [ ] **Phase 14: Print Flow** - Tab to print, Enter to fire, focus restore after dialog

## Phase Details

### Phase 12: Focus Foundation and Form Submission
**Goal**: Every interactive element on the critical path shows a visible focus indicator on keyboard navigation, tab order is logical across all screens, and all critical-path forms submit on Enter.
**Depends on**: Nothing (first v1.3 phase)
**Requirements**: FOCUS-01, FOCUS-02, FOCUS-03, FORM-01, FORM-02, FORM-03
**Success Criteria** (what must be TRUE):
  1. Pressing Tab on any critical-path page (login, patient search, new visit, prescription, print) shows a visible outline on the focused element
  2. Focus indicators appear only during keyboard navigation, not when clicking with the mouse
  3. Tab moves through form fields in the order they appear visually on screen across all critical-path pages
  4. Pressing Enter on the login form submits it without clicking the button
  5. Pressing Enter on the patient creation form and visit form submits them without clicking the button
**Plans:** 2/2 plans complete

Plans:
- [ ] 12-01-PLAN.md -- Global focus-visible CSS rule and legacy focus class cleanup
- [ ] 12-02-PLAN.md -- Tab order fixes, button reorder, and form submission verification

### Phase 13: Keyboard Interactions
**Goal**: All autocomplete dropdowns are fully keyboard-operable, DrugComboBox is consolidated into a single component, every post-action focus transition works correctly, and Escape dismisses every dismissible element without losing focus.
**Depends on**: Phase 12
**Requirements**: AUTO-01, AUTO-02, AUTO-03, AUTO-04, AUTO-05, ESC-01, FMGT-01, FMGT-02, FMGT-03, FORM-04, ESC-02, ESC-03
**Success Criteria** (what must be TRUE):
  1. User can navigate autocomplete suggestions with Up/Down arrows, confirm with Enter or Tab-to-advance, and dismiss with Escape without losing focus from the input
  2. Drug search in the prescription form uses the same keyboard behavior as all other autocomplete inputs (single consolidated component)
  3. After selecting a drug from autocomplete, focus moves automatically to the quantity field; after adding a medication row, focus returns to the drug search field
  4. After creating a patient inline, focus moves to the next logical visit field; pressing Escape on the inline patient form dismisses it and returns focus to patient search
  5. Pressing Escape closes any open modal or overlay and returns focus to a logical position; pressing Enter after filling required medication fields adds the row
**Plans:** 2/3 plans executed

Plans:
- [ ] 13-01-PLAN.md -- Shared autocomplete keyboard hook, ComboBox and SearchBar fixes
- [ ] 13-02-PLAN.md -- Drug search consolidation and MedicationEntry focus transitions
- [ ] 13-03-PLAN.md -- NewVisitPage patient search keyboard nav, inline form Escape, post-create focus

### Phase 14: Print Flow
**Goal**: The doctor can trigger printing and return to work using only the keyboard after completing a prescription.
**Depends on**: Phase 13
**Requirements**: PRNT-01, PRNT-02, PRNT-03
**Success Criteria** (what must be TRUE):
  1. User can Tab to the print button from the last prescription field without extra clicks
  2. User can press Enter on the focused print button to open the browser print dialog
  3. After the print dialog closes, focus returns to a usable position on the page (not lost to document body)
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
| 12. Focus Foundation and Form Submission | 2/2 | Complete   | 2026-03-14 | - |
| 13. Keyboard Interactions | 2/3 | In Progress|  | - |
| 14. Print Flow | v1.3 | 0/? | Not started | - |

---
*Last updated: 2026-03-14 -- Phase 13 planned (3 plans)*
