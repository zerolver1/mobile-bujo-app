import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBuJoStore } from '../../stores/BuJoStore';
import { BuJoEntry } from '../../types/BuJo';

// TODO: Import BuJo entry components when created
const BuJoEntryItem: React.FC<{ entry: BuJoEntry; onPress: () => void }> = ({ entry, onPress }) => (
  <TouchableOpacity style={styles.entryContainer} onPress={onPress}>
    <View style={styles.bulletContainer}>
      <Text style={styles.bullet}>
        {entry.type === 'task' && entry.status === 'complete' ? '✓' :
         entry.type === 'task' ? '•' :
         entry.type === 'event' ? '○' : '—'}
      </Text>
    </View>
    <View style={styles.entryContent}>
      <Text style={[
        styles.entryText,
        entry.status === 'complete' && styles.completedText
      ]}>
        {entry.content}
      </Text>
      {(entry.tags.length > 0 || entry.contexts.length > 0) && (
        <View style={styles.tagContainer}>
          {entry.contexts.map(ctx => (
            <Text key={ctx} style={styles.contextTag}>@{ctx}</Text>
          ))}
          {entry.tags.map(tag => (
            <Text key={tag} style={styles.hashTag}>#{tag}</Text>
          ))}
        </View>
      )}
    </View>
    {entry.dueDate && (
      <Text style={styles.dueDate}>
        {new Date(entry.dueDate).toLocaleDateString()}
      </Text>
    )}
  </TouchableOpacity>
);

interface DailyLogScreenProps {
  navigation: any;
}

export const DailyLogScreen: React.FC<DailyLogScreenProps> = ({ navigation }) => {
  const { 
    entries, 
    currentDate, 
    getDailyLog, 
    addEntry, 
    updateEntry,
    initialize 
  } = useBuJoStore();

  const [todaysEntries, setTodaysEntries] = useState<BuJoEntry[]>([]);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    // Filter entries for today
    const today = entries.filter(entry => entry.collectionDate === currentDate);
    setTodaysEntries(today);
  }, [entries, currentDate]);

  const handleAddQuickEntry = () => {
    navigation.navigate('QuickCapture');
  };

  const handleEntryPress = (entry: BuJoEntry) => {
    if (entry.type === 'task' && entry.status === 'incomplete') {
      updateEntry(entry.id, { status: 'complete' });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddQuickEntry}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Entries List */}
      {todaysEntries.length > 0 ? (
        <FlatList
          data={todaysEntries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BuJoEntryItem 
              entry={item} 
              onPress={() => handleEntryPress(item)}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No entries yet</Text>
          <Text style={styles.emptySubtitle}>
            Start your day by scanning a journal page or adding a quick entry
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleAddQuickEntry}>
            <Text style={styles.primaryButtonText}>Add Entry</Text>
          </TouchableOpacity>
        </View>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  dateText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  addButton: {
    padding: 8,
  },
  listContainer: {
    padding: 20,
  },
  entryContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bulletContainer: {
    width: 24,
    alignItems: 'center',
    paddingTop: 2,
  },
  bullet: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  entryContent: {
    flex: 1,
    marginLeft: 12,
  },
  entryText: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 22,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  contextTag: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 8,
    marginBottom: 4,
  },
  hashTag: {
    fontSize: 14,
    color: '#FF9500',
    marginRight: 8,
    marginBottom: 4,
  },
  dueDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 8,
    paddingTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});