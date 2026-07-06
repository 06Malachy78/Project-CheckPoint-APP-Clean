import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/admin';

function normalizeUsername(value) {
  return (value || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20);
}

export async function POST(request) {
  let payload = {};
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  const identifier = (payload?.identifier || '').toString().trim();
  if (!identifier) {
    return NextResponse.json({ error: 'Missing login identifier.' }, { status: 400 });
  }

  if (identifier.includes('@')) {
    return NextResponse.json({ email: identifier });
  }

  const normalizedUsername = normalizeUsername(identifier);
  if (!normalizedUsername) {
    return NextResponse.json({ error: 'Invalid login identifier.' }, { status: 400 });
  }

  const adminSupabase = createAdminClient();
  if (!adminSupabase) {
    return NextResponse.json(
      { error: 'Username login is not configured on this server.' },
      { status: 500 }
    );
  }

  const { data: profile, error: profileError } = await adminSupabase
    .from('profiles')
    .select('id')
    .eq('username', normalizedUsername)
    .maybeSingle();

  if (profileError || !profile?.id) {
    return NextResponse.json({ error: 'Invalid username/email or password.' }, { status: 401 });
  }

  const { data: userData, error: userError } = await adminSupabase.auth.admin.getUserById(profile.id);
  const resolvedEmail = userData?.user?.email || '';

  if (userError || !resolvedEmail) {
    return NextResponse.json({ error: 'Invalid username/email or password.' }, { status: 401 });
  }

  return NextResponse.json({ email: resolvedEmail });
}