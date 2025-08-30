import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, Pressable } from 'react-native';
import { useTheme } from '../../theme';

export interface ModernCardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'glass' | 'outline' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const ModernCard: React.FC<ModernCardProps> = ({
  children,
  variant = 'elevated',
  padding = 'lg',
  interactive = false,
  onPress,
  style,
}) => {
  const { theme } = useTheme();

  const getCardStyle = () => {
    const baseStyle = {
      borderRadius: theme.borderRadius.lg,
      overflow: 'hidden' as const,
    };

    // Padding styles using Apple's 4pt grid
    const paddingStyles = {
      none: {},
      sm: { padding: 8 },
      md: { padding: 12 },
      lg: { padding: 16 },
      xl: { padding: 20 },
    };

    // Variant styles
    const variantStyles = {
      elevated: {
        backgroundColor: theme.colors.surface,
        ...theme.shadow.md,
        borderWidth: 0,
      },
      glass: {
        backgroundColor: theme.isDark 
          ? 'rgba(255, 255, 255, 0.05)' 
          : 'rgba(255, 255, 255, 0.7)',
        borderWidth: 1,
        borderColor: theme.isDark 
          ? 'rgba(255, 255, 255, 0.1)' 
          : 'rgba(0, 0, 0, 0.05)',
        ...theme.shadow.sm,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      filled: {
        backgroundColor: theme.colors.backgroundSecondary,
        borderWidth: 0,
      },
    };

    // Interactive styles
    const interactiveStyle = interactive || onPress ? {
      transform: [{ scale: 1 }],
    } : {};

    return {
      ...baseStyle,
      ...variantStyles[variant],
      ...paddingStyles[padding],
      ...interactiveStyle,
    };
  };

  const CardWrapper = interactive || onPress ? Pressable : View;

  return (
    <CardWrapper
      style={({ pressed }: { pressed?: boolean } = {}) => [
        getCardStyle(),
        (interactive || onPress) && pressed && {
          transform: [{ scale: 0.98 }],
          opacity: 0.9,
        },
        style,
      ]}
      onPress={onPress}
    >
      {children}
    </CardWrapper>
  );
};

export interface ModernCardHeaderProps {
  children: React.ReactNode;
  divider?: boolean;
  style?: ViewStyle;
}

export const ModernCardHeader: React.FC<ModernCardHeaderProps> = ({ 
  children, 
  divider = true, 
  style 
}) => {
  const { theme } = useTheme();

  return (
    <View style={[
      styles.header,
      { 
        paddingBottom: 12,
        marginBottom: divider ? 12 : 0,
        borderBottomWidth: divider ? 1 : 0,
        borderBottomColor: theme.colors.border,
      }, 
      style
    ]}>
      {children}
    </View>
  );
};

export interface ModernCardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const ModernCardContent: React.FC<ModernCardContentProps> = ({ 
  children, 
  style 
}) => (
  <View style={[styles.content, style]}>
    {children}
  </View>
);

export interface ModernCardFooterProps {
  children: React.ReactNode;
  divider?: boolean;
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  style?: ViewStyle;
}

export const ModernCardFooter: React.FC<ModernCardFooterProps> = ({ 
  children, 
  divider = true,
  justify = 'flex-end',
  style 
}) => {
  const { theme } = useTheme();

  return (
    <View style={[
      styles.footer,
      { 
        paddingTop: 12,
        marginTop: divider ? 12 : 0,
        borderTopWidth: divider ? 1 : 0,
        borderTopColor: theme.colors.border,
        justifyContent: justify,
      }, 
      style
    ]}>
      {children}
    </View>
  );
};

// Specialized card variants
export interface FeatureCardProps {
  children: React.ReactNode;
  accent?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  style?: ViewStyle;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  children,
  accent = 'primary',
  style,
}) => {
  const { theme } = useTheme();

  const getAccentColor = () => {
    const colors = {
      primary: theme.colors.primary,
      secondary: theme.colors.secondary,
      success: theme.colors.success,
      warning: theme.colors.warning,
      error: theme.colors.error,
    };
    return colors[accent];
  };

  return (
    <ModernCard
      variant="elevated"
      style={[
        {
          borderLeftWidth: 4,
          borderLeftColor: getAccentColor(),
        },
        style,
      ]}
    >
      {children}
    </ModernCard>
  );
};

const styles = StyleSheet.create({
  header: {
    // Header styles
  },
  content: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});