export interface ColorPalette {
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Secondary colors
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  
  // Background colors
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  
  // Surface colors
  surface: string;
  surfaceSecondary: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;
  
  // Border colors
  border: string;
  borderLight: string;
  
  // Status colors
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;
  
  // BuJo specific colors
  bujo: {
    task: string;
    taskComplete: string;
    taskMigrated: string;
    taskScheduled: string;
    taskCancelled: string;
    event: string;
    note: string;
    inspiration: string;
    research: string;
    memory: string;
  };
}

export interface AppleTextStyle {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  fontWeight: '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontFamily: string;
}

export interface Typography {
  // Apple's text styles with proper optical sizing
  textStyles: {
    largeTitle: AppleTextStyle;
    title1: AppleTextStyle;
    title2: AppleTextStyle;
    title3: AppleTextStyle;
    headline: AppleTextStyle;
    body: AppleTextStyle;
    callout: AppleTextStyle;
    subheadline: AppleTextStyle;
    footnote: AppleTextStyle;
    caption1: AppleTextStyle;
    caption2: AppleTextStyle;
  };
  
  // Font families with proper SF Pro
  fontFamily: {
    display: string; // SF Pro Display for large text
    text: string;    // SF Pro Text for small text
    rounded: string; // SF Pro Rounded
    mono: string;    // SF Mono
  };
  
  // Dynamic Type scaling factors
  dynamicType: {
    scale: number;
    minimumScale: number;
    maximumScale: number;
  };
}

export interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xl2: number;
  xl3: number;
  xl4: number;
}

export interface BorderRadius {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

export interface Shadow {
  none: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  sm: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  md: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  lg: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

export interface Theme {
  colors: ColorPalette;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadow: Shadow;
  isDark: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'system';