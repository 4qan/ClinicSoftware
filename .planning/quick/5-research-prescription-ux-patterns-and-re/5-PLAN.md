---
phase: quick-5
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/quick/5-research-prescription-ux-patterns-and-re/5-FINDINGS.md
autonomous: true
requirements: [QUICK-5]

must_haves:
  truths:
    - "Findings document maps each current MedicationEntry field to EMR industry patterns"
    - "Each field (Drug Name, Form, Qty, Frequency, Duration) has a clear recommendation: constrained, override-with-validation, or free-text"
    - "Findings account for downstream Urdu instruction generation when recommending field changes"
    - "Information duplication problem (dropdown shows form+strength, then separate columns repeat it) has a concrete recommendation"
  artifacts:
    - path: ".planning/quick/5-research-prescription-ux-patterns-and-re/5-FINDINGS.md"
      provides: "Research findings and redesign recommendations"
      contains: "## Current State Audit"
  key_links: []
---

<objective>
Research how standard EMR/prescription platforms handle medication assignment UX, audit the current ClinicSoftware MedicationEntry flow against those patterns, and produce a findings document with actionable recommendations.

Purpose: Inform a future redesign of the medication entry flow to fix information duplication, clarify override rules, and add appropriate input constraints.
Output: `5-FINDINGS.md` with audit, research findings, and recommendations.
</objective>

<execution_context>
@/Users/furqantariq/.claude/get-shit-done/workflows/execute-plan.md
@/Users/furqantariq/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/quick/5-research-prescription-ux-patterns-and-re/5-CONTEXT.md

Current implementation files (read, do not modify):
@src/components/MedicationEntry.tsx
@src/components/ComboBox.tsx
@src/constants/clinical.ts
@src/db/index.ts (VisitMedication interface, lines 51-63)
@src/components/PrescriptionSlip.tsx
@src/constants/translations.ts (buildUrduInstruction)

<interfaces>
<!-- Current data flow: MedicationEntry -> MedicationFormData -> saved as VisitMedication -> rendered in PrescriptionSlip -->

From src/components/MedicationEntry.tsx:
```typescript
export interface MedicationFormData {
  drugId?: string
  brandName: string
  saltName: string
  form: string
  strength: string
  dosage: string      // Actually stores quantity (e.g., "1", "5 ml", "Thin layer")
  frequency: string
  duration: string
}
```

From src/db/index.ts:
```typescript
export interface VisitMedication {
  id: string
  visitId: string
  drugId?: string
  brandName: string
  saltName: string
  form: string
  strength: string
  dosage: string      // Stores quantity, not traditional "dosage"
  frequency: string
  duration: string
  sortOrder: number
}
```

Current field flow after drug selection:
- Drug dropdown shows: "BrandName (Salt Strength Form)"
- Auto-populated (read-only for DB drugs): brandName, saltName, form, strength
- Manual entry via ComboBox: dosage (qty), frequency, duration
- ComboBox allows ANY free-text override (no validation)
- Print slip columns: #, Brand Name, Salt, Strength, Instructions (Urdu+English)

Current problems:
1. Drug dropdown text duplicates info shown in separate columns
2. ComboBox fields accept arbitrary text ("banana", "5 years", etc.)
3. "dosage" field name is misleading (actually stores quantity)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Research EMR medication entry patterns and produce findings document</name>
  <files>.planning/quick/5-research-prescription-ux-patterns-and-re/5-FINDINGS.md</files>
  <action>
Research how standard EMR/clinic-scale platforms (Epic, Cerner/Oracle Health, Practice Fusion, DrChrono, Athenahealth) handle medication prescribing UX. Use web search to find current documentation, screenshots, and UX descriptions for each platform's medication ordering workflow.

Focus areas:
1. **Drug selection -> auto-population flow**: What fields auto-fill after selecting a drug? What remains editable? How is the selected drug displayed (full detail vs. name only)?
2. **Field constraints**: Which fields are dropdown-only vs. free-text vs. hybrid? How do they handle frequency (sig codes vs. free text)? Duration constraints?
3. **Information density**: Do they show salt/generic name separately or inline? How do they avoid repeating info shown in the search result?
4. **Override patterns**: When a field is constrained, how do platforms allow exceptions? (e.g., "Other" option, admin override, free-text with warning)
5. **Validation**: What validation happens before a prescription is added? Required fields? Range checks?

Then produce `5-FINDINGS.md` with the following structure:

```
# Prescription UX Research Findings

## 1. Current State Audit
Map each MedicationEntry field to its current behavior, noting the three problems from CONTEXT.md.

## 2. Industry Patterns
For each field (Drug Name/Search, Form, Quantity/Dose, Frequency, Duration):
- What do EMRs typically do?
- Constrained vs. overridable?
- Common UX pattern

## 3. Information Display Analysis
How EMRs handle the drug-selection-shows-details vs. separate-columns problem.

## 4. Recommendations
For each field, recommend one of:
- **Constrained** (dropdown only, no free-text)
- **Guided with override** (dropdown + "Other" or free-text with validation warning)
- **Free-text** (open input)

Include rationale. Account for:
- This is a solo-doctor clinic app, not a hospital system (less regulatory overhead)
- Urdu instruction generation depends on form, quantity, frequency, duration matching known values
- Offline-first with no server-side validation

## 5. Proposed Field Redesign
Concrete spec for each field's new behavior, ready for implementation planning.

## 6. Drug Display Recommendation
How to fix the duplication: what the dropdown should show vs. what columns should display after adding.
```

Do NOT make code changes. This is research output only.
  </action>
  <verify>
    <automated>test -f ".planning/quick/5-research-prescription-ux-patterns-and-re/5-FINDINGS.md" && grep -q "## 1. Current State Audit" ".planning/quick/5-research-prescription-ux-patterns-and-re/5-FINDINGS.md" && grep -q "## 4. Recommendations" ".planning/quick/5-research-prescription-ux-patterns-and-re/5-FINDINGS.md" && echo "PASS"</automated>
  </verify>
  <done>5-FINDINGS.md exists with all 6 sections. Each current MedicationEntry field has a clear constrained/guided/free-text recommendation with rationale. The document addresses information duplication, override rules, input constraints, and Urdu generation compatibility.</done>
</task>

</tasks>

<verification>
- 5-FINDINGS.md covers all 6 sections
- Every current field (drugName, form, dosage/qty, frequency, duration) has an explicit recommendation
- Recommendations account for the solo-doctor clinic context (not over-engineering hospital-grade constraints)
- Urdu instruction generation impact is addressed (what happens if user enters non-standard values?)
- Information duplication problem has a concrete solution
</verification>

<success_criteria>
- Research document exists with actionable, specific recommendations
- Each field recommendation is implementable without further research
- Document is ready to drive a future implementation phase/task
</success_criteria>

<output>
After completion, create `.planning/quick/5-research-prescription-ux-patterns-and-re/5-SUMMARY.md`
</output>
