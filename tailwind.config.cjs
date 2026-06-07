/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  safelist: [
    "theme-mongodb",
    "theme-cyberpunk",
    "theme-sunrise",
    "bg-[#001E2B]",
    "bg-[#0C232B]",
    "text-[#00ED64]",
    "border-[#00ED64]",
    "bg-black",
    "bg-slate-900",
    "text-cyan-400",
    "border-magenta-500",
    "bg-[#FDFBF7]",
    "bg-[#F4EFE6]",
    "text-orange-600",
    "border-orange-500",
  ],
  theme: {
    extend: {
      colors: {
        mongoCanvas: "#001E2B",
        mongoCard: "#0C232B",
        mongoAccent: "#00ED64",
        cyberCanvas: "#0A0A0C",
        cyberCard: "#121214",
        cyberCyan: "#00F0FF",
        cyberPink: "#FF007F",
        sunriseCanvas: "#FDFBF7",
        sunriseCard: "#F4EFE6",
        sunriseAccent: "#E65100",
        sunriseText: "#2E2C29",
      },
    },
  },
  plugins: [],
};
