import { describe, it, expect } from 'vitest'
import { formatDrugSearchResult, formatDrugSelected } from '@/utils/drugFormatters'
import type { Drug } from '@/db/index'

const baseDrug = {
  brandNameLower: '',
  saltNameLower: '',
  isCustom: false,
  isActive: true,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

const mockDrug: Drug = {
  ...baseDrug,
  id: 'drug-1',
  brandName: 'Augmentin',
  brandNameLower: 'augmentin',
  saltName: 'Amoxicillin/Clavulanate',
  saltNameLower: 'amoxicillin/clavulanate',
  strength: '625mg',
  form: 'Tablet',
}

const minimalDrug: Drug = {
  ...baseDrug,
  id: 'drug-2',
  brandName: 'Panadol',
  brandNameLower: 'panadol',
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
        ...baseDrug,
        id: 'drug-3',
        brandName: 'Brufen',
        brandNameLower: 'brufen',
        saltName: 'Ibuprofen',
        saltNameLower: 'ibuprofen',
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
