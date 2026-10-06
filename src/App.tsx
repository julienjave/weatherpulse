import { useCallback, useEffect } from 'react'
import { Container, Box, Typography, Stack } from '@mui/material'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { SearchBar } from './components/SearchBar'
import { FavoritesBar } from './components/FavoritesBar'
import { WeatherPanel } from './components/WeatherPanel'
import { WeatherPanelSkeleton } from './components/WeatherPanelSkeleton'
import { NotificationToast } from './components/NotificationToast'
import { useWeather } from './hooks/useWeather'
import { type Coordinates, useGeolocation } from './hooks/useGeolocation'
import { getReverseGeocode } from './services/weatherApi'
import { useFavorites } from './hooks/useFavorites'
import { useNotification } from './hooks/useNotification'
import { fade } from './utils/motionVariants'
import logo from './assets/weather-pulse-logo.png'
import './App.css'

function App() {

  // 1. --- STATE VARIABLES ---

  const {
    weatherData,
    forecastData,
    aqiData,
    selectedCity,
    units,
    dataUnits,
    isLoading: isWeatherLoading,
    error: weatherError,
    handleSelectLocation,
    handleToggleUnits,
    handleClearLocation
  } = useWeather()

  const {
    isLoading: isGeoloading,
    error: geoError,
    getLocation,
    handleClearGeolocation
  } = useGeolocation()

  const { favorites, isFull: isFavoritesFull, isFavorite, toggleFavorite, removeFavorite } = useFavorites()

  const { notification, notify, dismiss: dismissNotification } = useNotification()


  // 2. --- ERROR TOASTS ---

  // Weather API / network failures
  useEffect(() => {
    if (weatherError) notify(weatherError, 'error')
  }, [weatherError, notify])

  // Geolocation permission / availability problems
  useEffect(() => {
    if (geoError) notify(geoError, 'warning')
  }, [geoError, notify])


  // 3. --- HANDLERS ---
  
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
    dismissNotification()
  },[handleClearLocation, handleClearGeolocation, dismissNotification])

  const handleToggleFavorite = useCallback(() => {
    if (selectedCity) toggleFavorite(selectedCity)
  },[selectedCity, toggleFavorite])

  return (
    // reducedMotion="user": honors the OS "reduce motion" setting (keeps fades, drops slides & layout moves)
    <MotionConfig reducedMotion="user">
      <Container 
        maxWidth="md" 
        sx={{ 
          height: '100vh',
          minHeight: 'fit-content',
          py: 4,
        }}
      >
        {/* Header */}
        <Box 
          component="header" 
          sx={{ 
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' }, // Logo above the title on mobile
            alignItems: 'center',
            justifyContent: 'center',
            gap: { xs: 1, sm: 3 },
            mb: 4 }}>
          <Box 
            component="img"
            alt='Weather Pulse logo'
            src={logo}
            sx={{ maxWidth: { xs: 160, sm: 250 } }}
          />
          <Stack sx={{ textAlign: 'center'}}>
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{ 
                fontWeight: 700, mb: 1, 
                fontFamily: `'Outfit', sans-serif`, 
                fontSize: { xs: '2.25rem', sm: '3rem' },
                color: '#fff' 
              }}
            >
              WeatherPulse
            </Typography>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontFamily: `'Outfit', sans-serif`,
                color: '#fff' 
              }}
            >
              Real-time weather forecast & air quality tracking
            </Typography>
          </Stack>
        </Box>

        {/* SearchBar Component */}
        <SearchBar
          onSelectLocation={handleSelectLocation}
          onUseMyLocation={handleUseMyLocation}
          onClear={handleClearSearch}
          isGeoloading={isGeoloading}
          onError={notify}
        />

        {/* Favorites Bar Component */}
        <FavoritesBar
          favorites={favorites}
          selectedCity={selectedCity}
          onSelect={handleSelectLocation}
          onDelete={removeFavorite}
        />

        {/* Weather Panel (skeleton while a new city's data is loading) */}
        {/* mode="wait": the outgoing view fades out before the incoming one fades in */}
        <AnimatePresence mode="wait">
          {selectedCity && !weatherData && isWeatherLoading && (
            <motion.div key="skeleton" variants={fade} initial="hidden" animate="visible" exit="exit">
              <WeatherPanelSkeleton />
            </motion.div>
          )}

          {selectedCity && weatherData && (
            <WeatherPanel
              // Keyed by city so switching cities replays the entry animation
              key={`${selectedCity.lat},${selectedCity.lon}`}
              weatherData={weatherData}
              forecastData={forecastData}
              aqiData={aqiData}
              selectedCity={selectedCity}
              units={units}
              dataUnits={dataUnits}
              isFavorite={isFavorite(selectedCity)}
              isFavoritesFull={isFavoritesFull}
              onToggleFavorite={handleToggleFavorite}
              onToggleUnit={handleToggleUnits}
            />
          )}
        </AnimatePresence>

        {/* Error Toasts */}
        <NotificationToast notification={notification} onClose={dismissNotification} />

      </Container>
    </MotionConfig>
  )
}

export default App
