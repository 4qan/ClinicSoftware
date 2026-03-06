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
  it('oral tablet with standard duration', () => {
    const result = buildUrduInstruction({ form: 'Tablet', dosage: '1 tablet', frequency: 'Twice daily', duration: '7 days' })
    expect(result).toEqual({
      urdu: '1 گولی دن میں دو بار 7 دن کے لیے',
      english: 'Take 1 tablet, Twice daily, 7 days',
    })
  })

  it('topical cream', () => {
    const result = buildUrduInstruction({ form: 'Cream', dosage: 'Apply thin layer', frequency: 'Twice daily', duration: '14 days' })
    expect(result).not.toBeNull()
    expect(result!.urdu).toContain('پتلی تہہ لگائیں')
    expect(result!.urdu).toContain('کے لیے')
    expect(result!.english).toMatch(/^Apply/)
  })

  it('ongoing duration omits "کے لیے"', () => {
    const result = buildUrduInstruction({ form: 'Tablet', dosage: '1 tablet', frequency: 'Once daily', duration: 'Ongoing' })
    expect(result).not.toBeNull()
    expect(result!.urdu).toMatch(/جاری رکھیں$/)
    expect(result!.urdu).not.toContain('کے لیے')
  })

  it('drops with verb prefix', () => {
    const result = buildUrduInstruction({ form: 'Drops', dosage: '2 drops', frequency: 'Three times daily', duration: '5 days' })
    expect(result).not.toBeNull()
    expect(result!.english).toMatch(/^Instill/)
  })

  it('fallback returns null for untranslatable dosage', () => {
    const result = buildUrduInstruction({ form: 'Tablet', dosage: 'CustomDose', frequency: 'Once daily', duration: '7 days' })
    expect(result).toBeNull()
  })

  it('inhaler sentence', () => {
    const result = buildUrduInstruction({ form: 'Inhaler', dosage: '2 puffs', frequency: 'Twice daily', duration: '1 month' })
    expect(result).not.toBeNull()
    expect(result!.english).toMatch(/^Inhale/)
  })
})
