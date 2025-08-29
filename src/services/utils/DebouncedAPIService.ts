interface DebouncedCall {
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: Date;
}

class DebouncedAPIService {
  private debouncedCalls = new Map<string, {
    timeoutId: NodeJS.Timeout;
    calls: DebouncedCall[];
    lastCallTime: Date;
  }>();

  /**
   * Debounce API calls to prevent excessive requests
   */
  debounceAPICall<T>(
    key: string,
    apiCall: () => Promise<T>,
    delay: number = 300
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const existing = this.debouncedCalls.get(key);
      
      // Clear existing timeout if it exists
      if (existing) {
        clearTimeout(existing.timeoutId);
        // Add this call to the queue
        existing.calls.push({ resolve, reject, timestamp: new Date() });
      } else {
        // Create new debounced call group
        this.debouncedCalls.set(key, {
          timeoutId: setTimeout(() => {}, 0), // Will be replaced immediately
          calls: [{ resolve, reject, timestamp: new Date() }],
          lastCallTime: new Date(),
        });
      }

      // Set new timeout
      const callGroup = this.debouncedCalls.get(key)!;
      clearTimeout(callGroup.timeoutId);
      
      callGroup.timeoutId = setTimeout(async () => {
        const { calls } = callGroup;
        this.debouncedCalls.delete(key);

        try {
          console.log(`DebouncedAPI: Executing ${calls.length} batched calls for ${key}`);
          const result = await apiCall();
          
          // Resolve all pending calls with the same result
          calls.forEach(call => call.resolve(result));
        } catch (error) {
          console.error(`DebouncedAPI: Failed for ${key}:`, error);
          // Reject all pending calls
          calls.forEach(call => call.reject(error));
        }
      }, delay);

      callGroup.lastCallTime = new Date();
    });
  }

  /**
   * Debounce search queries
   */
  debounceSearch<T>(
    query: string,
    searchFunction: (query: string) => Promise<T>,
    delay: number = 500
  ): Promise<T> {
    const searchKey = `search_${query.toLowerCase().trim()}`;
    return this.debounceAPICall(
      searchKey,
      () => searchFunction(query),
      delay
    );
  }

  /**
   * Debounce auto-save operations
   */
  debounceAutoSave<T>(
    entityId: string,
    saveFunction: () => Promise<T>,
    delay: number = 1000
  ): Promise<T> {
    const saveKey = `autosave_${entityId}`;
    return this.debounceAPICall(
      saveKey,
      saveFunction,
      delay
    );
  }

  /**
   * Debounce validation calls
   */
  debounceValidation<T>(
    fieldName: string,
    value: string,
    validationFunction: (value: string) => Promise<T>,
    delay: number = 800
  ): Promise<T> {
    const validationKey = `validation_${fieldName}_${value}`;
    return this.debounceAPICall(
      validationKey,
      () => validationFunction(value),
      delay
    );
  }

  /**
   * Cancel all pending debounced calls
   */
  cancelAll(): void {
    let canceledCount = 0;
    
    for (const [key, callGroup] of this.debouncedCalls.entries()) {
      clearTimeout(callGroup.timeoutId);
      
      // Reject all pending calls
      const cancelError = new Error('Debounced call canceled');
      callGroup.calls.forEach(call => call.reject(cancelError));
      
      canceledCount += callGroup.calls.length;
    }

    this.debouncedCalls.clear();
    
    if (canceledCount > 0) {
      console.log(`DebouncedAPI: Canceled ${canceledCount} debounced calls`);
    }
  }

  /**
   * Cancel specific debounced calls by key prefix
   */
  cancelByPrefix(prefix: string): void {
    let canceledCount = 0;
    const keysToDelete: string[] = [];
    
    for (const [key, callGroup] of this.debouncedCalls.entries()) {
      if (key.startsWith(prefix)) {
        clearTimeout(callGroup.timeoutId);
        
        // Reject all pending calls
        const cancelError = new Error(`Debounced call canceled for prefix: ${prefix}`);
        callGroup.calls.forEach(call => call.reject(cancelError));
        
        canceledCount += callGroup.calls.length;
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.debouncedCalls.delete(key));
    
    if (canceledCount > 0) {
      console.log(`DebouncedAPI: Canceled ${canceledCount} debounced calls with prefix ${prefix}`);
    }
  }

  /**
   * Get statistics about debounced calls
   */
  getStats(): {
    pendingGroups: number;
    totalPendingCalls: number;
    oldestPendingCall?: Date;
    averageCallsPerGroup: number;
  } {
    const groups = Array.from(this.debouncedCalls.values());
    const totalCalls = groups.reduce((sum, group) => sum + group.calls.length, 0);
    
    const allCallTimestamps = groups
      .flatMap(group => group.calls.map(call => call.timestamp))
      .sort((a, b) => a.getTime() - b.getTime());

    return {
      pendingGroups: groups.length,
      totalPendingCalls: totalCalls,
      oldestPendingCall: allCallTimestamps[0],
      averageCallsPerGroup: groups.length > 0 ? totalCalls / groups.length : 0,
    };
  }

  /**
   * Flush a specific debounced call immediately
   */
  async flushCall(key: string): Promise<void> {
    const callGroup = this.debouncedCalls.get(key);
    if (!callGroup) return;

    // Clear the timeout and remove from map
    clearTimeout(callGroup.timeoutId);
    this.debouncedCalls.delete(key);

    console.log(`DebouncedAPI: Flushing ${callGroup.calls.length} calls for ${key}`);

    // Note: We can't execute the API call here since we don't have access to it
    // This method is mainly for cleanup - the calls will be rejected
    const flushError = new Error('Debounced call manually flushed');
    callGroup.calls.forEach(call => call.reject(flushError));
  }
}

export const debouncedAPIService = new DebouncedAPIService();

// Cleanup any remaining calls when app is backgrounded or closed
if (typeof global !== 'undefined') {
  // Note: In a real app, you'd hook into app state changes
  // For now, this is just a cleanup mechanism
  const cleanup = () => {
    debouncedAPIService.cancelAll();
  };

  // Cleanup on unload (if supported)
  if (typeof process !== 'undefined' && process.on) {
    process.on('exit', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
  }
}