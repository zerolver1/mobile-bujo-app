import React from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BuJoEntry } from '../types/BuJo';
import { BuJoSymbol } from './ui/BuJoSymbols';
import { Typography } from './ui/Typography';
import { NotebookCard } from './ui/NotebookCard';
import { useTheme } from '../theme';
import { PAPER_DESIGN_TOKENS } from '../theme/paperDesignTokens';
import { safeThemeAccess } from '../theme/paperStyleUtils';

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
  const { theme } = useTheme();
  
  const getPriorityIndicator = () => {
    if (!entry.priority || entry.priority === 'normal') return null;
    
    const priorityConfig = {
      high: { 
        symbol: '!', 
        color: safeThemeAccess(theme, t => t.colors.bujo?.inspiration, '#EAB308'), // Golden ink
        description: 'High Priority' 
      },
      low: { 
        symbol: '↓', 
        color: safeThemeAccess(theme, t => t.colors.textTertiary, '#9CA3AF'), 
        description: 'Low Priority' 
      }
    };
    
    return priorityConfig[entry.priority];
  };

  const handlePress = () => {
    if (entry.type === 'task' && entry.status !== 'complete' && entry.status !== 'cancelled') {
      Alert.alert(
        'Update Task',
        `What would you like to do with "${entry.content.substring(0, 30)}${entry.content.length > 30 ? '...' : ''}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Complete ✗', onPress: () => onPress(entry, 'complete') },
          { text: 'Migrate >', onPress: () => onPress(entry, 'migrate') },
          { text: 'Schedule <', onPress: () => onPress(entry, 'schedule') },
          { text: 'Cancel Task', onPress: () => onPress(entry, 'cancel'), style: 'destructive' },
          { text: 'Edit', onPress: () => onPress(entry, 'edit') }
        ]
      );
    } else {
      onPress(entry, 'edit');
    }
  };

  const handleActionPress = () => {
    if (entry.type === 'task') {
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

  const priority = getPriorityIndicator();
  const isCompleted = entry.status === 'complete';
  const isCancelled = entry.status === 'cancelled';
  const isInactive = isCompleted || isCancelled;

  return (
    <NotebookCard 
      variant="page" 
      showHoles={false}
      style={[
        styles.container, 
        isCompact && styles.compactContainer,
        isInactive && styles.inactiveContainer
      ]}
    >
      <TouchableOpacity 
        style={styles.touchable}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {/* Bullet Symbol with ink style */}
        <View style={styles.bulletContainer}>
          <BuJoSymbol 
            type={entry.type} 
            status={entry.status} 
            size={isCompact ? 'sm' : 'md'}
          />
          {priority && (
            <Typography 
              variant="caption2" 
              style={[
                styles.priority,
                { color: priority.color }
              ]}
            >
              {priority.symbol}
            </Typography>
          )}
        </View>
        
        {/* Content with handwritten feel */}
        <View style={styles.contentContainer}>
          <Typography 
            variant={isCompact ? 'footnote' : 'body'}
            style={[
              styles.content, 
              isCompleted && styles.completedText,
              isCancelled && styles.cancelledText,
              { 
                color: isInactive
                  ? safeThemeAccess(theme, t => t.colors.textTertiary, '#9CA3AF')
                  : safeThemeAccess(theme, t => t.colors.text, '#2B2B2B')
              }
            ]}
            numberOfLines={isCompact ? 1 : undefined}
          >
            {entry.content}
          </Typography>

          {/* Tags and Contexts with ink colors */}
          {(entry.tags.length > 0 || entry.contexts.length > 0) && !isCompact && (
            <View style={styles.metadataContainer}>
              {entry.contexts.map((context, index) => (
                <Typography 
                  key={`context-${index}`} 
                  variant="caption2"
                  style={[
                    styles.context, 
                    { 
                      color: safeThemeAccess(theme, t => t.colors.bujo?.research, '#7C3AED') // Purple ink
                    }
                  ]}
                >
                  @{context}
                </Typography>
              ))}
              {entry.tags.map((tag, index) => (
                <Typography 
                  key={`tag-${index}`} 
                  variant="caption2"
                  style={[
                    styles.tag,
                    { 
                      color: safeThemeAccess(theme, t => t.colors.bujo?.event, '#0F2A44') // Fountain pen blue
                    }
                  ]}
                >
                  #{tag}
                </Typography>
              ))}
            </View>
          )}

          {/* Date information with notebook style */}
          {(showDate || entry.dueDate || entry.scheduledDate) && !isCompact && (
            <View style={styles.dateContainer}>
              {showDate && (
                <Typography 
                  variant="caption2" 
                  color="textSecondary"
                  style={styles.dateText}
                >
                  {new Date(entry.collectionDate).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Typography>
              )}
              {entry.dueDate && (
                <View style={styles.dueDateContainer}>
                  <Ionicons 
                    name="alarm-outline" 
                    size={12} 
                    color={safeThemeAccess(theme, t => t.colors.warning, '#D97706')} 
                  />
                  <Typography 
                    variant="caption2"
                    style={[
                      styles.dueDate,
                      { color: safeThemeAccess(theme, t => t.colors.warning, '#D97706') }
                    ]}
                  >
                    Due {new Date(entry.dueDate).toLocaleDateString()}
                  </Typography>
                </View>
              )}
              {entry.scheduledDate && (
                <View style={styles.scheduledDateContainer}>
                  <Ionicons 
                    name="calendar-outline" 
                    size={12} 
                    color={safeThemeAccess(theme, t => t.colors.bujo?.taskScheduled, '#1E40AF')} 
                  />
                  <Typography 
                    variant="caption2"
                    style={[
                      styles.scheduledDate,
                      { color: safeThemeAccess(theme, t => t.colors.bujo?.taskScheduled, '#1E40AF') }
                    ]}
                  >
                    {new Date(entry.scheduledDate).toLocaleDateString()}
                  </Typography>
                </View>
              )}
            </View>
          )}

          {/* Migration info */}
          {entry.status === 'migrated' && entry.migratedTo && (
            <Typography 
              variant="caption2"
              style={[
                styles.migrationText,
                { color: safeThemeAccess(theme, t => t.colors.bujo?.taskMigrated, '#D97706') }
              ]}
            >
              → {new Date(entry.migratedTo).toLocaleDateString()}
            </Typography>
          )}
        </View>
        
        {/* Action button for tasks */}
        {entry.type === 'task' && entry.status !== 'complete' && entry.status !== 'cancelled' && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleActionPress}
          >
            <Ionicons 
              name="ellipsis-horizontal" 
              size={20} 
              color={safeThemeAccess(theme, t => t.colors.textSecondary, '#6B7280')} 
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </NotebookCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
    marginVertical: PAPER_DESIGN_TOKENS.spacing.sm,
  },
  touchable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  compactContainer: {
    marginVertical: PAPER_DESIGN_TOKENS.spacing.xs,
  },
  inactiveContainer: {
    opacity: 0.7,
  },
  bulletContainer: {
    marginRight: PAPER_DESIGN_TOKENS.spacing.lg,
    paddingTop: PAPER_DESIGN_TOKENS.spacing.xs,
    alignItems: 'center',
    position: 'relative',
  },
  priority: {
    position: 'absolute',
    top: -4,
    right: -8,
    fontWeight: '700',
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    lineHeight: 22,
    letterSpacing: 0.3, // Handwritten feel
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.8,
  },
  cancelledText: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  metadataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: PAPER_DESIGN_TOKENS.spacing.sm,
    gap: PAPER_DESIGN_TOKENS.spacing.md,
  },
  context: {
    fontStyle: 'italic', // Handwritten emphasis
  },
  tag: {
    fontWeight: '500',
  },
  dateContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: PAPER_DESIGN_TOKENS.spacing.sm,
    gap: PAPER_DESIGN_TOKENS.spacing.lg,
  },
  dateText: {
    letterSpacing: 0.2,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PAPER_DESIGN_TOKENS.spacing.sm,
  },
  dueDate: {
    fontWeight: '500',
  },
  scheduledDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PAPER_DESIGN_TOKENS.spacing.sm,
  },
  scheduledDate: {
    fontStyle: 'italic',
  },
  migrationText: {
    marginTop: PAPER_DESIGN_TOKENS.spacing.xs,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  actionButton: {
    padding: PAPER_DESIGN_TOKENS.spacing.md,
  },
});