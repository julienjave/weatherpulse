import { Paper, Typography, Stack, Box, Tooltip } from "@mui/material"
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import AirIcon from '@mui/icons-material/Air'
import EmojiNatureIcon from '@mui/icons-material/EmojiNature'
import type { TemperatureUnit } from "../types/weather"
import type { UsAqiResult } from "../utils/aqiConverter"
import { glassSx } from '../utils/glassStyles'
import type { WeatherThemeKit } from "../utils/weatherThemes"
import { AnimatedText } from "./AnimatedText"


// === TYPES & INTERFACES ==================================================================

interface WeatherMetricsCardProps {
    humidity: number
    wind: number 
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
                            <WaterDropIcon sx={{ fill: theme.theme.isDark ? '#00aaff' : '#009ae6' }} />
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
                            <AirIcon sx={{ fill: theme.theme.isDark ? '#b3e3fb' : '#6a8c9c' }} />
                        </span>
                    </Tooltip>
                    <Typography
                        sx={{
                            color: theme.theme.isDark ? '#fff' : '#000'
                        }}
                    >
                        <AnimatedText text={`${wind}${units==='metric' ? 'm/s':'mph'}`} />
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
                            <EmojiNatureIcon sx={{ fill: theme.theme.isDark ? '#22f02c' : '#09900f' }} />
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
                            <Typography sx={{ color: aqiData.color }}>
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