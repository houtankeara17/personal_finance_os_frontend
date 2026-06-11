import { useState, useCallback, useEffect } from "react";
import { apiFetch, extract, extractUser } from "../api/overviewApi";

const INITIAL_DATA = {
  salaries: [],
  savings: [],
  bonuses: [],
  expenses: [],
  exchangelogs: [],
  remittances: [],
  plans: [],
  notes: [],
};

export function useFinanceData() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [salR, savR, bonR, expR, exlR, remR, plnR, notR, dashR, meR] =
        await Promise.allSettled([
          apiFetch("/salaries"),
          apiFetch("/savings"),
          apiFetch("/bonuses"),
          apiFetch("/expenses"),
          apiFetch("/exchangelog"),
          apiFetch("/remittances"),
          apiFetch("/plans"),
          apiFetch("/notes"),
          apiFetch("/auth/me"), // correct route: routes/auth.js -> GET /auth/me
        ]);

      setData({
        salaries: extract(salR),
        savings: extract(savR),
        bonuses: extract(bonR),
        expenses: extract(expR),
        exchangelogs: extract(exlR),
        remittances: extract(remR),
        plans: extract(plnR),
        notes: extract(notR),
      });

      // Replace the two extractUser lines with this:
      const userFromMe = extractUser(meR);
      const userFromDash = extractUser(dashR);
      const userFromSalary = extract(salR)?.[0]?.user ?? null; // fallback if API embeds user gegegegegegege
      setUser(userFromMe ?? userFromDash ?? null);
    } catch (err) {
      console.error("useFinanceData fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const sync = useCallback(async () => {
    setSyncing(true);
    await fetchAll();
    setSyncing(false);
  }, [fetchAll]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { user, data, loading, syncing, error, sync };
}
