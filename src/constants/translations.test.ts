import { describe, it, expect } from 'vitest'
import {
  FREQUENCY_OPTIONS,
  DURATION_OPTIONS,
  MEDICATION_FORMS,
  QUANTITY_OPTIONS,
  FORM_TO_CATEGORY,
} from './clinical'
import {
  frequencyUrdu,
  formsUrdu,
  toUrdu,
  buildDosageUrdu,
  buildDosageEnglish,
} from './translations'

describe('translations', () => {
  describe('completeness — every clinical value has a translation', () => {
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
    })

    it('covers all MEDICATION_FORMS', () => {
      for (const value of MEDICATION_FORMS) {
        expect(formsUrdu[value], `Missing form translation: "${value}"`).toBeDefined()
      }
      expect(Object.keys(formsUrdu).length).toBe(MEDICATION_FORMS.length)
    })

    it('every form has a category mapping', () => {
      for (const form of MEDICATION_FORMS) {
        expect(FORM_TO_CATEGORY[form], `Missing category for form: "${form}"`).toBeDefined()
      }
    })

    it('every quantity option produces a non-passthrough Urdu dosage', () => {
      for (const [category, quantities] of Object.entries(QUANTITY_OPTIONS)) {
        // Pick a representative form for this category
        const form = Object.entries(FORM_TO_CATEGORY).find(([, cat]) => cat === category)?.[0]
        if (!form) continue
        for (const qty of quantities) {
          const urdu = buildDosageUrdu(form, qty)
          expect(urdu, `No Urdu for ${form}/${qty}`).toBeTruthy()
        }
      }
    })
  })

  describe('toUrdu() correctness — spot checks', () => {
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

  describe('buildDosageUrdu / buildDosageEnglish spot checks', () => {
    it('tablet quantities', () => {
      expect(buildDosageUrdu('Tablet', '1')).toBe('1 گولی')
      expect(buildDosageUrdu('Tablet', '½')).toBe('آدھی گولی')
      expect(buildDosageEnglish('Tablet', '1')).toBe('1 tablet')
      expect(buildDosageEnglish('Tablet', '½')).toBe('½ tablet')
    })

    it('liquid quantities', () => {
      expect(buildDosageUrdu('Syrup', '5 ml')).toBe('5 ملی لیٹر')
      expect(buildDosageEnglish('Syrup', '5 ml')).toBe('5 ml')
    })

    it('topical descriptors', () => {
      expect(buildDosageUrdu('Cream', 'Thin layer')).toBe('پتلی تہہ')
      expect(buildDosageEnglish('Cream', 'Thin layer')).toBe('thin layer')
    })
  })

  describe('toUrdu() fallback — unknown values return English', () => {
    it('returns unknown string as-is', () => {
      expect(toUrdu('unknown-value')).toBe('unknown-value')
    })

    it('returns empty string as-is', () => {
      expect(toUrdu('')).toBe('')
    })
  })

  describe('no English leaks — every translated value is Urdu', () => {
    it('toUrdu returns non-English for all known frequency/duration/form values', () => {
      const allValues = [
        ...FREQUENCY_OPTIONS,
        ...DURATION_OPTIONS,
        ...MEDICATION_FORMS,
      ]
      const unique = [...new Set(allValues)]
      for (const value of unique) {
        const urdu = toUrdu(value)
        expect(urdu, `"${value}" was not translated`).not.toBe(value)
      }
    })
  })
})
