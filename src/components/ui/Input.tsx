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
        paddingHorizontal: 12,
        paddingVertical: 12,
        minHeight: 52,
      },
    };

    // Variant styles
    const variantStyles = {
      outlined: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: hasError 
          ? theme.colors.error 
          : isFocused 
            ? theme.colors.primary 
            : theme.colors.border,
      },
      filled: {
        backgroundColor: theme.colors.backgroundSecondary,
        borderWidth: 0,
      },
    };

    // Disabled style
    const disabledStyle = disabled ? {
      backgroundColor: theme.colors.backgroundSecondary,
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
      ...theme.typography.textStyles.body,
      color: theme.colors.text,
    };

    // Size variations using Apple typography
    const sizeStyles = {
      sm: theme.typography.textStyles.subheadline,
      md: theme.typography.textStyles.body,
      lg: theme.typography.textStyles.headline,
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      color: theme.colors.text, // Ensure text color is maintained
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
    if (hasError) return theme.colors.error;
    if (isFocused) return theme.colors.primary;
    return theme.colors.textSecondary;
  };

  return (
    <View style={containerStyle}>
      {label && (
        <Text style={[styles.label, { 
          ...theme.typography.textStyles.footnote,
          color: hasError ? theme.colors.error : theme.colors.textSecondary,
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
          placeholderTextColor={theme.colors.textTertiary}
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
          ...theme.typography.textStyles.caption2,
          color: hasError ? theme.colors.error : theme.colors.textSecondary,
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