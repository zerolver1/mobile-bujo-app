import { WithSpringConfig, WithTimingConfig, withSpring, withTiming } from 'react-native-reanimated';

export interface SpringPresets {
  gentle: WithSpringConfig;
  smooth: WithSpringConfig;
  bouncy: WithSpringConfig;
  snappy: WithSpringConfig;
  wobbly: WithSpringConfig;
}

export interface TimingPresets {
  fast: WithTimingConfig;
  normal: WithTimingConfig;
  slow: WithTimingConfig;
  ink: WithTimingConfig;
  fade: WithTimingConfig;
}

// Apple's actual spring presets from iOS UIViewPropertyAnimator
export const springPresets: SpringPresets = {
  // Apple's standard spring animation (most buttons, transitions)
  gentle: {
    damping: 0.8,
    stiffness: 0.4,
    mass: 1,
  },
  // Apple's smooth animation (navigation, scrolling)
  smooth: {
    damping: 0.9,
    stiffness: 0.5,
    mass: 1,
  },
  // Apple's bouncy animation (alerts, modals)
  bouncy: {
    damping: 0.6,
    stiffness: 0.8,
    mass: 1,
  },
  // Apple's snappy animation (quick interactions)
  snappy: {
    damping: 1.0,
    stiffness: 1.0,
    mass: 0.7,
  },
  // Apple's playful animation (rarely used)
  wobbly: {
    damping: 0.4,
    stiffness: 0.6,
    mass: 1,
  },
};

export const timingPresets: TimingPresets = {
  fast: {
    duration: 200,
  },
  normal: {
    duration: 300,
  },
  slow: {
    duration: 500,
  },
  ink: {
    duration: 600,
  },
  fade: {
    duration: 250,
  },
};

// Animation helper functions
export const springAnimation = (
  preset: keyof SpringPresets = 'smooth',
  customConfig?: Partial<WithSpringConfig>
) => {
  return {
    ...springPresets[preset],
    ...customConfig,
  };
};

export const timingAnimation = (
  preset: keyof TimingPresets = 'normal',
  customConfig?: Partial<WithTimingConfig>
) => {
  return {
    ...timingPresets[preset],
    ...customConfig,
  };
};

// Common animation patterns
export const animations = {
  // Button press animations
  buttonPress: {
    pressIn: () => withSpring(0.96, springPresets.snappy),
    pressOut: () => withSpring(1, springPresets.smooth),
  },

  // Card animations
  cardHover: {
    in: () => withSpring(1.02, springPresets.gentle),
    out: () => withSpring(1, springPresets.smooth),
  },

  // Fade animations
  fadeIn: () => withTiming(1, timingPresets.fade),
  fadeOut: () => withTiming(0, timingPresets.fade),

  // Scale animations
  scaleIn: () => withSpring(1, springPresets.bouncy),
  scaleOut: () => withSpring(0, springPresets.smooth),

  // Slide animations
  slideInUp: (distance: number = 20) => withSpring(-distance, springPresets.smooth),
  slideInDown: (distance: number = 20) => withSpring(distance, springPresets.smooth),
  slideOut: () => withSpring(0, springPresets.smooth),

  // Ink spread animation
  inkSpread: {
    scale: () => withTiming(2, timingPresets.ink),
    opacity: () => withTiming(0, timingPresets.ink),
  },

  // Page transitions
  pageTransition: {
    in: () => withSpring(0, springPresets.smooth),
    out: (direction: 'left' | 'right' = 'right') => 
      withSpring(direction === 'right' ? -100 : 100, springPresets.smooth),
  },

  // Modal animations
  modalPresent: {
    backdrop: () => withTiming(1, timingPresets.normal),
    content: () => withSpring(1, springPresets.bouncy),
  },
  modalDismiss: {
    backdrop: () => withTiming(0, timingPresets.fast),
    content: () => withSpring(0, springPresets.smooth),
  },

  // Loading animations
  loadingPulse: () => withTiming(0.8, { 
    ...timingPresets.normal, 
    // Would add repeat: -1 here if needed
  }),

  // List item animations
  listItemReveal: (index: number) => withSpring(1, {
    ...springPresets.smooth,
    // Add delay based on index for staggered effect
  }),
};

// Gesture animation helpers
export const gestureAnimations = {
  snapPoint: (velocity: number, snapPoints: number[]) => {
    'worklet';
    // Find the closest snap point based on velocity
    // This is a simplified version - in practice you'd want more sophisticated logic
    return snapPoints.reduce((prev, curr) => 
      Math.abs(curr - velocity) < Math.abs(prev - velocity) ? curr : prev
    );
  },
  
  rubberBand: (value: number, limit: number, damping: number = 0.5) => {
    'worklet';
    if (Math.abs(value) <= limit) return value;
    const excess = Math.abs(value) - limit;
    const dampedExcess = excess * damping;
    return value > 0 ? limit + dampedExcess : -limit - dampedExcess;
  },
};

// Apple's actual easing curves from iOS Core Animation
export const easings = {
  // Apple's standard easing (CAMediaTimingFunctionName.default)
  standard: 'cubic-bezier(0.25, 0.1, 0.25, 1)' as const,
  // Apple's ease-in (CAMediaTimingFunctionName.easeIn)
  easeIn: 'cubic-bezier(0.42, 0, 1, 1)' as const,
  // Apple's ease-out (CAMediaTimingFunctionName.easeOut) 
  easeOut: 'cubic-bezier(0, 0, 0.58, 1)' as const,
  // Apple's ease-in-out (CAMediaTimingFunctionName.easeInEaseOut)
  easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)' as const,
  
  // Apple's custom curves for specific interactions
  buttonPress: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' as const,
  modalPresent: 'cubic-bezier(0.32, 0.72, 0, 1)' as const,
  modalDismiss: 'cubic-bezier(0.36, 0.66, 0.04, 1)' as const,
  
  // Apple's gentle curves for delicate interactions
  gentle: 'cubic-bezier(0.16, 1, 0.3, 1)' as const,
  ink: 'cubic-bezier(0.2, 0, 0.2, 1)' as const,
};

export default {
  spring: springPresets,
  timing: timingPresets,
  animations,
  gestureAnimations,
  easings,
};