/**
 * English-to-Urdu translation maps for predefined clinical values.
 * Translations use patient-friendly colloquial Urdu with Western numerals.
 * Consumed by print components via toUrdu() helper.
 */

/** Dosage translations (18 entries) */
export const dosageUrdu: Record<string, string> = {
  '1/2 tablet': 'آدھی گولی',
  '1 tablet': '1 گولی',
  '2 tablets': '2 گولیاں',
  '3 tablets': '3 گولیاں',
  '2.5 ml': '2.5 ملی لیٹر',
  '5 ml': '5 ملی لیٹر',
  '10 ml': '10 ملی لیٹر',
  '15 ml': '15 ملی لیٹر',
  '1 drop': '1 قطرہ',
  '2 drops': '2 قطرے',
  '3 drops': '3 قطرے',
  '5 drops': '5 قطرے',
  '1 injection': '1 ٹیکا',
  '1 sachet': '1 پیکٹ',
  'Apply thin layer': 'پتلی تہہ لگائیں',
  'Apply as directed': 'ہدایت کے مطابق لگائیں',
  '1 puff': '1 سپرے',
  '2 puffs': '2 سپرے',
}

/** Frequency translations (17 entries) */
export const frequencyUrdu: Record<string, string> = {
  'Once daily': 'دن میں ایک بار',
  'Twice daily': 'دن میں دو بار',
  'Three times daily': 'دن میں تین بار',
  'Four times daily': 'دن میں چار بار',
  'Every 4 hours': 'ہر 4 گھنٹے بعد',
  'Every 6 hours': 'ہر 6 گھنٹے بعد',
  'Every 8 hours': 'ہر 8 گھنٹے بعد',
  'Every 12 hours': 'ہر 12 گھنٹے بعد',
  'Once weekly': 'ہفتے میں ایک بار',
  'As needed': 'ضرورت کے مطابق',
  'Before meals': 'کھانے سے پہلے',
  'After meals': 'کھانے کے بعد',
  'At bedtime': 'سونے سے پہلے',
  'Once daily before breakfast': 'روزانہ ناشتے سے پہلے',
  'Once daily at night': 'روزانہ رات کو',
  'Twice daily (morning and night)': 'صبح اور رات',
  'Stat (single dose)': 'فوری ایک خوراک',
}

/** Duration translations (13 entries) */
export const durationUrdu: Record<string, string> = {
  '1 day': '1 دن',
  '3 days': '3 دن',
  '5 days': '5 دن',
  '7 days': '7 دن',
  '10 days': '10 دن',
  '14 days': '14 دن',
  '3 weeks': '3 ہفتے',
  '1 month': '1 مہینہ',
  '2 months': '2 مہینے',
  '3 months': '3 مہینے',
  '6 months': '6 مہینے',
  'Ongoing': 'جاری رکھیں',
  // 'As needed' is already in frequencyUrdu, same translation applies
}

/** Medication form translations (16 entries) */
export const formsUrdu: Record<string, string> = {
  'Tablet': 'گولی',
  'Capsule': 'کیپسول',
  'Syrup': 'شربت',
  'Suspension': 'معلق دوائی',
  'Drops': 'قطرے',
  'Injection': 'ٹیکا',
  'Cream': 'کریم',
  'Ointment': 'مرہم',
  'Gel': 'جیل',
  'Inhaler': 'سانس کا آلہ',
  'Suppository': 'بتی',
  'Sachet': 'پیکٹ',
  'Powder': 'پاؤڈر',
  'Patch': 'پٹی',
  'Spray': 'سپرے',
  'Solution': 'محلول',
}

/** Column header Urdu labels for medication table */
export const columnHeadersUrdu: Record<string, string> = {
  'Brand Name': 'دوا',
  'Salt': 'نمک',
  'Strength': 'طاقت',
  'Instructions': 'ہدایات',
}

/** Input shape for buildUrduInstruction */
export interface MedicationForInstruction {
  form: string
  dosage: string
  frequency: string
  duration: string
}

/** Form-to-category classification */
const FORM_CATEGORY: Record<string, string> = {
  Tablet: 'oral', Capsule: 'oral', Sachet: 'oral', Powder: 'oral',
  Syrup: 'liquid', Suspension: 'liquid', Solution: 'liquid',
  Cream: 'topical', Ointment: 'topical', Gel: 'topical', Patch: 'topical',
  Drops: 'drops',
  Injection: 'injection',
  Inhaler: 'inhaler', Spray: 'inhaler',
  Suppository: 'suppository',
}

/** English verb prefix per form category */
const ENGLISH_VERB_PREFIX: Record<string, string> = {
  oral: 'Take', liquid: 'Take', topical: 'Apply', drops: 'Instill',
  injection: 'Administer', inhaler: 'Inhale', suppository: 'Insert',
}

/** Durations that are self-contained phrases (no "کے لیے" suffix) */
const SELF_CONTAINED_DURATIONS = new Set(['Ongoing', 'As needed'])

/**
 * Build a natural Urdu instruction sentence from medication fields.
 * Returns null if any component lacks an Urdu translation (fallback signal).
 */
export function buildUrduInstruction(med: MedicationForInstruction): { urdu: string; english: string } | null {
  const dosageU = toUrdu(med.dosage)
  const frequencyU = toUrdu(med.frequency)
  const durationU = toUrdu(med.duration)

  // Passthrough detection: if any translation equals its English input, bail out
  if (dosageU === med.dosage || frequencyU === med.frequency || durationU === med.duration) {
    return null
  }

  const suffix = SELF_CONTAINED_DURATIONS.has(med.duration) ? '' : ' کے لیے'
  const urdu = `${dosageU} ${frequencyU} ${durationU}${suffix}`

  const category = FORM_CATEGORY[med.form] ?? 'oral'
  const verb = ENGLISH_VERB_PREFIX[category] ?? 'Take'
  const english = `${verb} ${med.dosage}, ${med.frequency}, ${med.duration}`

  return { urdu, english }
}

/** Section header Urdu labels for prescription slip */
export const sectionHeadersUrdu: Record<string, string> = {
  'Clinical Notes': 'طبی تفصیلات',
  'Instructions': 'ہدایات',
}

/** Unified lookup combining all categories */
const allTranslations: Record<string, string> = {
  ...dosageUrdu,
  ...frequencyUrdu,
  ...durationUrdu,
  ...formsUrdu,
}

/**
 * Translate a clinical value from English to Urdu.
 * Returns the original string if no translation exists (silent fallback).
 */
export function toUrdu(value: string): string {
  return allTranslations[value] ?? value
}
