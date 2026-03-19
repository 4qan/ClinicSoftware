import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthContext } from '@/auth/AuthProvider'
import { ChangePassword } from '@/auth/ChangePassword'
import { ResetNursePassword } from '@/auth/ResetNursePassword'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { ClinicInfoSettings } from '@/components/ClinicInfoSettings'
import { DataSettings } from '@/components/DataSettings'
import { PrintSettings } from '@/components/PrintSettings'

type SettingsCategory = 'account' | 'clinic' | 'data' | 'print'

const TABS: { key: SettingsCategory; label: string }[] = [
  { key: 'account', label: 'Account' },
  { key: 'clinic', label: 'Clinic Info' },
  { key: 'data', label: 'Data' },
  { key: 'print', label: 'Print' },
]

export function SettingsPage() {
  const { role } = useAuthContext()
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('account')

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
    </div>
  )
}
