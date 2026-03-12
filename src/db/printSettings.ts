import { db } from './index'

export type PaperSize = 'A5' | 'A4' | 'Letter'

export interface PaperDimensions {
  width: number
  height: number
  label: string
}

export interface PrintSettings {
  prescriptionSize: PaperSize
  dispensarySize: PaperSize
}

export const PAPER_SIZES: Record<PaperSize, PaperDimensions> = {
  A5: { width: 148, height: 210, label: 'A5 (148 x 210 mm)' },
  A4: { width: 210, height: 297, label: 'A4 (210 x 297 mm)' },
  Letter: { width: 216, height: 279, label: 'Letter (216 x 279 mm)' },
}

export const PAPER_SIZE_ORDER: PaperSize[] = ['A5', 'A4', 'Letter']

const VALID_SIZES: PaperSize[] = ['A5', 'A4', 'Letter']

function coerceSize(raw: unknown): PaperSize {
  return VALID_SIZES.includes(raw as PaperSize) ? (raw as PaperSize) : 'A5'
}

const DEFAULT_SIZE: PaperSize = 'A5'

export async function getPrintSettings(): Promise<PrintSettings> {
  const [prescriptionEntry, dispensaryEntry] = await Promise.all([
    db.settings.get('printPrescriptionSize'),
    db.settings.get('printDispensarySize'),
  ])
  return {
    prescriptionSize: coerceSize(prescriptionEntry?.value ?? DEFAULT_SIZE),
    dispensarySize: coerceSize(dispensaryEntry?.value ?? DEFAULT_SIZE),
  }
}

export async function savePrintSetting(
  key: 'printPrescriptionSize' | 'printDispensarySize',
  value: PaperSize
): Promise<void> {
  await db.settings.put({ key, value })
}

// Proportional margin: A5 baseline = 148 * 210 = 31080, margin = 8mm
// ratio = paperArea / A5_AREA
// margin = clamp(8 * ratio, 4, 10), rounded
const A5_AREA = 148 * 210

export function calcMargin(size: PaperSize): number {
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
export const URDU_LINE_HEIGHTS: Record<PaperSize, number> = {
  A5: 2.2,
  A4: 2.6,
  Letter: 2.6,
}
