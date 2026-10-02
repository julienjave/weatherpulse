import { useState, useCallback } from "react"


// === TYPES & INTERFACES ================================================================

interface Coordinates {
    lat: number
    lon: number
}


// === HELPER FUNCTION ===================================================================

/**
 * Maps GeolocationPositionError codes to human-readable error messages.
 */
function getGeolocationErrorMessage(error: GeolocationPositionError): string {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            return 'Location access was denied. Please allow location permissions in your browser.'
        case error.POSITION_UNAVAILABLE:
            return 'Location information is unavailable. Please check your device settings.'
        case error.TIMEOUT:
            return 'Location request timed out. Please try again.'
        default:
            return 'An unexpected error occurred while retrieving your location.'
    }
}


// === USEGEOLOCATION ====================================================================

export function useGeolocation() {
    // 1. STATE VARIABLES
    const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    // 2. PRIMARY FUNCTION: getLocation
    // Wrap in useCallback so its reference remains stable
    const getLocation = useCallback((): Promise<Coordinates | null> => {
        // A. Check browser support
        if(!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.')
            return Promise.resolve(null)
        }

        // B. Set loading state & reset error
        setIsLoading(true)
        setError(null)

        // C. Wrap callback-based browser API in a Promise
        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                // Success Callback:
                (position) => {
                    // Extract lat and lon from position.coords
                    const coords: Coordinates = {
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    }
                    // Update coordinates state
                    setCoordinates(coords)
                    // Turn off isLoading
                    setIsLoading(false)
                    // Resolve the Promise so async callers get the value immediately
                    resolve(coords)
                },
                // Error Callback:
                (geoError) => {
                    // Parse geoError using helper
                    const errorParsed = getGeolocationErrorMessage(geoError)
                    // Set error state
                    setError(errorParsed)
                    // Turn off isLoading
                    setIsLoading(false)
                    // Resolve with null so caller knows it failed without throwing an uncaught error
                    resolve(null)
                },
                // Options:
                {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 300000
                }
            )
        })
    }, [])

    // 3. RETURN HOOK INTERFACE
    return {
        coordinates,
        isLoading,
        error,
        getLocation
    }
}