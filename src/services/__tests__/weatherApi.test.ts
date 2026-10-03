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

  // --- ADDITIONAL COVERAGE ---

  const makeAbortError = () => {
    const err = new Error('The operation was aborted')
    err.name = 'AbortError'
    return err
  }

  // A fetch that never resolves, but rejects with AbortError once its signal aborts
  const mockHangingFetch = () => {
    vi.mocked(globalThis.fetch).mockImplementationOnce(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(makeAbortError()))
        })
    )
  }

  const okResponse = (payload: unknown) => ({ ok: true, json: async () => payload }) as Response
  const errorResponse = (status: number, payload: unknown = {}) =>
    ({ ok: false, status, json: async () => payload }) as Response

  const lastFetchUrl = () => vi.mocked(globalThis.fetch).mock.calls.at(-1)![0] as string
  const lastFetchSignal = () =>
    (vi.mocked(globalThis.fetch).mock.calls.at(-1)![1] as RequestInit).signal as AbortSignal

  describe('searchCityByName (additional)', () => {
    it('should trim the query and use the default limit of 5', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(okResponse([]))

      await searchCityByName('  New York  ')

      const params = new URL(lastFetchUrl()).searchParams
      expect(params.get('q')).toBe('New York')
      expect(params.get('limit')).toBe('5')
      expect(params.has('appid')).toBe(true)
    })

    it('should fall back to a default message when the error payload has none', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(errorResponse(502))

      const result = await searchCityByName('Paris')

      expect(result).toEqual({
        data: null,
        error: { status: 502, message: 'Failed to search locations.' },
      })
    })

    it('should return a 500 envelope on network failure', async () => {
      vi.mocked(globalThis.fetch).mockRejectedValueOnce(new Error('Failed to fetch'))

      const result = await searchCityByName('Paris')

      expect(result).toEqual({ data: null, error: { status: 500, message: 'Failed to fetch' } })
    })

    it('should forward external cancellation to the fetch signal', async () => {
      const controller = new AbortController()
      mockHangingFetch()

      const promise = searchCityByName('Paris', 5, controller.signal)
      expect(lastFetchSignal().aborted).toBe(false)

      controller.abort()

      expect(lastFetchSignal().aborted).toBe(true)
      await expect(promise).resolves.toEqual({ data: [], error: null })
    })

    describe('timeout', () => {
      beforeEach(() => vi.useFakeTimers())
      afterEach(() => vi.useRealTimers())

      it('should return a 408 envelope after 8 seconds without an external signal', async () => {
        mockHangingFetch()

        const promise = searchCityByName('Paris')
        await vi.advanceTimersByTimeAsync(8000)

        await expect(promise).resolves.toEqual({
          data: null,
          error: { status: 408, message: 'Search timed out. Please check your network connection.' },
        })
      })

      it('should still report a timeout when an external signal is provided but not aborted', async () => {
        const controller = new AbortController()
        mockHangingFetch()

        const promise = searchCityByName('Paris', 5, controller.signal)
        await vi.advanceTimersByTimeAsync(8000)

        const result = await promise
        expect(result.error?.status).toBe(408)
      })

      it('should not time out before 8 seconds', async () => {
        mockHangingFetch()

        searchCityByName('Paris')
        await vi.advanceTimersByTimeAsync(7999)

        expect(lastFetchSignal().aborted).toBe(false)
      })
    })
  })

  describe('getReverseGeocode (additional)', () => {
    it('should use a default limit of 1 and accept a custom limit', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue(okResponse([]))

      await getReverseGeocode(1, 2)
      expect(new URL(lastFetchUrl()).searchParams.get('limit')).toBe('1')

      await getReverseGeocode(1, 2, 3)
      expect(new URL(lastFetchUrl()).searchParams.get('limit')).toBe('3')
    })

    it('should return the API error message on HTTP errors', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(errorResponse(400, { message: 'wrong latitude' }))

      const result = await getReverseGeocode(999, 0)

      expect(result).toEqual({ data: null, error: { status: 400, message: 'wrong latitude' } })
    })

    it('should fall back to a default message when the error payload has none', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(errorResponse(500))

      const result = await getReverseGeocode(0, 0)

      expect(result.error?.message).toBe('Failed to reverse geocode coordinates.')
    })

    it('should return empty data when cancelled by an external signal', async () => {
      const controller = new AbortController()
      controller.abort()
      vi.mocked(globalThis.fetch).mockRejectedValueOnce(makeAbortError())

      const result = await getReverseGeocode(0, 0, 1, controller.signal)

      expect(result).toEqual({ data: [], error: null })
    })

    it('should return a 408 envelope when the request times out', async () => {
      vi.mocked(globalThis.fetch).mockRejectedValueOnce(makeAbortError())

      const result = await getReverseGeocode(0, 0)

      expect(result).toEqual({
        data: null,
        error: {
          status: 408,
          message: 'Reverse geocode request timed out. Please check your network connection.',
        },
      })
    })

    it('should return a 500 envelope on network failure', async () => {
      vi.mocked(globalThis.fetch).mockRejectedValueOnce(new Error('Failed to fetch'))

      const result = await getReverseGeocode(0, 0)

      expect(result).toEqual({ data: null, error: { status: 500, message: 'Failed to fetch' } })
    })
  })

  describe('fetchWithEnvelop handlers (additional)', () => {
    it('should call the forecast endpoint with units', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(okResponse({ list: [] }))

      await fetch5DayForecastByCoords(10, 20, 'imperial')

      const url = new URL(lastFetchUrl())
      expect(url.pathname).toBe('/data/2.5/forecast')
      expect(url.searchParams.get('units')).toBe('imperial')
    })

    it('should call the air pollution endpoint without a units parameter', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(okResponse({ list: [] }))

      await fetchAirQualityByCoords(10, 20)

      const url = new URL(lastFetchUrl())
      expect(url.pathname).toBe('/data/2.5/air_pollution')
      expect(url.searchParams.get('lat')).toBe('10')
      expect(url.searchParams.get('lon')).toBe('20')
      expect(url.searchParams.has('units')).toBe(false)
      expect(url.searchParams.has('appid')).toBe(true)
    })

    it('should default to metric units', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(okResponse({}))

      await fetchCurrentWeatherByCoords(0, 0)

      expect(new URL(lastFetchUrl()).searchParams.get('units')).toBe('metric')
    })

    it('should capitalize the raw API message for unmapped error statuses', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(errorResponse(400, { message: 'wrong latitude' }))

      const result = await fetchCurrentWeatherByCoords(999, 0)

      expect(result).toEqual({ data: null, error: { status: 400, message: 'Wrong latitude' } })
    })

    it('should use a generic message for unmapped error statuses without a message', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(errorResponse(503))

      const result = await fetchCurrentWeatherByCoords(0, 0)

      expect(result).toEqual({ data: null, error: { status: 503, message: 'Failed to fetch weather data.' } })
    })

    it('should return a 500 envelope when the response body is not valid JSON', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new SyntaxError('Unexpected token <') },
      } as unknown as Response)

      const result = await fetchCurrentWeatherByCoords(0, 0)

      expect(result).toEqual({ data: null, error: { status: 500, message: 'Unexpected token <' } })
    })

    it('should forward external cancellation to the fetch signal', async () => {
      const controller = new AbortController()
      mockHangingFetch()

      const promise = fetchCurrentWeatherByCoords(0, 0, 'metric', controller.signal)
      controller.abort()

      expect(lastFetchSignal().aborted).toBe(true)
      // fetchWithEnvelop does not distinguish user cancellation from timeout;
      // callers (useWeather) must check their own signal before using the result
      expect((await promise).error?.status).toBe(408)
    })

    describe('timeout', () => {
      beforeEach(() => vi.useFakeTimers())
      afterEach(() => vi.useRealTimers())

      it('should abort the request after 8 seconds and return a 408 envelope', async () => {
        mockHangingFetch()

        const promise = fetchAirQualityByCoords(0, 0)
        await vi.advanceTimersByTimeAsync(8000)

        await expect(promise).resolves.toEqual({
          data: null,
          error: { status: 408, message: 'Request timed out. Please check your network connection.' },
        })
      })
    })
  })
})