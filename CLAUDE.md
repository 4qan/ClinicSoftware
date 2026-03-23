# ClinicSoftware

Offline-first PWA for patient management and prescription writing. All data stored locally in IndexedDB.

## Deployment

- **Repo:** https://github.com/4qan/ClinicSoftware (public)
- **Live:** https://4qan.github.io/ClinicSoftware/
- **Deploy:** Auto-deploys to GitHub Pages on push to `main`
- **Base path:** `/ClinicSoftware/` (configured in vite.config.ts and BrowserRouter)

## Security

- **Public repo.** Never commit secrets, API keys, credentials, .env files, or patient data to this repository.
- All patient data stays on the clinic LAN (IndexedDB + CouchDB sync). No cloud, no external calls.
- Auth is CouchDB session auth (`/_session`) with role-based access (doctor/nurse).

## Stack

- React 19 + TypeScript + Vite
- TailwindCSS v4
- PouchDB 9.0.0 (IndexedDB, syncs to CouchDB over LAN)
- VitePWA (service worker + manifest)
- react-router-dom v7
