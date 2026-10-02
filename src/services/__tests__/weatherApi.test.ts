import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  searchCityByName,
  getReverseGeocode,
  fetchCurrentWeatherByCoords,
  fetch5DayForecastByCoords,
  fetchAirQualityByCoords,
} from '../weatherApi'

describe('weatherApi service', () => {
  const globalFetch = globalThis.fetch

  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = globalFetch
  })

  describe('searchCityByName', () => {
    it('should return empty array without calling fetch if search term is empty or whitespace', async () => {
      const result = await searchCityByName('   ')
      expect(result).toEqual({ data: [], error: null })
      expect(globalThis.fetch).not.toHaveBeenCalled()
    })

    it('should fetch geocoding data successfully for a valid city name', async () => {
      const mockLocation = [{ name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'FR' }]
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLocation,
      } as Response)

      const result = await searchCityByName('Paris', 5)

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.openweathermap.org/geo/1.0/direct?q=Paris&limit=5&appid='),
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      )
      expect(result).toEqual({ data: mockLocation, error: null })
    })

    it('should return empty data when request is cancelled by external signal', async () => {
      const controller = new AbortController()
      controller.abort()

      const abortError = new Error('The operation was aborted')
      abortError.name = 'AbortError'
      vi.mocked(globalThis.fetch).mockRejectedValueOnce(abortError)

      const result = await searchCityByName('Paris', 5, controller.signal)

      expect(result).toEqual({ data: [], error: null })
    })

    it('should handle API HTTP error response gracefully', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Nothing to geocode' }),
      } as Response)

      const result = await searchCityByName('InvalidQuery')

      expect(result).toEqual({
        data: null,
        error: {
          status: 400,
          message: 'Nothing to geocode',
        },
      })
    })
  })

  describe('getReverseGeocode', () => {
    it('should resolve lat/lon coordinates into location data', async () => {
      const mockLocation = [{ name: 'Sydney', lat: -33.8688, lon: 151.2093, country: 'AU' }]
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLocation,
      } as Response)

      const result = await getReverseGeocode(-33.8688, 151.2093)

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.openweathermap.org/geo/1.0/reverse?lat=-33.8688&lon=151.2093'),
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      )
      expect(result).toEqual({ data: mockLocation, error: null })
    })
  })

  describe('fetchWithEnvelop handlers (fetchCurrentWeatherByCoords, fetch5DayForecastByCoords, fetchAirQualityByCoords)', () => {
    it('should fetch current weather data with specified units', async () => {
      const mockWeather = { main: { temp: 22 }, name: 'Sydney' }
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockWeather,
      } as Response)

      const result = await fetchCurrentWeatherByCoords(-33.8688, 151.2093, 'metric')

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.openweathermap.org/data/2.5/weather?lat=-33.8688&lon=151.2093&units=metric'),
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      )
      expect(result).toEqual({ data: mockWeather, error: null })
    })

    it('should map 401 status to custom invalid API key message', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid API key' }),
      } as Response)

      const result = await fetchCurrentWeatherByCoords(0, 0)

      expect(result).toEqual({
        data: null,
        error: {
          status: 401,
          message: 'Invalid API key. Please check your OpenWeatherMap configuration.',
        },
      })
    })

    it('should map 404 status to custom city not found message', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' }),
      } as Response)

      const result = await fetch5DayForecastByCoords(0, 0)

      expect(result).toEqual({
        data: null,
        error: {
          status: 404,
          message: 'City not found. Please verify the spelling and try again.',
        },
      })
    })

    it('should map 429 status to rate limit message', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ message: 'Rate limit' }),
      } as Response)

      const result = await fetchAirQualityByCoords(0, 0)

      expect(result).toEqual({
        data: null,
        error: {
          status: 429,
          message: 'API rate limit exceeded. Please wait a moment before searching again.',
        },
      })
    })

    it('should handle request timeout (AbortError) and return 408 error envelope', async () => {
      const abortError = new Error('The operation was aborted')
      abortError.name = 'AbortError'
      vi.mocked(globalThis.fetch).mockRejectedValueOnce(abortError)

      const result = await fetchCurrentWeatherByCoords(0, 0)

      expect(result).toEqual({
        data: null,
        error: {
          status: 408,
          message: 'Request timed out. Please check your network connection.',
        },
      })
    })

    it('should handle generic network failures with 500 error envelope', async () => {
      vi.mocked(globalThis.fetch).mockRejectedValueOnce(new Error('Network error'))

      const result = await fetchAirQualityByCoords(0, 0)

      expect(result).toEqual({
        data: null,
        error: {
          status: 500,
          message: 'Network error',
        },
      })
    })
  })
})