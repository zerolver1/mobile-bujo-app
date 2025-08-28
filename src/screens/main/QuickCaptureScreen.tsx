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
}

export const QuickCaptureScreen: React.FC<QuickCaptureScreenProps> = ({ navigation }) => {
  const [content, setContent] = useState('');
  const [selectedBullet, setSelectedBullet] = useState(0);
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const { addEntry } = useBuJoStore();

  const bullets = [
    { symbol: '•', type: 'task', status: 'incomplete', label: 'Task', color: '#007AFF' },
    { symbol: 'X', type: 'task', status: 'complete', label: 'Complete', color: '#34C759' },
    { symbol: '>', type: 'task', status: 'migrated', label: 'Migrated', color: '#FF9500' },
    { symbol: '<', type: 'task', status: 'scheduled', label: 'Scheduled', color: '#5856D6' },
    { symbol: '~', type: 'task', status: 'cancelled', label: 'Cancelled', color: '#8E8E93' },
    { symbol: 'O', type: 'event', status: 'incomplete', label: 'Event', color: '#FF3B30' },
    { symbol: '—', type: 'note', status: 'incomplete', label: 'Note', color: '#32D74B' },
    { symbol: '!', type: 'note', status: 'incomplete', label: 'Idea', color: '#FFD60A' },
  ];

  const currentBullet = bullets[selectedBullet];

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Empty Entry', 'Please enter some content for your bullet journal entry.');
      return;
    }

    const entry: Omit<BuJoEntry, 'id'> = {
      type: currentBullet.type as 'task' | 'event' | 'note',
      status: currentBullet.status as BuJoEntry['status'],
      content: content.trim(),
      priority: 'none',
      createdAt: new Date(),
      tags: extractTags(content),
      contexts: extractContexts(content),
      collection: 'daily',
      collectionDate: targetDate,
    };

    try {
      await addEntry(entry);
      Alert.alert(
        'Entry Added',
        `Your ${currentBullet.label.toLowerCase()} has been added to your journal.`,
        [
          { text: 'Add Another', onPress: () => setContent('') },
          { text: 'Done', onPress: () => navigation.goBack() },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    }
  };

  const extractTags = (text: string): string[] => {
    const matches = text.match(/#([a-zA-Z0-9_]+)/g);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  };

  const extractContexts = (text: string): string[] => {
    const matches = text.match(/@([a-zA-Z0-9_]+)/g);
    return matches ? matches.map(context => context.substring(1)) : [];
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#8E8E93" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quick Capture</Text>
        <TouchableOpacity onPress={handleSave} disabled={!content.trim()}>
          <Text style={[
            styles.saveButton,
            !content.trim() && styles.saveButtonDisabled
          ]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Selection Display */}
        <View style={styles.currentSelection}>
          <View style={[styles.selectedBullet, { backgroundColor: currentBullet.color }]}>
            <Text style={styles.selectedBulletText}>{currentBullet.symbol}</Text>
          </View>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionType}>{currentBullet.label}</Text>
            <Text style={styles.selectionTarget}>Adding to {formatDate(targetDate)}</Text>
          </View>
        </View>

        {/* Bullet Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bullet Type</Text>
          <View style={styles.bulletGrid}>
            {bullets.map((bullet, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.bulletButton,
                  selectedBullet === index && styles.bulletButtonActive,
                  { borderColor: bullet.color }
                ]}
                onPress={() => setSelectedBullet(index)}
              >
                <View style={[styles.bulletCircle, { backgroundColor: bullet.color }]}>
                  <Text style={styles.bulletSymbol}>{bullet.symbol}</Text>
                </View>
                <Text style={[
                  styles.bulletLabel,
                  selectedBullet === index && styles.bulletLabelActive
                ]}>
                  {bullet.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Content Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content</Text>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder={`Enter your ${currentBullet.label.toLowerCase()}...`}
            multiline
            autoCapitalize="sentences"
            autoFocus
            textAlignVertical="top"
          />
          
          <View style={styles.inputHelp}>
            <Text style={styles.helpText}>
              Use @context and #tags in your text. They'll be automatically detected.
            </Text>
            {(content.includes('@') || content.includes('#')) && (
              <View style={styles.detectedTags}>
                {extractContexts(content).length > 0 && (
                  <View style={styles.tagGroup}>
                    <Text style={styles.tagGroupTitle}>Contexts:</Text>
                    {extractContexts(content).map((context, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>@{context}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {extractTags(content).length > 0 && (
                  <View style={styles.tagGroup}>
                    <Text style={styles.tagGroupTitle}>Tags:</Text>
                    {extractTags(content).map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Date Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add to Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
            {getDateOptions().map((date) => (
              <TouchableOpacity
                key={date}
                style={[
                  styles.dateButton,
                  targetDate === date && styles.dateButtonActive
                ]}
                onPress={() => setTargetDate(date)}
              >
                <Text style={[
                  styles.dateButtonText,
                  targetDate === date && styles.dateButtonTextActive
                ]}>
                  {formatDate(date)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  saveButtonDisabled: {
    color: '#8E8E93',
  },
  content: {
    flex: 1,
  },
  currentSelection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 12,
  },
  selectedBullet: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  selectedBulletText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectionInfo: {
    flex: 1,
  },
  selectionType: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  selectionTarget: {
    fontSize: 16,
    color: '#8E8E93',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  bulletGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bulletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E5E7',
    backgroundColor: '#F2F2F7',
  },
  bulletButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  bulletCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  bulletSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bulletLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  bulletLabelActive: {
    fontWeight: '600',
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1C1C1E',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  inputHelp: {
    marginTop: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  detectedTags: {
    marginTop: 12,
  },
  tagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tagGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginRight: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    marginRight: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  dateScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  dateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5E7',
    marginRight: 8,
  },
  dateButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  dateButtonTextActive: {
    color: '#FFFFFF',
  },
});