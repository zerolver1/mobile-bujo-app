import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme';
import { Typography } from '../ui/Typography';
import { BuJoEntry } from '../../types/BuJo';
import { Ionicons } from '@expo/vector-icons';

interface BulkSelectionHelperProps {
  entries: BuJoEntry[];
  selectedEntries: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  showSelectAll?: boolean;
  maxSelection?: number;
}

export const BulkSelectionHelper: React.FC<BulkSelectionHelperProps> = ({
  entries,
  selectedEntries,
  onSelectionChange,
  showSelectAll = true,
  maxSelection,
}) => {
  const { theme } = useTheme();

  const getStyles = () => {
    if (!theme?.colors || !theme?.typography) {
      return fallbackStyles;
    }

    return StyleSheet.create({
      container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing?.sm || 8,
        paddingHorizontal: theme.spacing?.md || 16,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },
      leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
      },
      selectionInfo: {
        marginLeft: theme.spacing?.sm || 8,
      },
      rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing?.sm || 8,
        paddingVertical: theme.spacing?.xs || 4,
        marginLeft: theme.spacing?.sm || 8,
        borderRadius: 16,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      actionButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
      },
      actionText: {
        fontSize: theme.typography.textStyles?.caption1?.fontSize || 14,
        color: theme.colors.text,
        fontWeight: '500',
        marginLeft: 4,
      },
      actionTextActive: {
        color: theme.colors.background,
      },
      countText: {
        fontSize: theme.typography.textStyles?.body?.fontSize || 17,
        color: theme.colors.text,
        fontWeight: '600',
      },
      totalText: {
        fontSize: theme.typography.textStyles?.caption1?.fontSize || 14,
        color: theme.colors.textSecondary,
      },
      quickFilters: {
        flexDirection: 'row',
        marginTop: theme.spacing?.xs || 4,
      },
      filterChip: {
        paddingHorizontal: theme.spacing?.xs || 6,
        paddingVertical: 2,
        marginRight: theme.spacing?.xs || 4,
        borderRadius: 10,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      filterChipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
      },
      filterText: {
        fontSize: theme.typography.textStyles?.caption2?.fontSize || 12,
        color: theme.colors.text,
      },
      filterTextActive: {
        color: theme.colors.background,
      },
    });
  };

  const fallbackStyles = StyleSheet.create({
    container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#F5F2E8', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
    leftSection: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    selectionInfo: { marginLeft: 8 },
    rightSection: { flexDirection: 'row', alignItems: 'center' },
    actionButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8, borderRadius: 16, backgroundColor: '#F9F6F0', borderWidth: 1, borderColor: '#E0E0E0' },
    actionButtonActive: { backgroundColor: '#0F2A44', borderColor: '#0F2A44' },
    actionText: { fontSize: 14, color: '#2B2B2B', fontWeight: '500', marginLeft: 4 },
    actionTextActive: { color: '#F9F6F0' },
    countText: { fontSize: 17, color: '#2B2B2B', fontWeight: '600' },
    totalText: { fontSize: 14, color: '#666' },
    quickFilters: { flexDirection: 'row', marginTop: 4 },
    filterChip: { paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, borderRadius: 10, backgroundColor: '#F9F6F0', borderWidth: 1, borderColor: '#E0E0E0' },
    filterChipActive: { backgroundColor: '#0F2A44', borderColor: '#0F2A44' },
    filterText: { fontSize: 12, color: '#2B2B2B' },
    filterTextActive: { color: '#F9F6F0' },
  });

  const styles = getStyles();

  const isAllSelected = useMemo(() => 
    entries.length > 0 && selectedEntries.length === entries.length,
    [entries.length, selectedEntries.length]
  );

  const handleSelectAll = useCallback(() => {
    if (maxSelection && entries.length > maxSelection) {
      Alert.alert(
        'Selection Limit',
        `You can only select up to ${maxSelection} entries at once.`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(entries.map(e => e.id));
    }
  }, [entries, isAllSelected, onSelectionChange, maxSelection]);

  const handleSelectByType = useCallback((type: BuJoEntry['type']) => {
    const typeEntries = entries.filter(e => e.type === type);
    const typeIds = typeEntries.map(e => e.id);
    const currentTypeSelected = typeIds.filter(id => selectedEntries.includes(id));
    
    if (currentTypeSelected.length === typeIds.length) {
      // Deselect all of this type
      onSelectionChange(selectedEntries.filter(id => !typeIds.includes(id)));
    } else {
      // Select all of this type
      const newSelection = [...new Set([...selectedEntries, ...typeIds])];
      
      if (maxSelection && newSelection.length > maxSelection) {
        Alert.alert(
          'Selection Limit',
          `You can only select up to ${maxSelection} entries at once.`,
          [{ text: 'OK' }]
        );
        return;
      }
      
      onSelectionChange(newSelection);
    }
  }, [entries, selectedEntries, onSelectionChange, maxSelection]);

  const handleSelectIncomplete = useCallback(() => {
    const incompleteEntries = entries.filter(e => 
      e.type === 'task' && e.status === 'incomplete'
    );
    const incompleteIds = incompleteEntries.map(e => e.id);
    const currentIncompleteSelected = incompleteIds.filter(id => selectedEntries.includes(id));
    
    if (currentIncompleteSelected.length === incompleteIds.length) {
      // Deselect all incomplete
      onSelectionChange(selectedEntries.filter(id => !incompleteIds.includes(id)));
    } else {
      // Select all incomplete
      const newSelection = [...new Set([...selectedEntries, ...incompleteIds])];
      
      if (maxSelection && newSelection.length > maxSelection) {
        Alert.alert(
          'Selection Limit',
          `You can only select up to ${maxSelection} entries at once.`,
          [{ text: 'OK' }]
        );
        return;
      }
      
      onSelectionChange(newSelection);
    }
  }, [entries, selectedEntries, onSelectionChange, maxSelection]);

  const entryTypes = useMemo(() => {
    const types = new Set(entries.map(e => e.type));
    return Array.from(types).map(type => ({
      type,
      count: entries.filter(e => e.type === type).length,
      selectedCount: entries.filter(e => e.type === type && selectedEntries.includes(e.id)).length,
    }));
  }, [entries, selectedEntries]);

  const incompleteTasksCount = useMemo(() => 
    entries.filter(e => e.type === 'task' && e.status === 'incomplete').length,
    [entries]
  );

  const selectedIncompleteCount = useMemo(() => 
    entries.filter(e => 
      e.type === 'task' && 
      e.status === 'incomplete' && 
      selectedEntries.includes(e.id)
    ).length,
    [entries, selectedEntries]
  );

  if (entries.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Text style={styles.countText}>
          {selectedEntries.length}
        </Text>
        <View style={styles.selectionInfo}>
          <Text style={styles.totalText}>
            of {entries.length} selected
          </Text>
          {maxSelection && (
            <Text style={[styles.totalText, { fontSize: 10 }]}>
              max: {maxSelection}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rightSection}>
        {/* Select All */}
        {showSelectAll && (
          <TouchableOpacity
            style={[styles.actionButton, isAllSelected && styles.actionButtonActive]}
            onPress={handleSelectAll}
          >
            <Ionicons
              name={isAllSelected ? "checkmark-circle" : "ellipse-outline"}
              size={16}
              color={
                isAllSelected 
                  ? theme?.colors?.background || '#F9F6F0'
                  : theme?.colors?.primary || '#0F2A44'
              }
            />
            <Text style={[styles.actionText, isAllSelected && styles.actionTextActive]}>
              {isAllSelected ? 'Clear' : 'All'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Select Incomplete */}
        {incompleteTasksCount > 0 && (
          <TouchableOpacity
            style={[
              styles.actionButton, 
              selectedIncompleteCount === incompleteTasksCount && selectedIncompleteCount > 0 && styles.actionButtonActive
            ]}
            onPress={handleSelectIncomplete}
          >
            <Ionicons
              name="checkbox-outline"
              size={16}
              color={
                selectedIncompleteCount === incompleteTasksCount && selectedIncompleteCount > 0
                  ? theme?.colors?.background || '#F9F6F0'
                  : theme?.colors?.primary || '#0F2A44'
              }
            />
            <Text style={[
              styles.actionText, 
              selectedIncompleteCount === incompleteTasksCount && selectedIncompleteCount > 0 && styles.actionTextActive
            ]}>
              Incomplete ({incompleteTasksCount})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick type filters */}
      {entryTypes.length > 1 && (
        <View style={styles.quickFilters}>
          {entryTypes.slice(0, 3).map(({ type, count, selectedCount }) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterChip,
                selectedCount === count && selectedCount > 0 && styles.filterChipActive,
              ]}
              onPress={() => handleSelectByType(type)}
            >
              <Text style={[
                styles.filterText,
                selectedCount === count && selectedCount > 0 && styles.filterTextActive,
              ]}>
                {type} ({count})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};