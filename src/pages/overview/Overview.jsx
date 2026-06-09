import React, { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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

function extract(res) {
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

function Sparkline({ values = [], color = "#22c55e" }) {
  const v = values.length ? values : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(...v),
    min = Math.min(...v);
  const h = 28,
    w = 72;
  const pts = v.map((val, i) => {
    const x = (i / (v.length - 1)) * w;
    const y = h - ((val - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <defs>
        <linearGradient
          id={`sg-${color.replace("#", "")}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${h} ${pts.join(" ")} ${w},${h}`}
        fill={`url(#sg-${color.replace("#", "")})`}
      />
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
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(8px)",
        animation: "fadeIn 0.18s ease",
      }}
    >
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        .ms::-webkit-scrollbar{width:3px}
        .ms::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:4px}
        .tb{background:none;border:none;cursor:pointer;font-family:'DM Mono',monospace;font-size:10px;padding:5px 12px;border-radius:6px;transition:all 0.15s;letter-spacing:0.05em}
        .tb.on{background:rgba(255,255,255,0.09);color:#fff}
        .tb:not(.on){color:rgba(255,255,255,0.3)}
        .tb:not(.on):hover{color:rgba(255,255,255,0.6)}
        .ir{display:grid;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:11px;align-items:center;font-family:'DM Mono',monospace}
        .ir:last-child{border:none}
        .ch{font-size:9px;color:rgba(255,255,255,0.25);font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:0.08em;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.05);margin-bottom:2px;display:grid;gap:10px}
      `}</style>
      <div
        style={{
          background: "rgba(10,10,10,0.97)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 18,
          width: 580,
          maxWidth: "94vw",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          animation: "slideUp 0.22s ease",
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 22px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
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
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: `${color}18`,
                  border: `1px solid ${color}28`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 17,
                }}
              >
                {icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#fff",
                    fontFamily: "'DM Mono',monospace",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {title}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.28)",
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
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.4)",
                width: 28,
                height: 28,
                borderRadius: 7,
                cursor: "pointer",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'DM Mono',monospace",
              }}
            >
              ✕
            </button>
          </div>
          {summaryRows?.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 12,
              }}
            >
              {summaryRows.map((s) => (
                <div
                  key={s.label}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      color: "rgba(255,255,255,0.3)",
                      fontFamily: "'DM Mono',monospace",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {s.label}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color,
                      fontWeight: 600,
                      fontFamily: "'DM Mono',monospace",
                    }}
                  >
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          )}
          {items.length > 0 && (
            <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
              <button
                className={`tb ${tab === 0 ? "on" : ""}`}
                onClick={() => setTab(0)}
              >
                all
              </button>
              <button
                className={`tb ${tab === 1 ? "on" : ""}`}
                onClick={() => setTab(1)}
              >
                recent 5
              </button>
            </div>
          )}
        </div>
        {/* Body */}
        <div
          className="ms"
          style={{ overflowY: "auto", padding: "0 22px 18px", flex: 1 }}
        >
          {items.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                color: "rgba(255,255,255,0.2)",
                fontFamily: "'DM Mono',monospace",
                fontSize: 11,
              }}
            >
              {emptyMsg || "No records yet."}
            </div>
          ) : (
            <>
              <div
                className="ch"
                style={{
                  gridTemplateColumns: columns
                    .map((c) => c.width || "1fr")
                    .join(" "),
                  marginTop: 14,
                }}
              >
                {columns.map((c) => (
                  <span key={c.key}>{c.label}</span>
                ))}
              </div>
              {(tab === 1 ? [...items].reverse().slice(0, 5) : items).map(
                (item, idx) => (
                  <div
                    key={item._id || idx}
                    className="ir"
                    style={{
                      gridTemplateColumns: columns
                        .map((c) => c.width || "1fr")
                        .join(" "),
                    }}
                  >
                    {columns.map((c) => (
                      <span
                        key={c.key}
                        style={{
                          color: c.accent ? color : "rgba(255,255,255,0.65)",
                          fontWeight: c.accent ? 600 : 400,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
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
        borderRadius: 14,
        cursor: "pointer",
        transition: "all 0.2s",
        border: `1px solid ${hov ? `${accent}30` : "rgba(255,255,255,0.06)"}`,
        background: hov ? `${accent}08` : "rgba(255,255,255,0.02)",
        padding: "16px 18px",
        position: "relative",
        overflow: "hidden",
        boxShadow: hov ? `0 8px 32px ${accent}15` : "none",
      }}
    >
      {/* Subtle glow blob */}
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: `${accent}10`,
          filter: "blur(20px)",
          pointerEvents: "none",
          opacity: hov ? 1 : 0.4,
          transition: "opacity 0.3s",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: `${accent}15`,
            border: `1px solid ${accent}25`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
          }}
        >
          {icon}
        </div>
        <div style={{ opacity: 0.6 }}>
          <Sparkline values={sparkData} color={accent} />
        </div>
      </div>
      <div
        style={{
          fontSize: 9,
          color: "rgba(255,255,255,0.3)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontFamily: "'DM Mono',monospace",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: loading ? "rgba(255,255,255,0.12)" : "#fff",
          letterSpacing: "-0.02em",
          lineHeight: 1,
          margin: "6px 0 4px",
          fontFamily: "'DM Mono',monospace",
          transition: "color 0.3s",
        }}
      >
        {loading ? "···" : value}
      </div>
      <div
        style={{
          fontSize: 9,
          fontFamily: "'DM Mono',monospace",
          color: "rgba(255,255,255,0.25)",
        }}
      >
        {loading ? "loading..." : sub}
      </div>
      {hov && (
        <div
          style={{
            position: "absolute",
            bottom: 9,
            right: 12,
            fontSize: 8,
            color: accent,
            fontFamily: "'DM Mono',monospace",
            letterSpacing: "0.08em",
          }}
        >
          VIEW →
        </div>
      )}
    </div>
  );
}

function ModCard({ title, sub, color, icon, badge, loading, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 14,
        cursor: "pointer",
        transition: "all 0.2s",
        border: `1px solid ${hov ? `${color}30` : "rgba(255,255,255,0.06)"}`,
        background: hov ? `${color}08` : "rgba(255,255,255,0.02)",
        padding: "14px 16px",
        boxShadow: hov ? `0 6px 24px ${color}12` : "none",
        transform: hov ? "translateY(-2px)" : "none",
        display: "flex",
        flexDirection: "column",
        gap: 12,
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
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `${color}15`,
            border: `1px solid ${color}25`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
          }}
        >
          {icon}
        </div>
        <span
          style={{
            fontSize: 9,
            fontFamily: "'DM Mono',monospace",
            letterSpacing: "0.06em",
            padding: "3px 9px",
            borderRadius: 20,
            background: `${color}15`,
            border: `1px solid ${color}25`,
            color,
          }}
        >
          {loading ? "···" : badge}
        </span>
      </div>
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#fff",
            fontFamily: "'DM Mono',monospace",
            marginBottom: 3,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.28)",
            fontFamily: "'DM Mono',monospace",
          }}
        >
          {sub}
        </div>
      </div>
    </div>
  );
}

function ProfileRow({ label, value, accent, mono }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "7px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <span
        style={{
          fontSize: 9,
          color: "rgba(255,255,255,0.28)",
          fontFamily: "'DM Mono',monospace",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 10,
          fontFamily: "'DM Mono',monospace",
          color:
            accent ||
            (mono ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.7)"),
          fontWeight: accent ? 600 : 400,
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
        padding: "8px 10px",
        borderRadius: 8,
        width: "100%",
        marginBottom: 5,
        background: hov ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.025)",
        border: `1px solid ${hov ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)"}`,
        cursor: "pointer",
        transition: "all 0.15s",
        textAlign: "left",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 6px ${color}`,
            flexShrink: 0,
          }}
        />
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "#fff",
              fontFamily: "'DM Mono',monospace",
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.28)",
              fontFamily: "'DM Mono',monospace",
            }}
          >
            {sub}
          </div>
        </div>
      </div>
      <span
        style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.18)",
          fontFamily: "'DM Mono',monospace",
        }}
      >
        ›
      </span>
    </button>
  );
}

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
            render: (r) => {
              const t = r.content || r.body || "";
              return t.slice(0, 60) + (t.length > 60 ? "…" : "");
            },
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

export default function Overview() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [modal, setModal] = useState(null);
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

  const handleSync = async () => {
    setSyncing(true);
    await fetchAll();
    setSyncing(false);
  };

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
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap');
        *{box-sizing:border-box}
        @keyframes fup{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .a1{animation:fup 0.4s ease both}
        .a2{animation:fup 0.4s 0.07s ease both}
        .a3{animation:fup 0.4s 0.14s ease both}
        .a4{animation:fup 0.4s 0.21s ease both}
        .a5{animation:fup 0.4s 0.28s ease both}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .pulse{animation:pulse 2s ease infinite}
      `}</style>

      <div
        style={{
          fontFamily: "'DM Mono',monospace",
          width: "100%",
          color: "#fff",
        }}
      >
        {/* ── Header ── */}
        <div
          className="a1"
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 28,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.25)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 6,
                fontFamily: "'DM Mono',monospace",
              }}
            >
              finance_os / overview
            </div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 500,
                color: "#fff",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                margin: 0,
                fontFamily: "'DM Mono',monospace",
              }}
            >
              gm,{" "}
              <span style={{ color: "#22c55e" }}>
                {user?.name?.split(" ")[0] || "operator"}
              </span>
            </h1>
            <p
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.25)",
                marginTop: 5,
                fontFamily: "'DM Mono',monospace",
              }}
            >
              tap any card to view records
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: syncing ? "#22c55e" : "rgba(255,255,255,0.4)",
              fontSize: 10,
              fontFamily: "'DM Mono',monospace",
              cursor: syncing ? "not-allowed" : "pointer",
              letterSpacing: "0.05em",
              transition: "all 0.2s",
            }}
          >
            <span className={syncing ? "pulse" : ""}>
              {syncing ? "◉" : "○"}
            </span>
            {syncing ? "syncing..." : "sync"}
          </button>
        </div>

        {/* ── Section label ── */}
        <div
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.22)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: 8,
            fontFamily: "'DM Mono',monospace",
          }}
        >
          // financial_summary
        </div>

        {/* ── Stat Cards ── */}
        <div
          className="a2"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <StatCard
            label="total_salary"
            icon="💼"
            accent="#22c55e"
            loading={loading}
            value={fmt(totalSalary, cur)}
            sub={`${data.salaries.length} entries`}
            sparkData={spark(data.salaries)}
            onClick={() => openModal("salary")}
          />
          <StatCard
            label="savings"
            icon="🐖"
            accent="#38bdf8"
            loading={loading}
            value={fmt(totalSavings, cur)}
            sub={`${savRate}% of salary`}
            sparkData={spark(data.savings)}
            onClick={() => openModal("savings")}
          />
          <StatCard
            label="bonus"
            icon="⭐"
            accent="#facc15"
            loading={loading}
            value={fmt(totalBonus, cur)}
            sub={`${data.bonuses.length} bonuses`}
            sparkData={spark(data.bonuses)}
            onClick={() => openModal("bonus")}
          />
          <StatCard
            label="expenses"
            icon="🧾"
            accent="#fb923c"
            loading={loading}
            value={fmt(totalExp, cur)}
            sub={`${data.expenses.length} items`}
            sparkData={spark(data.expenses)}
            onClick={() => openModal("expense")}
          />
        </div>

        {/* ── Section label ── */}
        <div
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.22)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            margin: "16px 0 8px",
            fontFamily: "'DM Mono',monospace",
          }}
        >
          // modules
        </div>

        {/* ── Module Cards ── */}
        <div
          className="a3"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <ModCard
            title="exchange_log"
            sub="currency conversions & rates"
            icon="💱"
            color="#a78bfa"
            loading={loading}
            badge={`${data.exchangelogs.length} logs`}
            onClick={() => openModal("exchangelog")}
          />
          <ModCard
            title="remittance"
            sub="transfers & wire history"
            icon="✈️"
            color="#38bdf8"
            loading={loading}
            badge={`${data.remittances.length} sent`}
            onClick={() => openModal("remittance")}
          />
          <ModCard
            title="plans"
            sub="financial goals & milestones"
            icon="🎯"
            color="#22c55e"
            loading={loading}
            badge={`${data.plans.length} plans`}
            onClick={() => openModal("plans")}
          />
          <ModCard
            title="notes"
            sub="journal & financial memos"
            icon="📓"
            color="#fb923c"
            loading={loading}
            badge={`${data.notes.length} notes`}
            onClick={() => openModal("notes")}
          />
        </div>

        {/* ── Bottom Row ── */}
        <div
          className="a4"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 10,
          }}
        >
          {/* Account */}
          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.06)",
              padding: 16,
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.22)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 14,
                fontFamily: "'DM Mono',monospace",
              }}
            >
              // account
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                paddingBottom: 12,
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(34,197,94,0.12)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#22c55e",
                  fontWeight: 600,
                  fontSize: 14,
                  fontFamily: "'DM Mono',monospace",
                }}
              >
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#fff",
                    fontFamily: "'DM Mono',monospace",
                  }}
                >
                  {user?.name || "your_name"}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,0.25)",
                    fontFamily: "'DM Mono',monospace",
                  }}
                >
                  personal account
                </div>
              </div>
            </div>
            <ProfileRow label="email" value={user?.email} />
            <ProfileRow
              label="currency"
              value={user?.currency || "USD"}
              accent="#22c55e"
            />
            <ProfileRow label="theme" value={user?.theme || "obsidian"} />
            <ProfileRow label="user_id" value={user?._id} mono />
          </div>

          {/* Quick View */}
          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.06)",
              padding: 16,
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.22)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 12,
                fontFamily: "'DM Mono',monospace",
              }}
            >
              // quick_view
            </div>
            <QuickBtn
              label="salary_records"
              sub={`${data.salaries.length} entries`}
              color="#22c55e"
              onClick={() => openModal("salary")}
            />
            <QuickBtn
              label="expense_records"
              sub={`${data.expenses.length} items`}
              color="#fb923c"
              onClick={() => openModal("expense")}
            />
            <QuickBtn
              label="remittances"
              sub={`${data.remittances.length} transfers`}
              color="#38bdf8"
              onClick={() => openModal("remittance")}
            />
            <QuickBtn
              label="plans"
              sub={`${data.plans.length} goals`}
              color="#a78bfa"
              onClick={() => openModal("plans")}
            />
            <QuickBtn
              label="exchange_log"
              sub={`${data.exchangelogs.length} conversions`}
              color="#facc15"
              onClick={() => openModal("exchangelog")}
            />
            <QuickBtn
              label="notes"
              sub={`${data.notes.length} notes`}
              color="#fb923c"
              onClick={() => openModal("notes")}
            />
          </div>
        </div>

        {/* ── Session Bar ── */}
        <div
          className="a5"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.01)",
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#22c55e",
              boxShadow: "0 0 5px #22c55e",
              flexShrink: 0,
            }}
            className="pulse"
          />
          <span
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.22)",
              fontFamily: "'DM Mono',monospace",
              letterSpacing: "0.05em",
            }}
          >
            session_active · jwt_authenticated · {now}
          </span>
          <span
            style={{
              fontSize: 8,
              color: "rgba(255,255,255,0.15)",
              fontFamily: "'DM Mono',monospace",
              marginLeft: "auto",
              letterSpacing: "0.1em",
            }}
          >
            LIVE
          </span>
        </div>
      </div>

      {modal && <Modal config={modal.config} onClose={() => setModal(null)} />}
    </>
  );
}
