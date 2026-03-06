---
created: 2026-03-06T17:04:05.961Z
title: Drug selection should show full details not just brand name
area: ui
files:
  - src/components/PrescriptionForm.tsx
---

## Problem

When searching for a drug in the prescription form, the dropdown shows full details (brand name, salt, strength, form) but once selected, only the brand name is displayed in the input field. The prescriber loses visibility of what exactly they selected (salt, strength, form) until they look at the medication table below.

## Solution

After selecting a drug, show the full compound label (e.g., "Brufen (Ibuprofen 200mg Tablet)") in the drug name input or in a visible summary near it, so the prescriber can confirm what they selected at a glance.
