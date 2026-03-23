import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { type ReactNode } from 'react'

// vi.mock calls are hoisted to top by Vitest, so factories cannot reference
// variables defined outside them. We use module-level state via a shared object.

const syncState = {
  handle: null as ReturnType<typeof createFakeSyncHandle> | null,
}

function createFakeSyncHandle() {
  const listeners: Record<string, Array<(arg?: unknown) => void>> = {}
  const handle = {
    on(event: string, cb: (arg?: unknown) => void) {
      if (!listeners[event]) listeners[event] = []
      listeners[event].push(cb)
      return handle
    },
    cancel: vi.fn(),
    emit(event: string, arg?: unknown) {
      ;(listeners[event] ?? []).forEach((cb) => cb(arg))
    },
  }
  return handle
}

// Mock pouchdb module. mockPouchDbSync is defined inside factory to avoid hoisting issue.
vi.mock('@/db/pouchdb', () => {
  return {
    pouchDb: {
      sync: vi.fn((..._args: unknown[]) => {
        const h = createFakeSyncHandle()
        syncState.handle = h
        return h
      }),
    },
    getSetting: vi.fn(),
    putSetting: vi.fn(),
    ensureIndexes: vi.fn(),
    migrateDbName: vi.fn(),
    resetPouchDb: vi.fn(),
  }
})

vi.mock('pouchdb', () => {
  const MockPouchDB = vi.fn(function (this: unknown, _name: string, _opts?: unknown) {
    return {}
  }) as unknown as { new (...args: unknown[]): object; fetch: ReturnType<typeof vi.fn> }
  MockPouchDB.fetch = vi.fn()
  return { default: MockPouchDB }
})

vi.mock('@/auth/AuthProvider', () => ({
  useAuthContext: vi.fn(),
}))

vi.mock('@/db/localSettings', () => ({
  getCouchUrl: vi.fn(),
  setCouchUrl: vi.fn(),
}))

import { pouchDb } from '@/db/pouchdb'
import { useAuthContext } from '@/auth/AuthProvider'
import { getCouchUrl } from '@/db/localSettings'
import { useSyncManager } from '@/sync/useSyncManager'
import { SyncProvider, useSyncContext } from '@/sync/SyncContext'

const mockPouchDbSync = vi.mocked(pouchDb.sync)
const mockGetCouchUrl = vi.mocked(getCouchUrl)
const mockUseAuthContext = vi.mocked(useAuthContext)

function makeSyncProviderWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <SyncProvider>{children}</SyncProvider>
  }
}

describe('useSyncManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    syncState.handle = null
    // Re-wire sync mock after clearAllMocks
    mockPouchDbSync.mockImplementation((..._args: unknown[]) => {
      const h = createFakeSyncHandle()
      syncState.handle = h
      return h as unknown as ReturnType<typeof pouchDb.sync>
    })
  })

  it('Test 1: start() creates sync handle and sets status to syncing', () => {
    const { result } = renderHook(() => useSyncManager())

    expect(result.current.status).toBe('disconnected')

    act(() => {
      result.current.start('http://localhost:5984', 'dXNlcjpwYXNz')
    })

    expect(mockPouchDbSync).toHaveBeenCalledTimes(1)
    expect(result.current.status).toBe('syncing')
  })

  it('Test 2: paused event sets status to synced and updates lastSynced', () => {
    const { result } = renderHook(() => useSyncManager())

    act(() => {
      result.current.start('http://localhost:5984', 'dXNlcjpwYXNz')
    })

    act(() => {
      syncState.handle!.emit('paused')
    })

    expect(result.current.status).toBe('synced')
    expect(result.current.lastSynced).toBeInstanceOf(Date)
  })

  it('Test 3: error event sets status to disconnected and stores error message', () => {
    const { result } = renderHook(() => useSyncManager())

    act(() => {
      result.current.start('http://localhost:5984', 'dXNlcjpwYXNz')
    })

    act(() => {
      syncState.handle!.emit('error', new Error('Connection refused'))
    })

    expect(result.current.status).toBe('disconnected')
    expect(result.current.errorMessage).toBeTruthy()
  })

  it('Test 4: active event after paused sets status back to syncing', () => {
    const { result } = renderHook(() => useSyncManager())

    act(() => {
      result.current.start('http://localhost:5984', 'dXNlcjpwYXNz')
    })

    act(() => {
      syncState.handle!.emit('paused')
    })
    expect(result.current.status).toBe('synced')

    act(() => {
      syncState.handle!.emit('active')
    })
    expect(result.current.status).toBe('syncing')
  })

  it('Test 5: stop() calls handle.cancel() and sets status to disconnected', () => {
    const { result } = renderHook(() => useSyncManager())

    act(() => {
      result.current.start('http://localhost:5984', 'dXNlcjpwYXNz')
    })

    act(() => {
      syncState.handle!.emit('paused')
    })
    expect(result.current.status).toBe('synced')

    const capturedHandle = syncState.handle!

    act(() => {
      result.current.stop()
    })

    expect(capturedHandle.cancel).toHaveBeenCalledTimes(1)
    expect(result.current.status).toBe('disconnected')
  })

  it('Test 6: calling start() when already running is a no-op (no double sync)', () => {
    const { result } = renderHook(() => useSyncManager())

    act(() => {
      result.current.start('http://localhost:5984', 'dXNlcjpwYXNz')
    })
    act(() => {
      result.current.start('http://localhost:5984', 'dXNlcjpwYXNz')
    })

    expect(mockPouchDbSync).toHaveBeenCalledTimes(1)
  })

  it('Test 7: 401 error stops sync and sets errorMessage to auth failure message', () => {
    const { result } = renderHook(() => useSyncManager())

    act(() => {
      result.current.start('http://localhost:5984', 'dXNlcjpwYXNz')
    })

    const capturedHandle = syncState.handle!
    const authError = Object.assign(new Error('Unauthorized'), { status: 401 })

    act(() => {
      syncState.handle!.emit('error', authError)
    })

    expect(capturedHandle.cancel).toHaveBeenCalledTimes(1)
    expect(result.current.status).toBe('disconnected')
    expect(result.current.errorMessage).toContain('Authentication failed')
    expect(result.current.errorMessage).toContain('Log out and log in again')
  })
})

describe('SyncProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    syncState.handle = null
    mockPouchDbSync.mockImplementation((..._args: unknown[]) => {
      const h = createFakeSyncHandle()
      syncState.handle = h
      return h as unknown as ReturnType<typeof pouchDb.sync>
    })
  })

  it('Test 8: SyncProvider calls start() when isAuthenticated is true with credentials', async () => {
    mockUseAuthContext.mockReturnValue({
      isAuthenticated: true,
      credentials: 'dXNlcjpwYXNz',
      isLoading: false,
      role: 'doctor',
      username: 'doctor',
      login: vi.fn(),
      logout: vi.fn(),
      changePassword: vi.fn(),
      resetNursePassword: vi.fn(),
    })
    mockGetCouchUrl.mockReturnValue('http://localhost:5984')

    const { result } = renderHook(() => useSyncContext(), {
      wrapper: makeSyncProviderWrapper(),
    })

    await waitFor(() => {
      expect(result.current.status).toBe('syncing')
    })

    expect(mockGetCouchUrl).toHaveBeenCalled()
    expect(mockPouchDbSync).toHaveBeenCalledTimes(1)
  })

  it('Test 9: SyncProvider calls stop() when isAuthenticated becomes false', async () => {
    mockUseAuthContext.mockReturnValue({
      isAuthenticated: true,
      credentials: 'dXNlcjpwYXNz',
      isLoading: false,
      role: 'doctor',
      username: 'doctor',
      login: vi.fn(),
      logout: vi.fn(),
      changePassword: vi.fn(),
      resetNursePassword: vi.fn(),
    })
    mockGetCouchUrl.mockReturnValue('http://localhost:5984')

    const { result, rerender } = renderHook(() => useSyncContext(), {
      wrapper: makeSyncProviderWrapper(),
    })

    await waitFor(() => {
      expect(result.current.status).toBe('syncing')
    })

    const capturedHandle = syncState.handle!

    // Simulate logout
    mockUseAuthContext.mockReturnValue({
      isAuthenticated: false,
      credentials: null,
      isLoading: false,
      role: null,
      username: null,
      login: vi.fn(),
      logout: vi.fn(),
      changePassword: vi.fn(),
      resetNursePassword: vi.fn(),
    })

    rerender()

    await waitFor(() => {
      expect(result.current.status).toBe('disconnected')
    })

    expect(capturedHandle.cancel).toHaveBeenCalled()
  })
})
