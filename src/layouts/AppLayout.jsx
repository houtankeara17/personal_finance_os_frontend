import React, { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useFinance } from "../context/FinanceContext";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function AppLayout() {
  const { token, theme } = useFinance();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (!token) return <Navigate to="/login" />;

  // Maps theme states directly to real-time tailwind rendering values
  const getCanvasStyle = () => {
    switch (theme) {
      case "theme-slate":
        return "bg-[#0f131a] text-slate-200";
      case "theme-nord":
        return "bg-[#0b0d11] text-gray-200";
      case "theme-crimson":
        return "bg-[#0e0a0a] text-red-100/90";
      case "theme-violet":
        return "bg-[#0b0a12] text-violet-100/90";
      case "theme-amber":
        return "bg-[#0e0b07] text-amber-100/90";
      case "theme-obsidian":
      default:
        return "bg-[#060606] text-[#e3e3e3]";
    }
  };

  return (
    // Dynamic theme string interpolation triggers instant layout repaint here
    <div
      className={`min-h-screen ${getCanvasStyle()} ${theme || "theme-obsidian"} relative overflow-hidden transition-colors duration-300`}
    >
      {/* Background Matrix Grids */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.015) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.01) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, transparent 40%, rgba(0,0,0,0.6) 100%)",
          }}
        />
      </div>

      {/* Navigation Components */}
      <Sidebar
        isOpen={mobileSidebarOpen}
        onCloseSidebar={() => setMobileSidebarOpen(false)}
      />

      <div className="relative z-10 flex flex-col min-h-screen md:ml-[250px]">
        <Navbar onToggleSidebar={() => setMobileSidebarOpen(true)} />

        {/* Core Main Workspaces */}
        <main
          className="flex-1 p-4 sm:p-6 md:p-8 w-full max-w-[1600px] mx-auto overflow-x-hidden"
          style={{
            paddingTop: "calc(48px + 1.5rem)",
            animation: "layoutFadeUp 0.35s ease-out both",
          }}
        >
          <Outlet />
        </main>
      </div>

      <style>{`
        @keyframes layoutFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
