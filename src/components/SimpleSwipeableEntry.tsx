import React, { useRef, useMemo } from 'react';
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
}

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
        actions.left = [{
          id: 'complete',
          label: 'Done',
          icon: 'checkmark-circle',
          backgroundColor: '#34C759',
          textColor: '#FFFFFF',
          action: 'complete',
        }];
        
        actions.right = [{
          id: 'schedule',
          label: 'Later',
          icon: 'calendar',
          backgroundColor: '#007AFF',
          textColor: '#FFFFFF',
          action: 'schedule',
        }];
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
      break;
      
    case 'note':
      actions.right = [{
        id: 'archive',
        label: 'Archive',
        icon: 'archive',
        backgroundColor: '#8E8E93',
        textColor: '#FFFFFF',
        action: 'archive',
      }];
      break;
      
    default:
      // For inspiration, research, memory - basic actions
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
  
  const swipeActions = useMemo(() => getSimpleSwipeActions(entry), [entry.type, entry.status]);
  
  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { 
      useNativeDriver: false,
      listener: (event: PanGestureHandlerGestureEvent) => {
        // Optional: Add haptic feedback logic here
      }
    }
  );

  const handleStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    const { state, translationX } = event.nativeEvent;
    
    if (state === State.END) {
      const leftRevealed = Math.max(0, translationX);
      const rightRevealed = Math.max(0, -translationX);
      
      let triggeredAction: SwipeAction | null = null;
      
      // Simple threshold-based action detection
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
          styles.actionContainer,
          side === 'left' ? styles.leftAction : styles.rightAction,
          { backgroundColor: action.backgroundColor }
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
            size={20} 
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
      {/* Background Actions */}
      <View style={styles.actionsBackground}>
        {/* Left Action */}
        {swipeActions.left.length > 0 && renderActionButton(swipeActions.left[0], 'left')}
        
        {/* Right Action */}
        {swipeActions.right.length > 0 && renderActionButton(swipeActions.right[0], 'right')}
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
  actionContainer: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftAction: {
    // No additional positioning needed - handled by actionsBackground
  },
  rightAction: {
    // No additional positioning needed - handled by actionsBackground
  },
  actionButton: {
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
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});