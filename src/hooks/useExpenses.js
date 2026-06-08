import { useState, useEffect, useCallback } from "react";
import { useFinance } from "../context/FinanceContext";
import {
  fetchExpensesMonth,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../api/expenseApi";

export function useExpenses(initialYear, initialMonth) {
  const { syncHeaders, addNotice } = useFinance();

  // ── Month navigation ──────────────────────────────────────────────────────
  const [curYear, setCurYear] = useState(initialYear);
  const [curMonth, setCurMonth] = useState(initialMonth);

  // ── Data ──────────────────────────────────────────────────────────────────
  const [expenses, setExpenses] = useState([]);
  const [calendarMap, setCalendarMap] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── Mutation state ────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchMonth = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchExpensesMonth(curYear, curMonth, syncHeaders());
      setExpenses(result.expenses);
      setStats(result.stats);
      setCalendarMap(result.calendarMap);
    } catch {
      setExpenses([]);
      setStats(null);
      setCalendarMap({});
    } finally {
      setLoading(false);
    }
  }, [curYear, curMonth, syncHeaders]);

  useEffect(() => {
    fetchMonth();
  }, [fetchMonth]);

  // ── Month navigation ──────────────────────────────────────────────────────
  const goMonth = useCallback((delta) => {
    setCurMonth((m) => {
      let next = m + delta;
      if (next < 1) {
        setCurYear((y) => y - 1);
        return 12;
      }
      if (next > 12) {
        setCurYear((y) => y + 1);
        return 1;
      }
      return next;
    });
  }, []);

  const jumpToMonth = useCallback((month, year) => {
    setCurMonth(month);
    setCurYear(year);
  }, []);

  // ── Create ────────────────────────────────────────────────────────────────
  const handleCreate = useCallback(
    async (data) => {
      setSubmitting(true);
      try {
        const res = await createExpense(data, syncHeaders());
        if (res.success) {
          addNotice("Expense logged.");
          await fetchMonth();
          return { success: true };
        } else {
          addNotice(res.message || "Failed to log expense.");
          return { success: false };
        }
      } finally {
        setSubmitting(false);
      }
    },
    [syncHeaders, addNotice, fetchMonth],
  );

  // ── Update ────────────────────────────────────────────────────────────────
  const handleUpdate = useCallback(
    async (id, data) => {
      setSubmitting(true);
      try {
        const res = await updateExpense(id, data, syncHeaders());
        if (res.success) {
          addNotice("Expense updated.");
          await fetchMonth();
          return { success: true };
        } else {
          addNotice(res.message || "Failed to update.");
          return { success: false };
        }
      } finally {
        setSubmitting(false);
      }
    },
    [syncHeaders, addNotice, fetchMonth],
  );

  // ── Delete single ─────────────────────────────────────────────────────────
  const handleDelete = useCallback(
    async (id) => {
      setDeletingId(id);
      try {
        await deleteExpense(id, syncHeaders());
        addNotice("Expense removed.");
        await fetchMonth();
      } finally {
        setDeletingId(null);
      }
    },
    [syncHeaders, addNotice, fetchMonth],
  );

  // ── Delete all (ids array) ────────────────────────────────────────────────
  const handleDeleteMany = useCallback(
    async (ids) => {
      const headers = syncHeaders();
      for (const id of ids) {
        await deleteExpense(id, headers);
      }
      addNotice(`${ids.length} expense${ids.length !== 1 ? "s" : ""} deleted.`);
      await fetchMonth();
    },
    [syncHeaders, addNotice, fetchMonth],
  );

  return {
    // month state
    curYear,
    curMonth,
    goMonth,
    jumpToMonth,

    // data
    expenses,
    calendarMap,
    stats,
    loading,

    // mutation state
    submitting,
    deletingId,

    // actions
    handleCreate,
    handleUpdate,
    handleDelete,
    handleDeleteMany,
    refetch: fetchMonth,
  };
}
