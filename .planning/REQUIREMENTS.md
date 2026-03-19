# Requirements: ClinicSoftware

**Defined:** 2026-03-19
**Core Value:** The doctor can see a patient, write a prescription with medication autocomplete, and print it in under 2 minutes, even with no internet.

## v2.0 Requirements

Requirements for v2.0 Multi-User Sync. Nurse and doctor on separate computers, data syncs over LAN.

### Data Migration

- [x] **MIGR-01**: App migrates all existing patient, visit, prescription, medication, and settings data from the old storage format to the new one on first launch after upgrade, without data loss
- [x] **MIGR-02**: Drug records use stable identifiers so the same drug is never duplicated when both machines start up for the first time
- [x] **MIGR-03**: Migration runs once and never re-runs on subsequent app launches

### Authentication & Roles

- [x] **AUTH-01**: Login screen shows a username field alongside the existing password field
- [x] **AUTH-02**: Doctor and nurse accounts are pre-created; no setup wizard needed
- [x] **AUTH-03**: Doctor has full access to all features (unchanged from today)
- [x] **AUTH-04**: Nurse can only access patient search/creation and vitals recording
- [x] **AUTH-05**: Nurse cannot access prescriptions, medications, print, settings, or backup
- [x] **AUTH-06**: App header shows the logged-in user's role ("Doctor" or "Nurse")

### Sync

- [ ] **SYNC-01**: Data created or edited on one machine appears on the other machine automatically within seconds when both are on the same network
- [ ] **SYNC-02**: If the network drops, both users keep working normally; data syncs automatically when the network returns
- [ ] **SYNC-03**: Sync status (connected/disconnected/last synced) is visible in Settings
- [ ] **SYNC-04**: If the doctor's computer is off, the nurse keeps working; data syncs when the doctor's computer comes back on

### CouchDB Infrastructure

- [x] **INFRA-01**: CouchDB runs as a Windows service on the doctor's machine, starts automatically on boot
- [x] **INFRA-02**: Nurse's browser connects to CouchDB over the clinic's local network
- [x] **INFRA-03**: CouchDB is secured with admin credentials before LAN access is enabled
- [x] **INFRA-04**: Nurse is prevented from writing prescriptions or modifying medications at the database level (not just UI)

### Backup & Restore

- [ ] **BKUP-01**: Manual database export still works, produces a downloadable file
- [ ] **BKUP-02**: Restore uploads data to the shared database; both machines receive the restored data via sync
- [ ] **BKUP-03**: Auto-snapshot system continues to function after the migration

## Previous Milestone Requirements

### v1.4 Slip Assignment & Print Settings (Complete)

- [x] **SLIP-01** through **SLIP-05**: Per-medication slip assignment
- [x] **PRSET-05**, **PRSET-06**: Auto-print toggle

### v1.5 Visit Vitals (Complete)

- [x] **VIT-01** through **VIT-06**: Optional vitals per visit

### v1.6 Unified Medication Management (Complete)

- [x] **MED-01** through **MED-08**: Top-level medications page, override model

## Out of Scope

| Feature | Reason |
|---------|--------|
| Cloud sync / Firebase / Supabase | LAN CouchDB chosen for internet independence |
| Multi-clinic sync | Single clinic, LAN-only sync sufficient |
| Additional roles (receptionist, pharmacist) | Only doctor and nurse needed |
| In-app user management UI | Accounts pre-created during development |
| Manual conflict resolution UI | 2-person role-separated workflow makes conflicts near-zero frequency |
| Sync status on every page | Sync status in Settings only per user decision |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MIGR-01 | Phase 19 | Complete |
| MIGR-02 | Phase 19 | Complete |
| MIGR-03 | Phase 19 | Complete |
| INFRA-01 | Phase 20 | Complete |
| INFRA-02 | Phase 20 | Complete |
| INFRA-03 | Phase 20 | Complete |
| INFRA-04 | Phase 20 | Complete |
| AUTH-01 | Phase 21 | Complete |
| AUTH-02 | Phase 21 | Complete |
| AUTH-03 | Phase 21 | Complete |
| AUTH-04 | Phase 21 | Complete |
| AUTH-05 | Phase 21 | Complete |
| AUTH-06 | Phase 21 | Complete |
| SYNC-01 | Phase 22 | Pending |
| SYNC-02 | Phase 22 | Pending |
| SYNC-03 | Phase 22 | Pending |
| SYNC-04 | Phase 22 | Pending |
| BKUP-01 | Phase 23 | Pending |
| BKUP-02 | Phase 23 | Pending |
| BKUP-03 | Phase 23 | Pending |

**Coverage:**
- v2.0 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 -- traceability complete (Phases 19-23)*
