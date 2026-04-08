import { describe, it, expect } from 'vitest'
import { navItems } from './index'

describe('router', () => {
  describe('navItems', () => {
    it('only includes routes with showInNav: true', () => {
      const paths = navItems.map((item) => item.path)
      expect(paths).toContain('/realtime')
      expect(paths).toContain('/voice')
      expect(paths).toContain('/models')
      expect(paths).toContain('/zuan')
      expect(paths).toContain('/dictionary')
      expect(paths).not.toContain('/debug-window')
      expect(paths).not.toContain('/')
    })

    it('each nav item has path, label, and icon', () => {
      for (const item of navItems) {
        expect(item.path).toBeTruthy()
        expect(item.label).toBeTruthy()
        expect(item.icon).toBeTruthy()
      }
    })

    it('has 5 navigation items', () => {
      expect(navItems.length).toBe(5)
    })
  })
})
