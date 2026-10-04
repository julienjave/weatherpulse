import type { ForecastItem } from "../types/weather"
import { formatLocalTime } from "./formatLocalTime"
import { getWeatherThemeKit, type WeatherThemeKit } from "./weatherThemes"


// === TYPES & INTERFACES ==================================================================

export interface DailyForecastSummary {
  dateKey: string // "2026-10-04"
  dateLabel: string // "Mon" or "Oct 4"
  tempMax: number
  tempMin: number
  description: string
  theme: WeatherThemeKit
}


// === HELPER FUNCTION ====================================================================

export function getLocalDateKey(dtSeconds: number, timezoneOffsetSeconds: number): string {
    // Convert target time to UTC milliseconds, then shift by city offset
    const cityTimestamp = (dtSeconds + timezoneOffsetSeconds) * 1000
    const cityDate = new Date(cityTimestamp)

    // Returns YYYY-MM-DD in UTC coordinates so timezone doesn't mess it up
    return cityDate.toISOString().split('T')[0]
}


// === UTILITY FUNCTION ====================================================================

export function aggregateDailyForecast(
    list: ForecastItem[],
    cityTimezoneOffset: number
): DailyForecastSummary[] {
    const grouped: Record<string, ForecastItem[]> = {}

    // 1. Group items by city-local YYYY-MM-DD key
    list.forEach((item) => {
        const key = getLocalDateKey(item.dt, cityTimezoneOffset)
        if (!grouped[key]) {
        grouped[key] = []
        }
        grouped[key].push(item)
    })

    // 2. Aggregate each day (take up to 5 days)
    return Object.keys(grouped)
    .slice(0, 5)
    .map((dateKey) => {
        const dayItems = grouped[dateKey]

        // Extract high and low across all 3-hour slots for this day
        const maxTemp = Math.max(...dayItems.map((i) => i.main.temp_max))
        const minTemp = Math.min(...dayItems.map((i) => i.main.temp_min))

        // Pick a representative mid-day entry (around 12:00-15:00) for the icon/description
        // If mid-day slot isn't in array (e.g., today's partial data), fall back to middle element
        const midIndex = Math.floor(dayItems.length / 2)
        const representativeItem = dayItems[midIndex]

        // Format date label for UI display
        const dateLabel = formatLocalTime(cityTimezoneOffset, 'day-short', representativeItem.dt)

        // Get theme and icon
        const theme = getWeatherThemeKit(representativeItem.weather[0].id, representativeItem.weather[0].icon)

        return {
            dateKey,
            dateLabel,
            tempMax: Math.round(maxTemp),
            tempMin: Math.round(minTemp),
            description: representativeItem.weather[0].description,
            theme
        }
    })
}