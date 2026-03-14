---
phase: 12
slug: focus-foundation-and-form-submission
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + @testing-library/react 16.x |
| **Config file** | `vitest.config.ts` (root) |
| **Quick run command** | `npm test -- --reporter=dot` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- src/__tests__/focus.test.tsx src/__tests__/login.test.tsx src/__tests__/registration.test.tsx`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | FOCUS-01 | unit (component) | `npm test -- src/__tests__/focus.test.tsx` | Wave 0 gap | ⬜ pending |
| 12-01-02 | 01 | 1 | FOCUS-02 | unit (component) | `npm test -- src/__tests__/focus.test.tsx` | Wave 0 gap | ⬜ pending |
| 12-01-03 | 01 | 1 | FOCUS-03 | unit (component) | `npm test -- src/__tests__/focus.test.tsx` | Wave 0 gap | ⬜ pending |
| 12-02-01 | 02 | 1 | FORM-01 | unit (component) | `npm test -- src/__tests__/login.test.tsx` | Exists (partial) | ⬜ pending |
| 12-02-02 | 02 | 1 | FORM-02 | unit (component) | `npm test -- src/__tests__/registration.test.tsx` | Exists (partial) | ⬜ pending |
| 12-02-03 | 02 | 1 | FORM-03 | unit (component) | `npm test -- src/__tests__/focus.test.tsx` | Wave 0 gap | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/focus.test.tsx` -- stubs for FOCUS-01, FOCUS-02, FOCUS-03, FORM-03
- [ ] Extend `src/__tests__/login.test.tsx` -- add Enter-key submission test for FORM-01
- [ ] Extend `src/__tests__/registration.test.tsx` -- add Enter-key submission test for FORM-02

*Existing test infrastructure (vitest + @testing-library/react + jsdom) covers all needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Focus ring visible only on keyboard nav, not mouse click | FOCUS-02 | jsdom does not implement `:focus-visible` pointer tracking | 1. Tab through login page, verify blue outline appears. 2. Click same element with mouse, verify no outline. |
| Tab order matches visual layout on all critical-path pages | FOCUS-03 | Tab order is DOM-order dependent, requires visual confirmation | Tab through each critical-path page. Verify focus moves top-to-bottom, left-to-right matching visual layout. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
