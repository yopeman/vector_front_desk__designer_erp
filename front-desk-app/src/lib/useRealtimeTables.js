import { useEffect, useRef } from 'react';
import { supabase } from './supabase';

// Subscribe to Supabase Realtime (postgres_changes) on the given tables and
// notify the caller when data changes (debounced). Also supports a gentle
// fallback poll so the UI stays fresh even if realtime is not enabled on a table.
//
//   useRealtimeTables(
//     ['orders', 'invoices'],
//     (changedTables) => { ... },
//     { debounceMs: 1000, pollMs: 30000, channelName: 'globe-data' }
//   )
export default function useRealtimeTables(tables, onDataChange, options = {}) {
  const { debounceMs = 1000, pollMs = 30000, channelName = 'global-data' } = options;
  const callbackRef = useRef(onDataChange);
  callbackRef.current = onDataChange;

  const tablesKey = [...tables].sort().join(',');
  const tablesList = tablesKey ? tablesKey.split(',') : [];

  useEffect(() => {
    if (tablesList.length === 0) return;

    const changed = new Set();
    let debounceTimer = null;

    const flush = () => {
      const changedTables = [...changed];
      changed.clear();
      debounceTimer = null;
      if (changedTables.length > 0) callbackRef.current?.(changedTables);
    };

    const scheduleFlush = (table) => {
      // Ignore refreshes where the browser tab is not visible (no visible benefit)
      if (document.hidden) return;
      if (!changed.has(table)) changed.add(table);
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(flush, debounceMs);
    };

    const channel = supabase.channel(`realtime-${channelName}`);
    tablesList.forEach((table) => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => scheduleFlush(table)
      );
    });
    channel.subscribe();

    // Fallback gentle polling (background refresh, no page reload)
    const pollTimer = pollMs > 0
      ? setInterval(() => {
          if (!document.hidden) callbackRef.current?.(tablesList);
        }, pollMs)
      : null;

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (pollTimer) clearInterval(pollTimer);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tablesKey, debounceMs, pollMs, channelName]);
}