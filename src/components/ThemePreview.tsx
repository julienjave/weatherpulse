// TEMP: dev-only preview of every weather theme, for tuning gradients. Delete when done.
import { Box, Paper, Typography } from '@mui/material'
import { getWeatherThemeKit } from '../utils/weatherThemes'
import { getIconUrl } from '../utils/weatherIcons'
import { glassSx } from '../utils/glassStyles'

// One representative OpenWeatherMap condition per theme, so this goes through the real mapping
// and picks up edits to `THEMES` via hot reload
const SAMPLES: { label: string, conditionId: number, iconCode: string }[] = [
    { label: 'Clear (day)',     conditionId: 800, iconCode: '01d' },
    { label: 'Clear (night)',   conditionId: 800, iconCode: '01n' },
    { label: 'Partly cloudy',   conditionId: 801, iconCode: '02d' },
    { label: 'Clouds',          conditionId: 804, iconCode: '04d' },
    { label: 'Rain',            conditionId: 501, iconCode: '10d' },
    { label: 'Drizzle',         conditionId: 300, iconCode: '09d' },
    { label: 'Thunderstorm',    conditionId: 211, iconCode: '11d' },
    { label: 'Snow',            conditionId: 601, iconCode: '13d' },
    { label: 'Atmosphere',      conditionId: 741, iconCode: '50d' },
]

export function ThemePreview() {
    return (
        <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 2,
            mb: 4
        }}>
            {SAMPLES.map(({ label, conditionId, iconCode }) => {
                const { theme, icon } = getWeatherThemeKit(conditionId, iconCode)
                const textColor = theme.isDark ? '#fff' : '#000'

                return (
                    <Box key={label} sx={{
                        p: 1,
                        borderRadius: '15px',
                        background: theme.gradient,
                        color: textColor,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1
                    }}>
                        {/* Bare text straight on the gradient, like CurrentWeatherCard */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box component="img" alt={icon} src={getIconUrl(icon)} sx={{ width: 64 }} />
                            <Box>
                                <Typography variant="h6">{label}</Typography>
                                <Typography variant="caption">
                                    {theme.key} · isDark: {String(theme.isDark)}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Glass card on the gradient, like the metrics/forecast cards */}
                        <Paper sx={{ ...glassSx, p: 1, color: textColor }}>
                            <Typography variant="h4">21°C</Typography>
                            <Typography variant="body2">Humidity 64% · Wind 3.2 m/s</Typography>
                        </Paper>

                        <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', opacity: 0.8 }}>
                            {theme.gradient}
                        </Typography>
                    </Box>
                )
            })}
        </Box>
    )
}
