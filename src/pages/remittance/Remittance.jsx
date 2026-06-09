import React, { useState, useEffect } from "react";
import { useFinance } from "../../context/FinanceContext";
import BASE_URL from "../../api/config";

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
const RATES = { USD: 1, KHR: 4100, THB: 36 };

const VIEW_MODES = ["GRID", "TABLE", "LIST"];
const VIEW_STYLE = {
  GRID: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  TABLE: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  LIST: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
};

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

const today = new Date();
const emptyForm = {
  amount: "",
  currency: "USD",
  recipient: "",
  recipientRelation: "Other",
  method: "Cash",
  remittanceDate: today.toISOString().split("T")[0],
  year: today.getFullYear(),
  monthNumber: today.getMonth() + 1,
  day: today.getDate(),
  noted: "",
  images: [],
};

const MAX_MONTH = today.getMonth() + 1;
const MAX_YEAR = today.getFullYear();
const MIN_YEAR = 2025;
const YEAR_OPTIONS = Array.from(
  { length: MAX_YEAR - MIN_YEAR + 1 },
  (_, i) => MIN_YEAR + i,
);

// ── Shared helper: normalise images field ──
const getImages = (rec) =>
  rec.images && rec.images.length > 0
    ? rec.images
    : rec.image
      ? [rec.image]
      : [];

// ── Image strip used in Grid / List / Table ──
// MAX_VISIBLE controls how many thumbnails show before "+N more" badge
function ImageStrip({ images, size = "md", onOpen }) {
  const MAX_VISIBLE = 3;
  const shown = images.slice(0, MAX_VISIBLE);
  const extra = images.length - MAX_VISIBLE;

  const sizeClass = {
    sm: "w-7 h-7",
    md: "w-12 h-12",
    lg: "w-14 h-14",
  }[size];

  if (images.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((img, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onOpen(img)}
          className={`${sizeClass} border border-white/10 rounded-sm bg-cover bg-center hover:border-white/50 hover:scale-105 transition-all focus:outline-none focus:ring-1 focus:ring-white/30`}
          style={{ backgroundImage: `url(${img})` }}
          aria-label={`View attachment ${idx + 1}`}
        />
      ))}
      {extra > 0 && (
        <button
          type="button"
          onClick={() => onOpen(images[MAX_VISIBLE])}
          className={`${sizeClass} border border-white/10 rounded-sm flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] transition-all focus:outline-none`}
          aria-label={`View ${extra} more attachments`}
        >
          <span className="text-[9px] text-white/40 font-mono">+{extra}</span>
        </button>
      )}
    </div>
  );
}

// ── Modal image grid with remove buttons ──
function ModalImageGrid({ images, onRemove, onOpen }) {
  if (images.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2 p-2 border border-white/[0.06] bg-white/[0.01] rounded-sm">
      {images.map((img, idx) => (
        <div key={idx} className="relative group w-16 h-16 flex-shrink-0">
          {/* Thumbnail — click opens lightbox */}
          <button
            type="button"
            onClick={() => onOpen(img)}
            className="w-full h-full border border-white/15 rounded-sm bg-cover bg-center hover:border-white/40 transition-colors focus:outline-none"
            style={{ backgroundImage: `url(${img})` }}
            aria-label={`Preview attachment ${idx + 1}`}
          />
          {/* Remove — top-right, visible on hover */}
          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-black border border-red-500/40 text-red-400 text-[8px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 focus:outline-none"
            aria-label="Remove image"
          >
            ×
          </button>
          {/* Index badge */}
          <span className="absolute bottom-0.5 left-0.5 text-[7px] text-white/30 bg-black/60 px-0.5 rounded-sm leading-tight pointer-events-none">
            {idx + 1}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Remittance() {
  const { syncHeaders, addNotice } = useFinance();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [filterRelation, setFilterRelation] = useState("ALL");
  const [viewMode, setViewMode] = useState("GRID");
  const [lightboxImg, setLightboxImg] = useState(null);
  // Lightbox carousel: when multiple images exist, allow prev/next
  const [lightboxList, setLightboxList] = useState([]);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  const [navMonth, setNavMonth] = useState(today.getMonth() + 1);
  const [navYear, setNavYear] = useState(today.getFullYear());

  const BASE = `${BASE_URL}/api/remittances`;

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(BASE, { headers: syncHeaders() });
      const data = await res.json();
      if (data.success) setRecords(data.data);
    } catch {
      addNotice("Failed to load remittance records.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Open lightbox with optional list for carousel navigation
  const openLightbox = (img, list = []) => {
    const idx = list.indexOf(img);
    setLightboxList(list.length > 1 ? list : []);
    setLightboxIdx(idx >= 0 ? idx : 0);
    setLightboxImg(img);
  };

  const lightboxPrev = (e) => {
    e.stopPropagation();
    const next = (lightboxIdx - 1 + lightboxList.length) % lightboxList.length;
    setLightboxIdx(next);
    setLightboxImg(lightboxList[next]);
  };
  const lightboxNext = (e) => {
    e.stopPropagation();
    const next = (lightboxIdx + 1) % lightboxList.length;
    setLightboxIdx(next);
    setLightboxImg(lightboxList[next]);
  };

  const isCurrentMonth = navYear === MAX_YEAR && navMonth === MAX_MONTH;
  const isFuture = (month, year) =>
    year > MAX_YEAR || (year === MAX_YEAR && month > MAX_MONTH);

  const goMonth = (dir) => {
    let m = navMonth + dir;
    let y = navYear;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    if (isFuture(m, y) || y < MIN_YEAR) return;
    setNavMonth(m);
    setNavYear(y);
  };

  const handleDateJump = (month, year) => {
    if (!isFuture(month, year) && year >= MIN_YEAR) {
      setNavMonth(month);
      setNavYear(year);
    }
  };

  const handleDateChange = (val) => {
    const d = new Date(val);
    setForm((f) => ({
      ...f,
      remittanceDate: val,
      year: d.getFullYear(),
      monthNumber: d.getMonth() + 1,
      day: d.getDate(),
    }));
  };

  const handleFileChange = (e) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);

    // Read all files asynchronously and turn them into base64 strings
    const readFilesPromises = files.map((file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result); // Base64 data string
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readFilesPromises)
      .then((base64Strings) => {
        setForm((prev) => ({
          ...prev,
          // Append new Base64 strings to existing images/URLs seamlessly
          images: [...prev.images, ...base64Strings],
        }));
      })
      .catch((err) => console.error("File processing failed", err));
  };

  const removeImage = (idx) =>
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (rec) => {
    setEditTarget(rec); // Store the whole record so we can easily read rec._id
    setForm({
      amount: rec.amount,
      currency: rec.currency,
      recipient: rec.recipient,
      recipientRelation: rec.recipientRelation,
      method: rec.method,
      remittanceDate:
        rec.remittanceDate?.split("T")[0] || today.toISOString().split("T")[0],
      year: rec.year,
      monthNumber: rec.monthNumber,
      day: rec.day,
      noted: rec.noted || "",
      images: getImages(rec), // These are existing string URLs (e.g., Cloudinary/S3 paths)
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0)
      return addNotice("Enter a valid amount.", "error");
    if (!form.recipient.trim())
      return addNotice("Recipient name is required.", "error");

    setSubmitting(true);
    try {
      const amt = Number(form.amount);
      const amountUSD = +(amt / (RATES[form.currency] || 1)).toFixed(2);

      // 1. Create a FormData instance
      const formData = new FormData();

      // 2. Append text fields
      formData.append("amount", amt);
      formData.append("amountUSD", amountUSD);
      formData.append("currency", form.currency);
      formData.append("recipient", form.recipient.trim());
      formData.append("recipientRelation", form.recipientRelation);
      formData.append("method", form.method);
      formData.append("remittanceDate", form.remittanceDate);
      formData.append("year", form.year);
      formData.append("monthNumber", form.monthNumber);
      formData.append("day", form.day);
      formData.append("noted", form.noted);

      // 3. Separate raw upload files from existing string URLs
      const existingImages = [];

      form.images.forEach((img) => {
        if (img instanceof File) {
          // This is a newly uploaded local binary file
          formData.append("newImages", img);
        } else if (typeof img === "string") {
          // This is an existing image URL from a previous save
          existingImages.push(img);
        }
      });

      // Send the array of remaining old images as a stringified array field
      formData.append("existingImages", JSON.stringify(existingImages));

      // 4. Setup request configuration
      const method = editTarget ? "PUT" : "POST";
      const url = editTarget ? `${BASE}/${editTarget._id}` : BASE;

      // CRITICAL: DO NOT add 'Content-Type' header here.
      // The browser automatically sets it to multipart/form-data with boundaries.
      const headers = syncHeaders();
      delete headers["Content-Type"];

      const res = await fetch(url, {
        method,
        headers,
        body: formData, // Passing the FormData object directly
      });

      const data = await res.json();
      if (data.success) {
        addNotice(editTarget ? "Remittance updated." : "Remittance recorded.");
        setShowModal(false);
        fetchAll();
      } else {
        addNotice(data.message || "Operation failed.", "error");
      }
    } catch (error) {
      console.error(error);
      addNotice("Server error.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${BASE}/${id}`, {
        method: "DELETE",
        headers: syncHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        addNotice("Record deleted.");
        fetchAll();
      } else addNotice(data.message || "Delete failed.", "error");
    } catch {
      addNotice("Server error.", "error");
    } finally {
      setDeleteId(null);
    }
  };

  // ── Stats ──
  const totalUSD = records.reduce((s, r) => s + (r.amountUSD || 0), 0);
  const thisMonthRecords = records.filter(
    (r) =>
      r.monthNumber === today.getMonth() + 1 && r.year === today.getFullYear(),
  );
  const thisMonthUSD = thisMonthRecords.reduce(
    (s, r) => s + (r.amountUSD || 0),
    0,
  );
  const uniqueRecipients = [...new Set(records.map((r) => r.recipient))].length;

  const navFiltered = records.filter(
    (r) => r.monthNumber === navMonth && r.year === navYear,
  );
  const navMonthUSD = navFiltered.reduce((s, r) => s + (r.amountUSD || 0), 0);
  const visible =
    filterRelation === "ALL"
      ? navFiltered
      : navFiltered.filter((r) => r.recipientRelation === filterRelation);

  const recipientTotals = navFiltered.reduce((acc, r) => {
    const key = r.recipient;
    if (!acc[key])
      acc[key] = {
        name: key,
        relation: r.recipientRelation,
        total: 0,
        count: 0,
      };
    acc[key].total += r.amountUSD || 0;
    acc[key].count += 1;
    return acc;
  }, {});

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
              {MONTHS.map((name, index) => (
                <option
                  key={name}
                  value={index + 1}
                  disabled={isFuture(index + 1, navYear)}
                  className="bg-[#121212] text-white"
                >
                  {name.toUpperCase()}
                </option>
              ))}
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

      {/* ── Filter & View Switcher ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-9 space-y-2">
          <label className="text-[9px] tracking-[0.2em] text-white/25 uppercase font-medium block">
            Filter by Relation
          </label>
          <div className="flex flex-wrap gap-2">
            {["ALL", ...RELATIONS].map((rel) => (
              <button
                key={rel}
                onClick={() => setFilterRelation(rel)}
                className={`px-3 py-1.5 rounded-sm text-[10px] tracking-widest border transition-all ${
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
        </div>
        <div className="md:col-span-3 space-y-2">
          <label className="text-[9px] tracking-[0.2em] text-white/25 uppercase font-medium block md:text-right">
            Display Layout
          </label>
          <div className="flex justify-end gap-1 w-full">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-[10px] tracking-widest rounded-sm transition-all border flex-1 md:flex-initial text-center font-medium ${
                  viewMode === mode
                    ? `${VIEW_STYLE[mode]} border`
                    : "border-white/[0.06] text-white/25 hover:text-white/50"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Records Display ── */}
      {loading ? (
        <div className="py-12 border border-white/[0.06] rounded-sm text-center text-[11px] text-white/20 tracking-widest">
          LOADING RECORDS...
        </div>
      ) : visible.length === 0 ? (
        <div className="py-12 border border-white/[0.06] rounded-sm text-center text-[11px] text-white/20 tracking-widest">
          NO REMITTANCE RECORDS FOR {MONTHS[navMonth - 1].toUpperCase()}{" "}
          {navYear}
        </div>
      ) : (
        <>
          {/* ── GRID VIEW ── */}
          {viewMode === "GRID" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.map((rec) => {
                const imgs = getImages(rec);
                return (
                  <div
                    key={rec._id}
                    className="border border-white/[0.06] bg-white/[0.01] rounded-sm p-4 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/40">
                          {rec.day} {MONTHS[rec.monthNumber - 1]?.slice(0, 3)}{" "}
                          {rec.year}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-sm text-[9px] border ${RELATION_STYLE[rec.recipientRelation]}`}
                        >
                          {rec.recipientRelation}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-white/80">
                        {rec.recipient}
                      </h3>
                      <p className="text-lg font-semibold text-white">
                        {CURRENCY_SYMBOL[rec.currency]}
                        {Number(rec.amount).toLocaleString()}
                        {rec.currency !== "USD" && (
                          <span className="text-[10px] text-white/30 ml-2">
                            (${Number(rec.amountUSD).toFixed(2)})
                          </span>
                        )}
                      </p>
                      {rec.noted && (
                        <p className="text-[11px] text-white/40 line-clamp-2">
                          {rec.noted}
                        </p>
                      )}
                    </div>

                    {/* Grid images — medium thumbnails, up to 3 + overflow badge */}
                    {imgs.length > 0 && (
                      <div className="pt-1">
                        <p className="text-[8px] tracking-widest text-white/20 mb-1.5">
                          ATTACHMENTS · {imgs.length}
                        </p>
                        <ImageStrip
                          images={imgs}
                          size="md"
                          onOpen={(img) => openLightbox(img, imgs)}
                        />
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-white/[0.04]">
                      <span
                        className={`px-2 py-0.5 rounded-sm text-[9px] border ${METHOD_STYLE[rec.method]}`}
                      >
                        {rec.method}
                      </span>
                      <div className="flex gap-3">
                        <button
                          onClick={() => openEdit(rec)}
                          className="text-[10px] text-white/30 hover:text-white/70 transition-colors"
                        >
                          EDIT
                        </button>
                        <button
                          onClick={() => setDeleteId(rec._id)}
                          className="text-[10px] text-red-500/40 hover:text-red-400 transition-colors"
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

          {/* ── TABLE VIEW ── */}
          {viewMode === "TABLE" && (
            <div className="border border-white/[0.06] rounded-sm overflow-hidden">
              <div className="grid grid-cols-[0.8fr_1.2fr_1.2fr_1fr_1fr_1fr_auto] text-[9px] tracking-[0.18em] text-white/20 border-b border-white/[0.06] px-4 py-2 bg-white/[0.02]">
                <span>DATE</span>
                <span>RECIPIENT</span>
                <span>AMOUNT</span>
                <span>USD VALUE</span>
                <span>METHOD</span>
                <span>ATTACHMENTS</span>
                <span className="text-right">ACTIONS</span>
              </div>
              {visible.map((rec, i) => {
                const imgs = getImages(rec);
                return (
                  <div
                    key={rec._id}
                    className={`grid grid-cols-[0.8fr_1.2fr_1.2fr_1fr_1fr_1fr_auto] items-center px-4 py-3 text-[11px] border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}
                  >
                    <span className="text-white/50">
                      {rec.day} {MONTHS[rec.monthNumber - 1]?.slice(0, 3)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded-sm text-[8px] border ${RELATION_STYLE[rec.recipientRelation]}`}
                      >
                        {rec.recipientRelation?.slice(0, 3).toUpperCase()}
                      </span>
                      <span className="text-white/70 font-medium">
                        {rec.recipient}
                      </span>
                    </div>
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
                        className={`px-2 py-0.5 rounded-sm text-[9px] border ${METHOD_STYLE[rec.method]}`}
                      >
                        {rec.method}
                      </span>
                    </span>

                    {/* Table images — small thumbnails, max 3 + badge */}
                    <div>
                      {imgs.length > 0 ? (
                        <ImageStrip
                          images={imgs}
                          size="sm"
                          onOpen={(img) => openLightbox(img, imgs)}
                        />
                      ) : (
                        <span className="text-[9px] text-white/15">—</span>
                      )}
                    </div>

                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => openEdit(rec)}
                        className="text-[9px] text-white/30 hover:text-white/70"
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => setDeleteId(rec._id)}
                        className="text-[9px] text-red-500/40 hover:text-red-400"
                      >
                        DEL
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── LIST VIEW ── */}
          {viewMode === "LIST" && (
            <div className="space-y-2">
              {visible.map((rec) => {
                const imgs = getImages(rec);
                return (
                  <div
                    key={rec._id}
                    className="border border-white/[0.04] bg-white/[0.01] rounded-sm p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[45px]">
                        <p className="text-xs font-semibold text-white/70">
                          {rec.day}
                        </p>
                        <p className="text-[9px] text-white/30 uppercase">
                          {MONTHS[rec.monthNumber - 1]?.slice(0, 3)}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white/80 font-medium">
                            {rec.recipient}
                          </span>
                          <span
                            className={`text-[8px] px-1 border rounded-sm ${RELATION_STYLE[rec.recipientRelation]}`}
                          >
                            {rec.recipientRelation}
                          </span>
                        </div>
                        {rec.noted && (
                          <p className="text-[11px] text-white/30 mt-0.5">
                            {rec.noted}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 justify-between sm:justify-end">
                      {/* List images — small, up to 3 + badge */}
                      <div className="min-w-0">
                        {imgs.length > 0 ? (
                          <ImageStrip
                            images={imgs}
                            size="sm"
                            onOpen={(img) => openLightbox(img, imgs)}
                          />
                        ) : null}
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-semibold text-white">
                          {CURRENCY_SYMBOL[rec.currency]}
                          {Number(rec.amount).toLocaleString()} {rec.currency}
                        </p>
                        <p className="text-[10px] text-white/30">
                          ${Number(rec.amountUSD).toFixed(2)} via {rec.method}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(rec)}
                          className="p-1 text-[10px] text-white/30 hover:text-white/70"
                        >
                          EDIT
                        </button>
                        <button
                          onClick={() => setDeleteId(rec._id)}
                          className="p-1 text-[10px] text-red-500/40 hover:text-red-400"
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

      {/* ── MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-sm w-full max-w-lg mx-4 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
                {editTarget ? "Edit Remittance" : "New Remittance"}
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
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  placeholder="0.00"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 placeholder-white/20 focus:outline-none"
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
                  className="w-full bg-[#0c0c0c] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 focus:outline-none"
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
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 placeholder-white/20 focus:outline-none"
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
              <label className="text-[9px] tracking-widests text-white/25">
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
              <label className="text-[9px] tracking-widests text-white/25">
                REMITTANCE DATE
              </label>
              <input
                type="date"
                value={form.remittanceDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-sm px-3 py-2 text-[12px] text-white/80 focus:outline-none"
              />
            </div>

            {/* ── Image upload section ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[9px] tracking-widests text-white/25">
                  ATTACH RECEIPTS / IMAGES
                </label>
                {form.images.length > 0 && (
                  <span className="text-[9px] text-white/20">
                    {form.images.length} file
                    {form.images.length !== 1 ? "s" : ""} attached
                  </span>
                )}
              </div>

              {/* Drag-target style file input */}
              <label className="flex flex-col items-center justify-center w-full h-16 border border-dashed border-white/[0.1] rounded-sm bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/20 transition-all cursor-pointer group">
                <span className="text-[9px] tracking-widest text-white/25 group-hover:text-white/40 transition-colors">
                  ＋ CLICK TO ADD IMAGES
                </span>
                <span className="text-[8px] text-white/15 mt-0.5">
                  multiple files allowed
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {/* Image grid with hover-remove */}
              <ModalImageGrid
                images={form.images}
                onRemove={removeImage}
                onOpen={(img) => openLightbox(img, form.images)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] tracking-widests text-white/25">
                NOTES
              </label>
              <textarea
                value={form.noted}
                onChange={(e) =>
                  setForm((f) => ({ ...f, noted: e.target.value }))
                }
                rows={2}
                placeholder="Optional note..."
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

      {/* ── Image Lightbox with carousel ── */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          {/* Prev */}
          {lightboxList.length > 1 && (
            <button
              onClick={lightboxPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/[0.06] border border-white/10 rounded-sm text-white/50 hover:text-white/90 hover:bg-white/[0.12] transition-all cursor-pointer z-10"
              aria-label="Previous image"
            >
              ‹
            </button>
          )}

          <div
            className="w-full h-full max-w-5xl max-h-[82vh] bg-contain bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${lightboxImg})` }}
          />

          {/* Next */}
          {lightboxList.length > 1 && (
            <button
              onClick={lightboxNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/[0.06] border border-white/10 rounded-sm text-white/50 hover:text-white/90 hover:bg-white/[0.12] transition-all cursor-pointer z-10"
              aria-label="Next image"
            >
              ›
            </button>
          )}

          {/* Counter */}
          {lightboxList.length > 1 && (
            <p className="absolute top-4 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.3em] text-white/30 bg-black/40 px-3 py-1 rounded-sm">
              {lightboxIdx + 1} / {lightboxList.length}
            </p>
          )}

          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.3em] text-white/30 uppercase whitespace-nowrap">
            Click anywhere to close
          </p>
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
                className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-sm text-[10px] tracking-widest text-red-400"
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
