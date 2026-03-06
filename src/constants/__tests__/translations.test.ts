import { describe, it, expect } from 'vitest'
import { toUrdu, buildUrduInstruction, buildDosageUrdu, buildDosageEnglish } from '@/constants/translations'
import {
  FREQUENCY_OPTIONS,
  DURATION_OPTIONS,
  MEDICATION_FORMS,
} from '@/constants/clinical'

describe('Translation coverage', () => {
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

describe('buildDosageUrdu', () => {
  it('tablet count: singular', () => {
    expect(buildDosageUrdu('Tablet', '1')).toBe('1 گولی')
  })

  it('tablet count: plural', () => {
    expect(buildDosageUrdu('Tablet', '2')).toBe('2 گولیاں')
  })

  it('tablet half: آدھی گولی', () => {
    expect(buildDosageUrdu('Tablet', '½')).toBe('آدھی گولی')
  })

  it('liquid: ml to ملی لیٹر', () => {
    expect(buildDosageUrdu('Syrup', '5 ml')).toBe('5 ملی لیٹر')
  })

  it('drops: singular', () => {
    expect(buildDosageUrdu('Drops', '1')).toBe('1 قطرہ')
  })

  it('drops: plural', () => {
    expect(buildDosageUrdu('Drops', '3')).toBe('3 قطرے')
  })

  it('topical: thin layer', () => {
    expect(buildDosageUrdu('Cream', 'Thin layer')).toBe('پتلی تہہ')
  })

  it('inhaler puffs', () => {
    expect(buildDosageUrdu('Inhaler', '2')).toBe('2 سپرے')
  })

  it('custom quantity passes through', () => {
    expect(buildDosageUrdu('Tablet', '12')).toBe('12 گولیاں')
  })
})

describe('buildDosageEnglish', () => {
  it('tablet count', () => {
    expect(buildDosageEnglish('Tablet', '1')).toBe('1 tablet')
    expect(buildDosageEnglish('Tablet', '2')).toBe('2 tablets')
  })

  it('liquid passes through', () => {
    expect(buildDosageEnglish('Syrup', '5 ml')).toBe('5 ml')
  })

  it('drops with unit', () => {
    expect(buildDosageEnglish('Drops', '2')).toBe('2 drops')
  })

  it('topical descriptors', () => {
    expect(buildDosageEnglish('Cream', 'Thin layer')).toBe('thin layer')
  })
})

describe('buildUrduInstruction', () => {
  it('oral tablet with standard duration produces natural sentence', () => {
    const result = buildUrduInstruction({ form: 'Tablet', dosage: '1', frequency: 'Twice daily', duration: '7 days' })
    expect(result).toEqual({
      urdu: '1 گولی دن میں دو بار لیں، 7 دن تک',
      english: 'Take 1 tablet, twice daily, for 7 days',
    })
  })

  it('topical cream uses لگائیں verb', () => {
    const result = buildUrduInstruction({ form: 'Cream', dosage: 'Thin layer', frequency: 'Twice daily', duration: '14 days' })
    expect(result.urdu).toContain('پتلی تہہ')
    expect(result.urdu).toContain('لگائیں')
    expect(result.urdu).toContain('تک')
    expect(result.english).toMatch(/^Apply/)
    expect(result.english).toContain('for 14 days')
  })

  it('ongoing duration uses continuous verb form', () => {
    const result = buildUrduInstruction({ form: 'Tablet', dosage: '1', frequency: 'Once daily', duration: 'Ongoing' })
    expect(result.urdu).toMatch(/لیتے رہیں$/)
    expect(result.urdu).not.toContain('تک')
    expect(result.english).toBe('Take 1 tablet, once daily, ongoing')
  })

  it('drops uses ڈالیں verb', () => {
    const result = buildUrduInstruction({ form: 'Drops', dosage: '2', frequency: 'Three times daily', duration: '5 days' })
    expect(result.urdu).toContain('2 قطرے')
    expect(result.urdu).toContain('ڈالیں')
    expect(result.urdu).toContain('5 دن تک')
    expect(result.english).toBe('Instill 2 drops, three times daily, for 5 days')
  })

  it('half tablet produces آدھی گولی', () => {
    const result = buildUrduInstruction({ form: 'Tablet', dosage: '½', frequency: 'Once daily', duration: '5 days' })
    expect(result.urdu).toContain('آدھی گولی')
    expect(result.english).toContain('½ tablet')
  })

  it('inhaler uses correct verbs', () => {
    const result = buildUrduInstruction({ form: 'Inhaler', dosage: '2', frequency: 'Twice daily', duration: '1 month' })
    expect(result.urdu).toContain('2 سپرے')
    expect(result.urdu).toContain('لیں')
    expect(result.english).toBe('Inhale 2 puffs, twice daily, for 1 month')
  })

  it('injection uses لگوائیں verb', () => {
    const result = buildUrduInstruction({ form: 'Injection', dosage: '1', frequency: 'Once daily', duration: '3 days' })
    expect(result.urdu).toContain('1 ٹیکا')
    expect(result.urdu).toContain('لگوائیں')
    expect(result.english).toMatch(/^Administer 1 injection/)
  })

  it('as needed duration uses standard verb with qualifier', () => {
    const result = buildUrduInstruction({ form: 'Tablet', dosage: '1', frequency: 'Twice daily', duration: 'As needed' })
    expect(result.urdu).toContain('لیں')
    expect(result.urdu).toContain('ضرورت کے مطابق')
    expect(result.urdu).not.toContain('تک')
    expect(result.english).toBe('Take 1 tablet, twice daily, as needed')
  })

  it('custom numeric quantity still constructs sentence', () => {
    const result = buildUrduInstruction({ form: 'Tablet', dosage: '12', frequency: 'Once daily', duration: '7 days' })
    expect(result.urdu).toBe('12 گولیاں دن میں ایک بار لیں، 7 دن تک')
    expect(result.english).toBe('Take 12 tablets, once daily, for 7 days')
  })
})
