import { Paper, Typography, Stack, Box, Tooltip } from "@mui/material"
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import AirIcon from '@mui/icons-material/Air'
import EmojiNatureIcon from '@mui/icons-material/EmojiNature'
import type { TemperatureUnit } from "../types/weather"
import type { UsAqiResult } from "../utils/aqiConverter"
import { glassSx } from '../utils/glassStyles'
import type { WeatherThemeKit } from "../utils/weatherThemes"


// === TYPES & INTERFACES ==================================================================

interface WeatherMetricsCardProps {
    humidity: Number
    wind: Number 
    aqiData: UsAqiResult | null
    theme: WeatherThemeKit
    units: TemperatureUnit
}

// === COMPONENT: WEATHERMETRICSCARD ========================================================

export function WeatherMetricsCard({
    humidity,
    wind,
    aqiData,
    theme,
    units='metric'
}: WeatherMetricsCardProps) {
    // RENDER
    return (
        <Paper sx={glassSx}>
            <Stack sx={{ gap: 1, p: 1 }}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 1
                }}>
                    <Tooltip title="Humidity">
                        <span>
                            <WaterDropIcon />
                        </span>
                    </Tooltip>
                    <Typography
                        sx={{
                            color: theme.theme.isDark ? '#fff' : '#000'
                        }}
                    >
                        {`${humidity}%`}
                    </Typography>
                </Box>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 1
                }}>
                    <Tooltip title="Wind">
                        <span>
                            <AirIcon />
                        </span>
                    </Tooltip>
                    <Typography
                        sx={{
                            color: theme.theme.isDark ? '#fff' : '#000'
                        }}
                    >
                        {`${wind}${units==='metric' ? 'm/s':'mph'}`}
                    </Typography>
                </Box>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 1
                }}>
                    <Tooltip title="Air Quality Index">
                        <span>
                            <EmojiNatureIcon />
                        </span>
                    </Tooltip>
                    { aqiData ? (
                        <Box sx={{
                            backgroundColor: `${aqiData.background}`,
                            border: 1,
                            borderColor: `${aqiData.color}`,
                            borderRadius: '30px',
                            px: 1,
                            py: 0.5
                        }}>
                            <Typography sx={{ color: `${aqiData}` }}>
                                {`${aqiData.aqi} - ${aqiData.label}`}
                            </Typography>
                        </Box>
                    ) : (
                        <Typography
                            sx={{
                                color: theme.theme.isDark ? '#fff' : '#000'
                            }}
                        >
                             - No Data -
                        </Typography>
                    )}
                </Box>
            </Stack>
        </Paper>
    )
}