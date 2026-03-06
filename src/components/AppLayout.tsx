import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { SearchBar } from './SearchBar'

interface AppLayoutProps {
  children: ReactNode
}

const SIDEBAR_KEY = 'sidebarCollapsed'

function getInitialCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === 'true'
  } catch {
    return false
  }
}

export function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(getInitialCollapsed)

  function handleToggle() {
    setCollapsed((prev) => {
      const next = !prev
      try { localStorage.setItem(SIDEBAR_KEY, String(next)) } catch { /* ignore */ }
      return next
    })
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar collapsed={collapsed} onToggle={handleToggle} />
      <main className={`flex-1 transition-all duration-200 ${collapsed ? 'ml-16' : 'ml-60'}`}>
        <div className="app-header sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <SearchBar variant="compact" />
            </div>
            <Link
              to="/visit/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              style={{ minHeight: '40px' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">New Visit</span>
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              style={{ minHeight: '40px' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Register Patient</span>
            </Link>
          </div>
        </div>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
