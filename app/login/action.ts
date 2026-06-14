// app/login/action.ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const password = formData.get('password') as string;
  const cookieStore = await cookies();

  if (password === process.env.APP_PASSWORD) {
    cookieStore.set('jt_auth', password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    redirect('/');
  }

  redirect('/login?error=1');
}