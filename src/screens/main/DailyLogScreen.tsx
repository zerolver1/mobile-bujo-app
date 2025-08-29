import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useBuJoStore } from '../../stores/BuJoStore';
import { BuJoEntry } from '../../types/BuJo';
import { BuJoEntryItem } from '../../components/BuJoEntryItem';
import { SimpleSwipeableEntry } from '../../components/SimpleSwipeableEntry';
import { useSwipeGestures } from '../../hooks/useSwipeGestures';

interface DailyLogScreenProps {
  navigation: any;
}

export const DailyLogScreen: React.FC<DailyLogScreenProps> = ({ navigation }) => {
  const { 
    entries, 
    currentDate, 
    setCurrentDate,
    getDailyLog, 
    addEntry, 
    updateEntry,
    initialize 
  } = useBuJoStore();

  const [todaysEntries, setTodaysEntries] = useState<BuJoEntry[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [useSwipeableEntries, setUseSwipeableEntries] = useState(true);

  // Initialize swipe gestures
  const { handleSwipeAction, undoLastAction, hasUndo } = useSwipeGestures({
    onMigrate: handleMigrateEntry,
    onSchedule: handleScheduleEntry,
    onEdit: handleEditEntry,
    navigation
  });

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

  const handleQuickScan = () => {
    navigation.navigate('Capture');
  };

  const getEntryStats = () => {
    const tasks = todaysEntries.filter(e => e.type === 'task');
    const completedTasks = tasks.filter(e => e.status === 'complete');
    const events = todaysEntries.filter(e => e.type === 'event');
    const notes = todaysEntries.filter(e => e.type === 'note');
    
    return {
      total: todaysEntries.length,
      tasks: tasks.length,
      completed: completedTasks.length,
      events: events.length,
      notes: notes.length,
      completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0
    };
  };

  const stats = getEntryStats();

  const handleEntryAction = (entry: BuJoEntry, action: 'complete' | 'migrate' | 'schedule' | 'cancel' | 'edit') => {
    switch (action) {
      case 'complete':
        updateEntry(entry.id, { status: 'complete' });
        break;
      case 'migrate':
        // Navigate to date picker for migration
        handleMigrateEntry(entry);
        break;
      case 'schedule':
        // Navigate to date picker for scheduling
        handleScheduleEntry(entry);
        break;
      case 'cancel':
        updateEntry(entry.id, { status: 'cancelled' });
        break;
      case 'edit':
        // Navigate to entry edit screen
        handleEditEntry(entry);
        break;
    }
  };
  
  const handleMigrateEntry = (entry: BuJoEntry) => {
    // For now, migrate to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    
    updateEntry(entry.id, {
      status: 'migrated',
      collectionDate: tomorrowString,
      scheduledDate: tomorrow
    });
    
    Alert.alert(
      'Task Migrated',
      `"${entry.content}" has been migrated to tomorrow's daily log.`
    );
  };
  
  const handleScheduleEntry = (entry: BuJoEntry) => {
    // For now, schedule for next week
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    updateEntry(entry.id, {
      status: 'scheduled',
      scheduledDate: nextWeek
    });
    
    Alert.alert(
      'Task Scheduled',
      `"${entry.content}" has been scheduled for ${nextWeek.toLocaleDateString()}.`
    );
  };
  
  const handleEditEntry = (entry: BuJoEntry) => {
    // Navigate to quick capture with pre-filled data
    navigation.navigate('QuickCapture', { editEntry: entry });
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

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric' 
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDateObj = new Date(currentDate);
    const newDate = new Date(currentDateObj);
    
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    
    const newDateString = newDate.toISOString().split('T')[0];
    setCurrentDate(newDateString);
  };

  const handleDatePickerChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDateString = selectedDate.toISOString().split('T')[0];
      setCurrentDate(newDateString);
    }
  };

  const goToToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setCurrentDate(today);
  };

  const isToday = currentDate === new Date().toISOString().split('T')[0];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.dateNavigation}>
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={() => navigateDate('prev')}
            >
              <Ionicons name="chevron-back" size={20} color="#007AFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dateButton} 
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>{formatDateShort(currentDate)}</Text>
              <Text style={styles.fullDateText}>{formatDate(currentDate).split(',')[0]}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={() => navigateDate('next')}
            >
              <Ionicons name="chevron-forward" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          {stats.total > 0 && (
            <Text style={styles.statsText}>
              {stats.completed}/{stats.tasks} tasks • {stats.completionRate}% complete
            </Text>
          )}
          
          {!isToday && (
            <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
              <Text style={styles.todayButtonText}>Today</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.headerActions}>
          {hasUndo && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.undoButton]} 
              onPress={undoLastAction}
            >
              <Ionicons name="arrow-undo" size={18} color="#FF9500" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.actionButton, useSwipeableEntries && styles.activeButton]} 
            onPress={() => setUseSwipeableEntries(!useSwipeableEntries)}
          >
            <Ionicons name="swap-horizontal" size={20} color={useSwipeableEntries ? "#34C759" : "#8E8E93"} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleQuickScan}>
            <Ionicons name="camera-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={handleAddQuickEntry}>
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date(currentDate)}
          mode="date"
          display="default"
          onChange={handleDatePickerChange}
        />
      )}
      
      {/* Swipe Tutorial Hint */}
      {useSwipeableEntries && todaysEntries.length > 0 && todaysEntries.length <= 3 && (
        <View style={styles.swipeHint}>
          <Ionicons name="swap-horizontal" size={16} color="#8E8E93" />
          <Text style={styles.swipeHintText}>
            Swipe entries left or right for quick actions
          </Text>
        </View>
      )}

      {/* Quick Stats Summary */}
      {stats.total > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.tasks}</Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.events}</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.notes}</Text>
            <Text style={styles.statLabel}>Notes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: stats.completionRate > 50 ? '#34C759' : '#FF9500' }]}>
              {stats.completionRate}%
            </Text>
            <Text style={styles.statLabel}>Done</Text>
          </View>
        </View>
      )}

      {/* Entries List */}
      {todaysEntries.length > 0 ? (
        <FlatList
          data={todaysEntries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            useSwipeableEntries ? (
              <SimpleSwipeableEntry 
                entry={item} 
                onSwipeAction={handleSwipeAction}
                onPress={handleEntryAction}
              />
            ) : (
              <BuJoEntryItem 
                entry={item} 
                onPress={handleEntryAction}
              />
            )
          )}
          contentContainerStyle={styles.listContainer}
          style={styles.entriesList}
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
  headerContent: {
    flex: 1,
  },
  dateText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  statsText: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginRight: 8,
  },
  addButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContainer: {
    paddingTop: 20,
    paddingBottom: 20,
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
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  navButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  dateButton: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  fullDateText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  todayButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  todayButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  entriesList: {
    flex: 1,
  },
  undoButton: {
    backgroundColor: '#FFF7E6',
    borderRadius: 8,
  },
  activeButton: {
    backgroundColor: '#F0F7FF',
    borderRadius: 8,
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F2F2F7',
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 8,
    gap: 8,
  },
  swipeHintText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
});