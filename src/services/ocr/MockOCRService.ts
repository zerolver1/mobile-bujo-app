import { OCRResult, OCRBlock, OCRLine } from '../../types/BuJo';

/**
 * Mock OCR Service for testing without ML Kit
 * In production, this would be replaced with a cloud OCR service
 */
class MockOCRService {
  async recognizeText(imageUri: string): Promise<OCRResult> {
    console.log('MockOCR: Processing image:', imageUri);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate mock bullet journal text
    const mockText = `Daily Log - ${new Date().toLocaleDateString()}

• Complete project presentation @work #presentation
• Meeting with Sarah at 2pm @office
○ Team standup meeting 10am
— Remember to review Q3 goals
• Buy groceries @home #personal
x Completed morning workout
> Migrated budget review to tomorrow
• Call dentist for appointment #health !
• Review pull requests @work
○ Company all-hands 3pm
• Plan weekend trip #travel !!
< Scheduled code review for Friday
— Ideas for new blog post
• Finish reading Deep Work #reading
• Update expense report @work !`;

    // Create mock OCR blocks with bounding boxes
    const lines = mockText.split('\n');
    const blocks: OCRBlock[] = [];
    
    let currentY = 50;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim()) {
        const block: OCRBlock = {
          text: lines[i],
          confidence: 0.85 + Math.random() * 0.15, // 85-100% confidence
          boundingBox: {
            x: 20,
            y: currentY,
            width: 350,
            height: 30
          },
          lines: [{
            text: lines[i],
            boundingBox: {
              x: 20,
              y: currentY,
              width: 350,
              height: 30
            }
          }]
        };
        blocks.push(block);
        currentY += 35;
      }
    }

    const result: OCRResult = {
      text: mockText,
      confidence: 0.92,
      blocks
    };

    console.log('MockOCR: Extracted text:', result.text.substring(0, 100) + '...');
    return result;
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
    console.log('MockOCR: Service initialized');
  }
}

export const mockOCRService = new MockOCRService();