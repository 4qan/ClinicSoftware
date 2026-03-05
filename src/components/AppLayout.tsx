import type { ReactNode } from 'react'
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
          <SearchBar variant="compact" />
        </div>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
