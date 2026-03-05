---
phase: 1
slug: foundation-and-patient-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-05
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x + Testing Library + Playwright |
| **Config file** | vitest.config.ts / playwright.config.ts (Wave 0 installs) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run && npx playwright test` |
| **Estimated runtime** | ~15 seconds (unit/component), ~30 seconds (E2E) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run && npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | FOUND-01 | E2E | `npx playwright test pwa` | W0 | pending |
| 01-01-02 | 01 | 1 | FOUND-02 | E2E | `npx playwright test offline` | W0 | pending |
| 01-01-03 | 01 | 1 | FOUND-03 | unit | `npx vitest run sw` | W0 | pending |
| 01-01-04 | 01 | 1 | FOUND-04 | component | `npx vitest run auth` | W0 | pending |
| 01-01-05 | 01 | 1 | FOUND-05 | unit | `npx vitest run timestamps` | W0 | pending |
| 01-02-01 | 02 | 1 | PAT-01 | component | `npx vitest run registration` | W0 | pending |
| 01-02-02 | 02 | 1 | PAT-02 | unit | `npx vitest run patient-id` | W0 | pending |
| 01-02-03 | 02 | 1 | PAT-03 | component | `npx vitest run search` | W0 | pending |
| 01-02-04 | 02 | 1 | PAT-04 | component | `npx vitest run profile` | W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `vitest` + `@testing-library/react` + `jsdom` — test framework install
- [ ] `fake-indexeddb` — in-memory IndexedDB for unit/component tests
- [ ] `playwright` + `@playwright/test` — E2E framework install
- [ ] `vitest.config.ts` — Vitest configuration with jsdom environment
- [ ] `playwright.config.ts` — Playwright configuration
- [ ] `src/__tests__/setup.ts` — shared test setup (fake-indexeddb init)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PWA install prompt on Chrome/Windows | FOUND-01 | Browser-specific install UX | Open in Chrome on Windows, verify install icon appears in address bar |
| App survives browser restart | FOUND-02 | Requires actual browser restart | Close Chrome completely, reopen, verify data persists |
| UI readability for elderly user | PAT-01 | Subjective UX assessment | Verify large text, obvious buttons, simple flow on actual screen |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
