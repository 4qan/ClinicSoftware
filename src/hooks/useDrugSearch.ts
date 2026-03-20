import { useState, useEffect, useCallback } from 'react'
import { searchDrugs } from '@/db/drugs'
import type { Drug } from '@/db/index'
import { pouchDb } from '@/db/pouchdb'

export function useDrugSearch(query: string) {
  const [results, setResults] = useState<Drug[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const doSearch = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (trimmed.length < 1) {
      setResults([])
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    const found = await searchDrugs(trimmed)
    setResults(found)
    setIsSearching(false)
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 1) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    let cancelled = false

    const timeout = setTimeout(async () => {
      if (!cancelled) {
        await doSearch(query)
      }
    }, 200)

    return () => {
      cancelled = true
      clearTimeout(timeout)
      setIsSearching(false)
    }
  }, [query, doSearch])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 1) return

    const changes = pouchDb.changes({
      since: 'now',
      live: true,
    })
    changes.on('change', (change: { id: string }) => {
      if (change.id.startsWith('drug:')) {
        doSearch(query)
      }
    })
    return () => {
      changes.cancel()
    }
  }, [query, doSearch])

  return { results, isSearching }
}
