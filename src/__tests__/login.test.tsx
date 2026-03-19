import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/auth/AuthProvider'
import { LoginPage } from '@/auth/LoginPage'

// Mock getSetting from pouchdb module
vi.mock('@/db/pouchdb', () => ({
  getSetting: vi.fn(),
  putSetting: vi.fn(),
  pouchDb: {},
  ensureIndexes: vi.fn(),
  migrateDbName: vi.fn(),
  resetPouchDb: vi.fn(),
}))

import { getSetting } from '@/db/pouchdb'
const mockGetSetting = vi.mocked(getSetting)

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
    mockGetSetting.mockResolvedValue(undefined)
    renderLoginPage()

    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })

  it('does not render recovery flow', () => {
    mockGetSetting.mockResolvedValue(undefined)
    renderLoginPage()

    expect(screen.queryByText(/forgot password/i)).toBeNull()
    expect(screen.queryByText(/recovery/i)).toBeNull()
  })

  it('shows error on wrong credentials (401)', async () => {
    const user = userEvent.setup()
    mockGetSetting.mockResolvedValue('http://localhost:5984')
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

  it('shows error when CouchDB not configured', async () => {
    const user = userEvent.setup()
    mockGetSetting.mockResolvedValue(undefined)

    renderLoginPage()

    await user.type(screen.getByLabelText('Username'), 'doctor')
    await user.type(screen.getByLabelText('Password'), 'test')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/couchdb is not configured/i)
    })
  })

  it('successful login sets authenticated state', async () => {
    const user = userEvent.setup()
    mockGetSetting.mockResolvedValue('http://localhost:5984')
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
