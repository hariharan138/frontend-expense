import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axios";

export function useTransactions(filters = {}) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const query = useMemo(() => {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
    );
    const s = params.toString();
    return s ? `?${s}` : "";
  }, [filters]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    axiosInstance
      .get(`/transactions${query}`)
      .then((r) => {
        if (!alive) return;
        setTransactions(r.data);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [query]);

  return { transactions, loading, error, refetch: () => axiosInstance.get(`/transactions${query}`) };
}

