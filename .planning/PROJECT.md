# ClinicSoftware

## What This Is

A lightweight prescription and patient management PWA for a single-doctor clinic. Works fully offline with IndexedDB, supports patient registration with auto-generated IDs, clinical encounter logging, prescription writing with medication autocomplete from a 120+ drug database, and A5/dispensary slip printing. Designed for a non-tech-savvy doctor on older Windows hardware.

## Core Value

The doctor can see a patient, write a prescription with medication autocomplete, and print it in under 2 minutes, even with no internet.

## Requirements

### Validated

- FOUND-01 through FOUND-05: PWA, offline, service worker, auth, timestamps -- v1.0
- PAT-01 through PAT-04: Patient registration, auto-ID, search, profile -- v1.0
- ENC-01 through ENC-03: Encounter logging, timestamps, history -- v1.0
- RX-01 through RX-04: Prescriptions, medications, autocomplete, performance -- v1.0
- DRUG-01 through DRUG-04: Pre-seeded database, custom drugs, autocomplete integration -- v1.0
- PRINT-01 through PRINT-04: Prescription slip, dispensary slip, print layout, buttons -- v1.0
- VISIT-01 through VISIT-03: Inline patient creation, always-visible form, create-from-search -- v1.0

### Active

(None -- planning next milestone)

### Out of Scope

- Multi-doctor / multi-role support -- single user only
- Mobile-native app -- PWA covers mobile access
- Billing / payments -- not needed
- Appointment scheduling -- walk-in clinic
- Lab results / imaging -- not needed
- Drug interaction warnings -- complexity not justified
- Real-time sync / CRDTs -- single user, single device

## Context

Shipped v1.0 MVP with 6,616 LOC TypeScript/React.
Tech stack: React 19, TypeScript, Vite, TailwindCSS v4, Dexie.js, VitePWA, react-router-dom v7.
Deployed to GitHub Pages at https://4qan.github.io/ClinicSoftware/.
127 commits across 2 days of development.

Clinic is in an area with unreliable internet. Doctor uses an old Windows system with Chrome/Edge. Health compliance team requires full patient records with unique IDs. Prescription paper is small format (A5), two prints per visit (prescription for patient, dispensary for dispenser).

## Constraints

- **Tech**: PWA with offline-first architecture (Service Worker + IndexedDB)
- **UX**: Minimal clicks, large text, obvious navigation. Doctor must not need training.
- **Hardware**: Must work on older Windows machines with Chrome/Edge
- **Data**: All patient data stored locally in IndexedDB
- **Print**: A5-format prescription slips, compact dispensary slips

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PWA over native Windows app | Browser-based, no install, works on any device, offline via Service Worker | Good |
| Offline-first with IndexedDB (no cloud sync in v1) | Unreliable internet, cloud sync deferred to v2 | Good |
| Single-user auth (no roles) | Only the doctor uses the system | Good |
| Local drug database + custom entries | Pre-loaded 120+ drugs, custom entries in settings | Good |
| Patient ID format: YYYY-XXXX | Compliance team recommendation, atomic counter | Good |
| Dexie.js for IndexedDB | Clean API, indexed queries, transaction support | Good |
| PBKDF2 100k iterations via Web Crypto API | Offline auth, no server dependency | Good |
| Medications as snapshots (not live references) | Decouples prescriptions from drug edits | Good |
| RX-05 deferred to v2 | Single-user clinic doesn't need immutability yet | Good |
| A5 print via @media print + @page | Browser-native, no print library dependency | Good |
| Inline patient creation in visit form | Avoids breaking workflow with page navigation | Good |

---
*Last updated: 2026-03-06 after v1.0 milestone*
