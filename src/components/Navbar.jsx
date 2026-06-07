import React, { useState, useRef, useEffect, useCallback } from "react";
import { useFinance } from "../context/FinanceContext";
import { useNavigate } from "react-router-dom";
import { Menu, Terminal, Delete, X } from "lucide-react";
import Settings from "../pages/auth/Setting";

/* ─── Toast ─────────────────────────────────────────────────────────────── */
const toastIcons = {
  check: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  x: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
  bell: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  ),
  close: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
};

const TOAST_TYPE = {
  success: {
    icon: toastIcons.check,
    iconBg: "#dcfce7",
    iconColor: "#16a34a",
    bar: "#22c55e",
  },
  error: {
    icon: toastIcons.x,
    iconBg: "#fee2e2",
    iconColor: "#dc2626",
    bar: "#ef4444",
  },
  info: {
    icon: toastIcons.info,
    iconBg: "#dbeafe",
    iconColor: "#2563eb",
    bar: "#3b82f6",
  },
  default: {
    icon: toastIcons.bell,
    iconBg: "#f3f4f6",
    iconColor: "#6b7280",
    bar: "#9ca3af",
  },
};
const TOAST_DURATION = 3400;
const TOAST_CSS = `
@keyframes _toastIn  { from { transform: translateY(14px) scale(.97); opacity: 0 } to { transform: translateY(0) scale(1); opacity: 1 } }
@keyframes _toastOut { from { transform: translateY(0) scale(1); opacity: 1 } to { transform: translateY(10px) scale(.97); opacity: 0 } }
@keyframes _shrink   { from { width: 100% } to { width: 0% } }
`;
if (typeof document !== "undefined" && !document.getElementById("_toast_css")) {
  const s = document.createElement("style");
  s.id = "_toast_css";
  s.textContent = TOAST_CSS;
  document.head.appendChild(s);
}

function Toast({ id, type = "default", title, description, onDismiss }) {
  const cfg = TOAST_TYPE[type] || TOAST_TYPE.default;
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef(null);
  const dismiss = useCallback(() => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => onDismiss(id), 220);
  }, [leaving, id, onDismiss]);
  useEffect(() => {
    timerRef.current = setTimeout(dismiss, TOAST_DURATION);
    return () => clearTimeout(timerRef.current);
  }, [dismiss]);
  return (
    <div
      role="alert"
      aria-live="assertive"
      onMouseEnter={() => clearTimeout(timerRef.current)}
      onMouseLeave={() => {
        timerRef.current = setTimeout(dismiss, 800);
      }}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        background: "#ffffff",
        border: "0.5px solid rgba(0,0,0,0.1)",
        borderRadius: 14,
        padding: "14px 14px 18px",
        width: 320,
        boxSizing: "border-box",
        animation: `${leaving ? "_toastOut" : "_toastIn"} ${leaving ? "0.22s" : "0.28s"} cubic-bezier(${leaving ? "0.4,0,1,1" : "0.16,1,0.3,1"}) both`,
        overflow: "hidden",
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: cfg.iconBg,
          color: cfg.iconColor,
        }}
      >
        {cfg.icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <p
            style={{
              margin: "0 0 2px",
              fontSize: 13,
              fontWeight: 500,
              lineHeight: 1.4,
              color: "#111827",
            }}
          >
            {title}
          </p>
        )}
        {description && (
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "#6b7280",
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>
        )}
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{
          flexShrink: 0,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#9ca3af",
          padding: 0,
          width: 20,
          height: 20,
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#111827";
          e.currentTarget.style.background = "#f3f4f6";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#9ca3af";
          e.currentTarget.style.background = "none";
        }}
      >
        {toastIcons.close}
      </button>
      <span
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 2,
          borderRadius: "0 0 0 14px",
          background: cfg.bar,
          animation: `_shrink ${TOAST_DURATION}ms linear forwards`,
          animationPlayState: leaving ? "paused" : "running",
        }}
      />
    </div>
  );
}

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div
      role="region"
      aria-label="Notifications"
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        display: "flex",
        flexDirection: "column-reverse",
        gap: 8,
        zIndex: 99999999,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: "all" }}>
          <Toast {...t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}

let _toastId = 0;
function useToast() {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((opts) => {
    const id = ++_toastId;
    setToasts((prev) => [...prev, { id, ...opts }]);
    return id;
  }, []);
  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  return { toasts, toast, dismiss };
}

/* ─── Theme styles ──────────────────────────────────────────────────────── */
function getStyle(theme) {
  if (theme === "theme-slate")
    return {
      header: "bg-[#141923]/90 border-white/[0.04]",
      btn: "bg-[#1c2330] hover:bg-[#232d3d] text-slate-300 border-white/[0.04]",
      accentBtn: "bg-slate-200 text-slate-900 hover:bg-white",
    };
  if (theme === "theme-nord")
    return {
      header: "bg-[#11141a]/90 border-white/[0.04]",
      btn: "bg-[#161b24] hover:bg-[#1d2430] text-gray-300 border-white/[0.03]",
      accentBtn: "bg-gray-200 text-gray-900 hover:bg-white",
    };
  if (theme === "theme-crimson")
    return {
      header: "bg-[#0e0a0a]/90 border-white/[0.04]",
      btn: "bg-[#251515] hover:bg-[#2e1a1a] text-red-200/70 border-white/[0.04]",
      accentBtn: "bg-red-400 text-black hover:bg-red-300",
    };
  if (theme === "theme-violet")
    return {
      header: "bg-[#0b0a12]/90 border-white/[0.04]",
      btn: "bg-[#1c1830] hover:bg-[#231e3d] text-violet-200/70 border-white/[0.04]",
      accentBtn: "bg-violet-400 text-black hover:bg-violet-300",
    };
  if (theme === "theme-amber")
    return {
      header: "bg-[#0e0b07]/90 border-white/[0.04]",
      btn: "bg-[#261b0c] hover:bg-[#2e2010] text-amber-200/70 border-white/[0.04]",
      accentBtn: "bg-amber-400 text-black hover:bg-amber-300",
    };
  return {
    header: "bg-[#0d0d0d]/90 border-white/[0.04]",
    btn: "bg-[#161616] hover:bg-[#1e1e1e] text-white/70 border-white/[0.04]",
    accentBtn: "bg-white text-black hover:bg-white/90",
  };
}

/* ─── Navbar ─────────────────────────────────────────────────────────────── */
export default function Navbar({ onToggleSidebar }) {
  const { user, theme } = useFinance();
  const { toasts, dismiss } = useToast();
  const navigate = useNavigate();

  const [openCalc, setOpenCalc] = useState(false);
  const [display, setDisplay] = useState("");

  const appendVal = (v) => setDisplay((p) => p + v);
  const clearScreen = () => setDisplay("");
  const dropLast = () => setDisplay((p) => p.slice(0, -1));
  const calculateOutput = () => {
    try {
      setDisplay(String(new Function(`return ${display}`)()));
    } catch {
      setDisplay("ERROR");
    }
  };

  const clr = getStyle(theme);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const panelOverlay = {
    position: "fixed",
    top: 0,
    bottom: 0,
    right: 0,
    left: isMobile ? 0 : "250px",
    background: "rgba(0,0,0,0.72)",
    backdropFilter: "blur(3px)",
    zIndex: 9999999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
    animation: "panelIn 0.12s ease-out",
  };

  return (
    <>
      <style>{`
        @keyframes panelIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
      `}</style>

      <header
        className={`fixed top-0 right-0 left-0 md:left-[250px] px-4 sm:px-6 py-0 z-[9996] flex items-stretch justify-between border-b backdrop-blur-md ${clr.header}`}
        style={{ minHeight: "48px" }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 text-white/40 hover:text-white md:hidden hover:bg-white/[0.04] rounded transition-all"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="hidden sm:flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span
                className="absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-50"
                style={{
                  animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite",
                }}
              />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]" />
            </span>
            <span className="text-[9px] font-mono text-white/30 tracking-[0.2em] uppercase">
              Secure Core Nodes Live
            </span>
          </div>
        </div>

        <div className="flex items-stretch gap-0">
          <div className="flex items-center px-3 sm:px-4">
            <button
              onClick={() => setOpenCalc(true)}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-sm border border-transparent hover:border-white/[0.06] hover:bg-white/[0.03] text-white/30 hover:text-white/70 transition-all font-mono text-[9px] tracking-widest uppercase"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Terminal</span>
            </button>
          </div>
          <div className="w-px self-stretch bg-white/[0.04] my-2" />

          {/* ── Profile → navigate to /settings ── */}
          <button
            type="button"
            onClick={() => navigate("/setting")}
            className="group flex items-center gap-3 pl-4 pr-3 sm:pr-4 hover:bg-white/[0.02] transition-all cursor-pointer focus:outline-none"
          >
            <div className="hidden md:block text-right">
              <h4 className="text-[10px] font-mono font-medium text-white/70 tracking-widest group-hover:text-[#10b981] transition-colors">
                {user?.name || "Operator"}
              </h4>
              <p className="text-[8px] font-mono text-white/25 group-hover:text-white/40 tracking-widest">
                System Workspace
              </p>
            </div>
            <div className="relative">
              <img
                src={
                  user?.avatar ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                }
                alt="Avatar"
                className="w-7 h-7 rounded-sm object-cover transition-all group-hover:scale-[1.04]"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              />
            </div>
          </button>
        </div>
      </header>

      {/* ── Calculator Modal ── */}
      {openCalc && (
        <div
          style={panelOverlay}
          onClick={(e) => e.target === e.currentTarget && setOpenCalc(false)}
        >
          <div
            style={{
              background: "#0f0f0f",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "8px",
              position: "relative",
              maxHeight: "90vh",
              overflowY: "auto",
              color: "#e3e3e3",
              width: "100%",
              maxWidth: "280px",
              padding: "1.25rem",
            }}
          >
            <button
              onClick={() => setOpenCalc(false)}
              className="absolute top-3 right-3 text-white/25 hover:text-white p-1 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div
              className="flex items-center gap-2 mb-4 pb-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <Terminal className="w-3 h-3 text-[#10b981]" />
              <span className="text-[8px] font-mono text-white/30 tracking-[0.3em] uppercase">
                Terminal Solver v2026
              </span>
            </div>
            <div
              className="w-full rounded-sm p-3 mb-3 font-mono text-sm overflow-hidden text-ellipsis whitespace-nowrap"
              style={{
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.04)",
                minHeight: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              <span className="text-white/90">{display || "0"}</span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: "6px",
              }}
            >
              {[
                {
                  label: "C",
                  action: clearScreen,
                  cls: "text-red-400/80 hover:text-red-400",
                },
                {
                  label: "⌫",
                  action: dropLast,
                  icon: <Delete className="w-3.5 h-3.5 mx-auto" />,
                },
                { label: "/", action: () => appendVal("/") },
                { label: "×", action: () => appendVal("*") },
                ...["7", "8", "9", "-", "4", "5", "6", "+", "1", "2", "3"].map(
                  (k) => ({ label: k, action: () => appendVal(k) }),
                ),
              ].map((k, i) => (
                <button
                  key={i}
                  onClick={k.action}
                  className={`p-2 rounded-sm text-xs font-mono border transition-all active:scale-[0.96] ${clr.btn} ${k.cls || ""}`}
                >
                  {k.icon || k.label}
                </button>
              ))}
              <button
                onClick={calculateOutput}
                className={`row-span-2 p-2 rounded-sm text-sm font-mono font-bold transition-all active:scale-[0.97] ${clr.accentBtn}`}
              >
                =
              </button>
              <button
                onClick={() => appendVal("0")}
                className={`col-span-2 p-2 rounded-sm text-xs font-mono border text-center transition-all ${clr.btn}`}
              >
                0
              </button>
              <button
                onClick={() => appendVal(".")}
                className={`p-2 rounded-sm text-xs font-mono border transition-all ${clr.btn}`}
              >
                .
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
