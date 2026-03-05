import { useState, useEffect } from 'react'
import { searchPatients } from '@/db/patients'
import type { Patient } from '@/db/index'

export function usePatientSearch(query: string) {
  const [results, setResults] = useState<Patient[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timeout = setTimeout(async () => {
      const found = await searchPatients(trimmed)
      setResults(found)
      setIsSearching(false)
    }, 250)

    return () => {
      clearTimeout(timeout)
      setIsSearching(false)
    }
  }, [query])

  return { results, isSearching }
}
