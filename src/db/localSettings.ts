/**
 * Machine-specific settings stored in localStorage (not synced via PouchDB).
 * CouchDB URL is machine-specific: doctor uses localhost, nurse uses the doctor's LAN IP.
 */

const COUCH_URL_KEY = 'couchUrl'
const DEPLOYMENT_MODE_KEY = 'deploymentMode'

export type DeploymentMode = 'solo' | 'networked'

export function getCouchUrl(): string | null {
  return localStorage.getItem(COUCH_URL_KEY)
}

export function setCouchUrl(url: string): void {
  localStorage.setItem(COUCH_URL_KEY, url)
}

/**
 * Single source of truth for deployment mode (solo vs networked).
 * - Default: 'solo' (greenfield install, no CouchDB).
 * - Legacy-install safety (D-04 / SPEC constraint): if a couchUrl already exists
 *   and deploymentMode is unset, infer 'networked' AND persist immediately so
 *   subsequent reads (and other modules) see a consistent value.
 * - Whitelist parser (T-22.1-01 mitigation): any stored value other than
 *   'solo' or 'networked' falls back to the safe default 'solo'.
 */
export function getDeploymentMode(): DeploymentMode {
  const raw = localStorage.getItem(DEPLOYMENT_MODE_KEY)
  if (raw === 'solo' || raw === 'networked') return raw
  if (localStorage.getItem(COUCH_URL_KEY)) {
    localStorage.setItem(DEPLOYMENT_MODE_KEY, 'networked')
    return 'networked'
  }
  return 'solo'
}

export function setDeploymentMode(mode: DeploymentMode): void {
  localStorage.setItem(DEPLOYMENT_MODE_KEY, mode)
}
