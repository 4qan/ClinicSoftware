import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PrintVisitPage } from '@/pages/PrintVisitPage'
import { resetDatabase } from '@/db/index'
import { registerPatient } from '@/db/patients'
import { createVisit } from '@/db/visits'
import { saveClinicInfo } from '@/db/settings'
import type { Patient } from '@/db/index'

function renderPrintPage(visitId: string) {
  return render(
    <MemoryRouter initialEntries={[`/visit/${visitId}/print`]}>
      <Routes>
        <Route path="/visit/:id/print" element={<PrintVisitPage />} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

let testPatient: Patient
let testVisitId: string

afterEach(() => {
  cleanup()
})

beforeEach(async () => {
  await resetDatabase()

  testPatient = await registerPatient({
    firstName: 'Ahmed',
    lastName: 'Khan',
    age: 35,
    gender: 'male',
    contact: '03001234567',
  })

  await saveClinicInfo({
    doctorName: 'Dr. Ali',
    clinicName: 'City Clinic',
    address: '123 Main St',
    phone: '042-1234567',
    footerText: 'Computer-generated prescription',
  })

  testVisitId = await createVisit({
    patientId: testPatient.id,
    clinicalNotes: 'Complaint: Fever\nDiagnosis: Viral',
    rxNotes: 'Take with food',
    medications: [
      {
        brandName: 'Panadol',
        saltName: 'Paracetamol',
        form: 'Tablet',
        strength: '500mg',
        dosage: '1',
        frequency: 'TDS',
        duration: '5 days',
        sortOrder: 0,
      },
    ],
  })
})

describe('PrintVisitPage', () => {
  it('renders loading state initially', () => {
    renderPrintPage(testVisitId)
    expect(screen.getByText('Loading prescription...')).toBeInTheDocument()
  })

  it('shows not found for invalid visit ID', async () => {
    renderPrintPage('non-existent-id')

    await waitFor(() => {
      expect(screen.getByText('Visit not found')).toBeInTheDocument()
    })
  })

  it('loads and displays visit data with print buttons', async () => {
    renderPrintPage(testVisitId)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Print Prescription' })).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: 'Print Dispensary Slip' })).toBeInTheDocument()
    // Patient name appears in breadcrumbs and slips
    expect(screen.getAllByText(/Ahmed Khan/).length).toBeGreaterThanOrEqual(1)
  })

  it('displays breadcrumbs with patient name link', async () => {
    renderPrintPage(testVisitId)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Print Prescription' })).toBeInTheDocument()
    })

    const breadcrumbNav = screen.getByLabelText('Breadcrumb')
    expect(breadcrumbNav).toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  it('shows prescription slip content as preview', async () => {
    renderPrintPage(testVisitId)

    await waitFor(() => {
      // The prescription slip should be visible (not hidden)
      const prescriptionSlip = document.querySelector('.prescription-slip')
      expect(prescriptionSlip).toBeInTheDocument()
    })
  })

  it('calls window.print when Print Prescription is clicked', async () => {
    const user = userEvent.setup()
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})

    renderPrintPage(testVisitId)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Print Prescription' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Print Prescription' }))

    await waitFor(() => {
      expect(printSpy).toHaveBeenCalled()
    })

    printSpy.mockRestore()
  })

  it('calls window.print when Print Dispensary Slip is clicked', async () => {
    const user = userEvent.setup()
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})

    renderPrintPage(testVisitId)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Print Dispensary Slip' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Print Dispensary Slip' }))

    await waitFor(() => {
      expect(printSpy).toHaveBeenCalled()
    })

    printSpy.mockRestore()
  })
})
