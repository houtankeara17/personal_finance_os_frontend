import { useState, useEffect, useCallback } from "react";
import { useFinance } from "../context/FinanceContext";
import { salaryApi } from "../api/salaryApi";

const _now = new Date();
export const MAX_YEAR = _now.getFullYear();

export function useSalary() {
  const { syncHeaders, addNotice } = useFinance();

  const [curYear, setCurYear] = useState(MAX_YEAR);
  const [records, setRecords] = useState([]);
  const [salaryStats, setSalaryStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch all records by Year ───────────────────────────────────────────
  const fetchAll = useCallback(
    async (year) => {
      setLoading(true);
      try {
        // Updated API call to ignore month constraints
        const data = await salaryApi.getAll(year, syncHeaders());
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

  // Inside useSalary.js
  useEffect(() => {
    // Coerce to a hard Number to guarantee object types are completely stripped out
    if (curYear) {
      fetchAll(Number(curYear));
    }
  }, [curYear, fetchAll]);

  const handleYearJump = (year) => {
    if (year > MAX_YEAR) return;
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
        await fetchAll(curYear);
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
        await fetchAll(curYear);
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
  const thisYearRecordsCount = records.filter(
    (r) => r.year === MAX_YEAR,
  ).length;

  return {
    curYear,
    records,
    loading,
    submitting,
    handleYearJump,
    saveRecord,
    deleteRecord,
    stats: { totalUSD, disbursed, confirmed, thisYear: thisYearRecordsCount },
  };
}
