import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useFinance } from "../../context/FinanceContext";
import SystemNotice from "../../components/SystemNotice";
import BASE_URL from "../../api/config";

export default function Register() {
  const { executeRegister } = useFinance();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSub = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const success = await executeRegister(name, email, password);
      if (success) {
        navigate("/");
      } else {
        setError("Registration failed. Please check your details.");
      }
    } catch (err) {
      setError(err.message || "An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    window.location.href = `${BASE_URL}/api/auth/google`;
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#e3e3e3] flex items-center justify-center p-4 md:p-8 font-sans relative overflow-hidden selection:bg-white/10">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-radial-gradient from-white/[0.01] to-transparent blur-3xl pointer-events-none" />

      <div
        className={`relative w-full max-w-[420px] bg-[#111111] border border-white/[0.04] rounded-xl p-8 md:p-12 shadow-2xl transition-all duration-700 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        {/* Logo Mark */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-6 h-6 border border-white/20 rounded-md flex items-center justify-center bg-white/[0.02]">
            <svg
              className="w-3.5 h-3.5 text-white/70"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 9l9-6 9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1z" />
            </svg>
          </div>
          <span className="text-md text-white/90 font-medium tracking-tight">
            Financia
          </span>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-medium tracking-tight text-white">
            Create Account
          </h2>
          <p className="text-xs text-white/30 mt-1">
            Begin your financial journey
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/5 border border-red-500/10 text-red-400 text-xs rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSub} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/60 block">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#161616] border border-white/[0.05] rounded-lg text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-white/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-white/60 block">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#161616] border border-white/[0.05] rounded-lg text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-white/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-white/60 block">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#161616] border border-white/[0.05] rounded-lg text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-white/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 bg-[#1c1c1e] hover:bg-[#242426] disabled:opacity-40 text-white font-medium text-sm rounded-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer border border-white/[0.03]"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="flex items-center gap-4 py-4">
          <span className="flex-1 h-[1px] bg-white/[0.05]" />
          <span className="text-xs text-white/20">Or</span>
          <span className="flex-1 h-[1px] bg-white/[0.05]" />
        </div>

        {/* Google Sign Up Button */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          className="w-full py-3 bg-transparent hover:bg-white/[0.02] text-white/80 hover:text-white font-medium text-sm rounded-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer border border-white/[0.08]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span>Sign up with Google</span>
        </button>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-xs text-white/40 hover:text-white transition-colors"
          >
            Already have an account?{" "}
            <span className="text-[#10b981] font-medium hover:underline">
              Sign In
            </span>
          </Link>
        </div>
      </div>

      <SystemNotice />
    </div>
  );
}
