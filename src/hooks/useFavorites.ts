import { useCallback } from 'react'
import type { GeocodingLocation } from '../types/weather'
import { useLocalStorage } from './useLocalStorage'
import { isSameLocation } from '../utils/compareCities'


// === USEFAVORITES ======================================================================
/**
 * Manages the list of favorite cities, persisted in localStorage.
 * Cities are compared by coordinates (see `isSameLocation`), not by name.
 */

export const FAVORITES_STORAGE_KEY = 'favorites'
export const MAX_FAVORITES = 3

export function useFavorites() {
    // 1. PERSISTED STATE
    const [favorites, setFavorites] = useLocalStorage<GeocodingLocation[]>(FAVORITES_STORAGE_KEY, [])
    const isFull = favorites.length >= MAX_FAVORITES

    // 2. DERIVED CHECK
    // Accepts null so callers can pass `selectedCity` directly
    const isFavorite = useCallback((city: GeocodingLocation | null): boolean => {
        if (!city) return false
        return favorites.some((fav) => isSameLocation(fav, city))
    }, [favorites])

    // 3. HANDLER: ADD OR REMOVE A CITY
    // Adding is ignored once MAX_FAVORITES is reached; removing always works
    const toggleFavorite = useCallback((city: GeocodingLocation) => {
        setFavorites((prev) => {
            if (prev.some((fav) => isSameLocation(fav, city))) {
                return prev.filter((fav) => !isSameLocation(fav, city))
            }
            return prev.length >= MAX_FAVORITES ? prev : [...prev, city]
        })
    }, [setFavorites])

    // 4. HANDLER: REMOVE A CITY (e.g. deleting a favorite chip)
    const removeFavorite = useCallback((city: GeocodingLocation) => {
        setFavorites((prev) => prev.filter((fav) => !isSameLocation(fav, city)))
    }, [setFavorites])

    // 5. RETURN STATE AND HANDLERS
    return {
        favorites,
        isFull,
        isFavorite,
        toggleFavorite,
        removeFavorite
    }
}
