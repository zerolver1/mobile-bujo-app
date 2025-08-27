// Simplified RevenueCat service for initial testing
export class RevenueCatService {
  private initialized = false;

  async initialize(userId?: string): Promise<void> {
    console.log('RevenueCat service initialized (demo mode)');
    this.initialized = true;
  }

  async getCustomerInfo(): Promise<any> {
    return {
      entitlements: {
        active: {}
      }
    };
  }

  getSubscriptionTier(customerInfo: any): 'free' | 'premium' | 'ultimate' {
    return 'free';
  }

  hasEntitlement(customerInfo: any, entitlementId: string): boolean {
    return false;
  }
}

export const revenueCatService = new RevenueCatService();