import { useCallback, useState } from 'react';
import { Alert, Vibration, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BuJoEntry } from '../types/BuJo';
import { SwipeAction } from '../utils/swipeActions';
import { useBuJoStore } from '../stores/BuJoStore';
import { bujoSyncService } from '../services/supabase/BuJoSyncService';
import { iosSyncService } from '../services/IOSSyncService';

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

    // Helper to track all actions
    const trackEntryAction = async (updatedEntry: Partial<BuJoEntry>, transitionType: string, reason?: string) => {
      if (bujoSyncService) {
        try {
          const newEntry = { ...entry, ...updatedEntry };
          await bujoSyncService.trackTransition(
            entry.id,
            entry,
            newEntry as BuJoEntry,
            transitionType,
            reason || `swipe_${action.action}`,
            { swipeAction: action.key, timestamp: Date.now() }
          );
        } catch (error) {
          console.warn(`Failed to track ${transitionType} transition:`, error);
        }
      }
    };

    switch (action.action) {
      case 'complete':
        const completedEntry = { status: 'complete' as const, completedAt: new Date() };
        updateEntry(entry.id, completedEntry);
        await triggerHaptic('success');
        
        // Track completion transition for iOS sync and BuJo Pro
        await trackEntryAction(completedEntry, 'completed', 'user_completed');
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
        const cancelledEntry = { status: 'cancelled' as const };
        updateEntry(entry.id, cancelledEntry);
        await triggerHaptic('warning');
        
        // Track cancellation for BuJo Pro methodology
        await trackEntryAction(cancelledEntry, 'cancelled', 'user_cancelled');
        break;

      case 'edit':
        // Track edit action initiation
        await trackEntryAction({}, 'edit_initiated', 'user_edit_swipe');
        
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
                // Track deletion for BuJo Pro audit trail
                await trackEntryAction({}, 'deleted', 'user_deleted');
                
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
        // Handle type conversions based on action.key (target type)
        let targetType: BuJoEntry['type'] | null = null;
        let targetStatus: BuJoEntry['status'] = 'incomplete';
        
        switch (action.key) {
          case 'task':
            targetType = 'task';
            targetStatus = 'incomplete';
            break;
          case 'event':
            targetType = 'event';
            targetStatus = 'incomplete';
            break;
          case 'note':
            targetType = 'note';
            targetStatus = 'incomplete';
            break;
          case 'inspiration':
            targetType = 'inspiration';
            targetStatus = 'incomplete';
            break;
          case 'research':
            targetType = 'research';
            targetStatus = 'incomplete';
            break;
          case 'memory':
            targetType = 'memory';
            targetStatus = 'incomplete';
            break;
          case 'convert':
            // Generic convert - for backward compatibility with old swipe actions
            if (entry.type === 'note') {
              targetType = 'task';
              targetStatus = 'incomplete';
            }
            break;
        }
        
        if (targetType && targetType !== entry.type) {
          const originalType = entry.type;
          const convertedEntry = { type: targetType, status: targetStatus };
          updateEntry(entry.id, convertedEntry);
          await triggerHaptic('success');
          
          // Track type conversion for BuJo Pro methodology and iOS sync
          await trackEntryAction(
            convertedEntry, 
            'converted',
            `type_conversion_${originalType}_to_${targetType}`
          );
          
          Alert.alert(
            'Converted Entry',
            `"${entry.content}" converted from ${originalType} to ${targetType}.`
          );
        }
        break;

      case 'archive':
        // Archive the entry (move to archived collection)
        const archivedEntry = { collection: 'custom' as const, status: 'cancelled' as const };
        updateEntry(entry.id, archivedEntry);
        Alert.alert('Entry Archived', `"${entry.content}" has been archived.`);
        
        // Track archival for BuJo Pro methodology
        await trackEntryAction(archivedEntry, 'archived', 'user_archived');
        break;

      case 'share':
        // Share functionality would go here
        Alert.alert('Share', `Sharing: "${entry.content}"`);
        
        // Track share action for analytics
        await trackEntryAction({}, 'shared', 'user_share_swipe');
        break;

      case 'calendar':
        // Add to calendar - integrate with Apple Calendar
        try {
          const eventId = await iosSyncService.syncEntryToCalendar(entry);
          if (eventId) {
            Alert.alert('✅ Calendar', `"${entry.content}" added to Apple Calendar`);
          } else {
            Alert.alert('Calendar', `Adding "${entry.content}" to calendar (iOS sync not available)`);
          }
        } catch (error) {
          Alert.alert('Calendar', `Adding "${entry.content}" to calendar`);
        }
        
        // Track iOS calendar integration
        await trackEntryAction({}, 'synced_to_calendar', 'ios_calendar_integration');
        break;

      case 'reminder':
        // Set reminder - integrate with Apple Reminders
        try {
          const reminderId = await iosSyncService.syncEntryToReminders(entry);
          if (reminderId) {
            Alert.alert('✅ Reminder', `"${entry.content}" added to Apple Reminders`);
          } else {
            Alert.alert('Reminder', `Setting reminder for "${entry.content}" (iOS sync not available)`);
          }
        } catch (error) {
          Alert.alert('Reminder', `Setting reminder for "${entry.content}"`);
        }
        
        // Track iOS reminder integration
        await trackEntryAction({}, 'synced_to_reminders', 'ios_reminders_integration');
        break;

      case 'investigate':
        // Mark research as investigated
        const investigatedEntry = { status: 'complete' as const };
        updateEntry(entry.id, investigatedEntry);
        await triggerHaptic('success');
        
        // Track research completion for BuJo Pro research methodology
        await trackEntryAction(investigatedEntry, 'investigated', 'research_completed');
        break;

      case 'defer':
        // Defer to future
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        const deferredEntry = {
          collectionDate: futureDate.toISOString().split('T')[0],
          status: 'scheduled' as const
        };
        updateEntry(entry.id, deferredEntry);
        Alert.alert('Deferred', `"${entry.content}" deferred to ${futureDate.toLocaleDateString()}`);
        
        // Track deferral as BuJo migration
        await trackEntryAction(deferredEntry, 'deferred', 'future_migration');
        break;

      case 'photo':
        // Open camera/photo picker
        if (navigation) {
          navigation.navigate('Camera', { entryId: entry.id });
        }
        
        // Track photo attachment action
        await trackEntryAction({}, 'photo_attachment_initiated', 'memory_enhancement');
        break;

      case 'gratitude':
        // Add to gratitude log
        const gratitudeEntry = { 
          tags: [...(entry.tags || []), 'gratitude'],
          priority: 'high' as const
        };
        updateEntry(entry.id, gratitudeEntry);
        Alert.alert('Added to Gratitude', `"${entry.content}" added to gratitude log`);
        await triggerHaptic('success');
        
        // Track gratitude tagging for BuJo Pro insights
        await trackEntryAction(gratitudeEntry, 'gratitude_tagged', 'wellbeing_tracking');
        break;

      case 'private':
        // Make private/archive
        const privateEntry = { 
          tags: [...(entry.tags || []), 'private'],
          collection: 'custom' as const
        };
        updateEntry(entry.id, privateEntry);
        Alert.alert('Made Private', `"${entry.content}" is now private`);
        
        // Track privacy action for BuJo Pro security
        await trackEntryAction(privateEntry, 'made_private', 'privacy_protection');
        break;

      case 'collection':
        // Add to collection - would open collection picker
        if (navigation) {
          navigation.navigate('CollectionPicker', { entryId: entry.id });
        }
        
        // Track collection assignment initiation
        await trackEntryAction({}, 'collection_assignment_initiated', 'organization_action');
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