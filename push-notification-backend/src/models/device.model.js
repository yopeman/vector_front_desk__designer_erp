import { execute, table } from '../config/supabase.js';

const COLUMNS = 'id, token, platform, user_id, created_at, updated_at';

const toDevice = (row) => ({
  id: row.id,
  token: row.token,
  platform: row.platform,
  userId: row.user_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Upserts on the unique `token` column so re-registering a device refreshes
 * `updated_at` instead of creating a duplicate row.
 */
export function findOrCreateDevice({ token, platform, userId }) {
  return execute(
    table()
      .upsert(
        {
          token,
          platform,
          user_id: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'token' },
      )
      .select(COLUMNS)
      .maybeSingle(),
  ).then(toDevice);
}

export function selectDevices({ userId } = {}) {
  let query = table().select(COLUMNS).order('updated_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  return execute(query).then((rows) => rows.map(toDevice));
}

export function deleteDevice(token) {
  return execute(table().delete().eq('token', token).select('token')).then(
    (rows) => rows.length > 0,
  );
}

export function deleteDevices(tokens) {
  if (tokens.length === 0) {
    return Promise.resolve([]);
  }

  return execute(table().delete().in('token', tokens).select('token')).then((rows) =>
    rows.map((row) => row.token),
  );
}

export async function countDevices() {
  const { count, error } = await table().select('id', { count: 'exact', head: true });

  if (error) {
    throw Object.assign(new Error(`[supabase] ${error.message}`), { status: 500 });
  }

  return count ?? 0;
}