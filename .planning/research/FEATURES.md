# Feature Landscape: Clinic Prescription Management

Research for a single-doctor, offline-first PWA clinic system. Scoped to the context in PROJECT.md: walk-in clinic, unreliable internet, non-tech-savvy doctor, small-format prescription printing, compliance requirements.

---

## Table Stakes (Must Have or Users Leave)

These are expected by any doctor using prescription software. Missing any one is a dealbreaker.

| # | Feature | Complexity | Dependencies | Notes |
|---|---------|-----------|--------------|-------|
| T1 | **Patient registration** with unique ID (2026-XXXX) | Low | IndexedDB schema | Name, age, gender, contact, optional CNIC. Auto-generated ID per compliance. |
| T2 | **Patient search & lookup** | Low | T1 | Search by name, ID, or contact. Must be fast (<1s) on local data. |
| T3 | **Patient profile with history** | Medium | T1, T5, T6 | Chronological view of all encounters and prescriptions for a patient. |
| T4 | **Encounter logging** | Low | T1 | Complaint, examination notes, diagnosis, auto-timestamped. |
| T5 | **Prescription writing** | Medium | T4, T7 | Select medications, set dosage/frequency/duration/notes per line item. Core workflow. |
| T6 | **Prescription printing** (small format) | Medium | T5 | Non-A4 format. Must match clinic's physical slip layout. Print preview essential. |
| T7 | **Local drug database** with common medications pre-loaded | Medium | None | Salt name + brand name. Seeded with common drugs at install. |
| T8 | **Medication autocomplete** | Medium | T7 | Type-ahead search on drug name or salt. This is the speed multiplier for the doctor. |
| T9 | **Dispensary slip** (separate print) | Low | T5 | Medication list only, for the dispenser. Separate from patient prescription. |
| T10 | **Offline-first operation** | High | Service Worker, IndexedDB | 100% functional with no internet. Non-negotiable given clinic context. |
| T11 | **Simple login** (PIN or password) | Low | None | Single-user auth. Prevents unauthorized access to patient data. |
| T12 | **Audit trail** | Low | T1, T4, T5 | Every record timestamped, immutable history. Compliance requirement. |
| T13 | **PWA installability** | Medium | Service Worker, manifest | Install from browser, no app store or .exe. Works on old Windows + Chrome/Edge. |

---

## Differentiators (Competitive Advantage)

Features that elevate this beyond "another clinic app." Prioritized for this specific context (offline, single doctor, speed).

| # | Feature | Complexity | Dependencies | Why It Differentiates |
|---|---------|-----------|--------------|----------------------|
| D1 | **Cloud sync when online** | High | T10 | Most offline-first clinic tools are desktop-only. PWA + cloud sync gives data safety without requiring reliable internet. Conflict resolution strategy needed. |
| D2 | **Sub-2-minute visit workflow** | Medium | T2, T4, T5, T8 | UX designed so the entire flow (find patient -> log encounter -> write prescription -> print) takes <2 min. Requires minimal clicks, smart defaults, keyboard-first navigation. |
| D3 | **Custom medication management** | Low | T7 | Settings area to add/edit medications. Doctor doesn't need a developer to expand the drug list. |
| D4 | **Prescription templates / favorites** | Medium | T5, T7 | Save common prescription combos (e.g., "flu pack": paracetamol + antihistamine + cough syrup). One-click apply. Huge time saver for repeat diagnoses. |
| D5 | **Repeat prescription** from history | Low | T3, T5 | "Prescribe same as last visit" button. Common for chronic patients. |
| D6 | **Drug interaction warnings** (basic) | Medium | T7 | Flag known dangerous combinations from local database. Does not need real-time API, just a local lookup table of critical interactions. Patient safety layer. |
| D7 | **Patient visit statistics** | Low | T3, T4 | Simple dashboard: patients seen today/this week/this month, common diagnoses. Useful for compliance reporting. |
| D8 | **Data export** (CSV/PDF) | Low | T3 | Export patient records or visit logs. Useful for compliance audits or switching systems. |

---

## Anti-Features (Deliberately NOT Building)

Scoped out based on PROJECT.md constraints. Including these would add complexity without value for this user.

| Feature | Why Not |
|---------|---------|
| **Multi-doctor / multi-role support** | Single user. Adding roles means auth complexity, permission systems, session management. All overhead for zero benefit. |
| **Appointment scheduling** | Walk-in clinic. No scheduling workflow exists. Building it creates UI clutter the doctor will never use. |
| **Billing / payments** | Not needed for this clinic. Would require tax logic, receipt printing, payment tracking. Massive scope for no value. |
| **Lab results / imaging integration** | No lab systems to integrate with. Would require HL7/FHIR knowledge and external APIs. |
| **Mobile-native app** | PWA covers mobile via browser. Building native apps means maintaining iOS + Android + web. |
| **Real-time pharmacy network integration** | Requires Surescripts or equivalent. Not applicable in this clinic's context (Pakistan, local dispensary). |
| **AI-powered clinical decision support** | Overkill for a single-doctor tool. Adds model hosting, data pipeline, and liability concerns. Basic drug interaction warnings (D6) are sufficient. |
| **Patient portal / patient-facing features** | Doctor-only tool. Patient self-service adds auth, notifications, and privacy concerns with no demand from the user. |
| **Telemedicine / video consult** | Walk-in clinic. No remote consultation workflow. |
| **Insurance / prior authorization** | Not applicable to this clinic's context. |

---

## Dependency Map

```
T11 (Login)
  |
T1 (Patient Registration)
  |--- T2 (Search)
  |--- T4 (Encounter) --- T5 (Prescription) --- T6 (Print Rx)
  |                            |                    T9 (Dispensary Slip)
  |                            |
  |                         T7 (Drug DB) --- T8 (Autocomplete)
  |                                     --- D3 (Custom Meds)
  |                                     --- D6 (Interaction Warnings)
  |
  T3 (Patient Profile + History) --- D5 (Repeat Rx)
                                  --- D7 (Stats)
                                  --- D8 (Export)

T10 (Offline-first) --- underpins everything
T13 (PWA)          --- underpins T10
D1 (Cloud Sync)    --- depends on T10
D2 (Speed UX)      --- cross-cutting, depends on T2+T4+T5+T8
D4 (Templates)     --- depends on T5+T7
```

---

## Build Order Recommendation

1. **Foundation**: T10 (offline), T13 (PWA), T11 (login)
2. **Core data**: T1 (patients), T7 (drug DB), T12 (audit)
3. **Core workflow**: T2 (search), T4 (encounter), T5 (prescription), T8 (autocomplete)
4. **Output**: T6 (print Rx), T9 (dispensary slip)
5. **History**: T3 (patient profile)
6. **Differentiators**: D2 (speed UX polish), D3 (custom meds), D1 (cloud sync)
7. **Nice-to-have**: D4 (templates), D5 (repeat Rx), D6 (interaction warnings), D7 (stats), D8 (export)

---

*Last updated: 2026-03-05*
