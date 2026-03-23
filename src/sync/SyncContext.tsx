import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuthContext } from '@/auth/AuthProvider'
import { useSyncManager, type SyncStatus } from './useSyncManager'
import { getCouchUrl } from '@/db/localSettings'

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
  const { status: pouchStatus, lastSynced, errorMessage: pouchError, start, stop, retry: _retry } = useSyncManager()
  const [browserOnline, setBrowserOnline] = useState(navigator.onLine)

  // Track browser online/offline state
  useEffect(() => {
    const goOnline = () => setBrowserOnline(true)
    const goOffline = () => setBrowserOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !credentials) {
      stop()
      return
    }

    const url = getCouchUrl()
    if (url) {
      start(url, credentials)
    }

    return () => stop()
  }, [isAuthenticated, credentials, start, stop])

  const startSync = () => {
    stop()
    if (!credentials) return
    const url = getCouchUrl()
    if (url && credentials) {
      start(url, credentials)
    }
  }

  // Override status to disconnected when browser reports offline
  const status: SyncStatus = !browserOnline ? 'disconnected' : pouchStatus
  const errorMessage = !browserOnline ? 'Network offline' : pouchError

  return (
    <SyncContext.Provider value={{ status, lastSynced, errorMessage, retry: startSync, startSync }}>
      {children}
    </SyncContext.Provider>
  )
}
