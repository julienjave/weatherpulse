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

export function getWeatherIcon(conditionId: number): string {
    // 1. Clear

    // 2. Partial Clouds

    // 3. Broken / Scattered Clouds

    // 4. Overcast / Cloudy

    // 5. Drizzle

    // 6. Light Rain

    // 7. Rain

    // 8. Heavy Rain / Downpour

    // 9. Light Snow

    // 10. Snow

    // 11. Heavy Snow

    // 12. Sleet / Freezing Rain

    // 13. Mist / Fog / Haze

    // 14. Thunderstorm

    // 15. Heavy Thunderstorm

    // 16. Thunderstorm + Rain

    // 17. Wind / Tornado / Squall
}