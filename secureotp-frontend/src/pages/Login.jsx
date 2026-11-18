
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShieldCheck,
  Mail,
  ArrowRight,
  Sparkles,
  LockKeyhole,
} from "lucide-react";

import { loginRequest } from "../api";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(
    location.state?.email ||
    sessionStorage.getItem("pendingLoginEmail") ||
    ""
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Request login OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await loginRequest({
        email: email.trim(),
      });

      sessionStorage.setItem(
        "pendingLoginEmail",
        email.trim()
      );

      setSuccess(
        response.data.message || "Login OTP sent successfully!"
      );

      navigate("/login/verify-otp", {
        state: { email: email.trim() },
      });

    } catch (err) {
      console.error("Login OTP request error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to send login OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">

      {/* Decorative background */}
      <div className="login-orb login-orb-one" />
      <div className="login-orb login-orb-two" />

      <div className="login-layout">

        {/* Left introduction */}
        <section className="login-showcase">

          <Link to="/register" className="login-brand">
            <span className="login-brand-icon">
              <ShieldCheck size={25} />
            </span>
            <span>SecureOTP</span>
          </Link>

          <div className="login-showcase-content">

            <div className="login-badge">
              <Sparkles size={15} />
              <span>WELCOME BACK</span>
            </div>

            <h1>
              Security that
              <br />
              <span>works for you.</span>
            </h1>

            <p className="login-showcase-description">
              Access your account confidently with secure
              email OTP verification and protected sessions.
            </p>

            <div className="login-feature-list">

              <div className="login-feature">
                <span className="login-feature-icon">
                  <ShieldCheck size={19} />
                </span>

                <div>
                  <strong>Secure sign in</strong>
                  <span>Authentication protected by OTP</span>
                </div>
              </div>

              <div className="login-feature">
                <span className="login-feature-icon">
                  <Mail size={19} />
                </span>

                <div>
                  <strong>Email verification</strong>
                  <span>A one-time code sent to your inbox</span>
                </div>
              </div>

              <div className="login-feature">
                <span className="login-feature-icon">
                  <LockKeyhole size={19} />
                </span>

                <div>
                  <strong>Protected sessions</strong>
                  <span>Secure access using JWT authentication</span>
                </div>
              </div>

            </div>

          </div>

          <div className="login-showcase-footer">
            <span className="login-footer-dot" />
            Your account security matters
          </div>

        </section>

        {/* Email login card */}
        <section className="login-form-section">

          <div className="login-card">

            <div className="login-card-heading">

              <div className="login-card-logo">
                <ShieldCheck size={29} />
              </div>

              <span className="login-card-eyebrow">
                SECURE ACCESS
              </span>

              <h2>Welcome back</h2>

              <p>
                Sign in securely using email OTP authentication.
              </p>

            </div>

            {/* Error message */}
            {error && (
              <div
                className="login-alert login-alert-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Success message */}
            {success && (
              <div
                className="login-alert login-alert-success"
                role="status"
              >
                {success}
              </div>
            )}

            {/* Email form */}
            <form
              className="login-form"
              onSubmit={handleRequestOtp}
            >

              <div className="login-field">

                <label htmlFor="login-email">
                  Email Address
                </label>

                <div className="login-input-wrapper">
                  <Mail size={18} />

                  <input
                    id="login-email"
                    type="email"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={254}
                    autoComplete="email"
                    required
                  />
                </div>

              </div>

              <button
                type="submit"
                className="login-submit"
                disabled={loading}
              >
                <span>
                  {loading ? "Sending OTP..." : "Send Login OTP"}
                </span>

                {!loading && <ArrowRight size={18} />}
              </button>

            </form>

            {/* Account options */}
            <div className="login-divider">
              <span />
              <p>ACCOUNT OPTIONS</p>
              <span />
            </div>

            <p className="login-link-row">
              <Link to="/forgot-password">
                Forgot password?
              </Link>
            </p>

            <p className="login-signup">
              Don't have an account?
              <Link to="/register"> Create account</Link>
            </p>

            {/* Security footer */}
            <div className="login-security-note">
              <ShieldCheck size={15} />
              Your login is protected with secure authentication.
            </div>

          </div>

        </section>

      </div>
    </main>
  );
}

export default Login;
