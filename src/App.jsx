import React, { useEffect } from "react"; // <-- FIXED: Added useEffect here
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FinanceProvider } from "./context/FinanceContext";
import AppLayout from "./layouts/AppLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import OAuthCallback from "./pages/auth/OAuthCallback";
import Overview from "./pages/overview/Overview";
import Expenses from "./pages/expenses/Expenses";
import Notes from "./pages/notes/Notes";
import Salary from "./pages/salary/Salary";
import Saving from "./pages/saving/Saving";
import Bonus from "./pages/bonus/Bonus";
import Plans from "./pages/plans/Plans";
import Exchangelog from "./pages/exchangelog/Exchangelog";
import Remittance from "./pages/remittance/Remittance";
import Setting from "./pages/auth/Setting";
import ResetPassword from "./pages/auth/ResetPassword";

// Stubs only for modules still under construction
const PlaceholderModule = ({ name }) => (
  <div className="font-mono text-[11px] p-6 text-white/30 tracking-widest border border-dashed border-white/[0.06] rounded-sm">
    SYSTEM NODE: [ {name.toUpperCase()} ] UNDER CONSTRUCTION IN ARCHITECTURE DEV
    CYCLES.
  </div>
);

// Helper component to update document title dynamically
const PageTitle = ({ title, children }) => {
  useEffect(() => {
    document.title = `${title} | Personal Finance OS`;
  }, [title]);

  return children;
};

export default function App() {
  return (
    <FinanceProvider>
      <BrowserRouter>
        <Routes>
          {/* =========================================================================
              🔓 PUBLIC AUTHENTICATION CONTROL BOUNDARY
             ========================================================================= */}
          <Route
            path="/login"
            element={
              <PageTitle title="Login">
                <Login />
              </PageTitle>
            }
          />
          <Route
            path="/register"
            element={
              <PageTitle title="Register">
                <Register />
              </PageTitle>
            }
          />
          <Route
            path="/oauth-callback"
            element={
              <PageTitle title="Authenticating...">
                <OAuthCallback />
              </PageTitle>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PageTitle title="Reset Password">
                <ResetPassword />
              </PageTitle>
            }
          />

          {/* =========================================================================
              🔒 SECURE PRODUCTION CORE CLUSTER LAYOUT FRAMEWORK
             ========================================================================= */}
          <Route path="/" element={<AppLayout />}>
            {/* ✅ Overview — live */}
            <Route
              index
              element={
                <PageTitle title="Dashboard">
                  <Overview />
                </PageTitle>
              }
            />

            {/* ✅ Expenses — live */}
            <Route
              path="expenses"
              element={
                <PageTitle title="Expenses">
                  <Expenses />
                </PageTitle>
              }
            />

            {/* ✅ Notes — live */}
            <Route
              path="note"
              element={
                <PageTitle title="Notes">
                  <Notes />
                </PageTitle>
              }
            />

            {/* ✅ Bonus — live */}
            <Route
              path="bonus"
              element={
                <PageTitle title="Bonus Tracks">
                  <Bonus />
                </PageTitle>
              }
            />

            {/* ✅ Salary — live */}
            <Route
              path="salary"
              element={
                <PageTitle title="Salary Management">
                  <Salary />
                </PageTitle>
              }
            />

            {/* ✅ Savings — live */}
            <Route
              path="saving"
              element={
                <PageTitle title="Savings">
                  <Saving />
                </PageTitle>
              }
            />

            {/* ✅ Exchange Rate Log — live */}
            <Route
              path="exchangelog"
              element={
                <PageTitle title="Exchange Logs">
                  <Exchangelog />
                </PageTitle>
              }
            />

            {/* ✅ Remittance Tracker — live */}
            <Route
              path="remittance"
              element={
                <PageTitle title="Remittance Tracker">
                  <Remittance />
                </PageTitle>
              }
            />

            <Route
              path="plans"
              element={
                <PageTitle title="Financial Plans">
                  <Plans />
                </PageTitle>
              }
            />

            {/* 🚧 Future Modules */}
            <Route
              path="setting"
              element={
                <PageTitle title="Settings">
                  <Setting />
                </PageTitle>
              }
            />

            {/* Catch-all fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </FinanceProvider>
  );
}
