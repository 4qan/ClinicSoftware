import { Link, useLocation } from 'react-router-dom'
import { useAuthContext } from '@/auth/AuthProvider'

const navItems = [
  {
    label: 'Home',
    path: '/',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
      </svg>
    ),
  },
  {
    label: 'Patients',
    path: '/patients',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: 'Medications',
    path: '/medications',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

function isActive(itemPath: string, currentPath: string): boolean {
  if (itemPath === '/') return currentPath === '/'
  if (itemPath === '/patients') return currentPath === '/patients' || currentPath.startsWith('/patient/')
  return currentPath.startsWith(itemPath)
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const NURSE_ALLOWED_PATHS = ['/', '/patients']

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()
  const { logout, role } = useAuthContext()

  const visibleItems = role === 'nurse'
    ? navItems.filter(item => NURSE_ALLOWED_PATHS.includes(item.path))
    : navItems

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 flex flex-col z-20 transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className={`flex items-center ${collapsed ? 'justify-center py-5' : 'justify-between px-5 py-5'}`}>
        {!collapsed && (
          <Link to="/" tabIndex={-1} className="text-xl font-bold text-gray-900 hover:text-blue-700">
            Clinic Software
          </Link>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-3'}`}>
        {visibleItems.map((item) => {
          const active = isActive(item.path, location.pathname)
          return (
            <Link
              key={item.path}
              to={item.path}
              tabIndex={-1}
              title={collapsed ? item.label : undefined}
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-3 mb-1 rounded-lg text-base cursor-pointer transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
              style={{ minHeight: '44px' }}
            >
              {item.icon}
              {!collapsed && item.label}
            </Link>
          )
        })}
      </nav>

      <div className={`${collapsed ? 'px-2' : 'px-3'} pb-5`}>
        {/* Role label */}
        {role && (
          collapsed ? (
            <div className="flex justify-center py-2 mb-1" title={role === 'doctor' ? 'Doctor' : 'Nurse'}>
              <span className="text-sm font-semibold text-gray-400">
                {role === 'doctor' ? 'Dr' : 'Ns'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 mb-1">
              <span className="text-sm font-normal text-gray-400 uppercase tracking-wide">
                {role === 'doctor' ? 'Doctor' : 'Nurse'}
              </span>
            </div>
          )
        )}
        <button
          onClick={logout}
          tabIndex={-1}
          title={collapsed ? 'Log Out' : undefined}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-3 text-base text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors`}
          style={{ minHeight: '44px' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && <span className="ml-2">Log Out</span>}
        </button>
      </div>
    </aside>
  )
}
