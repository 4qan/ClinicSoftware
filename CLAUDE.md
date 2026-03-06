# ClinicSoftware

Offline-first PWA for patient management and prescription writing. All data stored locally in IndexedDB.

## Deployment

- **Repo:** https://github.com/4qan/ClinicSoftware (public)
- **Live:** https://4qan.github.io/ClinicSoftware/
- **Deploy:** Auto-deploys to GitHub Pages on push to `main`
- **Base path:** `/ClinicSoftware/` (configured in vite.config.ts and BrowserRouter)

## Security

- **Public repo.** Never commit secrets, API keys, credentials, .env files, or patient data to this repository.
- All patient data is client-side only (IndexedDB). No data leaves the user's device.
- Auth is local PIN/password hashing (PBKDF2), not a server-side system.

## Stack

- React 19 + TypeScript + Vite
- TailwindCSS v4
- Dexie.js (IndexedDB wrapper)
- VitePWA (service worker + manifest)
- react-router-dom v7
