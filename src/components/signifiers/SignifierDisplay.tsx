import React from 'react';
import {
  View,
  StyleSheet,
  Text,
} from 'react-native';
import { useTheme } from '../../theme';
import { useBuJoStore } from '../../stores/BuJoStore';

interface SignifierDisplayProps {
  signifiers: string[];
  size?: 'sm' | 'md' | 'lg';
  maxVisible?: number;
  showLabels?: boolean;
}

// Built-in signifier mapping
const BUILTIN_SIGNIFIERS: Record<string, { symbol: string; label: string; color?: string }> = {
  '•': { symbol: '•', label: 'Task' },
  '○': { symbol: '○', label: 'Event' },
  '−': { symbol: '−', label: 'Note' },
  '✓': { symbol: '✓', label: 'Complete' },
  '>': { symbol: '>', label: 'Migrated' },
  '<': { symbol: '<', label: 'Scheduled' },
  '⚡': { symbol: '⚡', label: 'Priority' },
  '!': { symbol: '!', label: 'Important' },
  '⭐': { symbol: '⭐', label: 'Inspiration' },
  '👁': { symbol: '👁', label: 'Explore' },
};

export const SignifierDisplay: React.FC<SignifierDisplayProps> = ({
  signifiers,
  size = 'sm',
  maxVisible = 5,
  showLabels = false,
}) => {
  const { theme } = useTheme();
  const { customSignifiers } = useBuJoStore();

  const getStyles = () => {
    if (!theme?.colors || !theme?.typography) {
      return fallbackStyles;
    }

    const iconSize = size === 'lg' ? 18 : size === 'md' ? 16 : 14;
    const containerPadding = size === 'lg' ? 6 : size === 'md' ? 4 : 3;
    const fontSize = size === 'lg' ? 14 : size === 'md' ? 12 : 10;

    return StyleSheet.create({
      container: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
      },
      signifierChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: containerPadding,
        paddingVertical: containerPadding / 2,
        marginRight: 4,
        marginBottom: 2,
        borderRadius: 8,
        backgroundColor: theme.colors.surface,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
      },
      signifierSymbol: {
        fontSize: iconSize,
        textAlign: 'center',
        minWidth: iconSize,
      },
      signifierLabel: {
        fontSize: fontSize,
        color: theme.colors.textSecondary,
        marginLeft: 4,
        fontWeight: '500',
      },
      overflowIndicator: {
        fontSize: fontSize,
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
        marginLeft: 4,
      },
    });
  };

  const fallbackStyles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
    signifierChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingVertical: 2, marginRight: 4, marginBottom: 2, borderRadius: 8, backgroundColor: '#F5F2E8', borderWidth: 0.5, borderColor: '#E0E0E0' },
    signifierSymbol: { fontSize: 14, textAlign: 'center', minWidth: 14 },
    signifierLabel: { fontSize: 10, color: '#666', marginLeft: 4, fontWeight: '500' },
    overflowIndicator: { fontSize: 10, color: '#666', fontStyle: 'italic', marginLeft: 4 },
  });

  const styles = getStyles();

  if (!signifiers || signifiers.length === 0) {
    return null;
  }

  const visibleSignifiers = signifiers.slice(0, maxVisible);
  const overflowCount = signifiers.length - maxVisible;

  return (
    <View style={styles.container}>
      {visibleSignifiers.map((signifierId, index) => {
        let symbol = '';
        let label = '';
        let color = theme?.colors?.text || '#2B2B2B';

        if (signifierId.startsWith('builtin:')) {
          const builtinSymbol = signifierId.replace('builtin:', '');
          const builtin = BUILTIN_SIGNIFIERS[builtinSymbol];
          if (builtin) {
            symbol = builtin.symbol;
            label = builtin.label;
            color = builtin.color || color;
          }
        } else if (signifierId.startsWith('custom:')) {
          const customId = signifierId.replace('custom:', '');
          const custom = customSignifiers.find(cs => cs.id === customId);
          if (custom) {
            symbol = custom.symbol;
            label = custom.label;
            color = custom.color;
          }
        }

        if (!symbol) return null;

        return (
          <View key={signifierId} style={styles.signifierChip}>
            <Text style={[styles.signifierSymbol, { color }]}>
              {symbol}
            </Text>
            {showLabels && (
              <Text style={styles.signifierLabel}>
                {label}
              </Text>
            )}
          </View>
        );
      })}
      
      {overflowCount > 0 && (
        <Text style={styles.overflowIndicator}>
          +{overflowCount} more
        </Text>
      )}
    </View>
  );
};