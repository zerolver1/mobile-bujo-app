/**
 * Client-side rate limiter to prevent API abuse and improve user experience
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 10,
    private windowMs: number = 60000 // 1 minute
  ) {}

  /**
   * Check if a request is allowed under the rate limit
   */
  isAllowed(key: string = 'default'): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get existing requests for this key
    let requestTimes = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    requestTimes = requestTimes.filter(time => time > windowStart);
    
    // Check if we're under the limit
    if (requestTimes.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request and update map
    requestTimes.push(now);
    this.requests.set(key, requestTimes);
    
    return true;
  }

  /**
   * Get time until next request is allowed
   */
  getTimeUntilReset(key: string = 'default'): number {
    const requestTimes = this.requests.get(key) || [];
    if (requestTimes.length < this.maxRequests) {
      return 0;
    }
    
    const oldestRequest = Math.min(...requestTimes);
    const timeUntilReset = (oldestRequest + this.windowMs) - Date.now();
    
    return Math.max(0, timeUntilReset);
  }

  /**
   * Get remaining requests in current window
   */
  getRemainingRequests(key: string = 'default'): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const requestTimes = this.requests.get(key) || [];
    const validRequests = requestTimes.filter(time => time > windowStart);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }

  /**
   * Clear all rate limit data for a key
   */
  reset(key: string = 'default'): void {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limit data
   */
  resetAll(): void {
    this.requests.clear();
  }

  /**
   * Get current status for a key
   */
  getStatus(key: string = 'default'): {
    allowed: boolean;
    remaining: number;
    timeUntilReset: number;
    requestsInWindow: number;
  } {
    return {
      allowed: this.isAllowed(key),
      remaining: this.getRemainingRequests(key),
      timeUntilReset: this.getTimeUntilReset(key),
      requestsInWindow: this.maxRequests - this.getRemainingRequests(key)
    };
  }
}

// Singleton instances for different services
export const ocrRateLimiter = new RateLimiter(5, 60000); // 5 requests per minute
export const apiRateLimiter = new RateLimiter(20, 60000); // 20 requests per minute