import { User } from '../types';

// Using dynamic import with CDN for browser compatibility
let GoogleGenAI: any;

if (typeof window === 'undefined') {
  // Server-side import
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  GoogleGenAI = GoogleGenerativeAI;
} else {
  // Client-side: Load from CDN
  const script = document.createElement('script');
  script.src = 'https://www.gstatic.com/generative-ai-sdk/ai-generative-js-1.0.0.umd.js';
  script.async = true;
  document.head.appendChild(script);
  
  await new Promise<void>((resolve) => {
    script.onload = () => {
      if (window.google?.generativeai?.GoogleGenerativeAI) {
        GoogleGenAI = window.google.generativeai.GoogleGenerativeAI;
      } else {
        console.error('Google Generative AI SDK not loaded correctly');
      }
      resolve();
    };
    script.onerror = () => {
      console.error('Failed to load Google Generative AI SDK');
      resolve();
    };
  });
}

declare global {
  interface Window {
    google?: {
      generativeai: {
        GoogleGenerativeAI: any;
      };
    };
  }
}

interface ConceptInputs {
    name: string;
    category: string;
    faction: string;
    description: string;
}

export async function generateConcept(inputs: ConceptInputs, user: User): Promise<{ imageUrl: string, description: string }> {
    if (!process.env.API_KEY) {
        throw new Error("The Creator's Forge is cold. API_KEY is missing.");
    }
    // Initialize the Google Generative AI client
    const genAI = new GoogleGenAI(process.env.API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // --- Image Generation Prompt ---
    const imagePrompt = `Epic fantasy digital painting of a video game character concept named "${inputs.name}".
    Category: ${inputs.category}.
    Faction: ${inputs.faction}.
    Key Features: ${inputs.description}.
    Style: Detailed, high-resolution, dramatic lighting, concept art, fantasy, intricate details.`;

    // --- Text Generation Prompt ---
    const textPrompt = `Create a detailed character concept for a video game, based on the following details.
    Your response should be a compelling, well-written description suitable for a game's lore book or character selection screen.
    
    Character Name: "${inputs.name}"
    Character Category/Class: "${inputs.category}"
    Character Faction/Allegiance: "${inputs.faction}"
    Core Concept: "${inputs.description}"
    
    Flesh out the following aspects:
    1.  **Appearance:** Describe their visual details, clothing, and any notable features.
    2.  **Backstory:** Provide a brief but engaging history. What are their origins? What key events shaped them?
    3.  **Personality & Motivation:** What drives them? What is their general demeanor? Connect it to their "${user.path}" path and their dream to "${user.dream}".
    
    Keep the tone consistent with a high-fantasy, epic setting.`;

    try {
        console.log('[Creator Service] Generating text description...');
        
        // Generate text description using Gemini
        const textResponse = await model.generateContent(textPrompt);
        const description = (await textResponse.response).text();
        
        // For now, we'll use a placeholder image since we can't generate images directly
        // In a real implementation, you would use a separate image generation API
        const imageUrl = 'https://via.placeholder.com/300x400/1a1a2e/ffffff?text=Character+Image';
        
        console.log('[Creator Service] Generation complete');

        console.log('[Creator Service] Generation complete.');
        return { imageUrl, description };

    } catch (err) {
        console.error('[Creator AI Error]', err);
        if (err instanceof Error) {
            throw new Error(`The forge's fire has dimmed. There was a problem creating your concept. Details: ${err.message}`);
        }
        throw new Error('An unknown interference disrupted the creation process.');
    }
}
