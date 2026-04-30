import { useSyncContext } from '@/sync/SyncContext'

const SYNC_STATUS_CONFIG = {
  synced: { dot: 'bg-green-500', label: 'Synced' },
  syncing: { dot: 'bg-blue-500 animate-pulse', label: 'Syncing' },
  disconnected: { dot: 'bg-gray-400', label: 'Disconnected' },
}

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

/**
 * Networked-only Settings sub-component, renders the Phase 22 sync status section
 * (status dot, last-synced, error message, retry button). Calls useSyncContext, which
 * MUST be rendered under a SyncProvider. In solo mode, App.tsx omits SyncProvider, so
 * this component must NEVER be mounted in solo (SettingsPage gates it behind !isSolo).
 *
 * Extracted from SettingsPage.tsx in Phase 22.1 / Plan 06 / Task 1 to defer the
 * useSyncContext call out of the top-level SettingsPage render path. Solo-mode
 * SettingsPage no longer touches useSyncContext at all.
 */
export function NetworkedSyncTab() {
  const { status, lastSynced, errorMessage, retry } = useSyncContext()
  return (
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
  )
}
