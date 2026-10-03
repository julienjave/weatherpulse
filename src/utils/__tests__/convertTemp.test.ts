import { describe, it, expect } from 'vitest'
import { convertTemp } from '../convertTemp'

describe('convertTemp', () => {
  it('should return unchanged rounded value when target unit matches current unit', () => {
    expect(convertTemp(21.4, 'metric', 'metric')).toBe(21)
    expect(convertTemp(72.8, 'imperial', 'imperial')).toBe(73)
  })

  it('should correctly convert Celsius to Fahrenheit', () => {
    expect(convertTemp(0, 'metric', 'imperial')).toBe(32)
    expect(convertTemp(20, 'metric', 'imperial')).toBe(68)
    expect(convertTemp(37, 'metric', 'imperial')).toBe(99)
  })

  it('should correctly convert Fahrenheit to Celsius', () => {
    expect(convertTemp(32, 'imperial', 'metric')).toBe(0)
    expect(convertTemp(68, 'imperial', 'metric')).toBe(20)
    expect(convertTemp(100, 'imperial', 'metric')).toBe(38)
  })

  it('should handle negative temperatures', () => {
    expect(convertTemp(-10, 'metric', 'imperial')).toBe(14)
    expect(convertTemp(0, 'imperial', 'metric')).toBe(-18)
  })

  it('should return -40 in both directions (the point where scales meet)', () => {
    expect(convertTemp(-40, 'metric', 'imperial')).toBe(-40)
    expect(convertTemp(-40, 'imperial', 'metric')).toBe(-40)
  })

  it('should round fractional results to the nearest integer', () => {
    expect(convertTemp(21.5, 'metric', 'imperial')).toBe(71) // 70.7
    expect(convertTemp(70.7, 'imperial', 'metric')).toBe(22) // 21.5
  })
})