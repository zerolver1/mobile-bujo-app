import React, { useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import {
  PanGestureHandler,
  State,
  PanGestureHandlerStateChangeEvent,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { BuJoEntry } from '../types/BuJo';
import { BuJoEntryItem } from './BuJoEntryItem';
import {
  getSwipeConfig,
  getCurrentAction,
  SWIPE_THRESHOLDS,
  SwipeAction,
} from '../utils/swipeActions';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SwipeableEntryItemProps {
  entry: BuJoEntry;
  onSwipeAction: (entry: BuJoEntry, action: SwipeAction) => void;
  onPress: (entry: BuJoEntry, action: 'complete' | 'migrate' | 'schedule' | 'cancel' | 'edit') => void;
  showDate?: boolean;
  isCompact?: boolean;
}

export const SwipeableEntryItem: React.FC<SwipeableEntryItemProps> = ({
  entry,
  onSwipeAction,
  onPress,
  showDate = false,
  isCompact = false,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const actionOpacity = useRef(new Animated.Value(0)).current;
  const currentAction = useRef<SwipeAction | null>(null);
  
  // Memoize swipe config to prevent unnecessary recalculations
  const swipeConfig = useMemo(() => getSwipeConfig(entry), [entry.type, entry.status]);
  
  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      translateX.stopAnimation();
      actionOpacity.stopAnimation();
    };
  }, [translateX, actionOpacity]);

  const handleGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    const { translationX } = event.nativeEvent;
    
    // Limit swipe distance
    const clampedTranslation = Math.max(
      -SWIPE_THRESHOLDS.MAX,
      Math.min(SWIPE_THRESHOLDS.MAX, translationX)
    );
    
    translateX.setValue(clampedTranslation);
    
    // Get current action and update opacity
    const action = getCurrentAction(clampedTranslation, swipeConfig);
    currentAction.current = action;
    
    if (action) {
      const threshold = action.threshold;
      const progress = Math.abs(clampedTranslation) / threshold;
      actionOpacity.setValue(Math.min(1, progress));
    } else {
      actionOpacity.setValue(0);
    }
  };

  const handleStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      
      // Check if we should trigger an action
      const action = getCurrentAction(translationX, swipeConfig);
      
      if (action && (Math.abs(translationX) >= action.threshold || Math.abs(velocityX) > 800)) {
        // Trigger the action
        onSwipeAction(entry, action);
        
        // Animate out and back
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: translationX > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        // Spring back to center
        Animated.spring(translateX, {
          toValue: 0,
          speed: 20,
          bounciness: 10,
          useNativeDriver: true,
        }).start();
      }
      
      // Reset opacity
      Animated.timing(actionOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      currentAction.current = null;
    }
  };

  const renderLeftActions = () => {
    const { leftShort, leftLong } = swipeConfig;
    
    return (
      <Animated.View 
        style={[
          styles.actionsContainer,
          styles.leftActions,
          {
            opacity: actionOpacity,
            transform: [
              {
                translateX: translateX.interpolate({
                  inputRange: [0, SWIPE_THRESHOLDS.MAX],
                  outputRange: [-100, 0],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}
      >
        {leftLong && (
          <Animated.View
            style={[
              styles.actionItem,
              { backgroundColor: leftLong.backgroundColor },
              {
                opacity: translateX.interpolate({
                  inputRange: [0, leftLong.threshold - 20, leftLong.threshold],
                  outputRange: [0, 0, 1],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          >
            <Ionicons name={leftLong.icon as any} size={24} color={leftLong.color} />
            <Text style={[styles.actionText, { color: leftLong.color }]}>
              {leftLong.label}
            </Text>
          </Animated.View>
        )}
        {leftShort && (
          <Animated.View
            style={[
              styles.actionItem,
              { backgroundColor: leftShort.backgroundColor },
              {
                opacity: translateX.interpolate({
                  inputRange: [0, leftShort.threshold - 20, leftShort.threshold],
                  outputRange: [0, 0, 1],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          >
            <Ionicons name={leftShort.icon as any} size={24} color={leftShort.color} />
            <Text style={[styles.actionText, { color: leftShort.color }]}>
              {leftShort.label}
            </Text>
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  const renderRightActions = () => {
    const { rightShort, rightLong } = swipeConfig;
    
    return (
      <Animated.View 
        style={[
          styles.actionsContainer,
          styles.rightActions,
          {
            opacity: actionOpacity,
            transform: [
              {
                translateX: translateX.interpolate({
                  inputRange: [-SWIPE_THRESHOLDS.MAX, 0],
                  outputRange: [0, 100],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}
      >
        {rightShort && (
          <Animated.View
            style={[
              styles.actionItem,
              { backgroundColor: rightShort.backgroundColor },
              {
                opacity: translateX.interpolate({
                  inputRange: [-rightShort.threshold, -rightShort.threshold + 20, 0],
                  outputRange: [1, 0, 0],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          >
            <Ionicons name={rightShort.icon as any} size={24} color={rightShort.color} />
            <Text style={[styles.actionText, { color: rightShort.color }]}>
              {rightShort.label}
            </Text>
          </Animated.View>
        )}
        {rightLong && (
          <Animated.View
            style={[
              styles.actionItem,
              { backgroundColor: rightLong.backgroundColor },
              {
                opacity: translateX.interpolate({
                  inputRange: [-rightLong.threshold, -rightLong.threshold + 20, 0],
                  outputRange: [1, 0, 0],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          >
            <Ionicons name={rightLong.icon as any} size={24} color={rightLong.color} />
            <Text style={[styles.actionText, { color: rightLong.color }]}>
              {rightLong.label}
            </Text>
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background Actions */}
      {renderLeftActions()}
      {renderRightActions()}
      
      {/* Swipeable Entry */}
      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleStateChange}
        activeOffsetX={[-10, 10]}
        failOffsetY={[-5, 5]}
      >
        <Animated.View
          style={[
            styles.entryContainer,
            {
              transform: [{ translateX }],
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
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 8,
  },
  entryContainer: {
    backgroundColor: '#FAF7F0',
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
    left: 0,
    paddingLeft: 20,
  },
  rightActions: {
    right: 0,
    paddingRight: 20,
    justifyContent: 'flex-end',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});