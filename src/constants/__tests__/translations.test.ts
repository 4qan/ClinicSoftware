import { describe, it, expect } from 'vitest'
import { toUrdu, buildUrduInstruction } from '@/constants/translations'
import {
  DOSAGE_OPTIONS,
  FREQUENCY_OPTIONS,
  DURATION_OPTIONS,
  MEDICATION_FORMS,
} from '@/constants/clinical'

describe('Translation coverage', () => {
  it('every predefined dosage option has a non-passthrough Urdu translation', () => {
    const missing = DOSAGE_OPTIONS.filter((v) => toUrdu(v) === v)
    expect(missing, `Missing Urdu translations for dosage: ${missing.join(', ')}`).toEqual([])
  })

  it('every predefined frequency option has a non-passthrough Urdu translation', () => {
    const missing = FREQUENCY_OPTIONS.filter((v) => toUrdu(v) === v)
    expect(missing, `Missing Urdu translations for frequency: ${missing.join(', ')}`).toEqual([])
  })

  it('every predefined duration option has a non-passthrough Urdu translation', () => {
    const missing = DURATION_OPTIONS.filter((v) => toUrdu(v) === v)
    expect(missing, `Missing Urdu translations for duration: ${missing.join(', ')}`).toEqual([])
  })

  it('every predefined medication form has a non-passthrough Urdu translation', () => {
    const missing = MEDICATION_FORMS.filter((v) => toUrdu(v) === v)
    expect(missing, `Missing Urdu translations for forms: ${missing.join(', ')}`).toEqual([])
  })

  it('toUrdu falls back to original string for unknown values', () => {
    expect(toUrdu('SomeCustomValue')).toBe('SomeCustomValue')
    expect(toUrdu('')).toBe('')
  })
})

describe('buildUrduInstruction', () => {
  it('oral tablet with standard duration produces natural sentence', () => {
    const result = buildUrduInstruction({ form: 'Tablet', dosage: '1 tablet', frequency: 'Twice daily', duration: '7 days' })
    expect(result).toEqual({
      urdu: '1 گولی دن میں دو بار لیں، 7 دن تک',
      english: 'Take 1 tablet, twice daily, for 7 days',
    })
  })

  it('topical cream uses لگائیں verb', () => {
    const result = buildUrduInstruction({ form: 'Cream', dosage: 'Apply thin layer', frequency: 'Twice daily', duration: '14 days' })
    expect(result).not.toBeNull()
    expect(result!.urdu).toContain('پتلی تہہ')
    expect(result!.urdu).toContain('لگائیں')
    expect(result!.urdu).toContain('تک')
    expect(result!.english).toMatch(/^Apply/)
    expect(result!.english).toContain('for 14 days')
  })

  it('ongoing duration uses continuous verb form', () => {
    const result = buildUrduInstruction({ form: 'Tablet', dosage: '1 tablet', frequency: 'Once daily', duration: 'Ongoing' })
    expect(result).not.toBeNull()
    expect(result!.urdu).toMatch(/لیتے رہیں$/)
    expect(result!.urdu).not.toContain('تک')
    expect(result!.english).toBe('Take 1 tablet, once daily, ongoing')
  })

  it('drops uses ڈالیں verb', () => {
    const result = buildUrduInstruction({ form: 'Drops', dosage: '2 drops', frequency: 'Three times daily', duration: '5 days' })
    expect(result).not.toBeNull()
    expect(result!.urdu).toContain('ڈالیں')
    expect(result!.urdu).toContain('5 دن تک')
    expect(result!.english).toMatch(/^Instill/)
    expect(result!.english).toContain('for 5 days')
  })

  it('fallback returns null for untranslatable dosage', () => {
    const result = buildUrduInstruction({ form: 'Tablet', dosage: 'CustomDose', frequency: 'Once daily', duration: '7 days' })
    expect(result).toBeNull()
  })

  it('inhaler uses correct English verb', () => {
    const result = buildUrduInstruction({ form: 'Inhaler', dosage: '2 puffs', frequency: 'Twice daily', duration: '1 month' })
    expect(result).not.toBeNull()
    expect(result!.urdu).toContain('لیں')
    expect(result!.urdu).toContain('1 مہینہ تک')
    expect(result!.english).toBe('Inhale 2 puffs, twice daily, for 1 month')
  })

  it('injection uses لگوائیں verb', () => {
    const result = buildUrduInstruction({ form: 'Injection', dosage: '1 injection', frequency: 'Once daily', duration: '3 days' })
    expect(result).not.toBeNull()
    expect(result!.urdu).toContain('لگوائیں')
    expect(result!.english).toMatch(/^Administer/)
  })

  it('as needed duration uses standard verb with qualifier', () => {
    const result = buildUrduInstruction({ form: 'Tablet', dosage: '1 tablet', frequency: 'Twice daily', duration: 'As needed' })
    expect(result).not.toBeNull()
    expect(result!.urdu).toContain('لیں')
    expect(result!.urdu).toContain('ضرورت کے مطابق')
    expect(result!.urdu).not.toContain('تک')
    expect(result!.english).toBe('Take 1 tablet, twice daily, as needed')
  })
})
