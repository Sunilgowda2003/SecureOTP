
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import ThemeToggle from "./components/ThemeToggle";

import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import Login from "./pages/Login";
import LoginVerifyOtp from "./pages/LoginVerifyOtp";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import "./App.css";

function AppContent() {
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";

  return (
    <>
      {!isDashboard && <ThemeToggle />}

      <Routes>
        <Route
          path="/"
          element={<Navigate to="/register" replace />}
        />

        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />

        <Route path="/login" element={<Login />} />
        <Route
          path="/login/verify-otp"
          element={<LoginVerifyOtp />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
