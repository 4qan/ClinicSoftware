---
created: 2026-03-06T17:04:05.961Z
title: Add print CTA to new visit page with save-print flow
area: ui
files:
  - src/pages/NewVisitPage.tsx
---

## Problem

The new visit page only has a "Save Visit" button. There is no way to print directly from this page. The user must save first, navigate to the visit, then print. This was requested in the previous milestone but not implemented.

## Solution

Add a Print CTA alongside Save Visit. Consider the interaction between save and print:
- "Save & Print" could save the visit then redirect to print view
- Or separate "Save Visit" and "Print" buttons where Print auto-saves first (can't print unsaved data)
- Key question: should printing always require saving first? (Likely yes, since the print page needs a visit ID to load data)

Recommended: Single "Save & Print" button alongside "Save Visit", where Save & Print saves then navigates to the print page.
