import { getSetting, putSetting } from './pouchdb'

export type PaperSize = 'A5' | 'A4' | 'Letter' | 'Slip'

export interface PaperDimensions {
  width: number
  height: number
  label: string
}

export interface PrintSettings {
  prescriptionSize: PaperSize
  dispensarySize: PaperSize
  autoPrint: boolean
}

export const PAPER_SIZES: Record<PaperSize, PaperDimensions> = {
  A5: { width: 148, height: 210, label: 'A5 (148 x 210 mm)' },
  A4: { width: 210, height: 297, label: 'A4 (210 x 297 mm)' },
  Letter: { width: 216, height: 279, label: 'Letter (216 x 279 mm)' },
  Slip: { width: 78, height: 115, label: 'Slip (78 x 115 mm)' },
}

// CSS @page size keywords: Chrome needs named keywords for standard sizes; Slip uses raw mm
// because there is no CSS keyword for 78x115mm.
export const PAGE_SIZE_KEYWORD: Record<PaperSize, string> = {
  A5: 'A5 portrait',
  A4: 'A4 portrait',
  Letter: 'letter portrait',
  Slip: '78mm 115mm',
}

export const PAPER_SIZE_ORDER: PaperSize[] = ['A5', 'A4', 'Letter', 'Slip']

// Sizes available for prescription printing. Slip is dispensary-only (78mm is too narrow
// for a clinical prescription with header, vitals, notes, etc.).
export const PRESCRIPTION_SIZE_ORDER: PaperSize[] = ['A5', 'A4', 'Letter']

const VALID_SIZES: PaperSize[] = ['A5', 'A4', 'Letter', 'Slip']

function coerceSize(raw: unknown, fallback: PaperSize): PaperSize {
  return VALID_SIZES.includes(raw as PaperSize) ? (raw as PaperSize) : fallback
}

// First-run defaults. Dispensary defaults to Slip (the common case for a clinic
// running thermal/receipt-style dispensing). Prescription defaults to A4.
export const DEFAULT_PRESCRIPTION_SIZE: PaperSize = 'A4'
export const DEFAULT_DISPENSARY_SIZE: PaperSize = 'Slip'

export async function getPrintSettings(): Promise<PrintSettings> {
  const [prescriptionRaw, dispensaryRaw, autoPrintRaw] = await Promise.all([
    getSetting('printPrescriptionSize'),
    getSetting('printDispensarySize'),
    getSetting('autoPrint'),
  ])
  return {
    prescriptionSize: coerceSize(prescriptionRaw ?? DEFAULT_PRESCRIPTION_SIZE, DEFAULT_PRESCRIPTION_SIZE),
    dispensarySize: coerceSize(dispensaryRaw ?? DEFAULT_DISPENSARY_SIZE, DEFAULT_DISPENSARY_SIZE),
    autoPrint: autoPrintRaw !== false,
  }
}

export async function savePrintSetting(
  key: 'printPrescriptionSize' | 'printDispensarySize',
  value: PaperSize
): Promise<void> {
  await putSetting(key, value)
}

export async function saveAutoPrint(value: boolean): Promise<void> {
  await putSetting('autoPrint', value)
}

// Proportional margin: A5 baseline = 148 * 210 = 31080, margin = 8mm
// ratio = paperArea / A5_AREA
// margin = clamp(8 * ratio, 4, 10), rounded
// Slip is a physical receipt-sized slip fed directly into the printer — the slip
// itself owns its whitespace via internal padding, so @page margin is 0.
const A5_AREA = 148 * 210

export function calcMargin(size: PaperSize): number {
  if (size === 'Slip') return 0
  const { width, height } = PAPER_SIZES[size]
  const area = width * height
  const ratio = area / A5_AREA
  return Math.round(Math.max(4, Math.min(10, 8 * ratio)))
}

// Scaling infrastructure: A5 is the baseline (width = 148mm)
// scale = selectedWidth / A5_WIDTH
const A5_WIDTH = 148

export function calcScale(size: PaperSize): number {
  return PAPER_SIZES[size].width / A5_WIDTH
}

// Per-size Urdu Nastaliq line-height values.
// A5: confirmed at 2.2. A4/Letter: starting estimates at 2.6 (need empirical print testing).
// Slip: dispensary-only and dispensary doesn't render Urdu — value is required for type
// exhaustiveness but unused at runtime for this size.
export const URDU_LINE_HEIGHTS: Record<PaperSize, number> = {
  A5: 2.2,
  A4: 2.6,
  Letter: 2.6,
  Slip: 2.2,
}
