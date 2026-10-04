import { Chip, Stack } from "@mui/material"
import StarIcon from '@mui/icons-material/Star'
import type { GeocodingLocation } from "../types/weather"
import { isSameLocation } from "../utils/compareCities"


// === TYPES & INTERFACES ==================================================================

interface FavoritesBarProps {
    favorites: GeocodingLocation[]
    selectedCity: GeocodingLocation | null
    onSelect: (city: GeocodingLocation) => void
    onDelete: (city: GeocodingLocation) => void
}


// === COMPONENT: FAVORITESBAR =============================================================

export function FavoritesBar({
    favorites,
    selectedCity,
    onSelect,
    onDelete
}: FavoritesBarProps) {

    // Nothing to show until the user saves a city
    if (favorites.length === 0) return null

    return (
        <Stack
            component="nav"
            aria-label="Favorite cities"
            direction="row"
            sx={{ flexWrap: 'wrap', gap: 1, justifyContent: 'center', my: 2 }}
        >
            {favorites.map((city) => {
                const isActive = selectedCity !== null && isSameLocation(city, selectedCity)
                const label = city.country ? `${city.name}, ${city.country}` : city.name

                return (
                    <Chip
                        key={`${city.lat},${city.lon}`}
                        icon={<StarIcon />}
                        label={label}
                        color={isActive ? 'primary' : 'default'}
                        variant={isActive ? 'filled' : 'outlined'}
                        aria-current={isActive ? 'true' : undefined}
                        onClick={() => onSelect(city)}
                        onDelete={() => onDelete(city)}
                    />
                )
            })}
        </Stack>
    )
}
