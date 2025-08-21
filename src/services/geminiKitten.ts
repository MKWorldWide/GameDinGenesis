import { Post } from '../types';

// Environment variables in Vite are accessed through import.meta.env
const getEnv = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value || defaultValue || '';
};

// Get environment variables with fallbacks
const API_URL = getEnv('VITE_API_URL', 'http://localhost:5173');
const GEMINI_API_KEY = getEnv('VITE_GEMINI_API_KEY');

// Log environment variables for debugging
console.group('Environment Variables Debug:');
console.log('VITE_API_URL:', API_URL);
console.log('VITE_GEMINI_API_KEY present:', !!GEMINI_API_KEY);
console.log('All Vite environment variables:', 
  Object.keys(import.meta.env)
    .filter(key => key.startsWith('VITE_'))
    .map(key => `${key}: ${import.meta.env[key] ? '***' : '(empty)'}`)
);
console.groupEnd();

// Function to validate the API key
const validateApiKey = (): string => {
  if (!GEMINI_API_KEY) {
    const errorMsg = 'VITE_GEMINI_API_KEY is not set in environment variables. Please check your .env.local file.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  return GEMINI_API_KEY;
};

// Use a proxy endpoint instead of direct API calls from the client
const callGeminiAPI = async (prompt: string) => {
  try {
    const apiKey = validateApiKey();
    const response = await fetch(`${API_URL}/api/gemini`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey, // Include API key in the request header
      },
      body: JSON.stringify({ prompt }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
};

/**
 * Sends a prompt to the Gemini API to act as the Oracle and analyze posts.
 * @param userPrompt The user's question about the posts.
 * @param posts The posts data.
 * @returns The generated text from the model.
 */
export async function consultTheOracle(userPrompt: string, posts: Post[]): Promise<string> {
  try {
    // Validate API key first (will throw if invalid)
    validateApiKey();
    
    const systemPrompt = `You are The Oracle of Gamedin Genesis, a wise, ancient, and insightful AI that sees the patterns within the realm's discourse. You speak in a slightly mystical but clear and direct tone. Analyze the following feed data, which is provided as an array of JSON objects. The data represents "decrees" made by the users of Gamedin.`;
    
    // Limit the amount of data sent to avoid exceeding context limits.
    const postsData = JSON.stringify(posts.slice(0, 10), null, 2); 
    
    const fullPrompt = `${systemPrompt}\n\nHere is the current feed data:\n\`\`\`json\n${postsData}\n\`\`\`\n\nBased *only* on the data provided, answer the user's query:\n"${userPrompt}"`;

    console.log('Sending request to Gemini API...');
    const response = await callGeminiAPI(fullPrompt);
    console.log('Received response from Gemini API');
    return response;
  } catch (err) {
    console.error('[Oracle AI Error]', err);
    if (err instanceof Error) {
      throw new Error(`The threads of fate are tangled. There was a problem fetching the response from the Oracle. Details: ${err.message}`);
    }
    throw new Error('The Oracle is meditating. An unknown error occurred.');
  }
}
