import { useState, useEffect } from "react";
import { useFinance } from "../context/FinanceContext";
import { remittanceApi } from "../api/remittanceApi";

const today = new Date();
const MAX_MONTH = today.getMonth() + 1;
const MAX_YEAR = today.getFullYear();
const MIN_YEAR = 2025;

export const YEAR_OPTIONS = Array.from(
  { length: MAX_YEAR - MIN_YEAR + 1 },
  (_, i) => MIN_YEAR + i,
);

export const emptyForm = {
  amount: "",
  currency: "USD",
  recipient: "",
  recipientRelation: "Other",
  method: "Cash",
  remittanceDate: today.toISOString().split("T")[0],
  year: today.getFullYear(),
  monthNumber: today.getMonth() + 1,
  day: today.getDate(),
  noted: "",
};

export function useRemittance() {
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

  // ── Filter ──
  const [filterRelation, setFilterRelation] = useState("ALL");

  // ── Navigator ──
  const [navMonth, setNavMonth] = useState(MAX_MONTH);
  const [navYear, setNavYear] = useState(MAX_YEAR);

  // ── Fetch ──
  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await remittanceApi.fetchAll(syncHeaders());
      if (data.success) setRecords(data.data);
      else addNotice("Failed to load remittance records.", "error");
    } catch {
      addNotice("Failed to load remittance records.", "error");
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

  // ── Form date sync ──
  const handleDateChange = (val) => {
    const d = new Date(val);
    setForm((f) => ({
      ...f,
      remittanceDate: val,
      year: d.getFullYear(),
      monthNumber: d.getMonth() + 1,
      day: d.getDate(),
    }));
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
      recipient: rec.recipient,
      recipientRelation: rec.recipientRelation,
      method: rec.method,
      remittanceDate:
        rec.remittanceDate?.split("T")[0] || today.toISOString().split("T")[0],
      year: rec.year,
      monthNumber: rec.monthNumber,
      day: rec.day,
      noted: rec.noted || "",
    });
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  // ── Submit ──
  const handleSubmit = async () => {
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0)
      return addNotice("Enter a valid amount.", "error");
    if (!form.recipient.trim())
      return addNotice("Recipient name is required.", "error");

    setSubmitting(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      const data = editTarget
        ? await remittanceApi.update(syncHeaders(), editTarget, payload)
        : await remittanceApi.create(syncHeaders(), payload);

      if (data.success) {
        addNotice(editTarget ? "Remittance updated." : "Remittance recorded.");
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

  // ── Delete ──
  const handleDelete = async (id) => {
    try {
      const data = await remittanceApi.remove(syncHeaders(), id);
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

  const uniqueRecipients = [...new Set(records.map((r) => r.recipient))].length;

  const navFiltered = records.filter(
    (r) => r.monthNumber === navMonth && r.year === navYear,
  );
  const navMonthUSD = navFiltered.reduce((s, r) => s + (r.amountUSD || 0), 0);

  const visible =
    filterRelation === "ALL"
      ? navFiltered
      : navFiltered.filter((r) => r.recipientRelation === filterRelation);

  const recipientTotals = navFiltered.reduce((acc, r) => {
    const key = r.recipient;
    if (!acc[key])
      acc[key] = {
        name: key,
        relation: r.recipientRelation,
        total: 0,
        count: 0,
      };
    acc[key].total += r.amountUSD || 0;
    acc[key].count += 1;
    return acc;
  }, {});

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
    uniqueRecipients,
    // derived
    recipientTotals,
    // navigator
    navMonth,
    navYear,
    YEAR_OPTIONS,
    MAX_YEAR,
    MAX_MONTH,
    isCurrentMonth,
    isFuture,
    goMonth,
    handleDateJump,
    // filter
    filterRelation,
    setFilterRelation,
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
    handleDateChange,
    // delete
    deleteId,
    setDeleteId,
    handleDelete,
  };
}
