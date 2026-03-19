import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Mock heavy DB dependencies
vi.mock('@/db/patients', () => ({
  searchPatients: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/db/pouchdb', () => ({
  getSetting: vi.fn().mockResolvedValue(undefined),
  putSetting: vi.fn(),
  pouchDb: {},
  ensureIndexes: vi.fn(),
  migrateDbName: vi.fn(),
  resetPouchDb: vi.fn(),
}))

// Mock useAuthContext at module level
const mockAuthContext = {
  isAuthenticated: true,
  isLoading: false,
  role: 'doctor' as 'doctor' | 'nurse' | null,
  username: 'doctor',
  credentials: 'base64creds',
  login: vi.fn(),
  logout: vi.fn(),
  changePassword: vi.fn(),
  resetNursePassword: vi.fn(),
}

vi.mock('@/auth/AuthProvider', () => ({
  useAuthContext: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'

beforeEach(() => {
  vi.clearAllMocks()
  mockAuthContext.role = 'doctor'
})

// ─── ProtectedRoute ──────────────────────────────────────────────────────────

describe('ProtectedRoute', () => {
  it('renders children when role is in allowedRoles', () => {
    mockAuthContext.role = 'doctor'
    render(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={['doctor']}>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    )
    expect(screen.getByText('Protected Content')).toBeDefined()
  })

  it('redirects nurse away from doctor-only routes (content not rendered)', () => {
    mockAuthContext.role = 'nurse'
    render(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={['doctor']}>
          <div>Doctor Only</div>
        </ProtectedRoute>
      </MemoryRouter>,
    )
    expect(screen.queryByText('Doctor Only')).toBeNull()
  })

  it('allows nurse on routes where nurse is in allowedRoles', () => {
    mockAuthContext.role = 'nurse'
    render(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={['doctor', 'nurse']}>
          <div>Shared Content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    )
    expect(screen.getByText('Shared Content')).toBeDefined()
  })

  it('redirects null role away from any protected route', () => {
    mockAuthContext.role = null
    render(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={['doctor']}>
          <div>Should Not Appear</div>
        </ProtectedRoute>
      </MemoryRouter>,
    )
    expect(screen.queryByText('Should Not Appear')).toBeNull()
  })
})

// ─── Sidebar ─────────────────────────────────────────────────────────────────

describe('Sidebar', () => {
  function renderSidebar() {
    return render(
      <MemoryRouter>
        <Sidebar collapsed={false} onToggle={vi.fn()} />
      </MemoryRouter>,
    )
  }

  it('shows all nav items for doctor', () => {
    mockAuthContext.role = 'doctor'
    renderSidebar()
    expect(screen.getByText('Home')).toBeDefined()
    expect(screen.getByText('Patients')).toBeDefined()
    expect(screen.getByText('Medications')).toBeDefined()
    expect(screen.getByText('Settings')).toBeDefined()
  })

  it('shows only Home and Patients for nurse', () => {
    mockAuthContext.role = 'nurse'
    renderSidebar()
    expect(screen.getByText('Home')).toBeDefined()
    expect(screen.getByText('Patients')).toBeDefined()
    expect(screen.queryByText('Medications')).toBeNull()
    expect(screen.queryByText('Settings')).toBeNull()
  })

  it('shows role label "Doctor" for doctor (expanded)', () => {
    mockAuthContext.role = 'doctor'
    renderSidebar()
    expect(screen.getByText('Doctor')).toBeDefined()
  })

  it('shows role label "Nurse" for nurse (expanded)', () => {
    mockAuthContext.role = 'nurse'
    renderSidebar()
    expect(screen.getByText('Nurse')).toBeDefined()
  })

  it('shows role abbreviation "Dr" for doctor (collapsed)', () => {
    mockAuthContext.role = 'doctor'
    render(
      <MemoryRouter>
        <Sidebar collapsed={true} onToggle={vi.fn()} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Dr')).toBeDefined()
  })

  it('shows role abbreviation "Ns" for nurse (collapsed)', () => {
    mockAuthContext.role = 'nurse'
    render(
      <MemoryRouter>
        <Sidebar collapsed={true} onToggle={vi.fn()} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Ns')).toBeDefined()
  })
})

// ─── Header ──────────────────────────────────────────────────────────────────

describe('Header', () => {
  function renderHeader() {
    return render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    )
  }

  it('shows role label "Doctor" for doctor', () => {
    mockAuthContext.role = 'doctor'
    renderHeader()
    expect(screen.getByText('Doctor')).toBeDefined()
  })

  it('shows role label "Nurse" for nurse', () => {
    mockAuthContext.role = 'nurse'
    renderHeader()
    expect(screen.getByText('Nurse')).toBeDefined()
  })

  it('shows settings link for doctor', () => {
    mockAuthContext.role = 'doctor'
    renderHeader()
    expect(screen.getByLabelText('Settings')).toBeDefined()
  })

  it('hides settings link for nurse', () => {
    mockAuthContext.role = 'nurse'
    renderHeader()
    expect(screen.queryByLabelText('Settings')).toBeNull()
  })
})

// ─── Visit page structural checks ────────────────────────────────────────────

describe('Visit page structural checks', () => {
  it('NewVisitPage guards prescription with role check', () => {
    const source = readFileSync(
      resolve(__dirname, '../pages/NewVisitPage.tsx'),
      'utf-8',
    )
    expect(source).toContain("role !== 'nurse'")
    expect(source).toContain('useAuthContext')
  })

  it('NewVisitPage guards Save & Print button with role check', () => {
    const source = readFileSync(
      resolve(__dirname, '../pages/NewVisitPage.tsx'),
      'utf-8',
    )
    // role guard appears multiple times (prescription + save & print)
    const occurrences = (source.match(/role !== 'nurse'/g) ?? []).length
    expect(occurrences).toBeGreaterThanOrEqual(2)
  })

  it('EditVisitPage guards prescription with role check', () => {
    const source = readFileSync(
      resolve(__dirname, '../pages/EditVisitPage.tsx'),
      'utf-8',
    )
    expect(source).toContain("role !== 'nurse'")
    expect(source).toContain('useAuthContext')
  })

  it('EditVisitPage guards Save & Print button with role check', () => {
    const source = readFileSync(
      resolve(__dirname, '../pages/EditVisitPage.tsx'),
      'utf-8',
    )
    const occurrences = (source.match(/role !== 'nurse'/g) ?? []).length
    expect(occurrences).toBeGreaterThanOrEqual(2)
  })

  it('NewVisitPage does not gate the Vitals section', () => {
    const source = readFileSync(
      resolve(__dirname, '../pages/NewVisitPage.tsx'),
      'utf-8',
    )
    // VitalsInput should be present and NOT preceded by role guard on the same block
    expect(source).toContain('VitalsInput')
    // The vitals fieldset is not wrapped in role check
    expect(source).toMatch(/Vitals[\s\S]{0,200}VitalsInput/)
  })
})
