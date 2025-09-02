import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  ScrollView,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../theme';
import { Typography } from '../ui/Typography';
import { PaperButton } from '../ui/PaperButton';
import { Card } from '../ui/Card';
import { CustomSignifier } from '../../types/BuJo';
import { useBuJoStore } from '../../stores/BuJoStore';
import { Ionicons } from '@expo/vector-icons';

interface CustomSignifierManagerProps {
  visible: boolean;
  onClose: () => void;
  onSignifierSelected?: (signifier: CustomSignifier) => void;
  selectionMode?: boolean;
}

const { width } = Dimensions.get('window');

// Predefined symbol options for quick selection
const SYMBOL_OPTIONS = [
  '★', '⭐', '✨', '💫', '🌟', // Stars
  '❗', '‼️', '⚠️', '🚨', '🔔', // Alerts
  '💡', '🔥', '⚡', '💎', '🎯', // Ideas/Important
  '📍', '📌', '🔖', '🏷️', '📎', // Markers
  '💰', '💳', '💸', '€', '$', // Money
  '⏰', '⏱️', '⏳', '📅', '🗓️', // Time
  '❤️', '💚', '💙', '💛', '💜', // Hearts
  '🎉', '🎊', '🎈', '🎁', '🏆', // Celebration
  '🔍', '🔎', '📋', '📝', '📄', // Work
  '🍕', '☕', '🍺', '🎵', '📚', // Personal
];

const PREDEFINED_COLORS = [
  '#B91C1C', // Red
  '#D97706', // Orange  
  '#15803D', // Green
  '#0F2A44', // Navy Blue
  '#7C3AED', // Purple
  '#DB2777', // Pink
  '#0891B2', // Cyan
  '#059669', // Emerald
  '#DC2626', // Red
  '#7C2D12', // Brown
];

export const CustomSignifierManager: React.FC<CustomSignifierManagerProps> = ({
  visible,
  onClose,
  onSignifierSelected,
  selectionMode = false,
}) => {
  const { theme } = useTheme();
  const { customSignifiers, addCustomSignifier, updateCustomSignifier, deleteCustomSignifier } = useBuJoStore();
  
  const [editingSignifier, setEditingSignifier] = useState<CustomSignifier | null>(null);
  const [newSymbol, setNewSymbol] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newColor, setNewColor] = useState(PREDEFINED_COLORS[0]);
  const [showSymbolPicker, setShowSymbolPicker] = useState(false);

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
        width: width * 0.95,
        maxHeight: '90%',
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
      signifierGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: theme.spacing?.md || 16,
      },
      signifierCard: {
        width: '48%',
        marginRight: '2%',
        marginBottom: theme.spacing?.sm || 8,
        backgroundColor: theme.colors.background,
        borderRadius: 8,
        padding: theme.spacing?.sm || 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      signifierCardSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryLight || theme.colors.surface,
      },
      signifierHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
      },
      signifierSymbol: {
        fontSize: 24,
        marginRight: 8,
      },
      signifierLabel: {
        fontSize: theme.typography.textStyles?.body?.fontSize || 16,
        fontWeight: '600',
        color: theme.colors.text,
        flex: 1,
      },
      signifierDescription: {
        fontSize: theme.typography.textStyles?.caption1?.fontSize || 14,
        color: theme.colors.textSecondary,
        marginTop: 2,
      },
      actionButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 4,
      },
      actionButton: {
        padding: 4,
        marginLeft: 8,
      },
      createForm: {
        marginBottom: theme.spacing?.md || 16,
        padding: theme.spacing?.md || 12,
        backgroundColor: theme.colors.background,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      formRow: {
        marginBottom: theme.spacing?.sm || 8,
      },
      formLabel: {
        fontSize: theme.typography.textStyles?.caption1?.fontSize || 14,
        color: theme.colors.text,
        fontWeight: '500',
        marginBottom: 4,
      },
      textInput: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 6,
        paddingHorizontal: theme.spacing?.sm || 8,
        paddingVertical: theme.spacing?.xs || 6,
        fontSize: theme.typography.textStyles?.body?.fontSize || 17,
        color: theme.colors.text,
      },
      symbolInput: {
        textAlign: 'center',
        fontSize: 24,
        paddingVertical: theme.spacing?.sm || 8,
      },
      symbolPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
      },
      symbolOption: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
      },
      symbolOptionSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryLight || theme.colors.surface,
      },
      symbolText: {
        fontSize: 20,
      },
      colorPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
      },
      colorOption: {
        width: 32,
        height: 32,
        borderRadius: 16,
        margin: 4,
        borderWidth: 2,
        borderColor: 'transparent',
      },
      colorOptionSelected: {
        borderColor: theme.colors.text,
      },
      formButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: theme.spacing?.sm || 8,
      },
      buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: theme.spacing?.md || 16,
      },
      addButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 8,
        paddingHorizontal: theme.spacing?.md || 12,
        paddingVertical: theme.spacing?.sm || 8,
        alignItems: 'center',
        marginBottom: theme.spacing?.md || 16,
      },
      addButtonText: {
        color: theme.colors.background,
        fontWeight: '600',
        fontSize: theme.typography.textStyles?.body?.fontSize || 17,
      },
    });
  };

  const fallbackStyles = StyleSheet.create({
    modalContainer: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: width * 0.95, maxHeight: '90%', backgroundColor: '#F5F2E8', borderRadius: 8, padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
    signifierGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
    signifierCard: { width: '48%', marginRight: '2%', marginBottom: 8, backgroundColor: '#F9F6F0', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#E0E0E0' },
    signifierCardSelected: { borderColor: '#0F2A44', backgroundColor: '#F5F2E8' },
    signifierHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    signifierSymbol: { fontSize: 24, marginRight: 8 },
    signifierLabel: { fontSize: 16, fontWeight: '600', color: '#2B2B2B', flex: 1 },
    signifierDescription: { fontSize: 14, color: '#666', marginTop: 2 },
    actionButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
    actionButton: { padding: 4, marginLeft: 8 },
    createForm: { marginBottom: 16, padding: 12, backgroundColor: '#F9F6F0', borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0' },
    formRow: { marginBottom: 8 },
    formLabel: { fontSize: 14, color: '#2B2B2B', fontWeight: '500', marginBottom: 4 },
    textInput: { backgroundColor: '#F5F2E8', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6, fontSize: 17, color: '#2B2B2B' },
    symbolInput: { textAlign: 'center', fontSize: 24, paddingVertical: 8 },
    symbolPicker: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
    symbolOption: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', margin: 2, borderRadius: 6, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#F5F2E8' },
    symbolOptionSelected: { borderColor: '#0F2A44', backgroundColor: '#F5F2E8' },
    symbolText: { fontSize: 20 },
    colorPicker: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
    colorOption: { width: 32, height: 32, borderRadius: 16, margin: 4, borderWidth: 2, borderColor: 'transparent' },
    colorOptionSelected: { borderColor: '#2B2B2B' },
    formButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
    addButton: { backgroundColor: '#0F2A44', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', marginBottom: 16 },
    addButtonText: { color: '#F9F6F0', fontWeight: '600', fontSize: 17 },
  });

  const styles = getStyles();

  const resetForm = useCallback(() => {
    setNewSymbol('');
    setNewLabel('');
    setNewDescription('');
    setNewColor(PREDEFINED_COLORS[0]);
    setEditingSignifier(null);
    setShowSymbolPicker(false);
  }, []);

  const handleSave = useCallback(() => {
    if (!newSymbol || !newLabel) {
      Alert.alert('Missing Information', 'Please provide both a symbol and label.');
      return;
    }

    const signifierData = {
      symbol: newSymbol,
      label: newLabel,
      description: newDescription,
      color: newColor,
    };

    if (editingSignifier) {
      updateCustomSignifier(editingSignifier.id, signifierData);
      Alert.alert('Updated', 'Custom signifier updated successfully.');
    } else {
      addCustomSignifier(signifierData);
      Alert.alert('Created', 'Custom signifier created successfully.');
    }

    resetForm();
  }, [newSymbol, newLabel, newDescription, newColor, editingSignifier, updateCustomSignifier, addCustomSignifier, resetForm]);

  const handleEdit = useCallback((signifier: CustomSignifier) => {
    setEditingSignifier(signifier);
    setNewSymbol(signifier.symbol);
    setNewLabel(signifier.label);
    setNewDescription(signifier.description);
    setNewColor(signifier.color);
  }, []);

  const handleDelete = useCallback((signifier: CustomSignifier) => {
    Alert.alert(
      'Delete Signifier',
      `Are you sure you want to delete "${signifier.label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCustomSignifier(signifier.id);
            if (editingSignifier?.id === signifier.id) {
              resetForm();
            }
          },
        },
      ]
    );
  }, [deleteCustomSignifier, editingSignifier, resetForm]);

  const handleSignifierSelect = useCallback((signifier: CustomSignifier) => {
    if (selectionMode && onSignifierSelected) {
      onSignifierSelected(signifier);
      onClose();
    }
  }, [selectionMode, onSignifierSelected, onClose]);

  const startCreating = useCallback(() => {
    resetForm();
  }, [resetForm]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <Card variant="elevated" padding="none">
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Typography variant="h3" color="text">
                {selectionMode ? 'Select Signifier' : 'Custom Signifiers'}
              </Typography>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={theme?.colors?.text || '#2B2B2B'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Create/Edit Form */}
              {(!selectionMode || editingSignifier) && (
                <>
                  {!editingSignifier && (
                    <TouchableOpacity style={styles.addButton} onPress={startCreating}>
                      <Text style={styles.addButtonText}>Create New Signifier</Text>
                    </TouchableOpacity>
                  )}

                  {(editingSignifier || newSymbol || newLabel || newDescription) && (
                    <View style={styles.createForm}>
                      <Typography variant="body" color="text" style={{ marginBottom: 12 }}>
                        {editingSignifier ? 'Edit Signifier' : 'Create New Signifier'}
                      </Typography>

                      {/* Symbol Input */}
                      <View style={styles.formRow}>
                        <Text style={styles.formLabel}>Symbol</Text>
                        <TextInput
                          style={[styles.textInput, styles.symbolInput]}
                          value={newSymbol}
                          onChangeText={setNewSymbol}
                          placeholder="Choose or type symbol"
                          placeholderTextColor={theme?.colors?.textTertiary || '#999'}
                          maxLength={2}
                        />
                        
                        <TouchableOpacity
                          style={{ marginTop: 8 }}
                          onPress={() => setShowSymbolPicker(!showSymbolPicker)}
                        >
                          <Typography variant="caption1" color="primary">
                            {showSymbolPicker ? 'Hide Symbol Picker' : 'Show Symbol Picker'}
                          </Typography>
                        </TouchableOpacity>

                        {showSymbolPicker && (
                          <View style={styles.symbolPicker}>
                            {SYMBOL_OPTIONS.map((symbol) => (
                              <TouchableOpacity
                                key={symbol}
                                style={[
                                  styles.symbolOption,
                                  newSymbol === symbol && styles.symbolOptionSelected,
                                ]}
                                onPress={() => setNewSymbol(symbol)}
                              >
                                <Text style={styles.symbolText}>{symbol}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>

                      {/* Label Input */}
                      <View style={styles.formRow}>
                        <Text style={styles.formLabel}>Label</Text>
                        <TextInput
                          style={styles.textInput}
                          value={newLabel}
                          onChangeText={setNewLabel}
                          placeholder="e.g., Important, Priority, Idea"
                          placeholderTextColor={theme?.colors?.textTertiary || '#999'}
                        />
                      </View>

                      {/* Description Input */}
                      <View style={styles.formRow}>
                        <Text style={styles.formLabel}>Description (Optional)</Text>
                        <TextInput
                          style={styles.textInput}
                          value={newDescription}
                          onChangeText={setNewDescription}
                          placeholder="Describe when to use this signifier"
                          placeholderTextColor={theme?.colors?.textTertiary || '#999'}
                          multiline
                          numberOfLines={2}
                        />
                      </View>

                      {/* Color Picker */}
                      <View style={styles.formRow}>
                        <Text style={styles.formLabel}>Color</Text>
                        <View style={styles.colorPicker}>
                          {PREDEFINED_COLORS.map((color) => (
                            <TouchableOpacity
                              key={color}
                              style={[
                                styles.colorOption,
                                { backgroundColor: color },
                                newColor === color && styles.colorOptionSelected,
                              ]}
                              onPress={() => setNewColor(color)}
                            />
                          ))}
                        </View>
                      </View>

                      <View style={styles.formButtons}>
                        <PaperButton
                          variant="pencil"
                          size="sm"
                          title="Cancel"
                          onPress={resetForm}
                          style={{ marginRight: 8 }}
                        />
                        <PaperButton
                          variant="ink"
                          size="sm"
                          title={editingSignifier ? 'Update' : 'Create'}
                          onPress={handleSave}
                        />
                      </View>
                    </View>
                  )}
                </>
              )}

              {/* Existing Signifiers */}
              <Typography variant="body" color="text" style={{ marginBottom: 8 }}>
                {selectionMode ? 'Choose a signifier:' : `Your Signifiers (${customSignifiers.length})`}
              </Typography>
              
              <View style={styles.signifierGrid}>
                {customSignifiers.map((signifier) => (
                  <TouchableOpacity
                    key={signifier.id}
                    style={[
                      styles.signifierCard,
                      selectionMode && styles.signifierCardSelected,
                    ]}
                    onPress={() => handleSignifierSelect(signifier)}
                  >
                    <View style={styles.signifierHeader}>
                      <Text style={[styles.signifierSymbol, { color: signifier.color }]}>
                        {signifier.symbol}
                      </Text>
                      <Text style={styles.signifierLabel} numberOfLines={1}>
                        {signifier.label}
                      </Text>
                      {!selectionMode && (
                        <View style={styles.actionButtons}>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleEdit(signifier)}
                          >
                            <Ionicons name="pencil" size={16} color={theme?.colors?.primary || '#0F2A44'} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleDelete(signifier)}
                          >
                            <Ionicons name="trash" size={16} color={theme?.colors?.error || '#B91C1C'} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                    {signifier.description && (
                      <Text style={styles.signifierDescription} numberOfLines={2}>
                        {signifier.description}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {customSignifiers.length === 0 && (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Ionicons name="create-outline" size={48} color={theme?.colors?.textTertiary || '#999'} />
                  <Typography variant="body" color="textSecondary" style={{ textAlign: 'center', marginTop: 12 }}>
                    {selectionMode 
                      ? 'No custom signifiers created yet.'
                      : 'Create your first custom signifier to personalize your bullet journal.'
                    }
                  </Typography>
                </View>
              )}
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.buttonRow}>
              <PaperButton
                variant="pencil"
                size="md"
                title={selectionMode ? 'Cancel' : 'Close'}
                onPress={onClose}
              />
            </View>
          </View>
        </Card>
      </View>
    </Modal>
  );
};