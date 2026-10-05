import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { NotificationToast } from '../NotificationToast'
import type { Notification } from '../../hooks/useNotification'

describe('NotificationToast Component', () => {
  const notification: Notification = { id: 1, message: 'City not found.', severity: 'error', open: true }

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when there is no notification', () => {
    const { container } = render(<NotificationToast notification={null} onClose={vi.fn()} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders the message inside an alert', () => {
    render(<NotificationToast notification={notification} onClose={vi.fn()} />)

    expect(screen.getByRole('alert')).toHaveTextContent('City not found.')
  })

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<NotificationToast notification={notification} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: /close/i }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose after the auto-hide duration', async () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    render(<NotificationToast notification={notification} onClose={onClose} autoHideDuration={3000} />)

    vi.advanceTimersByTime(3000)

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
