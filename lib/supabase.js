'use client';

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ✅ Export a single, pre-initialized instance of the Supabase client
// Uses cookies for session storage so server components can access the session
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);