import { test, expect } from '@playwright/test';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Test API key - in a real project, this would be in an environment variable
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || '';

// Skip tests if no API key is available
const testWithApiKey = GEMINI_API_KEY ? test : test.skip;

// Create a test suite for Gemini API integration
const geminiTestSuite = () => {
  let genAI: GoogleGenerativeAI;
  let model: any; // Using any to avoid type issues with the model

  test.beforeAll(() => {
    if (!GEMINI_API_KEY) {
      console.warn('No GEMINI_API_KEY found. Skipping API tests.');
      return;
    }
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  });

  test('should connect to Gemini API', async () => {
    if (!GEMINI_API_KEY) return;
    
    const prompt = 'Hello, Gemini! Respond with "I am working!" if you can hear me.';
    
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = await response.text();
      
      expect(text.toLowerCase()).toContain('i am working');
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  });

  test('should generate character concept', async () => {
    if (!GEMINI_API_KEY) return;
    
    const conceptPrompt = `Generate a character concept for a fantasy RPG with the following details:
    - Name: Test Character
    - Class: Warrior
    - Faction: The Eternal Guard
    - Description: A brave warrior from the northern mountains`;

    try {
      const result = await model.generateContent(conceptPrompt);
      const response = await result.response;
      const text = await response.text();
      
      // Basic validation of the response
      expect(text.toLowerCase()).toContain('test character');
      expect(text.length).toBeGreaterThan(50);
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  });
};

// Run the test suite only if we have an API key
if (GEMINI_API_KEY) {
  geminiTestSuite();
} else {
  test('Skipping Gemini API tests - No API key provided', () => {
    console.warn('Skipping Gemini API tests - No VITE_GEMINI_API_KEY environment variable set');
  });
}
