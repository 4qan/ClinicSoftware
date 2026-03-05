import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuthContext } from './auth/AuthProvider'
import { LoginPage } from './auth/LoginPage'
import { Header } from './components/Header'
import { HomePage } from './pages/HomePage'
import { RegisterPatientPage } from './pages/RegisterPatientPage'
import { PatientProfilePage } from './pages/PatientProfilePage'

function AppContent() {
  const { isAuthenticated } = useAuthContext()

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPatientPage />} />
          <Route path="/patient/:id" element={<PatientProfilePage />} />
          <Route path="/settings" element={
            <div className="max-w-2xl mx-auto p-6">
              <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
              <p className="text-gray-500 mt-2">Settings page coming soon.</p>
            </div>
          } />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
