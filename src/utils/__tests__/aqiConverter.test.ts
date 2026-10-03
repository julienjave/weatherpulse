import { describe, it, expect } from 'vitest'
import { getUsAqiKit } from '../aqiConverter'

describe('aqiConverter (getUsAqiKit)', () => {
  it('should map Good AQI range correctly (0 - 12 µg/m³)', () => {
    const result = getUsAqiKit(6)
    expect(result.label).toBe('Good')
    expect(result.background).toBe('#00e400')
    expect(result.aqi).toBeGreaterThanOrEqual(0)
    expect(result.aqi).toBeLessThanOrEqual(50)
  })

  it('should map Moderate AQI range correctly (12.1 - 35.4 µg/m³)', () => {
    const result = getUsAqiKit(20)
    expect(result.label).toBe('Moderate')
    expect(result.color).toBe('#000')
    expect(result.background).toBe('#ffff00')
  })

  it('should map Unhealthy range correctly', () => {
    const result = getUsAqiKit(100)
    expect(result.label).toBe('Unhealthy')
    expect(result.color).toBe('#fff')
    expect(result.background).toBe('#ff0000')
  })

  it('should clamp values lower than 0 to minimum range', () => {
    const result = getUsAqiKit(-10)
    expect(result.aqi).toBe(0)
    expect(result.label).toBe('Good')
  })

  it('should clamp extreme values to Hazardous range', () => {
    const result = getUsAqiKit(600)
    expect(result.label).toBe('Hazardous')
    expect(result.color).toBe('#fff')
  })

  // --- ADDITIONAL COVERAGE ---

  it('should interpolate linearly inside a range', () => {
    expect(getUsAqiKit(6).aqi).toBe(25) // halfway through 0-12 → halfway through 0-50
  })

  it.each([
    [0, 0, 'Good', '#00e400'],
    [12.0, 50, 'Good', '#00e400'],
    [12.1, 51, 'Moderate', '#ffff00'],
    [35.4, 100, 'Moderate', '#ffff00'],
    [35.5, 101, 'Unhealthy for Sensitive Groups', '#ff7e00'],
    [55.4, 150, 'Unhealthy for Sensitive Groups', '#ff7e00'],
    [55.5, 151, 'Unhealthy', '#ff0000'],
    [150.4, 200, 'Unhealthy', '#ff0000'],
    [150.5, 201, 'Very Unhealthy', '#8f3f97'],
    [250.4, 300, 'Very Unhealthy', '#8f3f97'],
    [250.5, 301, 'Hazardous', '#7e0023'],
    [500.4, 500, 'Hazardous', '#7e0023'],
  ])('should map PM2.5 %f to AQI %i (%s)', (pm25, expectedAqi, expectedLabel, expectedBackground) => {
    const result = getUsAqiKit(pm25)
    expect(result.aqi).toBe(expectedAqi)
    expect(result.label).toBe(expectedLabel)
    expect(result.background).toBe(expectedBackground)
  })

  it('should cap the AQI at 500 for extreme values', () => {
    expect(getUsAqiKit(10_000).aqi).toBe(500)
  })

  // KNOWN BUG: OpenWeatherMap returns PM2.5 with 2 decimals (e.g. 12.05), which falls in the
  // gap between breakpoints (12.0 / 12.1). `find` then misses and the code defaults to
  // "Hazardous". EPA guidance is to truncate PM2.5 to 1 decimal before lookup.
  // Remove `.fails` once getUsAqiKit is fixed.
  it.each([12.05, 35.45, 55.45, 150.45, 250.45])(
    'should not classify in-between value %f as Hazardous',
    (pm25) => {
      const result = getUsAqiKit(pm25)
      expect(result.label).not.toBe('Hazardous')
    }
  )
})