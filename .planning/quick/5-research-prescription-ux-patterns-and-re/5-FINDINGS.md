# Prescription UX Research Findings

Research into how standard EMR/clinic platforms handle medication prescribing UX, audited against the current ClinicSoftware MedicationEntry flow.

## 1. Current State Audit

### Field-by-Field Analysis

| Field | Current Behavior | Data Source | Problems |
|-------|-----------------|-------------|----------|
| **Drug Name** | Free-text input with autocomplete from Dexie DB. Dropdown shows `BrandName (Salt Strength Form)`. On selection, auto-populates brand, salt, form, strength. Allows custom free-text drugs. | Drug DB or user typing | Dropdown display duplicates info that later appears in separate print columns (Salt, Strength). |
| **Form** | Read-only when drug selected from DB (inferred from drug record). Editable ComboBox for custom drugs, backed by `MEDICATION_FORMS` (16 forms). | Drug DB or user ComboBox | Works well. Custom drug path allows free-text override. |
| **Qty (dosage field)** | ComboBox with `QUANTITY_OPTIONS` filtered by `FORM_TO_CATEGORY`. Free-text override allowed. Field name in data model is `dosage` but stores quantity. | User via ComboBox | Accepts arbitrary text ("banana", "999"). No range or format validation. Misleading field name. |
| **Frequency** | ComboBox backed by `FREQUENCY_OPTIONS` (17 predefined values). Free-text override allowed. | User via ComboBox | Accepts arbitrary text. Non-standard values produce untranslated Urdu (English value passed through). |
| **Duration** | ComboBox backed by `DURATION_OPTIONS` (13 predefined values). Free-text override allowed. | User via ComboBox | Same as Frequency: arbitrary text allowed, untranslated values in Urdu output. |

### Three Core Problems

1. **Information duplication**: Drug dropdown text shows `BrandName (Salt Strength Form)`, then after adding, the print slip has separate columns for Brand Name, Salt, Strength. The user sees the same data twice during entry and the full detail string in the search box is hard to scan.

2. **Unconstrained free-text**: ComboBox allows ANY typed value for Qty, Frequency, and Duration. There is no validation, warning, or even visual indicator when a non-standard value is entered. This breaks the Urdu translation pipeline (`toUrdu()` silently falls back to the English string).

3. **Misleading data model**: The `dosage` field stores quantity (e.g., "1", "5 ml"), not traditional dosage (drug + dose + route + frequency). This causes confusion in code and would confuse any future developer or integration.

## 2. Industry Patterns

### Drug Name / Search

**What EMRs do:**
- **Epic (2024+)**: Drug search returns results showing `Drug Name Strength Form (Route)`. After selection, the order sentence auto-builds. The search result IS the selection context; details are not repeated in separate editable fields.
- **Cerner/Oracle Health**: Search by brand or generic. Results show `Drug (Strength Form)`. Selection populates an order form with pre-filled but overridable fields.
- **Practice Fusion**: Simplified drug search. Shows brand name with strength inline. After selection, sig fields (dose, route, frequency, duration) appear as separate dropdowns.
- **DrChrono**: Drug lookup with autocomplete. Displays `Drug Strength` in search. Form and route are secondary fields populated after selection.
- **Athenahealth**: Drug search returns structured results. After selection, the Sig Builder provides guided dropdowns for dose, route, frequency, duration, and quantity.

**Pattern**: Drug search shows enough detail to disambiguate (brand + strength + form). After selection, the detail is NOT repeated, only the drug name anchors the prescription line. Separate fields handle the "sig" (instructions).

### Quantity / Dose

**What EMRs do:**
- Most EMRs present dose as a numeric field with a unit selector (e.g., `[1] [tablet]`, `[5] [mL]`). The unit is tied to the form.
- Epic's Sig Builder: Dose amount is a dropdown of common values (0.5, 1, 2) with free-text override. Unit auto-set by form.
- Practice Fusion: Dose is a single dropdown (e.g., "1 tablet", "2 tablets") with free-text allowed.
- Athenahealth: Numeric input with unit suffix. Range validation flags unusual quantities (e.g., >10 tablets).

**Pattern**: Constrained dropdown with numeric values appropriate to form. Free-text override possible but uncommon. Unit derived from form, not user-entered.

### Frequency (Sig Code)

**What EMRs do:**
- **Epic**: Uses "Sig codes" (standardized abbreviations like QD, BID, TID, PRN). Dropdown of common frequencies with search. Free-text override requires explicit "Other" selection.
- **Cerner**: Frequency dropdown with standardized options. Custom frequency requires selecting "Custom" which opens a structured builder (every X hours, Y times per day).
- **Practice Fusion / DrChrono**: Dropdown with common frequencies. Some allow free text, but standardized values cover 95%+ of prescriptions.
- **Athenahealth**: Structured frequency picker. "As needed" (PRN) is a separate checkbox, not mixed into the frequency list.

**Pattern**: Dropdown of 10-20 standardized options covers nearly all real-world use. Free-text is allowed but rare. Some platforms separate "PRN/as needed" as a modifier rather than a frequency.

### Duration

**What EMRs do:**
- **Epic**: Duration is `[number] [unit]` (days/weeks/months). Number is free-text numeric; unit is a dropdown.
- **Cerner**: Similar structured approach. Also supports "Until finished" and "Ongoing/Continuous" as special values.
- **Practice Fusion**: Dropdown of common durations. Less structured than Epic.
- **DrChrono**: Free numeric input with unit dropdown.

**Pattern**: Structured `number + unit` is the gold standard. Preset shortcuts (3 days, 5 days, 7 days, 1 month) speed entry. "Ongoing" and "As needed" are special terminal values.

### Form

**What EMRs do:**
- Form is almost always auto-populated from the drug database and NOT editable by the prescriber for database drugs. The drug record defines whether it is a tablet, capsule, syrup, etc.
- For compounded or custom medications, form becomes a required dropdown.

**Pattern**: Form is drug-intrinsic, not prescriber-chosen. ClinicSoftware already follows this pattern (read-only for DB drugs, ComboBox for custom).

## 3. Information Display Analysis

### The Duplication Problem

**Current ClinicSoftware flow:**
1. User types "Aug" in drug search
2. Dropdown shows: `Augmentin (Amoxicillin/Clavulanate 625mg Tablet)`
3. User selects it
4. Drug search field now displays: `Augmentin (Amoxicillin/Clavulanate 625mg Tablet)`
5. Print slip shows columns: Brand Name = `Augmentin`, Salt = `Amoxicillin/Clavulanate`, Strength = `625mg`

The salt, strength, and form appear twice: once in the search box text, once in print columns.

### How EMRs Handle This

**Epic**: After drug selection, the search/input field collapses to just the drug name (or a compact "order sentence"). The full detail lives in the structured fields below, not in the search box.

**Cerner**: The search result detail is transient. After selection, a separate "order detail" panel shows all fields individually. The search box either clears or shows just the drug name.

**Practice Fusion**: Drug name field shows just the brand name after selection. Strength and form appear in their own read-only fields.

**Common pattern**: The search box is a SEARCH tool, not a display tool. After selection:
- Search box shows: just the drug name (or clears for next entry)
- Structured fields show: form, strength, salt/generic (if separate columns exist)
- Print output shows: whatever columns are needed, derived from the structured data

### Recommendation for ClinicSoftware

The dropdown search results should continue showing full detail (user needs to disambiguate between Augmentin 375mg Tablet vs. Augmentin 625mg Syrup). But AFTER selection, the drug search input should simplify to just `BrandName` or `BrandName Strength`. The detailed fields are already stored in `form.brandName`, `form.saltName`, `form.form`, `form.strength`.

## 4. Recommendations

### Field-by-Field Recommendations

#### Drug Name/Search
**Recommendation: Current behavior + post-selection display fix**
- Search dropdown: Keep showing `BrandName (Salt Strength Form)` for disambiguation. This works.
- After selection: Display only `BrandName` (or `BrandName Strength`) in the input field. The detailed info is already stored in separate fields.
- Custom drugs: Keep free-text. No constraint needed; a solo doctor knows their drugs.

**Rationale**: The search detail is useful DURING search. Repeating it after selection is noise. Solo-doctor clinic does not need drug formulary restrictions.

#### Form
**Recommendation: Constrained (current behavior is already correct)**
- DB drugs: Read-only, inferred from drug record. Keep as-is.
- Custom drugs: ComboBox with `MEDICATION_FORMS` list. Keep free-text override for edge cases (rare compounded forms).
- **Urdu impact**: `formsUrdu` and `FORM_TO_CATEGORY` maps cover all 16 predefined forms. Custom forms fall through to English in Urdu output, which is acceptable for rare edge cases.

#### Qty (dosage)
**Recommendation: Guided with override**
- Keep the current form-aware `QUANTITY_OPTIONS` dropdown as the primary input.
- Add a visual indicator (subtle text/icon) when the entered value does not match any predefined option. NOT a blocking error, just an awareness signal.
- Rationale for NOT fully constraining: A doctor may need "½" tablet that's not in the list, or a specific mL amount for pediatrics. Blocking them would slow the workflow.
- **Urdu impact**: `buildDosageUrdu()` handles known patterns (count-based, mL-based, topical). Unknown quantities pass through as-is, which is acceptable since numbers are script-agnostic.

**Rename in data model**: `dosage` -> `quantity` in both `MedicationFormData` and `VisitMedication`. This is a clarity fix, not a behavior change. Requires a Dexie migration (add column alias or rename).

#### Frequency
**Recommendation: Guided with override**
- Keep `FREQUENCY_OPTIONS` dropdown as primary.
- Add a visual indicator when the user types a non-standard value. Possible hint: "Custom value: Urdu translation will show English text."
- Do NOT block free-text. The 17 predefined options cover 99% of real prescriptions, but edge cases exist (e.g., "Every other day", "Three times weekly").
- **Urdu impact**: `frequencyUrdu` only translates the 17 predefined values. Non-standard values appear as English in the Urdu instruction. The visual indicator would make the doctor aware of this tradeoff.

#### Duration
**Recommendation: Guided with override**
- Same pattern as Frequency: keep dropdown, add visual indicator for non-standard values.
- Consider adding a structured input option: `[number] [days/weeks/months]` that auto-constructs the string. This would expand the "translatable" range without hardcoding every possible duration.
- **Urdu impact**: `durationUrdu` covers 13 values. A structured `number + unit` builder could auto-translate any `N days/weeks/months` pattern, significantly reducing Urdu fallback to English.

### Override Pattern Summary

| Field | Type | Override Behavior | Urdu Fallback |
|-------|------|------------------|---------------|
| Drug Name | Free-text with autocomplete | Always allowed | N/A (not in instructions) |
| Form | Constrained (DB drugs) / Guided (custom) | Free-text for custom drugs only | English passthrough (rare) |
| Qty | Guided with override | Free-text allowed, visual indicator | Number passthrough (readable) |
| Frequency | Guided with override | Free-text allowed, visual indicator | English passthrough (visible) |
| Duration | Guided with override | Free-text allowed, visual indicator | English passthrough (visible) |

### What "Guided with override" Means Concretely

The ComboBox component needs a small enhancement:
1. When the typed value matches a predefined option (exact or partial): normal behavior, no indicator.
2. When the typed value does NOT match any predefined option: show a subtle amber/yellow border or small info icon with tooltip "Custom value: may not translate to Urdu."
3. The input is never blocked. The indicator is informational only.

This is a single `isCustomValue` check in ComboBox: `!options.some(opt => opt === value)`.

## 5. Proposed Field Redesign

### Drug Name Input
- **Type**: Autocomplete text input (current)
- **Search display**: `BrandName (Salt Strength Form)` (keep)
- **Post-selection display**: `BrandName` only (CHANGE)
- **Data stored**: `drugId`, `brandName`, `saltName`, `form`, `strength` (unchanged)
- **Validation**: `brandName` required, non-empty

### Form
- **Type**: Read-only display (DB drugs) / ComboBox dropdown (custom drugs)
- **Options**: `MEDICATION_FORMS` (16 values)
- **Override**: Free-text for custom drugs (current behavior)
- **Validation**: Required, non-empty

### Quantity (rename from "dosage")
- **Type**: ComboBox with form-aware options
- **Options**: `QUANTITY_OPTIONS[category]` (current)
- **Override**: Free-text with visual indicator for non-standard values
- **Validation**: Required, non-empty. Optional: warn if non-numeric for count-based forms.
- **Data model**: Rename `dosage` to `quantity` in `MedicationFormData`, `VisitMedication`, and all consumers

### Frequency
- **Type**: ComboBox
- **Options**: `FREQUENCY_OPTIONS` (17 values)
- **Override**: Free-text with visual indicator
- **Validation**: Required, non-empty

### Duration
- **Type**: ComboBox (current) OR structured `[number][unit]` builder (future enhancement)
- **Options**: `DURATION_OPTIONS` (13 values) for ComboBox mode
- **Override**: Free-text with visual indicator
- **Validation**: Required, non-empty
- **Future**: Structured builder would enable auto-translation of any `N days/weeks/months` duration

### Validation Summary
- All fields required before "Add" button enables (current behavior, keep)
- No blocking validation on content (no regex enforcement, no range checks)
- Visual indicator only for non-standard values in Qty, Frequency, Duration
- No server-side validation (offline-first, no server)

## 6. Drug Display Recommendation

### Problem Statement
The drug search input shows `Augmentin (Amoxicillin/Clavulanate 625mg Tablet)` after selection. This text duplicates info that appears in the medication table's Salt and Strength columns.

### Recommended Fix

**After drug selection from DB:**
- Drug search input displays: `BrandName` only (e.g., "Augmentin")
- The `formatDrugDisplay()` function used post-selection changes to: `return drug.brandName`
- The `formatDrugDisplay()` function for dropdown results (pre-selection) stays: `BrandName (Salt Strength Form)` for disambiguation

This requires splitting `formatDrugDisplay()` into two functions:
1. `formatDrugSearchResult(drug)`: Full detail for dropdown items. Used during search.
2. `formatDrugSelected(drug)`: Brand name only. Used after selection to set the input value.

**For custom (free-text) drugs:**
- Input displays whatever the user typed (current behavior, no change)

**Print slip columns (no change needed):**
- #, Brand Name, Salt, Strength, Instructions
- These columns derive from the stored `brandName`, `saltName`, `strength` fields, which are already clean single values

### Implementation Sketch

```
// In MedicationEntry.tsx

function formatDrugSearchResult(drug: Drug): string {
  const details: string[] = []
  if (drug.saltName) details.push(drug.saltName)
  if (drug.strength) details.push(drug.strength)
  if (drug.form) details.push(drug.form)
  return details.length > 0
    ? `${drug.brandName} (${details.join(' ')})`
    : drug.brandName
}

function formatDrugSelected(drug: Drug): string {
  return drug.brandName
}

// In handleSelectDrug:
setDrugQuery(formatDrugSelected(drug))  // was: formatDrugDisplay(drug)

// In dropdown rendering:
formatDrugSearchResult(drug)  // was: formatDrugDisplay(drug)
```

### Before/After

| Scenario | Before | After |
|----------|--------|-------|
| Dropdown item | `Augmentin (Amoxicillin/Clavulanate 625mg Tablet)` | `Augmentin (Amoxicillin/Clavulanate 625mg Tablet)` (same) |
| Input after selection | `Augmentin (Amoxicillin/Clavulanate 625mg Tablet)` | `Augmentin` |
| Print: Brand Name col | `Augmentin` | `Augmentin` (same) |
| Print: Salt col | `Amoxicillin/Clavulanate` | `Amoxicillin/Clavulanate` (same) |
| Print: Strength col | `625mg` | `625mg` (same) |

The duplication is eliminated at the entry UI level without any data model or print layout changes.
