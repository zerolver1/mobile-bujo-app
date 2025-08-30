import React, { useRef, useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Pressable,
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
  onSwipeAction: (entry: BuJoEntry, action: { action: string; key: string }) => void;
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
  
  // Track which side is currently revealed
  const [revealedSide, setRevealedSide] = useState<'none' | 'left' | 'right'>('none');
  
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
      
      const leftRevealed = Math.max(0, translationX);
      const rightRevealed = Math.max(0, -translationX);
      
      const leftActions = getLeftActions();
      const rightActions = getRightActions();
      
      // Calculate total widths for each side
      const leftWidth = leftActions.length * 80;
      const rightWidth = rightActions.length * 80;
      
      // Toggle behavior: swipe same direction to close, different direction to open
      if (leftRevealed > 40 && leftActions.length > 0) {
        if (revealedSide === 'left') {
          // Already showing left actions - close them
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
            tension: 200,
            friction: 8,
          }).start();
          setRevealedSide('none');
        } else {
          // Show left actions
          Animated.spring(translateX, {
            toValue: leftWidth,
            useNativeDriver: false,
            tension: 200,
            friction: 8,
          }).start();
          setRevealedSide('left');
        }
      } else if (rightRevealed > 40 && rightActions.length > 0) {
        if (revealedSide === 'right') {
          // Already showing right actions - close them
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
            tension: 200,
            friction: 8,
          }).start();
          setRevealedSide('none');
        } else {
          // Show right actions
          Animated.spring(translateX, {
            toValue: -rightWidth,
            useNativeDriver: false,
            tension: 200,
            friction: 8,
          }).start();
          setRevealedSide('right');
        }
      } else {
        // Not enough swipe distance - snap back to center
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
          tension: 200,
          friction: 8,
        }).start();
        setRevealedSide('none');
      }
    }
  };

  const getLeftActions = () => {
    const { leftShort, leftLong } = swipeConfig;
    const actions = [];
    if (leftShort) actions.push(leftShort);
    if (leftLong) actions.push(leftLong);
    return actions;
  };

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
              onPress={() => {
                onSwipeAction(entry, { action: action.action, key: action.key });
                // Animate back to closed position and reset state
                Animated.spring(translateX, {
                  toValue: 0,
                  useNativeDriver: false,
                  tension: 200,
                  friction: 8,
                }).start();
                setRevealedSide('none');
              }}
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

  const getRightActions = () => {
    const { rightShort, rightLong } = swipeConfig;
    const actions = [];
    if (rightShort) actions.push(rightShort);
    if (rightLong) actions.push(rightLong);
    return actions;
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
              onPress={() => {
                onSwipeAction(entry, { action: action.action, key: action.key });
                // Animate back to closed position and reset state
                Animated.spring(translateX, {
                  toValue: 0,
                  useNativeDriver: false,
                  tension: 200,
                  friction: 8,
                }).start();
                setRevealedSide('none');
              }}
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
    overflow: 'hidden',
  },
  entryContainer: {
    backgroundColor: '#FFFFFF',
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
    justifyContent: 'flex-start',
  },
  rightActions: {
    right: 0,
    justifyContent: 'flex-end',
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