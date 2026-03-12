import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PrintVisitPage } from '@/pages/PrintVisitPage'
import { db, resetDatabase } from '@/db/index'
import { registerPatient } from '@/db/patients'
import { createVisit } from '@/db/visits'
import { saveClinicInfo } from '@/db/settings'
import { savePrintSetting } from '@/db/printSettings'
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
  // Remove injected print style to prevent jsdom CSS crash in subsequent tests
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

describe('PrintVisitPage - dynamic @page injection (PRENG-01)', () => {
  it('injects @page style into document.head before window.print with A5 default', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})

    renderPrintPage(testVisitId)

    await waitFor(() => {
      // 'Print Prescription' appears in both breadcrumb and button; use getAllByText
      expect(screen.getAllByText('Print Prescription').length).toBeGreaterThanOrEqual(1)
    })

    // Click the print button (last occurrence is the button in the toolbar)
    const printBtns = screen.getAllByText('Print Prescription')
    fireEvent.click(printBtns[printBtns.length - 1])

    // Style injected synchronously before setTimeout fires
    const styleEl = document.getElementById('print-page-style')
    expect(styleEl).not.toBeNull()
    expect(styleEl!.textContent).toContain('@page { size: A5 portrait; margin: 8mm; }')

    printSpy.mockRestore()
  })

  it('injects correct @page for non-default paper size (A4)', async () => {
    await savePrintSetting('printPrescriptionSize', 'A4')
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})

    renderPrintPage(testVisitId)

    await waitFor(() => {
      expect(screen.getAllByText('Print Prescription').length).toBeGreaterThanOrEqual(1)
    })

    const printBtns = screen.getAllByText('Print Prescription')
    fireEvent.click(printBtns[printBtns.length - 1])

    const styleEl = document.getElementById('print-page-style')
    expect(styleEl).not.toBeNull()
    expect(styleEl!.textContent).toContain('size: A4 portrait; margin: 10mm')

    printSpy.mockRestore()
  })

  it('removes @page style on afterprint event', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})

    renderPrintPage(testVisitId)

    await waitFor(() => {
      expect(screen.getAllByText('Print Prescription').length).toBeGreaterThanOrEqual(1)
    })

    const printBtns = screen.getAllByText('Print Prescription')
    fireEvent.click(printBtns[printBtns.length - 1])

    // Style should be present after print trigger
    expect(document.getElementById('print-page-style')).not.toBeNull()

    // Simulate afterprint event
    window.dispatchEvent(new Event('afterprint'))

    await waitFor(() => {
      expect(document.getElementById('print-page-style')).toBeNull()
    })

    printSpy.mockRestore()
  })
})

describe('PrintVisitPage - conditional rendering (PRENG-03)', () => {
  it('only prescription slip is in DOM when prescription preview is active', async () => {
    renderPrintPage(testVisitId)

    await waitFor(() => {
      expect(document.querySelector('.prescription-slip')).toBeInTheDocument()
    })

    // Default previewMode is prescription: only prescription slip should be present
    expect(document.querySelector('.prescription-slip')).not.toBeNull()
    expect(document.querySelector('.dispensary-slip')).toBeNull()
  })

  it('only dispensary slip is in DOM when dispensary preview is active', async () => {
    renderPrintPage(testVisitId)

    await waitFor(() => {
      // Wait for page to load
      expect(screen.getAllByText('Dispensary').length).toBeGreaterThanOrEqual(1)
    })

    fireEvent.click(screen.getAllByText('Dispensary')[0])

    await waitFor(() => {
      expect(document.querySelector('.dispensary-slip')).not.toBeNull()
    })

    expect(document.querySelector('.prescription-slip')).toBeNull()
  })

  it('only prescription slip in DOM when print mode is prescription', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})

    renderPrintPage(testVisitId)

    await waitFor(() => {
      expect(screen.getAllByText('Print Prescription').length).toBeGreaterThanOrEqual(1)
    })

    const printBtns = screen.getAllByText('Print Prescription')
    fireEvent.click(printBtns[printBtns.length - 1])

    // After clicking print (prescription), only prescription slip should be in DOM
    expect(document.querySelector('.prescription-slip')).not.toBeNull()
    expect(document.querySelector('.dispensary-slip')).toBeNull()

    printSpy.mockRestore()
  })

  it('only dispensary slip in DOM when print mode is dispensary', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})

    renderPrintPage(testVisitId)

    await waitFor(() => {
      expect(screen.getAllByText('Dispensary').length).toBeGreaterThanOrEqual(1)
    })

    fireEvent.click(screen.getAllByText('Dispensary')[0])

    await waitFor(() => {
      expect(screen.getByText('Print Dispensary Slip')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Print Dispensary Slip'))

    // After clicking print (dispensary), only dispensary slip should be in DOM
    await waitFor(() => {
      expect(document.querySelector('.dispensary-slip')).not.toBeNull()
    })
    expect(document.querySelector('.prescription-slip')).toBeNull()

    printSpy.mockRestore()
  })
})

describe('PrintVisitPage - size badge', () => {
  it('displays paper size badge with default A5 for prescription preview', async () => {
    renderPrintPage(testVisitId)

    await waitFor(() => {
      expect(screen.getByText('Paper: A5 (148 x 210 mm)')).toBeInTheDocument()
    })
  })

  it('displays correct badge when prescription size is set to A4', async () => {
    await savePrintSetting('printPrescriptionSize', 'A4')

    renderPrintPage(testVisitId)

    await waitFor(() => {
      expect(screen.getByText('Paper: A4 (210 x 297 mm)')).toBeInTheDocument()
    })
  })

  it('shows A5 badge when stored size is A6 (fallback)', async () => {
    await db.settings.put({ key: 'printDispensarySize', value: 'A6' })

    renderPrintPage(testVisitId)

    await waitFor(() => {
      expect(screen.getAllByText('Dispensary').length).toBeGreaterThanOrEqual(1)
    })

    fireEvent.click(screen.getAllByText('Dispensary')[0])

    await waitFor(() => {
      // A6 falls back to A5; badge should show A5 dimensions
      expect(screen.getByText('Paper: A5 (148 x 210 mm)')).toBeInTheDocument()
    })
  })
})

describe('PrintVisitPage - preview frame dimensions (SCALE-04)', () => {
  it('preview frame dimensions match A5 paper proportions by default', async () => {
    renderPrintPage(testVisitId)

    await waitFor(() => {
      expect(screen.getAllByText('Print Prescription').length).toBeGreaterThanOrEqual(1)
    })

    const frame = document.querySelector('[data-testid="preview-frame"]') as HTMLElement
    expect(frame).not.toBeNull()
    // A5: width=148mm, height=210mm; PREVIEW_PX_PER_MM=2.8
    expect(frame.style.width).toBe(`${Math.round(148 * 2.8)}px`)
    expect(frame.style.minHeight).toBe(`${Math.round(210 * 2.8)}px`)
  })

  it('preview frame dimensions change when prescription size is A4', async () => {
    await savePrintSetting('printPrescriptionSize', 'A4')

    renderPrintPage(testVisitId)

    await waitFor(() => {
      expect(screen.getAllByText('Print Prescription').length).toBeGreaterThanOrEqual(1)
    })

    const frame = document.querySelector('[data-testid="preview-frame"]') as HTMLElement
    expect(frame).not.toBeNull()
    // A4: width=210mm, height=297mm; PREVIEW_PX_PER_MM=2.8
    expect(frame.style.width).toBe(`${Math.round(210 * 2.8)}px`)
    expect(frame.style.minHeight).toBe(`${Math.round(297 * 2.8)}px`)
  })

  it('switching to dispensary tab shows dispensary size preview frame', async () => {
    await savePrintSetting('printPrescriptionSize', 'A5')
    await savePrintSetting('printDispensarySize', 'A4')

    renderPrintPage(testVisitId)

    await waitFor(() => {
      expect(screen.getAllByText('Dispensary').length).toBeGreaterThanOrEqual(1)
    })

    fireEvent.click(screen.getAllByText('Dispensary')[0])

    await waitFor(() => {
      const frame = document.querySelector('[data-testid="preview-frame"]') as HTMLElement
      // A4 dispensary: width=210mm
      expect(frame.style.width).toBe(`${Math.round(210 * 2.8)}px`)
    })
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

    // Tab toggle buttons for preview mode
    expect(screen.getByRole('button', { name: 'Prescription' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dispensary' })).toBeInTheDocument()
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

  it('calls window.print when Dispensary tab selected and print clicked', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})

    renderPrintPage(testVisitId)

    await waitFor(() => {
      expect(screen.getAllByText('Dispensary').length).toBeGreaterThanOrEqual(1)
    })

    // Switch to dispensary tab using fireEvent to avoid jsdom getComputedStyle crash
    // (jsdom does not support @page CSS at-rules; user-event pointer checks trigger it)
    fireEvent.click(screen.getAllByText('Dispensary')[0])

    // Print button label should now say "Print Dispensary Slip"
    await waitFor(() => {
      expect(screen.getByText('Print Dispensary Slip')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Print Dispensary Slip'))

    await waitFor(() => {
      expect(printSpy).toHaveBeenCalled()
    })

    printSpy.mockRestore()
  })
})
