import {
    Box,
    Card,
    Typography
} from '@mui/material'
import type { 
    CurrentWeatherResponse,
    GeocodingLocation,
    TemperatureUnit
} from '../types/weather'
import { formatLocalTime } from '../utils/formatLocalTime'
import { type WeatherThemeKit } from '../utils/weatherThemes'
import { getIconUrl } from '../utils/weatherIcons'

// === TYPES & INTERFACES ==================================================================

export interface CurrentWeatherCardProps {
    weatherData: CurrentWeatherResponse
    theme: WeatherThemeKit
    selectedCity: GeocodingLocation
    units: TemperatureUnit
}

// === COMPONENT: CURRENTWEATHERCARD =======================================================

export function CurrentWeatherCard ({
    weatherData,
    theme,
    selectedCity,
    units,
}: CurrentWeatherCardProps) {

    // 1. VARIABLES
    const currentDate: string = formatLocalTime(weatherData.timezone, 'day-long')
    const currentTime: string = formatLocalTime(weatherData.timezone, 'time')

    // 2. RENDER
    return (
        <Card sx={{
            p: 1,
            background: 'transparent', // Shorthand also clears MUI's dark-mode elevation overlay (a background-image)
            boxShadow: 'none',
            color: theme.theme.isDark ? '#fff' : '#000'
        }}>
            
            {/* DATE & LOCATION */}
            <Box 
                component="article" 
                id='current-date'
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
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
                    <Box 
                        id='weather-condition'
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1
                        }}
                    >
                        <Box 
                            component="img"
                            alt='weather icon'
                            src={getIconUrl(theme.icon)}
                            sx={{maxWidth: 250}}
                        />
                        <Typography variant='h5'>
                            {weatherData.weather[0].description}
                        </Typography>
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

        </Card>
    )
}
