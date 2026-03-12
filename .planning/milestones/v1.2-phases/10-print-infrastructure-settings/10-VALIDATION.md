---
phase: 10
slug: print-infrastructure-settings
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + @testing-library/react (jsdom) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/__tests__/PrintSettings.test.tsx src/__tests__/PrintVisitPage.test.tsx` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/__tests__/PrintSettings.test.tsx src/__tests__/PrintVisitPage.test.tsx`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | PRSET-04 | unit | `npx vitest run src/__tests__/printSettings.db.test.ts` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 1 | PRENG-02 | unit | `npx vitest run src/__tests__/printSettings.db.test.ts` | ❌ W0 | ⬜ pending |
| 10-01-03 | 01 | 1 | PRSET-01 | unit | `npx vitest run src/__tests__/PrintSettings.test.tsx` | ❌ W0 | ⬜ pending |
| 10-01-04 | 01 | 1 | PRSET-02 | unit | `npx vitest run src/__tests__/PrintSettings.test.tsx` | ❌ W0 | ⬜ pending |
| 10-01-05 | 01 | 1 | PRSET-03 | unit | `npx vitest run src/__tests__/PrintSettings.test.tsx` | ❌ W0 | ⬜ pending |
| 10-02-01 | 02 | 1 | PRENG-01 | unit | `npx vitest run src/__tests__/PrintVisitPage.test.tsx` | ✅ extend | ⬜ pending |
| 10-02-02 | 02 | 1 | PRENG-03 | unit | `npx vitest run src/__tests__/PrintVisitPage.test.tsx` | ✅ extend | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/PrintSettings.test.tsx` — stubs for PRSET-01, PRSET-02, PRSET-03
- [ ] `src/__tests__/printSettings.db.test.ts` — stubs for PRSET-04, PRENG-02 (getPrintSettings defaults + calcMargin)

*Existing `src/__tests__/PrintVisitPage.test.tsx` extended in-place for PRENG-01 and PRENG-03*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Browser print dialog renders correct page dimensions | PRENG-01 | jsdom cannot execute CSS or trigger real print dialog | 1. Set paper size to A4 in Settings > Print, 2. Go to PrintVisitPage, 3. Click Print, 4. Verify print dialog shows A4 dimensions |
| Page margins look proportional on printed output | PRENG-02 | Visual validation required on actual paper | Print same content on A6, A5, A4 and compare margin proportions |
| No ghost content from inactive slip in printed output | PRENG-03 | Print rendering differs from DOM state | Print with prescription slip, verify no dispensary content appears on paper |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
