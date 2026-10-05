import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { WeatherHeaderBar, type WeatherHeadBarProps } from '../WeatherHeaderBar'

describe('WeatherHeaderBar Component', () => {
  const renderHeaderBar = (props: Partial<WeatherHeadBarProps> = {}) => {
    const defaults: WeatherHeadBarProps = {
      isFavorite: false,
      onToggleFavorite: vi.fn(),
      units: 'metric',
      onToggleUnit: vi.fn(),
    }
    const merged = { ...defaults, ...props }
    render(<WeatherHeaderBar {...merged} />)
    return merged
  }

  describe('Favorite button', () => {
    it('offers to add the city when it is not a favorite', () => {
      renderHeaderBar({ isFavorite: false })

      expect(screen.getByRole('button', { name: 'Add to favorites' })).toBeEnabled()
      expect(screen.getByTestId('StarBorderIcon')).toBeInTheDocument()
    })

    it('offers to remove the city when it is already a favorite', () => {
      renderHeaderBar({ isFavorite: true })

      expect(screen.getByRole('button', { name: 'Remove from favorites' })).toBeEnabled()
      expect(screen.getByTestId('StarIcon')).toBeInTheDocument()
    })

    it('calls onToggleFavorite when clicked', async () => {
      const user = userEvent.setup()
      const { onToggleFavorite } = renderHeaderBar()

      await user.click(screen.getByRole('button', { name: 'Add to favorites' }))

      expect(onToggleFavorite).toHaveBeenCalledTimes(1)
    })

    it('is disabled for a new city once the favorites limit is reached', () => {
      renderHeaderBar({ isFavorite: false, isFavoritesFull: true })

      expect(screen.getByRole('button', { name: 'Add to favorites' })).toBeDisabled()
    })

    it('still allows removing a favorite when the limit is reached', async () => {
      const user = userEvent.setup()
      const { onToggleFavorite } = renderHeaderBar({ isFavorite: true, isFavoritesFull: true })

      await user.click(screen.getByRole('button', { name: 'Remove from favorites' }))

      expect(onToggleFavorite).toHaveBeenCalledTimes(1)
    })

    it.each([
      [false, false, 'Add to Favorites'],
      [true, false, 'Remove from Favorites'],
      [false, true, 'Favorites limit reached'],
      [true, true, 'Remove from Favorites'],
    ])('shows the right tooltip (isFavorite=%s, isFavoritesFull=%s)', async (isFavorite, isFavoritesFull, tooltip) => {
      const user = userEvent.setup()
      renderHeaderBar({ isFavorite, isFavoritesFull })

      // Hover the Paper wrapper: it still receives events when the button is disabled
      await user.hover(screen.getByRole('button', { name: /favorites/i }).parentElement!)

      expect(await screen.findByRole('tooltip')).toHaveTextContent(tooltip)
    })
  })

  describe('Units switch', () => {
    it('is on (°C) for metric units', () => {
      renderHeaderBar({ units: 'metric' })

      expect(screen.getByRole('switch')).toBeChecked()
    })

    it('is off (°F) for imperial units', () => {
      renderHeaderBar({ units: 'imperial' })

      expect(screen.getByRole('switch')).not.toBeChecked()
    })

    it('calls onToggleUnit when toggled', async () => {
      const user = userEvent.setup()
      const { onToggleUnit } = renderHeaderBar()

      await user.click(screen.getByRole('switch'))

      expect(onToggleUnit).toHaveBeenCalledTimes(1)
    })
  })
})
