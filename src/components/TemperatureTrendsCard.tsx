import { Box, Paper, Typography, useTheme } from "@mui/material"
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    type TooltipContentProps
} from "recharts"
import type { ForecastResponse, TemperatureUnit } from "../types/weather"
import { type HourlyTrendPoint, getHourlyTrend } from "../utils/hourlyForecast"
import { glassSx } from '../utils/glassStyles'


// === TYPES & INTERFACES ==================================================================

interface TemperatureTrendsCardProps {
    forecastData: ForecastResponse | null
    isThemeDark: boolean
    units: TemperatureUnit
}


// === CONSTANTS ===========================================================================

// Explicit chart height so ResponsiveContainer never measures a 0px / growing parent
const CHART_HEIGHT = 240
const GRADIENT_ID = 'temperature-trend-fill'


// === SUB-COMPONENT: TOOLTIP ==============================================================

function TrendTooltip({
    active,
    payload,
    unitSymbol
}: Partial<TooltipContentProps> & { unitSymbol: string }) {
    if (!active || !payload?.length) return null
    const point = payload[0].payload as HourlyTrendPoint

    return (
        <Paper elevation={4} sx={{ px: 1.5, py: 1 }}>
            <Typography variant="h6" component="p">{`${point.temp}${unitSymbol}`}</Typography>
            <Typography variant="body2" color="text.secondary">{point.timeLabel}</Typography>
            <Typography variant="body2" color="text.secondary">{`Feels like ${point.feelsLike}${unitSymbol}`}</Typography>
            <Typography variant="body2" color="text.secondary">{`${point.pop}% chance of rain`}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                {point.description}
            </Typography>
        </Paper>
    )
}


// === COMPONENT: TEMPERATURETRENDSCARD ====================================================

export function TemperatureTrendsCard({
    forecastData,
    isThemeDark,
    units
}: TemperatureTrendsCardProps) {
    // 1. VARIABLES
    const theme = useTheme()
    const unitSymbol = `°${units === 'metric' ? 'C' : 'F'}`
    const hourlyTrend: HourlyTrendPoint[] = forecastData
        ? getHourlyTrend(forecastData.list, forecastData.city.timezone)
        : []

    const seriesColor = isThemeDark ? '#fff' : theme.palette.primary.main
    const axisColor = isThemeDark ? '#fff' : theme.palette.text.secondary

    // 2. RENDER
    return (
        <Paper sx={{ ...glassSx, p: 2 }}>
            <Typography 
                variant="h6" 
                component="h2"
                sx={{
                    color: isThemeDark ? '#fff' : '#000'
                }}
            >Next 24 Hours</Typography>

            {hourlyTrend.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 2 }}> - No Forecast Data - </Typography>
            ) : (
                <Box sx={{ width: '100%', height: CHART_HEIGHT, mt: 1 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={hourlyTrend} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                            <defs>
                                <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={seriesColor} stopOpacity={0.25} />
                                    <stop offset="100%" stopColor={seriesColor} stopOpacity={0.02} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid vertical={false} stroke={theme.palette.divider} />

                            <XAxis
                                dataKey="timeLabel"
                                tick={{ fill: axisColor, fontSize: 12 }}
                                tickLine={false}
                                axisLine={{ stroke: theme.palette.divider }}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                domain={['dataMin - 2', 'dataMax + 2']}
                                allowDecimals={false}
                                tickFormatter={(value: number) => `${Math.round(value)}°`}
                                tick={{ fill: axisColor, fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                            />

                            <Tooltip
                                content={(props) => <TrendTooltip {...props} unitSymbol={unitSymbol} />}
                                cursor={{ stroke: axisColor, strokeWidth: 1 }}
                            />

                            <Area
                                type="monotone"
                                dataKey="temp"
                                name="Temperature"
                                baseValue="dataMin"
                                stroke={seriesColor}
                                strokeWidth={2}
                                fill={`url(#${GRADIENT_ID})`}
                                dot={{ r: 3, fill: seriesColor, strokeWidth: 0 }}
                                activeDot={{ r: 5, fill: seriesColor, stroke: theme.palette.background.paper, strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </Box>
            )}
        </Paper>
    )
}
