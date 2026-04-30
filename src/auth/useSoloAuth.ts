/**
 * Solo-mode auth hook (Phase 22.1, D-02).
 *
 * Mirrors the return-type shape of useCouchAuth so AuthProvider consumers
 * (LoginPage, ChangePassword, Sidebar, Header, ProtectedRoute) are mode-agnostic.
 * Differences from networked:
 *   - Validates credentials against a PBKDF2 envelope in localStorage (no fetch).
 *   - Session payload omits `credentials` (no Basic auth string in solo).
 *   - state.credentials is always null.
 *   - resetNursePassword is a typed no-op (no nurse account exists).
 *
 * D-17: ZERO calls to global.fetch from any path here.
 */
import { useState, useCallback, useEffect } from 'react'
import { hashPassword, verifyPassword } from '@/utils/passwordHash'
import { getSoloCredentials, setSoloCredentials } from '@/db/soloCredentials'

const SESSION_KEY = 'clinic_couch_session' // SAME key as useCouchAuth (D-19 parity)
const LEGACY_SESSION_KEY = 'clinic_auth_session' // SAME as useCouchAuth (cleared on logout)

const DEFAULT_USERNAME = 'doctor' // D-06
const DEFAULT_PASSWORD = 'doctor123' // D-06

interface AuthState {
  isAuthenticated: boolean
  role: 'doctor' | 'nurse' | null // solo: always 'doctor' when authenticated
  username: string | null
  credentials: string | null // solo: always null
}

interface LoginResult {
  ok: boolean
  role?: 'doctor' | 'nurse'
  // Solo only emits 'invalid_credentials' in practice; the wider union matches
  // useCouchAuth's signature so AuthProvider consumers do not need a union narrow.
  error?: 'invalid_credentials' | 'network_error' | 'not_configured' | 'unknown_role'
}

interface ChangePasswordResult {
  success: boolean
  error?: string
}

interface ResetNursePasswordResult {
  success: boolean
  error?: string
}

const initialState: AuthState = {
  isAuthenticated: false,
  role: null,
  username: null,
  credentials: null,
}

export function useSoloAuth() {
  const [state, setState] = useState<AuthState>(initialState)
  const [isLoading, setIsLoading] = useState(true)

  // Session restore (D-19): re-verify the persisted username has a matching
  // envelope. If credentials were wiped or the username drifted, drop the
  // stale session rather than silently authenticating.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      if (!raw) return
      let parsed: { username?: string; role?: 'doctor' | 'nurse' }
      try {
        parsed = JSON.parse(raw) as { username?: string; role?: 'doctor' | 'nurse' }
      } catch {
        sessionStorage.removeItem(SESSION_KEY)
        return
      }
      if (!parsed.username || parsed.role !== 'doctor') {
        sessionStorage.removeItem(SESSION_KEY)
        return
      }
      const env = getSoloCredentials()
      if (!env || env.username !== parsed.username) {
        // Credentials wiped or username drift -- drop the stale session.
        sessionStorage.removeItem(SESSION_KEY)
        return
      }
      setState({
        isAuthenticated: true,
        role: 'doctor',
        username: parsed.username,
        credentials: null,
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(
    async (username: string, password: string): Promise<LoginResult> => {
      const stored = getSoloCredentials()

      if (!stored) {
        // First launch (D-06): accept hardcoded defaults, then seed the envelope.
        if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
          const env = await hashPassword(DEFAULT_PASSWORD, DEFAULT_USERNAME)
          setSoloCredentials(env)
          setState({
            isAuthenticated: true,
            role: 'doctor',
            username,
            credentials: null,
          })
          sessionStorage.setItem(
            SESSION_KEY,
            JSON.stringify({ username, role: 'doctor' }),
          )
          return { ok: true, role: 'doctor' }
        }
        return { ok: false, error: 'invalid_credentials' }
      }

      // Stored envelope path -- verify against PBKDF2 hash.
      // Mismatched username returns the same error as wrong password (do not
      // leak whether a username exists).
      if (username !== stored.username) {
        return { ok: false, error: 'invalid_credentials' }
      }
      const ok = await verifyPassword(password, stored)
      if (!ok) {
        return { ok: false, error: 'invalid_credentials' }
      }
      setState({
        isAuthenticated: true,
        role: 'doctor',
        username,
        credentials: null,
      })
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ username, role: 'doctor' }),
      )
      return { ok: true, role: 'doctor' }
    },
    [],
  )

  const logout = useCallback(() => {
    setState(initialState)
    sessionStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(LEGACY_SESSION_KEY)
  }, [])

  const changePassword = useCallback(
    async (
      currentPassword: string,
      newPassword: string,
    ): Promise<ChangePasswordResult> => {
      const { username } = state
      if (!username) return { success: false, error: 'Not authenticated' }
      const stored = getSoloCredentials()
      if (!stored) return { success: false, error: 'No credentials on file' }
      const ok = await verifyPassword(currentPassword, stored)
      // UI-SPEC verbatim string (with terminal period); networked uses a
      // different message by design.
      if (!ok) return { success: false, error: 'Incorrect current password.' }
      const next = await hashPassword(newPassword, username)
      setSoloCredentials(next)
      return { success: true }
    },
    [state],
  )

  const resetNursePassword = useCallback(
    async (
      _adminPassword: string,
      _newPassword: string,
    ): Promise<ResetNursePasswordResult> => {
      // No-op in solo mode (no nurse account exists). Solo UI should not
      // surface this action; the no-op exists only to satisfy the
      // AuthProvider context-type contract.
      return { success: false, error: 'Not available in solo mode' }
    },
    [],
  )

  return {
    isAuthenticated: state.isAuthenticated,
    isLoading,
    role: state.role,
    username: state.username,
    credentials: state.credentials,
    login,
    logout,
    changePassword,
    resetNursePassword,
  }
}
