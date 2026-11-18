import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

// Loads data for a screen and keeps its three states (Master Document 7.1):
//   loading  -> show <LoadingView />
//   error    -> show <ErrorBanner onRetry={reload} />
//   data     -> show the list, or <EmptyState /> when it is empty
// reload() shows the spinner again. refresh() (pull to refresh, and when you come back to
// the screen) keeps the old data on screen while it loads. If a refresh fails the old data
// stays and "error" is set.
export default function useLoad(loader, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const latest = useRef(0);
  const mounted = useRef(true);
  const loadedOnce = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(
    async (silent) => {
      const id = ++latest.current;
      setError(null);
      if (silent) setRefreshing(true);
      else {
        setLoading(true);
        setData(null);
      }
      try {
        const result = await loader();
        if (!mounted.current || id !== latest.current) return;
        setData(result);
        loadedOnce.current = true;
      } catch (e) {
        if (!mounted.current || id !== latest.current) return;
        setError(e);
      } finally {
        if (mounted.current && id === latest.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );

  // First load, and again whenever the inputs (deps) change.
  useEffect(() => {
    loadedOnce.current = false;
    run(false);
  }, [run]);

  // When the user comes back to this screen, refresh quietly (e.g. a new event was approved).
  useFocusEffect(
    useCallback(() => {
      if (loadedOnce.current) run(true);
    }, [run])
  );

  const reload = useCallback(() => run(false), [run]);
  const refresh = useCallback(() => run(true), [run]);

  return { data, error, loading, refreshing, reload, refresh };
}
