import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  Search, Plus, LayoutDashboard, LogOut, LogIn, Bell, Shield,
  Menu, X, ChevronDown, MapPin
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../api";
import type { Notification } from "../types";

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    setMobileOpen(false);
    setNotifOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) return;
    const load = () => api.notifications.list().then(setNotifications).catch(() => {});
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const handleMarkRead = async () => {
    await api.notifications.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(8, 11, 20, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{
          maxWidth: "1280px", margin: "0 auto",
          padding: "0 1rem",
          display: "flex", alignItems: "center", height: "64px", gap: "1.5rem"
        }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{
              width: "32px", height: "32px",
              background: "linear-gradient(135deg, #6175f7, #14b8a6)",
              borderRadius: "8px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "16px"
            }}>🎓</div>
            <span style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800, fontSize: "1.1rem",
              background: "linear-gradient(90deg, #a4bcfd, #5eead4)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>Campus Reconnect</span>
          </Link>

          {/* Desktop nav links */}
          <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: "0.25rem", flex: 1 }}>
            <Link to="/" className={`nav-link ${isActive("/") ? "nav-link-active" : ""}`}>Browse</Link>
            {user && (
              <Link to="/dashboard" className={`nav-link ${isActive("/dashboard") ? "nav-link-active" : ""}`}>Dashboard</Link>
            )}
            {isAdmin && (
              <Link to="/admin" className={`nav-link ${isActive("/admin") ? "nav-link-active" : ""}`}>
                <Shield size={14} style={{ display: "inline", marginRight: "4px" }} />Admin
              </Link>
            )}
          </div>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {user && (
              <>
                {/* Post button */}
                <Link to="/post" className="btn btn-primary btn-sm" style={{ gap: "0.35rem" }}>
                  <Plus size={15} /> Post Item
                </Link>

                {/* Notifications */}
                <div ref={notifRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setNotifOpen((p) => !p)}
                    style={{
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "10px", padding: "0.45rem", cursor: "pointer",
                      color: "#94a3b8", display: "flex", alignItems: "center", position: "relative"
                    }}
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span style={{
                        position: "absolute", top: "-4px", right: "-4px",
                        background: "#6175f7", color: "white",
                        borderRadius: "99px", fontSize: "0.65rem", fontWeight: 700,
                        minWidth: "16px", height: "16px", display: "flex",
                        alignItems: "center", justifyContent: "center", padding: "0 3px"
                      }}>{unreadCount}</span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="glass" style={{
                      position: "absolute", right: 0, top: "calc(100% + 8px)",
                      width: "340px", borderRadius: "1rem",
                      boxShadow: "0 20px 60px rgba(0,0,0,0.5)", overflow: "hidden", zIndex: 50
                    }}>
                      <div style={{
                        padding: "1rem", display: "flex", justifyContent: "space-between",
                        alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)"
                      }}>
                        <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Notifications</span>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkRead} style={{
                            background: "none", border: "none", color: "#6175f7",
                            fontSize: "0.78rem", cursor: "pointer", fontWeight: 500
                          }}>Mark all read</button>
                        )}
                      </div>
                      <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                        {notifications.length === 0 ? (
                          <div style={{ padding: "2rem", textAlign: "center", color: "#475569", fontSize: "0.85rem" }}>
                            No notifications yet
                          </div>
                        ) : notifications.map((n) => (
                          <div key={n.id} style={{
                            padding: "0.875rem 1rem",
                            background: n.read ? "transparent" : "rgba(97,117,247,0.06)",
                            borderBottom: "1px solid rgba(255,255,255,0.04)",
                            cursor: "pointer",
                          }}>
                            <div style={{ fontWeight: 500, fontSize: "0.85rem", color: "#e2e8f0" }}>{n.title}</div>
                            {n.body && <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "2px" }}>{n.body}</div>}
                            <div style={{ fontSize: "0.72rem", color: "#475569", marginTop: "4px" }}>
                              {new Date(n.created_at).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* User menu */}
                <div ref={userRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setUserMenuOpen((p) => !p)}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.5rem",
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "10px", padding: "0.35rem 0.75rem 0.35rem 0.5rem",
                      cursor: "pointer", color: "#e2e8f0"
                    }}
                  >
                    <div style={{
                      width: "28px", height: "28px",
                      background: "linear-gradient(135deg, #6175f7, #14b8a6)",
                      borderRadius: "50%", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "white"
                    }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 500, maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.name}
                    </span>
                    <ChevronDown size={14} style={{ color: "#64748b" }} />
                  </button>
                  {userMenuOpen && (
                    <div className="glass" style={{
                      position: "absolute", right: 0, top: "calc(100% + 8px)",
                      width: "200px", borderRadius: "0.875rem",
                      boxShadow: "0 20px 60px rgba(0,0,0,0.5)", overflow: "hidden", zIndex: 50
                    }}>
                      <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#e2e8f0" }}>{user.name}</div>
                        <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>{user.email}</div>
                      </div>
                      <Link to="/dashboard" style={{
                        display: "flex", alignItems: "center", gap: "0.5rem",
                        padding: "0.7rem 1rem", color: "#94a3b8",
                        textDecoration: "none", fontSize: "0.85rem",
                        transition: "background 0.1s"
                      }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                      >
                        <LayoutDashboard size={15} /> Dashboard
                      </Link>
                      <button onClick={handleLogout} style={{
                        display: "flex", alignItems: "center", gap: "0.5rem",
                        padding: "0.7rem 1rem", color: "#f87171",
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: "0.85rem", width: "100%", textAlign: "left",
                        transition: "background 0.1s"
                      }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                      >
                        <LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {!user && (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileOpen((p) => !p)}
              style={{
                display: "none", background: "none", border: "none",
                cursor: "pointer", color: "#94a3b8", padding: "0.25rem"
              }}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="glass" style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            padding: "1rem"
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <Link to="/" className="btn btn-ghost" style={{ justifyContent: "flex-start" }}>Browse Items</Link>
              {user && (
                <>
                  <Link to="/post" className="btn btn-primary" style={{ justifyContent: "flex-start" }}>
                    <Plus size={15} /> Post Item
                  </Link>
                  <Link to="/dashboard" className="btn btn-ghost" style={{ justifyContent: "flex-start" }}>
                    <LayoutDashboard size={15} /> Dashboard
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="btn btn-ghost" style={{ justifyContent: "flex-start" }}>
                      <Shield size={15} /> Admin
                    </Link>
                  )}
                  <button onClick={handleLogout} className="btn btn-danger" style={{ justifyContent: "flex-start" }}>
                    <LogOut size={15} /> Sign Out
                  </button>
                </>
              )}
              {!user && (
                <>
                  <Link to="/login" className="btn btn-ghost">Sign In</Link>
                  <Link to="/register" className="btn btn-primary">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }} className="bg-mesh">
        {children}
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "1.5rem",
        textAlign: "center",
        color: "#334155",
        fontSize: "0.8rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
          <MapPin size={12} />
          Campus Reconnect — Helping students find what matters © {new Date().getFullYear()}
        </div>
      </footer>

      <style>{`
        .nav-link {
          display: inline-flex; align-items: center; gap: 0.3rem;
          padding: 0.4rem 0.875rem; border-radius: 0.5rem;
          font-size: 0.875rem; font-weight: 500; color: #64748b;
          text-decoration: none; transition: all 0.15s;
        }
        .nav-link:hover { color: #e2e8f0; background: rgba(255,255,255,0.05); }
        .nav-link-active { color: #e2e8f0; background: rgba(97,117,247,0.12); }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
