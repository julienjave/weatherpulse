import { AnimatePresence, motion } from "motion/react"
import { DURATION_FAST, EASE_OUT } from "../utils/motionVariants"


// === TYPES & INTERFACES ==================================================================

interface AnimatedTextProps {
    text: string
}


// === COMPONENT: ANIMATEDTEXT =============================================================

// Crossfades (with a small vertical slide) whenever `text` changes, e.g. 22°C → 71°F.
// Keyed on the full string so a new value and its unit symbol always swap together.
export function AnimatedText({ text }: AnimatedTextProps) {
    return (
        // `popLayout` takes the outgoing text out of the flow so both can overlap during the
        // crossfade; the relative wrapper is the anchor it gets positioned against
        <span style={{ position: 'relative', display: 'inline-block' }}>
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                    key={text}
                    style={{ display: 'inline-block' }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: DURATION_FAST, ease: EASE_OUT }}
                >
                    {text}
                </motion.span>
            </AnimatePresence>
        </span>
    )
}
