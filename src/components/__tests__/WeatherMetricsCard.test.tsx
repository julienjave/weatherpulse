import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { WeatherMetricsCard } from '../WeatherMetricsCard'
import { getUsAqiKit } from '../../utils/aqiConverter'
import { getWeatherThemeKit } from '../../utils/weatherThemes'

describe('WeatherMetricsCard Component', () => {
  const lightTheme = getWeatherThemeKit(800, '01d') // clear-day
  const darkTheme = getWeatherThemeKit(800, '01n') // clear-night

  it('shows humidity and wind next to labelled icons', () => {
    render(<WeatherMetricsCard humidity={55} wind={4.1} aqiData={null} theme={lightTheme} units="metric" />)

    expect(screen.getByLabelText('Humidity')).toBeInTheDocument()
    expect(screen.getByLabelText('Wind')).toBeInTheDocument()
    expect(screen.getByLabelText('Air Quality Index')).toBeInTheDocument()
    expect(screen.getByText('55%')).toBeInTheDocument()
  })

  it.each([
    ['metric', '4.1m/s'],
    ['imperial', '4.1mph'],
  ] as const)('shows wind speed in %s units', (units, expected) => {
    render(<WeatherMetricsCard humidity={55} wind={4.1} aqiData={null} theme={lightTheme} units={units} />)

    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it('shows a placeholder when there is no AQI data', () => {
    render(<WeatherMetricsCard humidity={55} wind={4.1} aqiData={null} theme={lightTheme} units="metric" />)

    expect(screen.getByText(/- No Data -/)).toBeInTheDocument()
  })

  it('shows the AQI value and label on a badge colored by category', () => {
    render(<WeatherMetricsCard humidity={55} wind={4.1} aqiData={getUsAqiKit(6)} theme={lightTheme} units="metric" />)

    const value = screen.getByText('25 - Good')
    expect(value.parentElement).toHaveStyle({ backgroundColor: 'rgb(0, 228, 0)' }) // #00e400
    expect(screen.queryByText(/- No Data -/)).not.toBeInTheDocument()
  })

  it('uses white text on dark weather themes and black text on light ones', () => {
    const { rerender } = render(
      <WeatherMetricsCard humidity={55} wind={4.1} aqiData={null} theme={lightTheme} units="metric" />
    )
    expect(screen.getByText('55%')).toHaveStyle({ color: 'rgb(0, 0, 0)' })

    rerender(<WeatherMetricsCard humidity={55} wind={4.1} aqiData={null} theme={darkTheme} units="metric" />)
    expect(screen.getByText('55%')).toHaveStyle({ color: 'rgb(255, 255, 255)' })
  })

  // Regression: the badge text color used to be `${aqiData}` ("[object Object]") instead of `aqiData.color`
  it.each([
    [6, '25 - Good', 'rgb(0, 0, 0)'],
    [100, '174 - Unhealthy', 'rgb(255, 255, 255)'],
  ])('uses the AQI category text color on the badge (PM2.5 %f)', (pm25, text, color) => {
    render(<WeatherMetricsCard humidity={55} wind={4.1} aqiData={getUsAqiKit(pm25)} theme={lightTheme} units="metric" />)

    expect(screen.getByText(text)).toHaveStyle({ color })
  })
})
