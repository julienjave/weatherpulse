import { describe, it, expect } from 'vitest'
import { isSameLocation } from '../compareCities'
import type { GeocodingLocation } from '../../types/weather'

describe('compareCities (isSameLocation)', () => {
  const paris: GeocodingLocation = { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'FR' }

  it('should match identical locations', () => {
    expect(isSameLocation(paris, { ...paris })).toBe(true)
  })

  it('should compare by coordinates, ignoring name, country and state', () => {
    const renamed = { name: '48.86°, 2.35°', lat: 48.8566, lon: 2.3522, country: '', state: 'Île-de-France' }
    expect(isSameLocation(paris, renamed)).toBe(true)
  })

  it('should treat coordinates that round to the same 2 decimals as the same place', () => {
    expect(isSameLocation(paris, { ...paris, lat: 48.8649, lon: 2.3451 })).toBe(true)
  })

  it('should not match when latitude differs at 2 decimals', () => {
    expect(isSameLocation(paris, { ...paris, lat: 48.87 })).toBe(false)
  })

  it('should not match when longitude differs at 2 decimals', () => {
    expect(isSameLocation(paris, { ...paris, lon: 2.36 })).toBe(false)
  })

  it('should distinguish coordinates with opposite signs', () => {
    expect(isSameLocation(paris, { ...paris, lat: -48.8566 })).toBe(false)
    expect(isSameLocation(paris, { ...paris, lon: -2.3522 })).toBe(false)
  })

  it('should be symmetric', () => {
    const nearby = { ...paris, lat: 48.8611 }
    expect(isSameLocation(paris, nearby)).toBe(isSameLocation(nearby, paris))
  })
})
