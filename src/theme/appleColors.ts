import { ColorPalette } from './types';

// Apple's semantic color system - colors that adapt automatically
export const appleSemanticColors = {
  // System Colors (adapt to appearance and accessibility settings)
  label: {
    primary: 'rgba(0, 0, 0, 1.0)',           // Light mode
    secondary: 'rgba(60, 60, 67, 0.6)',      // 60% opacity
    tertiary: 'rgba(60, 60, 67, 0.3)',       // 30% opacity  
    quaternary: 'rgba(60, 60, 67, 0.18)',    // 18% opacity
  },
  labelDark: {
    primary: 'rgba(255, 255, 255, 1.0)',     // Dark mode
    secondary: 'rgba(235, 235, 245, 0.6)',   // 60% opacity
    tertiary: 'rgba(235, 235, 245, 0.3)',    // 30% opacity
    quaternary: 'rgba(235, 235, 245, 0.18)', // 18% opacity
  },

  fill: {
    primary: 'rgba(120, 120, 128, 0.2)',     // 20% opacity
    secondary: 'rgba(120, 120, 128, 0.16)',  // 16% opacity
    tertiary: 'rgba(118, 118, 128, 0.12)',   // 12% opacity
    quaternary: 'rgba(116, 116, 128, 0.08)', // 8% opacity
  },
  fillDark: {
    primary: 'rgba(120, 120, 128, 0.36)',    // 36% opacity
    secondary: 'rgba(120, 120, 128, 0.32)',  // 32% opacity
    tertiary: 'rgba(118, 118, 128, 0.24)',   // 24% opacity
    quaternary: 'rgba(116, 116, 128, 0.18)', // 18% opacity
  },

  separator: {
    opaque: 'rgba(198, 198, 200, 1.0)',      // Light mode
    nonOpaque: 'rgba(60, 60, 67, 0.29)',     // 29% opacity
  },
  separatorDark: {
    opaque: 'rgba(84, 84, 88, 1.0)',         // Dark mode  
    nonOpaque: 'rgba(84, 84, 88, 0.6)',      // 60% opacity
  },

  // Background colors
  systemBackground: {
    primary: 'rgba(255, 255, 255, 1.0)',     // Light mode
    secondary: 'rgba(242, 242, 247, 1.0)',   // Secondary background
    tertiary: 'rgba(255, 255, 255, 1.0)',    // Tertiary background
  },
  systemBackgroundDark: {
    primary: 'rgba(0, 0, 0, 1.0)',           // Dark mode
    secondary: 'rgba(28, 28, 30, 1.0)',      // Secondary background  
    tertiary: 'rgba(44, 44, 46, 1.0)',       // Tertiary background
  },

  // Grouped background (like Settings app)
  groupedBackground: {
    primary: 'rgba(242, 242, 247, 1.0)',     // Light mode
    secondary: 'rgba(255, 255, 255, 1.0)',   // Secondary
    tertiary: 'rgba(242, 242, 247, 1.0)',    // Tertiary
  },
  groupedBackgroundDark: {
    primary: 'rgba(0, 0, 0, 1.0)',           // Dark mode
    secondary: 'rgba(28, 28, 30, 1.0)',      // Secondary
    tertiary: 'rgba(44, 44, 46, 1.0)',       // Tertiary
  },
};

// Apple's system colors (branded colors that adapt to accessibility)
export const appleSystemColors = {
  blue: {
    light: 'rgba(0, 122, 255, 1.0)',         // Light mode
    dark: 'rgba(10, 132, 255, 1.0)',         // Dark mode
    accessible: 'rgba(0, 64, 221, 1.0)',     // High contrast
  },
  brown: {
    light: 'rgba(162, 132, 94, 1.0)',
    dark: 'rgba(172, 142, 104, 1.0)', 
    accessible: 'rgba(127, 101, 69, 1.0)',
  },
  cyan: {
    light: 'rgba(50, 173, 230, 1.0)',
    dark: 'rgba(100, 210, 255, 1.0)',
    accessible: 'rgba(0, 113, 164, 1.0)',
  },
  green: {
    light: 'rgba(52, 199, 89, 1.0)',
    dark: 'rgba(48, 209, 88, 1.0)',
    accessible: 'rgba(0, 125, 27, 1.0)',
  },
  indigo: {
    light: 'rgba(88, 86, 214, 1.0)',
    dark: 'rgba(94, 92, 230, 1.0)',
    accessible: 'rgba(54, 52, 163, 1.0)',
  },
  mint: {
    light: 'rgba(0, 199, 190, 1.0)',
    dark: 'rgba(102, 212, 207, 1.0)',
    accessible: 'rgba(12, 129, 123, 1.0)',
  },
  orange: {
    light: 'rgba(255, 149, 0, 1.0)',
    dark: 'rgba(255, 159, 10, 1.0)',
    accessible: 'rgba(201, 52, 0, 1.0)',
  },
  pink: {
    light: 'rgba(255, 45, 85, 1.0)',
    dark: 'rgba(255, 55, 95, 1.0)',
    accessible: 'rgba(211, 15, 69, 1.0)',
  },
  purple: {
    light: 'rgba(175, 82, 222, 1.0)',
    dark: 'rgba(191, 90, 242, 1.0)',
    accessible: 'rgba(137, 68, 171, 1.0)',
  },
  red: {
    light: 'rgba(255, 59, 48, 1.0)',
    dark: 'rgba(255, 69, 58, 1.0)',
    accessible: 'rgba(215, 0, 21, 1.0)',
  },
  teal: {
    light: 'rgba(48, 176, 199, 1.0)',
    dark: 'rgba(64, 200, 224, 1.0)',
    accessible: 'rgba(0, 130, 153, 1.0)',
  },
  yellow: {
    light: 'rgba(255, 204, 0, 1.0)',
    dark: 'rgba(255, 214, 10, 1.0)',
    accessible: 'rgba(178, 80, 0, 1.0)',
  },
};

// Generate our themed color palette using Apple's semantic approach
export const lightColorsApple: ColorPalette = {
  // Primary colors using Apple Blue
  primary: appleSystemColors.blue.light,
  primaryLight: 'rgba(0, 122, 255, 0.1)',
  primaryDark: appleSystemColors.blue.accessible,
  
  // Secondary colors using Apple Green
  secondary: appleSystemColors.green.light,
  secondaryLight: 'rgba(52, 199, 89, 0.1)',
  secondaryDark: appleSystemColors.green.accessible,
  
  // Semantic background colors
  background: appleSemanticColors.systemBackground.primary,
  backgroundSecondary: appleSemanticColors.systemBackground.secondary,
  backgroundTertiary: appleSemanticColors.systemBackground.tertiary,
  
  // Surface colors
  surface: appleSemanticColors.groupedBackground.secondary,
  surfaceSecondary: appleSemanticColors.groupedBackground.tertiary,
  
  // Text colors using Apple's label system
  text: appleSemanticColors.label.primary,
  textSecondary: appleSemanticColors.label.secondary,
  textTertiary: appleSemanticColors.label.tertiary,
  textDisabled: appleSemanticColors.label.quaternary,
  
  // Border colors
  border: appleSemanticColors.separator.opaque,
  borderLight: appleSemanticColors.separator.nonOpaque,
  
  // Status colors using Apple system colors
  success: appleSystemColors.green.light,
  successLight: 'rgba(52, 199, 89, 0.1)',
  warning: appleSystemColors.orange.light,
  warningLight: 'rgba(255, 149, 0, 0.1)',
  error: appleSystemColors.red.light,
  errorLight: 'rgba(255, 59, 48, 0.1)',
  info: appleSystemColors.blue.light,
  infoLight: 'rgba(0, 122, 255, 0.1)',
  
  // BuJo specific colors using Apple system colors
  bujo: {
    task: appleSemanticColors.label.primary,
    taskComplete: appleSystemColors.green.light,
    taskMigrated: appleSystemColors.orange.light,
    taskScheduled: appleSystemColors.blue.light,
    taskCancelled: appleSemanticColors.label.tertiary,
    event: appleSystemColors.blue.light,
    note: appleSemanticColors.label.secondary,
    inspiration: appleSystemColors.yellow.light,
    research: appleSystemColors.purple.light,
    memory: appleSystemColors.pink.light,
  },
};

export const darkColorsApple: ColorPalette = {
  // Primary colors using Apple Blue (dark variant)
  primary: appleSystemColors.blue.dark,
  primaryLight: 'rgba(10, 132, 255, 0.15)',
  primaryDark: appleSystemColors.blue.accessible,
  
  // Secondary colors using Apple Green (dark variant)
  secondary: appleSystemColors.green.dark,
  secondaryLight: 'rgba(48, 209, 88, 0.15)',
  secondaryDark: appleSystemColors.green.accessible,
  
  // Semantic background colors
  background: appleSemanticColors.systemBackgroundDark.primary,
  backgroundSecondary: appleSemanticColors.systemBackgroundDark.secondary,
  backgroundTertiary: appleSemanticColors.systemBackgroundDark.tertiary,
  
  // Surface colors
  surface: appleSemanticColors.groupedBackgroundDark.secondary,
  surfaceSecondary: appleSemanticColors.groupedBackgroundDark.tertiary,
  
  // Text colors using Apple's dark label system
  text: appleSemanticColors.labelDark.primary,
  textSecondary: appleSemanticColors.labelDark.secondary,
  textTertiary: appleSemanticColors.labelDark.tertiary,
  textDisabled: appleSemanticColors.labelDark.quaternary,
  
  // Border colors
  border: appleSemanticColors.separatorDark.opaque,
  borderLight: appleSemanticColors.separatorDark.nonOpaque,
  
  // Status colors using Apple system colors (dark variants)
  success: appleSystemColors.green.dark,
  successLight: 'rgba(48, 209, 88, 0.15)',
  warning: appleSystemColors.orange.dark,
  warningLight: 'rgba(255, 159, 10, 0.15)',
  error: appleSystemColors.red.dark,
  errorLight: 'rgba(255, 69, 58, 0.15)',
  info: appleSystemColors.blue.dark,
  infoLight: 'rgba(10, 132, 255, 0.15)',
  
  // BuJo specific colors using Apple system colors (dark variants)
  bujo: {
    task: appleSemanticColors.labelDark.primary,
    taskComplete: appleSystemColors.green.dark,
    taskMigrated: appleSystemColors.orange.dark,
    taskScheduled: appleSystemColors.blue.dark,
    taskCancelled: appleSemanticColors.labelDark.tertiary,
    event: appleSystemColors.blue.dark,
    note: appleSemanticColors.labelDark.secondary,
    inspiration: appleSystemColors.yellow.dark,
    research: appleSystemColors.purple.dark,
    memory: appleSystemColors.pink.dark,
  },
};