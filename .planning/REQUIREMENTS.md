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

## Future Requirements

None currently deferred.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Both-slips option per medication | Doctor confirmed each med is one slip or the other, never both |
| Per-visit print settings | Global settings sufficient for single-doctor clinic |

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

**Coverage:**
- v1.4 requirements: 7 total
- Mapped to phases: 7
- Unmapped: 0

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 -- traceability updated after roadmap creation*
