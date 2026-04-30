import { createContext, useContext, type ReactNode } from 'react'
import { useCouchAuth } from './useCouchAuth'
import { useSoloAuth } from './useSoloAuth'

// Pin context type to the SHARED shape -- useSoloAuth's return type must satisfy
// this contract (verified by Plan 03's "exposes the same 9 keys as useCouchAuth"
// test). useCouchAuth is the canonical contract source.
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

/**
 * Solo-mode auth provider -- mounted by SoloProviders in App.tsx when
 * deploymentMode === 'solo'. Calls useSoloAuth (the only hook this component
 * will ever call -- rules-of-hooks safe).
 */
export function SoloAuthProvider({ children }: AuthProviderProps) {
  const auth = useSoloAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

/**
 * Networked-mode auth provider -- mounted by NetworkedProviders in App.tsx
 * when deploymentMode === 'networked'. Calls useCouchAuth (the only hook this
 * component will ever call -- rules-of-hooks safe).
 */
export function NetworkedAuthProvider({ children }: AuthProviderProps) {
  const auth = useCouchAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}
