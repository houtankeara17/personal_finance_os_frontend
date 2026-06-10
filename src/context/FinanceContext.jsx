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
  const [pendingNotice, setPendingNotice] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [savings, setSavings] = useState([]);
  const [plans, setPlans] = useState([]);
  const [notes, setNotes] = useState([]);
  const [salary, setSalary] = useState([]); // ← add
  const [bonus, setBonus] = useState([]); // ← add
  const [remittance, setRemittance] = useState([]); // ← add
  const [exchangelog, setExchangelog] = useState([]); // ← add

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

      const [resExp, resSav, resPln, resNot, resSal, resBon, resRem, resExc] =
        await Promise.all([
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
          fetch(`${baseUrl}/salaries`, { headers }).then((r) =>
            r.ok ? r.json() : { success: false, data: [] },
          ),
          fetch(`${baseUrl}/bonuses`, { headers }).then((r) =>
            r.ok ? r.json() : { success: false, data: [] },
          ),
          fetch(`${baseUrl}/remittances`, { headers }).then((r) =>
            r.ok ? r.json() : { success: false, data: [] },
          ),
          fetch(`${baseUrl}/exchangelog`, { headers }).then((r) =>
            r.ok ? r.json() : { success: false, data: [] },
          ),
        ]);

      if (resExp?.success) setExpenses(resExp.data);
      if (resSav?.success) setSavings(resSav.data);
      if (resPln?.success) setPlans(resPln.data);
      if (resNot?.success) setNotes(resNot.data);
      if (resSal?.success) setSalary(resSal.data);
      if (resBon?.success) setBonus(resBon.data);
      if (resRem?.success) setRemittance(resRem.data);
      if (resExc?.success) setExchangelog(resExc.data);
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
        const user = res.user || res.data;
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(user));
        setToken(res.token);
        setUser(user);
        addNotice(`Welcome back, ${user.name}`, "success");
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
        const user = res.user || res.data;
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(user));
        setToken(res.token);
        setUser(user);
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

  const updateProfileSettings = async (payload) => {
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
    setPendingNotice({
      message: "SESSION LIFECYCLE TERMINATED.",
      type: "info",
    });
    setTimeout(() => setPendingNotice(null), 4000); // ← auto clear
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setExpenses([]);
    setSavings([]);
    setPlans([]);
    setNotes([]);
    setSalary([]);
    setBonus([]);
    setRemittance([]);
    setExchangelog([]);
    setUser(null);
    setToken("");
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
        salary,
        bonus,
        remittance,
        exchangelog,
        pendingNotice,
        setPendingNotice,
        executeLogin,
        executeRegister,
        executeOAuthSuccess,
        updateProfileSettings,
        logOut,
        addNotice,
        triggerFetchCycle,
        syncHeaders,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => useContext(FinanceContext);
