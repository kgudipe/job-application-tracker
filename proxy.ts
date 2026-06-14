// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const PASSWORD   = process.env.APP_PASSWORD;
const COOKIE     = 'jt_auth';
const LOGIN_PATH = '/login';

export default function proxy(req: NextRequest) {
  // Skip if no password configured
  if (!PASSWORD) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // Always allow login page and all API routes
  if (pathname === LOGIN_PATH || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(COOKIE);
  if (cookie?.value === PASSWORD) return NextResponse.next();

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = LOGIN_PATH;
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};