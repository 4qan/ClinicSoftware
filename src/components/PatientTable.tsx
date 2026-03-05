import type { Patient } from '@/db/index'

interface PatientTableProps {
  patients: Patient[]
}

export function PatientTable({ patients }: PatientTableProps) {
  return <div>{patients.length} patients</div>
}
