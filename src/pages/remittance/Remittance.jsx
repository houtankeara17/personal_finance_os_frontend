import React from "react";
import { useRemittance } from "../../hooks/useRemittance";

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
const RELATIONS = [
  "Mother",
  "Father",
  "Sibling",
  "Spouse",
  "Child",
  "Relative",
  "Friend",
  "Other",
];
const METHODS = [
  "Cash",
  "ABA Bank",
  "ACLYDA Bank",
  "Wing",
  "Bank Transfer",
  "Other",
];
const CURRENCY_SYMBOL = { USD: "$", KHR: "₭", THB: "฿" };
const RELATION_STYLE = {
  Mother: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  Father: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Sibling: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Spouse: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Child: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Relative: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  Friend: "bg-green-500/10 text-green-400 border-green-500/20",
  Other: "bg-white/[0.04] text-white/40 border-white/[0.08]",
};
const METHOD_STYLE = {
  Cash: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "ABA Bank": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "ACLYDA Bank": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Wing: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Bank Transfer": "bg-sky-500/10 text-sky-400 border-sky-500/20",
  Other: "bg-white/[0.04] text-white/40 border-white/[0.08]",
};

export default function Remittance() {
  const {
    loading,
    visible,
    navFiltered,
    navMonthUSD,
    totalUSD,
    thisMonthUSD,
    thisMonthRecords,
    uniqueRecipients,
    recipientTotals,
    navMonth,
    navYear,
    YEAR_OPTIONS,
    MAX_YEAR,
    MAX_MONTH,
    isCurrentMonth,
    isFuture,
    goMonth,
    handleDateJump,
    filterRelation,
    setFilterRelation,
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
    deleteId,
    setDeleteId,
    handleDelete,
  } = useRemittance();

  return (
    <div className="space-y-6 font-mono">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] text-white/20 uppercase mb-1">
            Outflow Module
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-white/90">
            Remittance
          </h1>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-sm text-[11px] tracking-widest text-white/70 transition-all"
        >
          <span className="text-white/40">+</span> NEW REMITTANCE
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "TOTAL SENT (USD)",
            value: `$${totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          },
          {
            label: "THIS MONTH (USD)",
            value: `$${thisMonthUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          },
          { label: "THIS MONTH COUNT", value: thisMonthRecords.length },
          { label: "UNIQUE RECIPIENTS", value: uniqueRecipients },
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
                  newYear === MAX_YEAR && navMonth > MAX_MONTH
                    ? MAX_MONTH
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
            {navFiltered.length} remittance{navFiltered.length !== 1 ? "s" : ""}{" "}
            · $
            {navMonthUSD.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}{" "}
            sent
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

      {/* ── Recipient Summary Cards ── */}
      {Object.values(recipientTotals).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.values(recipientTotals).map((r) => (
            <div
              key={r.name}
              className="border border-white/[0.05] bg-white/[0.015] rounded-sm p-3 flex items-center gap-3"
            >
              <div
                className={`w-8 h-8 rounded-sm flex items-center justify-center text-[11px] border ${RELATION_STYLE[r.relation]}`}
              >
                {r.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[11px] text-white/70">{r.name}</p>
                <p className="text-[9px] text-white/30">
                  $
                  {r.total.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}{" "}
                  · {r.count}x
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Relation Filter ── */}
      <div className="flex flex-wrap gap-2">
        {["ALL", ...RELATIONS].map((rel) => (
          <button
            key={rel}
            onClick={() => setFilterRelation(rel)}
            className={`px-3 py-1 rounded-sm text-[10px] tracking-widest border transition-all ${
              filterRelation === rel
                ? rel === "ALL"
                  ? "bg-white/[0.08] text-white/70 border-white/[0.15]"
                  : `${RELATION_STYLE[rel]} border`
                : "border-white/[0.06] text-white/25 hover:text-white/50"
            }`}
          >
            {rel === "ALL" ? "ALL" : rel.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="border border-white/[0.06] rounded-sm overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] text-[9px] tracking-[0.18em] text-white/20 border-b border-white/[0.06] px-4 py-2 bg-white/[0.02]">
          <span>DATE</span>
          <span>RECIPIENT</span>
          <span>AMOUNT</span>
          <span>METHOD</span>
          <span>USD VALUE</span>
          <span>ACTIONS</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[11px] text-white/20 tracking-widest">
            LOADING RECORDS...
          </div>
        ) : visible.length === 0 ? (
          <div className="py-12 text-center text-[11px] text-white/20 tracking-widest">
            NO REMITTANCE RECORDS FOR {MONTHS[navMonth - 1].toUpperCase()}{" "}
            {navYear}
          </div>
        ) : (
          visible.map((rec, i) => (
            <div
              key={rec._id}
              className={`grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] items-center px-4 py-3 text-[11px] border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}
            >
              <span className="text-white/50">
                {rec.day} {MONTHS[rec.monthNumber - 1]?.slice(0, 3)} {rec.year}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`px-1.5 py-0.5 rounded-sm text-[9px] border ${RELATION_STYLE[rec.recipientRelation] || "text-white/40 border-white/10"}`}
                >
                  {rec.recipientRelation?.slice(0, 3).toUpperCase()}
                </span>
                <span className="text-white/70">{rec.recipient}</span>
              </div>
              <span className="text-white/80">
                {CURRENCY_SYMBOL[rec.currency]}
                {Number(rec.amount).toLocaleString()} {rec.currency}
              </span>
              <span>
                <span
                  className={`px-2 py-0.5 rounded-sm text-[9px] border ${METHOD_STYLE[rec.method] || "text-white/40 border-white/10"}`}
                >
                  {rec.method.toUpperCase()}
                </span>
              </span>
              <span className="text-white/50">
                $
                {Number(rec.amountUSD).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
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

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-sm w-full max-w-lg mx-4 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
                {editTarget ? "Edit Remittance" : "New Remittance"}
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

            <div className="space-y-1">
              <label className="text-[9px] tracking-widest text-white/25">
                RECIPIENT NAME
              </label>
              <input
                type="text"
                value={form.recipient}
                onChange={(e) =>
                  setForm((f) => ({ ...f, recipient: e.target.value }))
                }
                placeholder="e.g. Mom, Brother"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 placeholder-white/20 focus:outline-none focus:border-white/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] tracking-widest text-white/25">
                RELATION
              </label>
              <div className="grid grid-cols-4 gap-2">
                {RELATIONS.map((rel) => (
                  <button
                    key={rel}
                    onClick={() =>
                      setForm((f) => ({ ...f, recipientRelation: rel }))
                    }
                    className={`py-1.5 rounded-sm text-[10px] border transition-all ${
                      form.recipientRelation === rel
                        ? `${RELATION_STYLE[rel]} border`
                        : "border-white/[0.06] text-white/25 hover:text-white/50"
                    }`}
                  >
                    {rel}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] tracking-widest text-white/25">
                TRANSFER METHOD
              </label>
              <div className="grid grid-cols-3 gap-2">
                {METHODS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setForm((f) => ({ ...f, method: m }))}
                    className={`py-1.5 px-2 rounded-sm text-[10px] border transition-all ${
                      form.method === m
                        ? `${METHOD_STYLE[m]} border`
                        : "border-white/[0.06] text-white/25 hover:text-white/50"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] tracking-widest text-white/25">
                REMITTANCE DATE
              </label>
              <input
                type="date"
                value={form.remittanceDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 focus:outline-none focus:border-white/20"
              />
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
              This remittance record will be permanently removed.
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
    </div>
  );
}
