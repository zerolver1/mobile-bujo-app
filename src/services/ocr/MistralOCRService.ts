import { OCRResult, OCRBlock, BuJoEntry } from '../../types/BuJo';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

/**
 * Mistral AI OCR Service for advanced text extraction from bullet journal images
 * Uses Mistral's state-of-the-art OCR with 99%+ accuracy for handwritten text
 */
class MistralOCRService {
  private apiKey: string;
  private apiUrl: string;
  private model: string = 'mistral-ocr-latest';

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_MISTRAL_API_KEY || '';
    this.apiUrl = process.env.EXPO_PUBLIC_MISTRAL_API_URL || 'https://api.mistral.ai/v1/ocr';
  }

  /**
   * Test basic connectivity to Mistral API
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('MistralOCR: Testing basic network connectivity...');
      
      // Test with a simple GET request to a working API
      const testResponse = await fetch('https://httpbin.org/get', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('MistralOCR: Basic connectivity test:', testResponse.status);
      
      if (!testResponse.ok) {
        console.log('MistralOCR: Basic network test failed');
        return false;
      }
      
      console.log('MistralOCR: Network connectivity OK, testing Mistral API...');
      
      // Try a simple GET request to test Mistral API connectivity
      const response = await fetch('https://api.mistral.ai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      
      console.log('MistralOCR: Mistral API test status:', response.status);
      console.log('MistralOCR: Mistral API test headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const error = await response.text();
        console.log('MistralOCR: Mistral API test error:', error);
      } else {
        console.log('MistralOCR: Mistral API test successful');
        return true;
      }
    } catch (error) {
      console.error('MistralOCR: Connection test failed:', error);
    }
    
    return false;
  }

  /**
   * Process image with Mistral OCR and extract bullet journal entries
   */
  async recognizeText(imageUri: string): Promise<OCRResult> {
    try {
      console.log('MistralOCR: Processing image:', imageUri);
      
      if (!this.apiKey) {
        console.warn('MistralOCR: No API key configured, falling back to basic OCR');
        throw new Error('Mistral API key not configured');
      }

      // Compress image to reduce payload size
      let finalImageUri = imageUri;
      let base64Image = '';
      
      try {
        // First, get the original image size
        const originalBase64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        console.log('MistralOCR: Original image base64 size:', originalBase64.length);
        
        // If image is too large (>500KB base64), compress it
        if (originalBase64.length > 500000) {
          console.log('MistralOCR: Compressing large image...');
          
          const compressedImage = await manipulateAsync(
            imageUri,
            [{ resize: { width: 1024 } }], // Resize to max 1024px width
            { 
              compress: 0.8,
              format: SaveFormat.JPEG 
            }
          );
          
          finalImageUri = compressedImage.uri;
          console.log('MistralOCR: Image compressed, new URI:', finalImageUri);
        }
        
        // Read the final image as base64
        base64Image = await FileSystem.readAsStringAsync(finalImageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        console.log('MistralOCR: Final image base64 size:', base64Image.length);
        console.log('MistralOCR: Image base64 preview:', base64Image.substring(0, 100) + '...');
        
        // Check if still too large after compression
        if (base64Image.length > 2000000) { // ~2MB limit after compression
          console.warn('MistralOCR: Image still too large after compression, falling back to OCR.space');
          throw new Error('Image too large for Mistral OCR even after compression');
        }
      } catch (compressionError) {
        console.error('MistralOCR: Image compression failed:', compressionError);
        throw new Error('Failed to prepare image for Mistral OCR');
      }

      // Simple OCR request format matching the working Node.js test
      const requestBody = {
        model: this.model,
        document: {
          type: 'image_url',
          image_url: {
            url: `data:image/png;base64,${base64Image}`
          }
        }
      };

      console.log('MistralOCR: Making request to:', this.apiUrl);
      console.log('MistralOCR: Using API key:', this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'None');
      console.log('MistralOCR: Request body size:', JSON.stringify(requestBody).length, 'characters');

      // Check if running in iOS Simulator
      const isSimulator = Platform.OS === 'ios' && !Device.isDevice;
      
      if (isSimulator) {
        console.log('MistralOCR: Running in iOS Simulator - using FileSystem.uploadAsync workaround');
        
        // Use Expo FileSystem for iOS Simulator as a workaround
        try {
          const uploadResult = await FileSystem.uploadAsync(
            this.apiUrl,
            finalImageUri,
            {
              httpMethod: 'POST',
              uploadType: FileSystem.FileSystemUploadType.MULTIPART,
              fieldName: 'document',
              headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Accept': 'application/json',
              },
              parameters: {
                model: this.model,
                document_type: 'image_url'
              }
            }
          );
          
          console.log('MistralOCR: Upload result status:', uploadResult.status);
          
          if (uploadResult.status !== 200) {
            throw new Error(`Mistral OCR API error: ${uploadResult.status}`);
          }
          
          const data = JSON.parse(uploadResult.body);
          console.log('MistralOCR: Raw response:', JSON.stringify(data, null, 2));
          return this.parseOCRResponse(data);
          
        } catch (uploadError) {
          console.error('MistralOCR: FileSystem upload failed:', uploadError);
          // Fall back to regular fetch
        }
      }
      
      // Regular fetch for physical devices
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      let response: Response;
      try {
        response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        console.log('MistralOCR: Response status:', response.status);
        console.log('MistralOCR: Response headers:', Object.fromEntries(response.headers.entries()));
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        // More specific error handling for React Native
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout - server took too long to respond');
        } else if (fetchError.message === 'Network request failed') {
          throw new Error('Network request failed - iOS Simulator limitation');
        } else {
          throw fetchError;
        }
      }

      if (!response.ok) {
        const error = await response.text();
        console.error('MistralOCR: API error:', error);
        throw new Error(`Mistral OCR API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('MistralOCR: Raw response:', JSON.stringify(data, null, 2));

      // Parse the response
      return this.parseOCRResponse(data);
    } catch (error) {
      console.error('MistralOCR: Failed to process image:', error);
      
      // Log more details about the error
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        console.error('MistralOCR: Network error - possible causes:');
        console.error('- Connectivity issues');
        console.error('- CORS policy blocking request');
        console.error('- Invalid API endpoint:', this.apiUrl);
        console.error('- Request too large');
      }
      
      throw error;
    }
  }

  /**
   * Define custom JSON schema for bullet journal extraction
   */
  private getBulletJournalSchema() {
    return {
      type: 'object',
      properties: {
        raw_text: {
          type: 'string',
          description: 'The complete raw text extracted from the image'
        },
        entries: {
          type: 'array',
          description: 'Array of bullet journal entries found in the image',
          items: {
            type: 'object',
            properties: {
              bullet_symbol: {
                type: 'string',
                description: 'The bullet symbol used (•, ○, —, x, >, <, *, etc.)',
                enum: ['•', '○', '—', 'x', '>', '<', '*', '!', '!!']
              },
              entry_type: {
                type: 'string',
                description: 'Type of bullet journal entry',
                enum: ['task', 'event', 'note', 'completed_task', 'migrated_task', 'scheduled_task']
              },
              content: {
                type: 'string',
                description: 'The main content/text of the entry'
              },
              priority: {
                type: 'string',
                description: 'Priority level of the entry',
                enum: ['none', 'low', 'medium', 'high']
              },
              contexts: {
                type: 'array',
                description: 'Context tags starting with @ (e.g., @work, @home)',
                items: { type: 'string' }
              },
              tags: {
                type: 'array',
                description: 'Hashtags found in the entry (e.g., #project)',
                items: { type: 'string' }
              },
              date: {
                type: 'string',
                description: 'Any date mentioned in the entry (ISO format if possible)',
                format: 'date'
              },
              time: {
                type: 'string',
                description: 'Any time mentioned in the entry'
              }
            },
            required: ['content', 'entry_type']
          }
        },
        metadata: {
          type: 'object',
          properties: {
            page_date: {
              type: 'string',
              description: 'The date of the journal page if visible'
            },
            page_title: {
              type: 'string',
              description: 'Any title or header on the page'
            },
            total_entries: {
              type: 'integer',
              description: 'Total number of entries found'
            }
          }
        }
      },
      required: ['raw_text', 'entries']
    };
  }

  /**
   * Parse Mistral OCR response into our OCRResult format
   */
  private parseOCRResponse(response: any): OCRResult {
    try {
      let rawText = '';
      let parsedData: any = {};

      console.log('MistralOCR: Raw API response:', JSON.stringify(response, null, 2));

      // Extract text from Mistral OCR response - use pages.markdown format
      if (response.pages && Array.isArray(response.pages)) {
        // Extract markdown text from pages (this is the main format)
        rawText = response.pages.map((page: any) => {
          if (page.markdown) {
            return page.markdown;
          } else if (page.content) {
            return page.content;
          } else if (typeof page === 'string') {
            return page;
          } else {
            return JSON.stringify(page);
          }
        }).join('\n').trim();
        
        console.log('MistralOCR: Extracted from pages.markdown:', rawText);
      } else if (response.document_annotation) {
        // Fallback to document_annotation if available
        if (typeof response.document_annotation === 'string') {
          rawText = response.document_annotation;
          try {
            parsedData = JSON.parse(response.document_annotation);
          } catch (e) {
            // Not JSON, just use as raw text
          }
        } else {
          rawText = JSON.stringify(response.document_annotation);
          parsedData = response.document_annotation;
        }
      } else {
        console.warn('MistralOCR: Unexpected response format, using full response');
        rawText = JSON.stringify(response);
      }

      // Convert structured entries to OCR blocks
      const blocks: OCRBlock[] = [];
      
      if (parsedData.entries && Array.isArray(parsedData.entries)) {
        parsedData.entries.forEach((entry: any, index: number) => {
          const blockText = this.formatEntryAsText(entry);
          blocks.push({
            text: blockText,
            confidence: 0.95, // Mistral OCR has very high confidence
            boundingBox: {
              x: 20,
              y: 50 + (index * 40),
              width: 350,
              height: 35
            },
            lines: []
          });
        });
      } else if (rawText) {
        // If no structured entries, create blocks from lines
        const lines = rawText.split('\n').filter(line => line.trim());
        lines.forEach((line, index) => {
          blocks.push({
            text: line,
            confidence: 0.9,
            boundingBox: {
              x: 20,
              y: 50 + (index * 30),
              width: 350,
              height: 25
            },
            lines: []
          });
        });
      }

      console.log('MistralOCR: Extracted', blocks.length, 'blocks');
      console.log('MistralOCR: Raw text preview:', rawText.substring(0, 200));

      return {
        text: rawText,
        confidence: 0.95, // Mistral OCR typically has 99%+ accuracy
        blocks,
        // Store parsed entries for easier processing
        parsedEntries: parsedData.entries
      } as OCRResult;
    } catch (error) {
      console.error('MistralOCR: Error parsing response:', error);
      throw new Error('Failed to parse Mistral OCR response');
    }
  }

  /**
   * Format a parsed entry back to bullet journal text format
   */
  private formatEntryAsText(entry: any): string {
    let text = '';
    
    // Add bullet symbol
    const bulletMap: { [key: string]: string } = {
      'task': '•',
      'event': '○',
      'note': '—',
      'completed_task': 'x',
      'migrated_task': '>',
      'scheduled_task': '<'
    };
    
    const bullet = entry.bullet_symbol || bulletMap[entry.entry_type] || '•';
    text = `${bullet} ${entry.content}`;
    
    // Add contexts
    if (entry.contexts && entry.contexts.length > 0) {
      entry.contexts.forEach((ctx: string) => {
        if (!ctx.startsWith('@')) {
          text += ` @${ctx}`;
        } else {
          text += ` ${ctx}`;
        }
      });
    }
    
    // Add tags
    if (entry.tags && entry.tags.length > 0) {
      entry.tags.forEach((tag: string) => {
        if (!tag.startsWith('#')) {
          text += ` #${tag}`;
        } else {
          text += ` ${tag}`;
        }
      });
    }
    
    // Add priority markers
    if (entry.priority === 'high') {
      text += ' !!';
    } else if (entry.priority === 'medium') {
      text += ' !';
    }
    
    // Add date/time if present
    if (entry.date) {
      text += ` [${entry.date}]`;
    }
    if (entry.time) {
      text += ` (${entry.time})`;
    }
    
    return text;
  }

  /**
   * Convert Mistral's structured entries directly to BuJo entries
   */
  async parseStructuredEntries(ocrResult: any): Promise<BuJoEntry[]> {
    const entries: BuJoEntry[] = [];
    const today = new Date().toISOString().split('T')[0];

    if (ocrResult.parsedEntries && Array.isArray(ocrResult.parsedEntries)) {
      for (const parsed of ocrResult.parsedEntries) {
        const entry: Partial<BuJoEntry> = {
          id: this.generateId(),
          content: parsed.content || '',
          createdAt: new Date(),
          collection: 'daily',
          collectionDate: today,
          ocrConfidence: 0.95
        };

        // Map entry type
        switch (parsed.entry_type) {
          case 'task':
            entry.type = 'task';
            entry.status = 'incomplete';
            break;
          case 'completed_task':
            entry.type = 'task';
            entry.status = 'complete';
            break;
          case 'migrated_task':
            entry.type = 'task';
            entry.status = 'migrated';
            break;
          case 'scheduled_task':
            entry.type = 'task';
            entry.status = 'scheduled';
            break;
          case 'event':
            entry.type = 'event';
            entry.status = 'incomplete';
            break;
          case 'note':
            entry.type = 'note';
            entry.status = 'incomplete';
            break;
          default:
            entry.type = 'task';
            entry.status = 'incomplete';
        }

        // Map priority
        entry.priority = parsed.priority || 'none';

        // Add contexts and tags
        entry.contexts = parsed.contexts || [];
        entry.tags = parsed.tags || [];

        // Parse date if present
        if (parsed.date) {
          try {
            entry.dueDate = new Date(parsed.date);
          } catch (e) {
            console.warn('Could not parse date:', parsed.date);
          }
        }

        entries.push(entry as BuJoEntry);
      }
    }

    return entries;
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (!this.apiKey) {
      console.warn('MistralOCR: No API key configured. Service will not be available.');
    } else {
      console.log('MistralOCR: Service initialized with API key');
      // Test connection
      await this.testConnection();
    }
  }

  /**
   * Cleanup (no-op for this service)
   */
  async cleanup(): Promise<void> {
    // Nothing to clean up
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}

export const mistralOCRService = new MistralOCRService();