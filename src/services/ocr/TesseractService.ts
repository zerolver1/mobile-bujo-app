import { OCRResult, OCRBlock } from '../../types/BuJo';
import Tesseract from 'tesseract.js';
import * as FileSystem from 'expo-file-system';

/**
 * Tesseract OCR Service for actual text extraction from images
 * Works entirely on-device without needing API keys
 */
class TesseractService {
  private worker: Tesseract.Worker | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      console.log('Tesseract: Initializing worker...');
      
      // Create a worker
      this.worker = await Tesseract.createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`Tesseract: ${Math.round(m.progress * 100)}% complete`);
          }
        },
      });
      
      this.isInitialized = true;
      console.log('Tesseract: Worker initialized successfully');
    } catch (error) {
      console.error('Tesseract: Failed to initialize:', error);
      throw error;
    }
  }

  async recognizeText(imageUri: string): Promise<OCRResult> {
    try {
      console.log('Tesseract: Processing image:', imageUri);
      
      // Ensure worker is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.worker) {
        throw new Error('Tesseract worker not initialized');
      }

      // For web/Expo, we need to fetch the image
      let imageData: string | ArrayBuffer;
      
      if (imageUri.startsWith('file://')) {
        // Read local file as base64
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        imageData = `data:image/png;base64,${base64}`;
      } else {
        // Use the URI directly (for web URLs)
        imageData = imageUri;
      }

      // Perform OCR
      const result = await this.worker.recognize(imageData);
      
      // Convert Tesseract result to our OCR format
      const blocks: OCRBlock[] = [];
      
      // Process blocks from Tesseract
      if (result.data.blocks) {
        for (const block of result.data.blocks) {
          if (block.text && block.text.trim()) {
            const blockObj: OCRBlock = {
              text: block.text.trim(),
              confidence: block.confidence / 100, // Convert to 0-1 scale
              boundingBox: {
                x: block.bbox.x0,
                y: block.bbox.y0,
                width: block.bbox.x1 - block.bbox.x0,
                height: block.bbox.y1 - block.bbox.y0,
              },
              lines: [],
            };

            // Add lines if available
            if (block.lines) {
              for (const line of block.lines) {
                if (line.text && line.text.trim()) {
                  blockObj.lines.push({
                    text: line.text.trim(),
                    boundingBox: {
                      x: line.bbox.x0,
                      y: line.bbox.y0,
                      width: line.bbox.x1 - line.bbox.x0,
                      height: line.bbox.y1 - line.bbox.y0,
                    },
                  });
                }
              }
            }

            blocks.push(blockObj);
          }
        }
      }

      const ocrResult: OCRResult = {
        text: result.data.text,
        confidence: result.data.confidence / 100, // Convert to 0-1 scale
        blocks,
      };

      console.log('Tesseract: Extracted text:', ocrResult.text.substring(0, 100) + '...');
      console.log('Tesseract: Confidence:', Math.round(ocrResult.confidence * 100) + '%');
      
      return ocrResult;
    } catch (error) {
      console.error('Tesseract OCR failed:', error);
      throw new Error(`OCR processing failed: ${error}`);
    }
  }

  /**
   * Check if the service is available
   */
  isAvailable(): boolean {
    return true;
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      console.log('Tesseract: Worker terminated');
    }
  }
}

export const tesseractService = new TesseractService();