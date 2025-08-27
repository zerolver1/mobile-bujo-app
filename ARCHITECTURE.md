# Bullet Journal App - Technical Architecture

## System Overview

A native iOS app that bridges analog bullet journaling with digital productivity through computer vision, machine learning, and deep Apple ecosystem integration.

### Core Value Proposition
- **Hybrid Workflow**: Maintain physical journaling while gaining digital benefits
- **Seamless Integration**: Auto-sync with Apple Reminders, Calendar, and Notes
- **Intelligent OCR**: Advanced handwriting and symbol recognition
- **Privacy-First**: On-device processing with optional iCloud sync

## Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                  React Native (Expo SDK 53)             │
├─────────────────────────────────────────────────────────┤
│  Authentication  │  Monetization   │    Analytics        │
│     Clerk        │   RevenueCat    │      Sentry         │
├─────────────────────────────────────────────────────────┤
│    Vision/OCR    │  Local Storage  │   Apple Integration │
│    ML Kit        │   AsyncStorage  │     EventKit        │
│                  │  Expo FileSystem│   Share Extension   │
├─────────────────────────────────────────────────────────┤
│              iOS Native Modules Bridge                   │
├─────────────────────────────────────────────────────────┤
│    Build & CI/CD     │         Sync & Cloud             │
│     EAS Build        │        CloudKit/iCloud           │
│   GitHub Actions     │                                  │
└─────────────────────────────────────────────────────────┘
```

### Development Stack
- **Framework**: Expo SDK 53 + React Native
- **Language**: TypeScript
- **State Management**: Zustand
- **Navigation**: React Navigation 6
- **UI/Animation**: React Native Reanimated 3 + Lottie
- **Build System**: EAS Build
- **Testing**: Jest + React Native Testing Library

## System Architecture

### High-Level Flow
```
Physical Journal → Photo Capture → OCR Processing → BuJo Parser 
→ User Confirmation → Apple Apps Sync → Local Storage → Analytics
```

### Component Architecture

#### 1. Photo Capture Pipeline
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Expo Camera    │───▶│ Image Processor │───▶│   ML Kit OCR    │
│                 │    │ (Enhancement)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   File Storage  │    │ Perspective     │    │ Text Confidence │
│   (FileSystem)  │    │   Correction    │    │    Scoring      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### 2. BuJo Parser Engine
```
Raw OCR Text
     │
     ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Line Splitting  │───▶│ Bullet Pattern  │───▶│ Context Extract │
│   & Cleaning    │    │   Matching      │    │  (@tags #ctx)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
     │                       │                       │
     ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Date Detection  │    │ Priority/Status │    │ Structured      │
│ (NSDataDetector)│    │   Analysis      │    │ Entry Objects   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### 3. Apple Ecosystem Integration
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   BuJo Entry    │───▶│    Mapper       │───▶│  Apple API      │
│   (Task/Event)  │    │   Component     │    │   (EventKit)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Local Storage   │    │ Conflict        │    │   EKReminder/   │
│   Entry ID      │    │  Resolution     │    │    EKEvent      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Data Models

### Core Entities

```typescript
// Primary data models
interface BuJoEntry {
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

interface BuJoCollection {
  id: string;
  type: 'daily' | 'monthly' | 'future' | 'custom';
  date: string; // YYYY-MM-DD
  title?: string;
  entries: BuJoEntry[];
  createdAt: Date;
  modifiedAt: Date;
}

interface PageScan {
  id: string;
  imageUri: string;
  hash: string; // SHA-256 for deduplication
  ocrText: string;
  processedAt: Date;
  confidence: number;
  extractedEntries: string[]; // Entry IDs
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  bulletStyle: 'classic' | 'modern' | 'handwritten';
  paperTexture: 'dot' | 'grid' | 'lined' | 'blank';
  autoSync: boolean;
  syncReminders: boolean;
  syncCalendar: boolean;
  hapticFeedback: boolean;
  dailyNotifications: boolean;
}
```

### AsyncStorage Schema

```typescript
const StorageKeys = {
  ENTRIES: '@bujo:entries',
  COLLECTIONS: '@bujo:collections',
  SCANNED_PAGES: '@bujo:scans',
  USER_PREFERENCES: '@bujo:preferences',
  SYNC_QUEUE: '@bujo:sync_queue',
  APPLE_MAPPING: '@bujo:apple_mapping',
  USAGE_STATS: '@bujo:usage'
} as const;

// Storage structure
interface StorageSchema {
  [StorageKeys.ENTRIES]: BuJoEntry[];
  [StorageKeys.COLLECTIONS]: BuJoCollection[];
  [StorageKeys.SCANNED_PAGES]: PageScan[];
  [StorageKeys.USER_PREFERENCES]: UserPreferences;
  [StorageKeys.SYNC_QUEUE]: SyncOperation[];
  [StorageKeys.APPLE_MAPPING]: AppleMapping[];
  [StorageKeys.USAGE_STATS]: UsageStats;
}
```

## OCR & Vision Processing

### ML Kit Integration

```typescript
// OCR Service Implementation
import TextRecognition from '@react-native-ml-kit/text-recognition';

class OCRService {
  async processImage(imageUri: string): Promise<OCRResult> {
    try {
      const result = await TextRecognition.recognize(imageUri);
      
      return {
        text: result.text,
        blocks: result.blocks.map(block => ({
          text: block.text,
          confidence: block.recognizedLanguages[0]?.languageCode ? 0.9 : 0.7,
          boundingBox: {
            x: block.frame.x,
            y: block.frame.y,
            width: block.frame.width,
            height: block.frame.height
          },
          lines: block.lines.map(line => ({
            text: line.text,
            boundingBox: {
              x: line.frame.x,
              y: line.frame.y,
              width: line.frame.width,
              height: line.frame.height
            }
          }))
        }))
      };
    } catch (error) {
      throw new OCRError(`OCR processing failed: ${error.message}`);
    }
  }
}
```

### Image Enhancement Pipeline

```typescript
import { manipulateAsync, FlipType, SaveFormat } from 'expo-image-manipulator';

class ImageProcessor {
  async enhanceForOCR(imageUri: string): Promise<string> {
    // 1. Resize to optimal dimensions
    const resized = await manipulateAsync(
      imageUri,
      [{ resize: { width: 1200 } }],
      { compress: 0.8, format: SaveFormat.JPEG }
    );

    // 2. Enhance contrast (would use native module for advanced processing)
    const enhanced = await this.adjustContrast(resized.uri, 1.2);
    
    // 3. Perspective correction (if corners detected)
    const corrected = await this.correctPerspective(enhanced);
    
    return corrected;
  }

  private async adjustContrast(uri: string, factor: number): Promise<string> {
    // Native module implementation for image enhancement
    return NativeImageProcessor.adjustContrast(uri, factor);
  }
}
```

## Bullet Journal Parser

### Pattern Recognition Engine

```typescript
class BuJoParser {
  private readonly patterns = {
    // Core bullets
    task: /^[•\-\*]\s+(.+)$/,
    taskComplete: /^[xX✓]\s*[•\-\*]?\s*(.+)$/,
    taskMigrated: /^[>→]\s*[•\-\*]?\s*(.+)$/,
    taskScheduled: /^[<←]\s*[•\-\*]?\s*(.+)$/,
    event: /^[○◦]\s+(.+)$/,
    note: /^[—–\-]\s+(.+)$/,
    
    // Context & tags
    context: /@([a-zA-Z0-9_]+)/g,
    hashtag: /#([a-zA-Z0-9_]+)/g,
    priority: /\*\s*$/,
    
    // Dates and times
    date: /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\w+\s+\d{1,2},?\s+\d{4})|(\d{1,2}\s+\w+\s+\d{4})/g,
    time: /(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/g,
    timeRange: /(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})/g
  };

  parse(text: string): BuJoEntry[] {
    const lines = this.preprocessText(text);
    const entries: BuJoEntry[] = [];

    for (const line of lines) {
      const entry = this.parseLine(line);
      if (entry) {
        entries.push(entry);
      }
    }

    return entries;
  }

  private parseLine(line: string): BuJoEntry | null {
    // Remove leading/trailing whitespace
    const cleanLine = line.trim();
    if (!cleanLine) return null;

    // Try to match against all patterns
    for (const [type, pattern] of Object.entries(this.patterns)) {
      if (type.startsWith('task') || type === 'event' || type === 'note') {
        const match = cleanLine.match(pattern);
        if (match) {
          return this.createEntry(type as EntryType, match[1], cleanLine);
        }
      }
    }

    return null;
  }

  private createEntry(type: string, content: string, originalLine: string): BuJoEntry {
    const entry: BuJoEntry = {
      id: generateId(),
      type: this.mapEntryType(type),
      content: content.trim(),
      status: this.inferStatus(type),
      priority: this.extractPriority(originalLine),
      createdAt: new Date(),
      tags: this.extractTags(originalLine),
      contexts: this.extractContexts(originalLine),
      collection: 'daily',
      collectionDate: this.formatDate(new Date())
    };

    // Extract dates if present
    const dates = this.extractDates(originalLine);
    if (dates.length > 0) {
      entry.dueDate = dates[0];
    }

    return entry;
  }

  private extractDates(text: string): Date[] {
    const dates: Date[] = [];
    
    // Use NSDataDetector equivalent for better date recognition
    const dateMatches = text.match(this.patterns.date);
    
    if (dateMatches) {
      for (const match of dateMatches) {
        const date = new Date(match);
        if (!isNaN(date.getTime())) {
          dates.push(date);
        }
      }
    }

    return dates;
  }
}
```

## Apple Ecosystem Integration

### EventKit Bridge (Native Module)

```objc
// AppleIntegration.m
#import <EventKit/EventKit.h>
#import <React/RCTBridgeModule.h>

@interface AppleIntegration : NSObject <RCTBridgeModule>
@property (nonatomic, strong) EKEventStore *eventStore;
@end

@implementation AppleIntegration

RCT_EXPORT_MODULE();

- (instancetype)init {
    if (self = [super init]) {
        self.eventStore = [[EKEventStore alloc] init];
    }
    return self;
}

RCT_EXPORT_METHOD(requestPermissions:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    [self.eventStore requestAccessToEntityType:EKEntityTypeReminder completion:^(BOOL granted, NSError * _Nullable error) {
        if (granted) {
            [self.eventStore requestAccessToEntityType:EKEntityTypeEvent completion:^(BOOL eventGranted, NSError * _Nullable eventError) {
                resolve(@{@"reminders": @(granted), @"calendar": @(eventGranted)});
            }];
        } else {
            reject(@"permission_denied", @"Calendar permission denied", error);
        }
    }];
}

RCT_EXPORT_METHOD(createReminder:(NSDictionary *)reminderData
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    EKReminder *reminder = [EKReminder reminderWithEventStore:self.eventStore];
    reminder.title = reminderData[@"title"];
    reminder.notes = reminderData[@"notes"];
    
    if (reminderData[@"dueDate"]) {
        NSDate *dueDate = [NSDate dateWithTimeIntervalSince1970:[reminderData[@"dueDate"] doubleValue]];
        reminder.dueDateComponents = [[NSCalendar currentCalendar] 
                                     components:NSCalendarUnitYear|NSCalendarUnitMonth|NSCalendarUnitDay 
                                     fromDate:dueDate];
    }
    
    // Set priority
    NSNumber *priority = reminderData[@"priority"];
    if (priority) {
        reminder.priority = [priority intValue];
    }
    
    reminder.calendar = [self.eventStore defaultCalendarForNewReminders];
    
    NSError *error;
    BOOL success = [self.eventStore saveReminder:reminder commit:YES error:&error];
    
    if (success) {
        resolve(@{@"id": reminder.calendarItemIdentifier, @"success": @YES});
    } else {
        reject(@"save_failed", @"Failed to save reminder", error);
    }
}

RCT_EXPORT_METHOD(createEvent:(NSDictionary *)eventData
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    EKEvent *event = [EKEvent eventWithEventStore:self.eventStore];
    event.title = eventData[@"title"];
    event.notes = eventData[@"notes"];
    
    NSDate *startDate = [NSDate dateWithTimeIntervalSince1970:[eventData[@"startDate"] doubleValue]];
    NSDate *endDate = [NSDate dateWithTimeIntervalSince1970:[eventData[@"endDate"] doubleValue]];
    
    event.startDate = startDate;
    event.endDate = endDate;
    event.allDay = [eventData[@"allDay"] boolValue];
    
    if (eventData[@"location"]) {
        event.location = eventData[@"location"];
    }
    
    event.calendar = [self.eventStore defaultCalendarForNewEvents];
    
    NSError *error;
    BOOL success = [self.eventStore saveEvent:event span:EKSpanThisEvent commit:YES error:&error];
    
    if (success) {
        resolve(@{@"id": event.eventIdentifier, @"success": @YES});
    } else {
        reject(@"save_failed", @"Failed to save event", error);
    }
}

@end
```

### Sync Service Implementation

```typescript
class AppleSyncService {
  private syncQueue: SyncOperation[] = [];
  private isOnline = true;

  async syncEntry(entry: BuJoEntry): Promise<void> {
    const operation: SyncOperation = {
      id: generateId(),
      type: 'create',
      entryId: entry.id,
      data: entry,
      attempts: 0,
      createdAt: new Date()
    };

    if (this.isOnline) {
      await this.executeSyncOperation(operation);
    } else {
      this.queueSyncOperation(operation);
    }
  }

  private async executeSyncOperation(operation: SyncOperation): Promise<void> {
    try {
      switch (operation.data.type) {
        case 'task':
          const reminderId = await AppleIntegration.createReminder({
            title: operation.data.content,
            notes: this.buildNotes(operation.data),
            dueDate: operation.data.dueDate?.getTime(),
            priority: this.mapPriority(operation.data.priority)
          });
          
          // Update local entry with Apple ID
          await this.updateEntryAppleId(operation.entryId, 'reminder', reminderId);
          break;

        case 'event':
          const eventId = await AppleIntegration.createEvent({
            title: operation.data.content,
            notes: this.buildNotes(operation.data),
            startDate: operation.data.dueDate?.getTime() || new Date().getTime(),
            endDate: (operation.data.dueDate?.getTime() || new Date().getTime()) + 3600000, // +1 hour
            allDay: !this.hasTimeInfo(operation.data.content)
          });
          
          await this.updateEntryAppleId(operation.entryId, 'event', eventId);
          break;

        case 'note':
          // Notes don't have direct API - queue for Share Sheet export
          await this.queueNoteForExport(operation.data);
          break;
      }
    } catch (error) {
      operation.attempts++;
      if (operation.attempts < 3) {
        this.queueSyncOperation(operation);
      } else {
        console.error('Sync failed after 3 attempts:', error);
      }
    }
  }

  private buildNotes(entry: BuJoEntry): string {
    let notes = `BuJo Entry - ${entry.collectionDate}\n\n`;
    
    if (entry.tags.length > 0) {
      notes += `Tags: ${entry.tags.map(tag => `#${tag}`).join(', ')}\n`;
    }
    
    if (entry.contexts.length > 0) {
      notes += `Contexts: ${entry.contexts.map(ctx => `@${ctx}`).join(', ')}\n`;
    }
    
    if (entry.sourceImage) {
      notes += `\nOriginal from scanned page`;
    }
    
    return notes;
  }
}
```

## UI/UX Design System

### Theme Configuration

```typescript
// Design tokens following Apple HIG
export const BuJoTheme = {
  colors: {
    // iOS Dynamic Colors
    primary: {
      light: '#007AFF',
      dark: '#0A84FF'
    },
    background: {
      light: '#FFFFFF',
      dark: '#000000'
    },
    secondaryBackground: {
      light: '#F2F2F7',
      dark: '#1C1C1E'
    },
    
    // BuJo specific colors
    paper: {
      cream: '#FAF7F0',
      white: '#FFFFFF',
      grid: '#E8E5DC',
      aged: '#F5F2E8'
    },
    
    ink: {
      black: '#1C1C1E',
      blue: '#007AFF',
      red: '#FF3B30',
      orange: '#FF9500',
      green: '#34C759',
      gray: '#8E8E93'
    },
    
    // Glass morphism
    glass: {
      background: 'rgba(255, 255, 255, 0.7)',
      backgroundDark: 'rgba(28, 28, 30, 0.7)',
      border: 'rgba(255, 255, 255, 0.2)',
      shadow: 'rgba(0, 0, 0, 0.1)'
    }
  },
  
  typography: {
    // San Francisco font family
    fontFamily: {
      regular: 'SF Pro Text',
      medium: 'SF Pro Text Medium',
      semibold: 'SF Pro Text Semibold',
      bold: 'SF Pro Text Bold',
      display: 'SF Pro Display',
      handwritten: 'Kalam' // Fallback for handwritten style
    },
    
    fontSize: {
      caption1: 12,
      caption2: 11,
      footnote: 13,
      subheadline: 15,
      callout: 16,
      body: 17,
      headline: 17,
      title3: 20,
      title2: 22,
      title1: 28,
      largeTitle: 34
    }
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999
  },
  
  shadows: {
    // iOS-style shadows
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5
    }
  }
};
```

### Component Library

```typescript
// Bullet Symbol Components
export const BulletSymbol: React.FC<{ type: string; completed?: boolean }> = ({ type, completed }) => {
  const symbols = {
    task: completed ? '✓' : '•',
    event: '○',
    note: '—',
    migrated: '→',
    scheduled: '←',
    priority: '★'
  };

  return (
    <View style={styles.bulletContainer}>
      <Text style={[
        styles.bulletSymbol,
        completed && styles.bulletCompleted
      ]}>
        {symbols[type] || '•'}
      </Text>
    </View>
  );
};

// Entry Component with Apple-style interactions
export const BuJoEntryItem: React.FC<{ entry: BuJoEntry; onPress: () => void }> = ({ entry, onPress }) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.entryContainer,
        pressed && styles.entryPressed
      ]}
      onPress={onPress}
    >
      <BulletSymbol type={entry.type} completed={entry.status === 'complete'} />
      
      <View style={styles.entryContent}>
        <Text style={[
          styles.entryText,
          entry.status === 'complete' && styles.entryCompleted
        ]}>
          {entry.content}
        </Text>
        
        {(entry.tags.length > 0 || entry.contexts.length > 0) && (
          <View style={styles.tagContainer}>
            {entry.contexts.map(ctx => (
              <Text key={ctx} style={styles.contextTag}>@{ctx}</Text>
            ))}
            {entry.tags.map(tag => (
              <Text key={tag} style={styles.hashTag}>#{tag}</Text>
            ))}
          </View>
        )}
      </View>
      
      {entry.dueDate && (
        <Text style={styles.dueDate}>
          {formatRelativeDate(entry.dueDate)}
        </Text>
      )}
    </Pressable>
  );
};
```

## Authentication & Monetization

### Clerk Integration

```typescript
// Clerk Provider Setup
import { ClerkProvider } from '@clerk/clerk-expo';

export default function App() {
  return (
    <ClerkProvider publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <AuthenticatedApp />
    </ClerkProvider>
  );
}

// Auth Gate Component
const AuthGate: React.FC = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();
  
  if (!isLoaded) {
    return <LoadingScreen />;
  }
  
  if (!isSignedIn) {
    return <SignInScreen />;
  }
  
  return <>{children}</>;
};
```

### RevenueCat Subscription System

```typescript
// Subscription configuration
const SUBSCRIPTION_CONFIG = {
  entitlements: {
    PREMIUM: 'premium',
    ULTIMATE: 'ultimate'
  },
  products: {
    PREMIUM_MONTHLY: 'premium_monthly_4_99',
    ULTIMATE_MONTHLY: 'ultimate_monthly_9_99'
  }
};

// Usage tracking
class UsageTracker {
  async trackScan(): Promise<boolean> {
    const usage = await this.getCurrentUsage();
    const subscription = await this.getSubscriptionStatus();
    
    if (subscription.tier === 'ultimate') {
      return true; // Unlimited
    }
    
    const limits = {
      free: 5,
      premium: 100
    };
    
    const limit = limits[subscription.tier] || limits.free;
    
    if (usage.monthlyScans >= limit) {
      this.showPaywall('scan_limit_reached');
      return false;
    }
    
    await this.incrementUsage('scans');
    return true;
  }
}
```

## Performance & Security

### Image Optimization

```typescript
class ImageOptimizationService {
  async optimizeForOCR(imageUri: string): Promise<string> {
    // Resize to optimal dimensions for ML Kit
    const optimized = await manipulateAsync(
      imageUri,
      [
        { resize: { width: 1200 } }, // Optimal width for OCR accuracy
        { flip: FlipType.Vertical } // Correct orientation if needed
      ],
      {
        compress: 0.8,
        format: SaveFormat.JPEG,
        base64: false
      }
    );
    
    return optimized.uri;
  }
  
  async createThumbnail(imageUri: string): Promise<string> {
    const thumbnail = await manipulateAsync(
      imageUri,
      [{ resize: { width: 200, height: 200 } }],
      {
        compress: 0.7,
        format: SaveFormat.JPEG
      }
    );
    
    return thumbnail.uri;
  }
}
```

### Privacy & Security Measures

```typescript
// Privacy-compliant analytics
class PrivacyAnalytics {
  trackEvent(eventName: string, properties: Record<string, any>) {
    // Remove PII before tracking
    const sanitizedProperties = this.sanitizeProperties(properties);
    
    // Only track if user has consented
    if (this.hasAnalyticsConsent()) {
      Analytics.track(eventName, sanitizedProperties);
    }
  }
  
  private sanitizeProperties(properties: Record<string, any>) {
    // Remove text content, keep only metadata
    const { content, text, ...metadata } = properties;
    return {
      ...metadata,
      hasContent: !!content || !!text
    };
  }
}

// Secure storage for sensitive data
class SecureStorage {
  async storeAppleTokens(tokens: AppleTokens): Promise<void> {
    // Use Keychain services for sensitive data
    await Keychain.setInternetCredentials(
      'apple_integration',
      'tokens',
      JSON.stringify(tokens)
    );
  }
}
```

## Build & Deployment

### EAS Configuration

```json
// eas.json
{
  "cli": {
    "version": ">= 5.9.0"
  },
  "build": {
    "development": {
      "distribution": "internal",
      "ios": {
        "simulator": true,
        "bundleIdentifier": "com.bujo.app.dev"
      }
    },
    "test": {
      "distribution": "internal",
      "ios": {
        "bundleIdentifier": "com.bujo.app.test"
      },
      "env": {
        "ENVIRONMENT": "test"
      }
    },
    "production": {
      "distribution": "store",
      "ios": {
        "bundleIdentifier": "com.bujo.app"
      },
      "env": {
        "ENVIRONMENT": "production"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890"
      }
    }
  }
}
```

### CI/CD Pipeline

```yaml
# .github/workflows/eas-build.yml
name: EAS Build & Deploy

on:
  push:
    branches: [main, develop]
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
          
      - run: npm ci
      
      - name: Build for development
        if: github.ref == 'refs/heads/develop'
        run: eas build --platform ios --profile development --non-interactive
        
      - name: Build for production
        if: startsWith(github.ref, 'refs/tags/v')
        run: eas build --platform ios --profile production --non-interactive
        
      - name: Submit to App Store
        if: startsWith(github.ref, 'refs/tags/v')
        run: eas submit --platform ios --latest --non-interactive
```

## Testing Strategy

### Unit Testing

```typescript
// __tests__/BuJoParser.test.ts
describe('BuJoParser', () => {
  const parser = new BuJoParser();
  
  test('parses task bullets correctly', () => {
    const text = '• Complete project documentation';
    const entries = parser.parse(text);
    
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe('task');
    expect(entries[0].status).toBe('incomplete');
    expect(entries[0].content).toBe('Complete project documentation');
  });
  
  test('extracts contexts and tags', () => {
    const text = '• Review @work presentation #quarterly';
    const entries = parser.parse(text);
    
    expect(entries[0].contexts).toContain('work');
    expect(entries[0].tags).toContain('quarterly');
  });
  
  test('handles date extraction', () => {
    const text = '• Meeting with team 2024-08-25 2:00 PM';
    const entries = parser.parse(text);
    
    expect(entries[0].dueDate).toBeInstanceOf(Date);
  });
});
```

### Integration Testing

```typescript
// __tests__/AppleIntegration.test.ts
describe('Apple Integration', () => {
  test('creates reminder successfully', async () => {
    const entry: BuJoEntry = {
      id: 'test-1',
      type: 'task',
      content: 'Test reminder',
      status: 'incomplete',
      priority: 'medium',
      createdAt: new Date()
    };
    
    const result = await AppleSyncService.syncEntry(entry);
    expect(result.success).toBe(true);
    expect(result.appleId).toBeTruthy();
  });
});
```

## Monitoring & Analytics

### Error Tracking with Sentry

```typescript
import * as Sentry from '@sentry/react-native';

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 0.1,
});

// Custom error boundary for OCR failures
class OCRErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.withScope(scope => {
      scope.setTag('component', 'OCRProcessor');
      scope.setContext('errorInfo', errorInfo);
      Sentry.captureException(error);
    });
  }
}
```

### Performance Monitoring

```typescript
class PerformanceMonitor {
  measureOCRPerformance = async (imageUri: string) => {
    const startTime = performance.now();
    
    try {
      const result = await OCRService.processImage(imageUri);
      const duration = performance.now() - startTime;
      
      // Track performance metrics
      Analytics.track('ocr_performance', {
        duration,
        textLength: result.text.length,
        confidence: result.averageConfidence
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      Analytics.track('ocr_error', {
        duration,
        error: error.message
      });
      
      throw error;
    }
  };
}
```

## Success Metrics & KPIs

### User Engagement
- Daily Active Users (DAU)
- Weekly Retention Rate
- Average Session Duration
- Entries created per session

### Feature Adoption
- Photo capture usage rate
- OCR accuracy feedback scores
- Apple app sync activation rate
- Migration workflow completion rate

### Business Metrics
- Conversion rate to premium subscriptions
- Monthly Recurring Revenue (MRR)
- Customer Lifetime Value (LTV)
- Churn rate by subscription tier

### Technical Performance
- App crash rate (< 0.1%)
- OCR processing time (< 3 seconds)
- Apple sync success rate (> 95%)
- App store rating (> 4.5 stars)

This architecture provides a solid foundation for building a premium bullet journal app that combines the best of analog and digital workflows while maintaining high performance, security, and user experience standards.