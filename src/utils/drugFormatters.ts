import type { Drug } from '@/db/index'

/**
 * Format a drug for display in search result dropdown.
 * Shows full detail: brand name + (salt strength form)
 */
export function formatDrugSearchResult(drug: Drug): string {
  const parts = [drug.brandName]
  const details: string[] = []
  if (drug.saltName) details.push(drug.saltName)
  if (drug.strength) details.push(drug.strength)
  if (drug.form) details.push(drug.form)
  if (details.length > 0) parts.push(`(${details.join(' ')})`)
  return parts.join(' ')
}

/**
 * Format a drug for display in the input field after selection.
 * Shows brand name only.
 */
export function formatDrugSelected(drug: Drug): string {
  return drug.brandName
}
