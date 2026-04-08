import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTranslationStore } from './translationStore'

describe('translationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('has correct default values', () => {
    const store = useTranslationStore()
    expect(store.inputText).toBe('')
    expect(store.translatedText).toBe('')
    expect(store.translating).toBe(false)
    expect(store.selectedLang).toBe('English')
    expect(store.selectedModel).toBe('llm')
    expect(store.latencyMs).toBe(0)
  })

  it('updates inputText', () => {
    const store = useTranslationStore()
    store.inputText = '你好'
    expect(store.inputText).toBe('你好')
  })

  it('updates selectedLang', () => {
    const store = useTranslationStore()
    store.selectedLang = '日本語'
    expect(store.selectedLang).toBe('日本語')
  })

  it('updates selectedModel', () => {
    const store = useTranslationStore()
    store.selectedModel = 'nmt'
    expect(store.selectedModel).toBe('nmt')
  })

  it('tracks translating state', () => {
    const store = useTranslationStore()
    expect(store.translating).toBe(false)
    store.translating = true
    expect(store.translating).toBe(true)
  })

  it('computes latencyMs from pingLatencyMs', () => {
    const store = useTranslationStore()
    store.pingLatencyMs = 42
    expect(store.latencyMs).toBe(42)
  })

  it('provides language list', () => {
    const store = useTranslationStore()
    expect(store.languages).toContain('English')
    expect(store.languages).toContain('中文')
    expect(store.languages.length).toBe(6)
  })

  it('provides model options', () => {
    const store = useTranslationStore()
    expect(store.modelOptions.length).toBe(2)
    expect(store.modelOptions[0].value).toBe('llm')
    expect(store.modelOptions[1].value).toBe('nmt')
  })

  it('stores are independent across instances', () => {
    const store1 = useTranslationStore()
    store1.inputText = 'hello'
    store1.selectedLang = '日本語'

    // Same store instance within same pinia
    const store2 = useTranslationStore()
    expect(store2.inputText).toBe('hello')
    expect(store2.selectedLang).toBe('日本語')
  })
})
