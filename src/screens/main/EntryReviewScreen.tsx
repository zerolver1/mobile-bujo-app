import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BuJoEntry, OCRResult } from '../../types/BuJo';
import { useBuJoStore } from '../../stores/BuJoStore';
import { appleIntegrationService } from '../../services/apple-integration/AppleIntegrationService';

interface EntryReviewScreenProps {
  navigation: any;
  route: {
    params: {
      imageUri: string;
      ocrResult: OCRResult;
      parsedEntries: BuJoEntry[];
    };
  };
}

export const EntryReviewScreen: React.FC<EntryReviewScreenProps> = ({
  navigation,
  route,
}) => {
  const { imageUri, ocrResult, parsedEntries } = route.params;
  const [entries, setEntries] = useState<BuJoEntry[]>(parsedEntries);
  const [saving, setSaving] = useState(false);
  
  const { addEntry, updateEntry: updateStoreEntry, addScan } = useBuJoStore();

  const updateEntry = (index: number, field: keyof BuJoEntry, value: any) => {
    const updatedEntries = [...entries];
    updatedEntries[index] = { ...updatedEntries[index], [field]: value };
    setEntries(updatedEntries);
  };

  const deleteEntry = (index: number) => {
    const updatedEntries = entries.filter((_, i) => i !== index);
    setEntries(updatedEntries);
  };

  const addNewEntry = () => {
    const newEntry: BuJoEntry = {
      id: `manual-${Date.now()}`,
      type: 'task',
      content: '',
      status: 'incomplete',
      priority: 'none',
      createdAt: new Date(),
      tags: [],
      contexts: [],
      collection: 'daily',
      collectionDate: new Date().toISOString().split('T')[0],
      sourceImage: imageUri,
      ocrConfidence: 1.0 // Manual entry has perfect confidence
    };
    setEntries([...entries, newEntry]);
  };

  const saveEntries = async () => {
    setSaving(true);
    
    try {
      // Add scan record
      addScan({
        imageUri,
        hash: `scan-${Date.now()}`,
        ocrText: ocrResult.text,
        confidence: ocrResult.confidence,
        extractedEntries: entries.map(e => e.id),
      });

      // Track sync results
      let syncedCount = 0;
      let failedSyncs: string[] = [];

      // Add all entries to the store and sync to Apple apps
      for (const entry of entries) {
        if (entry.content.trim()) {
          // Add to local store first
          const savedEntry = addEntry({
            type: entry.type,
            content: entry.content,
            status: entry.status,
            priority: entry.priority,
            collection: entry.collection,
            collectionDate: entry.collectionDate,
            tags: entry.tags,
            contexts: entry.contexts,
            sourceImage: imageUri,
            ocrConfidence: entry.ocrConfidence
          });

          // Attempt to sync to Apple apps
          try {
            if (appleIntegrationService.isAvailable()) {
              const syncResult = await appleIntegrationService.syncEntry(savedEntry);
              
              // Update entry with Apple IDs if sync successful
              if (syncResult.reminderId || syncResult.eventId) {
                updateStoreEntry(savedEntry.id, {
                  appleReminderId: syncResult.reminderId,
                  appleEventId: syncResult.eventId,
                  lastSyncAt: new Date()
                });
                console.log(`Synced entry "${entry.content}" to Apple:`, syncResult);
                syncedCount++;
              }
            }
          } catch (syncError) {
            console.warn(`Failed to sync entry "${entry.content}" to Apple:`, syncError);
            failedSyncs.push(entry.content);
          }
        }
      }

      navigation.goBack();
      
      // Show success message with sync status
      const totalEntries = entries.filter(e => e.content.trim()).length;
      let message = `Added ${totalEntries} entries to your journal.`;
      
      if (appleIntegrationService.isAvailable()) {
        if (syncedCount > 0) {
          message += `\n\n✓ ${syncedCount} entries synced to Apple Reminders & Calendar.`;
        }
        if (failedSyncs.length > 0) {
          message += `\n\n⚠️ ${failedSyncs.length} entries failed to sync to Apple apps.`;
        }
      } else {
        message += '\n\nApple integration not available on this device.';
      }
      
      Alert.alert('Entries Saved!', message, [{ text: 'OK' }]);
      
    } catch (error) {
      console.error('Failed to save entries:', error);
      Alert.alert('Error', 'Failed to save entries. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getBulletSymbol = (type: string, status: string) => {
    if (type === 'task') {
      switch (status) {
        case 'complete': return '✓';
        case 'migrated': return '>';
        case 'scheduled': return '<';
        default: return '•';
      }
    }
    return type === 'event' ? '○' : '—';
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'task': return 'Task';
      case 'event': return 'Event';
      case 'note': return 'Note';
      default: return type;
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'complete': return 'Complete';
      case 'migrated': return 'Migrated';
      case 'scheduled': return 'Scheduled';
      case 'cancelled': return 'Cancelled';
      case 'incomplete': return 'Pending';
      default: return status;
    }
  };

  const EntryTypeSelector = ({ entry, index }: { entry: BuJoEntry; index: number }) => (
    <View style={styles.typeSelectorContainer}>
      <View style={styles.detectedInfo}>
        <Text style={styles.detectedLabel}>
          Detected: {getTypeLabel(entry.type)}
          {entry.status !== 'incomplete' && ` (${getStatusLabel(entry.status)})`}
        </Text>
      </View>
      <View style={styles.typeSelector}>
        {['task', 'event', 'note'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeButton,
              entry.type === type && styles.typeButtonActive
            ]}
            onPress={() => updateEntry(index, 'type', type)}
          >
            <View style={styles.typeButtonContent}>
              <Text style={[
                styles.typeButtonText,
                entry.type === type && styles.typeButtonTextActive
              ]}>
                {type === 'task' ? '•' : type === 'event' ? '○' : '—'}
              </Text>
              <Text style={[
                styles.typeButtonLabel,
                entry.type === type && styles.typeButtonLabelActive
              ]}>
                {getTypeLabel(type)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Entries</Text>
        <TouchableOpacity onPress={saveEntries} disabled={saving}>
          <Text style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* OCR Result Info */}
        <View style={styles.ocrInfo}>
          <View style={styles.imagePreview}>
            <Image source={{ uri: imageUri }} style={styles.image} />
          </View>
          <View style={styles.ocrStats}>
            <Text style={styles.confidence}>
              Confidence: {Math.round(ocrResult.confidence * 100)}%
            </Text>
            <Text style={styles.entriesCount}>
              {entries.length} entries found
            </Text>
          </View>
        </View>

        {/* Entries List */}
        <View style={styles.entriesSection}>
          <Text style={styles.sectionTitle}>Extracted Entries</Text>
          
          {entries.map((entry, index) => (
            <View key={index} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <EntryTypeSelector entry={entry} index={index} />
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteEntry(index)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.entryInput}
                value={entry.content}
                onChangeText={(text) => updateEntry(index, 'content', text)}
                placeholder="Enter bullet journal entry..."
                multiline
                autoCapitalize="sentences"
              />
              
              {entry.ocrConfidence !== undefined && (
                <Text style={styles.confidenceText}>
                  OCR Confidence: {Math.round(entry.ocrConfidence * 100)}%
                </Text>
              )}
            </View>
          ))}

          {/* Add New Entry Button */}
          <TouchableOpacity style={styles.addButton} onPress={addNewEntry}>
            <Ionicons name="add" size={24} color="#007AFF" />
            <Text style={styles.addButtonText}>Add Entry</Text>
          </TouchableOpacity>
        </View>

        {/* OCR Text Preview */}
        <View style={styles.ocrTextSection}>
          <Text style={styles.sectionTitle}>Raw OCR Text</Text>
          <View style={styles.ocrTextContainer}>
            <Text style={styles.ocrText}>{ocrResult.text}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  saveButton: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  ocrInfo: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  imagePreview: {
    marginRight: 16,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  ocrStats: {
    flex: 1,
    justifyContent: 'center',
  },
  confidence: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  entriesCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  entriesSection: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    padding: 20,
    paddingBottom: 12,
  },
  entryCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  typeSelectorContainer: {
    flex: 1,
  },
  detectedInfo: {
    marginBottom: 8,
  },
  detectedLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  typeSelector: {
    flexDirection: 'row',
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 18,
    color: '#8E8E93',
    marginRight: 4,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  typeButtonLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  typeButtonLabelActive: {
    color: '#FFFFFF',
  },
  deleteButton: {
    padding: 8,
  },
  entryInput: {
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  confidenceText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  ocrTextSection: {
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  ocrTextContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  ocrText: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
    fontFamily: 'Menlo',
  },
});