# Requirements: ClinicSoftware

**Defined:** 2026-03-05
**Core Value:** The doctor can see a patient, write a prescription with medication autocomplete, and print it in under 2 minutes, even with no internet.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [ ] **FOUND-01**: App is installable as PWA from browser (no .exe, works on old Windows Chrome/Edge)
- [ ] **FOUND-02**: App works 100% offline using IndexedDB as local database
- [ ] **FOUND-03**: Service worker caches all app assets for offline use
- [ ] **FOUND-04**: User logs in with a simple password/PIN before accessing any data
- [ ] **FOUND-05**: All records (patients, encounters, prescriptions) are auto-timestamped for compliance audit trail

### Patient Management

- [ ] **PAT-01**: User can register a new patient with name, age, gender, contact info, and optional CNIC
- [ ] **PAT-02**: System auto-generates unique patient ID in 2026-XXXX format (with UUID as internal key)
- [ ] **PAT-03**: User can search patients by name, ID, or contact in under 1 second
- [ ] **PAT-04**: User can view a patient profile showing all encounters and prescriptions chronologically

### Encounters

- [ ] **ENC-01**: User can log an encounter for a patient (complaint, examination notes, diagnosis)
- [ ] **ENC-02**: Encounters are automatically dated and timestamped
- [ ] **ENC-03**: User can view past encounters on the patient profile in reverse chronological order

### Prescriptions

- [ ] **RX-01**: User can write a prescription linked to an encounter
- [ ] **RX-02**: User can add medications with dosage, frequency, duration, and optional notes per item
- [ ] **RX-03**: Medication input provides autocomplete from local drug database (salt name + brand name)
- [ ] **RX-04**: Autocomplete performs in under 300ms even on older hardware
- [ ] **RX-05**: Prescriptions are immutable once saved (append-only for compliance)

### Drug Database

- [ ] **DRUG-01**: App ships with pre-seeded local database of common medications (salt names + brand names)
- [ ] **DRUG-02**: User can add custom medications via a settings screen
- [ ] **DRUG-03**: User can edit existing custom medications
- [ ] **DRUG-04**: Custom medications appear in prescription autocomplete alongside pre-seeded ones

### Printing

- [ ] **PRINT-01**: User can print a prescription slip in small format (non-A4) with patient info, date, and medications
- [ ] **PRINT-02**: User can print a separate dispensary slip with medication list only (for dispenser)
- [ ] **PRINT-03**: Print layouts work correctly in Chrome/Edge print dialog
- [ ] **PRINT-04**: Both prints are triggered from the prescription view with clear, separate buttons

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Cloud Sync

- **SYNC-01**: App syncs patient data to Supabase cloud backend when internet is available
- **SYNC-02**: Sync happens in background without interrupting workflow
- **SYNC-03**: Last-write-wins conflict resolution (single user)

### Productivity

- **PROD-01**: User can save prescription templates for common diagnoses
- **PROD-02**: User can repeat a prescription from a previous visit ("prescribe same as last time")

### Data Safety

- **SAFE-01**: User can export all data as a backup file
- **SAFE-02**: User can import data from a backup file

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-doctor / multi-role | Single user only, no staff accounts needed |
| Appointment scheduling | Walk-in clinic, no scheduling required |
| Billing / payments | Not needed for this clinic |
| Lab results / imaging | Not needed |
| Drug interaction warnings | Complexity not justified for v1 |
| Patient portal | Not needed, personal use only |
| Mobile-native app | PWA covers mobile access |
| AI clinical decision support | Over-engineering for this use case |
| Real-time sync / CRDTs | Single user, single device. Simple REST sync in v2 is sufficient |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1: Foundation and Patient Management | Not Started |
| FOUND-02 | Phase 1: Foundation and Patient Management | Not Started |
| FOUND-03 | Phase 1: Foundation and Patient Management | Not Started |
| FOUND-04 | Phase 1: Foundation and Patient Management | Not Started |
| FOUND-05 | Phase 1: Foundation and Patient Management | Not Started |
| PAT-01 | Phase 1: Foundation and Patient Management | Not Started |
| PAT-02 | Phase 1: Foundation and Patient Management | Not Started |
| PAT-03 | Phase 1: Foundation and Patient Management | Not Started |
| PAT-04 | Phase 1: Foundation and Patient Management | Not Started |
| ENC-01 | Phase 2: Clinical Workflow | Not Started |
| ENC-02 | Phase 2: Clinical Workflow | Not Started |
| ENC-03 | Phase 2: Clinical Workflow | Not Started |
| RX-01 | Phase 2: Clinical Workflow | Not Started |
| RX-02 | Phase 2: Clinical Workflow | Not Started |
| RX-03 | Phase 2: Clinical Workflow | Not Started |
| RX-04 | Phase 2: Clinical Workflow | Not Started |
| RX-05 | Phase 2: Clinical Workflow | Not Started |
| DRUG-01 | Phase 2: Clinical Workflow | Not Started |
| DRUG-02 | Phase 2: Clinical Workflow | Not Started |
| DRUG-03 | Phase 2: Clinical Workflow | Not Started |
| DRUG-04 | Phase 2: Clinical Workflow | Not Started |
| PRINT-01 | Phase 3: Printing and Visit Completion | Not Started |
| PRINT-02 | Phase 3: Printing and Visit Completion | Not Started |
| PRINT-03 | Phase 3: Printing and Visit Completion | Not Started |
| PRINT-04 | Phase 3: Printing and Visit Completion | Not Started |

**Coverage:**
- v1 requirements: 25 total (corrected from original count of 21)
- Mapped to phases: 25
- Unmapped: 0

---
*Requirements defined: 2026-03-05*
*Last updated: 2026-03-05 after roadmap creation*
