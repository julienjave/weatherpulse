import {
    Box,
    Paper,
    Typography
} from '@mui/material'
import type { TemperatureUnit } from '../types/weather'
import { type DailyForecastSummary } from '../utils/aggregateForecast'
import { getIconUrl } from '../utils/weatherIcons'
import { glassSx } from '../utils/glassStyles'

// === TYPES & INTERFACES ==================================================================

interface ForecastCardProps {
    forecastList: DailyForecastSummary[]
    units: TemperatureUnit
}

// === COMPONENT: FORECASTCARD =============================================================

export function ForecastCard({ forecastList, units }: ForecastCardProps) {

    return (
        <Paper sx={glassSx}>
            <Box 
                id="forecast-grid"
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: 'repeat(2, 1fr)',
                        sm: 'repeat(4, 1fr)'
                    },
                    gap: 1,
                    alignItems: 'stretch',
                    m: 1,
                    p: 1
                }}
            >
                {forecastList.map((dailySummary: DailyForecastSummary) => (
                    <Box
                        key={dailySummary.dateKey}
                        sx={{
                            minWidth: 0, // Grid items stretch to fill their cell by default; this lets 1fr columns shrink instead of overflowing
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 1,
                            borderRadius: 2,
                            background: dailySummary.theme.theme.gradient, // Gradients are images in CSS, so `backgroundColor` won't accept them
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 8px rgba(0, 0, 0, 0.15)',
                            opacity: 0.9 // Let the glass panel show through slightly
                        }}
                    >
                        <Typography 
                            sx={{ 
                                fontSize: '0.9rem', 
                                fontWeight: 'bold',
                                color: dailySummary.theme.theme.isDark ? '#fff' : '#000' 
                            }}
                        >
                            {dailySummary.dateLabel}
                        </Typography>
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
                                    sx={{ 
                                        fontSize: '0.8rem',
                                        color: dailySummary.theme.theme.isDark ? '#ffcaca' : '#c62828'
                                     }}
                                >
                                    {`High: ${dailySummary.tempMax}°${units === 'metric' ? 'C' : 'F'}`}
                                </Typography>
                                <Typography 
                                    sx={{ 
                                        fontSize: '0.8rem',
                                        color: dailySummary.theme.theme.isDark ? '#80caff' : '#0d47a1'
                                    }}
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