
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  KeyRound,
} from "lucide-react";

import { resetPassword } from "../api";

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const email =
    location.state?.email ||
    sessionStorage.getItem("pendingPasswordResetEmail") ||
    "";

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const passwordsMatch =
    confirmPassword.length > 0 &&
    newPassword === confirmPassword;

  const passwordLengthValid =
    newPassword.length >= 12 &&
    newPassword.length <= 72;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email) {
      setError("Reset email is missing. Please request a new OTP.");
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    if (!passwordLengthValid) {
      setError("Password must contain between 12 and 72 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await resetPassword({
        email,
        code,
        newPassword,
      });

      setSuccess(
        response.data.message || "Password reset successfully!"
      );

      sessionStorage.removeItem("pendingPasswordResetEmail");

      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            message: "Password reset successfully. Please sign in.",
          },
        });
      }, 1200);

    } catch (err) {
      console.error("Password reset error:", err);

      setError(
        err.response?.data?.message ||
        "Password reset failed. Please check your OTP and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="reset-page">

      {/* Decorative background */}
      <div className="reset-orb reset-orb-one" />
      <div className="reset-orb reset-orb-two" />

      <div className="reset-layout">

        {/* Left introduction */}
        <section className="reset-showcase">

          <Link to="/register" className="reset-brand">
            <span className="reset-brand-icon">
              <ShieldCheck size={25} />
            </span>
            <span>SecureOTP</span>
          </Link>

          <div className="reset-showcase-content">

            <div className="reset-badge">
              <Sparkles size={15} />
              <span>SECURE PASSWORD RESET</span>
            </div>

            <h1>
              New password.
              <br />
              <span>Fresh start.</span>
            </h1>

            <p className="reset-showcase-description">
              Create a strong new password and restore secure
              access to your SecureOTP account.
            </p>

            <div className="reset-feature-list">

              <div className="reset-feature">
                <span className="reset-feature-icon">
                  <Mail size={19} />
                </span>
                <div>
                  <strong>Verify your email</strong>
                  <span>Use your six-digit recovery code</span>
                </div>
              </div>

              <div className="reset-feature">
                <span className="reset-feature-icon">
                  <KeyRound size={19} />
                </span>
                <div>
                  <strong>Create a strong password</strong>
                  <span>Choose a password between 12 and 72 characters</span>
                </div>
              </div>

              <div className="reset-feature">
                <span className="reset-feature-icon">
                  <ShieldCheck size={19} />
                </span>
                <div>
                  <strong>Protect your account</strong>
                  <span>Continue with secure authentication</span>
                </div>
              </div>

            </div>

          </div>

          <div className="reset-showcase-footer">
            <span className="reset-footer-dot" />
            Your account security matters
          </div>

        </section>

        {/* Reset password card */}
        <section className="reset-form-section">

          <div className="reset-card">

            <div className="reset-card-heading">

              <div className="reset-card-logo">
                <ShieldCheck size={29} />
              </div>

              <span className="reset-card-eyebrow">
                ACCOUNT RECOVERY
              </span>

              <h2>Reset Password</h2>

              <p>
                Verify your code and create a new password.
              </p>

            </div>

            {error && (
              <div
                className="reset-alert reset-alert-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className="reset-alert reset-alert-success"
                role="status"
              >
                {success}
              </div>
            )}

            {!email ? (

              <div className="reset-missing-email">
                <p>
                  Reset email is missing. Please request a new OTP.
                </p>

                <Link to="/forgot-password">
                  <ArrowLeft size={15} />
                  Back to Forgot Password
                </Link>
              </div>

            ) : (

              <>
                {/* Registered email */}
                <div className="reset-email-display">
                  <span className="reset-email-icon">
                    <Mail size={18} />
                  </span>

                  <div>
                    <span>Password reset for</span>
                    <strong>{email}</strong>
                  </div>
                </div>

                <form
                  className="reset-form"
                  onSubmit={handleSubmit}
                >

                  {/* OTP */}
                  <div className="reset-field">
                    <label htmlFor="reset-code">
                      Enter 6-digit OTP
                    </label>

                    <div className="reset-input-wrapper">
                      <KeyRound size={18} />

                      <input
                        id="reset-code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="Enter verification code"
                        value={code}
                        onChange={(e) =>
                          setCode(
                            e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6)
                          )
                        }
                        maxLength={6}
                        required
                      />
                    </div>

                    <span className="reset-field-hint">
                      {code.length === 6
                        ? "Six-digit code entered"
                        : "Enter all 6 digits"}
                    </span>
                  </div>

                  {/* New password */}
                  <div className="reset-field">
                    <label htmlFor="new-password">
                      New Password
                    </label>

                    <div className="reset-input-wrapper">
                      <Lock size={18} />

                      <input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) =>
                          setNewPassword(e.target.value)
                        }
                        minLength={12}
                        maxLength={72}
                        autoComplete="new-password"
                        required
                      />

                      <button
                        type="button"
                        className="reset-password-toggle"
                        onClick={() =>
                          setShowPassword((previous) => !previous)
                        }
                        aria-label={
                          showPassword
                            ? "Hide new password"
                            : "Show new password"
                        }
                      >
                        {showPassword
                          ? <EyeOff size={18} />
                          : <Eye size={18} />}
                      </button>
                    </div>

                    <span className="reset-field-hint">
                      {passwordLengthValid
                        ? "✓ Password length is valid"
                        : "Use 12–72 characters"}
                    </span>
                  </div>

                  {/* Confirm password */}
                  <div className="reset-field">
                    <label htmlFor="confirm-password">
                      Confirm New Password
                    </label>

                    <div className="reset-input-wrapper">
                      <Lock size={18} />

                      <input
                        id="confirm-password"
                        type={
                          showConfirmPassword ? "text" : "password"
                        }
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) =>
                          setConfirmPassword(e.target.value)
                        }
                        minLength={12}
                        maxLength={72}
                        autoComplete="new-password"
                        required
                      />

                      <button
                        type="button"
                        className="reset-password-toggle"
                        onClick={() =>
                          setShowConfirmPassword(
                            (previous) => !previous
                          )
                        }
                        aria-label={
                          showConfirmPassword
                            ? "Hide confirm password"
                            : "Show confirm password"
                        }
                      >
                        {showConfirmPassword
                          ? <EyeOff size={18} />
                          : <Eye size={18} />}
                      </button>
                    </div>

                    {confirmPassword.length > 0 && (
                      <span
                        className={
                          passwordsMatch
                            ? "reset-match-valid"
                            : "reset-match-invalid"
                        }
                      >
                        {passwordsMatch ? (
                          <>
                            <CheckCircle2 size={13} />
                            Passwords match
                          </>
                        ) : (
                          "Passwords do not match"
                        )}
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="reset-submit"
                    disabled={loading || code.length !== 6}
                  >
                    <span>
                      {loading
                        ? "Updating Password..."
                        : "Reset Password"}
                    </span>

                    {!loading && <ArrowRight size={18} />}
                  </button>

                </form>
              </>

            )}

            <div className="reset-divider">
              <span />
              <p>ACCOUNT OPTIONS</p>
              <span />
            </div>

            <p className="reset-back-link">
              <Link to="/login">
                <ArrowLeft size={15} />
                Back to Login
              </Link>
            </p>

            <div className="reset-security-note">
              <ShieldCheck size={15} />
              Your password reset is protected by SecureOTP.
            </div>

          </div>

        </section>

      </div>
    </main>
  );
}

export default ResetPassword;
