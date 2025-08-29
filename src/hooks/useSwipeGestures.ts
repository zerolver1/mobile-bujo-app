import { useCallback, useState } from 'react';
import { Alert, Vibration, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BuJoEntry } from '../types/BuJo';
import { SwipeAction } from '../utils/swipeActions';
import { useBuJoStore } from '../stores/BuJoStore';

interface UseSwipeGesturesProps {
  onMigrate?: (entry: BuJoEntry) => void;
  onSchedule?: (entry: BuJoEntry) => void;
  onEdit?: (entry: BuJoEntry) => void;
  onDelete?: (entry: BuJoEntry) => void;
  navigation?: any;
}

export const useSwipeGestures = ({
  onMigrate,
  onSchedule,
  onEdit,
  onDelete,
  navigation,
}: UseSwipeGesturesProps = {}) => {
  const { updateEntry, deleteEntry, addEntry } = useBuJoStore();
  const [undoStack, setUndoStack] = useState<Array<{ entry: BuJoEntry; action: string }>>([]);

  // Provide haptic feedback
  const triggerHaptic = useCallback(async (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => {
    if (Platform.OS === 'ios') {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }
    } else {
      // Android vibration patterns
      const patterns = {
        light: 10,
        medium: 20,
        heavy: 40,
        success: [0, 10, 20, 10],
        warning: [0, 20, 40, 20],
        error: [0, 50, 100, 50],
      };
      Vibration.vibrate(patterns[type] as any);
    }
  }, []);

  // Handle swipe actions
  const handleSwipeAction = useCallback(async (entry: BuJoEntry, action: SwipeAction) => {
    // Add to undo stack
    setUndoStack(prev => [...prev.slice(-9), { entry, action: action.key }]);

    // Trigger appropriate haptic feedback
    await triggerHaptic('medium');

    switch (action.action) {
      case 'complete':
        updateEntry(entry.id, { status: 'complete' });
        await triggerHaptic('success');
        break;

      case 'migrate':
        // Always delegate to parent component for consistent behavior
        if (onMigrate) {
          onMigrate(entry);
        } else {
          console.warn('No migration handler provided');
        }
        break;

      case 'schedule':
        // Always delegate to parent component for consistent behavior  
        if (onSchedule) {
          onSchedule(entry);
        } else {
          console.warn('No scheduling handler provided');
        }
        break;

      case 'cancel':
        updateEntry(entry.id, { status: 'cancelled' });
        await triggerHaptic('warning');
        break;

      case 'edit':
        if (onEdit) {
          onEdit(entry);
        } else if (navigation) {
          navigation.navigate('QuickCapture', { editEntry: entry });
        }
        break;

      case 'delete':
        Alert.alert(
          'Delete Entry',
          `Are you sure you want to delete "${entry.content}"?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                if (onDelete) {
                  onDelete(entry);
                } else {
                  deleteEntry(entry.id);
                }
                await triggerHaptic('error');
              }
            }
          ]
        );
        break;

      case 'convert':
        // Handle type conversions
        if (action.key === 'convert' && entry.type === 'note') {
          // Convert note to task
          updateEntry(entry.id, { type: 'task', status: 'incomplete' });
          await triggerHaptic('success');
        } else if (action.key === 'research' && entry.type === 'inspiration') {
          // Convert inspiration to research
          updateEntry(entry.id, { type: 'research' });
          await triggerHaptic('success');
        } else if (action.key === 'task' && (entry.type === 'inspiration' || entry.type === 'research')) {
          // Convert to task
          updateEntry(entry.id, { type: 'task', status: 'incomplete' });
          await triggerHaptic('success');
        }
        break;

      case 'archive':
        // Archive the entry (move to archived collection)
        updateEntry(entry.id, { collection: 'custom', status: 'cancelled' });
        Alert.alert('Entry Archived', `"${entry.content}" has been archived.`);
        break;

      case 'share':
        // Share functionality would go here
        Alert.alert('Share', `Sharing: "${entry.content}"`);
        break;

      case 'calendar':
        // Add to calendar - integrate with Apple Calendar
        Alert.alert('Calendar', `Adding "${entry.content}" to calendar`);
        break;

      case 'reminder':
        // Set reminder - integrate with Apple Reminders
        Alert.alert('Reminder', `Setting reminder for "${entry.content}"`);
        break;

      case 'investigate':
        // Mark research as investigated
        updateEntry(entry.id, { status: 'complete' });
        await triggerHaptic('success');
        break;

      case 'defer':
        // Defer to future
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        updateEntry(entry.id, {
          collectionDate: futureDate.toISOString().split('T')[0],
          status: 'scheduled'
        });
        Alert.alert('Deferred', `"${entry.content}" deferred to ${futureDate.toLocaleDateString()}`);
        break;

      case 'photo':
        // Open camera/photo picker
        if (navigation) {
          navigation.navigate('Camera', { entryId: entry.id });
        }
        break;

      case 'gratitude':
        // Add to gratitude log
        updateEntry(entry.id, { 
          tags: [...(entry.tags || []), 'gratitude'],
          priority: 'high'
        });
        Alert.alert('Added to Gratitude', `"${entry.content}" added to gratitude log`);
        await triggerHaptic('success');
        break;

      case 'private':
        // Make private/archive
        updateEntry(entry.id, { 
          tags: [...(entry.tags || []), 'private'],
          collection: 'custom'
        });
        Alert.alert('Made Private', `"${entry.content}" is now private`);
        break;

      case 'collection':
        // Add to collection - would open collection picker
        if (navigation) {
          navigation.navigate('CollectionPicker', { entryId: entry.id });
        }
        break;

      default:
        console.warn('Unhandled swipe action:', action.action);
    }
  }, [updateEntry, deleteEntry, onMigrate, onSchedule, onEdit, onDelete, navigation, triggerHaptic]);

  // Undo last action
  const undoLastAction = useCallback(() => {
    const lastAction = undoStack[undoStack.length - 1];
    if (lastAction) {
      // Restore entry to previous state
      // This would need more sophisticated state tracking in production
      Alert.alert('Undo', `Undoing ${lastAction.action} on "${lastAction.entry.content}"`);
      setUndoStack(prev => prev.slice(0, -1));
      triggerHaptic('light');
    }
  }, [undoStack, triggerHaptic]);

  return {
    handleSwipeAction,
    undoLastAction,
    triggerHaptic,
    hasUndo: undoStack.length > 0,
  };
};