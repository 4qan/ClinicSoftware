import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast } from '@/components/ToastProvider'

function TestConsumer() {
  const { showToast } = useToast()
  return (
    <div>
      <button onClick={() => showToast('success', 'Operation succeeded')}>
        Show Success
      </button>
      <button onClick={() => showToast('error', 'Something went wrong')}>
        Show Error
      </button>
      <button onClick={() => showToast('info', 'Just so you know')}>
        Show Info
      </button>
    </div>
  )
}

function renderWithToast() {
  return render(
    <ToastProvider>
      <TestConsumer />
    </ToastProvider>
  )
}

describe('Toast notification system', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders a success toast when showToast is called', async () => {
    renderWithToast()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    await user.click(screen.getByText('Show Success'))

    expect(screen.getByText('Operation succeeded')).toBeInTheDocument()
  })

  it('renders an error toast when showToast is called', async () => {
    renderWithToast()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    await user.click(screen.getByText('Show Error'))

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('success toast auto-dismisses after ~5s', async () => {
    renderWithToast()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    await user.click(screen.getByText('Show Success'))
    expect(screen.getByText('Operation succeeded')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(5500)
    })

    expect(screen.queryByText('Operation succeeded')).not.toBeInTheDocument()
  })

  it('error toast does NOT auto-dismiss', async () => {
    renderWithToast()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    await user.click(screen.getByText('Show Error'))
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(10000)
    })

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('error toast can be dismissed by clicking close button', async () => {
    renderWithToast()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    await user.click(screen.getByText('Show Error'))
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('multiple toasts stack', async () => {
    renderWithToast()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    await user.click(screen.getByText('Show Success'))
    await user.click(screen.getByText('Show Error'))

    expect(screen.getByText('Operation succeeded')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('info toast auto-dismisses after ~5s', async () => {
    renderWithToast()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    await user.click(screen.getByText('Show Info'))
    expect(screen.getByText('Just so you know')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(5500)
    })

    expect(screen.queryByText('Just so you know')).not.toBeInTheDocument()
  })

  it('useToast throws when used outside ToastProvider', () => {
    function Orphan() {
      useToast()
      return null
    }

    // Suppress React error boundary noise
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Orphan />)).toThrow()
    spy.mockRestore()
  })
})
