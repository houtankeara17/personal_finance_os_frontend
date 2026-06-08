import React, { useState, useRef, useEffect } from "react";
import { useFinance } from "../../context/FinanceContext";
import BASE_URL from "../../api/config";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Palette,
  Lock,
  Upload,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Shield,
  Mail,
  Check,
  DollarSign,
} from "lucide-react";

const THEMES = [
  {
    id: "theme-obsidian",
    label: "Obsidian",
    bg: "#090a0f",
    surface: "#12131a",
    accent: "#10b981",
    preview: ["#090a0f", "#12131a", "#10b981"],
  },
  {
    id: "theme-slate",
    label: "Slate",
    bg: "#121214",
    surface: "#1a1a1e",
    accent: "#818cf8",
    preview: ["#121214", "#1a1a1e", "#818cf8"],
  },
  {
    id: "theme-nord",
    label: "Nord",
    bg: "#0d1117",
    surface: "#161b22",
    accent: "#38bdf8",
    preview: ["#0d1117", "#161b22", "#38bdf8"],
  },
  {
    id: "theme-crimson",
    label: "Crimson",
    bg: "#0e0a0a",
    surface: "#1a1010",
    accent: "#ef4444",
    preview: ["#0e0a0a", "#1a1010", "#ef4444"],
  },
  {
    id: "theme-violet",
    label: "Violet",
    bg: "#0b0a12",
    surface: "#13111e",
    accent: "#a78bfa",
    preview: ["#0b0a12", "#13111e", "#a78bfa"],
  },
  {
    id: "theme-amber",
    label: "Amber",
    bg: "#0e0b07",
    surface: "#191208",
    accent: "#f59e0b",
    preview: ["#0e0b07", "#191208", "#f59e0b"],
  },
];

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸" },
  { code: "KHR", symbol: "៛", name: "Cambodian Riel", flag: "🇰🇭" },
  { code: "THB", symbol: "฿", name: "Thai Baht", flag: "🇹🇭" },
  // { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺" },
  // { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧" },
  // { code: "JPY", symbol: "¥", name: "Japanese Yen", flag: "🇯🇵" },
  // { code: "SGD", symbol: "S$", name: "Singapore Dollar", flag: "🇸🇬" },
];

let _tid = 0;
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (opts) => {
    const id = ++_tid;
    setToasts((p) => [...p, { id, ...opts }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  };
  return { toasts, add };
}

function ToastBar({ toasts }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        display: "flex",
        flexDirection: "column-reverse",
        gap: 8,
        zIndex: 99999,
        maxWidth: "calc(100vw - 48px)",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background:
              t.type === "success"
                ? "#0f2d1f"
                : t.type === "error"
                  ? "#2d0f0f"
                  : "#1a1a2e",
            border: `1px solid ${t.type === "success" ? "#10b98144" : t.type === "error" ? "#ef444444" : "#ffffff22"}`,
            borderRadius: 10,
            padding: "12px 16px",
            minWidth: 240,
            animation: "fadeUp 0.25s ease-out",
          }}
        >
          {t.type === "success" ? (
            <CheckCircle2 size={14} color="#10b981" />
          ) : t.type === "error" ? (
            <AlertCircle size={14} color="#ef4444" />
          ) : (
            <Mail size={14} color="#818cf8" />
          )}
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 600,
                color: "#fff",
                fontFamily: "monospace",
              }}
            >
              {t.title}
            </p>
            {t.desc && (
              <p
                style={{
                  margin: 0,
                  fontSize: 10,
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: "monospace",
                }}
              >
                {t.desc}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: "block",
          fontFamily: "monospace",
          fontSize: 9,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.3)",
          marginBottom: 7,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", suffix }) {
  return (
    <div style={{ position: "relative" }}>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: suffix ? "10px 42px 10px 12px" : "10px 12px",
          borderRadius: 7,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.25)",
          color: "#fff",
          fontFamily: "monospace",
          fontSize: 12,
          outline: "none",
          boxSizing: "border-box",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.2)")}
        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
      />
      {suffix && (
        <span
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}

export default function Setting() {
  const { user, theme, updateProfile } = useFinance();
  const navigate = useNavigate();
  const { toasts, add } = useToast();
  const [tab, setTab] = useState("profile");
  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [currency, setCurrency] = useState(user?.currency || "USD");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const [selTheme, setSelTheme] = useState(theme || "theme-obsidian");
  const [savingTheme, setSavingTheme] = useState(false);
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confPw, setConfPw] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [fpEmail, setFpEmail] = useState(user?.email || "");
  const [fpSent, setFpSent] = useState(false);
  const [sendingFp, setSendingFp] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const activeMeta = THEMES.find((t) => t.id === selTheme) || THEMES[0];
  const accent = activeMeta.accent;
  const activeCurrency =
    CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setAvatar(user.avatar || "");
      setCurrency(user.currency || "USD");
    }
    if (theme) setSelTheme(theme);
  }, [user, theme]);

  const strength = (() => {
    if (!newPw) return 0;
    let s = 0;
    if (newPw.length >= 8) s++;
    if (/[A-Z]/.test(newPw)) s++;
    if (/[0-9]/.test(newPw)) s++;
    if (/[^A-Za-z0-9]/.test(newPw)) s++;
    return s;
  })();
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"][
    strength
  ];

  const handleAvatarFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onloadend = () => setAvatar(r.result);
    r.readAsDataURL(f);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ name, avatar, currency, theme: selTheme });
      add({
        type: "success",
        title: "Profile saved",
        desc: "Your identity has been updated.",
      });
    } catch {
      add({ type: "error", title: "Save failed", desc: "Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const saveTheme = async () => {
    setSavingTheme(true);
    try {
      await updateProfile({ name, avatar, currency, theme: selTheme });
      add({
        type: "success",
        title: "Theme applied",
        desc: `${activeMeta.label} is now active.`,
      });
    } catch {
      add({ type: "error", title: "Failed", desc: "Could not apply theme." });
    } finally {
      setSavingTheme(false);
    }
  };

  const savePassword = async () => {
    if (!curPw) return add({ type: "error", title: "Enter current password" });
    if (newPw.length < 8)
      return add({
        type: "error",
        title: "Too short",
        desc: "Minimum 8 characters.",
      });
    if (newPw !== confPw)
      return add({ type: "error", title: "Passwords don't match" });
    setSavingPw(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      add({
        type: "success",
        title: "Password updated",
        desc: "Your password has been changed.",
      });
      setCurPw("");
      setNewPw("");
      setConfPw("");
    } catch {
      add({ type: "error", title: "Incorrect current password" });
    } finally {
      setSavingPw(false);
    }
  };

  const sendForgotPassword = async () => {
    if (!fpEmail) return add({ type: "error", title: "Enter your email" });
    setSendingFp(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      setFpSent(true);
      add({
        type: "info",
        title: "Reset email sent",
        desc: `Check ${fpEmail}`,
      });
    } catch {
      add({ type: "error", title: "Could not send email" });
    } finally {
      setSendingFp(false);
    }
  };

  const TABS = [
    { id: "profile", label: "Profile", Icon: User },
    { id: "theme", label: "Theme", Icon: Palette },
    { id: "security", label: "Security", Icon: Lock },
  ];

  const card = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 10,
    padding: "20px 20px",
    marginBottom: 14,
  };

  const primaryBtn = (loading) => ({
    padding: "9px 22px",
    borderRadius: 7,
    fontFamily: "monospace",
    fontSize: 10,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    fontWeight: 700,
    cursor: loading ? "wait" : "pointer",
    border: "none",
    background: loading ? "rgba(255,255,255,0.06)" : accent,
    color: loading ? "rgba(255,255,255,0.3)" : "#000",
    opacity: loading ? 0.6 : 1,
    transition: "all 0.15s",
    boxShadow: loading ? "none" : `0 0 18px ${accent}44`,
  });

  const eyeBtn = {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "rgba(255,255,255,0.3)",
    padding: 0,
    display: "flex",
    alignItems: "center",
  };

  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "OP";

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideIn { from { opacity:0; transform:translateX(-8px) } to { opacity:1; transform:translateX(0) } }
        * { box-sizing: border-box; }
        body { background: ${activeMeta.bg}; margin: 0; }
        ::-webkit-scrollbar { width: 3px } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 4px }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2); }
        select option { background: #1a1a2e; color: #fff; }

        /* Responsive nav */
        .settings-layout { display: flex; gap: 20px; align-items: flex-start; }
        .settings-sidebar { width: 210px; flex-shrink: 0; }
        .settings-main { flex: 1; min-width: 0; }
        .mobile-tab-bar { display: none; }

        @media (max-width: 680px) {
          .settings-layout { flex-direction: column; gap: 0; }
          .settings-sidebar { display: none; }
          .settings-main { width: 100%; }
          .mobile-tab-bar { display: flex; }
          .page-header { padding: 14px 16px !important; }
          .page-body { padding: 16px !important; }
          .profile-hero { flex-direction: column; text-align: center; }
          .currency-grid { grid-template-columns: 1fr 1fr !important; }
        }

        @media (min-width: 681px) and (max-width: 900px) {
          .settings-sidebar { width: 170px; }
          .page-body { padding: 20px 16px !important; }
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: activeMeta.bg,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          className="page-header"
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            padding: "16px 28px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 7,
              padding: "7px 12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            <ArrowLeft size={12} />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 9,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              Back
            </span>
          </button>

          <div>
            <h1
              style={{
                margin: 0,
                fontFamily: "monospace",
                fontSize: 14,
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "0.04em",
              }}
            >
              Settings
            </h1>
            <p
              style={{
                margin: 0,
                fontFamily: "monospace",
                fontSize: 8,
                color: "rgba(255,255,255,0.22)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                marginTop: 1,
              }}
            >
              Workspace Configuration
            </p>
          </div>

          {/* Live theme pill */}
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 20,
              padding: "5px 12px",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: accent,
                boxShadow: `0 0 6px ${accent}`,
              }}
            />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 9,
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              {activeMeta.label}
            </span>
          </div>
        </div>

        {/* Mobile tab bar */}
        <div
          className="mobile-tab-bar"
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(0,0,0,0.2)",
            padding: "6px 16px",
            gap: 4,
          }}
        >
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flex: 1,
                padding: "8px 6px",
                border: "none",
                background: tab === id ? `${accent}18` : "transparent",
                borderRadius: 7,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                borderBottom:
                  tab === id ? `2px solid ${accent}` : "2px solid transparent",
              }}
            >
              <Icon
                size={14}
                color={tab === id ? accent : "rgba(255,255,255,0.35)"}
              />
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 8,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: tab === id ? "#fff" : "rgba(255,255,255,0.35)",
                  fontWeight: tab === id ? 700 : 400,
                }}
              >
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div
          className="page-body"
          style={{
            flex: 1,
            maxWidth: 860,
            margin: "0 auto",
            width: "100%",
            padding: "28px 24px",
          }}
        >
          <div className="settings-layout">
            {/* Sidebar */}
            <div className="settings-sidebar">
              <div
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 12,
                  padding: 10,
                  position: "sticky",
                  top: 24,
                }}
              >
                {/* Profile card in sidebar */}
                <div
                  style={{
                    padding: "16px 10px 18px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{ position: "relative", cursor: "pointer" }}
                      onClick={() => fileRef.current?.click()}
                    >
                      {avatar ? (
                        <img
                          src={avatar}
                          alt="Avatar"
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: 12,
                            objectFit: "cover",
                            border: `2px solid ${accent}55`,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: 12,
                            background: `${accent}22`,
                            border: `2px solid ${accent}44`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: 16,
                              fontWeight: 700,
                              color: accent,
                            }}
                          >
                            {initials}
                          </span>
                        </div>
                      )}
                      <span
                        style={{
                          position: "absolute",
                          bottom: -3,
                          right: -3,
                          width: 18,
                          height: 18,
                          borderRadius: 5,
                          background: accent,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: `2px solid ${activeMeta.bg}`,
                        }}
                      >
                        <Upload size={8} color="#000" />
                      </span>
                    </div>

                    <div style={{ textAlign: "center" }}>
                      <p
                        style={{
                          margin: "0 0 4px",
                          fontFamily: "monospace",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#fff",
                        }}
                      >
                        {name || "Operator"}
                      </p>
                      {/* Currency badge */}
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          background: "rgba(255,255,255,0.06)",
                          borderRadius: 20,
                          padding: "3px 9px",
                        }}
                      >
                        <span style={{ fontSize: 11 }}>
                          {activeCurrency.flag}
                        </span>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: 9,
                            color: accent,
                            letterSpacing: "0.1em",
                            fontWeight: 700,
                          }}
                        >
                          {activeCurrency.code}
                        </span>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: 9,
                            color: "rgba(255,255,255,0.35)",
                          }}
                        >
                          {activeCurrency.symbol}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {TABS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 7,
                      border: "none",
                      cursor: "pointer",
                      background:
                        tab === id ? "rgba(255,255,255,0.05)" : "transparent",
                      marginBottom: 2,
                      transition: "all 0.15s",
                    }}
                  >
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background:
                          tab === id ? `${accent}22` : "rgba(255,255,255,0.04)",
                        flexShrink: 0,
                      }}
                    >
                      <Icon
                        size={12}
                        color={tab === id ? accent : "rgba(255,255,255,0.3)"}
                      />
                    </span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 10,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        fontWeight: 600,
                        color: tab === id ? "#fff" : "rgba(255,255,255,0.35)",
                      }}
                    >
                      {label}
                    </span>
                    {tab === id && (
                      <div
                        style={{
                          marginLeft: "auto",
                          width: 3,
                          height: 16,
                          borderRadius: 2,
                          background: accent,
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Main */}
            <div className="settings-main">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFile}
                style={{ display: "none" }}
              />

              {/* ── PROFILE TAB ── */}
              {tab === "profile" && (
                <div style={{ animation: "slideIn 0.2s ease-out" }}>
                  <p
                    style={{
                      margin: "0 0 18px",
                      fontFamily: "monospace",
                      fontSize: 9,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.3)",
                    }}
                  >
                    Operator Identity
                  </p>

                  {/* Avatar + name hero */}
                  <div style={{ ...card, marginBottom: 14 }}>
                    <div
                      className="profile-hero"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 18,
                        marginBottom: 20,
                      }}
                    >
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        {avatar ? (
                          <img
                            src={avatar}
                            alt="Avatar"
                            style={{
                              width: 72,
                              height: 72,
                              borderRadius: 14,
                              objectFit: "cover",
                              border: `2px solid ${accent}44`,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 72,
                              height: 72,
                              borderRadius: 14,
                              background: `${accent}18`,
                              border: `2px solid ${accent}33`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "monospace",
                                fontSize: 24,
                                fontWeight: 700,
                                color: accent,
                              }}
                            >
                              {initials}
                            </span>
                          </div>
                        )}
                        <button
                          onClick={() => fileRef.current?.click()}
                          style={{
                            position: "absolute",
                            bottom: -4,
                            right: -4,
                            width: 24,
                            height: 24,
                            borderRadius: 7,
                            background: accent,
                            border: `2px solid ${activeMeta.bg}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                        >
                          <Upload size={10} color="#000" />
                        </button>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            margin: "0 0 3px",
                            fontFamily: "monospace",
                            fontSize: 16,
                            fontWeight: 700,
                            color: "#fff",
                          }}
                        >
                          {name || "Operator"}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: 10,
                              color: "rgba(255,255,255,0.3)",
                            }}
                          >
                            Base currency:
                          </span>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: 10,
                              color: accent,
                              fontWeight: 700,
                            }}
                          >
                            {activeCurrency.flag} {activeCurrency.code} —{" "}
                            {activeCurrency.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Field label="Display Name">
                      <TextInput
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                      />
                    </Field>
                  </div>

                  {/* Currency picker — visual grid */}
                  <div style={card}>
                    <p
                      style={{
                        margin: "0 0 14px",
                        fontFamily: "monospace",
                        fontSize: 9,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      Base Currency
                    </p>
                    <div
                      className="currency-grid"
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(110px, 1fr))",
                        gap: 8,
                      }}
                    >
                      {CURRENCIES.map((c) => {
                        const active = currency === c.code;
                        return (
                          <button
                            key={c.code}
                            onClick={() => setCurrency(c.code)}
                            style={{
                              padding: "10px 10px 9px",
                              borderRadius: 8,
                              cursor: "pointer",
                              textAlign: "left",
                              background: active
                                ? `${accent}16`
                                : "rgba(0,0,0,0.2)",
                              border: active
                                ? `1.5px solid ${accent}66`
                                : "1px solid rgba(255,255,255,0.06)",
                              transition: "all 0.15s",
                              position: "relative",
                            }}
                          >
                            <div style={{ fontSize: 20, marginBottom: 5 }}>
                              {c.flag}
                            </div>
                            <div
                              style={{
                                fontFamily: "monospace",
                                fontSize: 10,
                                fontWeight: 700,
                                color: active
                                  ? accent
                                  : "rgba(255,255,255,0.6)",
                                letterSpacing: "0.08em",
                              }}
                            >
                              {c.code}
                            </div>
                            <div
                              style={{
                                fontFamily: "monospace",
                                fontSize: 9,
                                color: "rgba(255,255,255,0.25)",
                                marginTop: 1,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {c.symbol} {c.name}
                            </div>
                            {active && (
                              <span
                                style={{
                                  position: "absolute",
                                  top: 7,
                                  right: 7,
                                  width: 16,
                                  height: 16,
                                  borderRadius: "50%",
                                  background: accent,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Check size={9} color="#000" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      style={primaryBtn(saving)}
                    >
                      {saving ? "Saving…" : "Save Profile"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── THEME TAB ── */}
              {tab === "theme" && (
                <div style={{ animation: "slideIn 0.2s ease-out" }}>
                  <p
                    style={{
                      margin: "0 0 18px",
                      fontFamily: "monospace",
                      fontSize: 9,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.3)",
                    }}
                  >
                    Appearance
                  </p>

                  <div style={card}>
                    <p
                      style={{
                        margin: "0 0 16px",
                        fontFamily: "monospace",
                        fontSize: 9,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.25)",
                      }}
                    >
                      Color Theme
                    </p>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(130px, 1fr))",
                        gap: 10,
                      }}
                    >
                      {THEMES.map((t) => {
                        const active = selTheme === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => setSelTheme(t.id)}
                            style={{
                              position: "relative",
                              padding: 0,
                              border: active
                                ? `2px solid ${t.accent}`
                                : "2px solid rgba(255,255,255,0.06)",
                              borderRadius: 12,
                              cursor: "pointer",
                              overflow: "hidden",
                              background: t.bg,
                              transition: "all 0.15s",
                              boxShadow: active
                                ? `0 0 20px ${t.accent}30`
                                : "none",
                            }}
                          >
                            {/* Color preview bands */}
                            <div style={{ height: 52, display: "flex" }}>
                              <div style={{ flex: 2, background: t.bg }} />
                              <div style={{ flex: 1, background: t.surface }} />
                              <div
                                style={{ width: 10, background: t.accent }}
                              />
                            </div>
                            {/* Label row */}
                            <div
                              style={{
                                padding: "8px 10px 9px",
                                borderTop: `1px solid rgba(255,255,255,0.06)`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: "monospace",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  letterSpacing: "0.1em",
                                  textTransform: "uppercase",
                                  color: active
                                    ? "#fff"
                                    : "rgba(255,255,255,0.45)",
                                }}
                              >
                                {t.label}
                              </span>
                              <span
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: "50%",
                                  background: t.accent,
                                  boxShadow: active
                                    ? `0 0 8px ${t.accent}`
                                    : "none",
                                  flexShrink: 0,
                                }}
                              />
                            </div>
                            {active && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: 7,
                                  left: 7,
                                  width: 18,
                                  height: 18,
                                  borderRadius: "50%",
                                  background: t.accent,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Check size={10} color="#000" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active theme showcase */}
                  <div
                    style={{
                      ...card,
                      background: activeMeta.surface,
                      border: `1px solid ${accent}28`,
                      padding: "16px 18px",
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 9,
                          background: `${accent}22`,
                          border: `1px solid ${accent}44`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Palette size={15} color={accent} />
                      </div>
                      <div>
                        <p
                          style={{
                            margin: "0 0 2px",
                            fontFamily: "monospace",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#fff",
                          }}
                        >
                          Active: {activeMeta.label}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                          }}
                        >
                          {activeMeta.preview.map((c, i) => (
                            <span
                              key={i}
                              style={{
                                display: "inline-block",
                                width: i === 2 ? 24 : 16,
                                height: 10,
                                borderRadius: 3,
                                background: c,
                                border: "1px solid rgba(255,255,255,0.1)",
                              }}
                            />
                          ))}
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: 9,
                              color: "rgba(255,255,255,0.3)",
                              letterSpacing: "0.1em",
                            }}
                          >
                            {accent.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          marginLeft: "auto",
                          fontFamily: "monospace",
                          fontSize: 9,
                          color: "rgba(255,255,255,0.2)",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                        }}
                      >
                        Preview
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={saveTheme}
                      disabled={savingTheme}
                      style={primaryBtn(savingTheme)}
                    >
                      {savingTheme ? "Applying…" : "Apply Theme"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── SECURITY TAB ── */}
              {tab === "security" && (
                <div style={{ animation: "slideIn 0.2s ease-out" }}>
                  <p
                    style={{
                      margin: "0 0 18px",
                      fontFamily: "monospace",
                      fontSize: 9,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.3)",
                    }}
                  >
                    Security
                  </p>

                  {/* Change password */}
                  <div style={card}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 18,
                      }}
                    >
                      <span
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: `${accent}18`,
                          border: `1px solid ${accent}33`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Shield size={13} color={accent} />
                      </span>
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontFamily: "monospace",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#fff",
                          }}
                        >
                          Update Password
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontFamily: "monospace",
                            fontSize: 9,
                            color: "rgba(255,255,255,0.25)",
                            letterSpacing: "0.08em",
                          }}
                        >
                          Change your account password
                        </p>
                      </div>
                    </div>

                    <Field label="Current Password">
                      <TextInput
                        type={showCur ? "text" : "password"}
                        value={curPw}
                        onChange={(e) => setCurPw(e.target.value)}
                        placeholder="••••••••"
                        suffix={
                          <button
                            style={eyeBtn}
                            onClick={() => setShowCur((v) => !v)}
                          >
                            {showCur ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        }
                      />
                    </Field>
                    <Field label="New Password">
                      <TextInput
                        type={showNew ? "text" : "password"}
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        placeholder="••••••••"
                        suffix={
                          <button
                            style={eyeBtn}
                            onClick={() => setShowNew((v) => !v)}
                          >
                            {showNew ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        }
                      />
                      {newPw && (
                        <div style={{ marginTop: 8 }}>
                          <div
                            style={{ display: "flex", gap: 3, marginBottom: 4 }}
                          >
                            {[1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                style={{
                                  flex: 1,
                                  height: 2,
                                  borderRadius: 2,
                                  background:
                                    i <= strength
                                      ? strengthColor
                                      : "rgba(255,255,255,0.08)",
                                  transition: "background 0.3s",
                                }}
                              />
                            ))}
                          </div>
                          <p
                            style={{
                              margin: 0,
                              fontFamily: "monospace",
                              fontSize: 9,
                              color: strengthColor,
                            }}
                          >
                            {strengthLabel}
                          </p>
                        </div>
                      )}
                    </Field>
                    <Field label="Confirm New Password">
                      <TextInput
                        type={showConf ? "text" : "password"}
                        value={confPw}
                        onChange={(e) => setConfPw(e.target.value)}
                        placeholder="••••••••"
                        suffix={
                          <button
                            style={eyeBtn}
                            onClick={() => setShowConf((v) => !v)}
                          >
                            {showConf ? (
                              <EyeOff size={13} />
                            ) : (
                              <Eye size={13} />
                            )}
                          </button>
                        }
                      />
                      {confPw && newPw !== confPw && (
                        <p
                          style={{
                            margin: "5px 0 0",
                            fontFamily: "monospace",
                            fontSize: 9,
                            color: "#ef4444",
                          }}
                        >
                          Passwords do not match
                        </p>
                      )}
                      {confPw && newPw === confPw && (
                        <p
                          style={{
                            margin: "5px 0 0",
                            fontFamily: "monospace",
                            fontSize: 9,
                            color: "#10b981",
                          }}
                        >
                          ✓ Passwords match
                        </p>
                      )}
                    </Field>

                    <div
                      style={{ display: "flex", justifyContent: "flex-end" }}
                    >
                      <button
                        onClick={savePassword}
                        disabled={savingPw}
                        style={primaryBtn(savingPw)}
                      >
                        {savingPw ? "Updating…" : "Update Password"}
                      </button>
                    </div>
                  </div>

                  {/* Forgot password */}
                  <div
                    style={{
                      ...card,
                      borderColor: fpSent
                        ? `${accent}33`
                        : "rgba(255,255,255,0.07)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 16,
                      }}
                    >
                      <span
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: "rgba(129,140,248,0.12)",
                          border: "1px solid rgba(129,140,248,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Mail size={13} color="#818cf8" />
                      </span>
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontFamily: "monospace",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#fff",
                          }}
                        >
                          Forgot Password
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontFamily: "monospace",
                            fontSize: 9,
                            color: "rgba(255,255,255,0.25)",
                            letterSpacing: "0.08em",
                          }}
                        >
                          Send a reset link to your email
                        </p>
                      </div>
                    </div>

                    {fpSent ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "12px 14px",
                          borderRadius: 8,
                          background: "rgba(16,185,129,0.08)",
                          border: "1px solid rgba(16,185,129,0.2)",
                        }}
                      >
                        <CheckCircle2 size={14} color="#10b981" />
                        <div style={{ flex: 1 }}>
                          <p
                            style={{
                              margin: 0,
                              fontFamily: "monospace",
                              fontSize: 11,
                              color: "#10b981",
                              fontWeight: 700,
                            }}
                          >
                            Reset email sent!
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontFamily: "monospace",
                              fontSize: 9,
                              color: "rgba(255,255,255,0.35)",
                            }}
                          >
                            Check{" "}
                            <span style={{ color: "#fff" }}>{fpEmail}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => setFpSent(false)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontFamily: "monospace",
                            fontSize: 9,
                            color: "rgba(255,255,255,0.3)",
                            letterSpacing: "0.1em",
                          }}
                        >
                          Resend
                        </button>
                      </div>
                    ) : (
                      <>
                        <Field label="Email Address">
                          <TextInput
                            value={fpEmail}
                            onChange={(e) => setFpEmail(e.target.value)}
                            placeholder="you@example.com"
                            type="email"
                          />
                        </Field>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            onClick={sendForgotPassword}
                            disabled={sendingFp}
                            style={{
                              padding: "9px 22px",
                              borderRadius: 7,
                              fontFamily: "monospace",
                              fontSize: 10,
                              letterSpacing: "0.15em",
                              textTransform: "uppercase",
                              fontWeight: 700,
                              cursor: sendingFp ? "wait" : "pointer",
                              border: "1px solid rgba(129,140,248,0.3)",
                              background: sendingFp
                                ? "rgba(255,255,255,0.04)"
                                : "rgba(129,140,248,0.1)",
                              color: sendingFp
                                ? "rgba(255,255,255,0.3)"
                                : "#818cf8",
                            }}
                          >
                            {sendingFp ? "Sending…" : "Send Reset Link"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ToastBar toasts={toasts} />
    </>
  );
}
