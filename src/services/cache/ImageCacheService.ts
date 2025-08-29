import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

interface CacheEntry {
  id: string;
  originalUri: string;
  cachedUri: string;
  timestamp: Date;
  size: number;
  hash: string;
  ocrResult?: any;
}

interface CacheStats {
  totalSize: number;
  entryCount: number;
  hitRate: number;
  oldestEntry?: Date;
  newestEntry?: Date;
}

class ImageCacheService {
  private readonly CACHE_KEY = 'image_cache';
  private readonly CACHE_DIR = `${FileSystem.documentDirectory}image_cache/`;
  private readonly MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly MAX_CACHE_ENTRIES = 100;

  private hits = 0;
  private misses = 0;

  constructor() {
    this.ensureCacheDirectory();
  }

  /**
   * Get cached image or cache it if not exists
   */
  async getCachedImage(imageUri: string): Promise<{
    cachedUri: string;
    ocrResult?: any;
    fromCache: boolean;
  }> {
    try {
      const hash = await this.generateHash(imageUri);
      const cacheEntry = await this.getCacheEntry(hash);

      if (cacheEntry && await this.isValidCacheEntry(cacheEntry)) {
        this.hits++;
        return {
          cachedUri: cacheEntry.cachedUri,
          ocrResult: cacheEntry.ocrResult,
          fromCache: true,
        };
      }

      // Cache miss - copy image to cache
      this.misses++;
      const cachedUri = await this.cacheImage(imageUri, hash);
      
      return {
        cachedUri,
        fromCache: false,
      };
    } catch (error) {
      console.error('ImageCache: Failed to get cached image:', error);
      // Return original URI as fallback
      return {
        cachedUri: imageUri,
        fromCache: false,
      };
    }
  }

  /**
   * Cache OCR result with image
   */
  async cacheOCRResult(imageUri: string, ocrResult: any): Promise<void> {
    try {
      const hash = await this.generateHash(imageUri);
      const cacheEntries = await this.getCacheEntries();
      const entryIndex = cacheEntries.findIndex(entry => entry.hash === hash);

      if (entryIndex !== -1) {
        cacheEntries[entryIndex].ocrResult = ocrResult;
        await this.storeCacheEntries(cacheEntries);
      }
    } catch (error) {
      console.error('ImageCache: Failed to cache OCR result:', error);
    }
  }

  /**
   * Preload images for better performance
   */
  async preloadImages(imageUris: string[]): Promise<void> {
    const promises = imageUris.map(uri => 
      this.getCachedImage(uri).catch(error => {
        console.warn('ImageCache: Failed to preload image:', uri, error);
        return null;
      })
    );

    await Promise.all(promises);
  }

  /**
   * Clean up old cache entries
   */
  async cleanup(): Promise<{ deletedEntries: number; freedBytes: number }> {
    try {
      const cacheEntries = await this.getCacheEntries();
      const now = new Date();
      let deletedEntries = 0;
      let freedBytes = 0;

      // Remove expired entries
      const validEntries = [];
      for (const entry of cacheEntries) {
        const age = now.getTime() - new Date(entry.timestamp).getTime();
        
        if (age > this.MAX_CACHE_AGE) {
          await this.deleteCacheFile(entry.cachedUri);
          deletedEntries++;
          freedBytes += entry.size;
        } else {
          validEntries.push(entry);
        }
      }

      // If still over size limit, remove oldest entries
      validEntries.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      let currentSize = validEntries.reduce((sum, entry) => sum + entry.size, 0);
      const finalEntries = [];

      for (const entry of validEntries.reverse()) {
        if (currentSize <= this.MAX_CACHE_SIZE && finalEntries.length < this.MAX_CACHE_ENTRIES) {
          finalEntries.push(entry);
        } else {
          await this.deleteCacheFile(entry.cachedUri);
          deletedEntries++;
          freedBytes += entry.size;
          currentSize -= entry.size;
        }
      }

      await this.storeCacheEntries(finalEntries.reverse());

      console.log(`ImageCache: Cleanup completed - deleted ${deletedEntries} entries, freed ${freedBytes} bytes`);
      
      return { deletedEntries, freedBytes };
    } catch (error) {
      console.error('ImageCache: Cleanup failed:', error);
      return { deletedEntries: 0, freedBytes: 0 };
    }
  }

  /**
   * Clear entire cache
   */
  async clearCache(): Promise<void> {
    try {
      await FileSystem.deleteAsync(this.CACHE_DIR, { idempotent: true });
      await AsyncStorage.removeItem(this.CACHE_KEY);
      await this.ensureCacheDirectory();
      
      this.hits = 0;
      this.misses = 0;
      
      console.log('ImageCache: Cache cleared');
    } catch (error) {
      console.error('ImageCache: Failed to clear cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      const cacheEntries = await this.getCacheEntries();
      const totalSize = cacheEntries.reduce((sum, entry) => sum + entry.size, 0);
      
      const timestamps = cacheEntries
        .map(entry => new Date(entry.timestamp))
        .sort((a, b) => a.getTime() - b.getTime());

      const hitRate = this.hits + this.misses > 0 
        ? (this.hits / (this.hits + this.misses)) * 100 
        : 0;

      return {
        totalSize,
        entryCount: cacheEntries.length,
        hitRate: Math.round(hitRate * 100) / 100,
        oldestEntry: timestamps[0],
        newestEntry: timestamps[timestamps.length - 1],
      };
    } catch (error) {
      console.error('ImageCache: Failed to get stats:', error);
      return {
        totalSize: 0,
        entryCount: 0,
        hitRate: 0,
      };
    }
  }

  // Private methods

  private async ensureCacheDirectory(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.CACHE_DIR, { intermediates: true });
      }
    } catch (error) {
      console.error('ImageCache: Failed to create cache directory:', error);
    }
  }

  private async generateHash(input: string): Promise<string> {
    try {
      return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        input,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
    } catch (error) {
      console.error('ImageCache: Failed to generate hash:', error);
      // Fallback to simple hash
      return input.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 32);
    }
  }

  private async cacheImage(imageUri: string, hash: string): Promise<string> {
    const cachedUri = `${this.CACHE_DIR}${hash}.jpg`;
    
    try {
      // Copy image to cache directory
      await FileSystem.copyAsync({
        from: imageUri,
        to: cachedUri,
      });

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(cachedUri);
      const size = fileInfo.size || 0;

      // Create cache entry
      const cacheEntry: CacheEntry = {
        id: hash,
        originalUri: imageUri,
        cachedUri,
        timestamp: new Date(),
        size,
        hash,
      };

      // Update cache entries
      const cacheEntries = await this.getCacheEntries();
      const updatedEntries = [cacheEntry, ...cacheEntries.filter(e => e.hash !== hash)];
      await this.storeCacheEntries(updatedEntries);

      return cachedUri;
    } catch (error) {
      console.error('ImageCache: Failed to cache image:', error);
      throw error;
    }
  }

  private async getCacheEntry(hash: string): Promise<CacheEntry | null> {
    const cacheEntries = await this.getCacheEntries();
    return cacheEntries.find(entry => entry.hash === hash) || null;
  }

  private async getCacheEntries(): Promise<CacheEntry[]> {
    try {
      const stored = await AsyncStorage.getItem(this.CACHE_KEY);
      if (!stored) return [];
      
      const entries = JSON.parse(stored) as CacheEntry[];
      // Convert timestamp strings back to Date objects
      return entries.map(entry => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      }));
    } catch (error) {
      console.error('ImageCache: Failed to get cache entries:', error);
      return [];
    }
  }

  private async storeCacheEntries(entries: CacheEntry[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('ImageCache: Failed to store cache entries:', error);
      throw error;
    }
  }

  private async isValidCacheEntry(entry: CacheEntry): Promise<boolean> {
    try {
      // Check if cached file still exists
      const fileInfo = await FileSystem.getInfoAsync(entry.cachedUri);
      if (!fileInfo.exists) {
        return false;
      }

      // Check if entry is not too old
      const age = new Date().getTime() - new Date(entry.timestamp).getTime();
      return age <= this.MAX_CACHE_AGE;
    } catch (error) {
      return false;
    }
  }

  private async deleteCacheFile(cachedUri: string): Promise<void> {
    try {
      await FileSystem.deleteAsync(cachedUri, { idempotent: true });
    } catch (error) {
      console.error('ImageCache: Failed to delete cache file:', error);
    }
  }
}

export const imageCacheService = new ImageCacheService();