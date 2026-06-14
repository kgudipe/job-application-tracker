import { geminiExtract } from './gemini';
import { ollamaExtract } from './ollama';
import { parsedResumeSchema } from '@/lib/validations';
import type { ParsedResumeResult } from '@/lib/types';

export async function parseResume(
  text: string,
  provider: 'gemini' | 'ollama',
): Promise<ParsedResumeResult> {
  const warnings: string[] = [];

  // ── Gemini ──
  if (provider === 'gemini') {
    try {
      const raw = await geminiExtract(text);
      const validated = parsedResumeSchema.parse(raw);
      return { ...validated, provider: 'gemini', warnings };
    } catch (err) {
      warnings.push(`Gemini failed: ${String(err)}`);
      // fall through to Ollama
    }
  }

  // ── Ollama ──
  try {
    const raw = await ollamaExtract(text);
    const validated = parsedResumeSchema.parse(raw);
    return { ...validated, provider: 'ollama', warnings };
  } catch (err) {
    warnings.push(`Ollama failed: ${String(err)}`);
  }

  // ── Manual fallback ──
  return {
    email: null,
    phone: null,
    location: null,
    provider: 'manual',
    warnings,
    needsManualEntry: true,
  };
}