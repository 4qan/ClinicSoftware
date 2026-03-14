---
phase: 14
slug: print-flow
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + @testing-library/react |
| **Config file** | vite.config.ts (vitest block) |
| **Quick run command** | `npx vitest run src/__tests__/PrintVisitPage.keyboard.test.tsx` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/__tests__/PrintVisitPage.keyboard.test.tsx`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 0 | PRNT-01, PRNT-02, PRNT-03 | unit (component) | `npx vitest run src/__tests__/PrintVisitPage.keyboard.test.tsx` | ❌ W0 | ⬜ pending |
| 14-02-01 | 02 | 1 | PRNT-01 | unit (component) | `npx vitest run src/__tests__/PrintVisitPage.keyboard.test.tsx` | ❌ W0 | ⬜ pending |
| 14-02-02 | 02 | 1 | PRNT-02 | unit (component) | `npx vitest run src/__tests__/PrintVisitPage.keyboard.test.tsx` | ❌ W0 | ⬜ pending |
| 14-02-03 | 02 | 1 | PRNT-03 | unit (component) | `npx vitest run src/__tests__/PrintVisitPage.keyboard.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/PrintVisitPage.keyboard.test.tsx` — stubs for PRNT-01, PRNT-02, PRNT-03
- [ ] No framework or fixture gaps — existing `beforeEach`/`afterEach` setup in `PrintVisitPage.test.tsx` can be copied directly

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Browser print dialog opens on Enter | PRNT-02 | `window.print()` is mocked in jsdom; real dialog behavior is browser-native | 1. Navigate to PrintVisitPage 2. Focus Print button 3. Press Enter 4. Verify browser print dialog opens |
| Focus returns after real print dialog closes | PRNT-03 | `afterprint` event timing varies by browser | 1. Open print dialog 2. Cancel/confirm 3. Verify Print button has focus |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
