import { NextRequest } from 'next/server';
import { extractPdfText } from '@/lib/pdf';
import { parseResume } from '@/lib/ai/parse-resume';

export const maxDuration = 60;

// Simple in-memory rate limit: max 10 parse calls per minute
const callLog: number[] = [];
const RATE_LIMIT = 10;
const WINDOW_MS  = 60_000;

function isRateLimited(): boolean {
  const now = Date.now();
  // Drop entries outside the window
  while (callLog.length && callLog[0] < now - WINDOW_MS) callLog.shift();
  if (callLog.length >= RATE_LIMIT) return true;
  callLog.push(now);
  return false;
}

export async function POST(req: NextRequest) {
  if (isRateLimited()) {
    return Response.json(
      { error: 'Too many parse requests. Please wait a moment.' },
      { status: 429 },
    );
  }

  let file: File;
  let provider: 'gemini' | 'ollama' = 'gemini';

  try {
    const form = await req.formData();
    file = form.get('file') as File;
    const p = form.get('provider');
    if (p === 'ollama') provider = 'ollama';
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!file || typeof file === 'string') {
    return Response.json({ error: 'No file provided.' }, { status: 400 });
  }

  // Validate MIME + magic bytes + size
  if (file.type !== 'application/pdf') {
    return Response.json({ error: 'Only PDF files are accepted.' }, { status: 400 });
  }
  if (file.size > 5_000_000) {
    return Response.json({ error: 'File must be under 5 MB.' }, { status: 400 });
  }

  const headerBytes = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const magic = String.fromCharCode(...headerBytes);
  if (!magic.startsWith('%PDF')) {
    return Response.json({ error: 'File does not appear to be a valid PDF.' }, { status: 400 });
  }

  try {
    const text = await extractPdfText(file);
    if (!text.trim()) {
      return Response.json({
        email: null, phone: null, location: null,
        provider: 'manual', warnings: ['PDF appears to have no extractable text (scanned?).'],
        needsManualEntry: true,
      });
    }

    const result = await parseResume(text, provider);
    return Response.json(result);
  } catch (err) {
    console.error('[parse-resume]', err);
    return Response.json({ error: 'Parsing failed. Please try again.' }, { status: 500 });
  }
}