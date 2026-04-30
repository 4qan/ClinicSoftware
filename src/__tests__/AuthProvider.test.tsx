import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  SoloAuthProvider,
  NetworkedAuthProvider,
  useAuthContext,
} from '@/auth/AuthProvider'

// localStorage-only setup so useSoloAuth runs against a real envelope.
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

const originalFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = originalFetch
})

function Probe() {
  const auth = useAuthContext()
  return (
    <div>
      <div data-testid="role">{auth.role ?? 'null'}</div>
      <div data-testid="auth">{auth.isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid="creds">{auth.credentials ?? 'null'}</div>
      <button onClick={() => auth.login('doctor', 'doctor123')}>login</button>
    </div>
  )
}

describe('AuthProvider variants', () => {
  it('SoloAuthProvider exposes useSoloAuth shape (role becomes doctor after login)', async () => {
    // Solo path must not call fetch. Trap any fetch to fail loudly.
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('no fetch in solo'))) as unknown as typeof fetch

    render(
      <SoloAuthProvider>
        <Probe />
      </SoloAuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('no'))

    await userEvent.click(screen.getByRole('button', { name: 'login' }))
    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('yes'))
    expect(screen.getByTestId('role').textContent).toBe('doctor')
    expect(screen.getByTestId('creds').textContent).toBe('null')
  })

  it('NetworkedAuthProvider exposes useCouchAuth shape (role null pre-login, no credentials)', async () => {
    // No couchUrl in localStorage — useCouchAuth.init resolves quickly.
    render(
      <NetworkedAuthProvider>
        <Probe />
      </NetworkedAuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('no'))
    expect(screen.getByTestId('role').textContent).toBe('null')
  })

  it('useAuthContext throws outside any provider', () => {
    // Suppress React's error boundary console noise for this assertion.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow(
      'useAuthContext must be used within an AuthProvider',
    )
    spy.mockRestore()
  })
})
