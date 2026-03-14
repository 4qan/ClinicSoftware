---
phase: 12-focus-foundation-and-form-submission
verified: 2026-03-14T13:30:00Z
status: gaps_found
score: 4/5 success criteria verified
gaps:
  - truth: "Focus indicators appear only during keyboard navigation, not when clicking with the mouse"
    status: failed
    reason: "src/auth/LoginPage.tsx and src/auth/ChangePassword.tsx retain legacy focus:ring-2 focus:ring-blue-500 focus:border-blue-500 classes. These Tailwind utilities fire on ALL focus events (including mouse clicks), overriding the global :focus:not(:focus-visible) suppression rule for those elements. The plan listed these as src/pages/ChangePassword.tsx and src/pages/LoginPage.tsx (wrong paths — they live in src/auth/). The class audit test only scans src/components/ and src/pages/, so both files escaped detection."
    artifacts:
      - path: "src/auth/LoginPage.tsx"
        issue: "Lines 77, 96, 120, 161, 186 contain focus:ring-2, focus:ring-blue-500, focus:border-blue-500, focus:ring-offset-2"
      - path: "src/auth/ChangePassword.tsx"
        issue: "Lines 80, 107, 134, 157 contain focus:ring-2, focus:ring-blue-500, focus:border-blue-500, focus:ring-offset-2"
    missing:
      - "Strip focus:ring-*, focus:border-* classes from src/auth/LoginPage.tsx (5 classNames)"
      - "Strip focus:ring-*, focus:border-* classes from src/auth/ChangePassword.tsx (4 classNames)"
      - "Expand class audit test to also scan src/auth/ directory"
human_verification:
  - test: "Keyboard-only focus on login page"
    expected: "Clicking password input shows no ring. Tabbing to password input shows blue outline."
    why_human: "jsdom does not support :focus-visible pseudo-class behavior at runtime"
  - test: "Keyboard-only focus on change password page"
    expected: "Clicking any input shows no ring. Tabbing shows blue outline."
    why_human: "jsdom does not support :focus-visible pseudo-class behavior at runtime"
---

# Phase 12: Focus Foundation and Form Submission Verification Report

**Phase Goal:** Every interactive element on the critical path shows a visible focus indicator on keyboard navigation, tab order is logical across all screens, and all critical-path forms submit on Enter.
**Verified:** 2026-03-14T13:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Pressing Tab shows a visible outline on focused elements across critical-path pages | PARTIAL | Global `:focus-visible` rule in `src/index.css` covers all elements in `src/components/` and `src/pages/`. Login and change-password inputs/buttons in `src/auth/` are covered by the global rule for the outline itself, but legacy classes (see SC2) interfere. |
| 2 | Focus indicators appear only during keyboard navigation, not on mouse clicks | FAILED | `src/auth/LoginPage.tsx` and `src/auth/ChangePassword.tsx` have `focus:ring-2 focus:ring-blue-500 focus:border-blue-500` Tailwind classes that fire on all focus, including mouse clicks. These override the global `:focus:not(:focus-visible) { outline: none }` rule for those elements. |
| 3 | Tab moves through form fields in visual order on all critical-path pages | VERIFIED | `tabIndex={-1}` applied to Sidebar nav links, Header links/logout, Breadcrumbs links, Toast close button. Sidebar collapse toggle and Header search input correctly remain tabbable. 14 tab-order tests pass. |
| 4 | Pressing Enter on the login form submits it | VERIFIED | `src/auth/LoginPage.tsx` wraps the form in `<form onSubmit={handleLogin}>` — native HTML behavior handles Enter. No explicit Enter test in `login.test.tsx`, but the implementation is correct. |
| 5 | Pressing Enter on the patient creation form submits it | VERIFIED | `tab-order.test.tsx` explicitly tests Enter-key submission on `PatientRegistrationForm` and it passes. |

**Score: 4/5 success criteria verified** (SC2 fails due to `src/auth/` files missed by cleanup)

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/index.css` | VERIFIED | `@layer base` with `:focus-visible { outline: 2px solid var(--color-blue-600); outline-offset: 2px }` and `:focus:not(:focus-visible) { outline: none }` — both rules present |
| `src/__tests__/focus-styles.test.tsx` | VERIFIED (with gap) | 5 tests pass. Scans `src/components/` and `src/pages/` — passes. Does NOT scan `src/auth/` where violations remain. |
| `src/components/Sidebar.tsx` | VERIFIED | `tabIndex={-1}` on logo Link (line 58), navItems Links (line 86), logout button (line 105). Collapse toggle lacks `tabIndex={-1}` as required. |
| `src/components/Header.tsx` | VERIFIED | `tabIndex={-1}` on home Link (line 58), settings Link (line 111), logout button (line 122). Search input untouched. |
| `src/components/Breadcrumbs.tsx` | VERIFIED | `tabIndex={-1}` on Link element (line 23). |
| `src/components/Toast.tsx` | VERIFIED | `tabIndex={-1}` on close button (line 23). |
| `src/pages/NewVisitPage.tsx` | VERIFIED | Buttons in DOM order: Save & Print (line 356), Save Visit (line 364), Cancel (line 373). All `type="button"`, no `<form>` wrapper. |
| `src/__tests__/tab-order.test.tsx` | VERIFIED | 11 tests, all pass. Covers tabIndex assertions on all 4 chrome components, PatientRegistrationForm Enter-to-submit, and FORM-03 documentation test. |
| `src/auth/LoginPage.tsx` | FAILED | 5 instances of `focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:ring-offset-2` remain. File was listed in plan as `src/pages/LoginPage.tsx` (wrong path) and was never cleaned. |
| `src/auth/ChangePassword.tsx` | FAILED | 4 instances of `focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:ring-offset-2` remain. Same path mismatch issue. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/index.css` | All focusable elements | `@layer base :focus-visible` rule | WIRED | Rule exists and is correctly scoped. Applies globally except where overridden by Tailwind utility classes. |
| `src/index.css` | Mouse-click suppression | `:focus:not(:focus-visible) { outline: none }` | PARTIAL | Rule is present and works for all elements without legacy classes. `src/auth/LoginPage.tsx` and `src/auth/ChangePassword.tsx` have Tailwind `focus:ring-*` classes that bypass this rule. |
| `src/components/Sidebar.tsx` | Tab order | `tabIndex={-1}` on Link elements | WIRED | All navItems Links and logo Link have `tabIndex={-1}`. Verified by test. |
| `src/pages/NewVisitPage.tsx` | Button DOM order | JSX order of action buttons | WIRED | Save & Print first, Save Visit second, Cancel third. Confirmed by source grep (lines 356, 364, 373). |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| FOCUS-01 | 12-01-PLAN.md | All interactive elements on critical path have visible focus indicators | PARTIAL | Global rule in index.css provides coverage for `src/components/` and `src/pages/`. `src/auth/LoginPage.tsx` and `src/auth/ChangePassword.tsx` have the global rule but also competing Tailwind classes. |
| FOCUS-02 | 12-01-PLAN.md | Focus indicators use `focus-visible` so they only appear on keyboard navigation | FAILED | `:focus:not(:focus-visible)` suppression works globally but is overridden by Tailwind `focus:ring-*` classes on inputs/buttons in `src/auth/LoginPage.tsx` (5 elements) and `src/auth/ChangePassword.tsx` (4 elements). |
| FOCUS-03 | 12-02-PLAN.md | Tab order follows the natural form flow on login, patient search, new visit, prescription, and print screens | VERIFIED | Chrome elements (sidebar, header, breadcrumbs, toast) removed from tab flow via `tabIndex={-1}`. 9 tab-order tests pass. |
| FORM-01 | 12-02-PLAN.md | User can submit login form with Enter | VERIFIED (no dedicated test) | `src/auth/LoginPage.tsx` uses `<form onSubmit={handleLogin}>` — native browser Enter-to-submit behavior is in place. `login.test.tsx` has no Enter-key test, only click-based tests. Implementation is correct; test coverage is incomplete. |
| FORM-02 | 12-02-PLAN.md | User can submit patient creation form with Enter | VERIFIED | `tab-order.test.tsx` "submits form when Enter is pressed on a form field" test passes (PatientRegistrationForm). |
| FORM-03 | 12-02-PLAN.md | User can submit/save visit form with Enter | INTENTIONALLY NOT IMPLEMENTED | NewVisitPage has no `<form>` wrapper by design — the clinical notes textarea requires Enter for newlines. Plan explicitly documents this as correct. The `tab-order.test.tsx` documentation test confirms intent. The REQUIREMENTS.md entry is marked complete, but the feature as literally described ("submit/save visit form with Enter") does not exist. |

**Orphaned requirements check:** All 6 requirement IDs (FOCUS-01, FOCUS-02, FOCUS-03, FORM-01, FORM-02, FORM-03) are claimed by plans 12-01 and 12-02. No orphans.

**FORM-03 note:** This requirement as written ("User can submit/save visit form with Enter") is marked complete in REQUIREMENTS.md but is intentionally not implemented — the design decision to omit the form wrapper is correct given the textarea's need for Enter. The requirement status in REQUIREMENTS.md should be reconsidered or re-worded. This is flagged as an observation, not a blocker.

### Anti-Patterns Found

| File | Lines | Pattern | Severity | Impact |
|------|-------|---------|----------|--------|
| `src/auth/LoginPage.tsx` | 77, 96, 120, 161, 186 | `focus:ring-2 focus:ring-blue-500 focus:border-blue-500` | Blocker | Causes focus ring to appear on mouse click for login form inputs and submit button — directly contradicts FOCUS-02 |
| `src/auth/ChangePassword.tsx` | 80, 107, 134, 157 | `focus:ring-2 focus:ring-blue-500 focus:border-blue-500` | Blocker | Causes focus ring to appear on mouse click for change-password form inputs and submit button — directly contradicts FOCUS-02 |
| `src/__tests__/focus-styles.test.tsx` | 17-18 | Audit scans only `src/components/` and `src/pages/` | Warning | `src/auth/` is not audited — future regressions in auth files will not be caught |

### Human Verification Required

### 1. Login page mouse-click focus behavior

**Test:** Open the app. Click the password input with the mouse.
**Expected:** No blue ring appears around the input.
**Why human:** jsdom does not support `:focus-visible` pseudo-class at runtime. The legacy `focus:ring-*` Tailwind classes in `LoginPage.tsx` will cause a ring to appear on mouse click until those classes are stripped.

### 2. Change password page mouse-click focus behavior

**Test:** Navigate to change password. Click any password input with the mouse.
**Expected:** No blue ring appears.
**Why human:** Same reason as above — `ChangePassword.tsx` has unstripped legacy classes.

### Gaps Summary

One root-cause failure blocks FOCUS-02: the plan incorrectly referenced `src/pages/LoginPage.tsx` and `src/pages/ChangePassword.tsx`, but both files actually live at `src/auth/LoginPage.tsx` and `src/auth/ChangePassword.tsx`. As a result, these files were never cleaned of legacy `focus:ring-*` Tailwind classes, and the class audit test's scope was set to only cover `src/components/` and `src/pages/` — missing `src/auth/` entirely.

The fix is mechanical: strip `focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:ring-offset-2` from 9 className strings across both auth files (same transformation applied to the 14 other files in plan 12-01), and extend the audit test's scan to include `src/auth/`.

All other work from plans 12-01 and 12-02 is verified and correct.

---

_Verified: 2026-03-14T13:30:00Z_
_Verifier: Claude (gsd-verifier)_
