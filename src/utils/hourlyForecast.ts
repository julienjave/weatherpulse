import type { ForecastItem } from "../types/weather"
import { formatLocalTime } from "./formatLocalTime"


// === TYPES & INTERFACES ==================================================================

export interface HourlyTrendPoint {
    dt: number
    timeLabel: string // "3:00 PM" in city-local time
    temp: number
    feelsLike: number
    pop: number // Probability of precipitation as a percentage (0 to 100)
    description: string
}


// === CONSTANTS ===========================================================================

// The free forecast endpoint returns 3-hour slots, so 9 points span a full 24 hours
export const HOURLY_TREND_POINTS = 9


// === UTILITY FUNCTION ====================================================================

export function getHourlyTrend(
    list: ForecastItem[],
    cityTimezoneOffset: number,
    count: number = HOURLY_TREND_POINTS
): HourlyTrendPoint[] {
    return list.slice(0, count).map((item) => ({
        dt: item.dt,
        timeLabel: formatLocalTime(cityTimezoneOffset, 'time', item.dt),
        temp: Math.round(item.main.temp),
        feelsLike: Math.round(item.main.feels_like),
        pop: Math.round(item.pop * 100),
        description: item.weather[0]?.description ?? ''
    }))
}
