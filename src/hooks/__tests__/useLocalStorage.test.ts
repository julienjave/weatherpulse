import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useLocalStorage } from '../useLocalStorage'

describe('useLocalStorage', () => {
  const TEST_KEY = 'test_key'

  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('should return initial value when key does not exist in localStorage', () => {
    const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'default_value'))

    expect(result.current[0]).toBe('default_value')
  })

  it('should read existing parsed JSON value from localStorage', () => {
    window.localStorage.setItem(TEST_KEY, JSON.stringify({ city: 'Paris' }))

    const { result } = renderHook(() => useLocalStorage(TEST_KEY, { city: 'Default' }))

    expect(result.current[0]).toEqual({ city: 'Paris' })
  })

  it('should update state and write serialized JSON to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage<string[]>(TEST_KEY, []))

    act(() => {
      result.current[1](['Paris', 'Sydney'])
    })

    expect(result.current[0]).toEqual(['Paris', 'Sydney'])
    expect(window.localStorage.getItem(TEST_KEY)).toBe(JSON.stringify(['Paris', 'Sydney']))
  })

  it('should handle functional state updates correctly', () => {
    const { result } = renderHook(() => useLocalStorage<number>(TEST_KEY, 10))

    act(() => {
      result.current[1]((prev) => prev + 5)
    })

    expect(result.current[0]).toBe(15)
    expect(window.localStorage.getItem(TEST_KEY)).toBe('15')
  })

  it('should fall back to initialValue if localStorage contains malformed JSON', () => {
    window.localStorage.setItem(TEST_KEY, 'invalid_json_{}')

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { result } = renderHook(() => useLocalStorage(TEST_KEY, 'fallback_value'))

    expect(result.current[0]).toBe('fallback_value')
    expect(consoleSpy).toHaveBeenCalled()
  })

  it('should update state when window triggers cross-tab storage event', () => {
    const { result } = renderHook(() => useLocalStorage<string>(TEST_KEY, 'initial'))

    act(() => {
      // Simulate storage event emitted from another browser tab
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: TEST_KEY,
          newValue: JSON.stringify('updated_from_other_tab'),
        })
      )
    })

    expect(result.current[0]).toBe('updated_from_other_tab')
  })

  // --- ADDITIONAL COVERAGE ---

  it('should call a lazy initializer function when the key does not exist', () => {
    const initializer = vi.fn(() => ['default'])

    const { result } = renderHook(() => useLocalStorage<string[]>(TEST_KEY, initializer))

    expect(result.current[0]).toEqual(['default'])
    expect(initializer).toHaveBeenCalled()
  })

  it('should not call the lazy initializer when a stored value exists', () => {
    window.localStorage.setItem(TEST_KEY, JSON.stringify(['stored']))
    const initializer = vi.fn(() => ['default'])

    const { result } = renderHook(() => useLocalStorage<string[]>(TEST_KEY, initializer))

    expect(result.current[0]).toEqual(['stored'])
    expect(initializer).not.toHaveBeenCalled()
  })

  it('should apply consecutive functional updates against the latest value', () => {
    const { result } = renderHook(() => useLocalStorage<number>(TEST_KEY, 10))

    act(() => {
      result.current[1]((prev) => prev + 5)
      result.current[1]((prev) => prev + 5)
    })

    expect(result.current[0]).toBe(20)
    expect(window.localStorage.getItem(TEST_KEY)).toBe('20')
  })

  it('should ignore storage events for other keys', () => {
    const { result } = renderHook(() => useLocalStorage<string>(TEST_KEY, 'initial'))

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'another_key', newValue: JSON.stringify('nope') })
      )
    })

    expect(result.current[0]).toBe('initial')
  })

  it('should ignore storage events where the key was removed (newValue is null)', () => {
    const { result } = renderHook(() => useLocalStorage<string>(TEST_KEY, 'initial'))

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: TEST_KEY, newValue: null }))
    })

    expect(result.current[0]).toBe('initial')
  })

  it('should keep the current value and warn when a storage event carries malformed JSON', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { result } = renderHook(() => useLocalStorage<string>(TEST_KEY, 'initial'))

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: TEST_KEY, newValue: '{bad json' }))
    })

    expect(result.current[0]).toBe('initial')
    expect(consoleSpy).toHaveBeenCalled()
  })

  it('should remove the storage listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useLocalStorage<string>(TEST_KEY, 'initial'))

    unmount()

    expect(removeSpy).toHaveBeenCalledWith('storage', expect.any(Function))
  })
})