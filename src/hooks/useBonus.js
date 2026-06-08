import { useState, useEffect, useCallback } from "react";
import { useFinance } from "../context/FinanceContext";
import { bonusApi } from "../api/bonusApi";

const _now = new Date();
export const MAX_YEAR = _now.getFullYear();
export const MAX_MONTH = _now.getMonth() + 1;
export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export const RATES = { USD: 1, KHR: 4000, THB: 35 };

export const isFuture = (month, year) =>
  year > MAX_YEAR || (year === MAX_YEAR && month > MAX_MONTH);

export function useBonus() {
  const { syncHeaders, addNotice } = useFinance();

  const [curYear, setCurYear] = useState(MAX_YEAR);
  const [curMonth, setCurMonth] = useState(MAX_MONTH);
  const [records, setRecords] = useState([]);
  const [monthlySalary, setMonthlySalary] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch all bonuses ────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bonusApi.getAll(syncHeaders());
      if (data.success) setRecords(data.data);
      else addNotice(data.message || "Failed to load bonus records.", "error");
    } catch {
      addNotice("Network error: Failed to reach bonus system.", "error");
    } finally {
      setLoading(false);
    }
  }, [syncHeaders, addNotice]);

  // ── Fetch salary for current month ───────────────────────────────────────
  const fetchSalary = useCallback(async () => {
    try {
      const data = await bonusApi.getSalaryForMonth(
        curYear,
        curMonth,
        syncHeaders(),
      );
      if (data.success && data.data?.length > 0) {
        const latest = data.data[0];
        setMonthlySalary(latest.amountUSD ?? latest.amount ?? 0);
      } else {
        setMonthlySalary(0);
      }
    } catch {
      setMonthlySalary(0);
    }
  }, [curYear, curMonth, syncHeaders]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);
  useEffect(() => {
    fetchSalary();
  }, [fetchSalary]);

  // ── Month navigation ─────────────────────────────────────────────────────
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

  // ── Create / Update ──────────────────────────────────────────────────────
  const saveRecord = async (form, editId = null) => {
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) {
      addNotice("Enter a valid amount.", "error");
      return false;
    }

    setSubmitting(true);
    try {
      const numAmount = Number(form.amount);
      const amountUSD = numAmount / RATES[form.currency];
      const payload = { ...form, amount: numAmount, amountUSD };

      const data = editId
        ? await bonusApi.update(editId, payload, syncHeaders())
        : await bonusApi.create(payload, syncHeaders());

      if (data.success) {
        addNotice(
          editId
            ? "Bonus record updated seamlessly."
            : "Bonus record added successfully.",
          "success",
        );
        // jump view to the month of the saved record
        if (!isFuture(form.monthNumber, form.year)) {
          setCurMonth(form.monthNumber);
          setCurYear(form.year);
        }
        await fetchAll();
        return true;
      } else {
        addNotice(data.message || "Operation failed.", "error");
        return false;
      }
    } catch {
      addNotice("Server error: Failed to save bonus record.", "error");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const deleteRecord = async (id) => {
    try {
      const data = await bonusApi.remove(id, syncHeaders());
      if (data.success) {
        addNotice("Bonus record purged successfully.", "success");
        await fetchAll();
        return true;
      } else {
        addNotice(data.message || "Delete failed.", "error");
        return false;
      }
    } catch {
      addNotice("Server error during deletion.", "error");
      return false;
    }
  };

  // ── Derived stats ────────────────────────────────────────────────────────
  const monthRecords = records.filter(
    (r) => r.year === curYear && r.monthNumber === curMonth,
  );
  const thisYear = records.filter((r) => r.year === curYear);
  const totalUSD = records.reduce((s, r) => s + (r.amountUSD || 0), 0);
  const thisYearUSD = thisYear.reduce((s, r) => s + (r.amountUSD || 0), 0);
  const monthBonusUSD = monthRecords.reduce(
    (s, r) => s + (r.amountUSD || 0),
    0,
  );
  const disbursed = records.filter((r) => r.status === "Disbursed").length;
  const totalComp = monthlySalary + monthBonusUSD;
  const salaryRatio =
    monthlySalary > 0
      ? ((monthBonusUSD / monthlySalary) * 100).toFixed(1)
      : null;

  return {
    // state
    curYear,
    curMonth,
    records,
    monthlySalary,
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
    stats: {
      totalUSD,
      thisYearUSD,
      thisYearCount: thisYear.length,
      disbursed,
      monthBonusUSD,
      totalComp,
      salaryRatio,
      monthRecords,
    },
  };
}
