import React, { useRef, useMemo, useState } from 'react';
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
import { useSwipeGestures } from '../hooks/useSwipeGestures';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SwipeAction {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  backgroundColor: string;
  textColor: string;
  action: string;
  width?: number; // Optional width for progressive sizing
  priority?: 'primary' | 'secondary' | 'destructive';
}

// Action button widths based on priority
const ACTION_WIDTHS = {
  primary: 80,
  secondary: 70,
  destructive: 90,
};

interface SimpleSwipeableEntryProps {
  entry: BuJoEntry;
  onSwipeAction: (entry: BuJoEntry, action: string) => void;
  onPress: (entry: BuJoEntry, action: string) => void;
  showDate?: boolean;
  isCompact?: boolean;
}

const getSimpleSwipeActions = (entry: BuJoEntry): { left: SwipeAction[]; right: SwipeAction[] } => {
  const actions = { left: [] as SwipeAction[], right: [] as SwipeAction[] };

  switch (entry.type) {
    case 'task':
      if (entry.status === 'incomplete') {
        // Left swipe: Completion actions
        actions.left = [
          {
            id: 'complete',
            label: 'Done',
            icon: 'checkmark-circle',
            backgroundColor: '#34C759',
            textColor: '#FFFFFF',
            action: 'complete',
          },
          {
            id: 'migrate',
            label: 'Move',
            icon: 'arrow-forward',
            backgroundColor: '#FF9500',
            textColor: '#FFFFFF',
            action: 'migrate',
          }
        ];
        
        // Right swipe: Planning actions
        actions.right = [
          {
            id: 'schedule',
            label: 'Later',
            icon: 'calendar',
            backgroundColor: '#007AFF',
            textColor: '#FFFFFF',
            action: 'schedule',
          },
          {
            id: 'cancel',
            label: 'Cancel',
            icon: 'close-circle',
            backgroundColor: '#FF3B30',
            textColor: '#FFFFFF',
            action: 'cancel',
          },
          {
            id: 'delete',
            label: 'Delete',
            icon: 'trash',
            backgroundColor: '#FF453A',
            textColor: '#FFFFFF',
            action: 'delete',
          }
        ];
      }
      break;
      
    case 'event':
      actions.left = [{
        id: 'complete',
        label: 'Done',
        icon: 'checkmark-circle',
        backgroundColor: '#34C759',
        textColor: '#FFFFFF',
        action: 'complete',
      }];
      
      actions.right = [
        {
          id: 'edit',
          label: 'Edit',
          icon: 'pencil',
          backgroundColor: '#007AFF',
          textColor: '#FFFFFF',
          action: 'edit',
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: 'trash',
          backgroundColor: '#FF453A',
          textColor: '#FFFFFF',
          action: 'delete',
        }
      ];
      break;
      
    case 'note':
      actions.left = [{
        id: 'archive',
        label: 'Archive',
        icon: 'archive',
        backgroundColor: '#8E8E93',
        textColor: '#FFFFFF',
        action: 'archive',
      }];
      
      actions.right = [
        {
          id: 'convert',
          label: 'Task',
          icon: 'repeat',
          backgroundColor: '#5856D6',
          textColor: '#FFFFFF',
          action: 'convert',
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: 'trash',
          backgroundColor: '#FF453A',
          textColor: '#FFFFFF',
          action: 'delete',
        }
      ];
      break;
      
    case 'inspiration':
      actions.left = [{
        id: 'convert',
        label: 'Task',
        icon: 'repeat',
        backgroundColor: '#5856D6',
        textColor: '#FFFFFF',
        action: 'convert',
      }];
      
      actions.right = [{
        id: 'archive',
        label: 'Save',
        icon: 'bookmark',
        backgroundColor: '#FFD60A',
        textColor: '#000000',
        action: 'archive',
      }];
      break;
      
    case 'research':
      actions.left = [{
        id: 'complete',
        label: 'Done',
        icon: 'checkmark-circle',
        backgroundColor: '#34C759',
        textColor: '#FFFFFF',
        action: 'complete',
      }];
      
      actions.right = [{
        id: 'convert',
        label: 'Task',
        icon: 'repeat',
        backgroundColor: '#5856D6',
        textColor: '#FFFFFF',
        action: 'convert',
      }];
      break;
      
    case 'memory':
      actions.left = [{
        id: 'archive',
        label: 'Save',
        icon: 'heart',
        backgroundColor: '#FF2D55',
        textColor: '#FFFFFF',
        action: 'archive',
      }];
      
      actions.right = [{
        id: 'edit',
        label: 'Edit',
        icon: 'pencil',
        backgroundColor: '#007AFF',
        textColor: '#FFFFFF',
        action: 'edit',
      }];
      break;
      
    default:
      // Fallback for unknown types
      actions.left = [{
        id: 'complete',
        label: 'Done',
        icon: 'checkmark-circle',
        backgroundColor: '#34C759',
        textColor: '#FFFFFF',
        action: 'complete',
      }];
      break;
  }

  return actions;
};

export const SimpleSwipeableEntry: React.FC<SimpleSwipeableEntryProps> = ({
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
  
  const [currentActiveAction, setCurrentActiveAction] = useState<string | null>(null);
  const [lastHapticIndex, setLastHapticIndex] = useState(-1);
  
  const swipeActions = useMemo(() => {
    const actions = getSimpleSwipeActions(entry);
    // Assign widths and priorities to actions
    actions.left.forEach((action, index) => {
      if (index === 0) {
        action.width = ACTION_WIDTHS.primary;
        action.priority = 'primary';
      } else if (action.id === 'delete') {
        action.width = ACTION_WIDTHS.destructive;
        action.priority = 'destructive';
      } else {
        action.width = ACTION_WIDTHS.secondary;
        action.priority = 'secondary';
      }
    });
    
    actions.right.forEach((action, index) => {
      if (index === 0) {
        action.width = ACTION_WIDTHS.primary;
        action.priority = 'primary';
      } else if (action.id === 'delete') {
        action.width = ACTION_WIDTHS.destructive;
        action.priority = 'destructive';
      } else {
        action.width = ACTION_WIDTHS.secondary;
        action.priority = 'secondary';
      }
    });
    
    return actions;
  }, [entry.type, entry.status]);
  
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
            currentWidth += swipeActions.left[i].width || ACTION_WIDTHS.primary;
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
            currentWidth += swipeActions.right[i].width || ACTION_WIDTHS.primary;
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
    
    if (state === State.END) {
      const leftRevealed = Math.max(0, translationX);
      const rightRevealed = Math.max(0, -translationX);
      
      let triggeredAction: SwipeAction | null = null;
      
      // Progressive multi-button detection
      if (leftRevealed > 40 && swipeActions.left.length > 0) {
        let currentWidth = 0;
        for (const action of swipeActions.left) {
          currentWidth += action.width || ACTION_WIDTHS.primary;
          // Consider velocity for better UX
          const threshold = velocityX > 500 ? currentWidth - 20 : currentWidth - 10;
          if (leftRevealed >= threshold) {
            triggeredAction = action;
          }
        }
      } else if (rightRevealed > 40 && swipeActions.right.length > 0) {
        let currentWidth = 0;
        for (const action of swipeActions.right) {
          currentWidth += action.width || ACTION_WIDTHS.primary;
          // Consider velocity for better UX
          const threshold = -velocityX > 500 ? currentWidth - 20 : currentWidth - 10;
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
      
      // Animate back to center with velocity consideration
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
          tension: 120,
          friction: 9,
          velocity: -velocityX * 0.1,
        }),
        Animated.timing(actionOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  const renderActionButtons = (actions: SwipeAction[], side: 'left' | 'right') => {
    if (actions.length === 0) return null;
    
    return (
      <Animated.View style={[
        styles.actionGroup,
        side === 'left' ? styles.leftActionGroup : styles.rightActionGroup,
        { opacity: actionOpacity }
      ]}>
        {actions.map((action, index) => {
          const isActive = currentActiveAction === action.id;
          return (
            <View
              key={action.id}
              style={[
                styles.actionContainer,
                {
                  backgroundColor: action.backgroundColor,
                  width: action.width || ACTION_WIDTHS.primary,
                  opacity: isActive ? 1.0 : 0.95,
                  transform: [{ scale: isActive ? 1.05 : 1 }],
                }
              ]}
            >
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  triggerHaptic('medium');
                  onSwipeAction(entry, action.action);
                }}
              >
                <Ionicons 
                  name={action.icon} 
                  size={isActive ? (action.priority === 'destructive' ? 24 : 22) : (action.priority === 'destructive' ? 22 : 20)} 
                  color={action.textColor} 
                  style={styles.actionIcon}
                />
                <Text style={[
                  styles.actionText, 
                  { 
                    color: action.textColor,
                    fontWeight: isActive ? '700' : (action.priority === 'primary' ? '700' : '600'),
                    fontSize: isActive ? 12 : (action.priority === 'destructive' ? 12 : 11),
                  }
                ]}>
                  {action.label}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background Actions */}
      <View style={styles.actionsBackground}>
        {/* Left Actions */}
        {renderActionButtons(swipeActions.left, 'left')}
        
        {/* Right Actions */}
        {renderActionButtons(swipeActions.right, 'right')}
      </View>
      
      {/* Main Content that slides over actions */}
      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleStateChange}
        activeOffsetX={[-20, 20]}
        failOffsetY={[-20, 20]}
      >
        <Animated.View 
          style={[
            styles.entryContainer,
            {
              transform: [{ 
                translateX: translateX
              }],
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#FAF7F0',
    overflow: 'hidden',
  },
  actionsBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  entryContainer: {
    backgroundColor: '#FFFFFF',
    zIndex: 10,
    elevation: 5,
    position: 'relative',
  },
  actionGroup: {
    flexDirection: 'row',
    height: '100%',
  },
  leftActionGroup: {
    // Actions flow from left to right
  },
  rightActionGroup: {
    // Actions flow from right to left
    flexDirection: 'row-reverse',
  },
  actionContainer: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
    paddingHorizontal: 6,
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