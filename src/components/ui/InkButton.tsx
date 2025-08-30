import React, { useRef } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

export interface InkButtonProps {
  title?: string;
  onPress: () => void;
  variant?: 'filled' | 'outline' | 'ghost' | 'ink';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  haptic?: boolean;
  style?: any;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const InkButton: React.FC<InkButtonProps> = ({
  title,
  onPress,
  variant = 'filled',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  haptic = true,
  style,
}) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const inkScale = useSharedValue(0);
  const inkOpacity = useSharedValue(0);

  const getButtonStyle = () => {
    // Safety check for theme
    if (!theme?.colors || !theme?.borderRadius || !theme?.shadow) {
      return {
        borderRadius: 12,
        overflow: 'hidden' as const,
        position: 'relative' as const,
        paddingHorizontal: 12,
        paddingVertical: 8,
        minHeight: 44,
        backgroundColor: '#007AFF',
      };
    }

    const baseStyle = {
      borderRadius: theme.borderRadius.lg,
      overflow: 'hidden' as const,
      position: 'relative' as const,
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
      filled: {
        backgroundColor: theme.colors.primary,
        borderWidth: 0,
        ...theme.shadow.sm,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.colors.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
      ink: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadow.sm,
      },
    };

    // Disabled state
    const disabledStyle = disabled ? {
      opacity: 0.5,
      ...theme.shadow.none,
    } : {};

    // Full width
    const fullWidthStyle = fullWidth ? { alignSelf: 'stretch' as const } : {};

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...disabledStyle,
      ...fullWidthStyle,
    };
  };

  const getTextStyle = () => {
    // Safety check for theme
    if (!theme?.typography?.textStyles || !theme?.colors) {
      return {
        fontSize: 17,
        lineHeight: 22,
        fontWeight: '600' as const,
        textAlign: 'center' as const,
        color: '#FFFFFF',
      };
    }

    const baseStyle = {
      ...theme.typography.textStyles.body,
      fontWeight: '600' as const,
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
      filled: { color: '#FFFFFF' },
      outline: { color: theme.colors.primary },
      ghost: { color: theme.colors.primary },
      ink: { color: theme.colors.text },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getIconSize = () => {
    const sizes = { sm: 16, md: 18, lg: 20 };
    return sizes[size];
  };

  const getIconColor = () => {
    const colors = {
      filled: '#FFFFFF',
      outline: theme.colors.primary,
      ghost: theme.colors.primary,
      ink: theme.colors.text,
    };
    return colors[variant];
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 20, stiffness: 400 });
    inkScale.value = 0;
    inkOpacity.value = 0.2;
    inkScale.value = withTiming(2, { duration: 600 });
    inkOpacity.value = withTiming(0, { duration: 600 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 400 });
  };

  const handlePress = () => {
    if (disabled || loading) return;
    
    // Trigger haptic feedback if enabled
    if (haptic) {
      // Note: Would use Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) here
      // but keeping it simple for now
    }
    
    onPress();
  };

  // Animated styles
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const inkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: inkScale.value }],
    opacity: inkOpacity.value,
  }));

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.content}>
          <View style={[styles.loadingDot, { backgroundColor: getIconColor() }]} />
          <View style={[styles.loadingDot, { backgroundColor: getIconColor(), opacity: 0.7 }]} />
          <View style={[styles.loadingDot, { backgroundColor: getIconColor(), opacity: 0.5 }]} />
        </View>
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

    if (!title) return iconElement;

    return (
      <View style={styles.content}>
        {iconPosition === 'left' && iconElement}
        {textElement}
        {iconPosition === 'right' && iconElement}
      </View>
    );
  };

  const getInkColor = () => {
    switch (variant) {
      case 'filled':
        return 'rgba(255, 255, 255, 0.3)';
      case 'outline':
      case 'ghost':
        return `rgba(${theme.colors.primary.slice(1).match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ') || '0, 85, 204'}, 0.15)`;
      case 'ink':
        return theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
      default:
        return 'rgba(0, 0, 0, 0.1)';
    }
  };

  return (
    <AnimatedPressable
      style={[getButtonStyle(), buttonAnimatedStyle, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      {/* Ink spread effect */}
      <Animated.View
        style={[
          styles.inkSpread,
          inkAnimatedStyle,
          {
            backgroundColor: getInkColor(),
          },
        ]}
      />
      
      {/* Button content */}
      <View style={styles.contentWrapper}>
        {renderContent()}
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  inkSpread: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 20,
    height: 20,
    borderRadius: 10,
    marginTop: -10,
    marginLeft: -10,
  },
  loadingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  },
});