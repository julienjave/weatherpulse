import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SearchBar } from '../SearchBar'
import * as weatherApi from '../../services/weatherApi'

// Uses the REAL useCitySearch hook (only the network layer is mocked) so the
// interaction between the hook's searchTerm and MUI Autocomplete's value is exercised
vi.mock('../../services/weatherApi', () => ({
  searchCityByName: vi.fn(),
  getReverseGeocode: vi.fn(),
}))

describe('SearchBar + useCitySearch integration', () => {
  const mockOnSelectLocation = vi.fn()
  const mockOnClear = vi.fn()

  const paris = { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'FR' }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(weatherApi.searchCityByName).mockResolvedValue({ data: [paris], error: null })
  })

  const renderSearchBar = () =>
    render(
      <SearchBar
        onSelectLocation={mockOnSelectLocation}
        onUseMyLocation={vi.fn()}
        onClear={mockOnClear}
      />
    )

  it('searches after debounce, selects a city and shows its label in the input', async () => {
    const user = userEvent.setup()
    renderSearchBar()

    const input = screen.getByRole('combobox', { name: /search city/i })
    await user.type(input, 'Par')

    // Debounced search (500ms) resolves and populates the dropdown
    await user.click(await screen.findByText('Paris', {}, { timeout: 2000 }))

    expect(weatherApi.searchCityByName).toHaveBeenCalledWith('Par', 5, expect.any(AbortSignal))
    expect(mockOnSelectLocation).toHaveBeenCalledWith(paris)
    expect(input).toHaveValue('Paris, France')
  })

  it('empties the input on Clear and does not restore the previous selection on blur', async () => {
    const user = userEvent.setup()
    renderSearchBar()

    const input = screen.getByRole('combobox', { name: /search city/i })
    await user.type(input, 'Par')
    await user.click(await screen.findByText('Paris', {}, { timeout: 2000 }))
    expect(input).toHaveValue('Paris, France')

    // Once a value is selected, MUI's Autocomplete renders its own icon button also
    // labelled "Clear", so target our text button explicitly
    await user.click(screen.getByText('Clear', { selector: 'button' }))

    expect(mockOnClear).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(input).toHaveValue(''))

    // Focus then blur the input: MUI must not bring back "Paris, France"
    await user.click(input)
    await user.tab()

    expect(input).toHaveValue('')
  })
})
