import { create } from 'zustand';
// Temporarily disable RevenueCat types for demo
// import { CustomerInfo, PurchasesOffering } from 'react-native-purchases';
type CustomerInfo = any;
type PurchasesOffering = any;

// Temporarily use simple service for demo
// import { revenueCatService } from '../services/subscription/RevenueCatService';
import { revenueCatService } from '../services/subscription/RevenueCatService-simple';
import { UsageStats, PaywallContext } from '../types/Subscription';

interface SubscriptionState {
  // Customer info
  customerInfo: CustomerInfo | null;
  isLoaded: boolean;
  
  // Offerings
  currentOffering: PurchasesOffering | null;
  
  // Usage tracking
  usageStats: UsageStats;
  
  // Paywall state
  showPaywall: boolean;
  paywallContext: PaywallContext | null;
  
  // Actions
  initialize: (userId?: string) => Promise<void>;
  loadOfferings: () => Promise<void>;
  purchasePackage: (packageIdentifier: string) => Promise<void>;
  restorePurchases: () => Promise<void>;
  
  // Usage management
  canPerformScan: () => boolean;
  trackScan: () => void;
  resetMonthlyUsage: () => void;
  
  // Paywall management
  triggerPaywall: (context: PaywallContext) => void;
  dismissPaywall: () => void;
  
  // Getters
  getSubscriptionTier: () => 'free' | 'premium' | 'ultimate';
  hasFeature: (feature: string) => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  // Initial state
  customerInfo: null,
  isLoaded: false,
  currentOffering: null,
  usageStats: {
    monthlyScans: 0,
    totalScans: 0,
    subscriptionTier: 'free',
  },
  showPaywall: false,
  paywallContext: null,
  
  // Initialize RevenueCat
  initialize: async (userId) => {
    try {
      await revenueCatService.initialize(userId);
      const customerInfo = await revenueCatService.getCustomerInfo();
      
      set({
        customerInfo,
        isLoaded: true,
        usageStats: {
          ...get().usageStats,
          subscriptionTier: revenueCatService.getSubscriptionTier(customerInfo),
        },
      });
    } catch (error) {
      console.error('Failed to initialize subscription store:', error);
      set({ isLoaded: true });
    }
  },
  
  // Load available offerings
  loadOfferings: async () => {
    try {
      const offering = await revenueCatService.getCurrentOffering();
      set({ currentOffering: offering });
    } catch (error) {
      console.error('Failed to load offerings:', error);
    }
  },
  
  // Purchase a package
  purchasePackage: async (packageIdentifier) => {
    try {
      const { currentOffering } = get();
      if (!currentOffering) throw new Error('No offering available');
      
      const package_ = currentOffering.availablePackages.find(
        pkg => pkg.identifier === packageIdentifier
      );
      
      if (!package_) throw new Error('Package not found');
      
      const customerInfo = await revenueCatService.purchasePackage(package_);
      
      set({
        customerInfo,
        showPaywall: false,
        paywallContext: null,
        usageStats: {
          ...get().usageStats,
          subscriptionTier: revenueCatService.getSubscriptionTier(customerInfo),
        },
      });
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  },
  
  // Restore purchases
  restorePurchases: async () => {
    try {
      const customerInfo = await revenueCatService.restorePurchases();
      
      set({
        customerInfo,
        usageStats: {
          ...get().usageStats,
          subscriptionTier: revenueCatService.getSubscriptionTier(customerInfo),
        },
      });
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  },
  
  // Check if user can perform a scan
  canPerformScan: () => {
    const { usageStats } = get();
    const tier = usageStats.subscriptionTier;
    
    if (tier === 'ultimate') return true;
    if (tier === 'premium') return usageStats.monthlyScans < 100;
    if (tier === 'free') return usageStats.monthlyScans < 5;
    
    return false;
  },
  
  // Track a scan
  trackScan: () => {
    const state = get();
    
    if (!state.canPerformScan()) {
      state.triggerPaywall({
        trigger: 'scan_limit_reached',
        remainingScans: 0,
      });
      return;
    }
    
    set({
      usageStats: {
        ...state.usageStats,
        monthlyScans: state.usageStats.monthlyScans + 1,
        totalScans: state.usageStats.totalScans + 1,
        lastScanDate: new Date(),
      },
    });
  },
  
  // Reset monthly usage (called at start of new month)
  resetMonthlyUsage: () => {
    set({
      usageStats: {
        ...get().usageStats,
        monthlyScans: 0,
      },
    });
  },
  
  // Trigger paywall
  triggerPaywall: (context) => {
    set({
      showPaywall: true,
      paywallContext: context,
    });
  },
  
  // Dismiss paywall
  dismissPaywall: () => {
    set({
      showPaywall: false,
      paywallContext: null,
    });
  },
  
  // Get current subscription tier
  getSubscriptionTier: () => {
    const { customerInfo } = get();
    if (!customerInfo) return 'free';
    return revenueCatService.getSubscriptionTier(customerInfo);
  },
  
  // Check if user has specific feature
  hasFeature: (feature) => {
    const tier = get().getSubscriptionTier();
    
    const tierFeatures = {
      free: ['basic_ocr', 'reminders_sync', 'daily_log'],
      premium: [
        'basic_ocr', 'reminders_sync', 'daily_log',
        'handwriting_recognition', 'calendar_sync', 'custom_themes', 'monthly_future_logs'
      ],
      ultimate: [
        'basic_ocr', 'reminders_sync', 'daily_log',
        'handwriting_recognition', 'calendar_sync', 'custom_themes', 'monthly_future_logs',
        'unlimited_scans', 'ai_suggestions', 'team_collaboration', 'priority_support', 'advanced_export'
      ]
    };
    
    return tierFeatures[tier].includes(feature);
  },
}));