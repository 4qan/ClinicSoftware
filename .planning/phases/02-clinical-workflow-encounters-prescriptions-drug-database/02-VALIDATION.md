---
phase: 2
slug: clinical-workflow-encounters-prescriptions-drug-database
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-06
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts (or vite.config.ts vitest section) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | DRUG-01 | unit | `npx vitest run src/db` | W0 | pending |
| 02-01-02 | 01 | 1 | DRUG-02, DRUG-03 | unit | `npx vitest run src/db` | W0 | pending |
| 02-01-03 | 01 | 1 | DRUG-04 | unit | `npx vitest run src/hooks` | W0 | pending |
| 02-02-01 | 02 | 1 | ENC-01, ENC-02 | unit+component | `npx vitest run src/pages` | W0 | pending |
| 02-02-02 | 02 | 1 | RX-01, RX-02 | component | `npx vitest run src/components` | W0 | pending |
| 02-02-03 | 02 | 1 | RX-03, RX-04 | unit | `npx vitest run src/hooks` | W0 | pending |
| 02-03-01 | 03 | 2 | ENC-03 | component | `npx vitest run src/pages` | W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] Install vitest + @testing-library/react if not present
- [ ] `src/db/__tests__/drugs.test.ts` — stubs for DRUG-01 through DRUG-04
- [ ] `src/hooks/__tests__/useDrugSearch.test.ts` — stubs for RX-03, RX-04
- [ ] `src/pages/__tests__/NewVisitPage.test.ts` — stubs for ENC-01, ENC-02, RX-01, RX-02

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Autocomplete < 300ms on old hardware | RX-04 | Performance varies by device | Type partial drug name, visually confirm suggestions appear near-instantly |
| Visit history reverse chronological | ENC-03 | Visual ordering check | Create 3 visits, verify newest appears first on patient profile |
| Collapsible sections UX | N/A (context decision) | Layout/interaction quality | Verify patient info collapses, prescription area expands |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
