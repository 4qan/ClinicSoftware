import { createContext, useContext, type ReactNode } from 'react'
import { useCouchAuth } from './useCouchAuth'

type AuthContextType = ReturnType<typeof useCouchAuth>

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuthContext(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return ctx
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useCouchAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}
