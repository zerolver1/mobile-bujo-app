import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDecay,
  runOnJS,
  clamp,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BuJoEntry } from '../types/BuJo';
import { BuJoEntryItem } from './BuJoEntryItem';
import {
  getSwipeConfig,
  getCurrentAction,
  SWIPE_THRESHOLDS,
  SwipeAction,
} from '../utils/swipeActions';
import { useTheme } from '../theme';
import { safeThemeAccess } from '../theme/paperStyleUtils';
import { haptic } from '../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SwipeableEntryItemProps {
  entry: BuJoEntry;
  onSwipeAction: (entry: BuJoEntry, action: { action: string; key: string }) => void;
  onPress: (entry: BuJoEntry, action: 'complete' | 'migrate' | 'schedule' | 'cancel' | 'edit') => void;
  showDate?: boolean;
  isCompact?: boolean;
}

// Industry-standard spring configuration based on research
const SPRING_CONFIG = {
  stiffness: 170,   // iOS/Android standard
  damping: 26,      // Smooth, not snappy
  mass: 1,          // Natural weight
} as const;

// Velocity threshold for natural gesture recognition  
const VELOCITY_THRESHOLD = 500;
const SWIPE_THRESHOLD = 40;

const SwipeableEntryItem: React.FC<SwipeableEntryItemProps> = ({
  entry,
  onSwipeAction,
  onPress,
  showDate = false,
  isCompact = false,
}) => {
  const { theme } = useTheme();
  
  // Modern Reanimated v3 shared values (run on UI thread)
  const translateX = useSharedValue(0);
  
  // Memoize swipe config for performance
  const swipeConfig = useMemo(() => getSwipeConfig(entry), [entry.type, entry.status]);

  // Helper functions for action arrays
  const getLeftActions = () => {
    const { leftShort, leftLong } = swipeConfig;
    const actions = [];
    if (leftShort) actions.push(leftShort);
    if (leftLong) actions.push(leftLong);
    return actions;
  };

  const getRightActions = () => {
    const { rightShort, rightLong } = swipeConfig;
    const actions = [];
    if (rightShort) actions.push(rightShort);
    if (rightLong) actions.push(rightLong);
    return actions;
  };

  // Modern Gesture.Pan() with industry-standard implementation
  const panGesture = Gesture.Pan()
    .onChange((event) => {
      'worklet';
      // Direct 1:1 translation (no artificial resistance) for natural feel
      const clampedTranslation = clamp(
        event.translationX,
        -SWIPE_THRESHOLDS.MAX,
        SWIPE_THRESHOLDS.MAX
      );
      
      translateX.value = clampedTranslation;
    })
    .onFinalize((event) => {
      'worklet';
      const { velocityX, translationX } = event;
      
      // Get actions synchronously within worklet
      const leftActionsCount = swipeConfig.leftShort ? (swipeConfig.leftLong ? 2 : 1) : 0;
      const rightActionsCount = swipeConfig.rightShort ? (swipeConfig.rightLong ? 2 : 1) : 0;
      
      // Smart velocity-based threshold (fast swipes need less distance)
      const velocityFactor = Math.abs(velocityX) > VELOCITY_THRESHOLD ? 0.7 : 1;
      const effectiveThreshold = SWIPE_THRESHOLD * velocityFactor;
      
      const leftSwipe = translationX > effectiveThreshold;
      const rightSwipe = translationX < -effectiveThreshold;
      
      if (leftSwipe && leftActionsCount > 0) {
        // Show left actions with smooth spring
        const targetX = leftActionsCount * 80;
        translateX.value = withSpring(targetX, SPRING_CONFIG);
        runOnJS(haptic.swipeAction)();
      } else if (rightSwipe && rightActionsCount > 0) {
        // Show right actions with smooth spring  
        const targetX = -(rightActionsCount * 80);
        translateX.value = withSpring(targetX, SPRING_CONFIG);
        runOnJS(haptic.swipeAction)();
      } else {
        // Use withDecay for natural velocity continuation, then spring back
        translateX.value = withDecay({
          velocity: velocityX,
          deceleration: 0.998,
          clamp: [-SWIPE_THRESHOLDS.MAX, SWIPE_THRESHOLDS.MAX],
        }, () => {
          // After decay, smoothly return to center
          translateX.value = withSpring(0, SPRING_CONFIG);
        });
      }
    });

  // Handle action button presses
  const handleActionPress = (action: SwipeAction) => {
    // Haptic feedback for action press
    haptic.buttonPress();
    
    // Smooth animation back to center using modern spring config
    translateX.value = withSpring(0, SPRING_CONFIG, () => {
      // Execute action after animation completes
      runOnJS(onSwipeAction)(entry, { action: action.action, key: action.key });
    });
  };

  // Modern useAnimatedStyle for smooth UI thread animations
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  }, []);

  const leftActionsStyle = useAnimatedStyle(() => {
    const isRevealed = translateX.value > 20;
    const opacity = isRevealed ? 1 : 0;
    return {
      opacity,
      transform: [{ scale: isRevealed ? 1 : 0.9 }],
    };
  }, []);

  const rightActionsStyle = useAnimatedStyle(() => {
    const isRevealed = translateX.value < -20;
    const opacity = isRevealed ? 1 : 0;
    return {
      opacity,
      transform: [{ scale: isRevealed ? 1 : 0.9 }],
    };
  }, []);

  const renderLeftActions = () => {
    const actions = getLeftActions();
    if (actions.length === 0) return null;
    
    return (
      <View style={[styles.actionsContainer, styles.leftActions]}>
        {actions.map((action, index) => (
          <View
            key={action.key}
            style={[
              styles.actionButton,
              { 
                backgroundColor: action.backgroundColor,
                left: index * 80,
              },
            ]}
          >
            <Pressable
              style={styles.actionPressable}
              onPress={() => handleActionPress(action)}
            >
              <Ionicons name={action.icon as any} size={20} color={action.color} />
              <Text style={[styles.actionText, { color: action.color }]}>
                {action.label}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    );
  };

  const renderRightActions = () => {
    const actions = getRightActions();
    if (actions.length === 0) return null;
    
    return (
      <View style={[styles.actionsContainer, styles.rightActions]}>
        {actions.map((action, index) => (
          <View
            key={action.key}
            style={[
              styles.actionButton,
              { 
                backgroundColor: action.backgroundColor,
                right: index * 80,
              },
            ]}
          >
            <Pressable
              style={styles.actionPressable}
              onPress={() => handleActionPress(action)}
            >
              <Ionicons name={action.icon as any} size={20} color={action.color} />
              <Text style={[styles.actionText, { color: action.color }]}>
                {action.label}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, {
      backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#F5F2E8')
    }]}>
      {/* Left Actions */}
      <Animated.View style={[styles.leftActions, leftActionsStyle]}>
        {renderLeftActions()}
      </Animated.View>
      
      {/* Right Actions */}
      <Animated.View style={[styles.rightActions, rightActionsStyle]}>
        {renderRightActions()}
      </Animated.View>
      
      {/* Main Content with Modern Gesture Detection */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.entryContainer,
            animatedStyle,
            {
              backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#F5F2E8')
            },
          ]}
        >
          <BuJoEntryItem
            entry={entry}
            onPress={onPress}
            showDate={showDate}
            isCompact={isCompact}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// Memoized export for performance optimization
const MemoizedSwipeableEntryItem = React.memo(SwipeableEntryItem);
export { MemoizedSwipeableEntryItem as SwipeableEntryItem };
export default MemoizedSwipeableEntryItem;

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 8,
    overflow: 'hidden',
  },
  entryContainer: {
    zIndex: 2,
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  leftActions: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 1,
  },
  rightActions: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 1,
  },
  actionButton: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  actionPressable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
});