import { getSignedUrl } from '@/lib/supabase/storage';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path');
  if (!path) return Response.json({ error: 'Missing path' }, { status: 400 });

  try {
    const url = await getSignedUrl(path);
    return Response.json({ url });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}