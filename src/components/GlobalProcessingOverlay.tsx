import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useProcessingStore } from '../stores/ProcessingStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const GlobalProcessingOverlay: React.FC = () => {
  const {
    isOverlayVisible,
    isOverlayExpanded,
    getCurrentTask,
    hasActiveTasks,
    getTaskCount,
    hideOverlay,
    expandOverlay,
    collapseOverlay,
    clearTask,
  } = useProcessingStore();

  const currentTask = getCurrentTask();
  const taskCount = getTaskCount();
  const insets = useSafeAreaInsets();

  // Don't render if no active tasks
  if (!hasActiveTasks() || !isOverlayVisible) {
    return null;
  }

  const handleOverlayPress = () => {
    if (isOverlayExpanded) {
      collapseOverlay();
    }
  };

  const handleCardPress = () => {
    if (!isOverlayExpanded) {
      expandOverlay();
    }
  };

  const handleDismiss = () => {
    if (currentTask?.canNavigate) {
      hideOverlay();
    }
  };

  const handleClearTask = () => {
    if (currentTask) {
      clearTask(currentTask.id);
    }
  };

  const getServiceDisplayName = (serviceName?: string) => {
    switch (serviceName) {
      case 'gpt-vision':
        return 'High Accuracy AI';
      case 'mistral':
        return 'Fast AI Processing';
      case 'ocr-space':
        return 'Standard OCR';
      default:
        return 'Smart Processing';
    }
  };

  const getProgressColor = (progress: number, hasError: boolean) => {
    if (hasError) return '#FF3B30'; // Red for errors
    if (progress >= 100) return '#34C759'; // Green for complete
    if (progress >= 75) return '#30D158'; // Light green for high progress
    if (progress >= 50) return '#007AFF'; // Blue for medium progress
    return '#FF9500'; // Orange for low progress
  };

  if (!currentTask) return null;

  return (
    <View style={styles.absoluteOverlay} pointerEvents="box-none">
      {/* Compact/Expanded Processing Card */}
      <View 
        style={[
          styles.processingContainer,
          { top: insets.top + 60 }, // Below status bar and nav
          isOverlayExpanded && styles.expandedContainer,
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          onPress={handleCardPress}
          style={styles.processingCard}
          activeOpacity={0.9}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={95} tint="light" style={styles.blurView}>
              <ProcessingContent />
            </BlurView>
          ) : (
            <View style={styles.androidCard}>
              <ProcessingContent />
            </View>
          )}
        </TouchableOpacity>

        {/* Dismiss button - only show if task allows navigation */}
        {currentTask.canNavigate && (
          <TouchableOpacity
            onPress={handleDismiss}
            style={styles.dismissButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={20} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  function ProcessingContent() {
    return (
      <View style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <ActivityIndicator 
              size="small" 
              color={currentTask.error ? '#FF3B30' : '#007AFF'} 
              style={styles.spinner} 
            />
            <View>
              <Text style={styles.taskType}>
                {currentTask.type === 'ocr' ? 'Processing Page' : currentTask.type}
              </Text>
              {taskCount > 1 && (
                <Text style={styles.taskCount}>
                  {taskCount} tasks running
                </Text>
              )}
            </View>
          </View>
          
          {/* Expand/Collapse indicator */}
          <Ionicons 
            name={isOverlayExpanded ? "chevron-up" : "chevron-down"} 
            size={16} 
            color="#8E8E93" 
          />
        </View>

        {/* Expanded Content */}
        {isOverlayExpanded && (
          <>
            {/* Current Stage */}
            <Text style={styles.stage}>{currentTask.stage}</Text>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${currentTask.progress}%`,
                      backgroundColor: getProgressColor(currentTask.progress, !!currentTask.error)
                    }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {currentTask.progress}%
              </Text>
            </View>

            {/* Service Info */}
            {currentTask.serviceName && (
              <Text style={styles.serviceInfo}>
                Using {getServiceDisplayName(currentTask.serviceName)}
              </Text>
            )}

            {/* Error State */}
            {currentTask.error && (
              <View style={styles.errorContainer}>
                <Ionicons name="warning" size={16} color="#FF3B30" />
                <Text style={styles.errorText}>{currentTask.error}</Text>
              </View>
            )}

            {/* Navigation Tip */}
            {currentTask.canNavigate && (
              <Text style={styles.navigationTip}>
                💡 You can navigate freely while processing continues
              </Text>
            )}

            {/* Clear Button for completed/failed tasks */}
            {(currentTask.progress >= 100 || currentTask.error) && (
              <TouchableOpacity
                onPress={handleClearTask}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>
                  {currentTask.error ? 'Dismiss' : 'Done'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    );
  }
};

const styles = StyleSheet.create({
  absoluteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'transparent',
  },
  processingContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  expandedContainer: {
    // Additional space for expanded content
  },
  processingCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  blurView: {
    padding: 16,
  },
  androidCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
  },
  contentContainer: {
    // Container for all content
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  spinner: {
    marginRight: 12,
  },
  taskType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  taskCount: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  stage: {
    fontSize: 14,
    color: '#3C3C43',
    marginTop: 12,
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E5E7',
    borderRadius: 3,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    minWidth: 35,
    textAlign: 'right',
  },
  serviceInfo: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginLeft: 6,
    flex: 1,
  },
  navigationTip: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 16,
  },
  clearButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 8,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    position: 'absolute',
    top: -12,
    right: -12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
});