import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuthContext } from './auth/AuthProvider'
import { LoginPage } from './auth/LoginPage'
import { AppLayout } from './components/AppLayout'
import { HomePage } from './pages/HomePage'
import { PatientsPage } from './pages/PatientsPage'
import { RegisterPatientPage } from './pages/RegisterPatientPage'
import { PatientProfilePage } from './pages/PatientProfilePage'
import { SettingsPage } from './pages/SettingsPage'

function AppContent() {
  const { isAuthenticated } = useAuthContext()

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/register" element={<RegisterPatientPage />} />
        <Route path="/patient/:id" element={<PatientProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AppLayout>
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
