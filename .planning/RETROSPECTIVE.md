# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 -- MVP

**Shipped:** 2026-03-06
**Phases:** 3 | **Plans:** 14 | **Commits:** 127

### What Was Built
- Offline-first PWA with IndexedDB persistence and service worker caching
- Full patient lifecycle: registration, search, profiles, encounter logging
- Prescription system with 120+ drug autocomplete and custom medication management
- A5 prescription and compact dispensary slip printing
- Inline patient creation during visits (no page navigation)
- PBKDF2 auth with recovery codes

### What Worked
- Coarse granularity (3 phases for full MVP) kept momentum high
- UAT gap closure plans after each phase caught real UX issues
- Dexie.js made IndexedDB painless: transactions, indexes, migrations
- Shared component extraction (PatientRegistrationForm, ComboBox) paid off across phases
- Phase-by-phase verification caught issues before they compounded

### What Was Inefficient
- Phase 1 had 7 plans (5 original + 2 UAT rounds) for what was essentially setup + CRUD. Could have been tighter.
- REQUIREMENTS.md traceability table was never updated from "Not Started" for Phases 2-3 during execution (only the checkboxes were updated)
- Nyquist validation was set up but never completed for any phase (all 3 show `nyquist_compliant: false`)
- 4 pre-existing login test failures carried through all 3 phases without being fixed

### Patterns Established
- ComboBox pattern for clinical fields: dropdown with free-text input
- Medications as snapshots (not live references) for prescription stability
- Settings organized by category tabs (Account, Medications, Clinic Info)
- @media print with @page A5 for browser-native printing
- Auto-print via URL params (?auto=prescription|dispensary) for one-click flows

### Key Lessons
1. UAT gap closure rounds are essential. Every phase needed one. Budget for it.
2. Inline creation (patient in visit form) is worth the complexity. Page navigation breaks workflow.
3. Pre-seeded data (drugs) needs idempotent versioning from day one. Retrofit is painful.
4. Test failures that "aren't related to this phase" still need fixing. They erode confidence in the suite.

### Cost Observations
- Model mix: ~60% sonnet (execution), ~30% opus (planning/verification), ~10% haiku (agents)
- Sessions: ~8 across 2 days
- Notable: Full MVP in 2 days with AI-assisted development

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Commits | Phases | Key Change |
|-----------|---------|--------|------------|
| v1.0 | 127 | 3 | First milestone. Established GSD workflow. |

### Cumulative Quality

| Milestone | Tests | Pass Rate | LOC |
|-----------|-------|-----------|-----|
| v1.0 | 74 | 70/74 (95%) | 6,616 |

### Top Lessons (Verified Across Milestones)

1. (Will populate as more milestones complete)
