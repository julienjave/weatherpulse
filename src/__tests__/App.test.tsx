import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from '../App'
import * as weatherApi from '../services/weatherApi'

// Network layer is mocked; hooks (useWeather, useGeolocation, useCitySearch) are real
vi.mock('../services/weatherApi', () => ({
  searchCityByName: vi.fn(),
  getReverseGeocode: vi.fn(),
  fetchCurrentWeatherByCoords: vi.fn(),
  fetch5DayForecastByCoords: vi.fn(),
  fetchAirQualityByCoords: vi.fn(),
}))

describe('App', () => {
  const getCurrentPosition = vi.fn()
  const errorCodes = { PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 }

  const sydney = { name: 'Sydney', lat: -33.8688, lon: 151.2093, country: 'AU', state: 'New South Wales' }

  const mockPosition = (latitude: number, longitude: number) => {
    getCurrentPosition.mockImplementation((success) => success({ coords: { latitude, longitude } }))
  }

  beforeEach(() => {
    vi.clearAllMocks()
    getCurrentPosition.mockReset()
    Object.defineProperty(window.navigator, 'geolocation', {
      value: { getCurrentPosition },
      configurable: true,
      writable: true,
    })

    vi.mocked(weatherApi.fetchCurrentWeatherByCoords).mockResolvedValue({
      data: { name: 'Sydney', main: { temp: 21.6 } } as never,
      error: null,
    })
    vi.mocked(weatherApi.fetch5DayForecastByCoords).mockResolvedValue({ data: { list: [] } as never, error: null })
    vi.mocked(weatherApi.fetchAirQualityByCoords).mockResolvedValue({ data: { list: [] } as never, error: null })
  })

  it('renders the header and search bar with no location selected', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'WeatherPulse' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /search city/i })).toBeInTheDocument()
    expect(screen.queryByText('Selected Location:')).not.toBeInTheDocument()
  })

  describe('use my location', () => {
    it('reverse geocodes the position, then shows the location and current temperature', async () => {
      const user = userEvent.setup()
      mockPosition(-33.8688, 151.2093)
      vi.mocked(weatherApi.getReverseGeocode).mockResolvedValueOnce({ data: [sydney], error: null })

      render(<App />)
      await user.click(screen.getByRole('button', { name: /use my location/i }))

      expect(await screen.findByText('Selected Location:')).toBeInTheDocument()
      expect(screen.getByText(/Sydney \(New South Wales\) - AU/)).toBeInTheDocument()
      expect(await screen.findByText('Current Temp in Sydney: 22°')).toBeInTheDocument()

      expect(weatherApi.getReverseGeocode).toHaveBeenCalledWith(-33.8688, 151.2093, 1, expect.any(AbortSignal))
      expect(weatherApi.fetchCurrentWeatherByCoords).toHaveBeenCalledWith(
        -33.8688, 151.2093, 'metric', expect.any(AbortSignal)
      )
    })

    it('falls back to a coordinate label when reverse geocoding returns nothing', async () => {
      const user = userEvent.setup()
      mockPosition(48.85661, 2.35222)
      vi.mocked(weatherApi.getReverseGeocode).mockResolvedValueOnce({ data: [], error: null })

      render(<App />)
      await user.click(screen.getByRole('button', { name: /use my location/i }))

      expect(await screen.findByText(/48\.86°, 2\.35°/)).toBeInTheDocument()
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

      expect(await screen.findByText(/10\.00°, 20\.00°/)).toBeInTheDocument()
    })

    it('shows the geolocation error and does not fetch anything when permission is denied', async () => {
      const user = userEvent.setup()
      getCurrentPosition.mockImplementation((_, error) => error({ code: 1, ...errorCodes }))

      render(<App />)
      await user.click(screen.getByRole('button', { name: /use my location/i }))

      expect(await screen.findByText(/Location access was denied/)).toBeInTheDocument()
      expect(weatherApi.getReverseGeocode).not.toHaveBeenCalled()
      expect(weatherApi.fetchCurrentWeatherByCoords).not.toHaveBeenCalled()
    })
  })

  it('shows the weather error alert when the primary weather API fails', async () => {
    const user = userEvent.setup()
    mockPosition(-33.8688, 151.2093)
    vi.mocked(weatherApi.getReverseGeocode).mockResolvedValueOnce({ data: [sydney], error: null })
    vi.mocked(weatherApi.fetchCurrentWeatherByCoords).mockResolvedValueOnce({
      data: null,
      error: { status: 401, message: 'Invalid API key. Please check your OpenWeatherMap configuration.' },
    })

    render(<App />)
    await user.click(screen.getByRole('button', { name: /use my location/i }))

    expect(await screen.findByText(/Invalid API key/)).toBeInTheDocument()
    expect(screen.queryByText(/Current Temp in/)).not.toBeInTheDocument()
  })

  describe('Clear', () => {
    it('removes the selected location and weather data', async () => {
      const user = userEvent.setup()
      mockPosition(-33.8688, 151.2093)
      vi.mocked(weatherApi.getReverseGeocode).mockResolvedValueOnce({ data: [sydney], error: null })

      render(<App />)
      await user.click(screen.getByRole('button', { name: /use my location/i }))
      expect(await screen.findByText('Current Temp in Sydney: 22°')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /^clear$/i }))

      expect(screen.queryByText('Selected Location:')).not.toBeInTheDocument()
      expect(screen.queryByText(/Current Temp in/)).not.toBeInTheDocument()
    })

    it('removes the geolocation error', async () => {
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

    it('removes the weather error', async () => {
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
