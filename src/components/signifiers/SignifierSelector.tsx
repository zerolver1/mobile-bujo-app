import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../theme';
import { Typography } from '../ui/Typography';
import { CustomSignifier } from '../../types/BuJo';
import { useBuJoStore } from '../../stores/BuJoStore';
import { Ionicons } from '@expo/vector-icons';
import { CustomSignifierManager } from './CustomSignifierManager';

interface SignifierSelectorProps {
  selectedSignifiers: string[];
  onSignifiersChange: (signifiers: string[]) => void;
  compact?: boolean;
}

// Built-in BuJo signifiers with classic symbols
const BUILTIN_SIGNIFIERS = [
  { symbol: '•', label: 'Task', description: 'Standard task bullet' },
  { symbol: '○', label: 'Event', description: 'Event or appointment' },
  { symbol: '−', label: 'Note', description: 'General note or thought' },
  { symbol: '✓', label: 'Complete', description: 'Completed task' },
  { symbol: '>', label: 'Migrated', description: 'Task migrated to future' },
  { symbol: '<', label: 'Scheduled', description: 'Task scheduled in calendar' },
  { symbol: '⚡', label: 'Priority', description: 'High priority item' },
  { symbol: '!', label: 'Important', description: 'Important note or task' },
  { symbol: '⭐', label: 'Inspiration', description: 'Idea or inspiration' },
  { symbol: '👁', label: 'Explore', description: 'Research or investigate' },
];

export const SignifierSelector: React.FC<SignifierSelectorProps> = ({
  selectedSignifiers,
  onSignifiersChange,
  compact = false,
}) => {
  const { theme } = useTheme();
  const { customSignifiers } = useBuJoStore();
  const [showCustomManager, setShowCustomManager] = useState(false);

  const getStyles = () => {
    if (!theme?.colors || !theme?.typography) {
      return fallbackStyles;
    }

    return StyleSheet.create({
      container: {
        marginVertical: theme.spacing?.sm || 8,
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing?.xs || 6,
      },
      signifierGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
      },
      signifierChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing?.sm || 8,
        paddingVertical: theme.spacing?.xs || 6,
        marginRight: theme.spacing?.xs || 6,
        marginBottom: theme.spacing?.xs || 6,
        borderRadius: compact ? 12 : 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        minHeight: compact ? 28 : 32,
      },
      signifierChipSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
      },
      signifierSymbol: {
        fontSize: compact ? 14 : 16,
        marginRight: compact ? 4 : 6,
        minWidth: compact ? 16 : 20,
        textAlign: 'center',
      },
      signifierSymbolSelected: {
        color: theme.colors.background,
      },
      signifierLabel: {
        fontSize: compact ? 12 : 14,
        color: theme.colors.text,
        fontWeight: '500',
      },
      signifierLabelSelected: {
        color: theme.colors.background,
      },
      customSignifierSymbol: {
        fontSize: compact ? 14 : 16,
        marginRight: compact ? 4 : 6,
        minWidth: compact ? 16 : 20,
        textAlign: 'center',
      },
      addCustomButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing?.sm || 8,
        paddingVertical: theme.spacing?.xs || 6,
        marginRight: theme.spacing?.xs || 6,
        marginBottom: theme.spacing?.xs || 6,
        borderRadius: compact ? 12 : 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
        backgroundColor: 'transparent',
        minHeight: compact ? 28 : 32,
      },
      addCustomText: {
        fontSize: compact ? 12 : 14,
        color: theme.colors.textSecondary,
        marginLeft: 4,
      },
      sectionHeader: {
        marginTop: theme.spacing?.sm || 8,
        marginBottom: theme.spacing?.xs || 4,
      },
      selectedCount: {
        fontSize: theme.typography.textStyles?.caption2?.fontSize || 12,
        color: theme.colors.textSecondary,
      },
    });
  };

  const fallbackStyles = StyleSheet.create({
    container: { marginVertical: 8 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    signifierGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    signifierChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, marginRight: 6, marginBottom: 6, borderRadius: 16, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#F5F2E8', minHeight: 32 },
    signifierChipSelected: { backgroundColor: '#0F2A44', borderColor: '#0F2A44' },
    signifierSymbol: { fontSize: 16, marginRight: 6, minWidth: 20, textAlign: 'center' },
    signifierSymbolSelected: { color: '#F9F6F0' },
    signifierLabel: { fontSize: 14, color: '#2B2B2B', fontWeight: '500' },
    signifierLabelSelected: { color: '#F9F6F0' },
    customSignifierSymbol: { fontSize: 16, marginRight: 6, minWidth: 20, textAlign: 'center' },
    addCustomButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, marginRight: 6, marginBottom: 6, borderRadius: 16, borderWidth: 1, borderColor: '#E0E0E0', borderStyle: 'dashed', backgroundColor: 'transparent', minHeight: 32 },
    addCustomText: { fontSize: 14, color: '#666', marginLeft: 4 },
    sectionHeader: { marginTop: 8, marginBottom: 4 },
    selectedCount: { fontSize: 12, color: '#666' },
  });

  const styles = getStyles();

  const toggleSignifier = (signifierId: string) => {
    if (selectedSignifiers.includes(signifierId)) {
      onSignifiersChange(selectedSignifiers.filter(id => id !== signifierId));
    } else {
      onSignifiersChange([...selectedSignifiers, signifierId]);
    }
  };

  const handleCustomSignifierSelected = (customSignifier: CustomSignifier) => {
    toggleSignifier(`custom:${customSignifier.id}`);
  };

  const allSignifiers = [
    ...BUILTIN_SIGNIFIERS.map(s => ({ ...s, id: `builtin:${s.symbol}`, isCustom: false })),
    ...customSignifiers.map(s => ({ ...s, id: `custom:${s.id}`, isCustom: true })),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant={compact ? "caption1" : "body"} color="text">
          Signifiers
        </Typography>
        {selectedSignifiers.length > 0 && (
          <Text style={styles.selectedCount}>
            {selectedSignifiers.length} selected
          </Text>
        )}
      </View>

      {!compact && (
        <Typography variant="caption1" color="textSecondary" style={{ marginBottom: 8 }}>
          Mark entries with visual symbols to categorize and prioritize
        </Typography>
      )}

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 4 }}
      >
        <View style={styles.signifierGrid}>
          {/* Built-in Signifiers */}
          {BUILTIN_SIGNIFIERS.map((signifier) => {
            const signifierId = `builtin:${signifier.symbol}`;
            const isSelected = selectedSignifiers.includes(signifierId);
            
            return (
              <TouchableOpacity
                key={signifierId}
                style={[styles.signifierChip, isSelected && styles.signifierChipSelected]}
                onPress={() => toggleSignifier(signifierId)}
              >
                <Text style={[
                  styles.signifierSymbol,
                  isSelected && styles.signifierSymbolSelected
                ]}>
                  {signifier.symbol}
                </Text>
                {!compact && (
                  <Text style={[
                    styles.signifierLabel,
                    isSelected && styles.signifierLabelSelected
                  ]}>
                    {signifier.label}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Custom Signifiers */}
          {customSignifiers.map((signifier) => {
            const signifierId = `custom:${signifier.id}`;
            const isSelected = selectedSignifiers.includes(signifierId);
            
            return (
              <TouchableOpacity
                key={signifierId}
                style={[styles.signifierChip, isSelected && styles.signifierChipSelected]}
                onPress={() => toggleSignifier(signifierId)}
              >
                <Text style={[
                  styles.customSignifierSymbol,
                  { color: isSelected ? theme?.colors?.background : signifier.color },
                ]}>
                  {signifier.symbol}
                </Text>
                {!compact && (
                  <Text style={[
                    styles.signifierLabel,
                    isSelected && styles.signifierLabelSelected
                  ]}>
                    {signifier.label}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Add Custom Button */}
          <TouchableOpacity
            style={styles.addCustomButton}
            onPress={() => setShowCustomManager(true)}
          >
            <Ionicons 
              name="add" 
              size={compact ? 14 : 16} 
              color={theme?.colors?.textSecondary || '#666'} 
            />
            {!compact && (
              <Text style={styles.addCustomText}>Custom</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CustomSignifierManager
        visible={showCustomManager}
        onClose={() => setShowCustomManager(false)}
        onSignifierSelected={handleCustomSignifierSelected}
        selectionMode={true}
      />
    </View>
  );
};