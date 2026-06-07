import React, { useState, useEffect } from "react";
import { useFinance } from "../../context/FinanceContext";

// ─── Module-level constants (OUTSIDE component) ───────────────────────────────
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
const CURRENCIES = ["USD", "KHR", "THB"];
const STATUSES = ["Draft", "Confirmed", "Disbursed"];
const CURRENCY_SYMBOL = { USD: "$", KHR: "៛", THB: "฿" };
const STATUS_STYLE = {
  Draft: "bg-white/[0.04] text-white/40 border border-white/[0.08]",
  Confirmed: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  Disbursed: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
};

const _now = new Date();
const MAX_YEAR = _now.getFullYear();
const MAX_MONTH = _now.getMonth() + 1;
const YEAR_OPTIONS = Array.from(
  { length: MAX_YEAR - 2025 + 1 },
  (_, i) => 2025 + i,
);
const isFuture = (month, year) =>
  year > MAX_YEAR || (year === MAX_YEAR && month > MAX_MONTH);

const emptyForm = {
  amount: "",
  currency: "USD",
  year: MAX_YEAR,
  month: MONTHS[_now.getMonth()],
  monthNumber: MAX_MONTH,
  status: "Confirmed",
  image: "",
  noted: "",
};

const BASE = "http://localhost:5000/api/salaries";

// ─── Component ────────────────────────────────────────────────────────────────
export default function Salary() {
  const { syncHeaders, addNotice } = useFinance();

  const [curYear, setCurYear] = useState(MAX_YEAR);
  const [curMonth, setCurMonth] = useState(MAX_MONTH);
  const [records, setRecords] = useState([]);
  const [salaryStats, setSalaryStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchAll = async (year, month) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}?year=${year}&monthNumber=${month}`, {
        headers: syncHeaders(),
      });
      const data = await res.json();
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
    setPreviewImage(null);
    setShowModal(true);
  };

  const openEdit = (rec) => {
    setEditTarget(rec._id);
    setForm({
      amount: rec.amount,
      currency: rec.currency,
      year: rec.year,
      month: rec.month,
      monthNumber: rec.monthNumber,
      status: rec.status,
      image: rec.image || "",
      noted: rec.noted || "",
    });
    setPreviewImage(rec.image || null);
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024)
      return addNotice(
        "Payload constraint: Images must be under 3MB.",
        "error",
      );
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
      setForm((f) => ({ ...f, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleMonthChange = (monthName) => {
    const idx = MONTHS.indexOf(monthName);
    setForm((f) => ({ ...f, month: monthName, monthNumber: idx + 1 }));
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0)
      return addNotice("Enter a valid amount.", "error");

    setSubmitting(true);
    try {
      const method = editTarget ? "PUT" : "POST";
      const url = editTarget ? `${BASE}/${editTarget}` : BASE;
      const num = Number(form.amount);
      const amountUSD =
        form.currency === "KHR"
          ? num / 4000
          : form.currency === "THB"
            ? num / 35
            : num;

      const res = await fetch(url, {
        method,
        headers: syncHeaders(),
        body: JSON.stringify({ ...form, amount: num, amountUSD }),
      });
      const data = await res.json();
      if (data.success) {
        addNotice(
          editTarget
            ? "Salary record updated successfully."
            : "Salary record added successfully.",
          "success",
        );
        setShowModal(false);
        fetchAll(curYear, curMonth);
      } else {
        addNotice(data.message || "Operation failed.", "error");
      }
    } catch {
      addNotice("Server error: Failed to save record.", "error");
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
        addNotice("Record deleted permanently.", "success");
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

  // ── Derived stats ────────────────────────────────────────────────────────
  const totalUSD =
    salaryStats?.totalEarned ??
    records.reduce((s, r) => s + (r.amountUSD || 0), 0);
  const disbursed = records.filter((r) => r.status === "Disbursed").length;
  const confirmed = records.filter((r) => r.status === "Confirmed").length;
  const thisYear = records.filter((r) => r.year === MAX_YEAR).length;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 font-mono text-white">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] text-white/20 uppercase mb-1">
            Income Module
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-white/90">
            Salary Records
          </h1>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-sm text-[11px] tracking-widest text-white/70 transition-all"
        >
          <span className="text-white/40">+</span> NEW RECORD
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "TOTAL INCOME (USD)",
            value: `$${totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          },
          { label: "THIS YEAR", value: thisYear },
          { label: "CONFIRMED", value: confirmed },
          { label: "DISBURSED", value: disbursed },
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
        <div className="grid grid-cols-[1fr_1fr_1fr_60px_1fr_auto] text-[9px] tracking-[0.18em] text-white/20 border-b border-white/[0.06] px-4 py-2 bg-white/[0.02]">
          <span>PERIOD</span>
          <span>AMOUNT</span>
          <span>USD VALUE</span>
          <span>PROOF</span>
          <span>STATUS</span>
          <span>ACTIONS</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[11px] text-white/20 tracking-widest">
            LOADING RECORDS...
          </div>
        ) : records.length === 0 ? (
          <div className="py-12 text-center text-[11px] text-white/20 tracking-widest">
            NO SALARY RECORDS FOUND
          </div>
        ) : (
          records.map((rec, i) => (
            <div
              key={rec._id}
              className={`grid grid-cols-[1fr_1fr_1fr_60px_1fr_auto] items-center px-4 py-3 text-[11px] border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i % 2 !== 0 ? "bg-white/[0.01]" : ""}`}
            >
              <span className="text-white/60">
                {rec.month} {rec.year}
              </span>
              <span className="text-white/80">
                {CURRENCY_SYMBOL[rec.currency] || "$"}
                {Number(rec.amount).toLocaleString()} {rec.currency}
              </span>
              <span className="text-white/50">
                $
                {Number(rec.amountUSD).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
              <span>
                {rec.image ? (
                  <a
                    href={rec.image}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-7 h-7 bg-white/[0.04] border border-white/10 rounded-sm overflow-hidden hover:border-white/40 transition-colors"
                  >
                    <img
                      src={rec.image}
                      alt="Proof"
                      className="w-full h-full object-cover"
                    />
                  </a>
                ) : (
                  <span className="text-[10px] text-white/10">—</span>
                )}
              </span>
              <span>
                <span
                  className={`px-2 py-0.5 rounded-sm text-[9px] tracking-widest ${STATUS_STYLE[rec.status] || STATUS_STYLE.Draft}`}
                >
                  {rec.status ? rec.status.toUpperCase() : "DRAFT"}
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
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-sm w-full max-w-md mx-4 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
                {editTarget ? "Edit Salary Record" : "New Salary Record"}
              </p>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/20 hover:text-white/60 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-[9px] tracking-widest text-white/25">
                  AMOUNT
                </label>
                <input
                  type="number"
                  value={form.amount}
                  placeholder="0.00"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
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

            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-[9px] tracking-widest text-white/25">
                  MONTH
                </label>
                <select
                  value={form.month}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="w-full bg-[#0c0c0c] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 focus:outline-none focus:border-white/20"
                >
                  {MONTHS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="w-28 space-y-1">
                <label className="text-[9px] tracking-widest text-white/25">
                  YEAR
                </label>
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, year: Number(e.target.value) }))
                  }
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 focus:outline-none focus:border-white/20"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] tracking-widest text-white/25">
                RECEIPT / PROOF IMAGE
              </label>
              <div className="flex items-center gap-4 p-3 bg-white/[0.02] border border-white/[0.06] border-dashed rounded-sm">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    id="salary-file"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="salary-file"
                    className="inline-block px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] rounded-sm text-[9px] tracking-widest text-white/60 cursor-pointer transition-colors uppercase"
                  >
                    Choose File
                  </label>
                  <p className="text-[9px] text-white/20 mt-1">
                    PNG, JPG up to 3MB
                  </p>
                </div>
                {previewImage && (
                  <div className="relative w-12 h-12 border border-white/10 rounded-sm overflow-hidden bg-black flex-shrink-0">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewImage(null);
                        setForm((f) => ({ ...f, image: "" }));
                      }}
                      className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-red-400 text-[9px] font-bold tracking-tighter"
                    >
                      REMOVE
                    </button>
                  </div>
                )}
              </div>
            </div>

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
                    className={`flex-1 py-1.5 rounded-sm text-[10px] tracking-widest border transition-all ${form.status === s ? STATUS_STYLE[s] : "border-white/[0.06] text-white/20 hover:text-white/40"}`}
                  >
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

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

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-sm w-full max-w-sm mx-4 p-6 space-y-4">
            <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
              Confirm Delete
            </p>
            <p className="text-[12px] text-white/60">
              This salary record will be permanently removed.
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
