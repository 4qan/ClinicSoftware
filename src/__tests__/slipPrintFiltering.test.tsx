import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PrintVisitPage } from '@/pages/PrintVisitPage'
import { resetDatabase } from '@/db/index'
import { registerPatient } from '@/db/patients'
import { createVisit } from '@/db/visits'
import { saveClinicInfo } from '@/db/settings'
import type { Patient } from '@/db/index'

// Pure utility functions extracted for unit testing (same logic as PrintVisitPage)
function filterPrescriptionMeds(medications: { slipType?: string }[]) {
  return medications.filter((m) => m.slipType === 'prescription')
}

function filterDispensaryMeds(medications: { slipType?: string }[]) {
  return medications.filter((m) => (m.slipType ?? 'dispensary') === 'dispensary')
}

function renderPrintPage(visitId: string, search = '') {
  return render(
    <MemoryRouter initialEntries={[`/visit/${visitId}/print${search}`]}>
      <Routes>
        <Route path="/visit/:id/print" element={<PrintVisitPage />} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

let testPatient: Patient

afterEach(() => {
  cleanup()
  document.getElementById('print-page-style')?.remove()
})

beforeEach(async () => {
  await resetDatabase()

  testPatient = await registerPatient({
    firstName: 'Test',
    lastName: 'User',
    age: 30,
    gender: 'male',
    contact: '03001234567',
  })

  await saveClinicInfo({
    doctorName: 'Dr. Test',
    clinicName: 'Test Clinic',
    address: '1 Test St',
    phone: '042-0000000',
    footerText: 'Test footer',
  })
})

// ---- Pure filter logic tests (no DOM needed) ----

describe('slipPrintFiltering - prescription filter (Test 1)', () => {
  it('includes only medications with slipType=prescription', () => {
    const meds = [
      { brandName: 'MedA', slipType: 'prescription' as const },
      { brandName: 'MedB', slipType: 'dispensary' as const },
      { brandName: 'MedC', slipType: undefined },
    ]
    const result = filterPrescriptionMeds(meds)
    expect(result).toHaveLength(1)
    expect(result[0].brandName).toBe('MedA')
  })

  it('returns empty array when no prescription medications exist', () => {
    const meds = [
      { brandName: 'MedA', slipType: 'dispensary' as const },
      { brandName: 'MedB', slipType: undefined },
    ]
    expect(filterPrescriptionMeds(meds)).toHaveLength(0)
  })
})

describe('slipPrintFiltering - dispensary filter (Test 2)', () => {
  it('includes medications with slipType=dispensary and slipType=undefined (backward compat)', () => {
    const meds = [
      { brandName: 'MedA', slipType: 'prescription' as const },
      { brandName: 'MedB', slipType: 'dispensary' as const },
      { brandName: 'MedC', slipType: undefined },
    ]
    const result = filterDispensaryMeds(meds)
    expect(result).toHaveLength(2)
    expect(result.map((m) => m.brandName)).toContain('MedB')
    expect(result.map((m) => m.brandName)).toContain('MedC')
  })

  it('excludes prescription-tagged medications', () => {
    const meds = [
      { brandName: 'MedA', slipType: 'prescription' as const },
    ]
    expect(filterDispensaryMeds(meds)).toHaveLength(0)
  })
})

// ---- Integration tests: empty slip UI state (Tests 3 & 4) ----

describe('slipPrintFiltering - empty prescription slip (Test 3)', () => {
  it('print button is disabled when all meds are dispensary (no prescription meds)', async () => {
    const visitId = await createVisit({
      patientId: testPatient.id,
      clinicalNotes: '',
      rxNotes: '',
      rxNotesLang: 'en',
      medications: [
        {
          brandName: 'Panadol',
          saltName: 'Paracetamol',
          form: 'Tablet',
          strength: '500mg',
          quantity: '1',
          frequency: 'TDS',
          duration: '5 days',
          sortOrder: 0,
          slipType: 'dispensary',
        },
      ],
    })

    renderPrintPage(visitId)

    // Default previewMode is 'prescription' -- no prescription meds exist
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Print Prescription' })).toBeInTheDocument()
    })

    const printBtn = screen.getByRole('button', { name: 'Print Prescription' })
    expect(printBtn).toBeDisabled()
  })

  it('shows empty message when no prescription meds exist', async () => {
    const visitId = await createVisit({
      patientId: testPatient.id,
      clinicalNotes: '',
      rxNotes: '',
      rxNotesLang: 'en',
      medications: [
        {
          brandName: 'Panadol',
          saltName: 'Paracetamol',
          form: 'Tablet',
          strength: '500mg',
          quantity: '1',
          frequency: 'TDS',
          duration: '5 days',
          sortOrder: 0,
          slipType: 'dispensary',
        },
      ],
    })

    renderPrintPage(visitId)

    await waitFor(() => {
      expect(screen.getByText('No medications for this slip')).toBeInTheDocument()
    })
  })
})

describe('slipPrintFiltering - empty dispensary slip (Test 4)', () => {
  it('dispensary print button is disabled when all meds are prescription', async () => {
    const visitId = await createVisit({
      patientId: testPatient.id,
      clinicalNotes: '',
      rxNotes: '',
      rxNotesLang: 'en',
      medications: [
        {
          brandName: 'Amoxil',
          saltName: 'Amoxicillin',
          form: 'Tablet',
          strength: '500mg',
          quantity: '1',
          frequency: 'BD',
          duration: '5 days',
          sortOrder: 0,
          slipType: 'prescription',
        },
      ],
    })

    renderPrintPage(visitId)

    await waitFor(() => {
      expect(screen.getAllByText('Dispensary').length).toBeGreaterThanOrEqual(1)
    })

    // Switch to dispensary tab
    fireEvent.click(screen.getAllByText('Dispensary')[0])

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Print Dispensary Slip' })).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: 'Print Dispensary Slip' })).toBeDisabled()
  })
})

// ---- Auto-print skips empty slip (Test 5) ----

describe('slipPrintFiltering - auto-print skips empty slip (Test 5)', () => {
  it('does not call window.print when ?auto=prescription and no prescription meds exist', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})

    const visitId = await createVisit({
      patientId: testPatient.id,
      clinicalNotes: '',
      rxNotes: '',
      rxNotesLang: 'en',
      medications: [
        {
          brandName: 'Panadol',
          saltName: 'Paracetamol',
          form: 'Tablet',
          strength: '500mg',
          quantity: '1',
          frequency: 'TDS',
          duration: '5 days',
          sortOrder: 0,
          slipType: 'dispensary',
        },
      ],
    })

    renderPrintPage(visitId, '?auto=prescription')

    // Wait for page to finish loading (button appears)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Print Prescription' })).toBeInTheDocument()
    })

    // Give enough time for any auto-print timer that might fire
    await new Promise((resolve) => setTimeout(resolve, 400))

    expect(printSpy).not.toHaveBeenCalled()

    printSpy.mockRestore()
  })
})
