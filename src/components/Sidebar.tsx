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
    label: 'Register Patient',
    path: '/register',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
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

export function Sidebar() {
  const location = useLocation()
  const { logout } = useAuthContext()

  return (
    <aside className="fixed top-0 left-0 w-60 h-screen bg-white border-r border-gray-200 flex flex-col z-20">
      <div className="px-5 py-5">
        <Link to="/" className="text-xl font-bold text-gray-900 hover:text-blue-700">
          Clinic Software
        </Link>
      </div>

      <nav className="flex-1 px-3">
        {navItems.map((item) => {
          const active = isActive(item.path, location.pathname)
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-3 mb-1 rounded-lg text-base cursor-pointer transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
              style={{ minHeight: '44px' }}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 pb-5">
        <button
          onClick={logout}
          className="w-full text-left px-3 py-3 text-base text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
          style={{ minHeight: '44px' }}
        >
          Log Out
        </button>
      </div>
    </aside>
  )
}
