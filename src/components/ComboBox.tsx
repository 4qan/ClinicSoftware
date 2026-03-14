import { useState, useRef, useEffect, useCallback } from 'react'
import { useAutocompleteKeyboard } from '@/hooks/useAutocompleteKeyboard'

interface ComboBoxProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  showCustomIndicator?: boolean
  inputRef?: React.RefObject<HTMLInputElement | null>
}

export function ComboBox({
  options,
  value,
  onChange,
  placeholder,
  label,
  error,
  disabled = false,
  showCustomIndicator = false,
  inputRef: externalInputRef,
}: ComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const internalInputRef = useRef<HTMLInputElement>(null)
  const inputRef = externalInputRef ?? internalInputRef
  const listRef = useRef<HTMLUListElement>(null)

  const filtered = value
    ? options.filter(opt => opt.toLowerCase().includes(value.toLowerCase()))
    : options

  const isCustomValue = showCustomIndicator && value.trim() !== '' &&
    !options.some(opt => opt.toLowerCase() === value.toLowerCase())

  function handleSelect(option: string) {
    onChange(option)
    setIsOpen(false)
  }

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const open = useCallback(() => {
    setIsOpen(true)
  }, [])

  const { highlightIndex, setHighlightIndex, handleKeyDown } = useAutocompleteKeyboard<string>({
    items: filtered,
    isOpen,
    onSelect: handleSelect,
    onClose: close,
    onOpen: open,
  })

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [close])

  useEffect(() => {
    if (isOpen && highlightIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightIndex, isOpen])

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => {
          setIsOpen(true)
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 text-base border rounded-lg ${
          error
            ? 'border-red-500'
            : isCustomValue
              ? 'border-amber-400'
              : 'border-gray-200'
        } ${disabled ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}
        style={{ minHeight: '44px' }}
        autoComplete="off"
      />

      {isOpen && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          {filtered.map((option, idx) => (
            <li
              key={option}
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelect(option)
              }}
              onMouseEnter={() => setHighlightIndex(idx)}
              className={`px-3 py-2 cursor-pointer text-sm ${
                idx === highlightIndex
                  ? 'bg-blue-50 text-blue-900'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {option}
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
