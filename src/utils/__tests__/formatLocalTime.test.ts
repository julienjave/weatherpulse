import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatLocalTime } from '../formatLocalTime'

// Output must depend only on the city offset, never on the machine running the tests.
// TZ is pinned to a zone with DST so the regression test at the bottom is meaningful.
describe('formatLocalTime', () => {
  // Thursday 15 Jan 2026, 12:00 UTC
  const DT = Date.UTC(2026, 0, 15, 12, 0) / 1000

  beforeEach(() => {
    vi.stubEnv('TZ', 'Europe/Paris')
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(DT * 1000)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  describe('with an explicit timestamp', () => {
    it('should format the time in the city timezone, not the machine timezone', () => {
      expect(formatLocalTime(0, 'time', DT)).toMatch(/^12:00\sPM$/)
    })

    it.each([
      [36000, /^10:00\sPM$/], // UTC+10 (Sydney)
      [-18000, /^7:00\sAM$/], // UTC-5 (New York)
      [19800, /^5:30\sPM$/], // UTC+5:30 (Mumbai)
    ])('should apply a %i second offset', (offset, expected) => {
      expect(formatLocalTime(offset, 'time', DT)).toMatch(expected)
    })

    it('should format "day-short" as day number and short weekday', () => {
      expect(formatLocalTime(0, 'day-short', DT)).toBe('15 Thu')
    })

    it('should format "day-long" as long weekday, short month and day', () => {
      expect(formatLocalTime(0, 'day-long', DT)).toBe('Thursday, Jan 15')
    })

    it('should default to the "full" format', () => {
      expect(formatLocalTime(0, undefined, DT)).toMatch(/^Thursday, Jan 15, 12:00\sPM$/)
    })

    it('should roll over to the next day when the offset crosses midnight', () => {
      const lateEvening = Date.UTC(2026, 0, 15, 20, 0) / 1000
      expect(formatLocalTime(36000, 'day-short', lateEvening)).toBe('16 Fri')
    })

    it('should roll back to the previous day for negative offsets', () => {
      const earlyMorning = Date.UTC(2026, 0, 15, 2, 0) / 1000
      expect(formatLocalTime(-18000, 'day-long', earlyMorning)).toBe('Wednesday, Jan 14')
    })

    it('should treat a timestamp of 0 as a real timestamp, not as "now"', () => {
      expect(formatLocalTime(0, 'day-long', 0)).toBe('Thursday, Jan 01') // 1 Jan 1970
    })
  })

  describe('without a timestamp', () => {
    it('should format the current time in the city timezone', () => {
      expect(formatLocalTime(36000, 'time')).toMatch(/^10:00\sPM$/)
      expect(formatLocalTime(36000, 'day-long')).toBe('Thursday, Jan 15')
    })
  })

  // Regression: the machine's UTC offset used to be read from `now` rather than the target date, so a
  // DST change between now and `dt` (e.g. a forecast viewed days before the clocks change) shifted
  // every formatted time by one hour.
  it('should not shift times across a DST change on the machine', () => {
    vi.setSystemTime(Date.UTC(2026, 9, 22, 12, 0)) // 22 Oct 2026: Paris on summer time (UTC+2)
    const afterDstEnds = Date.UTC(2026, 9, 27, 12, 0) / 1000 // 27 Oct 2026: Paris back on UTC+1

    expect(formatLocalTime(0, 'time', afterDstEnds)).toMatch(/^12:00\sPM$/)
  })
})
