import { useState, useEffect, useCallback } from "react";
import { getErrorMessage } from "../api/client";

// Loads data when a page opens.  Usage:
//   const { data, loading, error, reload } = useFetch(requestFunction);
// The request function must not change on every render: use a function defined
// outside the component, or wrap it in useCallback.
export function useFetch(requestFn) {
  // state remembers which request function the result belongs to
  const [state, setState] = useState(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    requestFn()
      .then((data) => {
        if (!cancelled) setState({ fn: requestFn, data, error: "" });
      })
      .catch((err) => {
        if (!cancelled) setState({ fn: requestFn, data: null, error: getErrorMessage(err) });
      });

    return () => {
      cancelled = true;
    };
  }, [requestFn, reloadCount]);

  // Loads again. Old data stays visible while loading, but after an error
  // we show "Loading..." so the user sees that "Try again" did something.
  const reload = useCallback(() => {
    setState((previous) => (previous && previous.error ? null : previous));
    setReloadCount((count) => count + 1);
  }, []);

  const loading = state === null || state.fn !== requestFn;

  return {
    data: loading ? null : state.data,
    error: loading ? "" : state.error,
    loading,
    reload,
  };
}