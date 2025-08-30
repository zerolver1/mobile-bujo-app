import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

export interface ButtonProps {
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: any;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
}) => {
  const { theme } = useTheme();

  const getButtonStyle = () => {
    const baseStyle = {
      ...styles.button,
      borderRadius: theme.borderRadius.lg,
    };

    // Size variations using Apple's 4pt grid
    const sizeStyles = {
      sm: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        minHeight: 36,
      },
      md: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        minHeight: 44,
      },
      lg: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 52,
      },
    };

    // Variant styles
    const variantStyles = {
      primary: {
        backgroundColor: theme.colors.primary,
        ...theme.shadow.sm,
      },
      secondary: {
        backgroundColor: theme.colors.secondary,
        ...theme.shadow.sm,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
      destructive: {
        backgroundColor: theme.colors.error,
        ...theme.shadow.sm,
      },
    };

    // Disabled state
    const disabledStyle = disabled ? {
      opacity: 0.5,
      ...theme.shadow.none,
    } : {};

    // Full width
    const fullWidthStyle = fullWidth ? { alignSelf: 'stretch' } : {};

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...disabledStyle,
      ...fullWidthStyle,
    };
  };

  const getTextStyle = () => {
    const baseStyle = {
      ...theme.typography.textStyles.body,
      fontWeight: '600',
      textAlign: 'center' as const,
    };

    // Size variations using Apple typography
    const sizeStyles = {
      sm: theme.typography.textStyles.subheadline,
      md: theme.typography.textStyles.body,
      lg: theme.typography.textStyles.headline,
    };

    // Variant text colors
    const variantStyles = {
      primary: { color: '#FFFFFF' },
      secondary: { color: '#FFFFFF' },
      outline: { color: theme.colors.text },
      ghost: { color: theme.colors.primary },
      destructive: { color: '#FFFFFF' },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getIconSize = () => {
    const sizes = {
      sm: 16,
      md: 18,
      lg: 20,
    };
    return sizes[size];
  };

  const getIconColor = () => {
    const colors = {
      primary: '#FFFFFF',
      secondary: '#FFFFFF',
      outline: theme.colors.text,
      ghost: theme.colors.primary,
      destructive: '#FFFFFF',
    };
    return colors[variant];
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : '#FFFFFF'}
          size="small"
        />
      );
    }

    const iconElement = icon && (
      <Ionicons
        name={icon}
        size={getIconSize()}
        color={getIconColor()}
        style={[
          iconPosition === 'right' ? { marginLeft: 4 } : { marginRight: 4 },
          !title && { margin: 0 },
        ]}
      />
    );

    const textElement = title && (
      <Text style={getTextStyle()}>{title}</Text>
    );

    if (!title) {
      return iconElement;
    }

    return (
      <View style={styles.content}>
        {iconPosition === 'left' && iconElement}
        {textElement}
        {iconPosition === 'right' && iconElement}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});