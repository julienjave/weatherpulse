import { Box } from "@mui/material"
import { type WeatherHeadBarProps, WeatherHeaderBar } from "./WeatherHeaderBar"
import { type CurrentWeatherCardProps, CurrentWeatherCard } from "./CurrentWeatherCard"
import type { AirQualityResponse } from "../types/weather"
import { WeatherMetricsCard } from "./WeatherMetricsCard"
import { TemperatureTrendsCard } from "./TemperatureTrendsCard"
import { getUsAqiKit } from "../utils/aqiConverter"

// === TYPES & INTERFACES ==================================================================

// Both prop types declare `units`, so the intersection keeps a single shared `units` prop
export type WeatherPanelProps = WeatherHeadBarProps & CurrentWeatherCardProps & { aqiData: AirQualityResponse | null }


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
    const aqiKit = aqiData ? getUsAqiKit(aqiData?.list[0].components.pm2_5) : null

    // 2. RENDER
    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* HEADER BAR */}
            <WeatherHeaderBar
                isFavorite={isFavorite}
                onToggleFavorite={onToggleFavorite}
                units={units}
                onToggleUnit={onToggleUnit}
                isFavoritesFull={isFavoritesFull}
            />

            {/* CURRENT WEATHER CARD */}
            <CurrentWeatherCard
                weatherData={weatherData}
                forecastData={forecastData}
                selectedCity={selectedCity}
                units={units}
            />

            {/* WEATHER METRICS CARD */}
            <WeatherMetricsCard 
                humidity={weatherData.main.humidity}
                wind={weatherData.wind.speed}
                aqiData={aqiKit}
                units={units}
            />

            {/* TEMPERATURE TRENDS CARD */}
            <TemperatureTrendsCard
                forecastData={forecastData}
                units={units}
            />
        </Box>
    )
}
