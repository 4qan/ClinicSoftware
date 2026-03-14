import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PrintVisitPage } from '@/pages/PrintVisitPage'
import { resetDatabase } from '@/db/index'
import { registerPatient } from '@/db/patients'
import { createVisit } from '@/db/visits'
import { saveClinicInfo } from '@/db/settings'
import type { Patient } from '@/db/index'

function renderPrintPage(visitId: string, query = '') {
  return render(
    <MemoryRouter initialEntries={[`/visit/${visitId}/print${query}`]}>
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
  document.getElementById('print-page-style')?.remove()
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
      },
    ],
  })
})

describe('PrintVisitPage keyboard navigation (PRNT-01)', () => {
  it('toggle tab buttons have tabIndex={-1} and are skipped in tab order', async () => {
    renderPrintPage(testVisitId)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Prescription' })).toBeInTheDocument()
    })

    const prescriptionToggle = screen.getByRole('button', { name: 'Prescription' })
    const dispensaryToggle = screen.getByRole('button', { name: 'Dispensary' })

    expect(prescriptionToggle).toHaveAttribute('tabindex', '-1')
    expect(dispensaryToggle).toHaveAttribute('tabindex', '-1')
  })

  it('Print button receives autoFocus on mount', async () => {
    renderPrintPage(testVisitId)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Print Prescription' })).toBeInTheDocument()
    })

    const printButton = screen.getByRole('button', { name: 'Print Prescription' })
    expect(document.activeElement).toBe(printButton)
  })
})

describe('PrintVisitPage Enter triggers print (PRNT-02)', () => {
  it('Enter on focused Print button calls window.print', async () => {
    const user = userEvent.setup()
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})

    renderPrintPage(testVisitId)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Print Prescription' })).toBeInTheDocument()
    })

    const printButton = screen.getByRole('button', { name: 'Print Prescription' })
    printButton.focus()
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(printSpy).toHaveBeenCalled()
    })

    printSpy.mockRestore()
  })
})

describe('PrintVisitPage focus restore after print (PRNT-03)', () => {
  it('focus returns to Print button after afterprint event fires', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})

    renderPrintPage(testVisitId)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Print Prescription' })).toBeInTheDocument()
    })

    // Click print to open dialog (simulated)
    const printBtns = screen.getAllByText('Print Prescription')
    fireEvent.click(printBtns[printBtns.length - 1])

    // Simulate print dialog closing
    window.dispatchEvent(new Event('afterprint'))

    await waitFor(() => {
      const printButton = screen.getByRole('button', { name: 'Print Prescription' })
      expect(document.activeElement).toBe(printButton)
    })

    printSpy.mockRestore()
  })

  it('focus returns to Print button after auto-print afterprint event', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})

    renderPrintPage(testVisitId, '?auto=prescription')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Print Prescription' })).toBeInTheDocument()
    })

    // Wait for auto-print timer (200ms) to have fired
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Simulate print dialog closing
    window.dispatchEvent(new Event('afterprint'))

    await waitFor(() => {
      const printButton = screen.getByRole('button', { name: 'Print Prescription' })
      expect(document.activeElement).toBe(printButton)
    })

    printSpy.mockRestore()
  })
})
