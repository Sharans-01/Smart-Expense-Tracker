import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";

/* ─── Toast Component ─────────────────────────────────────────────────────── */
function Toast({ toasts, removeToast }) {
  return (
    <div style={toastStyles.container}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            ...toastStyles.toast,
            ...(t.type === "error" ? toastStyles.error : toastStyles.success),
            animation: t.leaving
              ? "toastOut 0.3s ease forwards"
              : "toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards",
          }}
        >
          <span style={toastStyles.icon}>
            {t.type === "error" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="rgba(239,68,68,0.2)" stroke="#f87171" strokeWidth="1.5"/>
                <path d="M12 8v4M12 16h.01" stroke="#f87171" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="rgba(34,197,94,0.2)" stroke="#4ade80" strokeWidth="1.5"/>
                <path d="M8 12l3 3 5-5" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </span>
          <span style={toastStyles.msg}>{t.message}</span>
          <button style={toastStyles.close} onClick={() => removeToast(t.id)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <div style={{
            ...toastStyles.progress,
            background: t.type === "error" ? "#f87171" : "#4ade80",
            animation: `toastProgress ${t.duration}ms linear forwards`,
          }}/>
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
    setToasts((p) => [...p, { id, message, type, duration, leaving: false }]);
    setTimeout(() => {
      setToasts((p) => p.map((t) => t.id === id ? { ...t, leaving: true } : t));
      setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 300);
    }, duration);
  };
  const removeToast = (id) => {
    setToasts((p) => p.map((t) => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 300);
  };
  return { toasts, addToast, removeToast };
}

/* ─── Firebase error parser ───────────────────────────────────────────────── */
function parseFirebaseError(code) {
  const map = {
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password is too weak. Use at least 6 characters.",
    "auth/network-request-failed": "Network error. Check your internet connection.",
    "auth/too-many-requests": "Too many attempts. Please wait and try again.",
  };
  return map[code] || "Something went wrong. Please try again.";
}

/* ─── Password strength ───────────────────────────────────────────────────── */
function getStrength(pw) {
  if (!pw) return 0;
  if (pw.length < 6) return 1;
  if (pw.length < 10 && !/[^a-zA-Z0-9]/.test(pw)) return 2;
  if (pw.length >= 10 && /[^a-zA-Z0-9]/.test(pw)) return 4;
  return 3;
}
const STRENGTH_LABEL = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLOR = ["", "#ef4444", "#f97316", "#22c55e", "#6366f1"];

/* ─── Main Signup Component ───────────────────────────────────────────────── */
export default function Signup() {
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [showCf, setShowCf]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [focused, setFocused]       = useState(null);
  const { toasts, addToast, removeToast } = useToast();
  const nav = useNavigate();

  const strength = getStrength(password);
  const mismatch = confirm.length > 0 && password !== confirm;

  const handleSignup = async () => {
    if (!email.trim())          return addToast("Please enter your email address.");
    if (password.length < 6)    return addToast("Password must be at least 6 characters.");
    if (password !== confirm)   return addToast("Passwords don't match. Please try again.");
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      addToast("Account created! Redirecting…", "success", 2000);
      setTimeout(() => nav("/dashboard"), 700);
    } catch (err) {
      addToast(parseFirebaseError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleSignup(); };

  /* Eye icon helper */
  const EyeIcon = ({ visible }) => visible ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

  return (
    <>
      <style>{globalCSS}</style>
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="su-root">
        <div className="bg-grid" />
        <div className="glow glow-1" />
        <div className="glow glow-2" />
        <div className="glow glow-3" />

        <div className="su-layout">
          {/* ── Brand Panel ── */}
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

              <h2 className="brand-headline">Your money,<br />your rules.</h2>
              <p className="brand-sub">Join thousands taking control of their finances with real‑time expense tracking and smart insights.</p>

              <ul className="feature-list">
                {[
                  ["💰", "Track income & expenses effortlessly"],
                  ["📈", "Real-time balance and savings insights"],
                  ["🧾", "Organize transactions with categories"],
                  ["📱", "Works on all devices"],
                ].map(([icon, text]) => (
                  <li key={text} className="feature-item">
                    <span className="feature-icon">{icon}</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>

              {/* Decorative receipt card */}
              {/* <div className="receipt-card">
                <div className="receipt-header">
                  <span className="receipt-title">Monthly Summary</span>
                  <span className="receipt-badge">June 2025</span>
                </div>
                <div className="receipt-rows">
                  {[["🍔 Food & Dining","₹4,280"],["🚌 Transport","₹1,150"],["🛍 Shopping","₹6,900"],].map(([cat,amt])=>(
                    <div className="receipt-row" key={cat}>
                      <span className="receipt-cat">{cat}</span>
                      <span className="receipt-amt">{amt}</span>
                    </div>
                  ))}
                </div>
                <div className="receipt-total">
                  <span>Total Spent</span>
                  <span className="receipt-total-val">₹12,330</span>
                </div>
              </div> */}
            </div>
          </div>

          {/* ── Form Panel ── */}
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

              <h1 className="form-title">Create your account</h1>
              <p className="form-subtitle">Free forever. No credit card required.</p>

              <div className="fields">
                {/* Email */}
                <div className="field">
                  <label className="field-label">Email address</label>
                  <div className={`input-wrap ${focused === "email" ? "focused" : ""}`}>
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
                      onFocus={() => setFocused("email")}
                      onBlur={() => setFocused(null)}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="field">
                  <label className="field-label">Password</label>
                  <div className={`input-wrap ${focused === "password" ? "focused" : ""}`}>
                    <span className="input-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                      </svg>
                    </span>
                    <input
                      className="text-input"
                      type={showPw ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setFocused("password")}
                      onBlur={() => setFocused(null)}
                      autoComplete="new-password"
                    />
                    <button className="eye-btn" onClick={() => setShowPw(!showPw)} tabIndex={-1} type="button">
                      <EyeIcon visible={showPw} />
                    </button>
                  </div>
                  {/* Strength meter */}
                  {password.length > 0 && (
                    <div className="strength-wrap">
                      <div className="strength-bars">
                        {[1,2,3,4].map(i => (
                          <div
                            key={i}
                            className="strength-bar"
                            style={{ background: i <= strength ? STRENGTH_COLOR[strength] : "rgba(30,41,59,0.8)" }}
                          />
                        ))}
                      </div>
                      <span className="strength-label" style={{ color: STRENGTH_COLOR[strength] }}>
                        {STRENGTH_LABEL[strength]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div className="field">
                  <label className="field-label">Confirm password</label>
                  <div className={`input-wrap ${focused === "confirm" ? "focused" : ""} ${mismatch ? "error-border" : ""}`}>
                    <span className="input-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <rect x="3" y="11" width="18" height="11" rx="2"/>
                        <path d="M7 11V7a5 5 0 0110 0v4"/>
                        <path d="M9 16l2 2 4-4"/>
                      </svg>
                    </span>
                    <input
                      className="text-input"
                      type={showCf ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setFocused("confirm")}
                      onBlur={() => setFocused(null)}
                      autoComplete="new-password"
                    />
                    <button className="eye-btn" onClick={() => setShowCf(!showCf)} tabIndex={-1} type="button">
                      <EyeIcon visible={showCf} />
                    </button>
                  </div>
                  {mismatch && (
                    <p className="field-error">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" style={{flexShrink:0}}>
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      Passwords don't match
                    </p>
                  )}
                </div>

                {/* Terms */}
                <p className="terms-note">
                  By creating an account, you agree to our{" "}
                  <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
                </p>

                {/* Submit */}
                <button
                  className={`signup-btn ${loading ? "loading" : ""}`}
                  onClick={handleSignup}
                  disabled={loading}
                  type="button"
                >
                  {loading ? (
                    <span className="spinner" />
                  ) : (
                    <>
                      Create account
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginLeft: 8 }}>
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </>
                  )}
                </button>
              </div>

              <div className="divider"><span /><em>or</em><span /></div>

              <p className="login-row">
                Already have an account?{" "}
                <button className="login-link" onClick={() => nav("/")} type="button">
                  Sign in →
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Toast inline styles ─────────────────────────────────────────────────── */
const toastStyles = {
  container: {
    position: "fixed", top: 20, right: 20, zIndex: 9999,
    display: "flex", flexDirection: "column", gap: 10,
    maxWidth: 360, width: "calc(100vw - 40px)",
  },
  toast: {
    position: "relative", display: "flex", alignItems: "center", gap: 10,
    padding: "13px 14px", borderRadius: 12,
    backdropFilter: "blur(16px)", overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    fontFamily: "'DM Sans', sans-serif",
  },
  error:   { background: "rgba(20,10,10,0.92)", border: "1px solid rgba(248,113,113,0.3)" },
  success: { background: "rgba(10,20,12,0.92)", border: "1px solid rgba(74,222,128,0.3)" },
  icon:    { flexShrink: 0, display: "flex", alignItems: "center" },
  msg:     { flex: 1, fontSize: 13.5, color: "#e2e8f0", lineHeight: 1.45, fontWeight: 450 },
  close:   { flexShrink: 0, background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", padding: 2, borderRadius: 4 },
  progress:{ position: "absolute", bottom: 0, left: 0, height: 2, width: "100%", transformOrigin: "left" },
};

/* ─── Global CSS ──────────────────────────────────────────────────────────── */
const globalCSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Syne:wght@600;700;800&display=swap');
@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@500;700&family=Roboto+Slab:wght@100..900&display=swap");
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'DM Sans', sans-serif; }

:root {
  --indigo: #6366f1;
  --purple: #8b5cf6;
  --bg: #05080f;
  --border: rgba(99,102,241,0.18);
  --text: #e2e8f0;
  --muted: #64748b;
  --subtle: #1e293b;
}

@keyframes toastIn      { from{opacity:0;transform:translateX(24px)scale(.96)} to{opacity:1;transform:translateX(0)scale(1)} }
@keyframes toastOut     { from{opacity:1;transform:translateX(0)scale(1)} to{opacity:0;transform:translateX(24px)scale(.96)} }
@keyframes toastProgress{ from{transform:scaleX(1)} to{transform:scaleX(0)} }
@keyframes spin         { to{transform:rotate(360deg)} }
@keyframes fadeUp       { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes glow1        { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(40px,-30px)scale(1.1)} }
@keyframes glow2        { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(-30px,40px)scale(1.12)} }
@keyframes glow3        { 0%,100%{transform:translate(0,0)} 60%{transform:translate(20px,-20px)} }
@keyframes receiptFloat { 0%,100%{transform:translateY(0)rotate(1.5deg)} 50%{transform:translateY(-7px)rotate(1.5deg)} }
@keyframes shimmer      { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

/* ── Root ── */
.su-root {
  min-height: 100vh;
  background: var(--bg);
  display: flex; align-items: stretch;
  position: relative; overflow: hidden;
}

.bg-grid {
  position: absolute; inset: 0; z-index: 0;
  background-image:
    linear-gradient(rgba(99,102,241,.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99,102,241,.04) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
}

.glow { position:absolute; border-radius:50%; pointer-events:none; z-index:0; }
.glow-1 { width:600px;height:600px;top:-180px;left:-120px;background:radial-gradient(circle,rgba(99,102,241,.18) 0%,transparent 70%);animation:glow1 9s ease-in-out infinite; }
.glow-2 { width:500px;height:500px;bottom:-150px;right:-80px;background:radial-gradient(circle,rgba(168,85,247,.16) 0%,transparent 70%);animation:glow2 11s ease-in-out infinite; }
.glow-3 { width:350px;height:350px;top:40%;right:30%;background:radial-gradient(circle,rgba(34,211,238,.08) 0%,transparent 70%);animation:glow3 13s ease-in-out infinite; }

/* ── Two-column layout ── */
.su-layout { position:relative;z-index:1;display:flex;width:100%;min-height:100vh; }

/* ── Brand panel ── */
.brand-panel {
  flex:1; display:none;
  background:linear-gradient(145deg,rgba(12,16,28,.95) 0%,rgba(20,14,40,.95) 100%);
  border-right:1px solid var(--border);
  padding:48px; flex-direction:column; justify-content:center; overflow:hidden;
}
@media(min-width:900px){ .brand-panel{display:flex;} }

.brand-inner { max-width:400px; animation:fadeUp .7s ease both; }

.brand-logo { display:flex;align-items:center;gap:10px;margin-bottom:44px; }
.brand-name  { font-family:'Roboto Slab',sans-serif;font-size:28px;font-weight:700;color:#f1f5f9;letter-spacing:-.5px; }

.brand-headline {
  font-family:'Roboto Slab',sans-serif;
  font-size:clamp(28px,3.5vw,38px);
  font-weight:800;color:#f1f5f9;
  line-height:1.2;letter-spacing:-1px;margin-bottom:14px;
}
.brand-sub { font-size:14.5px;color:var(--muted);line-height:1.65;margin-bottom:32px;max-width:300px; }

/* feature list */
.feature-list { list-style:none;display:flex;flex-direction:column;gap:12px;margin-bottom:40px; }
.feature-item  { display:flex;align-items:center;gap:12px;font-size:14px;color:#94a3b8;font-weight:450; }
.feature-icon  { width:32px;height:32px;background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.2);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0; }

/* receipt card */
.receipt-card {
  background:rgba(15,23,42,.85);
  border:1px solid rgba(99,102,241,.25);
  border-radius:16px;padding:18px 20px;
  animation:receiptFloat 5s ease-in-out infinite;
  transform:rotate(1.5deg);
  position:relative;overflow:hidden;
}
.receipt-card::before {
  content:'';position:absolute;inset:0;
  background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.03) 50%,transparent 60%);
  background-size:200% 100%;animation:shimmer 3s infinite;
}
.receipt-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:14px; }
.receipt-title  { font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:#f1f5f9;letter-spacing:.2px; }
.receipt-badge  { font-size:10.5px;color:var(--indigo);background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.25);padding:3px 8px;border-radius:20px;font-weight:600; }
.receipt-rows   { display:flex;flex-direction:column;gap:9px;margin-bottom:14px; }
.receipt-row    { display:flex;justify-content:space-between;align-items:center; }
.receipt-cat    { font-size:13px;color:#94a3b8; }
.receipt-amt    { font-size:13px;color:#e2e8f0;font-weight:600; }
.receipt-total  { display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(99,102,241,.15);padding-top:12px; }
.receipt-total span:first-child { font-size:12px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.5px; }
.receipt-total-val { font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:#818cf8; }

/* ── Form panel ── */
.form-panel {
  flex:none;width:100%;
  display:flex;align-items:center;justify-content:center;
  padding:32px 20px;min-height:100vh;
}
@media(min-width:900px){ .form-panel{width:460px;flex:none;padding:40px 36px;} }

.form-card { width:100%;max-width:400px;animation:fadeUp .6s .1s ease both; }

.mobile-logo { display:flex;align-items:center;gap:8px;margin-bottom:28px;font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:#f1f5f9; }
@media(min-width:900px){ .mobile-logo{display:none;} }

.form-title    { font-family:'Poppins',sans-serif;font-size:clamp(22px,5vw,28px);font-weight:800;color:#f1f5f9;letter-spacing:-.7px;margin-bottom:5px; }
.form-subtitle { font-size:13.5px;color:var(--muted);margin-bottom:28px;line-height:1.5; }

/* ── Fields ── */
.fields { display:flex;flex-direction:column;gap:16px; }
.field  { display:flex;flex-direction:column;gap:7px; }

.field-label {
  font-size:11.5px;font-weight:600;
  color:#94a3b8;text-transform:uppercase;letter-spacing:.7px;
}

.input-wrap {
  position:relative;display:flex;align-items:center;
  border:1px solid var(--subtle);border-radius:12px;
  background:rgba(20,28,46,.6);
  transition:border-color .2s,box-shadow .2s,background .2s;
}
.input-wrap.focused     { border-color:var(--indigo);box-shadow:0 0 0 3px rgba(99,102,241,.14);background:rgba(25,34,58,.7); }
.input-wrap.error-border{ border-color:#ef4444;box-shadow:0 0 0 3px rgba(239,68,68,.1); }

.input-icon {
  position:absolute;left:14px;color:#475569;
  display:flex;align-items:center;pointer-events:none;
  transition:color .2s;
}
.input-wrap.focused .input-icon { color:#818cf8; }

.text-input {
  width:100%;padding:13px 14px 13px 42px;
  background:transparent;border:none;outline:none;
  color:var(--text);font-size:14px;
  font-family:'DM Sans',sans-serif;font-weight:450;
  caret-color:var(--indigo);
}
.text-input::placeholder { color:#334155; }

.eye-btn {
  position:absolute;right:12px;
  background:none;border:none;cursor:pointer;color:#475569;
  display:flex;align-items:center;padding:4px;border-radius:6px;
  transition:color .15s,background .15s;
}
.eye-btn:hover { color:#94a3b8;background:rgba(99,102,241,.1); }

/* Strength meter */
.strength-wrap  { display:flex;align-items:center;gap:8px;margin-top:2px; }
.strength-bars  { display:flex;gap:4px;flex:1; }
.strength-bar   { flex:1;height:3px;border-radius:4px;transition:background .3s; }
.strength-label { font-size:11px;font-weight:700;min-width:36px;text-align:right;letter-spacing:.2px; }

/* Field error */
.field-error {
  display:flex;align-items:center;gap:5px;
  font-size:11.5px;color:#f87171;margin-top:1px;
}

/* Terms */
.terms-note { font-size:11.5px;color:#475569;line-height:1.65;margin-top:2px; }
.terms-note a { color:#6366f1;text-decoration:underline;text-underline-offset:2px;transition:color .15s; }
.terms-note a:hover { color:#818cf8; }

/* ── Submit button ── */
.signup-btn {
  width:100%;margin-top:2px;padding:14px;
  background:linear-gradient(135deg,var(--indigo) 0%,var(--purple) 100%);
  border:none;border-radius:12px;
  color:#fff;font-size:15px;font-weight:600;
  font-family:'DM Sans',sans-serif;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  transition:transform .15s,box-shadow .15s,opacity .15s;
  box-shadow:0 4px 20px rgba(99,102,241,.35);
  position:relative;overflow:hidden;letter-spacing:.1px;
}
.signup-btn::before {
  content:'';position:absolute;inset:0;
  background:linear-gradient(135deg,rgba(255,255,255,.1) 0%,transparent 60%);
  opacity:0;transition:opacity .2s;
}
.signup-btn:hover:not(.loading)         { transform:translateY(-1px);box-shadow:0 8px 28px rgba(99,102,241,.5); }
.signup-btn:hover:not(.loading)::before { opacity:1; }
.signup-btn:active:not(.loading)        { transform:translateY(0); }
.signup-btn.loading                     { opacity:.7;cursor:not-allowed; }

.spinner {
  width:18px;height:18px;
  border:2px solid rgba(255,255,255,.3);
  border-top-color:#fff;border-radius:50%;
  display:inline-block;animation:spin .7s linear infinite;
}

/* ── Divider + login row ── */
.divider { display:flex;align-items:center;gap:12px;margin:22px 0 18px; }
.divider span { flex:1;height:1px;background:var(--subtle); }
.divider em   { font-style:normal;font-size:12px;color:#334155;font-weight:500; }

.login-row  { text-align:center;font-size:13.5px;color:#475569; }
.login-link {
  color:var(--indigo);font-weight:600;
  background:none;border:none;cursor:pointer;
  font-family:'DM Sans',sans-serif;font-size:13.5px;
  transition:color .15s;padding:0;
}
.login-link:hover { color:#818cf8; }

@media(max-width:380px){ .form-panel{padding:24px 16px;} }
`;