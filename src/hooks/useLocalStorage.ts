import { useState, useEffect, useCallback } from 'react'


// === USELOCALSTORAGE ================================================================
/**
 * Custom hook that acts exactly like React's useState, 
 * but automatically synchronizes its value with localStorage in a safe, reactive way.
 */

export function useLocalStorage<T>(
    key: string,
    initialValue: T | (() => T)
): [T, (value: T | ((val: T) => T)) => void] { // returns [value (T), setter function ((value: T | ((val: T) => T)) => void)]
    // 1. LAZY INITIAL STATE READ
    // We pass a function to useState(() => ...) so local storage is read only once 
    // when the component mounts, rather than on every single render.
    const [storedValue, setStoredValue] = useState<T>(() => { 
        try {
            // A. Check if window is defined (SSR safety)
            if(typeof window === 'undefined') {
                return typeof initialValue === 'function'
                    ? (initialValue as () => T)()
                    : initialValue
            }

            // B. Read item from localStorage
            const item = window.localStorage.getItem(key)

            // C. Return parsed JSON or calculate initial value
            if(item !== null) {
                return JSON.parse(item) as T
            }

            return typeof initialValue === 'function'
                ? (initialValue as () => T)()
                : initialValue

        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error)
            return typeof initialValue === 'function'
                ? (initialValue as () => T)()
                : initialValue
        }
    })

    // 2. SETTER FUNCTION
    // Wrap in useCallback to ensure a stable reference
    const setValue = useCallback((value: T | ((val: T) => T)) => {
        try {
            // Handle functional state updates (e.g. setValue(prev => ...))
            setStoredValue((currentStoredValue) => {
                const valueToStore = typeof value === 'function' 
                    ? (value as (val: T) => T)(currentStoredValue)
                    : value
                
                    // Save to localStorage
                    if(typeof window !== 'undefined') {
                        window.localStorage.setItem(key, JSON.stringify(valueToStore))
                    }

                    return valueToStore

            })
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error)
        }
    }, [key])

    // 3. CROSS-TAB SYNCHRONIZATION
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === key && event.newValue !== null) {
                try {
                    setStoredValue(JSON.parse(event.newValue) as T)
                } catch (error) {
                    console.warn(`Error parsing updated localStorage key "${key}":`, error)
                }
            }
        }

        // Add browser event listener
        window.addEventListener('storage', handleStorageChange)

        // Cleanup listener on unmount
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [key])

    // 4. RETURN TUPLE (STATE & SETTER)
    return [storedValue, setValue]
}