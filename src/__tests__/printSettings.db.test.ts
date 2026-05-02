import { describe, it, expect, beforeEach } from 'vitest'
import { resetDatabase } from '@/db/index'
import { putSetting } from '@/db/pouchdb'
import {
  getPrintSettings,
  savePrintSetting,
  calcMargin,
  calcScale,
  URDU_LINE_HEIGHTS,
  PAPER_SIZE_ORDER,
  PRESCRIPTION_SIZE_ORDER,
  PAPER_SIZES,
  DEFAULT_PRESCRIPTION_SIZE,
  DEFAULT_DISPENSARY_SIZE,
} from '@/db/printSettings'

describe('printSettings data layer', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  describe('getPrintSettings', () => {
    it('returns context-specific defaults (A4 prescription, Slip dispensary) when no DB keys exist', async () => {
      const settings = await getPrintSettings()
      expect(settings.prescriptionSize).toBe('A4')
      expect(settings.dispensarySize).toBe('Slip')
    })

    it('returns saved prescriptionSize after savePrintSetting', async () => {
      await savePrintSetting('printPrescriptionSize', 'A5')
      const settings = await getPrintSettings()
      expect(settings.prescriptionSize).toBe('A5')
      expect(settings.dispensarySize).toBe(DEFAULT_DISPENSARY_SIZE)
    })

    it('returns saved dispensarySize after savePrintSetting', async () => {
      await savePrintSetting('printDispensarySize', 'Letter')
      const settings = await getPrintSettings()
      expect(settings.dispensarySize).toBe('Letter')
      expect(settings.prescriptionSize).toBe(DEFAULT_PRESCRIPTION_SIZE)
    })

    it('each key saves independently', async () => {
      await savePrintSetting('printPrescriptionSize', 'A5')
      await savePrintSetting('printDispensarySize', 'Letter')
      const settings = await getPrintSettings()
      expect(settings.prescriptionSize).toBe('A5')
      expect(settings.dispensarySize).toBe('Letter')
    })

    it('returns the prescription default when DB contains an invalid value for prescriptionSize', async () => {
      await putSetting('printPrescriptionSize', 'A6')
      const settings = await getPrintSettings()
      expect(settings.prescriptionSize).toBe(DEFAULT_PRESCRIPTION_SIZE)
    })

    it('returns the dispensary default when DB contains an invalid value for dispensarySize', async () => {
      await putSetting('printDispensarySize', 'A6')
      const settings = await getPrintSettings()
      expect(settings.dispensarySize).toBe(DEFAULT_DISPENSARY_SIZE)
    })

    it('accepts Slip as a valid stored value for dispensary', async () => {
      await savePrintSetting('printDispensarySize', 'Slip')
      const settings = await getPrintSettings()
      expect(settings.dispensarySize).toBe('Slip')
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

    it('returns 0 for Slip (slip is the physical paper, no @page margin)', () => {
      expect(calcMargin('Slip')).toBe(0)
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

    it('returns ~0.527 for Slip (78/148)', () => {
      expect(calcScale('Slip')).toBeCloseTo(78 / 148, 5)
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

    it('has entry for Slip (required for type exhaustiveness; unused at runtime)', () => {
      expect(URDU_LINE_HEIGHTS['Slip']).toBeTypeOf('number')
    })

    it('has entries for every PaperSize', () => {
      for (const size of PAPER_SIZE_ORDER) {
        expect(URDU_LINE_HEIGHTS[size]).toBeTypeOf('number')
      }
    })
  })

  describe('PAPER_SIZE_ORDER', () => {
    it('is ordered A5, A4, Letter, Slip', () => {
      expect(PAPER_SIZE_ORDER).toEqual(['A5', 'A4', 'Letter', 'Slip'])
    })

    it('does not include A6', () => {
      expect(PAPER_SIZE_ORDER).not.toContain('A6')
    })
  })

  describe('PRESCRIPTION_SIZE_ORDER', () => {
    it('excludes Slip — prescription stays standard sizes only', () => {
      expect(PRESCRIPTION_SIZE_ORDER).not.toContain('Slip')
    })

    it('contains A5, A4, Letter in order', () => {
      expect(PRESCRIPTION_SIZE_ORDER).toEqual(['A5', 'A4', 'Letter'])
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

    it('Slip has 78x115mm dimensions and matching label', () => {
      expect(PAPER_SIZES['Slip'].width).toBe(78)
      expect(PAPER_SIZES['Slip'].height).toBe(115)
      expect(PAPER_SIZES['Slip'].label).toBe('Slip (78 x 115 mm)')
    })

    it('does not have an A6 entry', () => {
      expect(PAPER_SIZES).not.toHaveProperty('A6')
    })
  })
})
