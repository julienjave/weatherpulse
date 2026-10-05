import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from '../App'
import * as weatherApi from '../services/weatherApi'
import { FAVORITES_STORAGE_KEY } from '../hooks/useFavorites'
import type {
  AirQualityResponse,
  CurrentWeatherResponse,
  ForecastResponse,
  GeocodingLocation
} from '../types/weather'

type CurrentWeatherResult = Awaited<ReturnType<typeof weatherApi.fetchCurrentWeatherByCoords>>

// Network layer is mocked; hooks (useWeather, useGeolocation, useCitySearch, useFavorites, useNotification) are real
vi.mock('../services/weatherApi', () => ({
  searchCityByName: vi.fn(),
  getReverseGeocode: vi.fn(),
  fetchCurrentWeatherByCoords: vi.fn(),
  fetch5DayForecastByCoords: vi.fn(),
  fetchAirQualityByCoords: vi.fn(),
}))

// --- FIXTURES ---------------------------------------------------------------------------

const sydney: GeocodingLocation = { name: 'Sydney', lat: -33.8688, lon: 151.2093, country: 'AU', state: 'New South Wales' }

const makeCurrentWeather = (temp: number, feelsLike: number): CurrentWeatherResponse => ({
  coord: { lat: sydney.lat, lon: sydney.lon },
  weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
  base: 'stations',
  main: { temp, feels_like: feelsLike, temp_min: temp, temp_max: temp, pressure: 1015, humidity: 55 },
  visibility: 10000,
  wind: { speed: 4.1, deg: 90 },
  clouds: { all: 0 },
  dt: 1_790_000_000,
  sys: { country: 'AU', sunrise: 0, sunset: 0 },
  timezone: 36000,
  id: 2147714,
  name: 'Sydney',
  cod: 200,
})

const FORECAST: ForecastResponse = {
  cod: '200',
  message: 0,
  cnt: 2,
  list: [0, 1].map((i) => ({
    dt: 1_790_000_000 + i * 3 * 3600,
    main: { temp: 20, feels_like: 19, temp_min: 18, temp_max: 23, pressure: 1015, humidity: 55, temp_kf: 0 },
    weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
    clouds: { all: 0 },
    wind: { speed: 4, deg: 90 },
    visibility: 10000,
    pop: 0,
    sys: { pod: 'd' },
    dt_txt: '',
  })),
  city: {
    id: 2147714, name: 'Sydney', coord: { lat: sydney.lat, lon: sydney.lon }, country: 'AU',
    population: 0, timezone: 36000, sunrise: 0, sunset: 0,
  },
}

const AIR_QUALITY: AirQualityResponse = {
  coord: { lat: sydney.lat, lon: sydney.lon },
  list: [{
    dt: 1_790_000_000,
    main: { aqi: 1 },
    components: { co: 0, no: 0, no2: 0, o3: 0, so2: 0, pm2_5: 6, pm10: 0, nh3: 0 }, // PM2.5 6 → US AQI 25 (Good)
  }],
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => { resolve = r })
  return { promise, resolve }
}

// --- TESTS ------------------------------------------------------------------------------

describe('App', () => {
  const getCurrentPosition = vi.fn()
  const errorCodes = { PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 }

  const mockPosition = (latitude: number, longitude: number) => {
    getCurrentPosition.mockImplementation((success) => success({ coords: { latitude, longitude } }))
  }

  // Resolves geolocation to Sydney and waits for the weather panel to render
  const loadSydney = async (user: ReturnType<typeof userEvent.setup>) => {
    mockPosition(sydney.lat, sydney.lon)
    vi.mocked(weatherApi.getReverseGeocode).mockResolvedValueOnce({ data: [sydney], error: null })

    await user.click(screen.getByRole('button', { name: /use my location/i }))
    expect(await screen.findByText('Sydney, AU')).toBeInTheDocument()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
    getCurrentPosition.mockReset()
    Object.defineProperty(window.navigator, 'geolocation', {
      value: { getCurrentPosition },
      configurable: true,
      writable: true,
    })

    vi.mocked(weatherApi.fetchCurrentWeatherByCoords).mockResolvedValue({ data: makeCurrentWeather(21.6, 20.4), error: null })
    vi.mocked(weatherApi.fetch5DayForecastByCoords).mockResolvedValue({ data: FORECAST, error: null })
    vi.mocked(weatherApi.fetchAirQualityByCoords).mockResolvedValue({ data: AIR_QUALITY, error: null })
  })

  it('renders the header and search bar with no location selected', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'WeatherPulse' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /search city/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /add to favorites/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Favorite cities' })).not.toBeInTheDocument()
  })

  describe('use my location', () => {
    it('reverse geocodes the position, then shows the weather panel for that city', async () => {
      const user = userEvent.setup()
      render(<App />)

      await loadSydney(user)

      expect(screen.getByText('22°C')).toBeInTheDocument()
      expect(screen.getByText('20°C')).toBeInTheDocument() // feels like
      expect(screen.getByText('clear sky')).toBeInTheDocument()
      expect(screen.getByText('55%')).toBeInTheDocument() // humidity
      expect(screen.getByText('4.1m/s')).toBeInTheDocument() // wind
      expect(screen.getByText('25 - Good')).toBeInTheDocument() // AQI

      expect(weatherApi.getReverseGeocode).toHaveBeenCalledWith(sydney.lat, sydney.lon, 1, expect.any(AbortSignal))
      expect(weatherApi.fetchCurrentWeatherByCoords).toHaveBeenCalledWith(
        sydney.lat, sydney.lon, 'metric', expect.any(AbortSignal)
      )
    })

    it('falls back to a coordinate label when reverse geocoding returns nothing', async () => {
      const user = userEvent.setup()
      mockPosition(48.85661, 2.35222)
      vi.mocked(weatherApi.getReverseGeocode).mockResolvedValueOnce({ data: [], error: null })

      render(<App />)
      await user.click(screen.getByRole('button', { name: /use my location/i }))

      expect(await screen.findByText('48.86°, 2.35°')).toBeInTheDocument()
      expect(weatherApi.fetchCurrentWeatherByCoords).toHaveBeenCalledWith(
        48.85661, 2.35222, 'metric', expect.any(AbortSignal)
      )
    })

    it('falls back to a coordinate label when reverse geocoding returns an error', async () => {
      const user = userEvent.setup()
      mockPosition(10, 20)
      vi.mocked(weatherApi.getReverseGeocode).mockResolvedValueOnce({
        data: null,
        error: { status: 500, message: 'Server error' },
      })

      render(<App />)
      await user.click(screen.getByRole('button', { name: /use my location/i }))

      expect(await screen.findByText('10.00°, 20.00°')).toBeInTheDocument()
    })

    it('shows the geolocation error as a warning toast and does not fetch anything when permission is denied', async () => {
      const user = userEvent.setup()
      getCurrentPosition.mockImplementation((_, error) => error({ code: 1, ...errorCodes }))

      render(<App />)
      await user.click(screen.getByRole('button', { name: /use my location/i }))

      expect(await screen.findByRole('alert')).toHaveTextContent(/Location access was denied/)
      expect(weatherApi.getReverseGeocode).not.toHaveBeenCalled()
      expect(weatherApi.fetchCurrentWeatherByCoords).not.toHaveBeenCalled()
    })
  })

  it('shows a loading skeleton until the weather data arrives', async () => {
    const user = userEvent.setup()
    const pending = deferred<CurrentWeatherResult>()
    vi.mocked(weatherApi.fetchCurrentWeatherByCoords).mockReturnValueOnce(pending.promise)
    mockPosition(sydney.lat, sydney.lon)
    vi.mocked(weatherApi.getReverseGeocode).mockResolvedValueOnce({ data: [sydney], error: null })

    render(<App />)
    await user.click(screen.getByRole('button', { name: /use my location/i }))

    expect(await screen.findByRole('status', { name: 'Loading weather data' })).toBeInTheDocument()
    expect(screen.queryByText('Sydney, AU')).not.toBeInTheDocument()

    pending.resolve({ data: makeCurrentWeather(21.6, 20.4), error: null })

    expect(await screen.findByText('Sydney, AU')).toBeInTheDocument()
    expect(screen.queryByRole('status', { name: 'Loading weather data' })).not.toBeInTheDocument()
  })

  it('shows the weather error as a toast when the primary weather API fails', async () => {
    const user = userEvent.setup()
    mockPosition(sydney.lat, sydney.lon)
    vi.mocked(weatherApi.getReverseGeocode).mockResolvedValueOnce({ data: [sydney], error: null })
    vi.mocked(weatherApi.fetchCurrentWeatherByCoords).mockResolvedValueOnce({
      data: null,
      error: { status: 401, message: 'Invalid API key. Please check your OpenWeatherMap configuration.' },
    })

    render(<App />)
    await user.click(screen.getByRole('button', { name: /use my location/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/Invalid API key/)
    expect(screen.queryByText('Sydney, AU')).not.toBeInTheDocument()
    expect(screen.queryByRole('status', { name: 'Loading weather data' })).not.toBeInTheDocument()
  })

  it('refetches in imperial units when the units switch is toggled', async () => {
    const user = userEvent.setup()
    render(<App />)
    await loadSydney(user)

    vi.mocked(weatherApi.fetchCurrentWeatherByCoords).mockResolvedValueOnce({ data: makeCurrentWeather(70.9, 68.7), error: null })
    await user.click(screen.getByRole('switch'))

    expect(await screen.findByText('71°F')).toBeInTheDocument()
    expect(weatherApi.fetchCurrentWeatherByCoords).toHaveBeenLastCalledWith(
      sydney.lat, sydney.lon, 'imperial', expect.any(AbortSignal)
    )
  })

  describe('favorites', () => {
    it('adds the selected city to the favorites bar and persists it', async () => {
      const user = userEvent.setup()
      render(<App />)
      await loadSydney(user)

      await user.click(screen.getByRole('button', { name: /add to favorites/i }))

      const favoritesBar = screen.getByRole('navigation', { name: 'Favorite cities' })
      expect(within(favoritesBar).getByText('Sydney, AU')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /remove from favorites/i })).toBeInTheDocument()
      expect(JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY)!)).toEqual([sydney])
    })

    it('loads the weather for a saved favorite when its chip is clicked', async () => {
      const user = userEvent.setup()
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([sydney]))

      render(<App />)
      const favoritesBar = screen.getByRole('navigation', { name: 'Favorite cities' })
      await user.click(within(favoritesBar).getByText('Sydney, AU'))

      expect(await screen.findByText('22°C')).toBeInTheDocument()
      expect(weatherApi.fetchCurrentWeatherByCoords).toHaveBeenCalledWith(
        sydney.lat, sydney.lon, 'metric', expect.any(AbortSignal)
      )
    })
  })

  describe('Clear', () => {
    it('removes the weather panel', async () => {
      const user = userEvent.setup()
      render(<App />)
      await loadSydney(user)

      await user.click(screen.getByRole('button', { name: /^clear$/i }))

      expect(screen.queryByText('Sydney, AU')).not.toBeInTheDocument()
      expect(screen.queryByText('22°C')).not.toBeInTheDocument()
    })

    it('dismisses the geolocation error toast', async () => {
      const user = userEvent.setup()
      getCurrentPosition.mockImplementation((_, error) => error({ code: 1, ...errorCodes }))

      render(<App />)
      await user.click(screen.getByRole('button', { name: /use my location/i }))
      expect(await screen.findByText(/Location access was denied/)).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /^clear$/i }))

      await waitFor(() => {
        expect(screen.queryByText(/Location access was denied/)).not.toBeInTheDocument()
      })
    })

    it('dismisses the weather error toast', async () => {
      const user = userEvent.setup()
      mockPosition(0, 0)
      vi.mocked(weatherApi.getReverseGeocode).mockResolvedValueOnce({ data: [], error: null })
      vi.mocked(weatherApi.fetchCurrentWeatherByCoords).mockResolvedValueOnce({
        data: null,
        error: { status: 500, message: 'Server error' },
      })

      render(<App />)
      await user.click(screen.getByRole('button', { name: /use my location/i }))
      expect(await screen.findByText('Server error')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /^clear$/i }))

      await waitFor(() => {
        expect(screen.queryByText('Server error')).not.toBeInTheDocument()
      })
    })
  })
})
