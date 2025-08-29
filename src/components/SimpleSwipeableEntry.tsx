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
  const { triggerHaptic } = useSwipeGestures();
  
  // Simplified: get only first action from each side
  const swipeActions = useMemo(() => {
    const allActions = getSimpleSwipeActions(entry);
    return {
      left: allActions.left.length > 0 ? [allActions.left[0]] : [],
      right: allActions.right.length > 0 ? [allActions.right[0]] : [],
    };
  }, [entry.type, entry.status]);
  
  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: false }
  );

  const handleStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    const { state, translationX } = event.nativeEvent;
    
    if (state === State.END) {
      const leftRevealed = Math.max(0, translationX);
      const rightRevealed = Math.max(0, -translationX);
      
      let triggeredAction: SwipeAction | null = null;
      
      // Simple threshold detection - 80px
      if (leftRevealed > 80 && swipeActions.left.length > 0) {
        triggeredAction = swipeActions.left[0];
      } else if (rightRevealed > 80 && swipeActions.right.length > 0) {
        triggeredAction = swipeActions.right[0];
      }
      
      // Trigger action if one was selected
      if (triggeredAction) {
        triggerHaptic('medium');
        onSwipeAction(entry, triggeredAction.action);
      }
      
      // Animate back to center
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }).start();
    }
  };

  const renderActionButton = (action: SwipeAction, side: 'left' | 'right') => {
    return (
      <View
        key={action.id}
        style={[
          styles.actionButton,
          side === 'left' ? styles.leftAction : styles.rightAction,
          { backgroundColor: action.backgroundColor }
        ]}
      >
        <Pressable
          style={styles.buttonPressable}
          onPress={() => {
            triggerHaptic('medium');
            onSwipeAction(entry, action.action);
          }}
        >
          <Ionicons 
            name={action.icon} 
            size={22} 
            color={action.textColor} 
            style={styles.actionIcon}
          />
          <Text style={[styles.actionText, { color: action.textColor }]}>
            {action.label}
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Left Action */}
      {swipeActions.left.length > 0 && renderActionButton(swipeActions.left[0], 'left')}
      
      {/* Right Action */}
      {swipeActions.right.length > 0 && renderActionButton(swipeActions.right[0], 'right')}
      
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
              transform: [{ translateX: translateX }],
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
  },
  entryContainer: {
    backgroundColor: '#FFFFFF',
    zIndex: 2,
    elevation: 2,
  },
  actionButton: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  leftAction: {
    left: 0,
  },
  rightAction: {
    right: 0,
  },
  buttonPressable: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
    paddingHorizontal: 8,
  },
  actionIcon: {
    marginBottom: 2,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});