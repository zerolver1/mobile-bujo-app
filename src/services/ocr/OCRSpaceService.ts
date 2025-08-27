import { OCRResult, OCRBlock } from '../../types/BuJo';
import * as FileSystem from 'expo-file-system';

/**
 * OCR.space Service for actual text extraction from images
 * Free OCR API that works with Expo managed workflow
 */
class OCRSpaceService {
  private apiKey: string;
  private apiEndpoint = 'https://api.ocr.space/parse/image';

  constructor() {
    // Free API key for OCR.space - you can get your own at https://ocr.space/ocrapi
    // This is a demo key with 25,000 requests/month limit
    this.apiKey = 'K87899142388957'; // Public test key
  }

  async recognizeText(imageUri: string): Promise<OCRResult> {
    try {
      console.log('OCRSpace: Processing image:', imageUri);
      
      // Read the image as base64
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create form data
      const formData = new FormData();
      formData.append('apikey', this.apiKey);
      formData.append('base64Image', `data:image/png;base64,${base64Image}`);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'true'); // Get word positions
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2'); // Engine 2 is better for handwriting

      // Make the API request
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`OCR API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.ParsedResults || data.ParsedResults.length === 0) {
        console.log('OCRSpace: No text found in image');
        return {
          text: '',
          confidence: 0,
          blocks: [],
        };
      }

      const result = data.ParsedResults[0];
      
      if (result.ErrorMessage) {
        throw new Error(`OCR error: ${result.ErrorMessage}`);
      }

      // Extract the text
      const fullText = result.ParsedText || '';
      
      // Process text overlay for blocks
      const blocks: OCRBlock[] = [];
      if (result.TextOverlay?.Lines) {
        for (const line of result.TextOverlay.Lines) {
          if (line.LineText && line.LineText.trim()) {
            blocks.push({
              text: line.LineText,
              confidence: 0.9, // OCR.space doesn't provide confidence per line
              boundingBox: {
                x: line.MinTop || 0,
                y: line.MaxHeight || 0,
                width: Math.abs((line.MaxWidth || 100) - (line.MinTop || 0)),
                height: Math.abs((line.MaxHeight || 30) - (line.MinHeight || 0)),
              },
              lines: line.Words?.map((word: any) => ({
                text: word.WordText || '',
                boundingBox: {
                  x: word.Left || 0,
                  y: word.Top || 0,
                  width: word.Width || 50,
                  height: word.Height || 20,
                },
              })) || [],
            });
          }
        }
      } else {
        // If no overlay data, create blocks from lines of text
        const lines = fullText.split('\n').filter(line => line.trim());
        for (let i = 0; i < lines.length; i++) {
          blocks.push({
            text: lines[i],
            confidence: 0.9,
            boundingBox: {
              x: 20,
              y: 50 + (i * 30),
              width: 350,
              height: 25,
            },
            lines: [],
          });
        }
      }

      console.log('OCRSpace: Extracted text:', fullText.substring(0, 100) + '...');
      
      return {
        text: fullText,
        confidence: 0.9, // OCR.space doesn't provide overall confidence
        blocks,
      };
    } catch (error) {
      console.error('OCRSpace failed:', error);
      // Return empty result with instructions
      return {
        text: 'Could not extract text from image. Please ensure:\n• Good lighting\n• Clear handwriting\n• High contrast',
        confidence: 0,
        blocks: [],
      };
    }
  }

  /**
   * Check if the service is available
   */
  isAvailable(): boolean {
    return true;
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    console.log('OCRSpace: Service ready (no initialization needed)');
  }

  /**
   * No cleanup needed for this service
   */
  async cleanup(): Promise<void> {
    // Nothing to clean up
  }
}

export const ocrSpaceService = new OCRSpaceService();