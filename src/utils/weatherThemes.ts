// === TYPES & INTERFACES ==========================================================================

export type WeatherThemeKey =
    | 'thunderstorm'
    | 'drizzle'
    | 'rain'
    | 'snow'
    | 'atmosphere'
    | 'clear-day'
    | 'clear-night'
    | 'clouds'

export interface WeatherTheme {
    key: WeatherThemeKey
    gradient: string
    isDark: boolean // Useful for adjusting typography/icon contrast over gradients
}

export interface WeatherThemeKit {
    theme: WeatherTheme
    icon: string
}


// === THEMES =======================================================================================

const THEMES: Record<WeatherThemeKey, WeatherTheme> = {
    'clear-day': {
        key: 'clear-day',
        gradient: 'linear-gradient(135deg, #2980b9 0%, #6dd5fa 50%, #ffffff 100%)',
        isDark: false
    },
    'clear-night': {
        key: 'clear-night',
        gradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
        isDark: true,
    },
    clouds: {
        key: 'clouds',
        gradient: 'linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)',
        isDark: true,
    },
    rain: {
        key: 'rain',
        gradient: 'linear-gradient(135deg, #373b44 0%, #4286f4 100%)',
        isDark: true,
    },
    drizzle: {
        key: 'drizzle',
        gradient: 'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)',
        isDark: true,
    },
    thunderstorm: {
        key: 'thunderstorm',
        gradient: 'linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)',
        isDark: true,
    },
    snow: {
        key: 'snow',
        gradient: 'linear-gradient(135deg, #83a4d4 0%, #b6fbff 100%)',
        isDark: false,
    },
    atmosphere: {
        key: 'atmosphere',
        gradient: 'linear-gradient(135deg, #3e5151 0%, #decba4 100%)',
        isDark: false,
    },
}


// === FUNCTIONS ===================================================================================

// --- GET THEMES ---
/**
 * Maps OpenWeatherMap condition code and icon string to a UI background theme.
 * 
 * @param conditionId - OpenWeatherMap numeric weather condition code (e.g., 800)
 * @param iconCode - OpenWeatherMap icon code (e.g., '01d' for day, '01n' for night)
 * @returns WeatherTheme object containing gradient and contrast metadata
 */
export function getWeatherTheme(conditionId: number, iconCode?: string): WeatherTheme {
    const isNight = iconCode?.endsWith('n')

    // 1. Thunderstorm (2xx)
    if(conditionId>=200 && conditionId<300) return THEMES.thunderstorm

    // 2. Drizzle (3xx)
    if(conditionId>=300 && conditionId<400) return THEMES.drizzle

    // 3. Rain (5xx)
    if(conditionId>=500 && conditionId<600) return THEMES.rain

    // 4. Snow (6xx)
    if(conditionId>=600 && conditionId<700) return THEMES.snow

    // 5. Atmosphere (7xx)
    if(conditionId>=700 && conditionId<800) return THEMES.atmosphere

    // 6. Clear (800)
    if(conditionId === 800) return isNight ? THEMES["clear-night"] : THEMES["clear-day"]

    // 7. Clouds (80x)
    if(conditionId>800 && conditionId<810) return THEMES.clouds

    // Default fallback
    return isNight ? THEMES["clear-night"] : THEMES["clear-day"] 
}


// --- GET ICONS ---

/**
 * Maps OpenWeatherMap condition code and icon string to a UI Weather icon.
 * 
 * @param conditionId - OpenWeatherMap numeric weather condition code (e.g., 800)
 * @param iconCode - OpenWeatherMap icon code (e.g., '01d' for day, '01n' for night)
 * @returns String containing weather icon name
 */
export function getWeatherIcon(conditionId: number, iconCode?: string): string {
    const isNight = iconCode?.endsWith('n')

    // 1. Clear
    if(conditionId === 800) return isNight ? 'clear-night.svg' : 'clear-day.svg'

    // 2. Partial Clouds
    if(conditionId === 801) return isNight ? 'partly-cloudy-night.svg' : 'partly-cloudy-day.svg'

    // 3. Broken / Scattered Clouds
    if(conditionId === 802) return isNight ? 'cloudy-night.svg' : 'cloudy-day.svg'

    // 4. Overcast / Cloudy
    if(conditionId>=803 && conditionId<810) return isNight ? 'clear-night.svg' : 'clear-day.svg'

    // 5. Drizzle
    if(conditionId>=300 && conditionId<400) return isNight ? 'drizzle-night.svg' : 'drizzle-day.svg'

    // 6. Light Rain
    if(conditionId === 500 || conditionId === 520) return isNight ? 'light-rain-night.svg' : 'light-rain-day.svg'

    // 7. Rain
    if(conditionId === 501 || conditionId === 521) return isNight ? 'rain-night.svg' : 'rain-day.svg'

    // 8. Heavy Rain / Downpour
    if(
        (conditionId>501 && conditionId<511) ||
        (conditionId>521 && conditionId<600)
    ) return isNight ? 'heavy-rain-night.svg' : 'heavy-rain-day.svg'

    // 9. Light Snow
    if(conditionId === 600 || conditionId === 620) return isNight ? 'light-snow-night.svg' : 'light-snow-day.svg'

    // 10. Snow
    if(conditionId === 601 || conditionId === 621) return isNight ? 'snow-night.svg' : 'snow-day.svg'

    // 11. Heavy Snow
    if(conditionId === 602 || conditionId === 622) return isNight ? 'heavy-snow-night.svg' : 'heavy-snow-day.svg'

    // 12. Sleet / Freezing Rain
    if(
        conditionId === 511 ||
        (conditionId>=611 && conditionId<620)
    ) return isNight ? 'sleet-night.svg' : 'sleet-day.svg'

    // 13. Mist / Fog / Haze
    if(conditionId>=700 && conditionId<771) return isNight ? 'fog-night.svg' : 'fog-day.svg'

    // 14. Thunderstorm
    if(conditionId === 210 || conditionId === 211) return isNight ? 'thunderstorm-night.svg' : 'thunderstorm-day.svg'

    // 15. Heavy Thunderstorm
    if(conditionId === 212 || conditionId === 221) return isNight ? 'heavy-thunderstorm-night.svg' : 'heavy-thunderstorm-day.svg'

    // 16. Thunderstorm + Rain
    if(
        (conditionId>=200 && conditionId<210) ||
        (conditionId>=230 && conditionId<300)
    ) return isNight ? 'rain-thunderstorm-night.svg' : 'rain-thunderstorm-day.svg'

    // 17. Tornado / Squall
    if(conditionId === 771 || conditionId === 781) return isNight ? 'tornado-night.svg' : 'tornado-day.svg'

    // Fallback Clear Day / Night
    return isNight ? 'clear-night.svg' : 'clear-day.svg'
}


// --- GET WEATHER THEME KIT ---

/**
 * Maps OpenWeatherMap condition code and icon string to a UI theme kit.
 * 
 * @param conditionId - OpenWeatherMap numeric weather condition code (e.g., 800)
 * @param iconCode - OpenWeatherMap icon code (e.g., '01d' for day, '01n' for night)
 * @returns WeatherThemeKit object containing gradient and contrast metadata, plus the weather icon
 */
export function getWeatherThemeKit(conditionId: number, iconCode?: string): WeatherThemeKit {
    return ({
        theme: getWeatherTheme(conditionId, iconCode),
        icon: getWeatherIcon(conditionId, iconCode)
    })
}