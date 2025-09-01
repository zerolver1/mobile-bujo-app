import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  helperText?: string;
  errorText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  variant?: 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  errorText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = 'outlined',
  size = 'md',
  disabled = false,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...textInputProps
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const hasError = !!errorText;

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const getContainerStyle = () => {
    const baseStyle = {
      borderRadius: theme.borderRadius?.lg || 12,
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
        paddingHorizontal: 12,
        paddingVertical: 12,
        minHeight: 52,
      },
    };

    // Variant styles
    const variantStyles = {
      outlined: {
        backgroundColor: theme.colors?.surface || '#F5F2E8',
        borderWidth: 1,
        borderColor: hasError 
          ? (theme.colors?.error || '#FF3B30') 
          : isFocused 
            ? (theme.colors?.primary || '#007AFF') 
            : (theme.colors?.border || '#E8E3D5'),
      },
      filled: {
        backgroundColor: theme.colors?.backgroundSecondary || '#F0EDE5',
        borderWidth: 0,
      },
    };

    // Disabled style
    const disabledStyle = disabled ? {
      backgroundColor: theme.colors?.backgroundSecondary || '#F0EDE5',
      opacity: 0.6,
    } : {};

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...disabledStyle,
    };
  };

  const getInputStyle = () => {
    const baseStyle = {
      flex: 1,
      ...(theme.typography?.textStyles?.body || { fontSize: 17, lineHeight: 22 }),
      color: theme.colors?.text || '#1C1C1E',
    };

    // Size variations using Apple typography
    const sizeStyles = {
      sm: theme.typography?.textStyles?.subheadline || { fontSize: 15, lineHeight: 20 },
      md: theme.typography?.textStyles?.body || { fontSize: 17, lineHeight: 22 },
      lg: theme.typography?.textStyles?.headline || { fontSize: 20, lineHeight: 24, fontWeight: '600' },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      color: theme.colors?.text || '#1C1C1E', // Ensure text color is maintained
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
    if (hasError) return theme.colors?.error || '#FF3B30';
    if (isFocused) return theme.colors?.primary || '#007AFF';
    return theme.colors?.textSecondary || '#8E8E93';
  };

  return (
    <View style={containerStyle}>
      {label && (
        <Text style={[styles.label, { 
          ...(theme.typography?.textStyles?.footnote || { fontSize: 13, lineHeight: 16 }),
          color: hasError ? (theme.colors?.error || '#FF3B30') : (theme.colors?.textSecondary || '#8E8E93'),
          marginBottom: 2,
        }]}>
          {label}
        </Text>
      )}
      
      <View style={[styles.inputContainer, getContainerStyle()]}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={getIconSize()}
            color={getIconColor()}
            style={{ marginRight: 4 }}
          />
        )}
        
        <TextInput
          style={[getInputStyle(), inputStyle]}
          placeholderTextColor={theme.colors?.textTertiary || '#C7C7CC'}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...textInputProps}
        />
        
        {rightIcon && (
          <Ionicons
            name={rightIcon}
            size={getIconSize()}
            color={getIconColor()}
            style={{ marginLeft: 4 }}
            onPress={onRightIconPress}
          />
        )}
      </View>
      
      {(helperText || errorText) && (
        <Text style={[styles.helperText, { 
          ...(theme.typography?.textStyles?.caption2 || { fontSize: 11, lineHeight: 13 }),
          color: hasError ? (theme.colors?.error || '#FF3B30') : (theme.colors?.textSecondary || '#8E8E93'),
          marginTop: 2,
        }]}>
          {errorText || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontWeight: '500',
  },
  helperText: {
    fontWeight: '400',
  },
});