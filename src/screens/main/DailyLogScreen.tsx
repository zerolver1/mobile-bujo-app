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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBuJoStore } from '../../stores/BuJoStore';
import { BuJoEntry } from '../../types/BuJo';
import { BuJoEntryItem } from '../../components/BuJoEntryItem';
import { SwipeableEntryItem } from '../../components/SwipeableEntryItem';
import { useSwipeGestures } from '../../hooks/useSwipeGestures';
import { useTheme } from '../../theme';
import { 
  PaperBackground, 
  PaperButton, 
  Typography, 
  NotebookCard,
  Card,
  PAPER_DESIGN_TOKENS,
  createPaperShadow,
  safeThemeAccess 
} from '../../components/ui/paperComponents';

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
  const [showStats, setShowStats] = useState(true);
  
  const insets = useSafeAreaInsets();

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
    const inspiration = todaysEntries.filter(e => e.type === 'inspiration');
    const research = todaysEntries.filter(e => e.type === 'research');
    const memory = todaysEntries.filter(e => e.type === 'memory');
    const custom = todaysEntries.filter(e => e.type === 'custom');
    
    // BuJo Pro groupings
    const coreEntries = tasks.length + events.length + notes.length;
    const informationEntries = notes.length + inspiration.length + research.length;
    const reflectiveEntries = memory.length;
    
    return {
      total: todaysEntries.length,
      // Core BuJo types
      tasks: tasks.length,
      completed: completedTasks.length,
      events: events.length,
      notes: notes.length,
      // Extended types
      inspiration: inspiration.length,
      research: research.length,
      memory: memory.length,
      custom: custom.length,
      // Grouped metrics
      coreEntries,
      informationEntries,
      reflectiveEntries,
      completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
      // Check if we have extended types to show second row
      hasExtendedTypes: inspiration.length > 0 || research.length > 0 || memory.length > 0 || custom.length > 0
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
  const { theme } = useTheme();

  return (
    <PaperBackground variant="lined" showMargin={true} intensity="light">
      <SafeAreaView style={styles.container}>
        {/* Streamlined Header */}
        <View style={styles.header}>
          {/* Primary Date Navigation */}
          <View style={styles.dateNavigation}>
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={() => navigateDate('prev')}
            >
              <Ionicons name="chevron-back" size={24} color={safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dateButton} 
              onPress={() => setShowDatePicker(true)}
            >
              <Typography variant="h2" style={styles.dateText}>
                {formatDateShort(currentDate)}
              </Typography>
              <Typography variant="caption" style={styles.weekdayText}>
                {formatDate(currentDate).split(',')[0]}
              </Typography>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={() => navigateDate('next')}
            >
              <Ionicons name="chevron-forward" size={24} color={safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')} />
            </TouchableOpacity>
          </View>

          {/* Action Menu */}
          <View style={styles.headerActions}>
            {!isToday && (
              <PaperButton 
                variant="highlight" 
                size="sm" 
                title="Today" 
                onPress={goToToday}
                style={styles.todayButton}
              />
            )}
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => {
                Alert.alert(
                  'Actions',
                  'Choose an action:',
                  [
                    { text: '📸 Scan Page', onPress: handleQuickScan },
                    { text: `👆 Swipe Mode: ${useSwipeableEntries ? 'ON' : 'OFF'}`, onPress: () => setUseSwipeableEntries(!useSwipeableEntries) },
                    { text: `👁️ Stats: ${showStats ? 'ON' : 'OFF'}`, onPress: () => setShowStats(!showStats) },
                    ...(hasUndo ? [{ text: '↩️ Undo Last Action', onPress: undoLastAction }] : []),
                    { text: 'Cancel', onPress: () => {} },
                  ]
                );
              }}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Subtle divider */}
        <View style={styles.headerDivider} />
        
        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={new Date(currentDate)}
            mode="date"
            display="default"
            onChange={handleDatePickerChange}
          />
        )}
      
        {/* Smart Swipe Tutorial Hint - Only for first few entries */}
        {useSwipeableEntries && todaysEntries.length > 0 && todaysEntries.length <= 3 && (
          <NotebookCard variant="sticky" style={styles.swipeHint}>
            <View style={styles.swipeHintContent}>
              <Ionicons name="swap-horizontal" size={16} color={safeThemeAccess(theme, t => t.colors.textSecondary, '#8E8E93')} />
              <Typography variant="footnote" color="textSecondary" style={styles.swipeHintText}>
                Swipe entries left or right for quick actions
              </Typography>
            </View>
          </NotebookCard>
        )}

        {/* Smart Stats Summary - Auto-hide when no entries */}
        {stats.total > 0 && showStats && (
          <NotebookCard variant="page" showHoles={false} style={styles.statsContainer}>
            {/* Core BuJo Types Row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Typography variant="title3" color="text" style={styles.statNumber}>{stats.tasks}</Typography>
                <Typography variant="caption2" color="textTertiary" style={styles.statLabel}>Tasks</Typography>
              </View>
              <View style={styles.statCard}>
                <Typography variant="title3" color="text" style={styles.statNumber}>{stats.events}</Typography>
                <Typography variant="caption2" color="textTertiary" style={styles.statLabel}>Events</Typography>
              </View>
              <View style={styles.statCard}>
                <Typography variant="title3" color="text" style={styles.statNumber}>{stats.notes}</Typography>
                <Typography variant="caption2" color="textTertiary" style={styles.statLabel}>Notes</Typography>
              </View>
              <View style={styles.statCard}>
                <Typography 
                  variant="title3" 
                  style={[styles.statNumber, { color: stats.completionRate > 50 ? safeThemeAccess(theme, t => t.colors.success, '#15803D') : safeThemeAccess(theme, t => t.colors.warning, '#D97706') }]}
                >
                  {stats.completionRate}%
                </Typography>
                <Typography variant="caption2" color="textTertiary" style={styles.statLabel}>Done</Typography>
              </View>
            </View>
            
            {/* Extended Types Row - only show if we have extended entries */}
            {stats.hasExtendedTypes && (
              <View style={[styles.statsRow, styles.extendedStatsRow]}>
                {stats.inspiration > 0 && (
                  <View style={styles.statCard}>
                    <Typography variant="title3" color="text" style={styles.statNumber}>{stats.inspiration}</Typography>
                    <Typography variant="caption2" color="textTertiary" style={styles.statLabel}>Ideas</Typography>
                  </View>
                )}
                {stats.research > 0 && (
                  <View style={styles.statCard}>
                    <Typography variant="title3" color="text" style={styles.statNumber}>{stats.research}</Typography>
                    <Typography variant="caption2" color="textTertiary" style={styles.statLabel}>Research</Typography>
                  </View>
                )}
                {stats.memory > 0 && (
                  <View style={styles.statCard}>
                    <Typography variant="title3" color="text" style={styles.statNumber}>{stats.memory}</Typography>
                    <Typography variant="caption2" color="textTertiary" style={styles.statLabel}>Memory</Typography>
                  </View>
                )}
                {stats.custom > 0 && (
                  <View style={styles.statCard}>
                    <Typography variant="title3" color="text" style={styles.statNumber}>{stats.custom}</Typography>
                    <Typography variant="caption2" color="textTertiary" style={styles.statLabel}>Custom</Typography>
                  </View>
                )}
              </View>
            )}
          </NotebookCard>
        )}

        {/* Entries List */}
        {todaysEntries.length > 0 ? (
          <FlatList
          data={todaysEntries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            useSwipeableEntries ? (
              <SwipeableEntryItem 
                entry={item} 
                onSwipeAction={handleSwipeAction}
                onPress={handleEntryAction}
                showDate={false}
                isCompact={false}
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
            <Typography variant="title2" color="text" style={styles.emptyTitle}>No entries yet</Typography>
            <Typography variant="body" color="textSecondary" style={styles.emptySubtitle}>
              Start your day by scanning a journal page or adding a quick entry
            </Typography>
            <PaperButton 
              variant="ink" 
              size="lg" 
              title="Add Entry" 
              onPress={handleAddQuickEntry}
              style={styles.primaryButton}
            />
          </View>
        )}
      </SafeAreaView>
      
      {/* Floating Action Button for Quick Capture - Outside SafeAreaView */}
      <TouchableOpacity 
        style={[styles.fab, { bottom: insets.bottom + 80 }]} // 80px for tab bar height + margin
        onPress={handleAddQuickEntry}
        activeOpacity={0.8}
      >
        <View style={styles.fabInner}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </View>
        <Typography variant="caption" style={styles.fabLabel}>
          Log
        </Typography>
      </TouchableOpacity>
    </PaperBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Let PaperBackground show through
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
    paddingTop: PAPER_DESIGN_TOKENS.spacing.lg,
    paddingBottom: PAPER_DESIGN_TOKENS.spacing.md,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  navButton: {
    padding: PAPER_DESIGN_TOKENS.spacing.sm,
    borderRadius: 20,
  },
  dateButton: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: PAPER_DESIGN_TOKENS.spacing.sm,
  },
  dateText: {
    fontWeight: '700',
    letterSpacing: -0.5,
    color: '#0F2A44',
    textAlign: 'center',
  },
  weekdayText: {
    marginTop: 2,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PAPER_DESIGN_TOKENS.spacing.sm,
  },
  menuButton: {
    padding: PAPER_DESIGN_TOKENS.spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 42, 68, 0.08)',
  },
  headerDivider: {
    height: 1,
    backgroundColor: 'rgba(15, 42, 68, 0.1)',
    marginHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
    marginBottom: PAPER_DESIGN_TOKENS.spacing.sm,
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statsContainer: {
    marginHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
    marginTop: PAPER_DESIGN_TOKENS.spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
  },
  extendedStatsRow: {
    marginTop: PAPER_DESIGN_TOKENS.spacing.md,
    paddingTop: PAPER_DESIGN_TOKENS.spacing.md,
    borderTopWidth: 1,
    borderTopColor: safeThemeAccess({}, t => t?.colors?.border, '#E5E5E7'),
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: '700',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.xs,
  },
  statLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContainer: {
    paddingTop: PAPER_DESIGN_TOKENS.spacing.xl2,
    paddingBottom: PAPER_DESIGN_TOKENS.spacing.xl2,
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.xl4,
  },
  emptyTitle: {
    fontWeight: '700',
    marginBottom: PAPER_DESIGN_TOKENS.spacing.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: PAPER_DESIGN_TOKENS.spacing.xl4,
  },
  primaryButton: {
    marginTop: PAPER_DESIGN_TOKENS.spacing.md,
  },
  entriesList: {
    flex: 1,
  },
  undoButton: {
    marginRight: PAPER_DESIGN_TOKENS.spacing.sm,
  },
  swipeHint: {
    marginHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
    marginTop: PAPER_DESIGN_TOKENS.spacing.md,
  },
  swipeHintContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: PAPER_DESIGN_TOKENS.spacing.md,
  },
  swipeHintText: {
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    right: 20,
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: 'rgba(15, 42, 68, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0F2A44', // Fountain pen blue
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    // Paper-like texture
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    // Ink-like shadow
    shadowColor: 'rgba(15, 42, 68, 0.6)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  fabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0F2A44',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});