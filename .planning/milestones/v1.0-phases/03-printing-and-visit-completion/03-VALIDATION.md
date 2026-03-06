---
phase: 3
slug: printing-and-visit-completion
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-06
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | VISIT-02 | unit | `npx vitest run src/__tests__/NewVisitPage.test.tsx` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | VISIT-01, VISIT-03 | unit | `npx vitest run src/__tests__/NewVisitPage.test.tsx` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | PRINT-04 | unit | `npx vitest run src/__tests__/VisitCard.test.tsx` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | PRINT-01 | unit | `npx vitest run src/__tests__/PrintVisitPage.test.tsx` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 1 | PRINT-02 | unit | `npx vitest run src/__tests__/PrintVisitPage.test.tsx` | ❌ W0 | ⬜ pending |
| 03-02-04 | 02 | 1 | PRINT-03 | manual | N/A — browser print dialog | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/NewVisitPage.test.tsx` — stubs for VISIT-01, VISIT-02, VISIT-03
- [ ] `src/__tests__/VisitCard.test.tsx` — stubs for PRINT-04 (print link rendering)
- [ ] `src/__tests__/PrintVisitPage.test.tsx` — stubs for PRINT-01, PRINT-02

*Existing vitest infrastructure covers framework installation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| A5 print layout renders correctly in Chrome print preview | PRINT-01, PRINT-03 | Browser print dialog cannot be automated in unit tests | Navigate to `/visit/:id/print`, click "Print Prescription", verify A5 layout in print preview |
| Dispensary slip shows only medications | PRINT-02, PRINT-03 | Browser print dialog verification | Click "Print Dispensary", verify no clinical notes or clinic header in preview |
| No layout shift on patient selection | VISIT-02 | Visual/layout verification | Load `/visit/new`, observe all sections visible but disabled, select patient, confirm no jump |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
