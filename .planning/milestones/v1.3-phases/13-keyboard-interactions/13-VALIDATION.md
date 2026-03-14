---
phase: 13
slug: keyboard-interactions
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + @testing-library/react + @testing-library/user-event |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run src/__tests__/ComboBox.test.tsx src/__tests__/MedicationEntry.test.tsx` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/__tests__/ComboBox.test.tsx src/__tests__/MedicationEntry.test.tsx`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 0 | AUTO-01 | component | `npx vitest run src/__tests__/ComboBox.test.tsx` | ❌ W0 | ⬜ pending |
| 13-01-02 | 01 | 0 | AUTO-02 | component | `npx vitest run src/__tests__/ComboBox.test.tsx` | ❌ W0 | ⬜ pending |
| 13-01-03 | 01 | 0 | AUTO-03 | component | `npx vitest run src/__tests__/ComboBox.test.tsx` | ❌ W0 | ⬜ pending |
| 13-01-04 | 01 | 0 | AUTO-04 | component | `npx vitest run src/__tests__/ComboBox.test.tsx` | ❌ W0 | ⬜ pending |
| 13-01-05 | 01 | 0 | AUTO-05 | component | `npx vitest run src/__tests__/MedicationEntry.test.tsx` | ❌ W0 | ⬜ pending |
| 13-01-06 | 01 | 0 | FMGT-01 | component | `npx vitest run src/__tests__/MedicationEntry.test.tsx` | ❌ W0 | ⬜ pending |
| 13-01-07 | 01 | 0 | FMGT-02 | component | `npx vitest run src/__tests__/MedicationEntry.test.tsx` | ❌ W0 | ⬜ pending |
| 13-01-08 | 01 | 0 | FORM-04 | component | `npx vitest run src/__tests__/MedicationEntry.test.tsx` | ❌ W0 | ⬜ pending |
| 13-01-09 | 01 | 0 | FMGT-03 | component | `npx vitest run src/__tests__/NewVisitPage.keyboard.test.tsx` | ❌ W0 | ⬜ pending |
| 13-01-10 | 01 | 0 | ESC-01 | component | `npx vitest run src/__tests__/ComboBox.test.tsx` | ❌ W0 | ⬜ pending |
| 13-01-11 | 01 | 0 | ESC-02 | component | `npx vitest run src/__tests__/NewVisitPage.keyboard.test.tsx` | ❌ W0 | ⬜ pending |
| 13-01-12 | 01 | 0 | ESC-03 | n/a | SKIPPED (modals use browser-native dialog) | n/a | ⬜ skipped |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/ComboBox.test.tsx` — add keyboard navigation test stubs for AUTO-01, AUTO-02, AUTO-03, AUTO-04, ESC-01
- [ ] `src/__tests__/MedicationEntry.test.tsx` — add keyboard interaction test stubs for AUTO-05, FMGT-01, FMGT-02, FORM-04
- [ ] `src/__tests__/NewVisitPage.keyboard.test.tsx` — new file with stubs for FMGT-03, ESC-02 (requires vi.mock for db modules and MemoryRouter)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| ESC-03 modal dismiss | ESC-03 | SKIPPED per CONTEXT.md (modals use browser-native dialog) | n/a |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
