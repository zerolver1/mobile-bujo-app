import { OCRResult } from '../../types/BuJo';
import { gptVisionOCRService } from './GPTVisionOCRService';
import { mistralOCRService } from './MistralOCRService';
import { ocrSpaceService } from './OCRSpaceService';

/**
 * Smart OCR Service Orchestrator
 * Intelligently selects the best OCR service based on:
 * - Service availability and health
 * - Rate limiting status
 * - User subscription tier
 * - Cost preferences
 * - Previous success rates
 */

interface OCRStrategy {
  service: any;
  name: string;
  priority: number;
  costTier: 'premium' | 'standard' | 'free';
  averageAccuracy: number;
  averageResponseTime: number;
}

interface OCRMetrics {
  service: string;
  success: boolean;
  processingTime: number;
  accuracy?: number;
  entriesExtracted: number;
  errorType?: string;
  timestamp: Date;
}

interface SmartOCROptions {
  preferredService?: 'gpt-vision' | 'mistral' | 'ocr-space';
  maxCostTier?: 'premium' | 'standard' | 'free';
  prioritizeSpeed?: boolean;
  prioritizeAccuracy?: boolean;
  userSpeedPreference?: 'speed' | 'accuracy';
}

class SmartOCRService {
  private metrics: OCRMetrics[] = [];
  private readonly maxMetricsHistory = 100;
  
  private readonly strategies: OCRStrategy[] = [
    {
      service: gptVisionOCRService,
      name: 'GPT Vision',
      priority: 1,
      costTier: 'premium',
      averageAccuracy: 0.95,
      averageResponseTime: 8000
    },
    {
      service: mistralOCRService,
      name: 'Mistral OCR',
      priority: 2,
      costTier: 'standard', 
      averageAccuracy: 0.87,
      averageResponseTime: 5000
    },
    {
      service: ocrSpaceService,
      name: 'OCR.space',
      priority: 3,
      costTier: 'free',
      averageAccuracy: 0.82,
      averageResponseTime: 7000
    }
  ];

  /**
   * Process image with intelligent OCR service selection
   */
  async processImage(imageUri: string, options: SmartOCROptions = {}): Promise<OCRResult> {
    console.log('SmartOCR: Starting intelligent OCR processing...');
    
    // Get ranked strategies based on current conditions
    const rankedStrategies = await this.rankStrategies(options);
    
    let lastError: Error | null = null;
    
    // Try each strategy in order
    for (const strategy of rankedStrategies) {
      try {
        console.log(`SmartOCR: Trying ${strategy.name}...`);
        
        // Check if we can use this service
        if (!(await this.canUseService(strategy))) {
          console.log(`SmartOCR: ${strategy.name} not available, trying next...`);
          continue;
        }
        
        // Process with timing
        const startTime = performance.now();
        const result = await strategy.service.recognizeText(imageUri);
        const processingTime = performance.now() - startTime;
        
        // Record success metrics
        const metrics: OCRMetrics = {
          service: strategy.name.toLowerCase().replace(' ', '-'),
          success: true,
          processingTime,
          accuracy: result.confidence,
          entriesExtracted: result.parsedEntries?.length || 0,
          timestamp: new Date()
        };
        
        this.recordMetrics(metrics);
        
        console.log(`SmartOCR: ${strategy.name} succeeded in ${processingTime.toFixed(0)}ms`);
        console.log(`SmartOCR: Confidence: ${(result.confidence * 100).toFixed(1)}%, Entries: ${metrics.entriesExtracted}`);
        
        return result;
        
      } catch (error) {
        console.warn(`SmartOCR: ${strategy.name} failed:`, error);
        lastError = error as Error;
        
        // Record failure metrics
        const metrics: OCRMetrics = {
          service: strategy.name.toLowerCase().replace(' ', '-'),
          success: false,
          processingTime: 0,
          entriesExtracted: 0,
          errorType: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        };
        
        this.recordMetrics(metrics);
        
        // Continue to next service
        continue;
      }
    }
    
    // All services failed
    const errorMessage = `All OCR services failed. Last error: ${lastError?.message || 'Unknown error'}`;
    console.error('SmartOCR:', errorMessage);
    
    throw new Error(errorMessage);
  }

  /**
   * Rank OCR strategies based on current conditions
   */
  private async rankStrategies(options: SmartOCROptions): Promise<OCRStrategy[]> {
    let strategies = [...this.strategies];
    
    // Filter by cost tier preference
    if (options.maxCostTier) {
      const costOrder = ['free', 'standard', 'premium'];
      const maxCostIndex = costOrder.indexOf(options.maxCostTier);
      strategies = strategies.filter(s => 
        costOrder.indexOf(s.costTier) <= maxCostIndex
      );
    }
    
    // Apply user speed preference first
    if (options.userSpeedPreference === 'speed') {
      console.log('SmartOCR: User prefers speed - prioritizing faster services');
      // For speed preference: exclude GPT Vision (slowest), prioritize Mistral
      strategies = strategies.filter(s => s.name !== 'GPT Vision OCR');
      strategies.sort((a, b) => a.averageResponseTime - b.averageResponseTime);
      console.log('SmartOCR: Speed mode strategies:', strategies.map(s => s.name));
    } else if (options.userSpeedPreference === 'accuracy') {
      console.log('SmartOCR: User prefers accuracy - prioritizing accurate services');
      // For accuracy preference: prioritize GPT Vision first, then by accuracy
      strategies.sort((a, b) => {
        if (a.name === 'GPT Vision OCR') return -1;
        if (b.name === 'GPT Vision OCR') return 1;
        return b.averageAccuracy - a.averageAccuracy;
      });
      console.log('SmartOCR: Accuracy mode strategies:', strategies.map(s => s.name));
    }
    // Then apply other preferences as overrides
    else if (options.preferredService) {
      const preferredName = this.serviceNameMap[options.preferredService];
      strategies.sort((a, b) => {
        if (a.name === preferredName) return -1;
        if (b.name === preferredName) return 1;
        return a.priority - b.priority;
      });
    } else if (options.prioritizeSpeed) {
      // Sort by response time (faster first)
      strategies.sort((a, b) => a.averageResponseTime - b.averageResponseTime);
    } else if (options.prioritizeAccuracy) {
      // Sort by accuracy (higher first)
      strategies.sort((a, b) => b.averageAccuracy - a.averageAccuracy);
    } else {
      // Default: sort by priority and recent success rate
      const recentMetrics = this.getRecentMetrics(24); // Last 24 hours
      
      strategies.sort((a, b) => {
        const aMetrics = recentMetrics.filter(m => m.service === a.name.toLowerCase().replace(' ', '-'));
        const bMetrics = recentMetrics.filter(m => m.service === b.name.toLowerCase().replace(' ', '-'));
        
        const aSuccessRate = aMetrics.length > 0 
          ? aMetrics.filter(m => m.success).length / aMetrics.length
          : a.averageAccuracy;
          
        const bSuccessRate = bMetrics.length > 0
          ? bMetrics.filter(m => m.success).length / bMetrics.length  
          : b.averageAccuracy;
        
        // Higher success rate wins, then priority
        if (Math.abs(aSuccessRate - bSuccessRate) > 0.1) {
          return bSuccessRate - aSuccessRate;
        }
        return a.priority - b.priority;
      });
    }
    
    console.log('SmartOCR: Strategy ranking:', strategies.map(s => s.name));
    return strategies;
  }

  /**
   * Check if a service can be used based on availability and rate limits
   */
  private async canUseService(strategy: OCRStrategy): Promise<boolean> {
    try {
      // Check service availability
      if (!strategy.service.isAvailable || !strategy.service.isAvailable()) {
        return false;
      }
      
      // Check if service is initialized
      if (strategy.service.initialize) {
        try {
          await strategy.service.initialize();
        } catch (error) {
          console.warn(`SmartOCR: ${strategy.name} initialization failed:`, error);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.warn(`SmartOCR: ${strategy.name} availability check failed:`, error);
      return false;
    }
  }

  /**
   * Record OCR metrics for analysis
   */
  private recordMetrics(metrics: OCRMetrics): void {
    this.metrics.unshift(metrics);
    
    // Keep only recent metrics to prevent memory growth
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(0, this.maxMetricsHistory);
    }
  }

  /**
   * Get recent metrics for analysis
   */
  private getRecentMetrics(hoursBack: number): OCRMetrics[] {
    const cutoffTime = new Date(Date.now() - (hoursBack * 60 * 60 * 1000));
    return this.metrics.filter(m => m.timestamp >= cutoffTime);
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    totalProcessed: number;
    successRate: number;
    averageProcessingTime: number;
    serviceBreakdown: Record<string, {
      attempts: number;
      successes: number;
      successRate: number;
      averageTime: number;
      averageAccuracy: number;
    }>;
  } {
    const recentMetrics = this.getRecentMetrics(24);
    
    if (recentMetrics.length === 0) {
      return {
        totalProcessed: 0,
        successRate: 0,
        averageProcessingTime: 0,
        serviceBreakdown: {}
      };
    }
    
    const successfulMetrics = recentMetrics.filter(m => m.success);
    
    // Calculate service breakdown
    const serviceBreakdown: Record<string, any> = {};
    
    for (const service of ['gpt-vision', 'mistral-ocr', 'ocr-space']) {
      const serviceMetrics = recentMetrics.filter(m => m.service === service);
      const serviceSuccesses = serviceMetrics.filter(m => m.success);
      
      if (serviceMetrics.length > 0) {
        serviceBreakdown[service] = {
          attempts: serviceMetrics.length,
          successes: serviceSuccesses.length,
          successRate: serviceSuccesses.length / serviceMetrics.length,
          averageTime: serviceSuccesses.length > 0 
            ? serviceSuccesses.reduce((sum, m) => sum + m.processingTime, 0) / serviceSuccesses.length
            : 0,
          averageAccuracy: serviceSuccesses.length > 0
            ? serviceSuccesses.reduce((sum, m) => sum + (m.accuracy || 0), 0) / serviceSuccesses.length
            : 0
        };
      }
    }
    
    return {
      totalProcessed: recentMetrics.length,
      successRate: successfulMetrics.length / recentMetrics.length,
      averageProcessingTime: successfulMetrics.length > 0
        ? successfulMetrics.reduce((sum, m) => sum + m.processingTime, 0) / successfulMetrics.length
        : 0,
      serviceBreakdown
    };
  }

  /**
   * Get service health status
   */
  async getServiceHealth(): Promise<Record<string, {
    available: boolean;
    healthy: boolean;
    lastSuccess?: Date;
    recentSuccessRate: number;
  }>> {
    const recentMetrics = this.getRecentMetrics(1); // Last hour
    const health: Record<string, any> = {};
    
    for (const strategy of this.strategies) {
      const serviceName = strategy.name.toLowerCase().replace(' ', '-');
      const serviceMetrics = recentMetrics.filter(m => m.service === serviceName);
      const successfulMetrics = serviceMetrics.filter(m => m.success);
      
      const lastSuccessMetric = this.metrics.find(m => 
        m.service === serviceName && m.success
      );
      
      health[serviceName] = {
        available: await this.canUseService(strategy),
        healthy: serviceMetrics.length === 0 || 
                (successfulMetrics.length / serviceMetrics.length) > 0.5,
        lastSuccess: lastSuccessMetric?.timestamp,
        recentSuccessRate: serviceMetrics.length > 0 
          ? successfulMetrics.length / serviceMetrics.length 
          : 0
      };
    }
    
    return health;
  }

  /**
   * Map service keys to display names
   */
  private readonly serviceNameMap: Record<string, string> = {
    'gpt-vision': 'GPT Vision',
    'mistral': 'Mistral OCR',
    'ocr-space': 'OCR.space'
  };

  /**
   * Initialize all OCR services
   */
  async initialize(): Promise<void> {
    console.log('SmartOCR: Initializing all OCR services...');
    
    const initPromises = this.strategies.map(async (strategy) => {
      try {
        if (strategy.service.initialize) {
          await strategy.service.initialize();
          console.log(`SmartOCR: ${strategy.name} initialized successfully`);
        }
      } catch (error) {
        console.warn(`SmartOCR: ${strategy.name} initialization failed:`, error);
      }
    });
    
    await Promise.allSettled(initPromises);
    console.log('SmartOCR: Service initialization completed');
  }

  /**
   * Cleanup all OCR services
   */
  async cleanup(): Promise<void> {
    console.log('SmartOCR: Cleaning up all OCR services...');
    
    const cleanupPromises = this.strategies.map(async (strategy) => {
      try {
        if (strategy.service.cleanup) {
          await strategy.service.cleanup();
        }
      } catch (error) {
        console.warn(`SmartOCR: ${strategy.name} cleanup failed:`, error);
      }
    });
    
    await Promise.allSettled(cleanupPromises);
    console.log('SmartOCR: Cleanup completed');
  }
}

// Export singleton instance
export const smartOCRService = new SmartOCRService();