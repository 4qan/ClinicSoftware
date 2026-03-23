import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/auth/AuthProvider'
import { LoginPage } from '@/auth/LoginPage'

// Mock localSettings (couchUrl is stored in localStorage, not PouchDB)
vi.mock('@/db/localSettings', () => ({
  getCouchUrl: vi.fn(),
  setCouchUrl: vi.fn(),
}))

// Mock pouchdb (still needed for AuthProvider/useCouchAuth)
vi.mock('@/db/pouchdb', () => ({
  getSetting: vi.fn(),
  putSetting: vi.fn(),
  pouchDb: {},
  ensureIndexes: vi.fn(),
  migrateDbName: vi.fn(),
  resetPouchDb: vi.fn(),
}))

import { getCouchUrl } from '@/db/localSettings'
const mockGetCouchUrl = vi.mocked(getCouchUrl)

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('Login Flow (CouchDB auth)', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    localStorage.clear()
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('renders username and password fields', () => {
    mockGetCouchUrl.mockReturnValue('http://localhost:5984')
    renderLoginPage()

    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })

  it('does not render recovery flow', () => {
    mockGetCouchUrl.mockReturnValue('http://localhost:5984')
    renderLoginPage()

    expect(screen.queryByText(/forgot password/i)).toBeNull()
    expect(screen.queryByText(/recovery/i)).toBeNull()
  })

  it('shows error on wrong credentials (401)', async () => {
    const user = userEvent.setup()
    mockGetCouchUrl.mockReturnValue('http://localhost:5984')
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 401,
    } as Response)

    renderLoginPage()

    await user.type(screen.getByLabelText('Username'), 'doctor')
    await user.type(screen.getByLabelText('Password'), 'wrong')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/incorrect username or password/i)
    })
  })

  it('shows URL setup form when CouchDB not configured', async () => {
    mockGetCouchUrl.mockReturnValue(null)

    renderLoginPage()

    await waitFor(() => {
      expect(screen.getByLabelText('CouchDB Server Address')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /save and continue/i })).toBeInTheDocument()
    })
  })

  it('successful login sets authenticated state', async () => {
    const user = userEvent.setup()
    mockGetCouchUrl.mockReturnValue('http://localhost:5984')
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ userCtx: { name: 'doctor', roles: ['doctor'] } }),
    } as Response)

    renderLoginPage()

    await user.type(screen.getByLabelText('Username'), 'doctor')
    await user.type(screen.getByLabelText('Password'), 'doctor123')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      const session = sessionStorage.getItem('clinic_couch_session')
      expect(session).not.toBeNull()
      expect(session).toContain('doctor')
    })
  })
})
