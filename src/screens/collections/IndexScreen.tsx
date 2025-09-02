import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBuJoStore } from '../../stores/BuJoStore';
import { BuJoEntry } from '../../types/BuJo';
import { useTheme } from '../../theme';
import { PaperBackground, Typography, Card } from '../../components/ui/paperComponents';
import { BuJoSymbol } from '../../components/ui/BuJoSymbols';
import { safeThemeAccess } from '../../theme/paperStyleUtils';

interface IndexScreenProps {
  navigation: any;
}

type FilterType = 'all' | 'task' | 'event' | 'note' | 'idea';
type FilterStatus = 'all' | 'complete' | 'incomplete';

export const IndexScreen: React.FC<IndexScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { entries } = useBuJoStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedContexts, setSelectedContexts] = useState<string[]>([]);

  // Get all unique tags and contexts
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    entries.forEach(entry => {
      entry.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [entries]);

  const allContexts = useMemo(() => {
    const contexts = new Set<string>();
    entries.forEach(entry => {
      entry.contexts.forEach(ctx => contexts.add(ctx));
    });
    return Array.from(contexts).sort();
  }, [entries]);

  // Filter entries based on search and filters
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const contentMatch = entry.content.toLowerCase().includes(query);
        const tagMatch = entry.tags.some(tag => tag.toLowerCase().includes(query));
        const contextMatch = entry.contexts.some(ctx => ctx.toLowerCase().includes(query));
        
        if (!contentMatch && !tagMatch && !contextMatch) {
          return false;
        }
      }

      // Type filter
      if (filterType !== 'all' && entry.type !== filterType) {
        return false;
      }

      // Status filter
      if (filterStatus !== 'all') {
        if (filterStatus === 'complete' && entry.status !== 'complete') {
          return false;
        }
        if (filterStatus === 'incomplete' && entry.status === 'complete') {
          return false;
        }
      }

      // Tags filter
      if (selectedTags.length > 0) {
        const hasSelectedTag = selectedTags.some(tag => entry.tags.includes(tag));
        if (!hasSelectedTag) {
          return false;
        }
      }

      // Contexts filter
      if (selectedContexts.length > 0) {
        const hasSelectedContext = selectedContexts.some(ctx => entry.contexts.includes(ctx));
        if (!hasSelectedContext) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.collectionDate).getTime() - new Date(a.collectionDate).getTime());
  }, [entries, searchQuery, filterType, filterStatus, selectedTags, selectedContexts]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const toggleContext = (context: string) => {
    setSelectedContexts(prev => 
      prev.includes(context)
        ? prev.filter(c => c !== context)
        : [...prev, context]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setFilterStatus('all');
    setSelectedTags([]);
    setSelectedContexts([]);
  };

  const getEntryTypeColor = (type: string) => {
    switch (type) {
      case 'task': return '#007AFF';
      case 'event': return '#FF3B30';
      case 'note': return '#32D74B';
      case 'idea': return '#FFD60A';
      default: return '#8E8E93';
    }
  };

  const getBulletSymbol = (entry: BuJoEntry) => {
    if (entry.type === 'task') {
      return entry.status === 'complete' ? '✓' : '•';
    } else if (entry.type === 'event') {
      return '○';
    } else if (entry.type === 'note') {
      return '—';
    } else if (entry.type === 'idea') {
      return '!';
    }
    return '•';
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '**$1**');
  };

  const renderEntry = ({ item: entry }: { item: BuJoEntry }) => (
    <Card variant="flat" padding="md" style={styles.entryItem}>
      <TouchableOpacity activeOpacity={0.7}>
        <View style={styles.entryHeader}>
          <Typography
            variant="body"
            style={[
              styles.bullet,
              { color: getEntryTypeColor(entry.type) }
            ]}
          >
            {getBulletSymbol(entry)}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {new Date(entry.collectionDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </Typography>
        </View>

        <Typography
          variant="body"
          color="text"
          style={[
            styles.entryText,
            entry.status === 'complete' && styles.completedText
          ]}
        >
          {entry.content}
        </Typography>

        {(entry.tags.length > 0 || entry.contexts.length > 0) && (
          <View style={styles.tagContainer}>
            {entry.contexts.map(ctx => (
              <TouchableOpacity
                key={ctx}
                style={[
                  styles.contextTag,
                  selectedContexts.includes(ctx) && styles.selectedTag
                ]}
                onPress={() => toggleContext(ctx)}
              >
                <Typography
                  variant="caption"
                  color={selectedContexts.includes(ctx) ? 'surface' : 'textSecondary'}
                >
                  @{ctx}
                </Typography>
              </TouchableOpacity>
            ))}
            {entry.tags.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.hashTag,
                  selectedTags.includes(tag) && styles.selectedTag
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Typography
                  variant="caption"
                  color={selectedTags.includes(tag) ? 'surface' : 'textSecondary'}
                >
                  #{tag}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </TouchableOpacity>
    </Card>
  );

  return (
    <PaperBackground variant="lined" showMargin={true} intensity="light">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <Card variant="elevated" padding="md" style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={safeThemeAccess(theme, t => t.colors.primary, '#0F2A44')} />
          </TouchableOpacity>
          <Typography variant="headline" color="text">Index & Search</Typography>
          <TouchableOpacity onPress={clearFilters}>
            <Typography variant="body" color="primary">Clear</Typography>
          </TouchableOpacity>
        </Card>

        {/* Search Bar */}
        <Card variant="flat" padding="md" style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={safeThemeAccess(theme, t => t.colors.textSecondary, '#8E8E93')} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search entries..."
              placeholderTextColor={safeThemeAccess(theme, t => t.colors.textSecondary, '#8E8E93')}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={safeThemeAccess(theme, t => t.colors.textSecondary, '#8E8E93')} />
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* Quick Filters */}
        <Card variant="flat" padding="sm" style={styles.quickFiltersCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filtersContainer}>
              {/* Essential Type Filters */}
              {(['all', 'task', 'event', 'note'] as FilterType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterChip,
                    filterType === type && styles.activeFilterChip
                  ]}
                  onPress={() => setFilterType(type)}
                >
                  <Typography
                    variant="caption"
                    color={filterType === type ? 'surface' : 'textSecondary'}
                  >
                    {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </Typography>
                </TouchableOpacity>
              ))}
              
              {/* Status separator */}
              <View style={styles.filterSeparator} />
              
              {/* Status Filters */}
              {(['complete', 'incomplete'] as FilterStatus[]).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterChip,
                    filterStatus === status && styles.activeFilterChip
                  ]}
                  onPress={() => setFilterStatus(status === filterStatus ? 'all' : status)}
                >
                  <Typography
                    variant="caption"
                    color={filterStatus === status ? 'surface' : 'textSecondary'}
                  >
                    {status === 'complete' ? '✓ Done' : '○ Todo'}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Card>

        {/* Results */}
        <View style={styles.resultsContainer}>
          <Card variant="flat" padding="sm" style={styles.resultsHeader}>
            <Typography variant="caption" color="textSecondary">
              {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
            </Typography>
            {(selectedTags.length > 0 || selectedContexts.length > 0) && (
              <Typography variant="caption" color="primary">
                {selectedTags.length + selectedContexts.length} active tag filters
              </Typography>
            )}
          </Card>

        <FlatList
          data={filteredEntries}
          renderItem={renderEntry}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.entriesList}
          showsVerticalScrollIndicator={false}
          // Performance optimizations for index entries
          removeClippedSubviews={true}
          maxToRenderPerBatch={15}
          initialNumToRender={10}
          windowSize={15}
          getItemLayout={(data, index) => ({
            length: 60, // Index entry height
            offset: 60 * index,
            index,
          })}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={48} color={safeThemeAccess(theme, t => t.colors.textTertiary, '#C7C7CC')} />
              <Typography variant="headline" color="textSecondary" style={styles.emptyTitle}>
                No entries found
              </Typography>
              <Typography variant="body" color="textSecondary" style={styles.emptyDescription}>
                Try adjusting your search terms or filters
              </Typography>
            </View>
          )}
        />
        </View>
      </SafeAreaView>
    </PaperBackground>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  clearButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  filtersScrollView: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeFilterButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  activeFilters: {
    fontSize: 14,
    color: '#007AFF',
  },
  entriesList: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  entryItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  bullet: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  entryDate: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  entryText: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 22,
    marginBottom: 8,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  contextTag: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  contextTagText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  hashTag: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hashTagText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  selectedTag: {
    backgroundColor: '#007AFF',
  },
  selectedTagText: {
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});