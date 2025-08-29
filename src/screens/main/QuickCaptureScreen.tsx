import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BuJoEntry } from '../../types/BuJo';
import { useBuJoStore } from '../../stores/BuJoStore';

interface QuickCaptureScreenProps {
  navigation: any;
  route?: {
    params?: {
      editEntry?: BuJoEntry;
    };
  };
}

export const QuickCaptureScreen: React.FC<QuickCaptureScreenProps> = ({ navigation, route }) => {
  const editEntry = route?.params?.editEntry;
  const [content, setContent] = useState(editEntry?.content || '');
  const [selectedBullet, setSelectedBullet] = useState(editEntry ? getBulletIndex(editEntry) : 0);
  const [priority, setPriority] = useState<'none' | 'low' | 'medium' | 'high'>(editEntry?.priority || 'none');
  const [targetDate, setTargetDate] = useState(editEntry?.collectionDate || new Date().toISOString().split('T')[0]);
  const { addEntry, updateEntry } = useBuJoStore();

  // Helper function to get bullet index from entry
  function getBulletIndex(entry: BuJoEntry): number {
    if (entry.type === 'task') {
      switch (entry.status) {
        case 'complete': return 1;
        case 'migrated': return 2;
        case 'scheduled': return 3;
        case 'cancelled': return 4;
        default: return 0; // incomplete
      }
    } else if (entry.type === 'event') {
      return 5;
    } else if (entry.type === 'note') {
      return 6;
    } else if (entry.type === 'inspiration') {
      return 7;
    } else if (entry.type === 'research') {
      return 8;
    } else if (entry.type === 'memory') {
      return 9;
    }
    return 0; // fallback to task
  }

  const bullets = [
    // Tasks - Follow BuJo methodology: Only create incomplete tasks, complete through swipe/tap
    { symbol: '•', type: 'task' as const, status: 'incomplete' as const, label: 'Task', color: '#1C1C1E', description: 'Things you need to do' },
    
    // Task Status Indicators - For editing existing tasks only
    { symbol: '✗', type: 'task' as const, status: 'complete' as const, label: 'Complete', color: '#34C759', description: 'Task completed' },
    { symbol: '>', type: 'task' as const, status: 'migrated' as const, label: 'Migrated', color: '#FF9500', description: 'Task migrated to future' },
    { symbol: '<', type: 'task' as const, status: 'scheduled' as const, label: 'Scheduled', color: '#007AFF', description: 'Task scheduled in calendar' },
    { symbol: '/', type: 'task' as const, status: 'cancelled' as const, label: 'Cancelled', color: '#8E8E93', description: 'Task no longer relevant' },
    
    // Other Entry Types - Always incomplete when created
    { symbol: '○', type: 'event' as const, status: 'incomplete' as const, label: 'Event', color: '#007AFF', description: 'Appointments and experiences' },
    { symbol: '—', type: 'note' as const, status: 'incomplete' as const, label: 'Note', color: '#8E8E93', description: 'Ideas, thoughts, observations' },
    { symbol: '★', type: 'inspiration' as const, status: 'incomplete' as const, label: 'Inspiration', color: '#FFD60A', description: 'Ideas that inspire action' },
    { symbol: '&', type: 'research' as const, status: 'incomplete' as const, label: 'Research', color: '#5856D6', description: 'Things to investigate or explore' },
    { symbol: '◇', type: 'memory' as const, status: 'incomplete' as const, label: 'Memory', color: '#FF2D55', description: 'Gratitude, memories, and reflections' },
  ];
  
  const priorities = [
    { level: 'none' as const, symbol: '', label: 'None', color: '#8E8E93' },
    { level: 'low' as const, symbol: '∘', label: 'Low', color: '#34C759' },
    { level: 'medium' as const, symbol: '*', label: 'Medium', color: '#FF9500' },
    { level: 'high' as const, symbol: '!', label: 'High', color: '#FF3B30' },
  ];

  const currentBullet = bullets[selectedBullet];
  const currentPriority = priorities.find(p => p.level === priority) || priorities[0];

  const extractTags = (text: string): string[] => {
    const matches = text.match(/#([a-zA-Z0-9_]+)/g);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  };

  const extractContexts = (text: string): string[] => {
    const matches = text.match(/@([a-zA-Z0-9_]+)/g);
    return matches ? matches.map(context => context.substring(1)) : [];
  };

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Empty Entry', 'Please enter some content for your bullet journal entry.');
      return;
    }

    const tags = extractTags(content);
    const contexts = extractContexts(content);

    try {
      if (editEntry) {
        // Update existing entry
        updateEntry(editEntry.id, {
          type: currentBullet.type,
          content: content.trim(),
          status: currentBullet.status,
          priority,
          tags,
          contexts,
          collectionDate: targetDate,
        });
        
        Alert.alert('Success', 'Entry updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        // Create new entry
        const entry: Omit<BuJoEntry, 'id' | 'createdAt'> = {
          type: currentBullet.type,
          status: currentBullet.status,
          content: content.trim(),
          priority,
          tags,
          contexts,
          collection: 'daily',
          collectionDate: targetDate,
        };

        addEntry(entry);
        
        Alert.alert(
          'Entry Added',
          `Your ${currentBullet.label.toLowerCase()} has been added to your journal.`,
          [
            { text: 'Add Another', onPress: () => setContent('') },
            { text: 'Done', onPress: () => navigation.goBack() },
          ]
        );
      }
    } catch (error) {
      console.error('Failed to save entry:', error);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dateStr === today.toISOString().split('T')[0]) return 'Today';
    if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {editEntry ? 'Edit Entry' : 'Quick Capture'}
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Bullet Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entry Type</Text>
          <View style={styles.bulletGrid}>
            {bullets.map((bullet, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.bulletOption,
                  selectedBullet === index && styles.selectedBulletOption
                ]}
                onPress={() => setSelectedBullet(index)}
              >
                <Text 
                  style={[
                    styles.bulletSymbol, 
                    { color: bullet.color },
                    selectedBullet === index && styles.selectedBulletSymbol
                  ]}
                >
                  {bullet.symbol}
                </Text>
                <Text style={[
                  styles.bulletLabel,
                  selectedBullet === index && styles.selectedBulletLabel
                ]}>
                  {bullet.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.bulletDescription}>
            <Text style={styles.descriptionText}>
              {currentBullet.description}
            </Text>
          </View>
        </View>

        {/* Priority Selection (for tasks only) */}
        {currentBullet.type === 'task' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Priority</Text>
            <View style={styles.priorityRow}>
              {priorities.map((priorityOption) => (
                <TouchableOpacity
                  key={priorityOption.level}
                  style={[
                    styles.priorityOption,
                    priority === priorityOption.level && styles.selectedPriorityOption
                  ]}
                  onPress={() => setPriority(priorityOption.level)}
                >
                  {priorityOption.symbol ? (
                    <Text style={[styles.prioritySymbol, { color: priorityOption.color }]}>
                      {priorityOption.symbol}
                    </Text>
                  ) : (
                    <View style={styles.noPrioritySymbol} />
                  )}
                  <Text style={[
                    styles.priorityLabel,
                    priority === priorityOption.level && styles.selectedPriorityLabel
                  ]}>
                    {priorityOption.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Content Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content</Text>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder={`Enter your ${currentBullet.label.toLowerCase()}...`}
            multiline
            autoFocus={!editEntry}
            textAlignVertical="top"
          />
          <Text style={styles.helpText}>
            Use #tags and @contexts to organize your entries
          </Text>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
            {getDateOptions().map((date) => (
              <TouchableOpacity
                key={date}
                style={[
                  styles.dateOption,
                  targetDate === date && styles.selectedDateOption
                ]}
                onPress={() => setTargetDate(date)}
              >
                <Text style={[
                  styles.dateLabel,
                  targetDate === date && styles.selectedDateLabel
                ]}>
                  {formatDate(date)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.previewContainer}>
            <Text style={[styles.bulletSymbol, { color: currentBullet.color }]}>
              {currentBullet.symbol}
            </Text>
            {currentPriority.symbol && (
              <Text style={[styles.prioritySymbol, { color: currentPriority.color }]}>
                {currentPriority.symbol}
              </Text>
            )}
            <Text style={styles.previewContent}>
              {content || `Sample ${currentBullet.label.toLowerCase()}...`}
            </Text>
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
  cancelButton: {
    fontSize: 16,
    color: '#8E8E93',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  bulletGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bulletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 100,
  },
  selectedBulletOption: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  bulletSymbol: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
    fontFamily: 'Menlo', // Monospace for consistent alignment
  },
  selectedBulletSymbol: {
    // Keep original color
  },
  bulletLabel: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  selectedBulletLabel: {
    color: '#007AFF',
    fontWeight: '600',
  },
  bulletDescription: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityOption: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    flex: 1,
  },
  selectedPriorityOption: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  prioritySymbol: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Menlo',
  },
  noPrioritySymbol: {
    width: 16,
    height: 16,
    marginBottom: 4,
  },
  priorityLabel: {
    fontSize: 12,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  selectedPriorityLabel: {
    color: '#007AFF',
    fontWeight: '600',
  },
  contentInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1C1C1E',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  helpText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
    lineHeight: 16,
  },
  dateScroll: {
    flexDirection: 'row',
  },
  dateOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedDateOption: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  dateLabel: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  selectedDateLabel: {
    color: '#007AFF',
    fontWeight: '600',
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  previewContent: {
    fontSize: 16,
    color: '#1C1C1E',
    flex: 1,
    lineHeight: 22,
  },
});