import React, { useState } from "react";
import { useSalary, MAX_YEAR } from "../../hooks/useSalary";
import { useFinance } from "../../context/FinanceContext";

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

const VIEW_MODES = ["TABLE", "GRID", "LIST"];
const VIEW_STYLE = {
  TABLE: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
  GRID: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  LIST: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
};

// Modify your YEAR_OPTIONS array to include an "ALL" option at the front
const YEAR_OPTIONS = [
  "ALL",
  ...Array.from({ length: MAX_YEAR - 2025 + 1 }, (_, i) => 2025 + i),
];

const emptyForm = {
  amount: "",
  currency: "USD",
  year: MAX_YEAR,
  month: MONTHS[0],
  monthNumber: 1,
  status: "Confirmed",
  image: "",
  noted: "",
};

export default function Salary() {
  const { addNotice } = useFinance();
  const {
    curYear,
    records,
    loading,
    submitting,
    handleYearJump,
    saveRecord,
    deleteRecord,
    stats,
  } = useSalary();

  const [viewMode, setViewMode] = useState("TABLE");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

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
    if (file.size > 3 * 1024 * 1024) {
      return addNotice(
        "Payload constraint: Images must be under 3MB.",
        "error",
      );
    }
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

  const handleSubmit = async () => {
    const ok = await saveRecord(form, editTarget);
    if (ok) setShowModal(false);
  };

  return (
    <div className="space-y-6 font-mono text-white max-w-full overflow-x-hidden p-2 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
        <div>
          <p className="text-[10px] tracking-[0.2em] text-white/20 uppercase mb-1">
            Income Module
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-white/90">
            Salary Records ({curYear})
          </h1>
        </div>

        <button
          onClick={openCreate}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-sm text-[11px] tracking-widest text-white/70 transition-all self-start sm:self-auto"
        >
          <span className="text-white/40">+</span> NEW RECORD
        </button>
      </div>

      {/* Filter Box — Supports "ALL" Filter */}
      <div className="md:col-span-12 flex items-center justify-between border border-white/[0.06] bg-white/[0.02] rounded-sm px-5 py-3">
        {/* Hide/Disable previous button if viewing ALL */}
        <button
          onClick={() =>
            curYear !== "ALL" && handleYearJump(Number(curYear) - 1)
          }
          disabled={curYear === "ALL"}
          aria-label="Previous year"
          className="text-white/30 hover:text-white/70 text-lg px-2 transition-colors disabled:opacity-0 disabled:cursor-not-allowed"
        >
          ‹
        </button>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <select
              value={curYear}
              onChange={(e) => {
                const val = e.target.value;
                handleYearJump(val === "ALL" ? "ALL" : Number(val));
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
            {records.length} record{records.length !== 1 ? "s" : ""}{" "}
            {curYear === "ALL" ? "in total" : "this year"}
          </p>

          {curYear === MAX_YEAR && (
            <p className="text-[8px] tracking-widest text-white/20">
              CURRENT YEAR
            </p>
          )}
          {curYear === "ALL" && (
            <p className="text-[8px] tracking-widest text-indigo-400">
              ALL HISTORICAL DATA
            </p>
          )}
        </div>

        {/* Hide/Disable next button if viewing ALL or MAX_YEAR */}
        <button
          onClick={() =>
            curYear !== "ALL" && handleYearJump(Number(curYear) + 1)
          }
          disabled={curYear === "ALL" || curYear === MAX_YEAR}
          aria-label="Next year"
          className="text-white/30 hover:text-white/70 text-lg px-2 transition-colors disabled:opacity-0 disabled:cursor-not-allowed"
        >
          ›
        </button>
      </div>

      {/* Stats Matrix Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "YEARLY INCOME",
            value: `$${stats.totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          },
          { label: "RECORDS SHOWN", value: records.length },
          { label: "CONFIRMED", value: stats.confirmed },
          { label: "DISBURSED", value: stats.disbursed },
        ].map((s) => (
          <div
            key={s.label}
            className="border border-white/[0.06] bg-white/[0.02] rounded-sm p-3 xs:p-4"
          >
            <p className="text-[9px] tracking-[0.2em] text-white/25 mb-2 truncate">
              {s.label}
            </p>
            <p className="text-sm xs:text-lg text-white/80 font-semibold truncate">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Control Dashboard: View Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.06] pb-4">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="flex border border-white/[0.08] rounded-sm p-0.5 bg-white/[0.01] w-full sm:w-auto">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex-1 sm:flex-initial px-3 py-1.5 text-[10px] tracking-widest transition-all rounded-sm text-center ${
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
      </div>

      {/* Main Core View Engine */}
      {loading ? (
        <div className="py-12 border border-white/[0.06] text-center text-[11px] text-white/20 tracking-widest">
          LOADING RECORDS...
        </div>
      ) : records.length === 0 ? (
        <div className="py-12 border border-white/[0.06] text-center text-[11px] text-white/20 tracking-widest">
          NO SALARY RECORDS FOUND FOR {curYear}
        </div>
      ) : (
        <>
          {/* VIEW MODE: GRID */}
          {viewMode === "GRID" && (
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4">
              {records.map((rec) => (
                <div
                  key={rec._id}
                  className="border border-white/[0.06] bg-white/[0.02] rounded-sm p-4 space-y-4 relative flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] tracking-widest text-white/40 uppercase">
                        {rec.month} {rec.year}
                      </p>
                      <h3 className="text-base font-semibold text-white/90 mt-1">
                        {CURRENCY_SYMBOL[rec.currency] || "$"}
                        {Number(rec.amount).toLocaleString()}{" "}
                        <span className="text-xs text-white/40 font-normal">
                          {rec.currency}
                        </span>
                      </h3>
                      <p className="text-[11px] text-white/30 mt-0.5">
                        $
                        {Number(rec.amountUSD).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}{" "}
                        USD
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-sm text-[8px] tracking-widest ${STATUS_STYLE[rec.status] || STATUS_STYLE.Draft}`}
                    >
                      {rec.status?.toUpperCase() || "DRAFT"}
                    </span>
                  </div>

                  {rec.noted && (
                    <p className="text-[11px] text-white/40 bg-white/[0.01] p-2 border border-white/[0.04] rounded-sm break-words italic">
                      "{rec.noted}"
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] mt-auto">
                    <div>
                      {rec.image ? (
                        <a
                          href={rec.image}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-[9px] tracking-widest text-white/40 hover:text-white/70 transition-colors"
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>{" "}
                          VIEW PROOF
                        </a>
                      ) : (
                        <span className="text-[9px] tracking-widest text-white/10">
                          NO ATTACHMENT
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => openEdit(rec)}
                        className="text-[9px] tracking-widest text-white/30 hover:text-white/70"
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => setDeleteId(rec._id)}
                        className="text-[9px] tracking-widest text-red-500/40 hover:text-red-400"
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIEW MODE: TABLE */}
          {viewMode === "TABLE" && (
            <div className="border border-white/[0.06] rounded-sm overflow-x-auto custom-scrollbar">
              <div className="min-w-[600px] w-full">
                <div className="grid grid-cols-[1.2fr_1.5fr_1.2fr_70px_1fr_1fr] text-[9px] tracking-[0.18em] text-white/20 border-b border-white/[0.06] px-4 py-2 bg-white/[0.02]">
                  <span>PERIOD</span>
                  <span>AMOUNT</span>
                  <span>USD VALUE</span>
                  <span className="text-center">PROOF</span>
                  <span className="text-center">STATUS</span>
                  <span className="text-right">ACTIONS</span>
                </div>
                {records.map((rec, i) => (
                  <div
                    key={rec._id}
                    className={`grid grid-cols-[1.2fr_1.5fr_1.2fr_70px_1fr_1fr] items-center px-4 py-3 text-[11px] border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i % 2 !== 0 ? "bg-white/[0.01]" : ""}`}
                  >
                    <span className="text-white/60">
                      {rec.month} {rec.year}
                    </span>
                    <span className="text-white/80 font-medium">
                      {CURRENCY_SYMBOL[rec.currency] || "$"}
                      {Number(rec.amount).toLocaleString()} {rec.currency}
                    </span>
                    <span className="text-white/50">
                      $
                      {Number(rec.amountUSD).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <div className="flex justify-center">
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
                    </div>
                    <div className="flex justify-center">
                      <span
                        className={`px-2 py-0.5 rounded-sm text-[9px] tracking-widest ${STATUS_STYLE[rec.status] || STATUS_STYLE.Draft}`}
                      >
                        {rec.status?.toUpperCase() || "DRAFT"}
                      </span>
                    </div>
                    <div className="flex gap-2 justify-end">
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
            </div>
          )}

          {/* VIEW MODE: LIST */}
          {viewMode === "LIST" && (
            <div className="space-y-2">
              {records.map((rec) => (
                <div
                  key={rec._id}
                  className="border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.02] transition-colors rounded-sm px-4 py-3 flex flex-col gap-3 xs:flex-row xs:items-center xs:justify-between"
                >
                  <div className="flex items-center gap-3.5">
                    {rec.image ? (
                      <a
                        href={rec.image}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 rounded-sm overflow-hidden border border-white/10 flex-shrink-0 block"
                      >
                        <img
                          src={rec.image}
                          alt="Proof"
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ) : (
                      <div className="w-8 h-8 rounded-sm bg-white/[0.03] border border-white/[0.06] flex items-center justify-center flex-shrink-0 text-[10px] text-white/20">
                        —
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-white/80">
                          {CURRENCY_SYMBOL[rec.currency] || "$"}
                          {Number(rec.amount).toLocaleString()} {rec.currency}
                        </span>
                        <span className="text-[10px] text-white/30">
                          ($
                          {Number(rec.amountUSD).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                          )
                        </span>
                      </div>
                      <p className="text-[10px] text-white/40 tracking-wider uppercase mt-0.5">
                        {rec.month} {rec.year}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between xs:justify-end gap-4 border-t xs:border-t-0 border-white/[0.04] pt-2 xs:pt-0">
                    <span
                      className={`px-2 py-0.5 rounded-sm text-[8px] tracking-widest ${STATUS_STYLE[rec.status] || STATUS_STYLE.Draft}`}
                    >
                      {rec.status?.toUpperCase() || "DRAFT"}
                    </span>
                    <div className="flex gap-3">
                      <button
                        onClick={() => openEdit(rec)}
                        className="text-[9px] tracking-widest text-white/30 hover:text-white/70"
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => setDeleteId(rec._id)}
                        className="text-[9px] tracking-widest text-red-500/40 hover:text-red-400"
                      >
                        DEL
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-sm w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
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
                <label className="text-[9px] tracking-widest text-white/25 block">
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
                <label className="text-[9px] tracking-widest text-white/25 block">
                  CURRENCY
                </label>
                <select
                  value={form.currency}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, currency: e.target.value }))
                  }
                  className="w-full bg-[#0c0c0c] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 focus:outline-none"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-[9px] tracking-widest text-white/25 block">
                  MONTH
                </label>
                <select
                  value={form.month}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="w-full bg-[#0c0c0c] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 focus:outline-none"
                >
                  {MONTHS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="w-28 space-y-1">
                <label className="text-[9px] tracking-widest text-white/25 block">
                  YEAR
                </label>
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, year: Number(e.target.value) }))
                  }
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] tracking-widest text-white/25 block">
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
                      className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-red-400 text-[9px] font-bold"
                    >
                      REMOVE
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] tracking-widest text-white/25 block">
                STATUS
              </label>
              <div className="flex gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, status: s }))}
                    className={`flex-1 py-1.5 rounded-sm text-[10px] tracking-widest border transition-all ${
                      form.status === s
                        ? STATUS_STYLE[s]
                        : "border-white/[0.06] text-white/20 hover:text-white/40"
                    }`}
                  >
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] tracking-widest text-white/25 block">
                NOTES
              </label>
              <textarea
                value={form.noted}
                rows={2}
                placeholder="Optional note..."
                onChange={(e) =>
                  setForm((f) => ({ ...f, noted: e.target.value }))
                }
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 placeholder-white/20 focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 border border-white/[0.08] rounded-sm text-[10px] tracking-widest text-white/30 hover:text-white/60"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2 bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.1] rounded-sm text-[10px] tracking-widest text-white/70 disabled:opacity-40"
              >
                {submitting ? "SAVING..." : editTarget ? "UPDATE" : "CREATE"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-sm w-full max-w-sm p-6 space-y-4">
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
                onClick={async () => {
                  await deleteRecord(deleteId);
                  setDeleteId(null);
                }}
                className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-sm text-[10px] tracking-widest text-red-400 transition-colors"
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
