/**
 * English-to-Urdu translation maps for predefined clinical values.
 * Translations use patient-friendly colloquial Urdu with Western numerals.
 * Consumed by print components via buildUrduInstruction() helper.
 */

import { FORM_TO_CATEGORY } from './clinical'

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
  'As needed': 'ضرورت کے مطابق',
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

/** Urdu units per form [singular, plural] */
const FORM_UNIT_URDU: Record<string, [string, string]> = {
  Tablet: ['گولی', 'گولیاں'],
  Capsule: ['کیپسول', 'کیپسول'],
  Sachet: ['پیکٹ', 'پیکٹ'],
  Powder: ['پاؤڈر', 'پاؤڈر'],
  Drops: ['قطرہ', 'قطرے'],
  Injection: ['ٹیکا', 'ٹیکے'],
  Inhaler: ['سپرے', 'سپرے'],
  Spray: ['سپرے', 'سپرے'],
  Suppository: ['بتی', 'بتیاں'],
}

/** English units per form [singular, plural] */
const FORM_UNIT_EN: Record<string, [string, string]> = {
  Tablet: ['tablet', 'tablets'],
  Capsule: ['capsule', 'capsules'],
  Sachet: ['sachet', 'sachets'],
  Powder: ['dose', 'doses'],
  Drops: ['drop', 'drops'],
  Injection: ['injection', 'injections'],
  Inhaler: ['puff', 'puffs'],
  Spray: ['puff', 'puffs'],
  Suppository: ['suppository', 'suppositories'],
}

/** Topical dosage translations (no unit, just description) */
const TOPICAL_DOSAGE: Record<string, { urdu: string; english: string }> = {
  'Thin layer': { urdu: 'پتلی تہہ', english: 'thin layer' },
  'As directed': { urdu: 'ہدایت کے مطابق', english: 'as directed' },
}

/** Parse quantity, handling ½ fraction */
function parseQty(q: string): number {
  if (q === '½') return 0.5
  return parseFloat(q)
}

/** Build Urdu dosage string from form + quantity */
export function buildDosageUrdu(form: string, quantity: string): string {
  const category = FORM_TO_CATEGORY[form] ?? 'oral'

  if (category === 'topical') {
    return TOPICAL_DOSAGE[quantity]?.urdu ?? quantity
  }

  if (category === 'liquid') {
    const match = quantity.match(/^([\d.]+)\s*ml$/i)
    if (match) return `${match[1]} ملی لیٹر`
    return quantity
  }

  // Count-based forms: quantity + Urdu unit
  const units = FORM_UNIT_URDU[form]
  if (units) {
    const num = parseQty(quantity)
    if (!isNaN(num)) {
      // Special case: ½ tablet = آدھی گولی
      if (quantity === '½' && form === 'Tablet') return 'آدھی گولی'
      return `${quantity} ${num <= 1 ? units[0] : units[1]}`
    }
  }

  return quantity
}

/** Build English dosage string from form + quantity */
export function buildDosageEnglish(form: string, quantity: string): string {
  const category = FORM_TO_CATEGORY[form] ?? 'oral'

  if (category === 'topical') {
    return TOPICAL_DOSAGE[quantity]?.english ?? quantity
  }

  if (category === 'liquid') return quantity

  const units = FORM_UNIT_EN[form]
  if (units) {
    const num = parseQty(quantity)
    if (!isNaN(num)) {
      return `${quantity} ${num <= 1 ? units[0] : units[1]}`
    }
  }

  return quantity
}

/**
 * Format dosage for display in UI lists (e.g., "1 tablet", "5 ml", "Thin layer").
 * Combines form + raw quantity into a human-readable label.
 */
export function formatDosageDisplay(form: string, quantity: string): string {
  return buildDosageEnglish(form, quantity)
}

/** English verb prefix per form category */
const ENGLISH_VERB_PREFIX: Record<string, string> = {
  oral: 'Take', liquid: 'Take', topical: 'Apply', drops: 'Instill',
  injection: 'Administer', inhaler: 'Inhale', suppository: 'Insert',
}

/** Urdu imperative verbs per form category (standard) */
const URDU_VERB: Record<string, string> = {
  oral: 'لیں', liquid: 'لیں', topical: 'لگائیں', drops: 'ڈالیں',
  injection: 'لگوائیں', inhaler: 'لیں', suppository: 'استعمال کریں',
}

/** Urdu continuous/ongoing verb forms per category */
const URDU_VERB_ONGOING: Record<string, string> = {
  oral: 'لیتے رہیں', liquid: 'لیتے رہیں', topical: 'لگاتے رہیں',
  drops: 'ڈالتے رہیں', injection: 'لگواتے رہیں', inhaler: 'لیتے رہیں',
  suppository: 'استعمال کرتے رہیں',
}

/** Lowercase the first character (for mid-sentence English values) */
function lcFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1)
}

/**
 * Build a natural Urdu instruction sentence from medication fields.
 * Builds a natural Urdu + English instruction sentence.
 * Uses translated values where available, keeps original for unknown values
 * (numbers like "12" read the same in both scripts).
 *
 * Patterns (based on Pakistani medical instruction conventions):
 *   Standard:  "{dosage} {freq} {verb}، {duration} تک"
 *   Ongoing:   "{dosage} {freq} {ongoingVerb}"
 *   As needed: "{dosage} {freq} {verb}، ضرورت کے مطابق"
 */
export function buildUrduInstruction(med: MedicationForInstruction): { urdu: string; english: string } {
  const dosageU = buildDosageUrdu(med.form, med.dosage)
  const dosageEn = buildDosageEnglish(med.form, med.dosage)
  const frequencyU = toUrdu(med.frequency)
  const durationU = toUrdu(med.duration)

  const category = FORM_TO_CATEGORY[med.form] ?? 'oral'
  const verbEn = ENGLISH_VERB_PREFIX[category] ?? 'Take'

  let urdu: string
  let english: string

  if (med.duration === 'Ongoing') {
    const ongoingVerb = URDU_VERB_ONGOING[category] ?? 'لیتے رہیں'
    urdu = `${dosageU} ${frequencyU} ${ongoingVerb}`
    english = `${verbEn} ${dosageEn}, ${lcFirst(med.frequency)}, ongoing`
  } else if (med.duration === 'As needed') {
    const verb = URDU_VERB[category] ?? 'لیں'
    urdu = `${dosageU} ${frequencyU} ${verb}، ضرورت کے مطابق`
    english = `${verbEn} ${dosageEn}, ${lcFirst(med.frequency)}, as needed`
  } else {
    const verb = URDU_VERB[category] ?? 'لیں'
    urdu = `${dosageU} ${frequencyU} ${verb}، ${durationU} تک`
    english = `${verbEn} ${dosageEn}, ${lcFirst(med.frequency)}, for ${lcFirst(med.duration)}`
  }

  return { urdu, english }
}

/** Section header Urdu labels for prescription slip */
export const sectionHeadersUrdu: Record<string, string> = {
  'Clinical Notes': 'طبی تفصیلات',
  'Instructions': 'ہدایات',
}

/** Unified lookup for frequency, duration, and forms */
const allTranslations: Record<string, string> = {
  ...frequencyUrdu,
  ...durationUrdu,
  ...formsUrdu,
}

/**
 * Translate a clinical value from English to Urdu.
 * Used for frequency, duration, and form lookups.
 * Dosage translation uses buildDosageUrdu(form, quantity) instead.
 * Returns the original string if no translation exists (silent fallback).
 */
export function toUrdu(value: string): string {
  return allTranslations[value] ?? value
}
