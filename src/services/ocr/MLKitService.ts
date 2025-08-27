import TextRecognition from '@react-native-ml-kit/text-recognition';
import { manipulateAsync, FlipType, SaveFormat } from 'expo-image-manipulator';
import { OCRResult, OCRBlock, OCRLine } from '../../types/BuJo';

export class MLKitService {
  /**
   * Process an image and extract text using ML Kit
   */
  async recognizeText(imageUri: string): Promise<OCRResult> {
    try {
      console.log('Processing image for OCR:', imageUri);
      
      // Enhance image for better OCR accuracy
      const enhancedImage = await this.enhanceImageForOCR(imageUri);
      
      // Perform text recognition
      const result = await TextRecognition.recognize(enhancedImage);
      
      console.log('OCR Result:', result.text);
      
      // Convert ML Kit result to our format
      return this.convertMLKitResult(result);
      
    } catch (error) {
      console.error('OCR processing failed:', error);
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }
  
  /**
   * Enhance image for better OCR accuracy
   */
  private async enhanceImageForOCR(imageUri: string): Promise<string> {
    try {
      const result = await manipulateAsync(
        imageUri,
        [
          // Resize to optimal width for OCR (1200px is sweet spot for ML Kit)
          { resize: { width: 1200 } }
        ],
        {
          compress: 0.8,
          format: SaveFormat.JPEG,
        }
      );
      
      return result.uri;
    } catch (error) {
      console.warn('Image enhancement failed, using original:', error);
      return imageUri;
    }
  }
  
  /**
   * Convert ML Kit result to our OCR format
   */
  private convertMLKitResult(mlResult: any): OCRResult {
    const blocks: OCRBlock[] = [];
    let overallConfidence = 0;
    let totalElements = 0;
    
    if (mlResult.blocks) {
      for (const block of mlResult.blocks) {
        const lines: OCRLine[] = [];
        
        if (block.lines) {
          for (const line of block.lines) {
            lines.push({
              text: line.text,
              boundingBox: {
                x: line.frame?.x || 0,
                y: line.frame?.y || 0,
                width: line.frame?.width || 0,
                height: line.frame?.height || 0
              }
            });
          }
        }
        
        blocks.push({
          text: block.text,
          confidence: this.calculateConfidence(block),
          boundingBox: {
            x: block.frame?.x || 0,
            y: block.frame?.y || 0,
            width: block.frame?.width || 0,
            height: block.frame?.height || 0
          },
          lines
        });
        
        overallConfidence += this.calculateConfidence(block);
        totalElements++;
      }
    }
    
    return {
      text: mlResult.text || '',
      confidence: totalElements > 0 ? overallConfidence / totalElements : 0,
      blocks
    };
  }
  
  /**
   * Calculate confidence score for a block
   * ML Kit doesn't always provide confidence, so we estimate based on content
   */
  private calculateConfidence(block: any): number {
    // If ML Kit provides confidence, use it
    if (block.confidence !== undefined) {
      return block.confidence;
    }
    
    // Estimate confidence based on text characteristics
    const text = block.text || '';
    let confidence = 0.7; // Base confidence
    
    // Increase confidence for longer, well-formed text
    if (text.length > 10) confidence += 0.1;
    if (/^[A-Za-z0-9\s\.\,\!\?\-]+$/.test(text)) confidence += 0.1;
    
    // Decrease confidence for very short or unusual text
    if (text.length < 3) confidence -= 0.2;
    if (/[^\w\s\.\,\!\?\-\•\○\—\>\<\*]/.test(text)) confidence -= 0.1;
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }
  
  /**
   * Check if ML Kit is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Try to recognize a simple test
      await TextRecognition.recognize('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
      return true;
    } catch (error) {
      console.warn('ML Kit not available:', error);
      return false;
    }
  }
}

export const mlKitService = new MLKitService();