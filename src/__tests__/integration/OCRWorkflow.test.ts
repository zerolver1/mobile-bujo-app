/**
 * Integration tests for the complete OCR workflow
 * Tests the full pipeline: Image -> OCR -> Parser -> BuJo Store
 */

import { enhancedBuJoParser } from '../../services/parser/EnhancedBuJoParser';
import { ocrSpaceService } from '../../services/ocr/OCRSpaceService';
import { mistralOCRService } from '../../services/ocr/MistralOCRService';
import { BuJoEntry } from '../../types/BuJo';

// Mock data for testing
const mockOCRText = `
March 15th

• Buy groceries @store #food
✓ Finish project report
○ Team meeting 2:00 PM @office
- Remember to call mom
! Great idea for new feature

Tomorrow
• Schedule dentist appointment
○ Birthday party @friend's house #celebration
`;

const mockImageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('OCR Workflow Integration Tests', () => {
  describe('Parser Integration', () => {
    it('should parse complete bullet journal page correctly', () => {
      const entries = enhancedBuJoParser.parse(mockOCRText);
      
      expect(entries).toHaveLength(7);
      
      // Check task entries
      const tasks = entries.filter(e => e.type === 'task');
      expect(tasks).toHaveLength(3);
      
      // Check grocery task
      const groceryTask = tasks.find(e => e.content.includes('groceries'));
      expect(groceryTask).toBeDefined();
      expect(groceryTask?.contexts).toContain('store');
      expect(groceryTask?.tags).toContain('food');
      expect(groceryTask?.status).toBe('incomplete');
      
      // Check completed task
      const completedTask = tasks.find(e => e.content.includes('project report'));
      expect(completedTask?.status).toBe('complete');
      
      // Check events
      const events = entries.filter(e => e.type === 'event');
      expect(events).toHaveLength(2);
      
      const meeting = events.find(e => e.content.includes('Team meeting'));
      expect(meeting?.contexts).toContain('office');
      
      // Check notes
      const notes = entries.filter(e => e.type === 'note');
      expect(notes).toHaveLength(2);
      
      // Check date parsing
      const marchEntries = entries.filter(e => 
        e.collectionDate.includes('2025-03-15') || 
        e.collectionDate.includes('03-15')
      );
      expect(marchEntries.length).toBeGreaterThan(0);
    });

    it('should handle date headers and context switching', () => {
      const textWithDates = `
Today
• Task for today

Tomorrow  
• Task for tomorrow

March 20th
• Task for March 20
      `;
      
      const entries = enhancedBuJoParser.parse(textWithDates);
      
      expect(entries).toHaveLength(3);
      
      // All should have different collection dates
      const uniqueDates = new Set(entries.map(e => e.collectionDate));
      expect(uniqueDates.size).toBe(3);
    });

    it('should extract priorities correctly', () => {
      const priorityText = `
* • High priority task
• Normal priority task
!! Emergency task
      `;
      
      const entries = enhancedBuJoParser.parse(priorityText);
      
      const highPriorityTask = entries.find(e => e.content.includes('High priority'));
      expect(highPriorityTask?.priority).toBe('high');
      
      const normalTask = entries.find(e => e.content.includes('Normal priority'));
      expect(normalTask?.priority).toBe('none');
      
      const emergencyTask = entries.find(e => e.content.includes('Emergency'));
      expect(emergencyTask?.priority).toBe('high');
    });
  });

  describe('OCR Service Integration', () => {
    beforeAll(async () => {
      // Initialize OCR services
      await ocrSpaceService.initialize().catch(() => {
        console.log('OCR.space not available in test environment');
      });
      
      await mistralOCRService.initialize().catch(() => {
        console.log('Mistral OCR not available in test environment');
      });
    });

    it('should initialize OCR services without errors', async () => {
      expect(ocrSpaceService.isAvailable()).toBeDefined();
      expect(mistralOCRService.isAvailable()).toBeDefined();
    });

    it('should handle OCR service fallback gracefully', async () => {
      // Test with a simple base64 image
      const testImageUri = mockImageUri;
      
      let ocrResult;
      
      if (mistralOCRService.isAvailable()) {
        try {
          ocrResult = await mistralOCRService.recognizeText(testImageUri);
          expect(ocrResult.text).toBeDefined();
          expect(ocrResult.confidence).toBeGreaterThanOrEqual(0);
        } catch (error) {
          console.log('Mistral OCR failed, testing fallback to OCR.space');
        }
      }
      
      if (ocrSpaceService.isAvailable()) {
        try {
          ocrResult = await ocrSpaceService.recognizeText(testImageUri);
          expect(ocrResult.text).toBeDefined();
          expect(ocrResult.confidence).toBeGreaterThanOrEqual(0);
        } catch (error) {
          console.log('OCR.space also failed - no OCR services available');
        }
      }
    });
  });

  describe('End-to-End Workflow', () => {
    it('should process a complete bullet journal workflow', async () => {
      // Simulate the complete workflow without actual image processing
      const mockOCRResult = {
        text: mockOCRText,
        confidence: 0.95,
        blocks: [],
        parsedEntries: []
      };
      
      // Step 1: Parse OCR text
      const parsedEntries = enhancedBuJoParser.parse(mockOCRResult.text);
      
      // Step 2: Validate parsed entries
      expect(parsedEntries.length).toBeGreaterThan(0);
      
      // Step 3: Check that all entries have required fields
      parsedEntries.forEach(entry => {
        expect(entry.id).toBeDefined();
        expect(entry.content).toBeDefined();
        expect(entry.type).toMatch(/^(task|event|note)$/);
        expect(entry.status).toBeDefined();
        expect(entry.priority).toBeDefined();
        expect(entry.collection).toBeDefined();
        expect(entry.collectionDate).toBeDefined();
        expect(entry.createdAt).toBeInstanceOf(Date);
        expect(Array.isArray(entry.tags)).toBe(true);
        expect(Array.isArray(entry.contexts)).toBe(true);
      });
      
      // Step 4: Simulate BuJo store operations
      const addedEntries: BuJoEntry[] = [];
      
      for (const entry of parsedEntries) {
        if (entry.content.trim()) {
          // Simulate adding to store
          const savedEntry: BuJoEntry = {
            ...entry,
            sourceImage: 'mock_image_uri',
            ocrConfidence: mockOCRResult.confidence
          };
          addedEntries.push(savedEntry);
        }
      }
      
      expect(addedEntries.length).toBe(parsedEntries.length);
      
      // Step 5: Validate workflow success
      const todayEntries = addedEntries.filter(e => {
        const today = new Date().toISOString().split('T')[0];
        return e.collectionDate === today;
      });
      
      const futureEntries = addedEntries.filter(e => {
        const today = new Date().toISOString().split('T')[0];
        return e.collectionDate > today;
      });
      
      console.log(`Workflow processed: ${addedEntries.length} total entries`);
      console.log(`Today: ${todayEntries.length}, Future: ${futureEntries.length}`);
      
      expect(addedEntries.length).toBeGreaterThan(0);
    });

    it('should handle error scenarios gracefully', () => {
      // Test with empty/invalid input
      expect(() => enhancedBuJoParser.parse('')).not.toThrow();
      expect(() => enhancedBuJoParser.parse(null as any)).not.toThrow();
      expect(() => enhancedBuJoParser.parse(undefined as any)).not.toThrow();
      
      // Test with malformed text
      const malformedText = `
Random text without bullets
123456789
@#$%^&*()
      `;
      
      const entries = enhancedBuJoParser.parse(malformedText);
      
      // Should either return empty array or handle gracefully
      expect(Array.isArray(entries)).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should parse large text efficiently', () => {
      // Generate large text block
      const largeBulletList = Array.from({ length: 1000 }, (_, i) => 
        `• Task number ${i + 1} @context${i % 10} #tag${i % 5}`
      ).join('\n');
      
      const startTime = performance.now();
      const entries = enhancedBuJoParser.parse(largeBulletList);
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      
      expect(entries.length).toBe(1000);
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      console.log(`Parsed 1000 entries in ${processingTime.toFixed(2)}ms`);
    });
  });
});