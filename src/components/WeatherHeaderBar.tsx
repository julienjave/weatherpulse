import { Box, IconButton, Paper, Stack, Switch, Tooltip, Typography } from "@mui/material"
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import type { TemperatureUnit } from "../types/weather"


// === TYPES & INTERFACES ==================================================================

export interface WeatherHeadBarProps {
    isFavorite: boolean
    onToggleFavorite: () => void
    units: TemperatureUnit
    onToggleUnit: () => void
    isFavoritesFull?: boolean
}


// === COMPONENT: WEATHERHEADERBAR =========================================================

export function WeatherHeaderBar({
    isFavorite,
    onToggleFavorite,
    units,
    onToggleUnit,
    isFavoritesFull = false
}: WeatherHeadBarProps) {

    // Removing is always allowed; adding is blocked once the favorites limit is reached
    const isAddDisabled = !isFavorite && isFavoritesFull
    const favoriteTooltip = isFavorite
        ? 'Remove from Favorites'
        : isAddDisabled ? 'Favorites limit reached' : 'Add to Favorites'

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1
        }}>
            {/* ADD TO FAVORITES BUTTON */}
            <Tooltip title={favoriteTooltip}>
                {/* span wrapper: MUI Tooltip needs an element that receives events, even when the button is disabled */}
                <span>
                    <IconButton
                        onClick={onToggleFavorite}
                        disabled={isAddDisabled}
                        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        {isFavorite ? (<StarIcon />) : (<StarBorderIcon />)}
                    </IconButton>
                </span>
            </Tooltip>

            {/* UNITS SWITCH */}
            <Paper 
                elevation={3}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 'fit-content',
                    p: 1
                }}
            >
                <Typography sx={{ fontWeight: 'bold' }}>Units</Typography>
                <Stack 
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center'
                    }}
                >
                    <Typography sx={{ fontSize: '0.8rem' }}>°F</Typography>
                    <Switch checked={units === 'metric'} size="small" onChange={onToggleUnit}/>
                    <Typography sx={{ fontSize: '0.8rem' }}>°C</Typography>
                </Stack>
            </Paper>
        </Box>
    )
}