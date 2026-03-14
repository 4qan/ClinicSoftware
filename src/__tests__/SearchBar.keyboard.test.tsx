import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { SearchBar } from '@/components/SearchBar'
import type { Patient } from '@/db/index'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockPatients: Patient[] = [
  {
    id: 1,
    patientId: 'PT-001',
    firstName: 'Ahmed',
    lastName: 'Khan',
    age: 35,
    gender: 'male',
    contact: '03001234567',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    patientId: 'PT-002',
    firstName: 'Sara',
    lastName: 'Ahmed',
    age: 28,
    gender: 'female',
    contact: '03111234567',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

vi.mock('@/hooks/usePatientSearch', () => ({
  usePatientSearch: (query: string) => {
    if (query.trim().length < 2) return { results: [], isSearching: false }
    return { results: mockPatients, isSearching: false }
  },
}))

function renderSearchBar() {
  return render(
    <MemoryRouter>
      <SearchBar />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mockNavigate.mockClear()
})

describe('SearchBar keyboard navigation', () => {
  it('Escape closes dropdown but does NOT clear the query', async () => {
    const user = userEvent.setup()
    renderSearchBar()

    const input = screen.getByPlaceholderText(/search patients/i)
    await user.type(input, 'Ahmed')

    // Dropdown should be visible
    await waitFor(() => {
      expect(screen.getByText('Ahmed Khan')).toBeInTheDocument()
    })

    await user.keyboard('{Escape}')

    // Dropdown closed
    expect(screen.queryByText('Ahmed Khan')).not.toBeInTheDocument()
    // Query preserved
    expect((input as HTMLInputElement).value).toBe('Ahmed')
  })

  it('Escape does NOT blur the input (focus stays on input)', async () => {
    const user = userEvent.setup()
    renderSearchBar()

    const input = screen.getByPlaceholderText(/search patients/i)
    await user.type(input, 'Ahmed')

    await waitFor(() => {
      expect(screen.getByText('Ahmed Khan')).toBeInTheDocument()
    })

    await user.keyboard('{Escape}')

    expect(document.activeElement).toBe(input)
  })

  it('Enter with no highlight selects first patient result', async () => {
    const user = userEvent.setup()
    renderSearchBar()

    const input = screen.getByPlaceholderText(/search patients/i)
    await user.type(input, 'Ahmed')

    await waitFor(() => {
      expect(screen.getByText('Ahmed Khan')).toBeInTheDocument()
    })

    // No ArrowDown pressed -- Enter should select first result
    await user.keyboard('{Enter}')

    expect(mockNavigate).toHaveBeenCalledWith(`/patient/${mockPatients[0].id}`)
  })

  it('Enter with highlighted patient navigates to that patient', async () => {
    const user = userEvent.setup()
    renderSearchBar()

    const input = screen.getByPlaceholderText(/search patients/i)
    await user.type(input, 'Ahmed')

    await waitFor(() => {
      expect(screen.getByText('Ahmed Khan')).toBeInTheDocument()
    })

    await user.keyboard('{ArrowDown}') // highlight first: Ahmed Khan (id=1)
    await user.keyboard('{ArrowDown}') // highlight second: Sara Ahmed (id=2)
    await user.keyboard('{Enter}')

    expect(mockNavigate).toHaveBeenCalledWith(`/patient/${mockPatients[1].id}`)
  })

  it('Tab with highlighted patient triggers navigation', async () => {
    const user = userEvent.setup()
    renderSearchBar()

    const input = screen.getByPlaceholderText(/search patients/i)
    await user.type(input, 'Ahmed')

    await waitFor(() => {
      expect(screen.getByText('Ahmed Khan')).toBeInTheDocument()
    })

    await user.keyboard('{ArrowDown}') // highlight first result
    await user.keyboard('{Tab}')

    expect(mockNavigate).toHaveBeenCalledWith(`/patient/${mockPatients[0].id}`)
  })

  it('ArrowDown navigates through results (existing behavior preserved)', async () => {
    const user = userEvent.setup()
    renderSearchBar()

    const input = screen.getByPlaceholderText(/search patients/i)
    await user.type(input, 'Ahmed')

    await waitFor(() => {
      expect(screen.getByText('Ahmed Khan')).toBeInTheDocument()
    })

    // After ArrowDown, first result should be highlighted (bg-blue-50)
    await user.keyboard('{ArrowDown}')

    const buttons = screen.getAllByRole('button', { name: /Ahmed Khan|Sara Ahmed/i })
    expect(buttons[0].className).toContain('bg-blue-50')
  })
})
