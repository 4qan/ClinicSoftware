import { useState, type FormEvent } from 'react'
import { useAuthContext } from './AuthProvider'

export function LoginPage() {
  const { login } = useAuthContext()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const result = await login(username, password)
      if (!result.ok) {
        switch (result.error) {
          case 'not_configured':
            setError('CouchDB is not configured. Go to Settings to add the server address.')
            break
          case 'invalid_credentials':
            setError('Incorrect username or password. Please try again.')
            break
          case 'network_error':
            setError('Could not connect to CouchDB. Check the server address in Settings.')
            break
          case 'unknown_role':
            setError('Your account does not have a recognised role. Contact your administrator.')
            break
          default:
            setError('Login failed. Please try again.')
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Clinic Software</h1>
        <p className="text-gray-500 text-center mb-6">Enter your password to continue</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-base font-medium text-gray-700 mb-1"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg"
              placeholder="doctor or nurse"
              autoFocus
              required
            />
          </div>

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
                className="w-full px-4 py-3 pr-16 text-lg border border-gray-300 rounded-lg"
                placeholder="Enter password"
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
            <p role="alert" className="text-red-600 text-base">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-blue-700 text-white text-lg font-semibold rounded-lg hover:bg-blue-800 disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  )
}
