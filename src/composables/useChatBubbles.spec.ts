import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, type Ref } from 'vue'
import { useChatBubbles } from './useChatBubbles'

// Mock onUnmounted so it doesn't complain outside a component
vi.mock('vue', async () => {
  const actual = await vi.importActual<typeof import('vue')>('vue')
  return { ...actual, onUnmounted: vi.fn() }
})

function createMockDialogListRef() {
  return ref({ scrollToBottom: vi.fn() }) as Ref<{ scrollToBottom: () => void } | null>
}

describe('useChatBubbles', () => {
  let dialogListRef: ReturnType<typeof createMockDialogListRef>

  beforeEach(() => {
    dialogListRef = createMockDialogListRef()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function createBubbles() {
    return useChatBubbles({ dialogListRef })
  }

  it('starts with empty state', () => {
    const { bubbles, currentSrc, currentTrg, inputText, bubbleFinalizing } = createBubbles()
    expect(bubbles.value).toEqual([])
    expect(currentSrc.value).toBe('')
    expect(currentTrg.value).toBe('')
    expect(inputText.value).toBe('')
    expect(bubbleFinalizing.value).toBe(false)
  })

  describe('updateCurrentSrc', () => {
    it('sets the current source text', () => {
      const { updateCurrentSrc, currentSrc } = createBubbles()
      updateCurrentSrc('你好世界')
      expect(currentSrc.value).toBe('你好世界')
    })

    it('replaces previous value', () => {
      const { updateCurrentSrc, currentSrc } = createBubbles()
      updateCurrentSrc('你好')
      updateCurrentSrc('世界')
      expect(currentSrc.value).toBe('世界')
    })
  })

  describe('handleEnter', () => {
    it('sets currentSrc from inputText when currentSrc is empty', () => {
      const { handleEnter, currentSrc, inputText } = createBubbles()
      inputText.value = 'hello'
      handleEnter()
      expect(currentSrc.value).toBe('hello')
      expect(inputText.value).toBe('')
    })

    it('appends inputText to existing currentSrc', () => {
      const { updateCurrentSrc, handleEnter, currentSrc, inputText } = createBubbles()
      updateCurrentSrc('hello')
      inputText.value = ' world'
      handleEnter()
      expect(currentSrc.value).toBe('hello world')
    })

    it('does nothing when inputText is empty or whitespace', () => {
      const { handleEnter, currentSrc, inputText } = createBubbles()
      inputText.value = '   '
      handleEnter()
      expect(currentSrc.value).toBe('')
    })
  })

  describe('endBubble', () => {
    it('does nothing when currentSrc is empty', () => {
      const { endBubble, bubbles } = createBubbles()
      endBubble()
      expect(bubbles.value.length).toBe(0)
    })

    it('starts finalizing and creates bubble after delay', () => {
      const { updateCurrentSrc, endBubble, bubbles, bubbleFinalizing, currentSrc } = createBubbles()
      updateCurrentSrc('你好')

      endBubble()
      expect(bubbleFinalizing.value).toBe(true)
      expect(bubbles.value.length).toBe(0)

      vi.advanceTimersByTime(500)
      expect(bubbles.value.length).toBe(1)
      expect(bubbles.value[0].src).toBe('你好')
      expect(bubbleFinalizing.value).toBe(false)
      expect(currentSrc.value).toBe('')
    })

    it('cancels previous timer when called again', () => {
      const { updateCurrentSrc, endBubble, bubbles } = createBubbles()
      updateCurrentSrc('first')

      endBubble()
      updateCurrentSrc('second')
      endBubble()

      vi.advanceTimersByTime(500)
      // Should only create one bubble (the second one), not two
      expect(bubbles.value.length).toBe(1)
      expect(bubbles.value[0].src).toBe('second')
    })
  })

  describe('resetAll', () => {
    it('clears everything', () => {
      const { updateCurrentSrc, endBubble, resetAll, bubbles, currentSrc, inputText, bubbleFinalizing } = createBubbles()
      updateCurrentSrc('你好')
      endBubble()
      inputText.value = 'test'

      resetAll()

      expect(bubbles.value).toEqual([])
      expect(currentSrc.value).toBe('')
      expect(inputText.value).toBe('')
      expect(bubbleFinalizing.value).toBe(false)
    })

    it('cancels pending finalization timer', () => {
      const { updateCurrentSrc, endBubble, resetAll, bubbles } = createBubbles()
      updateCurrentSrc('你好')
      endBubble()

      resetAll()
      vi.advanceTimersByTime(500)

      // Timer was cancelled, no bubble created
      expect(bubbles.value.length).toBe(0)
    })
  })
})
