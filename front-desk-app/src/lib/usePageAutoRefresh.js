import { useEffect, useRef } from 'react';
import { supabase } from './supabase';

// Keeps a page's data automatically fresh while that page is the one currently
// mounted in the app. It combines three triggers:
//
//   1. Supabase Realtime (postgres_changes) on the tables the page reads, debounced.
//   2. A fallback interval poll (for tables where realtime is not enabled).
//   3. An immediate refresh when the browser tab becomes visible again.
//
// Nothing runs while `document.hidden` is true, so background tabs cost nothing.
//
//   const data = usePageAutoRefresh(fetchRows, { tables: ['orders', 'invoices'] });
//
// `fetchRows` receives `{ silent: true }` for background refreshes. Support that
// by skipping your loading spinner on silent calls:
//
//   const fetchRows = async (opts = {}) => {
//     if (!opts.silent) setLoading(true);
//     ...
//   };
//
// Set `pollMs: 0` to rely on realtime only. `enabled: false` turns it off.
export default function usePageAutoRefresh(refetch, options = {}) {
  const {
    tables = [],
    pollMs = 30000,
    debounceMs = 1000,
    channelName = 'page-auto-refresh',
    enabled = true,
  } = options;

  // Keep the latest fetch function without forcing the subscription to re-create.
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  // Prevent overlapping refreshes when a fetch is slower than the poll interval.
  const busyRef = useRef(false);

  const tablesKey = [...tables].sort().join(',');

  useEffect(() => {
    if (!enabled || !refetch || tablesKey === '') return;

    const tablesList = tablesKey.split(',');

    const run = () => {
      if (document.hidden) return;
      if (busyRef.current) return;
      busyRef.current = true;
      // Track completion so the guard covers slow fetches. `refetch` may be a
      // plain function that kicks off async work without returning it (as
      // DesignerPage's section dispatcher does), in which case this resolves
      // immediately and we simply rely on the interval spacing.
      Promise.resolve()
        .then(() => refetchRef.current?.({ silent: true }))
        .catch((error) => console.error('Auto refresh failed:', error))
        .finally(() => {
          busyRef.current = false;
        });
    };

    // 1. Realtime, debounced so a burst of writes triggers a single refetch.
    const changed = new Set();
    let debounceTimer = null;

    const flush = () => {
      debounceTimer = null;
      if (changed.size > 0) {
        changed.clear();
        run();
      }
    };

    const scheduleFlush = (table) => {
      if (document.hidden) return;
      changed.add(table);
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

    // 2. Fallback interval poll.
    const pollTimer =
      pollMs > 0
        ? setInterval(run, pollMs)
        : null;

    // 3. Catch up as soon as the user comes back to this tab.
    const onVisibilityChange = () => {
      if (!document.hidden) run();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (pollTimer) clearInterval(pollTimer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, tablesKey, pollMs, debounceMs, channelName]);
}