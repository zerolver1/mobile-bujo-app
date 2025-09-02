import { useMemo, useState, useCallback } from 'react';
import { useBuJoStore } from '../stores/BuJoStore';
import { BuJoEntry } from '../types/BuJo';

interface UsePaginatedEntriesOptions {
  pageSize?: number;
  sortBy?: 'date' | 'created' | 'modified';
  sortOrder?: 'asc' | 'desc';
  filter?: (entry: BuJoEntry) => boolean;
}

interface PaginatedEntriesResult {
  entries: BuJoEntry[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  loadNextPage: () => void;
  loadPreviousPage: () => void;
  goToPage: (page: number) => void;
  refreshData: () => void;
  isLoading: boolean;
}

export const usePaginatedEntries = (options: UsePaginatedEntriesOptions = {}): PaginatedEntriesResult => {
  const {
    pageSize = 50,
    sortBy = 'date',
    sortOrder = 'desc',
    filter,
  } = options;

  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get all entries from store
  const allEntries = useBuJoStore(state => state.entries);

  // Process and sort entries
  const processedEntries = useMemo(() => {
    let entries = [...allEntries];

    // Apply filter if provided
    if (filter) {
      entries = entries.filter(filter);
    }

    // Sort entries
    entries.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.collectionDate);
          bValue = new Date(b.collectionDate);
          break;
        case 'created':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'modified':
          aValue = new Date(a.lastModifiedAt || a.createdAt);
          bValue = new Date(b.lastModifiedAt || b.createdAt);
          break;
        default:
          aValue = new Date(a.collectionDate);
          bValue = new Date(b.collectionDate);
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return entries;
  }, [allEntries, filter, sortBy, sortOrder]);

  // Calculate pagination values
  const totalCount = processedEntries.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  // Get current page entries
  const paginatedEntries = useMemo(() => {
    return processedEntries.slice(startIndex, endIndex);
  }, [processedEntries, startIndex, endIndex]);

  // Navigation functions
  const loadNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setIsLoading(true);
      // Simulate loading delay for smoother UX
      setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setIsLoading(false);
      }, 100);
    }
  }, [currentPage, totalPages]);

  const loadPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setIsLoading(true);
      setTimeout(() => {
        setCurrentPage(prev => prev - 1);
        setIsLoading(false);
      }, 100);
    }
  }, [currentPage]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setIsLoading(true);
      setTimeout(() => {
        setCurrentPage(page);
        setIsLoading(false);
      }, 100);
    }
  }, [totalPages, currentPage]);

  const refreshData = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setCurrentPage(1);
      setIsLoading(false);
    }, 100);
  }, []);

  // Reset to page 1 if current page exceeds total pages
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  return {
    entries: paginatedEntries,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    loadNextPage,
    loadPreviousPage,
    goToPage,
    refreshData,
    isLoading,
  };
};

// Specialized hook for date-based pagination (most common use case)
export const usePaginatedEntriesByDate = (
  dateRange?: { start: Date; end: Date },
  pageSize: number = 50
) => {
  const filter = useMemo(() => {
    if (!dateRange) return undefined;
    
    return (entry: BuJoEntry) => {
      const entryDate = new Date(entry.collectionDate);
      return entryDate >= dateRange.start && entryDate <= dateRange.end;
    };
  }, [dateRange]);

  return usePaginatedEntries({
    pageSize,
    sortBy: 'date',
    sortOrder: 'desc',
    filter,
  });
};

// Hook for search results pagination
export const usePaginatedSearchResults = (
  query: string,
  pageSize: number = 20
) => {
  const filter = useMemo(() => {
    if (!query.trim()) return undefined;
    
    const lowerQuery = query.toLowerCase();
    return (entry: BuJoEntry) =>
      entry.content.toLowerCase().includes(lowerQuery) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      entry.contexts?.some(context => context.toLowerCase().includes(lowerQuery));
  }, [query]);

  return usePaginatedEntries({
    pageSize,
    sortBy: 'modified',
    sortOrder: 'desc',
    filter,
  });
};

// Hook for migration candidates with pagination
export const usePaginatedMigrationCandidates = (pageSize: number = 25) => {
  const filter = useMemo(() => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    return (entry: BuJoEntry) => 
      entry.type === 'task' && 
      entry.status === 'incomplete' &&
      new Date(entry.collectionDate) < oneDayAgo;
  }, []);

  return usePaginatedEntries({
    pageSize,
    sortBy: 'date',
    sortOrder: 'asc', // Oldest first for migration
    filter,
  });
};