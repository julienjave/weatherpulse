import {
    Box,
    Card,
    Typography
} from '@mui/material'
import type { 
    CurrentWeatherResponse,
    ForecastResponse,
    AirQualityResponse,
    GeocodingLocation,
    TemperatureUnit
} from '../types/weather'
import { formatLocalTime } from '../utils/formatLocalTime'
import { type WeatherThemeKit, getWeatherThemeKit } from '../utils/weatherThemes'
import { getIconUrl } from '../utils/weatherIcons'

// === TYPES & INTERFACES ==================================================================

interface CurrentWeatherCardProps {
    weatherData: CurrentWeatherResponse
    forecastData: ForecastResponse | null
    aqiData: AirQualityResponse | null
    selectedCity: GeocodingLocation
    units: TemperatureUnit
    isWeatherLoading?: boolean
    weatherError?: string | null
}

// === COMPONENT: CURRENTWEATHERCARD =======================================================

export const CurrentWeatherCard: React.FC<CurrentWeatherCardProps> = ({
    weatherData,
    forecastData,
    aqiData,
    selectedCity,
    units,
    isWeatherLoading,
    weatherError
}) => {

    // 1. VARIABLES
    const currentDate: string = formatLocalTime(weatherData.timezone, 'day-long')
    const currentTime: string = formatLocalTime(weatherData.timezone, 'time')
    const theme: WeatherThemeKit = getWeatherThemeKit(weatherData.weather[0].id, weatherData.weather[0].icon)

    // 2. HOOKS

    // 3. HANDLERS

    // 4. RENDER
    return (
        <Card>
            
            {/* DATE & LOCATION */}
            <Box component="article" id='current-date'>
                <Typography variant='h3'>Today</Typography>
                <Typography variant='h4'>{currentDate}</Typography>
                <Typography variant='h4'>{currentTime}</Typography>
                <Typography variant='h5'>{selectedCity?.name}{selectedCity?.country ? `, ${selectedCity.country}` : ''}</Typography>
            </Box>

            {/* WEATHER DATA */}
            {weatherData && (
                <Box 
                    component="article" 
                    id='weather-data'
                    sx={{
                        display: 'flex', 
                        flexDirection: 'row', 
                        justifyContent: 'center',
                        alignItems: 'center', 
                        gap: 5
                    }}
                >
                    {/* Conditions */}
                    <Box id='weather-condition'>
                        <Box 
                            component="img"
                            alt='weather icon'
                            src={getIconUrl(theme.icon)}
                            sx={{maxWidth: 250}}
                        />
                        <Typography variant='h5'>{weatherData.weather[0].description}</Typography>
                    </Box>

                    {/* Temperatures */}
                    <Box id='weather-temp'>
                        <Typography sx={{fontSize: '4rem'}}>
                            {`${Math.round(weatherData.main.temp)}°${units === 'metric' ? 'C' : 'F'}`}
                        </Typography>
                        <Box 
                            id='weather-feels-like'
                            sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 2
                            }}
                        >
                            <Typography sx={{fontSize: '4rem'}}>(</Typography>
                            <Box id='weather-feels-like-temp'>
                                <Typography variant='body1'>Feels like</Typography>
                                <Typography variant='h4'>
                                    {`${Math.round(weatherData.main.feels_like)}°${units === 'metric' ? 'C' : 'F'}`}
                                </Typography>
                            </Box>
                            <Typography sx={{fontSize: '4rem'}}>)</Typography>
                        </Box>
                    </Box>
                </Box>   
            )}

            {/* 5-DAY FORECAST */}

        </Card>
    )
}
