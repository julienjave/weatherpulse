import { useState, useRef, useCallback, useEffect } from "react"
import type {
    CurrentWeatherResponse,
    ForecastResponse,
    AirQualityResponse,
    GeocodingLocation,
    TemperatureUnit
} from '../types/weather'
import {
    fetchCurrentWeatherByCoords,
    fetch5DayForecastByCoords,
    fetchAirQualityByCoords
} from '../services/weatherApi'


// === USEWEATHER ========================================================================

export function useWeather() {
    // 1. STATE VARIABLES
    const [weatherData, setWeatherData] = useState<CurrentWeatherResponse | null>(null)
    const [forecastData, setForecastData] = useState<ForecastResponse | null>(null)
    const [aqiData, setAqiData] = useState<AirQualityResponse | null>(null)
    const [selectedCity, setSelectedCity] = useState<GeocodingLocation | null>(null)
    const [units, setUnits] = useState<TemperatureUnit>('metric')
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    // 2. ACTIVE ABORTCONTROLLER REF
    const abortControllerRef = useRef<AbortController | null>(null)

    // 3. HELPER
    // Fetch all weather datasets concurrently by coordinates
    const fetchAllWeatherData = useCallback(async (lat: number, lon: number, currentUnit: TemperatureUnit = units) => {
        // A. Cancel previous request if user typed again before it completed
        if(abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        // B. Create a new controller for the current request
        const controller = new AbortController()
        abortControllerRef.current = controller

        // C. Set loading true & clear errors
        setIsLoading(true)
        setError(null)

        try {
            // D. Make fetch requests with Promise.all
            const [currentRes, forecastRes, aqiRes] = await Promise.all([
                fetchCurrentWeatherByCoords(lat, lon, currentUnit, controller.signal),
                fetch5DayForecastByCoords(lat, lon, currentUnit, controller.signal),
                fetchAirQualityByCoords(lat, lon, controller.signal)
            ])
    
            // E. Guard: Check if request was aborted
            if(controller.signal.aborted) return
    
            // F. Handle potential errors
            // If the primary weather API fails, treat the whole load as failed
            if(currentRes.error) {
                setError(currentRes.error.message)
                setIsLoading(false)
                return
            }
    
            // G. Update state with successful payload data
            if(currentRes.data) setWeatherData(currentRes.data)
            
            if(forecastRes.data) setForecastData(forecastRes.data)
    
            if(aqiRes.data) setAqiData(aqiRes.data)
            
        } catch (err) {
            // Ignore DOMException abort errors caused by intentional cancellation
            if (err instanceof Error && err.name === 'AbortError') return
            setError('An unexpected error occurred while fetching weather data.')
        } finally {
            if (!controller.signal.aborted) {
                // H. Turn off loading spinner
                setIsLoading(false)
            }
        }
    }, [])

    // 4. HANDLER: SELECT NEW LOCATION FROM SEARCHBAR
    const handleSelectLocation = useCallback((location: GeocodingLocation) => {
        // A. Save location to state
        setSelectedCity(location)

        // B. Trigger fetch requests
        fetchAllWeatherData(location.lat, location.lon, units)
    }, [fetchAllWeatherData, units])

    // 5. HANDLER: TOGGLE TEMPERATURE UNIT
    const handleToggleUnits = useCallback(() => {
        // A. Determine the new unit value
        const newUnit = units === 'metric' ? 'imperial' : 'metric'

        // B. Update React state
        setUnits(newUnit)

        // C. Re-fetch weather data using the new unit value
        if(selectedCity) {
            fetchAllWeatherData(selectedCity.lat, selectedCity.lon, newUnit)
        }
    }, [fetchAllWeatherData, selectedCity, units])

    // 6. CLEANUP ON UNMOUNT
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [])

    // 7. RETURN STATE AND HANDLERS
    // Return state and handlers for UI components to consume
    return {
        weatherData,
        forecastData,
        aqiData,
        selectedCity,
        units,
        isLoading,
        error,
        handleSelectLocation,
        handleToggleUnits,
    }
}