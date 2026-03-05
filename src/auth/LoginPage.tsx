import { useState, type FormEvent } from 'react'
import { useAuthContext } from './AuthProvider'

export function LoginPage() {
  const { login, recoverWithCode } = useAuthContext()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Recovery state
  const [showRecovery, setShowRecovery] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [recoveryError, setRecoveryError] = useState('')
  const [recoverySuccess, setRecoverySuccess] = useState(false)

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const success = await login(password)
      if (!success) {
        setError('Incorrect password. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRecover(e: FormEvent) {
    e.preventDefault()
    setRecoveryError('')
    setIsSubmitting(true)

    try {
      const result = await recoverWithCode(recoveryCode, newPassword)
      if (!result.success) {
        setRecoveryError(result.error || 'Recovery failed')
      } else {
        setRecoverySuccess(true)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showRecovery) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">
            Reset Password
          </h1>

          {recoverySuccess ? (
            <p className="text-green-700 text-center text-lg">
              Password reset successfully. You are now logged in.
            </p>
          ) : (
            <form onSubmit={handleRecover} className="space-y-4">
              <div>
                <label
                  htmlFor="recovery-code"
                  className="block text-base font-medium text-gray-700 mb-1"
                >
                  Recovery Code
                </label>
                <input
                  id="recovery-code"
                  type="text"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter recovery code"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="new-password"
                  className="block text-base font-medium text-gray-700 mb-1"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-16 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter new password"
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

              {recoveryError && (
                <p className="text-red-600 text-base" role="alert">
                  {recoveryError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-blue-700 text-white text-lg font-semibold rounded-lg hover:bg-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 min-h-[44px]"
              >
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </button>

              <button
                type="button"
                onClick={() => setShowRecovery(false)}
                className="w-full text-blue-700 text-base hover:underline"
              >
                Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Clinic Software
        </h1>
        <p className="text-gray-500 text-center mb-6">Enter your password to continue</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-base font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-16 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter password"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
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
            className="w-full py-3 px-4 bg-blue-700 text-white text-lg font-semibold rounded-lg hover:bg-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setShowRecovery(true)}
          className="w-full mt-4 text-blue-700 text-base hover:underline"
        >
          Forgot password?
        </button>
      </div>
    </div>
  )
}
