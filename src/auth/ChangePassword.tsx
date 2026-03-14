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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Change Password</h3>

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
            <div className="relative">
              <input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 pr-16 text-lg border border-gray-300 rounded-lg "
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
              >
                {showCurrentPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="new-password-change"
              className="block text-base font-medium text-gray-700 mb-1"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="new-password-change"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 pr-16 text-lg border border-gray-300 rounded-lg "
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
              htmlFor="confirm-password"
              className="block text-base font-medium text-gray-700 mb-1"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 pr-16 text-lg border border-gray-300 rounded-lg "
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
            <p className="text-red-600 text-base" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-blue-700 text-white text-lg font-semibold rounded-lg hover:bg-blue-800  disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      )}
    </div>
  )
}
