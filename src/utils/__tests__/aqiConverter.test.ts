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
})