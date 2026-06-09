import { useState, useEffect } from "react";
import { useFinance } from "../context/FinanceContext";
import { plansApi } from "../api/planApi";

const _now = new Date();
export const MAX_YEAR = _now.getFullYear();
export const MAX_MONTH = _now.getMonth() + 1;

export const CURRENCIES = ["USD", "KHR", "THB"];
export const STATUSES = ["Dreaming", "Active Allocation", "Accomplished"];
export const PRIORITIES = ["Low", "Medium", "High"];

export const YEAR_OPTIONS = Array.from(
  { length: MAX_YEAR - 2025 + 10 }, // Extended into the future for better navigation range
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

export const isFuture = (month, year) =>
  year > MAX_YEAR || (year === MAX_YEAR && month > MAX_MONTH);

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
  const [viewMode, setViewMode] = useState("TABLE"); // Managed Multi-View State
  const [records, setRecords] = useState([]);
  const [planStats, setPlanStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);

  const fetchAll = async (year, month) => {
    setLoading(true);
    try {
      const data = await plansApi.fetchPlans(year, month, syncHeaders);
      if (data.success) {
        setRecords(data.data);
        setPlanStats(data.stats ?? null);
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
    fetchAll(curYear, curMonth);
  }, [curYear, curMonth]);

  const isCurrentMonth = curYear === MAX_YEAR && curMonth === MAX_MONTH;

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
    // Future restriction removed completely
    setCurMonth(m);
    setCurYear(y);
  };

  const handleDateJump = (month, year) => {
    // Future restriction removed completely
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
        fetchAll(curYear, curMonth);
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
        fetchAll(curYear, curMonth);
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
        addNotice("All plans deleted permanently.", "success");
      }
      fetchAll(curYear, curMonth);
    } catch {
      addNotice("Server error: Could not complete deletion.", "error");
    } finally {
      setShowDeleteAll(false);
    }
  };

  // Derived metrics
  const totalTarget =
    planStats?.totalTargetUSD ??
    records.reduce((s, r) => s + (r.targetAmountUSD || 0), 0);
  const totalFunded =
    planStats?.totalFunded ??
    records.reduce((s, r) => s + (r.currentFunding || 0), 0);
  const accomplished = records.filter(
    (r) => r.status === "Accomplished",
  ).length;
  const active = records.filter((r) => r.status === "Active Allocation").length;

  return {
    curYear,
    curMonth,
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
