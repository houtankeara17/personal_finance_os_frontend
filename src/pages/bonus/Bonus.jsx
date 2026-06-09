import React, { useState } from "react";
import {
  useBonus,
  MAX_YEAR,
  MAX_MONTH,
  MONTHS,
  RATES,
} from "../../hooks/useBonus";
import { useFinance } from "../../context/FinanceContext";

// ─── Constants ────────────────────────────────────────────────────────────────
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
const YEAR_OPTIONS = Array.from(
  { length: MAX_YEAR - 2025 + 1 },
  (_, i) => 2025 + i,
);

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

const fmtUSD = (n) =>
  Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const emptyForm = (year) => ({
  amount: "",
  currency: "USD",
  year: year ?? MAX_YEAR,
  month: MONTHS[MAX_MONTH - 1],
  monthNumber: MAX_MONTH,
  tag: "🏆 Performance",
  status: "Confirmed",
  noted: "",
});

// ─── Component ────────────────────────────────────────────────────────────────
export default function Bonus() {
  const { addNotice } = useFinance();
  const {
    curYear,
    records,
    monthlySalary,
    loading,
    submitting,
    goYear,
    handleYearJump,
    isCurrentYear,
    saveRecord,
    deleteRecord,
    fetchSalary,
    stats,
  } = useBonus();

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [deleteId, setDeleteId] = useState(null);
  const [filterTag, setFilterTag] = useState("ALL");

  // View Modes and Calendar Details
  const [viewMode, setViewMode] = useState("TABLE"); // "TABLE" | "CALENDAR"
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(MAX_MONTH); // month shown in calendar

  // ── Modal helpers ──────────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    const initialForm = emptyForm(curYear);
    setForm(initialForm);
    setShowModal(true);

    // ⭐️ Sync up immediately on open
    fetchSalary(initialForm.year, initialForm.monthNumber);
  };

  const openEdit = (rec) => {
    setEditTarget(rec._id);
    const mNum = rec.monthNumber || MONTHS.indexOf(rec.month) + 1;
    setForm({
      amount: rec.amount,
      currency: rec.currency,
      year: rec.year,
      month: rec.month,
      monthNumber: mNum,
      tag: rec.tag,
      status: rec.status,
      noted: rec.noted || "",
    });
    setShowModal(true);

    // ⭐️ Sync up immediately on open
    fetchSalary(rec.year, mNum);
  };

  const handleMonthChange = (selectedMonthName) => {
    // 1. Convert the month string (e.g. "June") to its number value (e.g. 6)
    const numericIndex = MONTHS.indexOf(selectedMonthName) + 1;

    // 2. Save the update to your local modal form state
    setForm((prev) => ({
      ...prev,
      month: selectedMonthName,
      monthNumber: numericIndex,
    }));

    // 3. ⭐️ TELL THE HOOK TO FETCH THE REAL SALARY FOR THIS SELECT!
    fetchSalary(form.year, numericIndex);
  };

  const handleSubmit = async () => {
    const ok = await saveRecord(form, editTarget);
    if (ok) setShowModal(false);
  };

  const handleDelete = async (id) => {
    await deleteRecord(id);
    setDeleteId(null);
    setSelectedCalendarDay(null);
  };

  // ── Derived (view-only) ────────────────────────────────────────────────
  const { yearRecords } = stats;
  const visible =
    filterTag === "ALL"
      ? yearRecords
      : yearRecords.filter((r) => r.tag === filterTag);

  const previewUSD =
    form.amount && !isNaN(form.amount) && Number(form.amount) > 0
      ? Number(form.amount) / RATES[form.currency]
      : null;

  // ── Calendar Helpers ───────────────────────────────────────────────────
  const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();
  const getFirstDayIndex = (year, month) =>
    new Date(year, month - 1, 1).getDay();

  const daysInMonth = getDaysInMonth(curYear, calendarMonth);
  const firstDayIndex = getFirstDayIndex(curYear, calendarMonth);
  const calendarPaddingCells = Array(firstDayIndex).fill(null);
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Records for currently viewed calendar month
  const calendarMonthRecords = yearRecords.filter(
    (r) => r.monthNumber === calendarMonth,
  );
  const calendarVisible =
    filterTag === "ALL"
      ? calendarMonthRecords
      : calendarMonthRecords.filter((r) => r.tag === filterTag);

  const getRecordDay = (rec) => {
    if (rec.date) return new Date(rec.date).getDate();
    if (rec.createdAt) return new Date(rec.createdAt).getDate();
    return 1;
  };

  const getBonusesForDay = (day) =>
    calendarVisible.filter((rec) => getRecordDay(rec) === day);

  // ── Render ─────────────────────────────────────────────────────────────
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
          { label: "TOTAL BONUSES (USD)", value: `$${fmtUSD(stats.totalUSD)}` },
          {
            label: `${curYear} TOTAL (USD)`,
            value: `$${fmtUSD(stats.thisYearUSD)}`,
          },
          { label: `${curYear} COUNT`, value: stats.thisYearCount },
          { label: "DISBURSED", value: stats.disbursed },
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

      {/* Year Navigator */}
      <div className="flex items-center justify-between border border-white/[0.06] bg-white/[0.02] rounded-sm px-5 py-3">
        <button
          onClick={() => {
            goYear(-1);
            setSelectedCalendarDay(null);
          }}
          aria-label="Previous year"
          className="text-white/30 hover:text-white/70 text-lg px-2 transition-colors"
        >
          ‹
        </button>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <select
              value={curYear}
              onChange={(e) => {
                handleYearJump(Number(e.target.value));
                setSelectedCalendarDay(null);
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
            {yearRecords.length} bonus{yearRecords.length !== 1 ? "es" : ""}{" "}
            this year
          </p>
          {isCurrentYear && (
            <p className="text-[8px] tracking-widest text-white/20">
              CURRENT YEAR
            </p>
          )}
        </div>

        <button
          onClick={() => {
            goYear(+1);
            setSelectedCalendarDay(null);
          }}
          disabled={isCurrentYear}
          aria-label="Next year"
          className="text-white/30 hover:text-white/70 text-lg px-2 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        >
          ›
        </button>
      </div>

      {/* Year Summary Grid Overview */}
      {yearRecords.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            // 1st Box: Show single current/selected month's salary
            {
              label: "MONTHLY SALARY",
              value: `$${fmtUSD(monthlySalary)}`,
              sub: "salary per month",
            },
            // 2nd Box: Show total monthly salary minus the monthly bonus
            {
              label: "SALARY LESS BONUS",
              value: `$${fmtUSD(monthlySalary - (stats.currentMonthBonusUSD || 0))}`,
              sub: "monthly base minus bonus",
            },
            // 3rd Box: Show cumulative salary across all months
            {
              label: "CUMULATIVE SALARY",
              value: `$${fmtUSD(stats.yearSalaryUSD)}`,
              sub: "total salary all months",
            },
            // 4th Box: Show total cumulative salaries + all bonuses combined
            {
              label: "TOTAL COMP",
              value: `$${fmtUSD(stats.totalComp)}`,
              sub: "all months salary + bonus",
              accent: "text-sky-400",
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

      {/* Navigation Layout Controls (Table View / Calendar View) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.06] pb-4">
        {/* Tag Filters */}
        <div className="flex flex-wrap gap-2">
          {["ALL", ...TAGS].map((t) => (
            <button
              key={t}
              onClick={() => {
                setFilterTag(t);
                setSelectedCalendarDay(null);
              }}
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

        {/* View Switcher Controls */}
        <div className="flex border border-white/[0.08] rounded-sm p-0.5 bg-white/[0.01]">
          <button
            onClick={() => setViewMode("TABLE")}
            className={`px-3 py-1 text-[10px] tracking-widest transition-all rounded-xs ${
              viewMode === "TABLE"
                ? "bg-white/[0.08] text-white/80 font-medium"
                : "text-white/30 hover:text-white/60"
            }`}
          >
            LIST TABLE
          </button>
          <button
            onClick={() => setViewMode("CALENDAR")}
            className={`px-3 py-1 text-[10px] tracking-widest transition-all rounded-xs flex items-center gap-1.5 ${
              viewMode === "CALENDAR"
                ? "bg-white/[0.08] text-white/80 font-medium"
                : "text-white/30 hover:text-white/60"
            }`}
          >
            📅 CALENDAR
          </button>
        </div>
      </div>

      {/* Main Data Container View Logic */}
      {viewMode === "TABLE" ? (
        /* ─── List Table Mode ─── */
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
          ) : yearRecords.length === 0 ? (
            <div className="py-14 text-center space-y-2">
              <p className="text-[11px] tracking-[0.2em] text-white/20 uppercase">
                No bonuses in {curYear}
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
                {yearRecords.length} record{yearRecords.length !== 1 ? "s" : ""}{" "}
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
      ) : (
        /* ─── Calendar Mode ─── */
        <div className="space-y-4">
          {/* Calendar Month Switcher */}
          <div className="flex items-center justify-between border border-white/[0.06] bg-white/[0.02] rounded-sm px-4 py-2">
            <button
              onClick={() => setCalendarMonth((m) => (m === 1 ? 12 : m - 1))}
              className="text-white/30 hover:text-white/70 text-lg px-2 transition-colors"
            >
              ‹
            </button>
            <div className="flex items-center gap-2">
              <select
                value={calendarMonth}
                onChange={(e) => {
                  setCalendarMonth(Number(e.target.value));
                  setSelectedCalendarDay(null);
                }}
                className="bg-transparent text-white/70 text-[11px] tracking-widest uppercase cursor-pointer outline-none border-b border-transparent hover:border-white/20 transition-colors"
              >
                {MONTHS.map((name, index) => (
                  <option
                    key={name}
                    value={index + 1}
                    className="bg-[#121212] text-white"
                  >
                    {name.toUpperCase()}
                  </option>
                ))}
              </select>
              <span className="text-white/30 text-[11px]">{curYear}</span>
            </div>
            <button
              onClick={() => setCalendarMonth((m) => (m === 12 ? 1 : m + 1))}
              className="text-white/30 hover:text-white/70 text-lg px-2 transition-colors"
            >
              ›
            </button>
          </div>

          <div className="border border-white/[0.06] rounded-sm bg-white/[0.01] overflow-hidden p-4">
            {/* Days of Week Row */}
            <div className="grid grid-cols-7 gap-1 text-center text-[9px] tracking-widest text-white/20 mb-2 font-bold py-1">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            {/* Calendar Numbers Matrix Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarPaddingCells.map((_, index) => (
                <div
                  key={`pad-${index}`}
                  className="aspect-square bg-transparent border border-transparent"
                />
              ))}

              {calendarDays.map((day) => {
                const dayBonuses = getBonusesForDay(day);
                const hasBonus = dayBonuses.length > 0;
                const totalDayUSD = dayBonuses.reduce(
                  (sum, r) => sum + (Number(r.amountUSD) || 0),
                  0,
                );
                const isSelected = selectedCalendarDay === day;

                return (
                  <button
                    key={`day-${day}`}
                    disabled={loading}
                    onClick={() =>
                      setSelectedCalendarDay(isSelected ? null : day)
                    }
                    className={`aspect-square p-1.5 flex flex-col justify-between items-start border rounded-xs transition-all text-left relative ${
                      isSelected
                        ? "border-white/50 bg-white/[0.08]"
                        : hasBonus
                          ? "border-emerald-500/30 bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06]"
                          : "border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03]"
                    }`}
                  >
                    <span
                      className={`text-[10px] ${hasBonus ? "text-emerald-400 font-semibold" : "text-white/40"}`}
                    >
                      {day}
                    </span>

                    {hasBonus && (
                      <div className="w-full text-[8px] text-white/70 truncate tracking-tight font-sans">
                        $
                        {totalDayUSD > 0
                          ? fmtUSD(totalDayUSD).split(".")[0]
                          : "0"}
                        {dayBonuses.length > 1 && (
                          <span className="text-[7px] text-emerald-500/60 block">
                            {dayBonuses.length} items
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inline Calendar Selected Detail Drawer */}
          {selectedCalendarDay && (
            <div className="border border-white/[0.08] bg-white/[0.03] p-4 rounded-sm space-y-3 animation-fade-in">
              <div className="flex justify-between items-center border-b border-white/[0.06] pb-2">
                <p className="text-[10px] tracking-wider text-emerald-400 font-bold uppercase">
                  Details for {MONTHS[calendarMonth - 1]} {selectedCalendarDay},{" "}
                  {curYear}
                </p>
                <button
                  onClick={() => setSelectedCalendarDay(null)}
                  className="text-[9px] text-white/30 hover:text-white/60 tracking-widest"
                >
                  CLOSE [X]
                </button>
              </div>

              {getBonusesForDay(selectedCalendarDay).length === 0 ? (
                <p className="text-[11px] text-white/30 py-2">
                  No targeted tag bonuses found on this day matrix context.
                </p>
              ) : (
                <div className="space-y-2">
                  {getBonusesForDay(selectedCalendarDay).map((rec) => (
                    <div
                      key={rec._id}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-[#0c0c0c] border border-white/[0.04] rounded-sm gap-2 text-[11px]"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white/90 font-medium">
                            {CURRENCY_SYMBOL[rec.currency] || "$"}
                            {Number(rec.amount).toLocaleString()} {rec.currency}
                          </span>
                          <span className="text-white/30">
                            (${fmtUSD(rec.amountUSD)} USD)
                          </span>
                        </div>
                        {rec.noted && (
                          <p className="text-[10px] text-white/40 italic">
                            "{rec.noted}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <span
                          className={`px-2 py-0.5 rounded-sm text-[9px] border ${TAG_STYLE[rec.tag] || ""}`}
                        >
                          {rec.tag}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-sm text-[9px] tracking-widest ${STATUS_STYLE[rec.status] || ""}`}
                        >
                          {rec.status?.toUpperCase()}
                        </span>
                        <div className="flex gap-2 text-[9px] pl-2 border-l border-white/10">
                          <button
                            onClick={() => openEdit(rec)}
                            className="text-white/40 hover:text-white/80"
                          >
                            EDIT
                          </button>
                          <button
                            onClick={() => setDeleteId(rec._id)}
                            className="text-red-500/40 hover:text-red-400"
                          >
                            DEL
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

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

            {/* Read-only salary */}
            <div className="space-y-1">
              <label className="text-[9px] tracking-widest text-white/25">
                BASE SALARY FOR {form.month?.toUpperCase()} {form.year} — READ
                ONLY
              </label>
              <input
                type="text"
                disabled
                value={
                  monthlySalary > 0
                    ? `$${fmtUSD(monthlySalary)} (${form.month} ${form.year})`
                    : `No salary record found for ${form.month} ${form.year}`
                }
                className="w-full bg-white/[0.02] border border-white/[0.04] rounded-sm px-3 py-2 text-[12px] text-white/40 cursor-not-allowed select-none"
              />
            </div>

            {/* Amount + Currency */}
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

            {/* Live dynamic layout preview (Fixed Logic From Subtraction to Addition) */}
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
                    ${fmtUSD(Number(monthlySalary) + Number(previewUSD))}
                  </p>
                </div>
              </div>
            )}

            {/* Month + Year */}
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
                  onChange={(e) => {
                    const newYear = Number(e.target.value);
                    setForm((f) => ({ ...f, year: newYear }));
                    // ⭐️ Re-fetch base salary dynamically when year shifts!
                    fetchSalary(newYear, form.monthNumber);
                  }}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 focus:outline-none focus:border-white/20"
                />
              </div>
            </div>

            {/* Tag Selection Matrix */}
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

            {/* Status Selector Rows */}
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

            {/* Optional text area Notes */}
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

            {/* Modal Actions */}
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
                SAVE RECORD
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
