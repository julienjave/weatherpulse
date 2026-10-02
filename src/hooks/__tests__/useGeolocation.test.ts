import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useGeolocation } from '../useGeolocation'

describe('useGeolocation', () => {
  const mockGeolocation = {
    getCurrentPosition: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Inject mock geolocation into global navigator
    Object.defineProperty(window.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useGeolocation())

    expect(result.current.coordinates).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(typeof result.current.getLocation).toBe('function')
  })

  it('should handle successful position retrieval', async () => {
    const mockPosition = {
      coords: {
        latitude: 48.8566,
        longitude: 2.3522,
      },
    }

    mockGeolocation.getCurrentPosition.mockImplementation((successCallback) => {
      successCallback(mockPosition)
    })

    const { result } = renderHook(() => useGeolocation())

    let coordsResult: unknown

    await act(async () => {
      coordsResult = await result.current.getLocation()
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.coordinates).toEqual({ lat: 48.8566, lon: 2.3522 })
    expect(coordsResult).toEqual({ lat: 48.8566, lon: 2.3522 })
  })

  it('should handle geolocation permission denied error', async () => {
    const mockError = {
      code: 1, // PERMISSION_DENIED
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    }

    mockGeolocation.getCurrentPosition.mockImplementation((_, errorCallback) => {
      errorCallback(mockError)
    })

    const { result } = renderHook(() => useGeolocation())

    let coordsResult: unknown

    await act(async () => {
      coordsResult = await result.current.getLocation()
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.coordinates).toBeNull()
    expect(result.current.error).toBe(
      'Location access was denied. Please allow location permissions in your browser.'
    )
    expect(coordsResult).toBeNull()
  })

  it('should handle browser without geolocation support', async () => {
    // Delete navigator.geolocation to simulate unsupported browser
    // @ts-expect-error Mocking unsupported environment
    delete global.navigator.geolocation

    const { result } = renderHook(() => useGeolocation())

    let coordsResult: unknown

    await act(async () => {
      coordsResult = await result.current.getLocation()
    })

    expect(result.current.error).toBe('Geolocation is not supported by your browser.')
    expect(result.current.coordinates).toBeNull()
    expect(coordsResult).toBeNull()
  })
})