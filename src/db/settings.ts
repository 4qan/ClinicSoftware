import { db } from './index'

export interface ClinicInfo {
  doctorName: string
  clinicName: string
  address: string
  phone: string
  footerText: string
}

const CLINIC_KEYS = [
  'clinicDoctorName',
  'clinicName',
  'clinicAddress',
  'clinicPhone',
  'clinicFooterText',
] as const

const DEFAULT_FOOTER = 'This is a computer-generated prescription and does not require a signature'

export async function getClinicInfo(): Promise<ClinicInfo> {
  const entries = await Promise.all(
    CLINIC_KEYS.map((key) => db.settings.get(key))
  )
  return {
    doctorName: (entries[0]?.value as string) || '',
    clinicName: (entries[1]?.value as string) || '',
    address: (entries[2]?.value as string) || '',
    phone: (entries[3]?.value as string) || '',
    footerText: (entries[4]?.value as string) ?? DEFAULT_FOOTER,
  }
}

export async function saveClinicInfo(info: ClinicInfo): Promise<void> {
  await db.transaction('rw', db.settings, async () => {
    await db.settings.put({ key: 'clinicDoctorName', value: info.doctorName })
    await db.settings.put({ key: 'clinicName', value: info.clinicName })
    await db.settings.put({ key: 'clinicAddress', value: info.address })
    await db.settings.put({ key: 'clinicPhone', value: info.phone })
    await db.settings.put({ key: 'clinicFooterText', value: info.footerText })
  })
}
