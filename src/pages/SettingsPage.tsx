import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuthContext } from '@/auth/AuthProvider'
import { ChangePassword } from '@/auth/ChangePassword'
import { ResetNursePassword } from '@/auth/ResetNursePassword'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { ClinicInfoSettings } from '@/components/ClinicInfoSettings'
import { DataSettings } from '@/components/DataSettings'
import { PrintSettings } from '@/components/PrintSettings'
import { getDeploymentMode } from '@/db/localSettings'
import { NetworkedSyncTab } from './NetworkedSyncTab'

type SettingsCategory = 'account' | 'clinic' | 'data' | 'print' | 'sync'

const VALID_TABS = new Set<SettingsCategory>(['account', 'clinic', 'data', 'print', 'sync'])

/**
 * B2 (Plan 07 unblocks the upgrade-card render assertion): support `?tab=` deep-link.
 * Accepts: account | clinic | data | print | sync | networking.
 * Both 'sync' and 'networking' map to internal key 'sync' so links work in both modes.
 * Invalid or missing → 'account'.
 */
function resolveInitialCategory(searchParams: URLSearchParams): SettingsCategory {
  const raw = searchParams.get('tab')
  if (!raw) return 'account'
  const normalized = raw === 'networking' ? 'sync' : raw
  return VALID_TABS.has(normalized as SettingsCategory)
    ? (normalized as SettingsCategory)
    : 'account'
}

export function SettingsPage() {
  const { role } = useAuthContext()
  const isSolo = getDeploymentMode() === 'solo'
  const [searchParams] = useSearchParams()
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>(() => resolveInitialCategory(searchParams))

  // Per D-09 + UI-SPEC: tab label flips to 'Networking' in solo. Internal key stays 'sync' to
  // avoid renaming the SettingsCategory union and the conditional render checks below.
  const TABS: { key: SettingsCategory; label: string }[] = [
    { key: 'account', label: 'Account' },
    { key: 'clinic', label: 'Clinic Info' },
    { key: 'data', label: 'Data' },
    { key: 'print', label: 'Print' },
    { key: 'sync', label: isSolo ? 'Networking' : 'Sync' },
  ]

  return (
    <div className="max-w-2xl">
      <Breadcrumbs crumbs={[{ label: 'Home', path: '/' }, { label: 'Settings' }]} />
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map((tab) => {
          const disabled = isSolo && tab.key === 'sync'
          return (
            <button
              key={tab.key}
              type="button"
              onClick={disabled ? undefined : () => setActiveCategory(tab.key)}
              aria-disabled={disabled || undefined}
              tabIndex={disabled ? -1 : undefined}
              title={disabled ? 'Networking is not available in solo mode' : undefined}
              className={
                disabled
                  ? 'px-4 py-2 text-sm font-medium rounded-full bg-gray-100 text-gray-600 opacity-50 cursor-not-allowed'
                  : `px-4 py-2 text-sm font-medium rounded-full transition-colors cursor-pointer ${
                      activeCategory === tab.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`
              }
            >
              {tab.label}
            </button>
          )
        })}
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
          {/* ResetNursePassword: networked + doctor only (D-12). Solo has no nurse account. */}
          {!isSolo && role === 'doctor' && (
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

      {/* Sync / Networking Tab — solo branch: ONLY the upgrade card, no Phase 22 sync status section
          (per UI-SPEC Component #2: hidden in solo, not preserve-and-disable — overrides D-09 implementation hint).
          Reachable in solo via ?tab=networking deep-link (B2). */}
      {activeCategory === 'sync' && isSolo && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Add a second computer</h3>
          <p className="text-sm text-gray-500 mb-4">Coming soon.</p>
          <button
            disabled
            className="bg-gray-100 text-gray-400 cursor-not-allowed px-4 py-2 text-sm rounded-lg min-h-[44px]"
          >Coming soon</button>
        </div>
      )}

      {/* Sync Tab — networked branch: extracted Phase 22 status section, unchanged behavior */}
      {activeCategory === 'sync' && !isSolo && <NetworkedSyncTab />}
    </div>
  )
}
