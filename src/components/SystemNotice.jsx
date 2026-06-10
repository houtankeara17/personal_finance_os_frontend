import React, { useEffect } from "react";
import { useFinance } from "../context/FinanceContext";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function SystemNotice() {
  const { notices, pendingNotice, setPendingNotice } = useFinance();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full">
      {/* Persistent pending notice — survives redirects */}
      {pendingNotice && (
        <div
          onClick={() => setPendingNotice(null)}
          className="flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 animate-[fadeIn_1s_ease-out] bg-[#0f1311] border-[#10b981]/20 text-[#e3e3e3] cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 text-[#ffffff] shrink-0 mt-0.5" />
          <p className="text-[11px] font-medium tracking-wide leading-relaxed">
            {pendingNotice.message}
          </p>
        </div>
      )}

      {/* Regular notices */}
      {notices.map((n) => (
        <div
          key={n.id}
          className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 animate-[fadeIn_1s_ease-out] ${
            n.type === "error"
              ? "bg-[#161212] border-red-500/20 text-red-200"
              : "bg-[#0f1311] border-[#10b981]/20 text-[#e3e3e3]"
          }`}
        >
          {n.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#ffffff] shrink-0 mt-0.5" />
          )}
          <p className="text-[11px] font-medium tracking-wide leading-relaxed">
            {n.message}
          </p>
        </div>
      ))}
    </div>
  );
}
