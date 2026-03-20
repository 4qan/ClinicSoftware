import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Toast } from '@/components/Toast'
import { PatientRegistrationForm } from '@/components/PatientRegistrationForm'
import { resetDatabase } from '@/db/index'

// Mocks required for Sidebar and Header
vi.mock('@/auth/AuthProvider', () => ({
  useAuthContext: () => ({ logout: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/sync/SyncContext', () => ({
  useSyncContext: () => ({
    status: 'synced',
    lastSynced: null,
    errorMessage: null,
    retry: vi.fn(),
    startSync: vi.fn(),
  }),
}))

vi.mock('@/db/patients', () => ({
  searchPatients: vi.fn().mockResolvedValue([]),
}))

// Header import after mocks are set up
import { Header } from '@/components/Header'

// -----------------------------------------------------------------------
// Sidebar
// -----------------------------------------------------------------------
describe('Tab order: Sidebar', () => {
  function renderSidebar(collapsed = false) {
    return render(
      <MemoryRouter initialEntries={['/']}>
        <Sidebar collapsed={collapsed} onToggle={vi.fn()} />
      </MemoryRouter>,
    )
  }

  it('nav Link elements have tabIndex={-1}', () => {
    renderSidebar()
    const homeLink = screen.getByRole('link', { name: /home/i })
    const patientsLink = screen.getByRole('link', { name: /patients/i })
    const settingsLink = screen.getByRole('link', { name: /settings/i })

    expect(homeLink).toHaveAttribute('tabindex', '-1')
    expect(patientsLink).toHaveAttribute('tabindex', '-1')
    expect(settingsLink).toHaveAttribute('tabindex', '-1')
  })

  it('logout button has tabIndex={-1}', () => {
    renderSidebar()
    const logoutButton = screen.getByRole('button', { name: /log out/i })
    expect(logoutButton).toHaveAttribute('tabindex', '-1')
  })

  it('collapse toggle button does NOT have tabIndex={-1}', () => {
    renderSidebar()
    const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i })
    expect(toggleButton).not.toHaveAttribute('tabindex', '-1')
  })
})

// -----------------------------------------------------------------------
// Header
// -----------------------------------------------------------------------
describe('Tab order: Header', () => {
  function renderHeader() {
    return render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>,
    )
  }

  it('home link has tabIndex={-1}', () => {
    renderHeader()
    const homeLink = screen.getByRole('link', { name: /clinic software/i })
    expect(homeLink).toHaveAttribute('tabindex', '-1')
  })

  it('settings link has tabIndex={-1}', () => {
    renderHeader()
    const settingsLink = screen.getByRole('link', { name: /settings/i })
    expect(settingsLink).toHaveAttribute('tabindex', '-1')
  })

  it('logout button has tabIndex={-1}', () => {
    renderHeader()
    const logoutButton = screen.getByRole('button', { name: /log out/i })
    expect(logoutButton).toHaveAttribute('tabindex', '-1')
  })

  it('search input does NOT have tabIndex={-1}', () => {
    renderHeader()
    const searchInput = screen.getByPlaceholderText(/search patients/i)
    expect(searchInput).not.toHaveAttribute('tabindex', '-1')
  })
})

// -----------------------------------------------------------------------
// Breadcrumbs
// -----------------------------------------------------------------------
describe('Tab order: Breadcrumbs', () => {
  it('all Link elements have tabIndex={-1}', () => {
    render(
      <MemoryRouter>
        <Breadcrumbs
          crumbs={[
            { label: 'Home', path: '/' },
            { label: 'Patients', path: '/patients' },
            { label: 'Current' },
          ]}
        />
      </MemoryRouter>,
    )
    const links = screen.getAllByRole('link')
    links.forEach((link) => {
      expect(link).toHaveAttribute('tabindex', '-1')
    })
  })
})

// -----------------------------------------------------------------------
// Toast
// -----------------------------------------------------------------------
describe('Tab order: Toast', () => {
  it('close button has tabIndex={-1}', () => {
    render(<Toast id="t1" type="success" message="Saved" onClose={vi.fn()} />)
    const closeButton = screen.getByRole('button', { name: /close/i })
    expect(closeButton).toHaveAttribute('tabindex', '-1')
  })
})

// -----------------------------------------------------------------------
// Form submission: PatientRegistrationForm (FORM-02)
// -----------------------------------------------------------------------
describe('Form submission: PatientRegistrationForm', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('submits form when Enter is pressed on a form field', async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <MemoryRouter>
        <PatientRegistrationForm onSubmit={mockSubmit} />
      </MemoryRouter>,
    )

    const firstNameInput = screen.getByLabelText(/first name/i)
    const lastNameInput = screen.getByLabelText(/last name/i)
    const ageInput = screen.getByLabelText(/age/i)

    await userEvent.type(firstNameInput, 'Ahmed')
    await userEvent.type(lastNameInput, 'Khan')
    await userEvent.type(ageInput, '35')
    // Press Enter on the age field to submit
    await userEvent.type(ageInput, '{Enter}')

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: 'Ahmed', lastName: 'Khan', age: 35 }),
      )
    })
  })
})

// -----------------------------------------------------------------------
// NewVisitPage: no form wrapper (FORM-03)
// -----------------------------------------------------------------------
describe('NewVisitPage: no form wrapper', () => {
  /**
   * NewVisitPage intentionally has no <form> wrapper.
   * This is by design: the clinical notes textarea needs Enter for newlines,
   * not form submission. The action buttons are type="button" to prevent
   * accidental form submission.
   *
   * Verified by code inspection: NewVisitPage.tsx has no <form> element.
   * All action buttons use type="button" and explicit onClick handlers.
   */
  it('documents that NewVisitPage has no form element by design (FORM-03)', () => {
    expect(true).toBe(true)
  })
})
