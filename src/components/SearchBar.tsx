import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePatientSearch } from '@/hooks/usePatientSearch'
import { useAutocompleteKeyboard } from '@/hooks/useAutocompleteKeyboard'
import type { Patient } from '@/db/index'

interface SearchBarProps {
  variant?: 'prominent' | 'compact'
}

export function SearchBar({ variant = 'prominent' }: SearchBarProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const { results, isSearching } = usePatientSearch(query)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isProminent = variant === 'prominent'
  const hasQuery = query.trim().length >= 2

  useEffect(() => {
    if (hasQuery) {
      setShowDropdown(true)
    } else {
      setShowDropdown(false)
    }
  }, [hasQuery, results])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(patient: Patient) {
    setQuery('')
    setShowDropdown(false)
    navigate(`/patient/${patient.id}`)
  }

  const close = useCallback(() => {
    setShowDropdown(false)
    // Intentionally do NOT clear query or blur -- hook manages only close
  }, [])

  const { highlightIndex: highlightedIndex, handleKeyDown } = useAutocompleteKeyboard<Patient>({
    items: results,
    isOpen: showDropdown,
    onSelect: handleSelect,
    onClose: close,
  })

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <svg
          className={`absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 ${isProminent ? 'w-6 h-6' : 'w-5 h-5'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => hasQuery && setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search patients by name, ID, or contact..."
          className={`w-full border border-gray-300 rounded-lg ${
            isProminent ? 'pl-12 pr-4 py-4 text-lg' : 'pl-10 pr-4 py-2 text-base'
          }`}
        />
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No patients found</p>
              <button
                onClick={() => { setShowDropdown(false); setQuery(''); navigate('/register') }}
                className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Register New Patient
              </button>
            </div>
          ) : (
            results.map((patient, index) => (
              <button
                key={patient.id}
                onClick={() => handleSelect(patient)}
                className={`w-full px-4 py-3 text-left border-b border-gray-100 last:border-b-0 flex items-center gap-3 ${
                  index === highlightedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  {patient.patientId}
                </span>
                <span className="font-medium text-gray-900">
                  {patient.firstName} {patient.lastName}
                </span>
                {patient.contact && (
                  <span className="text-sm text-gray-500 ml-auto">{patient.contact}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
