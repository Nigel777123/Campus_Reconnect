import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, TrendingUp, Search, Zap } from "lucide-react";
import { api } from "../api";
import type { Item, ItemFilters as FilterState } from "../types";
import ItemCard from "../components/ItemCard";
import ItemFilters from "../components/ItemFilters";
import { useAuth } from "../contexts/AuthContext";

const DEFAULT_FILTERS: FilterState = {
  q: "", type: "", category: "", status: "active", date_from: "", date_to: ""
};

export default function Home() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.items.list(filters);
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const updateFilter = (partial: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const lostCount = items.filter((i) => i.type === "lost").length;
  const foundCount = items.filter((i) => i.type === "found").length;

  return (
    <div className="page" style={{ padding: "0" }}>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="bg-radial-brand" style={{
        padding: "3.5rem 1.5rem 2.5rem",
        textAlign: "center",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", inset: 0, opacity: 0.03,
          backgroundImage: "radial-gradient(circle, #6175f7 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            background: "rgba(97,117,247,0.12)", border: "1px solid rgba(97,117,247,0.25)",
            borderRadius: "99px", padding: "0.3rem 0.875rem", marginBottom: "1.25rem",
            fontSize: "0.78rem", color: "#a4bcfd", fontWeight: 500
          }}>
            <Zap size={13} /> Campus Lost & Found Platform
          </div>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 800, margin: "0 0 0.875rem",
            background: "linear-gradient(135deg, #f1f5f9 30%, #a4bcfd 70%, #5eead4 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            lineHeight: 1.15
          }}>
            Lost Something?<br />We'll Help You Find It.
          </h1>
          <p style={{ color: "#64748b", fontSize: "1.05rem", maxWidth: "520px", margin: "0 auto 2rem", lineHeight: 1.6 }}>
            A secure campus platform where finders and owners connect through verified claims — no spam, no guessing.
          </p>

          {/* Stats */}
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginBottom: "2rem", flexWrap: "wrap" }}>
            <div className="glass-light" style={{ borderRadius: "0.75rem", padding: "0.75rem 1.5rem", minWidth: "120px" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fbbf24" }}>{lostCount}</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Lost Items</div>
            </div>
            <div className="glass-light" style={{ borderRadius: "0.75rem", padding: "0.75rem 1.5rem", minWidth: "120px" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2dd4bf" }}>{foundCount}</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Found Items</div>
            </div>
            <div className="glass-light" style={{ borderRadius: "0.75rem", padding: "0.75rem 1.5rem", minWidth: "120px" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#818cf8" }}>{lostCount + foundCount}</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Total Listings</div>
            </div>
          </div>

          {/* CTA */}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            {user ? (
              <Link to="/post" className="btn btn-primary btn-lg">
                <Plus size={18} /> Post an Item
              </Link>
            ) : (
              <Link to="/register" className="btn btn-primary btn-lg">
                Get Started — It's Free
              </Link>
            )}
            <a href="#feed" className="btn btn-ghost btn-lg">
              <Search size={18} /> Browse Items
            </a>
          </div>
        </div>
      </div>

      {/* ── Feed ─────────────────────────────────────────────────────────── */}
      <div id="feed" style={{ padding: "2rem 1.5rem", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <ItemFilters
            filters={filters}
            onChange={updateFilter}
            onReset={() => setFilters(DEFAULT_FILTERS)}
            total={items.length}
          />
        </div>

        {loading ? (
          <div className="items-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ borderRadius: "1rem", overflow: "hidden" }}>
                <div className="skeleton" style={{ height: "180px" }} />
                <div style={{ padding: "1rem", background: "rgba(19,25,41,0.7)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div className="skeleton" style={{ height: "14px", width: "40%" }} />
                  <div className="skeleton" style={{ height: "20px", width: "80%" }} />
                  <div className="skeleton" style={{ height: "14px", width: "60%" }} />
                  <div className="skeleton" style={{ height: "14px", width: "50%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No items found</h3>
            <p style={{ marginBottom: "1rem" }}>Try adjusting your filters or be the first to post!</p>
            {user && (
              <Link to="/post" className="btn btn-primary">
                <Plus size={15} /> Post an Item
              </Link>
            )}
          </div>
        ) : (
          <div className="items-grid">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <div style={{ padding: "3rem 1.5rem", background: "rgba(13,17,32,0.6)" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <h2 style={{
            textAlign: "center", fontFamily: "var(--font-display)",
            fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem",
            color: "#f1f5f9"
          }}>How It Works</h2>
          <p style={{ textAlign: "center", color: "#64748b", marginBottom: "2.5rem" }}>
            A secure, three-step process to reunite items with their owners
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
            {[
              { icon: "📢", step: "1", title: "Post a Listing", desc: "Report a lost item or post something you found on campus. Add details, a photo, and — for found items — secret verification questions." },
              { icon: "🔒", step: "2", title: "Secure Claim Flow", desc: "Claimants answer your private verification questions. You review their answers side-by-side with yours before approving." },
              { icon: "🤝", step: "3", title: "Safe Handoff", desc: "Once you approve a claim, contact info is revealed and a chat thread opens to arrange the handoff. The listing auto-resolves." },
            ].map((s) => (
              <div key={s.step} className="glass" style={{ borderRadius: "1rem", padding: "1.5rem", textAlign: "center" }}>
                <div style={{ fontSize: "2.25rem", marginBottom: "0.75rem" }}>{s.icon}</div>
                <div style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: "24px", height: "24px", borderRadius: "50%",
                  background: "rgba(97,117,247,0.2)", color: "#a4bcfd",
                  fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.75rem"
                }}>{s.step}</div>
                <h3 style={{ fontWeight: 600, fontSize: "1rem", margin: "0 0 0.5rem", color: "#f1f5f9" }}>{s.title}</h3>
                <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
