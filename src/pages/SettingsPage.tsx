import { useState, useEffect, type FormEvent } from 'react'
import { ChangePassword } from '@/auth/ChangePassword'
import { useAuthContext } from '@/auth/AuthProvider'

function RecoveryCodeSection() {
  const { regenerateRecoveryCode, checkRecoveryCodeExists } = useAuthContext()
  const [hasCode, setHasCode] = useState<boolean | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    checkRecoveryCodeExists().then(setHasCode)
  }, [checkRecoveryCodeExists])

  async function handleConfirm(e: FormEvent) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const result = await regenerateRecoveryCode(password)
      if (!result.success) {
        setError(result.error || 'Failed to generate recovery code')
      } else if (result.recoveryCode) {
        setRecoveryCode(result.recoveryCode)
        setPassword('')
        setShowPrompt(false)
        setHasCode(true)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleDismiss() {
    setRecoveryCode('')
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Security Code</h3>

      {hasCode === null ? (
        <p className="text-sm text-gray-400">Checking...</p>
      ) : hasCode ? (
        <p className="text-sm text-gray-600 mb-3">
          Recovery code is configured. You can regenerate it below.
        </p>
      ) : (
        <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
          Recovery code is not configured. Generate one to enable password recovery.
        </p>
      )}

      {recoveryCode ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h4 className="text-base font-semibold text-green-800 mb-2">Your Recovery Code</h4>
          <p className="text-2xl font-mono font-bold text-center bg-white border border-green-300 rounded p-3 mb-3 select-all">
            {recoveryCode}
          </p>
          <p className="text-sm text-gray-600 mb-3">
            Write this code down on paper and keep it safe. You will need it to reset your
            password if you forget it. This code can only be used once.
          </p>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Done
          </button>
        </div>
      ) : showPrompt ? (
        <form onSubmit={handleConfirm} className="space-y-3">
          <div>
            <label htmlFor="recovery-password" className="block text-sm font-medium text-gray-700 mb-1">
              Enter current password to continue
            </label>
            <input
              id="recovery-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg"
            >
              {isSubmitting ? 'Generating...' : 'Confirm'}
            </button>
            <button
              type="button"
              onClick={() => { setShowPrompt(false); setError(''); setPassword('') }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowPrompt(true)}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 hover:bg-blue-50 rounded-lg"
        >
          {hasCode ? 'View / Regenerate Recovery Code' : 'Generate Recovery Code'}
        </button>
      )}
    </div>
  )
}

export function SettingsPage() {
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
      <RecoveryCodeSection />
      <ChangePassword />
    </div>
  )
}
