import { GoogleGenerativeAI } from '@google/generative-ai';
import { Post, User } from '../types';
import { getRolePermissions } from '../utils/permissions';

// Get the API key from environment variables
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Validate API key on module load
if (!GEMINI_API_KEY) {
  console.error('Gemini API Key is missing. Please check your .env.local file.');
  throw new Error("The Oracle's connection is severed. VITE_GEMINI_API_KEY is missing from environment variables.");
}

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Log environment status (without exposing the actual key)
console.log('Gemini API Status:', GEMINI_API_KEY ? 'Configured' : 'Not Configured');

/**
 * Sends a prompt to the Gemini API to act as the Oracle and analyze posts.
 * @param userPrompt The user's question about the posts.
 * @param posts The posts data.
 * @param user The current user making the request.
 * @returns The generated text from the model.
 */
export async function consultTheOracle(userPrompt: string, posts: Post[], user?: User): Promise<string> {
  // Get user context for the prompt
  const userContext = user ? `
  User Context:
  - Name: ${user.displayName || 'Anonymous'}
  - Role: ${user.role || 'guest'}
  ` : '';

  const systemPrompt = `You are The Oracle of Gamedin Genesis, a wise, ancient, and insightful AI that sees the patterns within the realm's discourse. You speak in a slightly mystical but clear and direct tone. 
  
  ${userContext}
  
  Analyze the following feed data, which is provided as an array of JSON objects. The data represents "decrees" made by the users of Gamedin.`;
  
  // Limit the amount of data sent to avoid exceeding context limits.
  const postsData = JSON.stringify(posts.slice(0, 10), null, 2); 
  
  const fullPrompt = `${systemPrompt}\n\nHere is the current feed data:\n\`\`\`json\n${postsData}\n\`\`\`\n\nBased *only* on the data provided, answer the user's query:\n"${userPrompt}"`;

  try {
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = await response.text();
    
    if (!text) {
      throw new Error('The Oracle returned an empty response. The threads of fate are silent.');
    }
    
    return text;
  } catch (error) {
    console.error('[Oracle AI Error]', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key not valid') || error.message.includes('quota')) {
        throw new Error('The Oracle cannot be reached. The connection to the divine has been severed.');
      }
      throw new Error(`The threads of fate are tangled. ${error.message}`);
    }
    
    throw new Error('The Oracle is meditating. An unknown error occurred.');
  }
}
