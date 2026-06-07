import React, { useState, useEffect, useCallback } from "react";
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
const TAGS = [
  "🏆 Performance",
  "📅 Annual",
  "🎄 Holiday",
  "🚀 Project",
  "🤝 Referral",
  "🎁 Other",
];
const CURRENCY_SYMBOL = { USD: "$", KHR: "៛", THB: "฿" };
const RATES = { USD: 1, KHR: 4000, THB: 35 };

const STATUS_STYLE = {
  Draft: "bg-white/[0.04] text-white/40 border border-white/[0.08]",
  Confirmed: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  Disbursed: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
};
const TAG_STYLE = {
  "🏆 Performance": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "📅 Annual": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "🎄 Holiday": "bg-green-500/10  text-green-400  border-green-500/20",
  "🚀 Project": "bg-blue-500/10   text-blue-400   border-blue-500/20",
  "🤝 Referral": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "🎁 Other": "bg-white/[0.04]  text-white/40   border-white/[0.08]",
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

const BASE = "http://localhost:5000/api/bonuses";
const SALARY_BASE = "http://localhost:5000/api/salaries";

const emptyForm = (month, monthNumber, year) => ({
  amount: "",
  currency: "USD",
  year: year ?? MAX_YEAR,
  month: month ?? MONTHS[MAX_MONTH - 1],
  monthNumber: monthNumber ?? MAX_MONTH,
  tag: "🏆 Performance",
  status: "Confirmed",
  noted: "",
});

// ─── Component ────────────────────────────────────────────────────────────────
export default function Bonus() {
  const { syncHeaders, addNotice } = useFinance();

  const [curYear, setCurYear] = useState(MAX_YEAR);
  const [curMonth, setCurMonth] = useState(MAX_MONTH);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [filterTag, setFilterTag] = useState("ALL");
  const [monthlySalary, setMonthlySalary] = useState(0);

  // ── Fetch all bonuses ─────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(BASE, { headers: syncHeaders() });
      const data = await res.json();
      if (data.success) setRecords(data.data);
      else addNotice(data.message || "Failed to load bonus records.", "error");
    } catch {
      addNotice("Network error: Failed to reach bonus system.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch salary for current month ───────────────────────────────────────
  const fetchSalary = useCallback(async () => {
    try {
      const res = await fetch(
        `${SALARY_BASE}?year=${curYear}&monthNumber=${curMonth}`,
        { headers: syncHeaders() },
      );
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        const latest = data.data[0];
        setMonthlySalary(latest.amountUSD ?? latest.amount ?? 0);
      } else {
        setMonthlySalary(0);
      }
    } catch {
      setMonthlySalary(0);
    }
  }, [curYear, curMonth]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);
  useEffect(() => {
    fetchSalary();
  }, [fetchSalary]);

  // ── Month navigation ──────────────────────────────────────────────────────
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

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm(MONTHS[curMonth - 1], curMonth, curYear));
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
      tag: rec.tag,
      status: rec.status,
      noted: rec.noted || "",
    });
    setShowModal(true);
  };

  const handleMonthChange = (monthName) => {
    const idx = MONTHS.indexOf(monthName);
    setForm((f) => ({ ...f, month: monthName, monthNumber: idx + 1 }));
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0)
      return addNotice("Enter a valid amount.", "error");

    setSubmitting(true);
    try {
      const method = editTarget ? "PUT" : "POST";
      const url = editTarget ? `${BASE}/${editTarget}` : BASE;
      const numAmount = Number(form.amount);
      const amountUSD = numAmount / RATES[form.currency];

      const res = await fetch(url, {
        method,
        headers: syncHeaders(),
        body: JSON.stringify({ ...form, amount: numAmount, amountUSD }),
      });
      const data = await res.json();

      if (data.success) {
        addNotice(
          editTarget
            ? "Bonus record updated seamlessly."
            : "Bonus record added successfully.",
          "success",
        );
        setShowModal(false);
        if (!isFuture(form.monthNumber, form.year)) {
          setCurMonth(form.monthNumber);
          setCurYear(form.year);
        }
        fetchAll();
      } else {
        addNotice(data.message || "Operation failed.", "error");
      }
    } catch {
      addNotice("Server error: Failed to save bonus record.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${BASE}/${id}`, {
        method: "DELETE",
        headers: syncHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        addNotice("Bonus record purged successfully.", "success");
        fetchAll();
      } else {
        addNotice(data.message || "Delete failed.", "error");
      }
    } catch {
      addNotice("Server error during deletion.", "error");
    } finally {
      setDeleteId(null);
    }
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalUSD = records.reduce((s, r) => s + (r.amountUSD || 0), 0);
  const disbursed = records.filter((r) => r.status === "Disbursed").length;
  const thisYear = records.filter((r) => r.year === curYear);
  const thisYearUSD = thisYear.reduce((s, r) => s + (r.amountUSD || 0), 0);
  const monthRecords = records.filter(
    (r) => r.year === curYear && r.monthNumber === curMonth,
  );
  const monthBonusUSD = monthRecords.reduce(
    (s, r) => s + (r.amountUSD || 0),
    0,
  );
  const totalComp = monthlySalary + monthBonusUSD;
  const salaryRatio =
    monthlySalary > 0
      ? ((monthBonusUSD / monthlySalary) * 100).toFixed(1)
      : null;
  const visible =
    filterTag === "ALL"
      ? monthRecords
      : monthRecords.filter((r) => r.tag === filterTag);
  const monthLabel = `${MONTHS[curMonth - 1]} ${curYear}`;
  const previewUSD =
    form.amount && !isNaN(form.amount) && Number(form.amount) > 0
      ? Number(form.amount) / RATES[form.currency]
      : null;

  const fmtUSD = (n) =>
    Number(n).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 font-mono text-white">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] text-white/20 uppercase mb-1">
            Income Module
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-white/90">
            Bonus Records
          </h1>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-sm text-[11px] tracking-widest text-white/70 transition-all"
        >
          <span className="text-white/40">+</span> NEW BONUS
        </button>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "TOTAL BONUSES (USD)", value: `$${fmtUSD(totalUSD)}` },
          { label: `${curYear} TOTAL (USD)`, value: `$${fmtUSD(thisYearUSD)}` },
          { label: `${curYear} COUNT`, value: thisYear.length },
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
      <div className="flex items-center justify-between border border-white/[0.06] bg-white/[0.02] rounded-sm px-5 py-3">
        <button
          onClick={() => goMonth(-1)}
          aria-label="Previous month"
          className="text-white/30 hover:text-white/70 text-lg px-2 transition-colors"
        >
          ‹
        </button>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <select
              value={curMonth}
              onChange={(e) => handleDateJump(Number(e.target.value), curYear)}
              className="bg-transparent text-white/80 text-[13px] font-semibold tracking-widest uppercase cursor-pointer outline-none border-b border-transparent hover:border-white/20 transition-colors"
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
              className="bg-transparent text-white/80 text-[13px] font-semibold tracking-widest cursor-pointer outline-none border-b border-transparent hover:border-white/20 transition-colors"
            >
              {YEAR_OPTIONS.map((yr) => (
                <option key={yr} value={yr} className="bg-[#121212] text-white">
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <p className="text-[10px] text-white/25 mt-0.5">
            {monthRecords.length} bonus{monthRecords.length !== 1 ? "es" : ""}{" "}
            this month
          </p>
          {isCurrentMonth && (
            <p className="text-[8px] tracking-widest text-white/20">
              CURRENT MONTH
            </p>
          )}
        </div>

        <button
          onClick={() => goMonth(+1)}
          disabled={isCurrentMonth}
          aria-label="Next month"
          className="text-white/30 hover:text-white/70 text-lg px-2 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        >
          ›
        </button>
      </div>

      {/* Month Summary Grid */}
      {monthRecords.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "SALARY",
              value: `$${fmtUSD(monthlySalary)}`,
              sub: "base pay",
            },
            {
              label: "BONUS",
              value: `$${fmtUSD(monthBonusUSD)}`,
              sub: salaryRatio ? `${salaryRatio}% of salary` : undefined,
              accent: "text-emerald-400",
            },
            {
              label: "TOTAL COMP",
              value: `$${fmtUSD(totalComp)}`,
              sub: "salary + bonus",
              accent: "text-sky-400",
            },
            {
              label: "RECORDS",
              value: monthRecords.length,
              sub: `${monthRecords.filter((r) => r.status === "Disbursed").length} disbursed`,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="border border-white/[0.06] bg-white/[0.02] rounded-sm p-4"
            >
              <p className="text-[9px] tracking-[0.2em] text-white/25 mb-2">
                {s.label}
              </p>
              <p className={`text-lg ${s.accent || "text-white/80"}`}>
                {s.value}
              </p>
              {s.sub && (
                <p className="text-[9px] text-white/20 mt-1">{s.sub}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tag Filter */}
      <div className="flex flex-wrap gap-2">
        {["ALL", ...TAGS].map((t) => (
          <button
            key={t}
            onClick={() => setFilterTag(t)}
            className={`px-3 py-1 rounded-sm text-[10px] tracking-widest border transition-all ${
              filterTag === t
                ? t === "ALL"
                  ? "bg-white/[0.08] text-white/70 border-white/[0.15]"
                  : `${TAG_STYLE[t]} border`
                : "border-white/[0.06] text-white/25 hover:text-white/50"
            }`}
          >
            {t === "ALL" ? "ALL TAGS" : t}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border border-white/[0.06] rounded-sm overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] text-[9px] tracking-[0.18em] text-white/20 border-b border-white/[0.06] px-4 py-2 bg-white/[0.02]">
          <span>PERIOD</span>
          <span>AMOUNT</span>
          <span>USD VALUE</span>
          <span>TAG</span>
          <span>STATUS</span>
          <span>ACTIONS</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[11px] text-white/20 tracking-widest">
            LOADING RECORDS...
          </div>
        ) : monthRecords.length === 0 ? (
          <div className="py-14 text-center space-y-2">
            <p className="text-[11px] tracking-[0.2em] text-white/20 uppercase">
              No bonuses in {monthLabel}
            </p>
            <p className="text-[10px] text-white/15">
              Salary: ${fmtUSD(monthlySalary)} · Bonus: $0.00 · Nothing logged
              yet
            </p>
          </div>
        ) : visible.length === 0 ? (
          <div className="py-12 text-center space-y-1">
            <p className="text-[11px] tracking-[0.2em] text-white/20 uppercase">
              No records match this tag
            </p>
            <p className="text-[10px] text-white/15">
              {monthRecords.length} record{monthRecords.length !== 1 ? "s" : ""}{" "}
              exist — try ALL TAGS
            </p>
          </div>
        ) : (
          visible.map((rec, i) => (
            <div
              key={rec._id}
              className={`grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] items-center px-4 py-3 text-[11px] border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i % 2 !== 0 ? "bg-white/[0.01]" : ""}`}
            >
              <span className="text-white/60">
                {rec.month} {rec.year}
              </span>
              <span className="text-white/80">
                {CURRENCY_SYMBOL[rec.currency] || "$"}
                {Number(rec.amount).toLocaleString()} {rec.currency}
              </span>
              <span className="text-white/50">${fmtUSD(rec.amountUSD)}</span>
              <span>
                <span
                  className={`px-2 py-0.5 rounded-sm text-[9px] border ${TAG_STYLE[rec.tag] || "text-white/40 border-white/10"}`}
                >
                  {rec.tag}
                </span>
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
          <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-sm w-full max-w-md mx-4 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
                {editTarget ? "Edit Bonus Record" : "New Bonus Record"}
              </p>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/20 hover:text-white/60 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] tracking-widest text-white/25">
                MONTHLY SALARY (USD) — READ ONLY
              </label>
              <input
                type="text"
                disabled
                value={
                  monthlySalary > 0
                    ? `$${fmtUSD(monthlySalary)}`
                    : "No salary on record for this month"
                }
                className="w-full bg-white/[0.02] border border-white/[0.05] rounded-sm px-3 py-2 text-[12px] text-white/30 cursor-not-allowed"
              />
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

            {previewUSD !== null && (
              <div className="grid grid-cols-3 gap-2 border border-white/[0.06] bg-white/[0.02] rounded-sm px-4 py-3">
                <div>
                  <p className="text-[9px] tracking-widest text-white/20 mb-1">
                    SALARY
                  </p>
                  <p className="text-[12px] text-white/60">
                    ${fmtUSD(monthlySalary)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] tracking-widest text-white/20 mb-1">
                    BONUS (USD)
                  </p>
                  <p className="text-[12px] text-emerald-400">
                    ${fmtUSD(previewUSD)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] tracking-widest text-white/20 mb-1">
                    TOTAL COMP
                  </p>
                  <p className="text-[12px] text-sky-400">
                    ${fmtUSD(monthlySalary + previewUSD)}
                  </p>
                </div>
              </div>
            )}

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

            <div className="space-y-2">
              <label className="text-[9px] tracking-widest text-white/25">
                BONUS TAG
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TAGS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, tag: t }))}
                    className={`py-1.5 px-2 rounded-sm text-[10px] border transition-all text-left ${form.tag === t ? `${TAG_STYLE[t]} border` : "border-white/[0.06] text-white/25 hover:text-white/50"}`}
                  >
                    {t}
                  </button>
                ))}
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

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-sm w-full max-w-sm mx-4 p-6 space-y-4">
            <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
              Confirm Delete
            </p>
            <p className="text-[12px] text-white/60">
              This bonus record will be permanently removed.
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
