# Requirements: ClinicSoftware

**Defined:** 2026-03-11
**Core Value:** The doctor can see a patient, write a prescription with medication autocomplete, and print it in under 2 minutes, even with no internet.

## v1.2 Requirements

Requirements for Print Customization milestone. Each maps to roadmap phases.

### Print Settings

- [x] **PRSET-01**: User can access a Print Management tab in Settings
- [x] **PRSET-02**: User can select paper size for prescription slip from standard options (A4, A5, A6, Letter)
- [x] **PRSET-03**: User can select paper size for dispensary slip independently from prescription slip
- [x] **PRSET-04**: Paper size defaults to A5 for both slips on fresh install or upgrade from pre-v1.2

### Print Engine

- [x] **PRENG-01**: Selected paper size controls the browser print dialog page dimensions via dynamic @page injection
- [x] **PRENG-02**: Page margins auto-adjust proportionally to the selected paper size (smaller page = smaller margins)
- [x] **PRENG-03**: Only the active slip type renders in DOM during print (conditional rendering, not CSS hiding)

### Layout Scaling

- [x] **SCALE-01**: Prescription slip fonts, spacing, and content area scale proportionally to fill the selected paper size
- [x] **SCALE-02**: Dispensary slip fonts, spacing, and content area scale proportionally to fill the selected paper size
- [x] **SCALE-03**: Urdu/Nastaliq text renders correctly at all supported paper sizes (line-height tuned per size)
- [x] **SCALE-04**: On-screen print preview reflects the selected paper size proportions before printing

## Future Requirements

### Print Enhancements

- **PRSET-05**: User can enter custom paper dimensions (width/height in mm) for non-standard paper
- **PRSET-06**: B5 and Legal paper size options available
- **PRSET-07**: Paper size indicator label displayed next to print button

## Out of Scope

| Feature | Reason |
|---------|--------|
| Orientation toggle (landscape) | Prescriptions are always portrait. Landscape breaks medication list flow. |
| Manual margin editor | Exposes complexity doctor won't understand. Auto-calculated margins are safer. |
| WYSIWYG layout editor | Massive complexity, no value for single-user clinic. |
| PDF export/download | Browser print dialog already has "Save as PDF" option. |
| Multiple print templates/themes | One doctor, one clinic, one style. |
| Separate CSS files per paper size | Maintenance nightmare. Single dynamic system is simpler. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PRSET-01 | Phase 10 | Complete |
| PRSET-02 | Phase 10 | Complete |
| PRSET-03 | Phase 10 | Complete |
| PRSET-04 | Phase 10 | Complete |
| PRENG-01 | Phase 10 | Complete |
| PRENG-02 | Phase 10 | Complete |
| PRENG-03 | Phase 10 | Complete |
| SCALE-01 | Phase 11 | Complete |
| SCALE-02 | Phase 11 | Complete |
| SCALE-03 | Phase 11 | Complete |
| SCALE-04 | Phase 11 | Complete |

**Coverage:**
- v1.2 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0

---
*Requirements defined: 2026-03-11*
*Last updated: 2026-03-11 after roadmap creation*
