// Data Optimization and Caching Utilities
// Provides efficient data loading, caching, and memory management

import AsyncStorage from '@react-native-async-storage/async-storage';
import { BuJoEntry } from '../types/BuJo';
import { performanceMonitor } from './performance';

// Cache configuration
const CACHE_CONFIG = {
  MAX_ENTRIES: 1000, // Maximum entries to keep in memory
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes cache TTL
  STORAGE_PREFIX: 'bujo_cache_',
  CLEANUP_INTERVAL: 10 * 60 * 1000, // Clean up every 10 minutes
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccess: number;
}

// In-memory cache with LRU eviction
class DataCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupTimer();
  }

  set(key: string, data: T): void {
    performanceMonitor.startTiming(`Cache_Set_${key}`);
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= CACHE_CONFIG.MAX_ENTRIES) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccess: Date.now(),
    });

    performanceMonitor.endTiming(`Cache_Set_${key}`);
  }

  get(key: string): T | null {
    performanceMonitor.startTiming(`Cache_Get_${key}`);
    
    const entry = this.cache.get(key);
    if (!entry) {
      performanceMonitor.endTiming(`Cache_Get_${key}`);
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > CACHE_CONFIG.CACHE_TTL) {
      this.cache.delete(key);
      performanceMonitor.endTiming(`Cache_Get_${key}`);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccess = Date.now();

    performanceMonitor.endTiming(`Cache_Get_${key}`);
    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check TTL
    if (Date.now() - entry.timestamp > CACHE_CONFIG.CACHE_TTL) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // LRU eviction - remove least recently used entries
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestAccess) {
        oldestAccess = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // Periodic cleanup of expired entries
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > CACHE_CONFIG.CACHE_TTL) {
          this.cache.delete(key);
        }
      }
    }, CACHE_CONFIG.CLEANUP_INTERVAL);
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }

  // Get cache statistics
  getStats(): {
    size: number;
    maxSize: number;
    hitRatio: number;
  } {
    const entries = Array.from(this.cache.values());
    const totalAccesses = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    const totalEntries = entries.length;

    return {
      size: this.cache.size,
      maxSize: CACHE_CONFIG.MAX_ENTRIES,
      hitRatio: totalAccesses > 0 ? totalEntries / totalAccesses : 0,
    };
  }
}

// Global cache instances
export const entryCache = new DataCache<BuJoEntry[]>();
export const queryCache = new DataCache<any>();

// Persistent storage with compression
export class OptimizedStorage {
  // Compress data before storing (simple string-based compression)
  private compress(data: any): string {
    const jsonString = JSON.stringify(data);
    // Simple compression: remove whitespace and common patterns
    return jsonString
      .replace(/"\s*:\s*"/g, '":"')
      .replace(/"\s*,\s*"/g, '","')
      .replace(/{\s*"/g, '{"')
      .replace(/"\s*}/g, '"}');
  }

  // Decompress data
  private decompress(compressedData: string): any {
    return JSON.parse(compressedData);
  }

  // Store data with compression and caching
  async store<T>(key: string, data: T, useCache: boolean = true): Promise<void> {
    performanceMonitor.startTiming(`Storage_Store_${key}`);

    try {
      // Store in cache first for immediate access
      if (useCache) {
        queryCache.set(key, data);
      }

      // Compress and store persistently
      const compressedData = this.compress(data);
      await AsyncStorage.setItem(
        `${CACHE_CONFIG.STORAGE_PREFIX}${key}`,
        compressedData
      );
    } catch (error) {
      console.error(`Failed to store data for key ${key}:`, error);
      throw error;
    } finally {
      performanceMonitor.endTiming(`Storage_Store_${key}`);
    }
  }

  // Retrieve data with caching
  async retrieve<T>(key: string, useCache: boolean = true): Promise<T | null> {
    performanceMonitor.startTiming(`Storage_Retrieve_${key}`);

    try {
      // Check cache first
      if (useCache) {
        const cachedData = queryCache.get(key);
        if (cachedData) {
          performanceMonitor.endTiming(`Storage_Retrieve_${key}`);
          return cachedData as T;
        }
      }

      // Retrieve from persistent storage
      const compressedData = await AsyncStorage.getItem(
        `${CACHE_CONFIG.STORAGE_PREFIX}${key}`
      );

      if (!compressedData) {
        performanceMonitor.endTiming(`Storage_Retrieve_${key}`);
        return null;
      }

      const data = this.decompress(compressedData);

      // Cache for future use
      if (useCache) {
        queryCache.set(key, data);
      }

      performanceMonitor.endTiming(`Storage_Retrieve_${key}`);
      return data as T;
    } catch (error) {
      console.error(`Failed to retrieve data for key ${key}:`, error);
      performanceMonitor.endTiming(`Storage_Retrieve_${key}`);
      return null;
    }
  }

  // Batch operations for better performance
  async storeBatch<T>(items: Array<{ key: string; data: T }>): Promise<void> {
    performanceMonitor.startTiming('Storage_BatchStore');

    try {
      const operations = items.map(({ key, data }) => [
        `${CACHE_CONFIG.STORAGE_PREFIX}${key}`,
        this.compress(data),
      ] as [string, string]);

      await AsyncStorage.multiSet(operations);

      // Update cache
      items.forEach(({ key, data }) => {
        queryCache.set(key, data);
      });
    } catch (error) {
      console.error('Batch store operation failed:', error);
      throw error;
    } finally {
      performanceMonitor.endTiming('Storage_BatchStore');
    }
  }

  // Clear all cached and stored data
  async clearAll(): Promise<void> {
    performanceMonitor.startTiming('Storage_ClearAll');

    try {
      // Clear caches
      entryCache.clear();
      queryCache.clear();

      // Clear persistent storage
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_CONFIG.STORAGE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    } finally {
      performanceMonitor.endTiming('Storage_ClearAll');
    }
  }

  // Get storage statistics
  async getStorageStats(): Promise<{
    totalKeys: number;
    cacheKeys: number;
    estimatedSize: number;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_CONFIG.STORAGE_PREFIX));
      
      // Estimate total size (rough approximation)
      let estimatedSize = 0;
      for (const key of cacheKeys.slice(0, 10)) { // Sample first 10 keys
        const data = await AsyncStorage.getItem(key);
        if (data) {
          estimatedSize += data.length;
        }
      }
      
      return {
        totalKeys: keys.length,
        cacheKeys: cacheKeys.length,
        estimatedSize: estimatedSize * (cacheKeys.length / Math.min(10, cacheKeys.length)),
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { totalKeys: 0, cacheKeys: 0, estimatedSize: 0 };
    }
  }
}

// Global storage instance
export const optimizedStorage = new OptimizedStorage();

// Data pagination utilities
export class DataPaginator<T> {
  private data: T[] = [];
  private pageSize: number;
  private currentPage: number = 0;

  constructor(data: T[], pageSize: number = 50) {
    this.data = data;
    this.pageSize = pageSize;
  }

  getPage(page: number): T[] {
    const start = page * this.pageSize;
    const end = start + this.pageSize;
    return this.data.slice(start, end);
  }

  getCurrentPage(): T[] {
    return this.getPage(this.currentPage);
  }

  nextPage(): T[] {
    if (this.hasNextPage()) {
      this.currentPage++;
    }
    return this.getCurrentPage();
  }

  previousPage(): T[] {
    if (this.hasPreviousPage()) {
      this.currentPage--;
    }
    return this.getCurrentPage();
  }

  hasNextPage(): boolean {
    return (this.currentPage + 1) * this.pageSize < this.data.length;
  }

  hasPreviousPage(): boolean {
    return this.currentPage > 0;
  }

  getTotalPages(): number {
    return Math.ceil(this.data.length / this.pageSize);
  }

  jumpToPage(page: number): T[] {
    const totalPages = this.getTotalPages();
    this.currentPage = Math.max(0, Math.min(page, totalPages - 1));
    return this.getCurrentPage();
  }

  // Search within paginated data
  searchAndPaginate(searchFn: (item: T) => boolean): T[] {
    const filteredData = this.data.filter(searchFn);
    const paginator = new DataPaginator(filteredData, this.pageSize);
    return paginator.getCurrentPage();
  }
}

// Memory monitoring utilities
export const memoryMonitor = {
  // Log current memory usage (React Native doesn't have direct memory APIs)
  logUsage: (label: string = 'Memory Check') => {
    if (__DEV__) {
      console.log(`📊 ${label}: In React Native, use native tools for memory profiling`);
      
      // Log cache statistics
      const cacheStats = entryCache.getStats();
      console.log('Entry Cache Stats:', cacheStats);
      
      const queryStats = queryCache.getStats();
      console.log('Query Cache Stats:', queryStats);
    }
  },

  // Force garbage collection (request only)
  requestGarbageCollection: () => {
    if (__DEV__ && global.gc) {
      global.gc();
      console.log('🗑️ Garbage collection requested');
    }
  },

  // Clear all caches to free memory
  clearCaches: () => {
    entryCache.clear();
    queryCache.clear();
    console.log('🧹 All caches cleared for memory optimization');
  },
};

export default {
  entryCache,
  queryCache,
  optimizedStorage,
  DataPaginator,
  memoryMonitor,
};