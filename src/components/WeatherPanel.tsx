import { Box, Stack } from "@mui/material"
import { motion } from "motion/react"
import { type WeatherHeadBarProps, WeatherHeaderBar } from "./WeatherHeaderBar"
import { type CurrentWeatherCardProps, CurrentWeatherCard } from "./CurrentWeatherCard"
import { ForecastCard } from './ForecastCard'
import { WeatherMetricsCard } from "./WeatherMetricsCard"
import { TemperatureTrendsCard } from "./TemperatureTrendsCard"
import type { AirQualityResponse, ForecastResponse, TemperatureUnit } from "../types/weather"
import { type DailyForecastSummary, aggregateDailyForecast, getLocalDateKey } from '../utils/aggregateForecast'
import { getUsAqiKit } from "../utils/aqiConverter"
import { type WeatherThemeKit, getWeatherThemeKit } from '../utils/weatherThemes'
import { fadeSlideUp, staggerContainer } from '../utils/motionVariants'

// MUI Box that also accepts Motion props, so animated wrappers keep using `sx`
const MotionBox = motion.create(Box)

// === TYPES & INTERFACES ==================================================================

// Both prop types declare `units`, so the intersection keeps a single shared `units` prop.
// `units` drives the switch (flips instantly); `dataUnits` is the unit the displayed data was
// fetched in, so values and their symbols always change together once the refetch lands
export type WeatherPanelProps = 
    WeatherHeadBarProps & 
    Omit<CurrentWeatherCardProps, "theme"> & 
    {
        aqiData: AirQualityResponse | null
        forecastData: ForecastResponse | null
        dataUnits: TemperatureUnit
    }


// Animated wrapper inside the right-hand column: the card fills the wrapper's width & height,
// and `minWidth: 0` still lets the Recharts chart shrink with the column
const cardSlotSx = {
    display: 'flex',
    minWidth: 0,
    '& > *': { flexGrow: 1, minWidth: 0 }
}


// === COMPONENT: WEATHERPANEL =============================================================

export function WeatherPanel({
    weatherData,
    forecastData,
    aqiData,
    selectedCity,
    units,
    dataUnits,
    isFavorite,
    isFavoritesFull,
    onToggleFavorite,
    onToggleUnit
}: WeatherPanelProps) {
    // 1. VARIABLES
    // An air quality response can come back with an empty list: show the placeholder, not a fake reading
    const pm25 = aqiData?.list[0]?.components.pm2_5
    const aqiKit = pm25 !== undefined ? getUsAqiKit(pm25) : null
    let fourDayForecast: DailyForecastSummary[] | null = null
    const theme: WeatherThemeKit = getWeatherThemeKit(weatherData.weather[0].id, weatherData.weather[0].icon)
    
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
        // Children with `fadeSlideUp` variants enter one after another (staggered)
        <MotionBox
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            exit="exit"
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                p: 1,
                borderRadius: '15px',
                background: theme.theme.gradient // Gradients are images in CSS, so `backgroundColor` won't accept them
            }}
        >
            {/* HEADER BAR */}
            <MotionBox variants={fadeSlideUp}>
                <WeatherHeaderBar
                    isFavorite={isFavorite}
                    onToggleFavorite={onToggleFavorite}
                    units={units}
                    onToggleUnit={onToggleUnit}
                    isFavoritesFull={isFavoritesFull}
                />
            </MotionBox>

            <Box sx={{
                display: 'flex',
                flexDirection: 'row',
                gap: 1,
                width: 1
            }}>
                {/* CURRENT WEATHER CARD */}
                {/* Wrapper Box since CurrentWeatherCard doesn't accept an `sx` prop */}
                <MotionBox variants={fadeSlideUp} sx={{
                    flex: '3 1 0',          // 3 parts out of 5 = 60%
                    minWidth: 0,            // Allow shrinking below content width
                    display: 'flex',
                    '& > *': { flexGrow: 1 }, // Card fills the wrapper's width & height
                }}>
                    <CurrentWeatherCard
                        weatherData={weatherData}
                        theme={theme}
                        selectedCity={selectedCity}
                        units={dataUnits}
                    />
                </MotionBox>

                <Stack sx={{
                    flex: '2 1 0',           // 2 parts out of 5 = 40%
                    minWidth: 0,             // Lets the Recharts chart shrink with the column
                    gap: 1,
                    '& > *': { flexGrow: 1 }, // Cards stretch to fill the column's height
                }}>
                    {/* WEATHER METRICS CARD */}
                    <MotionBox variants={fadeSlideUp} sx={cardSlotSx}>
                        <WeatherMetricsCard 
                            humidity={weatherData.main.humidity}
                            wind={weatherData.wind.speed}
                            aqiData={aqiKit}
                            theme={theme}
                            units={dataUnits}
                        />
                    </MotionBox>

                    {/* TEMPERATURE TRENDS CARD */}
                    <MotionBox variants={fadeSlideUp} sx={cardSlotSx}>
                        <TemperatureTrendsCard
                            forecastData={forecastData}
                            isThemeDark={theme.theme.isDark}
                            units={dataUnits}
                        />
                    </MotionBox>
                </Stack>
            </Box>

            {/* 5-DAY FORECAST */}
            {fourDayForecast && (
                <MotionBox variants={fadeSlideUp}>
                    <ForecastCard 
                        forecastList={fourDayForecast}
                        units={dataUnits}/>
                </MotionBox>
            )}
        </MotionBox>
    )
}
