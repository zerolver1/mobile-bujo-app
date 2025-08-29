// Core Bullet Journal Types

export interface BuJoEntry {
  id: string;
  type: 'task' | 'event' | 'note' | 'inspiration' | 'research' | 'memory' | 'custom';
  content: string;
  status: 'incomplete' | 'complete' | 'migrated' | 'scheduled' | 'cancelled';
  priority: 'none' | 'low' | 'medium' | 'high';
  
  // Temporal data
  createdAt: Date;
  dueDate?: Date;
  scheduledDate?: Date;
  
  // Context & organization
  tags: string[];
  contexts: string[];
  collection: 'daily' | 'monthly' | 'future' | 'custom';
  collectionDate: string; // YYYY-MM-DD format
  
  // Source tracking
  sourceImage?: string; // FileSystem URI
  ocrConfidence?: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
  
  // Apple integration
  appleReminderId?: string;
  appleEventId?: string;
  lastSyncAt?: Date;
  
  // Custom signifier support
  customSignifierId?: string; // Links to CustomSignifier if type is 'custom'
  
  // Memory/gratitude specific fields
  mood?: 'excellent' | 'good' | 'neutral' | 'poor';
  gratitude?: string[];
  photoUri?: string;
}

export interface BuJoCollection {
  id: string;
  type: 'daily' | 'monthly' | 'future' | 'custom';
  date: string; // YYYY-MM-DD
  title?: string;
  name?: string; // For custom collections
  description?: string; // For custom collections
  color?: string; // For custom collections
  entries: BuJoEntry[];
  entryIds?: string[]; // Manual entry assignments
  smartMatch?: boolean; // Enable/disable automatic matching
  createdAt: Date;
  modifiedAt: Date;
}

export interface PageScan {
  id: string;
  imageUri: string;
  hash: string; // SHA-256 for deduplication
  ocrText: string;
  processedAt: Date;
  confidence: number;
  extractedEntries: string[]; // Entry IDs
}

export interface OCRResult {
  text: string;
  confidence: number;
  blocks: OCRBlock[];
  parsedEntries?: BuJoEntry[]; // Structured entries from Mistral OCR
}

export interface OCRBlock {
  text: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  lines: OCRLine[];
}

export interface OCRLine {
  text: string;
  boundingBox: { x: number; y: number; width: number; height: number };
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  bulletStyle: 'classic' | 'modern' | 'handwritten';
  paperTexture: 'dot' | 'grid' | 'lined' | 'blank';
  autoSync: boolean;
  syncReminders: boolean;
  syncCalendar: boolean;
  hapticFeedback: boolean;
  dailyNotifications: boolean;
}

// Custom Signifier System
export interface CustomSignifier {
  id: string;
  symbol: string; // Single character or emoji
  label: string;
  description: string;
  color: string; // Hex color code
  createdAt: Date;
  modifiedAt: Date;
}

// Quarterly Planning
export interface QuarterlyPlan {
  id: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  goals: QuarterlyGoal[];
  entries: BuJoEntry[];
  reflection?: string;
  createdAt: Date;
  modifiedAt: Date;
}

export interface QuarterlyGoal {
  id: string;
  title: string;
  description?: string;
  progress: number; // 0-100 percentage
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  milestones: string[];
  completedMilestones: string[];
  targetDate?: Date;
}

// Navigation Types
export interface EntryReviewParams {
  imageUri: string;
  ocrResult: OCRResult;
  parsedEntries: BuJoEntry[];
}