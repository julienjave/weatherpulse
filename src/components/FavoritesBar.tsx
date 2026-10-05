import { Box, Chip, Paper, Stack, Typography } from "@mui/material"
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

    return (
        <Box sx={{ maxWidth: 700, mx: 'auto', mb: 3 }}>
            <Paper elevation={3} sx={{ p: 1.5, borderRadius: 3, backdropFilter: 'blur(10px)' }}>
                <Stack
                    component="nav"
                    aria-label="Favorite cities"
                    direction="row"
                    // minHeight matches a Chip's height so the bar keeps its size when empty
                    sx={{ flexWrap: 'wrap', gap: 1, justifyContent: 'center', alignItems: 'center', minHeight: 32 }}
                >
                    {favorites.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            No favorites yet
                        </Typography>
                    ) : (
                        favorites.map((city) => {
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
                        })
                    )}
                </Stack>
            </Paper>
        </Box>
    )
}
