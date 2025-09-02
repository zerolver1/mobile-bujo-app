import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { useTheme } from '../../theme';
import { Typography } from '../ui/Typography';
import { PaperButton } from '../ui/PaperButton';
import { Card } from '../ui/Card';
import { BuJoEntry, CrossReference } from '../../types/BuJo';
import { useBuJoStore } from '../../stores/BuJoStore';
import { Ionicons } from '@expo/vector-icons';

interface CrossReferenceManagerProps {
  entryId: string;
  visible: boolean;
  onClose: () => void;
  onReferenceAdded?: (reference: CrossReference) => void;
}

export const CrossReferenceManager: React.FC<CrossReferenceManagerProps> = ({
  entryId,
  visible,
  onClose,
  onReferenceAdded,
}) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<CrossReference['type']>('related');
  const [customLabel, setCustomLabel] = useState('');
  const [note, setNote] = useState('');

  const { entries, addCrossReference, removeCrossReference } = useBuJoStore();
  
  const currentEntry = entries.find(e => e.id === entryId);
  const existingReferences = currentEntry?.linkedEntries || [];

  const getStyles = () => {
    if (!theme?.colors || !theme?.typography) {
      return fallbackStyles;
    }

    return StyleSheet.create({
      modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      modalContent: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
        padding: theme.spacing?.lg || 20,
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing?.md || 16,
        paddingBottom: theme.spacing?.sm || 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },
      searchContainer: {
        marginBottom: theme.spacing?.md || 16,
      },
      searchInput: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 8,
        paddingHorizontal: theme.spacing?.md || 12,
        paddingVertical: theme.spacing?.sm || 8,
        fontSize: theme.typography.textStyles?.body?.fontSize || 17,
        color: theme.colors.text,
      },
      typeSelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: theme.spacing?.md || 16,
      },
      typeChip: {
        paddingHorizontal: theme.spacing?.sm || 8,
        paddingVertical: theme.spacing?.xs || 4,
        marginRight: theme.spacing?.xs || 6,
        marginBottom: theme.spacing?.xs || 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
      },
      typeChipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
      },
      typeChipText: {
        fontSize: theme.typography.textStyles?.caption1?.fontSize || 14,
        color: theme.colors.text,
      },
      typeChipTextActive: {
        color: theme.colors.background,
      },
      entryList: {
        maxHeight: 300,
        marginBottom: theme.spacing?.md || 16,
      },
      entryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing?.sm || 8,
        paddingHorizontal: theme.spacing?.sm || 8,
        borderBottomWidth: 0.5,
        borderBottomColor: theme.colors.border,
      },
      entryContent: {
        flex: 1,
        marginRight: theme.spacing?.sm || 8,
      },
      entryTitle: {
        fontSize: theme.typography.textStyles?.body?.fontSize || 17,
        color: theme.colors.text,
        marginBottom: 2,
      },
      entryMeta: {
        fontSize: theme.typography.textStyles?.caption1?.fontSize || 14,
        color: theme.colors.textSecondary,
      },
      existingReferences: {
        marginBottom: theme.spacing?.md || 16,
      },
      referenceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing?.xs || 4,
        paddingHorizontal: theme.spacing?.sm || 8,
        marginBottom: theme.spacing?.xs || 4,
        backgroundColor: theme.colors.background,
        borderRadius: 4,
      },
      referenceInfo: {
        flex: 1,
      },
      referenceType: {
        fontSize: theme.typography.textStyles?.caption2?.fontSize || 12,
        color: theme.colors.primary,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      },
      referenceContent: {
        fontSize: theme.typography.textStyles?.caption1?.fontSize || 14,
        color: theme.colors.text,
        marginTop: 2,
      },
      inputRow: {
        marginBottom: theme.spacing?.sm || 8,
      },
      buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: theme.spacing?.md || 16,
      },
      button: {
        marginLeft: theme.spacing?.sm || 8,
      },
    });
  };

  const fallbackStyles = StyleSheet.create({
    modalContainer: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '90%', maxHeight: '80%', backgroundColor: '#F5F2E8', borderRadius: 8, padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
    searchContainer: { marginBottom: 16 },
    searchInput: { backgroundColor: '#F9F6F0', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12, fontSize: 17, color: '#2B2B2B' },
    typeSelector: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
    typeChip: { padding: 8, margin: 4, borderRadius: 16, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#F9F6F0' },
    typeChipActive: { backgroundColor: '#0F2A44', borderColor: '#0F2A44' },
    typeChipText: { fontSize: 14, color: '#2B2B2B' },
    typeChipTextActive: { color: '#F9F6F0' },
    entryList: { maxHeight: 300, marginBottom: 16 },
    entryItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: '#E0E0E0' },
    entryContent: { flex: 1, marginRight: 8 },
    entryTitle: { fontSize: 17, color: '#2B2B2B', marginBottom: 2 },
    entryMeta: { fontSize: 14, color: '#666' },
    existingReferences: { marginBottom: 16 },
    referenceItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4, paddingHorizontal: 8, marginBottom: 4, backgroundColor: '#F9F6F0', borderRadius: 4 },
    referenceInfo: { flex: 1 },
    referenceType: { fontSize: 12, color: '#0F2A44', fontWeight: '500', textTransform: 'uppercase' },
    referenceContent: { fontSize: 14, color: '#2B2B2B', marginTop: 2 },
    inputRow: { marginBottom: 8 },
    buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
    button: { marginLeft: 8 },
  });

  const styles = getStyles();

  const referenceTypes = [
    { key: 'related', label: 'Related' },
    { key: 'prerequisite', label: 'Prerequisite' },
    { key: 'follow_up', label: 'Follow-up' },
    { key: 'reference', label: 'Reference' },
    { key: 'custom', label: 'Custom' },
  ];

  const filteredEntries = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return entries.filter(entry => 
      entry.id !== entryId && // Don't show current entry
      !existingReferences.includes(entry.id) && // Don't show already linked entries
      (entry.content.toLowerCase().includes(query) || 
       entry.tags.some(tag => tag.toLowerCase().includes(query)) ||
       entry.contexts.some(context => context.toLowerCase().includes(query)))
    );
  }, [entries, entryId, existingReferences, searchQuery]);

  const existingCrossReferences = useMemo(() => {
    return existingReferences.map(refId => {
      const refEntry = entries.find(e => e.id === refId);
      return refEntry ? { entry: refEntry } : null;
    }).filter(Boolean);
  }, [existingReferences, entries]);

  const handleAddReference = useCallback((targetEntryId: string) => {
    if (!currentEntry) return;

    const reference: CrossReference = {
      id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sourceEntryId: entryId,
      targetEntryId,
      type: selectedType,
      label: selectedType === 'custom' ? customLabel : undefined,
      note: note.trim() || undefined,
      createdAt: new Date(),
    };

    addCrossReference(reference);
    onReferenceAdded?.(reference);

    // Clear form
    setSearchQuery('');
    setCustomLabel('');
    setNote('');
    
    Alert.alert('Reference Added', 'Cross-reference created successfully.');
  }, [entryId, selectedType, customLabel, note, currentEntry, addCrossReference, onReferenceAdded]);

  const handleRemoveReference = useCallback((targetEntryId: string) => {
    Alert.alert(
      'Remove Reference',
      'Are you sure you want to remove this cross-reference?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeCrossReference(entryId, targetEntryId);
          },
        },
      ]
    );
  }, [entryId, removeCrossReference]);

  if (!currentEntry) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalContainer}>
        <Card variant="elevated" padding="none">
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Typography variant="h3" color="text">
                Cross-References
              </Typography>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={theme?.colors?.text || '#2B2B2B'} />
              </TouchableOpacity>
            </View>

            <Typography variant="caption1" color="textSecondary" style={{ marginBottom: 16 }}>
              Current entry: {currentEntry.content.substring(0, 50)}...
            </Typography>

            {/* Existing References */}
            {existingCrossReferences.length > 0 && (
              <View style={styles.existingReferences}>
                <Typography variant="body" color="text" style={{ marginBottom: 8 }}>
                  Existing References ({existingCrossReferences.length})
                </Typography>
                {existingCrossReferences.map((ref) => (
                  <View key={ref?.entry.id} style={styles.referenceItem}>
                    <View style={styles.referenceInfo}>
                      <Text style={styles.referenceType}>Related</Text>
                      <Text style={styles.referenceContent}>
                        {ref?.entry.content.substring(0, 40)}...
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveReference(ref?.entry.id || '')}
                      style={{ padding: 4 }}
                    >
                      <Ionicons name="trash-outline" size={16} color={theme?.colors?.error || '#B91C1C'} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Reference Type Selector */}
            <Typography variant="body" color="text" style={{ marginBottom: 8 }}>
              Reference Type
            </Typography>
            <View style={styles.typeSelector}>
              {referenceTypes.map((type) => {
                const isActive = selectedType === type.key;
                return (
                  <TouchableOpacity
                    key={type.key}
                    style={[styles.typeChip, isActive && styles.typeChipActive]}
                    onPress={() => setSelectedType(type.key as CrossReference['type'])}
                  >
                    <Text style={[styles.typeChipText, isActive && styles.typeChipTextActive]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Label Input */}
            {selectedType === 'custom' && (
              <View style={styles.inputRow}>
                <Typography variant="caption1" color="textSecondary" style={{ marginBottom: 4 }}>
                  Custom Label
                </Typography>
                <TextInput
                  style={styles.searchInput}
                  value={customLabel}
                  onChangeText={setCustomLabel}
                  placeholder="Enter custom relationship label"
                  placeholderTextColor={theme?.colors?.textTertiary || '#999'}
                />
              </View>
            )}

            {/* Note Input */}
            <View style={styles.inputRow}>
              <Typography variant="caption1" color="textSecondary" style={{ marginBottom: 4 }}>
                Note (Optional)
              </Typography>
              <TextInput
                style={styles.searchInput}
                value={note}
                onChangeText={setNote}
                placeholder="Add a note about this relationship"
                placeholderTextColor={theme?.colors?.textTertiary || '#999'}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Typography variant="caption1" color="textSecondary" style={{ marginBottom: 4 }}>
                Search Entries to Link
              </Typography>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by content, tags, or contexts..."
                placeholderTextColor={theme?.colors?.textTertiary || '#999'}
              />
            </View>

            {/* Entry List */}
            <ScrollView style={styles.entryList} showsVerticalScrollIndicator={false}>
              {filteredEntries.map((entry) => (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.entryItem}
                  onPress={() => handleAddReference(entry.id)}
                >
                  <View style={styles.entryContent}>
                    <Text style={styles.entryTitle} numberOfLines={2}>
                      {entry.content}
                    </Text>
                    <Text style={styles.entryMeta}>
                      {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)} • {entry.collectionDate}
                      {entry.tags.length > 0 && ` • ${entry.tags.join(', ')}`}
                    </Text>
                  </View>
                  <Ionicons
                    name="add-circle-outline"
                    size={24}
                    color={theme?.colors?.primary || '#0F2A44'}
                  />
                </TouchableOpacity>
              ))}
              {filteredEntries.length === 0 && searchQuery && (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Typography variant="body" color="textSecondary">
                    No entries found matching "{searchQuery}"
                  </Typography>
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <PaperButton
                variant="pencil"
                size="md"
                title="Close"
                onPress={onClose}
                style={styles.button}
              />
            </View>
          </View>
        </Card>
      </View>
    </Modal>
  );
};