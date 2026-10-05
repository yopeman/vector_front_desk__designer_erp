import { dispatchNotification } from './notification.service.js';

/**
 * Maps a Supabase Postgres webhook payload to a notification. Returns null for
 * tables / change types that should not produce a push.
 */
function buildNotification(dbChange) {
  if (!dbChange) {
    return null;
  }

  const type = dbChange.type?.toLowerCase();


  switch (type) {
    case 'insert':
        return {
          title: `New ${dbChange.table} are created`,
          body: `New ${dbChange.table} are created with:\n${JSON.stringify(dbChange.record)}`,
        };
      break;

    case 'update':
          return {
            title: `New ${dbChange.table} are updated`,
            body: `New ${dbChange.table} are updated from:\n${JSON.stringify(dbChange.record)}\nto\n${JSON.stringify(dbChange.new_record)}`,
          };
      break;

    case 'delete':
        return {
          title: `New ${dbChange.table} are deleted`,
          body: `New ${dbChange.table} are deleted with:\n${JSON.stringify(dbChange.old_record)}`,
        };
      break;
  
    default:
      break;
  }

  return null;

  // switch (dbChange.table) {
  //   case 'items': {
  //     if (type !== 'insert') {
  //       return null;
  //     }
  //     const record = dbChange.record ?? {};
  //     return {
  //       title: `New item ${record.name} are created`,
  //       body: `New item ${record.name} are created with:\n${formatUnits(record)}`,
  //     };
  //   }
  //   case 'messages':
  //     return type === 'insert'
  //       ? { title: 'New message', body: dbChange.record?.body ?? '', data: { url: '/messages' } }
  //       : null;
  //   case 'payments':
  //     return type === 'insert'
  //       ? {
  //           title: 'Payment received',
  //           body: `Payment recorded for ${dbChange.record?.amount ?? 'order'}`,
  //         }
  //       : null;
  //   case 'production_orders':
  //     return type === 'insert'
  //       ? {
  //           title: 'New production order',
  //           body: `Production order ${dbChange.record?.order_number ?? ''} created`.trim(),
  //         }
  //       : null;
  //   default:
  //     return null;
  // }
}

export async function handleDatabaseChange(dbChange) {
  const notification = buildNotification(dbChange);

  if (!notification) {
    return { ok: true, skipped: true, reason: 'No notification mapped for change' };
  }

  const result = await dispatchNotification({
    ...notification,
    userId: null,
  });

  return { ok: true, notification, result };
}