import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useWeather } from '../useWeather'
import * as weatherApi from '../../services/weatherApi'
import type { GeocodingLocation } from '../../types/weather'

type CurrentWeatherResult = Awaited<ReturnType<typeof weatherApi.fetchCurrentWeatherByCoords>>

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
      data: mockCurrent as never,
      error: null,
    })
    vi.mocked(weatherApi.fetch5DayForecastByCoords).mockResolvedValueOnce({
      data: mockForecast as never,
      error: null,
    })
    vi.mocked(weatherApi.fetchAirQualityByCoords).mockResolvedValueOnce({
      data: mockAqi as never,
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
      data: { name: 'Sydney' } as never,
      error: null,
    })
    vi.mocked(weatherApi.fetch5DayForecastByCoords).mockResolvedValue({
      data: { list: [] } as never,
      error: null,
    })
    vi.mocked(weatherApi.fetchAirQualityByCoords).mockResolvedValue({
      data: { list: [] } as never,
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
      data: { list: [] } as never,
      error: null,
    })
    vi.mocked(weatherApi.fetchAirQualityByCoords).mockResolvedValueOnce({
      data: { list: [] } as never,
      error: null,
    })

    const { result } = renderHook(() => useWeather())

    await act(async () => {
      result.current.handleSelectLocation(mockLocation)
    })

    expect(result.current.error).toBe('Server error')
    expect(result.current.isLoading).toBe(false)
    // Primary failure means the whole load is treated as failed
    expect(result.current.weatherData).toBeNull()
    expect(result.current.forecastData).toBeNull()
  })

  // --- ADDITIONAL COVERAGE ---

  const mockAllSuccess = () => {
    vi.mocked(weatherApi.fetchCurrentWeatherByCoords).mockResolvedValue({
      data: { name: 'Sydney', main: { temp: 22 } } as never,
      error: null,
    })
    vi.mocked(weatherApi.fetch5DayForecastByCoords).mockResolvedValue({
      data: { list: [] } as never,
      error: null,
    })
    vi.mocked(weatherApi.fetchAirQualityByCoords).mockResolvedValue({
      data: { list: [] } as never,
      error: null,
    })
  }

  // Returns a promise that we resolve manually, to inspect in-flight state
  function deferred<T>() {
    let resolve!: (value: T) => void
    const promise = new Promise<T>((r) => { resolve = r })
    return { promise, resolve }
  }

  it('should keep dataUnits on the old unit until the unit-toggle refetch lands', async () => {
    vi.mocked(weatherApi.fetchCurrentWeatherByCoords).mockResolvedValueOnce({ data: { name: 'Sydney' } as never, error: null })
    vi.mocked(weatherApi.fetch5DayForecastByCoords).mockResolvedValue({ data: { list: [] } as never, error: null })
    vi.mocked(weatherApi.fetchAirQualityByCoords).mockResolvedValue({ data: { list: [] } as never, error: null })

    const { result } = renderHook(() => useWeather())

    await act(async () => {
      result.current.handleSelectLocation(mockLocation)
    })
    expect(result.current.dataUnits).toBe('metric')

    // Hold the refetch in flight
    const pending = deferred<CurrentWeatherResult>()
    vi.mocked(weatherApi.fetchCurrentWeatherByCoords).mockReturnValueOnce(pending.promise)

    act(() => {
      result.current.handleToggleUnits()
    })

    // Switch state flips instantly, the displayed data's unit doesn't
    expect(result.current.units).toBe('imperial')
    expect(result.current.dataUnits).toBe('metric')

    await act(async () => {
      pending.resolve({ data: { name: 'Sydney' } as never, error: null })
    })

    expect(result.current.dataUnits).toBe('imperial')
  })

  it('should keep dataUnits on the old unit when the unit-toggle refetch fails', async () => {
    vi.mocked(weatherApi.fetchCurrentWeatherByCoords).mockResolvedValueOnce({ data: { name: 'Sydney' } as never, error: null })
    vi.mocked(weatherApi.fetch5DayForecastByCoords).mockResolvedValue({ data: { list: [] } as never, error: null })
    vi.mocked(weatherApi.fetchAirQualityByCoords).mockResolvedValue({ data: { list: [] } as never, error: null })

    const { result } = renderHook(() => useWeather())

    await act(async () => {
      result.current.handleSelectLocation(mockLocation)
    })

    vi.mocked(weatherApi.fetchCurrentWeatherByCoords).mockResolvedValueOnce({
      data: null,
      error: { message: 'Server error' } as never,
    })

    await act(async () => {
      result.current.handleToggleUnits()
    })

    // The old °C data is still on screen, so it must keep its °C label
    expect(result.current.units).toBe('imperial')
    expect(result.current.dataUnits).toBe('metric')
  })

  it('should drop the old-unit forecast (but keep air quality) when only the forecast refetch fails', async () => {
    vi.mocked(weatherApi.fetchCurrentWeatherByCoords).mockResolvedValue({ data: { name: 'Sydney' } as never, error: null })
    vi.mocked(weatherApi.fetch5DayForecastByCoords).mockResolvedValueOnce({ data: { list: [] } as never, error: null })
    vi.mocked(weatherApi.fetchAirQualityByCoords).mockResolvedValue({ data: { list: [] } as never, error: null })

    const { result } = renderHook(() => useWeather())

    await act(async () => {
      result.current.handleSelectLocation(mockLocation)
    })
    expect(result.current.forecastData).not.toBeNull()

    vi.mocked(weatherApi.fetch5DayForecastByCoords).mockResolvedValueOnce({
      data: null,
      error: { status: 500, message: 'Forecast down' },
    })

    await act(async () => {
      result.current.handleToggleUnits()
    })

    // °F current weather landed, so a °C forecast can't stay on screen under the °F label
    expect(result.current.dataUnits).toBe('imperial')
    expect(result.current.forecastData).toBeNull()
    // Air quality doesn't depend on the unit, so the last reading is still valid
    expect(result.current.aqiData).toEqual({ list: [] })
    expect(result.current.error).toBeNull()
  })

  it('should not fetch when toggling units without a selected city', async () => {
    const { result } = renderHook(() => useWeather())

    await act(async () => {
      result.current.handleToggleUnits()
    })

    expect(result.current.units).toBe('imperial')
    expect(weatherApi.fetchCurrentWeatherByCoords).not.toHaveBeenCalled()
  })

  it('should toggle back to metric on a second toggle', async () => {
    const { result } = renderHook(() => useWeather())

    await act(async () => {
      result.current.handleToggleUnits()
    })
    await act(async () => {
      result.current.handleToggleUnits()
    })

    expect(result.current.units).toBe('metric')
  })

  it('should set isLoading to true while requests are in flight', async () => {
    mockAllSuccess()
    const pending = deferred<CurrentWeatherResult>()
    vi.mocked(weatherApi.fetchCurrentWeatherByCoords).mockReturnValueOnce(pending.promise)

    const { result } = renderHook(() => useWeather())

    act(() => {
      result.current.handleSelectLocation(mockLocation)
    })

    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      pending.resolve({ data: { name: 'Sydney' } as never, error: null })
    })

    expect(result.current.isLoading).toBe(false)
  })

  it('should keep primary weather data when secondary APIs fail', async () => {
    vi.mocked(weatherApi.fetchCurrentWeatherByCoords).mockResolvedValueOnce({
      data: { name: 'Sydney' } as never,
      error: null,
    })
    vi.mocked(weatherApi.fetch5DayForecastByCoords).mockResolvedValueOnce({
      data: null,
      error: { status: 500, message: 'Forecast down' },
    })
    vi.mocked(weatherApi.fetchAirQualityByCoords).mockResolvedValueOnce({
      data: null,
      error: { status: 500, message: 'AQI down' },
    })

    const { result } = renderHook(() => useWeather())

    await act(async () => {
      result.current.handleSelectLocation(mockLocation)
    })

    expect(result.current.weatherData).toEqual({ name: 'Sydney' })
    expect(result.current.forecastData).toBeNull()
    expect(result.current.aqiData).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('should set a generic error message when a fetch throws unexpectedly', async () => {
    mockAllSuccess()
    vi.mocked(weatherApi.fetch5DayForecastByCoords).mockRejectedValueOnce(new Error('boom'))

    const { result } = renderHook(() => useWeather())

    await act(async () => {
      result.current.handleSelectLocation(mockLocation)
    })

    expect(result.current.error).toBe('An unexpected error occurred while fetching weather data.')
    expect(result.current.isLoading).toBe(false)
  })

  it('should clear a previous error when a new location is selected', async () => {
    vi.mocked(weatherApi.fetchCurrentWeatherByCoords).mockResolvedValueOnce({
      data: null,
      error: { status: 500, message: 'Server error' },
    })
    vi.mocked(weatherApi.fetch5DayForecastByCoords).mockResolvedValueOnce({ data: { list: [] } as never, error: null })
    vi.mocked(weatherApi.fetchAirQualityByCoords).mockResolvedValueOnce({ data: { list: [] } as never, error: null })

    const { result } = renderHook(() => useWeather())

    await act(async () => {
      result.current.handleSelectLocation(mockLocation)
    })
    expect(result.current.error).toBe('Server error')

    mockAllSuccess()
    await act(async () => {
      result.current.handleSelectLocation(mockLocation)
    })

    expect(result.current.error).toBeNull()
    expect(result.current.weatherData).toEqual({ name: 'Sydney', main: { temp: 22 } })
  })

  it('should clear the previous city data as soon as a new location is selected', async () => {
    mockAllSuccess()
    const { result } = renderHook(() => useWeather())

    await act(async () => {
      result.current.handleSelectLocation(mockLocation)
    })
    expect(result.current.weatherData).not.toBeNull()

    // Second request never settles, so we observe the in-between state
    vi.mocked(weatherApi.fetchCurrentWeatherByCoords).mockReturnValueOnce(new Promise(() => {}))
    vi.mocked(weatherApi.fetch5DayForecastByCoords).mockReturnValueOnce(new Promise(() => {}))
    vi.mocked(weatherApi.fetchAirQualityByCoords).mockReturnValueOnce(new Promise(() => {}))

    act(() => {
      result.current.handleSelectLocation({ name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'FR' })
    })

    expect(result.current.weatherData).toBeNull()
    expect(result.current.forecastData).toBeNull()
    expect(result.current.aqiData).toBeNull()
    expect(result.current.isLoading).toBe(true)
  })

  it('should abort the previous request and ignore its result when a new location is selected', async () => {
    mockAllSuccess()
    const firstRequest = deferred<CurrentWeatherResult>()
    vi.mocked(weatherApi.fetchCurrentWeatherByCoords).mockReturnValueOnce(firstRequest.promise)

    const paris: GeocodingLocation = { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'FR' }
    const { result } = renderHook(() => useWeather())

    act(() => {
      result.current.handleSelectLocation(paris)
    })
    const firstSignal = vi.mocked(weatherApi.fetchCurrentWeatherByCoords).mock.calls[0][3] as AbortSignal

    await act(async () => {
      result.current.handleSelectLocation(mockLocation)
    })

    expect(firstSignal.aborted).toBe(true)

    // The stale Paris response arrives late and must be ignored
    await act(async () => {
      firstRequest.resolve({ data: { name: 'Paris' } as never, error: null })
    })

    expect(result.current.selectedCity).toEqual(mockLocation)
    expect(result.current.weatherData).toEqual({ name: 'Sydney', main: { temp: 22 } })
    expect(result.current.isLoading).toBe(false)
  })

  describe('handleClearLocation', () => {
    it('should reset all weather state after a successful load', async () => {
      mockAllSuccess()
      const { result } = renderHook(() => useWeather())

      await act(async () => {
        result.current.handleSelectLocation(mockLocation)
      })
      expect(result.current.weatherData).not.toBeNull()

      act(() => {
        result.current.handleClearLocation()
      })

      expect(result.current.selectedCity).toBeNull()
      expect(result.current.weatherData).toBeNull()
      expect(result.current.forecastData).toBeNull()
      expect(result.current.aqiData).toBeNull()
      expect(result.current.error).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })

    it('should clear an existing error', async () => {
      vi.mocked(weatherApi.fetchCurrentWeatherByCoords).mockResolvedValueOnce({
        data: null,
        error: { status: 500, message: 'Server error' },
      })
      vi.mocked(weatherApi.fetch5DayForecastByCoords).mockResolvedValueOnce({ data: { list: [] } as never, error: null })
      vi.mocked(weatherApi.fetchAirQualityByCoords).mockResolvedValueOnce({ data: { list: [] } as never, error: null })

      const { result } = renderHook(() => useWeather())

      await act(async () => {
        result.current.handleSelectLocation(mockLocation)
      })

      act(() => {
        result.current.handleClearLocation()
      })

      expect(result.current.error).toBeNull()
    })

    it('should preserve the selected temperature unit', async () => {
      const { result } = renderHook(() => useWeather())

      await act(async () => {
        result.current.handleToggleUnits()
      })
      act(() => {
        result.current.handleClearLocation()
      })

      expect(result.current.units).toBe('imperial')
    })

    it('should abort an in-flight request and ignore its late result', async () => {
      mockAllSuccess()
      const pending = deferred<CurrentWeatherResult>()
      vi.mocked(weatherApi.fetchCurrentWeatherByCoords).mockReturnValueOnce(pending.promise)

      const { result } = renderHook(() => useWeather())

      act(() => {
        result.current.handleSelectLocation(mockLocation)
      })
      const signal = vi.mocked(weatherApi.fetchCurrentWeatherByCoords).mock.calls[0][3] as AbortSignal

      act(() => {
        result.current.handleClearLocation()
      })

      expect(signal.aborted).toBe(true)
      expect(result.current.isLoading).toBe(false)

      await act(async () => {
        pending.resolve({ data: { name: 'Sydney' } as never, error: null })
      })

      expect(result.current.weatherData).toBeNull()
      expect(result.current.selectedCity).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('should abort an in-flight request on unmount', () => {
    mockAllSuccess()
    vi.mocked(weatherApi.fetchCurrentWeatherByCoords).mockReturnValueOnce(new Promise(() => {}))

    const { result, unmount } = renderHook(() => useWeather())

    act(() => {
      result.current.handleSelectLocation(mockLocation)
    })
    const signal = vi.mocked(weatherApi.fetchCurrentWeatherByCoords).mock.calls[0][3] as AbortSignal

    unmount()

    expect(signal.aborted).toBe(true)
  })
})