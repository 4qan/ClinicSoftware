# Project State: ClinicSoftware

## Project Reference
See: .planning/PROJECT.md (updated 2026-03-05)
**Core value:** The doctor can see a patient, write a prescription with medication autocomplete, and print it in under 2 minutes, even with no internet.
**Current focus:** Phase 2

## Progress
| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 1 | Foundation and Patient Management | Complete | 2/2 complete |
| 2 | Clinical Workflow | Not Started | 3 |
| 3 | Printing and Visit Completion | Not Started | 1 |

## Current Phase
**Phase 2: Clinical Workflow**
Status: Not Started
Current Plan: 1 of 3

## Decisions
- Tailwind CSS 4 with @tailwindcss/vite plugin (Phase 1, Plan 1)
- PBKDF2 100k iterations via Web Crypto API for offline auth (Phase 1, Plan 1)
- Default password "clinic123", session via localStorage flag (Phase 1, Plan 1)
- Dexie.js for IndexedDB with patients, settings, recentPatients tables (Phase 1, Plan 1)
- Search routing: 0/+ prefix to contact, year-prefix digits to patient ID, letters to name (Phase 1, Plan 2)
- Patient ID format YYYY-XXXX with atomic Dexie counter, no gaps from abandoned forms (Phase 1, Plan 2)
- react-router-dom v7 with BrowserRouter for client-side navigation (Phase 1, Plan 2)

## Session
- **Last completed:** Phase 1, Plan 2 (Patient Management UI and Search)
- **Duration:** 9 min
- **Next:** Phase 2, Plan 1

---
*Last updated: 2026-03-05 after completing Phase 1, Plan 2*
