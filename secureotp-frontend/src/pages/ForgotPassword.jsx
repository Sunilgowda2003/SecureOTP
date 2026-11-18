
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Mail,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Sparkles,
  LockKeyhole,
  CheckCircle2,
} from "lucide-react";

import { forgotPassword } from "../api";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Resend OTP countdown
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown((previous) => previous - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // Request password reset OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your registered email.");
      return;
    }

    try {
      setLoading(true);

      const response = await forgotPassword({
        email: email.trim(),
      });

      sessionStorage.setItem(
        "pendingPasswordResetEmail",
        email.trim()
      );

      setOtpSent(true);
      setCountdown(60);

      setSuccess(
        response.data.message ||
        "Password reset OTP sent successfully!"
      );
    } catch (err) {
      console.error("Forgot password error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to send password reset OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Continue to reset password
  const handleContinue = () => {
    navigate("/reset-password", {
      state: {
        email: email.trim(),
        purpose: "RESET_PASSWORD",
      },
    });
  };

  // Resend password reset OTP
  const handleResendOtp = async () => {
    setError("");
    setSuccess("");

    try {
      setLoading(true);

      const response = await forgotPassword({
        email: email.trim(),
      });

      setCountdown(60);

      setSuccess(
        response.data.message ||
        "A new password reset OTP has been sent."
      );
    } catch (err) {
      console.error("Resend password reset OTP error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to resend OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="forgot-page">

      {/* Decorative background */}
      <div className="forgot-orb forgot-orb-one" />
      <div className="forgot-orb forgot-orb-two" />

      <div className="forgot-layout">

        {/* Left introduction panel */}
        <section className="forgot-showcase">

          <Link to="/register" className="forgot-brand">
            <span className="forgot-brand-icon">
              <ShieldCheck size={25} />
            </span>
            <span>SecureOTP</span>
          </Link>

          <div className="forgot-showcase-content">

            <div className="forgot-badge">
              <Sparkles size={15} />
              <span>ACCOUNT RECOVERY</span>
            </div>

            <h1>
              Regain access.
              <br />
              <span>Stay secure.</span>
            </h1>

            <p className="forgot-showcase-description">
              Forgot your password? Recover your account
              securely with email-based OTP verification.
            </p>

            <div className="forgot-feature-list">

              <div className="forgot-feature">
                <span className="forgot-feature-icon">
                  <Mail size={19} />
                </span>
                <div>
                  <strong>Email verification</strong>
                  <span>Receive a password reset code</span>
                </div>
              </div>

              <div className="forgot-feature">
                <span className="forgot-feature-icon">
                  <LockKeyhole size={19} />
                </span>
                <div>
                  <strong>Secure recovery</strong>
                  <span>Verify your identity before resetting</span>
                </div>
              </div>

              <div className="forgot-feature">
                <span className="forgot-feature-icon">
                  <ShieldCheck size={19} />
                </span>
                <div>
                  <strong>Protected account</strong>
                  <span>Restore access securely</span>
                </div>
              </div>

            </div>

          </div>

          <div className="forgot-showcase-footer">
            <span className="forgot-footer-dot" />
            Your account security matters
          </div>

        </section>

        {/* Password recovery card */}
        <section className="forgot-form-section">

          <div className="forgot-card">

            <div className="forgot-card-heading">

              <div className="forgot-card-logo">
                <ShieldCheck size={29} />
              </div>

              <span className="forgot-card-eyebrow">
                PASSWORD RECOVERY
              </span>

              <h2>
                {otpSent ? "Check your email" : "Forgot password?"}
              </h2>

              <p>
                {otpSent
                  ? "Your password reset code has been requested."
                  : "Enter your registered email to recover your account."}
              </p>

            </div>

            {error && (
              <div
                className="forgot-alert forgot-alert-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className="forgot-alert forgot-alert-success"
                role="status"
              >
                {success}
              </div>
            )}

            <form
              className="forgot-form"
              onSubmit={handleRequestOtp}
            >

              <div className="forgot-field">

                <label htmlFor="forgot-email">
                  Email Address
                </label>

                <div className="forgot-input-wrapper">
                  <Mail size={18} />

                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={254}
                    autoComplete="email"
                    disabled={otpSent}
                    required
                  />

                </div>

              </div>

              {!otpSent ? (

                <button
                  type="submit"
                  className="forgot-submit"
                  disabled={loading}
                >
                  <span>
                    {loading ? "Sending OTP..." : "Send Reset OTP"}
                  </span>

                  {!loading && <ArrowRight size={18} />}
                </button>

              ) : (

                <>
                  <div className="forgot-email-confirmation">
                    <CheckCircle2 size={17} />
                    <span>
                      Reset code requested for your email address.
                    </span>
                  </div>

                  <button
                    type="button"
                    className="forgot-submit"
                    onClick={handleContinue}
                  >
                    <span>Continue to Reset Password</span>
                    <ArrowRight size={18} />
                  </button>

                  <div className="forgot-resend-section">
                    {countdown > 0 ? (
                      <p>
                        Resend OTP available in{" "}
                        <strong>{countdown}s</strong>
                      </p>
                    ) : (
                      <button
                        type="button"
                        className="forgot-resend-button"
                        onClick={handleResendOtp}
                        disabled={loading}
                      >
                        <RefreshCw size={15} />
                        Resend OTP
                      </button>
                    )}
                  </div>
                </>

              )}

            </form>

            <div className="forgot-divider">
              <span />
              <p>ACCOUNT OPTIONS</p>
              <span />
            </div>

            <p className="forgot-back-link">
              <Link to="/login">
                <ArrowLeft size={15} />
                Back to Login
              </Link>
            </p>

            <div className="forgot-security-note">
              <ShieldCheck size={15} />
              Your account recovery is protected by SecureOTP.
            </div>

          </div>

        </section>

      </div>
    </main>
  );
}

export default ForgotPassword;
