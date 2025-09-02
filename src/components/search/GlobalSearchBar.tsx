import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../theme';
import { useSearchEntries } from '../../stores/selectors';
import { BuJoEntry } from '../../types/BuJo';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { EntryItem } from '../entries/EntryItem';

interface GlobalSearchBarProps {
  onSearchResult?: (entries: BuJoEntry[]) => void;
  placeholder?: string;
  showResults?: boolean;
  maxResults?: number;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  onSearchResult,
  placeholder = "Search all entries, tags, and contexts...",
  showResults = true,
  maxResults = 50,
}) => {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchResults = useSearchEntries(query);

  useEffect(() => {
    if (query.length >= 2) {
      setIsSearching(true);
      // Debounce search
      const timeoutId = setTimeout(() => {
        setIsSearching(false);
        onSearchResult?.(searchResults);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setIsSearching(false);
      onSearchResult?.([]);
    }
  }, [query, searchResults, onSearchResult]);

  const getStyles = useMemo(() => {
    if (!theme?.colors || !theme?.typography) {
      return fallbackStyles;
    }

    return StyleSheet.create({
      container: {
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
        paddingHorizontal: theme.spacing?.md || 16,
        paddingVertical: theme.spacing?.sm || 12,
        marginHorizontal: theme.spacing?.md || 16,
        marginVertical: theme.spacing?.sm || 8,
        elevation: 2,
        shadowColor: 'rgba(139, 69, 19, 0.1)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderRadius: 6,
        paddingHorizontal: theme.spacing?.sm || 12,
        paddingVertical: theme.spacing?.xs || 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      searchInput: {
        flex: 1,
        fontSize: theme.typography.textStyles?.body?.fontSize || 17,
        color: theme.colors.text,
        paddingVertical: theme.spacing?.xs || 4,
      },
      searchIcon: {
        marginRight: theme.spacing?.sm || 8,
      },
      clearButton: {
        marginLeft: theme.spacing?.sm || 8,
        padding: theme.spacing?.xs || 4,
      },
      resultsContainer: {
        marginTop: theme.spacing?.md || 16,
        maxHeight: 400,
      },
      resultsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing?.sm || 8,
        paddingHorizontal: theme.spacing?.xs || 4,
      },
      noResults: {
        textAlign: 'center',
        padding: theme.spacing?.lg || 24,
        color: theme.colors.textSecondary,
      },
      resultItem: {
        backgroundColor: theme.colors.background,
        borderRadius: 6,
        marginVertical: theme.spacing?.xs || 2,
        padding: theme.spacing?.sm || 12,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
      },
      resultContent: {
        fontSize: theme.typography.textStyles?.body?.fontSize || 16,
        color: theme.colors.text,
        lineHeight: 22,
      },
      resultMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: theme.spacing?.xs || 4,
      },
      resultDate: {
        fontSize: theme.typography.textStyles?.caption1?.fontSize || 14,
        color: theme.colors.textTertiary,
      },
      resultType: {
        fontSize: theme.typography.textStyles?.caption1?.fontSize || 14,
        color: theme.colors.primary,
        fontWeight: '500',
      },
      searchingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing?.md || 16,
      },
      searchingText: {
        marginLeft: theme.spacing?.sm || 8,
        color: theme.colors.textSecondary,
      },
    });
  }, [theme]);

  const fallbackStyles = StyleSheet.create({
    container: { backgroundColor: '#F5F2E8', padding: 16, borderRadius: 8 },
    searchInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F6F0', padding: 8, borderRadius: 6 },
    searchInput: { flex: 1, fontSize: 17, color: '#2B2B2B' },
    searchIcon: { marginRight: 8 },
    clearButton: { marginLeft: 8, padding: 4 },
    resultsContainer: { marginTop: 16, maxHeight: 400 },
    resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    noResults: { textAlign: 'center', padding: 24, color: '#666' },
    resultItem: { backgroundColor: '#F9F6F0', padding: 12, marginVertical: 2, borderRadius: 6, borderLeftWidth: 3, borderLeftColor: '#0F2A44' },
    resultContent: { fontSize: 16, color: '#2B2B2B', lineHeight: 22 },
    resultMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    resultDate: { fontSize: 14, color: '#666' },
    resultType: { fontSize: 14, color: '#0F2A44', fontWeight: '500' },
    searchingIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
    searchingText: { marginLeft: 8, color: '#666' },
  });

  const styles = getStyles;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTypeIcon = (type: BuJoEntry['type']) => {
    switch (type) {
      case 'task': return 'checkmark-circle-outline';
      case 'event': return 'calendar-outline';
      case 'note': return 'document-text-outline';
      case 'research': return 'search-outline';
      case 'memory': return 'heart-outline';
      default: return 'ellipse-outline';
    }
  };

  const highlightQuery = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <Text key={index} style={{ fontWeight: 'bold', backgroundColor: 'rgba(15, 42, 68, 0.1)' }}>
          {part}
        </Text>
      ) : (
        part
      )
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchInputContainer}>
        <Ionicons 
          name="search" 
          size={20} 
          color={theme?.colors?.textSecondary || '#666'} 
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor={theme?.colors?.textTertiary || '#999'}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => setQuery('')}
            style={styles.clearButton}
          >
            <Ionicons 
              name="close-circle" 
              size={20} 
              color={theme?.colors?.textSecondary || '#666'} 
            />
          </TouchableOpacity>
        )}
      </View>

      {showResults && query.length >= 2 && (
        <View style={styles.resultsContainer}>
          {isSearching ? (
            <View style={styles.searchingIndicator}>
              <Ionicons 
                name="hourglass-outline" 
                size={16} 
                color={theme?.colors?.textSecondary || '#666'} 
              />
              <Typography variant="body" color="textSecondary" style={styles.searchingText}>
                Searching...
              </Typography>
            </View>
          ) : (
            <>
              <View style={styles.resultsHeader}>
                <Typography variant="h3" color="text">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </Typography>
                {searchResults.length > maxResults && (
                  <Typography variant="caption1" color="textSecondary">
                    Showing first {maxResults}
                  </Typography>
                )}
              </View>

              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {searchResults.length === 0 ? (
                  <Typography variant="body" color="textSecondary" style={styles.noResults}>
                    No entries found for "{query}"{'\n\n'}
                    Try searching for:
                    {'\n'}• Entry content or keywords
                    {'\n'}• Tags (e.g., #work, #personal)
                    {'\n'}• Contexts (e.g., @home, @office)
                  </Typography>
                ) : (
                  searchResults.slice(0, maxResults).map((entry) => (
                    <TouchableOpacity key={entry.id} style={styles.resultItem}>
                      <View style={styles.resultMeta}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons 
                            name={getTypeIcon(entry.type)} 
                            size={16} 
                            color={theme?.colors?.primary || '#0F2A44'}
                            style={{ marginRight: 6 }}
                          />
                          <Text style={styles.resultType}>
                            {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                          </Text>
                        </View>
                        <Text style={styles.resultDate}>
                          {formatDate(entry.collectionDate)}
                        </Text>
                      </View>
                      <Text style={styles.resultContent}>
                        {highlightQuery(entry.content, query)}
                      </Text>
                      {(entry.tags.length > 0 || entry.contexts.length > 0) && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
                          {entry.tags.map((tag, index) => (
                            <Text
                              key={`tag-${index}`}
                              style={{
                                fontSize: 12,
                                color: theme?.colors?.primary || '#0F2A44',
                                backgroundColor: 'rgba(15, 42, 68, 0.1)',
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 3,
                                marginRight: 4,
                                marginTop: 2,
                              }}
                            >
                              #{tag}
                            </Text>
                          ))}
                          {entry.contexts.map((context, index) => (
                            <Text
                              key={`context-${index}`}
                              style={{
                                fontSize: 12,
                                color: theme?.colors?.secondary || '#15803D',
                                backgroundColor: 'rgba(21, 128, 61, 0.1)',
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 3,
                                marginRight: 4,
                                marginTop: 2,
                              }}
                            >
                              @{context}
                            </Text>
                          ))}
                        </View>
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </>
          )}
        </View>
      )}
    </View>
  );
};