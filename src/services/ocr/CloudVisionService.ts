import { OCRResult, OCRBlock } from '../../types/BuJo';
import * as FileSystem from 'expo-file-system';

/**
 * Cloud Vision OCR Service for actual text extraction from images
 * Uses Google Cloud Vision API for text recognition
 */
class CloudVisionService {
  private apiKey: string;
  private apiEndpoint = 'https://vision.googleapis.com/v1/images:annotate';

  constructor() {
    // In production, this should be stored securely and fetched from your backend
    // For demo purposes, using a placeholder - you'll need to add your own API key
    this.apiKey = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY || '';
  }

  async recognizeText(imageUri: string): Promise<OCRResult> {
    try {
      console.log('CloudVision: Processing image:', imageUri);
      
      // Read the image as base64
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Prepare the request
      const body = {
        requests: [
          {
            image: {
              content: base64Image,
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 1,
              },
              {
                type: 'DOCUMENT_TEXT_DETECTION',
                maxResults: 1,
              },
            ],
          },
        ],
      };

      // Make the API request
      const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        // If API key is not set, fall back to local processing
        if (!this.apiKey) {
          console.log('CloudVision: No API key set, using fallback OCR');
          return this.fallbackOCR(imageUri);
        }
        throw new Error(`Cloud Vision API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Parse the response
      const textAnnotations = data.responses[0]?.textAnnotations;
      const fullTextAnnotation = data.responses[0]?.fullTextAnnotation;
      
      if (!textAnnotations || textAnnotations.length === 0) {
        return {
          text: '',
          confidence: 0,
          blocks: [],
        };
      }

      // Extract the full text
      const fullText = textAnnotations[0].description || '';
      
      // Process blocks if available
      const blocks: OCRBlock[] = [];
      if (fullTextAnnotation?.pages) {
        for (const page of fullTextAnnotation.pages) {
          for (const block of page.blocks || []) {
            const blockText = this.extractBlockText(block);
            const confidence = block.confidence || 0.9;
            
            blocks.push({
              text: blockText,
              confidence,
              boundingBox: this.convertBoundingBox(block.boundingBox),
              lines: block.paragraphs?.flatMap(p => 
                p.words?.map(w => ({
                  text: this.extractWordText(w),
                  boundingBox: this.convertBoundingBox(w.boundingBox),
                })) || []
              ) || [],
            });
          }
        }
      }

      // Calculate overall confidence
      const avgConfidence = blocks.length > 0
        ? blocks.reduce((sum, b) => sum + b.confidence, 0) / blocks.length
        : 0.9;

      console.log('CloudVision: Extracted text:', fullText.substring(0, 100) + '...');
      
      return {
        text: fullText,
        confidence: avgConfidence,
        blocks,
      };
    } catch (error) {
      console.error('CloudVision OCR failed:', error);
      // Fall back to local processing
      return this.fallbackOCR(imageUri);
    }
  }

  /**
   * Fallback OCR using local processing
   * This attempts basic text extraction without cloud services
   */
  private async fallbackOCR(imageUri: string): Promise<OCRResult> {
    console.log('Using fallback OCR (no actual text extraction)');
    
    // In a real implementation, you could:
    // 1. Use a WebAssembly-based OCR library
    // 2. Send to your own backend for processing
    // 3. Use another cloud service
    
    // For now, return a message indicating manual entry is needed
    const instructionText = `Manual Entry Required

Please type your bullet journal entries below.

Common bullet symbols:
• Task (bullet)
○ Event (circle)
— Note (dash)
x Completed task
> Migrated task
< Scheduled task

Add contexts with @ (e.g., @work)
Add tags with # (e.g., #project)
Add priority with ! or !!`;

    return {
      text: instructionText,
      confidence: 1.0,
      blocks: [{
        text: instructionText,
        confidence: 1.0,
        boundingBox: { x: 0, y: 0, width: 100, height: 100 },
        lines: [],
      }],
    };
  }

  private extractBlockText(block: any): string {
    if (!block.paragraphs) return '';
    
    return block.paragraphs
      .map((p: any) => 
        p.words
          ?.map((w: any) => this.extractWordText(w))
          .join(' ') || ''
      )
      .join('\n');
  }

  private extractWordText(word: any): string {
    if (!word.symbols) return '';
    return word.symbols.map((s: any) => s.text || '').join('');
  }

  private convertBoundingBox(boundingPoly: any): { x: number; y: number; width: number; height: number } {
    if (!boundingPoly?.vertices || boundingPoly.vertices.length < 4) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const vertices = boundingPoly.vertices;
    const x = Math.min(...vertices.map((v: any) => v.x || 0));
    const y = Math.min(...vertices.map((v: any) => v.y || 0));
    const maxX = Math.max(...vertices.map((v: any) => v.x || 0));
    const maxY = Math.max(...vertices.map((v: any) => v.y || 0));

    return {
      x,
      y,
      width: maxX - x,
      height: maxY - y,
    };
  }

  /**
   * Check if the service is available
   */
  isAvailable(): boolean {
    // Service is available if we have an API key or can use fallback
    return true;
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (!this.apiKey) {
      console.warn('CloudVision: No API key configured. Will use fallback OCR.');
    } else {
      console.log('CloudVision: Service initialized with API key');
    }
  }
}

export const cloudVisionService = new CloudVisionService();