import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComboBox } from '@/components/ComboBox'

const OPTIONS = ['1', '2', '5', '10']

describe('ComboBox showCustomIndicator', () => {
  it('shows amber border when showCustomIndicator is true and value does not match any option', () => {
    render(
      <ComboBox
        options={OPTIONS}
        value="banana"
        onChange={() => {}}
        showCustomIndicator
      />
    )
    const input = screen.getByRole('textbox')
    expect(input.className).toContain('border-amber-400')
  })

  it('does not show amber border when value matches an option (case-insensitive)', () => {
    render(
      <ComboBox
        options={['Once daily', 'Twice daily']}
        value="once daily"
        onChange={() => {}}
        showCustomIndicator
      />
    )
    const input = screen.getByRole('textbox')
    expect(input.className).not.toContain('border-amber-400')
  })

  it('does not show amber border when value is empty', () => {
    render(
      <ComboBox
        options={OPTIONS}
        value=""
        onChange={() => {}}
        showCustomIndicator
      />
    )
    const input = screen.getByRole('textbox')
    expect(input.className).not.toContain('border-amber-400')
  })

  it('does not show amber border when showCustomIndicator is false (default)', () => {
    render(
      <ComboBox
        options={OPTIONS}
        value="banana"
        onChange={() => {}}
      />
    )
    const input = screen.getByRole('textbox')
    expect(input.className).not.toContain('border-amber-400')
  })

  it('input is never disabled regardless of showCustomIndicator state', () => {
    render(
      <ComboBox
        options={OPTIONS}
        value="banana"
        onChange={() => {}}
        showCustomIndicator
      />
    )
    const input = screen.getByRole('textbox')
    expect(input).not.toBeDisabled()
  })

  it('shows "Custom value" hint when value is custom and showCustomIndicator is true', () => {
    render(
      <ComboBox
        options={OPTIONS}
        value="banana"
        onChange={() => {}}
        showCustomIndicator
      />
    )
    expect(screen.getByText('Custom value')).toBeInTheDocument()
  })

  it('does not show "Custom value" hint when value matches an option', () => {
    render(
      <ComboBox
        options={OPTIONS}
        value="1"
        onChange={() => {}}
        showCustomIndicator
      />
    )
    expect(screen.queryByText('Custom value')).not.toBeInTheDocument()
  })
})
