---
created: 2026-03-06T17:04:05.961Z
title: Print CTA misaligned with other CTAs
area: ui
files:
  - src/pages/PrintVisitPage.tsx
---

## Problem

On the visit detail/print page, the Print button is visually misaligned with the other two CTAs (likely Save and Cancel or similar action buttons). The buttons should be consistently aligned in their container.

## Solution

Check the button group layout on the visit detail page and ensure all CTAs share the same alignment, spacing, and container styling.
