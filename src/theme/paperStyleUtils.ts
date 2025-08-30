/**
 * Paper Style Utilities
 * 
 * Consistent styling functions for the paper journal aesthetic.
 * These utilities ensure all components follow the same visual patterns.
 */

import { ViewStyle, TextStyle, Platform } from 'react-native';
import { Theme } from './types';
import { PAPER_DESIGN_TOKENS, PaperIntensity, PaperButtonSize, PaperCardPadding } from './paperDesignTokens';

// Utility to create paper-like shadows based on theme
export const createPaperShadow = (
  shadowType: keyof typeof PAPER_DESIGN_TOKENS.shadows,
  theme: Theme
): ViewStyle => {
  const shadow = PAPER_DESIGN_TOKENS.shadows[shadowType];
  
  // Adjust shadow color based on theme
  let shadowColor = shadow.shadowColor;
  if (theme.isDark && shadowType !== 'none') {
    shadowColor = 'rgba(0, 0, 0, 0.4)'; // Darker shadows for dark theme
  }
  
  return {
    ...shadow,
    shadowColor,
  };
};

// Utility to get paper background colors with intensity
export const getPaperBackground = (
  variant: 'surface' | 'background' | 'backgroundSecondary',
  intensity: PaperIntensity = 'light',
  theme: Theme
): string => {
  const baseColor = theme.colors[variant];
  const alpha = PAPER_DESIGN_TOKENS.intensities[intensity];
  
  // Add subtle texture overlay
  if (intensity === 'minimal') {
    return baseColor;
  }
  
  // Create layered background with texture
  return theme.isDark 
    ? `rgba(255, 255, 255, ${alpha * 0.5})` // Subtle light overlay on dark
    : `rgba(139, 69, 19, ${alpha * 0.3})`; // Warm brown paper texture on light
};

// Utility for ink-like text styling
export const createInkTextStyle = (
  variant: 'ink' | 'pencil' | 'highlight',
  theme: Theme,
  size?: 'sm' | 'md' | 'lg'
): TextStyle => {
  const baseStyle: TextStyle = {
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'System',
    }),
  };
  
  const inkDepth = PAPER_DESIGN_TOKENS.ink.inkDepth.light;
  
  switch (variant) {
    case 'ink':
      return {
        ...baseStyle,
        color: theme.colors.text,
        fontWeight: '600',
        textShadowColor: theme.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
        textShadowOffset: inkDepth.offset,
        textShadowRadius: inkDepth.radius,
      };
      
    case 'pencil':
      return {
        ...baseStyle,
        color: theme.colors.textSecondary,
        fontWeight: '400',
        opacity: 0.9,
      };
      
    case 'highlight':
      return {
        ...baseStyle,
        color: theme.isDark ? theme.colors.text : '#92400E',
        fontWeight: '600',
        backgroundColor: theme.isDark 
          ? 'rgba(251, 191, 36, 0.15)'
          : 'rgba(254, 240, 138, 0.4)',
      };
      
    default:
      return baseStyle;
  }
};

// Utility for consistent button styling
export const createPaperButtonStyle = (
  variant: 'ink' | 'pencil' | 'highlight' | 'sticky',
  size: PaperButtonSize,
  theme: Theme,
  disabled: boolean = false
): ViewStyle => {
  const sizeProps = PAPER_DESIGN_TOKENS.buttonSizes[size];
  
  const baseStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: PAPER_DESIGN_TOKENS.radius.soft,
    paddingHorizontal: sizeProps.paddingHorizontal,
    paddingVertical: sizeProps.paddingVertical,
    minHeight: sizeProps.minHeight,
  };
  
  // Variant-specific styles
  const variantStyles: Record<string, ViewStyle> = {
    ink: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: theme.colors.text,
      ...createPaperShadow('none', theme),
    },
    
    pencil: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.textSecondary,
      borderStyle: 'dashed',
      borderRadius: PAPER_DESIGN_TOKENS.radius.card,
    },
    
    highlight: {
      backgroundColor: theme.isDark 
        ? 'rgba(251, 191, 36, 0.15)'
        : 'rgba(254, 240, 138, 0.4)',
      borderWidth: 0,
      borderRadius: PAPER_DESIGN_TOKENS.radius.button,
      transform: [{ skewX: `${PAPER_DESIGN_TOKENS.angles.highlight.skew}deg` }],
    },
    
    sticky: {
      backgroundColor: theme.isDark 
        ? 'rgba(217, 119, 6, 0.2)'
        : '#FEF3C7',
      borderWidth: 0,
      borderRadius: PAPER_DESIGN_TOKENS.radius.note,
      transform: [{ rotate: `${PAPER_DESIGN_TOKENS.angles.stickyNote.min + 1}deg` }],
      ...createPaperShadow('sticky', theme),
    },
  };
  
  const disabledStyle: ViewStyle = disabled ? { opacity: 0.4 } : {};
  
  return {
    ...baseStyle,
    ...variantStyles[variant],
    ...disabledStyle,
  };
};

// Utility for consistent card styling
export const createPaperCardStyle = (
  variant: 'page' | 'sticky' | 'torn' | 'elevated' | 'outlined' | 'flat',
  padding: PaperCardPadding,
  theme: Theme,
  showHoles: boolean = false
): ViewStyle => {
  const paddingValue = PAPER_DESIGN_TOKENS.cardPadding[padding];
  
  const baseStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    padding: paddingValue,
  };
  
  // Add margin for hole punch effect
  const contentMargin = showHoles ? { marginLeft: 32 } : {};
  
  const variantStyles: Record<string, ViewStyle> = {
    page: {
      borderRadius: PAPER_DESIGN_TOKENS.radius.soft,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      borderLeftWidth: 0,
      borderRightWidth: 0,
      ...createPaperShadow('paper', theme),
      ...contentMargin,
    },
    
    sticky: {
      backgroundColor: theme.isDark 
        ? 'rgba(217, 119, 6, 0.25)'
        : '#FEF3C7',
      borderRadius: PAPER_DESIGN_TOKENS.radius.note,
      borderWidth: 0,
      transform: [{ rotate: `${PAPER_DESIGN_TOKENS.angles.stickyNote.max * -0.8}deg` }],
      ...createPaperShadow('sticky', theme),
    },
    
    torn: {
      borderRadius: PAPER_DESIGN_TOKENS.radius.subtle,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      borderTopWidth: 1.5,
      borderTopColor: theme.colors.borderLight,
      borderStyle: 'dashed',
      ...createPaperShadow('paper', theme),
    },
    
    elevated: {
      borderRadius: PAPER_DESIGN_TOKENS.radius.card,
      ...createPaperShadow('card', theme),
    },
    
    outlined: {
      borderRadius: PAPER_DESIGN_TOKENS.radius.card,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      backgroundColor: theme.isDark 
        ? theme.colors.surface 
        : `${theme.colors.surface}F8`,
    },
    
    flat: {
      backgroundColor: 'transparent',
      ...createPaperShadow('none', theme),
    },
  };
  
  return {
    ...baseStyle,
    ...variantStyles[variant],
  };
};

// Utility for paper texture patterns
export const getPaperPatternProps = (
  variant: 'subtle' | 'lined' | 'grid' | 'dotted',
  intensity: PaperIntensity,
  theme: Theme
) => {
  const opacity = PAPER_DESIGN_TOKENS.intensities[intensity];
  
  const colors = {
    lineColor: theme.isDark 
      ? `rgba(157, 156, 161, ${opacity})`
      : `rgba(75, 85, 99, ${opacity})`,
    marginColor: theme.isDark 
      ? 'rgba(96, 165, 250, 0.12)'
      : 'rgba(30, 64, 175, 0.1)',
    dotColor: theme.isDark 
      ? `rgba(156, 163, 175, ${opacity})`
      : `rgba(107, 114, 128, ${opacity})`,
    rulingColor: theme.isDark
      ? 'rgba(255, 255, 255, 0.06)'
      : 'rgba(0, 0, 0, 0.04)',
  };
  
  return {
    colors,
    dimensions: {
      lineHeight: PAPER_DESIGN_TOKENS.dimensions.lineHeight,
      gridSize: PAPER_DESIGN_TOKENS.dimensions.gridSize,
      dotSpacing: PAPER_DESIGN_TOKENS.dimensions.dotSpacing,
      marginLeft: PAPER_DESIGN_TOKENS.dimensions.marginLeft,
    },
  };
};

// Utility for safe theme access with fallbacks
export const safeThemeAccess = <T>(
  theme: Theme | undefined | null,
  accessor: (theme: Theme) => T,
  fallback: T
): T => {
  try {
    if (!theme) return fallback;
    return accessor(theme) || fallback;
  } catch {
    return fallback;
  }
};

// Utility for responsive spacing based on screen size
export const getResponsiveSpacing = (
  base: keyof typeof PAPER_DESIGN_TOKENS.spacing,
  screenWidth: number
): number => {
  const baseValue = PAPER_DESIGN_TOKENS.spacing[base];
  
  // Scale spacing for larger screens (tablet adaptation)
  if (screenWidth > 768) {
    return Math.round(baseValue * 1.5);
  }
  
  return baseValue;
};

// Export commonly used style combinations
export const COMMON_PAPER_STYLES = {
  screenContainer: (theme: Theme): ViewStyle => ({
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: PAPER_DESIGN_TOKENS.spacing.xl,
  }),
  
  sectionHeader: (theme: Theme): ViewStyle => ({
    marginBottom: PAPER_DESIGN_TOKENS.spacing.md,
    paddingBottom: PAPER_DESIGN_TOKENS.spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
  }),
  
  entryContainer: (theme: Theme): ViewStyle => ({
    marginBottom: PAPER_DESIGN_TOKENS.spacing.lg,
    ...createPaperCardStyle('page', 'md', theme),
  }),
};