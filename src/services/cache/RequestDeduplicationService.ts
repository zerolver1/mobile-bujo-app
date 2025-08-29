import * as Crypto from 'expo-crypto';

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: Date;
  requestKey: string;
}

interface RequestCache<T> {
  result: T;
  timestamp: Date;
  expiresAt: Date;
}

class RequestDeduplicationService {
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private resultCache = new Map<string, RequestCache<any>>();
  
  // Default cache TTL (5 minutes)
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000;
  
  // Request timeout (30 seconds)
  private readonly REQUEST_TIMEOUT = 30 * 1000;

  /**
   * Deduplicate requests with same parameters
   */
  async deduplicateRequest<T>(
    requestKey: string,
    requestFn: () => Promise<T>,
    cacheTTL: number = this.DEFAULT_CACHE_TTL
  ): Promise<T> {
    // Check cache first
    const cachedResult = this.getCachedResult<T>(requestKey);
    if (cachedResult) {
      console.log(`RequestDeduplication: Cache hit for ${requestKey}`);
      return cachedResult;
    }

    // Check if request is already in flight
    const pendingRequest = this.pendingRequests.get(requestKey);
    if (pendingRequest) {
      console.log(`RequestDeduplication: Deduplicating request ${requestKey}`);
      return await pendingRequest.promise;
    }

    // Create new request with timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), this.REQUEST_TIMEOUT);
    });

    const actualRequest = requestFn();
    const requestWithTimeout = Promise.race([actualRequest, timeoutPromise]);

    // Store pending request
    const pendingRequestData: PendingRequest<T> = {
      promise: requestWithTimeout,
      timestamp: new Date(),
      requestKey,
    };
    
    this.pendingRequests.set(requestKey, pendingRequestData);

    try {
      const result = await requestWithTimeout;
      
      // Cache the result
      this.cacheResult(requestKey, result, cacheTTL);
      
      console.log(`RequestDeduplication: Request completed ${requestKey}`);
      return result;
    } catch (error) {
      console.error(`RequestDeduplication: Request failed ${requestKey}:`, error);
      throw error;
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * Generate request key for OCR operations
   */
  async generateOCRRequestKey(
    imageUri: string, 
    ocrProvider: string,
    options?: any
  ): Promise<string> {
    try {
      // Get image file info for size/modification date
      const imageKey = `${imageUri}_${ocrProvider}`;
      const optionsKey = options ? JSON.stringify(options) : '';
      const combined = `${imageKey}_${optionsKey}`;
      
      return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        combined,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
    } catch (error) {
      console.error('RequestDeduplication: Failed to generate OCR key:', error);
      // Fallback to simple key
      return `ocr_${ocrProvider}_${imageUri.split('/').pop() || 'unknown'}`;
    }
  }

  /**
   * Generate request key for any API call
   */
  async generateAPIRequestKey(
    endpoint: string,
    method: string,
    params?: any,
    body?: any
  ): Promise<string> {
    try {
      const keyData = {
        endpoint,
        method,
        params: params ? JSON.stringify(params) : null,
        body: body ? JSON.stringify(body) : null,
      };
      
      const keyString = JSON.stringify(keyData);
      
      return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        keyString,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
    } catch (error) {
      console.error('RequestDeduplication: Failed to generate API key:', error);
      // Fallback to simple key
      return `api_${method}_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
    }
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = new Date();
    let clearedCount = 0;
    
    for (const [key, cache] of this.resultCache.entries()) {
      if (cache.expiresAt < now) {
        this.resultCache.delete(key);
        clearedCount++;
      }
    }
    
    if (clearedCount > 0) {
      console.log(`RequestDeduplication: Cleared ${clearedCount} expired cache entries`);
    }
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.resultCache.clear();
    console.log('RequestDeduplication: All cache cleared');
  }

  /**
   * Cancel pending requests (useful for cleanup)
   */
  cancelPendingRequests(): void {
    const canceledCount = this.pendingRequests.size;
    this.pendingRequests.clear();
    
    if (canceledCount > 0) {
      console.log(`RequestDeduplication: Canceled ${canceledCount} pending requests`);
    }
  }

  /**
   * Get cache and request statistics
   */
  getStats(): {
    cachedResults: number;
    pendingRequests: number;
    oldestCacheEntry?: Date;
    newestCacheEntry?: Date;
  } {
    const cacheTimestamps = Array.from(this.resultCache.values())
      .map(cache => cache.timestamp)
      .sort((a, b) => a.getTime() - b.getTime());

    return {
      cachedResults: this.resultCache.size,
      pendingRequests: this.pendingRequests.size,
      oldestCacheEntry: cacheTimestamps[0],
      newestCacheEntry: cacheTimestamps[cacheTimestamps.length - 1],
    };
  }

  // Private methods

  private getCachedResult<T>(requestKey: string): T | null {
    const cached = this.resultCache.get(requestKey);
    if (!cached) return null;

    // Check if cache is expired
    if (cached.expiresAt < new Date()) {
      this.resultCache.delete(requestKey);
      return null;
    }

    return cached.result;
  }

  private cacheResult<T>(requestKey: string, result: T, cacheTTL: number): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + cacheTTL);
    
    this.resultCache.set(requestKey, {
      result,
      timestamp: now,
      expiresAt,
    });
  }
}

export const requestDeduplicationService = new RequestDeduplicationService();

// Auto-cleanup expired cache every 5 minutes
setInterval(() => {
  requestDeduplicationService.clearExpiredCache();
}, 5 * 60 * 1000);