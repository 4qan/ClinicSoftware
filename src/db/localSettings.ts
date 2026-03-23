/**
 * Machine-specific settings stored in localStorage (not synced via PouchDB).
 * CouchDB URL is machine-specific: doctor uses localhost, nurse uses the doctor's LAN IP.
 */

const COUCH_URL_KEY = 'couchUrl'

export function getCouchUrl(): string | null {
  return localStorage.getItem(COUCH_URL_KEY)
}

export function setCouchUrl(url: string): void {
  localStorage.setItem(COUCH_URL_KEY, url)
}
