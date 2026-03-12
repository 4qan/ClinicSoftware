---
phase: 11-layout-scaling-preview
verified: 2026-03-12T19:53:00Z
status: human_needed
score: 7/7 must-haves verified
human_verification:
  - test: "Confirm A6 is absent from the Settings dropdown UI"
    expected: "Print settings page shows only A5, A4, Letter as selectable options; no A6 entry visible"
    why_human: "PAPER_SIZE_ORDER drives the dropdown dynamically; absence of A6 in source is confirmed, but the rendered dropdown needs eyeball confirmation"
  - test: "Confirm A4 prescription preview frame is visibly larger than A5 frame on screen"
    expected: "Switching paper size from A5 to A4 in settings then opening print page shows a wider/taller frame; A5 frame is physically smaller on screen"
    why_human: "Pixel math checks out (414px vs 588px wide) but visual proportionality and screen fit need human confirmation"
  - test: "Print A4 prescription with Urdu medication instruction and confirm no descender/diacritic clipping"
    expected: "Urdu Nastaliq text renders cleanly at A4 size (line-height 2.6) with no clipping of descenders or above-baseline diacritics"
    why_human: "URDU_LINE_HEIGHTS A4/Letter values (2.6) are documented starting estimates in the codebase; empirical print verification is required per the plan"
---

# Phase 11: Layout Scaling and Preview Verification Report

**Phase Goal:** Remove A6 paper size, add proportional layout scaling for PrescriptionSlip and DispensarySlip based on selected paper size, and wrap slips in an on-screen preview frame that reflects paper proportions.
**Verified:** 2026-03-12T19:53:00Z
**Status:** human_needed
**Re-verification:** No - initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A6 is no longer a selectable paper size anywhere in the app | VERIFIED | `PaperSize` type is `'A5' \| 'A4' \| 'Letter'`; `PAPER_SIZE_ORDER = ['A5', 'A4', 'Letter']`; zero A6 references in any production `.ts`/`.tsx` file |
| 2 | A stored A6 value in IndexedDB silently falls back to A5 | VERIFIED | `coerceSize()` in `printSettings.ts` validates against `VALID_SIZES`; test `returns A5 when DB contains A6 for prescriptionSize (fallback)` passes |
| 3 | Prescription slip font sizes visibly differ between A5 and A4 | VERIFIED | `calcScale('A4') = 210/148 ~1.419`; `basePt = +(11 * scale).toFixed(1)` applied to root div `fontSize`; PrescriptionSlip.test.tsx 8 tests pass |
| 4 | Urdu text on prescription slip has per-size line-height (not hardcoded 2.2) | VERIFIED | `src/index.css` `.urdu-cell` uses `line-height: var(--urdu-line-height, 2.2)`; root div sets `--urdu-line-height: URDU_LINE_HEIGHTS[paperSize]`; 3 CSS custom property tests pass |
| 5 | Dispensary slip font sizes visibly differ between A5 and A4 | VERIFIED | `DispensarySlip` applies `calcScale(paperSize)` with 10pt base; maxWidth set from `PAPER_SIZES[paperSize].width`; DispensarySlip.test.tsx 7 tests pass |
| 6 | Print preview shows a bordered frame whose proportions match the selected paper size | VERIFIED | `previewDimensions(size)` computes `widthPx = Math.round(width * 2.8)`, `heightPx = Math.round(height * 2.8)`; `data-testid="preview-frame"` div styled with these values; 3 PrintVisitPage frame dimension tests pass |
| 7 | Preview shows live visit data, not placeholder content | VERIFIED | Preview frame renders `PrescriptionSlip`/`DispensarySlip` with `visit`, `patient`, `medications` props; no placeholder text in component bodies |

**Score:** 7/7 truths verified (automated)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/db/printSettings.ts` | A6-free PaperSize type, calcScale(), URDU_LINE_HEIGHTS, PAGE_SIZE_KEYWORD | VERIFIED | All exports present; A6 absent from type, PAPER_SIZES, PAPER_SIZE_ORDER |
| `src/components/PrescriptionSlip.tsx` | Scaled slip accepting paperSize prop | VERIFIED | `paperSize: PaperSize` in props; `calcScale` called; `--urdu-line-height` set on root |
| `src/components/DispensarySlip.tsx` | Scaled slip accepting paperSize prop | VERIFIED | `paperSize: PaperSize` in props; `calcScale` called; `--urdu-line-height` set on root |
| `src/pages/PrintVisitPage.tsx` | Preview frame with paper-proportional dimensions | VERIFIED | `previewDimensions()` helper present; `data-testid="preview-frame"` div with computed width/minHeight; `activeSize` logic derived from `previewMode` |
| `src/index.css` | Dynamic Urdu line-height via CSS custom property | VERIFIED | `.urdu-cell` uses `var(--urdu-line-height, 2.2)` |
| `src/__tests__/PrescriptionSlip.test.tsx` | Tests for SCALE-01 and SCALE-03 | VERIFIED | 8 tests covering A5/A4/Letter font scaling and --urdu-line-height; all pass |
| `src/__tests__/DispensarySlip.test.tsx` | Tests for SCALE-02 | VERIFIED | 7 tests covering A5/A4/Letter font scaling and --urdu-line-height; all pass |
| `src/__tests__/PrintVisitPage.test.tsx` | Tests for SCALE-04 preview frame | VERIFIED | 3 new preview frame dimension tests; A6-fallback-to-A5 test; 20 tests total, all pass |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `PrescriptionSlip.tsx` | `printSettings.ts` | `calcScale(paperSize)` | WIRED | `calcScale` imported and called at line 25; `PAPER_SIZES`, `URDU_LINE_HEIGHTS` also used |
| `index.css` | `PrescriptionSlip.tsx` | `var(--urdu-line-height, 2.2)` | WIRED | CSS reads `var(--urdu-line-height, 2.2)` on `.urdu-cell`; component sets `'--urdu-line-height'` on root div |
| `DispensarySlip.tsx` | `printSettings.ts` | `calcScale(paperSize)` | WIRED | `calcScale` imported and called at line 22; `PAPER_SIZES`, `URDU_LINE_HEIGHTS` used |
| `PrintVisitPage.tsx` | `printSettings.ts` | `PAPER_SIZES` for preview frame dimensions | WIRED | `PAPER_SIZES[size].width/height` consumed inside `previewDimensions()`; `PAGE_SIZE_KEYWORD` used for `@page` injection |
| `PrintVisitPage.tsx` | `PrescriptionSlip.tsx` | `paperSize` prop passed to slip | WIRED | `paperSize={activeSize}` in preview frame render; `paperSize={printSettings?.prescriptionSize ?? 'A5'}` in print-only render |
| `PrintVisitPage.tsx` | `DispensarySlip.tsx` | `paperSize` prop passed to slip | WIRED | `paperSize={activeSize}` in preview frame render; `paperSize={printSettings?.dispensarySize ?? 'A5'}` in print-only render |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SCALE-01 | 11-01 | Prescription slip fonts/spacing scale proportionally to selected paper size | SATISFIED | `calcScale()` applied; font sizes computed per paper width ratio from A5 baseline; 5 scaling tests pass |
| SCALE-02 | 11-02 | Dispensary slip fonts/spacing scale proportionally to selected paper size | SATISFIED | Same pattern applied to `DispensarySlip`; 4 scaling tests pass |
| SCALE-03 | 11-01 | Urdu/Nastaliq text renders correctly at all supported paper sizes | SATISFIED (automated) / NEEDS HUMAN (print) | `--urdu-line-height` CSS custom property wired end-to-end; A4/Letter values (2.6) are empirical estimates requiring print verification |
| SCALE-04 | 11-02 | On-screen print preview reflects selected paper size proportions | SATISFIED | `previewDimensions()` returns proportional px values; `data-testid="preview-frame"` styled accordingly; 3 dimension tests pass |

No orphaned requirements found. All four SCALE requirements are claimed by plans and have evidence.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/pages/PrintVisitPage.tsx` | ~95-99 | `setTimeout(() => window.print(), 200)` in auto-print path | Info | Necessary workaround for print dialog timing; not a stub |
| `src/pages/PrintVisitPage.tsx` | ~119 | `setTimeout(() => window.print(), 100)` in handlePrint | Info | Same pattern; consistent with above |

No blockers. No placeholder implementations. No TODO/FIXME/stub patterns found in modified files.

---

### Human Verification Required

#### 1. Settings dropdown excludes A6

**Test:** Open the app, navigate to Settings > Print tab, inspect both the Prescription Size and Dispensary Size dropdowns.
**Expected:** Exactly three options visible: A5, A4, Letter. No A6 option present.
**Why human:** The dropdown is rendered dynamically from `PAPER_SIZE_ORDER`. Source verification confirms A6 is absent, but the rendered output needs eyeball confirmation.

#### 2. Preview frame proportions visible on screen

**Test:** Set prescription size to A5. Navigate to any visit's print page. Note the preview frame size. Then change prescription size to A4 and return to the print page.
**Expected:** A4 preview frame is visibly wider (588px vs 414px) and taller (832px vs 588px) than A5 frame. Content fills the space.
**Why human:** Pixel dimensions are mathematically correct per tests, but whether the scaling feels right and fits 1200px screens with breathing room needs visual confirmation.

#### 3. Urdu rendering at A4/Letter paper size (SCALE-03 print test)

**Test:** Set prescription to A4. Navigate to a visit with a medication that has a long Urdu instruction (e.g., "ایک گولی صبح اور ایک شام کو کھانے کے بعد"). Click Print Prescription and observe the print preview.
**Expected:** Urdu Nastaliq text renders cleanly with no clipping of descenders or above-baseline diacritics. Line-height (2.6) provides enough breathing room at A4 size.
**Why human:** `URDU_LINE_HEIGHTS` A4/Letter values are explicitly documented as starting estimates in the codebase. The Nastaliq font scales non-linearly and empirical print testing is required per the plan. If clipping occurs, the values need tuning.

---

### Gaps Summary

No automated gaps. All 7 observable truths verified, all artifacts substantive and wired, all key links confirmed. The three human verification items are quality/UX checks, not functional blockers.

The one design note worth flagging: `URDU_LINE_HEIGHTS` A4 and Letter values (2.6) are documented estimates. If print testing reveals descender clipping, a follow-up plan will need to tune these values. This is expected and tracked.

---

_Verified: 2026-03-12T19:53:00Z_
_Verifier: Claude (gsd-verifier)_
