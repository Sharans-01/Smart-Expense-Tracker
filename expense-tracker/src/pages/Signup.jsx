import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const strength = !password ? 0
    : password.length < 6 ? 1
    : password.length < 10 && !/[^a-zA-Z0-9]/.test(password) ? 2
    : password.length >= 10 && /[^a-zA-Z0-9]/.test(password) ? 4
    : 3;

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColor = ["", "#ef4444", "#f97316", "#22c55e", "#6366f1"];

  const handleSignup = async () => {
    if (password !== confirm) return alert("Passwords don't match.");
    if (password.length < 6) return alert("Password must be at least 6 characters.");
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      nav("/dashboard");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleSignup(); };

  return (
    <div style={styles.root}>
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.blob3} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#fff" opacity="0.15"/>
              <path d="M12 6v6l4 2" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="2.5" fill="#fff" opacity="0.85"/>
            </svg>
          </div>
        </div>

        <h1 style={styles.title}>Create account</h1>
        <p style={styles.subtitle}>Start tracking your expenses today</p>

        <div style={styles.form}>
          {/* Email */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email address</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <input
                style={styles.input}
                type="email"
                placeholder="you@example.com"
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={e => Object.assign(e.target.style, { borderColor: "#1e293b", boxShadow: "none" })}
              />
            </div>
          </div>

          {/* Password */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </span>
              <input
                style={styles.input}
                type={showPassword ? "text" : "password"}
                placeholder="Min. 6 characters"
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={e => Object.assign(e.target.style, { borderColor: "#1e293b", boxShadow: "none" })}
              />
              <button style={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                {showPassword
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            {/* Strength meter */}
            {password.length > 0 && (
              <div style={styles.strengthWrap}>
                <div style={styles.strengthBars}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      ...styles.strengthBar,
                      background: i <= strength ? strengthColor[strength] : "#1e293b",
                      transition: "background 0.3s"
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: strengthColor[strength], fontWeight: 600 }}>
                  {strengthLabel[strength]}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Confirm password</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 12l2 2 4-4"/>
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </span>
              <input
                style={{
                  ...styles.input,
                  borderColor: confirm && password !== confirm ? "#ef4444" : "#1e293b"
                }}
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter password"
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                onBlur={e => Object.assign(e.target.style, { borderColor: confirm && password !== confirm ? "#ef4444" : "#1e293b", boxShadow: "none" })}
              />
              <button style={styles.eyeBtn} onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                {showConfirm
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            {confirm && password !== confirm && (
              <p style={styles.errorText}>Passwords don't match</p>
            )}
          </div>

          {/* Terms note */}
          <p style={styles.terms}>
            By signing up, you agree to our{" "}
            <span style={styles.termsLink}>Terms of Service</span>{" "}
            and{" "}
            <span style={styles.termsLink}>Privacy Policy</span>
          </p>

          {/* Submit */}
          <button
            style={{ ...styles.signupBtn, ...(loading ? styles.btnLoading : {}) }}
            onClick={handleSignup}
            disabled={loading}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 25px rgba(99,102,241,0.5)"; }}}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 15px rgba(99,102,241,0.35)"; }}
          >
            {loading
              ? <span style={styles.spinner} />
              : <>Create account <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginLeft: 8 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></>
            }
          </button>
        </div>

        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <span style={styles.dividerLine} />
        </div>

        <p style={styles.loginText}>
          Already have an account?{" "}
          <span
            style={styles.loginLink}
            onClick={() => nav("/")}
            onMouseEnter={e => e.currentTarget.style.color = "#818cf8"}
            onMouseLeave={e => e.currentTarget.style.color = "#6366f1"}
          >
            Sign in →
          </span>
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-20px) scale(1.05)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,30px) scale(1.08)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "#060b18", fontFamily: "'Sora', sans-serif",
    position: "relative", overflow: "hidden",
  },
  blob1: {
    position: "absolute", width: 500, height: 500, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)",
    top: -120, left: -100, animation: "float1 8s ease-in-out infinite", pointerEvents: "none",
  },
  blob2: {
    position: "absolute", width: 400, height: 400, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 70%)",
    bottom: -80, right: -80, animation: "float2 10s ease-in-out infinite", pointerEvents: "none",
  },
  blob3: {
    position: "absolute", width: 280, height: 280, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)",
    top: "45%", right: "22%", animation: "float1 14s ease-in-out infinite reverse", pointerEvents: "none",
  },
  card: {
    position: "relative", zIndex: 10, width: 420, padding: "40px 38px",
    background: "rgba(15,23,42,0.87)", backdropFilter: "blur(24px)",
    border: "1px solid rgba(99,102,241,0.2)", borderRadius: 24,
    boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
    animation: "fadeUp 0.6s ease both",
  },
  logoWrap: { display: "flex", justifyContent: "center", marginBottom: 20 },
  logoIcon: {
    width: 52, height: 52, borderRadius: 15,
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 6px 22px rgba(99,102,241,0.4)",
  },
  title: { fontSize: 24, fontWeight: 700, color: "#f1f5f9", textAlign: "center", letterSpacing: "-0.4px", marginBottom: 5 },
  subtitle: { fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 28 },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 11.5, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.5px", textTransform: "uppercase" },
  inputWrap: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: { position: "absolute", left: 13, display: "flex", alignItems: "center", pointerEvents: "none" },
  input: {
    width: "100%", padding: "11px 14px 11px 40px",
    background: "rgba(30,41,59,0.8)", border: "1px solid #1e293b",
    borderRadius: 11, color: "#e2e8f0", fontSize: 13.5,
    fontFamily: "'Sora', sans-serif", outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s", caretColor: "#6366f1",
  },
  inputFocus: { borderColor: "#6366f1", boxShadow: "0 0 0 3px rgba(99,102,241,0.14)" },
  eyeBtn: { position: "absolute", right: 13, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 },
  strengthWrap: { display: "flex", alignItems: "center", gap: 8, marginTop: 6 },
  strengthBars: { display: "flex", gap: 4, flex: 1 },
  strengthBar: { flex: 1, height: 3, borderRadius: 4 },
  errorText: { fontSize: 11.5, color: "#ef4444", marginTop: 4 },
  terms: { fontSize: 11.5, color: "#475569", lineHeight: 1.6 },
  termsLink: { color: "#6366f1", cursor: "pointer", fontWeight: 500 },
  signupBtn: {
    marginTop: 2, padding: "13px",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    border: "none", borderRadius: 11, color: "#fff", fontSize: 14, fontWeight: 600,
    fontFamily: "'Sora', sans-serif", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "transform 0.15s, box-shadow 0.15s",
    boxShadow: "0 4px 15px rgba(99,102,241,0.35)",
  },
  btnLoading: { opacity: 0.75, cursor: "not-allowed" },
  spinner: {
    width: 17, height: 17, border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff", borderRadius: "50%", display: "inline-block",
    animation: "spin 0.7s linear infinite",
  },
  divider: { display: "flex", alignItems: "center", gap: 10, margin: "24px 0 16px" },
  dividerLine: { flex: 1, height: 1, background: "#1e293b" },
  dividerText: { fontSize: 11, color: "#475569", fontWeight: 500 },
  loginText: { textAlign: "center", fontSize: 13, color: "#475569" },
  loginLink: { color: "#6366f1", fontWeight: 600, cursor: "pointer", transition: "color 0.15s" },
};