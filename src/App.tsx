import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SoloAuthProvider, NetworkedAuthProvider, useAuthContext } from './auth/AuthProvider'
import { SyncProvider } from '@/sync/SyncContext'
import { getDeploymentMode } from '@/db/localSettings'
import { ToastProvider } from './components/ToastProvider'
import { LoginPage } from './auth/LoginPage'
import { seedDrugDatabase, deduplicateExistingDrugs } from './db/seedDrugs'
import { checkAndCreateSnapshot } from './utils/snapshots'
import { runMigrationIfNeeded } from './db/migration'
import { ensureIndexes, migrateDbName } from './db/pouchdb'
import { AppLayout } from './components/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { HomePage } from './pages/HomePage'
import { PatientsPage } from './pages/PatientsPage'
import { RegisterPatientPage } from './pages/RegisterPatientPage'
import { PatientProfilePage } from './pages/PatientProfilePage'
import { SettingsPage } from './pages/SettingsPage'
import { NewVisitPage } from './pages/NewVisitPage'
import { EditVisitPage } from './pages/EditVisitPage'
import { PrintVisitPage } from './pages/PrintVisitPage'
import { MedicationsPage } from './pages/MedicationsPage'

function AppContent() {
  const { isAuthenticated } = useAuthContext()

  useEffect(() => {
    if (isAuthenticated) {
      migrateDbName()
        .then(() => runMigrationIfNeeded())
        .then(() => ensureIndexes())
        .then(() => seedDrugDatabase())
        .then(() => deduplicateExistingDrugs())
        .catch(console.error)

      checkAndCreateSnapshot().catch(console.error)
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
        <Route path="/medications" element={<ProtectedRoute allowedRoles={['doctor']}><MedicationsPage /></ProtectedRoute>} />
        <Route path="/register" element={<RegisterPatientPage />} />
        <Route path="/patient/:id" element={<PatientProfilePage />} />
        <Route path="/visit/new" element={<NewVisitPage />} />
        <Route path="/visit/:id/edit" element={<EditVisitPage />} />
        <Route path="/visit/:id/print" element={<ProtectedRoute allowedRoles={['doctor']}><PrintVisitPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute allowedRoles={['doctor']}><SettingsPage /></ProtectedRoute>} />
      </Routes>
    </AppLayout>
  )
}

function App() {
  const mode = getDeploymentMode() // D-01: read once at boot
  return (
    <BrowserRouter basename="/ClinicSoftware">
      {mode === 'solo' ? <SoloProviders /> : <NetworkedProviders />}
    </BrowserRouter>
  )
}

function SoloProviders() {
  // SyncProvider intentionally omitted in solo (D-03 option A). SyncContext is
  // also short-circuited internally as defense in depth (Task 2). The two
  // gates together mitigate T-22.1-18.
  return (
    <SoloAuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </SoloAuthProvider>
  )
}

function NetworkedProviders() {
  return (
    <NetworkedAuthProvider>
      <SyncProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </SyncProvider>
    </NetworkedAuthProvider>
  )
}

export default App
