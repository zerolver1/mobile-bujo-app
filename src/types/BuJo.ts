// Core Bullet Journal Types

export interface BuJoEntry {
  id: string;
  type: 'task' | 'event' | 'note';
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
}

export interface BuJoCollection {
  id: string;
  type: 'daily' | 'monthly' | 'future' | 'custom';
  date: string; // YYYY-MM-DD
  title?: string;
  entries: BuJoEntry[];
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
  parsedEntries?: any[]; // Structured entries from Mistral OCR
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