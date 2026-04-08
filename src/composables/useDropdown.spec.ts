import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'

// Mock onUnmounted so it doesn't complain outside a component
vi.mock('vue', async () => {
  const actual = await vi.importActual<typeof import('vue')>('vue')
  return { ...actual, onUnmounted: vi.fn() }
})

import { useDropdown } from './useDropdown'

describe('useDropdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts closed', () => {
    const { isOpen } = useDropdown()
    expect(isOpen.value).toBe(false)
  })

  describe('open / close / toggle', () => {
    it('open() opens the dropdown', () => {
      const { isOpen, open } = useDropdown()
      open()
      expect(isOpen.value).toBe(true)
    })

    it('close() closes the dropdown', () => {
      const { isOpen, open, close } = useDropdown()
      open()
      close()
      expect(isOpen.value).toBe(false)
    })

    it('toggle() flips the state', () => {
      const { isOpen, toggle } = useDropdown()
      toggle()
      expect(isOpen.value).toBe(true)
      toggle()
      expect(isOpen.value).toBe(false)
    })

    it('open() cancels a pending close timer', () => {
      const { isOpen, selectAndClose, open } = useDropdown({ closeDelay: 300 })
      open()
      selectAndClose(() => {})

      // Before timer fires, open again
      vi.advanceTimersByTime(200)
      open()

      vi.advanceTimersByTime(200)
      // Should still be open because open() cancelled the timer
      expect(isOpen.value).toBe(true)
    })
  })

  describe('selectAndClose', () => {
    it('runs callback immediately', () => {
      const cb = vi.fn()
      const { selectAndClose } = useDropdown()
      selectAndClose(cb)
      expect(cb).toHaveBeenCalledOnce()
    })

    it('closes after delay', () => {
      const { isOpen, open, selectAndClose } = useDropdown({ closeDelay: 300 })
      open()
      selectAndClose(() => {})

      expect(isOpen.value).toBe(true) // not closed yet
      vi.advanceTimersByTime(300)
      expect(isOpen.value).toBe(false)
    })

    it('uses default closeDelay of 300ms', () => {
      const { isOpen, open, selectAndClose } = useDropdown()
      open()
      selectAndClose(() => {})

      vi.advanceTimersByTime(299)
      expect(isOpen.value).toBe(true)
      vi.advanceTimersByTime(1)
      expect(isOpen.value).toBe(false)
    })

    it('cancels previous timer on subsequent call', () => {
      const { isOpen, open, selectAndClose } = useDropdown({ closeDelay: 300 })
      open()
      selectAndClose(() => {})
      selectAndClose(() => {})

      vi.advanceTimersByTime(300)
      expect(isOpen.value).toBe(false)
    })
  })
})
