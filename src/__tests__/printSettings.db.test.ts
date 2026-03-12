import { describe, it, expect, beforeEach } from 'vitest'
import { db, resetDatabase } from '@/db/index'
import {
  getPrintSettings,
  savePrintSetting,
  calcMargin,
  calcScale,
  URDU_LINE_HEIGHTS,
  PAPER_SIZE_ORDER,
  PAPER_SIZES,
} from '@/db/printSettings'

describe('printSettings data layer', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  describe('getPrintSettings', () => {
    it('returns A5 defaults when no DB keys exist', async () => {
      const settings = await getPrintSettings()
      expect(settings.prescriptionSize).toBe('A5')
      expect(settings.dispensarySize).toBe('A5')
    })

    it('returns saved prescriptionSize after savePrintSetting', async () => {
      await savePrintSetting('printPrescriptionSize', 'A4')
      const settings = await getPrintSettings()
      expect(settings.prescriptionSize).toBe('A4')
      expect(settings.dispensarySize).toBe('A5')
    })

    it('returns saved dispensarySize after savePrintSetting', async () => {
      await savePrintSetting('printDispensarySize', 'Letter')
      const settings = await getPrintSettings()
      expect(settings.dispensarySize).toBe('Letter')
      expect(settings.prescriptionSize).toBe('A5')
    })

    it('each key saves independently', async () => {
      await savePrintSetting('printPrescriptionSize', 'A4')
      await savePrintSetting('printDispensarySize', 'Letter')
      const settings = await getPrintSettings()
      expect(settings.prescriptionSize).toBe('A4')
      expect(settings.dispensarySize).toBe('Letter')
    })

    it('returns A5 when DB contains A6 for prescriptionSize (fallback)', async () => {
      // Directly write 'A6' to the DB to simulate a legacy stored value
      await db.settings.put({ key: 'printPrescriptionSize', value: 'A6' })
      const settings = await getPrintSettings()
      expect(settings.prescriptionSize).toBe('A5')
    })

    it('returns A5 when DB contains A6 for dispensarySize (fallback)', async () => {
      // Directly write 'A6' to the DB to simulate a legacy stored value
      await db.settings.put({ key: 'printDispensarySize', value: 'A6' })
      const settings = await getPrintSettings()
      expect(settings.dispensarySize).toBe('A5')
    })
  })

  describe('calcMargin', () => {
    it('returns 8 for A5', () => {
      expect(calcMargin('A5')).toBe(8)
    })

    it('returns 10 for A4', () => {
      expect(calcMargin('A4')).toBe(10)
    })

    it('returns 10 for Letter', () => {
      expect(calcMargin('Letter')).toBe(10)
    })
  })

  describe('calcScale', () => {
    it('returns 1.0 for A5 (baseline)', () => {
      expect(calcScale('A5')).toBeCloseTo(1.0, 5)
    })

    it('returns ~1.419 for A4 (210/148)', () => {
      expect(calcScale('A4')).toBeCloseTo(210 / 148, 5)
    })

    it('returns ~1.459 for Letter (216/148)', () => {
      expect(calcScale('Letter')).toBeCloseTo(216 / 148, 5)
    })
  })

  describe('URDU_LINE_HEIGHTS', () => {
    it('has entry for A5 equal to 2.2', () => {
      expect(URDU_LINE_HEIGHTS['A5']).toBe(2.2)
    })

    it('has entry for A4 equal to 2.6', () => {
      expect(URDU_LINE_HEIGHTS['A4']).toBe(2.6)
    })

    it('has entry for Letter equal to 2.6', () => {
      expect(URDU_LINE_HEIGHTS['Letter']).toBe(2.6)
    })

    it('has entries for every PaperSize', () => {
      for (const size of PAPER_SIZE_ORDER) {
        expect(URDU_LINE_HEIGHTS[size]).toBeTypeOf('number')
      }
    })
  })

  describe('PAPER_SIZE_ORDER', () => {
    it('is ordered A5, A4, Letter (no A6)', () => {
      expect(PAPER_SIZE_ORDER).toEqual(['A5', 'A4', 'Letter'])
    })

    it('does not include A6', () => {
      expect(PAPER_SIZE_ORDER).not.toContain('A6')
    })
  })

  describe('PAPER_SIZES', () => {
    it('A5 has correct label', () => {
      expect(PAPER_SIZES['A5'].label).toBe('A5 (148 x 210 mm)')
    })

    it('A4 has correct label', () => {
      expect(PAPER_SIZES['A4'].label).toBe('A4 (210 x 297 mm)')
    })

    it('Letter has correct label', () => {
      expect(PAPER_SIZES['Letter'].label).toBe('Letter (216 x 279 mm)')
    })

    it('does not have an A6 entry', () => {
      expect(PAPER_SIZES).not.toHaveProperty('A6')
    })
  })
})
