// Subscription and Monetization Types

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: 'monthly' | 'yearly';
  monthlyScans: number; // -1 for unlimited
  features: string[];
}

export interface UsageStats {
  monthlyScans: number;
  totalScans: number;
  lastScanDate?: Date;
  subscriptionTier: 'free' | 'premium' | 'ultimate';
}

export interface PaywallContext {
  trigger: 'scan_limit_reached' | 'premium_feature' | 'onboarding';
  feature?: string;
  remainingScans?: number;
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    period: 'monthly',
    monthlyScans: 5,
    features: ['basic_ocr', 'reminders_sync', 'daily_log']
  },
  PREMIUM: {
    id: 'premium_monthly_4_99',
    name: 'Premium',
    price: 4.99,
    currency: 'USD', 
    period: 'monthly',
    monthlyScans: 100,
    features: ['handwriting_recognition', 'calendar_sync', 'custom_themes', 'monthly_future_logs']
  },
  ULTIMATE: {
    id: 'ultimate_monthly_9_99',
    name: 'Ultimate',
    price: 9.99,
    currency: 'USD',
    period: 'monthly', 
    monthlyScans: -1, // unlimited
    features: ['unlimited_scans', 'ai_suggestions', 'team_collaboration', 'priority_support', 'advanced_export']
  }
};