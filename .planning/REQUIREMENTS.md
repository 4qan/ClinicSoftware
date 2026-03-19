# Requirements: ClinicSoftware

**Defined:** 2026-03-19
**Core Value:** The doctor can see a patient, write a prescription with medication autocomplete, and print it in under 2 minutes, even with no internet.

## v1.4 Requirements

Requirements for v1.4 Slip Assignment & Print Settings. Each maps to roadmap phases.

### Slip Assignment

- [x] **SLIP-01**: User can designate each medication as "dispensary" or "prescription" when adding it
- [x] **SLIP-02**: New medications default to "dispensary"
- [x] **SLIP-03**: Prescription slip only prints medications tagged as "prescription"
- [x] **SLIP-04**: Dispensary slip only prints medications tagged as "dispensary"
- [x] **SLIP-05**: Slip assignment is stored with the medication snapshot (persists with the encounter)

### Print Settings

- [x] **PRSET-05**: User can toggle auto-print on/off in Print Management settings
- [x] **PRSET-06**: Auto-print preference persists across sessions

## v1.5 Requirements

Requirements for v1.5 Visit Vitals. Maps to Phase 17.

### Visit Vitals

- [x] **VIT-01**: NewVisitPage and EditVisitPage show a collapsible "Vitals" section above clinical notes with a 2x2 grid (temperature, BP, weight, SpO2)
- [x] **VIT-02**: Temperature input supports Fahrenheit (default) and Celsius with a toggle that converts the displayed value
- [x] **VIT-03**: Blood pressure captured as systolic/diastolic (mmHg); weight in kg; SpO2 as percentage; all fields optional with no validation
- [ ] **VIT-04**: Vitals display in VisitCard collapsed state as compact inline badges (Temp: X | BP: X/X | Wt: X | SpO2: X)
- [ ] **VIT-05**: Vitals display in NewVisitPage inline visit history preview, same format as VisitCard
- [x] **VIT-06**: Vitals persist via DB migration (v6), survive save/reload, and do NOT appear on printed slips

## v1.6 Requirements

Requirements for v1.6 Unified Medication Management. Maps to Phase 18.

### Medication Management

- [x] **MED-01**: Top-level Medications page accessible from sidebar shows all drugs in a searchable, filterable table
- [x] **MED-02**: Search bar filters across brand and salt name
- [x] **MED-03**: Filter pills for All, Predefined, Custom, Disabled views
- [x] **MED-04**: All drugs (predefined and custom) are fully editable via modal form
- [x] **MED-05**: All drugs (predefined and custom) are deletable
- [x] **MED-06**: Editing a predefined drug sets isOverridden flag; "Reset to default" reverts to seed values
- [x] **MED-07**: Seeding runs only on first-ever app use (empty drugs table), never re-seeds
- [x] **MED-08**: Settings medications tab is removed; link to Medications page provided

## Future Requirements

None currently deferred.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Both-slips option per medication | Doctor confirmed each med is one slip or the other, never both |
| Per-visit print settings | Global settings sufficient for single-doctor clinic |
| Vitals validation / color coding | Doctor interprets the numbers, not the UI |
| Vitals on printed slips | Not needed per user decision |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SLIP-01 | Phase 15 | Complete |
| SLIP-02 | Phase 15 | Complete |
| SLIP-03 | Phase 15 | Complete |
| SLIP-04 | Phase 15 | Complete |
| SLIP-05 | Phase 15 | Complete |
| PRSET-05 | Phase 16 | Complete |
| PRSET-06 | Phase 16 | Complete |
| VIT-01 | Phase 17 | Planned |
| VIT-02 | Phase 17 | Planned |
| VIT-03 | Phase 17 | Planned |
| VIT-04 | Phase 17 | Planned |
| VIT-05 | Phase 17 | Planned |
| VIT-06 | Phase 17 | Planned |
| MED-01 | Phase 18 | Complete |
| MED-02 | Phase 18 | Complete |
| MED-03 | Phase 18 | Complete |
| MED-04 | Phase 18 | Complete |
| MED-05 | Phase 18 | Complete |
| MED-06 | Phase 18 | Complete |
| MED-07 | Phase 18 | Complete |
| MED-08 | Phase 18 | Complete |

**Coverage:**
- v1.4 requirements: 7 total, mapped: 7, unmapped: 0
- v1.5 requirements: 6 total, mapped: 6, unmapped: 0
- v1.6 requirements: 8 total, mapped: 8, unmapped: 0

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 -- v1.5 VIT requirements added*
