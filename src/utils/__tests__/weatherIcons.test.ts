import { describe, it, expect } from 'vitest'
import { getIconUrl } from '../weatherIcons'
import { getWeatherIcon } from '../weatherThemes'

describe('weatherIcons', () => {
  describe('getIconUrl', () => {
    it('should resolve a known icon file to its bundled asset URL', () => {
      expect(getIconUrl('rain.png')).toMatch(/rain\.png/)
      expect(getIconUrl('partly-cloudy-night.png')).toMatch(/partly-cloudy-night\.png/)
    })

    it('should fall back to the clear-day icon for an unknown file', () => {
      const fallback = getIconUrl('clear-day.png')
      expect(fallback).toMatch(/clear-day\.png/)
      expect(getIconUrl('does-not-exist.png')).toBe(fallback)
      expect(getIconUrl('rain.svg')).toBe(fallback)
    })

    // Guards against getWeatherIcon returning a filename with no matching asset,
    // which would silently render the clear-day fallback
    it('should have a bundled asset for every icon getWeatherIcon can return', () => {
      const icons = new Set<string>()
      for (let code = 200; code < 900; code++) {
        icons.add(getWeatherIcon(code, '01d'))
        icons.add(getWeatherIcon(code, '01n'))
      }

      for (const icon of icons) {
        expect(getIconUrl(icon), icon).toContain(icon)
      }
    })
  })
})
