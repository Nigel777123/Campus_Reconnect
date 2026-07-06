import { Link } from "react-router-dom";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: "2rem", textAlign: "center" }}>
      <div>
        <div style={{ fontSize: "5rem", marginBottom: "1rem" }}>🔍</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 800, margin: "0 0 .5rem", color: "var(--ink-navy)" }}>
          Page Not Found
        </h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem", fontSize: "1rem" }}>
          Looks like this page went missing too!
        </p>
        <div style={{ display: "flex", gap: ".75rem", justifyContent: "center" }}>
          <Link to="/" className="btn btn-primary"><Home size={15} /> Go Home</Link>
          <Link to="/" className="btn btn-ghost"><Search size={15} /> Browse Items</Link>
        </div>
      </div>
    </div>
  );
}
