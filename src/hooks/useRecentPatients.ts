import { useState, useEffect, useCallback } from 'react'
import type { Patient } from '@/db/index'
import { getRecentPatients } from '@/db/patients'
import { pouchDb } from '@/db/pouchdb'

export function useRecentPatients(limit: number = 10) {
  const [patients, setPatients] = useState<Patient[]>([])

  const refresh = useCallback(() => {
    getRecentPatients(limit).then(setPatients)
  }, [limit])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const changes = pouchDb.changes({
      since: 'now',
      live: true,
    })
    changes.on('change', (change: { id: string }) => {
      if (change.id.startsWith('patient:') || change.id.startsWith('recent:')) {
        refresh()
      }
    })
    return () => {
      changes.cancel()
    }
  }, [refresh])

  return patients
}
