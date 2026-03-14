# Requirements: ClinicSoftware

**Defined:** 2026-03-12
**Core Value:** The doctor can see a patient, write a prescription with medication autocomplete, and print it in under 2 minutes, even with no internet.

## v1.3 Requirements

Requirements for keyboard navigation milestone. Each maps to roadmap phases.

### Focus Foundation

- [x] **FOCUS-01**: All interactive elements on the critical path have visible focus indicators (outline, not box-shadow)
- [x] **FOCUS-02**: Focus indicators use `focus-visible` so they only appear on keyboard navigation, not mouse clicks
- [x] **FOCUS-03**: Tab order follows the natural form flow on login, patient search, new visit, prescription, and print screens

### Autocomplete Keyboard

- [x] **AUTO-01**: User can navigate autocomplete suggestions with Up/Down arrow keys
- [x] **AUTO-02**: User can select highlighted suggestion with Enter
- [x] **AUTO-03**: User can dismiss autocomplete dropdown with Escape without losing focus from the input
- [x] **AUTO-04**: User can Tab to confirm highlighted suggestion and advance to next field in one keystroke
- [x] **AUTO-05**: Drug search in MedicationEntry uses the same ComboBox component as other autocompletes (consolidation)

### Focus Management

- [x] **FMGT-01**: After selecting a drug, focus moves to the quantity field
- [x] **FMGT-02**: After completing a medication row (add), focus returns to the drug search field for the next medication
- [ ] **FMGT-03**: After creating a patient inline in the visit form, focus moves to the next logical visit field

### Form Submission

- [x] **FORM-01**: User can submit login form with Enter
- [x] **FORM-02**: User can submit patient creation form with Enter
- [x] **FORM-03**: User can submit/save visit form with Enter
- [x] **FORM-04**: User can add medication to prescription with Enter (after filling required fields)

### Escape/Cancel

- [x] **ESC-01**: Escape closes open autocomplete dropdowns
- [ ] **ESC-02**: Escape dismisses inline patient creation form
- [ ] **ESC-03**: Escape closes modals and overlays

### Print Flow

- [ ] **PRNT-01**: User can Tab to the print button after completing a prescription
- [ ] **PRNT-02**: User can trigger print with Enter on the print button
- [ ] **PRNT-03**: Focus restores to a logical position after the print dialog closes

## Future Requirements

### Global Shortcuts

- **GSHRT-01**: Alt+N shortcut to start a new visit
- **GSHRT-02**: Alt+P shortcut to trigger print

### Keyboard Help

- **KHELP-01**: Keyboard shortcut reference visible in UI
- **KHELP-02**: Customizable shortcut bindings

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full ARIA screen reader optimization | Not needed for single sighted user |
| Keyboard nav for Settings/Backup screens | Not on critical path, mouse is fine |
| Single-key global shortcuts (no modifier) | Conflict with text input fields |
| Keyboard shortcut customization | Complexity not justified for single user |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOCUS-01 | Phase 12 | Complete |
| FOCUS-02 | Phase 12 | Complete |
| FOCUS-03 | Phase 12 | Complete |
| FORM-01 | Phase 12 | Complete |
| FORM-02 | Phase 12 | Complete |
| FORM-03 | Phase 12 | Complete |
| AUTO-01 | Phase 13 | Complete |
| AUTO-02 | Phase 13 | Complete |
| AUTO-03 | Phase 13 | Complete |
| AUTO-04 | Phase 13 | Complete |
| AUTO-05 | Phase 13 | Complete |
| ESC-01 | Phase 13 | Complete |
| FMGT-01 | Phase 13 | Complete |
| FMGT-02 | Phase 13 | Complete |
| FMGT-03 | Phase 13 | Pending |
| FORM-04 | Phase 13 | Complete |
| ESC-02 | Phase 13 | Pending |
| ESC-03 | Phase 13 | Pending |
| PRNT-01 | Phase 14 | Pending |
| PRNT-02 | Phase 14 | Pending |
| PRNT-03 | Phase 14 | Pending |

**Coverage:**
- v1.3 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0

---
*Requirements defined: 2026-03-12*
*Last updated: 2026-03-12 -- traceability updated after roadmap revision to 3 phases (12-14)*
