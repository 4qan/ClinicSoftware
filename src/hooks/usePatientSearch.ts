import { useState, useEffect, useCallback } from 'react'
import { searchPatients } from '@/db/patients'
import type { Patient } from '@/db/index'
import { pouchDb } from '@/db/pouchdb'

export function usePatientSearch(query: string) {
  const [results, setResults] = useState<Patient[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const doSearch = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (trimmed.length < 2) {
      setResults([])
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    const found = await searchPatients(trimmed)
    setResults(found)
    setIsSearching(false)
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timeout = setTimeout(() => {
      doSearch(query)
    }, 250)

    return () => {
      clearTimeout(timeout)
      setIsSearching(false)
    }
  }, [query, doSearch])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) return

    const changes = pouchDb.changes({
      since: 'now',
      live: true,
    })
    changes.on('change', (change: { id: string }) => {
      if (change.id.startsWith('patient:')) {
        doSearch(query)
      }
    })
    return () => {
      changes.cancel()
    }
  }, [query, doSearch])

  return { results, isSearching }
}
