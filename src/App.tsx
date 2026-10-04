import { useCallback } from 'react'
import { Container, Box, Typography, Alert, CssBaseline } from '@mui/material'
import { SearchBar } from './components/SearchBar'
import { CurrentWeatherCard } from './components/CurrentWeatherCard'
import { useWeather } from './hooks/useWeather'
import { type Coordinates, useGeolocation } from './hooks/useGeolocation'
import { getReverseGeocode } from './services/weatherApi'
import type { GeocodingLocation } from './types/weather'
import './App.css'

function App() {

  // 1. --- STATE VARIABLES ---

  const {
    weatherData,
    forecastData,
    aqiData,
    selectedCity,
    units,
    isLoading: isWeatherLoading,
    error: weatherError,
    handleSelectLocation,
    handleToggleUnits,
    handleClearLocation
  } = useWeather()

  const {
    coordinates,
    isLoading: isGeoloading,
    error: geoError,
    getLocation,
    handleClearGeolocation
  } = useGeolocation()

  
  // 2. --- HANDLERS ---
  
  const handleUseMyLocation = useCallback(async () => {
    try {
      // A. Get raw coordinates
      const coords: Coordinates | null = await getLocation()
      if(!coords) return

      // Setup Timeout Controller (8s default) for the network request
      const timeoutController = new AbortController()
      const timeoutId = setTimeout(() => timeoutController.abort(), 8000)
  
      try {
        // B. Get location data (city, country) for these coordinates
        const { data, error } = await getReverseGeocode(coords.lat, coords.lon, 1, timeoutController.signal)
  
        if(error || !data || data.length === 0) {
          // Graceful fallback to coordinate label if reverse lookup fails or returns empty
          handleSelectLocation({
            name: `${coords.lat.toFixed(2)}°, ${coords.lon.toFixed(2)}°`,
            lat: coords.lat,
            lon: coords.lon,
            country: ''
          })
          return
        }
  
        handleSelectLocation(data[0])

      } finally {
        // Always clear the timeout when the request settles (success or fail)
        clearTimeout(timeoutId)
      }
      
    } catch (err) {
      // If the timeout aborted or network failed completely, fallback gracefully
      if (err instanceof Error && err.name === 'AbortError') {
        console.warn('Geolocation reverse lookup timed out.')
      } else {
        console.error('Failed to resolve location:', err)
      }
    }
  }, [getLocation, handleSelectLocation, getReverseGeocode])

  const handleClearSearch = useCallback(() => {
    handleClearLocation()
    handleClearGeolocation()
  },[handleClearLocation, handleClearGeolocation])

  return (
    <>
      <Container maxWidth="md" sx={{ py: 4, backgroundColor: "#f88de1" }}>
        <Box component="header" sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            WeatherPulse
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Real-time weather forecast & air quality tracking
          </Typography>
        </Box>

        {/* SearchBar Component Preview */}
        <SearchBar
          onSelectLocation={handleSelectLocation}
          onUseMyLocation={handleUseMyLocation}
          onClear={handleClearSearch}
          isGeoloading={isGeoloading}
          geoError={geoError}
        />

        {/* Visual Inspection Feedback Card */}
        {selectedCity && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h6">Selected Location:</Typography>
            <Typography variant="body1">
              {selectedCity.name} {selectedCity.state ? `(${selectedCity.state})` : ''} - {selectedCity.country}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Lat: {selectedCity.lat}, Lon: {selectedCity.lon}
            </Typography>
          </Box>
        )}

        {selectedCity && weatherData && (
          <CurrentWeatherCard
            weatherData={weatherData}
            forecastData={forecastData}
            aqiData={aqiData}
            selectedCity={selectedCity}
            units={units}
            isWeatherLoading={isWeatherLoading}
            weatherError={weatherError}
          />
        )}

        {isWeatherLoading && (
          <Typography align="center" sx={{ mt: 2 }}>
            Fetching weather data...
          </Typography>
        )}

        {weatherError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {weatherError}
          </Alert>
        )}

        {weatherData && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Current Temp in {weatherData.name}: {Math.round(weatherData.main.temp)}°
            </Typography>
          </Box>
        )}
      </Container>
    </>
  )
}

export default App
