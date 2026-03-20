import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useAuthContext } from '@/auth/AuthProvider'
import { useSyncManager, type SyncStatus } from './useSyncManager'
import { getSetting } from '@/db/pouchdb'

export interface SyncContextType {
  status: SyncStatus
  lastSynced: Date | null
  errorMessage: string | null
  retry: () => void
  startSync: () => void
}

const SyncContext = createContext<SyncContextType | null>(null)

export function useSyncContext(): SyncContextType {
  const ctx = useContext(SyncContext)
  if (!ctx) throw new Error('useSyncContext must be used within SyncProvider')
  return ctx
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, credentials } = useAuthContext()
  const { status, lastSynced, errorMessage, start, stop, retry: _retry } = useSyncManager()

  useEffect(() => {
    if (!isAuthenticated || !credentials) {
      stop()
      return
    }

    getSetting('couchUrl').then((url) => {
      if (typeof url === 'string' && url) {
        start(url, credentials)
      }
    })

    return () => stop()
  }, [isAuthenticated, credentials, start, stop])

  const startSync = () => {
    stop()
    if (!credentials) return
    getSetting('couchUrl').then((url) => {
      if (typeof url === 'string' && url && credentials) {
        start(url, credentials)
      }
    })
  }

  return (
    <SyncContext.Provider value={{ status, lastSynced, errorMessage, retry: startSync, startSync }}>
      {children}
    </SyncContext.Provider>
  )
}
