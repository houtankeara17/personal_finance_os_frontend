import React, { useState } from "react";
import {
  useExchangeLog,
  MONTHS,
  MAX_YEAR,
  MAX_MONTH,
  MIN_YEAR,
  emptyForm,
} from "../../hooks/useExchangeLog";

// ─── Constants ────────────────────────────────────────────────────────────────
const CURRENCIES = ["USD", "KHR", "THB"];
const PROVIDERS = [
  "ABA Bank",
  "ACLEDA Bank",
  "Wing",
  "Street Exchange",
  "Airport",
  "Other",
];
const CURRENCY_SYMBOL = { USD: "$", KHR: "₭", THB: "฿" };
const CURRENCY_FLAG = { USD: "🇺🇸", KHR: "🇰🇭", THB: "🇹🇭" };
const YEAR_OPTIONS = Array.from(
  { length: MAX_YEAR - MIN_YEAR + 1 },
  (_, i) => MIN_YEAR + i,
);

const PROVIDER_STYLE = {
  "ABA Bank": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "ACLEDA Bank": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Wing: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Street Exchange": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Airport: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  Other: "bg-white/[0.04] text-white/40 border-white/[0.08]",
};
const PAIR_STYLE = {
  "USD→KHR": "text-emerald-400",
  "KHR→USD": "text-sky-400",
  "USD→THB": "text-yellow-400",
  "THB→USD": "text-orange-400",
  "KHR→THB": "text-purple-400",
  "THB→KHR": "text-pink-400",
};

const today = new Date();

function fmt(val, currency) {
  const n = parseFloat(val);
  if (!n || isNaN(n)) return "";
  if (currency === "KHR")
    return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (currency === "THB")
    return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ExchangeLog() {
  const {
    records,
    loading,
    submitting,
    navMonth,
    navYear,
    form,
    setForm,
    handleFromAmount,
    handleToAmount,
    handleFromCurrency,
    handleToCurrency,
    swapCurrencies,
    handleDateChange,
    resetForm,
    goMonth,
    handleNavMonthChange,
    isFuture,
    isCurrentMonth,
    saveRecord,
    deleteRecord,
    stats,
  } = useExchangeLog();

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [filterProvider, setFilterProvider] = useState("ALL");

  // ── Modal helpers ──────────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    resetForm();
    setShowModal(true);
  };

  const openEdit = (rec) => {
    setEditTarget(rec._id);
    setForm({
      fromCurrency: rec.fromCurrency,
      fromAmount: rec.fromAmount,
      toCurrency: rec.toCurrency,
      toAmount: rec.toAmount,
      rateUsed: rec.rateUsed,
      officialRate: rec.officialRate || "",
      provider: rec.provider,
      providerNote: rec.providerNote || "",
      exchangeDate:
        rec.exchangeDate?.split("T")[0] || today.toISOString().split("T")[0],
      year: rec.year,
      monthNumber: rec.monthNumber,
      day: rec.day,
      noted: rec.noted || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const ok = await saveRecord(editTarget);
    if (ok) setShowModal(false);
  };

  const handleDelete = async (id) => {
    await deleteRecord(id);
    setDeleteId(null);
  };

  // ── Derived (view-only) ────────────────────────────────────────────────
  const { navFiltered } = stats;
  const visible =
    filterProvider === "ALL"
      ? navFiltered
      : navFiltered.filter((r) => r.provider === filterProvider);

  const previewRate =
    form.fromAmount && form.toAmount
      ? (Number(form.toAmount) / Number(form.fromAmount)).toFixed(
          form.toCurrency === "KHR" ? 2 : 6,
        )
      : null;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] text-white/20 uppercase mb-1">
            Currency Module
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-white/90">
            Exchange Log
          </h1>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-sm text-[11px] tracking-widest text-white/70 transition-all"
        >
          <span className="text-white/40">+</span> LOG EXCHANGE
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "TOTAL LOGS", value: stats.totalLogs },
          { label: "THIS MONTH", value: stats.thisMonth },
          { label: "UNIQUE PAIRS", value: stats.uniquePairs },
          { label: "AVG RATE USED", value: stats.avgRate },
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
          className="text-white/30 hover:text-white/70 text-lg px-2 transition-colors"
        >
          ‹
        </button>
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <select
              value={navMonth}
              onChange={(e) =>
                handleNavMonthChange(Number(e.target.value), navYear)
              }
              className="bg-transparent text-white/80 text-[13px] font-semibold tracking-widest uppercase cursor-pointer outline-none"
            >
              {MONTHS.map((name, i) => (
                <option
                  key={name}
                  value={i + 1}
                  disabled={isFuture(i + 1, navYear)}
                  className="bg-[#121212] text-white"
                >
                  {name.toUpperCase()}
                </option>
              ))}
            </select>
            <select
              value={navYear}
              onChange={(e) => {
                const y = Number(e.target.value);
                handleNavMonthChange(navMonth, y);
              }}
              className="bg-transparent text-white/80 text-[13px] font-semibold tracking-widest cursor-pointer outline-none"
            >
              {YEAR_OPTIONS.map((yr) => (
                <option key={yr} value={yr} className="bg-[#121212] text-white">
                  {yr}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[10px] text-white/25">
            {navFiltered.length} log{navFiltered.length !== 1 ? "s" : ""} this
            month
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
          className="text-white/30 hover:text-white/70 text-lg px-2 transition-colors disabled:opacity-20"
        >
          ›
        </button>
      </div>

      {/* Provider Filter */}
      <div className="flex flex-wrap gap-2">
        {["ALL", ...PROVIDERS].map((p) => (
          <button
            key={p}
            onClick={() => setFilterProvider(p)}
            className={`px-3 py-1 rounded-sm text-[10px] tracking-widest border transition-all ${
              filterProvider === p
                ? p === "ALL"
                  ? "bg-white/[0.08] text-white/70 border-white/[0.15]"
                  : `${PROVIDER_STYLE[p]} border`
                : "border-white/[0.06] text-white/25 hover:text-white/50"
            }`}
          >
            {p === "ALL" ? "ALL PROVIDERS" : p.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border border-white/[0.06] rounded-sm overflow-hidden">
        <div className="grid grid-cols-[1fr_1.8fr_1fr_1fr_1fr_auto] text-[9px] tracking-[0.18em] text-white/20 border-b border-white/[0.06] px-4 py-2 bg-white/[0.02]">
          <span>DATE</span>
          <span>EXCHANGE</span>
          <span>RATE USED</span>
          <span>PROVIDER</span>
          <span>OFFICIAL RATE</span>
          <span>ACTIONS</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[11px] text-white/20 tracking-widest">
            LOADING LOGS...
          </div>
        ) : visible.length === 0 ? (
          <div className="py-12 text-center text-[11px] text-white/20 tracking-widest">
            NO EXCHANGE LOGS FOR {MONTHS[navMonth - 1].toUpperCase()} {navYear}
          </div>
        ) : (
          visible.map((rec, i) => {
            const pair = `${rec.fromCurrency}→${rec.toCurrency}`;
            return (
              <div
                key={rec._id}
                className={`grid grid-cols-[1fr_1.8fr_1fr_1fr_1fr_auto] items-center px-4 py-3 text-[11px] border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}
              >
                <span className="text-white/50">
                  {rec.day} {MONTHS[rec.monthNumber - 1]?.slice(0, 3)}{" "}
                  {rec.year}
                </span>
                <span
                  className={`font-medium ${PAIR_STYLE[pair] || "text-white/60"}`}
                >
                  {CURRENCY_SYMBOL[rec.fromCurrency]}
                  {Number(rec.fromAmount).toLocaleString()} {pair}{" "}
                  {CURRENCY_SYMBOL[rec.toCurrency]}
                  {Number(rec.toAmount).toLocaleString()}
                </span>
                <span className="text-white/60">
                  {Number(rec.rateUsed).toFixed(6)}
                </span>
                <span>
                  <span
                    className={`px-2 py-0.5 rounded-sm text-[9px] border ${PROVIDER_STYLE[rec.provider] || "text-white/40 border-white/10"}`}
                  >
                    {rec.provider.toUpperCase()}
                  </span>
                </span>
                <span className="text-white/35">
                  {rec.officialRate ? (
                    Number(rec.officialRate).toFixed(4)
                  ) : (
                    <span className="text-white/15">—</span>
                  )}
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
          <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-sm w-full max-w-lg mx-4 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div>
                <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
                  {editTarget ? "Edit Exchange Log" : "New Exchange Log"}
                </p>
                <p className="text-[11px] text-white/25 mt-0.5">
                  Type any amount — the other side fills automatically
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/20 hover:text-white/60 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Live Conversion Card */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-sm p-4">
                {/* FROM */}
                <div className="space-y-1 mb-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[9px] tracking-[0.2em] text-white/30 uppercase">
                      You give
                    </span>
                    <span className="text-[10px] text-white/20">
                      {CURRENCY_FLAG[form.fromCurrency]} {form.fromCurrency}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[13px]">
                        {CURRENCY_SYMBOL[form.fromCurrency]}
                      </span>
                      <input
                        type="number"
                        value={form.fromAmount}
                        onChange={(e) => handleFromAmount(e.target.value)}
                        placeholder={
                          form.fromCurrency === "KHR"
                            ? "e.g. 500000"
                            : form.fromCurrency === "THB"
                              ? "e.g. 3500"
                              : "e.g. 100"
                        }
                        className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-emerald-500/40 rounded-sm pl-7 pr-3 py-2.5 text-[14px] text-white/90 placeholder-white/15 focus:outline-none transition-colors"
                      />
                    </div>
                    <select
                      value={form.fromCurrency}
                      onChange={(e) => handleFromCurrency(e.target.value)}
                      className="w-[88px] bg-[#0c0c0c] border border-white/[0.08] rounded-sm px-2 py-2.5 text-[12px] text-white/80 focus:outline-none focus:border-white/20"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {CURRENCY_FLAG[c]} {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Swap + rate preview */}
                <div className="flex items-center gap-3 py-2">
                  <button
                    onClick={swapCurrencies}
                    title="Swap currencies"
                    className="flex items-center justify-center w-7 h-7 rounded-sm bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white/40 hover:text-white/70 transition-all text-sm"
                  >
                    ⇅
                  </button>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  {previewRate ? (
                    <div className="text-right">
                      <p className="text-[9px] text-white/25 tracking-widest uppercase">
                        Rate used
                      </p>
                      <p className="text-[13px] text-emerald-400 font-medium">
                        1 {form.fromCurrency} = {previewRate} {form.toCurrency}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-white/20 italic">
                      rate appears after you type
                    </p>
                  )}
                </div>

                {/* TO */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[9px] tracking-[0.2em] text-white/30 uppercase">
                      You receive
                    </span>
                    <span className="text-[10px] text-white/20">
                      {CURRENCY_FLAG[form.toCurrency]} {form.toCurrency}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[13px]">
                        {CURRENCY_SYMBOL[form.toCurrency]}
                      </span>
                      <input
                        type="number"
                        value={form.toAmount}
                        onChange={(e) => handleToAmount(e.target.value)}
                        placeholder="auto-filled"
                        className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-sky-500/40 rounded-sm pl-7 pr-3 py-2.5 text-[14px] text-white/90 placeholder-white/15 focus:outline-none transition-colors"
                      />
                    </div>
                    <select
                      value={form.toCurrency}
                      onChange={(e) => handleToCurrency(e.target.value)}
                      className="w-[88px] bg-[#0c0c0c] border border-white/[0.08] rounded-sm px-2 py-2.5 text-[12px] text-white/80 focus:outline-none focus:border-white/20"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {CURRENCY_FLAG[c]} {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Formatted preview */}
                {form.fromAmount && form.toAmount && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[10px] text-white/25">Preview</span>
                    <span
                      className={`text-[12px] font-medium ${PAIR_STYLE[`${form.fromCurrency}→${form.toCurrency}`] || "text-white/60"}`}
                    >
                      {CURRENCY_SYMBOL[form.fromCurrency]}
                      {fmt(form.fromAmount, form.fromCurrency)} →{" "}
                      {CURRENCY_SYMBOL[form.toCurrency]}
                      {fmt(form.toAmount, form.toCurrency)}
                    </span>
                  </div>
                )}
              </div>

              {/* Rate fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] tracking-widest text-white/25 flex items-center gap-1.5">
                    RATE USED{" "}
                    <span className="text-emerald-500/50 text-[8px]">
                      ● AUTO
                    </span>
                  </label>
                  <input
                    type="number"
                    value={form.rateUsed}
                    readOnly
                    placeholder="—"
                    className="w-full bg-white/[0.02] border border-emerald-500/20 rounded-sm px-3 py-2 text-[12px] text-emerald-400 focus:outline-none cursor-default"
                  />
                  <p className="text-[9px] text-white/15">
                    calculated automatically
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] tracking-widest text-white/25">
                    OFFICIAL RATE{" "}
                    <span className="text-white/15">(optional)</span>
                  </label>
                  <input
                    type="number"
                    value={form.officialRate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, officialRate: e.target.value }))
                    }
                    placeholder="Google: KHR to USD"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 placeholder-white/15 focus:outline-none focus:border-white/20"
                  />
                  <p className="text-[9px] text-white/15">
                    compare vs market rate
                  </p>
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-[9px] tracking-widest text-white/25">
                  EXCHANGE DATE
                </label>
                <input
                  type="date"
                  value={form.exchangeDate}
                  max={today.toISOString().split("T")[0]}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 focus:outline-none focus:border-white/20"
                />
              </div>

              {/* Provider */}
              <div className="space-y-2">
                <label className="text-[9px] tracking-widest text-white/25">
                  WHERE DID YOU EXCHANGE?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setForm((f) => ({ ...f, provider: p }))}
                      className={`py-2 px-2 rounded-sm text-[10px] border transition-all ${
                        form.provider === p
                          ? `${PROVIDER_STYLE[p]} border`
                          : "border-white/[0.06] text-white/25 hover:text-white/50 hover:border-white/[0.12]"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Provider Note */}
              <div className="space-y-1">
                <label className="text-[9px] tracking-widest text-white/25">
                  BRANCH / LOCATION{" "}
                  <span className="text-white/15">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.providerNote}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, providerNote: e.target.value }))
                  }
                  placeholder="e.g. Toul Kork branch, BKK1 money changer"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 placeholder-white/15 focus:outline-none focus:border-white/20"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[9px] tracking-widest text-white/25">
                  NOTES <span className="text-white/15">(optional)</span>
                </label>
                <textarea
                  value={form.noted}
                  rows={2}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, noted: e.target.value }))
                  }
                  placeholder="Any extra note about this exchange..."
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 placeholder-white/15 focus:outline-none focus:border-white/20 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-white/[0.08] rounded-sm text-[10px] tracking-widest text-white/30 hover:text-white/60 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !form.fromAmount || !form.toAmount}
                  className="flex-1 py-2.5 bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.1] rounded-sm text-[10px] tracking-widest text-white/70 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? "SAVING..."
                    : editTarget
                      ? "UPDATE LOG"
                      : "CREATE LOG"}
                </button>
              </div>
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
              This exchange log will be permanently removed.
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
