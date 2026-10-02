import { dispatchNotification } from './notification.service.js';

const UNIT_LABELS = {
  pcs: 'PCS',
  care: 'Care',
  gram: 'Gram',
  kilo: 'Kilo',
  pack: 'Pack',
  liter: 'Liter',
  meter: 'Meter',
};

function formatUnits(record = {}) {
  return Object.entries(UNIT_LABELS)
    .filter(([key]) => record[key] !== undefined && record[key] !== null)
    .map(([key, label]) => `${label} = ${record[key]}`)
    .join('\n');
}

/**
 * Maps a Supabase Postgres webhook payload to a notification. Returns null for
 * tables / change types that should not produce a push.
 */
function buildNotification(dbChange) {
  if (!dbChange) {
    return null;
  }

  const type = dbChange.type?.toLowerCase();

  switch (dbChange.table) {
    case 'items': {
      if (type !== 'insert') {
        return null;
      }
      const record = dbChange.record ?? {};
      return {
        title: `New item ${record.name} are created`,
        body: `New item ${record.name} are created with:\n${formatUnits(record)}`,
        data: { url: '/items' },
      };
    }
    case 'messages':
      return type === 'insert'
        ? { title: 'New message', body: dbChange.record?.body ?? '', data: { url: '/messages' } }
        : null;
    case 'payments':
      return type === 'insert'
        ? {
            title: 'Payment received',
            body: `Payment recorded for ${dbChange.record?.amount ?? 'order'}`,
            data: { url: '/payments' },
          }
        : null;
    case 'production_orders':
      return type === 'insert'
        ? {
            title: 'New production order',
            body: `Production order ${dbChange.record?.order_number ?? ''} created`.trim(),
            data: { url: '/production' },
          }
        : null;
    default:
      return null;
  }
}

export async function handleDatabaseChange(dbChange) {
  const notification = buildNotification(dbChange);

  if (!notification) {
    return { ok: true, skipped: true, reason: 'No notification mapped for change' };
  }

  const result = await dispatchNotification({
    ...notification,
    userId: dbChange.userId ?? dbChange.record?.user_id ?? null,
  });

  return { ok: true, notification, result };
}