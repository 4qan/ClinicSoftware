import { useSyncContext } from '@/sync/SyncContext'

interface SyncIndicatorProps {
  collapsed: boolean
}

const STATUS_CONFIG = {
  synced: { dot: 'bg-green-500', label: 'Synced' },
  syncing: { dot: 'bg-blue-500 animate-pulse', label: 'Syncing' },
  disconnected: { dot: 'bg-gray-400', label: 'Offline' },
}

export function SyncIndicator({ collapsed }: SyncIndicatorProps) {
  const { status } = useSyncContext()
  const { dot, label } = STATUS_CONFIG[status]

  return (
    <div
      aria-label={`Sync status: ${label}`}
      className={
        collapsed
          ? 'flex items-center justify-center py-2'
          : 'flex items-center gap-2 px-3 py-2'
      }
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
      {!collapsed && (
        <span className="text-sm text-gray-500">{label}</span>
      )}
    </div>
  )
}
