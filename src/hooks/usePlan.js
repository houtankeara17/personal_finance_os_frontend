import { useState, useEffect, useMemo } from "react";
import { useFinance } from "../context/FinanceContext";
import { plansApi } from "../api/planApi";
import { useCurrencyRates } from "./useCurrencyRates";

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

export const FILTER_MODES = [
  "TODAY",
  "YESTERDAY",
  "LAST_1_MONTH",
  "LAST_2_MONTHS",
  "CUSTOM",
];

export const FILTER_LABELS = {
  TODAY: "TODAY",
  YESTERDAY: "YESTERDAY",
  LAST_1_MONTH: "LAST 1M",
  LAST_2_MONTHS: "LAST 2M",
  CUSTOM: "CUSTOM",
};

// Standardizes formatting to localized structure strings (YYYY-MM-DD)
const fmt = (d) => {
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, "0");
  const D = String(d.getDate()).padStart(2, "0");
  return `${Y}-${M}-${D}`;
};

export const getDateRange = (mode, year, month) => {
  const today = new Date();
  switch (mode) {
    case "TODAY":
      return { startDate: fmt(today), endDate: fmt(today) };

    case "YESTERDAY":
    case "YTD": {
      // Handles both "YESTERDAY" and fallback raw "YTD" button strings safely
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      return { startDate: fmt(yesterday), endDate: fmt(yesterday) };
    }

    case "LAST_1_MONTH": {
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      return { startDate: fmt(start), endDate: fmt(today) };
    }

    case "LAST_2_MONTHS": {
      const start = new Date();
      start.setMonth(start.getMonth() - 2);
      return { startDate: fmt(start), endDate: fmt(today) };
    }

    case "CUSTOM":
    default: {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
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

export function usePlans(targetCurrency = "USD") {
  const { syncHeaders, addNotice } = useFinance();

  // Exchange rates framework synchronized with dynamic target currencies
  const { rates, ratesLoading, fmtConverted } =
    useCurrencyRates(targetCurrency);

  const [curYear, setCurYear] = useState(MAX_YEAR);
  const [curMonth, setCurMonth] = useState(MAX_MONTH);
  const [filterMode, setFilterMode] = useState("CUSTOM");
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

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => {
        if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, [imagePreviews]);

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

  const dateRange = useMemo(() => {
    return getDateRange(filterMode, curYear, curMonth);
  }, [filterMode, curYear, curMonth]);

  // Dynamic filter array mapped via structured client calendar definitions
  const records = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return allRecords;

    // Split items safely to avoid cross-day time shifting bugs
    const [sYear, sMonth, sDay] = dateRange.startDate.split("-").map(Number);
    const [eYear, eMonth, eDay] = dateRange.endDate.split("-").map(Number);

    // Structural generation running strictly relative to user browser local time
    const start = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0).getTime();
    const end = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999).getTime();

    return allRecords.filter((r) => {
      // Prioritize targetDate deadlines; fall back cleanly to creation metadata strings
      const rawDate = r.targetDate ? r.targetDate : r.createdAt;
      if (!rawDate) return false;

      const targetTime = new Date(rawDate).getTime();
      return targetTime >= start && targetTime <= end;
    });
  }, [allRecords, dateRange]);

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
      targetDate: rec.targetDate ? rec.targetDate.split("T")[0] : "",
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
      if (file.size > 3 * 1024 * 1024) {
        return addNotice("Images must be under 3MB.", "error");
      }
      const objectUrl = URL.createObjectURL(file);
      setImagePreviews((prev) => [...prev, objectUrl]);

      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((f) => ({ ...f, images: [...f.images, reader.result] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx) => {
    const targetedPreview = imagePreviews[idx];
    if (targetedPreview && targetedPreview.startsWith("blob:")) {
      URL.revokeObjectURL(targetedPreview);
    }
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

      let targetAmountUSD = num;
      if (form.currency !== "USD") {
        const liveRate = rates ? rates[form.currency] : null;
        if (liveRate) {
          targetAmountUSD = num / liveRate;
        } else {
          targetAmountUSD =
            form.currency === "KHR"
              ? num / 4000
              : form.currency === "THB"
                ? num / 35
                : num;
        }
      }

      const payload = {
        ...form,
        targetAmount: num,
        targetAmountUSD,
        currentFunding: Number(form.currentFunding) || 0,
        targetDate: form.targetDate
          ? new Date(form.targetDate).toISOString()
          : null,
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
    loading: loading || ratesLoading,
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
    rates,
    fmtConverted,
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
