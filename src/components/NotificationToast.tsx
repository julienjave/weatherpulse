import { Alert, Snackbar, type SnackbarCloseReason } from "@mui/material"
import type { Notification } from "../hooks/useNotification"


// === TYPES & INTERFACES ==================================================================

interface NotificationToastProps {
    notification: Notification | null
    onClose: () => void
    autoHideDuration?: number
}


// === COMPONENT: NOTIFICATIONTOAST ========================================================

export function NotificationToast({
    notification,
    onClose,
    autoHideDuration = 6000
}: NotificationToastProps) {

    if (!notification) return null

    const handleClose = (_event: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
        // Ignore clicks elsewhere on the page so the user has time to read the message
        if (reason === 'clickaway') return
        onClose()
    }

    return (
        // `key` remounts the Snackbar for each new message so its auto-hide timer restarts
        <Snackbar
            key={notification.id}
            open={notification.open}
            autoHideDuration={autoHideDuration}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
            <Alert
                onClose={onClose}
                severity={notification.severity}
                variant="filled"
                sx={{ width: '100%' }}
            >
                {notification.message}
            </Alert>
        </Snackbar>
    )
}
