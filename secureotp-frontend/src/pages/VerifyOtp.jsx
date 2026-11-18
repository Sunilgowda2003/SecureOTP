
import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  ShieldCheck,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

import { registerVerify } from "../api";

function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();

  const email =
    location.state?.email ||
    sessionStorage.getItem("pendingRegistrationEmail") ||
    "";

  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Registration email is missing. Please register again.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const response = await registerVerify({
        email,
        code: otp,
      });

      setSuccess(
        response.data.message || "Email verified successfully!"
      );

      setTimeout(() => {
        navigate("/login", {
          state: { email },
          replace: true,
        });
      }, 1200);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "OTP verification failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="verify-page">

      {/* Decorative background */}
      <div className="verify-orb verify-orb-one" />
      <div className="verify-orb verify-orb-two" />

      <div className="verify-layout">

        {/* Left introduction panel */}
        <section className="verify-showcase">

          <Link to="/register" className="verify-brand">
            <span className="verify-brand-icon">
              <ShieldCheck size={25} />
            </span>
            <span>SecureOTP</span>
          </Link>

          <div className="verify-showcase-content">

            <div className="verify-badge">
              <Sparkles size={15} />
              <span>ONE MORE STEP</span>
            </div>

            <h1>
              Verify your
              <br />
              <span>identity securely.</span>
            </h1>

            <p className="verify-showcase-description">
              Confirm your email address to activate your
              SecureOTP account and complete your registration.
            </p>

            <div className="verify-feature-list">

              <div className="verify-feature">
                <span className="verify-feature-icon">
                  <Mail size={19} />
                </span>
                <div>
                  <strong>Check your inbox</strong>
                  <span>Find the verification code in your email</span>
                </div>
              </div>

              <div className="verify-feature">
                <span className="verify-feature-icon">
                  <LockKeyhole size={19} />
                </span>
                <div>
                  <strong>Enter your OTP</strong>
                  <span>Use the six-digit verification code</span>
                </div>
              </div>

              <div className="verify-feature">
                <span className="verify-feature-icon">
                  <CheckCircle2 size={19} />
                </span>
                <div>
                  <strong>Activate your account</strong>
                  <span>Complete your email verification</span>
                </div>
              </div>

            </div>

          </div>

          <div className="verify-showcase-footer">
            <span className="verify-footer-dot" />
            One step closer to a secure account
          </div>

        </section>

        {/* OTP verification card */}
        <section className="verify-form-section">

          <div className="verify-card">

            <div className="verify-card-heading">

              <div className="verify-card-logo">
                <ShieldCheck size={29} />
              </div>

              <span className="verify-card-eyebrow">
                EMAIL VERIFICATION
              </span>

              <h2>Verify your email</h2>

              <p>
                Enter the six-digit code sent to your email address.
              </p>

            </div>

            {/* Email display */}
            <div className="verify-email-display">
              <span className="verify-email-icon">
                <Mail size={19} />
              </span>

              <div>
                <span>Verification email sent to</span>
                <strong>{email || "Email address unavailable"}</strong>
              </div>
            </div>

            {/* Feedback */}
            {error && (
              <div className="verify-alert verify-alert-error" role="alert">
                {error}
              </div>
            )}

            {success && (
              <div className="verify-alert verify-alert-success" role="status">
                {success}
              </div>
            )}

            <form
              className="verify-form"
              onSubmit={handleSubmit}
            >

              <div className="verify-field">

                <label htmlFor="verify-otp">
                  Enter 6-digit OTP
                </label>

                <div className="verify-input-wrapper">
                  <LockKeyhole size={18} />

                  <input
                    id="verify-otp"
                    type={showOtp ? "text" : "password"}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Enter your verification code"
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
                    className="verify-password-toggle"
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

                <div className="verify-otp-hint">
                  {otp.length === 6 ? (
                    <span className="verify-hint-valid">
                      <CheckCircle2 size={13} />
                      Six-digit code entered
                    </span>
                  ) : (
                    <span>
                      {otp.length}/6 digits entered
                    </span>
                  )}
                </div>

              </div>

              <button
                type="submit"
                className="verify-submit"
                disabled={loading || otp.length !== 6 || !email}
              >
                <span>
                  {loading ? "Verifying..." : "Verify Email"}
                </span>

                {!loading && <ArrowRight size={18} />}
              </button>

            </form>

            <div className="verify-divider">
              <span />
              <p>NEED TO MAKE A CHANGE?</p>
              <span />
            </div>

            <p className="verify-back-link">
              <Link to="/register">
                <ArrowLeft size={15} />
                Back to registration
              </Link>
            </p>

            <div className="verify-security-note">
              <ShieldCheck size={15} />
              Your verification is protected by SecureOTP.
            </div>

          </div>

        </section>

      </div>
    </main>
  );
}

export default VerifyOtp;
