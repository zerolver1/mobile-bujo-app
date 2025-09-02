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
import { DateSelectionModal } from '../../components/DateSelectionModal';
import { useTheme } from '../../theme';
import { PaperBackground, Typography, Card, PaperButton } from '../../components/ui/paperComponents';
import { BuJoSymbol } from '../../components/ui/BuJoSymbols';
import { safeThemeAccess } from '../../theme/paperStyleUtils';

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
  const { theme } = useTheme();
  const { imageUri, ocrResult, parsedEntries } = route.params;
  
  // Deserialize dates from navigation params
  const deserializedEntries = parsedEntries.map(entry => ({
    ...entry,
    createdAt: typeof entry.createdAt === 'string' ? new Date(entry.createdAt) : entry.createdAt,
    dueDate: typeof entry.dueDate === 'string' ? new Date(entry.dueDate) : entry.dueDate,
  }));
  
  const [entries, setEntries] = useState<BuJoEntry[]>(deserializedEntries);
  const [saving, setSaving] = useState(false);
  
  // Store original detected types - never changes after initialization
  const [originalDetections] = useState<{[id: string]: {type: string, status: string}}>(
    deserializedEntries.reduce((acc, entry) => {
      acc[entry.id] = { type: entry.type, status: entry.status };
      return acc;
    }, {} as {[id: string]: {type: string, status: string}})
  );

  // Date selection modal state
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [dateModalContext, setDateModalContext] = useState<{
    type: 'single' | 'batch';
    entryIndex?: number;
    targetDate?: string;
  }>({ type: 'single' });
  
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

  // Date selection handlers
  const handleDateSelect = (entryIndex: number) => {
    setDateModalContext({
      type: 'single',
      entryIndex,
      targetDate: entries[entryIndex]?.collectionDate,
    });
    setDateModalVisible(true);
  };

  const handleBatchDateSelect = (targetDate: string) => {
    setDateModalContext({
      type: 'batch',
      targetDate,
    });
    setDateModalVisible(true);
  };

  const handleDateModalSelect = (selectedDate: string) => {
    if (dateModalContext.type === 'single' && dateModalContext.entryIndex !== undefined) {
      // Update single entry
      updateEntry(dateModalContext.entryIndex, 'collectionDate', selectedDate);
    } else if (dateModalContext.type === 'batch') {
      // Update all entries with the same date as targetDate
      const targetDate = dateModalContext.targetDate;
      if (targetDate) {
        const updatedEntries = entries.map(entry => 
          entry.collectionDate === targetDate 
            ? { ...entry, collectionDate: selectedDate }
            : entry
        );
        setEntries(updatedEntries);
      }
    }
    setDateModalVisible(false);
  };

  const handleBatchDateForAll = () => {
    // Get the most common date to use as target
    const dateCounts = entries.reduce((acc, entry) => {
      acc[entry.collectionDate] = (acc[entry.collectionDate] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommonDate = Object.entries(dateCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || new Date().toISOString().split('T')[0];

    setDateModalContext({
      type: 'batch',
      targetDate: mostCommonDate,
    });
    setDateModalVisible(true);
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
      { symbol: '•', type: 'task', status: 'incomplete', label: 'Task', 
        color: safeThemeAccess(theme, t => t.colors.bujo?.task, '#2B2B2B'), description: 'Things you need to do' },
      { symbol: '✗', type: 'task', status: 'complete', label: 'Complete', 
        color: safeThemeAccess(theme, t => t.colors.bujo?.taskComplete, '#15803D'), description: 'Task completed' },
      { symbol: '>', type: 'task', status: 'migrated', label: 'Migrated', 
        color: safeThemeAccess(theme, t => t.colors.bujo?.taskMigrated, '#D97706'), description: 'Task migrated to future' },
      { symbol: '<', type: 'task', status: 'scheduled', label: 'Scheduled', 
        color: safeThemeAccess(theme, t => t.colors.bujo?.taskScheduled, '#1E40AF'), description: 'Task scheduled in calendar' },
      { symbol: '—', type: 'task', status: 'cancelled', label: 'Cancelled', 
        color: safeThemeAccess(theme, t => t.colors.bujo?.taskCancelled, '#9CA3AF'), description: 'Task no longer relevant' },
      { symbol: '○', type: 'event', status: 'incomplete', label: 'Event', 
        color: safeThemeAccess(theme, t => t.colors.bujo?.event, '#0F2A44'), description: 'Appointments and experiences' },
      { symbol: '–', type: 'note', status: 'incomplete', label: 'Note', 
        color: safeThemeAccess(theme, t => t.colors.bujo?.note, '#6B7280'), description: 'Ideas, thoughts, observations' },
      { symbol: '!', type: 'inspiration', status: 'incomplete', label: 'Inspiration', 
        color: safeThemeAccess(theme, t => t.colors.bujo?.inspiration, '#EAB308'), description: 'Ideas that inspire action' },
      { symbol: '?', type: 'research', status: 'incomplete', label: 'Research', 
        color: safeThemeAccess(theme, t => t.colors.bujo?.research, '#7C3AED'), description: 'Things to investigate or explore' },
      { symbol: '◇', type: 'memory', status: 'incomplete', label: 'Memory', 
        color: safeThemeAccess(theme, t => t.colors.bujo?.memory, '#BE185D'), description: 'Gratitude, memories, and reflections' },
    ];
    
    // Current bullet based on entry's current type/status (for the button)
    const currentBullet = bullets.find(b => 
      b.type === entry.type && b.status === entry.status
    ) || bullets[0];
    
    // Get the originally detected type from our permanent store
    const originalDetection = originalDetections[entry.id] || { type: entry.type, status: entry.status };
    const originalBullet = bullets.find(b => 
      b.type === originalDetection.type && b.status === originalDetection.status
    ) || bullets[0];
    
    const handleBulletSelect = (bullet: typeof bullets[0]) => {
      // Single state update to avoid race conditions
      const updatedEntries = [...entries];
      updatedEntries[index] = { 
        ...updatedEntries[index], 
        type: bullet.type,
        status: bullet.status
      };
      setEntries(updatedEntries);
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
          <Typography variant="caption1" color="textSecondary" style={styles.detectedLabel}>
            {getConfidenceIndicator()} Detected: {originalBullet.label}
          </Typography>
          <Typography variant="caption2" color="textTertiary" style={styles.detectedDescription}>
            {currentBullet.description}
          </Typography>
        </View>
        
        <TouchableOpacity 
          style={styles.currentBulletButton}
          onPress={() => setShowSelector(!showSelector)}
        >
          <BuJoSymbol 
            type={currentBullet.type} 
            status={currentBullet.status} 
            size="sm"
          />
          <Typography variant="footnote" style={styles.currentBulletLabel}>{currentBullet.label}</Typography>
        </TouchableOpacity>
        
        {showSelector && (
          <Card variant="elevated" padding="md" style={styles.bulletSelector}>
            <Typography variant="footnote" style={styles.selectorTitle}>Select bullet type:</Typography>
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
                  <BuJoSymbol 
                    type={bullet.type} 
                    status={bullet.status} 
                    size="sm"
                  />
                  <Typography 
                    variant="caption1"
                    style={[
                      styles.bulletLabel,
                      currentBullet.symbol === bullet.symbol && { 
                        color: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF') 
                      }
                    ]}
                  >
                    {bullet.label}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}
      </View>
    );
  };

  return (
    <PaperBackground variant="lined" showMargin={true} intensity="light">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <Card variant="elevated" padding="md" style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')} 
            />
          </TouchableOpacity>
          <Typography variant="headline" color="text">Review Entries</Typography>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handleBatchDateForAll} style={styles.dateButton}>
              <Ionicons 
                name="calendar-outline" 
                size={20} 
                color={safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')} 
              />
            </TouchableOpacity>
            <PaperButton 
              variant="ink" 
              size="sm" 
              onPress={saveEntries} 
              disabled={saving}
            >
              <Typography variant="callout">
                {saving ? 'Saving...' : 'Save'}
              </Typography>
            </PaperButton>
          </View>
        </Card>

        <ScrollView style={styles.content}>
          {/* OCR Result Info */}
          <Card variant="elevated" padding="lg" style={styles.ocrInfo}>
            <View style={styles.imagePreview}>
              <Image source={{ uri: imageUri }} style={styles.image} />
            </View>
            <View style={styles.ocrStats}>
              <Typography variant="callout" style={styles.confidence}>
                Confidence: {Math.round(ocrResult.confidence * 100)}%
              </Typography>
              <Typography variant="footnote" color="textSecondary">
                {entries.length} entries found
              </Typography>
            </View>
          </Card>

          {/* Entries List */}
          <Card variant="elevated" padding="lg" style={styles.entriesSection}>
            <Typography variant="title2" color="text" style={styles.sectionTitle}>
              {entries.length} entries found
            </Typography>
          
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
                    <TouchableOpacity 
                      style={styles.dateHeader}
                      onPress={() => handleBatchDateSelect(date)}
                    >
                      <View style={styles.dateHeaderLeft}>
                        <Typography variant="callout" style={styles.dateLabel}>{formatDate(date)}</Typography>
                        <Typography variant="footnote" color="textSecondary" style={styles.entryCount}>
                          {group.entries.length} {group.entries.length === 1 ? 'entry' : 'entries'}
                        </Typography>
                      </View>
                      <Ionicons 
                        name="calendar-outline" 
                        size={20} 
                        color={safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')} 
                      />
                    </TouchableOpacity>
                    
                    {group.entries.map((entry, groupIndex) => {
                      const originalIndex = group.indices[groupIndex];
                      return (
                        <Card key={originalIndex} variant="flat" padding="md" style={styles.entryCard}>
                          <View style={styles.entryHeader}>
                            <BulletSelector key={`${originalIndex}-${entries[originalIndex]?.type}-${entries[originalIndex]?.status}`} entry={entries[originalIndex]} index={originalIndex} />
                            <View style={styles.entryActions}>
                              <TouchableOpacity
                                style={styles.dateActionButton}
                                onPress={() => handleDateSelect(originalIndex)}
                              >
                                <Ionicons 
                                  name="calendar-outline" 
                                  size={16} 
                                  color={safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')} 
                                />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => deleteEntry(originalIndex)}
                              >
                                <Ionicons 
                                  name="trash-outline" 
                                  size={20} 
                                  color={safeThemeAccess(theme, t => t.colors.error, '#B91C1C')} 
                                />
                              </TouchableOpacity>
                            </View>
                          </View>
                          
                          <TextInput
                            style={[
                              styles.entryInput,
                              {
                                backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#F5F2E8'),
                                borderColor: safeThemeAccess(theme, t => t.colors.border, '#E8E3D5'),
                                color: safeThemeAccess(theme, t => t.colors.text, '#2B2B2B')
                              }
                            ]}
                            value={entry.content}
                            onChangeText={(text) => updateEntry(originalIndex, 'content', text)}
                            placeholder="Enter bullet journal entry..."
                            placeholderTextColor={safeThemeAccess(theme, t => t.colors.textSecondary, '#6B7280')}
                            multiline
                            autoCapitalize="sentences"
                          />
                          
                          {entry.ocrConfidence !== undefined && (
                            <Typography variant="caption1" color="textSecondary" style={styles.confidenceText}>
                              OCR Confidence: {Math.round(entry.ocrConfidence * 100)}%
                            </Typography>
                          )}
                        </Card>
                      );
                    })}
                  </View>
                );
              });
          })()}

            {/* Add New Entry Button */}
            <PaperButton 
              variant="outline" 
              size="md" 
              onPress={addNewEntry}
              style={styles.addButton}
            >
              <Ionicons 
                name="add" 
                size={24} 
                color={safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')} 
              />
              <Typography variant="callout" style={styles.addButtonText}>Add Entry</Typography>
            </PaperButton>
          </Card>

          {/* OCR Text Preview */}
          <Card variant="elevated" padding="lg" style={styles.ocrTextSection}>
            <Typography variant="title2" color="text" style={styles.sectionTitle}>Raw OCR Text</Typography>
            <Card variant="flat" padding="md" style={styles.ocrTextContainer}>
              <Typography variant="footnote" style={styles.ocrText}>{ocrResult.text}</Typography>
            </Card>
          </Card>
        </ScrollView>
        
        {/* Date Selection Modal */}
        <DateSelectionModal
          visible={dateModalVisible}
          onClose={() => setDateModalVisible(false)}
          onSelectDate={handleDateModalSelect}
          initialDate={dateModalContext.targetDate}
          title={
            dateModalContext.type === 'single' 
              ? 'Select Entry Date' 
              : `Change Date for ${entries.filter(e => e.collectionDate === dateModalContext.targetDate).length} Entries`
          }
          showBatchOption={dateModalContext.type === 'single'}
          onBatchSelect={() => {
            if (dateModalContext.entryIndex !== undefined) {
              const entryDate = entries[dateModalContext.entryIndex]?.collectionDate;
              if (entryDate) {
                handleBatchDateSelect(entryDate);
              }
            }
          }}
        />
      </SafeAreaView>
    </PaperBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  ocrInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  imagePreview: {
    marginRight: 16,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  ocrStats: {
    flex: 1,
    justifyContent: 'center',
  },
  confidence: {
    marginBottom: 4,
  },
  entriesSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 12,
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
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(139, 69, 19, 0.1)',
  },
  dateHeaderLeft: {
    flex: 1,
  },
  entryCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  entryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateActionButton: {
    padding: 6,
    borderRadius: 8,
  },
  bulletSelectorContainer: {
    flex: 1,
  },
  detectedInfo: {
    marginBottom: 8,
  },
  detectedDescription: {
    marginTop: 2,
  },
  currentBulletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  currentBulletLabel: {
    marginLeft: 6,
  },
  bulletSelector: {
    marginTop: 12,
  },
  selectorTitle: {
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
    borderWidth: 1,
  },
  bulletButtonActive: {
    backgroundColor: '#0F2A44',
    borderColor: '#0F2A44',
  },
  bulletLabel: {
    marginLeft: 4,
  },
  deleteButton: {
    padding: 8,
  },
  entryInput: {
    fontSize: 16,
    borderRadius: 8,
    padding: 12,
    minHeight: 44,
    borderWidth: 1,
  },
  confidenceText: {
    marginTop: 8,
  },
  addButton: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  addButtonText: {
    marginLeft: 8,
  },
  ocrTextSection: {
    marginBottom: 20,
  },
  ocrTextContainer: {
    marginTop: 12,
  },
  ocrText: {
    lineHeight: 20,
    fontFamily: 'Menlo',
  },
});