import { Typography, Spacing, BorderRadius, Shadow } from './types';
import { Platform } from 'react-native';

export const typography: Typography = {
  // Apple's precise text styles with proper optical sizing
  textStyles: {
    largeTitle: {
      fontSize: 34,
      lineHeight: 41,
      letterSpacing: 0.374,
      fontWeight: '400',
      fontFamily: Platform.select({
        ios: '.AppleSystemUIFontLargeTitle',
        android: 'Roboto',
        default: 'System',
      }) as string,
    },
    title1: {
      fontSize: 28,
      lineHeight: 34,
      letterSpacing: 0.364,
      fontWeight: '400',
      fontFamily: Platform.select({
        ios: '.AppleSystemUIFontTitle1',
        android: 'Roboto',
        default: 'System',
      }) as string,
    },
    title2: {
      fontSize: 22,
      lineHeight: 28,
      letterSpacing: 0.352,
      fontWeight: '400',
      fontFamily: Platform.select({
        ios: '.AppleSystemUIFontTitle2',
        android: 'Roboto',
        default: 'System',
      }) as string,
    },
    title3: {
      fontSize: 20,
      lineHeight: 25,
      letterSpacing: 0.38,
      fontWeight: '400',
      fontFamily: Platform.select({
        ios: '.AppleSystemUIFontTitle3',
        android: 'Roboto',
        default: 'System',
      }) as string,
    },
    headline: {
      fontSize: 17,
      lineHeight: 22,
      letterSpacing: -0.408,
      fontWeight: '600',
      fontFamily: Platform.select({
        ios: '.AppleSystemUIFontHeadline',
        android: 'Roboto-Medium',
        default: 'System',
      }) as string,
    },
    body: {
      fontSize: 17,
      lineHeight: 22,
      letterSpacing: -0.408,
      fontWeight: '400',
      fontFamily: Platform.select({
        ios: '.AppleSystemUIFontBody',
        android: 'Roboto',
        default: 'System',
      }) as string,
    },
    callout: {
      fontSize: 16,
      lineHeight: 21,
      letterSpacing: -0.32,
      fontWeight: '400',
      fontFamily: Platform.select({
        ios: '.AppleSystemUIFontCallout',
        android: 'Roboto',
        default: 'System',
      }) as string,
    },
    subheadline: {
      fontSize: 15,
      lineHeight: 20,
      letterSpacing: -0.24,
      fontWeight: '400',
      fontFamily: Platform.select({
        ios: '.AppleSystemUIFontSubheadline',
        android: 'Roboto',
        default: 'System',
      }) as string,
    },
    footnote: {
      fontSize: 13,
      lineHeight: 18,
      letterSpacing: -0.078,
      fontWeight: '400',
      fontFamily: Platform.select({
        ios: '.AppleSystemUIFontFootnote',
        android: 'Roboto',
        default: 'System',
      }) as string,
    },
    caption1: {
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0,
      fontWeight: '400',
      fontFamily: Platform.select({
        ios: '.AppleSystemUIFontCaption1',
        android: 'Roboto',
        default: 'System',
      }) as string,
    },
    caption2: {
      fontSize: 11,
      lineHeight: 13,
      letterSpacing: 0.066,
      fontWeight: '400',
      fontFamily: Platform.select({
        ios: '.AppleSystemUIFontCaption2',
        android: 'Roboto',
        default: 'System',
      }) as string,
    },
  },

  fontFamily: {
    display: Platform.select({
      ios: '-apple-system',
      android: 'Roboto',
      default: 'System',
    }) as string,
    text: Platform.select({
      ios: '-apple-system',
      android: 'Roboto',
      default: 'System',
    }) as string,
    rounded: Platform.select({
      ios: '.AppleSystemUIFontRounded',
      android: 'Roboto',
      default: 'System',
    }) as string,
    mono: Platform.select({
      ios: 'SF Mono',
      android: 'monospace',
      default: 'monospace',
    }) as string,
  },

  dynamicType: {
    scale: 1.0,
    minimumScale: 0.82,
    maximumScale: 2.76,
  },
};

// Apple's 4pt spacing system (converted to px for React Native)
export const spacing: Spacing = {
  xs: 2,   // 0.5pt
  sm: 4,   // 1pt base unit
  md: 8,   // 2pt
  lg: 12,  // 3pt
  xl: 16,  // 4pt
  xl2: 20, // 5pt  
  xl3: 24, // 6pt
  xl4: 32, // 8pt
};

export const borderRadius: BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const shadow: Shadow = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
};