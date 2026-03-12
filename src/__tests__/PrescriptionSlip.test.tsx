import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { PrescriptionSlip } from '@/components/PrescriptionSlip'
import { calcScale, PAPER_SIZES, URDU_LINE_HEIGHTS } from '@/db/printSettings'
import type { Visit, VisitMedication, Patient } from '@/db/index'
import type { ClinicInfo } from '@/db/settings'

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
  },
]

const mockClinicInfo: ClinicInfo = {
  doctorName: 'Dr. Ali',
  clinicName: 'City Clinic',
  address: '123 Main St',
  phone: '042-1234567',
  footerText: 'Computer-generated prescription',
}

describe('PrescriptionSlip - scaling (SCALE-01)', () => {
  it('renders with A5 paperSize: root has fontSize 11pt and maxWidth 148mm', () => {
    const { container } = render(
      <PrescriptionSlip
        visit={mockVisit}
        medications={mockMedications}
        patient={mockPatient}
        clinicInfo={mockClinicInfo}
        paperSize="A5"
      />
    )

    const root = container.firstElementChild as HTMLElement
    // jsdom normalizes "11.0pt" to "11pt" (trailing zero dropped)
    expect(root.style.fontSize).toBe('11pt')
    expect(root.style.maxWidth).toBe('148mm')
  })

  it('renders with A4 paperSize: root has scaled fontSize and maxWidth 210mm', () => {
    const { container } = render(
      <PrescriptionSlip
        visit={mockVisit}
        medications={mockMedications}
        patient={mockPatient}
        clinicInfo={mockClinicInfo}
        paperSize="A4"
      />
    )

    const root = container.firstElementChild as HTMLElement
    const expectedFontSize = `${(11 * calcScale('A4')).toFixed(1)}pt`
    expect(root.style.fontSize).toBe(expectedFontSize)
    expect(root.style.maxWidth).toBe('210mm')
  })

  it('renders with A4 paperSize: h1 has scaled header fontSize', () => {
    const { container } = render(
      <PrescriptionSlip
        visit={mockVisit}
        medications={mockMedications}
        patient={mockPatient}
        clinicInfo={mockClinicInfo}
        paperSize="A4"
      />
    )

    const h1 = container.querySelector('h1') as HTMLElement
    const expectedFontSize = `${(14 * calcScale('A4')).toFixed(1)}pt`
    expect(h1.style.fontSize).toBe(expectedFontSize)
  })

  it('renders with Letter paperSize: root has scaled fontSize and maxWidth 216mm', () => {
    const { container } = render(
      <PrescriptionSlip
        visit={mockVisit}
        medications={mockMedications}
        patient={mockPatient}
        clinicInfo={mockClinicInfo}
        paperSize="Letter"
      />
    )

    const root = container.firstElementChild as HTMLElement
    const expectedFontSize = `${(11 * calcScale('Letter')).toFixed(1)}pt`
    expect(root.style.fontSize).toBe(expectedFontSize)
    expect(root.style.maxWidth).toBe(`${PAPER_SIZES['Letter'].width}mm`)
  })

  it('renders with A5 paperSize: root has maxWidth matching PAPER_SIZES.A5.width', () => {
    const { container } = render(
      <PrescriptionSlip
        visit={mockVisit}
        medications={mockMedications}
        patient={mockPatient}
        clinicInfo={mockClinicInfo}
        paperSize="A5"
      />
    )

    const root = container.firstElementChild as HTMLElement
    expect(root.style.maxWidth).toBe(`${PAPER_SIZES['A5'].width}mm`)
  })
})

describe('PrescriptionSlip - Urdu line-height (SCALE-03)', () => {
  it('root element has --urdu-line-height set to URDU_LINE_HEIGHTS.A5 for A5', () => {
    const { container } = render(
      <PrescriptionSlip
        visit={mockVisit}
        medications={mockMedications}
        patient={mockPatient}
        clinicInfo={mockClinicInfo}
        paperSize="A5"
      />
    )

    const root = container.firstElementChild as HTMLElement
    // CSS custom properties are available via getPropertyValue on inline style
    expect(root.style.getPropertyValue('--urdu-line-height')).toBe(
      String(URDU_LINE_HEIGHTS['A5'])
    )
  })

  it('root element has --urdu-line-height set to URDU_LINE_HEIGHTS.A4 for A4', () => {
    const { container } = render(
      <PrescriptionSlip
        visit={mockVisit}
        medications={mockMedications}
        patient={mockPatient}
        clinicInfo={mockClinicInfo}
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
      <PrescriptionSlip
        visit={mockVisit}
        medications={mockMedications}
        patient={mockPatient}
        clinicInfo={mockClinicInfo}
        paperSize="Letter"
      />
    )

    const root = container.firstElementChild as HTMLElement
    expect(root.style.getPropertyValue('--urdu-line-height')).toBe(
      String(URDU_LINE_HEIGHTS['Letter'])
    )
  })
})
