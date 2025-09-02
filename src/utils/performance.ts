// Performance Monitoring and Optimization Utilities
// Provides tools to monitor and optimize React Native performance

import { Alert } from 'react-native';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private isEnabled: boolean = __DEV__; // Only enable in development

  // Start timing a performance metric
  startTiming(name: string): void {
    if (!this.isEnabled) return;

    this.metrics.set(name, {
      name,
      startTime: Date.now()
    });
  }

  // End timing and calculate duration
  endTiming(name: string): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric '${name}' was not started`);
      return null;
    }

    const endTime = Date.now();
    const duration = endTime - metric.startTime;

    this.metrics.set(name, {
      ...metric,
      endTime,
      duration
    });

    // Log slow operations
    if (duration > 100) {
      console.warn(`⚠️ Slow operation detected: ${name} took ${duration}ms`);
    } else {
      console.log(`⚡ Performance: ${name} completed in ${duration}ms`);
    }

    return duration;
  }

  // Get performance summary
  getSummary(): PerformanceMetric[] {
    if (!this.isEnabled) return [];

    return Array.from(this.metrics.values()).filter(m => m.duration !== undefined);
  }

  // Clear all metrics
  clear(): void {
    this.metrics.clear();
  }

  // Show performance report
  showReport(): void {
    if (!this.isEnabled) return;

    const summary = this.getSummary();
    if (summary.length === 0) {
      Alert.alert('Performance Report', 'No performance data available');
      return;
    }

    const report = summary
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .map(m => `${m.name}: ${m.duration}ms`)
      .join('\n');

    Alert.alert('Performance Report', report);
  }

  // Memory usage monitoring
  logMemoryUsage(label: string = 'Memory Check'): void {
    if (!this.isEnabled) return;

    // Note: React Native doesn't have direct memory APIs
    // This is a placeholder for potential native module integration
    console.log(`📊 ${label}: Memory monitoring not available in React Native`);
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Higher-order function to measure component render time
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: any[]) => {
    performanceMonitor.startTiming(name);
    const result = fn(...args);
    performanceMonitor.endTiming(name);
    return result;
  }) as T;
}

// Debounce utility for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// Throttle utility for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Batch updates utility
export class BatchUpdater<T> {
  private updates: T[] = [];
  private timeout: NodeJS.Timeout | null = null;
  private batchSize: number;
  private delay: number;
  private processor: (batch: T[]) => void;

  constructor(
    processor: (batch: T[]) => void,
    batchSize: number = 10,
    delay: number = 100
  ) {
    this.processor = processor;
    this.batchSize = batchSize;
    this.delay = delay;
  }

  add(update: T): void {
    this.updates.push(update);

    // Process immediately if batch is full
    if (this.updates.length >= this.batchSize) {
      this.flush();
      return;
    }

    // Schedule processing if not already scheduled
    if (!this.timeout) {
      this.timeout = setTimeout(() => {
        this.flush();
      }, this.delay);
    }
  }

  flush(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    if (this.updates.length > 0) {
      const batch = [...this.updates];
      this.updates = [];
      this.processor(batch);
    }
  }
}

// FlatList optimization helpers
export const flatListOptimizations = {
  // Standard performance props
  getItemLayout: (data: any, index: number) => ({
    length: 80, // Estimated item height
    offset: 80 * index,
    index,
  }),

  // Optimized rendering props
  maxToRenderPerBatch: 10,
  windowSize: 10,
  initialNumToRender: 10,
  removeClippedSubviews: true,
  updateCellsBatchingPeriod: 100,

  // Key extractor optimization
  keyExtractor: (item: any, index: number) => 
    item.id?.toString() || index.toString(),

  // Render optimization
  getItemKey: (item: any) => item.id || item.key,
};

// React.memo comparison functions
export const shallowEqual = (prevProps: any, nextProps: any): boolean => {
  const keys1 = Object.keys(prevProps);
  const keys2 = Object.keys(nextProps);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (let key of keys1) {
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }

  return true;
};

// Deep comparison for complex objects
export const deepEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return false;
  
  if (typeof obj1 !== typeof obj2) return false;
  
  if (typeof obj1 !== 'object') return obj1 === obj2;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (let key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
};

// Bundle size analyzer (for debugging)
export const analyzeBundleSize = () => {
  if (!__DEV__) return;
  
  console.log('📦 Bundle Analysis:');
  console.log('- React Native built-in modules loaded');
  console.log('- Custom components and utilities loaded');
  console.log('- Third-party dependencies loaded');
  console.log('Use React Native Bundle Visualizer for detailed analysis');
};

export default performanceMonitor;