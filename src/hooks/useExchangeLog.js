import { useState, useEffect, useCallback, useRef } from "react";
import { useFinance } from "../context/FinanceContext";
import { exchangelogApi } from "../api/exchangelogApi";

const today = new Date();
export const MAX_MONTH = today.getMonth() + 1;
export const MAX_YEAR = today.getFullYear();
export const MIN_YEAR = 2025;
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

// ── Conversion helpers ───────────────────────────────────────────────────────
const BASE_RATES_TO_USD = { USD: 1, KHR: 1 / 4100, THB: 1 / 35.5 };
const toUSD = (amount, currency) => amount * BASE_RATES_TO_USD[currency];
const fromUSD = (usdAmount, currency) =>
  usdAmount / BASE_RATES_TO_USD[currency];
export const convert = (amount, from, to) => {
  if (from === to) return amount;
  return fromUSD(toUSD(amount, from), to);
};

export const emptyForm = {
  fromCurrency: "KHR",
  fromAmount: "",
  toCurrency: "USD",
  toAmount: "",
  rateUsed: "",
  officialRate: "",
  provider: "ABA Bank",
  providerNote: "",
  exchangeDate: today.toISOString().split("T")[0],
  year: today.getFullYear(),
  monthNumber: today.getMonth() + 1,
  day: today.getDate(),
  noted: "",
};

export function useExchangeLog() {
  const { syncHeaders, addNotice } = useFinance();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [navMonth, setNavMonth] = useState(MAX_MONTH);
  const [navYear, setNavYear] = useState(MAX_YEAR);
  const [form, setForm] = useState(emptyForm);
  const lastEdited = useRef("from"); // "from" | "to"

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await exchangelogApi.getAll(syncHeaders());
      if (data.success) setRecords(data.data);
      else addNotice("Failed to load exchange logs.", "error");
    } catch {
      addNotice("Network error: Could not reach server.", "error");
    } finally {
      setLoading(false);
    }
  }, [syncHeaders, addNotice]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Auto-conversion — FROM side ────────────────────────────────────────
  useEffect(() => {
    if (lastEdited.current !== "from") return;
    const n = parseFloat(form.fromAmount);
    if (!n || isNaN(n) || form.fromCurrency === form.toCurrency) return;
    const converted = convert(n, form.fromCurrency, form.toCurrency);
    const rate = converted / n;
    setForm((f) => ({
      ...f,
      toAmount: converted.toFixed(f.toCurrency === "KHR" ? 0 : 4),
      rateUsed: rate.toFixed(6),
    }));
  }, [form.fromAmount, form.fromCurrency, form.toCurrency]);

  // ── Auto-conversion — TO side ──────────────────────────────────────────
  useEffect(() => {
    if (lastEdited.current !== "to") return;
    const n = parseFloat(form.toAmount);
    if (!n || isNaN(n) || form.fromCurrency === form.toCurrency) return;
    const converted = convert(n, form.toCurrency, form.fromCurrency);
    const rate = n / converted;
    setForm((f) => ({
      ...f,
      fromAmount: converted.toFixed(f.fromCurrency === "KHR" ? 0 : 4),
      rateUsed: rate.toFixed(6),
    }));
  }, [form.toAmount, form.fromCurrency, form.toCurrency]);

  // ── Form field handlers ────────────────────────────────────────────────
  const handleFromAmount = (val) => {
    lastEdited.current = "from";
    setForm((f) => ({ ...f, fromAmount: val }));
  };
  const handleToAmount = (val) => {
    lastEdited.current = "to";
    setForm((f) => ({ ...f, toAmount: val }));
  };
  const handleFromCurrency = (val) =>
    setForm((f) => ({ ...f, fromCurrency: val }));
  const handleToCurrency = (val) => setForm((f) => ({ ...f, toCurrency: val }));

  const swapCurrencies = () => {
    setForm((f) => ({
      ...f,
      fromCurrency: f.toCurrency,
      toCurrency: f.fromCurrency,
      fromAmount: f.toAmount,
      toAmount: f.fromAmount,
    }));
    lastEdited.current = "from";
  };

  const handleDateChange = (val) => {
    const d = new Date(val);
    setForm((f) => ({
      ...f,
      exchangeDate: val,
      year: d.getFullYear(),
      monthNumber: d.getMonth() + 1,
      day: d.getDate(),
      dayOfWeek: d.getDay(),
    }));
  };

  const resetForm = (override = {}) => {
    lastEdited.current = "from";
    setForm({ ...emptyForm, ...override });
  };

  // ── Month navigation ───────────────────────────────────────────────────
  const isFuture = (m, y) => y > MAX_YEAR || (y === MAX_YEAR && m > MAX_MONTH);

  const goMonth = (dir) => {
    let m = navMonth + dir,
      y = navYear;
    if (m > 12) {
      m = 1;
      y++;
    }
    if (m < 1) {
      m = 12;
      y--;
    }
    if (isFuture(m, y) || y < MIN_YEAR) return;
    setNavMonth(m);
    setNavYear(y);
  };

  const handleNavMonthChange = (m, y = navYear) => {
    const clampedMonth = y === MAX_YEAR && m > MAX_MONTH ? MAX_MONTH : m;
    if (!isFuture(clampedMonth, y)) {
      setNavMonth(clampedMonth);
      setNavYear(y);
    }
  };

  // ── Create / Update ────────────────────────────────────────────────────
  const saveRecord = async (editId = null) => {
    if (!form.fromAmount || !form.toAmount) {
      addNotice("Enter both amounts.", "error");
      return false;
    }
    if (form.fromCurrency === form.toCurrency) {
      addNotice("From and To currencies must differ.", "error");
      return false;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        fromAmount: Number(form.fromAmount),
        toAmount: Number(form.toAmount),
        rateUsed: Number(form.rateUsed),
        officialRate: form.officialRate ? Number(form.officialRate) : null,
      };

      const data = editId
        ? await exchangelogApi.update(editId, payload, syncHeaders())
        : await exchangelogApi.create(payload, syncHeaders());

      if (data.success) {
        addNotice(editId ? "Exchange log updated." : "Exchange log added.");
        await fetchAll();
        return true;
      } else {
        addNotice(data.message || "Operation failed.", "error");
        return false;
      }
    } catch {
      addNotice("Server error.", "error");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────
  const deleteRecord = async (id) => {
    try {
      const data = await exchangelogApi.remove(id, syncHeaders());
      if (data.success) {
        addNotice("Log deleted.");
        await fetchAll();
        return true;
      } else {
        addNotice(data.message || "Delete failed.", "error");
        return false;
      }
    } catch {
      addNotice("Server error.", "error");
      return false;
    }
  };

  // ── Derived stats ──────────────────────────────────────────────────────
  const thisMonthRecords = records.filter(
    (r) => r.monthNumber === MAX_MONTH && r.year === MAX_YEAR,
  );
  const navFiltered = records.filter(
    (r) => r.monthNumber === navMonth && r.year === navYear,
  );
  const uniquePairs = [
    ...new Set(records.map((r) => `${r.fromCurrency}→${r.toCurrency}`)),
  ].length;
  const avgRate = records.length
    ? (records.reduce((s, r) => s + r.rateUsed, 0) / records.length).toFixed(4)
    : "—";

  return {
    // state
    records,
    loading,
    submitting,
    navMonth,
    navYear,
    form,
    lastEdited,
    // form handlers
    setForm,
    handleFromAmount,
    handleToAmount,
    handleFromCurrency,
    handleToCurrency,
    swapCurrencies,
    handleDateChange,
    resetForm,
    // navigation
    goMonth,
    handleNavMonthChange,
    isFuture,
    isCurrentMonth: navYear === MAX_YEAR && navMonth === MAX_MONTH,
    // actions
    saveRecord,
    deleteRecord,
    // derived
    stats: {
      totalLogs: records.length,
      thisMonth: thisMonthRecords.length,
      uniquePairs,
      avgRate,
      navFiltered,
    },
  };
}
