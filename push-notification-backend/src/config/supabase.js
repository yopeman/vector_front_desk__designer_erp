import { createClient } from '@supabase/supabase-js';

import { config } from './index.js';

/**
 * Supabase client built with the service-role key so the backend can read and
 * write the device registry without row level security applying.
 */
export const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export function table(name = config.supabase.devicesTable) {
  return supabase.schema(config.supabase.schema).from(name);
}

/**
 * Supabase resolves with `{ data, error }` instead of throwing, so every model
 * call funnels through here and returns real exceptions to the service layer.
 */
export async function execute(queryBuilder) {
  const { data, error } = await queryBuilder;

  if (error) {
    throw Object.assign(new Error(`[supabase] ${error.message}`), {
      status: error.status ?? 500,
      details: error.details,
    });
  }

  return data;
}