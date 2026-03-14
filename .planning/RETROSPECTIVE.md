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

## Milestone: v1.1 -- Urdu & Backup

**Shipped:** 2026-03-11
**Phases:** 7 | **Plans:** 14 | **Commits:** 93

### What Was Built
- Urdu prescription printing: Nastaliq font, RTL layout, bilingual headers, natural Urdu dosage instructions
- Rx Notes English/Urdu toggle with sticky preference and correct print rendering
- Prescription entry cleanup: dosage-to-quantity rename, drug display split, amber indicators
- Full database backup/restore with validation, inline confirmation, smart re-login
- Auto-snapshots: silent 24h backups with 3-copy rotation in separate Dexie DB
- Toast notification system (createPortal, auto-dismiss, error manual close)

### What Worked
- Phase isolation: Urdu track (4-6) and Backup track (7-9) had clean boundaries
- Inserted Phase 5.1 handled well: decimal numbering, clear scope, no disruption
- Dexie migration strategy (v2->v3->v4) with upgrade callbacks kept data safe
- Separate Dexie DB for snapshots avoided schema conflicts with restore operations
- TDD approach for snapshot data layer (Phase 9-01) caught edge cases early
- Discriminated unions for ValidationResult made error handling exhaustive

### What Was Inefficient
- REQUIREMENTS.md traceability table never updated for RX-CLEANUP-01 through RX-CLEANUP-04 (inserted phase requirements)
- BKUP-05 checkbox left as `[ ] Pending` in REQUIREMENTS.md despite being dropped (inconsistency caught only at audit)
- SUMMARY.md files used `provides` instead of `requirements-completed` frontmatter, making automated extraction harder
- Nyquist validation still partial across all phases (carried over from v1.0)
- 4 login.test.tsx failures still unfixed (carried over from v1.0)

### Patterns Established
- Form-aware quantity system: form inferred from drug, quantity stores raw value
- Natural Urdu sentence construction with form-specific verbs
- Segmented toggle pattern (En/Urdu pill control)
- Settings tab extension: SettingsCategory union + TABS array + conditional render
- Backup file format with metadata header + data section (shared across export, restore, snapshots)
- Smart re-login: compare auth hash pre/post restore
- Fire-and-forget side effects on app load (snapshots parallel with drug seeding)

### Key Lessons
1. Inserted phases need their requirements added to REQUIREMENTS.md traceability immediately, not just the ROADMAP.
2. Dropped requirements should be marked as DROPPED in all docs at decision time, not left as pending.
3. Separate databases for auxiliary data (snapshots) is a clean pattern that avoids restore conflicts.
4. The 4 login test failures are now a 2-milestone-old debt. Must fix in next milestone or delete.
5. Form-aware Urdu translations were more complex than expected but delivered better UX than literal translations.

### Cost Observations
- Model mix: ~55% sonnet (execution), ~35% opus (planning/verification), ~10% haiku (agents)
- Sessions: ~12 across 5 days
- Notable: Urdu RTL integration was the hardest part; backup system was straightforward

---

## Milestone: v1.2 -- Print Customization

**Shipped:** 2026-03-12
**Phases:** 2 | **Plans:** 4 | **Commits:** 16

### What Was Built
- Print Management settings with independent paper size selection per slip type
- Dynamic @page CSS injection with conditional slip rendering (DOM isolation)
- Proportional scaling infrastructure: calcScale from A5 baseline, URDU_LINE_HEIGHTS per size
- PrescriptionSlip and DispensarySlip scale fonts/spacing/content to selected paper size
- On-screen preview frame with paper-proportional pixel dimensions
- Legacy A6 coercion (coerceSize) and auto-print double-fire guard

### What Worked
- Tight milestone scope (2 phases, 11 requirements) kept execution focused
- Phase 10 (infrastructure) cleanly separated from Phase 11 (scaling/preview): no coupling issues
- A5-baseline scaling pattern is simple and extensible (just add new sizes to PAPER_SIZES)
- coerceSize() for legacy data handled the A6 removal without breaking existing installs
- Auto-save on dropdown change (no Submit button) matched the low-friction UX pattern from v1.1

### What Was Inefficient
- ROADMAP.md Phase 11 plan checkboxes were `[ ]` (unchecked) despite both plans being complete with summaries
- STATE.md was still showing "Phase 10, Ready to plan, 0%" despite all 4 plans being complete
- Nyquist validation still partial (third milestone in a row)
- URDU_LINE_HEIGHTS A4/Letter values are estimates (2.6) that need real print calibration
- 4 login.test.tsx failures still unfixed (third milestone carrying this debt)

### Patterns Established
- calcScale(paperSize) = width ratio from A5 baseline for proportional font sizing
- CSS custom property bridge: component sets --urdu-line-height, CSS reads var()
- PAGE_SIZE_KEYWORD map: CSS named keywords for browser print dialog compliance
- Preview frame pattern: always-mounted no-print div with print-only content in hidden print:block divs
- useRef boolean guard for one-shot side effects (auto-print)

### Key Lessons
1. STATE.md and ROADMAP.md drift during execution. Need automation or discipline to keep them current.
2. Two-phase milestones are efficient: minimal overhead, clear scope, fast turnaround.
3. CSS named page size keywords work better than raw mm dimensions for Chrome print dialog.
4. The login test debt is now 3 milestones old. Non-negotiable: fix or delete in v1.3.
5. Preview frame "always mounted" pattern elegantly solved the screen-to-print flash issue.

### Cost Observations
- Model mix: ~50% sonnet (execution), ~40% opus (planning/verification), ~10% haiku (agents)
- Sessions: ~4 across 2 days
- Notable: Smallest milestone yet. Clean scope, fast delivery.

---

## Milestone: v1.3 -- Keyboard Navigation

**Shipped:** 2026-03-15
**Phases:** 3 | **Plans:** 6 | **Commits:** 10

### What Was Built
- Global :focus-visible CSS rule with keyboard-only focus indicators
- Shared useAutocompleteKeyboard hook for all 4 autocomplete consumers
- Consolidated drug search with focus transitions (drug to quantity, add to drug search, custom drug to form)
- Patient search keyboard nav with inline form Escape/dismiss and post-create focus
- Keyboard-driven print flow: tab path, autoFocus print button, afterprint focus restore
- Full keyboard-only critical path: login through printing

### What Worked
- Collapsed from 5 phases to 3 during planning (FMGT-03, ESC-02, ESC-03 folded into Phase 13; phases 14/15 merged). Tight scope.
- Shared hook pattern (useAutocompleteKeyboard) eliminated duplication across 4 consumers with zero coupling issues
- pendingFocus flag pattern solved React async state/focus timing elegantly
- Phase-level verification caught the FOCUS-02 gap (wrong file paths in plan) before milestone completion
- 48+ keyboard navigation tests written, all passing

### What Was Inefficient
- Plan 12-01 referenced wrong file paths (src/pages/LoginPage.tsx instead of src/auth/LoginPage.tsx), causing FOCUS-02 gap that wasn't caught until verification
- focus-styles.test.tsx audit scope didn't include src/auth/, allowing the violation to persist through execution
- SUMMARY.md frontmatter requirements_completed was incomplete for several plans (12-02, 13-03, 14-01 had empty arrays)
- login.test.tsx 4 failures still unfixed (4th milestone carrying this debt)
- Nyquist validation still draft for all 3 phases (4th milestone with partial compliance)

### Patterns Established
- useAutocompleteKeyboard: generic hook with ArrowDown/Up/Enter/Escape/Tab for any dropdown
- pendingFocus flags: boolean state triggers useEffect to focus refs after React render cycle
- tabIndex={-1} on chrome elements: removes from tab flow without hiding
- document-level keydown listener for Escape on dynamically unmounted elements
- patientDropdownDismissed: explicit dismiss flag for derived dropdown visibility

### Key Lessons
1. File path verification in plans is critical. The wrong path in plan 12-01 caused the only real gap in the milestone. Plans should verify paths exist before referencing them.
2. Test audit scope must match cleanup scope. If you clean src/components/ and src/pages/, the audit test must scan those exact directories plus any others with similar code.
3. SUMMARY.md requirements_completed frontmatter needs discipline. 3 of 6 plans had empty arrays, making automated traceability unreliable.
4. The login.test.tsx failures are now 4 milestones old. This is a real problem for test suite confidence. Must fix or delete.
5. Collapsing 5 phases to 3 was the right call: keyboard navigation has tight coupling between autocomplete, focus management, and escape handling. Splitting them would have caused integration churn.

### Cost Observations
- Model mix: ~50% sonnet (execution), ~40% opus (planning/verification/audit), ~10% haiku (agents)
- Sessions: ~3 across 1 day
- Notable: Fastest milestone yet. Tight scope, shared hook pattern, clean execution.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Commits | Phases | Key Change |
|-----------|---------|--------|------------|
| v1.0 | 127 | 3 | First milestone. Established GSD workflow. |
| v1.1 | 93 | 7 | First inserted phase (5.1). Two parallel tracks (Urdu + Backup). |
| v1.2 | 16 | 2 | Tightest milestone. Infrastructure + scaling in clean two-phase split. |
| v1.3 | 10 | 3 | Fastest milestone. Shared hook pattern, phase collapse from 5 to 3. |

### Cumulative Quality

| Milestone | Tests | Pass Rate | LOC |
|-----------|-------|-----------|-----|
| v1.0 | 74 | 70/74 (95%) | 6,616 |
| v1.1 | 187 | 183/187 (98%) | 9,761 |
| v1.2 | 222+ | ~98% | 10,666 |
| v1.3 | 303 | 299/303 (99%) | 12,164 |

### Top Lessons (Verified Across Milestones)

1. REQUIREMENTS.md traceability must be updated when scope changes (inserted phases, dropped requirements). v1.0 and v1.1 both had drift; v1.2 was clean.
2. Pre-existing test failures compound across milestones. 4 login.test.tsx failures now 3 milestones old. Fix or delete, don't carry.
3. Nyquist validation needs to be completed during phases, not retrofitted. Three milestones with partial compliance.
4. Phase isolation (clean boundaries, explicit dependencies) enables parallel tracks and smooth insertion.
5. STATE.md/ROADMAP.md drift during execution is a recurring pattern. Automation or end-of-plan sync needed.
6. Tight milestones (2 phases) deliver faster with less overhead than broad ones.
