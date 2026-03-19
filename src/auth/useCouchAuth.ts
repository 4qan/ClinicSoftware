import { useState, useCallback, useEffect, useRef } from 'react'
import { getSetting } from '@/db/pouchdb'

const SESSION_KEY = 'clinic_couch_session'
const LEGACY_SESSION_KEY = 'clinic_auth_session'

interface AuthState {
  isAuthenticated: boolean
  role: 'doctor' | 'nurse' | null
  username: string | null
  credentials: string | null // base64(username:password), for PouchDB sync in Phase 22
}

interface LoginResult {
  ok: boolean
  role?: 'doctor' | 'nurse'
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

export function useCouchAuth() {
  const [state, setState] = useState<AuthState>(initialState)
  const [isLoading, setIsLoading] = useState(true)
  const couchUrlRef = useRef<string | null>(null)

  // On mount: load CouchDB URL and restore session
  useEffect(() => {
    async function init() {
      try {
        const url = (await getSetting('couchUrl')) as string | undefined
        couchUrlRef.current = url ?? null

        const raw = sessionStorage.getItem(SESSION_KEY)
        if (!raw) {
          setIsLoading(false)
          return
        }

        const { username, credentials, role } = JSON.parse(raw) as {
          username: string
          credentials: string
          role: 'doctor' | 'nurse'
        }

        if (!url) {
          // CouchDB not configured — can't verify, clear stale session
          sessionStorage.removeItem(SESSION_KEY)
          setIsLoading(false)
          return
        }

        // Verify stored credentials are still valid
        try {
          const res = await fetch(`${url}/_session`, {
            headers: { Authorization: `Basic ${credentials}` },
          })
          if (res.ok) {
            setState({ isAuthenticated: true, role, username, credentials })
          } else {
            sessionStorage.removeItem(SESSION_KEY)
          }
        } catch {
          // Network error — clear session (CouchDB unreachable)
          sessionStorage.removeItem(SESSION_KEY)
        }
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [])

  const login = useCallback(
    async (username: string, password: string): Promise<LoginResult> => {
      const url = couchUrlRef.current ?? ((await getSetting('couchUrl')) as string | undefined) ?? null
      couchUrlRef.current = url

      if (!url) {
        return { ok: false, error: 'not_configured' }
      }

      const credentials = btoa(`${username}:${password}`)

      try {
        const res = await fetch(`${url}/_session`, {
          headers: { Authorization: `Basic ${credentials}` },
        })

        if (!res.ok) {
          return { ok: false, error: 'invalid_credentials' }
        }

        const data = (await res.json()) as { userCtx: { name: string; roles: string[] } }
        const roles: string[] = data.userCtx.roles ?? []
        const role: 'doctor' | 'nurse' | null = roles.includes('doctor')
          ? 'doctor'
          : roles.includes('nurse')
            ? 'nurse'
            : null

        if (!role) {
          return { ok: false, error: 'unknown_role' }
        }

        const newState: AuthState = { isAuthenticated: true, role, username, credentials }
        setState(newState)
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username, credentials, role }))

        return { ok: true, role }
      } catch {
        return { ok: false, error: 'network_error' }
      }
    },
    [],
  )

  const logout = useCallback(() => {
    setState(initialState)
    sessionStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(LEGACY_SESSION_KEY)
  }, [])

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<ChangePasswordResult> => {
      const { username, credentials } = state
      if (!username || !credentials) {
        return { success: false, error: 'Not authenticated' }
      }

      const url = couchUrlRef.current
      if (!url) {
        return { success: false, error: 'CouchDB not configured' }
      }

      try {
        // Fetch current user doc
        const getRes = await fetch(`${url}/_users/org.couchdb.user:${username}`, {
          headers: { Authorization: `Basic ${credentials}` },
        })

        if (!getRes.ok) {
          return { success: false, error: 'Failed to fetch user document' }
        }

        const userDoc = (await getRes.json()) as Record<string, unknown>

        // Verify current password by trying to authenticate
        const verifyCredentials = btoa(`${username}:${currentPassword}`)
        const verifyRes = await fetch(`${url}/_session`, {
          headers: { Authorization: `Basic ${verifyCredentials}` },
        })

        if (!verifyRes.ok) {
          return { success: false, error: 'Current password is incorrect' }
        }

        // PUT updated doc with new password
        const putRes = await fetch(`${url}/_users/org.couchdb.user:${username}`, {
          method: 'PUT',
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...userDoc, password: newPassword }),
        })

        if (!putRes.ok) {
          return { success: false, error: 'Failed to update password' }
        }

        // Update credentials in state and sessionStorage
        const newCredentials = btoa(`${username}:${newPassword}`)
        const newState: AuthState = { ...state, credentials: newCredentials }
        setState(newState)
        sessionStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ username, credentials: newCredentials, role: state.role }),
        )

        return { success: true }
      } catch {
        return { success: false, error: 'Network error' }
      }
    },
    [state],
  )

  const resetNursePassword = useCallback(
    async (adminPassword: string, newPassword: string): Promise<ResetNursePasswordResult> => {
      const url = couchUrlRef.current
      if (!url) {
        return { success: false, error: 'CouchDB not configured' }
      }

      const adminCredentials = btoa(`admin:${adminPassword}`)

      try {
        const getRes = await fetch(`${url}/_users/org.couchdb.user:nurse`, {
          headers: { Authorization: `Basic ${adminCredentials}` },
        })

        if (!getRes.ok) {
          return {
            success: false,
            error: 'Admin password is incorrect. Password was not reset.',
          }
        }

        const nurseDoc = (await getRes.json()) as Record<string, unknown>

        const putRes = await fetch(`${url}/_users/org.couchdb.user:nurse`, {
          method: 'PUT',
          headers: {
            Authorization: `Basic ${adminCredentials}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...nurseDoc, password: newPassword }),
        })

        if (!putRes.ok) {
          return { success: false, error: 'Failed to reset nurse password' }
        }

        return { success: true }
      } catch {
        return { success: false, error: 'Network error' }
      }
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
