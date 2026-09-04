"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useAsyncData(loader, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await loaderRef.current());
    } catch (err) {
      setError(err.message || "Unable to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetching data in an effect and updating state is the intended pattern here.
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { load(); }, deps);

  return { data, loading, error, reload: load, setData };
}
