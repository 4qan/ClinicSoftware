import { useRef, useCallback, useState } from 'react'
import PouchDB from 'pouchdb'
import { pouchDb } from '@/db/pouchdb'

export type SyncStatus = 'synced' | 'syncing' | 'disconnected'

export function useSyncManager() {
  const syncHandleRef = useRef<PouchDB.Replication.Sync<object> | null>(null)
  const remoteDbRef = useRef<PouchDB.Database | null>(null)
  const [status, setStatus] = useState<SyncStatus>('disconnected')
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const stop = useCallback(() => {
    syncHandleRef.current?.cancel()
    syncHandleRef.current = null
    setStatus('disconnected')
  }, [])

  const start = useCallback(
    (couchUrl: string, credentials: string) => {
      // Guard: Pitfall 3 prevention — no double sync
      if (syncHandleRef.current) return

      const remoteDb = new PouchDB(`${couchUrl}/clinicsoftware_v2`, {
        fetch: (url: string | Request, opts?: RequestInit) => {
          const headers = new Headers((opts as RequestInit | undefined)?.headers)
          headers.set('Authorization', `Basic ${credentials}`)
          return PouchDB.fetch(url as string, { ...(opts as RequestInit), headers })
        },
      })

      remoteDbRef.current = remoteDb

      const handle = pouchDb.sync(remoteDb, {
        live: true,
        retry: true,
      }) as PouchDB.Replication.Sync<object>

      handle
        .on('change', () => {
          setStatus('syncing')
          setErrorMessage(null)
        })
        .on('paused', (err: unknown) => {
          if (err) {
            // retry:true fires paused(err) for transient failures instead of error
            console.warn('[sync] paused with error:', err)
            setStatus('disconnected')
            setErrorMessage(String(err))
          } else {
            setStatus('synced')
            setLastSynced(new Date())
          }
        })
        .on('active', () => {
          setStatus('syncing')
        })
        .on('denied', () => {
          // doc rejected by validate_doc_update — not a connection error
          console.warn('[sync] write denied by server')
        })
        .on('error', (err: unknown) => {
          const errWithStatus = err as { status?: number }
          if (errWithStatus.status === 401 || errWithStatus.status === 403) {
            // Auth error — stop retrying and surface clear message
            stop()
            setErrorMessage('Authentication failed. Log out and log in again.')
          } else {
            console.error('[sync] fatal error:', err)
            setStatus('disconnected')
            setErrorMessage(String(err))
          }
        })

      syncHandleRef.current = handle
      setStatus('syncing')
    },
    [stop],
  )

  const retry = useCallback(() => {
    stop()
    // Caller must call start() again with credentials
  }, [stop])

  return { status, lastSynced, errorMessage, start, stop, retry }
}
