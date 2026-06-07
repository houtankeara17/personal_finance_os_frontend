import React from "react";
import { useFinance } from "../context/FinanceContext";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function SystemNotice() {
  const { notices } = useFinance();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full">
      {notices.map((n) => (
        <div
          key={n.id}
          className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 animate-[fadeIn_0.2s_ease-out] ${
            n.type === "error"
              ? "bg-[#161212]/95 border-red-500/20 text-red-200"
              : "bg-[#0f1311]/95 border-[#10b981]/20 text-[#e3e3e3]"
          }`}
        >
          {n.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
          )}
          <div className="flex-1 space-y-0.5">
            <p className="text-[11px] font-medium tracking-wide leading-relaxed">
              {n.msg}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
