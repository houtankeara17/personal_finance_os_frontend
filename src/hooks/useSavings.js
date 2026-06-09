import { useState, useEffect } from "react";
import { useFinance } from "../context/FinanceContext";
import { savingsApi } from "../api/savingsApi";

const today = new Date();

export const emptyForm = {
  amount: "",
  currency: "USD",
  category: "General Savings",
  year: today.getFullYear(),
  monthNumber: today.getMonth() + 1,
  noted: "",
};

export function useSavings() {
  const { syncHeaders, addNotice } = useFinance();

  // ── Data ──
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Modal / form ──
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // ── Delete ──
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  // ── Filter ──
  const [filterCat, setFilterCat] = useState("ALL");

  // ── Navigator ──
  const MAX_MONTH = today.getMonth() + 1;
  const MAX_YEAR = today.getFullYear();
  const MIN_YEAR = 2025;
  const [navYear, setNavYear] = useState(MAX_YEAR);
  const [navMonth, setNavMonth] = useState(MAX_MONTH);

  const YEAR_OPTIONS = Array.from(
    { length: MAX_YEAR - MIN_YEAR + 1 },
    (_, i) => MIN_YEAR + i,
  );

  // ── Fetch ──
  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await savingsApi.fetchAll(syncHeaders());
      if (data.success) setRecords(data.data);
      else addNotice("Failed to load savings records.", "error");
    } catch {
      addNotice("Failed to load savings records.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ── Navigator helpers ──
  const isCurrentMonth = navYear === MAX_YEAR && navMonth === MAX_MONTH;

  const isFuture = (month, year) =>
    year > MAX_YEAR || (year === MAX_YEAR && month > MAX_MONTH);

  const goMonth = (dir) => {
    let m = navMonth + dir;
    let y = navYear;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    if (isFuture(m, y) || y < MIN_YEAR) return;
    setNavMonth(m);
    setNavYear(y);
  };

  const handleDateJump = (month, year) => {
    if (!isFuture(month, year) && year >= MIN_YEAR) {
      setNavMonth(month);
      setNavYear(year);
    }
  };

  // ── Modal helpers ──
  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (rec) => {
    setEditTarget(rec._id);
    setForm({
      amount: rec.amount,
      currency: rec.currency,
      category: rec.category,
      year: rec.year,
      monthNumber: rec.monthNumber,
      noted: rec.noted || "",
    });
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  // ── Exchange rates (USD base) ──
  const RATES = { USD: 1, KHR: 4100, THB: 36 };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0)
      return addNotice("Enter a valid amount.", "error");

    setSubmitting(true);
    try {
      const amt = Number(form.amount);
      const amountUSD = +(amt / (RATES[form.currency] || 1)).toFixed(2);
      const payload = { ...form, amount: amt, amountUSD };
      const data = editTarget
        ? await savingsApi.update(syncHeaders(), editTarget, payload)
        : await savingsApi.create(syncHeaders(), payload);

      if (data.success) {
        addNotice(
          editTarget ? "Saving record updated." : "Saving record added.",
        );
        setShowModal(false);
        fetchAll();
      } else {
        addNotice(data.message || "Operation failed.", "error");
      }
    } catch {
      addNotice("Server error.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete single ──
  const handleDelete = async (id) => {
    try {
      const data = await savingsApi.remove(syncHeaders(), id);
      if (data.success) {
        addNotice("Record deleted.");
        fetchAll();
      } else {
        addNotice(data.message || "Delete failed.", "error");
      }
    } catch {
      addNotice("Server error.", "error");
    } finally {
      setDeleteId(null);
    }
  };

  // ── Delete all ──
  const handleDeleteAll = async () => {
    try {
      const data = await savingsApi.removeAll(syncHeaders());
      if (data.success) {
        addNotice(data.message || "All records deleted.");
        fetchAll();
      } else {
        addNotice(data.message || "Delete all failed.", "error");
      }
    } catch {
      addNotice("Server error.", "error");
    } finally {
      setShowDeleteAll(false);
    }
  };

  // ── Derived stats ──
  const totalUSD = records.reduce((s, r) => s + (r.amountUSD || 0), 0);

  const thisMonthRecords = records.filter(
    (r) =>
      r.monthNumber === today.getMonth() + 1 && r.year === today.getFullYear(),
  );
  const thisMonthUSD = thisMonthRecords.reduce(
    (s, r) => s + (r.amountUSD || 0),
    0,
  );

  const thisYearUSD = records
    .filter((r) => r.year === today.getFullYear())
    .reduce((s, r) => s + (r.amountUSD || 0), 0);

  const navFiltered = records.filter(
    (r) => r.monthNumber === navMonth && r.year === navYear,
  );
  const visible =
    filterCat === "ALL"
      ? navFiltered
      : navFiltered.filter((r) => r.category === filterCat);

  const navMonthUSD = navFiltered.reduce((s, r) => s + (r.amountUSD || 0), 0);

  return {
    // data
    records,
    loading,
    visible,
    navFiltered,
    navMonthUSD,
    // stats
    totalUSD,
    thisMonthUSD,
    thisMonthRecords,
    thisYearUSD,
    // navigator
    navMonth,
    navYear,
    YEAR_OPTIONS,
    MIN_YEAR,
    MAX_YEAR,
    MAX_MONTH,
    isCurrentMonth,
    isFuture,
    goMonth,
    handleDateJump,
    // filter
    filterCat,
    setFilterCat,
    // modal
    showModal,
    editTarget,
    form,
    setForm,
    submitting,
    openCreate,
    openEdit,
    closeModal,
    handleSubmit,
    // delete single
    deleteId,
    setDeleteId,
    handleDelete,
    // delete all
    showDeleteAll,
    setShowDeleteAll,
    handleDeleteAll,
  };
}
