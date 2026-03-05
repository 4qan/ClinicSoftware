import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '@/App'
import { resetDatabase } from '@/db/index'

describe('Login Flow', () => {
  beforeEach(async () => {
    localStorage.clear()
    await resetDatabase()
  })

  it('renders login form with password input and submit button', () => {
    render(<App />)
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })

  it('shows error message on wrong password', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Incorrect password. Please try again.',
      )
    })
  })

  it('logs in with default password on first run', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText(/password/i), 'clinic123')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(screen.getByText('Recent Patients')).toBeInTheDocument()
    })
  })

  it('logout returns to login screen', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Log in first
    await user.type(screen.getByLabelText(/password/i), 'clinic123')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(screen.getByText('Recent Patients')).toBeInTheDocument()
    })

    // Log out
    await user.click(screen.getByRole('button', { name: /log out/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    })
  })
})
