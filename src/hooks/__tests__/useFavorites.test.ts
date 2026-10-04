import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useFavorites, FAVORITES_STORAGE_KEY, MAX_FAVORITES } from '../useFavorites'
import type { GeocodingLocation } from '../../types/weather'

const PARIS: GeocodingLocation = { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'FR' }
const LONDON: GeocodingLocation = { name: 'London', lat: 51.5074, lon: -0.1278, country: 'GB' }

describe('useFavorites', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('should start with an empty list when nothing is stored', () => {
    const { result } = renderHook(() => useFavorites())

    expect(result.current.favorites).toEqual([])
    expect(result.current.isFavorite(PARIS)).toBe(false)
  })

  it('should load existing favorites from localStorage', () => {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([PARIS]))

    const { result } = renderHook(() => useFavorites())

    expect(result.current.favorites).toEqual([PARIS])
    expect(result.current.isFavorite(PARIS)).toBe(true)
  })

  it('should add a city when toggled and persist it', () => {
    const { result } = renderHook(() => useFavorites())

    act(() => {
      result.current.toggleFavorite(PARIS)
    })

    expect(result.current.favorites).toEqual([PARIS])
    expect(result.current.isFavorite(PARIS)).toBe(true)
    expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe(JSON.stringify([PARIS]))
  })

  it('should remove a city when toggled twice', () => {
    const { result } = renderHook(() => useFavorites())

    act(() => {
      result.current.toggleFavorite(PARIS)
    })
    act(() => {
      result.current.toggleFavorite(PARIS)
    })

    expect(result.current.favorites).toEqual([])
    expect(result.current.isFavorite(PARIS)).toBe(false)
  })

  it('should treat cities with near-identical coordinates as the same city', () => {
    const { result } = renderHook(() => useFavorites())
    const parisFromReverseGeocode = { ...PARIS, name: 'Paris 1er', lat: 48.8571, lon: 2.3518 }

    act(() => {
      result.current.toggleFavorite(PARIS)
    })

    expect(result.current.isFavorite(parisFromReverseGeocode)).toBe(true)
  })

  it('should remove only the given city with removeFavorite', () => {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([PARIS, LONDON]))
    const { result } = renderHook(() => useFavorites())

    act(() => {
      result.current.removeFavorite(PARIS)
    })

    expect(result.current.favorites).toEqual([LONDON])
  })

  it('should not add more than MAX_FAVORITES cities but still allow removing', () => {
    const cities = Array.from({ length: MAX_FAVORITES }, (_, i) => ({ ...PARIS, name: `City ${i}`, lat: i, lon: i }))
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(cities))
    const { result } = renderHook(() => useFavorites())

    expect(result.current.isFull).toBe(true)

    act(() => {
      result.current.toggleFavorite(LONDON)
    })
    expect(result.current.favorites).toHaveLength(MAX_FAVORITES)
    expect(result.current.isFavorite(LONDON)).toBe(false)

    act(() => {
      result.current.toggleFavorite(cities[0])
    })
    expect(result.current.favorites).toHaveLength(MAX_FAVORITES - 1)
    expect(result.current.isFull).toBe(false)
  })

  it('should return false from isFavorite when given null', () => {
    const { result } = renderHook(() => useFavorites())

    expect(result.current.isFavorite(null)).toBe(false)
  })
})
