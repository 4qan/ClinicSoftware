import { describe, it, expect, beforeEach } from 'vitest'
import {
  getCouchUrl,
  setCouchUrl,
  getDeploymentMode,
  setDeploymentMode,
} from '@/db/localSettings'
import {
  getSoloCredentials,
  setSoloCredentials,
  clearSoloCredentials,
  type SoloCredentialEnvelope,
} from '@/db/soloCredentials'

describe('localSettings - deploymentMode', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns "solo" on a fresh localStorage', () => {
    expect(getDeploymentMode()).toBe('solo')
  })

  it('infers and persists "networked" when only couchUrl is set (legacy install)', () => {
    setCouchUrl('http://192.168.1.100:5984')
    expect(getDeploymentMode()).toBe('networked')
    expect(localStorage.getItem('deploymentMode')).toBe('networked')
  })

  it('returns explicit "solo" even when couchUrl is also set', () => {
    setCouchUrl('http://192.168.1.100:5984')
    setDeploymentMode('solo')
    expect(getDeploymentMode()).toBe('solo')
  })

  it('returns explicit "networked"', () => {
    setDeploymentMode('networked')
    expect(getDeploymentMode()).toBe('networked')
  })

  it('falls back to "solo" when stored value is invalid', () => {
    localStorage.setItem('deploymentMode', 'xyz')
    expect(getDeploymentMode()).toBe('solo')
  })

  it('setDeploymentMode round-trips', () => {
    setDeploymentMode('networked')
    expect(getDeploymentMode()).toBe('networked')
    setDeploymentMode('solo')
    expect(getDeploymentMode()).toBe('solo')
  })

  it('preserves existing getCouchUrl / setCouchUrl behavior', () => {
    expect(getCouchUrl()).toBeNull()
    setCouchUrl('http://example:5984')
    expect(getCouchUrl()).toBe('http://example:5984')
  })
})

describe('soloCredentials envelope', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const sample: SoloCredentialEnvelope = {
    username: 'doctor',
    salt: 'YWJjMTIz',
    hash: 'ZGVmNDU2',
    iterations: 100000,
  }

  it('returns null when nothing stored', () => {
    expect(getSoloCredentials()).toBeNull()
  })

  it('round-trips through JSON', () => {
    setSoloCredentials(sample)
    expect(getSoloCredentials()).toEqual(sample)
  })

  it('returns null on malformed JSON (defensive)', () => {
    localStorage.setItem('soloCredentials', '{not json')
    expect(getSoloCredentials()).toBeNull()
  })

  it('clearSoloCredentials removes the key', () => {
    setSoloCredentials(sample)
    clearSoloCredentials()
    expect(getSoloCredentials()).toBeNull()
  })
})
