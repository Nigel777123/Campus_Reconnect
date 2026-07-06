import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package, Search, CheckCircle, Clock, XCircle, MessageCircle,
  Plus, BarChart3, AlertCircle, RotateCcw
} from "lucide-react";
import { api } from "../api";
import type { DashboardData, Item, Claim } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../components/Notification";

type Tab = "posts" | "claims";
type PostFilter = "all" | "active" | "resolved";

export default function Dashboard() {
  const { user } = useAuth();
  const { success, error } = useNotification();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [postFilter, setPostFilter] = useState<PostFilter>("all");

  const load = () => {
    setLoading(true);
    api.dashboard.get()
      .then(setData)
      .catch(() => error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleReopen = async (itemId: number) => {
    try {
      await api.items.update(itemId, { status: "active" });
      success("Listing reopened");
      load();
    } catch (e: any) { error(e.message); }
  };

  const handleDelete = async (itemId: number) => {
    if (!confirm("Delete this listing?")) return;
    try {
      await api.items.delete(itemId);
      success("Listing deleted");
      load();
    } catch (e: any) { error(e.message); }
  };

  if (loading) return (
    <div className="page" style={{ maxWidth: "900px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: "80px", borderRadius: "1rem" }} />
        ))}
      </div>
    </div>
  );

  const posts = data?.myPosts ?? [];
  const claims = data?.myClaims ?? [];
  const pendingMap = data?.pendingMap ?? {};

  const filteredPosts = posts.filter((p) => {
    if (postFilter === "active") return p.status === "active";
    if (postFilter === "resolved") return p.status === "resolved";
    return true;
  });

  const activePosts = posts.filter((p) => p.status === "active").length;
  const resolvedPosts = posts.filter((p) => p.status === "resolved").length;
  const pendingClaims = claims.filter((c) => c.status === "pending").length;
  const approvedClaims = claims.filter((c) => c.status === "approved").length;

  const claimStatusIcon = (status: string) => {
    if (status === "approved") return <CheckCircle size={14} style={{ color: "#4ade80" }} />;
    if (status === "rejected") return <XCircle size={14} style={{ color: "#f87171" }} />;
    return <Clock size={14} style={{ color: "#fbbf24" }} />;
  };

  return (
    <div className="page" style={{ maxWidth: "900px" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{
              fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 800,
              margin: "0 0 0.25rem",
              background: "linear-gradient(90deg, #f1f5f9, #a4bcfd)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>My Dashboard</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "0.9rem" }}>
              Welcome back, {user?.name} 👋
            </p>
          </div>
          <Link to="/post" className="btn btn-primary">
            <Plus size={15} /> Post Item
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.875rem", marginBottom: "1.75rem" }}>
        {[
          { label: "Active Posts", value: activePosts, color: "#6175f7", icon: Package },
          { label: "Resolved", value: resolvedPosts, color: "#4ade80", icon: CheckCircle },
          { label: "Pending Claims", value: pendingClaims, color: "#fbbf24", icon: Clock },
          { label: "Approved Claims", value: approvedClaims, color: "#2dd4bf", icon: MessageCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="glass" style={{ borderRadius: "0.875rem", padding: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "1.6rem", fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>{label}</div>
              </div>
              <Icon size={20} style={{ color, opacity: 0.5 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Pending claims alerts */}
      {Object.entries(pendingMap).map(([itemId, count]) => {
        const post = posts.find((p) => p.id === Number(itemId));
        if (!post) return null;
        return (
          <div key={itemId} style={{
            background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)",
            borderRadius: "0.875rem", padding: "0.875rem 1.125rem",
            marginBottom: "0.5rem", display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: "0.875rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", fontSize: "0.875rem" }}>
              <AlertCircle size={16} style={{ color: "#fbbf24", flexShrink: 0 }} />
              <span style={{ color: "#e2e8f0" }}>
                <strong>{count}</strong> pending claim{count > 1 ? "s" : ""} on <strong>"{post.title}"</strong>
              </span>
            </div>
            <Link to={`/items/${itemId}`} className="btn btn-sm btn-ghost" style={{ borderColor: "rgba(251,191,36,0.3)", color: "#fbbf24" }}>
              Review
            </Link>
          </div>
        );
      })}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.25rem", background: "rgba(255,255,255,0.03)", borderRadius: "0.75rem", padding: "0.25rem" }}>
        {(["posts", "claims"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: "0.6rem",
              borderRadius: "0.5rem", border: "none", cursor: "pointer",
              background: activeTab === tab ? "rgba(97,117,247,0.2)" : "transparent",
              color: activeTab === tab ? "#a4bcfd" : "#64748b",
              fontWeight: 500, fontSize: "0.875rem",
              transition: "all 0.15s"
            }}
          >
            {tab === "posts" ? `My Posts (${posts.length})` : `My Claims (${claims.length})`}
          </button>
        ))}
      </div>

      {/* ── My Posts ─────────────────────────────────────────────────────── */}
      {activeTab === "posts" && (
        <>
          <div style={{ display: "flex", gap: "0.375rem", marginBottom: "1rem" }}>
            {(["all", "active", "resolved"] as PostFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setPostFilter(f)}
                className={`btn btn-sm ${postFilter === f ? "btn-primary" : "btn-ghost"}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {filteredPosts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>No {postFilter !== "all" ? postFilter : ""} posts yet</h3>
              <p style={{ marginBottom: "1rem" }}>Post your first lost or found item!</p>
              <Link to="/post" className="btn btn-primary"><Plus size={15} /> Post Item</Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {filteredPosts.map((post) => {
                const pending = pendingMap[post.id] || 0;
                return (
                  <div key={post.id} className="glass" style={{ borderRadius: "0.875rem", overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "1rem", padding: "1rem", alignItems: "center" }}>
                      {/* Image or emoji */}
                      <div style={{
                        width: "64px", height: "64px", borderRadius: "0.625rem", overflow: "hidden", flexShrink: 0,
                        background: post.type === "lost"
                          ? "rgba(180,83,9,0.2)" : "rgba(15,118,110,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        {post.image_url
                          ? <img src={post.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <span style={{ fontSize: "1.75rem" }}>{post.type === "lost" ? "🔍" : "✅"}</span>
                        }
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", gap: "0.375rem", marginBottom: "0.3rem", flexWrap: "wrap" }}>
                          <span className={`badge badge-${post.type}`}>{post.type}</span>
                          <span className={`badge badge-${post.status}`}>{post.status}</span>
                          {pending > 0 && (
                            <span className="badge badge-pending">⚡ {pending} pending</span>
                          )}
                        </div>
                        <Link to={`/items/${post.id}`} style={{ textDecoration: "none" }}>
                          <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#f1f5f9", marginBottom: "0.2rem" }}>{post.title}</div>
                        </Link>
                        <div style={{ fontSize: "0.75rem", color: "#475569" }}>
                          {post.location} · {new Date(post.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", alignItems: "flex-end" }}>
                        <Link to={`/items/${post.id}`} className="btn btn-ghost btn-sm">View</Link>
                        {post.status === "resolved" && (
                          <button onClick={() => handleReopen(post.id)} className="btn btn-ghost btn-sm" style={{ fontSize: "0.72rem" }}>
                            <RotateCcw size={11} /> Reopen
                          </button>
                        )}
                        <button onClick={() => handleDelete(post.id)} className="btn btn-sm" style={{
                          background: "rgba(239,68,68,0.08)", color: "#f87171",
                          border: "1px solid rgba(239,68,68,0.2)", fontSize: "0.72rem"
                        }}>Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── My Claims ────────────────────────────────────────────────────── */}
      {activeTab === "claims" && (
        claims.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No claims submitted</h3>
            <p>Browse found items and submit a claim if you recognize your belongings.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {claims.map((claim) => (
              <div key={claim.id} className="glass" style={{ borderRadius: "0.875rem", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "1rem", padding: "1rem", alignItems: "center" }}>
                  <div style={{
                    width: "56px", height: "56px", borderRadius: "0.625rem", overflow: "hidden",
                    background: "rgba(15,118,110,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {claim.image_url
                      ? <img src={claim.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: "1.5rem" }}>✅</span>
                    }
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", gap: "0.375rem", marginBottom: "0.3rem" }}>
                      <span className={`badge badge-${claim.status}`}>
                        {claimStatusIcon(claim.status)} {claim.status}
                      </span>
                    </div>
                    <Link to={`/items/${claim.item_id}`} style={{ textDecoration: "none" }}>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#f1f5f9", marginBottom: "0.2rem" }}>
                        {claim.item_title}
                      </div>
                    </Link>
                    <div style={{ fontSize: "0.75rem", color: "#475569" }}>
                      Posted by {claim.poster_name} · {new Date(claim.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <Link to={`/items/${claim.item_id}`} className="btn btn-ghost btn-sm">
                      {claim.status === "approved" ? <><MessageCircle size={13} /> Chat</> : "View"}
                    </Link>
                  </div>
                </div>
                {claim.status === "approved" && (
                  <div style={{
                    padding: "0.625rem 1rem", borderTop: "1px solid rgba(34,197,94,0.15)",
                    background: "rgba(34,197,94,0.06)", fontSize: "0.8rem", color: "#4ade80"
                  }}>
                    🎉 Claim approved! Visit the item page to open the chat and arrange handoff.
                  </div>
                )}
                {claim.status === "rejected" && (
                  <div style={{
                    padding: "0.625rem 1rem", borderTop: "1px solid rgba(239,68,68,0.15)",
                    background: "rgba(239,68,68,0.05)", fontSize: "0.8rem", color: "#f87171"
                  }}>
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
