import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useCitySearch } from '../useCitySearch'
import * as weatherApi from '../../services/weatherApi'

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
})