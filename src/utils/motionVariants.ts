import type { Transition, Variants } from 'motion/react'

// === SHARED MOTION TOKENS =================================================================

// One easing curve and a couple of durations so every animation in the app feels related
export const EASE_OUT: Transition['ease'] = [0.22, 1, 0.36, 1]
export const DURATION_FAST = 0.2
export const DURATION_BASE = 0.4


// === VARIANTS =============================================================================

// Parent container: reveals its `fadeSlideUp` children one after another
export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: DURATION_FAST, staggerChildren: 0.08 }
    },
    exit: { opacity: 0, transition: { duration: DURATION_FAST } }
}

// Child card: fades in while sliding up a little
export const fadeSlideUp: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: DURATION_BASE, ease: EASE_OUT } }
}

// Simple crossfade, e.g. between the loading skeleton and the panel
export const fade: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: DURATION_FAST } },
    exit: { opacity: 0, transition: { duration: DURATION_FAST } }
}
