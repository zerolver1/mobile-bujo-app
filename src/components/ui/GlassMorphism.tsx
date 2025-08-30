import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../theme';

export interface GlassMorphismProps {
  children: React.ReactNode;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  borderRadius?: number;
  border?: boolean;
  style?: ViewStyle;
}

export const GlassMorphism: React.FC<GlassMorphismProps> = ({
  children,
  intensity = 20,
  tint = 'default',
  borderRadius = 12,
  border = true,
  style,
}) => {
  const { theme } = useTheme();

  const getGlassStyle = () => {
    // Safety check for theme
    if (!theme) {
      return {
        borderRadius,
        overflow: 'hidden' as const,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderWidth: border ? 1 : 0,
        borderColor: border ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
        backdropFilter: 'blur(20px)',
      };
    }

    const borderColor = theme.isDark 
      ? 'rgba(255, 255, 255, 0.1)' 
      : 'rgba(0, 0, 0, 0.1)';

    return {
      borderRadius,
      overflow: 'hidden' as const,
      backgroundColor: theme.isDark 
        ? 'rgba(255, 255, 255, 0.05)' 
        : 'rgba(255, 255, 255, 0.8)',
      borderWidth: border ? 1 : 0,
      borderColor: border ? borderColor : 'transparent',
      backdropFilter: 'blur(20px)', // For web
    };
  };

  const getBlurTint = () => {
    if (tint === 'default') {
      return theme.isDark ? 'dark' : 'light';
    }
    return tint;
  };

  return (
    <View style={[getGlassStyle(), style]}>
      <BlurView 
        intensity={intensity}
        tint={getBlurTint()}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

export interface GlassCardProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  padding = 'md',
  style,
}) => {
  const { theme } = useTheme();

  const getPaddingStyle = () => {
    // Safety check for theme
    if (!theme?.spacing) {
      const fallbackPadding = { none: 0, sm: 8, md: 12, lg: 16 };
      return { padding: fallbackPadding[padding] };
    }

    const paddingValues = {
      none: 0,
      sm: 8,  // theme.spacing.md equivalent
      md: 12, // theme.spacing.lg equivalent
      lg: 16, // theme.spacing.xl equivalent
    };

    return {
      padding: paddingValues[padding],
    };
  };

  return (
    <GlassMorphism 
      style={[getPaddingStyle(), style]}
      borderRadius={theme?.borderRadius?.lg || 12}
    >
      {children}
    </GlassMorphism>
  );
};

export interface FloatingGlassProps {
  children: React.ReactNode;
  elevation?: 'low' | 'medium' | 'high';
  style?: ViewStyle;
}

export const FloatingGlass: React.FC<FloatingGlassProps> = ({
  children,
  elevation = 'medium',
  style,
}) => {
  const { theme } = useTheme();

  const getShadowStyle = () => {
    // Safety check for theme
    if (!theme?.shadow) {
      return {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      };
    }

    const shadows = {
      low: theme.shadow.sm,
      medium: theme.shadow.md,
      high: theme.shadow.lg,
    };

    return shadows[elevation];
  };

  return (
    <View style={[getShadowStyle(), style]}>
      <GlassMorphism 
        intensity={30}
        borderRadius={theme?.borderRadius?.xl || 16}
        border={true}
      >
        {children}
      </GlassMorphism>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    zIndex: 1,
  },
});