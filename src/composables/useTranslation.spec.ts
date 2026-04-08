import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// Mock onUnmounted
vi.mock('vue', async () => {
  const actual = await vi.importActual<typeof import('vue')>('vue')
  return { ...actual, onUnmounted: vi.fn() }
})

// Mock window.ipcRenderer
const mockTranslate = vi.fn()
const mockWriteText = vi.fn()

beforeEach(() => {
  vi.stubGlobal('window', {
    ipcRenderer: {
      translate: mockTranslate,
    },
  })
  vi.stubGlobal('navigator', {
    clipboard: { writeText: mockWriteText },
  })
})

import { useTranslation } from './useTranslation'
import { useTranslationStore } from '@/stores/translationStore'

describe('useTranslation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockTranslate.mockReset()
    mockWriteText.mockReset()
  })

  describe('handleTranslate', () => {
    it('calls IPC with correct params', async () => {
      mockTranslate.mockResolvedValue({ translation: 'Hello' })
      const store = useTranslationStore()
      store.inputText = '你好'
      store.selectedLang = 'English'
      store.selectedModel = 'llm'

      const { handleTranslate } = useTranslation()
      await handleTranslate()

      expect(mockTranslate).toHaveBeenCalledWith('你好', '中文', 'English', 'llm')
      expect(store.translatedText).toBe('Hello')
    })

    it('does nothing when inputText is empty', async () => {
      const { handleTranslate } = useTranslation()
      await handleTranslate()
      expect(mockTranslate).not.toHaveBeenCalled()
    })

    it('does nothing when already translating', async () => {
      const store = useTranslationStore()
      store.inputText = '你好'
      store.translating = true

      const { handleTranslate } = useTranslation()
      await handleTranslate()
      expect(mockTranslate).not.toHaveBeenCalled()
    })

    it('shows error message on API error', async () => {
      mockTranslate.mockResolvedValue({ error: 'invalid key' })
      const store = useTranslationStore()
      store.inputText = '你好'

      const { handleTranslate } = useTranslation()
      await handleTranslate()

      expect(store.translatedText).toBe('翻译失败: invalid key')
    })

    it('shows error message on exception', async () => {
      mockTranslate.mockRejectedValue(new Error('network'))
      const store = useTranslationStore()
      store.inputText = '你好'

      const { handleTranslate } = useTranslation()
      await handleTranslate()

      expect(store.translatedText).toBe('翻译服务出错')
    })

    it('sets translating to false after completion', async () => {
      mockTranslate.mockResolvedValue({ translation: 'Hello' })
      const store = useTranslationStore()
      store.inputText = '你好'

      const { handleTranslate } = useTranslation()
      await handleTranslate()

      expect(store.translating).toBe(false)
    })

    it('sets translating to false even on error', async () => {
      mockTranslate.mockRejectedValue(new Error('fail'))
      const store = useTranslationStore()
      store.inputText = '你好'

      const { handleTranslate } = useTranslation()
      await handleTranslate()

      expect(store.translating).toBe(false)
    })
  })

  describe('copyTranslation', () => {
    it('copies translated text to clipboard', async () => {
      mockWriteText.mockResolvedValue(undefined)
      const store = useTranslationStore()
      store.translatedText = 'Hello'

      const { copyTranslation } = useTranslation()
      await copyTranslation()

      expect(mockWriteText).toHaveBeenCalledWith('Hello')
    })

    it('does nothing when translatedText is empty', async () => {
      const { copyTranslation } = useTranslation()
      await copyTranslation()
      expect(mockWriteText).not.toHaveBeenCalled()
    })

    it('does not throw when clipboard API fails', async () => {
      mockWriteText.mockRejectedValue(new Error('denied'))
      const store = useTranslationStore()
      store.translatedText = 'Hello'

      const { copyTranslation } = useTranslation()
      await expect(copyTranslation()).resolves.toBeUndefined()
    })
  })
})
