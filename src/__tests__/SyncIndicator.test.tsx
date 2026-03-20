import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SyncIndicator } from '@/components/SyncIndicator'

vi.mock('@/sync/SyncContext', () => ({
  useSyncContext: vi.fn(),
}))

import { useSyncContext } from '@/sync/SyncContext'

const mockUseSyncContext = vi.mocked(useSyncContext)

describe('SyncIndicator', () => {
  it('Test 1: Renders green dot and "Synced" label when status is synced and expanded', () => {
    mockUseSyncContext.mockReturnValue({
      status: 'synced',
      lastSynced: null,
      errorMessage: null,
      retry: vi.fn(),
      startSync: vi.fn(),
    })

    render(<SyncIndicator collapsed={false} />)

    const wrapper = screen.getByLabelText('Sync status: Synced')
    expect(wrapper).toBeInTheDocument()

    const dot = wrapper.querySelector('span.rounded-full')
    expect(dot?.className).toContain('bg-green-500')

    expect(screen.getByText('Synced')).toBeInTheDocument()
  })

  it('Test 2: Renders blue pulsing dot and "Syncing" label when status is syncing and expanded', () => {
    mockUseSyncContext.mockReturnValue({
      status: 'syncing',
      lastSynced: null,
      errorMessage: null,
      retry: vi.fn(),
      startSync: vi.fn(),
    })

    render(<SyncIndicator collapsed={false} />)

    const wrapper = screen.getByLabelText('Sync status: Syncing')
    expect(wrapper).toBeInTheDocument()

    const dot = wrapper.querySelector('span.rounded-full')
    expect(dot?.className).toContain('bg-blue-500')
    expect(dot?.className).toContain('animate-pulse')

    expect(screen.getByText('Syncing')).toBeInTheDocument()
  })

  it('Test 3: Renders gray dot and "Offline" label when status is disconnected and expanded', () => {
    mockUseSyncContext.mockReturnValue({
      status: 'disconnected',
      lastSynced: null,
      errorMessage: null,
      retry: vi.fn(),
      startSync: vi.fn(),
    })

    render(<SyncIndicator collapsed={false} />)

    const wrapper = screen.getByLabelText('Sync status: Offline')
    expect(wrapper).toBeInTheDocument()

    const dot = wrapper.querySelector('span.rounded-full')
    expect(dot?.className).toContain('bg-gray-400')

    expect(screen.getByText('Offline')).toBeInTheDocument()
  })

  it('Test 4: When collapsed=true, no label text is rendered (only dot)', () => {
    mockUseSyncContext.mockReturnValue({
      status: 'synced',
      lastSynced: null,
      errorMessage: null,
      retry: vi.fn(),
      startSync: vi.fn(),
    })

    render(<SyncIndicator collapsed={true} />)

    expect(screen.queryByText('Synced')).not.toBeInTheDocument()
    expect(screen.queryByText('Syncing')).not.toBeInTheDocument()
    expect(screen.queryByText('Offline')).not.toBeInTheDocument()

    // Dot should still be present
    const wrapper = screen.getByLabelText('Sync status: Synced')
    const dot = wrapper.querySelector('span.rounded-full')
    expect(dot).toBeInTheDocument()
  })

  it('Test 5: aria-label contains current status text', () => {
    mockUseSyncContext.mockReturnValue({
      status: 'disconnected',
      lastSynced: null,
      errorMessage: null,
      retry: vi.fn(),
      startSync: vi.fn(),
    })

    render(<SyncIndicator collapsed={false} />)

    expect(screen.getByLabelText('Sync status: Offline')).toBeInTheDocument()
  })
})
