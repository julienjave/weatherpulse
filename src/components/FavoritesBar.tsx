import { Box, Chip, Paper, Stack, Typography } from "@mui/material"
import StarIcon from '@mui/icons-material/Star'
import { AnimatePresence, motion } from "motion/react"
import type { GeocodingLocation } from "../types/weather"
import { isSameLocation } from "../utils/compareCities"
import { DURATION_FAST, EASE_OUT } from "../utils/motionVariants"


// === ANIMATION ===========================================================================

// Chips pop in/out with a fade + scale; `layout` lets the remaining chips glide into the gap
const chipMotion = {
    layout: true,
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: { duration: DURATION_FAST, ease: EASE_OUT }
} as const


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
                    // `position: relative` anchors chips that `popLayout` takes out of the flow while they exit
                    sx={{ flexWrap: 'wrap', gap: 1, justifyContent: 'center', alignItems: 'center', minHeight: 32, position: 'relative' }}
                >
                    {/* `initial={false}`: favorites restored from localStorage don't animate on page load */}
                    <AnimatePresence initial={false} mode="popLayout">
                    {favorites.length === 0 ? (
                        <motion.div key="empty-placeholder" {...chipMotion}>
                            <Typography variant="body2" color="text.secondary">
                                No favorites yet
                            </Typography>
                        </motion.div>
                    ) : (
                        favorites.map((city) => {
                            const isActive = selectedCity !== null && isSameLocation(city, selectedCity)
                            const label = city.country ? `${city.name}, ${city.country}` : city.name

                            return (
                                <motion.div key={`${city.lat},${city.lon}`} {...chipMotion}>
                                    <Chip
                                        icon={<StarIcon />}
                                        label={label}
                                        color={isActive ? 'primary' : 'default'}
                                        variant={isActive ? 'filled' : 'outlined'}
                                        aria-current={isActive ? 'true' : undefined}
                                        onClick={() => onSelect(city)}
                                        onDelete={() => onDelete(city)}
                                    />
                                </motion.div>
                            )
                        })
                    )}
                    </AnimatePresence>
                </Stack>
            </Paper>
        </Box>
    )
}
