---
status: diagnosed
phase: 03-printing-and-visit-completion
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md]
started: 2026-03-06T13:10:00Z
updated: 2026-03-06T13:20:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Always-Visible Disabled Visit Form
expected: Open New Visit page without selecting a patient. Clinical Notes, Prescription, and Action Bar sections are visible but disabled (greyed out, not clickable). Selecting a patient enables them with no layout shift.
result: pass

### 2. Inline Patient Creation from Search
expected: In the New Visit page patient search, type a name that doesn't exist. A "Create '[query]' as new patient" option appears in the dropdown. Clicking it expands an inline registration form pre-filled with the typed name. Submitting creates the patient and selects them for the visit.
result: pass

### 3. Settings Category Tabs
expected: Open Settings page. Three pill-style tabs appear: Account, Medications, Clinic Info. Clicking each tab switches the content panel below. Active tab is highlighted in blue.
result: pass

### 4. Clinic Info Settings
expected: In Settings > Clinic Info tab, fill in clinic details (name, address, phone, etc.) and save. Reload the page and navigate back. The saved values persist.
result: pass

### 5. Print Link on Visit Card
expected: View a completed visit card. A "Print" link appears in the actions bar (before Edit). Clicking it navigates to the print page for that visit.
result: issue
reported: "it passes but this is not a great experience. I would expect the print CTA to open the print view from the visit page itself or from the visit history page. maybe there can be 2 CTAs for print or that clicking print shows two options to select from and then the appropriate print happens."
severity: minor

### 6. Print Visit Page Layout
expected: On the print page (/visit/:id/print), the prescription slip is visible as a preview with clinic header, patient info, medication table, clinical notes, and footer. Two print buttons are visible: "Print Prescription" and "Print Dispensary".
result: issue
reported: "this whole page is messed up. 1) two massive CTAs (already talked in previous point that we dont need this page separately) 2) the default print view is of the prescription but I have no way to preview the dispensary print 3) when actually clicking the print, in the print viewer you can see the print shows the left panel overlap and also the CTAs. the print should be for only the content"
severity: major

### 7. Print Prescription Slip
expected: Click "Print Prescription" button. The browser print dialog opens with an A5-sized prescription slip showing all visit details. App chrome (navbar, sidebar) is hidden in print preview.
result: issue
reported: "failed. app chrome is not hidden"
severity: blocker

### 8. Print Dispensary Slip
expected: Click "Print Dispensary" button. The browser print dialog opens with a compact slip showing only patient ID/name/date and the medication table. No clinical notes or full header.
result: issue
reported: "failed. app chrome is not hidden"
severity: blocker

## Summary

total: 8
passed: 4
issues: 4
pending: 0
skipped: 0

## Gaps

- truth: "Print CTA triggers print directly from visit page/history without navigating to separate print page"
  status: failed
  reason: "User reported: print CTA navigates to separate page instead of printing inline. Wants 2 CTAs or dropdown on visit card that prints directly."
  severity: minor
  test: 5
  root_cause: "UX design issue: VisitCard Print link navigates to /visit/:id/print instead of offering inline print options"
  artifacts:
    - path: "src/components/VisitCard.tsx"
      issue: "Print link navigates to separate page"
  missing:
    - "Replace single Print link with dropdown/popover offering Prescription and Dispensary print options"
    - "Trigger window.print() directly from visit card/page instead of navigating"
  debug_session: ""

- truth: "Print page shows clean preview with no oversized CTAs, dispensary preview available, and print output contains only slip content"
  status: failed
  reason: "User reported: massive CTAs, no dispensary preview, print output includes left panel and CTAs"
  severity: major
  test: 6
  root_cause: "PrintVisitPage has oversized buttons, dispensary slip hidden with 'hidden' class making preview impossible, and print CSS doesn't hide non-content elements"
  artifacts:
    - path: "src/pages/PrintVisitPage.tsx"
      issue: "Massive CTAs, dispensary slip hidden behind printMode state with no preview"
  missing:
    - "Allow dispensary slip preview (tab/toggle between slips)"
    - "Ensure print output excludes buttons and non-content elements"
  debug_session: ""

- truth: "Print prescription hides all app chrome (navbar, sidebar, header) and shows only the prescription slip"
  status: failed
  reason: "User reported: app chrome is not hidden in print preview"
  severity: blocker
  test: 7
  root_cause: "@media print CSS targets wrong selectors: 'nav, header, .sidebar, .app-header' but sidebar is <aside> with no class, header is a <div> with no .app-header class"
  artifacts:
    - path: "src/index.css"
      issue: "@media print selectors don't match actual DOM elements (line 24)"
    - path: "src/components/AppLayout.tsx"
      issue: "Sidebar is <aside> without .sidebar class, header div lacks .app-header class"
  missing:
    - "Fix @media print selectors to target actual elements: aside, sticky header div"
    - "Add identifiable classes to AppLayout sidebar and header for print targeting"
  debug_session: ""

- truth: "Print dispensary hides all app chrome (navbar, sidebar, header) and shows only the dispensary slip"
  status: failed
  reason: "User reported: app chrome is not hidden in print preview"
  severity: blocker
  test: 8
  root_cause: "Same root cause as test 7: @media print CSS targets wrong selectors"
  artifacts:
    - path: "src/index.css"
      issue: "@media print selectors don't match actual DOM elements (line 24)"
  missing:
    - "Same fix as test 7: correct @media print selectors"
  debug_session: ""
