---
status: resolved
phase: 01-foundation-and-patient-management
source: 06-SUMMARY.md
started: 2026-03-06T12:00:00Z
updated: 2026-03-06T12:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Register Patient CTA in Sticky Header
expected: Sidebar shows only Home, Patients, and Settings (no Register Patient link). In the sticky header bar, a blue "Register Patient" button with a + icon appears to the right of the search bar. Clicking it navigates to the registration form.
result: issue
reported: "now that we have the sticky CTA, there is no need for the separate CTAs on the Home page and the Patients page"
severity: minor

### 2. Patient ID Preview on Registration Form
expected: On the Register Patient page, a blue-tinted box shows the next patient ID (e.g., "2026-0003") before you fill in any fields. This is a read-only preview, not editable. After registering a patient and returning to the form, the preview increments to the next ID.
result: pass

### 3. Show/Hide Toggles on Change Password Fields
expected: Go to Settings. The Change Password section is styled as a card matching the Security Code card above it (same width, same border/padding style). All 3 password fields (Current, New, Confirm) have a "Show"/"Hide" text toggle on the right side. Clicking toggles between visible and masked text.
result: pass

## Summary

total: 3
passed: 2
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Sticky header CTA is the single Register Patient entry point; no duplicate CTAs on individual pages"
  status: resolved
  reason: "User reported: now that we have the sticky CTA, there is no need for the separate CTAs on the Home page and the Patients page"
  severity: minor
  test: 1
  root_cause: "HomePage lines 10-18 has a standalone Register New Patient button. PatientsPage lines 13-21 has a Register New Patient button in the page header. Both are redundant now that AppLayout sticky header has the persistent CTA."
  artifacts:
    - path: "src/pages/HomePage.tsx"
      issue: "Lines 10-18: standalone Register New Patient Link button"
    - path: "src/pages/PatientsPage.tsx"
      issue: "Lines 15-20: Register New Patient button in page header"
  missing:
    - "Remove Register New Patient button from HomePage"
    - "Remove Register New Patient button from PatientsPage header"
    - "Keep empty-state Register First Patient link in PatientsPage (contextual guidance, not duplicate CTA)"
