import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { Typography } from './paperComponents';
import { PAPER_DESIGN_TOKENS } from '../../theme/paperDesignTokens';
import { safeThemeAccess } from '../../theme/paperStyleUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface PaperLoadingProps {
  type?: 'ink-spreading' | 'page-flip' | 'writing' | 'scanning';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PaperLoading: React.FC<PaperLoadingProps> = ({
  type = 'ink-spreading',
  message = 'Loading...',
  size = 'md',
}) => {
  const { theme } = useTheme();
  const animationValue = useSharedValue(0);

  useEffect(() => {
    if (type === 'ink-spreading') {
      animationValue.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.out(Easing.ease) }),
        -1,
        true
      );
    } else if (type === 'page-flip') {
      animationValue.value = withRepeat(
        withSpring(1, { stiffness: 100, damping: 15 }),
        -1,
        true
      );
    } else if (type === 'writing') {
      animationValue.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.linear }),
        -1,
        false
      );
    } else if (type === 'scanning') {
      animationValue.value = withRepeat(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [type]);

  const getSizeMultiplier = () => {
    switch (size) {
      case 'sm': return 0.7;
      case 'lg': return 1.3;
      default: return 1;
    }
  };

  const sizeMultiplier = getSizeMultiplier();

  // Ink Spreading Animation - like ink spreading on paper
  const inkSpreadingStyles = useAnimatedStyle(() => {
    const scale = interpolate(animationValue.value, [0, 1], [0.3, 1.2]);
    const opacity = interpolate(animationValue.value, [0, 0.6, 1], [0.8, 0.3, 0]);
    
    return {
      transform: [{ scale: scale * sizeMultiplier }],
      opacity,
    };
  });

  // Page Flip Animation - like pages turning
  const pageFlipStyles = useAnimatedStyle(() => {
    const rotateY = interpolate(animationValue.value, [0, 1], [0, 180]);
    const scale = interpolate(animationValue.value, [0, 0.5, 1], [1, 0.8, 1]);
    
    return {
      transform: [
        { rotateY: `${rotateY}deg` },
        { scale: scale * sizeMultiplier }
      ],
    };
  });

  // Writing Animation - like pen moving across paper
  const writingStyles = useAnimatedStyle(() => {
    const translateX = interpolate(
      animationValue.value, 
      [0, 1], 
      [-100 * sizeMultiplier, 100 * sizeMultiplier]
    );
    const opacity = interpolate(animationValue.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
    
    return {
      transform: [{ translateX }],
      opacity,
    };
  });

  // Scanning Animation - like light scanning across page
  const scanningStyles = useAnimatedStyle(() => {
    const translateY = interpolate(
      animationValue.value,
      [0, 1],
      [-50 * sizeMultiplier, 50 * sizeMultiplier]
    );
    
    return {
      transform: [{ translateY }],
    };
  });

  const renderAnimation = () => {
    const baseSize = 40 * sizeMultiplier;
    const primaryColor = safeThemeAccess(theme, t => t.colors.primary, '#0F2A44');
    
    switch (type) {
      case 'ink-spreading':
        return (
          <View style={[styles.animationContainer, { height: baseSize * 2, width: baseSize * 2 }]}>
            {[0, 1, 2].map((index) => (
              <Animated.View
                key={index}
                style={[
                  styles.inkDrop,
                  {
                    width: baseSize,
                    height: baseSize,
                    backgroundColor: primaryColor,
                  },
                  inkSpreadingStyles,
                  {
                    animationDelay: index * 200,
                  }
                ]}
              />
            ))}
          </View>
        );
        
      case 'page-flip':
        return (
          <View style={[styles.animationContainer, { height: baseSize, width: baseSize }]}>
            <Animated.View
              style={[
                styles.page,
                {
                  width: baseSize,
                  height: baseSize,
                  backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#F5F2E8'),
                  borderColor: primaryColor,
                },
                pageFlipStyles
              ]}
            />
          </View>
        );
        
      case 'writing':
        return (
          <View style={[styles.writingContainer, { height: baseSize / 2, width: baseSize * 4 }]}>
            <View style={[styles.paperLine, { backgroundColor: primaryColor + '20' }]} />
            <Animated.View
              style={[
                styles.penDot,
                {
                  width: 4 * sizeMultiplier,
                  height: 4 * sizeMultiplier,
                  backgroundColor: primaryColor,
                },
                writingStyles
              ]}
            />
          </View>
        );
        
      case 'scanning':
        return (
          <View style={[styles.scanningContainer, { height: baseSize * 2, width: baseSize * 1.5 }]}>
            <View style={[styles.scanningPage, { 
              backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#F5F2E8'),
              borderColor: primaryColor,
            }]} />
            <Animated.View
              style={[
                styles.scanningLine,
                {
                  backgroundColor: primaryColor + '60',
                },
                scanningStyles
              ]}
            />
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderAnimation()}
      {message && (
        <Typography 
          variant="caption1" 
          style={[
            styles.message,
            { color: safeThemeAccess(theme, t => t.colors.textSecondary, '#6B7280') }
          ]}
        >
          {message}
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: PAPER_DESIGN_TOKENS.spacing.xl,
  },
  
  // Animation containers
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  writingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  scanningContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  
  // Ink spreading
  inkDrop: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.6,
  },
  
  // Page flip
  page: {
    borderRadius: 4,
    borderWidth: 1,
    // Paper-like shadow
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Writing
  paperLine: {
    width: '100%',
    height: 1,
    position: 'absolute',
  },
  penDot: {
    borderRadius: 2,
    position: 'absolute',
  },
  
  // Scanning
  scanningPage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    borderWidth: 1,
    position: 'absolute',
  },
  scanningLine: {
    width: '100%',
    height: 2,
    position: 'absolute',
  },
  
  // Message
  message: {
    marginTop: PAPER_DESIGN_TOKENS.spacing.xl,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});

export default PaperLoading;