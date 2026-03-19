# ClinicSoftware

An offline-first prescription and patient management PWA built for a real single-doctor clinic operating in an area with unreliable internet, on older Windows hardware, by a non-tech-savvy doctor.

**Live demo:** [4qan.github.io/ClinicSoftware](https://4qan.github.io/ClinicSoftware/)

<!-- TODO: Add screenshot or demo GIF here -->

## The Problem

Small clinics in underserved areas often rely on paper prescriptions and manual record-keeping. Existing EMR/EHR software assumes stable internet, modern hardware, and technical literacy. None of those assumptions hold here.

The core requirement: **see a patient, write a prescription with medication autocomplete, and print it in under 2 minutes, even offline.**

## Approach

Instead of building a traditional client-server app, I went with a **zero-backend architecture**:

- **Offline-first PWA**: Service worker caches everything on first load. No internet needed after that.
- **Browser-local storage**: All data lives in IndexedDB via PouchDB. Nothing leaves the local network.
- **LAN sync (in progress)**: Doctor and nurse machines sync over the local network via CouchDB, with role-based write restrictions. No cloud, no internet required.
- **Local auth**: PBKDF2-hashed passwords stored client-side. No server to authenticate against.
- **Manual backups**: JSON export/import for data portability. The user controls their data.
- **Auto-print control**: Toggle automatic slip printing on/off from settings

This eliminates infrastructure costs, removes network dependency, and keeps patient data on the clinic's machines.

## Features

**Patient Management**
- Registration with auto-generated yearly IDs (`YYYY-XXXX`)
- Search by name, ID, or contact number
- Patient profiles with full visit history

**Prescription Writing**
- 120+ pre-loaded drug database with autocomplete
- Form-aware quantity suggestions (tablets vs syrups vs topicals)
- Custom drug entry for unlisted medications
- Frequency and duration dropdowns with common clinical values
- Per-medication slip assignment: tag each drug as dispensary or prescription
- Each slip prints only its tagged medications

**Vitals**
- Optional vital signs per visit: temperature (F/C toggle), blood pressure, weight, SpO2
- Compact badges in visit history cards for quick clinical reference
- Collapsible input section, all fields optional

**Medications Management**
- Dedicated top-level page for managing all drugs (predefined and custom)
- Full CRUD with search and filtering
- Override model: edit predefined drugs with reset-to-default capability
- Seed-once logic ensures predefined drugs load only on first use

**Bilingual Printing (English + Urdu)**
- Configurable paper sizes (A5, A4, Letter) for prescription and dispensary slips independently
- Proportional layout scaling: fonts, spacing, and content area fill the selected page size
- On-screen preview before printing with paper-proportional dimensions
- Urdu instructions in Nastaliq script with per-size line-height tuning
- Bilingual column headers and natural Urdu sentence construction

**Data Safety**
- One-click full database export/restore with validation
- Auto-snapshots: silent 24-hour backups with 3-copy rotation
- Smart re-login if credentials change after restore

**Keyboard-Only Workflow**
- Full critical path (login to patient to visit to prescription to print) without touching the mouse
- Visible focus indicators on keyboard navigation only (no mouse click rings)
- Streamlined tab order: skips nav chrome, focuses on content
- Arrow key navigation through all autocomplete dropdowns with Enter to select, Tab to confirm and advance
- Intelligent focus transitions: drug select moves to quantity, medication add returns to drug search, patient create moves to visit fields
- Escape to dismiss dropdowns, inline forms, and overlays
- Tab directly to Print button, Enter to print, focus restores after print dialog

**Security**
- Local password authentication (PBKDF2, 100k iterations, random salt)
- Zero data transmission, no cloud, no server
- See [SECURITY.md](SECURITY.md) for details

## Design Decisions

| Constraint | Decision | Why |
|-----------|----------|-----|
| Unreliable internet | Offline-first PWA with full service worker caching | App must work with zero connectivity after first load |
| Non-technical user | Minimal UI, autocomplete-driven workflows, print via Ctrl+P | Reduce training and cognitive load |
| Older hardware | No heavy frameworks, lightweight IndexedDB via PouchDB | Must run smoothly on low-spec Windows machines |
| Patient privacy | All data stays on the clinic LAN, no cloud, no external calls | Data never leaves the physical network |
| Multi-user access | LAN-only CouchDB sync with role-based write restrictions | Doctor and nurse share data without internet; nurse can't modify prescriptions |
| Urdu prescriptions | Noto Nastaliq Urdu font cached locally, bilingual layout engine | Patients need instructions in their language, offline |
| Data durability | JSON backup/restore + auto-snapshots | No cloud means the user needs a simple, reliable backup mechanism |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| Styling | TailwindCSS v4 |
| Database | PouchDB (IndexedDB) with CouchDB LAN sync |
| Offline | VitePWA (service worker + manifest) |
| Routing | react-router-dom v7 |
| Urdu Font | Noto Nastaliq Urdu (variable) |
| Testing | Vitest + Testing Library + Playwright |

## License

This project is source-available for portfolio and reference purposes. Not currently accepting contributions.
