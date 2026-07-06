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

  const pwStrength = password.length === 0 ? 0
    : password.length < 8 ? 1
    : password.length < 12 ? 2
    : 3;

  const strengthColors = ["", "#ef4444", "#f59e0b", "#22c55e"];
  const strengthLabels = ["", "Too short", "Fair", "Strong"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { error("Passwords do not match"); return; }
    if (password.length < 8) { error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/");
    } catch (e: any) {
      error(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem 1rem", minHeight: "70vh"
    }} className="bg-radial-brand">
      <div className="glass" style={{ width: "100%", maxWidth: "440px", borderRadius: "1.25rem", padding: "2.25rem" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "52px", height: "52px",
            background: "linear-gradient(135deg, #6175f7, #14b8a6)",
            borderRadius: "14px", fontSize: "24px", marginBottom: "1rem"
          }}>🎓</div>
          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800,
            margin: "0 0 0.25rem",
            background: "linear-gradient(90deg, #f1f5f9, #5eead4)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>Create an Account</h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "0.875rem" }}>
            Join Campus Reconnect with your campus email
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-group">
            <label className="input-label">Full Name</label>
            <input
              id="reg-name"
              className="input"
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div className="form-group">
            <label className="input-label">Campus Email</label>
            <input
              id="reg-email"
              className="input"
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "0.25rem" }}>
              Must be a campus email address
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="reg-password"
                className="input"
                type={showPw ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                style={{ paddingRight: "2.75rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                style={{
                  position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex", padding: 0
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password && (
              <div style={{ marginTop: "0.375rem" }}>
                <div style={{ display: "flex", gap: "0.25rem", marginBottom: "0.25rem" }}>
                  {[1, 2, 3].map((s) => (
                    <div key={s} style={{
                      flex: 1, height: "3px", borderRadius: "99px",
                      background: pwStrength >= s ? strengthColors[pwStrength] : "rgba(255,255,255,0.08)",
                      transition: "background 0.2s"
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: "0.72rem", color: strengthColors[pwStrength] }}>
                  {strengthLabels[pwStrength]}
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="input-label">Confirm Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="reg-confirm"
                className="input"
                type={showPw ? "text" : "password"}
                placeholder="Repeat password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
                style={{ paddingRight: "2.75rem" }}
              />
              {confirm && password === confirm && (
                <CheckCircle size={16} style={{
                  position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
                  color: "#22c55e"
                }} />
              )}
            </div>
          </div>

          <button id="reg-submit" type="submit" className="btn btn-primary" style={{ marginTop: "0.25rem" }} disabled={loading}>
            <UserPlus size={16} /> {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="divider" />

        <p style={{ textAlign: "center", color: "#64748b", fontSize: "0.875rem", margin: 0 }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#a4bcfd", fontWeight: 500, textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
