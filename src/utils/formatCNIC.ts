/**
 * Format a string into Pakistani CNIC pattern: XXXXX-XXXXXXX-X
 * Strips non-digits and inserts dashes at positions 5 and 12.
 */
export function formatCNIC(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 13)

  if (digits.length <= 5) return digits
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`
}
