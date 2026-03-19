export interface Patient {
  id: string
  patientId: string
  firstName: string
  lastName: string
  firstNameLower: string
  lastNameLower: string
  age: number
  gender: 'male' | 'female'
  contact?: string
  cnic?: string
  createdAt: string
  updatedAt: string
}

export interface AppSettings {
  key: string
  value: unknown
}

export interface RecentPatient {
  id: string
  viewedAt: string
}

export interface Drug {
  id: string
  brandName: string
  brandNameLower: string
  saltName: string
  saltNameLower: string
  form: string
  strength: string
  isCustom: boolean
  isActive: boolean
  isOverridden?: boolean
  seedKey?: string
  createdAt: string
  updatedAt: string
}

export interface Visit {
  id: string
  patientId: string
  clinicalNotes: string
  rxNotes: string
  rxNotesLang?: 'en' | 'ur'
  temperature?: number
  systolic?: number
  diastolic?: number
  weight?: number
  spo2?: number
  createdAt: string
  updatedAt: string
}

export interface VisitMedication {
  id: string
  visitId: string
  drugId?: string
  brandName: string
  saltName: string
  form: string
  strength: string
  quantity: string
  frequency: string
  duration: string
  sortOrder: number
  slipType?: 'dispensary' | 'prescription'
}
