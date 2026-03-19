import { useState, useEffect } from 'react'
import type { Patient } from '@/db/index'
import { getRecentPatients } from '@/db/patients'

export function useRecentPatients(limit: number = 10) {
  const [patients, setPatients] = useState<Patient[]>([])

  useEffect(() => {
    getRecentPatients(limit).then(setPatients)
  }, [limit])

  return patients
}
