import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";

/* ─── Toast Component ─────────────────────────────────────────────────────── */
function Toast({ toasts, removeToast }) {
  return (
    <div style={styles.toastContainer}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            ...styles.toast,
            ...(t.type === "error" ? styles.toastError : styles.toastSuccess),
            animation: t.leaving
              ? "toastOut 0.3s ease forwards"
              : "toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards",
          }}
        >
          <span style={styles.toastIcon}>
            {t.type === "error" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="rgba(239,68,68,0.2)" stroke="#f87171" strokeWidth="1.5" />
                <path d="M12 8v4M12 16h.01" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="rgba(34,197,94,0.2)" stroke="#4ade80" strokeWidth="1.5" />
                <path d="M8 12l3 3 5-5" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          <span style={styles.toastMsg}>{t.message}</span>
          <button style={styles.toastClose} onClick={() => removeToast(t.id)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div
            style={{
              ...styles.toastProgress,
              background: t.type === "error" ? "#f87171" : "#4ade80",
              animation: `toastProgress ${t.duration}ms linear forwards`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

/* ─── useToast hook ───────────────────────────────────────────────────────── */
function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "error", duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration, leaving: false }]);
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 300);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  };

  return { toasts, addToast, removeToast };
}

/* ─── Firebase error → human message ─────────────────────────────────────── */
function parseFirebaseError(code) {
  const map = {
    "auth/user-not-found": "No account found with this email address.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/invalid-credential": "Invalid credentials. Check your email and password.",
    "auth/user-disabled": "This account has been disabled. Contact support.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/network-request-failed": "Network error. Check your internet connection.",
  };
  return map[code] || "Something went wrong. Please try again.";
}

/* ─── Main Login Component ────────────────────────────────────────────────── */
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { toasts, addToast, removeToast } = useToast();
  const nav = useNavigate();

  const handleLogin = async () => {
    if (!email.trim()) {
      addToast("Please enter your email address.", "error");
      return;
    }
    if (!password) {
      addToast("Please enter your password.", "error");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      addToast("Signed in successfully!", "success", 2000);
      setTimeout(() => nav("/dashboard"), 600);
    } catch (err) {
      addToast(parseFirebaseError(err.code), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <>
      <style>{globalCSS}</style>
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="login-root">
        {/* Background grid + glows */}
        <div className="bg-grid" />
        <div className="glow glow-1" />
        <div className="glow glow-2" />
        <div className="glow glow-3" />

        <div className="login-layout">
          {/* Left panel — branding (hidden on mobile) */}
          <div className="brand-panel">
            <div className="brand-inner">
              <div className="brand-logo">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M2 8.5L12 3l10 5.5v7L12 21 2 15.5V8.5z" fill="url(#lg)" opacity="0.9"/>
                  <path d="M12 3v18M2 8.5l10 7 10-7" stroke="#fff" strokeWidth="1" opacity="0.3"/>
                  <defs>
                    <linearGradient id="lg" x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#818cf8"/><stop offset="1" stopColor="#c084fc"/>
                    </linearGradient>
                  </defs>
                </svg>
                <span className="brand-name">Expenzo</span>
              </div>
              <h2 className="brand-headline">Track every rupee,<br />own every goal.</h2>
              <p className="brand-sub">Smart expense tracking with real‑time insights to keep your finances on point.</p>
              <div className="brand-stats">
                {[["₹2.4Cr", "tracked monthly"], ["98%", "uptime"], ["50K+", "active users"]].map(([val, label]) => (
                  <div className="stat-item" key={label}>
                    <span className="stat-val">{val}</span>
                    <span className="stat-label">{label}</span>
                  </div>
                ))}
              </div>
             {/* <div className="brand-card">
                <div className="card-chip" />
                <div className="card-lines">
                  <div className="card-line" />
                  <div className="card-line short" />
                </div>
                <div className="card-number">•••• •••• •••• 4291</div>
                <div className="card-footer">
                  <span>Expense Card</span>
                  <svg width="38" height="24" viewBox="0 0 38 24"><circle cx="15" cy="12" r="12" fill="#ef4444" opacity=".7"/><circle cx="23" cy="12" r="12" fill="#f97316" opacity=".7"/></svg>
                </div>
              </div>*/}
            </div>
          </div>

          {/* Right panel — form */}
          <div className="form-panel">
            <div className="form-card">
              {/* Mobile logo */}
              <div className="mobile-logo">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M2 8.5L12 3l10 5.5v7L12 21 2 15.5V8.5z" fill="url(#lgm)" opacity="0.9"/>
                  <defs><linearGradient id="lgm" x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse"><stop stopColor="#818cf8"/><stop offset="1" stopColor="#c084fc"/></linearGradient></defs>
                </svg>
                <span>Expenzo</span>
              </div>

              <h1 className="form-title">Welcome back</h1>
              <p className="form-subtitle">Sign in to your account to continue</p>

              <div className="fields">
                {/* Email */}
                <div className="field">
                  <label className="field-label">Email address</label>
                  <div className={`input-wrap ${focusedField === "email" ? "focused" : ""}`}>
                    <span className="input-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </span>
                    <input
                      className="text-input"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="field">
                  <div className="field-label-row">
                    <label className="field-label">Password</label>
                    <button className="forgot-btn" tabIndex={-1}>Forgot password?</button>
                  </div>
                  <div className={`input-wrap ${focusedField === "password" ? "focused" : ""}`}>
                    <span className="input-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </span>
                    <input
                      className="text-input"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      autoComplete="current-password"
                    />
                    <button
                      className="eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      type="button"
                    >
                      {showPassword ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  className={`login-btn ${loading ? "loading" : ""}`}
                  onClick={handleLogin}
                  disabled={loading}
                  type="button"
                >
                  {loading ? (
                    <span className="spinner" />
                  ) : (
                    <>
                      Sign in
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginLeft: 8 }}>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </>
                  )}
                </button>
              </div>

              <div className="divider"><span /><em>or</em><span /></div>

              <p className="signup-row">
                Don't have an account?{" "}
                <button className="signup-link" onClick={() => nav("/signup")}>
                  Create one free →
                </button>
              </p>

              <p className="terms-note">
                By signing in you agree to our{" "}
                <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const styles = {
  toastContainer: {
    position: "fixed",
    top: 20,
    right: 20,
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    maxWidth: 360,
    width: "calc(100vw - 40px)",
  },
  toast: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "13px 14px",
    borderRadius: 12,
    backdropFilter: "blur(16px)",
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  },
  toastError: {
    background: "rgba(20,10,10,0.92)",
    border: "1px solid rgba(248,113,113,0.3)",
  },
  toastSuccess: {
    background: "rgba(10,20,12,0.92)",
    border: "1px solid rgba(74,222,128,0.3)",
  },
  toastIcon: { flexShrink: 0, display: "flex", alignItems: "center" },
  toastMsg: {
    flex: 1,
    fontSize: 13.5,
    color: "#e2e8f0",
    fontFamily: "'DM Sans', sans-serif",
    lineHeight: 1.45,
    fontWeight: 450,
  },
  toastClose: {
    flexShrink: 0,
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: 2,
    borderRadius: 4,
  },
  toastProgress: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 2,
    width: "100%",
    transformOrigin: "left",
  },
};

const globalCSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Syne:wght@600;700;800&display=swap');
@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@500;700&family=Roboto+Slab:wght@100..900&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@500;700&family=Roboto+Slab:wght@100..900&display=swap");


:root {
  --indigo: #6366f1;
  --purple: #8b5cf6;
  --bg: #05080f;
  --card-bg: rgba(12,18,32,0.9);
  --surface: rgba(20,28,46,0.7);
  --border: rgba(99,102,241,0.18);
  --text: #e2e8f0;
  --muted: #64748b;
  --subtle: #1e293b;
}

body { font-family: 'DM Sans', sans-serif; }

/* ── Animations ── */
@keyframes toastIn  { from { opacity:0; transform:translateX(24px) scale(.96) } to { opacity:1; transform:translateX(0) scale(1) } }
@keyframes toastOut { from { opacity:1; transform:translateX(0) scale(1) } to { opacity:0; transform:translateX(24px) scale(.96) } }
@keyframes toastProgress { from { transform:scaleX(1) } to { transform:scaleX(0) } }
@keyframes spin { to { transform: rotate(360deg) } }
@keyframes fadeUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
@keyframes glow1  { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(40px,-30px)scale(1.1)} }
@keyframes glow2  { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(-30px,40px)scale(1.12)} }
@keyframes glow3  { 0%,100%{transform:translate(0,0)} 60%{transform:translate(20px,-20px)} }
@keyframes cardFloat { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-8px) rotate(-2deg)} }
@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

/* ── Layout root ── */
.login-root {
  min-height: 100vh;
  background: var(--bg);
  display: flex;
  align-items: stretch;
  position: relative;
  overflow: hidden;
}

.bg-grid {
  position: absolute; inset: 0; z-index: 0;
  background-image: linear-gradient(rgba(99,102,241,.04) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(99,102,241,.04) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
}

.glow { position: absolute; border-radius: 50%; pointer-events: none; z-index: 0; }
.glow-1 { width:600px; height:600px; top:-180px; left:-120px; background:radial-gradient(circle, rgba(99,102,241,.18) 0%, transparent 70%); animation: glow1 9s ease-in-out infinite; }
.glow-2 { width:500px; height:500px; bottom:-150px; right:-80px; background:radial-gradient(circle, rgba(168,85,247,.16) 0%, transparent 70%); animation: glow2 11s ease-in-out infinite; }
.glow-3 { width:350px; height:350px; top:40%; right:30%; background:radial-gradient(circle, rgba(34,211,238,.08) 0%, transparent 70%); animation: glow3 13s ease-in-out infinite; }

/* ── Two-column layout ── */
.login-layout {
  position: relative; z-index: 1;
  display: flex;
  width: 100%; min-height: 100vh;
}

/* ── Brand panel ── */
.brand-panel {
  flex: 1;
  display: none;
  background: linear-gradient(145deg, rgba(12,16,28,0.95) 0%, rgba(20,14,40,0.95) 100%);
  border-right: 1px solid var(--border);
  padding: 48px;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

@media (min-width: 900px) {
  .brand-panel { display: flex; }
}

.brand-inner { max-width: 400px; animation: fadeUp .7s ease both; }

.brand-logo {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 48px;
}
.brand-name {
  font-family: 'Roboto Slab', sans-serif;
  font-size: 28px; font-weight: 700;
  color: #f1f5f9; letter-spacing: -.5px;
}

.brand-headline {
  font-family: 'Roboto Slab', sans-serif;
  font-size: clamp(28px, 3.5vw, 38px);
  font-weight: 800; color: #f1f5f9;
  line-height: 1.2; letter-spacing: -1px;
  margin-bottom: 16px;
}

.brand-sub {
  font-size: 15px; color: var(--muted);
  line-height: 1.65; margin-bottom: 40px;
  max-width: 300px;
}

.brand-stats {
  display: flex; gap: 32px;
  margin-bottom: 48px;
  padding-bottom: 40px;
  border-bottom: 1px solid rgba(99,102,241,.15);
}
.stat-item { display: flex; flex-direction: column; gap: 3px; }
.stat-val { font-family:'Syne',sans-serif; font-size:22px; font-weight:700; color:#f1f5f9; }
.stat-label { font-size:11.5px; color:var(--muted); text-transform:uppercase; letter-spacing:.6px; }

/* decorative card */
.brand-card {
  width: 280px; height: 160px;
  background: linear-gradient(135deg, rgba(99,102,241,.25) 0%, rgba(139,92,246,.2) 100%);
  border: 1px solid rgba(99,102,241,.3);
  border-radius: 20px;
  padding: 20px;
  display: flex; flex-direction: column; justify-content: space-between;
  animation: cardFloat 5s ease-in-out infinite;
  transform: rotate(-2deg);
  backdrop-filter: blur(10px);
  position: relative; overflow: hidden;
}
.brand-card::before {
  content:''; position:absolute; inset:0;
  background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,.04) 50%, transparent 60%);
  background-size: 200% 100%;
  animation: shimmer 3s infinite;
}
.card-chip {
  width: 36px; height: 28px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border-radius: 6px; opacity: .85;
}
.card-lines { display:flex; flex-direction:column; gap:6px; margin-top:8px; }
.card-line { height:2px; background:rgba(255,255,255,.15); border-radius:2px; }
.card-line.short { width:60%; }
.card-number { font-family:'Syne',sans-serif; font-size:13px; font-weight:600; color:rgba(255,255,255,.6); letter-spacing:.5px; }
.card-footer { display:flex; justify-content:space-between; align-items:center; }
.card-footer span { font-size:11px; color:rgba(255,255,255,.4); text-transform:uppercase; letter-spacing:.5px; }

/* ── Form panel ── */
.form-panel {
  flex: none;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  min-height: 100vh;
}

@media (min-width: 900px) {
  .form-panel {
    width: 460px;
    flex: none;
    padding: 40px 36px;
  }
}

.form-card {
  width: 100%;
  max-width: 400px;
  animation: fadeUp .6s .1s ease both;
}

.mobile-logo {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 32px;
  font-family: 'Syne', sans-serif;
  font-size: 18px; font-weight: 800;
  color: #f1f5f9;
}
@media (min-width: 900px) { .mobile-logo { display: none; } }

.form-title {
  font-family: 'roboto', sans-serif;
  font-size: clamp(24px, 5vw, 30px);
  font-weight: 800; color: #f1f5f9;
  letter-spacing: -0.8px; margin-bottom: 6px;
}
.form-subtitle {
  font-size: 14px; color: var(--muted);
  margin-bottom: 32px; line-height: 1.5;
}

/* ── Fields ── */
.fields { display: flex; flex-direction: column; gap: 18px; }

.field { display: flex; flex-direction: column; gap: 8px; }

.field-label {
  font-size: 11.5px; font-weight: 600;
  color: #94a3b8; text-transform: uppercase;
  letter-spacing: .7px;
}
.field-label-row {
  display: flex; justify-content: space-between; align-items: center;
}
.forgot-btn {
  font-size: 12px; color: var(--indigo);
  background: none; border: none;
  cursor: pointer; font-family: 'DM Sans', sans-serif;
  font-weight: 500; padding: 0;
  transition: color .15s;
}
.forgot-btn:hover { color: #818cf8; }

.input-wrap {
  position: relative; display: flex; align-items: center;
  border: 1px solid var(--subtle);
  border-radius: 12px;
  background: rgba(20,28,46,.6);
  transition: border-color .2s, box-shadow .2s, background .2s;
}
.input-wrap.focused {
  border-color: var(--indigo);
  box-shadow: 0 0 0 3px rgba(99,102,241,.14);
  background: rgba(25,34,58,.7);
}

.input-icon {
  position: absolute; left: 14px;
  color: #475569;
  display: flex; align-items: center;
  pointer-events: none;
  transition: color .2s;
}
.input-wrap.focused .input-icon { color: #818cf8; }

.text-input {
  width: 100%;
  padding: 13px 14px 13px 42px;
  background: transparent;
  border: none; outline: none;
  color: var(--text);
  font-size: 14px; font-family: 'DM Sans', sans-serif;
  font-weight: 450;
  caret-color: var(--indigo);
}
.text-input::placeholder { color: #334155; }

.eye-btn {
  position: absolute; right: 12px;
  background: none; border: none;
  cursor: pointer; color: #475569;
  display: flex; align-items: center;
  padding: 4px; border-radius: 6px;
  transition: color .15s, background .15s;
}
.eye-btn:hover { color: #94a3b8; background: rgba(99,102,241,.1); }

/* ── Login button ── */
.login-btn {
  width: 100%; margin-top: 4px;
  padding: 14px;
  background: linear-gradient(135deg, var(--indigo) 0%, var(--purple) 100%);
  border: none; border-radius: 12px;
  color: #fff; font-size: 15px; font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: transform .15s, box-shadow .15s, opacity .15s;
  box-shadow: 0 4px 20px rgba(99,102,241,.35);
  letter-spacing: .1px;
  position: relative; overflow: hidden;
}
.login-btn::before {
  content:''; position:absolute; inset:0;
  background: linear-gradient(135deg, rgba(255,255,255,.1) 0%, transparent 60%);
  opacity: 0; transition: opacity .2s;
}
.login-btn:hover:not(.loading) { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(99,102,241,.5); }
.login-btn:hover:not(.loading)::before { opacity: 1; }
.login-btn:active:not(.loading) { transform: translateY(0); }
.login-btn.loading { opacity: .7; cursor: not-allowed; }

.spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff;
  border-radius: 50%;
  display: inline-block;
  animation: spin .7s linear infinite;
}

/* ── Divider ── */
.divider {
  display: flex; align-items: center; gap: 12px;
  margin: 26px 0 20px;
}
.divider span { flex: 1; height: 1px; background: var(--subtle); }
.divider em {
  font-style: normal; font-size: 12px;
  color: #334155; font-weight: 500;
}

/* ── Signup row ── */
.signup-row {
  text-align: center; font-size: 13.5px; color: #475569;
  margin-bottom: 20px;
}
.signup-link {
  color: var(--indigo); font-weight: 600;
  background: none; border: none; cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  font-size: 13.5px;
  transition: color .15s; padding: 0;
}
.signup-link:hover { color: #818cf8; }

.terms-note {
  text-align: center; font-size: 11.5px; color: #334155;
  line-height: 1.55;
}
.terms-note a {
  color: #475569; text-decoration: underline;
  text-underline-offset: 2px; transition: color .15s;
}
.terms-note a:hover { color: #94a3b8; }

/* ── Responsive tweaks ── */
@media (max-width: 380px) {
  .form-panel { padding: 24px 16px; }
  .brand-stats { gap: 20px; }
}
`;