import { Box } from "@mui/material"
import { type WeatherHeadBarProps, WeatherHeaderBar } from "./WeatherHeaderBar"
import { type CurrentWeatherCardProps, CurrentWeatherCard } from "./CurrentWeatherCard"

// === TYPES & INTERFACES ==================================================================

// Both prop types declare `units`, so the intersection keeps a single shared `units` prop
export type WeatherPanelProps = WeatherHeadBarProps & CurrentWeatherCardProps


// === COMPONENT: WEATHERPANEL =============================================================

export function WeatherPanel({
    weatherData,
    forecastData,
    selectedCity,
    units,
    isFavorite,
    isFavoritesFull,
    onToggleFavorite,
    onToggleUnit
}: WeatherPanelProps) {

    // RENDER
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
        </Box>
    )
}
