export { ThemeProvider, useTheme } from './ThemeProvider';
export { lightTheme, darkTheme } from './themes';
export type { Theme, ThemeMode, ColorPalette, Typography, Spacing, BorderRadius, Shadow } from './types';
export { typography, spacing, borderRadius, shadow } from './constants';
export { lightColors, darkColors } from './colors';
export { springPresets, timingPresets, animations, gestureAnimations, easings } from './animations';
export type { SpringPresets, TimingPresets } from './animations';

export { 
  setDynamicTypeSize, 
  getDynamicTypeSize, 
  getDynamicTypeScale, 
  scaledTextStyle, 
  getScaledTextStyles,
  isAccessibilitySize,
  getScaledSpacing,
  useDynamicType,
  responsiveSize,
  calculateLineHeight,
  getMinimumTouchTarget,
} from './dynamicType';
export type { DynamicTypeSize } from './dynamicType';