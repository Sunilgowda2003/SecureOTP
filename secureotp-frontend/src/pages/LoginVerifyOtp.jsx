
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

import { loginRequest, loginVerify } from "../api";
import { useAuth } from "../context/AuthContext";

function LoginVerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const email =
    location.state?.email ||
    sessionStorage.getItem("pendingLoginEmail") ||
    "";

  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Resend countdown
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown((previous) => previous - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // Verify login OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email) {
      setError("Login email is missing. Please request a new OTP.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const response = await loginVerify({
        email: email.trim(),
        code: otp,
      });

      const { accessToken } = response.data;

      if (!accessToken) {
        throw new Error("Access token was not returned by the server.");
      }

      login(accessToken, email.trim());

      sessionStorage.removeItem("pendingLoginEmail");

      setSuccess(
        response.data.message || "Login successful!"
      );

      navigate("/dashboard", { replace: true });

    } catch (err) {
      console.error("Login verification error:", err);

      setError(
        err.response?.data?.message ||
        err.message ||
        "OTP verification failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Resend login OTP
  const handleResendOtp = async () => {
    setError("");
    setSuccess("");

    try {
      setLoading(true);

      const response = await loginRequest({
        email: email.trim(),
      });

      setOtp("");
      setCountdown(60);

      setSuccess(
        response.data.message || "A new OTP has been sent."
      );

    } catch (err) {
      console.error("Resend OTP error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to resend OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = () => {
    navigate("/login", {
      state: { email },
    });
  };

  return (
    <main className="login-page">

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
              <span>IDENTITY VERIFICATION</span>
            </div>

            <h1>
              Your security.
              <br />
              <span>Our priority.</span>
            </h1>

            <p className="login-showcase-description">
              Verify your identity using the one-time code
              sent to your registered email address.
            </p>

            <div className="login-feature-list">

              <div className="login-feature">
                <span className="login-feature-icon">
                  <Mail size={19} />
                </span>
                <div>
                  <strong>Check your inbox</strong>
                  <span>Find your latest login verification code</span>
                </div>
              </div>

              <div className="login-feature">
                <span className="login-feature-icon">
                  <LockKeyhole size={19} />
                </span>
                <div>
                  <strong>Verify your identity</strong>
                  <span>Enter your six-digit security code</span>
                </div>
              </div>

              <div className="login-feature">
                <span className="login-feature-icon">
                  <ShieldCheck size={19} />
                </span>
                <div>
                  <strong>Access your account</strong>
                  <span>Continue with protected authentication</span>
                </div>
              </div>

            </div>
          </div>

          <div className="login-showcase-footer">
            <span className="login-footer-dot" />
            Your account security matters
          </div>

        </section>

        {/* OTP verification card */}
        <section className="login-form-section">

          <div className="login-card">

            <div className="login-card-heading">

              <div className="login-card-logo">
                <ShieldCheck size={29} />
              </div>

              <span className="login-card-eyebrow">
                IDENTITY VERIFICATION
              </span>

              <h2>Verify your login</h2>

              <p>
                Enter the verification code sent to your email.
              </p>

            </div>

            {/* Email display */}
            <div className="login-email-display">

              <span className="login-email-icon">
                <Mail size={18} />
              </span>

              <div>
                <span>Verification code sent to</span>
                <strong>
                  {email || "Email address unavailable"}
                </strong>
              </div>

              <button
                type="button"
                onClick={handleChangeEmail}
              >
                Change
              </button>

            </div>

            {error && (
              <div className="login-alert login-alert-error" role="alert">
                {error}
              </div>
            )}

            {success && (
              <div className="login-alert login-alert-success" role="status">
                {success}
              </div>
            )}

            <form
              className="login-form"
              onSubmit={handleVerifyOtp}
            >

              <div className="login-field">

                <label htmlFor="login-otp">
                  Enter 6-digit OTP
                </label>

                <div className="login-input-wrapper">
                  <LockKeyhole size={18} />

                  <input
                    id="login-otp"
                    type={showOtp ? "text" : "password"}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Enter your 6-digit OTP"
                    value={otp}
                    onChange={(e) =>
                      setOtp(
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6)
                      )
                    }
                    maxLength={6}
                    required
                  />

                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() =>
                      setShowOtp((previous) => !previous)
                    }
                    aria-label={showOtp ? "Hide OTP" : "Show OTP"}
                  >
                    {showOtp
                      ? <EyeOff size={18} />
                      : <Eye size={18} />}
                  </button>

                </div>

                <div className="login-otp-hint">
                  {otp.length === 6 ? (
                    <span className="login-hint-valid">
                      <CheckCircle2 size={13} />
                      Six-digit code entered
                    </span>
                  ) : (
                    <span>
                      Enter all 6 digits to continue
                    </span>
                  )}
                </div>

              </div>

              <button
                type="submit"
                className="login-submit"
                disabled={loading || otp.length !== 6 || !email}
              >
                <span>
                  {loading ? "Verifying..." : "Verify & Sign In"}
                </span>

                {!loading && <ArrowRight size={18} />}
              </button>

              <div className="login-resend-section">
                {countdown > 0 ? (
                  <p>
                    Resend OTP available in{" "}
                    <strong>{countdown}s</strong>
                  </p>
                ) : (
                  <button
                    type="button"
                    className="login-resend-button"
                    onClick={handleResendOtp}
                    disabled={loading || !email}
                  >
                    <RefreshCw size={15} />
                    Resend OTP
                  </button>
                )}
              </div>

              <button
                type="button"
                className="login-back-button"
                onClick={handleChangeEmail}
              >
                <ArrowLeft size={15} />
                Use a different email address
              </button>

            </form>

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

export default LoginVerifyOtp;
