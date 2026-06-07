import React, { useState, useEffect, useCallback } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── API HELPER ───────────────────────────────────────────────────────────────
async function apiFetch(path) {
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

// ─── FORMAT HELPERS ───────────────────────────────────────────────────────────
function fmt(val, currency = "USD") {
  if (val == null || isNaN(Number(val))) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    val,
  );
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function sum(arr = [], key = "amount") {
  return arr.reduce((acc, item) => acc + (parseFloat(item?.[key]) || 0), 0);
}

function spark(arr, key = "amount") {
  const vals = arr.slice(-7).map((i) => parseFloat(i?.[key]) || 0);
  return vals.length ? vals : [0, 0, 0, 0, 0, 0, 0];
}

// ─── Safely extract array from any API shape ─────────────────────────────────
function extract(res) {
  if (res.status !== "fulfilled") return [];
  const v = res.value;
  if (Array.isArray(v)) return v;
  // Try all common keys
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

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ values = [], color = "#22c55e" }) {
  const v = values.length ? values : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(...v),
    min = Math.min(...v);
  const h = 24,
    w = 64;
  const pts = v.map((val, i) => {
    const x = (i / (v.length - 1)) * w;
    const y = h - ((val - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  });
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      style={{ opacity: 0.65 }}
    >
      <polyline
        points={pts.join(" ")}
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// ─── POPUP MODAL ─────────────────────────────────────────────────────────────
function Modal({ config, onClose }) {
  const [tab, setTab] = useState(0);
  if (!config) return null;

  const { title, icon, color, items, columns, summaryRows, emptyMsg } = config;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        .modal-scroll::-webkit-scrollbar { width: 4px; }
        .modal-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
        .modal-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .tab-btn { background:none; border:none; cursor:pointer; font-family:'DM Mono',monospace; font-size:11px; padding:6px 14px; border-radius:7px; transition:all 0.15s; }
        .tab-btn.active { background:rgba(255,255,255,0.08); color:#fff; }
        .tab-btn:not(.active) { color:rgba(255,255,255,0.35); }
        .tab-btn:not(.active):hover { color:rgba(255,255,255,0.6); }
        .item-row { display:grid; gap:10px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.05); font-size:12px; align-items:center; }
        .item-row:last-child { border:none; }
        .cell { color:rgba(255,255,255,0.75); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .cell.mono { font-family:'DM Mono',monospace; font-size:11px; }
        .cell.accent { font-weight:600; }
        .col-head { font-size:10px; color:rgba(255,255,255,0.3); font-family:'DM Mono',monospace; text-transform:uppercase; letter-spacing:0.06em; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.06); margin-bottom:4px; display:grid; gap:10px; align-items:center; }
      `}</style>

      <div
        style={{
          background: "#0f0f0f",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          width: 560,
          maxWidth: "95vw",
          maxHeight: "82vh",
          display: "flex",
          flexDirection: "column",
          animation: "slideUp 0.25s ease",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: `${color}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                {icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#fff",
                    fontFamily: "'Sora',sans-serif",
                  }}
                >
                  {title}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.3)",
                    fontFamily: "'DM Mono',monospace",
                    marginTop: 2,
                  }}
                >
                  {items.length} record{items.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "none",
                color: "rgba(255,255,255,0.5)",
                width: 30,
                height: 30,
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>

          {/* Summary pills */}
          {summaryRows?.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 14,
              }}
            >
              {summaryRows.map((s) => (
                <div
                  key={s.label}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 20,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: "rgba(255,255,255,0.35)",
                      fontFamily: "'DM Mono',monospace",
                      marginRight: 6,
                    }}
                  >
                    {s.label}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color,
                      fontWeight: 600,
                      fontFamily: "'Sora',sans-serif",
                    }}
                  >
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          {items.length > 0 && (
            <div style={{ display: "flex", gap: 4, marginTop: 14 }}>
              <button
                className={`tab-btn ${tab === 0 ? "active" : ""}`}
                onClick={() => setTab(0)}
              >
                All records
              </button>
              <button
                className={`tab-btn ${tab === 1 ? "active" : ""}`}
                onClick={() => setTab(1)}
              >
                Recent 5
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div
          className="modal-scroll"
          style={{ overflowY: "auto", padding: "0 24px 20px", flex: 1 }}
        >
          {items.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                color: "rgba(255,255,255,0.25)",
                fontFamily: "'DM Mono',monospace",
                fontSize: 12,
              }}
            >
              {emptyMsg || "No records yet."}
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div
                className="col-head"
                style={{
                  gridTemplateColumns: columns
                    .map((c) => c.width || "1fr")
                    .join(" "),
                  marginTop: 16,
                }}
              >
                {columns.map((c) => (
                  <span key={c.key}>{c.label}</span>
                ))}
              </div>

              {/* Rows */}
              {(tab === 1 ? [...items].reverse().slice(0, 5) : items).map(
                (item, idx) => (
                  <div
                    key={item._id || idx}
                    className="item-row"
                    style={{
                      gridTemplateColumns: columns
                        .map((c) => c.width || "1fr")
                        .join(" "),
                    }}
                  >
                    {columns.map((c) => (
                      <span
                        key={c.key}
                        className={`cell ${c.mono ? "mono" : ""} ${c.accent ? "accent" : ""}`}
                        style={c.accent ? { color } : {}}
                      >
                        {c.render ? c.render(item) : (item[c.key] ?? "—")}
                      </span>
                    ))}
                  </div>
                ),
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  sparkData,
  accent = "#22c55e",
  icon,
  loading,
  onClick,
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 13,
        border: `1px solid ${hov ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)"}`,
        padding: "14px 16px",
        background: hov ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.025)",
        cursor: "pointer",
        transition: "all 0.2s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: `${accent}20`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
          fontSize: 14,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.38)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontFamily: "'DM Mono',monospace",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: loading ? "rgba(255,255,255,0.15)" : "#fff",
          letterSpacing: "-0.02em",
          lineHeight: 1,
          margin: "8px 0 4px",
          transition: "color 0.3s",
          fontFamily: "'Sora',sans-serif",
        }}
      >
        {loading ? "···" : value}
      </div>
      <div
        style={{
          fontSize: 10,
          fontFamily: "'DM Mono',monospace",
          color: "rgba(255,255,255,0.3)",
        }}
      >
        {loading ? "loading..." : sub}
      </div>
      <div style={{ position: "absolute", bottom: 8, right: 10 }}>
        <Sparkline values={sparkData} color={accent} />
      </div>
      {hov && (
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 16,
            fontSize: 9,
            color: accent,
            fontFamily: "'DM Mono',monospace",
            letterSpacing: "0.06em",
          }}
        >
          CLICK TO VIEW ›
        </div>
      )}
    </div>
  );
}

// ─── Module Card ──────────────────────────────────────────────────────────────
function ModCard({ title, sub, color, icon, badge, loading, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 13,
        border: `1px solid ${hov ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.07)"}`,
        padding: 16,
        background: hov ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
        cursor: "pointer",
        transition: "all 0.2s",
        transform: hov ? "translateY(-2px)" : "none",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: `${color}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 17,
          }}
        >
          {icon}
        </div>
        <span
          style={{
            fontSize: 10,
            fontFamily: "'DM Mono',monospace",
            padding: "2px 8px",
            borderRadius: 20,
            background: `${color}20`,
            color,
          }}
        >
          {loading ? "···" : badge}
        </span>
      </div>
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            fontFamily: "'Sora',sans-serif",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.32)",
            fontFamily: "'DM Mono',monospace",
          }}
        >
          {sub}
        </div>
      </div>
    </div>
  );
}

// ─── Profile Row ──────────────────────────────────────────────────────────────
function ProfileRow({ label, value, accent, mono }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <span
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.35)",
          fontFamily: "'DM Mono',monospace",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: mono ? 10 : 12,
          fontFamily: mono ? "'DM Mono',monospace" : "'Sora',sans-serif",
          color:
            accent ||
            (mono ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.8)"),
          fontWeight: mono ? 400 : 500,
          maxWidth: 180,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value || "—"}
      </span>
    </div>
  );
}

// ─── Quick Btn ────────────────────────────────────────────────────────────────
function QuickBtn({ label, sub, color, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "9px 12px",
        borderRadius: 9,
        background: hov ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hov ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"}`,
        cursor: "pointer",
        transition: "all 0.15s",
        width: "100%",
        marginBottom: 6,
        textAlign: "left",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 5px ${color}88`,
            flexShrink: 0,
          }}
        />
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#fff",
              fontFamily: "'Sora',sans-serif",
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.3)",
              fontFamily: "'DM Mono',monospace",
            }}
          >
            {sub}
          </div>
        </div>
      </div>
      <span style={{ fontSize: 16, color: "rgba(255,255,255,0.2)" }}>›</span>
    </button>
  );
}

// ─── MODAL CONFIGS per module ─────────────────────────────────────────────────
function buildModalConfig(key, data, currency) {
  const c = currency || "USD";
  switch (key) {
    case "salary":
      return {
        title: "Salary",
        icon: "💼",
        color: "#22c55e",
        emptyMsg: "No salary entries yet.",
        summaryRows: [
          { label: "TOTAL", value: fmt(sum(data, "amount"), c) },
          { label: "ENTRIES", value: String(data.length) },
        ],
        columns: [
          { key: "title", label: "Title", width: "2fr" },
          {
            key: "amount",
            label: "Amount",
            width: "1fr",
            accent: true,
            render: (r) => fmt(r.amount, c),
          },
          {
            key: "date",
            label: "Date",
            width: "1fr",
            mono: true,
            render: (r) => fmtDate(r.date || r.createdAt),
          },
          {
            key: "description",
            label: "Note",
            width: "2fr",
            render: (r) => r.description || r.note || "—",
          },
        ],
        items: data,
      };

    case "savings":
      return {
        title: "Savings",
        icon: "🐖",
        color: "#38bdf8",
        emptyMsg: "No savings records yet.",
        summaryRows: [
          { label: "TOTAL SAVED", value: fmt(sum(data, "amount"), c) },
          { label: "RECORDS", value: String(data.length) },
        ],
        columns: [
          { key: "title", label: "Title", width: "2fr" },
          {
            key: "amount",
            label: "Amount",
            width: "1fr",
            accent: true,
            render: (r) => fmt(r.amount, c),
          },
          {
            key: "goal",
            label: "Goal",
            width: "1fr",
            render: (r) => (r.goal ? fmt(r.goal, c) : "—"),
          },
          {
            key: "date",
            label: "Date",
            width: "1fr",
            mono: true,
            render: (r) => fmtDate(r.date || r.createdAt),
          },
        ],
        items: data,
      };

    case "bonus":
      return {
        title: "Bonuses",
        icon: "⭐",
        color: "#facc15",
        emptyMsg: "No bonuses recorded yet.",
        summaryRows: [
          { label: "TOTAL", value: fmt(sum(data, "amount"), c) },
          { label: "COUNT", value: String(data.length) },
        ],
        columns: [
          { key: "title", label: "Title", width: "2fr" },
          {
            key: "amount",
            label: "Amount",
            width: "1fr",
            accent: true,
            render: (r) => fmt(r.amount, c),
          },
          {
            key: "type",
            label: "Type",
            width: "1fr",
            render: (r) => r.type || "—",
          },
          {
            key: "date",
            label: "Date",
            width: "1fr",
            mono: true,
            render: (r) => fmtDate(r.date || r.createdAt),
          },
        ],
        items: data,
      };

    case "expense":
      return {
        title: "Expenses",
        icon: "🧾",
        color: "#fb923c",
        emptyMsg: "No expenses logged yet.",
        summaryRows: [
          { label: "TOTAL SPENT", value: fmt(sum(data, "amount"), c) },
          { label: "ITEMS", value: String(data.length) },
        ],
        columns: [
          { key: "title", label: "Title", width: "2fr" },
          {
            key: "amount",
            label: "Amount",
            width: "1fr",
            accent: true,
            render: (r) => fmt(r.amount, c),
          },
          {
            key: "category",
            label: "Category",
            width: "1fr",
            render: (r) => r.category || "—",
          },
          {
            key: "date",
            label: "Date",
            width: "1fr",
            mono: true,
            render: (r) => fmtDate(r.date || r.createdAt),
          },
        ],
        items: data,
      };

    case "exchangelog":
      return {
        title: "Exchange Log",
        icon: "💱",
        color: "#a78bfa",
        emptyMsg: "No currency exchanges logged.",
        summaryRows: [{ label: "TOTAL LOGS", value: String(data.length) }],
        columns: [
          {
            key: "fromCurrency",
            label: "From",
            width: "1fr",
            render: (r) => r.fromCurrency || r.from || "—",
          },
          {
            key: "toCurrency",
            label: "To",
            width: "1fr",
            render: (r) => r.toCurrency || r.to || "—",
          },
          {
            key: "amount",
            label: "Amount",
            width: "1fr",
            accent: true,
            render: (r) => fmt(r.amount, r.fromCurrency || c),
          },
          {
            key: "rate",
            label: "Rate",
            width: "1fr",
            mono: true,
            render: (r) => (r.rate ? Number(r.rate).toFixed(4) : "—"),
          },
          {
            key: "date",
            label: "Date",
            width: "1fr",
            mono: true,
            render: (r) => fmtDate(r.date || r.createdAt),
          },
        ],
        items: data,
      };

    case "remittance":
      return {
        title: "Remittance",
        icon: "✈️",
        color: "#38bdf8",
        emptyMsg: "No remittances sent.",
        summaryRows: [
          { label: "TOTAL SENT", value: fmt(sum(data, "amount"), c) },
          { label: "COUNT", value: String(data.length) },
        ],
        columns: [
          {
            key: "recipient",
            label: "Recipient",
            width: "2fr",
            render: (r) => r.recipient || r.name || "—",
          },
          {
            key: "amount",
            label: "Amount",
            width: "1fr",
            accent: true,
            render: (r) => fmt(r.amount, c),
          },
          {
            key: "country",
            label: "Country",
            width: "1fr",
            render: (r) => r.country || "—",
          },
          {
            key: "status",
            label: "Status",
            width: "1fr",
            render: (r) => r.status || "—",
          },
          {
            key: "date",
            label: "Date",
            width: "1fr",
            mono: true,
            render: (r) => fmtDate(r.date || r.createdAt),
          },
        ],
        items: data,
      };

    case "plans":
      return {
        title: "Financial Plans",
        icon: "🎯",
        color: "#22c55e",
        emptyMsg: "No plans created yet.",
        summaryRows: [
          { label: "TOTAL PLANS", value: String(data.length) },
          {
            label: "ACTIVE",
            value: String(
              data.filter((p) => p.status === "active" || !p.status).length,
            ),
          },
        ],
        columns: [
          { key: "title", label: "Plan", width: "2fr" },
          {
            key: "target",
            label: "Target",
            width: "1fr",
            accent: true,
            render: (r) => (r.target ? fmt(r.target, c) : "—"),
          },
          {
            key: "progress",
            label: "Progress",
            width: "1fr",
            render: (r) => (r.progress != null ? `${r.progress}%` : "—"),
          },
          {
            key: "status",
            label: "Status",
            width: "1fr",
            render: (r) => r.status || "Active",
          },
          {
            key: "deadline",
            label: "Due",
            width: "1fr",
            mono: true,
            render: (r) => fmtDate(r.deadline || r.dueDate),
          },
        ],
        items: data,
      };

    case "notes":
      return {
        title: "Notes",
        icon: "📓",
        color: "#fb923c",
        emptyMsg: "Your notebook is empty.",
        summaryRows: [
          { label: "TOTAL NOTES", value: String(data.length) },
          {
            label: "PINNED",
            value: String(data.filter((n) => n.pinned).length),
          },
        ],
        columns: [
          { key: "title", label: "Title", width: "2fr" },
          {
            key: "content",
            label: "Preview",
            width: "3fr",
            render: (r) =>
              (r.content || r.body || "").slice(0, 60) +
              ((r.content || r.body || "").length > 60 ? "…" : ""),
          },
          {
            key: "pinned",
            label: "Pinned",
            width: "1fr",
            render: (r) => (r.pinned ? "📌" : "—"),
          },
          {
            key: "createdAt",
            label: "Date",
            width: "1fr",
            mono: true,
            render: (r) => fmtDate(r.createdAt),
          },
        ],
        items: data,
      };

    default:
      return null;
  }
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Overview() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [modal, setModal] = useState(null); // { key, config }
  const [data, setData] = useState({
    salaries: [],
    savings: [],
    bonuses: [],
    expenses: [],
    exchangelogs: [],
    remittances: [],
    plans: [],
    notes: [],
  });

  // ── Fetch all ──
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [salR, savR, bonR, expR, exlR, remR, plnR, notR, dashR] =
        await Promise.allSettled([
          apiFetch("/salaries"),
          apiFetch("/savings"),
          apiFetch("/bonuses"),
          apiFetch("/expenses"),
          apiFetch("/exchangelog"),
          apiFetch("/remittances"),
          apiFetch("/plans"),
          apiFetch("/notes"),
          apiFetch("/dashboard"),
        ]);

      setData({
        salaries: extract(salR),
        savings: extract(savR),
        bonuses: extract(bonR),
        expenses: extract(expR),
        exchangelogs: extract(exlR),
        remittances: extract(remR),
        plans: extract(plnR),
        notes: extract(notR),
      });

      if (dashR.status === "fulfilled") {
        const v = dashR.value;
        setUser(v?.user ?? v?.data?.user ?? null);
      }
    } catch (err) {
      console.error("Overview fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Open modal ──
  const openModal = (key) => {
    const dataMap = {
      salary: data.salaries,
      savings: data.savings,
      bonus: data.bonuses,
      expense: data.expenses,
      exchangelog: data.exchangelogs,
      remittance: data.remittances,
      plans: data.plans,
      notes: data.notes,
    };
    const config = buildModalConfig(key, dataMap[key] || [], user?.currency);
    setModal({ key, config });
  };

  const closeModal = () => setModal(null);

  const handleSync = async () => {
    setSyncing(true);
    await fetchAll();
    setSyncing(false);
  };

  // ── Derived ──
  const cur = user?.currency || "USD";
  const totalSalary = sum(data.salaries, "amount");
  const totalSavings = sum(data.savings, "amount");
  const totalBonus = sum(data.bonuses, "amount");
  const totalExp = sum(data.expenses, "amount");
  const savRate =
    totalSalary > 0 ? ((totalSavings / totalSalary) * 100).toFixed(1) : "0";
  const now = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        @keyframes fsu { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .fsu   { animation: fsu 0.45s ease both; }
        .fsu-1 { animation-delay:.04s }
        .fsu-2 { animation-delay:.10s }
        .fsu-3 { animation-delay:.18s }
        .fsu-4 { animation-delay:.26s }
        .fsu-5 { animation-delay:.34s }
      `}</style>

      <div style={{ fontFamily: "'Sora', sans-serif", width: "100%" }}>
        {/* ── Header ── */}
        <div
          className="fsu fsu-1"
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.3)",
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                fontFamily: "'DM Mono',monospace",
                marginBottom: 5,
              }}
            >
              Finance OS · Overview
            </div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
              }}
            >
              Welcome back,{" "}
              <span style={{ color: "#22c55e" }}>
                {user?.name?.split(" ")[0] || "Operator"}
              </span>
            </h1>
            <p
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.32)",
                marginTop: 5,
              }}
            >
              Click any card to view your records.
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 9,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
              color: "rgba(255,255,255,0.55)",
              fontSize: 11,
              fontFamily: "'DM Mono',monospace",
              cursor: syncing ? "not-allowed" : "pointer",
              opacity: syncing ? 0.6 : 1,
            }}
          >
            {syncing ? "⟳ Syncing..." : "⟳ Sync"}
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontFamily: "'DM Mono',monospace",
            marginBottom: 10,
          }}
        >
          Financial Summary
        </div>
        <div
          className="fsu fsu-2"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <StatCard
            label="Total Salary"
            icon="💼"
            accent="#22c55e"
            loading={loading}
            value={fmt(totalSalary, cur)}
            sub={`${data.salaries.length} entries`}
            sparkData={spark(data.salaries)}
            onClick={() => openModal("salary")}
          />
          <StatCard
            label="Savings"
            icon="🐖"
            accent="#38bdf8"
            loading={loading}
            value={fmt(totalSavings, cur)}
            sub={`${savRate}% of salary`}
            sparkData={spark(data.savings)}
            onClick={() => openModal("savings")}
          />
          <StatCard
            label="Bonus"
            icon="⭐"
            accent="#facc15"
            loading={loading}
            value={fmt(totalBonus, cur)}
            sub={`${data.bonuses.length} bonuses`}
            sparkData={spark(data.bonuses)}
            onClick={() => openModal("bonus")}
          />
          <StatCard
            label="Expenses"
            icon="🧾"
            accent="#fb923c"
            loading={loading}
            value={fmt(totalExp, cur)}
            sub={`${data.expenses.length} items logged`}
            sparkData={spark(data.expenses)}
            onClick={() => openModal("expense")}
          />
        </div>

        {/* ── Module Cards ── */}
        <div
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontFamily: "'DM Mono',monospace",
            marginBottom: 10,
            marginTop: 6,
          }}
        >
          Modules
        </div>
        <div
          className="fsu fsu-3"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <ModCard
            title="Exchange Log"
            sub="Currency conversions & rates"
            icon="💱"
            color="#a78bfa"
            loading={loading}
            badge={`${data.exchangelogs.length} logs`}
            onClick={() => openModal("exchangelog")}
          />
          <ModCard
            title="Remittance"
            sub="Money transfers & wire history"
            icon="✈️"
            color="#38bdf8"
            loading={loading}
            badge={`${data.remittances.length} sent`}
            onClick={() => openModal("remittance")}
          />
          <ModCard
            title="Plans"
            sub="Financial goals & milestones"
            icon="🎯"
            color="#22c55e"
            loading={loading}
            badge={`${data.plans.length} plans`}
            onClick={() => openModal("plans")}
          />
          <ModCard
            title="Notes"
            sub="Financial journal & memos"
            icon="📓"
            color="#fb923c"
            loading={loading}
            badge={`${data.notes.length} notes`}
            onClick={() => openModal("notes")}
          />
        </div>

        {/* ── Bottom Row ── */}
        <div
          className="fsu fsu-4"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 12,
          }}
        >
          {/* Profile */}
          <div
            style={{
              borderRadius: 13,
              border: "1px solid rgba(255,255,255,0.07)",
              padding: 16,
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.3)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontFamily: "'DM Mono',monospace",
                marginBottom: 12,
              }}
            >
              Account
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                paddingBottom: 12,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#22c55e22,#22c55e44)",
                  color: "#22c55e",
                  border: "1px solid #22c55e33",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
                  {user?.name || "Your Name"}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.3)",
                    fontFamily: "'DM Mono',monospace",
                  }}
                >
                  Personal Account
                </div>
              </div>
            </div>
            <ProfileRow label="Email" value={user?.email} />
            <ProfileRow
              label="Currency"
              value={user?.currency || "USD"}
              accent="#22c55e"
            />
            <ProfileRow label="Theme" value={user?.theme || "Obsidian"} />
            <ProfileRow label="User ID" value={user?._id} mono />
          </div>

          {/* Quick Actions — all open popups */}
          <div
            style={{
              borderRadius: 13,
              border: "1px solid rgba(255,255,255,0.07)",
              padding: 16,
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.3)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontFamily: "'DM Mono',monospace",
                marginBottom: 12,
              }}
            >
              Quick View
            </div>
            <QuickBtn
              label="Salary Records"
              sub={`${data.salaries.length} entries`}
              color="#22c55e"
              onClick={() => openModal("salary")}
            />
            <QuickBtn
              label="Expense Records"
              sub={`${data.expenses.length} items`}
              color="#fb923c"
              onClick={() => openModal("expense")}
            />
            <QuickBtn
              label="Remittances"
              sub={`${data.remittances.length} transfers`}
              color="#38bdf8"
              onClick={() => openModal("remittance")}
            />
            <QuickBtn
              label="Plans"
              sub={`${data.plans.length} goals`}
              color="#a78bfa"
              onClick={() => openModal("plans")}
            />
            <QuickBtn
              label="Exchange Log"
              sub={`${data.exchangelogs.length} conversions`}
              color="#facc15"
              onClick={() => openModal("exchangelog")}
            />
            <QuickBtn
              label="Notes"
              sub={`${data.notes.length} notes`}
              color="#fb923c"
              onClick={() => openModal("notes")}
            />
          </div>
        </div>

        {/* ── Session Bar ── */}
        <div
          className="fsu fsu-5"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.012)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#22c55e",
              boxShadow: "0 0 4px #22c55e",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.28)",
              fontFamily: "'DM Mono',monospace",
            }}
          >
            Session active · JWT authenticated · {now}
          </span>
          <span
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.22)",
              fontFamily: "'DM Mono',monospace",
              marginLeft: "auto",
            }}
          >
            LIVE
          </span>
        </div>
      </div>

      {/* ── Modal Popup ── */}
      {modal && <Modal config={modal.config} onClose={closeModal} />}
    </>
  );
}
