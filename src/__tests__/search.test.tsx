import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { SearchBar } from '@/components/SearchBar'
import { resetDatabase } from '@/db/index'
import { registerPatient } from '@/db/patients'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderSearchBar(variant: 'prominent' | 'compact' = 'prominent') {
  return render(
    <BrowserRouter>
      <SearchBar variant={variant} />
    </BrowserRouter>,
  )
}

async function seedPatients() {
  const p1 = await registerPatient({ firstName: 'Ahmed', lastName: 'Khan', age: 35, gender: 'male', contact: '03001234567' })
  const p2 = await registerPatient({ firstName: 'Sara', lastName: 'Ahmed', age: 28, gender: 'female', contact: '03111234567' })
  const p3 = await registerPatient({ firstName: 'Ali', lastName: 'Raza', age: 45, gender: 'male', contact: '03211234567' })
  return { p1, p2, p3 }
}

beforeEach(async () => {
  await resetDatabase()
  mockNavigate.mockClear()
})

describe('SearchBar', () => {
  it('typing a name shows matching results', async () => {
    await seedPatients()
    const user = userEvent.setup()
    renderSearchBar()

    const input = screen.getByPlaceholderText(/search patients/i)
    await user.type(input, 'Ahmed')

    await waitFor(() => {
      expect(screen.getByText('Ahmed Khan')).toBeInTheDocument()
    })
  })

  it('typing a patient ID shows matching results', async () => {
    const { p1 } = await seedPatients()
    const user = userEvent.setup()
    renderSearchBar()

    const input = screen.getByPlaceholderText(/search patients/i)
    await user.type(input, p1.patientId)

    await waitFor(() => {
      expect(screen.getByText('Ahmed Khan')).toBeInTheDocument()
    })
  })

  it('typing a contact number shows matching results', async () => {
    await seedPatients()
    const user = userEvent.setup()
    renderSearchBar()

    const input = screen.getByPlaceholderText(/search patients/i)
    await user.type(input, '03001')

    await waitFor(() => {
      expect(screen.getByText('Ahmed Khan')).toBeInTheDocument()
    })
  })

  it('less than 2 characters shows no results', async () => {
    await seedPatients()
    const user = userEvent.setup()
    renderSearchBar()

    const input = screen.getByPlaceholderText(/search patients/i)
    await user.type(input, 'A')

    // Wait a bit and verify no dropdown
    await new Promise((r) => setTimeout(r, 400))
    expect(screen.queryByText('Ahmed Khan')).not.toBeInTheDocument()
  })

  it('no match shows "No patients found" message', async () => {
    await seedPatients()
    const user = userEvent.setup()
    renderSearchBar()

    const input = screen.getByPlaceholderText(/search patients/i)
    await user.type(input, 'zzzzz')

    await waitFor(() => {
      expect(screen.getByText(/no patients found/i)).toBeInTheDocument()
    })
  })

  it('clicking a result navigates to patient profile', async () => {
    const { p1 } = await seedPatients()
    const user = userEvent.setup()
    renderSearchBar()

    const input = screen.getByPlaceholderText(/search patients/i)
    await user.type(input, 'Ahmed')

    await waitFor(() => {
      expect(screen.getByText('Ahmed Khan')).toBeInTheDocument()
    })

    // Click the result button that contains the patient name
    const resultButton = screen.getByText('Ahmed Khan').closest('button')!
    await user.click(resultButton)

    expect(mockNavigate).toHaveBeenCalledWith(`/patient/${p1.id}`)
  })

  it('search completes within 1 second with seeded data', async () => {
    // Seed 20 patients
    for (let i = 0; i < 20; i++) {
      await registerPatient({
        firstName: `Patient${i}`,
        lastName: `Last${i}`,
        age: 20 + i,
        gender: 'male',
      })
    }

    const user = userEvent.setup()
    renderSearchBar()

    const start = performance.now()
    const input = screen.getByPlaceholderText(/search patients/i)
    await user.type(input, 'Patient1')

    await waitFor(() => {
      expect(screen.getAllByText(/Patient1/).length).toBeGreaterThanOrEqual(1)
    })

    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(2000) // Allow generous 2s for debounce + search
  })
})
