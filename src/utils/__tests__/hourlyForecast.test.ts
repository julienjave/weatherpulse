import { describe, it, expect } from 'vitest'
import { getHourlyTrend, HOURLY_TREND_POINTS } from '../hourlyForecast'
import type { ForecastItem } from '../../types/weather'

// Builds a minimal 3-hour forecast slot starting at a fixed UTC timestamp
const makeItem = (index: number, temp: number): ForecastItem => ({
  dt: 1_790_000_000 + index * 3 * 3600,
  main: {
    temp,
    feels_like: temp - 1.4,
    temp_min: temp,
    temp_max: temp,
    pressure: 1013,
    humidity: 60,
    temp_kf: 0,
  },
  weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
  clouds: { all: 0 },
  wind: { speed: 3, deg: 180 },
  visibility: 10000,
  pop: 0.234,
  sys: { pod: 'd' },
  dt_txt: '',
})

describe('getHourlyTrend', () => {
  const list = Array.from({ length: 40 }, (_, i) => makeItem(i, 10 + i * 0.6))

  it('returns 9 three-hour points by default to span 24 hours', () => {
    const trend = getHourlyTrend(list, 0)

    expect(trend).toHaveLength(HOURLY_TREND_POINTS)
    expect(trend[trend.length - 1].dt - trend[0].dt).toBe(24 * 3600)
  })

  it('rounds temperatures and converts pop to a percentage', () => {
    const [first, second] = getHourlyTrend(list, 0)

    expect(first.temp).toBe(10)
    expect(first.feelsLike).toBe(9)
    expect(second.temp).toBe(11)
    expect(first.pop).toBe(23)
    expect(first.description).toBe('clear sky')
  })

  it('returns fewer points when the list is shorter than requested', () => {
    expect(getHourlyTrend(list.slice(0, 3), 0)).toHaveLength(3)
    expect(getHourlyTrend([], 0)).toEqual([])
  })

  it('formats a city-local time label', () => {
    const [first] = getHourlyTrend(list, 0)

    expect(first.timeLabel).toMatch(/^\d{1,2}:\d{2}\s?(AM|PM)$/)
  })
})
