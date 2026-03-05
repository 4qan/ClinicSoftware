# ClinicSoftware

## What This Is

A lightweight prescription and patient management system for a single-doctor clinic. Built as a Progressive Web App (PWA) that works fully offline and syncs to a cloud database when internet is available. Designed for a non-tech-savvy doctor to quickly register patients, record encounters, write prescriptions with medication autocomplete, and print prescription slips and dispensary slips.

## Core Value

The doctor can see a patient, write a prescription with medication autocomplete, and print it in under 2 minutes, even with no internet.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Simple login (single doctor user, PIN or password)
- [ ] Register new patients with auto-generated ID (2026-XXXX format), name, age, gender, contact, optional CNIC
- [ ] Search and look up existing patients quickly
- [ ] View patient profile with full history (encounters, prescriptions)
- [ ] Log patient encounters (complaint, examination notes, diagnosis) with automatic date/time
- [ ] Write prescriptions with medication autocomplete from local drug database (salt name + brand name)
- [ ] Add dosage, frequency, duration, and notes per medication
- [ ] Print prescription slip (small format, not A4)
- [ ] Print separate dispensary slip (medication list only, for dispenser)
- [ ] Full audit trail: every patient, encounter, and prescription timestamped and stored
- [ ] Local drug database with common medications pre-loaded
- [ ] Settings area to add/edit custom medications
- [ ] Offline-first: works 100% without internet using local storage (IndexedDB)
- [ ] Cloud sync when internet is available
- [ ] PWA: installable from browser, no Windows app needed

### Out of Scope

- Multi-doctor / multi-role support — single user only, no staff accounts needed
- Mobile app — PWA covers mobile access via browser
- Billing / payments — not needed for this clinic
- Appointment scheduling — walk-in clinic, no scheduling required
- Lab results / imaging integration — not needed
- Distribution to other doctors — personal use only

## Context

- Clinic is in an area with unreliable internet (can be out for hours or a full day)
- Doctor uses an old Windows system with a browser
- Health compliance team requires full patient records with unique IDs
- Compliance team suggested 2026-based patient ID numbering
- Prescription paper is small format (not full A4), specific letterhead exists but content layout is priority for now
- Two separate prints per visit: prescription (for patient) and dispensary slip (for dispenser)
- Doctor is not tech-savvy, so UI must be extremely simple and fast

## Constraints

- **Tech**: PWA with offline-first architecture (Service Worker + IndexedDB)
- **UX**: Minimal clicks, large text, obvious navigation. Doctor must not need training.
- **Hardware**: Must work on older Windows machines with a modern browser (Chrome/Edge)
- **Data**: All patient data stored locally first, synced to cloud as backup
- **Print**: Small-format prescription slips, separate dispensary slips

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PWA over native Windows app | Browser-based, no install needed, works on any device, offline via Service Worker | — Pending |
| Offline-first with cloud sync | Unreliable internet at clinic, compliance needs data persistence | — Pending |
| Single-user auth (no roles) | Only the doctor uses the system, simplicity over flexibility | — Pending |
| Local drug database + custom entries | Pre-loaded common medications for speed, custom entries in settings for flexibility | — Pending |
| Patient ID format: 2026-XXXX | Compliance team recommendation, auto-incrementing | — Pending |

---
*Last updated: 2026-03-05 after initialization*
