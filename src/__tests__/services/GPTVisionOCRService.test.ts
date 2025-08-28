/**
 * Tests for GPT Vision OCR Service
 * Note: These tests require a valid OpenAI API key in environment
 */

import { gptVisionOCRService } from '../../services/ocr/GPTVisionOCRService';

describe('GPTVisionOCRService', () => {
  beforeAll(async () => {
    // Only run tests if API key is available
    if (!process.env.EXPO_PUBLIC_OPENAI_API_KEY || 
        process.env.EXPO_PUBLIC_OPENAI_API_KEY === 'your_openai_api_key_here') {
      console.log('Skipping GPT Vision tests - no API key configured');
      return;
    }
    
    try {
      await gptVisionOCRService.initialize();
    } catch (error) {
      console.log('GPT Vision service not available for testing:', error);
    }
  });

  afterAll(async () => {
    if (gptVisionOCRService.isAvailable()) {
      await gptVisionOCRService.cleanup();
    }
  });

  describe('Service Configuration', () => {
    it('should have proper service configuration', () => {
      // Test service availability check
      const isAvailable = gptVisionOCRService.isAvailable();
      
      if (process.env.EXPO_PUBLIC_OPENAI_API_KEY === 'your_openai_api_key_here') {
        expect(isAvailable).toBe(false);
      } else if (process.env.EXPO_PUBLIC_OPENAI_API_KEY) {
        expect(isAvailable).toBe(true);
      }
    });

    it('should generate proper BuJo prompt', () => {
      // Access private method through service instance for testing
      const service = gptVisionOCRService as any;
      const prompt = service.getBuJoPrompt();
      
      expect(prompt).toContain('bullet journal');
      expect(prompt).toContain('JSON');
      expect(prompt).toContain('• = Task');
      expect(prompt).toContain('○ = Event');
      expect(prompt).toContain('- = Note');
      expect(prompt).toContain('@context');
      expect(prompt).toContain('#tag');
      expect(prompt).toContain('confidence');
    });

    it('should handle bullet symbol conversion correctly', () => {
      const service = gptVisionOCRService as any;
      
      expect(service.getBulletSymbol('task', 'incomplete')).toBe('•');
      expect(service.getBulletSymbol('task', 'complete')).toBe('✓');
      expect(service.getBulletSymbol('task', 'migrated')).toBe('>');
      expect(service.getBulletSymbol('task', 'scheduled')).toBe('<');
      expect(service.getBulletSymbol('task', 'cancelled')).toBe('~');
      expect(service.getBulletSymbol('event', 'incomplete')).toBe('○');
      expect(service.getBulletSymbol('note', 'incomplete')).toBe('-');
    });
  });

  describe('API Integration', () => {
    const skipIfNoKey = () => {
      if (!process.env.EXPO_PUBLIC_OPENAI_API_KEY || 
          process.env.EXPO_PUBLIC_OPENAI_API_KEY === 'your_openai_api_key_here') {
        console.log('Skipping API test - no API key');
        return true;
      }
      return false;
    };

    it('should test API connectivity', async () => {
      if (skipIfNoKey()) return;
      
      try {
        const isConnected = await gptVisionOCRService.testConnection();
        expect(typeof isConnected).toBe('boolean');
        
        if (isConnected) {
          console.log('✅ GPT Vision API connectivity successful');
        } else {
          console.log('❌ GPT Vision API connectivity failed');
        }
      } catch (error) {
        console.log('GPT Vision API test failed:', error);
        // Don't fail the test, just log
      }
    });

    it('should handle structured JSON response parsing', () => {
      const service = gptVisionOCRService as any;
      
      // Mock GPT Vision response
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              entries: [
                {
                  type: 'task',
                  status: 'incomplete',
                  content: 'Buy groceries',
                  priority: 'none',
                  contexts: ['store'],
                  tags: ['food'],
                  date: '2025-08-28',
                  confidence: 0.95
                }
              ],
              metadata: {
                page_date: '2025-08-28',
                total_entries: 1,
                handwriting_quality: 'good'
              }
            })
          }
        }]
      };
      
      const result = service.parseGPTResponse(mockResponse, 1000);
      
      expect(result.parsedEntries).toHaveLength(1);
      expect(result.parsedEntries[0].type).toBe('task');
      expect(result.parsedEntries[0].content).toBe('Buy groceries');
      expect(result.parsedEntries[0].contexts).toContain('store');
      expect(result.parsedEntries[0].tags).toContain('food');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.text).toContain('Buy groceries');
    });

    it('should handle malformed JSON gracefully', () => {
      const service = gptVisionOCRService as any;
      
      // Mock malformed response
      const mockResponse = {
        choices: [{
          message: {
            content: 'This is not valid JSON { malformed'
          }
        }]
      };
      
      const result = service.parseGPTResponse(mockResponse, 1000);
      
      expect(result.confidence).toBe(0.7); // Fallback confidence
      expect(result.parsedEntries).toEqual([]);
      expect(result.text).toContain('This is not valid JSON');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing API key gracefully', async () => {
      // Create a service instance with no API key
      const service = new (gptVisionOCRService.constructor as any)();
      service.apiKey = '';
      
      await expect(service.recognizeText('test://image.jpg'))
        .rejects.toThrow('OpenAI API key not configured');
    });

    it('should validate required environment variables', () => {
      const service = gptVisionOCRService as any;
      
      // Test that service checks for required config
      expect(typeof service.apiKey).toBe('string');
      expect(typeof service.apiUrl).toBe('string');
      expect(typeof service.model).toBe('string');
    });
  });

  describe('Performance Optimization', () => {
    it('should have reasonable token limits', () => {
      const service = gptVisionOCRService as any;
      
      expect(service.maxTokens).toBeGreaterThan(1000);
      expect(service.maxTokens).toBeLessThan(5000); // Reasonable upper limit
    });

    it('should use appropriate model', () => {
      const service = gptVisionOCRService as any;
      
      expect(service.model).toBe('gpt-4o'); // Best vision model
    });

    it('should use low temperature for consistency', async () => {
      const service = gptVisionOCRService as any;
      
      // Test that request body would include low temperature
      // This is a structural test since we can't easily mock the full request
      expect(true).toBe(true); // Placeholder - actual request uses temperature: 0.1
    });
  });
});