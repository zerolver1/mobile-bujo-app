import React, { useRef, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import {
  PanGestureHandler,
  LongPressGestureHandler,
  State,
  PanGestureHandlerStateChangeEvent,
  PanGestureHandlerGestureEvent,
  LongPressGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { BuJoEntry } from '../types/BuJo';
import { BuJoEntryItem } from './BuJoEntryItem';
import { SwipeActionPreview } from './SwipeActionPreview';
import { useSwipeGestures } from '../hooks/useSwipeGestures';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SwipeActionButton {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  backgroundColor: string;
  textColor: string;
  width: number;
  action: 'complete' | 'migrate' | 'schedule' | 'cancel' | 'edit' | 'delete' | 'archive' | 'convert';
  priority: 'primary' | 'secondary' | 'destructive';
}

interface ModernSwipeableEntryProps {
  entry: BuJoEntry;
  onSwipeAction: (entry: BuJoEntry, action: string) => void;
  onPress: (entry: BuJoEntry, action: string) => void;
  showDate?: boolean;
  isCompact?: boolean;
}

// Action button widths for different priorities
const ACTION_WIDTHS = {
  primary: 80,
  secondary: 70,
  destructive: 90,
};

// Modern progressive swipe actions based on entry type and status
const getSwipeActions = (entry: BuJoEntry): { left: SwipeActionButton[]; right: SwipeActionButton[] } => {
  const actions = { left: [] as SwipeActionButton[], right: [] as SwipeActionButton[] };

  switch (entry.type) {
    case 'task':
      if (entry.status === 'incomplete') {
        // Left swipe: Completion actions (primary -> secondary)
        actions.left = [
          {
            id: 'complete',
            label: 'Done',
            icon: 'checkmark-circle',
            backgroundColor: '#34C759',
            textColor: '#FFFFFF',
            width: ACTION_WIDTHS.primary,
            action: 'complete',
            priority: 'primary',
          },
          {
            id: 'migrate',
            label: 'Move',
            icon: 'arrow-forward',
            backgroundColor: '#FF9500',
            textColor: '#FFFFFF', 
            width: ACTION_WIDTHS.secondary,
            action: 'migrate',
            priority: 'secondary',
          },
        ];

        // Right swipe: Planning actions
        actions.right = [
          {
            id: 'schedule',
            label: 'Later',
            icon: 'calendar',
            backgroundColor: '#007AFF',
            textColor: '#FFFFFF',
            width: ACTION_WIDTHS.primary,
            action: 'schedule',
            priority: 'primary',
          },
          {
            id: 'cancel',
            label: 'Cancel',
            icon: 'close-circle',
            backgroundColor: '#FF3B30',
            textColor: '#FFFFFF',
            width: ACTION_WIDTHS.secondary,
            action: 'cancel',
            priority: 'secondary',
          },
          {
            id: 'delete',
            label: 'Delete',
            icon: 'trash',
            backgroundColor: '#FF453A',
            textColor: '#FFFFFF',
            width: ACTION_WIDTHS.destructive,
            action: 'delete',
            priority: 'destructive',
          },
        ];
      }
      break;

    case 'event':
      actions.left = [
        {
          id: 'complete',
          label: 'Done',
          icon: 'checkmark-circle',
          backgroundColor: '#34C759',
          textColor: '#FFFFFF',
          width: ACTION_WIDTHS.primary,
          action: 'complete',
          priority: 'primary',
        },
      ];
      actions.right = [
        {
          id: 'edit',
          label: 'Edit',
          icon: 'pencil',
          backgroundColor: '#007AFF',
          textColor: '#FFFFFF',
          width: ACTION_WIDTHS.primary,
          action: 'edit',
          priority: 'primary',
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: 'trash',
          backgroundColor: '#FF453A',
          textColor: '#FFFFFF',
          width: ACTION_WIDTHS.destructive,
          action: 'delete',
          priority: 'destructive',
        },
      ];
      break;

    case 'note':
      actions.left = [
        {
          id: 'archive',
          label: 'Archive',
          icon: 'archive',
          backgroundColor: '#8E8E93',
          textColor: '#FFFFFF',
          width: ACTION_WIDTHS.primary,
          action: 'archive',
          priority: 'primary',
        },
      ];
      actions.right = [
        {
          id: 'convert',
          label: 'Task',
          icon: 'repeat',
          backgroundColor: '#5856D6',
          textColor: '#FFFFFF',
          width: ACTION_WIDTHS.primary,
          action: 'convert',
          priority: 'primary',
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: 'trash',
          backgroundColor: '#FF453A',
          textColor: '#FFFFFF',
          width: ACTION_WIDTHS.destructive,
          action: 'delete',
          priority: 'destructive',
        },
      ];
      break;

    case 'inspiration':
      actions.left = [
        {
          id: 'convert',
          label: 'Task',
          icon: 'repeat',
          backgroundColor: '#5856D6',
          textColor: '#FFFFFF',
          width: ACTION_WIDTHS.primary,
          action: 'convert',
          priority: 'primary',
        },
      ];
      actions.right = [
        {
          id: 'archive',
          label: 'Save',
          icon: 'bookmark',
          backgroundColor: '#FFD60A',
          textColor: '#000000',
          width: ACTION_WIDTHS.primary,
          action: 'archive',
          priority: 'primary',
        },
      ];
      break;

    case 'research':
      actions.left = [
        {
          id: 'complete',
          label: 'Done',
          icon: 'checkmark-circle',
          backgroundColor: '#34C759',
          textColor: '#FFFFFF',
          width: ACTION_WIDTHS.primary,
          action: 'complete',
          priority: 'primary',
        },
      ];
      actions.right = [
        {
          id: 'convert',
          label: 'Task',
          icon: 'repeat',
          backgroundColor: '#5856D6',
          textColor: '#FFFFFF',
          width: ACTION_WIDTHS.primary,
          action: 'convert',
          priority: 'primary',
        },
      ];
      break;

    case 'memory':
      actions.left = [
        {
          id: 'archive',
          label: 'Save',
          icon: 'heart',
          backgroundColor: '#FF2D55',
          textColor: '#FFFFFF',
          width: ACTION_WIDTHS.primary,
          action: 'archive',
          priority: 'primary',
        },
      ];
      actions.right = [
        {
          id: 'edit',
          label: 'Edit',
          icon: 'pencil',
          backgroundColor: '#007AFF',
          textColor: '#FFFFFF',
          width: ACTION_WIDTHS.primary,
          action: 'edit',
          priority: 'primary',
        },
      ];
      break;
  }

  return actions;
};

export const ModernSwipeableEntry: React.FC<ModernSwipeableEntryProps> = ({
  entry,
  onSwipeAction,
  onPress,
  showDate = false,
  isCompact = false,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const actionOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { triggerHaptic } = useSwipeGestures();
  
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [lastHapticIndex, setLastHapticIndex] = useState(-1);
  const [currentActiveAction, setCurrentActiveAction] = useState<string | null>(null);
  
  const swipeActions = useMemo(() => getSwipeActions(entry), [entry.type, entry.status]);
  
  // Calculate total widths for left and right action groups
  const leftActionsWidth = swipeActions.left.reduce((sum, action) => sum + action.width, 0);
  const rightActionsWidth = swipeActions.right.reduce((sum, action) => sum + action.width, 0);
  
  // Enhanced gesture handling with progressive haptic feedback
  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { 
      useNativeDriver: false,
      listener: (event: PanGestureHandlerGestureEvent) => {
        const { translationX } = event.nativeEvent;
        
        // Progressive haptic feedback based on actions revealed
        const leftRevealed = Math.max(0, translationX);
        const rightRevealed = Math.max(0, -translationX);
        
        // Calculate which action is currently active
        let activeAction: string | null = null;
        let actionIndex = -1;
        
        if (leftRevealed > 30 && swipeActions.left.length > 0) {
          let currentWidth = 0;
          for (let i = 0; i < swipeActions.left.length; i++) {
            currentWidth += swipeActions.left[i].width;
            if (leftRevealed >= currentWidth - 20) {
              actionIndex = i;
              activeAction = swipeActions.left[i].id;
            }
          }
          
          // Trigger haptic feedback when crossing into new action zone
          if (actionIndex !== lastHapticIndex && actionIndex >= 0) {
            triggerHaptic('light');
            setLastHapticIndex(actionIndex);
            setCurrentActiveAction(activeAction);
          }
        } else if (rightRevealed > 30 && swipeActions.right.length > 0) {
          let currentWidth = 0;
          for (let i = 0; i < swipeActions.right.length; i++) {
            currentWidth += swipeActions.right[i].width;
            if (rightRevealed >= currentWidth - 20) {
              actionIndex = i;
              activeAction = swipeActions.right[i].id;
            }
          }
          
          // Trigger haptic feedback when crossing into new action zone
          if (actionIndex !== lastHapticIndex && actionIndex >= 0) {
            triggerHaptic('light');
            setLastHapticIndex(actionIndex);
            setCurrentActiveAction(activeAction);
          }
        } else {
          // Reset when not in any action zone
          setLastHapticIndex(-1);
          setCurrentActiveAction(null);
        }
        
        // Animate action visibility based on swipe progress
        const progress = Math.min(1, (leftRevealed + rightRevealed) / 60);
        actionOpacity.setValue(progress);
      }
    }
  );

  const handleStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    const { state, translationX, velocityX } = event.nativeEvent;
    
    if (state === State.END || state === State.CANCELLED) {
      const leftRevealed = Math.max(0, translationX);
      const rightRevealed = Math.max(0, -translationX);
      
      let triggeredAction: SwipeActionButton | null = null;
      
      // Enhanced action detection with velocity consideration
      if (leftRevealed > 40) {
        let currentWidth = 0;
        for (const action of swipeActions.left) {
          currentWidth += action.width;
          // Consider velocity for better UX - fast swipe triggers even with less distance
          const threshold = velocityX > 500 ? currentWidth - 40 : currentWidth - 20;
          if (leftRevealed >= threshold) {
            triggeredAction = action;
          }
        }
      } else if (rightRevealed > 40) {
        let currentWidth = 0;
        for (const action of swipeActions.right) {
          currentWidth += action.width;
          // Consider velocity for better UX - fast swipe triggers even with less distance
          const threshold = -velocityX > 500 ? currentWidth - 40 : currentWidth - 20;
          if (rightRevealed >= threshold) {
            triggeredAction = action;
          }
        }
      }
      
      // Trigger action if one was selected
      if (triggeredAction) {
        triggerHaptic('medium');
        
        // Scale animation feedback
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
            tension: 200,
            friction: 7,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 200,
            friction: 7,
          }),
        ]).start();
        
        onSwipeAction(entry, triggeredAction.action);
      }
      
      // Reset state
      setLastHapticIndex(-1);
      setCurrentActiveAction(null);
      
      // Animate back to center with physics-based spring
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
          tension: 120,
          friction: 9,
          velocity: -velocityX * 0.1, // Use current velocity for natural feel
        }),
        Animated.timing(actionOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  // Long press handler for accessibility
  const handleLongPress = useCallback((event: LongPressGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      triggerHaptic('medium');
      setIsPreviewVisible(true);
    }
  }, [triggerHaptic]);

  const handleActionSelect = useCallback((action: string) => {
    onSwipeAction(entry, action);
  }, [entry, onSwipeAction]);

  const renderActionButtons = (actions: SwipeActionButton[], direction: 'left' | 'right') => {
    if (actions.length === 0) return null;
    
    return (
      <View style={[
        styles.actionsContainer,
        direction === 'left' ? styles.leftActions : styles.rightActions
      ]}>
        {actions.map((action, index) => {
          const isActive = currentActiveAction === action.id;
          return (
            <Pressable
              key={action.id}
              style={[
                styles.actionButton,
                { 
                  backgroundColor: action.backgroundColor,
                  width: action.width,
                  opacity: isActive ? 1.0 : 0.95,
                  transform: [{ scale: isActive ? 1.05 : 1 }],
                  zIndex: 10 + index, // Ensure proper layering
                }
              ]}
              onPress={() => {
                triggerHaptic('medium');
                onSwipeAction(entry, action.action);
              }}
            >
              <Ionicons 
                name={action.icon} 
                size={isActive ? 22 : 20} 
                color={action.textColor} 
                style={styles.actionIcon}
              />
              <Text style={[
                styles.actionText, 
                { 
                  color: action.textColor,
                  fontWeight: isActive ? '700' : '600',
                  fontSize: isActive ? 12 : 11,
                }
              ]}>
                {action.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  return (
    <>
      <View style={styles.container}>
        {/* Left Actions */}
        {renderActionButtons(swipeActions.left, 'left')}
        
        {/* Right Actions */}
        {renderActionButtons(swipeActions.right, 'right')}
        
        {/* Main Content with Long Press + Swipe Gestures */}
        <LongPressGestureHandler
          onHandlerStateChange={handleLongPress}
          minDurationMs={500}
        >
          <PanGestureHandler
            onGestureEvent={handleGestureEvent}
            onHandlerStateChange={handleStateChange}
            activeOffsetX={[-20, 20]}
            failOffsetY={[-20, 20]}
            maxPointers={1}
          >
            <Animated.View 
              style={[
                styles.entryContainer,
                {
                  transform: [
                    { scale: scaleAnim },
                    { 
                      translateX: translateX.interpolate({
                        inputRange: [-rightActionsWidth - 50, -rightActionsWidth, 0, leftActionsWidth, leftActionsWidth + 50],
                        outputRange: [-rightActionsWidth, -rightActionsWidth, 0, leftActionsWidth, leftActionsWidth],
                        extrapolate: 'clamp',
                      })
                    }
                  ],
                }
              ]}
            >
              <BuJoEntryItem
                entry={entry}
                onPress={(entry, action) => onPress(entry, action)}
                showDate={showDate}
                isCompact={isCompact}
              />
            </Animated.View>
          </PanGestureHandler>
        </LongPressGestureHandler>
      </View>
      
      {/* Action Preview Modal for Accessibility */}
      <SwipeActionPreview
        entry={entry}
        visible={isPreviewVisible}
        onClose={() => setIsPreviewVisible(false)}
        onActionSelect={handleActionSelect}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#FAF7F0',
    overflow: 'hidden', // Ensure actions don't leak outside
  },
  entryContainer: {
    backgroundColor: '#FFFFFF',
    zIndex: 100, // High z-index to stay above actions
    elevation: 5, // Android elevation
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1, // Below entry container
  },
  leftActions: {
    left: 0,
    justifyContent: 'flex-end', // Align actions to the right edge
    paddingLeft: 0,
  },
  rightActions: {
    right: 0,
    justifyContent: 'flex-start', // Align actions to the left edge
    paddingRight: 0,
  },
  actionButton: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    minWidth: 60, // Ensure minimum touch target
  },
  actionIcon: {
    marginBottom: 2,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 12,
  },
});