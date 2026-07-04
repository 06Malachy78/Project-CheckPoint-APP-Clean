import { NextResponse } from 'next/server';
import { searchUsers } from '@/lib/user-search';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();

  if (!query) {
    return NextResponse.json([]);
  }

  try {
    const users = await searchUsers(query, 6);
    return NextResponse.json(users);
  } catch (error) {
    console.error('User search API failed:', error);
    return NextResponse.json([], { status: 500 });
  }
}