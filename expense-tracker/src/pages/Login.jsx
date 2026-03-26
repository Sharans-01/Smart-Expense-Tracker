import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const nav = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      nav("/dashboard");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div style={styles.root}>
      {/* Animated background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.blob3} />

      <div style={styles.card}>
        {/* Logo / Icon */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#fff" opacity="0.9"/>
              <path d="M3 12h3M18 12h3M12 3v3M12 18v3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
            </svg>
          </div>
        </div>

        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.subtitle}>Sign in to your expense tracker</p>

        <div style={styles.form}>
          {/* Email field */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email address</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <input
                style={styles.input}
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={e => Object.assign(e.target.style, { borderColor: "#1e293b", boxShadow: "none" })}
              />
            </div>
          </div>

          {/* Password field */}
          <div style={styles.fieldGroup}>
            <div style={styles.labelRow}>
              <label style={styles.label}>Password</label>
              <span style={styles.forgotLink}>Forgot password?</span>
            </div>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                style={styles.input}
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={e => Object.assign(e.target.style, { borderColor: "#1e293b", boxShadow: "none" })}
              />
              <button
                style={styles.eyeBtn}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Login button */}
          <button
            style={{ ...styles.loginBtn, ...(loading ? styles.loginBtnLoading : {}) }}
            onClick={handleLogin}
            disabled={loading}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 25px rgba(99,102,241,0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 15px rgba(99,102,241,0.35)"; }}
          >
            {loading ? (
              <span style={styles.spinner} />
            ) : (
              <>
                Sign in
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginLeft: 8 }}>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <span style={styles.dividerLine} />
        </div>

        {/* Signup link */}
        <p style={styles.signupText}>
          Don't have an account?{" "}
          <span
            style={styles.signupLink}
            onClick={() => nav("/signup")}
            onMouseEnter={e => e.currentTarget.style.color = "#818cf8"}
            onMouseLeave={e => e.currentTarget.style.color = "#6366f1"}
          >
            Create one free →
          </span>
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-20px) scale(1.05)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,30px) scale(1.08)} }
        @keyframes float3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(15px,15px)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#060b18",
    fontFamily: "'Sora', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  blob1: {
    position: "absolute", width: 500, height: 500,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)",
    top: -100, left: -100,
    animation: "float1 8s ease-in-out infinite",
    pointerEvents: "none",
  },
  blob2: {
    position: "absolute", width: 400, height: 400,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)",
    bottom: -80, right: -80,
    animation: "float2 10s ease-in-out infinite",
    pointerEvents: "none",
  },
  blob3: {
    position: "absolute", width: 300, height: 300,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%)",
    top: "50%", right: "20%",
    animation: "float3 12s ease-in-out infinite",
    pointerEvents: "none",
  },
  card: {
    position: "relative", zIndex: 10,
    width: 420, padding: "44px 40px",
    background: "rgba(15,23,42,0.85)",
    backdropFilter: "blur(24px)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 24,
    boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
    animation: "fadeUp 0.6s ease both",
  },
  logoWrap: {
    display: "flex", justifyContent: "center", marginBottom: 24,
  },
  logoIcon: {
    width: 56, height: 56, borderRadius: 16,
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
  },
  title: {
    fontSize: 26, fontWeight: 700, color: "#f1f5f9",
    textAlign: "center", letterSpacing: "-0.5px", marginBottom: 6,
  },
  subtitle: {
    fontSize: 13.5, color: "#64748b", textAlign: "center",
    fontWeight: 400, marginBottom: 32,
  },
  form: { display: "flex", flexDirection: "column", gap: 20 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 7 },
  labelRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 12.5, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.5px", textTransform: "uppercase" },
  forgotLink: { fontSize: 12, color: "#6366f1", cursor: "pointer", fontWeight: 500 },
  inputWrap: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: {
    position: "absolute", left: 14, display: "flex", alignItems: "center",
    pointerEvents: "none",
  },
  input: {
    width: "100%", padding: "12px 14px 12px 42px",
    background: "rgba(30,41,59,0.8)",
    border: "1px solid #1e293b",
    borderRadius: 12,
    color: "#e2e8f0", fontSize: 14, fontFamily: "'Sora', sans-serif",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    caretColor: "#6366f1",
  },
  inputFocus: {
    borderColor: "#6366f1",
    boxShadow: "0 0 0 3px rgba(99,102,241,0.15)",
  },
  eyeBtn: {
    position: "absolute", right: 14,
    background: "none", border: "none",
    cursor: "pointer", display: "flex", alignItems: "center",
    padding: 0,
  },
  loginBtn: {
    marginTop: 4, padding: "14px",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    border: "none", borderRadius: 12,
    color: "#fff", fontSize: 15, fontWeight: 600,
    fontFamily: "'Sora', sans-serif",
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "transform 0.15s, box-shadow 0.15s",
    boxShadow: "0 4px 15px rgba(99,102,241,0.35)",
    letterSpacing: "0.2px",
  },
  loginBtnLoading: { opacity: 0.75, cursor: "not-allowed" },
  spinner: {
    width: 18, height: 18,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.7s linear infinite",
  },
  divider: {
    display: "flex", alignItems: "center", gap: 12, margin: "28px 0 20px",
  },
  dividerLine: { flex: 1, height: 1, background: "#1e293b" },
  dividerText: { fontSize: 12, color: "#475569", fontWeight: 500 },
  signupText: { textAlign: "center", fontSize: 13.5, color: "#475569" },
  signupLink: {
    color: "#6366f1", fontWeight: 600, cursor: "pointer",
    transition: "color 0.15s",
  },
};