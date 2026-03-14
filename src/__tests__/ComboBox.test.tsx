import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('does not show hint text below input (border-only indicator)', () => {
    render(
      <ComboBox
        options={OPTIONS}
        value="banana"
        onChange={() => {}}
        showCustomIndicator
      />
    )
    expect(screen.queryByText('Custom value')).not.toBeInTheDocument()
  })
})

describe('ComboBox keyboard navigation', () => {
  const DRUGS = ['Amoxicillin', 'Ibuprofen', 'Paracetamol']

  function getDropdownItems() {
    const list = document.querySelector('ul')
    return list ? Array.from(list.querySelectorAll('li')) : []
  }

  it('ArrowDown opens dropdown and sets highlight to first item', async () => {
    const user = userEvent.setup()
    render(<ComboBox options={DRUGS} value="" onChange={() => {}} />)

    const input = screen.getByRole('textbox')
    await user.click(input) // triggers onFocus -> opens dropdown
    // Close the dropdown first
    await user.keyboard('{Escape}')
    expect(document.querySelector('ul')).not.toBeInTheDocument()

    await user.keyboard('{ArrowDown}')

    expect(document.querySelector('ul')).toBeInTheDocument()
    const items = getDropdownItems()
    expect(items[0].className).toContain('bg-blue-50')
    expect(items[1].className).not.toContain('bg-blue-50')
  })

  it('ArrowDown wraps to first item when at end of list', async () => {
    const user = userEvent.setup()
    render(<ComboBox options={DRUGS} value="" onChange={() => {}} />)

    const input = screen.getByRole('textbox')
    await user.click(input)
    await user.keyboard('{Escape}')
    // Navigate to last: 3 presses move highlight 0, 1, 2
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')
    // One more -- should wrap to first
    await user.keyboard('{ArrowDown}')

    const items = getDropdownItems()
    expect(items[0].className).toContain('bg-blue-50')
    expect(items[1].className).not.toContain('bg-blue-50')
  })

  it('ArrowUp wraps to last item when at start', async () => {
    const user = userEvent.setup()
    render(<ComboBox options={DRUGS} value="" onChange={() => {}} />)

    const input = screen.getByRole('textbox')
    await user.click(input)
    await user.keyboard('{Escape}')
    await user.keyboard('{ArrowDown}') // highlight index 0
    await user.keyboard('{ArrowUp}') // should wrap to last

    const items = getDropdownItems()
    expect(items[2].className).toContain('bg-blue-50')
    expect(items[0].className).not.toContain('bg-blue-50')
  })

  it('Enter with highlighted item selects it and closes dropdown', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ComboBox options={DRUGS} value="" onChange={onChange} />)

    const input = screen.getByRole('textbox')
    await user.click(input)
    await user.keyboard('{Escape}')
    await user.keyboard('{ArrowDown}{ArrowDown}') // highlight index 1 = 'Ibuprofen'
    await user.keyboard('{Enter}')

    expect(onChange).toHaveBeenCalledWith('Ibuprofen')
    expect(document.querySelector('ul')).not.toBeInTheDocument()
  })

  it('Enter with no highlight selects first filtered item', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ComboBox options={DRUGS} value="" onChange={onChange} />)

    const input = screen.getByRole('textbox')
    await user.click(input)
    // Dropdown opens on click/focus with highlightIndex=-1; press Enter immediately
    await user.keyboard('{Enter}')

    expect(onChange).toHaveBeenCalledWith('Amoxicillin')
  })

  it('Enter with empty results does nothing', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    // 'xyz' filters to empty list
    render(<ComboBox options={DRUGS} value="xyz" onChange={onChange} />)

    const input = screen.getByRole('textbox')
    await user.click(input)
    await user.keyboard('{Enter}')

    expect(onChange).not.toHaveBeenCalled()
  })

  it('Escape closes dropdown without blurring input', async () => {
    const user = userEvent.setup()
    render(<ComboBox options={DRUGS} value="" onChange={() => {}} />)

    const input = screen.getByRole('textbox')
    await user.click(input) // opens dropdown
    expect(document.querySelector('ul')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(document.querySelector('ul')).not.toBeInTheDocument()
    expect(document.activeElement).toBe(input)
  })

  it('Tab with highlighted item confirms selection without preventing default', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ComboBox options={DRUGS} value="" onChange={onChange} />)

    const input = screen.getByRole('textbox')
    await user.click(input)
    await user.keyboard('{Escape}')
    await user.keyboard('{ArrowDown}') // highlight first item = 'Amoxicillin'

    // Track whether preventDefault was called via capture listener
    // Note: jsdom KeyboardEvent.preventDefault is read-only so we check defaultPrevented
    let tabEventDefaultPrevented = false
    input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        // Defer check until after all handlers have run
        Promise.resolve().then(() => {
          tabEventDefaultPrevented = e.defaultPrevented
        })
      }
    })

    await user.keyboard('{Tab}')

    expect(onChange).toHaveBeenCalledWith('Amoxicillin')
    // Verify Tab did not prevent default (browser focus advance allowed)
    expect(tabEventDefaultPrevented).toBe(false)
  })

  it('Tab with no highlight does not call onChange', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ComboBox options={DRUGS} value="" onChange={onChange} />)

    const input = screen.getByRole('textbox')
    await user.click(input)
    // Dropdown opens on click with highlightIndex=-1, Tab immediately without navigating
    await user.keyboard('{Tab}')

    expect(onChange).not.toHaveBeenCalled()
  })
})
