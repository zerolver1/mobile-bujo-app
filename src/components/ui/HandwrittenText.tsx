import React from 'react';
import { Text, StyleSheet, TextStyle, Platform } from 'react-native';
import { useTheme } from '../../theme';

export interface HandwrittenTextProps {
  children: React.ReactNode;
  variant?: 'title' | 'body' | 'note' | 'quote';
  color?: 'ink' | 'pencil' | 'blue' | 'red';
  style?: TextStyle;
}

export const HandwrittenText: React.FC<HandwrittenTextProps> = ({
  children,
  variant = 'body',
  color = 'ink',
  style,
}) => {
  const { theme } = useTheme();

  const getTextStyle = () => {
    // Safety check for theme
    if (!theme?.colors) {
      return {
        fontFamily: Platform.select({
          ios: 'Bradley Hand',
          android: 'cursive',
          default: 'System',
        }),
        fontSize: 17,
        fontWeight: '400' as const,
        letterSpacing: 0.2,
        lineHeight: 26,
        color: '#2B2B2B',
      };
    }

    // Base handwritten style
    const baseStyle = {
      fontFamily: Platform.select({
        ios: 'Bradley Hand',
        android: 'cursive',
        default: 'System',
      }),
    };

    // Variant styles for different handwriting types
    const variantStyles = {
      title: {
        fontSize: 24,
        fontWeight: '600' as const,
        letterSpacing: 0.5,
        lineHeight: 32,
        textDecorationLine: 'underline' as const,
        textDecorationStyle: 'solid' as const,
      },
      body: {
        fontSize: 17,
        fontWeight: '400' as const,
        letterSpacing: 0.2,
        lineHeight: 26,
      },
      note: {
        fontSize: 15,
        fontWeight: '300' as const,
        letterSpacing: 0.3,
        lineHeight: 22,
        fontStyle: 'italic',
      },
      quote: {
        fontSize: 19,
        fontWeight: '500' as const,
        letterSpacing: 0.4,
        lineHeight: 28,
        fontStyle: 'italic',
        paddingHorizontal: 12, // theme.spacing.lg equivalent
      },
    };

    // Color styles (ink colors)
    const colorStyles = {
      ink: { 
        color: theme.isDark ? theme.colors.text : '#2B2B2B',
      },
      pencil: { 
        color: theme.isDark ? '#8B8A85' : '#6B6B6B',
        opacity: 0.9,
      },
      blue: { 
        color: theme.isDark ? '#7A94C4' : '#2B4C8C',
      },
      red: { 
        color: theme.isDark ? '#C47A76' : '#B85450',
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
      ...colorStyles[color],
    };
  };

  return (
    <Text style={[getTextStyle(), style]}>
      {children}
    </Text>
  );
};