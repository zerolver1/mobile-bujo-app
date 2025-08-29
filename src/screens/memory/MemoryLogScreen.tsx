import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useBuJoStore } from '../../stores/BuJoStore';
import { BuJoEntry } from '../../types/BuJo';

interface MemoryLogScreenProps {
  navigation: any;
}

interface MemoryStats {
  totalMemories: number;
  thisWeekMemories: number;
  currentStreak: number;
  favoriteGratitude: string[];
}

export const MemoryLogScreen: React.FC<MemoryLogScreenProps> = ({ navigation }) => {
  const { entries, addEntry, updateEntry, getEntriesByType } = useBuJoStore();
  const [memoryEntries, setMemoryEntries] = useState<BuJoEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemoryContent, setNewMemoryContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<'excellent' | 'good' | 'neutral' | 'poor'>('good');
  const [gratitudeItems, setGratitudeItems] = useState<string[]>(['']);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('timeline');

  useEffect(() => {
    const memories = getEntriesByType('memory');
    setMemoryEntries(memories.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
  }, [entries, getEntriesByType]);

  const getMemoryStats = (): MemoryStats => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // This week memories
    const thisWeekMemories = memoryEntries.filter(entry => 
      new Date(entry.createdAt) >= oneWeekAgo
    ).length;
    
    // Calculate current streak (consecutive days with memories)
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateString = checkDate.toISOString().split('T')[0];
      
      const hasMemoryOnDate = memoryEntries.some(entry => 
        entry.collectionDate === dateString
      );
      
      if (hasMemoryOnDate) {
        currentStreak++;
      } else if (i > 0) {
        break; // Streak broken
      }
    }
    
    // Favorite gratitude themes
    const allGratitude = memoryEntries
      .flatMap(entry => entry.gratitude || [])
      .reduce((acc: {[key: string]: number}, item) => {
        acc[item] = (acc[item] || 0) + 1;
        return acc;
      }, {});
    
    const favoriteGratitude = Object.entries(allGratitude)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([item]) => item);
    
    return {
      totalMemories: memoryEntries.length,
      thisWeekMemories,
      currentStreak,
      favoriteGratitude,
    };
  };

  const stats = getMemoryStats();

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'excellent': return '😊';
      case 'good': return '🙂';
      case 'neutral': return '😐';
      case 'poor': return '😔';
      default: return '🙂';
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'excellent': return '#34C759';
      case 'good': return '#32D74B';
      case 'neutral': return '#FF9500';
      case 'poor': return '#FF453A';
      default: return '#32D74B';
    }
  };

  const handleAddPhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to add photos to your memories.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedPhoto(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your camera to take photos for your memories.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedPhoto(result.assets[0].uri);
    }
  };

  const addGratitudeItem = () => {
    if (gratitudeItems.length < 5) {
      setGratitudeItems([...gratitudeItems, '']);
    }
  };

  const updateGratitudeItem = (index: number, value: string) => {
    const updated = [...gratitudeItems];
    updated[index] = value;
    setGratitudeItems(updated);
  };

  const removeGratitudeItem = (index: number) => {
    if (gratitudeItems.length > 1) {
      const updated = gratitudeItems.filter((_, i) => i !== index);
      setGratitudeItems(updated);
    }
  };

  const handleSaveMemory = async () => {
    if (!newMemoryContent.trim()) {
      Alert.alert('Empty Memory', 'Please add some content to your memory.');
      return;
    }

    const validGratitude = gratitudeItems.filter(item => item.trim().length > 0);
    
    try {
      const memoryEntry = {
        type: 'memory' as const,
        content: newMemoryContent.trim(),
        status: 'incomplete' as const,
        priority: 'none' as const,
        tags: ['memory', 'gratitude'],
        contexts: [],
        collection: 'daily' as const,
        collectionDate: new Date().toISOString().split('T')[0],
        mood: selectedMood,
        gratitude: validGratitude,
        photoUri: selectedPhoto || undefined,
      };

      addEntry(memoryEntry);
      
      // Reset form
      setNewMemoryContent('');
      setSelectedMood('good');
      setGratitudeItems(['']);
      setSelectedPhoto(null);
      setShowAddModal(false);
      
      Alert.alert('Memory Saved', 'Your memory has been added to your gratitude log.');
    } catch (error) {
      console.error('Failed to save memory:', error);
      Alert.alert('Error', 'Failed to save memory. Please try again.');
    }
  };

  const getPromptForToday = (): string => {
    const prompts = [
      "What made you smile today?",
      "What are three things you're grateful for right now?",
      "What's something beautiful you noticed today?",
      "Who or what brought you joy today?",
      "What achievement, big or small, are you proud of?",
      "What moment today would you like to remember forever?",
      "What kindness did you witness or experience?",
      "What challenge did you overcome today?",
      "What made you feel loved or appreciated?",
      "What's something new you learned or discovered?",
    ];
    
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return prompts[dayOfYear % prompts.length];
  };

  const renderMemoryCard = ({ item: memory }: { item: BuJoEntry }) => {
    const hasPhoto = memory.photoUri;
    const hasGratitude = memory.gratitude && memory.gratitude.length > 0;
    
    return (
      <TouchableOpacity style={styles.memoryCard} activeOpacity={0.7}>
        <View style={styles.memoryHeader}>
          <View style={styles.memoryDate}>
            <Text style={styles.memoryDateText}>
              {new Date(memory.createdAt).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
          </View>
          <View style={[styles.moodIndicator, { backgroundColor: getMoodColor(memory.mood || 'good') }]}>
            <Text style={styles.moodEmoji}>{getMoodEmoji(memory.mood || 'good')}</Text>
          </View>
        </View>
        
        {hasPhoto && (
          <Image source={{ uri: memory.photoUri }} style={styles.memoryPhoto} />
        )}
        
        <Text style={styles.memoryContent}>{memory.content}</Text>
        
        {hasGratitude && (
          <View style={styles.gratitudeSection}>
            <Text style={styles.gratitudeTitle}>Grateful for:</Text>
            {memory.gratitude!.map((item, index) => (
              <View key={index} style={styles.gratitudeItem}>
                <Ionicons name="heart" size={12} color="#FF2D55" />
                <Text style={styles.gratitudeText}>{item}</Text>
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.memoryFooter}>
          <Text style={styles.memoryTime}>
            {new Date(memory.createdAt).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit'
            })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStatsCard = (title: string, value: string | number, subtitle?: string, icon?: string) => (
    <View style={styles.statCard}>
      {icon && <Ionicons name={icon as any} size={24} color="#FF2D55" />}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Memory Log</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.viewToggle}
            onPress={() => setViewMode(viewMode === 'grid' ? 'timeline' : 'grid')}
          >
            <Ionicons 
              name={viewMode === 'grid' ? 'list' : 'grid'} 
              size={20} 
              color="#007AFF" 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Daily Prompt */}
        <View style={styles.promptCard}>
          <View style={styles.promptHeader}>
            <Ionicons name="bulb-outline" size={20} color="#FFD60A" />
            <Text style={styles.promptTitle}>Today's Reflection</Text>
          </View>
          <Text style={styles.promptText}>{getPromptForToday()}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          {renderStatsCard('Total Memories', stats.totalMemories, 'All time', 'heart')}
          {renderStatsCard('This Week', stats.thisWeekMemories, 'memories', 'calendar')}
          {renderStatsCard('Current Streak', stats.currentStreak, 'days', 'flame')}
        </View>

        {/* Favorite Gratitude */}
        {stats.favoriteGratitude.length > 0 && (
          <View style={styles.favoriteSection}>
            <Text style={styles.sectionTitle}>Most Grateful For</Text>
            <View style={styles.favoriteList}>
              {stats.favoriteGratitude.map((item, index) => (
                <View key={index} style={styles.favoriteItem}>
                  <Text style={styles.favoriteText}>#{index + 1} {item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Memories List */}
        <View style={styles.memoriesSection}>
          <Text style={styles.sectionTitle}>
            Your Memories ({memoryEntries.length})
          </Text>
          
          {memoryEntries.length > 0 ? (
            <FlatList
              data={memoryEntries}
              renderItem={renderMemoryCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.memoriesList}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyTitle}>No memories yet</Text>
              <Text style={styles.emptySubtitle}>
                Start your gratitude journey by adding your first memory
              </Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={styles.emptyButtonText}>Add Memory</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Memory Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Memory</Text>
            <TouchableOpacity onPress={handleSaveMemory}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Memory Content */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>What happened?</Text>
              <TextInput
                style={styles.memoryInput}
                value={newMemoryContent}
                onChangeText={setNewMemoryContent}
                placeholder="Describe your memory..."
                multiline
                maxLength={500}
              />
            </View>

            {/* Mood Selection */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>How did you feel?</Text>
              <View style={styles.moodSelector}>
                {(['excellent', 'good', 'neutral', 'poor'] as const).map((mood) => (
                  <TouchableOpacity
                    key={mood}
                    style={[
                      styles.moodOption,
                      selectedMood === mood && styles.moodOptionSelected
                    ]}
                    onPress={() => setSelectedMood(mood)}
                  >
                    <Text style={styles.moodOptionEmoji}>{getMoodEmoji(mood)}</Text>
                    <Text style={styles.moodOptionLabel}>{mood}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Photo Selection */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Add a photo (optional)</Text>
              <View style={styles.photoSection}>
                {selectedPhoto ? (
                  <View style={styles.photoPreview}>
                    <Image source={{ uri: selectedPhoto }} style={styles.photoImage} />
                    <TouchableOpacity 
                      style={styles.photoRemove}
                      onPress={() => setSelectedPhoto(null)}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF453A" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.photoButtons}>
                    <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                      <Ionicons name="camera" size={24} color="#007AFF" />
                      <Text style={styles.photoButtonText}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.photoButton} onPress={handleAddPhoto}>
                      <Ionicons name="images" size={24} color="#007AFF" />
                      <Text style={styles.photoButtonText}>Choose Photo</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Gratitude Items */}
            <View style={styles.formSection}>
              <View style={styles.gratitudeHeader}>
                <Text style={styles.formLabel}>What are you grateful for?</Text>
                <TouchableOpacity onPress={addGratitudeItem}>
                  <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
              {gratitudeItems.map((item, index) => (
                <View key={index} style={styles.gratitudeInputContainer}>
                  <TextInput
                    style={styles.gratitudeInput}
                    value={item}
                    onChangeText={(value) => updateGratitudeItem(index, value)}
                    placeholder={`Gratitude item ${index + 1}...`}
                    maxLength={100}
                  />
                  {gratitudeItems.length > 1 && (
                    <TouchableOpacity onPress={() => removeGratitudeItem(index)}>
                      <Ionicons name="close-circle" size={20} color="#FF453A" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewToggle: {
    padding: 8,
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  promptCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 8,
  },
  promptText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF2D55',
    marginTop: 8,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  favoriteSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  favoriteList: {
    gap: 8,
  },
  favoriteItem: {
    backgroundColor: '#FFF2F2',
    padding: 12,
    borderRadius: 8,
  },
  favoriteText: {
    fontSize: 14,
    color: '#FF2D55',
    fontWeight: '500',
  },
  memoriesSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memoriesList: {
    gap: 16,
  },
  memoryCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memoryDate: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  memoryDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  moodIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmoji: {
    fontSize: 16,
  },
  memoryPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  memoryContent: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 22,
    marginBottom: 12,
  },
  gratitudeSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  gratitudeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  gratitudeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  gratitudeText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 6,
    fontStyle: 'italic',
  },
  memoryFooter: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  memoryTime: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#FF2D55',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FAF7F0',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  modalCancel: {
    fontSize: 17,
    color: '#8E8E93',
  },
  modalSave: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  memoryInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  moodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E7',
  },
  moodOptionSelected: {
    borderColor: '#FF2D55',
    backgroundColor: '#FFF2F2',
  },
  moodOptionEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  moodOptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'capitalize',
  },
  photoSection: {
    alignItems: 'center',
  },
  photoPreview: {
    position: 'relative',
    width: 200,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoRemove: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  photoButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  photoButton: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E7',
    borderStyle: 'dashed',
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 8,
  },
  gratitudeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gratitudeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  gratitudeInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    marginRight: 8,
  },
});