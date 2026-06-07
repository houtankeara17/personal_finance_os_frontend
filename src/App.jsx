import React from "react";
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
import ResetPassword from "./pages/auth/ResetPassword"; // <-- Import stays the same

// Stubs only for modules still under construction
const PlaceholderModule = ({ name }) => (
  <div className="font-mono text-[11px] p-6 text-white/30 tracking-widest border border-dashed border-white/[0.06] rounded-sm">
    SYSTEM NODE: [ {name.toUpperCase()} ] UNDER CONSTRUCTION IN ARCHITECTURE DEV
    CYCLES.
  </div>
);

export default function App() {
  return (
    <FinanceProvider>
      <BrowserRouter>
        <Routes>
          {/* =========================================================================
              🔓 PUBLIC AUTHENTICATION CONTROL BOUNDARY (Accessible without being logged in)
             ========================================================================= */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />

          {/* ✅ MOVE RESET PASSWORD HERE OUTSIDE THE APPLAYOUT SHIELD! 👇 */}
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* =========================================================================
              🔒 SECURE PRODUCTION CORE CLUSTER LAYOUT FRAMEWORK (Requires Active Token)
             ========================================================================= */}
          <Route path="/" element={<AppLayout />}>
            {/* ✅ Overview — live */}
            <Route index element={<Overview />} />

            {/* ✅ Expenses — live */}
            <Route path="expenses" element={<Expenses />} />

            {/* ✅ Notes — live */}
            <Route path="note" element={<Notes />} />

            {/* ✅ Bonus — live */}
            <Route path="bonus" element={<Bonus />} />

            {/* ✅ Salary — live */}
            <Route path="salary" element={<Salary />} />

            {/* ✅ Savings — live */}
            <Route path="saving" element={<Saving />} />

            {/* ✅ Exchange Rate Log — live */}
            <Route path="exchangelog" element={<Exchangelog />} />

            {/* ✅ Remittance Tracker — live */}
            <Route path="remittance" element={<Remittance />} />

            <Route path="plans" element={<Plans />} />

            {/* 🚧 Future Modules */}
            <Route path="setting" element={<Setting />} />

            {/* Catch-all fallback redirect within secure layout context */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </FinanceProvider>
  );
}
