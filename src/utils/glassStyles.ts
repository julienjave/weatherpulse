// === GLASSMORPHISM ========================================================================

// `backdropFilter` only shows through a (semi-)transparent background, so the Paper's
// default opaque `background.paper` must be replaced with a translucent color
export const glassSx = {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    backgroundImage: 'none',                      // Clears MUI's dark-mode elevation overlay
    backdropFilter: 'blur(10px) saturate(160%)',
    WebkitBackdropFilter: 'blur(10px) saturate(160%)', // Safari
    border: '1px solid rgba(255, 255, 255, 0.5)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)'
}
