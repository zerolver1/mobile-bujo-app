import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Keyboard,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BuJoEntry } from '../../types/BuJo';
import { BuJoEntryItem } from '../../components/BuJoEntryItem';
import { SwipeableEntryItem } from '../../components/SwipeableEntryItem';
import { useSwipeGestures } from '../../hooks/useSwipeGestures';
import { useTheme } from '../../theme';
import { haptic } from '../../utils/haptics';
import { useBuJoStore } from '../../stores/BuJoStore';
import { performanceMonitor, flatListOptimizations, debounce } from '../../utils/performance';
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
import { PaperLoading } from '../../components/ui/PaperLoading';

interface DailyLogScreenProps {
  navigation: any;
}

const DailyLogScreenComponent: React.FC<DailyLogScreenProps> = ({ navigation }) => {
  // Performance monitoring
  useEffect(() => {
    performanceMonitor.startTiming('DailyLogScreen_Render');
    return () => {
      performanceMonitor.endTiming('DailyLogScreen_Render');
    };
  }, []);
  
  // Simple direct store access to avoid selector loops with defensive checks
  const currentDate = useBuJoStore(state => state?.currentDate || new Date().toISOString().split('T')[0]);
  const allEntries = useBuJoStore(state => state?.entries || []);
  const addEntry = useBuJoStore(state => state?.addEntry);
  const updateEntry = useBuJoStore(state => state?.updateEntry);
  const deleteEntry = useBuJoStore(state => state?.deleteEntry);
  const syncStatus = useBuJoStore(state => state?.syncStatus || 'idle');
  const lastSyncAt = useBuJoStore(state => state?.lastSyncAt);
  const syncToCloud = useBuJoStore(state => state?.syncToCloud);
  
  // Early return if store is not properly initialized
  if (!addEntry || !updateEntry || !deleteEntry) {
    return (
      <PaperBackground variant="subtle" intensity="light">
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <PaperLoading message="Initializing BuJo..." size="md" />
        </SafeAreaView>
      </PaperBackground>
    );
  }
  
  // Calculate hasUnsyncedChanges locally to avoid function calls in selectors
  const hasUnsyncedChanges = useMemo(() => {
    if (!lastSyncAt) return true;
    return allEntries.some(entry => entry.createdAt > lastSyncAt);
  }, [lastSyncAt, allEntries]);
  
  // Memoized today's entries to prevent re-filtering on every render
  const todaysEntriesFromStore = useMemo(() => 
    allEntries.filter(entry => entry.collectionDate === currentDate),
    [allEntries, currentDate]
  );

  // Use todaysEntriesFromStore directly instead of local state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [useSwipeableEntries, setUseSwipeableEntries] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSwipeBanner, setShowSwipeBanner] = useState(true);
  
  const insets = useSafeAreaInsets();

  // Swipe action handlers
  const handleMigrateEntry = useCallback((entry: BuJoEntry) => {
    // Handle migration to future log
    navigation.navigate('FutureLog', { migrateEntry: entry });
  }, [navigation]);

  const handleScheduleEntry = useCallback((entry: BuJoEntry) => {
    // Handle scheduling to specific date
    navigation.navigate('QuickCapture', { scheduleEntry: entry });
  }, [navigation]);

  const handleEditEntry = useCallback((entry: BuJoEntry) => {
    // Handle editing entry
    navigation.navigate('QuickCapture', { editEntry: entry });
  }, [navigation]);

  // Initialize swipe gestures
  const { handleSwipeAction, undoLastAction, hasUndo } = useSwipeGestures({
    onMigrate: handleMigrateEntry,
    onSchedule: handleScheduleEntry,
    onEdit: handleEditEntry,
    navigation
  });

  // Navigation functions  
  const setCurrentDate = useBuJoStore(state => state.setCurrentDate);

  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    const current = new Date(currentDate);
    const newDate = new Date(current);
    
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    
    const newDateString = newDate.toISOString().split('T')[0];
    setCurrentDate(newDateString);
  }, [currentDate, setCurrentDate]);

  const goToToday = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setCurrentDate(today);
  }, [setCurrentDate]);

  // Handle date picker selection
  const handleDatePickerChange = useCallback((event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDateString = selectedDate.toISOString().split('T')[0];
      setCurrentDate(newDateString);
    }
  }, [setCurrentDate]);

  // Entry action handlers
  const handleEntryAction = useCallback((entry: BuJoEntry) => {
    // Handle entry tap action
    navigation.navigate('QuickCapture', { editEntry: entry });
  }, [navigation]);

  // Debounce search query to improve performance
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleAddQuickEntry = () => {
    haptic.buttonPress();
    navigation.navigate('QuickCapture');
  };

  const handleQuickScan = () => {
    haptic.buttonPress();
    navigation.navigate('Capture');
  };

  // Optimized filtering with memoization and debounced search
  const filteredEntries = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return todaysEntriesFromStore;
    
    const query = debouncedSearchQuery.toLowerCase();
    return todaysEntriesFromStore.filter(entry => {
      // Early return optimizations
      if (entry.content.toLowerCase().includes(query)) return true;
      if (entry.tags.some(tag => tag.toLowerCase().includes(query))) return true;
      if (entry.contexts.some(ctx => ctx.toLowerCase().includes(query))) return true;
      return false;
    });
  }, [todaysEntriesFromStore, debouncedSearchQuery]);

  // Memoized stats calculation
  const entryStats = useMemo(() => {
    const tasks = todaysEntriesFromStore.filter(e => e.type === 'task');
    const completedTasks = tasks.filter(e => e.status === 'complete');
    const events = todaysEntriesFromStore.filter(e => e.type === 'event');
    const notes = todaysEntriesFromStore.filter(e => e.type === 'note');
    const inspiration = todaysEntriesFromStore.filter(e => e.type === 'inspiration');
    const research = todaysEntriesFromStore.filter(e => e.type === 'research');
    const memory = todaysEntriesFromStore.filter(e => e.type === 'memory');
    const custom = todaysEntriesFromStore.filter(e => e.type === 'custom');
    
    // BuJo Pro groupings
    const coreEntries = tasks.length + events.length + notes.length;
    const informationEntries = notes.length + inspiration.length + research.length;
    const reflectiveEntries = memory.length;
    
    return {
      total: todaysEntriesFromStore.length,
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
  }, [todaysEntriesFromStore]);


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




  // Paper-themed pull-to-refresh with cloud sync
  const handleRefresh = useCallback(async () => {
    performanceMonitor.startTiming('Refresh_Operation');
    setRefreshing(true);
    
    // Haptic feedback for paper journal page turn
    haptic.pageTurn();
    
    try {
      // Start cloud sync in background without waiting
      if (hasUnsyncedChanges || syncStatus === 'idle') {
        syncToCloud?.().catch(error => 
          console.warn('Background sync failed:', error)
        );
      }
      
      // Quick refresh without blocking
      setTimeout(() => {
        setRefreshing(false);
        haptic.success(); // Success feedback like closing a journal
        performanceMonitor.endTiming('Refresh_Operation');
      }, 300); // Reduced from 1000ms to 300ms
    } catch (error) {
      console.error('Error refreshing entries:', error);
      setRefreshing(false);
      haptic.error(); // Error feedback like pen running out of ink
      performanceMonitor.endTiming('Refresh_Operation');
    }
  }, [hasUnsyncedChanges, syncStatus, syncToCloud]);

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
            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              {/* Search Button */}
              <TouchableOpacity 
                style={[styles.actionButton, isSearching && styles.actionButtonActive]}
                onPress={() => {
                  haptic.selection();
                  setIsSearching(!isSearching);
                }}
              >
                <Ionicons name="search" size={20} color={isSearching ? '#FFFFFF' : safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')} />
              </TouchableOpacity>
              
              {/* Scan Page Button */}
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleQuickScan}
              >
                <Ionicons name="camera-outline" size={20} color={safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')} />
              </TouchableOpacity>
              
              {/* Swipe Mode Toggle Button */}
              <TouchableOpacity 
                style={[styles.actionButton, useSwipeableEntries && styles.actionButtonActive]}
                onPress={() => {
                  haptic.selection();
                  setUseSwipeableEntries(!useSwipeableEntries);
                }}
              >
                <Ionicons name="swap-horizontal" size={20} color={useSwipeableEntries ? '#FFFFFF' : safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')} />
              </TouchableOpacity>
              
              {/* Stats Toggle Button */}
              <TouchableOpacity 
                style={[styles.actionButton, showStats && styles.actionButtonActive]}
                onPress={() => {
                  haptic.selection();
                  setShowStats(!showStats);
                }}
              >
                <Ionicons name={showStats ? "eye" : "eye-off"} size={20} color={showStats ? '#FFFFFF' : safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')} />
              </TouchableOpacity>
              
              {/* Undo Button - only show when available */}
              {hasUndo && (
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#15803D' }]}
                  onPress={undoLastAction}
                >
                  <Ionicons name="arrow-undo" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              
              {/* Sync Status Indicator */}
              <View style={styles.syncStatusContainer}>
                {syncStatus === 'syncing' && (
                  <View style={[styles.syncIndicator, { backgroundColor: '#F59E0B' }]}>
                    <Ionicons name="refresh" size={12} color="#FFFFFF" />
                  </View>
                )}
                {hasUnsyncedChanges && syncStatus !== 'syncing' && (
                  <View style={[styles.syncIndicator, { backgroundColor: '#EF4444' }]}>
                    <Ionicons name="cloud-offline" size={12} color="#FFFFFF" />
                  </View>
                )}
                {!hasUnsyncedChanges && syncStatus === 'idle' && (
                  <View style={[styles.syncIndicator, { backgroundColor: '#10B981' }]}>
                    <Ionicons name="cloud-done" size={12} color="#FFFFFF" />
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Subtle divider */}
        <View style={styles.headerDivider} />

        {/* Swipe Info Banner */}
        {useSwipeableEntries && showSwipeBanner && (
          <View style={styles.swipeBanner}>
            <View style={styles.swipeBannerContent}>
              <Ionicons name="information-circle" size={16} color={safeThemeAccess(theme, t => t.colors.textSecondary, '#6B7280')} />
              <Typography variant="caption2" color="textSecondary" style={styles.swipeBannerText}>
                Swipe left/right on entries for quick actions
              </Typography>
              <TouchableOpacity 
                onPress={() => setShowSwipeBanner(false)}
                style={styles.dismissButton}
              >
                <Ionicons name="close" size={16} color={safeThemeAccess(theme, t => t.colors.textSecondary, '#6B7280')} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Search Bar */}
        {isSearching && (
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={safeThemeAccess(theme, t => t.colors.textSecondary, '#6B7280')} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search entries, tags, or contexts..."
                placeholderTextColor={safeThemeAccess(theme, t => t.colors.placeholder, '#9CA3AF')}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                returnKeyType="search"
                onSubmitEditing={Keyboard.dismiss}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={safeThemeAccess(theme, t => t.colors.textSecondary, '#6B7280')} />
                </TouchableOpacity>
              )}
            </View>
            <PaperButton
              variant="pencil"
              size="sm"
              title="Cancel"
              onPress={() => {
                setIsSearching(false);
                setSearchQuery('');
                Keyboard.dismiss();
              }}
            />
          </View>
        )}

        
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
        {useSwipeableEntries && todaysEntriesFromStore.length > 0 && todaysEntriesFromStore.length <= 3 && (
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
        {entryStats.total > 0 && showStats && (
          <NotebookCard variant="page" showHoles={false} style={styles.statsContainer}>
            {/* Core BuJo Types Row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Typography variant="title3" color="text" style={styles.statNumber}>{entryStats.tasks}</Typography>
                <Typography variant="caption2" color="textTertiary" style={styles.statLabel}>Tasks</Typography>
              </View>
              <View style={styles.statCard}>
                <Typography variant="title3" color="text" style={styles.statNumber}>{entryStats.events}</Typography>
                <Typography variant="caption2" color="textTertiary" style={styles.statLabel}>Events</Typography>
              </View>
              <View style={styles.statCard}>
                <Typography variant="title3" color="text" style={styles.statNumber}>{entryStats.notes}</Typography>
                <Typography variant="caption2" color="textTertiary" style={styles.statLabel}>Notes</Typography>
              </View>
              <View style={styles.statCard}>
                <Typography 
                  variant="title3" 
                  style={[styles.statNumber, { color: entryStats.completionRate > 50 ? safeThemeAccess(theme, t => t.colors.success, '#15803D') : safeThemeAccess(theme, t => t.colors.warning, '#D97706') }]}
                >
                  {entryStats.completionRate}%
                </Typography>
                <Typography variant="caption2" color="textTertiary" style={styles.statLabel}>Done</Typography>
              </View>
            </View>
            
            {/* Extended Types Row - only show if we have extended entries */}
            {entryStats.hasExtendedTypes && (
              <View style={[styles.statsRow, styles.extendedStatsRow]}>
                {entryStats.inspiration > 0 && (
                  <View style={styles.statCard}>
                    <Typography variant="title3" color="text" style={styles.statNumber}>{entryStats.inspiration}</Typography>
                    <Typography variant="caption2" color="textTertiary" style={styles.statLabel}>Ideas</Typography>
                  </View>
                )}
                {entryStats.research > 0 && (
                  <View style={styles.statCard}>
                    <Typography variant="title3" color="text" style={styles.statNumber}>{entryStats.research}</Typography>
                    <Typography variant="caption2" color="textTertiary" style={styles.statLabel}>Research</Typography>
                  </View>
                )}
                {entryStats.memory > 0 && (
                  <View style={styles.statCard}>
                    <Typography variant="title3" color="text" style={styles.statNumber}>{entryStats.memory}</Typography>
                    <Typography variant="caption2" color="textTertiary" style={styles.statLabel}>Memory</Typography>
                  </View>
                )}
                {entryStats.custom > 0 && (
                  <View style={styles.statCard}>
                    <Typography variant="title3" color="text" style={styles.statNumber}>{entryStats.custom}</Typography>
                    <Typography variant="caption2" color="textTertiary" style={styles.statLabel}>Custom</Typography>
                  </View>
                )}
              </View>
            )}
          </NotebookCard>
        )}

        {/* Search Results Info */}
        {isSearching && debouncedSearchQuery.trim() && (
          <View style={styles.searchResultsInfo}>
            <Typography variant="caption1" color="textSecondary">
              {filteredEntries.length === 0 
                ? 'No entries found' 
                : `Found ${filteredEntries.length} ${filteredEntries.length === 1 ? 'entry' : 'entries'}`
              }
            </Typography>
          </View>
        )}

        {/* Paper Loading Overlay for Refresh */}
        {refreshing && (
          <View style={styles.refreshOverlay}>
            <PaperLoading 
              type="page-flip" 
              message="Refreshing journal..." 
              size="md" 
            />
          </View>
        )}

        {/* Entries List */}
        {(isSearching && debouncedSearchQuery.trim() ? filteredEntries.length > 0 : todaysEntriesFromStore.length > 0) ? (
          <FlatList
          data={filteredEntries}
          keyExtractor={flatListOptimizations.keyExtractor}
          {...flatListOptimizations}
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
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={16}
          windowSize={10}
          initialNumToRender={8}
          getItemLayout={(data, index) => ({
            length: 80, // Estimated height of each entry
            offset: 80 * index,
            index,
          })}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')}
              colors={[safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')]}
              progressBackgroundColor={safeThemeAccess(theme, t => t.colors.surface, '#F5F2E8')}
              title="Refreshing journal..."
              titleColor={safeThemeAccess(theme, t => t.colors.textSecondary, '#6B7280')}
            />
          }
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
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PAPER_DESIGN_TOKENS.spacing.xs,
  },
  actionButton: {
    padding: PAPER_DESIGN_TOKENS.spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 42, 68, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonActive: {
    backgroundColor: '#0F2A44',
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
  
  // Search Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
    paddingVertical: PAPER_DESIGN_TOKENS.spacing.md,
    gap: PAPER_DESIGN_TOKENS.spacing.sm,
    backgroundColor: 'rgba(245, 242, 232, 0.5)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15, 42, 68, 0.1)',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.md,
    paddingVertical: PAPER_DESIGN_TOKENS.spacing.sm,
    gap: PAPER_DESIGN_TOKENS.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(15, 42, 68, 0.1)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2B2B2B',
    padding: 0,
  },
  searchResultsInfo: {
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
    paddingVertical: PAPER_DESIGN_TOKENS.spacing.sm,
  },
  swipeBanner: {
    backgroundColor: 'rgba(21, 128, 61, 0.1)', // Soft green background
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(21, 128, 61, 0.2)',
    paddingHorizontal: PAPER_DESIGN_TOKENS.spacing.xl,
    paddingVertical: PAPER_DESIGN_TOKENS.spacing.sm,
  },
  swipeBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: PAPER_DESIGN_TOKENS.spacing.sm,
  },
  swipeBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  dismissButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  refreshOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(249, 246, 240, 0.85)', // Semi-transparent paper background
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(2px)', // Subtle blur effect
  },
  syncStatusContainer: {
    marginLeft: PAPER_DESIGN_TOKENS.spacing.sm,
  },
  syncIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
});

// Memoized export to prevent unnecessary re-renders
export const DailyLogScreen = React.memo(DailyLogScreenComponent);