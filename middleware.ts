// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const PASSWORD  = process.env.APP_PASSWORD;
const COOKIE    = 'jt_auth';
const LOGIN_PATH = '/login';

export function middleware(req: NextRequest) {
  // Skip if no password is configured
  if (!PASSWORD) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // Always allow the login page and api routes through
  if (pathname === LOGIN_PATH || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(COOKIE);
  if (cookie?.value === PASSWORD) return NextResponse.next();

  // Redirect to login
  const url = req.nextUrl.clone();
  url.pathname = LOGIN_PATH;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};