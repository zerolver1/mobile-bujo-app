import { OCRResult, OCRBlock, BuJoEntry } from '../../types/BuJo';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { gptVisionRateLimiter } from '../utils/RateLimiter';

/**
 * OpenAI GPT Vision OCR Service for advanced bullet journal understanding
 * Uses GPT-4o Vision with structured prompts for direct BuJo entry extraction
 */
class GPTVisionOCRService {
  private apiKey: string;
  private apiUrl: string;
  private model: string = 'gpt-4o-mini'; // Fast and cost-effective vision model
  private maxTokens: number = 1000;

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
    this.apiUrl = process.env.EXPO_PUBLIC_OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
  }

  /**
   * Test basic connectivity to OpenAI API
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('GPTVision: Testing connectivity...');
      
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log('GPTVision: API connection successful');
        return true;
      } else {
        console.warn('GPTVision: API connection failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('GPTVision: Connection test failed:', error);
      return false;
    }
  }

  /**
   * Check if GPT Vision service is available
   */
  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey !== '';
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    console.log('GPTVision: Initializing service...');
    
    if (!this.apiKey) {
      console.warn('GPTVision: No API key configured');
      throw new Error('OpenAI API key not configured');
    }
    
    // Test basic connectivity
    const isConnected = await this.testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to OpenAI API');
    }
    
    console.log('GPTVision: Service initialized successfully');
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log('GPTVision: Cleaning up service...');
    // No persistent connections to clean up
  }

  /**
   * Process image with GPT Vision and extract bullet journal entries
   */
  async recognizeText(imageUri: string): Promise<OCRResult> {
    try {
      console.log('GPTVision: Processing image:', imageUri);
      
      if (!this.apiKey) {
        console.warn('GPTVision: No API key configured');
        throw new Error('OpenAI API key not configured');
      }

      // Check rate limits (20 RPM for GPT-4o)
      if (!gptVisionRateLimiter.isAllowed('gpt-vision')) {
        const status = gptVisionRateLimiter.getStatus('gpt-vision');
        const minutesUntilReset = Math.ceil(status.timeUntilReset / 60000);
        throw new Error(`GPT Vision rate limit exceeded (${status.requestsInWindow}/20 requests). Please wait ${minutesUntilReset} minute(s) before trying again.`);
      }

      // Optimize image for GPT Vision (cost optimization)
      const optimizedImageUri = await this.optimizeImageForGPT(imageUri);
      
      // Convert to base64
      const base64Image = await FileSystem.readAsStringAsync(optimizedImageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('GPTVision: Optimized image base64 size:', base64Image.length);
      
      // Create structured request
      const requestBody = {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: this.getBuJoPrompt()
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: 'high' // High detail for better accuracy
                }
              }
            ]
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.05, // Very low temperature for faster, consistent responses
        response_format: { type: 'json_object' }
      };

      console.log('GPTVision: Making API request...');
      console.log('GPTVision: Request body size:', JSON.stringify(requestBody).length, 'characters');

      // Make request with 30 second timeout for GPT-4o-mini
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        console.error('GPTVision: API error:', error);
        
        if (response.status === 429) {
          throw new Error('GPT Vision rate limit exceeded. Please try again in a few minutes.');
        } else if (response.status === 401) {
          throw new Error('Invalid OpenAI API key. Please check your configuration.');
        } else if (response.status === 413) {
          throw new Error('Image too large for GPT Vision. Please use a smaller image.');
        }
        
        throw new Error(`GPT Vision API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      console.log('GPTVision: Raw response received');

      // Parse the structured response
      return this.parseGPTResponse(data, base64Image.length);

    } catch (error) {
      console.error('GPTVision: Failed to process image:', error);
      
      // Enhanced error messages
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        console.error('GPTVision: Network error - possible causes:');
        console.error('- Internet connectivity issues');
        console.error('- OpenAI API endpoint unreachable');
        console.error('- Request timeout (>45 seconds)');
      }
      
      throw error;
    } finally {
      // Memory cleanup - remove temporary optimized image
      try {
        if (imageUri !== imageUri && optimizedImageUri.startsWith('file://')) {
          await FileSystem.deleteAsync(optimizedImageUri, { idempotent: true });
          console.log('GPTVision: Cleaned up temporary optimized image');
        }
      } catch (cleanupError) {
        console.warn('GPTVision: Failed to cleanup temporary image:', cleanupError);
      }
    }
  }

  /**
   * Optimize image for GPT Vision cost efficiency
   * Target: < 2048x2048, shortest side 768px for high detail
   */
  private async optimizeImageForGPT(imageUri: string): Promise<string> {
    try {
      console.log('GPTVision: Optimizing image for cost efficiency...');
      
      const result = await manipulateAsync(
        imageUri,
        [
          // Resize to optimal dimensions for GPT Vision
          { resize: { width: 1536, height: 1536 } }
        ],
        {
          compress: 0.85, // Good quality while reducing size
          format: SaveFormat.JPEG,
        }
      );

      console.log('GPTVision: Image optimized:', result.uri);
      return result.uri;
    } catch (error) {
      console.error('GPTVision: Image optimization failed, using original:', error);
      return imageUri; // Fallback to original
    }
  }

  /**
   * Get the structured bullet journal prompt for GPT Vision
   */
  private getBuJoPrompt(): string {
    return `Analyze this bullet journal page and extract entries as structured JSON.

BULLET JOURNAL SYMBOLS (Official Method):
• (dot) = Task (incomplete)
✓ or X = Task Complete  
> = Task Migrated (moved to monthly/future log)
< = Task Scheduled (moved to future log with date)
~ = Task Cancelled/Irrelevant
○ (circle) = Event
- (dash) = Note
★ (star) = Inspiration/Important idea
& (ampersand) = Research/Investigation needed
◇ (diamond) = Memory/Gratitude entry
! = Important note (deprecated, use ★ instead)
* prefix = Priority marker (high priority)

CONTEXT & TAGS:
@context = Context (location, person, tool needed)
#tag = Tag (category, project, theme)

DATE DETECTION:
- Look for date headers: "March 15th", "Today", "Tomorrow", "Monday", "3/15/25"
- Group entries under their date context
- Use current date for entries without explicit dates

EXTRACT AS JSON:
{
  "entries": [
    {
      "type": "task|event|note|inspiration|research|memory",
      "status": "incomplete|complete|migrated|scheduled|cancelled",
      "content": "clean text content without bullet symbol",
      "priority": "none|high",
      "contexts": ["context1", "context2"],
      "tags": ["tag1", "tag2"],  
      "date": "YYYY-MM-DD or null",
      "time": "HH:MM or null",
      "confidence": 0.95,
      "mood": "excellent|good|neutral|poor (for memory entries only)"
    }
  ],
  "metadata": {
    "page_date": "detected main date or null",
    "total_entries": 5,
    "handwriting_quality": "excellent|good|fair|poor"
  }
}

RULES:
- Extract exact text content, don't paraphrase
- Preserve original @contexts and #tags  
- Set confidence based on text clarity (0.0-1.0)
- Group entries by detected date headers
- Include partial entries if somewhat readable
- Mark priority=high for * prefixed items
- Return valid JSON only`;
  }

  /**
   * Parse GPT Vision response into our OCRResult format
   */
  private parseGPTResponse(response: any, imageSizeBytes: number): OCRResult {
    try {
      console.log('GPTVision: Parsing structured response...');
      
      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No content in GPT Vision response');
      }

      // Parse the JSON response
      const structuredData = JSON.parse(content);
      console.log('GPTVision: Structured data parsed:', structuredData);

      const entries = structuredData.entries || [];
      const metadata = structuredData.metadata || {};

      // Convert GPT entries to our BuJoEntry format
      const parsedEntries: BuJoEntry[] = entries.map((entry: any, index: number) => {
        const today = new Date();
        // Handle various date formats including string "null"
        const entryDate = this.parseEntryDate(entry.date) || today;
        
        // Validate and normalize entry type
        const validTypes = ['task', 'event', 'note', 'inspiration', 'research', 'memory'];
        const entryType = validTypes.includes(entry.type) ? entry.type : 'task';
        
        const baseEntry: BuJoEntry = {
          id: this.generateId(),
          type: entryType,
          content: entry.content || '',
          status: entry.status || 'incomplete',
          priority: entry.priority === 'high' ? 'high' : 'none',
          createdAt: new Date(),
          collection: 'daily',
          collectionDate: entryDate.toISOString().split('T')[0],
          tags: entry.tags || [],
          contexts: entry.contexts || [],
          ocrConfidence: entry.confidence || 0.9,
          dueDate: (entry.time && this.parseEntryDate(entry.date)) ? this.parseDateTime(entry.date, entry.time) : undefined
        };
        
        // Add memory-specific fields if it's a memory entry
        if (entryType === 'memory' && entry.mood) {
          baseEntry.mood = entry.mood;
        }
        
        return baseEntry;
      });

      // Build comprehensive text from all entries for compatibility
      const fullText = entries.map((entry: any) => {
        const bullet = this.getBulletSymbol(entry.type, entry.status);
        const contexts = entry.contexts ? entry.contexts.map((c: string) => `@${c}`).join(' ') : '';
        const tags = entry.tags ? entry.tags.map((t: string) => `#${t}`).join(' ') : '';
        const priority = entry.priority === 'high' ? '* ' : '';
        return `${priority}${bullet} ${entry.content} ${contexts} ${tags}`.trim();
      }).join('\n');

      // Calculate confidence from metadata and individual entries
      const avgConfidence = entries.length > 0 
        ? entries.reduce((sum: number, e: any) => sum + (e.confidence || 0.9), 0) / entries.length
        : 0.95;

      // Create OCR blocks for compatibility
      const blocks: OCRBlock[] = entries.map((entry: any, index: number) => ({
        text: entry.content,
        confidence: entry.confidence || 0.9,
        boundingBox: { x: 0, y: index * 30, width: 100, height: 25 }, // Approximate
        lines: [{
          text: entry.content,
          boundingBox: { x: 0, y: index * 30, width: 100, height: 25 }
        }]
      }));

      const result: OCRResult = {
        text: fullText,
        confidence: avgConfidence,
        blocks: blocks,
        parsedEntries: parsedEntries
      };

      console.log('GPTVision: Successfully parsed', parsedEntries.length, 'entries with avg confidence', avgConfidence);
      console.log('GPTVision: Handwriting quality:', metadata.handwriting_quality || 'unknown');
      
      return result;

    } catch (error) {
      console.error('GPTVision: Failed to parse structured response:', error);
      
      // Fallback: try to extract any text content
      const fallbackText = response.choices?.[0]?.message?.content || '';
      return {
        text: fallbackText,
        confidence: 0.7, // Lower confidence for fallback
        blocks: [],
        parsedEntries: []
      };
    }
  }

  /**
   * Safely parse entry date handling various formats including string "null"
   */
  private parseEntryDate(dateStr: any): Date | null {
    if (!dateStr || dateStr === 'null' || dateStr === null || dateStr === undefined) {
      return null;
    }
    
    try {
      const parsed = new Date(dateStr);
      // Check if date is valid
      if (isNaN(parsed.getTime())) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * Parse date and time into a Date object
   */
  private parseDateTime(dateStr: string, timeStr: string): Date {
    try {
      const baseDate = this.parseEntryDate(dateStr);
      if (!baseDate) {
        return new Date(); // Fallback to current date
      }
      
      if (timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        baseDate.setHours(hours, minutes, 0, 0);
      }
      return baseDate;
    } catch {
      return new Date(); // Fallback to current date
    }
  }

  /**
   * Get bullet symbol for display
   */
  private getBulletSymbol(type: string, status: string): string {
    if (type === 'task') {
      switch (status) {
        case 'complete': return '✓';
        case 'migrated': return '>';
        case 'scheduled': return '<';
        case 'cancelled': return '~';
        default: return '•';
      }
    } else if (type === 'event') {
      return '○';
    } else if (type === 'note') {
      return '-';
    } else if (type === 'inspiration') {
      return '★';
    } else if (type === 'research') {
      return '&';
    } else if (type === 'memory') {
      return '◇';
    }
    return '•';
  }

  /**
   * Generate unique ID for entries
   */
  private generateId(): string {
    return `gpt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const gptVisionOCRService = new GPTVisionOCRService();