import { OCRResult, OCRBlock, BuJoEntry } from '../../types/BuJo';
import * as FileSystem from 'expo-file-system';

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
   * Process image with Mistral OCR and extract bullet journal entries
   */
  async recognizeText(imageUri: string): Promise<OCRResult> {
    try {
      console.log('MistralOCR: Processing image:', imageUri);
      
      if (!this.apiKey) {
        console.warn('MistralOCR: No API key configured, falling back to basic OCR');
        throw new Error('Mistral API key not configured');
      }

      // Read image as base64
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // First, let's try a simpler request without custom schema to test basic functionality
      const requestBody = {
        model: this.model,
        document: {
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`
          }
        }
        // Note: Commenting out custom schema for now to test basic OCR
        // document_annotation_format: {
        //   type: 'json_schema',
        //   json_schema: {
        //     name: 'bullet_journal_extraction',
        //     schema: this.getBulletJournalSchema()
        //   }
        // }
      };

      // Make API request
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

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

      // Extract text from Mistral OCR response
      if (response.document_annotation) {
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
      } else if (response.pages && Array.isArray(response.pages)) {
        // Extract text from pages array
        rawText = response.pages.map((page: any) => {
          if (typeof page === 'string') {
            return page;
          } else if (page.content) {
            return page.content;
          } else {
            return JSON.stringify(page);
          }
        }).join('\n');
      } else {
        console.warn('MistralOCR: Unexpected response format');
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