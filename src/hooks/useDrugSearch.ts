import { useState, useEffect } from 'react'
import { searchDrugs } from '@/db/drugs'
import type { Drug } from '@/db/index'

export function useDrugSearch(query: string) {
  const [results, setResults] = useState<Drug[]>([])
  const [isSearching, setIsSearching] = useState(false)

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
      const found = await searchDrugs(trimmed)
      if (!cancelled) {
        setResults(found)
        setIsSearching(false)
      }
    }, 200)

    return () => {
      cancelled = true
      clearTimeout(timeout)
      setIsSearching(false)
    }
  }, [query])

  return { results, isSearching }
}
