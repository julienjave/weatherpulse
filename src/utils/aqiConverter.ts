// === TYPES & INTERFACES ==========================================================================

export interface UsAqiResult {
    aqi: number // Index value
    label: string // e.g. 'Moderate'
    color: string // Text color for the badge
    background: string // Background linear gradient for the badge background
}

interface AqiBreakPoint {
    cLow: number
    cHigh: number
    iLow: number
    iHigh: number
    label: string
    color: string
    background: string
}


// === BREAKPOINTS ===================================================================================

const EPA_BREAKPOINTS: AqiBreakPoint[] = [
    { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50, label: 'Good', color: '#000', background: '#00e400' },
    { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100, label: 'Moderate', color: '#000', background: '#ffff00' },
    { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150, label: 'Unhealthy for Sensitive Groups', color: '#000', background: '#ff7e00' },
    { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200, label: 'Unhealthy', color: '#fff', background: '#ff0000' },
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300, label: 'Very Unhealthy', color: '#fff', background: '#8f3f97' },
    { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500, label: 'Hazardous', color: '#fff', background: '#7e0023' },
]


// === CONVERTER =====================================================================================

/**
 * Converts PM2.5 concentration (ug/m3) from OpenWeatherMap into standard US EPA AQI (0-500 scale).
 * 
 * @param pm25 - Fine particulate matter concentration in ug/m3
 * @returns UsAqiResult object containing AQI score, human-readable label, and indicator color for text and background
 */
export function getUsAqiKit(pm25: number): UsAqiResult {
    // Clamp negative numbers to 0, and extreme values to 500.4
    let clampedPm25 = Math.min(Math.max(0, pm25), 500.4)

    // EPA guidance is to truncate to one decimal first
    clampedPm25 = Number(clampedPm25.toFixed(1))

    // Find matching breakpoint range
    const range = EPA_BREAKPOINTS.find(
        (b) => clampedPm25 >= b.cLow && clampedPm25 <= b.cHigh
    ) || EPA_BREAKPOINTS[EPA_BREAKPOINTS.length - 1] // Default to highest range if extreme

    // Linear Interpolation Formula
    const aqi = Math.round(
        ((range.iHigh - range.iLow) / (range.cHigh - range.cLow)) * (clampedPm25 - range.cLow) + range.iLow
    )

    return {
        aqi,
        label: range.label,
        color: range.color,
        background: range.background
    }
}