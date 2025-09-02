import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
  Image,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useBuJoStore } from '../../stores/BuJoStore';
import { BuJoEntry } from '../../types/BuJo';
import { useTheme } from '../../theme';
import { PaperBackground, Typography, Card, PaperButton } from '../../components/ui/paperComponents';
import { safeThemeAccess } from '../../theme/paperStyleUtils';

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
  const { theme } = useTheme();
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
      <Card style={styles.memoryCard}>
        <TouchableOpacity activeOpacity={0.7}>
          <View style={styles.memoryHeader}>
            <Card style={[styles.memoryDate, {
              backgroundColor: safeThemeAccess(theme, t => t.colors.accent, '#007AFF')
            }]}>
              <Typography variant="caption" style={[styles.memoryDateText, {
                color: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF')
              }]}>
                {new Date(memory.createdAt).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </Typography>
            </Card>
            <View style={[styles.moodIndicator, { backgroundColor: getMoodColor(memory.mood || 'good') }]}>
              <Typography variant="body" style={styles.moodEmoji}>{getMoodEmoji(memory.mood || 'good')}</Typography>
            </View>
          </View>
          
          {hasPhoto && (
            <Image source={{ uri: memory.photoUri }} style={styles.memoryPhoto} />
          )}
          
          <Typography variant="body" style={[styles.memoryContent, {
            color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
          }]}>{memory.content}</Typography>
          
          {hasGratitude && (
            <View style={styles.gratitudeSection}>
              <Typography variant="caption" style={[styles.gratitudeTitle, {
                color: safeThemeAccess(theme, t => t.colors.placeholder, '#666')
              }]}>Grateful for:</Typography>
              {memory.gratitude!.map((item, index) => (
                <View key={index} style={styles.gratitudeItem}>
                  <Ionicons name="heart" size={12} color="#FF2D55" />
                  <Typography variant="caption" style={[styles.gratitudeText, {
                    color: safeThemeAccess(theme, t => t.colors.text, '#333')
                  }]}>{item}</Typography>
                </View>
              ))}
            </View>
          )}
          
          <View style={styles.memoryFooter}>
            <Typography variant="caption" style={[styles.memoryTime, {
              color: safeThemeAccess(theme, t => t.colors.placeholder, '#999')
            }]}>
              {new Date(memory.createdAt).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
              })}
            </Typography>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  const renderStatsCard = (title: string, value: string | number, subtitle?: string, icon?: string) => (
    <Card style={[styles.statCard, {
      backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF')
    }]}>
      {icon && <Ionicons name={icon as any} size={24} color="#FF2D55" />}
      <Typography variant="title" style={[styles.statValue, {
        color: safeThemeAccess(theme, t => t.colors.accent, '#FF2D55')
      }]}>{value}</Typography>
      <Typography variant="caption" style={[styles.statTitle, {
        color: safeThemeAccess(theme, t => t.colors.placeholder, '#666')
      }]}>{title}</Typography>
      {subtitle && <Typography variant="caption" style={[styles.statSubtitle, {
        color: safeThemeAccess(theme, t => t.colors.placeholder, '#999')
      }]}>{subtitle}</Typography>}
    </Card>
  );

  return (
    <PaperBackground variant="lined" showMargin={true} intensity="light">
      <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <Card style={[styles.header, {
        backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF'),
        borderBottomColor: safeThemeAccess(theme, t => t.colors.border, '#E5E5E7'),
        borderRadius: 0
      }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Typography variant="subtitle" style={[styles.headerTitle, {
          color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
        }]}>Memory Log</Typography>
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
      </Card>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Daily Prompt */}
        <Card style={[styles.promptCard, {
          backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF')
        }]}>
          <View style={styles.promptHeader}>
            <Ionicons name="bulb-outline" size={20} color="#FFD60A" />
            <Typography variant="subtitle" style={[styles.promptTitle, {
              color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
            }]}>Today's Reflection</Typography>
          </View>
          <Typography variant="body" style={[styles.promptText, {
            color: safeThemeAccess(theme, t => t.colors.placeholder, '#666')
          }]}>{getPromptForToday()}</Typography>
        </Card>

        {/* Stats */}
        <View style={styles.statsContainer}>
          {renderStatsCard('Total Memories', stats.totalMemories, 'All time', 'heart')}
          {renderStatsCard('This Week', stats.thisWeekMemories, 'memories', 'calendar')}
          {renderStatsCard('Current Streak', stats.currentStreak, 'days', 'flame')}
        </View>

        {/* Favorite Gratitude */}
        {stats.favoriteGratitude.length > 0 && (
          <Card style={[styles.favoriteSection, {
            backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF')
          }]}>
            <Typography variant="title" style={[styles.sectionTitle, {
              color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
            }]}>Most Grateful For</Typography>
            <View style={styles.favoriteList}>
              {stats.favoriteGratitude.map((item, index) => (
                <View key={index} style={styles.favoriteItem}>
                  <Typography variant="body" style={[styles.favoriteText, {
                    color: safeThemeAccess(theme, t => t.colors.accent, '#FF2D55')
                  }]}>#{index + 1} {item}</Typography>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Memories List */}
        <Card style={[styles.memoriesSection, {
          backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF')
        }]}>
          <Typography variant="title" style={[styles.sectionTitle, {
            color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
          }]}>
            Your Memories ({memoryEntries.length})
          </Typography>
          
          {memoryEntries.length > 0 ? (
            <FlatList
              data={memoryEntries}
              renderItem={renderMemoryCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.memoriesList}
              // Performance optimizations for memory cards
              removeClippedSubviews={false} // Keep false for complex layouts
              maxToRenderPerBatch={6}
              initialNumToRender={4}
              windowSize={6}
              getItemLayout={(data, index) => ({
                length: 120, // Memory card estimated height
                offset: 120 * index,
                index,
              })}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={64} color="#C7C7CC" />
              <Typography variant="title" style={[styles.emptyTitle, {
                color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
              }]}>No memories yet</Typography>
              <Typography variant="body" style={[styles.emptySubtitle, {
                color: safeThemeAccess(theme, t => t.colors.placeholder, '#666')
              }]}>
                Start your gratitude journey by adding your first memory
              </Typography>
              <PaperButton 
                variant="primary"
                style={styles.emptyButton}
                onPress={() => setShowAddModal(true)}
              >
                <Typography variant="body" style={styles.emptyButtonText}>Add Memory</Typography>
              </PaperButton>
            </View>
          )}
        </Card>
      </ScrollView>

      {/* Add Memory Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <PaperBackground variant="lined" showMargin={true} intensity="light">
          <Card style={[styles.modalHeader, {
            backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF'),
            borderBottomColor: safeThemeAccess(theme, t => t.colors.border, '#E5E5E7'),
            borderRadius: 0
          }]}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Typography variant="body" style={[styles.modalCancel, {
                color: safeThemeAccess(theme, t => t.colors.placeholder, '#8E8E93')
              }]}>Cancel</Typography>
            </TouchableOpacity>
            <Typography variant="subtitle" style={[styles.modalTitle, {
              color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
            }]}>New Memory</Typography>
            <TouchableOpacity onPress={handleSaveMemory}>
              <Typography variant="body" style={[styles.modalSave, {
                color: safeThemeAccess(theme, t => t.colors.accent, '#007AFF')
              }]}>Save</Typography>
            </TouchableOpacity>
          </Card>

          <ScrollView style={styles.modalContent}>
            {/* Memory Content */}
            <View style={styles.formSection}>
              <Typography variant="subtitle" style={[styles.formLabel, {
                color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
              }]}>What happened?</Typography>
              <TextInput
                style={[styles.memoryInput, {
                  backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF'),
                  borderColor: safeThemeAccess(theme, t => t.colors.border, '#E5E5E7'),
                  color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
                }]}
                value={newMemoryContent}
                onChangeText={setNewMemoryContent}
                placeholder="Describe your memory..."
                placeholderTextColor={safeThemeAccess(theme, t => t.colors.placeholder, '#8E8E93')}
                multiline
                maxLength={500}
              />
            </View>

            {/* Mood Selection */}
            <View style={styles.formSection}>
              <Typography variant="subtitle" style={[styles.formLabel, {
                color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
              }]}>How did you feel?</Typography>
              <View style={styles.moodSelector}>
                {(['excellent', 'good', 'neutral', 'poor'] as const).map((mood) => (
                  <TouchableOpacity
                    key={mood}
                    style={[
                      styles.moodOption,
                      {
                        backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF'),
                        borderColor: selectedMood === mood ? '#FF2D55' : safeThemeAccess(theme, t => t.colors.border, '#E5E5E7')
                      },
                      selectedMood === mood && styles.moodOptionSelected
                    ]}
                    onPress={() => setSelectedMood(mood)}
                  >
                    <Typography variant="body" style={styles.moodOptionEmoji}>{getMoodEmoji(mood)}</Typography>
                    <Typography variant="caption" style={[styles.moodOptionLabel, {
                      color: safeThemeAccess(theme, t => t.colors.placeholder, '#666')
                    }]}>{mood}</Typography>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Photo Selection */}
            <View style={styles.formSection}>
              <Typography variant="subtitle" style={[styles.formLabel, {
                color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
              }]}>Add a photo (optional)</Typography>
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
                    <TouchableOpacity style={[styles.photoButton, {
                      backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF'),
                      borderColor: safeThemeAccess(theme, t => t.colors.border, '#E5E5E7')
                    }]} onPress={handleTakePhoto}>
                      <Ionicons name="camera" size={24} color="#007AFF" />
                      <Typography variant="body" style={styles.photoButtonText}>Take Photo</Typography>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.photoButton, {
                      backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF'),
                      borderColor: safeThemeAccess(theme, t => t.colors.border, '#E5E5E7')
                    }]} onPress={handleAddPhoto}>
                      <Ionicons name="images" size={24} color="#007AFF" />
                      <Typography variant="body" style={styles.photoButtonText}>Choose Photo</Typography>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Gratitude Items */}
            <View style={styles.formSection}>
              <View style={styles.gratitudeHeader}>
                <Typography variant="subtitle" style={[styles.formLabel, {
                  color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
                }]}>What are you grateful for?</Typography>
                <TouchableOpacity onPress={addGratitudeItem}>
                  <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
              {gratitudeItems.map((item, index) => (
                <View key={index} style={styles.gratitudeInputContainer}>
                  <TextInput
                    style={[styles.gratitudeInput, {
                      backgroundColor: safeThemeAccess(theme, t => t.colors.surface, '#FFFFFF'),
                      borderColor: safeThemeAccess(theme, t => t.colors.border, '#E5E5E7'),
                      color: safeThemeAccess(theme, t => t.colors.text, '#1C1C1E')
                    }]}
                    value={item}
                    onChangeText={(value) => updateGratitudeItem(index, value)}
                    placeholder={`Gratitude item ${index + 1}...`}
                    placeholderTextColor={safeThemeAccess(theme, t => t.colors.placeholder, '#8E8E93')}
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
        </PaperBackground>
      </Modal>
      </SafeAreaView>
    </PaperBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
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