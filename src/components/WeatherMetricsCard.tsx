import { Paper, Typography, Stack, Box, Tooltip } from "@mui/material"
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import AirIcon from '@mui/icons-material/Air'
import EmojiNatureIcon from '@mui/icons-material/EmojiNature'
import type { TemperatureUnit } from "../types/weather"
import type { UsAqiResult } from "../utils/aqiConverter"


// === TYPES & INTERFACES ==================================================================

interface WeatherMetricsCardProps {
    humidity: Number
    wind: Number 
    aqiData: UsAqiResult | null
    units: TemperatureUnit
}

// === COMPONENT: WEATHERMETRICSCARD ========================================================

export function WeatherMetricsCard({
    humidity,
    wind,
    aqiData,
    units='metric'
}: WeatherMetricsCardProps) {
    // RENDER
    return (
        <Paper elevation={3}>
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
                    <Typography>{`${humidity}%`}</Typography>
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
                    <Typography>{`${wind}${units==='metric' ? 'm/s':'mph'}`}</Typography>
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
                        <Typography> - No Data -</Typography>
                    )}
                </Box>
            </Stack>
        </Paper>
    )
}