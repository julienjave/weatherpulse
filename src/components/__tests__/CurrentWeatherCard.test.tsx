import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CurrentWeatherCard } from '../CurrentWeatherCard'
import type { CurrentWeatherResponse, GeocodingLocation } from '../../types/weather'
import { getWeatherThemeKit } from '../../utils/weatherThemes'
import { getIconUrl } from '../../utils/weatherIcons'

// Thursday 15 Jan 2026, 12:00 UTC
const NOW = Date.UTC(2026, 0, 15, 12, 0)

const sydney: GeocodingLocation = { name: 'Sydney', lat: -33.8688, lon: 151.2093, country: 'AU' }

const WEATHER: CurrentWeatherResponse = {
  coord: { lat: sydney.lat, lon: sydney.lon },
  weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
  base: 'stations',
  main: { temp: 21.6, feels_like: 20.4, temp_min: 19, temp_max: 24, pressure: 1015, humidity: 55 },
  visibility: 10000,
  wind: { speed: 4.1, deg: 90 },
  clouds: { all: 0 },
  dt: NOW / 1000,
  sys: { country: 'AU', sunrise: 0, sunset: 0 },
  timezone: 36000, // UTC+10
  id: 2147714,
  name: 'Sydney',
  cod: 200,
}

describe('CurrentWeatherCard Component', () => {
  const theme = getWeatherThemeKit(800, '01d')

  beforeEach(() => {
    // The date and time are "now" in the city timezone
    vi.stubEnv('TZ', 'Europe/Paris')
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it("shows today's date and current time in the city timezone", () => {
    render(<CurrentWeatherCard weatherData={WEATHER} theme={theme} selectedCity={sydney} units="metric" />)

    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByText('Thursday, Jan 15')).toBeInTheDocument()
    expect(screen.getByText(/^10:00\sPM$/)).toBeInTheDocument()
  })

  it('shows the city name with its country code', () => {
    render(<CurrentWeatherCard weatherData={WEATHER} theme={theme} selectedCity={sydney} units="metric" />)

    expect(screen.getByText('Sydney, AU')).toBeInTheDocument()
  })

  it('shows only the name when the location has no country (coordinate fallback)', () => {
    const coordinates = { name: '48.86°, 2.35°', lat: 48.85661, lon: 2.35222, country: '' }
    render(<CurrentWeatherCard weatherData={WEATHER} theme={theme} selectedCity={coordinates} units="metric" />)

    expect(screen.getByText('48.86°, 2.35°')).toBeInTheDocument()
  })

  it('shows the condition description and theme icon', () => {
    render(<CurrentWeatherCard weatherData={WEATHER} theme={theme} selectedCity={sydney} units="metric" />)

    expect(screen.getByText('clear sky')).toBeInTheDocument()
    expect(screen.getByAltText('weather icon')).toHaveAttribute('src', getIconUrl(theme.icon))
  })

  it('shows rounded temperature and feels-like in °C for metric units', () => {
    render(<CurrentWeatherCard weatherData={WEATHER} theme={theme} selectedCity={sydney} units="metric" />)

    expect(screen.getByText('22°C')).toBeInTheDocument()
    expect(screen.getByText('Feels like')).toBeInTheDocument()
    expect(screen.getByText('20°C')).toBeInTheDocument()
  })

  it('shows the °F symbol for imperial units', () => {
    const imperial = { ...WEATHER, main: { ...WEATHER.main, temp: 70.9, feels_like: 68.7 } }
    render(<CurrentWeatherCard weatherData={imperial} theme={theme} selectedCity={sydney} units="imperial" />)

    expect(screen.getByText('71°F')).toBeInTheDocument()
    expect(screen.getByText('69°F')).toBeInTheDocument()
  })

  it('uses white text on dark weather themes and black text on light ones', () => {
    const { rerender } = render(
      <CurrentWeatherCard weatherData={WEATHER} theme={theme} selectedCity={sydney} units="metric" />
    )
    expect(screen.getByText('Today').closest('.MuiCard-root')).toHaveStyle({ color: 'rgb(0, 0, 0)' })

    rerender(
      <CurrentWeatherCard weatherData={WEATHER} theme={getWeatherThemeKit(800, '01n')} selectedCity={sydney} units="metric" />
    )
    expect(screen.getByText('Today').closest('.MuiCard-root')).toHaveStyle({ color: 'rgb(255, 255, 255)' })
  })
})
