import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

export interface PaperButtonProps {
  title?: string;
  onPress: () => void;
  variant?: 'ink' | 'pencil' | 'highlight' | 'sticky';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: any;
}

export const PaperButton: React.FC<PaperButtonProps> = ({
  title,
  onPress,
  variant = 'ink',
  size = 'md',
  disabled = false,
  icon,
  style,
}) => {
  const { theme } = useTheme();

  const getButtonStyle = () => {
    // Safety check for theme
    if (!theme?.colors || !theme?.shadow) {
      const fallbackStyles = {
        ink: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#000000' },
        pencil: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#666666' },
        highlight: { backgroundColor: 'rgba(254, 240, 138, 0.6)', borderWidth: 0 },
        sticky: { backgroundColor: '#FEF3C7', borderWidth: 0 },
      };
      
      return {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        borderRadius: 2,
        paddingHorizontal: 12,
        paddingVertical: 8,
        minHeight: 40,
        ...fallbackStyles[variant],
      };
    }

    const baseStyle = {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: 2,
    };

    // Size variations using Apple's 4pt grid
    const sizeStyles = {
      sm: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        minHeight: 32,
      },
      md: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        minHeight: 40,
      },
      lg: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 48,
      },
    };

    // Variant styles (authentic paper textures)
    const variantStyles = {
      ink: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: theme.colors.text,
        borderStyle: 'solid' as const,
        // Slight pen ink bleeding effect
        ...theme.shadow.none,
      },
      pencil: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.textSecondary,
        borderStyle: 'dashed' as const,
        // Softer, more organic look
        borderRadius: 3,
      },
      highlight: {
        backgroundColor: theme.isDark 
          ? 'rgba(251, 191, 36, 0.25)'  // More visible yellow highlighter on dark paper
          : 'rgba(254, 240, 138, 0.6)', // More visible yellow highlighter on light paper
        borderWidth: 0,
        borderRadius: 4,
        // Highlighter has uneven edges
        transform: [{ skewX: '-0.5deg' }],
      },
      sticky: {
        backgroundColor: theme.isDark 
          ? 'rgba(217, 119, 6, 0.2)'  // Warm sticky note on dark paper
          : '#FEF3C7',                // Classic sticky note yellow
        borderWidth: 0,
        borderRadius: 2,
        ...theme.shadow.sm,
        // Sticky notes are slightly tilted and have soft shadows
        transform: [{ rotate: '-1.2deg' }],
      },
    };

    // Disabled state
    const disabledStyle = disabled ? {
      opacity: 0.4,
    } : {};

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...disabledStyle,
    };
  };

  const getTextStyle = () => {
    // Safety check for theme
    if (!theme?.colors) {
      return {
        fontFamily: Platform.select({
          ios: 'Georgia',
          android: 'serif',
          default: 'System',
        }),
        textAlign: 'center' as const,
        fontSize: 16,
        letterSpacing: 0.4,
        color: '#000000',
        fontWeight: '600' as const,
      };
    }

    const baseStyle = {
      fontFamily: Platform.select({
        ios: 'Georgia',
        android: 'serif',
        default: 'System',
      }),
      textAlign: 'center' as const,
    };

    // Size variations
    const sizeStyles = {
      sm: { 
        fontSize: 14,
        letterSpacing: 0.3,
      },
      md: { 
        fontSize: 16,
        letterSpacing: 0.4,
      },
      lg: { 
        fontSize: 18,
        letterSpacing: 0.5,
      },
    };

    // Variant text colors (ink-like)
    const variantStyles = {
      ink: { 
        color: theme.colors.text,
        fontWeight: '600' as const,
        // Slight text shadow to simulate ink depth
        textShadowColor: theme.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 0.5, height: 0.5 },
        textShadowRadius: 0.5,
      },
      pencil: { 
        color: theme.colors.textSecondary,
        fontWeight: '400' as const,
        // Softer, graphite-like appearance
        opacity: 0.9,
      },
      highlight: { 
        color: theme.isDark ? theme.colors.text : '#92400E', // Dark brown on highlighted background
        fontWeight: '600' as const,
        // Text appears darker when highlighted
      },
      sticky: { 
        color: theme.isDark ? '#F3F4F6' : '#92400E', // Dark brown on yellow sticky
        fontWeight: '500' as const,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getIconSize = () => {
    const sizes = {
      sm: 14,
      md: 16,
      lg: 18,
    };
    return sizes[size];
  };

  const getIconColor = () => {
    // Safety check for theme
    if (!theme?.colors) {
      return '#000000';
    }

    const colors = {
      ink: theme.colors.text,
      pencil: theme.colors.textSecondary,
      highlight: theme.colors.text,
      sticky: theme.isDark ? '#E8E6E1' : '#5A5A5A',
    };
    return colors[variant];
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={getIconSize()}
          color={getIconColor()}
          style={{ marginRight: title ? 4 : 0 }}
        />
      )}
      {title && (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};