import { useState, useEffect, useCallback } from "react";
import { useFinance } from "../context/FinanceContext";
import { bonusApi } from "../api/bonusApi";

const _now = new Date();
export const MAX_YEAR = _now.getFullYear();
export const MAX_MONTH = _now.getMonth() + 1; // Current real-world month (6 for June)
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

export function useBonus() {
  const { syncHeaders, addNotice } = useFinance();

  const [curYear, setCurYear] = useState(MAX_YEAR);
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

  // ── Fetch salary dynamically based on Year and Month ──────────────────────
  // ⭐️ FIXED: Changed from hardcoded MAX_MONTH to accept target parameters
  const fetchSalary = useCallback(
    async (targetYear = curYear, targetMonth = MAX_MONTH) => {
      try {
        const data = await bonusApi.getSalaryForMonth(
          Number(targetYear),
          Number(targetMonth),
          syncHeaders(),
        );

        if (data.success && data.data?.length > 0) {
          const latest = data.data[0];
          setMonthlySalary(latest.amountUSD ?? latest.amount ?? 0);
        } else {
          setMonthlySalary(0); // Set to 0 if no record exists for this specific month/year
        }
      } catch {
        setMonthlySalary(0);
      }
    },
    [curYear, syncHeaders],
  );

  // ── Auto-Fetch effects on mount/year changes ─────────────────────────────
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    // Default dashboard loading behavior (loads current year and current month salary)
    fetchSalary(curYear, MAX_MONTH);
  }, [fetchSalary, curYear]);

  // ── Year navigation ──────────────────────────────────────────────────────
  const goYear = (delta) => {
    const newYear = curYear + delta;
    if (newYear > MAX_YEAR) return;
    setCurYear(newYear);
  };

  const handleYearJump = (year) => {
    if (year > MAX_YEAR) return;
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
        if (form.year <= MAX_YEAR) {
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

  // ── Derived stats (year-scoped) ──────────────────────────────────────────
  const yearRecords = records.filter((r) => r.year === curYear);
  const totalUSD = records.reduce((s, r) => s + (r.amountUSD || 0), 0);
  const thisYearUSD = yearRecords.reduce((s, r) => s + (r.amountUSD || 0), 0);
  const disbursed = records.filter((r) => r.status === "Disbursed").length;
  const yearBonusUSD = thisYearUSD;
  const totalComp = monthlySalary + yearBonusUSD;
  const salaryRatio =
    monthlySalary > 0
      ? ((yearBonusUSD / monthlySalary) * 100).toFixed(1)
      : null;

  return {
    curYear,
    records,
    monthlySalary, // ⭐️ This value updates whenever fetchSalary handles a switch
    loading,
    submitting,
    goYear,
    handleYearJump,
    isCurrentYear: curYear === MAX_YEAR,
    saveRecord,
    deleteRecord,
    fetchSalary, // ⭐️ EXPOSED: Your modal component can now invoke this directly!
    stats: {
      totalUSD,
      thisYearUSD,
      thisYearCount: yearRecords.length,
      disbursed,
      yearBonusUSD,
      totalComp,
      salaryRatio,
      yearRecords,
    },
  };
}
