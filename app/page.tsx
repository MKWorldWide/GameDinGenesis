'use client';
import { useState } from 'react';

type Msg = { role:'user'|'model'; content:string };

export default function Home() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!input.trim() || busy) return;
    const next = [...msgs, { role:'user', content: input }];
    setMsgs(next); setInput(''); setBusy(true);
    try {
      const res = await fetch('/api/chat', {
        method:'POST', 
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ messages: next })
      });
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '[no response]';
      setMsgs(prev => [...prev, { role:'model', content:text }]);
    } catch (e:any) {
      setMsgs(prev => [...prev, { role:'model', content:`[error] ${e?.message ?? e}` }]);
    } finally { 
      setBusy(false); 
    }
  }

  return (
    <main style={{maxWidth:720,margin:'3rem auto',padding:24}}>
      <h1>GameDin • Genesis</h1>
      <p>Prototype chat powered by Google AI Studio via a secure Vercel API route.</p>

      <div style={{border:'1px solid #ddd',borderRadius:8,padding:16,minHeight:220}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{margin:'8px 0'}}>
            <b>{m.role === 'user' ? 'You' : 'AI'}:</b> {m.content}
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:8,marginTop:12}}>
        <input
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter') send(); }}
          placeholder="Type your message…"
          style={{flex:1,padding:12,border:'1px solid #ddd',borderRadius:8}}
        />
        <button onClick={send} disabled={busy} style={{padding:'12px 16px',borderRadius:8}}>
          {busy ? '…' : 'Send'}
        </button>
      </div>
    </main>
  );
}
