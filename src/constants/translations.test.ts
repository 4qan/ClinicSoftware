import { describe, it, expect } from 'vitest'
import {
  DOSAGE_OPTIONS,
  FREQUENCY_OPTIONS,
  DURATION_OPTIONS,
  MEDICATION_FORMS,
} from './clinical'
import {
  dosageUrdu,
  frequencyUrdu,
  durationUrdu,
  formsUrdu,
  toUrdu,
} from './translations'

describe('translations', () => {
  describe('completeness — every clinical value has a translation', () => {
    it('covers all DOSAGE_OPTIONS', () => {
      for (const value of DOSAGE_OPTIONS) {
        expect(dosageUrdu[value], `Missing dosage translation: "${value}"`).toBeDefined()
      }
      expect(Object.keys(dosageUrdu).length).toBe(DOSAGE_OPTIONS.length)
    })

    it('covers all FREQUENCY_OPTIONS', () => {
      for (const value of FREQUENCY_OPTIONS) {
        expect(frequencyUrdu[value], `Missing frequency translation: "${value}"`).toBeDefined()
      }
      expect(Object.keys(frequencyUrdu).length).toBe(FREQUENCY_OPTIONS.length)
    })

    it('covers all DURATION_OPTIONS', () => {
      for (const value of DURATION_OPTIONS) {
        const urdu = toUrdu(value)
        expect(urdu, `Missing duration translation: "${value}"`).not.toBe(value)
      }
      // durationUrdu has 12 keys ("As needed" is in frequencyUrdu), but all 13 values resolve via toUrdu
    })

    it('covers all MEDICATION_FORMS', () => {
      for (const value of MEDICATION_FORMS) {
        expect(formsUrdu[value], `Missing form translation: "${value}"`).toBeDefined()
      }
      expect(Object.keys(formsUrdu).length).toBe(MEDICATION_FORMS.length)
    })
  })

  describe('toUrdu() correctness — spot checks', () => {
    it('translates dosage values', () => {
      expect(toUrdu('1 tablet')).toBe('1 گولی')
      expect(toUrdu('1/2 tablet')).toBe('آدھی گولی')
      expect(toUrdu('2 puffs')).toBe('2 سپرے')
    })

    it('translates frequency values', () => {
      expect(toUrdu('Once daily')).toBe('دن میں ایک بار')
      expect(toUrdu('After meals')).toBe('کھانے کے بعد')
      expect(toUrdu('Stat (single dose)')).toBe('فوری ایک خوراک')
    })

    it('translates duration values', () => {
      expect(toUrdu('7 days')).toBe('7 دن')
      expect(toUrdu('1 month')).toBe('1 مہینہ')
      expect(toUrdu('Ongoing')).toBe('جاری رکھیں')
    })

    it('translates medication forms', () => {
      expect(toUrdu('Tablet')).toBe('گولی')
      expect(toUrdu('Syrup')).toBe('شربت')
      expect(toUrdu('Ointment')).toBe('مرہم')
    })

    it('translates "As needed" (shared between frequency and duration)', () => {
      expect(toUrdu('As needed')).toBe('ضرورت کے مطابق')
    })
  })

  describe('toUrdu() fallback — unknown values return English', () => {
    it('returns unknown string as-is', () => {
      expect(toUrdu('unknown-value')).toBe('unknown-value')
    })

    it('returns empty string as-is', () => {
      expect(toUrdu('')).toBe('')
    })

    it('returns custom drug name as-is', () => {
      expect(toUrdu('Amoxicillin 500mg')).toBe('Amoxicillin 500mg')
    })
  })

  describe('no English leaks — every translated value is Urdu', () => {
    it('toUrdu returns non-English for all known clinical values', () => {
      const allValues = [
        ...DOSAGE_OPTIONS,
        ...FREQUENCY_OPTIONS,
        ...DURATION_OPTIONS,
        ...MEDICATION_FORMS,
      ]
      // Deduplicate ("As needed" appears twice)
      const unique = [...new Set(allValues)]
      for (const value of unique) {
        const urdu = toUrdu(value)
        expect(urdu, `"${value}" was not translated`).not.toBe(value)
      }
    })
  })
})
