import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Check if credentials are valid and present
const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('...')
);

if (!isConfigured) {
  console.warn(
    '[GTC Supabase] Warning: Missing or placeholder VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.\n' +
    'Please configure your environment variables in .env to enable live database connectivity.'
  );
}

// Initialize Supabase client with safe fallback to prevent application crashes when env vars are missing
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export default supabase;
