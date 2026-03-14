import { useState, useEffect, useCallback, useRef } from 'react'

interface UseAutocompleteKeyboardOptions<T> {
  items: T[]
  isOpen: boolean
  onSelect: (item: T) => void
  onClose: () => void
  onOpen?: () => void
}

interface UseAutocompleteKeyboardResult {
  highlightIndex: number
  setHighlightIndex: React.Dispatch<React.SetStateAction<number>>
  handleKeyDown: (e: React.KeyboardEvent) => void
}

export function useAutocompleteKeyboard<T>({
  items,
  isOpen,
  onSelect,
  onClose,
  onOpen,
}: UseAutocompleteKeyboardOptions<T>): UseAutocompleteKeyboardResult {
  const [highlightIndex, setHighlightIndex] = useState(-1)

  // Reset highlight when item count changes (user typed and filtered list changed)
  // Use a ref-based comparison to avoid firing on every render due to new array references
  const prevItemCountRef = useRef<number>(items.length)
  const prevItemKeyRef = useRef<string>(JSON.stringify(items))

  useEffect(() => {
    const currentKey = JSON.stringify(items)
    if (currentKey !== prevItemKeyRef.current) {
      prevItemKeyRef.current = currentKey
      prevItemCountRef.current = items.length
      setHighlightIndex(-1)
    }
  })

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        // Intentionally do NOT blur -- caller owns focus management
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (!isOpen) {
          onOpen?.()
          setHighlightIndex(0)
          return
        }
        if (items.length === 0) return
        setHighlightIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0))
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (!isOpen) return
        if (items.length === 0) return
        setHighlightIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1))
        return
      }

      if (e.key === 'Enter') {
        if (!isOpen) return
        e.preventDefault()
        if (highlightIndex >= 0 && highlightIndex < items.length) {
          onSelect(items[highlightIndex])
        } else if (items.length > 0) {
          // Enter-selects-first when nothing highlighted
          onSelect(items[0])
        }
        return
      }

      if (e.key === 'Tab') {
        // Do NOT preventDefault -- let browser advance focus naturally
        if (isOpen && highlightIndex >= 0 && highlightIndex < items.length) {
          onSelect(items[highlightIndex])
        }
        // Tab with no highlight: do nothing special
      }
    },
    [items, isOpen, highlightIndex, onSelect, onClose, onOpen],
  )

  return { highlightIndex, setHighlightIndex, handleKeyDown }
}
