import { useState, useEffect } from "react";
import { Trash2, Shield, Users, Package, BarChart3, CheckCircle, AlertTriangle } from "lucide-react";
import { api } from "../api";
import type { Item, User } from "../types";
import { useNotification } from "../components/Notification";
import { Link } from "react-router-dom";

type AdminTab = "overview" | "items" | "users";

export default function Admin() {
  const { success, error } = useNotification();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [items, setItems] = useState<Item[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, i, u] = await Promise.all([
        api.admin.stats(),
        api.admin.items(),
        api.admin.users(),
      ]);
      setStats(s);
      setItems(i);
      setUsers(u);
    } catch (e: any) {
      error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDeleteItem = async (id: number) => {
    if (!confirm("Remove this listing?")) return;
    try {
      await api.admin.deleteItem(id);
      success("Listing removed");
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e: any) { error(e.message); }
  };

  const handleSetRole = async (userId: number, role: "user" | "admin") => {
    try {
      await api.admin.setRole(userId, role);
      success(`Role updated to ${role}`);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
    } catch (e: any) { error(e.message); }
  };

  return (
    <div className="page" style={{ maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.75rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "10px",
          background: "linear-gradient(135deg, #6175f7, #4b56ed)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Shield size={20} style={{ color: "white" }} />
        </div>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, margin: 0, color: "#f1f5f9" }}>
            Admin Panel
          </h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "0.85rem" }}>Moderate listings and manage users</p>
        </div>
      </div>

      {/* Tab navigation */}
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.5rem", background: "rgba(255,255,255,0.03)", borderRadius: "0.75rem", padding: "0.25rem", width: "fit-content" }}>
        {(["overview", "items", "users"] as AdminTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "none", cursor: "pointer",
              background: tab === t ? "rgba(97,117,247,0.2)" : "transparent",
              color: tab === t ? "#a4bcfd" : "#64748b",
              fontWeight: 500, fontSize: "0.875rem", transition: "all 0.15s",
              display: "flex", alignItems: "center", gap: "0.4rem"
            }}
          >
            {t === "overview" ? <><BarChart3 size={15} /> Overview</> :
             t === "items" ? <><Package size={15} /> Items ({items.length})</> :
             <><Users size={15} /> Users ({users.length})</>}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: "60px", borderRadius: "0.875rem" }} />
          ))}
        </div>
      ) : (
        <>
          {/* ── Overview ────────────────────────────────────────────────── */}
          {tab === "overview" && stats && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                {[
                  { label: "Total Listings", value: stats.totalItems, color: "#6175f7" },
                  { label: "Active Listings", value: stats.activeItems, color: "#14b8a6" },
                  { label: "Resolved", value: stats.resolvedItems, color: "#22c55e" },
                  { label: "Total Users", value: stats.totalUsers, color: "#f59e0b" },
                  { label: "Total Claims", value: stats.totalClaims, color: "#818cf8" },
                  { label: "Pending Claims", value: stats.pendingClaims, color: "#fb923c" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="glass" style={{ borderRadius: "0.875rem", padding: "1.25rem" }}>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "0.375rem" }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
                {/* Recent items */}
                <div className="glass" style={{ borderRadius: "1rem", padding: "1.25rem" }}>
                  <h3 style={{ fontWeight: 600, fontSize: "0.9rem", margin: "0 0 1rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Recent Listings
                  </h3>
                  {items.slice(0, 5).map((item) => (
                    <div key={item.id} style={{
                      display: "flex", justifyContent: "space-between", padding: "0.5rem 0",
                      borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.82rem"
                    }}>
                      <span style={{ color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>
                        {item.title}
                      </span>
                      <span className={`badge badge-${item.type}`} style={{ fontSize: "0.65rem" }}>{item.type}</span>
                    </div>
                  ))}
                </div>
                {/* Recent users */}
                <div className="glass" style={{ borderRadius: "1rem", padding: "1.25rem" }}>
                  <h3 style={{ fontWeight: 600, fontSize: "0.9rem", margin: "0 0 1rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Recent Users
                  </h3>
                  {users.slice(0, 5).map((u) => (
                    <div key={u.id} style={{
                      display: "flex", justifyContent: "space-between", padding: "0.5rem 0",
                      borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.82rem"
                    }}>
                      <span style={{ color: "#e2e8f0" }}>{u.name}</span>
                      <span style={{ color: u.role === "admin" ? "#a4bcfd" : "#475569", fontSize: "0.72rem" }}>{u.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Items ────────────────────────────────────────────────────── */}
          {tab === "items" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {items.length === 0 && (
                <div className="empty-state"><div className="empty-state-icon">📭</div><h3>No listings</h3></div>
              )}
              {items.map((item) => (
                <div key={item.id} className="glass" style={{ borderRadius: "0.875rem", padding: "1rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "center" }}>
                    <div>
                      <div style={{ display: "flex", gap: "0.375rem", marginBottom: "0.3rem", flexWrap: "wrap" }}>
                        <span className={`badge badge-${item.type}`}>{item.type}</span>
                        <span className={`badge badge-${item.status}`}>{item.status}</span>
                        {item.category && (
                          <span style={{ fontSize: "0.72rem", color: "#475569" }}>{item.category}</span>
                        )}
                      </div>
                      <Link to={`/items/${item.id}`} style={{ textDecoration: "none" }}>
                        <div style={{ fontWeight: 600, color: "#f1f5f9", fontSize: "0.9rem" }}>{item.title}</div>
                      </Link>
                      <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "0.2rem" }}>
                        by {(item as any).poster_name} · {(item as any).poster_email} · {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <Link to={`/items/${item.id}`} className="btn btn-ghost btn-sm">View</Link>
                      <button onClick={() => handleDeleteItem(item.id)} className="btn btn-danger btn-sm">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Users ────────────────────────────────────────────────────── */}
          {tab === "users" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {users.map((u) => (
                <div key={u.id} className="glass" style={{ borderRadius: "0.875rem", padding: "1rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "1rem", alignItems: "center" }}>
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "50%",
                      background: "linear-gradient(135deg, #6175f7, #14b8a6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1rem", fontWeight: 700, color: "white"
                    }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "#f1f5f9", fontSize: "0.9rem" }}>{u.name}</div>
                      <div style={{ fontSize: "0.78rem", color: "#475569" }}>
                        {u.email} · Joined {new Date(u.created_at!).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span style={{
                        fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.6rem",
                        borderRadius: "99px",
                        background: u.role === "admin" ? "rgba(97,117,247,0.15)" : "rgba(255,255,255,0.06)",
                        color: u.role === "admin" ? "#a4bcfd" : "#64748b",
                        border: `1px solid ${u.role === "admin" ? "rgba(97,117,247,0.3)" : "rgba(255,255,255,0.08)"}`
                      }}>{u.role}</span>
                      {u.role !== "admin" ? (
                        <button
                          onClick={() => handleSetRole(u.id, "admin")}
                          className="btn btn-ghost btn-sm"
                          title="Promote to admin"
                        >
                          <Shield size={13} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSetRole(u.id, "user")}
                          className="btn btn-ghost btn-sm"
                          title="Demote to user"
                          style={{ color: "#f87171" }}
                        >
                          <Users size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
