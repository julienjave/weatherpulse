import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useGeolocation } from '../useGeolocation'

describe('useGeolocation', () => {
  const mockGeolocation = {
    getCurrentPosition: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset implementations too, so one test's callback behaviour can't leak into the next
    mockGeolocation.getCurrentPosition.mockReset()
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
    expect(typeof result.current.handleClearGeolocation).toBe('function')
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

  // --- ADDITIONAL COVERAGE ---

  const errorCodes = { PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 }

  it.each([
    [2, 'Location information is unavailable. Please check your device settings.'],
    [3, 'Location request timed out. Please try again.'],
    [99, 'An unexpected error occurred while retrieving your location.'],
  ])('should map error code %i to a readable message', async (code, expectedMessage) => {
    mockGeolocation.getCurrentPosition.mockImplementation((_, errorCallback) => {
      errorCallback({ code, ...errorCodes })
    })

    const { result } = renderHook(() => useGeolocation())

    await act(async () => {
      await result.current.getLocation()
    })

    expect(result.current.error).toBe(expectedMessage)
    expect(result.current.isLoading).toBe(false)
  })

  it('should set isLoading to true while waiting for the browser', () => {
    // Never calls back: simulates the permission prompt still being open
    mockGeolocation.getCurrentPosition.mockImplementation(() => {})

    const { result } = renderHook(() => useGeolocation())

    act(() => {
      result.current.getLocation()
    })

    expect(result.current.isLoading).toBe(true)
  })

  it('should request position with the expected options', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({ coords: { latitude: 0, longitude: 0 } })
    })

    const { result } = renderHook(() => useGeolocation())

    await act(async () => {
      await result.current.getLocation()
    })

    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  })

  it('should clear a previous error when a new request succeeds', async () => {
    mockGeolocation.getCurrentPosition.mockImplementationOnce((_, errorCallback) => {
      errorCallback({ code: 1, ...errorCodes })
    })
    mockGeolocation.getCurrentPosition.mockImplementationOnce((success) => {
      success({ coords: { latitude: 1, longitude: 2 } })
    })

    const { result } = renderHook(() => useGeolocation())

    await act(async () => {
      await result.current.getLocation()
    })
    expect(result.current.error).not.toBeNull()

    await act(async () => {
      await result.current.getLocation()
    })

    expect(result.current.error).toBeNull()
    expect(result.current.coordinates).toEqual({ lat: 1, lon: 2 })
  })

  describe('handleClearGeolocation', () => {
    it('should reset coordinates after a successful lookup', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({ coords: { latitude: 48.8566, longitude: 2.3522 } })
      })

      const { result } = renderHook(() => useGeolocation())

      await act(async () => {
        await result.current.getLocation()
      })
      expect(result.current.coordinates).not.toBeNull()

      act(() => {
        result.current.handleClearGeolocation()
      })

      expect(result.current.coordinates).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should reset an error after a failed lookup', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((_, errorCallback) => {
        errorCallback({ code: 1, ...errorCodes })
      })

      const { result } = renderHook(() => useGeolocation())

      await act(async () => {
        await result.current.getLocation()
      })
      expect(result.current.error).not.toBeNull()

      act(() => {
        result.current.handleClearGeolocation()
      })

      expect(result.current.error).toBeNull()
    })

    it('should turn off the loading state of a pending request', () => {
      mockGeolocation.getCurrentPosition.mockImplementation(() => {})

      const { result } = renderHook(() => useGeolocation())

      act(() => {
        result.current.getLocation()
      })
      expect(result.current.isLoading).toBe(true)

      act(() => {
        result.current.handleClearGeolocation()
      })

      expect(result.current.isLoading).toBe(false)
    })
  })
})