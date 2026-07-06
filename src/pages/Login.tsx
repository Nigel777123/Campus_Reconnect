import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../components/Notification";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { error } = useNotification();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { await login(email, password); navigate("/"); }
    catch (e: any) { error(e.message || "Login failed"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem 1rem", minHeight: "70vh" }}>
      <div className="paper-surface" style={{ width: "100%", maxWidth: "420px", padding: "2.25rem" }}>
        {/* Logo area */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: ".75rem" }}>🎓</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800, margin: "0 0 .25rem", color: "var(--ink-navy)" }}>
            Welcome Back
          </h1>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: ".875rem" }}>Sign in to Campus Reconnect</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-group">
            <label className="input-label">Campus Email</label>
            <input id="login-email" className="input" type="email" placeholder="you@university.edu"
              value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </div>
          <div className="form-group">
            <label className="input-label">Password</label>
            <div style={{ position: "relative" }}>
              <input id="login-password" className="input" type={showPw ? "text" : "password"} placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required
                style={{ paddingRight: "2.75rem" }} />
              <button type="button" onClick={() => setShowPw((p) => !p)} style={{
                position: "absolute", right: ".75rem", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", display: "flex", padding: 0,
              }}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </div>
          <button id="login-submit" type="submit" className="btn btn-primary" style={{ marginTop: ".25rem", width: "100%", justifyContent: "center" }} disabled={loading}>
            <LogIn size={16} /> {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="divider" />
        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: ".875rem", margin: 0 }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "var(--brass-dark)", fontWeight: 600, textDecoration: "none" }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
