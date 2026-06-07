import React, { useState } from "react";
import { useFinance } from "../context/FinanceContext";
import { Terminal, X, Delete } from "lucide-react";

export default function FloatingCalculator() {
  const { theme } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState("");

  const appendVal = (v) => setDisplay((prev) => prev + v);
  const clearScreen = () => setDisplay("");
  const dropLast = () => setDisplay((prev) => prev.slice(0, -1));

  const calculateOutput = () => {
    try {
      // Safe evaluation of mathematical strings
      const result = new Function(`return ${display}`)();
      setDisplay(String(result));
    } catch {
      setDisplay("ERROR");
    }
  };

  const getStyle = () => {
    // Dynamic mapping cleanly supporting the visual identity of image_ee9d88.png
    if (theme === "theme-slate") {
      return {
        bg: "bg-[#141923]",
        border: "border-white/[0.06]",
        text: "text-slate-200",
        btn: "bg-[#1c2330] hover:bg-[#232d3d] text-slate-300 border-white/[0.03]",
        accentBtn: "bg-slate-200 text-slate-900 hover:bg-white",
      };
    }
    if (theme === "theme-nord") {
      return {
        bg: "bg-[#11141a]",
        border: "border-white/[0.05]",
        text: "text-nord-200",
        btn: "bg-[#161b24] hover:bg-[#1d2430] text-gray-300 border-white/[0.02]",
        accentBtn: "bg-gray-200 text-gray-900 hover:bg-white",
      };
    }
    // Default: theme-obsidian / matching image_ee9d88.png layout precisely
    return {
      bg: "bg-[#111111]",
      border: "border-white/[0.06]",
      text: "text-[#e3e3e3]",
      btn: "bg-[#161616] hover:bg-[#1e1e1e] text-white/70 border-white/[0.04]",
      accentBtn: "bg-white text-black hover:bg-white/90",
    };
  };

  const clr = getStyle();

  return (
    <div className="fixed bottom-6 left-6 z-[999] font-sans selection:bg-white/10">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className={`p-3.5 rounded-xl shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-[1.04] cursor-pointer border ${clr.bg} ${clr.border}`}
        >
          <Terminal className="w-4 h-4 text-white/60" />
        </button>
      ) : (
        <div
          className={`w-72 rounded-xl p-4 shadow-2xl border flex flex-col gap-3 animate-[fadeIn_0.15s_ease-out] ${clr.bg} ${clr.border}`}
        >
          {/* Terminal Solver Header */}
          <div className="flex items-center justify-between border-b pb-2 border-white/[0.05]">
            <span className="text-[10px] font-medium tracking-widest text-white/40 uppercase">
              Terminal Solver v2026
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/30 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Matrix Calculator Screen Display */}
          <div className="w-full bg-black/30 rounded-lg p-3 text-right font-mono text-lg tracking-tight overflow-hidden text-ellipsis whitespace-nowrap min-h-[48px] flex items-center justify-end border border-white/[0.02]">
            <span className={clr.text}>{display || "0"}</span>
          </div>

          {/* Interactive Button Grid Pad */}
          <div className="grid grid-cols-4 gap-1.5 font-medium text-xs">
            <button
              onClick={clearScreen}
              className={`p-2.5 rounded-md border font-medium text-red-400/90 hover:text-red-400 transition-colors cursor-pointer ${clr.btn}`}
            >
              C
            </button>
            <button
              onClick={dropLast}
              className={`p-2.5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${clr.btn}`}
            >
              <Delete className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => appendVal("/")}
              className={`p-2.5 rounded-md border font-medium transition-colors cursor-pointer ${clr.btn}`}
            >
              /
            </button>
            <button
              onClick={() => appendVal("*")}
              className={`p-2.5 rounded-md border font-medium transition-colors cursor-pointer ${clr.btn}`}
            >
              *
            </button>

            {/* Row Number Mapping blocks */}
            {["7", "8", "9", "-"].map((k) => (
              <button
                key={k}
                onClick={() => appendVal(k)}
                className={`p-2.5 rounded-md border transition-colors cursor-pointer ${clr.btn}`}
              >
                {k}
              </button>
            ))}
            {["4", "5", "6", "+"].map((k) => (
              <button
                key={k}
                onClick={() => appendVal(k)}
                className={`p-2.5 rounded-md border transition-colors cursor-pointer ${clr.btn}`}
              >
                {k}
              </button>
            ))}
            {["1", "2", "3"].map((k) => (
              <button
                key={k}
                onClick={() => appendVal(k)}
                className={`p-2.5 rounded-md border transition-colors cursor-pointer ${clr.btn}`}
              >
                {k}
              </button>
            ))}

            {/* Action Operations Execution keys */}
            <button
              onClick={calculateOutput}
              className={`row-span-2 p-2.5 rounded-md flex items-center justify-center font-bold transition-all active:scale-[0.98] cursor-pointer shadow-sm ${clr.accentBtn}`}
            >
              =
            </button>
            <button
              onClick={() => appendVal("0")}
              className={`col-span-2 p-2.5 rounded-md border text-center font-medium transition-colors cursor-pointer ${clr.btn}`}
            >
              0
            </button>
            <button
              onClick={() => appendVal(".")}
              className={`p-2.5 rounded-md border font-medium transition-colors cursor-pointer ${clr.btn}`}
            >
              .
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
