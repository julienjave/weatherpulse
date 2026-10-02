import { describe, it, expect } from 'vitest'
import { getWeatherTheme, getWeatherIcon, getWeatherThemeKit } from '../weatherThemes'

describe('weatherThemes', () => {
  describe('getWeatherTheme', () => {
    it('should return clear-day theme for code 800 with day icon', () => {
      const theme = getWeatherTheme(800, '01d')
      expect(theme.key).toBe('clear-day')
      expect(theme.isDark).toBe(false)
    })

    it('should return clear-night theme for code 800 with night icon', () => {
      const theme = getWeatherTheme(800, '01n')
      expect(theme.key).toBe('clear-night')
      expect(theme.isDark).toBe(true)
    })

    it('should return rain theme for 5xx codes', () => {
      const theme = getWeatherTheme(502, '10d')
      expect(theme.key).toBe('rain')
    })

    it('should return thunderstorm theme for 2xx codes', () => {
      const theme = getWeatherTheme(211, '11d')
      expect(theme.key).toBe('thunderstorm')
    })
  })

  describe('getWeatherIcon', () => {
    it('should return clear day/night icons correctly', () => {
      expect(getWeatherIcon(800, '01d')).toBe('clear-day.svg')
      expect(getWeatherIcon(800, '01n')).toBe('clear-night.svg')
    })

    it('should return drizzle icons correctly', () => {
      expect(getWeatherIcon(301, '09d')).toBe('drizzle-day.svg')
      expect(getWeatherIcon(301, '09n')).toBe('drizzle-night.svg')
    })

    it('should return thunderstorm icons correctly', () => {
      expect(getWeatherIcon(211, '11d')).toBe('thunderstorm-day.svg')
      expect(getWeatherIcon(211, '11n')).toBe('thunderstorm-night.svg')
    })
  })

  describe('getWeatherThemeKit', () => {
    it('should combine theme and icon into a complete theme kit', () => {
      const kit = getWeatherThemeKit(800, '01d')
      expect(kit.theme.key).toBe('clear-day')
      expect(kit.icon).toBe('clear-day.svg')
    })
  })
})