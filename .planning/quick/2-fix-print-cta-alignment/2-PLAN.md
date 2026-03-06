# Fix Print CTA Alignment

## Problem

In `src/components/VisitCard.tsx` (line 171-208), the three action CTAs (Print, Edit, Delete) in the expanded visit card have an alignment issue. The Print button is wrapped in a `<div className="relative">` for dropdown positioning, while Edit (`<Link>`) and Delete (`<button>`) are direct flex children. This wrapper div can cause subtle vertical misalignment.

The todo file references `PrintVisitPage.tsx`, but that page only has a single Print CTA. The three-CTA layout with the alignment issue lives in VisitCard.tsx.

## Tasks

### Task 1: Fix Print CTA alignment in VisitCard

**File:** `src/components/VisitCard.tsx` (lines 171-208)

**Change:** Add `flex items-center` to the `relative` wrapper div around the Print button (line 172) so it participates properly in the flex layout without introducing height misalignment. The wrapper should not stretch taller than its siblings.

Current (line 172):
```
<div className="relative" ref={printDropdownRef}>
```

Fix:
```
<div className="relative flex items-center" ref={printDropdownRef}>
```

**Verify:** Visually confirm all three CTAs (Print, Edit, Delete) sit on the same baseline in the expanded VisitCard.
