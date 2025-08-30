import React, { useRef } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, springPresets, easings } from '../../theme';

export type AppleButtonRole = 'primary' | 'secondary' | 'destructive' | 'cancel';
export type AppleButtonSize = 'small' | 'regular' | 'large';
export type AppleButtonState = 'idle' | 'highlighted' | 'selected' | 'disabled' | 'loading';

export interface AppleButtonProps {
  title?: string;
  onPress: () => void;
  role?: AppleButtonRole;
  size?: AppleButtonSize;
  disabled?: boolean;
  loading?: boolean;
  selected?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'leading' | 'trailing';
  fullWidth?: boolean;
  hapticFeedback?: boolean;
  style?: any;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AppleButton: React.FC<AppleButtonProps> = ({
  title,
  onPress,
  role = 'primary',
  size = 'regular',
  disabled = false,
  loading = false,
  selected = false,
  icon,
  iconPosition = 'leading',
  fullWidth = false,
  hapticFeedback = true,
  style,
}) => {
  const { theme } = useTheme();
  
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const backgroundOpacity = useSharedValue(role === 'primary' || role === 'destructive' ? 1 : 0);
  
  // Get current button state
  const getButtonState = (): AppleButtonState => {
    if (loading) return 'loading';
    if (disabled) return 'disabled';
    if (selected) return 'selected';
    return 'idle';
  };

  const currentState = getButtonState();

  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: theme.borderRadius.lg,
      overflow: 'hidden' as const,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      flexDirection: 'row' as const,
    };

    // Size variations (Apple's precise measurements)
    const sizeStyles = {
      small: {
        minHeight: 30,
        paddingHorizontal: 12, // 12pt
        paddingVertical: 4, // 4pt
      },
      regular: {
        minHeight: 44, // Apple's minimum touch target
        paddingHorizontal: 16, // 16pt
        paddingVertical: 8, // 8pt
      },
      large: {
        minHeight: 50,
        paddingHorizontal: 20, // 20pt
        paddingVertical: 12, // 12pt
      },
    };

    // Safety check for theme
    if (!theme?.colors || !theme?.borderRadius) {
      return {
        minHeight: 44,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#007AFF',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
      };
    }

    // Role-based styling (Apple's system button roles)
    const roleStyles = {
      primary: {
        backgroundColor: theme.colors.primary,
      },
      secondary: {
        backgroundColor: theme.colors.backgroundSecondary,
      },
      destructive: {
        backgroundColor: theme.colors.error,
      },
      cancel: {
        backgroundColor: 'transparent',
      },
    };

    // State-based modifications
    const stateModifications = {
      idle: {},
      highlighted: {
        // Applied via animation
      },
      selected: {
        backgroundColor: theme.isDark 
          ? theme.colors.backgroundTertiary 
          : theme.colors.backgroundSecondary,
      },
      disabled: {
        opacity: 0.3,
      },
      loading: {
        // Loading spinner will be shown
      },
    };

    // Full width style
    const fullWidthStyle = fullWidth ? { alignSelf: 'stretch' as const } : {};

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...roleStyles[role],
      ...stateModifications[currentState],
      ...fullWidthStyle,
    };
  };

  const getTextStyle = () => {
    // Use Apple's precise text styles
    const textStyle = size === 'small' 
      ? theme.typography.textStyles.footnote 
      : size === 'large'
        ? theme.typography.textStyles.headline
        : theme.typography.textStyles.body;

    const roleColors = {
      primary: '#FFFFFF',
      secondary: theme.colors.text,
      destructive: '#FFFFFF', 
      cancel: theme.colors.primary,
    };

    return {
      ...textStyle,
      color: roleColors[role],
      textAlign: 'center' as const,
    };
  };

  const getIconSize = () => {
    const sizes = {
      small: 16,
      regular: 18,
      large: 20,
    };
    return sizes[size];
  };

  const getIconColor = () => {
    const roleColors = {
      primary: '#FFFFFF',
      secondary: theme.colors.text,
      destructive: '#FFFFFF',
      cancel: theme.colors.primary,
    };
    return roleColors[role];
  };

  // Apple-style interaction handlers
  const handlePressIn = () => {
    'worklet';
    if (disabled || loading) return;
    
    // Apple's standard button press animation
    scale.value = withSpring(0.96, springPresets.snappy);
    
    if (role === 'secondary' || role === 'cancel') {
      backgroundOpacity.value = withTiming(0.1, { duration: 100 });
    } else {
      opacity.value = withTiming(0.8, { duration: 100 });
    }
    
    // Haptic feedback would go here
    if (hapticFeedback) {
      // runOnJS(() => Haptics.selectionAsync())();
    }
  };

  const handlePressOut = () => {
    'worklet';
    if (disabled || loading) return;
    
    // Return to normal state with Apple's standard timing
    scale.value = withSpring(1.0, springPresets.smooth);
    opacity.value = withTiming(1.0, { duration: 150 });
    backgroundOpacity.value = withTiming(
      role === 'primary' || role === 'destructive' ? 1 : 0,
      { duration: 150 }
    );
  };

  const handlePress = () => {
    if (disabled || loading) return;
    
    // Impact haptic feedback
    if (hapticFeedback) {
      // runOnJS(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light))();
    }
    
    onPress();
  };

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingSpinner, { borderTopColor: getIconColor() }]} />
          {title && (
            <Text style={[getTextStyle(), { marginLeft: 8 }]}>
              {title}
            </Text>
          )}
        </View>
      );
    }

    const iconElement = icon && (
      <Ionicons
        name={icon}
        size={getIconSize()}
        color={getIconColor()}
        style={[
          iconPosition === 'trailing' 
            ? { marginLeft: 4 } 
            : { marginRight: title ? 4 : 0 },
        ]}
      />
    );

    const textElement = title && (
      <Text style={getTextStyle()} numberOfLines={1}>
        {title}
      </Text>
    );

    return (
      <View style={styles.contentContainer}>
        {iconPosition === 'leading' && iconElement}
        {textElement}
        {iconPosition === 'trailing' && iconElement}
      </View>
    );
  };

  return (
    <AnimatedPressable
      style={[getButtonStyle(), animatedStyle, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      {/* Background overlay for secondary/cancel buttons */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: theme.colors.text,
            borderRadius: theme.borderRadius.lg,
          },
          backgroundAnimatedStyle,
        ]}
      />
      
      {/* Button content */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    zIndex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 8,
    // Would add rotation animation here
  },
});