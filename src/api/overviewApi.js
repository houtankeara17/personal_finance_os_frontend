const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function apiFetch(path) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export function extract(res) {
  if (res.status !== "fulfilled") return [];
  const v = res.value;
  if (Array.isArray(v)) return v;
  for (const key of [
    "data",
    "salaries",
    "savings",
    "bonuses",
    "expenses",
    "exchangelogs",
    "exchangelog",
    "remittances",
    "plans",
    "notes",
    "items",
    "results",
  ]) {
    if (Array.isArray(v?.[key])) return v[key];
  }
  return [];
}

export function extractUser(res) {
  if (!res || res.status !== "fulfilled") return null;
  const v = res.value;
  return (
    v?.user ??
    v?.data?.user ??
    v?.data ??
    (v?.name || v?.email ? v : null) ??
    null
  );
}

// ── Plain formatter (no conversion) ─────────────────────────────────────────
// Used as a fallback or when you already have a converted value.
export function fmt(val, currency = "USD") {
  if (val == null || isNaN(Number(val))) {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: currency === "KHR" || currency === "JPY" ? 0 : 2,
      }).format(0);
    } catch {
      return "0.00";
    }
  }
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "KHR" || currency === "JPY" ? 0 : 2,
    }).format(val);
  } catch {
    return `${currency} ${Number(val).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  }
}

export function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function sum(arr = [], key = "amount") {
  return arr.reduce((acc, item) => acc + (parseFloat(item?.[key]) || 0), 0);
}

export function spark(arr, key = "amount") {
  const vals = arr.slice(-7).map((i) => parseFloat(i?.[key]) || 0);
  if (vals.length === 0) return [0, 0, 0, 0, 0, 0, 0];
  if (vals.length === 1) return [...vals, ...Array(6).fill(vals[0])];
  return vals;
}
