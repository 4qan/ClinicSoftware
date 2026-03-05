import { useState, useCallback, useEffect } from 'react'
import { db } from '@/db/index'
import {
  generateSalt,
  hashPassword,
  verifyPassword,
  generateRecoveryCode,
  saltToBase64,
  base64ToSalt,
} from './hash'

const SESSION_KEY = 'clinic_auth_session'
const DEFAULT_PASSWORD = 'clinic123'

interface AuthRecord {
  hash: string
  salt: string // base64
  recoveryHash?: string
  recoverySalt?: string // base64
}

async function getAuthRecord(): Promise<AuthRecord | undefined> {
  const setting = await db.settings.get('auth')
  return setting?.value as AuthRecord | undefined
}

async function setAuthRecord(record: AuthRecord): Promise<void> {
  await db.settings.put({ key: 'auth', value: record })
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(SESSION_KEY) === 'true'
  })
  const [isLoading, setIsLoading] = useState(false)

  // Auto-check session on mount
  useEffect(() => {
    const hasSession = localStorage.getItem(SESSION_KEY) === 'true'
    setIsAuthenticated(hasSession)
  }, [])

  const login = useCallback(async (password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      let auth = await getAuthRecord()

      // First run: no auth record exists. Accept default password and create the record.
      if (!auth) {
        if (password !== DEFAULT_PASSWORD) {
          return false
        }
        const salt = generateSalt()
        const hash = await hashPassword(DEFAULT_PASSWORD, salt)
        auth = { hash, salt: saltToBase64(salt) }
        await setAuthRecord(auth)
        localStorage.setItem(SESSION_KEY, 'true')
        setIsAuthenticated(true)
        return true
      }

      // Normal login: verify against stored hash
      const salt = base64ToSalt(auth.salt)
      const valid = await verifyPassword(password, salt, auth.hash)
      if (valid) {
        localStorage.setItem(SESSION_KEY, 'true')
        setIsAuthenticated(true)
        return true
      }

      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const changePassword = useCallback(
    async (
      currentPassword: string,
      newPassword: string,
    ): Promise<{ success: boolean; recoveryCode?: string; error?: string }> => {
      const auth = await getAuthRecord()
      if (!auth) {
        return { success: false, error: 'No auth record found' }
      }

      const salt = base64ToSalt(auth.salt)
      const valid = await verifyPassword(currentPassword, salt, auth.hash)
      if (!valid) {
        return { success: false, error: 'Current password is incorrect' }
      }

      const newSalt = generateSalt()
      const newHash = await hashPassword(newPassword, newSalt)
      const recoveryCode = generateRecoveryCode()

      // Hash the recovery code for storage
      const recoverySalt = generateSalt()
      const recoveryHash = await hashPassword(recoveryCode, recoverySalt)

      await setAuthRecord({
        hash: newHash,
        salt: saltToBase64(newSalt),
        recoveryHash,
        recoverySalt: saltToBase64(recoverySalt),
      })

      return { success: true, recoveryCode }
    },
    [],
  )

  const recoverWithCode = useCallback(
    async (
      code: string,
      newPassword: string,
    ): Promise<{ success: boolean; error?: string }> => {
      const auth = await getAuthRecord()
      if (!auth || !auth.recoveryHash || !auth.recoverySalt) {
        return { success: false, error: 'No recovery code is configured' }
      }

      const recoverySalt = base64ToSalt(auth.recoverySalt)
      const valid = await verifyPassword(code, recoverySalt, auth.recoveryHash)
      if (!valid) {
        return { success: false, error: 'Invalid recovery code' }
      }

      const newSalt = generateSalt()
      const newHash = await hashPassword(newPassword, newSalt)

      await setAuthRecord({
        hash: newHash,
        salt: saltToBase64(newSalt),
        // Clear recovery code after use
      })

      localStorage.setItem(SESSION_KEY, 'true')
      setIsAuthenticated(true)
      return { success: true }
    },
    [],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setIsAuthenticated(false)
  }, [])

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
    changePassword,
    recoverWithCode,
  }
}
