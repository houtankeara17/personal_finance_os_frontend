import React, { useState } from "react";
import {
  usePlans,
  CURRENCIES,
  STATUSES,
  PRIORITIES,
  MONTHS,
  YEAR_OPTIONS,
  FILTER_MODES,
  FILTER_LABELS,
} from "../../hooks/usePlan";

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

const VIEW_MODES = ["TABLE", "GRID", "LIST"];
const VIEW_STYLE = {
  TABLE: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
  GRID: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  LIST: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
};

export default function Plans() {
  // 1. Local track state for the live display currency rule context
  const [displayCurrency, setDisplayCurrency] = useState("USD");

  // 2. Feed currency selector into the main context initialization payload hook
  const p = usePlans(displayCurrency);
  const currentMode = p.viewMode || "TABLE";

  return (
    <div className="space-y-6 font-mono text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] text-white/20 uppercase mb-1">
            Goals Module
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-white/90">
            Financial Plans
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            {p.records?.length > 0 && (
              <button
                onClick={() => p.setShowDeleteAll(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/[0.06] hover:bg-red-500/[0.12] border border-red-500/20 rounded-sm text-[11px] tracking-widest text-red-500/60 hover:text-red-400 transition-all"
              >
                <span className="text-red-500/40">✕</span> DELETE ALL
              </button>
            )}
            <button
              onClick={p.openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-sm text-[11px] tracking-widest text-white/70 transition-all"
            >
              <span className="text-white/40">+</span> NEW PLAN
            </button>
          </div>
        </div>
      </div>

      {/* Stats Dashboard Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: `TOTAL TARGET (${displayCurrency})`,
            // ✅ Fix: Uses fmtConverted to dynamically parse & format based on token rules
            value: p.fmtConverted
              ? p.fmtConverted(p.totalTarget || 0)
              : `$${(p.totalTarget || 0).toLocaleString()}`,
          },
          {
            label: `TOTAL FUNDED (${displayCurrency})`,
            // ✅ Fix: Converts raw calculations into chosen localization rates automatically
            value: p.fmtConverted
              ? p.fmtConverted(p.totalFunded || 0)
              : `$${(p.totalFunded || 0).toLocaleString()}`,
          },
          { label: "ACTIVE", value: p.active || 0 },
          { label: "ACCOMPLISHED", value: p.accomplished || 0 },
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

      {/* Date Range Filter */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1 bg-white/[0.02] border border-white/[0.06] p-1 rounded-sm w-fit">
          {FILTER_MODES?.map((mode) => (
            <button
              key={mode}
              onClick={() => p.setFilterMode(mode)}
              className={`px-3 py-1 text-[9px] tracking-widest font-medium uppercase rounded-[2px] transition-all duration-150 ${
                p.filterMode === mode
                  ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                  : "text-white/40 hover:text-white/70 border border-transparent"
              }`}
            >
              {FILTER_LABELS?.[mode] || mode}
            </button>
          ))}
        </div>

        {p.filterMode === "CUSTOM" ? (
          <div className="flex items-center justify-between border border-white/[0.06] rounded-lg px-4 py-2.5 bg-white/[0.01]">
            <button
              onClick={() => p.goMonth(-1)}
              className="text-[10px] tracking-widest text-white/30 hover:text-white/70 transition-colors px-2 py-1 rounded"
            >
              ← PREV
            </button>

            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5">
                <select
                  value={p.curMonth}
                  onChange={(e) =>
                    p.handleDateJump(Number(e.target.value), p.curYear)
                  }
                  className="bg-transparent text-white/80 text-[12px] font-medium tracking-widest uppercase cursor-pointer outline-none border-b border-transparent hover:border-white/20 transition-colors"
                >
                  {MONTHS?.map((name, index) => {
                    const monthNum = index + 1;
                    return (
                      <option
                        key={name}
                        value={monthNum}
                        className="bg-[#121212] text-white"
                      >
                        {name.toUpperCase()}
                      </option>
                    );
                  })}
                </select>

                <select
                  value={p.curYear}
                  onChange={(e) =>
                    p.handleDateJump(p.curMonth, Number(e.target.value))
                  }
                  className="bg-transparent text-white/80 text-[12px] font-medium tracking-widest cursor-pointer outline-none border-b border-transparent hover:border-white/20 transition-colors"
                >
                  {YEAR_OPTIONS?.map((yr) => (
                    <option
                      key={yr}
                      value={yr}
                      className="bg-[#121212] text-white"
                    >
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              {p.isCurrentMonth && (
                <p className="text-[8px] tracking-widest text-white/25 mt-0.5">
                  CURRENT MONTH
                </p>
              )}
            </div>

            <button
              onClick={() => p.goMonth(+1)}
              className="text-[10px] tracking-widest text-white/30 hover:text-white/70 transition-colors px-2 py-1 rounded"
            >
              NEXT →
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center border border-white/[0.06] rounded-lg px-4 py-2.5 bg-white/[0.01]">
            <p className="text-[10px] tracking-widest text-white/40">
              {p.dateRange?.startDate || "—"}{" "}
              <span className="text-white/15 mx-1">→</span>{" "}
              {p.dateRange?.endDate || "—"}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 w-full">
        {/* Global Target Currency Selector Tabs */}
        <div className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.06] p-1 rounded-sm">
          {CURRENCIES.map((curr) => (
            <button
              key={curr}
              onClick={() => setDisplayCurrency(curr)}
              className={`px-2.5 py-1 text-[9px] tracking-widest font-medium rounded-[2px] transition-all ${
                displayCurrency === curr
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-white/40 hover:text-white/70 border border-transparent"
              }`}
            >
              {curr}
            </button>
          ))}
        </div>

        {/* View Mode Switcher Tabs */}
        <div className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.06] p-1 rounded-sm w-fit">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode}
              onClick={() => p.setViewMode(mode)}
              className={`px-3 py-1 text-[9px] tracking-widest font-medium uppercase rounded-[2px] transition-all duration-150 ${
                currentMode === mode
                  ? VIEW_STYLE[mode]
                  : "text-white/40 hover:text-white/70 border border-transparent"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Data Wrapper */}
      {p.loading ? (
        <div className="border border-white/[0.06] rounded-sm py-12 text-center text-[11px] text-white/20 tracking-widest">
          LOADING PLANS...
        </div>
      ) : !p.records || p.records.length === 0 ? (
        <div className="border border-white/[0.06] rounded-sm py-12 text-center text-[11px] text-white/20 tracking-widest">
          NO PLANS FOUND
        </div>
      ) : (
        <>
          {/* VIEW MODE: GRID */}
          {p.viewMode === "GRID" && (
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4">
              {p.records.map((rec) => {
                const pct = Math.min(
                  100,
                  Math.round(
                    ((rec.currentFunding || 0) / (rec.targetAmountUSD || 1)) *
                      100,
                  ),
                );
                return (
                  <div
                    key={rec._id}
                    className="border border-white/[0.06] bg-white/[0.02] rounded-sm p-4 space-y-4 relative flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {rec.images?.[0] ? (
                            <a
                              href={rec.images[0]}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-shrink-0 w-6 h-6 rounded-sm overflow-hidden border border-white/10"
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
                          <h3 className="text-sm font-semibold text-white/90 truncate">
                            {rec.title}
                          </h3>
                        </div>

                        {/* ✅ Fix: Uses the system formatter to adapt target budget string */}
                        <p className="text-base font-semibold text-white/80 mt-2">
                          {p.fmtConverted
                            ? p.fmtConverted(rec.targetAmountUSD || 0)
                            : `$${(rec.targetAmountUSD || 0).toLocaleString()}`}
                        </p>

                        <div className="flex flex-col gap-0.5 mt-1">
                          {/* ✅ Fix: Format current funding dynamically using the runtime rate */}
                          <p className="text-[11px] text-white/40">
                            Funded:{" "}
                            {p.fmtConverted
                              ? p.fmtConverted(rec.currentFunding || 0)
                              : `$${(rec.currentFunding || 0).toLocaleString()}`}
                          </p>
                          <p className="text-[10px] text-white/25 tracking-wider">
                            Target:{" "}
                            {rec.targetDate
                              ? new Date(rec.targetDate).toLocaleDateString(
                                  undefined,
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  },
                                )
                              : "No target date"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-sm text-[8px] tracking-widest ${STATUS_STYLE[rec.status] || STATUS_STYLE.Dreaming}`}
                        >
                          {rec.status === "Active Allocation"
                            ? "ACTIVE"
                            : rec.status?.toUpperCase()}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-sm text-[8px] tracking-widest ${PRIORITY_STYLE[rec.priority] || PRIORITY_STYLE.Medium}`}
                        >
                          {rec.priority?.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[9px] text-white/30">
                        <span>PROGRESS</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-emerald-400" : "bg-sky-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {rec.noted && (
                      <p className="text-[11px] text-white/40 bg-white/[0.01] p-2 border border-white/[0.04] rounded-sm break-words italic">
                        "{rec.noted}"
                      </p>
                    )}

                    <div className="flex items-center justify-end pt-2 border-t border-white/[0.04] gap-3">
                      <button
                        onClick={() => p.openEdit(rec)}
                        className="text-[9px] tracking-widest text-white/30 hover:text-white/70"
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => p.setDeleteId(rec._id)}
                        className="text-[9px] tracking-widest text-red-500/40 hover:text-red-400"
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW MODE: TABLE */}
          {(p.viewMode === "TABLE" || !p.viewMode) && (
            <div className="border border-white/[0.06] rounded-sm overflow-hidden">
              <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_80px_1fr_1fr_auto] text-[9px] tracking-[0.18em] text-white/20 border-b border-white/[0.06] px-4 py-2 bg-white/[0.02]">
                <span>TITLE</span>
                <span>TARGET</span>
                <span>FUNDED</span>
                <span>TARGET DATE</span>
                <span>PROGRESS</span>
                <span>STATUS</span>
                <span>PRIORITY</span>
                <span>ACTIONS</span>
              </div>

              {p.records.map((rec, i) => {
                const pct = Math.min(
                  100,
                  Math.round(
                    ((rec.currentFunding || 0) / (rec.targetAmountUSD || 1)) *
                      100,
                  ),
                );
                return (
                  <div
                    key={rec._id}
                    className={`grid grid-cols-[1.5fr_1fr_1fr_1fr_80px_1fr_1fr_auto] items-center px-4 py-3 text-[11px] border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i % 2 !== 0 ? "bg-white/[0.01]" : ""}`}
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
                      <span className="text-white/70 truncate">
                        {rec.title}
                      </span>
                    </div>

                    {/* ✅ Fix: Replace baseline USD logic with dynamic conversion strings */}
                    <span className="text-white/80 font-medium">
                      {p.fmtConverted
                        ? p.fmtConverted(rec.targetAmountUSD || 0)
                        : `$${(rec.targetAmountUSD || 0).toLocaleString()}`}
                    </span>

                    {/* ✅ Fix: Convert funded columns to the user-selected context token */}
                    <span className="text-white/50">
                      {p.fmtConverted
                        ? p.fmtConverted(rec.currentFunding || 0)
                        : `$${(rec.currentFunding || 0).toLocaleString()}`}
                    </span>

                    <span className="text-white/40 font-normal text-[10px]">
                      {rec.targetDate
                        ? new Date(rec.targetDate).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            },
                          )
                        : "—"}
                    </span>

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
                        onClick={() => p.openEdit(rec)}
                        className="text-[9px] tracking-widest text-white/30 hover:text-white/70 transition-colors"
                      >
                        EDIT
                      </button>
                      <span className="text-white/10">|</span>
                      <button
                        onClick={() => p.setDeleteId(rec._id)}
                        className="text-[9px] tracking-widest text-red-500/40 hover:text-red-400 transition-colors"
                      >
                        DEL
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW MODE: LIST */}
          {p.viewMode === "LIST" && (
            <div className="space-y-2">
              {p.records.map((rec) => {
                const pct = Math.min(
                  100,
                  Math.round(
                    ((rec.currentFunding || 0) / (rec.targetAmountUSD || 1)) *
                      100,
                  ),
                );
                return (
                  <div
                    key={rec._id}
                    className="border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.02] transition-colors rounded-sm px-4 py-3 flex flex-col gap-3 xs:flex-row xs:items-center xs:justify-between"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {rec.images?.[0] ? (
                        <a
                          href={rec.images[0]}
                          target="_blank"
                          rel="noreferrer"
                          className="w-8 h-8 rounded-sm overflow-hidden border border-white/10 flex-shrink-0 block"
                        >
                          <img
                            src={rec.images[0]}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ) : (
                        <div className="w-8 h-8 rounded-sm bg-white/[0.03] border border-white/[0.06] flex items-center justify-center flex-shrink-0 text-[10px] text-white/20">
                          —
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className="text-[12px] font-semibold text-white/80 truncate">
                            {rec.title}
                          </span>

                          {/* ✅ Fix: Convert local card metadata cleanly */}
                          <span className="text-[11px] text-white/50 font-medium">
                            (
                            {p.fmtConverted
                              ? p.fmtConverted(rec.targetAmountUSD || 0)
                              : `$${(rec.targetAmountUSD || 0).toLocaleString()}`}
                            )
                          </span>

                          <span className="text-[10px] text-white/25 ml-auto xs:ml-0 font-normal">
                            • Target:{" "}
                            {rec.targetDate
                              ? new Date(rec.targetDate).toLocaleDateString(
                                  undefined,
                                  { year: "numeric", month: "short" },
                                )
                              : "Open Date"}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-1.5 max-w-xs">
                          <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-emerald-400" : "bg-sky-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-white/40">
                            {pct}% Funded (
                            {p.fmtConverted
                              ? p.fmtConverted(rec.currentFunding || 0)
                              : `$${(rec.currentFunding || 0).toLocaleString()}`}
                            )
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between xs:justify-end gap-3 border-t xs:border-t-0 border-white/[0.04] pt-2 xs:pt-0 flex-shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-sm text-[8px] tracking-widest ${STATUS_STYLE[rec.status] || STATUS_STYLE.Dreaming}`}
                      >
                        {rec.status === "Active Allocation"
                          ? "ACTIVE"
                          : rec.status?.toUpperCase()}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-sm text-[8px] tracking-widest ${PRIORITY_STYLE[rec.priority] || PRIORITY_STYLE.Medium}`}
                      >
                        {rec.priority?.toUpperCase()}
                      </span>
                      <div className="flex gap-2 ml-2">
                        <button
                          onClick={() => p.openEdit(rec)}
                          className="text-[9px] tracking-widest text-white/30 hover:text-white/70"
                        >
                          EDIT
                        </button>
                        <button
                          onClick={() => p.setDeleteId(rec._id)}
                          className="text-[9px] tracking-widest text-red-500/40 hover:text-red-400"
                        >
                          DEL
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {/* Create / Edit Modal */}
      {p.showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-sm w-full max-w-lg mx-4 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
                {p.editTarget ? "Edit Plan" : "New Plan"}
              </p>
              <button
                onClick={() => p.setShowModal(false)}
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
                value={p.form.title}
                placeholder="e.g. MacBook Pro, Family Vacation..."
                onChange={(e) =>
                  p.setForm((f) => ({ ...f, title: e.target.value }))
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
                value={p.form.description}
                placeholder="Optional details..."
                onChange={(e) =>
                  p.setForm((f) => ({ ...f, description: e.target.value }))
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
                  value={p.form.targetAmount}
                  placeholder="0.00"
                  onChange={(e) =>
                    p.setForm((f) => ({ ...f, targetAmount: e.target.value }))
                  }
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 placeholder-white/20 focus:outline-none focus:border-white/20"
                />
              </div>
              <div className="w-28 space-y-1">
                <label className="text-[9px] tracking-widest text-white/25">
                  CURRENCY
                </label>
                <select
                  value={p.form.currency}
                  onChange={(e) =>
                    p.setForm((f) => ({ ...f, currency: e.target.value }))
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
                  value={p.form.currentFunding}
                  placeholder="0.00"
                  onChange={(e) =>
                    p.setForm((f) => ({ ...f, currentFunding: e.target.value }))
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
                  value={p.form.targetDate}
                  onChange={(e) =>
                    p.setForm((f) => ({ ...f, targetDate: e.target.value }))
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
                    onChange={p.handleFilesChange}
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
                {p.imagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {p.imagePreviews.map((src, idx) => (
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
                          onClick={() => p.removeImage(idx)}
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
                    onClick={() => p.setForm((f) => ({ ...f, status: s }))}
                    className={`flex-1 py-1.5 rounded-sm text-[9px] tracking-widest border transition-all ${p.form.status === s ? STATUS_STYLE[s] : "border-white/[0.06] text-white/20 hover:text-white/40"}`}
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
                {PRIORITIES.map((prio) => (
                  <button
                    key={prio}
                    type="button"
                    onClick={() => p.setForm((f) => ({ ...f, priority: prio }))}
                    className={`flex-1 py-1.5 rounded-sm text-[9px] tracking-widest border transition-all ${p.form.priority === prio ? PRIORITY_STYLE[prio] : "border-white/[0.06] text-white/20 hover:text-white/40"}`}
                  >
                    {prio.toUpperCase()}
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
                value={p.form.noted}
                rows={2}
                placeholder="Optional note..."
                onChange={(e) =>
                  p.setForm((f) => ({ ...f, noted: e.target.value }))
                }
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 placeholder-white/20 focus:outline-none focus:border-white/20 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => p.setShowModal(false)}
                className="flex-1 py-2 border border-white/[0.08] rounded-sm text-[10px] tracking-widest text-white/30 hover:text-white/60 transition-colors"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={p.handleSubmit}
                disabled={p.submitting}
                className="flex-1 py-2 bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.1] rounded-sm text-[10px] tracking-widest text-white/70 transition-all disabled:opacity-40"
              >
                {p.submitting
                  ? "SAVING..."
                  : p.editTarget
                    ? "UPDATE"
                    : "CREATE"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Modal */}
      {p.showDeleteAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0c0c0c] border border-red-500/20 rounded-sm w-full max-w-sm mx-4 p-6 space-y-4">
            <p className="text-[10px] tracking-[0.2em] text-red-400/70 uppercase">
              Confirm Delete All
            </p>
            <p className="text-[12px] text-white/60">
              All{" "}
              <span className="text-white/80 font-semibold">
                {p.records.length} plan{p.records.length !== 1 ? "s" : ""}
              </span>{" "}
              for this period will be permanently removed. This cannot be
              undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => p.setShowDeleteAll(false)}
                className="flex-1 py-2 border border-white/[0.08] rounded-sm text-[10px] tracking-widest text-white/30 hover:text-white/60 transition-colors"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={p.handleDeleteAll}
                className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-sm text-[10px] tracking-widest text-red-400 transition-all"
              >
                DELETE ALL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {p.deleteId && (
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
                onClick={() => p.setDeleteId(null)}
                className="flex-1 py-2 border border-white/[0.08] rounded-sm text-[10px] tracking-widest text-white/30 hover:text-white/60"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => p.handleDelete(p.deleteId)}
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
