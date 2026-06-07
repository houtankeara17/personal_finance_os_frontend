import React, { useState, useEffect, useCallback, useRef } from "react";
import { useFinance } from "../../context/FinanceContext";

// ── Style maps ────────────────────────────────────────────────────────────────
const CATEGORY_STYLE = {
  Daily: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  Family: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  Utilities: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  Rent: "bg-pink-500/15 text-pink-300 border-pink-500/30",
  Food: "bg-green-500/15 text-green-300 border-green-500/30",
  Transport: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  Health: "bg-red-500/15 text-red-300 border-red-500/30",
  Entertainment: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  Other: "bg-white/8 text-white/50 border-white/15",
};

const CATEGORY_DOT = {
  Daily: "bg-orange-400",
  Family: "bg-purple-400",
  Utilities: "bg-sky-400",
  Rent: "bg-pink-400",
  Food: "bg-green-400",
  Transport: "bg-cyan-400",
  Health: "bg-red-400",
  Entertainment: "bg-yellow-400",
  Other: "bg-white/30",
};

const PAYMENT_STYLE = {
  "ABA Bank": "bg-blue-500/15 text-blue-300 border-blue-500/30",
  "ACLYDA Bank": "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  Cash: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  "Credit Card": "bg-violet-500/15 text-violet-300 border-violet-500/30",
  Wing: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  Other: "bg-white/8 text-white/50 border-white/15",
};

const CURRENCY_SYMBOLS = { USD: "$", KHR: "៛", THB: "฿" };

const MONTH_NAMES = [
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

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ALL_CATEGORIES = [
  "Daily",
  "Family",
  "Utilities",
  "Rent",
  "Food",
  "Transport",
  "Health",
  "Entertainment",
  "Other",
];
const ALL_PAYMENTS = [
  "ABA Bank",
  "ACLYDA Bank",
  "Cash",
  "Credit Card",
  "Wing",
  "Other",
];

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}
function firstDayOfMonth(year, month) {
  return new Date(year, month - 1, 1).getDay();
}

// ── Reusable styled select ────────────────────────────────────────────────────
function StyledSelect({ value, onChange, children, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={onChange}
        className="appearance-none w-full bg-[#1a1a1a] border border-white/10 rounded-md px-3 py-1.5 pr-7 text-[11px] text-white/80 focus:outline-none focus:border-white/30 cursor-pointer transition-colors hover:border-white/20"
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/30 text-[10px]">
        ▾
      </span>
    </div>
  );
}

// ── Tag badge ─────────────────────────────────────────────────────────────────
function Tag({ style, children }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-medium border tracking-wide ${style}`}
    >
      {children}
    </span>
  );
}

// ── Modal shell ───────────────────────────────────────────────────────────────
function Modal({ onClose, children, title, subtitle }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#111] border border-white/10 rounded-xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <div>
            <p className="text-[9px] tracking-[0.2em] text-white/25 uppercase mb-0.5">
              {subtitle}
            </p>
            <h2 className="text-sm font-semibold text-white/90">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/25 hover:text-white/70 transition-colors text-xl leading-none mt-0.5 ml-4"
          >
            ×
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

// ── Delete Confirm Dialog ─────────────────────────────────────────────────────
function DeleteConfirmDialog({
  onConfirm,
  onCancel,
  message,
  confirmLabel = "DELETE",
  danger = true,
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-[#111] border border-red-500/20 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-red-400 text-lg">⚠</span>
            <p className="text-[9px] tracking-[0.2em] text-red-400/60 uppercase">
              Confirm Delete
            </p>
          </div>
          <p className="text-sm text-white/80 mt-2 leading-relaxed">
            {message}
          </p>
          <p className="text-[10px] text-white/30 mt-2">
            This action cannot be undone.
          </p>
        </div>
        <div className="px-5 py-4 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-white/[0.08] rounded-lg text-[10px] tracking-widest text-white/40 hover:text-white/70 transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 hover:border-red-500/50 rounded-lg text-[10px] tracking-widest text-red-400 hover:text-red-300 transition-all"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Expense Form (shared for create + edit) ───────────────────────────────────
function ExpenseForm({ initial, onSubmit, onCancel, submitting }) {
  const now = new Date();
  const [amount, setAmount] = useState(initial?.amount?.toString() || "");
  const [currency, setCurrency] = useState(initial?.currency || "USD");
  const [category, setCategory] = useState(initial?.category || "Daily");
  const [paymentMethod, setPaymentMethod] = useState(
    initial?.paymentMethod || "ABA Bank",
  );
  const [expenseDate, setExpenseDate] = useState(
    initial?.expenseDate
      ? new Date(initial.expenseDate).toISOString().slice(0, 10)
      : now.toISOString().slice(0, 10),
  );
  const [images, setImages] = useState(initial?.images || []);
  const [imageInput, setImageInput] = useState("");
  const [noted, setNoted] = useState(initial?.noted || "");
  const fileRef = useRef();

  const addImageUrl = () => {
    const url = imageInput.trim();
    if (url) {
      setImages((p) => [...p, url]);
      setImageInput("");
    }
  };

  const handleFileChange = (e) => {
    Array.from(e.target.files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setImages((p) => [...p, ev.target.result]);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      amount: Number(amount),
      currency,
      category,
      paymentMethod,
      expenseDate,
      images,
      noted,
      amountUSD: 0,
    });
  };

  const Field = ({ label, children }) => (
    <div className="space-y-1.5">
      <label className="text-[9px] tracking-[0.15em] text-white/30 uppercase font-medium">
        {label}
      </label>
      {children}
    </div>
  );

  const inputCls =
    "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/85 placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-3">
        <Field label="Amount">
          <input
            type="number"
            required
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={`${inputCls} flex-1`}
          />
        </Field>
        <div className="w-28 space-y-1.5">
          <label className="text-[9px] tracking-[0.15em] text-white/30 uppercase font-medium">
            Currency
          </label>
          <StyledSelect
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="USD">USD</option>
            <option value="KHR">KHR</option>
            <option value="THB">THB</option>
          </StyledSelect>
        </div>
      </div>
      <Field label="Date">
        <input
          type="date"
          required
          value={expenseDate}
          onChange={(e) => setExpenseDate(e.target.value)}
          className={inputCls}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <StyledSelect
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </StyledSelect>
        </Field>
        <Field label="Payment Method">
          <StyledSelect
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            {ALL_PAYMENTS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </StyledSelect>
        </Field>
      </div>
      <Field label="Receipt Images (Optional)">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 w-full border border-dashed border-white/15 rounded-lg px-3 py-2.5 text-[11px] text-white/35 hover:border-white/30 hover:text-white/60 transition-colors"
          >
            <span className="text-base leading-none">📎</span> Choose files from
            device
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addImageUrl();
                }
              }}
              placeholder="…or paste an image URL"
              className={`${inputCls} flex-1`}
            />
            <button
              type="button"
              onClick={addImageUrl}
              className="px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-lg text-[9px] tracking-widest text-white/40 hover:text-white/70 transition-colors whitespace-nowrap"
            >
              ADD
            </button>
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {images.map((src, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-lg overflow-hidden border border-white/10 aspect-square"
                >
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setImages((p) => p.filter((_, i) => i !== idx))
                    }
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-400 text-lg"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Field>
      <Field label="Note (Optional)">
        <input
          type="text"
          value={noted}
          onChange={(e) => setNoted(e.target.value)}
          placeholder="What was this for?"
          className={inputCls}
        />
      </Field>
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 border border-white/[0.08] rounded-lg text-[10px] tracking-widest text-white/30 hover:text-white/60 transition-colors"
        >
          CANCEL
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-2.5 bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] rounded-lg text-[10px] tracking-widest text-white/80 transition-all disabled:opacity-40"
        >
          {submitting ? "SAVING…" : initial ? "UPDATE" : "LOG EXPENSE"}
        </button>
      </div>
    </form>
  );
}

// ── Calendar Day Popup ────────────────────────────────────────────────────────
function DayPopup({
  day,
  month,
  year,
  expenses,
  onClose,
  onEdit,
  onDelete,
  deletingId,
}) {
  const [confirmDelete, setConfirmDelete] = useState(null); // expense id to confirm

  const dayExpenses = expenses.filter((e) => e.day === day);
  const total = dayExpenses.reduce((s, e) => s + (e.amountUSD || 0), 0);
  const dateLabel = `${MONTH_NAMES[month - 1]} ${day}, ${year}`;

  const handleDeleteClick = (id) => setConfirmDelete(id);
  const handleConfirmDelete = () => {
    onDelete(confirmDelete);
    setConfirmDelete(null);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-[#111] border border-white/10 rounded-t-2xl sm:rounded-xl w-full sm:max-w-md max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
            <div>
              <p className="text-[9px] tracking-widest text-white/25 uppercase mb-0.5">
                Daily Breakdown
              </p>
              <h3 className="text-sm font-semibold text-white/90">
                {dateLabel}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/50 font-medium">
                ${total.toFixed(2)} USD
              </span>
              <button
                onClick={onClose}
                className="text-white/25 hover:text-white/70 text-xl leading-none transition-colors"
              >
                ×
              </button>
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {dayExpenses.length === 0 ? (
              <div className="py-10 text-center text-[11px] text-white/20 tracking-widest">
                NO EXPENSES
              </div>
            ) : (
              dayExpenses.map((exp) => (
                <div
                  key={exp._id}
                  className="px-5 py-3.5 border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <Tag
                          style={
                            CATEGORY_STYLE[exp.category] ||
                            "text-white/40 border-white/10 bg-white/5"
                          }
                        >
                          {exp.category}
                        </Tag>
                        <Tag
                          style={
                            PAYMENT_STYLE[exp.paymentMethod] ||
                            "text-white/40 border-white/10 bg-white/5"
                          }
                        >
                          {exp.paymentMethod}
                        </Tag>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-[14px] font-semibold text-white/85">
                          {CURRENCY_SYMBOLS[exp.currency] || ""}
                          {exp.amount} {exp.currency}
                        </span>
                        {exp.currency !== "USD" && (
                          <span className="text-[11px] text-white/35">
                            ≈ ${(exp.amountUSD || 0).toFixed(2)}
                          </span>
                        )}
                      </div>
                      {exp.noted && (
                        <p className="text-[11px] text-white/35 mt-1 truncate">
                          {exp.noted}
                        </p>
                      )}
                      {exp.images?.length > 0 && (
                        <div className="flex gap-1.5 mt-2">
                          {exp.images.slice(0, 3).map((src, i) => (
                            <a
                              key={i}
                              href={src}
                              target="_blank"
                              rel="noreferrer"
                              className="w-10 h-10 rounded border border-white/10 overflow-hidden block shrink-0"
                            >
                              <img
                                src={src}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </a>
                          ))}
                          {exp.images.length > 3 && (
                            <span className="text-[9px] text-white/25 flex items-center">
                              +{exp.images.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => onEdit(exp)}
                        className="px-2.5 py-1 text-[9px] tracking-widest text-sky-400/70 hover:text-sky-300 border border-sky-500/20 hover:border-sky-500/40 rounded transition-colors"
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => handleDeleteClick(exp._id)}
                        disabled={deletingId === exp._id}
                        className="px-2.5 py-1 text-[9px] tracking-widest text-red-400/50 hover:text-red-300 border border-red-500/15 hover:border-red-500/35 rounded transition-colors disabled:opacity-30"
                      >
                        {deletingId === exp._id ? "…" : "DEL"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {dayExpenses.length > 0 && (
            <div className="px-5 py-3 border-t border-white/[0.06] bg-white/[0.01] flex justify-between items-center shrink-0">
              <span className="text-[10px] text-white/25">
                {dayExpenses.length} item{dayExpenses.length !== 1 ? "s" : ""}
              </span>
              <span className="text-[11px] font-medium text-white/60">
                ${total.toFixed(2)} total
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Confirm delete overlay (above popup) */}
      {confirmDelete && (
        <DeleteConfirmDialog
          message={`Delete this expense? This cannot be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Expenses() {
  const { syncHeaders, addNotice } = useFinance();

  const now = new Date();
  const [curYear, setCurYear] = useState(now.getFullYear());
  const [curMonth, setCurMonth] = useState(now.getMonth() + 1);

  const [expenses, setExpenses] = useState([]);
  const [calendarMap, setCalendarMap] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const [view, setView] = useState("table");
  const [timeRange, setTimeRange] = useState("month");
  const [filterCat, setFilterCat] = useState("ALL");
  const [filterPay, setFilterPay] = useState("ALL");
  const [sortBy, setSortBy] = useState("date-desc");
  const [search, setSearch] = useState("");

  // ── Date range filter state ───────────────────────────────────────────────
  const [dateFrom, setDateFrom] = useState(""); // "YYYY-MM-DD"
  const [dateTo, setDateTo] = useState(""); // "YYYY-MM-DD"

  // Calendar day popup
  const [dayPopup, setDayPopup] = useState(null);

  // Log / Edit modal
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // single item confirm
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false); // delete-all confirm step 1
  const [confirmDeleteAllFinal, setConfirmDeleteAllFinal] = useState(false); // step 2

  const currentYear = now.getFullYear();
  const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchMonth = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, calRes] = await Promise.all([
        fetch(
          `http://localhost:5000/api/expenses?year=${curYear}&monthNumber=${curMonth}&limit=200`,
          { headers: syncHeaders() },
        ).then((r) => r.json()),
        fetch(
          `http://localhost:5000/api/expenses/analytics/calendar?year=${curYear}&monthNumber=${curMonth}`,
          { headers: syncHeaders() },
        ).then((r) => r.json()),
      ]);
      if (expRes.success) {
        setExpenses(expRes.data || []);
        setStats(expRes.stats || null);
      } else {
        setExpenses([]);
        setStats(null);
      }
      if (calRes.success) {
        const map = {};
        (calRes.data || []).forEach((d) => {
          map[d.day] = d;
        });
        setCalendarMap(map);
      } else setCalendarMap({});
    } catch {
      setExpenses([]);
      setCalendarMap({});
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [curYear, curMonth, syncHeaders]);

  useEffect(() => {
    fetchMonth();
  }, [fetchMonth]);

  // ── Month nav ─────────────────────────────────────────────────────────────
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
    setCurMonth(m);
    setCurYear(y);
    setFilterCat("ALL");
    setFilterPay("ALL");
    setSearch("");
    setDateFrom("");
    setDateTo("");
  };

  const handleDateJump = (month, year) => {
    setCurMonth(month);
    setCurYear(year);
    setFilterCat("ALL");
    setFilterPay("ALL");
    setSearch("");
    setDateFrom("");
    setDateTo("");
  };

  const isCurrentMonth =
    curYear === now.getFullYear() && curMonth === now.getMonth() + 1;

  // ── Derived filtered + sorted list ───────────────────────────────────────
  let filtered = expenses.filter((e) => {
    if (filterCat !== "ALL" && e.category !== filterCat) return false;
    if (filterPay !== "ALL" && e.paymentMethod !== filterPay) return false;
    if (search) {
      const s = search.toLowerCase();
      if (
        !(
          e.noted?.toLowerCase().includes(s) ||
          e.category?.toLowerCase().includes(s) ||
          e.paymentMethod?.toLowerCase().includes(s)
        )
      )
        return false;
    }
    // Custom date range filter
    if (dateFrom || dateTo) {
      const expDate = new Date(curYear, curMonth - 1, e.day);
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (expDate < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59);
        if (expDate > to) return false;
      }
    } else if (timeRange === "week") {
      // week filter only applies when no custom date range is set
      const d = new Date(curYear, curMonth - 1, e.day);
      const today = now;
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      if (d < weekStart || d > weekEnd) return false;
    }
    return true;
  });

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "date-desc") return b.day - a.day;
    if (sortBy === "date-asc") return a.day - b.day;
    if (sortBy === "amount-desc")
      return (b.amountUSD || 0) - (a.amountUSD || 0);
    if (sortBy === "amount-asc") return (a.amountUSD || 0) - (b.amountUSD || 0);
    return 0;
  });

  const filteredTotal = filtered.reduce((s, e) => s + (e.amountUSD || 0), 0);
  const hasDateRangeFilter = !!(dateFrom || dateTo);
  const hasAnyFilter =
    filterCat !== "ALL" ||
    filterPay !== "ALL" ||
    search ||
    timeRange !== "month" ||
    hasDateRangeFilter;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleCreate = async (data) => {
    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:5000/api/expenses", {
        method: "POST",
        headers: { ...syncHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json());
      if (res.success) {
        addNotice("Expense logged.");
        setModal(false);
        fetchMonth();
      } else addNotice(res.message || "Failed to log expense.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data) => {
    setSubmitting(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/expenses/${editTarget._id}`,
        {
          method: "PUT",
          headers: { ...syncHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      ).then((r) => r.json());
      if (res.success) {
        addNotice("Expense updated.");
        setModal(false);
        setEditTarget(null);
        fetchMonth();
      } else addNotice(res.message || "Failed to update.");
    } finally {
      setSubmitting(false);
    }
  };

  // Single delete — after confirmation
  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await fetch(`http://localhost:5000/api/expenses/${id}`, {
        method: "DELETE",
        headers: syncHeaders(),
      });
      addNotice("Expense removed.");
      fetchMonth();
    } finally {
      setDeletingId(null);
    }
  };

  const requestDelete = (id) => setConfirmDeleteId(id);
  const confirmSingleDelete = () => {
    handleDelete(confirmDeleteId);
    setConfirmDeleteId(null);
  };

  // Delete all on page (filtered) — two-step
  const handleDeleteAll = async () => {
    setConfirmDeleteAll(false);
    setConfirmDeleteAllFinal(false);
    const ids = filtered.map((e) => e._id);
    for (const id of ids) {
      await fetch(`http://localhost:5000/api/expenses/${id}`, {
        method: "DELETE",
        headers: syncHeaders(),
      });
    }
    addNotice(`${ids.length} expense${ids.length !== 1 ? "s" : ""} deleted.`);
    fetchMonth();
  };

  const openEdit = (exp) => {
    setEditTarget(exp);
    setModal(true);
    setDayPopup(null);
  };
  const closeModal = () => {
    setModal(false);
    setEditTarget(null);
  };

  const clearDateRange = () => {
    setDateFrom("");
    setDateTo("");
  };

  // ── Calendar grid ─────────────────────────────────────────────────────────
  const totalDays = daysInMonth(curYear, curMonth);
  const startDay = firstDayOfMonth(curYear, curMonth);
  const maxTotal = Math.max(
    ...Object.values(calendarMap).map((d) => d.total),
    1,
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 font-mono min-h-screen">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[9px] tracking-[0.2em] text-white/20 uppercase mb-1">
            Finance OS · Expenses
          </p>
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-white/90">
            Expense Tracker
          </h1>
          {stats && (
            <p className="text-[10px] text-white/30 mt-1 flex flex-wrap gap-x-2">
              <span>
                {expenses.length} {expenses.length === 1 ? "entry" : "entries"}
              </span>
              <span>·</span>
              <span>
                Total{" "}
                <span className="text-white/60">
                  ${stats.totalSpent.toFixed(2)} USD
                </span>
              </span>
              {stats.topCategory && (
                <>
                  <span>·</span>
                  <span>
                    top{" "}
                    <span className="text-white/50">
                      {stats.topCategory.name}
                    </span>
                  </span>
                </>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Delete all button — only shown when there are filtered results */}
          {filtered.length > 0 && (
            <button
              onClick={() => setConfirmDeleteAll(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/[0.06] hover:bg-red-500/[0.12] border border-red-500/[0.12] hover:border-red-500/[0.25] rounded-lg text-[10px] tracking-widest text-red-400/60 hover:text-red-300 transition-all shrink-0"
            >
              <span className="text-red-500/40">⊗</span> DELETE ALL
            </button>
          )}
          <button
            onClick={() => {
              setEditTarget(null);
              setModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-lg text-[10px] tracking-widest text-white/70 transition-all shrink-0"
          >
            <span className="text-white/40">+</span> LOG EXPENSE
          </button>
        </div>
      </div>

      {/* ── Month navigation ── */}
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
              {MONTH_NAMES.map((name, index) => (
                <option
                  key={name}
                  value={index + 1}
                  className="bg-[#121212] text-white"
                >
                  {name.toUpperCase()}
                </option>
              ))}
            </select>
            <select
              value={curYear}
              onChange={(e) => handleDateJump(curMonth, Number(e.target.value))}
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

      {/* ── Stats strip ── */}
      {stats && expenses.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            {
              label: "TOTAL SPENT",
              value: `$${stats.totalSpent.toFixed(2)}`,
              sub: "USD",
            },
            {
              label: "AVG PER ITEM",
              value: `$${stats.avgPerItem.toFixed(2)}`,
              sub: "USD",
            },
            {
              label: "LARGEST",
              value: stats.largest
                ? `$${stats.largest.amount.toFixed(2)}`
                : "—",
              sub: stats.largest?.currency || "",
            },
            {
              label: "TOP CATEGORY",
              value: stats.topCategory?.name || "—",
              sub: stats.topCategory ? `${stats.topCategory.count} items` : "",
            },
          ].map(({ label, value, sub }) => (
            <div
              key={label}
              className="border border-white/[0.05] rounded-lg px-3 py-2.5 bg-white/[0.02]"
            >
              <p className="text-[8px] tracking-widest text-white/20 mb-1">
                {label}
              </p>
              <p className="text-[13px] text-white/75 font-semibold truncate">
                {value}
              </p>
              {sub && <p className="text-[9px] text-white/20 mt-0.5">{sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* ── Filter & Controls bar ── */}
      {expenses.length > 0 && (
        <div className="space-y-2.5">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-[11px]">
              ⌕
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by note, category, payment…"
              className="w-full bg-white/[0.03] border border-white/[0.07] rounded-lg pl-7 pr-3 py-2 text-[11px] text-white/70 placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* ── Date range filter ── */}
          <div className="flex flex-wrap items-center gap-2 border border-white/[0.06] rounded-lg px-3 py-2.5 bg-white/[0.01]">
            <span className="text-[8px] tracking-widest text-white/25 shrink-0">
              DATE RANGE
            </span>
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] text-white/20">FROM</span>
                <input
                  type="date"
                  value={dateFrom}
                  min={`${curYear}-${String(curMonth).padStart(2, "0")}-01`}
                  max={
                    dateTo ||
                    `${curYear}-${String(curMonth).padStart(2, "0")}-${String(daysInMonth(curYear, curMonth)).padStart(2, "0")}`
                  }
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    if (timeRange !== "month") setTimeRange("month");
                  }}
                  className="bg-[#1a1a1a] border border-white/10 rounded-md px-2 py-1 text-[11px] text-white/70 focus:outline-none focus:border-white/30 transition-colors cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] text-white/20">TO</span>
                <input
                  type="date"
                  value={dateTo}
                  min={
                    dateFrom ||
                    `${curYear}-${String(curMonth).padStart(2, "0")}-01`
                  }
                  max={`${curYear}-${String(curMonth).padStart(2, "0")}-${String(daysInMonth(curYear, curMonth)).padStart(2, "0")}`}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    if (timeRange !== "month") setTimeRange("month");
                  }}
                  className="bg-[#1a1a1a] border border-white/10 rounded-md px-2 py-1 text-[11px] text-white/70 focus:outline-none focus:border-white/30 transition-colors cursor-pointer"
                />
              </div>
              {hasDateRangeFilter && (
                <button
                  onClick={clearDateRange}
                  className="flex items-center gap-1 px-2 py-1 bg-white/[0.04] border border-white/10 rounded text-[9px] text-white/35 hover:text-white/60 transition-colors"
                >
                  CLEAR ✕
                </button>
              )}
              {hasDateRangeFilter && (
                <span className="text-[9px] text-white/30 ml-auto">
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""} · $
                  {filteredTotal.toFixed(2)} USD
                </span>
              )}
            </div>
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[8px] tracking-widest text-white/20 shrink-0">
                CAT
              </span>
              <StyledSelect
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
                className="w-28"
              >
                <option value="ALL">All</option>
                {ALL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </StyledSelect>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[8px] tracking-widest text-white/20 shrink-0">
                PAY
              </span>
              <StyledSelect
                value={filterPay}
                onChange={(e) => setFilterPay(e.target.value)}
                className="w-32"
              >
                <option value="ALL">All</option>
                {ALL_PAYMENTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </StyledSelect>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[8px] tracking-widest text-white/20 shrink-0">
                SORT
              </span>
              <StyledSelect
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-36"
              >
                <option value="date-desc">Date (newest)</option>
                <option value="date-asc">Date (oldest)</option>
                <option value="amount-desc">Amount (high)</option>
                <option value="amount-asc">Amount (low)</option>
              </StyledSelect>
            </div>
            {/* Time range — disabled when custom date range is active */}
            <div className="flex items-center gap-1 ml-auto flex-wrap">
              {["week", "month", "year"].map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setTimeRange(r);
                    clearDateRange();
                  }}
                  disabled={hasDateRangeFilter && r !== "month"}
                  className={`px-2.5 py-1 text-[8px] tracking-widest rounded border transition-colors ${
                    timeRange === r && !hasDateRangeFilter
                      ? "bg-white/[0.08] border-white/20 text-white/70"
                      : "border-white/[0.06] text-white/25 hover:text-white/50 disabled:opacity-30"
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {["table", "calendar"].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-2.5 py-1 text-[8px] tracking-widest rounded border transition-colors ${
                    view === v
                      ? "bg-white/[0.08] border-white/20 text-white/70"
                      : "border-white/[0.06] text-white/25 hover:text-white/50"
                  }`}
                >
                  {v === "table" ? "≡ TABLE" : "▦ CAL"}
                </button>
              ))}
            </div>
          </div>

          {/* Active filters */}
          {hasAnyFilter && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[8px] tracking-widest text-white/20">
                FILTERS:
              </span>
              {filterCat !== "ALL" && (
                <button
                  onClick={() => setFilterCat("ALL")}
                  className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded text-[9px] text-orange-300 hover:bg-orange-500/20 transition-colors"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${CATEGORY_DOT[filterCat]}`}
                  />
                  {filterCat} ✕
                </button>
              )}
              {filterPay !== "ALL" && (
                <button
                  onClick={() => setFilterPay("ALL")}
                  className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[9px] text-blue-300 hover:bg-blue-500/20 transition-colors"
                >
                  {filterPay} ✕
                </button>
              )}
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="flex items-center gap-1 px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-white/40 hover:bg-white/10 transition-colors"
                >
                  "{search.length > 12 ? search.slice(0, 12) + "…" : search}" ✕
                </button>
              )}
              {hasDateRangeFilter && (
                <button
                  onClick={clearDateRange}
                  className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                >
                  📅 {dateFrom || "…"} → {dateTo || "…"} ✕
                </button>
              )}
              <button
                onClick={() => {
                  setFilterCat("ALL");
                  setFilterPay("ALL");
                  setSearch("");
                  setTimeRange("month");
                  clearDateRange();
                }}
                className="text-[8px] tracking-widest text-white/20 hover:text-white/50 transition-colors ml-1"
              >
                CLEAR ALL
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="py-16 text-center text-[10px] tracking-widest text-white/20 animate-pulse">
          LOADING…
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && expenses.length === 0 && (
        <div className="border border-white/[0.06] rounded-xl py-14 flex flex-col items-center gap-3">
          <p className="text-[11px] tracking-[0.25em] text-white/20">
            NO RECORDS
          </p>
          <p className="text-[10px] text-white/15">
            {MONTH_NAMES[curMonth - 1]} {curYear} has no expenses.
          </p>
          <div className="flex gap-3 mt-2 flex-wrap justify-center">
            <button
              onClick={() => goMonth(-1)}
              className="text-[9px] tracking-widest text-white/25 hover:text-white/60 border border-white/[0.06] rounded-lg px-3 py-1.5 transition-colors"
            >
              ← EARLIER MONTH
            </button>
            {!isCurrentMonth && (
              <button
                onClick={() => {
                  setCurYear(now.getFullYear());
                  setCurMonth(now.getMonth() + 1);
                }}
                className="text-[9px] tracking-widest text-white/25 hover:text-white/60 border border-white/[0.06] rounded-lg px-3 py-1.5 transition-colors"
              >
                → THIS MONTH
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Calendar view ── */}
      {!loading && expenses.length > 0 && view === "calendar" && (
        <div className="border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-white/[0.06] bg-white/[0.02]">
            {DAY_LABELS.map((d) => (
              <div
                key={d}
                className="py-2 text-center text-[8px] sm:text-[9px] tracking-widest text-white/20"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: startDay }).map((_, i) => (
              <div
                key={`e-${i}`}
                className="min-h-[56px] sm:min-h-[72px] border-r border-b border-white/[0.04]"
              />
            ))}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const data = calendarMap[day];
              const heat = data ? data.total / maxTotal : 0;
              const isToday = isCurrentMonth && day === now.getDate();
              const hasData = !!data;

              // Highlight days within custom date range
              const dayDate = new Date(curYear, curMonth - 1, day);
              const inRange =
                hasDateRangeFilter &&
                (!dateFrom || dayDate >= new Date(dateFrom)) &&
                (!dateTo || dayDate <= new Date(dateTo + "T23:59:59"));

              return (
                <div
                  key={day}
                  onClick={() => hasData && setDayPopup(day)}
                  className={`min-h-[56px] sm:min-h-[72px] border-r border-b border-white/[0.04] p-1 sm:p-1.5 relative transition-colors
                    ${hasData ? "cursor-pointer hover:bg-white/[0.04]" : ""}
                    ${inRange ? "ring-inset ring-1 ring-emerald-500/20" : ""}
                  `}
                  style={
                    data
                      ? { backgroundColor: `rgba(251,146,60,${heat * 0.2})` }
                      : undefined
                  }
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`text-[10px] sm:text-[11px] font-medium ${isToday ? "text-orange-400" : inRange ? "text-emerald-400/70" : "text-white/30"}`}
                    >
                      {day}
                    </span>
                    {isToday && (
                      <span className="text-[6px] tracking-widest text-orange-400/60 hidden sm:block">
                        TODAY
                      </span>
                    )}
                  </div>
                  {data && (
                    <div className="mt-0.5 sm:mt-1">
                      <p className="text-[9px] sm:text-[10px] text-white/65 font-semibold leading-none">
                        ${data.total.toFixed(0)}
                      </p>
                      <p className="text-[7px] sm:text-[8px] text-white/25 mt-0.5 hidden sm:block">
                        {data.count}×
                      </p>
                    </div>
                  )}
                  {hasData && (
                    <div className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-orange-400/50 hidden sm:block" />
                  )}
                </div>
              );
            })}
          </div>
          <div className="px-4 py-2.5 border-t border-white/[0.06] bg-white/[0.01] flex items-center justify-between">
            <span className="text-[9px] text-white/20 tracking-widest">
              CLICK A DAY TO SEE DETAILS
            </span>
            <span className="text-[9px] text-white/30">
              {Object.keys(calendarMap).length} active days
            </span>
          </div>
        </div>
      )}

      {/* ── Table view ── */}
      {!loading && expenses.length > 0 && view === "table" && (
        <div className="border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="hidden sm:grid grid-cols-[72px_1fr_1fr_80px_1fr_1fr_88px] text-[8px] tracking-[0.18em] text-white/20 border-b border-white/[0.06] px-4 py-2.5 bg-white/[0.02]">
            <span>DATE</span>
            <span>CATEGORY</span>
            <span>AMOUNT</span>
            <span>USD</span>
            <span>PAYMENT</span>
            <span>NOTE / RECEIPT</span>
            <span className="text-right">ACTIONS</span>
          </div>

          {filtered.length === 0 ? (
            <div className="py-10 text-center text-[10px] tracking-widest text-white/20">
              NO ENTRIES MATCH FILTERS
            </div>
          ) : (
            filtered.map((exp, i) => (
              <div
                key={exp._id}
                className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}
              >
                {/* Desktop row */}
                <div className="hidden sm:grid grid-cols-[72px_1fr_1fr_80px_1fr_1fr_88px] items-center px-4 py-3 text-[11px]">
                  <span className="text-white/25 text-[10px]">
                    {MONTH_NAMES[curMonth - 1].slice(0, 3).toUpperCase()}{" "}
                    {String(exp.day).padStart(2, "0")}
                  </span>
                  <div>
                    <Tag
                      style={
                        CATEGORY_STYLE[exp.category] ||
                        "text-white/40 border-white/10 bg-white/5"
                      }
                    >
                      {exp.category?.toUpperCase()}
                    </Tag>
                  </div>
                  <span className="text-white/80 font-medium">
                    {CURRENCY_SYMBOLS[exp.currency] || ""}
                    {exp.amount} {exp.currency}
                  </span>
                  <span className="text-white/40 text-[10px]">
                    ${(exp.amountUSD || 0).toFixed(2)}
                  </span>
                  <div>
                    <Tag
                      style={
                        PAYMENT_STYLE[exp.paymentMethod] ||
                        "text-white/40 border-white/10 bg-white/5"
                      }
                    >
                      {exp.paymentMethod?.toUpperCase()}
                    </Tag>
                  </div>
                  <span className="text-white/35 truncate text-[10px]">
                    {exp.images?.length > 0 ? (
                      <a
                        href={exp.images[0]}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1"
                      >
                        <span className="text-[10px]">🖼</span> RECEIPT ↗
                      </a>
                    ) : (
                      exp.noted || <span className="text-white/15">—</span>
                    )}
                  </span>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => openEdit(exp)}
                      className="text-[9px] tracking-widest text-sky-400/60 hover:text-sky-300 transition-colors"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => requestDelete(exp._id)}
                      disabled={deletingId === exp._id}
                      className="text-[9px] tracking-widest text-red-500/40 hover:text-red-400 transition-colors disabled:opacity-30"
                    >
                      {deletingId === exp._id ? "…" : "DEL"}
                    </button>
                  </div>
                </div>

                {/* Mobile row */}
                <div className="sm:hidden px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag
                        style={
                          CATEGORY_STYLE[exp.category] ||
                          "text-white/40 border-white/10 bg-white/5"
                        }
                      >
                        {exp.category}
                      </Tag>
                      <span className="text-[9px] text-white/25">
                        {MONTH_NAMES[curMonth - 1].slice(0, 3)}{" "}
                        {String(exp.day).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(exp)}
                        className="text-[9px] text-sky-400/60 hover:text-sky-300 transition-colors"
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => requestDelete(exp._id)}
                        disabled={deletingId === exp._id}
                        className="text-[9px] text-red-500/40 hover:text-red-400 transition-colors disabled:opacity-30"
                      >
                        {deletingId === exp._id ? "…" : "DEL"}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-white/85">
                      {CURRENCY_SYMBOLS[exp.currency] || ""}
                      {exp.amount} {exp.currency}
                    </span>
                    <Tag
                      style={
                        PAYMENT_STYLE[exp.paymentMethod] ||
                        "text-white/40 border-white/10 bg-white/5"
                      }
                    >
                      {exp.paymentMethod}
                    </Tag>
                  </div>
                  {exp.noted && (
                    <p className="text-[10px] text-white/30 truncate">
                      {exp.noted}
                    </p>
                  )}
                  {exp.images?.length > 0 && (
                    <a
                      href={exp.images[0]}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-sky-400 hover:text-sky-300 transition-colors"
                    >
                      🖼 View receipt ↗
                    </a>
                  )}
                </div>
              </div>
            ))
          )}

          {filtered.length > 0 && (
            <div className="px-4 py-2.5 border-t border-white/[0.06] bg-white/[0.02] flex items-center justify-between flex-wrap gap-2">
              <span className="text-[9px] tracking-widest text-white/20">
                {filtered.length} of {expenses.length} ENTRIES
              </span>
              <span className="text-[10px] text-white/45 font-medium">
                ${filteredTotal.toFixed(2)} USD
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Log / Edit Modal ── */}
      {modal && (
        <Modal
          onClose={closeModal}
          title={editTarget ? "Edit Expense" : "New Expense"}
          subtitle={editTarget ? "Update entry" : "Log Expense"}
        >
          <ExpenseForm
            initial={editTarget}
            onSubmit={editTarget ? handleUpdate : handleCreate}
            onCancel={closeModal}
            submitting={submitting}
          />
        </Modal>
      )}

      {/* ── Calendar Day Popup ── */}
      {dayPopup !== null && (
        <DayPopup
          day={dayPopup}
          month={curMonth}
          year={curYear}
          expenses={expenses}
          onClose={() => setDayPopup(null)}
          onEdit={openEdit}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      )}

      {/* ── Single delete confirm ── */}
      {confirmDeleteId && (
        <DeleteConfirmDialog
          message="Are you sure you want to delete this expense? It will be permanently removed."
          onConfirm={confirmSingleDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {/* ── Delete All — Step 1 ── */}
      {confirmDeleteAll && !confirmDeleteAllFinal && (
        <DeleteConfirmDialog
          message={`You are about to delete ${filtered.length} expense${filtered.length !== 1 ? "s" : ""} (${hasAnyFilter ? "current filtered view" : "entire month"}). Are you sure?`}
          confirmLabel="YES, CONTINUE"
          onConfirm={() => {
            setConfirmDeleteAll(false);
            setConfirmDeleteAllFinal(true);
          }}
          onCancel={() => setConfirmDeleteAll(false)}
        />
      )}

      {/* ── Delete All — Step 2 (final) ── */}
      {confirmDeleteAllFinal && (
        <DeleteConfirmDialog
          message={`Final confirmation: permanently delete ${filtered.length} expense${filtered.length !== 1 ? "s" : ""}? There is no undo.`}
          confirmLabel="DELETE ALL"
          onConfirm={handleDeleteAll}
          onCancel={() => setConfirmDeleteAllFinal(false)}
        />
      )}
    </div>
  );
}
