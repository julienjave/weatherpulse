import {
    Box,
    Card,
    Typography
} from '@mui/material'
import { ForecastCard } from './ForecastCard'
import type { 
    CurrentWeatherResponse,
    ForecastResponse,
    GeocodingLocation,
    TemperatureUnit
} from '../types/weather'
import { formatLocalTime } from '../utils/formatLocalTime'
import { type DailyForecastSummary, aggregateDailyForecast, getLocalDateKey } from '../utils/aggregateForecast'
import { type WeatherThemeKit, getWeatherThemeKit } from '../utils/weatherThemes'
import { getIconUrl } from '../utils/weatherIcons'

// === TYPES & INTERFACES ==================================================================

export interface CurrentWeatherCardProps {
    weatherData: CurrentWeatherResponse
    forecastData: ForecastResponse | null
    selectedCity: GeocodingLocation
    units: TemperatureUnit
}

// === COMPONENT: CURRENTWEATHERCARD =======================================================

export function CurrentWeatherCard ({
    weatherData,
    forecastData,
    selectedCity,
    units,
}: CurrentWeatherCardProps) {

    // 1. VARIABLES
    const currentDate: string = formatLocalTime(weatherData.timezone, 'day-long')
    const currentTime: string = formatLocalTime(weatherData.timezone, 'time')
    const theme: WeatherThemeKit = getWeatherThemeKit(weatherData.weather[0].id, weatherData.weather[0].icon)
    let fourDayForecast: DailyForecastSummary[] | null = null

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
        <Card sx={{ p: 1 }}>
            
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
            {fourDayForecast && (
                <ForecastCard forecastList={fourDayForecast} units={units}/>
            )}

        </Card>
    )
}
