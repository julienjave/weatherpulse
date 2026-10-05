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

  // --- ADDITIONAL COVERAGE ---

  describe('getWeatherTheme (all condition groups)', () => {
    it.each([
      [200, 'thunderstorm'],
      [299, 'thunderstorm'],
      [300, 'drizzle'],
      [321, 'drizzle'],
      [500, 'rain'],
      [531, 'rain'],
      [600, 'snow'],
      [622, 'snow'],
      [701, 'atmosphere'],
      [781, 'atmosphere'],
      [801, 'partly-cloudy'],
      [802, 'partly-cloudy'],
      [803, 'clouds'],
      [804, 'clouds'],
    ])('should map code %i to the %s theme', (code, expectedKey) => {
      expect(getWeatherTheme(code, '01d').key).toBe(expectedKey)
    })

    it('should ignore day/night for non-clear conditions', () => {
      expect(getWeatherTheme(502, '10n').key).toBe('rain')
      expect(getWeatherTheme(804, '04n').key).toBe('clouds')
    })

    it('should use the dark clouds theme for few/scattered clouds at night', () => {
      expect(getWeatherTheme(801, '02n').key).toBe('clouds')
      expect(getWeatherTheme(802, '03n').key).toBe('clouds')
    })

    it('should default to day when no icon code is provided', () => {
      expect(getWeatherTheme(800).key).toBe('clear-day')
    })

    it('should fall back to clear day/night for unknown codes', () => {
      expect(getWeatherTheme(100, '01d').key).toBe('clear-day')
      expect(getWeatherTheme(900, '01n').key).toBe('clear-night')
    })

    it('should mark light themes as not dark', () => {
      expect(getWeatherTheme(600).isDark).toBe(false) // snow
      expect(getWeatherTheme(701).isDark).toBe(false) // atmosphere
      expect(getWeatherTheme(502).isDark).toBe(true) // rain
    })
  })

  describe('getWeatherIcon (all condition groups)', () => {
    it.each([
      [801, 'partly-cloudy'],
      [802, 'cloudy'],
      [500, 'light-rain'],
      [520, 'light-rain'],
      [501, 'rain'],
      [521, 'rain'],
      [502, 'heavy-rain'],
      [504, 'heavy-rain'],
      [522, 'heavy-rain'],
      [531, 'heavy-rain'],
      [511, 'sleet'],
      [611, 'sleet'],
      [616, 'sleet'],
      [600, 'light-snow'],
      [620, 'light-snow'],
      [601, 'snow'],
      [621, 'snow'],
      [602, 'heavy-snow'],
      [622, 'heavy-snow'],
      [701, 'fog'],
      [741, 'fog'],
      [762, 'fog'],
      [771, 'tornado'],
      [781, 'tornado'],
      [210, 'thunderstorm'],
      [212, 'heavy-thunderstorm'],
      [221, 'heavy-thunderstorm'],
      [200, 'rain-thunderstorm'],
      [202, 'rain-thunderstorm'],
      [230, 'rain-thunderstorm'],
      [232, 'rain-thunderstorm'],
    ])('should map code %i to the %s icon', (code, iconName) => {
      expect(getWeatherIcon(code, '01d')).toBe(`${iconName}-day.svg`)
      expect(getWeatherIcon(code, '01n')).toBe(`${iconName}-night.svg`)
    })

    it('should default to day when no icon code is provided', () => {
      expect(getWeatherIcon(500)).toBe('light-rain-day.svg')
    })

    it('should fall back to clear day/night for unknown codes', () => {
      expect(getWeatherIcon(100, '01d')).toBe('clear-day.svg')
      expect(getWeatherIcon(900, '01n')).toBe('clear-night.svg')
    })

    // KNOWN BUG: 803 (broken clouds) and 804 (overcast) currently return clear-*.svg.
    // extra/icons.md maps OWM icons 03x/04x to cloudy-*.svg.
    // Remove `.fails` once getWeatherIcon is fixed.
    it.fails.each([803, 804])('should map code %i to a cloudy icon', (code) => {
      expect(getWeatherIcon(code, '04d')).toBe('cloudy-day.svg')
      expect(getWeatherIcon(code, '04n')).toBe('cloudy-night.svg')
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