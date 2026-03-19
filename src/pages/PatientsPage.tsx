import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { pouchDb } from '@/db/pouchdb'
import type { Patient } from '@/db/index'
import { PatientTable } from '@/components/PatientTable'
import { Breadcrumbs } from '@/components/Breadcrumbs'

export function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])

  useEffect(() => {
    pouchDb.allDocs({
      startkey: 'patient:',
      endkey: 'patient:\uffff',
      include_docs: true,
    }).then(result => {
      const pts = result.rows
        .map(r => r.doc as any)
        .map(({ _id, _rev, type, ...rest }: { _id: string; _rev: string; type: string; [key: string]: unknown }) => rest as unknown as Patient)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      setPatients(pts)
    })
  }, [])

  return (
    <div>
      <Breadcrumbs crumbs={[{ label: 'Home', path: '/' }, { label: 'Patients' }]} />
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Patients</h2>

      {patients.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg text-gray-400 mb-4">No patients registered yet</p>
          <Link
            to="/register"
            className="text-blue-600 hover:text-blue-800 font-medium text-base"
          >
            Register First Patient
          </Link>
        </div>
      ) : (
        <PatientTable patients={patients} />
      )}
    </div>
  )
}
