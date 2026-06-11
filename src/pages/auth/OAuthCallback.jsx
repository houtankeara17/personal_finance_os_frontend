import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFinance } from "../../context/FinanceContext";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { executeOAuthSuccess, theme } = useFinance();
  const [statusText, setStatusText] = useState(
    "Initializing secure authentication exchange...",
  );

  useEffect(() => {
    const handleOAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const error = params.get("error");

      if (error || !token) {
        navigate("/login?error=oauth_failed");
        return;
      }

      // Clear URL params immediately to prevent re-runs on React StrictMode
      window.history.replaceState({}, document.title, window.location.pathname);

      setStatusText("Token synchronized. Verifying identity...");

      // Use the context function — don't duplicate the fetch here
      const result = await executeOAuthSuccess(token);

      if (result.success) {
        setStatusText("Identity confirmed! Redirecting...");
        setTimeout(() => navigate("/", { replace: true }), 400);
      } else {
        navigate("/login?error=oauth_failed");
      }
    };

    handleOAuth();
  }, []);

  const getLoadingBg = () => {
    switch (theme) {
      case "theme-slate":
        return "bg-[#0f131a]";
      case "theme-nord":
        return "bg-[#0b0d11]";
      case "theme-crimson":
        return "bg-[#0e0a0a]";
      case "theme-violet":
        return "bg-[#0b0a12]";
      case "theme-amber":
        return "bg-[#0e0b07]";
      case "theme-obsidian":
      default:
        return "bg-[#0d0d0d]";
    }
  };

  return (
    <div
      className={`min-h-screen ${getLoadingBg()} flex flex-col items-center justify-center gap-4 text-white/40 font-sans selection:bg-white/10`}
    >
      <div className="relative flex items-center justify-center">
        <div className="absolute w-16 h-16 rounded-full bg-white/[0.02] blur-xl animate-pulse" />
        <svg
          className="w-8 h-8 text-white/70 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </div>

      <p className="text-xs tracking-wide text-white/50 font-medium animate-pulse transition-all duration-300">
        {statusText}
      </p>
    </div>
  );
}
