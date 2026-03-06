---
phase: 5
slug: prescription-print-urdu
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-06
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | URDU-02 | manual | Print preview checklist | N/A | pending |
| 05-01-02 | 01 | 1 | URDU-04 | manual | Print preview checklist | N/A | pending |
| 05-01-03 | 01 | 1 | URDU-05 | manual | Print preview checklist | N/A | pending |
| 05-01-04 | 01 | 1 | URDU-02 | unit | `npx vitest run` | W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] Translation coverage test: assert all predefined clinical options have Urdu translations
- [ ] Existing test suite passes (no regressions)

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Urdu columns render Nastaliq on print | URDU-02 | Print layout not testable in JSDOM | Chrome print preview with 3-5 medications, verify Nastaliq rendering in Form/Dosage/Freq/Duration columns |
| Bilingual headers on both slips | URDU-04 | Visual layout verification | Print preview both slips, verify English-on-top + Urdu-below headers on all 7 columns |
| Mixed LTR/RTL coexistence | URDU-05 | Visual alignment verification | Print preview, verify English drug names left-aligned while Urdu text renders RTL, no overlap |
| A5 fit with 6+ medications | URDU-05 | Layout stress test | Create prescription with 6+ meds, print preview, verify no overflow or page break within table |
| Fallback for untranslated values | URDU-02 | Edge case visual check | Add medication with custom/freeform values, verify English fallback renders without breakage |
| Ctrl+P actual print matches preview | URDU-05 | Browser print pipeline | Actually print (or Print to PDF) in Chrome/Edge, compare with screen preview |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
