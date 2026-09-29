import { useState, useRef, useMemo } from "react"
import { searchCityByName } from "../services/weatherApi"
import type { GeocodingLocation } from "../types/weather"


// === UTILITY ==============================================================================

function createDebounce<T extends(...args: any[]) => void>(funct: T, wait: number) {
    let timeout: ReturnType<typeof setTimeout> | null = null

    const debounced = (...args: Parameters<T>) => {
        if(timeout) clearTimeout(timeout)
        timeout = setTimeout(() => funct(...args), wait)
    }

    debounced.cancel = () => {
        if(timeout) {
            clearTimeout(timeout)
            timeout = null
        }
    }

    return debounced
}

// === USECITYSEARCH ========================================================================

export async function useCitySearch() {
    // 1. STATE VARIABLES

    // Keeps track of whatever the user types into the input field in real time
    const [searchTerm, setSearchTerm] = useState<string>('')
    // Holds the list of matching cities returned by OpenWeatherMap's Geocoding API
    const [options, setOptions] = useState<GeocodingLocation[]>([])
    // Boolean flag to show/hide loading spinners in the UI
    const [isSearching, setIsSearching] = useState<boolean>(false)
    // Holds any error message if the geocoding request fails
    const [searchError, setSearchError] = useState<string | null>(null)

    // Store active AbortController in a ref so it persists across renders without triggering them
    const abortControllerRef = useRef<AbortController | null>(null)

    // Wrap fetch in a debounced function using useMemo
    const debouncedSearch = useMemo(
        () => createDebounce((query: string) => performSearch(query), 500), []
    )


    // 2. SEARCH LOGIC

    async function performSearch(query: string) {

        // Cancel previous request if user typed again before it completed
        if(abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        // Create a new controller for the current request
        const controller = new AbortController()
        abortControllerRef.current = controller

        setIsSearching(true)
        setSearchError(null)

        // Make request through searchCityByName
        const { data, error } = await searchCityByName(query, 5, controller.signal)

        // If request was aborted, exit silently
        if(controller.signal.aborted) return

        if(error) {
            setSearchError(error.message)
            setOptions([])
        } else if(data) {
            setOptions(data)
        }
        setIsSearching(false)
    }

    // 3. EVENT HANDLER

    // called on input change
    function handleInputChange(value: string) {
        setSearchTerm(value) // Immediate update for input responsiveness

        if(!value.trim()) {
            // User cleared the search box:
            debouncedSearch.cancel() // 1. Cancel queued 500ms timer
            abortControllerRef.current?.abort() // 2. Abort active network request
            setOptions([]) // 3. Reset dropdown options
            setIsSearching(false) // 4. Turn off spinner
            setSearchError(null)
            return
        }

        // Pass non-empty query to debouncer
        debouncedSearch(value) // Delay actual API call (performSearch()) by 500ms (using debounce())
    }

    // 4. RETURN EVENT HANDLER AND STATES VALUES
    return {
        searchTerm,
        handleInputChange,
        options,
        isSearching,
        searchError
    }
}