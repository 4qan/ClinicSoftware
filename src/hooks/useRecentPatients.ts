import { useLiveQuery } from 'dexie-react-hooks'
import { getRecentPatients } from '@/db/patients'

export function useRecentPatients(limit: number = 10) {
  const patients = useLiveQuery(() => getRecentPatients(limit), [limit])
  return patients ?? []
}
