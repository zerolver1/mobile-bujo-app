import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { useTheme } from '../../theme';

export interface TypographyProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body1' | 'body2' | 'caption' | 'overline' | 'mono';
  color?: 'primary' | 'secondary' | 'tertiary' | 'disabled' | 'success' | 'warning' | 'error' | 'custom';
  customColor?: string;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  numberOfLines?: number;
  style?: TextStyle;
}

export const Typography: React.FC<TypographyProps> = ({
  children,
  variant = 'body1',
  color = 'primary',
  customColor,
  weight = 'normal',
  align = 'left',
  numberOfLines,
  style,
}) => {
  const { theme } = useTheme();

  const getTextStyle = () => {
    // Safety check - if theme is not loaded, return a fallback
    if (!theme?.typography?.textStyles || !theme?.colors) {
      return {
        fontSize: 17,
        lineHeight: 22,
        color: '#000000',
      };
    }
    
    // Map old variants to new Apple text styles
    const variantStyles = {
      h1: theme.typography?.textStyles?.largeTitle || { fontSize: 34, lineHeight: 41, fontWeight: '700' },
      h2: theme.typography?.textStyles?.title1 || { fontSize: 28, lineHeight: 34, fontWeight: '700' },
      h3: theme.typography?.textStyles?.title2 || { fontSize: 22, lineHeight: 28, fontWeight: '700' },
      h4: theme.typography?.textStyles?.title3 || { fontSize: 20, lineHeight: 25, fontWeight: '600' },
      body1: theme.typography?.textStyles?.body || { fontSize: 17, lineHeight: 22 },
      body2: theme.typography?.textStyles?.callout || { fontSize: 16, lineHeight: 21 },
      caption: theme.typography?.textStyles?.caption1 || { fontSize: 12, lineHeight: 16 },
      overline: {
        ...(theme.typography?.textStyles?.caption2 || { fontSize: 11, lineHeight: 13 }),
        textTransform: 'uppercase' as const,
        letterSpacing: 1.5,
      },
      mono: {
        ...(theme.typography?.textStyles?.body || { fontSize: 17, lineHeight: 22 }),
        fontFamily: theme.typography?.fontFamily?.mono || 'Courier New',
      },
    };

    // Color styles
    const colorStyles = {
      primary: { color: theme.colors?.text || '#1C1C1E' },
      secondary: { color: theme.colors?.textSecondary || '#8E8E93' },
      tertiary: { color: theme.colors?.textTertiary || '#C7C7CC' },
      disabled: { color: theme.colors?.textDisabled || '#D1D1D6' },
      success: { color: theme.colors?.success || '#34C759' },
      warning: { color: theme.colors?.warning || '#FF9500' },
      error: { color: theme.colors?.error || '#FF3B30' },
      custom: { color: customColor || (theme.colors?.text || '#1C1C1E') },
    };

    // Weight overrides (if specified)
    const weightOverride = weight !== 'normal' ? {
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      }[weight] as TextStyle['fontWeight'],
    } : {};

    // Alignment
    const alignStyle = align !== 'left' ? { textAlign: align as TextStyle['textAlign'] } : {};

    return {
      ...variantStyles[variant],
      ...colorStyles[color],
      ...weightOverride,
      ...alignStyle,
    };
  };

  return (
    <Text 
      style={[getTextStyle(), style]} 
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
};