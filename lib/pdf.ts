import { extractText } from 'unpdf';

export async function extractPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(buffer);
  const { text } = await extractText(uint8, { mergePages: true });
  // Truncate to ~first 4000 chars — contact info is always on page 1
  return text.slice(0, 4000).trim();
}