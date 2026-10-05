import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useCitySearch } from '../useCitySearch'
import * as weatherApi from '../../services/weatherApi'

type SearchResult = Awaited<ReturnType<typeof weatherApi.searchCityByName>>

vi.mock('../../services/weatherApi', () => ({
  searchCityByName: vi.fn(),
}))

describe('useCitySearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default empty states', () => {
    const { result } = renderHook(() => useCitySearch())

    expect(result.current.searchTerm).toBe('')
    expect(result.current.options).toEqual([])
    expect(result.current.isSearching).toBe(false)
    expect(result.current.searchError).toBeNull()
  })

  it('should update searchTerm immediately on input change', () => {
    const { result } = renderHook(() => useCitySearch())

    act(() => {
      result.current.handleInputChange('Paris')
    })

    expect(result.current.searchTerm).toBe('Paris')
  })

  it('should reset state when input is cleared or less than 2 characters', () => {
    const { result } = renderHook(() => useCitySearch())

    act(() => {
      result.current.handleInputChange('P')
    })

    expect(result.current.options).toEqual([])
    expect(result.current.isSearching).toBe(false)
    expect(result.current.searchError).toBeNull()
    expect(weatherApi.searchCityByName).not.toHaveBeenCalled()
  })

  it('should trigger debounced search after 500ms', async () => {
    const mockLocations = [
      { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'FR' },
    ]
    vi.mocked(weatherApi.searchCityByName).mockResolvedValueOnce({
      data: mockLocations,
      error: null,
    })

    const { result } = renderHook(() => useCitySearch())

    act(() => {
      result.current.handleInputChange('Paris')
    })

    expect(weatherApi.searchCityByName).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(weatherApi.searchCityByName).toHaveBeenCalledWith(
      'Paris',
      5,
      expect.any(AbortSignal)
    )
    expect(result.current.options).toEqual(mockLocations)
    expect(result.current.isSearching).toBe(false)
  })

  it('should handle API search error gracefully', async () => {
    vi.mocked(weatherApi.searchCityByName).mockResolvedValueOnce({
      data: null,
      error: { status: 404, message: 'City not found.' },
    })

    const { result } = renderHook(() => useCitySearch())

    act(() => {
      result.current.handleInputChange('InvalidCity')
    })

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current.searchError).toBe('City not found.')
    expect(result.current.options).toEqual([])
    expect(result.current.isSearching).toBe(false)
  })

  // --- ADDITIONAL COVERAGE ---

  const paris = [{ name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'FR' }]
  const london = [{ name: 'London', lat: 51.5072, lon: -0.1276, country: 'GB' }]

  function deferred<T>() {
    let resolve!: (value: T) => void
    const promise = new Promise<T>((r) => { resolve = r })
    return { promise, resolve }
  }

  it('should collapse rapid typing into a single search for the latest value', async () => {
    vi.mocked(weatherApi.searchCityByName).mockResolvedValue({ data: paris, error: null })
    const { result } = renderHook(() => useCitySearch())

    for (const value of ['Pa', 'Par', 'Pari', 'Paris']) {
      act(() => {
        result.current.handleInputChange(value)
      })
      act(() => {
        vi.advanceTimersByTime(200)
      })
    }

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(weatherApi.searchCityByName).toHaveBeenCalledTimes(1)
    expect(weatherApi.searchCityByName).toHaveBeenCalledWith('Paris', 5, expect.any(AbortSignal))
  })

  it('should search with the trimmed query but keep the raw searchTerm', async () => {
    vi.mocked(weatherApi.searchCityByName).mockResolvedValue({ data: paris, error: null })
    const { result } = renderHook(() => useCitySearch())

    act(() => {
      result.current.handleInputChange('  Paris  ')
    })

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current.searchTerm).toBe('  Paris  ')
    expect(weatherApi.searchCityByName).toHaveBeenCalledWith('Paris', 5, expect.any(AbortSignal))
  })

  it('should treat whitespace-padded single characters as too short', async () => {
    const { result } = renderHook(() => useCitySearch())

    act(() => {
      result.current.handleInputChange('  P  ')
    })

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(weatherApi.searchCityByName).not.toHaveBeenCalled()
  })

  it('should set isSearching to true while a request is in flight', async () => {
    const pending = deferred<SearchResult>()
    vi.mocked(weatherApi.searchCityByName).mockReturnValueOnce(pending.promise)
    const { result } = renderHook(() => useCitySearch())

    act(() => {
      result.current.handleInputChange('Paris')
    })
    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current.isSearching).toBe(true)

    await act(async () => {
      pending.resolve({ data: paris, error: null })
    })

    expect(result.current.isSearching).toBe(false)
    expect(result.current.options).toEqual(paris)
  })

  it('should set isSearching to true during the debounce delay, before the request starts', () => {
    const { result } = renderHook(() => useCitySearch())

    act(() => {
      result.current.handleInputChange('Paris')
    })

    expect(result.current.isSearching).toBe(true)
    expect(weatherApi.searchCityByName).not.toHaveBeenCalled()
  })

  it('should cancel a pending debounced search when the input is cleared', async () => {
    const { result } = renderHook(() => useCitySearch())

    act(() => {
      result.current.handleInputChange('Paris')
    })
    act(() => {
      vi.advanceTimersByTime(300)
      result.current.handleInputChange('')
    })

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    expect(weatherApi.searchCityByName).not.toHaveBeenCalled()
    expect(result.current.searchTerm).toBe('')
    expect(result.current.isSearching).toBe(false)
  })

  it('should abort an in-flight request and ignore its result when the input is cleared', async () => {
    const pending = deferred<SearchResult>()
    vi.mocked(weatherApi.searchCityByName).mockReturnValueOnce(pending.promise)
    const { result } = renderHook(() => useCitySearch())

    act(() => {
      result.current.handleInputChange('Paris')
    })
    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    const signal = vi.mocked(weatherApi.searchCityByName).mock.calls[0][2] as AbortSignal

    act(() => {
      result.current.handleInputChange('')
    })

    expect(signal.aborted).toBe(true)
    expect(result.current.isSearching).toBe(false)

    await act(async () => {
      pending.resolve({ data: paris, error: null })
    })

    expect(result.current.options).toEqual([])
  })

  it('should clear previous options and error when the input is cleared', async () => {
    vi.mocked(weatherApi.searchCityByName).mockResolvedValueOnce({
      data: null,
      error: { status: 500, message: 'Boom' },
    })
    const { result } = renderHook(() => useCitySearch())

    act(() => {
      result.current.handleInputChange('Paris')
    })
    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    expect(result.current.searchError).toBe('Boom')

    act(() => {
      result.current.handleInputChange('')
    })

    expect(result.current.searchError).toBeNull()
    expect(result.current.options).toEqual([])
  })

  it('should abort an older request when a newer search starts, ignoring the stale result', async () => {
    const first = deferred<SearchResult>()
    vi.mocked(weatherApi.searchCityByName)
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({ data: london, error: null })

    const { result } = renderHook(() => useCitySearch())

    act(() => {
      result.current.handleInputChange('Paris')
    })
    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    const firstSignal = vi.mocked(weatherApi.searchCityByName).mock.calls[0][2] as AbortSignal

    act(() => {
      result.current.handleInputChange('London')
    })
    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(firstSignal.aborted).toBe(true)
    expect(result.current.options).toEqual(london)

    await act(async () => {
      first.resolve({ data: paris, error: null })
    })

    expect(result.current.options).toEqual(london)
  })

  it('should cancel a pending search on unmount', async () => {
    const { result, unmount } = renderHook(() => useCitySearch())

    act(() => {
      result.current.handleInputChange('Paris')
    })
    unmount()

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    expect(weatherApi.searchCityByName).not.toHaveBeenCalled()
  })
})