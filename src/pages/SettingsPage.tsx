import { ChangePassword } from '@/auth/ChangePassword'

export function SettingsPage() {
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
      <ChangePassword />
    </div>
  )
}
