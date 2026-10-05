import { Box, Stack } from "@mui/material"
import { type WeatherHeadBarProps, WeatherHeaderBar } from "./WeatherHeaderBar"
import { type CurrentWeatherCardProps, CurrentWeatherCard } from "./CurrentWeatherCard"
import { ForecastCard } from './ForecastCard'
import { WeatherMetricsCard } from "./WeatherMetricsCard"
import { TemperatureTrendsCard } from "./TemperatureTrendsCard"
import type { AirQualityResponse, ForecastResponse } from "../types/weather"
import { type DailyForecastSummary, aggregateDailyForecast, getLocalDateKey } from '../utils/aggregateForecast'
import { getUsAqiKit } from "../utils/aqiConverter"
import { type WeatherThemeKit, getWeatherThemeKit } from '../utils/weatherThemes'

// === TYPES & INTERFACES ==================================================================

// Both prop types declare `units`, so the intersection keeps a single shared `units` prop
export type WeatherPanelProps = 
    WeatherHeadBarProps & 
    Omit<CurrentWeatherCardProps, "theme"> & 
    { aqiData: AirQualityResponse | null, forecastData: ForecastResponse | null }


// === COMPONENT: WEATHERPANEL =============================================================

export function WeatherPanel({
    weatherData,
    forecastData,
    aqiData,
    selectedCity,
    units,
    isFavorite,
    isFavoritesFull,
    onToggleFavorite,
    onToggleUnit
}: WeatherPanelProps) {
    // 1. VARIABLES
    // An air quality response can come back with an empty list: show the placeholder, not a fake reading
    const pm25 = aqiData?.list[0]?.components.pm2_5
    const aqiKit = pm25 !== undefined ? getUsAqiKit(pm25) : null
    let fourDayForecast: DailyForecastSummary[] | null = null
    const theme: WeatherThemeKit = getWeatherThemeKit(weatherData.weather[0].id, weatherData.weather[0].icon)
    
    // Pre-process forecast data
    if(forecastData) {
        const forecastDailySummaries: DailyForecastSummary[] = aggregateDailyForecast(
            forecastData.list,
            forecastData.city.timezone
        )

        // Remove the current day to avoid redundancy
        const todayKey: string = getLocalDateKey(weatherData.dt, weatherData.timezone)
        // Filter out today by date key match, then cap at 4 days
        fourDayForecast = forecastDailySummaries
            .filter((day) => day.dateKey !== todayKey)
            .slice(0,4)
    }

    // 2. RENDER
    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            p: 1,
            borderRadius: '15px',
            background: theme.theme.gradient // Gradients are images in CSS, so `backgroundColor` won't accept them
        }}>
            {/* HEADER BAR */}
            <WeatherHeaderBar
                isFavorite={isFavorite}
                onToggleFavorite={onToggleFavorite}
                units={units}
                onToggleUnit={onToggleUnit}
                isFavoritesFull={isFavoritesFull}
            />

            <Box sx={{
                display: 'flex',
                flexDirection: 'row',
                gap: 1,
                width: 1
            }}>
                {/* CURRENT WEATHER CARD */}
                {/* Wrapper Box since CurrentWeatherCard doesn't accept an `sx` prop */}
                <Box sx={{
                    flex: '3 1 0',          // 3 parts out of 5 = 60%
                    minWidth: 0,            // Allow shrinking below content width
                    display: 'flex',
                    '& > *': { flexGrow: 1 }, // Card fills the wrapper's width & height
                }}>
                    <CurrentWeatherCard
                        weatherData={weatherData}
                        theme={theme}
                        selectedCity={selectedCity}
                        units={units}
                    />
                </Box>

                <Stack sx={{
                    flex: '2 1 0',           // 2 parts out of 5 = 40%
                    minWidth: 0,             // Lets the Recharts chart shrink with the column
                    gap: 1,
                    '& > *': { flexGrow: 1 }, // Cards stretch to fill the column's height
                }}>
                    {/* WEATHER METRICS CARD */}
                    <WeatherMetricsCard 
                        humidity={weatherData.main.humidity}
                        wind={weatherData.wind.speed}
                        aqiData={aqiKit}
                        theme={theme}
                        units={units}
                    />

                    {/* TEMPERATURE TRENDS CARD */}
                    <TemperatureTrendsCard
                        forecastData={forecastData}
                        isThemeDark={theme.theme.isDark}
                        units={units}
                    />
                </Stack>
            </Box>

            {/* 5-DAY FORECAST */}
            {fourDayForecast && (
                <ForecastCard 
                    forecastList={fourDayForecast}
                    units={units}/>
            )}
        </Box>
    )
}
