---
phase: 11
slug: layout-scaling-preview
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + @testing-library/react |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/__tests__/PrescriptionSlip.test.tsx src/__tests__/DispensarySlip.test.tsx src/__tests__/PrintVisitPage.test.tsx` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/__tests__/PrescriptionSlip.test.tsx src/__tests__/DispensarySlip.test.tsx src/__tests__/PrintVisitPage.test.tsx`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 0 | SCALE-01 | unit | `npx vitest run src/__tests__/PrescriptionSlip.test.tsx` | ❌ W0 | ⬜ pending |
| 11-01-02 | 01 | 0 | SCALE-02 | unit | `npx vitest run src/__tests__/DispensarySlip.test.tsx` | ❌ W0 | ⬜ pending |
| 11-01-03 | 01 | 0 | SCALE-04 | unit | `npx vitest run src/__tests__/PrintVisitPage.test.tsx` | ✅ (extend) | ⬜ pending |
| 11-02-01 | 02 | 1 | SCALE-01 | unit | `npx vitest run src/__tests__/PrescriptionSlip.test.tsx` | ❌ W0 | ⬜ pending |
| 11-02-02 | 02 | 1 | SCALE-02 | unit | `npx vitest run src/__tests__/DispensarySlip.test.tsx` | ❌ W0 | ⬜ pending |
| 11-02-03 | 02 | 1 | SCALE-03 | unit | `npx vitest run src/__tests__/PrescriptionSlip.test.tsx` | ❌ W0 | ⬜ pending |
| 11-02-04 | 02 | 1 | SCALE-04 | unit | `npx vitest run src/__tests__/PrintVisitPage.test.tsx` | ✅ (extend) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/PrescriptionSlip.test.tsx` — stubs for SCALE-01, SCALE-03
- [ ] `src/__tests__/DispensarySlip.test.tsx` — stubs for SCALE-02
- [ ] Update `src/__tests__/PrintVisitPage.test.tsx` — A6 badge test replaced with A6-fallback test, preview frame dimension tests

*Existing infrastructure covers framework needs. No new packages required.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Urdu/Nastaliq no clipping at A4/Letter | SCALE-03 | jsdom cannot render actual Nastaliq glyphs | Print A4 prescription slip with long Urdu instruction; visually confirm no descender/diacritic clipping |
| Preview frame visually matches paper proportions | SCALE-04 | Proportional visual correctness requires human eye | Open print page, switch sizes, confirm preview frame changes proportionally |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
