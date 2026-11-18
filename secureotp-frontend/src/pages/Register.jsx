
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Mail,
  User,
  LockKeyhole,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

import { registerRequest } from "../api";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { name, email, password, confirmPassword } = formData;

    if (!name.trim() || !email.trim() || !password) {
      setError("Please complete all required fields.");
      return;
    }

    if (password.length < 12 || password.length > 72) {
      setError("Password must contain between 12 and 72 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await registerRequest({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      setSuccess(
        response.data.message || "Registration successful. OTP sent!"
      );

      sessionStorage.setItem(
        "pendingRegistrationEmail",
        email.trim()
      );

      navigate("/verify-otp", {
        state: {
          email: email.trim(),
          purpose: "REGISTER",
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Registration request failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const passwordLengthValid =
    formData.password.length >= 12 &&
    formData.password.length <= 72;

  const passwordsMatch =
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;

  return (
    <main className="register-page">

      {/* Decorative background */}
      <div className="register-orb register-orb-one" />
      <div className="register-orb register-orb-two" />

      <div className="register-layout">

        {/* Left introduction panel */}
        <section className="register-showcase">

          <Link to="/register" className="register-brand">
            <span className="register-brand-icon">
              <ShieldCheck size={25} />
            </span>
            <span>SecureOTP</span>
          </Link>

          <div className="register-showcase-content">

            <div className="register-badge">
              <Sparkles size={15} />
              <span>SECURITY MADE SIMPLE</span>
            </div>

            <h1>
              Your security.
              <br />
              <span>Your control.</span>
            </h1>

            <p className="register-showcase-description">
              Experience a safer way to access your account
              with email OTP verification and secure
              authentication.
            </p>

            <div className="register-feature-list">

              <div className="register-feature">
                <span className="register-feature-icon">
                  <ShieldCheck size={19} />
                </span>
                <div>
                  <strong>Secure authentication</strong>
                  <span>Protected access to your account</span>
                </div>
              </div>

              <div className="register-feature">
                <span className="register-feature-icon">
                  <Mail size={19} />
                </span>
                <div>
                  <strong>Email OTP verification</strong>
                  <span>Verify your identity with a code</span>
                </div>
              </div>

              <div className="register-feature">
                <span className="register-feature-icon">
                  <LockKeyhole size={19} />
                </span>
                <div>
                  <strong>Protected sessions</strong>
                  <span>Secure token-based authentication</span>
                </div>
              </div>

            </div>

          </div>

          <div className="register-showcase-footer">
            <span className="register-footer-dot" />
            Built for a more secure digital experience
          </div>

        </section>

        {/* Registration form */}
        <section className="register-form-section">

          <div className="register-card">

            <div className="register-card-heading">

              <div className="register-card-logo">
                <ShieldCheck size={30} />
              </div>

              <span className="register-card-eyebrow">
                GET STARTED
              </span>

              <h2>Create your account</h2>

              <p>
                Join SecureOTP and protect your account.
              </p>

            </div>

            {error && (
              <div className="register-alert register-alert-error">
                {error}
              </div>
            )}

            {success && (
              <div className="register-alert register-alert-success">
                {success}
              </div>
            )}

            <form
              className="register-form"
              onSubmit={handleSubmit}
            >

              {/* Full name */}
              <div className="register-field">

                <label htmlFor="register-name">
                  Full Name
                </label>

                <div className="register-input-wrapper">
                  <User size={18} />

                  <input
                    id="register-name"
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    maxLength={100}
                    autoComplete="name"
                    required
                  />
                </div>

              </div>

              {/* Email */}
              <div className="register-field">

                <label htmlFor="register-email">
                  Email Address
                </label>

                <div className="register-input-wrapper">
                  <Mail size={18} />

                  <input
                    id="register-email"
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    maxLength={254}
                    autoComplete="email"
                    required
                  />
                </div>

              </div>

              {/* Password */}
              <div className="register-field">

                <label htmlFor="register-password">
                  Password
                </label>

                <div className="register-input-wrapper">
                  <LockKeyhole size={18} />

                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Minimum 12 characters"
                    value={formData.password}
                    onChange={handleChange}
                    minLength={12}
                    maxLength={72}
                    autoComplete="new-password"
                    required
                  />

                  <button
                    type="button"
                    className="register-password-toggle"
                    onClick={() =>
                      setShowPassword((previous) => !previous)
                    }
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword
                      ? <EyeOff size={18} />
                      : <Eye size={18} />}
                  </button>
                </div>

                <div className="register-password-hint">
                  <span
                    className={
                      passwordLengthValid
                        ? "register-hint-valid"
                        : ""
                    }
                  >
                    {passwordLengthValid && <CheckCircle2 size={13} />}
                    12–72 characters
                  </span>
                </div>

              </div>

              {/* Confirm password */}
              <div className="register-field">

                <label htmlFor="register-confirm-password">
                  Confirm Password
                </label>

                <div className="register-input-wrapper">
                  <LockKeyhole size={18} />

                  <input
                    id="register-confirm-password"
                    type={
                      showConfirmPassword ? "text" : "password"
                    }
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    minLength={12}
                    maxLength={72}
                    autoComplete="new-password"
                    required
                  />

                  <button
                    type="button"
                    className="register-password-toggle"
                    onClick={() =>
                      setShowConfirmPassword((previous) => !previous)
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

                {formData.confirmPassword.length > 0 && (
                  <div
                    className={
                      passwordsMatch
                        ? "register-match-hint register-hint-valid"
                        : "register-match-hint"
                    }
                  >
                    {passwordsMatch
                      ? "Passwords match"
                      : "Passwords do not match"}
                  </div>
                )}

              </div>

              {/* Submit */}
              <button
                type="submit"
                className="register-submit"
                disabled={loading}
              >
                <span>
                  {loading ? "Creating account..." : "Create Account"}
                </span>

                {!loading && <ArrowRight size={18} />}
              </button>

            </form>

            <div className="register-divider">
              <span />
              <p>ALREADY HAVE AN ACCOUNT?</p>
              <span />
            </div>

            <p className="register-signin">
              Welcome back?
              <Link to="/login"> Sign in</Link>
            </p>

            <div className="register-security-note">
              <ShieldCheck size={15} />
              Your information is handled securely.
            </div>

          </div>

        </section>

      </div>
    </main>
  );
}

export default Register;
