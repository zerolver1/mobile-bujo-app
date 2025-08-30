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
      h1: theme.typography.textStyles.largeTitle,
      h2: theme.typography.textStyles.title1,
      h3: theme.typography.textStyles.title2,
      h4: theme.typography.textStyles.title3,
      body1: theme.typography.textStyles.body,
      body2: theme.typography.textStyles.callout,
      caption: theme.typography.textStyles.caption1,
      overline: {
        ...theme.typography.textStyles.caption2,
        textTransform: 'uppercase' as const,
        letterSpacing: 1.5,
      },
      mono: {
        ...theme.typography.textStyles.body,
        fontFamily: theme.typography.fontFamily.mono,
      },
    };

    // Color styles
    const colorStyles = {
      primary: { color: theme.colors.text },
      secondary: { color: theme.colors.textSecondary },
      tertiary: { color: theme.colors.textTertiary },
      disabled: { color: theme.colors.textDisabled },
      success: { color: theme.colors.success },
      warning: { color: theme.colors.warning },
      error: { color: theme.colors.error },
      custom: { color: customColor || theme.colors.text },
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