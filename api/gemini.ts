// Vercel serverless function (Edge-friendly variant)
export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get API key from environment or request header
  const apiKey = process.env.GEMINI_API_KEY || req.headers.get('x-api-key') || '';
  console.log('API Key present:', !!apiKey);
  
  if (!apiKey) {
    const errorMsg = 'API key is required. Please provide a valid API key in the \'x-api-key\' header or set GEMINI_API_KEY in your environment variables.';
    console.error(errorMsg);
    return new Response(JSON.stringify({ 
      error: errorMsg,
      help: 'Make sure your .env.local file contains GEMINI_API_KEY=your_api_key_here'
    }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Parse request body
  let prompt: string;
  try {
    const body = await req.json();
    if (!body.prompt || typeof body.prompt !== 'string') {
      throw new Error("Missing or invalid 'prompt' in request body");
    }
    prompt = body.prompt;
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Invalid request body" 
    }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const body = {
    contents: [{ parts: [{ text: prompt }]}] as const,
  };

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const responseData = await resp.json();
    
    if (!resp.ok) {
      console.error('Gemini API Error:', responseData);
      return new Response(JSON.stringify({ 
        error: responseData?.error?.message || 'Failed to process request',
        details: responseData?.error?.details 
      }), { 
        status: resp.status,
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Extract plain text response defensively
    const text = responseData?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p.text ?? "")
      .join("\n")
      .trim() || "No response generated";
      
    return new Response(JSON.stringify({ text }), { 
      headers: { "Content-Type": "application/json" } 
    });
    
  } catch (error) {
    console.error('Error in Gemini API handler:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
