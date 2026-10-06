import '@testing-library/jest-dom/vitest'
import '@testing-library/jest-dom'
import { MotionGlobalConfig } from 'motion/react'

// Finish every Motion animation instantly so tests stay fast and deterministic
// (exiting elements still unmount asynchronously, so use `waitFor` for removals)
MotionGlobalConfig.skipAnimations = true
