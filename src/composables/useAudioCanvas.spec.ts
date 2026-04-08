import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock onUnmounted
vi.mock('vue', async () => {
  const actual = await vi.importActual<typeof import('vue')>('vue')
  return { ...actual, onUnmounted: vi.fn() }
})

import { useAudioCanvas } from './useAudioCanvas'

describe('useAudioCanvas', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with zero metrics', () => {
    const { freqVolume, waveAmplitude, isSoundDetected } = useAudioCanvas()
    expect(freqVolume.value).toBe(0)
    expect(waveAmplitude.value).toBe(0)
    expect(isSoundDetected.value).toBe(false)
  })

  describe('computeMetrics', () => {
    it('computes freqVolume as average of sampled frequency bins', () => {
      const { computeMetrics, freqVolume } = useAudioCanvas()
      // 4 bars, each with value 100
      const freqData = new Uint8Array([100, 100, 100, 100])
      const waveData = new Uint8Array([128, 128, 128, 128])
      computeMetrics(freqData, waveData, 4)
      expect(freqVolume.value).toBe(100)
    })

    it('computes waveAmplitude from max deviation from silence (128)', () => {
      const { computeMetrics, waveAmplitude } = useAudioCanvas()
      const freqData = new Uint8Array([0])
      // Wave peaks at 148 (deviation = 20), trough at 108 (deviation = 20)
      const waveData = new Uint8Array([148, 108])
      computeMetrics(freqData, waveData, 1)
      expect(waveAmplitude.value).toBe(20)
    })

    it('detects sound when freqVolume exceeds threshold', () => {
      const { computeMetrics, isSoundDetected } = useAudioCanvas({ volumeThreshold: 10 })
      const freqData = new Uint8Array([50, 50])
      const waveData = new Uint8Array([128, 128])
      computeMetrics(freqData, waveData, 2)
      expect(isSoundDetected.value).toBe(true)
    })

    it('detects sound when waveAmplitude exceeds 5', () => {
      const { computeMetrics, isSoundDetected } = useAudioCanvas({ volumeThreshold: 999 })
      const freqData = new Uint8Array([0])
      const waveData = new Uint8Array([180, 128]) // deviation = 52
      computeMetrics(freqData, waveData, 1)
      expect(isSoundDetected.value).toBe(true)
    })

    it('does not detect sound in silence', () => {
      const { computeMetrics, isSoundDetected } = useAudioCanvas()
      const freqData = new Uint8Array([0, 0, 0, 0])
      const waveData = new Uint8Array([128, 128, 128, 128])
      computeMetrics(freqData, waveData, 4)
      expect(isSoundDetected.value).toBe(false)
    })
  })

  describe('resetMetrics', () => {
    it('resets all values to zero/false', () => {
      const { computeMetrics, resetMetrics, freqVolume, waveAmplitude, isSoundDetected } = useAudioCanvas()
      const freqData = new Uint8Array([100, 100])
      const waveData = new Uint8Array([200, 56])
      computeMetrics(freqData, waveData, 2)

      resetMetrics()
      expect(freqVolume.value).toBe(0)
      expect(waveAmplitude.value).toBe(0)
      expect(isSoundDetected.value).toBe(false)
    })
  })
})
