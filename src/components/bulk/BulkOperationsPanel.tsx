import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { useTheme } from '../../theme';
import { Typography } from '../ui/Typography';
import { PaperButton } from '../ui/PaperButton';
import { Card } from '../ui/Card';
import { BuJoEntry } from '../../types/BuJo';
import { useBuJoStore } from '../../stores/BuJoStore';
import { Ionicons } from '@expo/vector-icons';

interface BulkOperationsPanelProps {
  selectedEntries: string[];
  onClearSelection: () => void;
  onEntrySelectionChange?: (entryIds: string[]) => void;
}

interface BulkAction {
  id: string;
  label: string;
  icon: string;
  description: string;
  requiresConfirmation: boolean;
  action: (entryIds: string[]) => Promise<void> | void;
}

export const BulkOperationsPanel: React.FC<BulkOperationsPanelProps> = ({
  selectedEntries,
  onClearSelection,
  onEntrySelectionChange,
}) => {
  const { theme } = useTheme();
  const { entries, updateEntry, deleteEntry } = useBuJoStore();
  
  const [showTagEditor, setShowTagEditor] = useState(false);
  const [showStatusChanger, setShowStatusChanger] = useState(false);
  const [showPriorityChanger, setShowPriorityChanger] = useState(false);
  const [newTags, setNewTags] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<BuJoEntry['status']>('incomplete');
  const [selectedPriority, setSelectedPriority] = useState<BuJoEntry['priority']>('none');
  const [isProcessing, setIsProcessing] = useState(false);

  const getStyles = useMemo(() => {
    if (!theme?.colors || !theme?.typography) {
      return fallbackStyles;
    }

    return StyleSheet.create({
      container: {
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingVertical: theme.spacing?.sm || 8,
        paddingHorizontal: theme.spacing?.md || 16,
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing?.sm || 8,
      },
      selectedCount: {
        fontSize: theme.typography.textStyles?.body?.fontSize || 17,
        fontWeight: '600',
        color: theme.colors.primary,
      },
      actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
      },
      actionButton: {
        width: '48%',
        marginBottom: theme.spacing?.xs || 6,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 8,
        paddingVertical: theme.spacing?.sm || 8,
        paddingHorizontal: theme.spacing?.xs || 6,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
      },
      actionButtonDestructive: {
        borderColor: theme.colors.error || '#B91C1C',
        backgroundColor: 'rgba(185, 28, 28, 0.05)',
      },
      actionButtonPrimary: {
        borderColor: theme.colors.primary,
        backgroundColor: 'rgba(15, 42, 68, 0.05)',
      },
      actionIcon: {
        marginRight: 6,
      },
      actionText: {
        fontSize: theme.typography.textStyles?.caption1?.fontSize || 14,
        color: theme.colors.text,
        fontWeight: '500',
        textAlign: 'center',
        flex: 1,
      },
      actionTextDestructive: {
        color: theme.colors.error || '#B91C1C',
      },
      actionTextPrimary: {
        color: theme.colors.primary,
      },
      // Modal styles
      modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      modalContent: {
        width: '90%',
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
        padding: theme.spacing?.lg || 20,
      },
      modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing?.md || 16,
        paddingBottom: theme.spacing?.sm || 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },
      formRow: {
        marginBottom: theme.spacing?.md || 16,
      },
      formLabel: {
        fontSize: theme.typography.textStyles?.body?.fontSize || 17,
        color: theme.colors.text,
        fontWeight: '500',
        marginBottom: theme.spacing?.xs || 4,
      },
      textInput: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 8,
        paddingHorizontal: theme.spacing?.sm || 8,
        paddingVertical: theme.spacing?.sm || 8,
        fontSize: theme.typography.textStyles?.body?.fontSize || 17,
        color: theme.colors.text,
      },
      pickerGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
      },
      pickerOption: {
        paddingHorizontal: theme.spacing?.sm || 8,
        paddingVertical: theme.spacing?.xs || 6,
        marginRight: theme.spacing?.xs || 6,
        marginBottom: theme.spacing?.xs || 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
      },
      pickerOptionSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
      },
      pickerOptionText: {
        fontSize: theme.typography.textStyles?.caption1?.fontSize || 14,
        color: theme.colors.text,
        textTransform: 'capitalize',
      },
      pickerOptionTextSelected: {
        color: theme.colors.background,
      },
      modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: theme.spacing?.md || 16,
      },
      processingText: {
        textAlign: 'center',
        fontStyle: 'italic',
        color: theme.colors.textSecondary,
        marginVertical: theme.spacing?.sm || 8,
      },
    });
  }, [theme]);

  const fallbackStyles = StyleSheet.create({
    container: { backgroundColor: '#F5F2E8', borderTopWidth: 1, borderTopColor: '#E0E0E0', paddingVertical: 8, paddingHorizontal: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    selectedCount: { fontSize: 17, fontWeight: '600', color: '#0F2A44' },
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    actionButton: { width: '48%', marginBottom: 6, backgroundColor: '#F9F6F0', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
    actionButtonDestructive: { borderColor: '#B91C1C', backgroundColor: 'rgba(185, 28, 28, 0.05)' },
    actionButtonPrimary: { borderColor: '#0F2A44', backgroundColor: 'rgba(15, 42, 68, 0.05)' },
    actionIcon: { marginRight: 6 },
    actionText: { fontSize: 14, color: '#2B2B2B', fontWeight: '500', textAlign: 'center', flex: 1 },
    actionTextDestructive: { color: '#B91C1C' },
    actionTextPrimary: { color: '#0F2A44' },
    modalContainer: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '90%', backgroundColor: '#F5F2E8', borderRadius: 8, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
    formRow: { marginBottom: 16 },
    formLabel: { fontSize: 17, color: '#2B2B2B', fontWeight: '500', marginBottom: 4 },
    textInput: { backgroundColor: '#F9F6F0', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 8, fontSize: 17, color: '#2B2B2B' },
    pickerGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    pickerOption: { paddingHorizontal: 8, paddingVertical: 6, marginRight: 6, marginBottom: 6, borderRadius: 16, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#F9F6F0' },
    pickerOptionSelected: { backgroundColor: '#0F2A44', borderColor: '#0F2A44' },
    pickerOptionText: { fontSize: 14, color: '#2B2B2B', textTransform: 'capitalize' },
    pickerOptionTextSelected: { color: '#F9F6F0' },
    modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
    processingText: { textAlign: 'center', fontStyle: 'italic', color: '#666', marginVertical: 8 },
  });

  const styles = getStyles;

  const selectedEntriesData = useMemo(() => 
    entries.filter(e => selectedEntries.includes(e.id)),
    [entries, selectedEntries]
  );

  const handleBulkStatusChange = useCallback(async (newStatus: BuJoEntry['status']) => {
    if (selectedEntries.length === 0) return;

    setIsProcessing(true);
    try {
      const promises = selectedEntries.map(entryId => 
        updateEntry(entryId, { status: newStatus })
      );
      await Promise.all(promises);
      
      Alert.alert(
        'Status Updated', 
        `${selectedEntries.length} entries marked as ${newStatus}`
      );
      onClearSelection();
    } catch (error) {
      Alert.alert('Error', 'Failed to update entry statuses');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedEntries, updateEntry, onClearSelection]);

  const handleBulkPriorityChange = useCallback(async (newPriority: BuJoEntry['priority']) => {
    if (selectedEntries.length === 0) return;

    setIsProcessing(true);
    try {
      const promises = selectedEntries.map(entryId => 
        updateEntry(entryId, { priority: newPriority })
      );
      await Promise.all(promises);
      
      Alert.alert(
        'Priority Updated', 
        `${selectedEntries.length} entries set to ${newPriority} priority`
      );
      onClearSelection();
    } catch (error) {
      Alert.alert('Error', 'Failed to update entry priorities');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedEntries, updateEntry, onClearSelection]);

  const handleBulkTagsChange = useCallback(async () => {
    if (selectedEntries.length === 0 || !newTags.trim()) return;

    setIsProcessing(true);
    try {
      const tagsArray = newTags.split(',').map(tag => tag.trim()).filter(Boolean);
      const promises = selectedEntries.map(entryId => {
        const entry = entries.find(e => e.id === entryId);
        if (!entry) return Promise.resolve();
        
        const updatedTags = [...new Set([...entry.tags, ...tagsArray])];
        return updateEntry(entryId, { tags: updatedTags });
      });
      await Promise.all(promises);
      
      Alert.alert(
        'Tags Added', 
        `Added tags to ${selectedEntries.length} entries`
      );
      setNewTags('');
      setShowTagEditor(false);
      onClearSelection();
    } catch (error) {
      Alert.alert('Error', 'Failed to add tags to entries');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedEntries, newTags, entries, updateEntry, onClearSelection]);

  const handleBulkDelete = useCallback(() => {
    if (selectedEntries.length === 0) return;

    Alert.alert(
      'Delete Entries',
      `Are you sure you want to delete ${selectedEntries.length} selected entries? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            try {
              const promises = selectedEntries.map(entryId => deleteEntry(entryId));
              await Promise.all(promises);
              
              Alert.alert('Deleted', `${selectedEntries.length} entries deleted`);
              onClearSelection();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete entries');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  }, [selectedEntries, deleteEntry, onClearSelection]);

  const handleMigrateToToday = useCallback(async () => {
    if (selectedEntries.length === 0) return;

    const today = new Date().toISOString().split('T')[0];
    
    setIsProcessing(true);
    try {
      const promises = selectedEntries.map(entryId => 
        updateEntry(entryId, { 
          status: 'migrated',
          collectionDate: today
        })
      );
      await Promise.all(promises);
      
      Alert.alert(
        'Entries Migrated', 
        `${selectedEntries.length} entries migrated to today`
      );
      onClearSelection();
    } catch (error) {
      Alert.alert('Error', 'Failed to migrate entries');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedEntries, updateEntry, onClearSelection]);

  const bulkActions: BulkAction[] = [
    {
      id: 'complete',
      label: 'Mark Complete',
      icon: 'checkmark-circle-outline',
      description: 'Mark selected tasks as complete',
      requiresConfirmation: false,
      action: () => handleBulkStatusChange('complete'),
    },
    {
      id: 'migrate',
      label: 'Migrate to Today',
      icon: 'arrow-forward-circle-outline',
      description: 'Move selected entries to today',
      requiresConfirmation: false,
      action: handleMigrateToToday,
    },
    {
      id: 'status',
      label: 'Change Status',
      icon: 'swap-horizontal-outline',
      description: 'Update status of selected entries',
      requiresConfirmation: false,
      action: () => setShowStatusChanger(true),
    },
    {
      id: 'priority',
      label: 'Set Priority',
      icon: 'flag-outline',
      description: 'Update priority of selected entries',
      requiresConfirmation: false,
      action: () => setShowPriorityChanger(true),
    },
    {
      id: 'tags',
      label: 'Add Tags',
      icon: 'pricetags-outline',
      description: 'Add tags to selected entries',
      requiresConfirmation: false,
      action: () => setShowTagEditor(true),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'trash-outline',
      description: 'Delete selected entries',
      requiresConfirmation: true,
      action: handleBulkDelete,
    },
  ];

  if (selectedEntries.length === 0) {
    return null;
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.selectedCount}>
            {selectedEntries.length} selected
          </Text>
          <TouchableOpacity onPress={onClearSelection}>
            <Typography variant="body" color="primary">
              Clear
            </Typography>
          </TouchableOpacity>
        </View>

        {isProcessing && (
          <Text style={styles.processingText}>
            Processing bulk operation...
          </Text>
        )}

        <View style={styles.actionsGrid}>
          {bulkActions.map((action) => {
            const isDestructive = action.id === 'delete';
            const isPrimary = ['complete', 'migrate'].includes(action.id);
            
            return (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.actionButton,
                  isDestructive && styles.actionButtonDestructive,
                  isPrimary && styles.actionButtonPrimary,
                ]}
                onPress={() => action.action()}
                disabled={isProcessing}
              >
                <Ionicons
                  name={action.icon as any}
                  size={18}
                  color={
                    isDestructive 
                      ? theme?.colors?.error || '#B91C1C'
                      : isPrimary
                      ? theme?.colors?.primary || '#0F2A44'
                      : theme?.colors?.text || '#2B2B2B'
                  }
                  style={styles.actionIcon}
                />
                <Text
                  style={[
                    styles.actionText,
                    isDestructive && styles.actionTextDestructive,
                    isPrimary && styles.actionTextPrimary,
                  ]}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Tag Editor Modal */}
      <Modal visible={showTagEditor} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <Card variant="elevated" padding="none">
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Typography variant="h3" color="text">
                  Add Tags
                </Typography>
                <TouchableOpacity onPress={() => setShowTagEditor(false)}>
                  <Ionicons name="close" size={24} color={theme?.colors?.text || '#2B2B2B'} />
                </TouchableOpacity>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>
                  Tags (comma-separated)
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={newTags}
                  onChangeText={setNewTags}
                  placeholder="work, important, personal"
                  placeholderTextColor={theme?.colors?.textTertiary || '#999'}
                />
                <Typography variant="caption1" color="textSecondary" style={{ marginTop: 4 }}>
                  Will be added to all {selectedEntries.length} selected entries
                </Typography>
              </View>

              <View style={styles.modalButtons}>
                <PaperButton
                  variant="pencil"
                  size="sm"
                  title="Cancel"
                  onPress={() => setShowTagEditor(false)}
                  style={{ marginRight: 8 }}
                />
                <PaperButton
                  variant="ink"
                  size="sm"
                  title="Add Tags"
                  onPress={handleBulkTagsChange}
                  disabled={!newTags.trim()}
                />
              </View>
            </View>
          </Card>
        </View>
      </Modal>

      {/* Status Changer Modal */}
      <Modal visible={showStatusChanger} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <Card variant="elevated" padding="none">
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Typography variant="h3" color="text">
                  Change Status
                </Typography>
                <TouchableOpacity onPress={() => setShowStatusChanger(false)}>
                  <Ionicons name="close" size={24} color={theme?.colors?.text || '#2B2B2B'} />
                </TouchableOpacity>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Select New Status</Text>
                <View style={styles.pickerGrid}>
                  {(['incomplete', 'complete', 'migrated', 'scheduled', 'cancelled'] as const).map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.pickerOption,
                        selectedStatus === status && styles.pickerOptionSelected,
                      ]}
                      onPress={() => setSelectedStatus(status)}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        selectedStatus === status && styles.pickerOptionTextSelected,
                      ]}>
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalButtons}>
                <PaperButton
                  variant="pencil"
                  size="sm"
                  title="Cancel"
                  onPress={() => setShowStatusChanger(false)}
                  style={{ marginRight: 8 }}
                />
                <PaperButton
                  variant="ink"
                  size="sm"
                  title="Update Status"
                  onPress={() => {
                    handleBulkStatusChange(selectedStatus);
                    setShowStatusChanger(false);
                  }}
                />
              </View>
            </View>
          </Card>
        </View>
      </Modal>

      {/* Priority Changer Modal */}
      <Modal visible={showPriorityChanger} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <Card variant="elevated" padding="none">
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Typography variant="h3" color="text">
                  Set Priority
                </Typography>
                <TouchableOpacity onPress={() => setShowPriorityChanger(false)}>
                  <Ionicons name="close" size={24} color={theme?.colors?.text || '#2B2B2B'} />
                </TouchableOpacity>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Select Priority Level</Text>
                <View style={styles.pickerGrid}>
                  {(['none', 'low', 'medium', 'high'] as const).map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.pickerOption,
                        selectedPriority === priority && styles.pickerOptionSelected,
                      ]}
                      onPress={() => setSelectedPriority(priority)}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        selectedPriority === priority && styles.pickerOptionTextSelected,
                      ]}>
                        {priority}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalButtons}>
                <PaperButton
                  variant="pencil"
                  size="sm"
                  title="Cancel"
                  onPress={() => setShowPriorityChanger(false)}
                  style={{ marginRight: 8 }}
                />
                <PaperButton
                  variant="ink"
                  size="sm"
                  title="Set Priority"
                  onPress={() => {
                    handleBulkPriorityChange(selectedPriority);
                    setShowPriorityChanger(false);
                  }}
                />
              </View>
            </View>
          </Card>
        </View>
      </Modal>
    </>
  );
};