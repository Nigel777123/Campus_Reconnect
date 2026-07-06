import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../components/Notification";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { error } = useNotification();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const strengthColors = ["", "var(--lost-rust)", "var(--brass)", "var(--found-green)"];
  const strengthLabels = ["", "Too short", "Fair", "Strong"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { error("Passwords do not match"); return; }
    if (password.length < 8) { error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try { await register(name, email, password); navigate("/"); }
    catch (e: any) { error(e.message || "Registration failed"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem 1rem", minHeight: "70vh" }}>
      <div className="paper-surface" style={{ width: "100%", maxWidth: "440px", padding: "2.25rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: ".75rem" }}>🎓</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800, margin: "0 0 .25rem", color: "var(--ink-navy)" }}>
            Create an Account
          </h1>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: ".875rem" }}>Join Campus Reconnect with your campus email</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-group">
            <label className="input-label">Full Name</label>
            <input id="reg-name" className="input" type="text" placeholder="Your full name"
              value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
          </div>
          <div className="form-group">
            <label className="input-label">Campus Email</label>
            <input id="reg-email" className="input" type="email" placeholder="you@university.edu"
              value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            <div style={{ fontSize: ".72rem", color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>Must be a campus email address</div>
          </div>
          <div className="form-group">
            <label className="input-label">Password</label>
            <div style={{ position: "relative" }}>
              <input id="reg-password" className="input" type={showPw ? "text" : "password"} placeholder="Min. 8 characters"
                value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required style={{ paddingRight: "2.75rem" }} />
              <button type="button" onClick={() => setShowPw((p) => !p)} style={{
                position: "absolute", right: ".75rem", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", display: "flex", padding: 0,
              }}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
            {password && (
              <div>
                <div style={{ display: "flex", gap: ".2rem", marginBottom: ".2rem" }}>
                  {[1, 2, 3].map((s) => (
                    <div key={s} style={{ flex: 1, height: "3px", borderRadius: "99px", background: strength >= s ? strengthColors[strength] : "var(--bg-border)", transition: "background .2s" }} />
                  ))}
                </div>
                <span style={{ fontSize: ".7rem", color: strengthColors[strength], fontFamily: "var(--font-mono)" }}>{strengthLabels[strength]}</span>
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="input-label">Confirm Password</label>
            <div style={{ position: "relative" }}>
              <input id="reg-confirm" className="input" type={showPw ? "text" : "password"} placeholder="Repeat password"
                value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required style={{ paddingRight: "2.75rem" }} />
              {confirm && password === confirm && (
                <CheckCircle size={16} style={{ position: "absolute", right: ".75rem", top: "50%", transform: "translateY(-50%)", color: "var(--found-green)" }} />
              )}
            </div>
          </div>
          <button id="reg-submit" type="submit" className="btn btn-primary" style={{ marginTop: ".25rem", width: "100%", justifyContent: "center" }} disabled={loading}>
            <UserPlus size={16} /> {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <div className="divider" />
        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: ".875rem", margin: 0 }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--brass-dark)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
