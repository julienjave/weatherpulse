import { useState, useRef, useCallback } from "react"
import type { AlertColor } from "@mui/material"


// === TYPES & INTERFACES ================================================================

export interface Notification {
    id: number              // Unique per notify() call so the Snackbar restarts its timer
    message: string
    severity: AlertColor
    open: boolean           // Kept separate from the message so it stays visible during the exit transition
}


// === USENOTIFICATION ===================================================================

export function useNotification() {
    // 1. STATE VARIABLES
    const [notification, setNotification] = useState<Notification | null>(null)
    const nextIdRef = useRef<number>(0)

    // 2. HANDLER: SHOW A NEW TOAST (replaces the current one)
    const notify = useCallback((message: string, severity: AlertColor = 'error') => {
        nextIdRef.current += 1
        setNotification({ id: nextIdRef.current, message, severity, open: true })
    }, [])

    // 3. HANDLER: HIDE THE CURRENT TOAST
    const dismiss = useCallback(() => {
        setNotification((prev) => prev ? { ...prev, open: false } : prev)
    }, [])

    // 4. RETURN STATE AND HANDLERS
    return {
        notification,
        notify,
        dismiss
    }
}
