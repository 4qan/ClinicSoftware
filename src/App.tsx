import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuthContext } from './auth/AuthProvider'
import { LoginPage } from './auth/LoginPage'
import { seedDrugDatabase, deduplicateExistingDrugs } from './db/seedDrugs'
import { AppLayout } from './components/AppLayout'
import { HomePage } from './pages/HomePage'
import { PatientsPage } from './pages/PatientsPage'
import { RegisterPatientPage } from './pages/RegisterPatientPage'
import { PatientProfilePage } from './pages/PatientProfilePage'
import { SettingsPage } from './pages/SettingsPage'
import { NewVisitPage } from './pages/NewVisitPage'
import { EditVisitPage } from './pages/EditVisitPage'

function AppContent() {
  const { isAuthenticated } = useAuthContext()

  useEffect(() => {
    if (isAuthenticated) {
      seedDrugDatabase()
        .then(() => deduplicateExistingDrugs())
        .catch(console.error)
    }
  }, [isAuthenticated])

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
        <Route path="/visit/new" element={<NewVisitPage />} />
        <Route path="/visit/:id/edit" element={<EditVisitPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AppLayout>
  )
}

function App() {
  return (
    <BrowserRouter basename="/ClinicSoftware">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
