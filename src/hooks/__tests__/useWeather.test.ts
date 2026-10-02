import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useWeather } from '../useWeather'
import * as weatherApi from '../../services/weatherApi'
import type { GeocodingLocation } from '../../types/weather'

vi.mock('../../services/weatherApi', () => ({
  fetchCurrentWeatherByCoords: vi.fn(),
  fetch5DayForecastByCoords: vi.fn(),
  fetchAirQualityByCoords: vi.fn(),
}))

describe('useWeather', () => {
  const mockLocation: GeocodingLocation = {
    name: 'Sydney',
    lat: -33.8688,
    lon: 151.2093,
    country: 'AU',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default states', () => {
    const { result } = renderHook(() => useWeather())

    expect(result.current.weatherData).toBeNull()
    expect(result.current.forecastData).toBeNull()
    expect(result.current.aqiData).toBeNull()
    expect(result.current.selectedCity).toBeNull()
    expect(result.current.units).toBe('metric')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should fetch all weather datasets concurrently when location is selected', async () => {
    const mockCurrent = { name: 'Sydney', main: { temp: 22 } }
    const mockForecast = { list: [] }
    const mockAqi = { list: [] }

    vi.mocked(weatherApi.fetchCurrentWeatherByCoords).mockResolvedValueOnce({
      data: mockCurrent as any,
      error: null,
    })
    vi.mocked(weatherApi.fetch5DayForecastByCoords).mockResolvedValueOnce({
      data: mockForecast as any,
      error: null,
    })
    vi.mocked(weatherApi.fetchAirQualityByCoords).mockResolvedValueOnce({
      data: mockAqi as any,
      error: null,
    })

    const { result } = renderHook(() => useWeather())

    await act(async () => {
      result.current.handleSelectLocation(mockLocation)
    })

    expect(result.current.selectedCity).toEqual(mockLocation)
    expect(weatherApi.fetchCurrentWeatherByCoords).toHaveBeenCalledWith(
      -33.8688,
      151.2093,
      'metric',
      expect.any(AbortSignal)
    )
    expect(result.current.weatherData).toEqual(mockCurrent)
    expect(result.current.forecastData).toEqual(mockForecast)
    expect(result.current.aqiData).toEqual(mockAqi)
    expect(result.current.isLoading).toBe(false)
  })

  it('should toggle temperature units and refetch weather data', async () => {
    vi.mocked(weatherApi.fetchCurrentWeatherByCoords).mockResolvedValue({
      data: { name: 'Sydney' } as any,
      error: null,
    })
    vi.mocked(weatherApi.fetch5DayForecastByCoords).mockResolvedValue({
      data: { list: [] } as any,
      error: null,
    })
    vi.mocked(weatherApi.fetchAirQualityByCoords).mockResolvedValue({
      data: { list: [] } as any,
      error: null,
    })

    const { result } = renderHook(() => useWeather())

    await act(async () => {
      result.current.handleSelectLocation(mockLocation)
    })

    await act(async () => {
      result.current.handleToggleUnits()
    })

    expect(result.current.units).toBe('imperial')
    expect(weatherApi.fetchCurrentWeatherByCoords).toHaveBeenLastCalledWith(
      -33.8688,
      151.2093,
      'imperial',
      expect.any(AbortSignal)
    )
  })

  it('should handle primary weather API errors', async () => {
    vi.mocked(weatherApi.fetchCurrentWeatherByCoords).mockResolvedValueOnce({
      data: null,
      error: { status: 500, message: 'Server error' },
    })
    vi.mocked(weatherApi.fetch5DayForecastByCoords).mockResolvedValueOnce({
      data: null,
      error: null,
    })
    vi.mocked(weatherApi.fetchAirQualityByCoords).mockResolvedValueOnce({
      data: null,
      error: null,
    })

    const { result } = renderHook(() => useWeather())

    await act(async () => {
      result.current.handleSelectLocation(mockLocation)
    })

    expect(result.current.error).toBe('Server error')
    expect(result.current.isLoading).toBe(false)
  })
})