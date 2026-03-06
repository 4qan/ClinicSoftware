import { describe, it, expect } from 'vitest'
import { formatDrugSearchResult, formatDrugSelected } from '@/utils/drugFormatters'
import type { Drug } from '@/db/index'

const mockDrug: Drug = {
  id: 'drug-1',
  brandName: 'Augmentin',
  saltName: 'Amoxicillin/Clavulanate',
  strength: '625mg',
  form: 'Tablet',
}

const minimalDrug: Drug = {
  id: 'drug-2',
  brandName: 'Panadol',
  saltName: '',
  strength: '',
  form: '',
}

describe('drugFormatters', () => {
  describe('formatDrugSearchResult', () => {
    it('returns full detail string with brand + salt + strength + form', () => {
      expect(formatDrugSearchResult(mockDrug)).toBe(
        'Augmentin (Amoxicillin/Clavulanate 625mg Tablet)'
      )
    })

    it('returns brand name only when no details exist', () => {
      expect(formatDrugSearchResult(minimalDrug)).toBe('Panadol')
    })

    it('includes only available details', () => {
      const partial: Drug = {
        id: 'drug-3',
        brandName: 'Brufen',
        saltName: 'Ibuprofen',
        strength: '',
        form: 'Tablet',
      }
      expect(formatDrugSearchResult(partial)).toBe('Brufen (Ibuprofen Tablet)')
    })
  })

  describe('formatDrugSelected', () => {
    it('returns brand name only', () => {
      expect(formatDrugSelected(mockDrug)).toBe('Augmentin')
    })

    it('returns brand name only even when all details exist', () => {
      expect(formatDrugSelected(mockDrug)).toBe('Augmentin')
    })
  })
})
