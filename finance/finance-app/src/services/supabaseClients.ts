import { createClient } from '@supabase/supabase-js';

// Finance Client (read-write) - uses Frontdesk database
export const financeClient = createClient(
  import.meta.env.VITE_FINANCE_URL,
  import.meta.env.VITE_FINANCE_ANON_KEY
);

// HR Client (read-only)
export const hrClient = createClient(
  import.meta.env.VITE_HR_URL,
  import.meta.env.VITE_HR_ANON_KEY
);

// Store Client (read-only)
export const storeClient = createClient(
  import.meta.env.VITE_STORE_URL,
  import.meta.env.VITE_STORE_ANON_KEY
);

// Frontdesk Client (read-only)
export const frontdeskClient = createClient(
  import.meta.env.VITE_FRONTDESK_URL,
  import.meta.env.VITE_FRONTDESK_ANON_KEY
);
