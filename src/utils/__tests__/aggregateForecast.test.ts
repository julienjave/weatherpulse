import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { aggregateDailyForecast, getLocalDateKey, getLocalHour } from '../aggregateForecast'
import type { ForecastItem } from '../../types/weather'

// UTC seconds for a given day/hour in Jan 2026 (15 Jan 2026 is a Thursday)
const utc = (day: number, hour: number) => Date.UTC(2026, 0, day, hour) / 1000

function makeItem(
  dt: number,
  {
    tempMin = 10,
    tempMax = 15,
    id = 800,
    icon = '01d',
    description = 'clear sky',
    pod = 'd',
  }: Partial<{ tempMin: number, tempMax: number, id: number, icon: string, description: string, pod: string }> = {}
): ForecastItem {
  return {
    dt,
    main: { temp: (tempMin + tempMax) / 2, feels_like: tempMin, temp_min: tempMin, temp_max: tempMax, pressure: 1013, humidity: 60, temp_kf: 0 },
    weather: [{ id, main: 'Weather', description, icon }],
    clouds: { all: 0 },
    wind: { speed: 3, deg: 180 },
    visibility: 10000,
    pop: 0,
    sys: { pod },
    dt_txt: '',
  }
}

describe('aggregateForecast', () => {
  describe('getLocalDateKey', () => {
    it('should return the YYYY-MM-DD date in the city timezone', () => {
      expect(getLocalDateKey(utc(15, 12), 0)).toBe('2026-01-15')
    })

    it('should move to the next day when a positive offset crosses midnight', () => {
      expect(getLocalDateKey(utc(15, 20), 36000)).toBe('2026-01-16')
    })

    it('should move to the previous day when a negative offset crosses midnight', () => {
      expect(getLocalDateKey(utc(15, 2), -18000)).toBe('2026-01-14')
    })
  })

  describe('getLocalHour', () => {
    it('should return the hour in the city timezone', () => {
      expect(getLocalHour(utc(15, 12), 0)).toBe(12)
      expect(getLocalHour(utc(15, 12), 36000)).toBe(22)
      expect(getLocalHour(utc(15, 2), -18000)).toBe(21)
    })

    it('should truncate partial-hour offsets', () => {
      expect(getLocalHour(utc(15, 12), 19800)).toBe(17) // 17:30
    })
  })

  describe('aggregateDailyForecast', () => {
    // dateLabel goes through formatLocalTime, which depends on the machine clock and TZ
    beforeEach(() => {
      vi.stubEnv('TZ', 'Europe/Paris')
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(utc(15, 12) * 1000)
    })

    afterEach(() => {
      vi.useRealTimers()
      vi.unstubAllEnvs()
    })

    it('should return an empty list for an empty forecast', () => {
      expect(aggregateDailyForecast([], 0)).toEqual([])
    })

    it('should group 3-hour slots into one summary per city-local day, in order', () => {
      const list = [utc(15, 12), utc(15, 15), utc(16, 0), utc(16, 12), utc(17, 12)].map((dt) => makeItem(dt))

      const result = aggregateDailyForecast(list, 0)

      expect(result.map((day) => day.dateKey)).toEqual(['2026-01-15', '2026-01-16', '2026-01-17'])
    })

    it('should group by the city timezone, not UTC', () => {
      // 22:00 UTC on the 15th is already the 16th in UTC+3
      const list = [makeItem(utc(15, 12)), makeItem(utc(15, 22))]

      const result = aggregateDailyForecast(list, 10800)

      expect(result.map((day) => day.dateKey)).toEqual(['2026-01-15', '2026-01-16'])
    })

    it('should use the highest temp_max and lowest temp_min of the day, rounded', () => {
      const list = [
        makeItem(utc(15, 6), { tempMin: 4.4, tempMax: 9 }),
        makeItem(utc(15, 12), { tempMin: 8, tempMax: 16.5 }),
        makeItem(utc(15, 18), { tempMin: 6, tempMax: 12 }),
      ]

      const [day] = aggregateDailyForecast(list, 0)

      expect(day.tempMax).toBe(17)
      expect(day.tempMin).toBe(4)
    })

    it('should pick the slot closest to 13:00 local for the description and theme', () => {
      const list = [
        makeItem(utc(15, 9), { id: 800, icon: '01d', description: 'clear sky' }),
        makeItem(utc(15, 12), { id: 500, icon: '10d', description: 'light rain' }),
        makeItem(utc(15, 15), { id: 600, icon: '13d', description: 'light snow' }),
      ]

      const [day] = aggregateDailyForecast(list, 0)

      expect(day.description).toBe('light rain')
      expect(day.theme.theme.key).toBe('rain')
      expect(day.theme.icon).toBe('light-rain.png')
    })

    it('should prefer a daytime slot over a closer night slot', () => {
      const list = [
        makeItem(utc(15, 12), { id: 800, icon: '01n', description: 'clear sky', pod: 'n' }),
        makeItem(utc(15, 18), { id: 801, icon: '02d', description: 'few clouds', pod: 'd' }),
      ]

      const [day] = aggregateDailyForecast(list, 0)

      expect(day.description).toBe('few clouds')
    })

    it('should fall back to night slots when the day has no daytime slot', () => {
      const list = [
        makeItem(utc(15, 0), { id: 800, icon: '01n', description: 'clear sky', pod: 'n' }),
        makeItem(utc(15, 21), { id: 803, icon: '04n', description: 'broken clouds', pod: 'n' }),
      ]

      const [day] = aggregateDailyForecast(list, 0)

      expect(day.description).toBe('broken clouds') // 21:00 is closer to 13:00 than 00:00
      expect(day.theme.icon).toBe('overcast.png')
    })

    it('should label each day from its representative slot', () => {
      const list = [makeItem(utc(15, 12)), makeItem(utc(16, 12))]

      const result = aggregateDailyForecast(list, 0)

      expect(result.map((day) => day.dateLabel)).toEqual(['15 Thu', '16 Fri'])
    })

    it('should return at most 5 days', () => {
      const list = [15, 16, 17, 18, 19, 20, 21].map((day) => makeItem(utc(day, 12)))

      const result = aggregateDailyForecast(list, 0)

      expect(result).toHaveLength(5)
      expect(result[4].dateKey).toBe('2026-01-19')
    })
  })
})
