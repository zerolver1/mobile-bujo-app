import { BuJoEntry } from '../types/BuJo';

export interface SwipeAction {
  key: string;
  label: string;
  icon: string;
  color: string;
  backgroundColor: string;
  threshold: number; // pixels
  action: 'complete' | 'migrate' | 'schedule' | 'cancel' | 'edit' | 'convert' | 'archive' | 'share' | 'delete' | 'calendar' | 'reminder' | 'investigate' | 'defer' | 'photo' | 'gratitude' | 'private' | 'collection';
  requiresInput?: boolean; // For actions that need date picker, etc.
}

export interface SwipeConfig {
  leftShort?: SwipeAction;
  leftLong?: SwipeAction;
  rightShort?: SwipeAction;
  rightLong?: SwipeAction;
}

// Threshold distances for swipe actions
export const SWIPE_THRESHOLDS = {
  SHORT: 75,
  LONG: 150,
  MAX: 200,
};

// Color palette for swipe actions
export const SWIPE_COLORS = {
  complete: { bg: '#34C759', text: '#FFFFFF' },
  migrate: { bg: '#FF9500', text: '#FFFFFF' },
  schedule: { bg: '#007AFF', text: '#FFFFFF' },
  cancel: { bg: '#FF3B30', text: '#FFFFFF' },
  archive: { bg: '#8E8E93', text: '#FFFFFF' },
  convert: { bg: '#5856D6', text: '#FFFFFF' },
  share: { bg: '#32D74B', text: '#FFFFFF' },
  delete: { bg: '#FF453A', text: '#FFFFFF' },
  calendar: { bg: '#007AFF', text: '#FFFFFF' },
  reminder: { bg: '#AF52DE', text: '#FFFFFF' },
  investigate: { bg: '#34C759', text: '#FFFFFF' },
  defer: { bg: '#FF9500', text: '#FFFFFF' },
  photo: { bg: '#FF2D55', text: '#FFFFFF' },
  gratitude: { bg: '#FFD60A', text: '#000000' },
  private: { bg: '#8E8E93', text: '#FFFFFF' },
  collection: { bg: '#FFD60A', text: '#000000' },
};

// Get swipe configuration based on entry type and status
export const getSwipeConfig = (entry: BuJoEntry): SwipeConfig => {
  const config: SwipeConfig = {};

  switch (entry.type) {
    case 'task':
      if (entry.status === 'incomplete') {
        config.leftShort = {
          key: 'complete',
          label: 'Complete',
          icon: 'checkmark-circle',
          color: SWIPE_COLORS.complete.text,
          backgroundColor: SWIPE_COLORS.complete.bg,
          threshold: SWIPE_THRESHOLDS.SHORT,
          action: 'complete',
        };
        config.leftLong = {
          key: 'migrate',
          label: 'Migrate',
          icon: 'arrow-forward-circle',
          color: SWIPE_COLORS.migrate.text,
          backgroundColor: SWIPE_COLORS.migrate.bg,
          threshold: SWIPE_THRESHOLDS.LONG,
          action: 'migrate',
          requiresInput: true,
        };
        config.rightShort = {
          key: 'schedule',
          label: 'Schedule',
          icon: 'calendar',
          color: SWIPE_COLORS.schedule.text,
          backgroundColor: SWIPE_COLORS.schedule.bg,
          threshold: SWIPE_THRESHOLDS.SHORT,
          action: 'schedule',
          requiresInput: true,
        };
        config.rightLong = {
          key: 'cancel',
          label: 'Cancel',
          icon: 'close-circle',
          color: SWIPE_COLORS.cancel.text,
          backgroundColor: SWIPE_COLORS.cancel.bg,
          threshold: SWIPE_THRESHOLDS.LONG,
          action: 'cancel',
        };
      } else if (entry.status === 'complete') {
        // Completed tasks can be uncompleted or deleted
        config.leftShort = {
          key: 'incomplete',
          label: 'Uncomplete',
          icon: 'radio-button-off',
          color: SWIPE_COLORS.migrate.text,
          backgroundColor: SWIPE_COLORS.migrate.bg,
          threshold: SWIPE_THRESHOLDS.SHORT,
          action: 'edit',
        };
        config.rightShort = {
          key: 'delete',
          label: 'Delete',
          icon: 'trash',
          color: SWIPE_COLORS.delete.text,
          backgroundColor: SWIPE_COLORS.delete.bg,
          threshold: SWIPE_THRESHOLDS.SHORT,
          action: 'delete',
        };
      }
      break;

    case 'event':
      config.leftShort = {
        key: 'calendar',
        label: 'Add to Calendar',
        icon: 'calendar-outline',
        color: SWIPE_COLORS.calendar.text,
        backgroundColor: SWIPE_COLORS.calendar.bg,
        threshold: SWIPE_THRESHOLDS.SHORT,
        action: 'calendar',
      };
      config.leftLong = {
        key: 'attended',
        label: 'Mark Attended',
        icon: 'checkmark-done',
        color: SWIPE_COLORS.complete.text,
        backgroundColor: SWIPE_COLORS.complete.bg,
        threshold: SWIPE_THRESHOLDS.LONG,
        action: 'complete', // This will set status but not violate BuJo
      };
      config.rightShort = {
        key: 'reminder',
        label: 'Set Reminder',
        icon: 'alarm',
        color: SWIPE_COLORS.reminder.text,
        backgroundColor: SWIPE_COLORS.reminder.bg,
        threshold: SWIPE_THRESHOLDS.SHORT,
        action: 'reminder',
        requiresInput: true,
      };
      config.rightLong = {
        key: 'cancel',
        label: 'Cancel Event',
        icon: 'close-circle',
        color: SWIPE_COLORS.cancel.text,
        backgroundColor: SWIPE_COLORS.cancel.bg,
        threshold: SWIPE_THRESHOLDS.LONG,
        action: 'cancel',
      };
      break;

    case 'note':
      config.leftShort = {
        key: 'convert',
        label: 'Convert to Task',
        icon: 'swap-horizontal',
        color: SWIPE_COLORS.convert.text,
        backgroundColor: SWIPE_COLORS.convert.bg,
        threshold: SWIPE_THRESHOLDS.SHORT,
        action: 'convert',
      };
      config.leftLong = {
        key: 'archive',
        label: 'Archive',
        icon: 'archive',
        color: SWIPE_COLORS.archive.text,
        backgroundColor: SWIPE_COLORS.archive.bg,
        threshold: SWIPE_THRESHOLDS.LONG,
        action: 'archive',
      };
      config.rightShort = {
        key: 'share',
        label: 'Share',
        icon: 'share-outline',
        color: SWIPE_COLORS.share.text,
        backgroundColor: SWIPE_COLORS.share.bg,
        threshold: SWIPE_THRESHOLDS.SHORT,
        action: 'share',
      };
      config.rightLong = {
        key: 'delete',
        label: 'Delete',
        icon: 'trash',
        color: SWIPE_COLORS.delete.text,
        backgroundColor: SWIPE_COLORS.delete.bg,
        threshold: SWIPE_THRESHOLDS.LONG,
        action: 'delete',
      };
      break;

    case 'inspiration':
      config.leftShort = {
        key: 'research',
        label: 'To Research',
        icon: 'search',
        color: SWIPE_COLORS.convert.text,
        backgroundColor: SWIPE_COLORS.convert.bg,
        threshold: SWIPE_THRESHOLDS.SHORT,
        action: 'convert',
      };
      config.leftLong = {
        key: 'task',
        label: 'To Task',
        icon: 'create',
        color: SWIPE_COLORS.schedule.text,
        backgroundColor: SWIPE_COLORS.schedule.bg,
        threshold: SWIPE_THRESHOLDS.LONG,
        action: 'convert',
      };
      config.rightShort = {
        key: 'collection',
        label: 'Add to Collection',
        icon: 'folder-open',
        color: SWIPE_COLORS.collection.text,
        backgroundColor: SWIPE_COLORS.collection.bg,
        threshold: SWIPE_THRESHOLDS.SHORT,
        action: 'collection',
        requiresInput: true,
      };
      config.rightLong = {
        key: 'archive',
        label: 'Archive',
        icon: 'archive',
        color: SWIPE_COLORS.archive.text,
        backgroundColor: SWIPE_COLORS.archive.bg,
        threshold: SWIPE_THRESHOLDS.LONG,
        action: 'archive',
      };
      break;

    case 'research':
      config.leftShort = {
        key: 'investigate',
        label: 'Investigated',
        icon: 'checkmark-done',
        color: SWIPE_COLORS.investigate.text,
        backgroundColor: SWIPE_COLORS.investigate.bg,
        threshold: SWIPE_THRESHOLDS.SHORT,
        action: 'investigate',
      };
      config.leftLong = {
        key: 'task',
        label: 'To Task',
        icon: 'create',
        color: SWIPE_COLORS.schedule.text,
        backgroundColor: SWIPE_COLORS.schedule.bg,
        threshold: SWIPE_THRESHOLDS.LONG,
        action: 'convert',
      };
      config.rightShort = {
        key: 'resources',
        label: 'Add Resources',
        icon: 'link',
        color: SWIPE_COLORS.reminder.text,
        backgroundColor: SWIPE_COLORS.reminder.bg,
        threshold: SWIPE_THRESHOLDS.SHORT,
        action: 'edit',
      };
      config.rightLong = {
        key: 'defer',
        label: 'Defer',
        icon: 'time',
        color: SWIPE_COLORS.defer.text,
        backgroundColor: SWIPE_COLORS.defer.bg,
        threshold: SWIPE_THRESHOLDS.LONG,
        action: 'defer',
        requiresInput: true,
      };
      break;

    case 'memory':
      config.leftShort = {
        key: 'photo',
        label: 'Add Photo',
        icon: 'camera',
        color: SWIPE_COLORS.photo.text,
        backgroundColor: SWIPE_COLORS.photo.bg,
        threshold: SWIPE_THRESHOLDS.SHORT,
        action: 'photo',
      };
      config.leftLong = {
        key: 'gratitude',
        label: 'Gratitude Log',
        icon: 'heart',
        color: SWIPE_COLORS.gratitude.text,
        backgroundColor: SWIPE_COLORS.gratitude.bg,
        threshold: SWIPE_THRESHOLDS.LONG,
        action: 'gratitude',
      };
      config.rightShort = {
        key: 'share',
        label: 'Share Memory',
        icon: 'share-social',
        color: SWIPE_COLORS.share.text,
        backgroundColor: SWIPE_COLORS.share.bg,
        threshold: SWIPE_THRESHOLDS.SHORT,
        action: 'share',
      };
      config.rightLong = {
        key: 'private',
        label: 'Make Private',
        icon: 'lock-closed',
        color: SWIPE_COLORS.private.text,
        backgroundColor: SWIPE_COLORS.private.bg,
        threshold: SWIPE_THRESHOLDS.LONG,
        action: 'private',
      };
      break;

    default:
      // Default actions for custom entries
      config.leftShort = {
        key: 'edit',
        label: 'Edit',
        icon: 'create',
        color: '#FFFFFF',
        backgroundColor: '#007AFF',
        threshold: SWIPE_THRESHOLDS.SHORT,
        action: 'edit',
      };
      config.rightShort = {
        key: 'delete',
        label: 'Delete',
        icon: 'trash',
        color: SWIPE_COLORS.delete.text,
        backgroundColor: SWIPE_COLORS.delete.bg,
        threshold: SWIPE_THRESHOLDS.SHORT,
        action: 'delete',
      };
      break;
  }

  return config;
};

// Helper to get action color based on swipe distance
export const getSwipeBackgroundColor = (
  distance: number,
  config: SwipeConfig,
  direction: 'left' | 'right'
): string => {
  const absDistance = Math.abs(distance);
  
  if (direction === 'left' && distance > 0) {
    if (config.leftLong && absDistance >= config.leftLong.threshold) {
      return config.leftLong.backgroundColor;
    }
    if (config.leftShort && absDistance >= config.leftShort.threshold) {
      return config.leftShort.backgroundColor;
    }
  } else if (direction === 'right' && distance < 0) {
    if (config.rightLong && absDistance >= config.rightLong.threshold) {
      return config.rightLong.backgroundColor;
    }
    if (config.rightShort && absDistance >= config.rightShort.threshold) {
      return config.rightShort.backgroundColor;
    }
  }
  
  return '#F2F2F7'; // Default gray
};

// Helper to get current action based on swipe distance
export const getCurrentAction = (
  distance: number,
  config: SwipeConfig
): SwipeAction | null => {
  const absDistance = Math.abs(distance);
  
  if (distance > 0) {
    // Swiping left to right
    if (config.leftLong && absDistance >= config.leftLong.threshold) {
      return config.leftLong;
    }
    if (config.leftShort && absDistance >= config.leftShort.threshold) {
      return config.leftShort;
    }
  } else if (distance < 0) {
    // Swiping right to left
    if (config.rightLong && absDistance >= config.rightLong.threshold) {
      return config.rightLong;
    }
    if (config.rightShort && absDistance >= config.rightShort.threshold) {
      return config.rightShort;
    }
  }
  
  return null;
};