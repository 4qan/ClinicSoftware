import { Link, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useAuthContext } from '@/auth/AuthProvider'
import { searchPatients } from '@/db/patients'
import type { Patient } from '@/db/index'

export function Header() {
  const { logout } = useAuthContext()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Patient[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }

    const timeout = setTimeout(async () => {
      const found = await searchPatients(query)
      setResults(found)
      setShowDropdown(true)
    }, 250)

    return () => clearTimeout(timeout)
  }, [query])

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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setShowDropdown(false)
      inputRef.current?.blur()
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <Link to="/" tabIndex={-1} className="text-xl sm:text-2xl font-bold text-gray-900 whitespace-nowrap hover:text-blue-700">
          Clinic Software
        </Link>

        <div className="relative flex-1 max-w-md" ref={dropdownRef}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && results.length > 0 && setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search patients..."
            className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg"
          />
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
              {results.length === 0 ? (
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
                results.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => handleSelect(patient)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
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

        <div className="flex items-center gap-2">
          <Link
            to="/settings"
            tabIndex={-1}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            aria-label="Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
          <button
            onClick={logout}
            tabIndex={-1}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            Log Out
          </button>
        </div>
      </div>
    </header>
  )
}
