import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ForecastCard } from '../ForecastCard'
import type { DailyForecastSummary } from '../../utils/aggregateForecast'
import { getWeatherThemeKit } from '../../utils/weatherThemes'
import { getIconUrl } from '../../utils/weatherIcons'

const FORECAST_LIST: DailyForecastSummary[] = [
  { dateKey: '2026-01-16', dateLabel: '16 Fri', tempMax: 17, tempMin: 9, description: 'clear sky', theme: getWeatherThemeKit(800, '01d') },
  { dateKey: '2026-01-17', dateLabel: '17 Sat', tempMax: 14, tempMin: 8, description: 'light rain', theme: getWeatherThemeKit(500, '10d') },
  { dateKey: '2026-01-18', dateLabel: '18 Sun', tempMax: 11, tempMin: 3, description: 'snow', theme: getWeatherThemeKit(601, '13d') },
]

describe('ForecastCard Component', () => {
  it('renders one tile per day with its label', () => {
    render(<ForecastCard forecastList={FORECAST_LIST} units="metric" />)

    expect(screen.getByText('16 Fri')).toBeInTheDocument()
    expect(screen.getByText('17 Sat')).toBeInTheDocument()
    expect(screen.getByText('18 Sun')).toBeInTheDocument()
    expect(screen.getAllByAltText('weather icon')).toHaveLength(3)
  })

  it('shows the high and low temperatures in °C for metric units', () => {
    render(<ForecastCard forecastList={FORECAST_LIST} units="metric" />)

    expect(screen.getByText('High: 17°C')).toBeInTheDocument()
    expect(screen.getByText('Low: 9°C')).toBeInTheDocument()
  })

  it('shows the high and low temperatures in °F for imperial units', () => {
    render(<ForecastCard forecastList={FORECAST_LIST} units="imperial" />)

    expect(screen.getByText('High: 17°F')).toBeInTheDocument()
    expect(screen.getByText('Low: 9°F')).toBeInTheDocument()
  })

  it("uses each day's theme icon", () => {
    render(<ForecastCard forecastList={FORECAST_LIST} units="metric" />)

    const icons = screen.getAllByAltText('weather icon')
    FORECAST_LIST.forEach((day, i) => {
      expect(icons[i]).toHaveAttribute('src', getIconUrl(day.theme.icon))
    })
  })

  it('uses white day labels on dark themes and black ones on light themes', () => {
    render(<ForecastCard forecastList={FORECAST_LIST} units="metric" />)

    expect(screen.getByText('16 Fri')).toHaveStyle({ color: 'rgb(0, 0, 0)' }) // clear-day
    expect(screen.getByText('17 Sat')).toHaveStyle({ color: 'rgb(255, 255, 255)' }) // rain
  })

  it('renders no tiles for an empty forecast', () => {
    render(<ForecastCard forecastList={[]} units="metric" />)

    expect(screen.queryByAltText('weather icon')).not.toBeInTheDocument()
    expect(screen.queryByText(/High:/)).not.toBeInTheDocument()
  })
})
