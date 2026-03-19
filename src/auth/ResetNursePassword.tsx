import { useState, type FormEvent } from 'react'
import { useAuthContext } from './AuthProvider'

export function ResetNursePassword() {
  const { resetNursePassword } = useAuthContext()
  const [adminPassword, setAdminPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters.')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await resetNursePassword(adminPassword, newPassword)
      if (!result.success) {
        setError(result.error || 'Failed to reset nurse password')
      } else {
        setSuccess(true)
        setAdminPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Reset Nurse Password</h3>

      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <p className="text-lg font-semibold text-green-800 flex items-center gap-2">
            <span>&#10003;</span> Nurse password reset successfully.
          </p>
          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800"
          >
            Reset again
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-password"
              className="block text-base font-medium text-gray-700 mb-1"
            >
              CouchDB Admin Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showAdminPassword ? 'text' : 'password'}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-3 pr-16 text-lg border border-gray-300 rounded-lg"
                required
              />
              <button
                type="button"
                onClick={() => setShowAdminPassword(!showAdminPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
              >
                {showAdminPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Enter the admin password set during CouchDB setup.
            </p>
          </div>

          <div>
            <label
              htmlFor="nurse-new-password"
              className="block text-base font-medium text-gray-700 mb-1"
            >
              New Password for Nurse
            </label>
            <div className="relative">
              <input
                id="nurse-new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 pr-16 text-lg border border-gray-300 rounded-lg"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="nurse-confirm-password"
              className="block text-base font-medium text-gray-700 mb-1"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="nurse-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 pr-16 text-lg border border-gray-300 rounded-lg"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-red-600 text-base">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg py-3 px-4 w-full min-h-[44px] disabled:opacity-50"
          >
            {isSubmitting ? 'Resetting...' : 'Reset Nurse Password'}
          </button>
        </form>
      )}
    </div>
  )
}
