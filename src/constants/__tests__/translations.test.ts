import { describe, it, expect } from 'vitest'
import { toUrdu } from '@/constants/translations'
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
