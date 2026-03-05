import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { RegisterPatientPage } from '@/pages/RegisterPatientPage'
import { resetDatabase } from '@/db/index'
import { registerPatient } from '@/db/patients'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderPage() {
  return render(
    <BrowserRouter>
      <RegisterPatientPage />
    </BrowserRouter>,
  )
}

beforeEach(async () => {
  await resetDatabase()
  mockNavigate.mockClear()
})

describe('RegisterPatientPage', () => {
  it('renders all form fields', () => {
    renderPage()
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^male$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^female$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/age/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contact number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cnic/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save patient/i })).toBeInTheDocument()
  })

  it('validates required fields and prevents save when empty', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /save patient/i }))

    expect(await screen.findByText(/first name is required/i)).toBeInTheDocument()
    expect(screen.getByText(/last name is required/i)).toBeInTheDocument()
    expect(screen.getByText(/age must be a positive number/i)).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('submits valid data and navigates to profile', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/first name/i), 'Ahmed')
    await user.type(screen.getByLabelText(/last name/i), 'Khan')
    await user.type(screen.getByLabelText(/age/i), '35')
    await user.click(screen.getByLabelText(/^male$/i))

    await user.click(screen.getByRole('button', { name: /save patient/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/^\/patient\/.+/))
    })
  })

  it('shows duplicate check when name matches existing patient', async () => {
    // Register an existing patient first
    await registerPatient({
      firstName: 'Ahmed',
      lastName: 'Khan',
      age: 35,
      gender: 'male',
      contact: '03001234567',
    })

    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/first name/i), 'Ahmed')
    await user.type(screen.getByLabelText(/last name/i), 'Khan')

    // Wait for duplicate check to fire
    await waitFor(() => {
      expect(screen.getByText(/patient already exists/i)).toBeInTheDocument()
    })
  })

  it('patient ID is not editable (shown as read-only preview)', () => {
    renderPage()
    expect(screen.getByText(/will be assigned on save/i)).toBeInTheDocument()
    // No input for patient ID
    expect(screen.queryByLabelText(/patient id/i)).not.toBeInTheDocument()
  })
})
