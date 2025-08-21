import React, { useState } from "react";
import { askGemini } from "@/lib/askGemini";

const GeminiPage = () => {
  const [q, setQ] = useState("Say hi to my queen.");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const go = async () => {
    setBusy(true); 
    setErr(null);
    try { 
      const response = await askGemini(q);
      setOut(response); 
    } catch (e: any) { 
      setErr(e?.message ?? String(e)); 
    } finally { 
      setBusy(false); 
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Gemini • Web</h1>
      <p className="text-gray-500 mb-6">Ask anything to Gemini AI</p>

      <textarea
        value={q}
        onChange={e => setQ(e.target.value)}
        rows={4}
        placeholder="Ask anything…"
        className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      
      <button 
        onClick={go} 
        disabled={busy} 
        className={`px-4 py-2 rounded-lg text-white font-medium ${
          busy 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {busy ? "Asking…" : "Ask Gemini"}
      </button>

      {err && (
        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg">
          <pre className="whitespace-pre-wrap">{err}</pre>
        </div>
      )}
      
      {out && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <pre className="whitespace-pre-wrap">{out}</pre>
        </div>
      )}
    </div>
  );
};

export default GeminiPage;
