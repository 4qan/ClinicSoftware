import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSoloAuth } from '@/auth/useSoloAuth'
import { getSoloCredentials, setSoloCredentials } from '@/db/soloCredentials'
import { hashPassword, verifyPassword } from '@/utils/passwordHash'

const SESSION_KEY = 'clinic_couch_session'

let fetchSpy: ReturnType<typeof vi.fn>
const originalFetch = globalThis.fetch

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  fetchSpy = vi.fn(() => Promise.reject(new Error('fetch should not be called in solo mode')))
  globalThis.fetch = fetchSpy as unknown as typeof fetch
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

// D-17: zero outbound CouchDB calls. We tolerate any non-CouchDB-shaped fetch
// (none expected, but the assertion is scoped to URLs that look like CouchDB).
function expectNoFetchCalls() {
  const calls = fetchSpy.mock.calls
  const offending = calls.filter(([url]) => {
    const s = String(url)
    return s.includes('5984') || s.includes('_session') || s.includes('_users') || s.startsWith('http')
  })
  expect(offending).toEqual([])
}

describe('useSoloAuth - first launch', () => {
  it('login with doctor/doctor123 seeds envelope and authenticates', async () => {
    const { result } = renderHook(() => useSoloAuth())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    let res!: Awaited<ReturnType<typeof result.current.login>>
    await act(async () => {
      res = await result.current.login('doctor', 'doctor123')
    })
    expect(res.ok).toBe(true)
    expect(res.role).toBe('doctor')
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.role).toBe('doctor')
    expect(result.current.username).toBe('doctor')
    expect(result.current.credentials).toBeNull()
    const env = getSoloCredentials()
    expect(env).not.toBeNull()
    expect(env!.username).toBe('doctor')
    expect(sessionStorage.getItem(SESSION_KEY)).not.toBeNull()
    expectNoFetchCalls()
  })

  it('login with wrong default password fails and does not seed', async () => {
    const { result } = renderHook(() => useSoloAuth())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    let res!: Awaited<ReturnType<typeof result.current.login>>
    await act(async () => {
      res = await result.current.login('doctor', 'wrong')
    })
    expect(res).toEqual({ ok: false, error: 'invalid_credentials' })
    expect(getSoloCredentials()).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expectNoFetchCalls()
  })
})

describe('useSoloAuth - second launch', () => {
  beforeEach(async () => {
    const env = await hashPassword('doctor123', 'doctor')
    setSoloCredentials(env)
  })

  it('login with correct password succeeds', async () => {
    const { result } = renderHook(() => useSoloAuth())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    let res!: Awaited<ReturnType<typeof result.current.login>>
    await act(async () => {
      res = await result.current.login('doctor', 'doctor123')
    })
    expect(res.ok).toBe(true)
    expect(result.current.isAuthenticated).toBe(true)
    expectNoFetchCalls()
  })

  it('login with wrong password fails', async () => {
    const { result } = renderHook(() => useSoloAuth())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    let res!: Awaited<ReturnType<typeof result.current.login>>
    await act(async () => {
      res = await result.current.login('doctor', 'wrongpass')
    })
    expect(res).toEqual({ ok: false, error: 'invalid_credentials' })
    expect(result.current.isAuthenticated).toBe(false)
    expectNoFetchCalls()
  })

  it('login with mismatched username fails', async () => {
    const { result } = renderHook(() => useSoloAuth())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    let res!: Awaited<ReturnType<typeof result.current.login>>
    await act(async () => {
      res = await result.current.login('attacker', 'doctor123')
    })
    expect(res).toEqual({ ok: false, error: 'invalid_credentials' })
    expectNoFetchCalls()
  })
})

describe('useSoloAuth - session restore', () => {
  it('restores session when both flag and envelope present', async () => {
    const env = await hashPassword('doctor123', 'doctor')
    setSoloCredentials(env)
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ username: 'doctor', role: 'doctor' }),
    )
    const { result } = renderHook(() => useSoloAuth())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.role).toBe('doctor')
    expect(result.current.username).toBe('doctor')
    expectNoFetchCalls()
  })

  it('drops session when envelope was wiped', async () => {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ username: 'doctor', role: 'doctor' }),
    )
    // No setSoloCredentials -> envelope is null
    const { result } = renderHook(() => useSoloAuth())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAuthenticated).toBe(false)
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull()
    expectNoFetchCalls()
  })
})

describe('useSoloAuth - logout, changePassword, resetNursePassword', () => {
  it('logout clears state and sessionStorage', async () => {
    const env = await hashPassword('doctor123', 'doctor')
    setSoloCredentials(env)
    const { result } = renderHook(() => useSoloAuth())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => {
      await result.current.login('doctor', 'doctor123')
    })
    expect(result.current.isAuthenticated).toBe(true)
    act(() => {
      result.current.logout()
    })
    expect(result.current.isAuthenticated).toBe(false)
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull()
    expectNoFetchCalls()
  })

  it('changePassword updates the stored hash', async () => {
    const env0 = await hashPassword('doctor123', 'doctor')
    setSoloCredentials(env0)
    const { result } = renderHook(() => useSoloAuth())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => {
      await result.current.login('doctor', 'doctor123')
    })
    let res!: Awaited<ReturnType<typeof result.current.changePassword>>
    await act(async () => {
      res = await result.current.changePassword('doctor123', 'newpass')
    })
    expect(res).toEqual({ success: true })
    const env1 = getSoloCredentials()
    expect(env1).not.toBeNull()
    expect(await verifyPassword('newpass', env1!)).toBe(true)
    expect(await verifyPassword('doctor123', env1!)).toBe(false)
    expectNoFetchCalls()
  })

  it('changePassword fails with UI-SPEC verbatim error on wrong current', async () => {
    const env = await hashPassword('doctor123', 'doctor')
    setSoloCredentials(env)
    const { result } = renderHook(() => useSoloAuth())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => {
      await result.current.login('doctor', 'doctor123')
    })
    let res!: Awaited<ReturnType<typeof result.current.changePassword>>
    await act(async () => {
      res = await result.current.changePassword('wrong', 'newpass')
    })
    expect(res).toEqual({ success: false, error: 'Incorrect current password.' })
    expectNoFetchCalls()
  })

  it('resetNursePassword is a no-op', async () => {
    const { result } = renderHook(() => useSoloAuth())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    let res!: Awaited<ReturnType<typeof result.current.resetNursePassword>>
    await act(async () => {
      res = await result.current.resetNursePassword('any', 'any')
    })
    expect(res).toEqual({ success: false, error: 'Not available in solo mode' })
    expectNoFetchCalls()
  })
})

describe('useSoloAuth - return shape contract', () => {
  it('exposes the same 9 keys as useCouchAuth', async () => {
    const { result } = renderHook(() => useSoloAuth())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    const keys = Object.keys(result.current).sort()
    expect(keys).toEqual([
      'changePassword',
      'credentials',
      'isAuthenticated',
      'isLoading',
      'login',
      'logout',
      'resetNursePassword',
      'role',
      'username',
    ])
  })
})
