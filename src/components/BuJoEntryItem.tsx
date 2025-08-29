import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BuJoEntry } from '../types/BuJo';

interface BuJoEntryItemProps {
  entry: BuJoEntry;
  onPress: (entry: BuJoEntry, action: 'complete' | 'migrate' | 'schedule' | 'cancel' | 'edit') => void;
  showDate?: boolean;
  isCompact?: boolean;
}

export const BuJoEntryItem: React.FC<BuJoEntryItemProps> = ({ 
  entry, 
  onPress, 
  showDate = false,
  isCompact = false 
}) => {
  
  const getBulletSymbol = () => {
    switch (entry.type) {
      case 'task':
        switch (entry.status) {
          case 'complete':
            return { symbol: '✗', color: '#34C759', description: 'Task Complete' };
          case 'migrated':
            return { symbol: '>', color: '#FF9500', description: 'Task Migrated' };
          case 'scheduled':
            return { symbol: '<', color: '#007AFF', description: 'Task Scheduled' };
          case 'cancelled':
            return { symbol: '/', color: '#8E8E93', description: 'Task Cancelled' };
          default: // incomplete
            return { symbol: '•', color: '#1C1C1E', description: 'Task' };
        }
      case 'event':
        return { symbol: '○', color: '#007AFF', description: 'Event' };
      case 'note':
        return { symbol: '—', color: '#8E8E93', description: 'Note' };
      case 'inspiration':
        return { symbol: '★', color: '#FFD60A', description: 'Inspiration' };
      case 'research':
        return { symbol: '&', color: '#5856D6', description: 'Research' };
      case 'memory':
        return { symbol: '◇', color: '#FF2D55', description: 'Memory' };
      case 'custom':
        // TODO: Fetch custom signifier from store
        return { symbol: '◆', color: '#8E8E93', description: 'Custom' };
      default:
        return { symbol: '•', color: '#1C1C1E', description: 'Entry' };
    }
  };

  const getPriorityIndicator = () => {
    switch (entry.priority) {
      case 'high':
        return { symbol: '!', color: '#FF3B30' };
      case 'medium':
        return { symbol: '*', color: '#FF9500' };
      case 'low':
        return { symbol: '∘', color: '#34C759' };
      default:
        return null;
    }
  };

  const handlePress = () => {
    if (entry.type === 'task' && entry.status === 'incomplete') {
      // Show action sheet for tasks
      Alert.alert(
        'Update Task',
        `What would you like to do with "${entry.content.substring(0, 30)}${entry.content.length > 30 ? '...' : ''}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Complete ✗', onPress: () => onPress(entry, 'complete') },
          { text: 'Migrate >', onPress: () => onPress(entry, 'migrate') },
          { text: 'Schedule <', onPress: () => onPress(entry, 'schedule') },
          { text: 'Cancel /', onPress: () => onPress(entry, 'cancel'), style: 'destructive' },
          { text: 'Edit', onPress: () => onPress(entry, 'edit') }
        ]
      );
    } else {
      onPress(entry, 'edit');
    }
  };

  const bullet = getBulletSymbol();
  const priority = getPriorityIndicator();
  const isCompleted = entry.status === 'complete';
  const isCancelled = entry.status === 'cancelled';
  const isInactive = isCompleted || isCancelled;

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        isCompact && styles.compactContainer,
        isInactive && styles.inactiveContainer
      ]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Bullet Point */}
      <View style={styles.bulletContainer}>
        <Text 
          style={[
            styles.bullet, 
            { color: bullet.color },
            isInactive && styles.inactiveBullet
          ]}
          accessibilityLabel={bullet.description}
        >
          {bullet.symbol}
        </Text>
        {priority && (
          <Text 
            style={[
              styles.priority, 
              { color: priority.color },
              isInactive && styles.inactivePriority
            ]}
          >
            {priority.symbol}
          </Text>
        )}
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <Text 
          style={[
            styles.content,
            isCompleted && styles.completedText,
            isCancelled && styles.cancelledText,
            isCompact && styles.compactText
          ]}
        >
          {entry.content}
        </Text>

        {/* Tags and Contexts */}
        {(entry.tags.length > 0 || entry.contexts.length > 0) && !isCompact && (
          <View style={styles.metadataContainer}>
            {entry.contexts.map((context, index) => (
              <Text key={`context-${index}`} style={[styles.context, isInactive && styles.inactiveMetadata]}>
                @{context}
              </Text>
            ))}
            {entry.tags.map((tag, index) => (
              <Text key={`tag-${index}`} style={[styles.tag, isInactive && styles.inactiveMetadata]}>
                #{tag}
              </Text>
            ))}
          </View>
        )}

        {/* Date and Status Info */}
        {(showDate || entry.dueDate || entry.scheduledDate) && !isCompact && (
          <View style={styles.dateContainer}>
            {showDate && (
              <Text style={[styles.dateText, isInactive && styles.inactiveMetadata]}>
                {new Date(entry.collectionDate).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Text>
            )}
            {entry.dueDate && (
              <Text style={[styles.dueDateText, isInactive && styles.inactiveMetadata]}>
                Due: {new Date(entry.dueDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Text>
            )}
            {entry.scheduledDate && entry.status === 'scheduled' && (
              <Text style={[styles.scheduledText, isInactive && styles.inactiveMetadata]}>
                Scheduled: {new Date(entry.scheduledDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Status Indicator */}
      {entry.type === 'task' && entry.status !== 'incomplete' && !isCompact && (
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, { color: bullet.color }]}>
            {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  compactContainer: {
    padding: 12,
    marginBottom: 4,
    marginHorizontal: 0,
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  inactiveContainer: {
    opacity: 0.6,
  },
  bulletContainer: {
    width: 32,
    alignItems: 'flex-start',
    paddingTop: 2,
    marginRight: 12,
  },
  bullet: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Menlo', // Monospace for consistent bullet alignment
  },
  inactiveBullet: {
    opacity: 0.7,
  },
  priority: {
    fontSize: 12,
    fontWeight: '700',
    position: 'absolute',
    top: -2,
    right: -4,
  },
  inactivePriority: {
    opacity: 0.7,
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 22,
    fontWeight: '400',
  },
  compactText: {
    fontSize: 15,
    lineHeight: 20,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  cancelledText: {
    textDecorationLine: 'line-through',
    color: '#C7C7CC',
  },
  metadataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  context: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tag: {
    fontSize: 13,
    color: '#FF9500',
    fontWeight: '500',
    backgroundColor: '#FFF7E6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveMetadata: {
    opacity: 0.6,
  },
  dateContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  dueDateText: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '500',
  },
  scheduledText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingTop: 2,
    minWidth: 80,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});