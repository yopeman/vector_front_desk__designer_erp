import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'
  );
}

// Custom storage adapter with admin-specific key
const adminStorage = {
  getItem: (key) => {
    const adminKey = key.replace('sb-', 'sb-admin-');
    return localStorage.getItem(adminKey);
  },
  setItem: (key, value) => {
    const adminKey = key.replace('sb-', 'sb-admin-');
    localStorage.setItem(adminKey, value);
  },
  removeItem: (key) => {
    const adminKey = key.replace('sb-', 'sb-admin-');
    localStorage.removeItem(adminKey);
  },
};

export const supabaseAdmin = createClient(
  supabaseUrl || 'http://127.0.0.1:54321',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  {
    auth: {
      storage: adminStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
