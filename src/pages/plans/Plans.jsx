import React, { useState, useEffect } from "react";
import { useFinance } from "../../context/FinanceContext";
import BASE_URL from "../../api/config";

// ─── Module-level constants ───────────────────────────────────────────────────
const CURRENCIES = ["USD", "KHR", "THB"];
const STATUSES = ["Dreaming", "Active Allocation", "Accomplished"];
const PRIORITIES = ["Low", "Medium", "High"];
const CURRENCY_SYMBOL = { USD: "$", KHR: "៛", THB: "฿" };

const STATUS_STYLE = {
  Dreaming: "bg-white/[0.04] text-white/40 border border-white/[0.08]",
  "Active Allocation":
    "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  Accomplished:
    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
};

const PRIORITY_STYLE = {
  Low: "bg-white/[0.04] text-white/30 border border-white/[0.06]",
  Medium: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
  High: "bg-red-500/10 text-red-400 border border-red-500/20",
};

const _now = new Date();
const MAX_YEAR = _now.getFullYear();
const MAX_MONTH = _now.getMonth() + 1;
const YEAR_OPTIONS = Array.from(
  { length: MAX_YEAR - 2025 + 1 },
  (_, i) => 2025 + i,
);
const MONTHS = [
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
const isFuture = (month, year) =>
  year > MAX_YEAR || (year === MAX_YEAR && month > MAX_MONTH);

const emptyForm = {
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

const BASE = `${BASE_URL}/api/plans`;

// ─── Component ────────────────────────────────────────────────────────────────
export default function Plans() {
  const { syncHeaders, addNotice } = useFinance();

  const [curYear, setCurYear] = useState(MAX_YEAR);
  const [curMonth, setCurMonth] = useState(MAX_MONTH);
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

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchAll = async (year, month) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}?year=${year}&month=${month}`, {
        headers: syncHeaders(),
      });
      const data = await res.json();
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

  // ── Month navigation ─────────────────────────────────────────────────────
  const isCurrentMonth = curYear === MAX_YEAR && curMonth === MAX_MONTH;

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

  // ── Modal helpers ────────────────────────────────────────────────────────
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

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.title.trim()) return addNotice("Title is required.", "error");
    if (
      !form.targetAmount ||
      isNaN(form.targetAmount) ||
      Number(form.targetAmount) <= 0
    )
      return addNotice("Enter a valid target amount.", "error");

    setSubmitting(true);
    try {
      const method = editTarget ? "PUT" : "POST";
      const url = editTarget ? `${BASE}/${editTarget}` : BASE;
      const num = Number(form.targetAmount);
      const targetAmountUSD =
        form.currency === "KHR"
          ? num / 4000
          : form.currency === "THB"
            ? num / 35
            : num;

      const res = await fetch(url, {
        method,
        headers: syncHeaders(),
        body: JSON.stringify({
          ...form,
          targetAmount: num,
          targetAmountUSD,
          currentFunding: Number(form.currentFunding) || 0,
        }),
      });
      const data = await res.json();
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

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${BASE}/${id}`, {
        method: "DELETE",
        headers: syncHeaders(),
      });
      const data = await res.json();
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

  // ── Delete All ───────────────────────────────────────────────────────────
  const handleDeleteAll = async () => {
    try {
      const results = await Promise.all(
        records.map((rec) =>
          fetch(`${BASE}/${rec._id}`, {
            method: "DELETE",
            headers: syncHeaders(),
          }).then((r) => r.json()),
        ),
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

  // ── Derived stats ────────────────────────────────────────────────────────
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

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 font-mono text-white">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] text-white/20 uppercase mb-1">
            Goals Module
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-white/90">
            Financial Plans
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {records.length > 0 && (
            <button
              onClick={() => setShowDeleteAll(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/[0.06] hover:bg-red-500/[0.12] border border-red-500/20 rounded-sm text-[11px] tracking-widest text-red-500/60 hover:text-red-400 transition-all"
            >
              <span className="text-red-500/40">✕</span> DELETE ALL
            </button>
          )}
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-sm text-[11px] tracking-widest text-white/70 transition-all"
          >
            <span className="text-white/40">+</span> NEW PLAN
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "TOTAL TARGET (USD)",
            value: `$${totalTarget.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          },
          {
            label: "TOTAL FUNDED",
            value: `$${totalFunded.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          },
          { label: "ACTIVE", value: active },
          { label: "ACCOMPLISHED", value: accomplished },
        ].map((s) => (
          <div
            key={s.label}
            className="border border-white/[0.06] bg-white/[0.02] rounded-sm p-4"
          >
            <p className="text-[9px] tracking-[0.2em] text-white/25 mb-2">
              {s.label}
            </p>
            <p className="text-lg text-white/80">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between border border-white/[0.06] rounded-lg px-4 py-2.5 bg-white/[0.01]">
        <button
          onClick={() => goMonth(-1)}
          className="text-[10px] tracking-widest text-white/30 hover:text-white/70 transition-colors px-2 py-1 rounded"
        >
          ← PREV
        </button>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5">
            <select
              value={curMonth}
              onChange={(e) => handleDateJump(Number(e.target.value), curYear)}
              className="bg-transparent text-white/80 text-[12px] font-medium tracking-widest uppercase cursor-pointer outline-none border-b border-transparent hover:border-white/20 transition-colors"
            >
              {MONTHS.map((name, index) => {
                const monthNum = index + 1;
                return (
                  <option
                    key={name}
                    value={monthNum}
                    disabled={isFuture(monthNum, curYear)}
                    className="bg-[#121212] text-white"
                  >
                    {name.toUpperCase()}
                  </option>
                );
              })}
            </select>

            <select
              value={curYear}
              onChange={(e) => {
                const newYear = Number(e.target.value);
                const clampedMonth =
                  newYear === MAX_YEAR && curMonth > MAX_MONTH
                    ? MAX_MONTH
                    : curMonth;
                handleDateJump(clampedMonth, newYear);
              }}
              className="bg-transparent text-white/80 text-[12px] font-medium tracking-widest cursor-pointer outline-none border-b border-transparent hover:border-white/20 transition-colors"
            >
              {YEAR_OPTIONS.map((yr) => (
                <option key={yr} value={yr} className="bg-[#121212] text-white">
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {isCurrentMonth && (
            <p className="text-[8px] tracking-widest text-white/25 mt-0.5">
              CURRENT MONTH
            </p>
          )}
        </div>

        <button
          onClick={() => goMonth(+1)}
          disabled={isCurrentMonth}
          className="text-[10px] tracking-widest text-white/30 hover:text-white/70 transition-colors px-2 py-1 rounded disabled:opacity-20 disabled:cursor-not-allowed"
        >
          NEXT →
        </button>
      </div>

      {/* Table */}
      <div className="border border-white/[0.06] rounded-sm overflow-hidden">
        <div className="grid grid-cols-[1.5fr_1fr_1fr_80px_1fr_1fr_auto] text-[9px] tracking-[0.18em] text-white/20 border-b border-white/[0.06] px-4 py-2 bg-white/[0.02]">
          <span>TITLE</span>
          <span>TARGET</span>
          <span>FUNDED</span>
          <span>PROGRESS</span>
          <span>STATUS</span>
          <span>PRIORITY</span>
          <span>ACTIONS</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[11px] text-white/20 tracking-widest">
            LOADING PLANS...
          </div>
        ) : records.length === 0 ? (
          <div className="py-12 text-center text-[11px] text-white/20 tracking-widest">
            NO PLANS FOUND
          </div>
        ) : (
          records.map((rec, i) => {
            const pct = Math.min(
              100,
              Math.round(
                ((rec.currentFunding || 0) / (rec.targetAmountUSD || 1)) * 100,
              ),
            );
            return (
              <div
                key={rec._id}
                className={`grid grid-cols-[1.5fr_1fr_1fr_80px_1fr_1fr_auto] items-center px-4 py-3 text-[11px] border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i % 2 !== 0 ? "bg-white/[0.01]" : ""}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {rec.images?.[0] ? (
                    <a
                      href={rec.images[0]}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-shrink-0 w-6 h-6 rounded-sm overflow-hidden border border-white/10 hover:border-white/40 transition-colors"
                    >
                      <img
                        src={rec.images[0]}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ) : (
                    <span className="flex-shrink-0 w-6 h-6 rounded-sm border border-white/[0.06] bg-white/[0.02]" />
                  )}
                  <span className="text-white/70 truncate">{rec.title}</span>
                </div>

                <span className="text-white/80">
                  {CURRENCY_SYMBOL[rec.currency] || "$"}
                  {Number(rec.targetAmount).toLocaleString()} {rec.currency}
                </span>

                <span className="text-white/50">
                  $
                  {Number(rec.currentFunding || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>

                {/* Progress bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-emerald-400" : "bg-sky-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-white/30 w-7 text-right">
                    {pct}%
                  </span>
                </div>

                <span>
                  <span
                    className={`px-2 py-0.5 rounded-sm text-[9px] tracking-widest ${STATUS_STYLE[rec.status] || STATUS_STYLE.Dreaming}`}
                  >
                    {rec.status === "Active Allocation"
                      ? "ACTIVE"
                      : rec.status?.toUpperCase()}
                  </span>
                </span>

                <span>
                  <span
                    className={`px-2 py-0.5 rounded-sm text-[9px] tracking-widest ${PRIORITY_STYLE[rec.priority] || PRIORITY_STYLE.Medium}`}
                  >
                    {rec.priority?.toUpperCase()}
                  </span>
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(rec)}
                    className="text-[9px] tracking-widest text-white/30 hover:text-white/70 transition-colors"
                  >
                    EDIT
                  </button>
                  <span className="text-white/10">|</span>
                  <button
                    onClick={() => setDeleteId(rec._id)}
                    className="text-[9px] tracking-widest text-red-500/40 hover:text-red-400 transition-colors"
                  >
                    DEL
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-sm w-full max-w-lg mx-4 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
                {editTarget ? "Edit Plan" : "New Plan"}
              </p>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/20 hover:text-white/60 text-lg leading-none"
              >
                ×
              </button>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="text-[9px] tracking-widest text-white/25">
                TITLE
              </label>
              <input
                type="text"
                value={form.title}
                placeholder="e.g. MacBook Pro, Family Vacation..."
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 placeholder-white/20 focus:outline-none focus:border-white/20"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[9px] tracking-widest text-white/25">
                DESCRIPTION
              </label>
              <input
                type="text"
                value={form.description}
                placeholder="Optional details..."
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 placeholder-white/20 focus:outline-none focus:border-white/20"
              />
            </div>

            {/* Amount + Currency */}
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-[9px] tracking-widest text-white/25">
                  TARGET AMOUNT
                </label>
                <input
                  type="number"
                  value={form.targetAmount}
                  placeholder="0.00"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, targetAmount: e.target.value }))
                  }
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 placeholder-white/20 focus:outline-none focus:border-white/20"
                />
              </div>
              <div className="w-28 space-y-1">
                <label className="text-[9px] tracking-widest text-white/25">
                  CURRENCY
                </label>
                <select
                  value={form.currency}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, currency: e.target.value }))
                  }
                  className="w-full bg-[#0c0c0c] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 focus:outline-none focus:border-white/20"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Current Funding + Target Date */}
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-[9px] tracking-widest text-white/25">
                  CURRENT FUNDING ($)
                </label>
                <input
                  type="number"
                  value={form.currentFunding}
                  placeholder="0.00"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, currentFunding: e.target.value }))
                  }
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 placeholder-white/20 focus:outline-none focus:border-white/20"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[9px] tracking-widest text-white/25">
                  TARGET DATE
                </label>
                <input
                  type="date"
                  value={form.targetDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, targetDate: e.target.value }))
                  }
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 focus:outline-none focus:border-white/20"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>

            {/* Images */}
            <div className="space-y-1">
              <label className="text-[9px] tracking-widest text-white/25">
                IMAGES (INSPIRATION / PROOF)
              </label>
              <div className="p-3 bg-white/[0.02] border border-white/[0.06] border-dashed rounded-sm space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    id="plan-files"
                    onChange={handleFilesChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="plan-files"
                    className="inline-block px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] rounded-sm text-[9px] tracking-widest text-white/60 cursor-pointer transition-colors uppercase"
                  >
                    Choose Files
                  </label>
                  <p className="text-[9px] text-white/20">
                    PNG, JPG up to 3MB each
                  </p>
                </div>
                {imagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {imagePreviews.map((src, idx) => (
                      <div
                        key={idx}
                        className="relative w-12 h-12 border border-white/10 rounded-sm overflow-hidden bg-black flex-shrink-0"
                      >
                        <img
                          src={src}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-red-400 text-[9px] font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-[9px] tracking-widest text-white/25">
                STATUS
              </label>
              <div className="flex gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, status: s }))}
                    className={`flex-1 py-1.5 rounded-sm text-[9px] tracking-widest border transition-all ${form.status === s ? STATUS_STYLE[s] : "border-white/[0.06] text-white/20 hover:text-white/40"}`}
                  >
                    {s === "Active Allocation" ? "ACTIVE" : s.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <label className="text-[9px] tracking-widest text-white/25">
                PRIORITY
              </label>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, priority: p }))}
                    className={`flex-1 py-1.5 rounded-sm text-[9px] tracking-widest border transition-all ${form.priority === p ? PRIORITY_STYLE[p] : "border-white/[0.06] text-white/20 hover:text-white/40"}`}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-[9px] tracking-widest text-white/25">
                NOTES
              </label>
              <textarea
                value={form.noted}
                rows={2}
                placeholder="Optional note..."
                onChange={(e) =>
                  setForm((f) => ({ ...f, noted: e.target.value }))
                }
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 placeholder-white/20 focus:outline-none focus:border-white/20 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 border border-white/[0.08] rounded-sm text-[10px] tracking-widest text-white/30 hover:text-white/60 transition-colors"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2 bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.1] rounded-sm text-[10px] tracking-widest text-white/70 transition-all disabled:opacity-40"
              >
                {submitting ? "SAVING..." : editTarget ? "UPDATE" : "CREATE"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Modal */}
      {showDeleteAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0c0c0c] border border-red-500/20 rounded-sm w-full max-w-sm mx-4 p-6 space-y-4">
            <p className="text-[10px] tracking-[0.2em] text-red-400/70 uppercase">
              Confirm Delete All
            </p>
            <p className="text-[12px] text-white/60">
              All{" "}
              <span className="text-white/80 font-semibold">
                {records.length} plan{records.length !== 1 ? "s" : ""}
              </span>{" "}
              for this period will be permanently removed. This cannot be
              undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteAll(false)}
                className="flex-1 py-2 border border-white/[0.08] rounded-sm text-[10px] tracking-widest text-white/30 hover:text-white/60 transition-colors"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleDeleteAll}
                className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-sm text-[10px] tracking-widest text-red-400 transition-all"
              >
                DELETE ALL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-sm w-full max-w-sm mx-4 p-6 space-y-4">
            <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
              Confirm Delete
            </p>
            <p className="text-[12px] text-white/60">
              This plan will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2 border border-white/[0.08] rounded-sm text-[10px] tracking-widest text-white/30 hover:text-white/60"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-sm text-[10px] tracking-widest text-red-400 transition-all"
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
