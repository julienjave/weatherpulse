import { describe, it, expect } from 'vitest'
import { formatCountryName } from '../formatCountry'

describe('formatCountryName', () => {
  it('should convert valid 2-letter ISO country codes to English country names', () => {
    expect(formatCountryName('FR')).toBe('France')
    expect(formatCountryName('AU')).toBe('Australia')
    expect(formatCountryName('US')).toBe('United States')
  })

  it('should handle lowercase country codes', () => {
    expect(formatCountryName('gb')).toBe('United Kingdom')
    expect(formatCountryName('ca')).toBe('Canada')
  })

  it('should return empty string for empty input', () => {
    expect(formatCountryName('')).toBe('')
  })

  it('should return raw uppercase code as fallback for invalid region codes', () => {
    expect(formatCountryName('XYZ')).toBe('XYZ')
  })

  it('should uppercase invalid codes in the fallback', () => {
    expect(formatCountryName('xyz')).toBe('XYZ')
  })

  it('should translate into the requested locale', () => {
    expect(formatCountryName('DE', 'fr')).toBe('Allemagne')
  })

  it('should fall back to the uppercase code when the locale is invalid', () => {
    expect(formatCountryName('fr', 'not a locale!')).toBe('FR')
  })
})