import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, Platform } from 'react-native';
import { useTheme } from '../../theme';
import { PAPER_DESIGN_TOKENS } from '../../theme/paperDesignTokens';
import { safeThemeAccess } from '../../theme/paperStyleUtils';
import { BuJoEntry } from '../../types/BuJo';

export interface BuJoSymbolProps {
  type: BuJoEntry['type'];
  status?: BuJoEntry['status'];
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle | TextStyle;
}

/**
 * Paper-themed BuJo symbols that look hand-drawn with ink
 * Each symbol mimics authentic bullet journal notation
 */
export const BuJoSymbol: React.FC<BuJoSymbolProps> = ({
  type,
  status,
  size = 'md',
  style,
}) => {
  const { theme } = useTheme();

  // Get symbol configuration based on type and status
  const getSymbolConfig = () => {
    // Use paper-themed BuJo colors from theme
    const colors = {
      task: safeThemeAccess(theme, t => t.colors.bujo?.task, '#2B2B2B'),
      taskComplete: safeThemeAccess(theme, t => t.colors.bujo?.taskComplete, '#15803D'),
      taskMigrated: safeThemeAccess(theme, t => t.colors.bujo?.taskMigrated, '#D97706'),
      taskScheduled: safeThemeAccess(theme, t => t.colors.bujo?.taskScheduled, '#1E40AF'),
      taskCancelled: safeThemeAccess(theme, t => t.colors.bujo?.taskCancelled, '#9CA3AF'),
      event: safeThemeAccess(theme, t => t.colors.bujo?.event, '#0F2A44'),
      note: safeThemeAccess(theme, t => t.colors.bujo?.note, '#6B7280'),
      inspiration: safeThemeAccess(theme, t => t.colors.bujo?.inspiration, '#EAB308'),
      research: safeThemeAccess(theme, t => t.colors.bujo?.research, '#7C3AED'),
      memory: safeThemeAccess(theme, t => t.colors.bujo?.memory, '#BE185D'),
    };

    switch (type) {
      case 'task':
        switch (status) {
          case 'complete':
            return { 
              symbol: '✗', 
              color: colors.taskComplete,
              description: 'Completed',
              style: 'bold', // Strong ink mark
            };
          case 'migrated':
            return { 
              symbol: '>', 
              color: colors.taskMigrated,
              description: 'Migrated',
              style: 'regular',
            };
          case 'scheduled':
            return { 
              symbol: '<', 
              color: colors.taskScheduled,
              description: 'Scheduled',
              style: 'regular',
            };
          case 'cancelled':
            return { 
              symbol: '—', // Strikethrough-like dash
              color: colors.taskCancelled,
              description: 'Cancelled',
              style: 'light',
              rotation: -15, // Slight angle like a strike
            };
          default: // incomplete
            return { 
              symbol: '•', 
              color: colors.task,
              description: 'Task',
              style: 'regular',
            };
        }
      case 'event':
        return { 
          symbol: '○', 
          color: colors.event,
          description: 'Event',
          style: 'regular',
        };
      case 'note':
        return { 
          symbol: '–', // En dash for notes
          color: colors.note,
          description: 'Note',
          style: 'light',
        };
      case 'inspiration':
        return { 
          symbol: '!', // Exclamation for inspiration
          color: colors.inspiration,
          description: 'Inspiration',
          style: 'bold',
        };
      case 'research':
        return { 
          symbol: '?', // Question mark for research
          color: colors.research,
          description: 'Research',
          style: 'regular',
        };
      case 'memory':
        return { 
          symbol: '◇', // Diamond for memories
          color: colors.memory,
          description: 'Memory',
          style: 'regular',
        };
      case 'custom':
        return { 
          symbol: '◆', 
          color: colors.note,
          description: 'Custom',
          style: 'regular',
        };
      default:
        return { 
          symbol: '•', 
          color: colors.task,
          description: 'Entry',
          style: 'regular',
        };
    }
  };

  const config = getSymbolConfig();
  
  // Size configurations
  const sizeStyles = {
    sm: {
      fontSize: 14,
      width: 20,
      height: 20,
    },
    md: {
      fontSize: 18,
      width: 24,
      height: 24,
    },
    lg: {
      fontSize: 24,
      width: 32,
      height: 32,
    },
  };

  // Font weight based on ink style
  const getFontWeight = (): TextStyle['fontWeight'] => {
    switch (config.style) {
      case 'bold': return '700';
      case 'light': return '300';
      default: return '500';
    }
  };

  return (
    <View 
      style={[
        styles.symbolContainer,
        sizeStyles[size],
        style,
      ]}
    >
      <Text
        style={[
          styles.symbol,
          {
            fontSize: sizeStyles[size].fontSize,
            color: config.color,
            fontWeight: getFontWeight(),
            transform: config.rotation ? [{ rotate: `${config.rotation}deg` }] : undefined,
            // Ink-like text shadow for depth
            textShadowColor: theme.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
            textShadowOffset: { width: 0.5, height: 0.5 },
            textShadowRadius: 0.5,
          },
        ]}
      >
        {config.symbol}
      </Text>
    </View>
  );
};

/**
 * Legend component showing all BuJo symbols with descriptions
 * Useful for guide screens or help sections
 */
export const BuJoSymbolLegend: React.FC = () => {
  const { theme } = useTheme();
  
  const symbols = [
    { type: 'task' as const, status: undefined, label: 'Task' },
    { type: 'task' as const, status: 'complete' as const, label: 'Completed' },
    { type: 'task' as const, status: 'migrated' as const, label: 'Migrated' },
    { type: 'task' as const, status: 'scheduled' as const, label: 'Scheduled' },
    { type: 'task' as const, status: 'cancelled' as const, label: 'Cancelled' },
    { type: 'event' as const, status: undefined, label: 'Event' },
    { type: 'note' as const, status: undefined, label: 'Note' },
    { type: 'inspiration' as const, status: undefined, label: 'Inspiration' },
    { type: 'research' as const, status: undefined, label: 'Research' },
    { type: 'memory' as const, status: undefined, label: 'Memory' },
  ];

  return (
    <View style={styles.legendContainer}>
      {symbols.map((item, index) => (
        <View key={index} style={styles.legendItem}>
          <BuJoSymbol type={item.type} status={item.status} size="md" />
          <Text style={[
            styles.legendLabel,
            { color: safeThemeAccess(theme, t => t.colors.textSecondary, '#6B7280') }
          ]}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  symbolContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    textAlign: 'center',
    // Slight font variation for organic feel
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'System',
    }),
  },
  legendContainer: {
    padding: PAPER_DESIGN_TOKENS.spacing.xl,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.lg,
  },
  legendLabel: {
    marginLeft: PAPER_DESIGN_TOKENS.spacing.lg,
    fontSize: 16,
    letterSpacing: 0.3,
  },
});