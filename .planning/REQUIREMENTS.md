# Requirements: ClinicSoftware

**Defined:** 2026-03-06
**Core Value:** The doctor can see a patient, write a prescription with medication autocomplete, and print it in under 2 minutes, even with no internet.

## v1.1 Requirements

Requirements for v1.1 milestone. Each maps to roadmap phases.

### Urdu Prescription Printing

- [ ] **URDU-01**: Predefined dosage, frequency, and duration options have Urdu translation mappings (~50 entries)
- [ ] **URDU-02**: Printed prescription slip shows dosage, frequency, and duration in Urdu (Nastaliq script)
- [ ] **URDU-03**: Nastaliq font (Noto Nastaliq Urdu) is self-hosted and cached by service worker for offline use
- [ ] **URDU-04**: RTL text renders correctly in prescription print layout with mixed LTR/RTL content (English drug names + Urdu dosage)
- [ ] **URDU-05**: Printed prescription column headers display in Urdu (e.g., دوا, خوراک, دورانیہ)
- [ ] **URDU-06**: Rx Notes field has English/Urdu toggle that switches text direction and font
- [ ] **URDU-07**: Rx Notes print in the language they were written in (correct direction and font)

### Data Backup & Restore

- [ ] **BKUP-01**: User can export full database to a downloadable file from Settings
- [ ] **BKUP-02**: User can restore full database from a backup file via Settings
- [ ] **BKUP-03**: Backup file includes metadata (export date, app version, schema version, record counts)
- [ ] **BKUP-04**: Restore validates backup file and shows metadata before overwriting
- [ ] **BKUP-05**: Auto-safety-backup is created before any restore operation (prevents accidental data loss)
- [ ] **BKUP-06**: App auto-saves in-app backup snapshots every 24 hours (silent, no user interaction)
- [ ] **BKUP-07**: In-app snapshots auto-rotate, keeping only the last 3

## Future Requirements

### Cloud Sync

- **SYNC-01**: Database syncs to cloud backend (Firebase/Supabase)
- **SYNC-02**: User can access same data from multiple devices
- **SYNC-03**: Offline changes sync when connectivity restored

### Urdu Enhancements

- **URDU-08**: Bilingual medication rows (English + Urdu per row) on prescription print
- **URDU-09**: Urdu clinic header (doctor/clinic name in Urdu) on prescription print

### Backup Enhancements

- **BKUP-08**: Selective restore (choose which tables to restore)
- **BKUP-09**: Backup file encryption with user password

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full Urdu UI (menus, buttons, navigation) | Doctor works in English UI. Urdu need is print-only. |
| Urdu keyboard / IME integration | OS-level concern. Windows handles Urdu input natively. |
| Custom Urdu translations per doctor | Predefined options cover 95% of cases. Custom translations add maintenance burden. |
| Urdu drug name search | Drug names are always English in Pakistani medical practice. |
| Multiple font picker | One Nastaliq font is sufficient. |
| Auto-scheduled file downloads | PWA can't write to filesystem without user interaction. In-app snapshots solve this. |
| Incremental/differential backups | Full export is fast for this data volume (~22MB/year). |
| Merge-mode restore | Full replace with auto-safety-backup is sufficient for single-user clinic. |
| Cloud backup | Deferred to cloud sync milestone. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| URDU-01 | 4 (Urdu Foundation) | Pending |
| URDU-02 | 5 (Prescription Print Urdu) | Pending |
| URDU-03 | 4 (Urdu Foundation) | Pending |
| URDU-04 | 5 (Prescription Print Urdu) | Pending |
| URDU-05 | 5 (Prescription Print Urdu) | Pending |
| URDU-06 | 6 (Rx Notes Urdu Toggle) | Pending |
| URDU-07 | 6 (Rx Notes Urdu Toggle) | Pending |
| BKUP-01 | 7 (Backup Export) | Pending |
| BKUP-02 | 8 (Backup Restore) | Pending |
| BKUP-03 | 7 (Backup Export) | Pending |
| BKUP-04 | 8 (Backup Restore) | Pending |
| BKUP-05 | 8 (Backup Restore) | Pending |
| BKUP-06 | 9 (Auto-Snapshots) | Pending |
| BKUP-07 | 9 (Auto-Snapshots) | Pending |

**Coverage:**
- v1.1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0

---
*Requirements defined: 2026-03-06*
*Last updated: 2026-03-06 after roadmap phase mapping*
