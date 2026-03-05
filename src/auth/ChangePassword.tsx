import { useState, type FormEvent } from 'react'
import { useAuthContext } from './AuthProvider'

export function ChangePassword() {
  const { changePassword } = useAuthContext()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await changePassword(currentPassword, newPassword)
      if (!result.success) {
        setError(result.error || 'Password change failed')
      } else {
        setSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Change Password</h2>

      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <p className="text-lg font-semibold text-green-800 flex items-center gap-2">
            <span>&#10003;</span> Password changed successfully.
          </p>
          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800"
          >
            Change again
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="current-password"
              className="block text-base font-medium text-gray-700 mb-1"
            >
              Current Password
            </label>
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="new-password-change"
              className="block text-base font-medium text-gray-700 mb-1"
            >
              New Password
            </label>
            <input
              id="new-password-change"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-base font-medium text-gray-700 mb-1"
            >
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {error && (
            <p className="text-red-600 text-base" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-blue-700 text-white text-lg font-semibold rounded-lg hover:bg-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      )}
    </div>
  )
}
