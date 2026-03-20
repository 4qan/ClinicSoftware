import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthContext } from '@/auth/AuthProvider'
import { ChangePassword } from '@/auth/ChangePassword'
import { ResetNursePassword } from '@/auth/ResetNursePassword'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { ClinicInfoSettings } from '@/components/ClinicInfoSettings'
import { DataSettings } from '@/components/DataSettings'
import { PrintSettings } from '@/components/PrintSettings'
import { useSyncContext } from '@/sync/SyncContext'

type SettingsCategory = 'account' | 'clinic' | 'data' | 'print' | 'sync'

const TABS: { key: SettingsCategory; label: string }[] = [
  { key: 'account', label: 'Account' },
  { key: 'clinic', label: 'Clinic Info' },
  { key: 'data', label: 'Data' },
  { key: 'print', label: 'Print' },
  { key: 'sync', label: 'Sync' },
]

function formatRelativeTime(date: Date): string {
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} minutes ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hours ago`
  return date.toLocaleString()
}

const SYNC_STATUS_CONFIG = {
  synced: { dot: 'bg-green-500', label: 'Synced' },
  syncing: { dot: 'bg-blue-500 animate-pulse', label: 'Syncing' },
  disconnected: { dot: 'bg-gray-400', label: 'Disconnected' },
}

export function SettingsPage() {
  const { role } = useAuthContext()
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('account')
  const { status, lastSynced, errorMessage, retry } = useSyncContext()

  return (
    <div className="max-w-2xl">
      <Breadcrumbs crumbs={[{ label: 'Home', path: '/' }, { label: 'Settings' }]} />
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveCategory(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors cursor-pointer ${
              activeCategory === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Medications link */}
      <div className="mb-5 px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-gray-700">
        Manage medications from the{' '}
        <Link to="/medications" className="text-blue-600 hover:underline font-medium">
          Medications page
        </Link>
        .
      </div>

      {/* Account Tab */}
      {activeCategory === 'account' && (
        <div>
          <ChangePassword />
          {role === 'doctor' && (
            <div className="mt-6">
              <ResetNursePassword />
            </div>
          )}
        </div>
      )}

      {/* Clinic Info Tab */}
      {activeCategory === 'clinic' && (
        <ClinicInfoSettings />
      )}

      {/* Data Tab */}
      {activeCategory === 'data' && (
        <DataSettings />
      )}

      {/* Print Tab */}
      {activeCategory === 'print' && (
        <PrintSettings />
      )}

      {/* Sync Tab */}
      {activeCategory === 'sync' && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          {/* Status row */}
          <div className="flex items-center gap-3 mb-4">
            <span className={`w-3 h-3 rounded-full flex-shrink-0 ${SYNC_STATUS_CONFIG[status].dot}`} />
            <span className="text-base text-gray-900 font-semibold">{SYNC_STATUS_CONFIG[status].label}</span>
          </div>

          {/* Last synced row */}
          {lastSynced && (
            <p className="text-sm text-gray-500 mb-4">
              Last synced: {formatRelativeTime(lastSynced)}
            </p>
          )}
          {!lastSynced && status === 'disconnected' && (
            <p className="text-sm text-gray-500 mb-4">Never synced</p>
          )}

          {/* Error detail row */}
          {status === 'disconnected' && errorMessage && (
            <p className="text-sm text-red-600 mb-4">{errorMessage.slice(0, 120)}</p>
          )}

          {/* Retry button */}
          {status === 'disconnected' && (
            <button
              type="button"
              onClick={retry}
              className="bg-blue-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Retry connection
            </button>
          )}
        </div>
      )}
    </div>
  )
}
