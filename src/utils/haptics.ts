import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback utility for paper journal-style interactions
 * Provides tactile feedback that matches the analog experience
 */

export const HapticPatterns = {
  // Light tap - like pen touching paper
  PEN_TAP: () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },

  // Medium tap - like completing a task with checkmark
  CHECKMARK: () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },

  // Success - like closing a notebook or saving
  SUCCESS: () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },

  // Error - like pen running out of ink
  ERROR: () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },

  // Warning - like erasing something
  WARNING: () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  },

  // Page turn - like flipping a page
  PAGE_TURN: () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },

  // Button press - like pressing a stamp
  BUTTON_PRESS: () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },

  // Selection - like highlighting text
  SELECTION: () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
  },

  // Swipe action - like drawing a line
  SWIPE_ACTION: () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }
};

/**
 * Check if haptic feedback is enabled in settings
 * This will be connected to user preferences later
 */
let hapticFeedbackEnabled = true;

export const setHapticEnabled = (enabled: boolean) => {
  hapticFeedbackEnabled = enabled;
};

export const isHapticEnabled = () => hapticFeedbackEnabled;

/**
 * Safe haptic feedback - only triggers if enabled
 */
export const haptic = {
  penTap: () => hapticFeedbackEnabled && HapticPatterns.PEN_TAP(),
  checkmark: () => hapticFeedbackEnabled && HapticPatterns.CHECKMARK(),
  success: () => hapticFeedbackEnabled && HapticPatterns.SUCCESS(),
  error: () => hapticFeedbackEnabled && HapticPatterns.ERROR(),
  warning: () => hapticFeedbackEnabled && HapticPatterns.WARNING(),
  pageTurn: () => hapticFeedbackEnabled && HapticPatterns.PAGE_TURN(),
  buttonPress: () => hapticFeedbackEnabled && HapticPatterns.BUTTON_PRESS(),
  selection: () => hapticFeedbackEnabled && HapticPatterns.SELECTION(),
  swipeAction: () => hapticFeedbackEnabled && HapticPatterns.SWIPE_ACTION(),
};