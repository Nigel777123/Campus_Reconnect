import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, CheckCircle, Clock, XCircle, MessageCircle, Plus, BarChart3, AlertCircle, RotateCcw } from "lucide-react";
import { api } from "../api";
import type { DashboardData } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../components/Notification";

type Tab = "posts" | "claims";
type PFilter = "all" | "active" | "resolved";

export default function Dashboard() {
  const { user } = useAuth();
  const { success, error } = useNotification();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("posts");
  const [pf, setPf] = useState<PFilter>("all");

  const load = () => {
    setLoading(true);
    api.dashboard.get().then(setData).catch(() => error("Failed to load")).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleReopen = async (id: number) => {
    try { await api.items.update(id, { status: "active" }); success("Reopened"); load(); }
    catch (e: any) { error(e.message); }
  };
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this listing?")) return;
    try { await api.items.delete(id); success("Deleted"); load(); }
    catch (e: any) { error(e.message); }
  };

  if (loading) return (
    <div className="page" style={{ maxWidth: "900px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: ".875rem" }}>
        {[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: "80px" }} />)}
      </div>
    </div>
  );

  const posts   = data?.myPosts   ?? [];
  const claims  = data?.myClaims  ?? [];
  const pending = data?.pendingMap ?? {};

  const filtered = posts.filter((p) => pf === "all" ? true : p.status === pf);

  const claimIcon = (s: string) => s === "approved"
    ? <CheckCircle size={13} style={{ color: "var(--found-green)" }} />
    : s === "rejected"
    ? <XCircle    size={13} style={{ color: "var(--lost-rust)" }} />
    : <Clock      size={13} style={{ color: "var(--brass)" }} />;

  return (
    <div className="page" style={{ maxWidth: "900px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: ".875rem", marginBottom: "1.75rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 800, margin: "0 0 .25rem", color: "var(--ink-navy)" }}>
            My Dashboard
          </h1>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: ".875rem" }}>Welcome back, {user?.name} 👋</p>
        </div>
        <Link to="/post" className="btn btn-brass"><Plus size={15} /> Post Item</Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: ".875rem", marginBottom: "1.75rem" }}>
        {[
          { label: "Active Posts",     value: posts.filter((p) => p.status === "active").length,   color: "var(--ink-navy)",   icon: Package },
          { label: "Resolved",         value: posts.filter((p) => p.status === "resolved").length, color: "var(--found-green)", icon: CheckCircle },
          { label: "Pending Claims",   value: claims.filter((c) => c.status === "pending").length, color: "var(--brass)",       icon: Clock },
          { label: "Approved Claims",  value: claims.filter((c) => c.status === "approved").length, color: "var(--found-green)", icon: MessageCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="paper-surface" style={{ padding: "1.125rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color, fontFamily: "var(--font-display)", lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: ".72rem", color: "var(--text-muted)", marginTop: ".2rem", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</div>
              </div>
              <Icon size={18} style={{ color, opacity: .35 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Pending alerts */}
      {Object.entries(pending).map(([itemId, count]) => {
        const p = posts.find((p) => p.id === Number(itemId));
        if (!p) return null;
        return (
          <div key={itemId} style={{
            background: "var(--brass-light)", border: "1.5px solid rgba(201,162,39,.3)",
            borderRadius: "2px", padding: ".75rem 1rem", marginBottom: ".5rem",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: ".875rem",
          }}>
            <span style={{ fontSize: ".85rem", color: "var(--brass-dark)", display: "flex", alignItems: "center", gap: ".5rem" }}>
              <AlertCircle size={15} /> <strong>{count as React.ReactNode}</strong> pending claim{(count as number) > 1 ? "s" : ""} on <strong>"{p.title}"</strong>
            </span>
            <Link to={`/items/${itemId}`} className="btn btn-sm btn-brass">Review</Link>
          </div>
        );
      })}

      {/* Tabs */}
      <div style={{ display: "flex", gap: ".25rem", marginBottom: "1.25rem", background: "var(--bg-surface)", borderRadius: "2px", padding: ".25rem" }}>
        {(["posts", "claims"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: ".55rem", borderRadius: "2px", border: "none", cursor: "pointer",
            background: tab === t ? "var(--bg-card)" : "transparent",
            color: tab === t ? "var(--ink-navy)" : "var(--text-muted)",
            fontWeight: 600, fontSize: ".82rem", transition: "all .14s",
            fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".05em",
            boxShadow: tab === t ? "1px 1px 0 var(--bg-border)" : "none",
          }}>
            {t === "posts" ? `My Posts (${posts.length})` : `My Claims (${claims.length})`}
          </button>
        ))}
      </div>

      {/* ── Posts ───────────────────────────────────────────────── */}
      {tab === "posts" && (
        <>
          <div style={{ display: "flex", gap: ".35rem", marginBottom: "1rem" }}>
            {(["all", "active", "resolved"] as PFilter[]).map((f) => (
              <button key={f} onClick={() => setPf(f)} className={`filter-chip${pf === f ? " active" : ""}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>No {pf !== "all" ? pf : ""} posts yet</h3>
              <p style={{ marginBottom: "1rem" }}>Post your first lost or found item!</p>
              <Link to="/post" className="btn btn-brass"><Plus size={15} /> Post Item</Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
              {filtered.map((post) => {
                const pc = pending[post.id] || 0;
                return (
                  <div key={post.id} className="paper-surface" style={{ overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: ".875rem", padding: ".875rem", alignItems: "center" }}>
                      <div style={{
                        width: "60px", height: "60px", borderRadius: "2px", overflow: "hidden", flexShrink: 0,
                        background: post.type === "lost" ? "var(--lost-bg)" : "var(--found-bg)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem",
                      }}>
                        {post.image_url ? <img src={post.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : post.type === "lost" ? "🔍" : "✅"}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", gap: ".3rem", marginBottom: ".3rem", flexWrap: "wrap" }}>
                          <span className={`badge badge-${post.type}`}>{post.type}</span>
                          <span className={`badge badge-${post.status}`}>{post.status}</span>
                          {pc > 0 && <span className="badge badge-pending">⚡ {pc} pending</span>}
                        </div>
                        <Link to={`/items/${post.id}`} style={{ textDecoration: "none" }}>
                          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: ".95rem", color: "var(--ink-navy)", marginBottom: ".2rem" }}>{post.title}</div>
                        </Link>
                        <div style={{ fontSize: ".72rem", color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>
                          {post.location} · {new Date(post.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: ".35rem", alignItems: "flex-end" }}>
                        <Link to={`/items/${post.id}`} className="btn btn-sm btn-ghost">View</Link>
                        {post.status === "resolved" && (
                          <button onClick={() => handleReopen(post.id)} className="btn btn-sm btn-ghost" style={{ fontSize: ".7rem" }}>
                            <RotateCcw size={10} /> Reopen
                          </button>
                        )}
                        <button onClick={() => handleDelete(post.id)} className="btn btn-sm btn-danger" style={{ fontSize: ".7rem" }}>Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Claims ──────────────────────────────────────────────── */}
      {tab === "claims" && (
        claims.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No claims submitted</h3>
            <p>Browse found items and submit a claim if you recognize your belongings.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
            {claims.map((claim) => (
              <div key={claim.id} className="paper-surface" style={{ overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: ".875rem", padding: ".875rem", alignItems: "center" }}>
                  <div style={{ width: "52px", height: "52px", borderRadius: "2px", background: "var(--found-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", overflow: "hidden" }}>
                    {claim.image_url ? <img src={claim.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "✅"}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", gap: ".3rem", marginBottom: ".3rem" }}>
                      <span className={`badge badge-${claim.status}`} style={{ display: "inline-flex", alignItems: "center", gap: ".25rem" }}>
                        {claimIcon(claim.status)} {claim.status}
                      </span>
                    </div>
                    <Link to={`/items/${claim.item_id}`} style={{ textDecoration: "none" }}>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: ".95rem", color: "var(--ink-navy)", marginBottom: ".2rem" }}>{claim.item_title}</div>
                    </Link>
                    <div style={{ fontSize: ".72rem", color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>
                      Posted by {claim.poster_name} · {new Date(claim.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Link to={`/items/${claim.item_id}`} className="btn btn-sm btn-ghost">
                    {claim.status === "approved" ? <><MessageCircle size={12} /> Chat</> : "View"}
                  </Link>
                </div>
                {claim.status === "approved" && (
                  <div style={{ padding: ".5rem 1rem", borderTop: "1px solid rgba(47,93,80,.15)", background: "var(--found-bg)", fontSize: ".78rem", color: "var(--found-green)" }}>
                    🎉 Claim approved! Visit the item page to open the chat and arrange handoff.
                  </div>
                )}
                {claim.status === "rejected" && (
                  <div style={{ padding: ".5rem 1rem", borderTop: "1px solid rgba(181,72,47,.12)", background: "var(--lost-bg)", fontSize: ".78rem", color: "var(--lost-rust)" }}>
                    Claim not approved. You may visit the item page and try claiming again.
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
