
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  LogOut,
  User,
  Mail,
  Shield,
  Clock,
  CheckCircle,
  ArrowUpRight,
  LockKeyhole,
  RefreshCw,
} from "lucide-react";

import ThemeToggle from "../components/ThemeToggle";
import { getUserProfile } from "../api";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getUserProfile();

        if (active) {
          setProfile(response.data);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
            "Unable to load your profile. Your session may have expired."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      active = false;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const email = profile?.email || user?.email || "Account user";

  return (
    <main className="secure-dashboard">

      <div className="dashboard-orb dashboard-orb-one" />
      <div className="dashboard-orb dashboard-orb-two" />

      {/* Header */}
      <header className="secure-dashboard-header">

        <div className="dashboard-brand">
          <span className="dashboard-brand-icon">
            <ShieldCheck size={25} />
          </span>
          <span>SecureOTP</span>
        </div>

        <div className="dashboard-header-actions">
          <ThemeToggle />

          <button
            type="button"
            className="dashboard-logout"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            <span>Logout</span>
          </button>
        </div>

      </header>

      <div className="dashboard-content">

        {/* Welcome */}
        <section className="dashboard-welcome">

          <div className="dashboard-welcome-copy">
            <div className="dashboard-eyebrow">
              <ShieldCheck size={14} />
              SECUREOTP ACCOUNT
            </div>

            <h1>
              Welcome back,
              <br />
              <span>{email.split("@")[0]}!</span>
            </h1>

            <p>
              Manage your account and review your security
              status from your personal dashboard.
            </p>
          </div>

          <div className="dashboard-welcome-status">
            <div className="dashboard-status-icon">
              <ShieldCheck size={28} />
            </div>

            <div>
              <strong>Account protected</strong>
              <span>Your secure session is active</span>
            </div>

            <span className="dashboard-live-dot" />
          </div>

        </section>

        {/* Loading */}
        {loading && (
          <section className="dashboard-state-card">
            <RefreshCw className="dashboard-loading-icon" size={25} />
            <h2>Loading your dashboard</h2>
            <p>Retrieving your secure account information...</p>
          </section>
        )}

        {/* Error */}
        {!loading && error && (
          <section className="dashboard-state-card dashboard-error-card">
            <Shield size={27} />
            <h2>Unable to load your profile</h2>
            <p>{error}</p>

            <div className="dashboard-state-actions">
              <button onClick={handleRetry} type="button">
                <RefreshCw size={16} />
                Try again
              </button>

              <button onClick={handleLogout} type="button">
                Return to login
              </button>
            </div>
          </section>
        )}

        {/* Dashboard data */}
        {!loading && !error && profile && (
          <>

            <section className="dashboard-section-heading">
              <div>
                <span>OVERVIEW</span>
                <h2>Your account at a glance</h2>
              </div>

              <div className="dashboard-verified-label">
                <CheckCircle size={15} />
                Verified account
              </div>
            </section>

            {/* Summary cards */}
            <section className="dashboard-summary-grid">

              <article className="dashboard-summary-card">
                <div className="dashboard-summary-top">
                  <span className="dashboard-summary-icon">
                    <User size={21} />
                  </span>
                  <ArrowUpRight size={18} className="dashboard-card-arrow" />
                </div>

                <span className="dashboard-card-label">
                  ACCOUNT
                </span>

                <h3>Personal Profile</h3>

                <p className="dashboard-card-value">
                  {email}
                </p>
              </article>

              <article className="dashboard-summary-card">
                <div className="dashboard-summary-top">
                  <span className="dashboard-summary-icon">
                    <Shield size={21} />
                  </span>
                  <ArrowUpRight size={18} className="dashboard-card-arrow" />
                </div>

                <span className="dashboard-card-label">
                  SECURITY
                </span>

                <h3>Verified</h3>

                <p className="dashboard-card-value dashboard-success-text">
                  <CheckCircle size={15} />
                  Authentication active
                </p>
              </article>

              <article className="dashboard-summary-card">
                <div className="dashboard-summary-top">
                  <span className="dashboard-summary-icon">
                    <Clock size={21} />
                  </span>
                  <ArrowUpRight size={18} className="dashboard-card-arrow" />
                </div>

                <span className="dashboard-card-label">
                  SESSION
                </span>

                <h3>Secure Session</h3>

                <p className="dashboard-card-value">
                  Email OTP + JWT
                </p>
              </article>

            </section>

            {/* Profile and security */}
            <section className="dashboard-details-grid">

              <article className="dashboard-details-card">

                <div className="dashboard-panel-heading">
                  <div>
                    <span className="dashboard-panel-icon">
                      <User size={19} />
                    </span>
                  </div>

                  <div>
                    <h2>Profile Information</h2>
                    <p>Your registered account details</p>
                  </div>
                </div>

                <div className="dashboard-detail-row">
                  <span className="dashboard-detail-icon">
                    <Mail size={18} />
                  </span>

                  <div>
                    <span>Email Address</span>
                    <strong>{email}</strong>
                  </div>
                </div>

                <div className="dashboard-detail-row">
                  <span className="dashboard-detail-icon">
                    <ShieldCheck size={18} />
                  </span>

                  <div>
                    <span>Account Status</span>
                    <strong className="dashboard-inline-verified">
                      <CheckCircle size={14} />
                      Authenticated
                    </strong>
                  </div>
                </div>

                <div className="dashboard-detail-row">
                  <span className="dashboard-detail-icon">
                    <LockKeyhole size={18} />
                  </span>

                  <div>
                    <span>Authentication Method</span>
                    <strong>JWT Bearer Token</strong>
                  </div>
                </div>

              </article>

              <article className="dashboard-details-card dashboard-security-panel">

                <div className="dashboard-panel-heading">
                  <span className="dashboard-panel-icon">
                    <ShieldCheck size={19} />
                  </span>

                  <div>
                    <h2>Security Overview</h2>
                    <p>Your authentication protection</p>
                  </div>
                </div>

                <div className="dashboard-security-banner">
                  <div className="dashboard-security-banner-icon">
                    <ShieldCheck size={25} />
                  </div>

                  <div>
                    <strong>You're protected</strong>
                    <span>Your account is authenticated.</span>
                  </div>
                </div>

                <div className="dashboard-security-item">
                  <span>Email OTP verification</span>
                  <strong>
                    <CheckCircle size={14} />
                    Enabled
                  </strong>
                </div>

                <div className="dashboard-security-item">
                  <span>JWT authentication</span>
                  <strong>
                    <CheckCircle size={14} />
                    Active
                  </strong>
                </div>

              </article>

            </section>

            {/* Footer */}
            <footer className="dashboard-footer">
              <div>
                <span className="dashboard-footer-dot" />
                Your account security matters
              </div>

              <span>SecureOTP · Secure authentication</span>
            </footer>

          </>
        )}

      </div>
    </main>
  );
}

export default Dashboard;
