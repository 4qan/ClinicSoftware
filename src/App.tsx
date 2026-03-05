import { AuthProvider, useAuthContext } from './auth/AuthProvider'
import { LoginPage } from './auth/LoginPage'

function AppContent() {
  const { isAuthenticated, logout } = useAuthContext()

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clinic Software</h1>
        <button
          onClick={logout}
          className="px-4 py-2 text-base text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          Log Out
        </button>
      </header>
      <main className="p-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl text-gray-700">Welcome, Doctor</h2>
          <p className="text-gray-500 mt-2">Patient management coming soon.</p>
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
