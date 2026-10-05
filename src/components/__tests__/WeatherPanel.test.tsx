import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WeatherPanel, type WeatherPanelProps } from '../WeatherPanel'
import type {
  AirQualityResponse,
  CurrentWeatherResponse,
  ForecastItem,
  ForecastResponse,
  GeocodingLocation
} from '../../types/weather'

// UTC seconds for a given day/hour in Jan 2026 (15 Jan 2026 is a Thursday)
const utc = (day: number, hour: number) => Date.UTC(2026, 0, day, hour) / 1000

const NOW = utc(15, 12)

const sydney: GeocodingLocation = { name: 'Sydney', lat: -33.8688, lon: 151.2093, country: 'AU' }

const makeWeather = (id: number, icon: string): CurrentWeatherResponse => ({
  coord: { lat: sydney.lat, lon: sydney.lon },
  weather: [{ id, main: 'Weather', description: 'clear sky', icon }],
  base: 'stations',
  main: { temp: 21.6, feels_like: 20.4, temp_min: 19, temp_max: 24, pressure: 1015, humidity: 55 },
  visibility: 10000,
  wind: { speed: 4.1, deg: 90 },
  clouds: { all: 0 },
  dt: NOW,
  sys: { country: 'AU', sunrise: 0, sunset: 0 },
  timezone: 0,
  id: 2147714,
  name: 'Sydney',
  cod: 200,
})

// 40 three-hour slots (the free API's 5-day window) starting at `start`
const makeForecast = (start: number): ForecastResponse => ({
  cod: '200',
  message: 0,
  cnt: 40,
  list: Array.from({ length: 40 }, (_, i): ForecastItem => ({
    dt: start + i * 3 * 3600,
    main: { temp: 20, feels_like: 19, temp_min: 15, temp_max: 25, pressure: 1015, humidity: 55, temp_kf: 0 },
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
    population: 0, timezone: 0, sunrise: 0, sunset: 0,
  },
})

const makeAirQuality = (pm2_5: number | null): AirQualityResponse => ({
  coord: { lat: sydney.lat, lon: sydney.lon },
  list: pm2_5 === null ? [] : [{
    dt: NOW,
    main: { aqi: 1 },
    components: { co: 0, no: 0, no2: 0, o3: 0, so2: 0, pm2_5, pm10: 0, nh3: 0 },
  }],
})

describe('WeatherPanel Component', () => {
  beforeEach(() => {
    vi.stubEnv('TZ', 'Europe/Paris')
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW * 1000)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  const renderPanel = (props: Partial<WeatherPanelProps> = {}) => {
    const defaults: WeatherPanelProps = {
      weatherData: makeWeather(800, '01d'),
      forecastData: makeForecast(utc(15, 12)),
      aqiData: makeAirQuality(6),
      selectedCity: sydney,
      units: 'metric',
      isFavorite: false,
      isFavoritesFull: false,
      onToggleFavorite: vi.fn(),
      onToggleUnit: vi.fn(),
    }
    const merged = { ...defaults, ...props }
    render(<WeatherPanel {...merged} />)
    return merged
  }

  it('renders every section of the panel', () => {
    renderPanel()

    expect(screen.getByRole('button', { name: 'Add to favorites' })).toBeInTheDocument() // header bar
    expect(screen.getByText('Sydney, AU')).toBeInTheDocument() // current weather
    expect(screen.getByText('55%')).toBeInTheDocument() // metrics
    expect(screen.getByRole('heading', { name: 'Next 24 Hours' })).toBeInTheDocument() // trends
    expect(screen.getAllByText(/^High:/).length).toBeGreaterThan(0) // forecast
  })

  it('converts PM2.5 into a US AQI badge', () => {
    renderPanel({ aqiData: makeAirQuality(6) })

    expect(screen.getByText('25 - Good')).toBeInTheDocument()
  })

  it('shows the AQI placeholder when there is no air quality data', () => {
    renderPanel({ aqiData: null })

    expect(screen.getByText(/- No Data -/)).toBeInTheDocument()
  })

  describe('forecast', () => {
    it('leaves today out of the daily forecast', () => {
      renderPanel({ forecastData: makeForecast(utc(15, 12)) })

      expect(screen.queryByText('15 Thu')).not.toBeInTheDocument()
      expect(screen.getAllByText(/^High:/)).toHaveLength(4)
      expect(screen.getByText('16 Fri')).toBeInTheDocument()
      expect(screen.getByText('19 Mon')).toBeInTheDocument()
    })

    it('caps the daily forecast at 4 days when today is not in the data', () => {
      renderPanel({ forecastData: makeForecast(utc(16, 0)) }) // 5 full days: 16th to 20th

      expect(screen.getAllByText(/^High:/)).toHaveLength(4)
      expect(screen.getByText('16 Fri')).toBeInTheDocument()
      expect(screen.queryByText('20 Tue')).not.toBeInTheDocument()
    })

    it('hides the daily forecast and chart when there is no forecast data', () => {
      renderPanel({ forecastData: null })

      expect(screen.queryByText(/^High:/)).not.toBeInTheDocument()
      expect(screen.getByText(/No Forecast Data/)).toBeInTheDocument()
    })
  })

  it('passes the units down to every card', () => {
    renderPanel({ units: 'imperial' })

    expect(screen.getByRole('switch')).not.toBeChecked()
    expect(screen.getByText('22°F')).toBeInTheDocument()
    expect(screen.getByText('4.1mph')).toBeInTheDocument()
    expect(screen.getAllByText('High: 25°F')).toHaveLength(4)
  })

  it('themes the cards from the current weather condition', () => {
    renderPanel({ weatherData: makeWeather(500, '10n') }) // rain → dark theme

    expect(screen.getByText('Today').closest('.MuiCard-root')).toHaveStyle({ color: 'rgb(255, 255, 255)' })
    expect(screen.getByText('55%')).toHaveStyle({ color: 'rgb(255, 255, 255)' })
  })

  it('forwards favorite and unit toggles to its callbacks', async () => {
    vi.useRealTimers() // userEvent needs real timers
    const user = userEvent.setup()
    const { onToggleFavorite, onToggleUnit } = renderPanel({ isFavorite: true })

    await user.click(screen.getByRole('button', { name: 'Remove from favorites' }))
    await user.click(screen.getByRole('switch'))

    expect(onToggleFavorite).toHaveBeenCalledTimes(1)
    expect(onToggleUnit).toHaveBeenCalledTimes(1)
  })

  // Regression: an empty air quality list used to crash the panel, then render "NaN - Hazardous"
  it('renders the AQI placeholder when the air quality list is empty', () => {
    renderPanel({ aqiData: makeAirQuality(null) })

    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
    expect(screen.getByText(/- No Data -/)).toBeInTheDocument()
  })
})
