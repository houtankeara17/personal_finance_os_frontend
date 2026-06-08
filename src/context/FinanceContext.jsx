import React, { createContext, useContext, useState, useEffect } from "react";
import BASE_URL from "../api/config";

const FinanceContext = createContext();

export const FinanceProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const [theme, setTheme] = useState(user?.theme || "theme-obsidian");
  const [notices, setNotices] = useState([]);

  const [expenses, setExpenses] = useState([]);
  const [savings, setSavings] = useState([]);
  const [plans, setPlans] = useState([]);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    if (user?.theme) {
      setTheme(user.theme);
    }
  }, [user]);

  const syncHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const addNotice = (message, type = "success") => {
    const id = Date.now();
    const cleanMessage = String(
      message || "Operation processed.",
    ).toUpperCase();

    setNotices((prev) => {
      if (prev.some((n) => n.message === cleanMessage)) return prev;
      return [...prev, { id, message: cleanMessage, type }];
    });

    setTimeout(() => {
      setNotices((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  const triggerFetchCycle = async (overrideToken) => {
    const activeToken = overrideToken || token;
    if (!activeToken) return;

    try {
      const baseUrl = `${BASE_URL}/api`;
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${activeToken}`,
      };

      const [resExp, resSav, resPln, resNot] = await Promise.all([
        fetch(`${baseUrl}/expenses`, { headers }).then((r) =>
          r.ok ? r.json() : { success: false, data: [] },
        ),
        fetch(`${baseUrl}/savings`, { headers }).then((r) =>
          r.ok ? r.json() : { success: false, data: [] },
        ),
        fetch(`${baseUrl}/plans`, { headers }).then((r) =>
          r.ok ? r.json() : { success: false, data: [] },
        ),
        fetch(`${baseUrl}/notes`, { headers }).then((r) =>
          r.ok ? r.json() : { success: false, data: [] },
        ),
      ]);

      if (resExp?.success) setExpenses(resExp.data);
      if (resSav?.success) setSavings(resSav.data);
      if (resPln?.success) setPlans(resPln.data);
      if (resNot?.success) setNotes(resNot.data);
    } catch (err) {
      console.error("Sync error details:", err);
    }
  };

  useEffect(() => {
    if (token) triggerFetchCycle();
  }, [token]);

  const executeLogin = async (email, password) => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }).then((r) => r.json());

      if (res.success) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        addNotice(`Welcome back, ${res.user.name}`, "success");
        return { success: true };
      } else {
        addNotice(res.message || "Login failed.", "error");
        return { success: false, message: res.message };
      }
    } catch (err) {
      addNotice("Server connection failed.", "error");
      return { success: false, message: "Server connection failed." };
    }
  };

  const executeRegister = async (name, email, password) => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      }).then((r) => r.json());

      if (res.success) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        addNotice("Account space instantiated successfully.", "success");
        return { success: true };
      } else {
        addNotice(res.message || "Registration failed.", "error");
        return { success: false, message: res.message };
      }
    } catch (err) {
      console.error("Registration failed:", err);
      addNotice("Registration failed.", "error");
      return { success: false, message: "Server communication loss." };
    }
  };

  // ─── UPGRADED UNIFIED OAUTH INITIALIZER ──────────────────────────────────
  const executeOAuthSuccess = async (receivedToken) => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${receivedToken}` },
      });

      if (!res.ok) throw new Error("OAuth identity request refused");

      const payload = await res.json();
      const derivedUser = payload.user || payload.data;

      if (!derivedUser) throw new Error("Profile node parsing layout mismatch");

      localStorage.setItem("token", receivedToken);
      localStorage.setItem("user", JSON.stringify(derivedUser));

      setUser(derivedUser);
      setToken(receivedToken);

      setExpenses([]);
      setSavings([]);
      setPlans([]);
      setNotes([]);

      addNotice(
        `Authorized successfully. Welcome, ${derivedUser.name}`,
        "success",
      );
      return { success: true };
    } catch (err) {
      console.error("OAuth Context Loop Failure:", err);
      addNotice("OAuth synchronization failed.", "error");
      return {
        success: false,
        message: err.message || "OAuth synchronization failed.",
      };
    }
  };

  const updateProfile = async (payload) => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/profile`, {
        method: "PUT",
        headers: syncHeaders(),
        body: JSON.stringify(payload),
      }).then((r) => r.json());

      if (res.success) {
        const updatedUser = res.data;
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        if (updatedUser.theme) setTheme(updatedUser.theme);
      }
    } catch (err) {
      console.error("Profile update failed:", err);
    }
  };

  // ─── RESTRUCTURED LOGOUT PIPELINE ────────────────────────────────────────
  const logOut = () => {
    // 1. Instantly display the notification toast window safely
    addNotice("Session lifecycle terminated.", "info");

    // 2. Clear out local device tracking memory straight away
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // 3. Keep data state structures alive for 400ms so the user can easily see the toast
    setTimeout(() => {
      setToken("");
      setUser(null);
      setExpenses([]);
      setSavings([]);
      setPlans([]);
      setNotes([]);
    }, 400);
  };

  return (
    <FinanceContext.Provider
      value={{
        token,
        user,
        theme,
        notices,
        expenses,
        savings,
        plans,
        notes,
        executeLogin,
        executeRegister,
        executeOAuthSuccess,
        updateProfile,
        logOut,
        addNotice,
        triggerFetchCycle,
        syncHeaders,
      }}
    >
      {children}

      {/* ⚡ FORTIFIED FLOATING TERMINAL NOTIFICATION ENGINE ⚡ */}
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 999999,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          pointerEvents: "none",
        }}
      >
        {notices.map((n) => {
          let bgColor = "#18181b";
          let textColor = "#e4e4e7";
          let borderColor = "rgba(255,255,255,0.08)";

          if (n.type === "success") {
            bgColor = "#022c22";
            textColor = "#34d399";
            borderColor = "rgba(16,185,129,0.3)";
          } else if (n.type === "error") {
            bgColor = "#450a0a";
            textColor = "#f87171";
            borderColor = "rgba(239,68,68,0.3)";
          } else if (n.type === "info") {
            bgColor = "#09334f";
            textColor = "#38bdf8";
            borderColor = "rgba(14,165,233,0.3)";
          }

          return (
            <div
              key={n.id}
              style={{
                pointerEvents: "auto",
                padding: "14px 18px",
                borderRadius: "6px",
                background: bgColor,
                color: textColor,
                border: `1px solid ${borderColor}`,
                fontFamily: "'DM Mono', monospace",
                fontSize: "11px",
                fontWeight: "500",
                letterSpacing: "0.05em",
                minWidth: "260px",
                boxShadow: "0 10px 30px -10px rgba(0,0,0,0.7)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: "700" }}>
                {n.type === "success" ? "✓" : n.type === "error" ? "✗" : "•"}
              </span>
              <span style={{ textTransform: "uppercase" }}>
                {String(n.message)}
              </span>
            </div>
          );
        })}
      </div>
    </FinanceContext.Provider>
  );
};

export const useFinance = () => useContext(FinanceContext);
