---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Multi-User Sync
status: planning
stopped_at: null
last_updated: "2026-03-19"
last_activity: 2026-03-19 -- Milestone v2.0 started
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State: ClinicSoftware

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-19)

**Core value:** The doctor can see a patient, write a prescription with medication autocomplete, and print it in under 2 minutes, even with no internet.
**Current focus:** Defining requirements for v2.0 Multi-User Sync

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-03-19 — Milestone v2.0 started

## Accumulated Context

### Decisions

- v1.0 through v1.5 decisions logged in PROJECT.md Key Decisions table
- LAN CouchDB chosen over cloud (unreliable internet, real-time sync needed between nurse and doctor in same building)
- PouchDB replaces Dexie.js (native CouchDB sync protocol, schemaless)
- User accounts pre-created during development (no setup wizard)
- Sequential workflow: nurse screens patient first, doctor sees them after
- Doctor's machine hosts CouchDB as Windows service (auto-starts)
- Backup restore needs sync-aware redesign (can't blindly replace local DB)
- Auto-snapshots may be simplified (CouchDB + two local copies = three copies by default)

### Roadmap Evolution

- Phase 17 (Visit Vitals) and Phase 18 (Unified Medication Management) completed in v1.5
- v2.0 phases start from 19

### Pending Todos

None.

### Blockers/Concerns

- login.test.tsx: 4 pre-existing failures due to BrowserRouter basename="/ClinicSoftware" mismatch in jsdom (carried from v1.3)

## Session Continuity

Last session: 2026-03-19
Stopped at: null
Resume file: None

---
*Last updated: 2026-03-19 -- v2.0 milestone started*
