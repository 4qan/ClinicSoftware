import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { SearchBar } from './SearchBar'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-60">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <SearchBar variant="compact" />
            </div>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              style={{ minHeight: '40px' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Register Patient
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
