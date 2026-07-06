import { useState, useEffect } from "react";
import { Trash2, Shield, Users, Package, BarChart3 } from "lucide-react";
import { api } from "../api";
import type { Item, User } from "../types";
import { useNotification } from "../components/Notification";
import { Link } from "react-router-dom";

type AdminTab = "overview" | "items" | "users";

export default function Admin() {
  const { success, error } = useNotification();
  const [tab, setTab]     = useState<AdminTab>("overview");
  const [items, setItems] = useState<Item[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, i, u] = await Promise.all([api.admin.stats(), api.admin.items(), api.admin.users()]);
      setStats(s); setItems(i); setUsers(u);
    } catch { error("Failed to load admin data"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleDeleteItem = async (id: number) => {
    if (!confirm("Remove this listing?")) return;
    try { await api.admin.deleteItem(id); success("Listing removed"); setItems((prev) => prev.filter((i) => i.id !== id)); }
    catch (e: any) { error(e.message); }
  };

  const handleSetRole = async (userId: number, role: "user" | "admin") => {
    try { await api.admin.setRole(userId, role); success(`Role updated to ${role}`); setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u)); }
    catch (e: any) { error(e.message); }
  };

  const statColors: Record<string, string> = {
    "Total Listings": "var(--ink-navy)", "Active Listings": "var(--found-green)",
    "Resolved": "var(--found-green)", "Total Users": "var(--brass-dark)",
    "Total Claims": "var(--ink-navy)", "Pending Claims": "var(--lost-rust)",
  };

  return (
    <div className="page" style={{ maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.75rem", display: "flex", alignItems: "center", gap: ".75rem" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "4px", background: "var(--ink-navy)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Shield size={20} style={{ color: "var(--brass)" }} />
        </div>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, margin: 0, color: "var(--ink-navy)" }}>Admin Panel</h1>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: ".85rem" }}>Moderate listings and manage users</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: ".25rem", marginBottom: "1.5rem", background: "var(--bg-surface)", borderRadius: "2px", padding: ".25rem", width: "fit-content" }}>
        {(["overview", "items", "users"] as AdminTab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: ".5rem 1rem", borderRadius: "2px", border: "none", cursor: "pointer",
            background: tab === t ? "var(--bg-card)" : "transparent",
            color: tab === t ? "var(--ink-navy)" : "var(--text-muted)",
            fontWeight: 600, fontSize: ".82rem", transition: "all .14s",
            display: "flex", alignItems: "center", gap: ".4rem",
            fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".05em",
            boxShadow: tab === t ? "1px 1px 0 var(--bg-border)" : "none",
          }}>
            {t === "overview" ? <><BarChart3 size={14} /> Overview</> :
             t === "items"    ? <><Package   size={14} /> Items ({items.length})</> :
                                <><Users     size={14} /> Users ({users.length})</>}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: "60px" }} />)}
        </div>
      ) : (
        <>
          {/* ── Overview ───────────────────────────────── */}
          {tab === "overview" && stats && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                {[
                  { label: "Total Listings",  value: stats.totalItems },
                  { label: "Active Listings", value: stats.activeItems },
                  { label: "Resolved",        value: stats.resolvedItems },
                  { label: "Total Users",     value: stats.totalUsers },
                  { label: "Total Claims",    value: stats.totalClaims },
                  { label: "Pending Claims",  value: stats.pendingClaims },
                ].map(({ label, value }) => (
                  <div key={label} className="paper-surface" style={{ padding: "1.25rem" }}>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: statColors[label] ?? "var(--ink-navy)", lineHeight: 1, fontFamily: "var(--font-display)" }}>{value}</div>
                    <div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginTop: ".375rem", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                {/* Recent items */}
                <div className="paper-surface" style={{ padding: "1.25rem" }}>
                  <h3 style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: ".78rem", margin: "0 0 1rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".07em" }}>Recent Listings</h3>
                  {items.slice(0, 5).map((item) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: ".4rem 0", borderBottom: "1px solid var(--bg-border)", fontSize: ".82rem" }}>
                      <span style={{ color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "190px" }}>{item.title}</span>
                      <span className={`badge badge-${item.type}`}>{item.type}</span>
                    </div>
                  ))}
                </div>
                {/* Recent users */}
                <div className="paper-surface" style={{ padding: "1.25rem" }}>
                  <h3 style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: ".78rem", margin: "0 0 1rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".07em" }}>Recent Users</h3>
                  {users.slice(0, 5).map((u) => (
                    <div key={u.id} style={{ display: "flex", justifyContent: "space-between", padding: ".4rem 0", borderBottom: "1px solid var(--bg-border)", fontSize: ".82rem" }}>
                      <span style={{ color: "var(--text-primary)" }}>{u.name}</span>
                      <span style={{ color: u.role === "admin" ? "var(--found-green)" : "var(--text-faint)", fontSize: ".72rem", fontFamily: "var(--font-mono)" }}>{u.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Items ──────────────────────────────────── */}
          {tab === "items" && (
            <div style={{ display: "flex", flexDirection: "column", gap: ".625rem" }}>
              {items.length === 0 && <div className="empty-state"><div className="empty-state-icon">📭</div><h3>No listings</h3></div>}
              {items.map((item) => (
                <div key={item.id} className="paper-surface" style={{ padding: "1rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "center" }}>
                    <div>
                      <div style={{ display: "flex", gap: ".35rem", marginBottom: ".3rem", flexWrap: "wrap" }}>
                        <span className={`badge badge-${item.type}`}>{item.type}</span>
                        <span className={`badge badge-${item.status}`}>{item.status}</span>
                        {item.category && <span style={{ fontSize: ".72rem", color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>{item.category}</span>}
                      </div>
                      <Link to={`/items/${item.id}`} style={{ textDecoration: "none" }}>
                        <div style={{ fontWeight: 700, color: "var(--ink-navy)", fontSize: ".9rem", fontFamily: "var(--font-display)" }}>{item.title}</div>
                      </Link>
                      <div style={{ fontSize: ".72rem", color: "var(--text-faint)", marginTop: ".2rem", fontFamily: "var(--font-mono)" }}>
                        by {(item as any).poster_name} · {(item as any).poster_email} · {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: ".5rem" }}>
                      <Link to={`/items/${item.id}`} className="btn btn-ghost btn-sm">View</Link>
                      <button onClick={() => handleDeleteItem(item.id)} className="btn btn-danger btn-sm"><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Users ──────────────────────────────────── */}
          {tab === "users" && (
            <div style={{ display: "flex", flexDirection: "column", gap: ".625rem" }}>
              {users.map((u) => (
                <div key={u.id} className="paper-surface" style={{ padding: "1rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "1rem", alignItems: "center" }}>
                    <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "var(--ink-navy)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".9rem", fontWeight: 700, color: "var(--paper-cream)" }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--ink-navy)", fontSize: ".9rem" }}>{u.name}</div>
                      <div style={{ fontSize: ".72rem", color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>{u.email} · Joined {new Date(u.created_at!).toLocaleDateString()}</div>
                    </div>
                    <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
                      <span className={u.role === "admin" ? "badge badge-found" : "badge badge-resolved"}>{u.role}</span>
                      {u.role !== "admin" ? (
                        <button onClick={() => handleSetRole(u.id, "admin")} className="btn btn-ghost btn-sm" title="Promote to admin"><Shield size={13} /></button>
                      ) : (
                        <button onClick={() => handleSetRole(u.id, "user")} className="btn btn-ghost btn-sm" title="Demote to user" style={{ color: "var(--lost-rust)" }}><Users size={13} /></button>
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
