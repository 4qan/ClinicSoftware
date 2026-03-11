import { describe, it, expect, beforeEach } from 'vitest'
import { resetDatabase } from '@/db/index'
import {
  getPrintSettings,
  savePrintSetting,
  calcMargin,
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
      await savePrintSetting('printDispensarySize', 'A6')
      const settings = await getPrintSettings()
      expect(settings.dispensarySize).toBe('A6')
      expect(settings.prescriptionSize).toBe('A5')
    })

    it('each key saves independently', async () => {
      await savePrintSetting('printPrescriptionSize', 'A4')
      await savePrintSetting('printDispensarySize', 'A6')
      const settings = await getPrintSettings()
      expect(settings.prescriptionSize).toBe('A4')
      expect(settings.dispensarySize).toBe('A6')
    })
  })

  describe('calcMargin', () => {
    it('returns 4 for A6', () => {
      expect(calcMargin('A6')).toBe(4)
    })

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

  describe('PAPER_SIZE_ORDER', () => {
    it('is ordered smallest to largest: A6, A5, A4, Letter', () => {
      expect(PAPER_SIZE_ORDER).toEqual(['A6', 'A5', 'A4', 'Letter'])
    })
  })

  describe('PAPER_SIZES', () => {
    it('A5 has correct label', () => {
      expect(PAPER_SIZES['A5'].label).toBe('A5 (148 x 210 mm)')
    })

    it('A6 has correct label', () => {
      expect(PAPER_SIZES['A6'].label).toBe('A6 (105 x 148 mm)')
    })

    it('A4 has correct label', () => {
      expect(PAPER_SIZES['A4'].label).toBe('A4 (210 x 297 mm)')
    })

    it('Letter has correct label', () => {
      expect(PAPER_SIZES['Letter'].label).toBe('Letter (216 x 279 mm)')
    })
  })
})
