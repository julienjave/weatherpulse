import { useState, useCallback } from "react"
import {
    Box,
    Paper,
    TextField,
    Autocomplete,
    IconButton, 
    ToggleButton, 
    ToggleButtonGroup, 
    Tooltip, 
    CircularProgress, 
    Button, 
    Collapse, 
    Alert
} from '@mui/material'
import { Search, MyLocation, LocationOn, PinDrop } from '@mui/icons-material'
import { useCitySearch } from "../hooks/useCitySearch"
import { getReverseGeocode } from '../services/weatherApi'
import { formatCountryName } from "../utils/formatCountry"
import type { GeocodingLocation } from "../types/weather"


// === TYPES & INTERFACES ==================================================================

type SearchMode = 'city' | 'coords'

interface SearchBarProps {
    // Function that passes a selected GeocodingLocation back up to App
    onSelectLocation: (location: GeocodingLocation) => void
    // Function that triggers browser geolocation
    onUseMyLocation: () => void
    // Function that resets state values
    onClear: () => void
    // Boolean flag from useGeolocation to show a spinner on the GPS button (Optional)
    isGeoloading?: boolean
    // String error message if geolocation access fails (Optional)
    geoError?: string | null
}


// === COMPONENT: SEARCHBAR ================================================================

export const SearchBar: React.FC<SearchBarProps> = ({
    onSelectLocation,
    onUseMyLocation,
    onClear,
    isGeoloading = false,
    geoError = null
}) => {
    // 1. STATE VARIABLES

    const [searchMode, setSearchMode] = useState<SearchMode>('city')
    const [selectedOption, setSelectedOption] = useState<GeocodingLocation | null>(null)
    const [latInput, setLatInput] = useState<string>('')
    const [lonInput, setLonInput] = useState<string>('')
    const [isReverseGeocoding, setIsReverseGeoCoding] = useState<boolean>(false)
    const [coordError, setCoordError] = useState<string | null>(null)

    // 2. HOOKS

    const { 
        searchTerm,
        handleInputChange, 
        options, 
        isSearching, 
        searchError 
    } = useCitySearch()

    // 3. HANDLERS

    // Handler 1: Toggle Mode Switch
    // When user switches tabs, update `mode` state and reset `coordError`
    const handleModeChange = useCallback((
        _event: React.MouseEvent<HTMLElement>, 
        newMode: SearchMode | null
    ) => {
        if(newMode !== null) {
            setSearchMode(newMode)
            setCoordError(null)
        }
    }, [])

    // Handler 2: Submit Direct Coordinates
    const handleCoordsSubmit = useCallback(async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()

        // Parse latInput and lonInput to floating-point numbers.
        const lat: number = parseFloat(latInput)
        const lon: number = parseFloat(lonInput)

        // Validate latitude (-90 to 90) and longitude (-180 to 180).
        if(isNaN(lat) || lat < -90 || lat > 90) {
            setCoordError(`Latitude must be between -90 and 90`)
            return
        }
        if(isNaN(lon) || lon < -180 || lon > 180) {
            setCoordError(`Longitude must be between -180 and 180`)
            return
        }

        // Reset error and set isReverseGeocoding to true
        setCoordError(null)
        setIsReverseGeoCoding(true)

        try {
            // Get location data from reverse geocoding
            const { data, error } = await getReverseGeocode(lat, lon)
    
            if(error || !data || data.length === 0) {
                // Graceful fallback to coordinate label if reverse lookup fails or returns empty
                onSelectLocation({
                    name: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
                    lat,
                    lon,
                    country: ''
                })
                return
            }
    
            // Use the first location match returned by OpenWeatherMap
            onSelectLocation(data[0])
            
        } catch (error) {
            setCoordError('Failed to resolve coordinates. Please try again.')
        } finally {
            // Update reverse geocoding state once done
            setIsReverseGeoCoding(false)
        }


    }, [latInput, lonInput, onSelectLocation])

    // Handler 3: Clear search fields
    const handleClearSearch = useCallback(() => {
        setLatInput('')
        setLonInput('')
        setCoordError(null)
        // Reset the Autocomplete's selected value too, otherwise MUI restores
        // the input text from it (onInputChange with reason 'reset')
        setSelectedOption(null)
        onClear()
        handleInputChange('')
    }, [handleInputChange, onClear])

    // 4. RENDER

    return (
        <Box component="section" sx={{ maxWidth: 700, mx: 'auto', mb: 3 }}>
            <Paper elevation={3} sx={{ p: 2, borderRadius: 3, backdropFilter: 'blur(10px)' }}>
                
                {/* ROW 1: Header Controls: Search Mode Toggle & Location Button */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        {/* ToggleButtonGroup: City vs Coordinates */}
                        <ToggleButtonGroup
                            value={searchMode}
                            exclusive
                            size="small"
                            onChange={handleModeChange}
                            aria-label="search mode"
                        >
                            <ToggleButton value="city" aria-label="city search">
                                <Search sx={{ mr: 0.5, fontSize: 18 }} />
                                City
                            </ToggleButton>
                            <ToggleButton value="coords" aria-label="coordinates search">
                                <PinDrop sx={{ mr: 0.5, fontSize: 18 }} />
                                Coordinates
                            </ToggleButton>
                        </ToggleButtonGroup>

                        {/* Tooltip + IconButton (MyLocationIcon): Triggers onUseMyLocation */}
                        <Tooltip title="Use current location">
                            <span>
                                <IconButton
                                    color="primary"
                                    onClick={onUseMyLocation}
                                    disabled={isGeoloading}
                                    aria-label="use my location"
                                    >
                                    {/*   If isGeoLoading is true, render CircularProgress instead of icon */}
                                    {isGeoloading ? (
                                        <CircularProgress size={24} />
                                    ) : (
                                        <MyLocation />
                                    )}
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>
                    <Button
                        variant="contained"
                        onClick={handleClearSearch}
                        sx={{ whiteSpace: 'nowrap', px: 3, height: 40 }}
                    >
                        Clear
                    </Button>
                </Box>

                {/* ROW 2A: Mode 1 - City Autocomplete Search */}
                {searchMode === 'city' && (
                    <Autocomplete
                        options={options}
                        loading={isSearching}
                        getOptionLabel={(option) => {
                            if(typeof option === 'string') return option
                            const country = formatCountryName(option.country)
                            const state = option.state ? `, ${option.state}` : ''
                            return `${option.name}${state}, ${country}`
                        }}
                        filterOptions={(x) => x} // Disable client-side filtering as API handles it
                        value={selectedOption}
                        inputValue={searchTerm}
                        onInputChange={(_event, value) => handleInputChange(value)}
                        onChange={(_event, value) => {
                            setSelectedOption(value)
                            if(value && typeof value !== 'string') {
                                onSelectLocation(value)
                            }
                        }}
                        renderOption={(props, option) => {
                            const { key, ...optionProps } = props
                            const country = formatCountryName(option.country)
                            const state = option.state ? `, ${option.state}` : ''
                            return (
                                <Box
                                    component="li"
                                    key={key}
                                    {...optionProps}
                                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                                >
                                    <LocationOn color="action" fontSize="small" />
                                    <Box>
                                        <Box component="span" sx={{ fontWeight: 600 }}>
                                            {option.name}
                                        </Box>
                                        <Box component="span" sx={{ color: 'text.secondary', ml: 0.5 }}>
                                            {state ? `${state}, ` : ''}{country}
                                        </Box>
                                    </Box>
                                </Box>
                            )
                        }}
                        renderInput={(params) => {
                            // MUI v6 puts input slot properties on params.slotProps.input
                            // (with params.InputProps preserved for backward compatibility in JS, but removed from TS types)
                            const inputSlotProps = params.slotProps?.input ?? (params as Record<string, any>).InputProps

                            return (
                                <TextField
                                    {...params}
                                    label="Search City..."
                                    variant="outlined"
                                    fullWidth
                                    slotProps={{
                                        ...params.slotProps, // <--- Keeps htmlInput (holds the input ref used for focus)
                                        input: {
                                            ...inputSlotProps, // <--- Preserves the focus ref!
                                        endAdornment: (
                                            <>
                                                {isSearching ? <CircularProgress color="inherit" size={20} /> : null}
                                                {inputSlotProps?.endAdornment}
                                            </>
                                        ),
                                        },
                                    }}
                                />
                            )
                        }} 
                    />
                )}

                {/* ROW 2B: Mode 2 - Direct Coordinate Inputs */}
                {searchMode === 'coords' && (
                <Box
                    component="form"
                    onSubmit={handleCoordsSubmit}
                    noValidate // Skip native min/max validation so our own error Alert is shown
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 1.5,
                        alignItems: 'center',
                    }}
                >
                    <TextField
                        label="Latitude (-90 to 90)"
                        variant="outlined"
                        size="small"
                        fullWidth
                        type="number"
                        slotProps={{ input: { inputProps: { step: 'any', min: -90, max: 90 } } }}
                        value={latInput}
                        onChange={(e) => setLatInput(e.target.value)}
                    />
                    <TextField
                        label="Longitude (-180 to 180)"
                        variant="outlined"
                        size="small"
                        fullWidth
                        type="number"
                        slotProps={{ input: { inputProps: { step: 'any', min: -180, max: 180 } } }}
                        value={lonInput}
                        onChange={(e) => setLonInput(e.target.value)}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isReverseGeocoding}
                        sx={{ whiteSpace: 'nowrap', px: 3, height: 40 }}
                    >
                        {isReverseGeocoding ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : (
                            'Go'
                        )}
                    </Button>
                </Box>
                )}

                {/* ROW 3: Error Alerts Feedback */}
                <Collapse in={Boolean(searchError || geoError || coordError)}>
                    {searchError && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                            {searchError}
                        </Alert>
                    )}
                    {geoError && (
                        <Alert severity="warning" sx={{ mt: 1 }}>
                            {geoError}
                        </Alert>
                    )}
                    {coordError && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                            {coordError}
                        </Alert>
                    )}
                </Collapse>

            </Paper>
        </Box>
    )

}