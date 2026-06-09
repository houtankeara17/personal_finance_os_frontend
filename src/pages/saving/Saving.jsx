import React, { useState } from "react";
import { useSavings } from "../../hooks/useSavings";

const CURRENCIES = ["USD", "KHR", "THB"];
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
const CATEGORIES = [
  "Emergency Pool",
  "Investment",
  "General Savings",
  "Education",
  "Travel Fund",
  "Other",
];
const CURRENCY_SYMBOL = { USD: "$", KHR: "₭", THB: "฿" };
const CATEGORY_STYLE = {
  "Emergency Pool": "bg-red-500/10 text-red-400 border-red-500/20",
  Investment: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "General Savings": "bg-sky-500/10 text-sky-400 border-sky-500/20",
  Education: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Travel Fund": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Other: "bg-white/[0.04] text-white/40 border-white/[0.08]",
};
const CATEGORY_ICON = {
  "Emergency Pool": "🛡️",
  Investment: "📈",
  "General Savings": "💰",
  Education: "🎓",
  "Travel Fund": "✈️",
  Other: "📦",
};

const VIEW_MODES = ["GRID", "TABLE", "LIST"];
const VIEW_STYLE = {
  GRID: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  TABLE: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  LIST: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
};

export default function Savings() {
  const [viewMode, setViewMode] = useState("TABLE");

  const {
    records,
    loading,
    visible,
    navFiltered,
    navMonthUSD,
    totalUSD,
    thisMonthUSD,
    thisMonthRecords,
    thisYearUSD,
    navMonth,
    navYear,
    YEAR_OPTIONS,
    isCurrentMonth,
    isFuture,
    goMonth,
    handleDateJump,
    filterCat,
    setFilterCat,
    showModal,
    editTarget,
    form,
    setForm,
    submitting,
    openCreate,
    openEdit,
    closeModal,
    handleSubmit,
    deleteId,
    setDeleteId,
    handleDelete,
    showDeleteAll,
    setShowDeleteAll,
    handleDeleteAll,
  } = useSavings();

  const categoryTotals = CATEGORIES.map((cat) => {
    const items = navFiltered.filter((r) => r.category === cat);
    return {
      cat,
      total: items.reduce((s, r) => s + (r.amountUSD || 0), 0),
      count: items.length,
    };
  }).filter((c) => c.count > 0);

  return (
    <div className="space-y-6 font-mono">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] text-white/20 uppercase mb-1">
            Outflow Module
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-white/90">
            Savings
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDeleteAll(true)}
            disabled={records.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/[0.06] hover:bg-red-500/[0.12] border border-red-500/[0.15] rounded-sm text-[11px] tracking-widest text-red-500/60 hover:text-red-400 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <span className="text-red-500/40">⌫</span> DELETE ALL
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-sm text-[11px] tracking-widest text-white/70 transition-all"
          >
            <span className="text-white/40">+</span> NEW SAVING
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "TOTAL SAVED (USD)",
            value: `$${totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          },
          {
            label: "THIS YEAR (USD)",
            value: `$${thisYearUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          },
          {
            label: "THIS MONTH (USD)",
            value: `$${thisMonthUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          },
          { label: "THIS MONTH ENTRIES", value: thisMonthRecords.length },
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

      {/* ── Month/Year Navigator ── */}
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
              value={navMonth}
              onChange={(e) => handleDateJump(Number(e.target.value), navYear)}
              className="bg-transparent text-white/80 text-[13px] font-semibold tracking-widest uppercase cursor-pointer outline-none border-b border-transparent hover:border-white/20 transition-colors"
            >
              {MONTHS.map((name, index) => {
                const monthNum = index + 1;
                return (
                  <option
                    key={name}
                    value={monthNum}
                    disabled={isFuture(monthNum, navYear)}
                    className="bg-[#121212] text-white"
                  >
                    {name.toUpperCase()}
                  </option>
                );
              })}
            </select>
            <select
              value={navYear}
              onChange={(e) => {
                const newYear = Number(e.target.value);
                const clampedMonth =
                  newYear === new Date().getFullYear() &&
                  navMonth > new Date().getMonth() + 1
                    ? new Date().getMonth() + 1
                    : navMonth;
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
            {navFiltered.length}{" "}
            {navFiltered.length !== 1 ? "entries" : "entry"} · $
            {navMonthUSD.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}{" "}
            saved
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

      {/* ── Category Breakdown ── */}
      {categoryTotals.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categoryTotals.map(({ cat, total, count }) => (
            <div
              key={cat}
              onClick={() => setFilterCat(filterCat === cat ? "ALL" : cat)}
              className={`border rounded-sm p-3 flex items-center gap-3 cursor-pointer transition-all ${
                filterCat === cat
                  ? CATEGORY_STYLE[cat]
                  : "border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.03]"
              }`}
            >
              <span className="text-lg">{CATEGORY_ICON[cat]}</span>
              <div className="min-w-0">
                <p className="text-[10px] text-white/60 truncate">{cat}</p>
                <p className="text-[11px] text-white/80">
                  $
                  {total.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <p className="text-[9px] text-white/25">
                  {count} {count === 1 ? "entry" : "entries"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter Bar + View Switcher ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          {["ALL", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1 rounded-sm text-[10px] tracking-widest border transition-all ${
                filterCat === cat
                  ? cat === "ALL"
                    ? "bg-white/[0.08] text-white/70 border-white/[0.15]"
                    : `${CATEGORY_STYLE[cat]} border`
                  : "border-white/[0.06] text-white/25 hover:text-white/50"
              }`}
            >
              {cat === "ALL"
                ? "ALL"
                : `${CATEGORY_ICON[cat]} ${cat.toUpperCase()}`}
            </button>
          ))}
        </div>

        {/* View mode switcher */}
        <div className="flex items-center gap-1 border border-white/[0.06] bg-white/[0.02] rounded-sm p-1">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded-sm text-[10px] tracking-widest border transition-all ${
                viewMode === mode
                  ? VIEW_STYLE[mode]
                  : "border-transparent text-white/25 hover:text-white/50"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* ── Records Display ── */}
      {loading ? (
        <div className="py-12 text-center text-[11px] text-white/20 tracking-widest">
          LOADING RECORDS...
        </div>
      ) : visible.length === 0 ? (
        <div className="py-12 border border-white/[0.06] rounded-sm text-center text-[11px] text-white/20 tracking-widest">
          NO SAVINGS RECORDS FOR {MONTHS[navMonth - 1].toUpperCase()} {navYear}
        </div>
      ) : (
        <>
          {/* TABLE VIEW */}
          {viewMode === "TABLE" && (
            <div className="border border-white/[0.06] rounded-sm overflow-hidden">
              <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] text-[9px] tracking-[0.18em] text-white/20 border-b border-white/[0.06] px-4 py-2 bg-white/[0.02]">
                <span>PERIOD</span>
                <span>AMOUNT</span>
                <span>USD VALUE</span>
                <span>CATEGORY</span>
                <span>ACTIONS</span>
              </div>
              {visible.map((rec, i) => (
                <div
                  key={rec._id}
                  className={`grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-center px-4 py-3 text-[11px] border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}
                >
                  <span className="text-white/60">
                    {MONTHS[rec.monthNumber - 1]?.slice(0, 3)} {rec.year}
                  </span>
                  <span className="text-white/80">
                    {CURRENCY_SYMBOL[rec.currency]}
                    {Number(rec.amount).toLocaleString()} {rec.currency}
                  </span>
                  <span className="text-white/50">
                    $
                    {Number(rec.amountUSD).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                  <span>
                    <span
                      className={`px-2 py-0.5 rounded-sm text-[9px] border ${CATEGORY_STYLE[rec.category] || "text-white/40 border-white/10"}`}
                    >
                      {CATEGORY_ICON[rec.category]} {rec.category.toUpperCase()}
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
              ))}
            </div>
          )}

          {/* GRID VIEW */}
          {viewMode === "GRID" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {visible.map((rec) => (
                <div
                  key={rec._id}
                  className="border border-white/[0.06] bg-white/[0.02] rounded-sm p-4 space-y-3 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-sm text-[9px] border ${CATEGORY_STYLE[rec.category] || "text-white/40 border-white/10"}`}
                    >
                      {CATEGORY_ICON[rec.category]} {rec.category.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-white/30">
                      {MONTHS[rec.monthNumber - 1]?.slice(0, 3)} {rec.year}
                    </span>
                  </div>

                  <div>
                    <p className="text-[18px] text-white/85 leading-tight">
                      {CURRENCY_SYMBOL[rec.currency]}
                      {Number(rec.amount).toLocaleString()}
                      <span className="text-[11px] text-white/30 ml-1">
                        {rec.currency}
                      </span>
                    </p>
                    <p className="text-[11px] text-white/35 mt-0.5">
                      ≈ $
                      {Number(rec.amountUSD).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}{" "}
                      USD
                    </p>
                  </div>

                  {rec.noted && (
                    <p className="text-[10px] text-white/30 border-t border-white/[0.04] pt-2 truncate">
                      {rec.noted}
                    </p>
                  )}

                  <div className="flex gap-2 pt-1 border-t border-white/[0.04]">
                    <button
                      onClick={() => openEdit(rec)}
                      className="flex-1 text-[9px] tracking-widest text-white/30 hover:text-white/70 transition-colors text-center py-1"
                    >
                      EDIT
                    </button>
                    <span className="text-white/10">|</span>
                    <button
                      onClick={() => setDeleteId(rec._id)}
                      className="flex-1 text-[9px] tracking-widest text-red-500/40 hover:text-red-400 transition-colors text-center py-1"
                    >
                      DEL
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LIST VIEW */}
          {viewMode === "LIST" && (
            <div className="space-y-2">
              {visible.map((rec) => (
                <div
                  key={rec._id}
                  className="flex items-center gap-4 border border-white/[0.06] bg-white/[0.02] rounded-sm px-4 py-3 hover:bg-white/[0.04] transition-colors"
                >
                  {/* Icon */}
                  <span className="text-xl shrink-0">
                    {CATEGORY_ICON[rec.category]}
                  </span>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[12px] text-white/80">
                        {CURRENCY_SYMBOL[rec.currency]}
                        {Number(rec.amount).toLocaleString()} {rec.currency}
                      </span>
                      <span className="text-[10px] text-white/30">
                        ≈ $
                        {Number(rec.amountUSD).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}{" "}
                        USD
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span
                        className={`px-1.5 py-0.5 rounded-sm text-[9px] border ${CATEGORY_STYLE[rec.category] || "text-white/40 border-white/10"}`}
                      >
                        {rec.category.toUpperCase()}
                      </span>
                      <span className="text-[9px] text-white/25">
                        {MONTHS[rec.monthNumber - 1]?.slice(0, 3)} {rec.year}
                      </span>
                      {rec.noted && (
                        <span className="text-[9px] text-white/20 truncate max-w-[160px]">
                          {rec.noted}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
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
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-sm w-full max-w-md mx-4 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
                {editTarget ? "Edit Saving Record" : "New Saving Record"}
              </p>
              <button
                onClick={closeModal}
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
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  placeholder="0.00"
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
                  value={form.monthNumber}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      monthNumber: Number(e.target.value),
                    }))
                  }
                  className="w-full bg-[#0c0c0c] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 focus:outline-none focus:border-white/20"
                >
                  {MONTHS.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {m}
                    </option>
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
                CATEGORY
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setForm((f) => ({ ...f, category: cat }))}
                    className={`py-2 px-3 rounded-sm text-[10px] border transition-all text-left flex items-center gap-2 ${
                      form.category === cat
                        ? `${CATEGORY_STYLE[cat]} border`
                        : "border-white/[0.06] text-white/25 hover:text-white/50"
                    }`}
                  >
                    <span>{CATEGORY_ICON[cat]}</span>
                    <span>{cat}</span>
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
                onChange={(e) =>
                  setForm((f) => ({ ...f, noted: e.target.value }))
                }
                rows={2}
                placeholder="Optional note..."
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 placeholder-white/20 focus:outline-none focus:border-white/20 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={closeModal}
                className="flex-1 py-2 border border-white/[0.08] rounded-sm text-[10px] tracking-widest text-white/30 hover:text-white/60 transition-colors"
              >
                CANCEL
              </button>
              <button
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

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-sm w-full max-w-sm mx-4 p-6 space-y-4">
            <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
              Confirm Delete
            </p>
            <p className="text-[12px] text-white/60">
              This saving record will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2 border border-white/[0.08] rounded-sm text-[10px] tracking-widest text-white/30 hover:text-white/60"
              >
                CANCEL
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-sm text-[10px] tracking-widest text-red-400 transition-all"
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Delete All Confirm ── */}
      {showDeleteAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0c0c0c] border border-red-500/20 rounded-sm w-full max-w-sm mx-4 p-6 space-y-4">
            <div>
              <p className="text-[10px] tracking-[0.2em] text-red-400/70 uppercase mb-1">
                Danger Zone
              </p>
              <p className="text-[13px] text-white/70 font-semibold">
                Delete All Savings?
              </p>
            </div>
            <p className="text-[11px] text-white/40 leading-relaxed">
              This will permanently remove all{" "}
              <span className="text-white/70">{records.length}</span> saving
              records across all months and years. This action cannot be undone.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowDeleteAll(false)}
                className="flex-1 py-2 border border-white/[0.08] rounded-sm text-[10px] tracking-widest text-white/30 hover:text-white/60 transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={handleDeleteAll}
                className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-sm text-[10px] tracking-widest text-red-400 transition-all"
              >
                DELETE ALL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
