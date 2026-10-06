// === TYPES & INTERFACES ==========================================================================

export type WeatherThemeKey =
    | 'thunderstorm'
    | 'drizzle'
    | 'rain'
    | 'snow'
    | 'atmosphere'
    | 'clear-day'
    | 'clear-night'
    | 'partly-cloudy'
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
        gradient: 'linear-gradient(135deg, #419cd8 0%, #6dd5fa 50%, #ffffff 100%)',
        isDark: false
    },
    'clear-night': {
        key: 'clear-night',
        gradient: 'linear-gradient(135deg, #151941 0%, #292657 50%, #192066 100%)',
        isDark: true,
    },
    'partly-cloudy': {
        key: 'partly-cloudy',
        gradient: 'linear-gradient(135deg, #6a9fd8 0%, #b8cfe4 55%, #e6edf3 100%)',
        isDark: false,
    },
    clouds: {
        key: 'clouds',
        gradient: 'linear-gradient(135deg, #8c8f96 0%, #aab3c9 100%)',
        isDark: false,
    },
    rain: {
        key: 'rain',
        gradient: 'linear-gradient(135deg, #6c7791 0%, #5d769d 100%)',
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

    // 7. Few / Scattered Clouds (801-802) - mostly sunny by day, so keep it light
    if(conditionId === 801 || conditionId === 802) return isNight ? THEMES.clouds : THEMES['partly-cloudy']

    // 8. Broken Clouds / Overcast (803+)
    if(conditionId>802 && conditionId<810) return THEMES.clouds

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
    if(conditionId === 800) return isNight ? 'clear-night.png' : 'clear-day.png'

    // 2. Partial Clouds
    if(conditionId === 801) return isNight ? 'partly-cloudy-night.png' : 'partly-cloudy-day.png'

    // 3. Broken / Scattered Clouds
    if(conditionId === 802) return 'cloudy.png'

    // 4. Overcast / Cloudy
    if(conditionId>=803 && conditionId<810) return 'overcast.png'

    // 5. Drizzle
    if(conditionId>=300 && conditionId<400) return 'drizzle.png'

    // 6. Light Rain
    if(conditionId === 500 || conditionId === 520) return 'light-rain.png'

    // 7. Rain
    if(conditionId === 501 || conditionId === 521) return 'rain.png'

    // 8. Heavy Rain / Downpour
    if(
        (conditionId>501 && conditionId<511) ||
        (conditionId>521 && conditionId<600)
    ) return 'heavy-rain.png'

    // 9. Light Snow
    if(conditionId === 600 || conditionId === 620) return 'light-snow.png'

    // 10. Snow
    if(conditionId === 601 || conditionId === 621) return 'snow.png'

    // 11. Heavy Snow
    if(conditionId === 602 || conditionId === 622) return 'heavy-snow.png'

    // 12. Sleet / Freezing Rain
    if(
        conditionId === 511 ||
        (conditionId>=611 && conditionId<620)
    ) return 'sleet.png'

    // 13. Mist / Fog / Haze
    if(conditionId>=700 && conditionId<771) return 'fog.png'

    // 14. Thunderstorm
    if(conditionId === 210 || conditionId === 211) return 'thunderstorm.png'

    // 15. Heavy Thunderstorm
    if(conditionId === 212 || conditionId === 221) return 'heavy-thunderstorm.png'

    // 16. Thunderstorm + Rain
    if(
        (conditionId>=200 && conditionId<210) ||
        (conditionId>=230 && conditionId<300)
    ) return 'rain-thunderstorm.png'

    // 17. Tornado / Squall
    if(conditionId === 771 || conditionId === 781) return 'tornado.png'

    // Fallback Clear Day / Night
    return isNight ? 'clear-night.png' : 'clear-day.png'
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