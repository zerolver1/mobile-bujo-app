import { Dimensions, Platform } from 'react-native';
import { AppleTextStyle } from './types';
import { typography } from './constants';

// Apple's Dynamic Type size categories
export type DynamicTypeSize = 
  | 'xSmall' 
  | 'small' 
  | 'medium' 
  | 'large' 
  | 'xLarge' 
  | 'xxLarge' 
  | 'xxxLarge'
  // Accessibility sizes
  | 'accessibilityMedium'
  | 'accessibilityLarge'
  | 'accessibilityXLarge'
  | 'accessibilityXXLarge'
  | 'accessibilityXXXLarge';

// Apple's scaling factors for each Dynamic Type size
const dynamicTypeScales: Record<DynamicTypeSize, number> = {
  xSmall: 0.82,
  small: 0.88,
  medium: 0.95,
  large: 1.0,   // Default size
  xLarge: 1.12,
  xxLarge: 1.23,
  xxxLarge: 1.35,
  // Accessibility sizes (much larger scaling)
  accessibilityMedium: 1.64,
  accessibilityLarge: 1.95,
  accessibilityXLarge: 2.35,
  accessibilityXXLarge: 2.76,
  accessibilityXXXLarge: 3.12,
};

// Current Dynamic Type size (would be read from system settings)
let currentDynamicTypeSize: DynamicTypeSize = 'large';

export const setDynamicTypeSize = (size: DynamicTypeSize) => {
  currentDynamicTypeSize = size;
};

export const getDynamicTypeSize = (): DynamicTypeSize => {
  return currentDynamicTypeSize;
};

export const getDynamicTypeScale = (size?: DynamicTypeSize): number => {
  const typeSize = size || currentDynamicTypeSize;
  return dynamicTypeScales[typeSize];
};

// Apply Dynamic Type scaling to a text style
export const scaledTextStyle = (
  baseStyle: AppleTextStyle, 
  maxScale?: number,
  size?: DynamicTypeSize
): AppleTextStyle => {
  const scale = getDynamicTypeScale(size);
  const limitedScale = maxScale ? Math.min(scale, maxScale) : scale;
  
  return {
    ...baseStyle,
    fontSize: Math.round(baseStyle.fontSize * limitedScale),
    lineHeight: Math.round(baseStyle.lineHeight * limitedScale),
    // Letter spacing should scale less aggressively
    letterSpacing: baseStyle.letterSpacing * Math.min(limitedScale, 1.2),
  };
};

// Get all text styles scaled for current Dynamic Type size
export const getScaledTextStyles = (size?: DynamicTypeSize) => {
  const scale = getDynamicTypeScale(size);
  const styles = typography.textStyles;
  
  return {
    largeTitle: scaledTextStyle(styles.largeTitle, 2.0, size),
    title1: scaledTextStyle(styles.title1, 1.8, size),
    title2: scaledTextStyle(styles.title2, 1.6, size),
    title3: scaledTextStyle(styles.title3, 1.4, size),
    headline: scaledTextStyle(styles.headline, undefined, size),
    body: scaledTextStyle(styles.body, undefined, size),
    callout: scaledTextStyle(styles.callout, undefined, size),
    subheadline: scaledTextStyle(styles.subheadline, undefined, size),
    footnote: scaledTextStyle(styles.footnote, undefined, size),
    caption1: scaledTextStyle(styles.caption1, undefined, size),
    caption2: scaledTextStyle(styles.caption2, undefined, size),
  };
};

// Check if current Dynamic Type size is an accessibility size
export const isAccessibilitySize = (size?: DynamicTypeSize): boolean => {
  const typeSize = size || currentDynamicTypeSize;
  return typeSize.includes('accessibility');
};

// Get appropriate spacing for current Dynamic Type size
export const getScaledSpacing = (baseSpacing: number, size?: DynamicTypeSize): number => {
  const scale = getDynamicTypeScale(size);
  
  // Spacing should scale less aggressively than text
  const spacingScale = 1 + ((scale - 1) * 0.5);
  return Math.round(baseSpacing * spacingScale);
};

// Hook to detect system Dynamic Type changes (would integrate with native modules)
export const useDynamicType = () => {
  // In a real implementation, this would listen to system settings changes
  // and return the current Dynamic Type size and scaled text styles
  
  return {
    currentSize: getDynamicTypeSize(),
    scaledTextStyles: getScaledTextStyles(),
    isAccessibilitySize: isAccessibilitySize(),
    scale: getDynamicTypeScale(),
  };
};

// Utility to create responsive font sizes that work with Dynamic Type
export const responsiveSize = (size: number, options?: {
  minSize?: number;
  maxSize?: number;
  scaleWithDynamicType?: boolean;
}) => {
  const { 
    minSize = size * 0.8, 
    maxSize = size * 2.5, 
    scaleWithDynamicType = true 
  } = options || {};
  
  let finalSize = size;
  
  if (scaleWithDynamicType) {
    finalSize = size * getDynamicTypeScale();
  }
  
  // Clamp to min/max
  finalSize = Math.max(minSize, Math.min(maxSize, finalSize));
  
  return Math.round(finalSize);
};

// Apple's line height calculation based on font size
export const calculateLineHeight = (fontSize: number): number => {
  // Apple's formula for optimal line height
  if (fontSize <= 12) return fontSize * 1.33;
  if (fontSize <= 17) return fontSize * 1.29;
  if (fontSize <= 22) return fontSize * 1.27;
  return fontSize * 1.21;
};

// Apple's minimum touch target calculation
export const getMinimumTouchTarget = (): number => {
  const scale = getDynamicTypeScale();
  const baseTarget = 44; // Apple's base minimum
  
  // Scale touch targets with Dynamic Type for accessibility
  return Math.max(baseTarget, Math.round(baseTarget * scale));
};