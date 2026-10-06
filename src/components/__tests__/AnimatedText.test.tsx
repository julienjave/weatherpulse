import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AnimatedText } from '../AnimatedText'

describe('AnimatedText Component', () => {
  it('renders the given text', () => {
    render(<AnimatedText text="22°C" />)

    expect(screen.getByText('22°C')).toBeInTheDocument()
  })

  it('swaps to the new text when it changes and removes the old one', async () => {
    const { rerender } = render(<AnimatedText text="22°C" />)

    rerender(<AnimatedText text="72°F" />)

    expect(screen.getByText('72°F')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('22°C')).not.toBeInTheDocument())
  })

  it('keeps the same element when re-rendered with unchanged text', () => {
    const { rerender } = render(<AnimatedText text="22°C" />)
    const before = screen.getByText('22°C')

    rerender(<AnimatedText text="22°C" />)

    expect(screen.getByText('22°C')).toBe(before)
  })
})
