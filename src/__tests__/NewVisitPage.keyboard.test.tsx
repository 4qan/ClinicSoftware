import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { NewVisitPage } from '@/pages/NewVisitPage'
import type { Patient } from '@/db/index'

// Mock auth provider (NewVisitPage now uses useAuthContext for role)
vi.mock('@/auth/AuthProvider', () => ({
  useAuthContext: () => ({
    isAuthenticated: true,
    isLoading: false,
    role: 'doctor' as const,
    username: 'doctor',
    credentials: null,
    login: vi.fn(),
    logout: vi.fn(),
    changePassword: vi.fn(),
    resetNursePassword: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock all db modules to prevent IndexedDB access in jsdom
vi.mock('@/db/patients', () => ({
  registerPatient: vi.fn(),
  getPatient: vi.fn().mockResolvedValue(null),
  searchPatients: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/db/visits', () => ({
  createVisit: vi.fn(),
  getPatientVisits: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/db/pouchdb', () => ({
  getSetting: vi.fn().mockResolvedValue(undefined),
  putSetting: vi.fn(),
  pouchDb: {},
  ensureIndexes: vi.fn(),
  migrateDbName: vi.fn(),
  resetPouchDb: vi.fn(),
}))

vi.mock('@/db/index', () => ({
  db: {
    settings: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
    },
  },
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// usePatientSearch mock: use a vi.fn() so tests can override return value
const mockUsePatientSearch = vi.fn()
vi.mock('@/hooks/usePatientSearch', () => ({
  usePatientSearch: (query: string) => mockUsePatientSearch(query),
}))

const mockPatients: Patient[] = [
  {
    id: '1',
    patientId: 'PT-001',
    firstName: 'Ahmed',
    lastName: 'Khan',
    firstNameLower: 'ahmed',
    lastNameLower: 'khan',
    age: 35,
    gender: 'male',
    contact: '03001234567',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    patientId: 'PT-002',
    firstName: 'Sara',
    lastName: 'Ahmed',
    firstNameLower: 'sara',
    lastNameLower: 'ahmed',
    age: 28,
    gender: 'female',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

function renderNewVisitPage() {
  return render(
    <MemoryRouter>
      <NewVisitPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mockNavigate.mockClear()
  vi.clearAllMocks()
  // Default: return results for any query >= 2 chars
  mockUsePatientSearch.mockImplementation((query: string) => {
    if (query.trim().length < 2) return { results: [], isSearching: false }
    return { results: mockPatients, isSearching: false }
  })
})

describe('NewVisitPage patient search keyboard navigation', () => {
  it('ArrowDown on patient search input highlights first patient result', async () => {
    const user = userEvent.setup()
    renderNewVisitPage()

    const input = screen.getByPlaceholderText(/search patient/i)
    await user.type(input, 'Ahmed')

    // Dropdown should be visible
    await waitFor(() => {
      expect(screen.getByText('Ahmed Khan')).toBeInTheDocument()
    })

    await user.keyboard('{ArrowDown}')

    // First result should be highlighted with bg-blue-50
    const buttons = screen.getAllByRole('button', { name: /Ahmed Khan/i })
    expect(buttons[0].className).toContain('bg-blue-50')
  })

  it('Enter with highlighted patient selects that patient', async () => {
    const user = userEvent.setup()
    renderNewVisitPage()

    const input = screen.getByPlaceholderText(/search patient/i)
    await user.type(input, 'Ahmed')

    await waitFor(() => {
      expect(screen.getByText('Ahmed Khan')).toBeInTheDocument()
    })

    await user.keyboard('{ArrowDown}') // highlight first: Ahmed Khan
    await user.keyboard('{Enter}')

    // Patient should be selected -- search input gone, patient info shown
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/search patient/i)).not.toBeInTheDocument()
    })
    // Patient name visible in the selected patient display
    expect(screen.getAllByText(/Ahmed Khan/).length).toBeGreaterThan(0)
  })

  it('Enter with no highlight selects first patient result', async () => {
    const user = userEvent.setup()
    renderNewVisitPage()

    const input = screen.getByPlaceholderText(/search patient/i)
    await user.type(input, 'Ahmed')

    await waitFor(() => {
      expect(screen.getByText('Ahmed Khan')).toBeInTheDocument()
    })

    // No ArrowDown -- Enter selects first
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/search patient/i)).not.toBeInTheDocument()
    })
  })

  it('Escape closes patient search dropdown but preserves query and keeps focus on input', async () => {
    const user = userEvent.setup()
    renderNewVisitPage()

    const input = screen.getByPlaceholderText(/search patient/i)
    await user.type(input, 'Ahmed')

    await waitFor(() => {
      expect(screen.getByText('Ahmed Khan')).toBeInTheDocument()
    })

    await user.keyboard('{Escape}')

    // Dropdown should be closed
    expect(screen.queryByText('Ahmed Khan')).not.toBeInTheDocument()
    // Query preserved
    expect((input as HTMLInputElement).value).toBe('Ahmed')
    // Focus stays on input
    expect(document.activeElement).toBe(input)
  })

  it('Tab with highlighted patient selects the patient', async () => {
    const user = userEvent.setup()
    renderNewVisitPage()

    const input = screen.getByPlaceholderText(/search patient/i)
    await user.type(input, 'Ahmed')

    await waitFor(() => {
      expect(screen.getByText('Ahmed Khan')).toBeInTheDocument()
    })

    await user.keyboard('{ArrowDown}') // highlight first
    await user.keyboard('{Tab}')

    // Patient selected
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/search patient/i)).not.toBeInTheDocument()
    })
  })
})

describe('NewVisitPage inline patient registration keyboard', () => {
  beforeEach(() => {
    // Return no results so we can reach the inline form
    mockUsePatientSearch.mockReturnValue({ results: [], isSearching: false })
  })

  it('Escape on inline registration form dismisses it and returns focus to patient search input', async () => {
    const user = userEvent.setup()
    renderNewVisitPage()

    const input = screen.getByPlaceholderText(/search patient/i)
    await user.type(input, 'Zz') // 2 chars, 0 results

    // "Create ... as new patient" button should appear
    await waitFor(() => {
      expect(screen.getByText(/Create.*as new patient/i)).toBeInTheDocument()
    })

    // Click to open inline form
    await user.click(screen.getByText(/Create.*as new patient/i))

    // Inline form should be visible
    await waitFor(() => {
      expect(screen.getByText('Create New Patient')).toBeInTheDocument()
    })

    // Press Escape -- should dismiss and return focus to patient search
    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByText('Create New Patient')).not.toBeInTheDocument()
    })

    // Focus should return to patient search input
    const searchInput = screen.getByPlaceholderText(/search patient/i)
    expect(document.activeElement).toBe(searchInput)
  })
})

describe('NewVisitPage post-inline-create focus', () => {
  it('After creating a patient inline, focus moves to clinical notes textarea', async () => {
    const { registerPatient } = await import('@/db/patients')
    const fakePatient: Patient = {
      id: '99',
      patientId: 'PT-099',
      firstName: 'New',
      lastName: 'Patient',
      firstNameLower: 'new',
      lastNameLower: 'patient',
      age: 25,
      gender: 'male',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    vi.mocked(registerPatient).mockResolvedValue(fakePatient)

    // Return no results so we can reach the inline form
    mockUsePatientSearch.mockReturnValue({ results: [], isSearching: false })

    const user = userEvent.setup()
    renderNewVisitPage()

    const input = screen.getByPlaceholderText(/search patient/i)
    await user.type(input, 'Ne') // triggers dropdown

    await waitFor(() => {
      expect(screen.getByText(/Create.*as new patient/i)).toBeInTheDocument()
    })

    await user.click(screen.getByText(/Create.*as new patient/i))

    await waitFor(() => {
      expect(screen.getByText('Create New Patient')).toBeInTheDocument()
    })

    // Fill required fields
    await user.clear(screen.getByLabelText(/first name/i))
    await user.type(screen.getByLabelText(/first name/i), 'New')
    await user.clear(screen.getByLabelText(/last name/i))
    await user.type(screen.getByLabelText(/last name/i), 'Patient')
    await user.clear(screen.getByLabelText(/age \(years\)/i))
    await user.type(screen.getByLabelText(/age \(years\)/i), '25')

    // Submit the form
    await user.click(screen.getByRole('button', { name: /create & select/i }))

    // After successful creation, clinical notes textarea should be focused
    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/complaint/i)
      expect(document.activeElement).toBe(textarea)
    })
  })
})
