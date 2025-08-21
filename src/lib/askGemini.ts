export async function askGemini(prompt: string): Promise<string> {
  const r = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!r.ok) throw new Error(await r.text());
  const { text } = await r.json();
  return text ?? "";
}
