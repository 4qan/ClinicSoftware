# Quick Task 5: Research prescription UX patterns and redesign medication assignment flow - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Task Boundary

Research how standard prescription/EMR platforms handle the medication assignment flow. Audit current ClinicSoftware prescription entry against industry patterns. Produce a findings document with recommendations for fixing information duplication, override rules, and input constraints.

Current problems identified:
- Drug dropdown shows brand name + salt + strength + form, then separate columns duplicate some of this info
- ComboBox fields (Qty, Frequency, Duration) allow free-text override with no validation, enabling nonsensical values like "5 years" duration
- Unclear which fields should be constrained vs overridable

</domain>

<decisions>
## Implementation Decisions

### Task Scope
- Research document only. No code changes in this task.
- Implementation becomes a separate phase/task based on findings.

### Override vs Constrained Inputs
- Let the research decide. No pre-commitment on which fields should be locked vs free-text.
- Research should surface what standard platforms do and recommend based on findings.

### Research Sources
- Benchmark against popular EMR/clinic-scale platforms: Epic, Cerner, Practice Fusion, Dr. Chrono, and similar.
- Focus on practical UX patterns, not formal data standards.

### Claude's Discretion
- None. All areas discussed.

</decisions>

<specifics>
## Specific Ideas

- Audit should map current MedicationEntry fields against what EMRs typically use
- Pay attention to how EMRs handle the drug selection -> auto-population -> override flow
- Document what fields are typically locked after drug selection vs editable
- Research how duration/frequency inputs are typically constrained
- Consider the Urdu instruction generation downstream (translations.ts) when evaluating field changes

</specifics>
