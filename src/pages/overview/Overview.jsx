import React, { useState } from "react";
import { useFinanceData } from "../../hooks/useFinanceData";
import { fmt, fmtDate, sum, spark } from "../../api/overviewApi";

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ values = [], color = "#22c55e" }) {
  const v = values.length ? values : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(...v),
    min = Math.min(...v);
  const h = 26,
    w = 64;
  const pts = v.map((val, i) => {
    const x = (i / (v.length - 1)) * w;
    const y = h - ((val - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  });
  const id = `g${color.replace("#", "")}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${h} ${pts.join(" ")} ${w},${h}`}
        fill={`url(#${id})`}
      />
      <polyline
        points={pts.join(" ")}
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      <circle
        cx={pts[pts.length - 1].split(",")[0]}
        cy={pts[pts.length - 1].split(",")[1]}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ config, onClose }) {
  const [tab, setTab] = useState(0);
  if (!config) return null;
  const { title, icon, color, items, columns, summaryRows, emptyMsg } = config;
  const displayed = tab === 1 ? [...items].reverse().slice(0, 5) : items;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(6px)",
      }}
    >
      <style>{`
        .ms::-webkit-scrollbar{width:3px}
        .ms::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:4px}
        .mtab{background:none;border:none;cursor:pointer;font-family:'Liberation Mono',monospace;
          font-size:10px;padding:5px 12px;border-radius:6px;letter-spacing:0.05em;transition:all 0.15s}
        .mtab.on{background:rgba(255,255,255,0.08);color:#fff}
        .mtab:not(.on){color:rgba(255,255,255,0.3)}
        .mtab:not(.on):hover{color:rgba(255,255,255,0.6)}
        .mtr:hover td{background:rgba(255,255,255,0.025)}
      `}</style>
      <div
        style={{
          background: "#0f0f0f",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 14,
          width: 600,
          maxWidth: "94vw",
          maxHeight: "78vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 20px 14px",
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
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: `${color}15`,
                  border: `1px solid ${color}28`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                }}
              >
                {icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#fff",
                    fontFamily: "'Liberation Mono',monospace",
                  }}
                >
                  {title}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.25)",
                    marginTop: 2,
                    fontFamily: "'Liberation Mono',monospace",
                  }}
                >
                  {items.length} record{items.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.4)",
                width: 28,
                height: 28,
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>

          {summaryRows?.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 6,
                marginTop: 12,
                flexWrap: "wrap",
              }}
            >
              {summaryRows.map((s) => (
                <div
                  key={s.label}
                  style={{
                    padding: "3px 10px",
                    borderRadius: 20,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      color: "rgba(255,255,255,0.28)",
                      fontFamily: "'Liberation Mono',monospace",
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
                      fontFamily: "'Liberation Mono',monospace",
                    }}
                  >
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <div style={{ display: "flex", gap: 2, marginTop: 12 }}>
              {["all", "recent 5"].map((lbl, i) => (
                <button
                  key={i}
                  className={`mtab ${tab === i ? "on" : ""}`}
                  onClick={() => setTab(i)}
                >
                  {lbl}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="ms" style={{ overflowY: "auto", flex: 1 }}>
          {items.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                color: "rgba(255,255,255,0.18)",
                fontFamily: "'Liberation Mono',monospace",
                fontSize: 11,
              }}
            >
              {emptyMsg || "No records yet."}
            </div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontFamily: "'Liberation Mono',monospace",
              }}
            >
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      style={{
                        padding: "9px 20px",
                        textAlign: "left",
                        fontSize: 9,
                        color: "rgba(255,255,255,0.22)",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        background: "rgba(255,255,255,0.01)",
                      }}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((item, idx) => (
                  <tr
                    key={item._id || idx}
                    className="mtr"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        style={{
                          padding: "9px 20px",
                          fontSize: 11,
                          color: c.accent ? color : "rgba(255,255,255,0.6)",
                          fontWeight: c.accent ? 600 : 400,
                          maxWidth: 160,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.render ? c.render(item) : (item[c.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
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
        borderRadius: 12,
        cursor: "pointer",
        border: `1px solid ${hov ? `${accent}35` : "rgba(255,255,255,0.07)"}`,
        background: hov ? `${accent}0a` : "rgba(255,255,255,0.02)",
        padding: "16px 18px",
        transition: "border-color 0.18s, background 0.18s",
        fontFamily: "'Liberation Mono',monospace",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: `${accent}14`,
            border: `1px solid ${accent}22`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
          }}
        >
          {icon}
        </div>
        <Sparkline values={sparkData} color={accent} />
      </div>
      <div
        style={{
          fontSize: 9,
          color: "rgba(255,255,255,0.28)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 5,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: loading ? "rgba(255,255,255,0.1)" : "#fff",
          letterSpacing: "-0.02em",
          lineHeight: 1,
          marginBottom: 5,
        }}
      >
        {loading ? "···" : value}
      </div>
      <div
        style={{
          fontSize: 9,
          color: "rgba(255,255,255,0.22)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>{loading ? "loading…" : sub}</span>
        {hov && <span style={{ color: accent }}>VIEW →</span>}
      </div>
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
        borderRadius: 12,
        cursor: "pointer",
        border: `1px solid ${hov ? `${color}35` : "rgba(255,255,255,0.07)"}`,
        background: hov ? `${color}0a` : "rgba(255,255,255,0.02)",
        padding: "13px 15px",
        transition: "border-color 0.18s, background 0.18s",
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontFamily: "'Liberation Mono',monospace",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          flexShrink: 0,
          background: `${color}14`,
          border: `1px solid ${color}22`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#fff",
            marginBottom: 3,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
          {sub}
        </div>
      </div>
      <span
        style={{
          fontSize: 9,
          padding: "3px 9px",
          borderRadius: 20,
          background: `${color}14`,
          border: `1px solid ${color}22`,
          color,
          whiteSpace: "nowrap",
          flexShrink: 0,
          letterSpacing: "0.05em",
        }}
      >
        {loading ? "···" : badge}
      </span>
    </div>
  );
}

// ─── Quick Item ───────────────────────────────────────────────────────────────
function QuickItem({ label, count, color, onClick }) {
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
        padding: "7px 10px",
        borderRadius: 7,
        width: "100%",
        marginBottom: 3,
        background: hov ? "rgba(255,255,255,0.05)" : "transparent",
        border: "1px solid transparent",
        cursor: "pointer",
        transition: "background 0.12s",
        textAlign: "left",
        fontFamily: "'Liberation Mono',monospace",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
          {label}
        </span>
      </div>
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
        {count}
      </span>
    </button>
  );
}

// ─── Profile Row ──────────────────────────────────────────────────────────────
function ProfileRow({ label, value, accent }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "7px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        fontFamily: "'Liberation Mono',monospace",
      }}
    >
      <span
        style={{
          fontSize: 9,
          color: "rgba(255,255,255,0.25)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 10,
          color: accent ? accent : "rgba(255,255,255,0.6)",
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

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        margin: "20px 0 9px",
      }}
    >
      <span
        style={{
          fontSize: 9,
          color: "rgba(255,255,255,0.2)",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          fontFamily: "'Liberation Mono',monospace",
          whiteSpace: "nowrap",
        }}
      >
        // {children}
      </span>
      <div
        style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }}
      />
    </div>
  );
}

// ─── Modal Configs ────────────────────────────────────────────────────────────
function buildModalConfig(key, data, currency) {
  const c = currency || "USD";
  const configs = {
    salary: {
      title: "Salary",
      icon: "💼",
      color: "#22c55e",
      emptyMsg: "No salary entries yet.",
      summaryRows: [
        { label: "TOTAL", value: fmt(sum(data, "amount"), c) },
        { label: "ENTRIES", value: String(data.length) },
      ],
      columns: [
        { key: "title", label: "Title" },
        {
          key: "amount",
          label: "Amount",
          accent: true,
          render: (r) => fmt(r.amount, c),
        },
        {
          key: "date",
          label: "Date",
          render: (r) => fmtDate(r.date || r.createdAt),
        },
        {
          key: "description",
          label: "Note",
          render: (r) => r.description || r.note || "—",
        },
      ],
    },
    savings: {
      title: "Savings",
      icon: "🐖",
      color: "#38bdf8",
      emptyMsg: "No savings records yet.",
      summaryRows: [
        { label: "TOTAL SAVED", value: fmt(sum(data, "amount"), c) },
        { label: "RECORDS", value: String(data.length) },
      ],
      columns: [
        { key: "title", label: "Title" },
        {
          key: "amount",
          label: "Amount",
          accent: true,
          render: (r) => fmt(r.amount, c),
        },
        {
          key: "goal",
          label: "Goal",
          render: (r) => (r.goal ? fmt(r.goal, c) : "—"),
        },
        {
          key: "date",
          label: "Date",
          render: (r) => fmtDate(r.date || r.createdAt),
        },
      ],
    },
    bonus: {
      title: "Bonuses",
      icon: "⭐",
      color: "#facc15",
      emptyMsg: "No bonuses recorded yet.",
      summaryRows: [
        { label: "TOTAL", value: fmt(sum(data, "amount"), c) },
        { label: "COUNT", value: String(data.length) },
      ],
      columns: [
        { key: "title", label: "Title" },
        {
          key: "amount",
          label: "Amount",
          accent: true,
          render: (r) => fmt(r.amount, c),
        },
        { key: "type", label: "Type", render: (r) => r.type || "—" },
        {
          key: "date",
          label: "Date",
          render: (r) => fmtDate(r.date || r.createdAt),
        },
      ],
    },
    expense: {
      title: "Expenses",
      icon: "🧾",
      color: "#fb923c",
      emptyMsg: "No expenses logged yet.",
      summaryRows: [
        { label: "TOTAL SPENT", value: fmt(sum(data, "amount"), c) },
        { label: "ITEMS", value: String(data.length) },
      ],
      columns: [
        { key: "title", label: "Title" },
        {
          key: "amount",
          label: "Amount",
          accent: true,
          render: (r) => fmt(r.amount, c),
        },
        {
          key: "category",
          label: "Category",
          render: (r) => r.category || "—",
        },
        {
          key: "date",
          label: "Date",
          render: (r) => fmtDate(r.date || r.createdAt),
        },
      ],
    },
    exchangelog: {
      title: "Exchange Log",
      icon: "💱",
      color: "#a78bfa",
      emptyMsg: "No currency exchanges logged.",
      summaryRows: [{ label: "TOTAL LOGS", value: String(data.length) }],
      columns: [
        {
          key: "fromCurrency",
          label: "From",
          render: (r) => r.fromCurrency || r.from || "—",
        },
        {
          key: "toCurrency",
          label: "To",
          render: (r) => r.toCurrency || r.to || "—",
        },
        {
          key: "amount",
          label: "Amount",
          accent: true,
          render: (r) => fmt(r.amount, r.fromCurrency || c),
        },
        {
          key: "rate",
          label: "Rate",
          render: (r) => (r.rate ? Number(r.rate).toFixed(4) : "—"),
        },
        {
          key: "date",
          label: "Date",
          render: (r) => fmtDate(r.date || r.createdAt),
        },
      ],
    },
    remittance: {
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
          render: (r) => r.recipient || r.name || "—",
        },
        {
          key: "amount",
          label: "Amount",
          accent: true,
          render: (r) => fmt(r.amount, c),
        },
        { key: "country", label: "Country", render: (r) => r.country || "—" },
        { key: "status", label: "Status", render: (r) => r.status || "—" },
        {
          key: "date",
          label: "Date",
          render: (r) => fmtDate(r.date || r.createdAt),
        },
      ],
    },
    plans: {
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
        { key: "title", label: "Plan" },
        {
          key: "target",
          label: "Target",
          accent: true,
          render: (r) => (r.target ? fmt(r.target, c) : "—"),
        },
        {
          key: "progress",
          label: "Progress",
          render: (r) => (r.progress != null ? `${r.progress}%` : "—"),
        },
        { key: "status", label: "Status", render: (r) => r.status || "Active" },
        {
          key: "deadline",
          label: "Due",
          render: (r) => fmtDate(r.deadline || r.dueDate),
        },
      ],
    },
    notes: {
      title: "Notes",
      icon: "📓",
      color: "#fb923c",
      emptyMsg: "Your notebook is empty.",
      summaryRows: [
        { label: "TOTAL NOTES", value: String(data.length) },
        { label: "PINNED", value: String(data.filter((n) => n.pinned).length) },
      ],
      columns: [
        { key: "title", label: "Title" },
        {
          key: "content",
          label: "Preview",
          render: (r) => {
            const t = r.content || r.body || "";
            return t.slice(0, 50) + (t.length > 50 ? "…" : "");
          },
        },
        {
          key: "pinned",
          label: "Pinned",
          render: (r) => (r.pinned ? "📌" : "—"),
        },
        {
          key: "createdAt",
          label: "Date",
          render: (r) => fmtDate(r.createdAt),
        },
      ],
    },
  };
  return configs[key] ? { ...configs[key], items: data } : null;
}

// Add this above your Overview component (or at the top of the file)
function useGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: "good morning", emoji: "☀️" };
  if (hour >= 12 && hour < 17) return { text: "good afternoon", emoji: "🌤️" };
  if (hour >= 17 && hour < 21) return { text: "good evening", emoji: "🌆" };
  return { text: "good night", emoji: "🌙" };
}

const NAME_COLORS = [
  "#22c55e",
  "#38bdf8",
  "#facc15",
  "#fb923c",
  "#a78bfa",
  "#f472b6",
  "#34d399",
];

function useNameColor(name) {
  // Stable color per name — same person always gets same color
  if (!name) return "#22c55e";
  const idx = name.charCodeAt(0) % NAME_COLORS.length;
  return NAME_COLORS[idx];
}

// ─── Overview Page ────────────────────────────────────────────────────────────
export default function Overview() {
  const { user, data, loading, syncing, sync } = useFinanceData();
  const [modal, setModal] = useState(null);

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
    if (config) setModal({ key, config });
  };

  const cur = user?.currency || "USD";
  const totalSalary = sum(data.salaries, "amount");
  const totalSavings = sum(data.savings, "amount");
  const totalBonus = sum(data.bonuses, "amount");
  const totalExp = sum(data.expenses, "amount");
  const savRate =
    totalSalary > 0 ? ((totalSavings / totalSalary) * 100).toFixed(1) : "0";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .a1{animation:fadeUp 0.35s ease both}
        .a2{animation:fadeUp 0.35s 0.06s ease both}
        .a3{animation:fadeUp 0.35s 0.12s ease both}
        .a4{animation:fadeUp 0.35s 0.18s ease both}
        .a5{animation:fadeUp 0.35s 0.24s ease both}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        .pulse{animation:blink 2.2s ease infinite}
      `}</style>

      <div
        style={{
          fontFamily: "'Liberation Mono', monospace",
          width: "100%",
          color: "#fff",
        }}
      >
        {/* Header */}
        <div
          className="a1"
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 26,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.22)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 6,
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
                lineHeight: 1.3,
                margin: 0,
              }}
            >
              <span style={{ fontSize: 18 }}>{useGreeting().emoji}</span>{" "}
              {useGreeting().text},{" "}
              <span style={{ color: useNameColor(user?.name?.split(" ")[0]) }}>
                {user?.name?.split(" ")[0] || "operator"}
              </span>
            </h1>

            <p
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.22)",
                marginTop: 5,
                marginBottom: 0,
              }}
            >
              tap any card to view records
            </p>
          </div>
          <button
            onClick={sync}
            disabled={syncing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: syncing ? "#22c55e" : "rgba(255,255,255,0.35)",
              fontSize: 10,
              fontFamily: "'Liberation Mono',monospace",
              cursor: syncing ? "not-allowed" : "pointer",
              letterSpacing: "0.05em",
              transition: "all 0.18s",
            }}
          >
            <span className={syncing ? "pulse" : ""}>
              {syncing ? "◉" : "○"}
            </span>
            {syncing ? "syncing…" : "sync"}
          </button>
        </div>

        {/* Financial Summary */}
        <SectionLabel>financial_summary</SectionLabel>
        <div
          className="a2"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(148px,1fr))",
            gap: 8,
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

        {/* Modules */}
        <SectionLabel>modules</SectionLabel>
        <div
          className="a3"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 8,
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

        {/* Account + Quick Nav */}
        <SectionLabel>account & navigation</SectionLabel>
        <div
          className="a4"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
        >
          {/* Account Panel */}
          <div
            style={{
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.07)",
              padding: 16,
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                paddingBottom: 12,
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#22c55e",
                  fontWeight: 700,
                  fontSize: 15,
                  flexShrink: 0,
                }}
              >
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#fff" }}>
                  {user?.name || "—"}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.28)",
                    marginTop: 2,
                  }}
                >
                  {user?.email || "—"}
                </div>
              </div>
            </div>
            <ProfileRow
              label="currency"
              value={user?.currency || "USD"}
              accent="#22c55e"
            />
            <ProfileRow label="theme" value={user?.theme || "obsidian"} />
            <ProfileRow
              label="user_id"
              value={user?._id ? `${user._id.slice(0, 12)}…` : "—"}
            />
          </div>

          {/* Quick Nav */}
          <div
            style={{
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.07)",
              padding: 16,
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.2)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              // quick_view
            </div>
            <QuickItem
              label="salary_records"
              count={data.salaries.length}
              color="#22c55e"
              onClick={() => openModal("salary")}
            />
            <QuickItem
              label="expense_records"
              count={data.expenses.length}
              color="#fb923c"
              onClick={() => openModal("expense")}
            />
            <QuickItem
              label="remittances"
              count={data.remittances.length}
              color="#38bdf8"
              onClick={() => openModal("remittance")}
            />
            <QuickItem
              label="plans"
              count={data.plans.length}
              color="#a78bfa"
              onClick={() => openModal("plans")}
            />
            <QuickItem
              label="exchange_log"
              count={data.exchangelogs.length}
              color="#facc15"
              onClick={() => openModal("exchangelog")}
            />
            <QuickItem
              label="notes"
              count={data.notes.length}
              color="#fb923c"
              onClick={() => openModal("notes")}
            />
          </div>
        </div>

        {/* Status Bar */}
        <div
          className="a5"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 14px",
            borderRadius: 8,
            marginTop: 8,
            background: "rgba(255,255,255,0.01)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div
            className="pulse"
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#22c55e",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.2)",
              letterSpacing: "0.05em",
            }}
          >
            session_active · jwt_authenticated ·{" "}
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.1)",
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
