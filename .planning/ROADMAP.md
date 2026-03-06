# Roadmap: ClinicSoftware

**Created:** 2026-03-05
**Granularity:** Coarse
**Phases:** 3
**Requirements:** 25 mapped

---

## Phase 1: Foundation and Patient Management

**Goal:** A working offline PWA where the doctor can log in, register patients, search them, and view patient profiles, with all data persisted locally in IndexedDB.

**Requirements:**
- FOUND-01: App is installable as PWA from browser
- FOUND-02: App works 100% offline using IndexedDB
- FOUND-03: Service worker caches all app assets for offline use
- FOUND-04: User logs in with simple password/PIN
- FOUND-05: All records auto-timestamped for compliance audit trail
- PAT-01: Register new patient (name, age, gender, contact, optional CNIC)
- PAT-02: Auto-generate unique patient ID in 2026-XXXX format (UUID as internal key)
- PAT-03: Search patients by name, ID, or contact in under 1 second
- PAT-04: View patient profile with all encounters and prescriptions chronologically

**Success Criteria:**
1. Doctor installs PWA from Chrome/Edge, opens it offline, and logs in with PIN.
2. Doctor registers a patient, sees the auto-generated 2026-XXXX ID, and finds them via search.
3. Patient profile page loads (empty history) and all data survives a browser restart.

**Plans:** 5 (5/5 complete)
- Plan 1: Project Setup, PWA Foundation, Data Layer, Authentication - COMPLETE (2026-03-05)
- Plan 2: Patient Registration, Search, Profile - COMPLETE (2026-03-05)
- Plan 3: UAT Gap Closure - COMPLETE (2026-03-05)
- Plan 4: UI Overhaul: Sidebar Navigation and Table-Based Patient List - COMPLETE (2026-03-05)
- Plan 5: Form UX Fixes and Recovery Code Relocation - COMPLETE (2026-03-06)

---

## Phase 2: Clinical Workflow (Encounters, Prescriptions, Drug Database)

**Goal:** The doctor can log encounters, write prescriptions with medication autocomplete from a pre-seeded drug database, and manage custom medications, completing the core clinical data loop.

**Requirements:**
- ENC-01: Log encounter for a patient (complaint, examination notes, diagnosis)
- ENC-02: Encounters automatically dated and timestamped
- ENC-03: View past encounters on patient profile in reverse chronological order
- RX-01: Write a prescription linked to an encounter
- RX-02: Add medications with dosage, frequency, duration, and optional notes per item
- RX-03: Medication autocomplete from local drug database (salt name + brand name)
- RX-04: Autocomplete performs in under 300ms on older hardware
- RX-05: Prescriptions immutable once saved (append-only for compliance)
- DRUG-01: Pre-seeded local database of common medications
- DRUG-02: Add custom medications via settings
- DRUG-03: Edit existing custom medications
- DRUG-04: Custom medications appear in autocomplete alongside pre-seeded ones

**Success Criteria:**
1. Doctor opens a patient, logs an encounter with complaint and diagnosis, and sees it appear in the patient history.
2. Doctor writes a prescription, types a partial drug name, and gets autocomplete suggestions within 300ms.
3. Doctor adds a custom medication in settings and it appears in autocomplete on the next prescription.
4. Saved prescriptions cannot be edited or deleted (immutability verified).

**Plans:** 4/4 plans complete
- Plan 1: Drug Database: Schema, Seed Data, Settings UI, Autocomplete - COMPLETE (2026-03-06)
- Plan 2: Visit/Encounter Workflow - COMPLETE (2026-03-06)
- Plan 3: Integration: Visit History, Cross-Wiring, Polish - COMPLETE (2026-03-06)
- Plan 4: Gap Closure (UAT Fixes) - COMPLETE (2026-03-06)

---

## Phase 3: Printing and Visit Completion

**Goal:** The doctor can print a prescription slip and a separate dispensary slip from any prescription, completing the full visit workflow in under 2 minutes.

**Requirements:**
- PRINT-01: Print prescription slip in small format (non-A4) with patient info, date, and medications
- PRINT-02: Print separate dispensary slip with medication list only (for dispenser)
- PRINT-03: Print layouts work correctly in Chrome/Edge print dialog
- PRINT-04: Both prints triggered from prescription view with clear, separate buttons
- VISIT-01: Inline patient creation during new visit (no page navigation away from visit form)
- VISIT-02: Visit form sections always visible (disabled until patient selected), no layout shift
- VISIT-03: Search results show "Create [name] as new patient" option when no match found

**Success Criteria:**
1. Doctor clicks "Print Prescription" and gets a correctly formatted small-format slip in the browser print dialog.
2. Doctor clicks "Print Dispensary Slip" and gets a medication-only list formatted for the dispenser.
3. Full visit workflow (find patient, log encounter, write Rx, print both slips) completes in under 2 minutes.
4. Doctor starts a new visit, types an unknown name, creates the patient inline without leaving the page, and continues writing the prescription seamlessly.

**Plans:** 1

---

## Coverage Validation

| Category | Requirements | Phase | Count |
|----------|-------------|-------|-------|
| Foundation | FOUND-01 to FOUND-05 | 1 | 5 |
| Patient Management | PAT-01 to PAT-04 | 1 | 4 |
| Encounters | ENC-01 to ENC-03 | 2 | 3/3 | Complete   | 2026-03-06 | RX-01 to RX-05 | 2 | 5 |
| Drug Database | DRUG-01 to DRUG-04 | 2 | 4 |
| Printing | PRINT-01 to PRINT-04 | 3 | 4 |
| Visit Flow | VISIT-01 to VISIT-03 | 3 | 3 |
| **Total** | | | **28** |

**Note:** 28 v1 requirements total (3 visit flow requirements added during Phase 2 UAT). All 28 are mapped.

---
*Created: 2026-03-05*
