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

export function getLocalHour(dtSeconds: number, timezoneOffsetSeconds: number): number {
    // Same UTC-shift trick as above, so getUTCHours() returns the city-local hour
    return new Date((dtSeconds + timezoneOffsetSeconds) * 1000).getUTCHours()
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

        // Pick a representative mid-day entry (closest to 13:00 local) for the icon/description
        // Prefer daytime slots so partial days don't fall on a night slot
        const daytimeItems = dayItems.filter((i) => i.sys.pod === 'd')
        const candidates = daytimeItems.length > 0 ? daytimeItems : dayItems
        const distanceToMidday = (i: ForecastItem) => Math.abs(getLocalHour(i.dt, cityTimezoneOffset) - 13)
        const representativeItem = candidates.reduce((best, i) =>
            distanceToMidday(i) < distanceToMidday(best) ? i : best
        )

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