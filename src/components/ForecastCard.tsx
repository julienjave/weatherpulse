import {
    Box,
    Card,
    Typography
} from '@mui/material'
import type { 
    ForecastResponse,
    GeocodingLocation,
    TemperatureUnit
} from '../types/weather'
import { formatLocalTime } from '../utils/formatLocalTime'
import { type WeatherThemeKit, getWeatherThemeKit } from '../utils/weatherThemes'
import { getIconUrl } from '../utils/weatherIcons'

// === TYPES & INTERFACES ==================================================================

interface ForecastCardProps {
    
}

// === COMPONENT: FORECASTCARD =============================================================

export const ForecastCard = () => {

}