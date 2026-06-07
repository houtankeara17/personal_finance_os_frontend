import React from "react";
import { NavLink } from "react-router-dom";
import { useFinance } from "../context/FinanceContext";
import {
  LayoutDashboard,
  Receipt,
  BookOpen,
  LogOut,
  X,
  Banknote,
  Gift,
  ArrowLeftRight,
  SendHorizonal,
  PiggyBank,
  Target,
} from "lucide-react";

export default function Sidebar({ isOpen, onCloseSidebar }) {
  const { user, theme, logOut } = useFinance();

  const navGroups = [
    {
      label: "Core",
      links: [{ to: "/", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      label: "Income",
      links: [
        { to: "/salary", label: "Salary Records", icon: Banknote },
        { to: "/bonus", label: "Bonus Records", icon: Gift },
      ],
    },
    {
      label: "Outflow",
      links: [
        { to: "/expenses", label: "Expenses Log", icon: Receipt },
        { to: "/remittance", label: "Remittance", icon: SendHorizonal },
        { to: "/saving", label: "Savings", icon: PiggyBank },
        { to: "/plans", label: "Financial Plans", icon: Target },
      ],
    },
    {
      label: "Currency",
      links: [
        { to: "/exchangelog", label: "Exchange Log", icon: ArrowLeftRight },
      ],
    },
    {
      label: "Planning",
      links: [{ to: "/note", label: "Notebook", icon: BookOpen }],
    },
    {
      label: "System",
      links: [{ to: "/setting", label: "Settings", icon: LayoutDashboard }],
    },
  ];

  const getSidebarStyle = () => {
    if (theme === "theme-slate")
      return {
        background: "#141923",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      };
    if (theme === "theme-nord")
      return {
        background: "#11141a",
        borderRight: "1px solid rgba(255,255,255,0.04)",
      };
    if (theme === "theme-crimson")
      return {
        background: "#1a1010",
        borderRight: "1px solid rgba(255,255,255,0.04)",
      };
    if (theme === "theme-violet")
      return {
        background: "#13111e",
        borderRight: "1px solid rgba(255,255,255,0.04)",
      };
    if (theme === "theme-amber")
      return {
        background: "#191208",
        borderRight: "1px solid rgba(255,255,255,0.04)",
      };
    return {
      background: "#0f0f0f",
      borderRight: "1px solid rgba(255,255,255,0.04)",
    };
  };

  const currentStyle = getSidebarStyle();
  let animIndex = 0;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onCloseSidebar}
          className="fixed inset-0 bg-black/70 z-[9989] md:hidden" // ✅ z-9989, below sidebar z-9990
          style={{
            backdropFilter: "blur(2px)",
            animation: "fadeIn 0.15s ease-out",
          }}
        />
      )}

      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-[9990]
          flex flex-col
          transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        style={{
          width: "250px",
          background: currentStyle.background,
          borderRight: currentStyle.borderRight,
        }}
      >
        {/* Ambient grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgba(255,255,255,0.012) 1px, transparent 1px)",
            backgroundSize: "100% 40px",
          }}
        />

        <div className="relative flex flex-col h-full p-5 pt-6 overflow-y-auto">
          {/* Brand */}
          <div className="flex items-start justify-between mb-8 flex-shrink-0">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[#10b981] font-mono text-xs opacity-60">
                  {"["}
                </span>
                <h2 className="text-[11px] font-bold text-white tracking-[0.2em] uppercase font-mono">
                  Financia
                </h2>
                <span className="text-[#10b981] font-mono text-xs opacity-60">
                  {"]"}
                </span>
              </div>
              <p className="text-[8px] font-mono text-white/25 tracking-[0.3em] uppercase pl-4">
                Metrics Core
              </p>
            </div>
            <button
              onClick={onCloseSidebar}
              className="p-1 text-white/30 hover:text-white md:hidden hover:bg-white/[0.04] rounded transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Nav Groups */}
          <nav className="flex flex-col gap-4 flex-1">
            {navGroups.map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="flex-1 h-px bg-white/[0.04]" />
                  <span className="text-[8px] font-mono text-white/20 tracking-[0.3em] uppercase">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-white/[0.04]" />
                </div>
                <div className="flex flex-col gap-0.5">
                  {group.links.map((link) => {
                    const Icon = link.icon;
                    const delay = animIndex++ * 40;
                    return (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.to === "/"}
                        onClick={onCloseSidebar}
                        style={{
                          animationDelay: `${delay}ms`,
                          animation: "sidebarItemIn 0.3s ease-out both",
                        }}
                        className={({ isActive }) => `
                          group relative flex items-center gap-3 px-3 py-2.5 rounded-sm text-[11px] font-mono
                          tracking-wider transition-all select-none overflow-hidden
                          ${
                            isActive
                              ? "text-white bg-white/[0.05]"
                              : "text-white/35 hover:text-white/80 hover:bg-white/[0.02]"
                          }
                        `}
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300"
                              style={{
                                backgroundImage:
                                  "linear-gradient(to bottom, rgba(255,255,255,0.015) 1px, transparent 1px)",
                                backgroundSize: "100% 3px",
                              }}
                            />
                            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                            {isActive && (
                              <span className="w-1 h-1 rounded-full bg-white/70 flex-shrink-0" />
                            )}
                            <span className="truncate">{link.label}</span>
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="space-y-3 flex-shrink-0 mt-4">
            <div className="h-px bg-white/[0.04]" />
            <div className="flex items-center gap-3 px-1 py-1">
              <div className="relative flex-shrink-0">
                <img
                  src={
                    user?.avatar ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                  }
                  alt="Profile"
                  className="w-7 h-7 rounded-sm object-cover"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                />
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10b981]"
                  style={{ boxShadow: "0 0 6px rgba(16,185,129,0.6)" }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-[10px] font-mono font-medium text-white truncate tracking-wider">
                  {user?.name || "Operator"}
                </h4>
                <p className="text-[8px] font-mono text-white/25 truncate tracking-widest uppercase">
                  {user?.currency || "USD"} / Base Ledger
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                logOut?.() ??
                (localStorage.removeItem("token"),
                (window.location.href = "/login"))
              }
              className="
                w-full flex items-center justify-center gap-2 px-3 py-2
                rounded-sm font-mono text-[10px] tracking-widest uppercase
                border border-red-500/10 bg-red-500/[0.02]
                text-red-400/60 hover:text-red-300 hover:bg-red-500/[0.06]
                hover:border-red-500/20 transition-all duration-200
              "
            >
              <LogOut className="w-3 h-3" />
              Exit Workspace
            </button>
          </div>
        </div>
      </aside>

      <style>{`
        @keyframes sidebarItemIn {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
}
