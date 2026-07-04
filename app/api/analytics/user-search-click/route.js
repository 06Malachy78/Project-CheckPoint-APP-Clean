import { NextResponse } from 'next/server';
import { trackUserSearchClick, getUserSearchClickCount } from '@/lib/user-search-analytics';

function isSafeRedirectPath(redirectPath) {
  return typeof redirectPath === 'string' && redirectPath.startsWith('/') && !redirectPath.startsWith('//');
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username')?.trim() || '';
  const source = searchParams.get('source')?.trim() || 'search';
  const query = searchParams.get('q')?.trim() || '';
  const redirect = searchParams.get('redirect')?.trim() || '';

  if (!username) {
    return NextResponse.json({ error: 'Missing username.' }, { status: 400 });
  }

  await trackUserSearchClick({ username, source, query });

  if (isSafeRedirectPath(redirect)) {
    return NextResponse.redirect(new URL(redirect, request.url));
  }

  const count = await getUserSearchClickCount(username);
  return NextResponse.json({ ok: true, username: username.toLowerCase(), count });
}

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const username = payload?.username?.toString().trim() || '';
  const source = payload?.source?.toString().trim() || 'search';
  const query = payload?.query?.toString().trim() || '';

  if (!username) {
    return NextResponse.json({ error: 'Missing username.' }, { status: 400 });
  }

  const result = await trackUserSearchClick({ username, source, query });
  const count = await getUserSearchClickCount(username);

  return NextResponse.json({ ok: result.ok, provider: result.provider || 'none', username: username.toLowerCase(), count });
}