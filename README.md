# ClinicSoftware

A lightweight, offline-first prescription and patient management app built for a single-doctor clinic. Works entirely in the browser with no server, no cloud, no internet required after first load.

**Live:** [https://4qan.github.io/ClinicSoftware/](https://4qan.github.io/ClinicSoftware/)

## Why This Exists

Built for a clinic in an area with unreliable internet, used by a non-tech-savvy doctor on older Windows hardware. The core goal: see a patient, write a prescription with medication autocomplete, and print it in under 2 minutes, even offline.

## Features

### Patient Management
- Register patients with auto-generated yearly IDs (format: `YYYY-XXXX`)
- Search by name, ID, or contact number
- Patient profile with full visit history

### Prescription Writing
- 120+ pre-loaded drug database with autocomplete
- Form-aware quantity suggestions (tablets, syrups, topicals, etc.)
- Custom drug entry for medications not in the database
- Frequency and duration dropdowns with common clinical values

### Bilingual Printing (English + Urdu)
- A5 prescription slip with Urdu instructions in Nastaliq script
- Dispensary slip for pharmacists
- Bilingual column headers and natural Urdu sentence construction
- Print directly from the browser (Ctrl+P)

### Offline-First
- Full PWA with service worker caching
- All data stored locally in IndexedDB (nothing leaves the device)
- Works without internet after first load
- Nastaliq font cached for offline Urdu rendering

### Data Backup & Restore
- One-click full database export to JSON from Settings > Data tab
- Restore from backup file with validation and inline confirmation
- Smart re-login if credentials change after restore
- Auto-snapshots: silent 24h backups with 3-copy rotation
- Backup includes metadata (app version, schema version, record counts, export date)
- Toast notifications for success/error feedback

### Security
- Local PIN/password authentication (PBKDF2, 100k iterations)
- No cloud, no server, no data transmission
- All patient data is device-local only

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| Styling | TailwindCSS v4 |
| Database | Dexie.js (IndexedDB wrapper) |
| Offline | VitePWA (service worker + manifest) |
| Routing | react-router-dom v7 |
| Urdu Font | Noto Nastaliq Urdu (variable) |
| Testing | Vitest + Testing Library + Playwright |

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Install and Run

```bash
git clone https://github.com/4qan/ClinicSoftware.git
cd ClinicSoftware
npm install
npm run dev
```

Open [http://localhost:5173/ClinicSoftware/](http://localhost:5173/ClinicSoftware/) in Chrome or Edge.

### Build for Production

```bash
npm run build
npm run preview
```

### Run Tests

```bash
npm test              # Unit tests
npm run test:e2e      # E2E tests (Playwright)
```

## Roadmap

### v1.0 MVP (Shipped)
- Patient registration, search, and profiles
- Clinical encounter logging with timestamps
- Prescription writing with drug autocomplete
- A5 prescription and dispensary slip printing

### v1.1 Urdu & Backup (Shipped)
- Urdu prescription printing with Nastaliq font and bilingual headers
- Rx Notes English/Urdu toggle with sticky language preference
- Prescription entry cleanup (field naming, drug display, custom value indicators)
- Full database backup/restore with validation and smart re-login
- Auto-snapshots: silent 24h backups with 3-copy rotation

## Project Structure

```
src/
  components/    # Reusable UI (ComboBox, MedicationEntry, PrescriptionSlip, etc.)
  pages/         # Route pages (NewVisitPage, EditVisitPage, PrintVisitPage, etc.)
  constants/     # Clinical data, translations, drug database
  db/            # Dexie database schema, settings, seed data
  utils/         # Helpers (drug formatters, backup, snapshots, etc.)
  __tests__/     # Unit and component tests
```

## License

Private project. Not open for contributions at this time.
