import { EXTRACTION_PROMPT } from './prompt';

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';

export async function ollamaExtract(text: string) {
  const prompt = `${EXTRACTION_PROMPT}\n\n---\n\n${text}\n\nRespond with ONLY a JSON object with keys: email, phone, location. Use null for missing fields.`;

  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2',
      prompt,
      stream: false,
      format: 'json',
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json();
  return JSON.parse(data.response) as {
    email: string | null;
    phone: string | null;
    location: string | null;
  };
}