import { describe, it, expect } from 'vitest'
import { render, within } from '@testing-library/react'
import { DispensarySlip, getFormCode, FORM_CODES, chunkByMeasuredHeight } from '@/components/DispensarySlip'
import { calcScale, PAPER_SIZES, URDU_LINE_HEIGHTS } from '@/db/printSettings'
import type { Visit, VisitMedication, Patient } from '@/db/index'

const mockPatient: Patient = {
  id: 'patient-1',
  patientId: 'P001',
  firstName: 'Ahmed',
  lastName: 'Khan',
  firstNameLower: 'ahmed',
  lastNameLower: 'khan',
  age: 35,
  gender: 'male',
  contact: '03001234567',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const mockVisit: Visit = {
  id: 'visit-1',
  patientId: 'patient-1',
  clinicalNotes: 'Fever',
  rxNotes: '',
  rxNotesLang: 'en',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const mockMedications: VisitMedication[] = [
  {
    id: 'med-1',
    visitId: 'visit-1',
    brandName: 'Panadol',
    saltName: 'Paracetamol',
    form: 'Tablet',
    strength: '500mg',
    quantity: '1',
    frequency: 'TDS',
    duration: '5 days',
    sortOrder: 0,
    // Urdu instruction for line-height testing
  },
]

describe('DispensarySlip - scaling (SCALE-02)', () => {
  it('renders with A5 paperSize: root has fontSize 10pt and maxWidth 148mm', () => {
    const { container } = render(
      <DispensarySlip
        visit={mockVisit}
        medications={mockMedications}
        patient={mockPatient}
        paperSize="A5"
      />
    )

    const root = container.firstElementChild as HTMLElement
    // A5 scale = 1.0, 10 * 1.0 = 10.0pt; jsdom drops trailing zero -> '10pt'
    expect(root.style.fontSize).toBe('10pt')
    expect(root.style.maxWidth).toBe('148mm')
  })

  it('renders with A4 paperSize: root has scaled fontSize and maxWidth 210mm', () => {
    const { container } = render(
      <DispensarySlip
        visit={mockVisit}
        medications={mockMedications}
        patient={mockPatient}
        paperSize="A4"
      />
    )

    const root = container.firstElementChild as HTMLElement
    const expectedFontSize = `${(10 * calcScale('A4')).toFixed(1)}pt`
    expect(root.style.fontSize).toBe(expectedFontSize)
    expect(root.style.maxWidth).toBe('210mm')
  })

  it('renders with Letter paperSize: root has scaled fontSize and maxWidth 216mm', () => {
    const { container } = render(
      <DispensarySlip
        visit={mockVisit}
        medications={mockMedications}
        patient={mockPatient}
        paperSize="Letter"
      />
    )

    const root = container.firstElementChild as HTMLElement
    const expectedFontSize = `${(10 * calcScale('Letter')).toFixed(1)}pt`
    expect(root.style.fontSize).toBe(expectedFontSize)
    expect(root.style.maxWidth).toBe(`${PAPER_SIZES['Letter'].width}mm`)
  })

  it('renders with A5 paperSize: root has maxWidth matching PAPER_SIZES.A5.width', () => {
    const { container } = render(
      <DispensarySlip
        visit={mockVisit}
        medications={mockMedications}
        patient={mockPatient}
        paperSize="A5"
      />
    )

    const root = container.firstElementChild as HTMLElement
    expect(root.style.maxWidth).toBe(`${PAPER_SIZES['A5'].width}mm`)
  })
})

describe('DispensarySlip - Urdu line-height (SCALE-02)', () => {
  it('root element has --urdu-line-height set to URDU_LINE_HEIGHTS.A5 for A5', () => {
    const { container } = render(
      <DispensarySlip
        visit={mockVisit}
        medications={mockMedications}
        patient={mockPatient}
        paperSize="A5"
      />
    )

    const root = container.firstElementChild as HTMLElement
    expect(root.style.getPropertyValue('--urdu-line-height')).toBe(
      String(URDU_LINE_HEIGHTS['A5'])
    )
  })

  it('root element has --urdu-line-height set to URDU_LINE_HEIGHTS.A4 for A4', () => {
    const { container } = render(
      <DispensarySlip
        visit={mockVisit}
        medications={mockMedications}
        patient={mockPatient}
        paperSize="A4"
      />
    )

    const root = container.firstElementChild as HTMLElement
    expect(root.style.getPropertyValue('--urdu-line-height')).toBe(
      String(URDU_LINE_HEIGHTS['A4'])
    )
  })

  it('root element has --urdu-line-height set to URDU_LINE_HEIGHTS.Letter for Letter', () => {
    const { container } = render(
      <DispensarySlip
        visit={mockVisit}
        medications={mockMedications}
        patient={mockPatient}
        paperSize="Letter"
      />
    )

    const root = container.firstElementChild as HTMLElement
    expect(root.style.getPropertyValue('--urdu-line-height')).toBe(
      String(URDU_LINE_HEIGHTS['Letter'])
    )
  })
})

// ============================================================
// Slip layout — 78x115mm B2 design
// ============================================================

const longBrandMedications: VisitMedication[] = [
  {
    id: 'med-long',
    visitId: 'visit-1',
    brandName: 'Augmentin Duo Forte 1g',
    saltName: 'Amoxicillin + Clavulanic Acid',
    form: 'Tablet',
    strength: '1g',
    quantity: '14',
    frequency: '1+0+1',
    duration: '7 days',
    sortOrder: 0,
  },
]

const mixedFormMedications: VisitMedication[] = [
  { id: 'm1', visitId: 'visit-1', brandName: 'Panadol',         saltName: 'Paracetamol',        form: 'Tablet',  strength: '500mg', quantity: '20',   frequency: '1+0+1', duration: '5d', sortOrder: 0 },
  { id: 'm2', visitId: 'visit-1', brandName: 'Calpol Suspension', saltName: 'Paracetamol',        form: 'Syrup',   strength: '120mg/5ml', quantity: '60ml', frequency: '5ml TDS', duration: '3d', sortOrder: 1 },
  { id: 'm3', visitId: 'visit-1', brandName: 'Ventolin',         saltName: 'Salbutamol',         form: 'Inhaler', strength: '100mcg', quantity: '1',    frequency: 'PRN',   duration: '1mo', sortOrder: 2 },
  { id: 'm4', visitId: 'visit-1', brandName: 'Calamine Lotion',  saltName: 'Calamine',           form: 'Lotion',  strength: '8%',    quantity: '60ml', frequency: 'BD',    duration: 'PRN', sortOrder: 3 },
]

function makeMeds(count: number): VisitMedication[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `med-${i}`,
    visitId: 'visit-1',
    brandName: `Medication ${i + 1}`,
    saltName: 'Active ingredient',
    form: 'Tablet',
    strength: '500mg',
    quantity: '10',
    frequency: '1+0+1',
    duration: '5 days',
    sortOrder: i,
  }))
}

describe('DispensarySlip - Slip layout (B2)', () => {
  it('renders B2 layout (no legacy table) at Slip size', () => {
    const { container, queryByRole } = render(
      <DispensarySlip
        visit={mockVisit}
        medications={mockMedications}
        patient={mockPatient}
        paperSize="Slip"
      />
    )
    // No 7-column table should exist
    expect(queryByRole('table')).toBeNull()
    // At least one slip page rendered with B2 markers
    const pages = container.querySelectorAll('[data-testid="slip-page"]')
    expect(pages.length).toBeGreaterThanOrEqual(1)
    expect(container.querySelector('[data-testid="qty-box"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="form-tag"]')).not.toBeNull()
  })

  it('uses 78mm width and 115mm min-height per slip page', () => {
    const { container } = render(
      <DispensarySlip
        visit={mockVisit}
        medications={mockMedications}
        patient={mockPatient}
        paperSize="Slip"
      />
    )
    const page = container.querySelector('[data-testid="slip-page"]') as HTMLElement
    expect(page).not.toBeNull()
    expect(page.style.width).toBe('78mm')
    expect(page.style.minHeight).toBe('115mm')
  })

  it('renders long brand names with word-break enabled (no overflow)', () => {
    const { container } = render(
      <DispensarySlip
        visit={mockVisit}
        medications={longBrandMedications}
        patient={mockPatient}
        paperSize="Slip"
      />
    )
    expect(container.textContent).toContain('Augmentin Duo Forte 1g')
    // The brand name container has wordBreak: 'break-word' applied via inline style
    const med = container.querySelector('.slip-med') as HTMLElement
    const brandEl = med.querySelector('div > div > div') as HTMLElement
    // Walk to the brand-name div (first child of the body column)
    const allDivs = med.querySelectorAll('div')
    const brand = Array.from(allDivs).find((d) => d.textContent === 'Augmentin Duo Forte 1g') as HTMLElement
    expect(brand).toBeDefined()
    expect(brand.style.wordBreak).toBe('break-word')
    expect(brand).toBeTruthy()
    expect(brandEl).toBeTruthy() // silence unused
  })

  it('renders correct uppercase form tag for each medication form', () => {
    const { container } = render(
      <DispensarySlip
        visit={mockVisit}
        medications={mixedFormMedications}
        patient={mockPatient}
        paperSize="Slip"
      />
    )
    const tags = Array.from(container.querySelectorAll('[data-testid="form-tag"]')).map(
      (el) => el.textContent
    )
    expect(tags).toEqual(['TAB', 'SYR', 'INH', 'LOT'])
  })

  it('shows Page X / Y footer on every slip page', () => {
    const { container } = render(
      <DispensarySlip
        visit={mockVisit}
        medications={makeMeds(10)}
        patient={mockPatient}
        paperSize="Slip"
      />
    )
    const footers = container.querySelectorAll('[data-testid="slip-footer"]')
    expect(footers.length).toBeGreaterThanOrEqual(1)
    footers.forEach((footer, idx) => {
      expect(footer.textContent).toMatch(new RegExp(`^Page ${idx + 1} / ${footers.length}$`))
    })
  })

  it('repeats the slip header on every page (10 meds → multiple pages with header each)', () => {
    const { container } = render(
      <DispensarySlip
        visit={mockVisit}
        medications={makeMeds(10)}
        patient={mockPatient}
        paperSize="Slip"
      />
    )
    const pages = container.querySelectorAll('[data-testid="slip-page"]')
    // jsdom path: chunkByMeasuredHeight fallback splits 10 meds → 2 pages of 6+4
    expect(pages.length).toBe(2)
    pages.forEach((page) => {
      const header = within(page as HTMLElement).getByTestId('slip-header')
      expect(header.textContent).toContain('Dispensary Slip')
      expect(header.textContent).toContain('Ahmed Khan')
    })
  })

  it('numbers medications continuously across pages (not per-page)', () => {
    const { container } = render(
      <DispensarySlip
        visit={mockVisit}
        medications={makeMeds(10)}
        patient={mockPatient}
        paperSize="Slip"
      />
    )
    const indices = Array.from(container.querySelectorAll('[data-med-idx]')).map((el) =>
      Number(el.getAttribute('data-med-idx'))
    )
    expect(indices).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })
})

describe('DispensarySlip - getFormCode helper', () => {
  it('returns the configured short code for known forms', () => {
    expect(getFormCode('Tablet')).toBe('TAB')
    expect(getFormCode('Capsule')).toBe('CAP')
    expect(getFormCode('Syrup')).toBe('SYR')
    expect(getFormCode('Inhaler')).toBe('INH')
    expect(getFormCode('Lotion')).toBe('LOT')
  })

  it('falls back to first 3 chars uppercase for unknown forms', () => {
    expect(getFormCode('GelPatch')).toBe('GEL')
    expect(getFormCode('xx')).toBe('XX')
  })

  it('FORM_CODES contains the documented twelve common forms', () => {
    expect(Object.keys(FORM_CODES).sort()).toEqual(
      ['Capsule', 'Cream', 'Drops', 'Inhaler', 'Injection', 'Lotion', 'Ointment', 'Sachet', 'Spray', 'Suspension', 'Syrup', 'Tablet']
    )
  })
})

describe('DispensarySlip - chunkByMeasuredHeight (pure)', () => {
  it('splits by fixed count when all heights are zero (jsdom fallback)', () => {
    const heights = Array(10).fill(0)
    const chunks = chunkByMeasuredHeight(heights, 1000)
    // Default fallback is 6 per page → 6 + 4
    expect(chunks).toEqual([
      [0, 1, 2, 3, 4, 5],
      [6, 7, 8, 9],
    ])
  })

  it('splits by accumulated measured height when available', () => {
    // Each med 50px tall, available area 120px → 2 fit per page
    const heights = [50, 50, 50, 50, 50]
    const chunks = chunkByMeasuredHeight(heights, 120)
    expect(chunks).toEqual([
      [0, 1],
      [2, 3],
      [4],
    ])
  })

  it('keeps a single oversized item on its own page rather than infinite-splitting', () => {
    const heights = [200, 30, 30]
    const chunks = chunkByMeasuredHeight(heights, 100)
    expect(chunks[0]).toEqual([0])
    expect(chunks[1]).toEqual([1, 2])
  })

  it('returns a single empty chunk when input is empty', () => {
    expect(chunkByMeasuredHeight([], 1000)).toEqual([[]])
  })
})
