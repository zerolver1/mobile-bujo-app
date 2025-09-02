import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useTheme } from '../../theme';
import { PaperBackground } from '../../components/ui/PaperBackground';
import { Typography } from '../../components/ui/Typography';
import { GlobalSearchBar } from '../../components/search/GlobalSearchBar';
import { BuJoEntry } from '../../types/BuJo';
import { useEntriesByType, useSearchEntries } from '../../stores/selectors';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';

export const SearchScreen: React.FC = () => {
  const { theme } = useTheme();
  const [searchResults, setSearchResults] = useState<BuJoEntry[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // Get counts for filter badges
  const allTasks = useEntriesByType('task');
  const allEvents = useEntriesByType('event');
  const allNotes = useEntriesByType('note');
  const allResearch = useEntriesByType('research');
  const allMemories = useEntriesByType('memory');

  const getStyles = useMemo(() => {
    if (!theme?.colors || !theme?.typography) {
      return fallbackStyles;
    }

    return StyleSheet.create({
      container: {
        flex: 1,
      },
      header: {
        paddingHorizontal: theme.spacing?.md || 16,
        paddingVertical: theme.spacing?.sm || 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      },
      content: {
        flex: 1,
        paddingVertical: theme.spacing?.sm || 8,
      },
      filtersSection: {
        paddingHorizontal: theme.spacing?.md || 16,
        marginBottom: theme.spacing?.md || 16,
      },
      filtersTitle: {
        marginBottom: theme.spacing?.sm || 8,
      },
      filtersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
      },
      filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing?.sm || 12,
        paddingVertical: theme.spacing?.xs || 6,
        marginRight: theme.spacing?.xs || 8,
        marginBottom: theme.spacing?.xs || 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
      },
      filterChipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
      },
      filterChipText: {
        fontSize: theme.typography.textStyles?.caption1?.fontSize || 14,
        color: theme.colors.text,
        fontWeight: '500',
      },
      filterChipTextActive: {
        color: theme.colors.background,
      },
      filterCount: {
        fontSize: theme.typography.textStyles?.caption2?.fontSize || 12,
        color: theme.colors.textSecondary,
        marginLeft: theme.spacing?.xs || 4,
        backgroundColor: 'rgba(0,0,0,0.1)',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 8,
      },
      filterCountActive: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        color: theme.colors.background,
      },
      quickActionsSection: {
        paddingHorizontal: theme.spacing?.md || 16,
        marginBottom: theme.spacing?.md || 16,
      },
      quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
      },
      quickActionCard: {
        width: '48%',
        marginBottom: theme.spacing?.sm || 8,
      },
      quickActionContent: {
        alignItems: 'center',
        paddingVertical: theme.spacing?.md || 16,
      },
      quickActionIcon: {
        marginBottom: theme.spacing?.xs || 6,
      },
      quickActionTitle: {
        textAlign: 'center',
        fontWeight: '500',
      },
      quickActionSubtitle: {
        textAlign: 'center',
        fontSize: theme.typography.textStyles?.caption1?.fontSize || 14,
        marginTop: theme.spacing?.xs || 2,
      },
      emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing?.lg || 32,
        paddingVertical: theme.spacing?.xl || 48,
      },
      emptyStateIcon: {
        marginBottom: theme.spacing?.md || 16,
      },
      emptyStateTitle: {
        textAlign: 'center',
        marginBottom: theme.spacing?.sm || 8,
      },
      emptyStateDescription: {
        textAlign: 'center',
        lineHeight: 22,
      },
    });
  }, [theme]);

  const fallbackStyles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
    content: { flex: 1, paddingVertical: 8 },
    filtersSection: { paddingHorizontal: 16, marginBottom: 16 },
    filtersTitle: { marginBottom: 8 },
    filtersContainer: { flexDirection: 'row', flexWrap: 'wrap' },
    filterChip: { flexDirection: 'row', alignItems: 'center', padding: 8, margin: 4, borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#F5F2E8' },
    filterChipActive: { backgroundColor: '#0F2A44', borderColor: '#0F2A44' },
    filterChipText: { fontSize: 14, color: '#2B2B2B', fontWeight: '500' },
    filterChipTextActive: { color: '#F9F6F0' },
    filterCount: { fontSize: 12, color: '#666', marginLeft: 4, backgroundColor: 'rgba(0,0,0,0.1)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
    filterCountActive: { backgroundColor: 'rgba(255,255,255,0.2)', color: '#F9F6F0' },
    quickActionsSection: { paddingHorizontal: 16, marginBottom: 16 },
    quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    quickActionCard: { width: '48%', marginBottom: 8 },
    quickActionContent: { alignItems: 'center', paddingVertical: 16 },
    quickActionIcon: { marginBottom: 6 },
    quickActionTitle: { textAlign: 'center', fontWeight: '500' },
    quickActionSubtitle: { textAlign: 'center', fontSize: 14, marginTop: 2 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    emptyStateIcon: { marginBottom: 16 },
    emptyStateTitle: { textAlign: 'center', marginBottom: 8 },
    emptyStateDescription: { textAlign: 'center', lineHeight: 22 },
  });

  const styles = getStyles;

  const handleSearchResults = useCallback((results: BuJoEntry[]) => {
    setSearchResults(results);
  }, []);

  const toggleFilter = useCallback((filterType: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterType)
        ? prev.filter(f => f !== filterType)
        : [...prev, filterType]
    );
  }, []);

  const getFilteredResults = useCallback(() => {
    if (selectedFilters.length === 0) return searchResults;
    
    return searchResults.filter(entry => 
      selectedFilters.includes(entry.type)
    );
  }, [searchResults, selectedFilters]);

  const filterOptions = [
    { type: 'task', label: 'Tasks', icon: 'checkmark-circle-outline', count: allTasks.length },
    { type: 'event', label: 'Events', icon: 'calendar-outline', count: allEvents.length },
    { type: 'note', label: 'Notes', icon: 'document-text-outline', count: allNotes.length },
    { type: 'research', label: 'Research', icon: 'search-outline', count: allResearch.length },
    { type: 'memory', label: 'Memories', icon: 'heart-outline', count: allMemories.length },
  ];

  const quickActions = [
    {
      title: 'Incomplete Tasks',
      subtitle: 'Review pending items',
      icon: 'list-outline',
      action: () => {
        // TODO: Implement quick filter for incomplete tasks
      },
    },
    {
      title: 'Recent Entries',
      subtitle: 'Last 7 days',
      icon: 'time-outline',
      action: () => {
        // TODO: Implement quick filter for recent entries
      },
    },
    {
      title: 'Tag Cloud',
      subtitle: 'Browse by tags',
      icon: 'pricetags-outline',
      action: () => {
        // TODO: Implement tag cloud view
      },
    },
    {
      title: 'Migration Review',
      subtitle: 'Items to migrate',
      icon: 'arrow-forward-circle-outline',
      action: () => {
        // TODO: Navigate to migration screen
      },
    },
  ];

  const filteredResults = getFilteredResults();

  return (
    <PaperBackground variant="subtle" intensity="light">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Typography variant="h2" color="text">
            Search & Discover
          </Typography>
          <Typography variant="body" color="textSecondary">
            Find entries across all your collections
          </Typography>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <GlobalSearchBar 
            onSearchResult={handleSearchResults}
            showResults={false}
            placeholder="Search entries, tags, contexts..."
          />

          {/* Type Filters */}
          <View style={styles.filtersSection}>
            <Typography variant="h3" color="text" style={styles.filtersTitle}>
              Filter by Type
            </Typography>
            <View style={styles.filtersContainer}>
              {filterOptions.map((filter) => {
                const isActive = selectedFilters.includes(filter.type);
                return (
                  <TouchableOpacity
                    key={filter.type}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => toggleFilter(filter.type)}
                  >
                    <Ionicons
                      name={filter.icon}
                      size={16}
                      color={isActive ? theme?.colors?.background || '#F9F6F0' : theme?.colors?.primary || '#0F2A44'}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                      {filter.label}
                    </Text>
                    <Text style={[styles.filterCount, isActive && styles.filterCountActive]}>
                      {filter.count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Typography variant="h3" color="text" style={styles.filtersTitle}>
              Quick Actions
            </Typography>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickActionCard}
                  onPress={action.action}
                >
                  <Card variant="elevated" padding="md">
                    <View style={styles.quickActionContent}>
                      <Ionicons
                        name={action.icon}
                        size={32}
                        color={theme?.colors?.primary || '#0F2A44'}
                        style={styles.quickActionIcon}
                      />
                      <Typography variant="body" color="text" style={styles.quickActionTitle}>
                        {action.title}
                      </Typography>
                      <Typography variant="caption1" color="textSecondary" style={styles.quickActionSubtitle}>
                        {action.subtitle}
                      </Typography>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Search Results Display */}
          {searchResults.length > 0 && (
            <View style={{ paddingHorizontal: 16 }}>
              <Typography variant="h3" color="text" style={{ marginBottom: 12 }}>
                Search Results ({filteredResults.length})
              </Typography>
              <GlobalSearchBar 
                onSearchResult={handleSearchResults}
                showResults={true}
                maxResults={20}
              />
            </View>
          )}

          {/* Empty State */}
          {searchResults.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons
                name="search-outline"
                size={64}
                color={theme?.colors?.textTertiary || '#999'}
                style={styles.emptyStateIcon}
              />
              <Typography variant="h3" color="text" style={styles.emptyStateTitle}>
                Discover Your Journal
              </Typography>
              <Typography variant="body" color="textSecondary" style={styles.emptyStateDescription}>
                Use the search bar above to find entries across all your collections.
                {'\n\n'}
                Search by content, tags (#work), contexts (@home), or entry types.
                {'\n\n'}
                Try the quick actions below to explore your journal in different ways.
              </Typography>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </PaperBackground>
  );
};