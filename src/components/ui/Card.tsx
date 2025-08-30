import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  padding = 'md',
  style,
}) => {
  const { theme } = useTheme();

  const getCardStyle = () => {
    // Safety check for theme - use paper colors as fallback
    if (!theme?.colors || !theme?.shadow || !theme?.borderRadius) {
      return {
        borderRadius: 12,
        backgroundColor: '#F5F2E8', // Parchment fallback instead of white
        padding: 12,
        shadowColor: 'rgba(139, 69, 19, 0.1)', // Warm paper shadow
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
      };
    }

    const baseStyle = {
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colors.surface,
    };

    // Padding variations using Apple's 4pt grid
    const paddingStyles = {
      none: {},
      sm: { padding: 8 },  // theme.spacing.md equivalent
      md: { padding: 12 }, // theme.spacing.lg equivalent  
      lg: { padding: 16 }, // theme.spacing.xl equivalent
    };

    // Variant styles with paper-like feel
    const variantStyles = {
      elevated: {
        ...theme.shadow.sm,
        // Warm paper-like shadow
        shadowColor: theme.isDark ? '#000000' : 'rgba(139, 69, 19, 0.08)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme.isDark ? 0.25 : 0.1,
        shadowRadius: 3,
        elevation: 2,
      },
      outlined: {
        borderWidth: 0.5,
        borderColor: theme.colors.border,
        ...theme.shadow.none,
        // Very subtle paper texture
        backgroundColor: theme.isDark 
          ? theme.colors.surface 
          : `${theme.colors.surface}F8`, // Slightly more opaque
      },
      flat: {
        ...theme.shadow.none,
        backgroundColor: 'transparent', // Let the paper background show through
      },
    };

    return {
      ...baseStyle,
      ...paddingStyles[padding],
      ...variantStyles[variant],
    };
  };

  return (
    <View style={[getCardStyle(), style]}>
      {children}
    </View>
  );
};

export interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, style }) => {
  const { theme } = useTheme();

  return (
    <View style={[{ paddingBottom: theme?.spacing?.md || 8 }, style]}>
      {children}
    </View>
  );
};

export interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CardContent: React.FC<CardContentProps> = ({ children, style }) => (
  <View style={style}>
    {children}
  </View>
);

export interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, style }) => {
  const { theme } = useTheme();

  return (
    <View style={[{ paddingTop: theme?.spacing?.md || 8 }, style]}>
      {children}
    </View>
  );
};