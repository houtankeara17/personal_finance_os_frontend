import { useState, useEffect, useMemo } from "react";
import { useFinance } from "../context/FinanceContext";
import { plansApi } from "../api/planApi";

const _now = new Date();
export const MAX_YEAR = _now.getFullYear();
export const MAX_MONTH = _now.getMonth() + 1;

export const CURRENCIES = ["USD", "KHR", "THB"];
export const STATUSES = ["Dreaming", "Active Allocation", "Accomplished"];
export const PRIORITIES = ["Low", "Medium", "High"];

export const YEAR_OPTIONS = Array.from(
  { length: MAX_YEAR - 2025 + 10 },
  (_, i) => 2025 + i,
);

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

// ─── Date Range Filter Modes ─────────────────────────────────────────────────
export const FILTER_MODES = [
  "TODAY",
  "YTD",
  "LAST_1_MONTH",
  "LAST_2_MONTHS",
  "CUSTOM",
];

export const FILTER_LABELS = {
  TODAY: "TODAY",
  YTD: "YTD",
  LAST_1_MONTH: "LAST 1M",
  LAST_2_MONTHS: "LAST 2M",
  CUSTOM: "CUSTOM",
};

const fmt = (d) => d.toISOString().split("T")[0];

// Computes the {startDate, endDate} window for a given filter mode
export const getDateRange = (mode, year, month) => {
  const today = new Date();

  switch (mode) {
    case "TODAY": {
      return { startDate: fmt(today), endDate: fmt(today) };
    }
    case "YTD": {
      const start = new Date(today.getFullYear(), 0, 1);
      return { startDate: fmt(start), endDate: fmt(today) };
    }
    case "LAST_1_MONTH": {
      const start = new Date(today);
      start.setMonth(start.getMonth() - 1);
      return { startDate: fmt(start), endDate: fmt(today) };
    }
    case "LAST_2_MONTHS": {
      const start = new Date(today);
      start.setMonth(start.getMonth() - 2);
      return { startDate: fmt(start), endDate: fmt(today) };
    }
    case "CUSTOM":
    default: {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0); // last day of selected month
      return { startDate: fmt(start), endDate: fmt(end) };
    }
  }
};

export const emptyForm = {
  title: "",
  description: "",
  targetAmount: "",
  currency: "USD",
  currentFunding: "",
  targetDate: "",
  status: "Dreaming",
  priority: "Medium",
  images: [],
  noted: "",
};

export function usePlans() {
  const { syncHeaders, addNotice } = useFinance();

  const [curYear, setCurYear] = useState(MAX_YEAR);
  const [curMonth, setCurMonth] = useState(MAX_MONTH);
  const [filterMode, setFilterMode] = useState("CUSTOM"); // default = old month-nav behavior
  const [viewMode, setViewMode] = useState("TABLE");
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await plansApi.fetchPlans(syncHeaders);
      if (data.success) {
        setAllRecords(data.data || []);
      } else {
        addNotice(data.message || "Failed to load plans.", "error");
      }
    } catch {
      addNotice("Network error: Could not reach server.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const isCurrentMonth = curYear === MAX_YEAR && curMonth === MAX_MONTH;

  const dateRange = getDateRange(filterMode, curYear, curMonth);

  // Client-side filter applied on top of the full record set
  const records = useMemo(() => {
    const start = new Date(dateRange.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateRange.endDate);
    end.setHours(23, 59, 59, 999);

    return allRecords.filter((r) => {
      const created = new Date(r.createdAt);
      return created >= start && created <= end;
    });
  }, [allRecords, dateRange.startDate, dateRange.endDate]);

  const goMonth = (delta) => {
    let m = curMonth + delta;
    let y = curYear;
    if (m < 1) {
      m = 12;
      y--;
    }
    if (m > 12) {
      m = 1;
      y++;
    }
    setCurMonth(m);
    setCurYear(y);
  };

  const handleDateJump = (month, year) => {
    setCurMonth(month);
    setCurYear(year);
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setImagePreviews([]);
    setShowModal(true);
  };

  const openEdit = (rec) => {
    setEditTarget(rec._id);
    setForm({
      title: rec.title,
      description: rec.description || "",
      targetAmount: rec.targetAmount,
      currency: rec.currency,
      currentFunding: rec.currentFunding || 0,
      targetDate: rec.targetDate
        ? new Date(rec.targetDate).toISOString().split("T")[0]
        : "",
      status: rec.status,
      priority: rec.priority,
      images: rec.images || [],
      noted: rec.noted || "",
    });
    setImagePreviews(rec.images || []);
    setShowModal(true);
  };

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      if (file.size > 3 * 1024 * 1024)
        return addNotice("Images must be under 3MB.", "error");
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result]);
        setForm((f) => ({ ...f, images: [...f.images, reader.result] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return addNotice("Title is required.", "error");
    if (
      !form.targetAmount ||
      isNaN(form.targetAmount) ||
      Number(form.targetAmount) <= 0
    ) {
      return addNotice("Enter a valid target amount.", "error");
    }

    setSubmitting(true);
    try {
      const num = Number(form.targetAmount);
      const targetAmountUSD =
        form.currency === "KHR"
          ? num / 4000
          : form.currency === "THB"
            ? num / 35
            : num;

      const payload = {
        ...form,
        targetAmount: num,
        targetAmountUSD,
        currentFunding: Number(form.currentFunding) || 0,
      };

      const data = editTarget
        ? await plansApi.updatePlan(editTarget, payload, syncHeaders)
        : await plansApi.createPlan(payload, syncHeaders);

      if (data.success) {
        addNotice(
          editTarget
            ? "Plan updated successfully."
            : "Plan created successfully.",
          "success",
        );
        setShowModal(false);
        fetchAll();
      } else {
        addNotice(data.message || "Operation failed.", "error");
      }
    } catch {
      addNotice("Server error: Failed to save plan.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const data = await plansApi.deletePlan(id, syncHeaders);
      if (data.success) {
        addNotice("Plan deleted permanently.", "success");
        fetchAll();
      } else {
        addNotice(data.message || "Delete failed.", "error");
      }
    } catch {
      addNotice("Server error: Could not complete deletion.", "error");
    } finally {
      setDeleteId(null);
    }
  };

  const handleDeleteAll = async () => {
    try {
      const results = await Promise.all(
        records.map((rec) => plansApi.deletePlan(rec._id, syncHeaders)),
      );
      const failed = results.filter((r) => !r.success).length;
      if (failed > 0) {
        addNotice(`${failed} record(s) failed to delete.`, "error");
      } else {
        addNotice("All plans for this period deleted permanently.", "success");
      }
      fetchAll();
    } catch {
      addNotice("Server error: Could not complete deletion.", "error");
    } finally {
      setShowDeleteAll(false);
    }
  };

  // Derived metrics — computed from the currently filtered `records`
  const totalTarget = records.reduce((s, r) => s + (r.targetAmountUSD || 0), 0);
  const totalFunded = records.reduce((s, r) => s + (r.currentFunding || 0), 0);
  const accomplished = records.filter(
    (r) => r.status === "Accomplished",
  ).length;
  const active = records.filter((r) => r.status === "Active Allocation").length;

  return {
    curYear,
    curMonth,
    filterMode,
    dateRange,
    viewMode,
    setViewMode,
    records,
    loading,
    showModal,
    editTarget,
    form,
    submitting,
    deleteId,
    showDeleteAll,
    imagePreviews,
    isCurrentMonth,
    totalTarget,
    totalFunded,
    accomplished,
    active,
    setCurYear,
    setCurMonth,
    setFilterMode,
    setForm,
    setShowModal,
    setDeleteId,
    setShowDeleteAll,
    goMonth,
    handleDateJump,
    openCreate,
    openEdit,
    handleFilesChange,
    removeImage,
    handleSubmit,
    handleDelete,
    handleDeleteAll,
  };
}
