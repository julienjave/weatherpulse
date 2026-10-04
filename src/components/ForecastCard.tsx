import {
    Box,
    Paper,
    Typography
} from '@mui/material'
import type { TemperatureUnit } from '../types/weather'
import { type DailyForecastSummary } from '../utils/aggregateForecast'
import { getIconUrl } from '../utils/weatherIcons'

// === TYPES & INTERFACES ==================================================================

interface ForecastCardProps {
    forecastList: DailyForecastSummary[]
    units: TemperatureUnit
}

// === COMPONENT: FORECASTCARD =============================================================

export function ForecastCard({ forecastList, units }: ForecastCardProps) {

    return (
        <Paper>
            <Box 
                id="forecast-grid"
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    m: 1,
                    p:1
                }}
            >
                {forecastList.map((dailySummary: DailyForecastSummary) => (
                    <Box key={dailySummary.dateKey}>
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{dailySummary.dateLabel}</Typography>
                        <Box 
                            id={`forecast-${dailySummary.dateKey}-data`}
                            sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1,
                                mx: 1,
                                p: 1
                            }}
                        >
                            <Box 
                                component="img" 
                                alt='weather icon' 
                                src={getIconUrl(dailySummary.theme.icon)}
                                sx={{ maxWidth: 50 }} 
                            />
                            <Box>
                                <Typography 
                                    sx={{ fontSize: '0.8rem' }}
                                >
                                    {`High: ${dailySummary.tempMax}°${units === 'metric' ? 'C' : 'F'}`}
                                </Typography>
                                <Typography 
                                    sx={{ fontSize: '0.8rem' }}
                                >
                                    {`Low: ${dailySummary.tempMin}°${units === 'metric' ? 'C' : 'F'}`}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                ))}
            </Box>
        </Paper>
    )
}