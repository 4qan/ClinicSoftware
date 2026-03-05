import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PatientProfilePage } from '@/pages/PatientProfilePage'
import { resetDatabase } from '@/db/index'
import { registerPatient } from '@/db/patients'
import type { Patient } from '@/db/index'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
  }
})

function renderProfile(patientId: string) {
  return render(
    <MemoryRouter initialEntries={[`/patient/${patientId}`]}>
      <Routes>
        <Route path="/patient/:id" element={<PatientProfilePage />} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

let testPatient: Patient

beforeEach(async () => {
  await resetDatabase()
  testPatient = await registerPatient({
    firstName: 'Ahmed',
    lastName: 'Khan',
    age: 35,
    gender: 'male',
    contact: '03001234567',
    cnic: '3520112345671',
  })
})

describe('PatientProfilePage', () => {
  it('displays patient info correctly', async () => {
    renderProfile(testPatient.id)

    await waitFor(() => {
      expect(screen.getByText(testPatient.patientId)).toBeInTheDocument()
    })

    expect(screen.getByText('Ahmed Khan')).toBeInTheDocument()
    expect(screen.getByText(/35 years/)).toBeInTheDocument()
    expect(screen.getByText(/male/i)).toBeInTheDocument()
    expect(screen.getByText(/03001234567/)).toBeInTheDocument()
  })

  it('edit button toggles edit mode', async () => {
    const user = userEvent.setup()
    renderProfile(testPatient.id)

    await waitFor(() => {
      expect(screen.getByText('Ahmed Khan')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /edit/i }))

    // Should see edit form with inputs
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('patient ID field is not editable in edit mode', async () => {
    const user = userEvent.setup()
    renderProfile(testPatient.id)

    await waitFor(() => {
      expect(screen.getByText('Ahmed Khan')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /edit/i }))

    // Patient ID should be displayed as text, not as an input
    expect(screen.getByText(testPatient.patientId)).toBeInTheDocument()
    // There should be no input for patient ID
    const allInputs = screen.getAllByRole('textbox')
    const inputValues = allInputs.map((i) => (i as HTMLInputElement).value)
    expect(inputValues).not.toContain(testPatient.patientId)
  })

  it('saving changes updates the displayed data', async () => {
    const user = userEvent.setup()
    renderProfile(testPatient.id)

    await waitFor(() => {
      expect(screen.getByText('Ahmed Khan')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /edit/i }))

    const contactInput = screen.getByLabelText(/contact/i)
    await user.clear(contactInput)
    await user.type(contactInput, '03009999999')

    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText(/03009999999/)).toBeInTheDocument()
    })
  })

  it('empty history shows "No visits yet" message', async () => {
    renderProfile(testPatient.id)

    await waitFor(() => {
      expect(screen.getByText('Ahmed Khan')).toBeInTheDocument()
    })

    expect(screen.getByText('Visit History')).toBeInTheDocument()
    expect(screen.getByText('No visits yet')).toBeInTheDocument()
  })

  it('non-existent patient shows error state', async () => {
    renderProfile('nonexistent-uuid')

    await waitFor(() => {
      expect(screen.getByText(/patient not found/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/go to home/i)).toBeInTheDocument()
  })
})
