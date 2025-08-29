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
  
  // Deserialize dates from navigation params
  const deserializedEntries = parsedEntries.map(entry => ({
    ...entry,
    createdAt: typeof entry.createdAt === 'string' ? new Date(entry.createdAt) : entry.createdAt,
    dueDate: typeof entry.dueDate === 'string' ? new Date(entry.dueDate) : entry.dueDate,
  }));
  
  const [entries, setEntries] = useState<BuJoEntry[]>(deserializedEntries);
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

      // Smart routing based on entry dates
      const today = new Date().toISOString().split('T')[0];
      const hasToday = entries.some(e => e.collectionDate === today);
      const hasFuture = entries.some(e => e.collectionDate > today);
      
      // Navigate intelligently based on content
      if (hasToday) {
        // If entries are for today, reset to DailyLog tab
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      } else if (hasFuture) {
        // If entries are future-dated, reset to Collections tab
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      } else {
        // Default: go back to previous screen
        navigation.goBack();
      }
      
      // Show success message with sync status and routing info
      const totalEntries = entries.filter(e => e.content.trim()).length;
      let message = `Added ${totalEntries} entries to your journal.`;
      
      if (hasToday) {
        message += '\n\n📅 Navigated to Daily Log to see your entries.';
      } else if (hasFuture) {
        message += '\n\n🗂️ Navigated to Collections to organize future entries.';
      }
      
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

  const BulletSelector = ({ entry, index }: { entry: BuJoEntry; index: number }) => {
    const [showSelector, setShowSelector] = useState(false);
    
    const bullets = [
      { symbol: '•', type: 'task', status: 'incomplete', label: 'Task', color: '#1C1C1E' },
      { symbol: '✗', type: 'task', status: 'complete', label: 'Complete', color: '#34C759' },
      { symbol: '>', type: 'task', status: 'migrated', label: 'Migrated', color: '#FF9500' },
      { symbol: '<', type: 'task', status: 'scheduled', label: 'Scheduled', color: '#007AFF' },
      { symbol: '/', type: 'task', status: 'cancelled', label: 'Cancelled', color: '#8E8E93' },
      { symbol: '○', type: 'event', status: 'incomplete', label: 'Event', color: '#007AFF' },
      { symbol: '—', type: 'note', status: 'incomplete', label: 'Note', color: '#8E8E93' },
      { symbol: '★', type: 'inspiration', status: 'incomplete', label: 'Inspiration', color: '#FFD60A' },
      { symbol: '&', type: 'research', status: 'incomplete', label: 'Research', color: '#5856D6' },
      { symbol: '◇', type: 'memory', status: 'incomplete', label: 'Memory', color: '#FF2D55' },
    ];
    
    const currentBullet = bullets.find(b => 
      b.type === entry.type && b.status === entry.status
    ) || bullets[0];
    
    const handleBulletSelect = (bullet: typeof bullets[0]) => {
      updateEntry(index, 'type', bullet.type);
      updateEntry(index, 'status', bullet.status);
      setShowSelector(false);
    };
    
    const getConfidenceIndicator = () => {
      const confidence = entry.ocrConfidence || 0;
      if (confidence > 0.8) return '✓';
      if (confidence > 0.6) return '⚠️';
      return '❓';
    };

    return (
      <View style={styles.bulletSelectorContainer}>
        <View style={styles.detectedInfo}>
          <Text style={styles.detectedLabel}>
            {getConfidenceIndicator()} Detected: {currentBullet.label}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.currentBulletButton}
          onPress={() => setShowSelector(!showSelector)}
        >
          <Text style={[styles.currentBulletSymbol, { color: currentBullet.color }]}>{currentBullet.symbol}</Text>
          <Text style={styles.currentBulletLabel}>{currentBullet.label}</Text>
        </TouchableOpacity>
        
        {showSelector && (
          <View style={styles.bulletSelector}>
            <Text style={styles.selectorTitle}>Select bullet type:</Text>
            <View style={styles.bulletGrid}>
              {bullets.map((bullet, bulletIndex) => (
                <TouchableOpacity
                  key={bulletIndex}
                  style={[
                    styles.bulletButton,
                    currentBullet.symbol === bullet.symbol && styles.bulletButtonActive
                  ]}
                  onPress={() => handleBulletSelect(bullet)}
                >
                  <Text style={[
                    styles.bulletSymbol,
                    { color: bullet.color },
                    currentBullet.symbol === bullet.symbol && styles.bulletSymbolActive
                  ]}>
                    {bullet.symbol}
                  </Text>
                  <Text style={[
                    styles.bulletLabel,
                    currentBullet.symbol === bullet.symbol && styles.bulletLabelActive
                  ]}>
                    {bullet.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

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
          <Text style={styles.sectionTitle}>
            {entries.length} entries found
          </Text>
          
          {(() => {
            // Group entries by date
            const groupedEntries: { [date: string]: { entries: typeof entries; indices: number[] } } = {};
            entries.forEach((entry, index) => {
              const date = entry.collectionDate || new Date().toISOString().split('T')[0];
              if (!groupedEntries[date]) {
                groupedEntries[date] = { entries: [], indices: [] };
              }
              groupedEntries[date].entries.push(entry);
              groupedEntries[date].indices.push(index);
            });

            return Object.entries(groupedEntries)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, group]) => {
                const dateObj = new Date(date);
                const today = new Date().toISOString().split('T')[0];
                const isToday = date === today;
                
                const formatDate = (dateStr: string) => {
                  const date = new Date(dateStr);
                  const today = new Date();
                  const tomorrow = new Date(today);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  
                  if (dateStr === today.toISOString().split('T')[0]) return 'Today';
                  if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow';
                  
                  return date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  });
                };

                return (
                  <View key={date} style={styles.dateGroup}>
                    <View style={styles.dateHeader}>
                      <Text style={styles.dateLabel}>{formatDate(date)}</Text>
                      <Text style={styles.entryCount}>
                        {group.entries.length} {group.entries.length === 1 ? 'entry' : 'entries'}
                      </Text>
                    </View>
                    
                    {group.entries.map((entry, groupIndex) => {
                      const originalIndex = group.indices[groupIndex];
                      return (
                        <View key={originalIndex} style={styles.entryCard}>
                          <View style={styles.entryHeader}>
                            <BulletSelector entry={entry} index={originalIndex} />
                            <TouchableOpacity
                              style={styles.deleteButton}
                              onPress={() => deleteEntry(originalIndex)}
                            >
                              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                            </TouchableOpacity>
                          </View>
                          
                          <TextInput
                            style={styles.entryInput}
                            value={entry.content}
                            onChangeText={(text) => updateEntry(originalIndex, 'content', text)}
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
                      );
                    })}
                  </View>
                );
              });
          })()}

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
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E5E7',
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  entryCount: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
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
  bulletSelectorContainer: {
    flex: 1,
  },
  detectedInfo: {
    marginBottom: 8,
  },
  detectedLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  currentBulletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    alignSelf: 'flex-start',
  },
  currentBulletSymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginRight: 6,
    fontFamily: 'Menlo', // Monospace for consistent alignment
  },
  currentBulletLabel: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  bulletSelector: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  bulletGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bulletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  bulletButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  bulletSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginRight: 4,
    fontFamily: 'Menlo', // Monospace for consistent alignment
  },
  bulletSymbolActive: {
    color: '#FFFFFF',
  },
  bulletLabel: {
    fontSize: 12,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  bulletLabelActive: {
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