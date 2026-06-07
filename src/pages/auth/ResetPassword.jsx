import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useFinance } from "../../context/FinanceContext";

export default function ResetPassword() {
  const { addNotice } = useFinance();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    setMounted(true);
    if (!token) {
      setError(
        "Authorization token missing from the secure link redirection parameter.",
      );
    }
  }, [token]);

  const handleSub = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Cannot execute update. Transaction validation token is null.");
      return;
    }

    if (password.length < 6) {
      setError("Password length metrics must equal or exceed 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Entry fields mismatch. Credentials do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      }).then((r) => r.json());

      if (res.success) {
        setIsSuccess(true);
        if (addNotice)
          addNotice(
            "Database array profile configurations updated cleanly.",
            "success",
          );
      } else {
        setError(res.message || "Credential mutation execution dropped.");
      }
    } catch (err) {
      setError("Server connection lifecycle timeout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#e3e3e3] flex items-center justify-center p-8 relative overflow-hidden font-sans selection:bg-white/10">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-radial-gradient from-white/[0.015] to-transparent blur-3xl pointer-events-none" />

      <div
        className={`w-full max-w-sm space-y-7 transform transition-all duration-700 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-white">
            Update Password
          </h2>
          <p className="text-xs text-white/40 mt-1">
            Establish your new platform access key code properties
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-4 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-center">
            <p className="text-xs text-emerald-400 leading-relaxed">
              Security structural nodes have updated cleanly inside the cluster
              directory.
            </p>
            <Link
              to="/login"
              className="block w-full py-3 bg-white text-black font-medium text-sm rounded-lg transition-all active:scale-[0.99] hover:bg-white/90 text-center tokens-center justify-center flex"
            >
              Return to Login Interface
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSub} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/60 block">
                New Password
              </label>
              <input
                type="password"
                required
                disabled={!token || loading}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#161616] border border-white/[0.05] rounded-lg text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-white/20 disabled:opacity-30"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-white/60 block">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                disabled={!token || loading}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#161616] border border-white/[0.05] rounded-lg text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-white/20 disabled:opacity-30"
              />
            </div>

            <button
              type="submit"
              disabled={!token || loading}
              className="w-full mt-2 py-3 bg-[#1c1c1e] hover:bg-[#242426] disabled:opacity-30 text-white font-medium text-sm rounded-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer border border-white/[0.03]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Commit Password Change</span>
              )}
            </button>
          </form>
        )}

        {!isSuccess && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-xs text-white/30 hover:text-white/50 bg-transparent border-none outline-none cursor-pointer transition-colors"
            >
              Cancel execution loop
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
