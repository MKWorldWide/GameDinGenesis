import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages = [] } = await req.json();

    const contents = messages.map((m: { role: 'user'|'model', content: string }) => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${process.env.MODEL_ID ?? 'gemini-1.5-pro'}:generateContent?key=${process.env.GOOGLE_API_KEY}`;

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ contents })
    });

    if (!r.ok) {
      const error = await r.text();
      console.error('API Error:', error);
      return NextResponse.json({ error: 'Failed to generate content' }, { status: r.status });
    }

    const data = await r.json();
    return NextResponse.json(data);
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json(
      { error: e?.message ?? 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
}
