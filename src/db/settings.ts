import { getSetting, putSetting } from './pouchdb'

export interface ClinicInfo {
  doctorName: string
  clinicName: string
  address: string
  phone: string
  footerText: string
}

const DEFAULT_FOOTER = 'This is a computer-generated prescription and does not require a signature'

export async function getClinicInfo(): Promise<ClinicInfo> {
  const [doctorName, clinicName, address, phone, footerText] = await Promise.all([
    getSetting('clinicDoctorName'),
    getSetting('clinicName'),
    getSetting('clinicAddress'),
    getSetting('clinicPhone'),
    getSetting('clinicFooterText'),
  ])
  return {
    doctorName: (doctorName as string) || '',
    clinicName: (clinicName as string) || '',
    address: (address as string) || '',
    phone: (phone as string) || '',
    footerText: (footerText as string) ?? DEFAULT_FOOTER,
  }
}

export async function saveClinicInfo(info: ClinicInfo): Promise<void> {
  await Promise.all([
    putSetting('clinicDoctorName', info.doctorName),
    putSetting('clinicName', info.clinicName),
    putSetting('clinicAddress', info.address),
    putSetting('clinicPhone', info.phone),
    putSetting('clinicFooterText', info.footerText),
  ])
}
