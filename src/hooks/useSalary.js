import { useState, useEffect, useCallback } from "react";
import { useFinance } from "../context/FinanceContext";
import { salaryApi } from "../api/salaryApi";

const _now = new Date();
export const MAX_YEAR = _now.getFullYear();
export const MAX_MONTH = _now.getMonth() + 1;

export const isFuture = (month, year) =>
  year > MAX_YEAR || (year === MAX_YEAR && month > MAX_MONTH);

export function useSalary() {
  const { syncHeaders, addNotice } = useFinance();

  const [curYear, setCurYear] = useState(MAX_YEAR);
  const [curMonth, setCurMonth] = useState(MAX_MONTH);
  const [records, setRecords] = useState([]);
  const [salaryStats, setSalaryStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchAll = useCallback(
    async (year, month) => {
      setLoading(true);
      try {
        const data = await salaryApi.getAll(year, month, syncHeaders());
        if (data.success) {
          setRecords(data.data);
          setSalaryStats(data.stats ?? null);
        } else {
          addNotice(data.message || "Failed to load salary records.", "error");
        }
      } catch {
        addNotice("Network error: Could not reach server.", "error");
      } finally {
        setLoading(false);
      }
    },
    [syncHeaders, addNotice],
  );

  useEffect(() => {
    fetchAll(curYear, curMonth);
  }, [curYear, curMonth, fetchAll]);

  // ── Month navigation ───────────────────────────────────────────────────
  const goMonth = (delta) => {
    let m = curMonth + delta,
      y = curYear;
    if (m < 1) {
      m = 12;
      y--;
    }
    if (m > 12) {
      m = 1;
      y++;
    }
    if (isFuture(m, y)) return;
    setCurMonth(m);
    setCurYear(y);
  };

  const handleDateJump = (month, year) => {
    if (isFuture(month, year)) return;
    setCurMonth(month);
    setCurYear(year);
  };

  // ── Create / Update ────────────────────────────────────────────────────
  const saveRecord = async (form, editId = null) => {
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) {
      addNotice("Enter a valid amount.", "error");
      return false;
    }

    setSubmitting(true);
    try {
      const num = Number(form.amount);
      const amountUSD =
        form.currency === "KHR"
          ? num / 4000
          : form.currency === "THB"
            ? num / 35
            : num;

      const payload = { ...form, amount: num, amountUSD };
      const data = editId
        ? await salaryApi.update(editId, payload, syncHeaders())
        : await salaryApi.create(payload, syncHeaders());

      if (data.success) {
        addNotice(
          editId
            ? "Salary record updated successfully."
            : "Salary record added successfully.",
          "success",
        );
        await fetchAll(curYear, curMonth);
        return true;
      } else {
        addNotice(data.message || "Operation failed.", "error");
        return false;
      }
    } catch {
      addNotice("Server error: Failed to save record.", "error");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────
  const deleteRecord = async (id) => {
    try {
      const data = await salaryApi.remove(id, syncHeaders());
      if (data.success) {
        addNotice("Record deleted permanently.", "success");
        await fetchAll(curYear, curMonth);
        return true;
      } else {
        addNotice(data.message || "Delete failed.", "error");
        return false;
      }
    } catch {
      addNotice("Server error: Could not complete deletion.", "error");
      return false;
    }
  };

  // ── Derived stats ──────────────────────────────────────────────────────
  const totalUSD =
    salaryStats?.totalEarned ??
    records.reduce((s, r) => s + (r.amountUSD || 0), 0);
  const disbursed = records.filter((r) => r.status === "Disbursed").length;
  const confirmed = records.filter((r) => r.status === "Confirmed").length;
  const thisYear = records.filter((r) => r.year === MAX_YEAR).length;

  return {
    // state
    curYear,
    curMonth,
    records,
    loading,
    submitting,
    // navigation
    goMonth,
    handleDateJump,
    isCurrentMonth: curYear === MAX_YEAR && curMonth === MAX_MONTH,
    // actions
    saveRecord,
    deleteRecord,
    // derived
    stats: { totalUSD, disbursed, confirmed, thisYear },
  };
}
