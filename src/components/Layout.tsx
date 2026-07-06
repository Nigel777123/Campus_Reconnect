import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  Plus, LayoutDashboard, LogOut, LogIn, Bell, Shield,
  Menu, X, ChevronDown
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../api";
import type { Notification } from "../types";

interface Props { children: React.ReactNode; }

export default function Layout({ children }: Props) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef  = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    setMobileOpen(false); setNotifOpen(false); setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) return;
    const load = () => api.notifications.list().then(setNotifications).catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current  && !userRef.current.contains(e.target as Node))  setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkAllRead = async () => {
    await api.notifications.markAllRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
  };

  const handleLogout = () => { logout(); navigate("/"); };

  const navLink = (to: string, label: string) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        style={{
          fontSize: ".85rem", fontWeight: 600, fontFamily: "var(--font-mono)",
          textTransform: "uppercase", letterSpacing: ".06em",
          color: active ? "var(--ink-navy)" : "var(--text-muted)",
          textDecoration: "none", padding: ".25rem 0",
          borderBottom: active ? "2px solid var(--brass)" : "2px solid transparent",
          transition: "all .14s",
        }}
      >
        {label}
      </Link>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* ── NAV ─────────────────────────────────────────── */}
      <header style={{
        background: "rgba(246,241,231,0.94)",
        borderBottom: "2px solid var(--bg-border)",
        backdropFilter: "blur(10px)",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{
          maxWidth: "1280px", margin: "0 auto", padding: "0 1.25rem",
          height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1.25rem",
        }}>
          {/* Logo */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: ".6rem", textDecoration: "none" }}>
            <div style={{
              width: "34px", height: "34px", borderRadius: "6px",
              background: "var(--ink-navy)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px",
            }}>🎓</div>
            <span style={{
              fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "1.1rem",
              color: "var(--ink-navy)", letterSpacing: "-.01em",
            }}>Campus Reconnect</span>
          </Link>

          {/* Desktop nav links */}
          <nav style={{ display: "flex", alignItems: "center", gap: "1.5rem" }} className="hide-mobile">
            {navLink("/", "Board")}
            {user && navLink("/dashboard", "Dashboard")}
            {isAdmin && navLink("/admin", "Admin")}
          </nav>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: ".625rem" }}>
            {user ? (
              <>
                {/* Post button */}
                <Link to="/post" className="btn btn-brass btn-sm hide-mobile">
                  <Plus size={14} /> Post Item
                </Link>

                {/* Notifications */}
                <div ref={notifRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => { setNotifOpen((p) => !p); setUserMenuOpen(false); }}
                    style={{
                      background: "none", border: "1.5px solid var(--bg-border)",
                      borderRadius: "2px", cursor: "pointer", padding: ".35rem .5rem",
                      display: "flex", alignItems: "center", gap: ".25rem",
                      color: "var(--text-secondary)", position: "relative",
                    }}
                  >
                    <Bell size={16} />
                    {unreadCount > 0 && (
                      <span style={{
                        position: "absolute", top: "-6px", right: "-6px",
                        background: "var(--lost-rust)", color: "white",
                        borderRadius: "50%", width: "17px", height: "17px",
                        fontSize: ".6rem", fontWeight: 700, fontFamily: "var(--font-mono)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>{unreadCount > 9 ? "9+" : unreadCount}</span>
                    )}
                  </button>

                  {notifOpen && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 8px)", right: 0,
                      width: "320px", background: "var(--bg-card)",
                      border: "1.5px solid var(--bg-border)", borderRadius: "3px",
                      boxShadow: "2px 4px 0 var(--paper-shadow), 6px 12px 24px rgba(27,42,74,.16)",
                      zIndex: 50,
                    }}>
                      <div style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: ".75rem 1rem", borderBottom: "1px solid var(--bg-border)",
                      }}>
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: ".95rem", color: "var(--ink-navy)" }}>
                          Notifications
                        </span>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead} className="btn btn-sm btn-ghost" style={{ fontSize: ".68rem" }}>
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                        {notifications.length === 0 ? (
                          <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--text-faint)", fontSize: ".85rem" }}>
                            No notifications yet
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((n) => (
                            <div
                              key={n.id}
                              onClick={() => { n.link && navigate(n.link); setNotifOpen(false); }}
                              style={{
                                padding: ".75rem 1rem",
                                background: n.read ? "transparent" : "rgba(201,162,39,.06)",
                                borderBottom: "1px solid var(--bg-border)",
                                cursor: n.link ? "pointer" : "default",
                                transition: "background .14s",
                              }}
                            >
                              <div style={{ fontSize: ".82rem", color: "var(--text-primary)", marginBottom: ".2rem" }}>{n.message}</div>
                              <div style={{ fontSize: ".7rem", color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>
                                {new Date(n.created_at).toLocaleString()}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User menu */}
                <div ref={userRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => { setUserMenuOpen((p) => !p); setNotifOpen(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: ".4rem",
                      background: "none", border: "1.5px solid var(--bg-border)",
                      borderRadius: "2px", cursor: "pointer", padding: ".35rem .65rem",
                      color: "var(--text-secondary)", transition: "all .14s",
                    }}
                  >
                    <div style={{
                      width: "24px", height: "24px", borderRadius: "50%",
                      background: "var(--ink-navy)", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: ".8rem", color: "var(--paper-cream)", fontWeight: 700,
                    }}>{user.name.charAt(0).toUpperCase()}</div>
                    <span style={{ fontSize: ".82rem", fontWeight: 500, color: "var(--text-primary)" }} className="hide-mobile">
                      {user.name.split(" ")[0]}
                    </span>
                    <ChevronDown size={13} />
                  </button>

                  {userMenuOpen && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 8px)", right: 0,
                      minWidth: "180px", background: "var(--bg-card)",
                      border: "1.5px solid var(--bg-border)", borderRadius: "3px",
                      boxShadow: "2px 4px 0 var(--paper-shadow), 6px 12px 24px rgba(27,42,74,.16)",
                      zIndex: 50, overflow: "hidden",
                    }}>
                      {isAdmin && (
                        <Link to="/admin" style={{ display: "flex", alignItems: "center", gap: ".625rem", padding: ".7rem 1rem", color: "var(--found-green)", fontSize: ".85rem", textDecoration: "none", borderBottom: "1px solid var(--bg-border)" }}>
                          <Shield size={14} /> Admin Panel
                        </Link>
                      )}
                      <Link to="/dashboard" style={{ display: "flex", alignItems: "center", gap: ".625rem", padding: ".7rem 1rem", color: "var(--text-primary)", fontSize: ".85rem", textDecoration: "none", borderBottom: "1px solid var(--bg-border)" }}>
                        <LayoutDashboard size={14} /> Dashboard
                      </Link>
                      <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: ".625rem", padding: ".7rem 1rem", color: "var(--lost-rust)", fontSize: ".85rem", background: "none", border: "none", width: "100%", cursor: "pointer", textAlign: "left" }}>
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login"    className="btn btn-ghost btn-sm">Sign In</Link>
                <Link to="/register" className="btn btn-brass btn-sm">Sign Up</Link>
              </>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setMobileOpen((p) => !p)}
              style={{
                display: "none", background: "none", border: "1.5px solid var(--bg-border)",
                borderRadius: "2px", cursor: "pointer", padding: ".35rem .45rem",
                color: "var(--text-secondary)",
              }}
              className="show-mobile"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div style={{
            borderTop: "1px solid var(--bg-border)",
            background: "var(--paper-cream)",
            padding: ".875rem 1.25rem",
            display: "flex", flexDirection: "column", gap: ".5rem",
          }}>
            <Link to="/"         style={{ padding: ".6rem 0", color: "var(--text-primary)", textDecoration: "none", fontWeight: 500 }}>🪧 Browse Board</Link>
            {user && <Link to="/post"      style={{ padding: ".6rem 0", color: "var(--text-primary)", textDecoration: "none", fontWeight: 500 }}>📌 Post Item</Link>}
            {user && <Link to="/dashboard" style={{ padding: ".6rem 0", color: "var(--text-primary)", textDecoration: "none", fontWeight: 500 }}>📋 Dashboard</Link>}
            {isAdmin && <Link to="/admin"  style={{ padding: ".6rem 0", color: "var(--found-green)", textDecoration: "none", fontWeight: 500 }}>🛡 Admin</Link>}
            {user
              ? <button onClick={handleLogout} style={{ padding: ".6rem 0", color: "var(--lost-rust)", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontWeight: 500, fontSize: "1rem" }}>Sign Out</button>
              : <Link to="/login" style={{ padding: ".6rem 0", color: "var(--ink-navy)", textDecoration: "none", fontWeight: 500 }}>Sign In</Link>
            }
          </div>
        )}
      </header>

      {/* ── MAIN ───────────────────────────────────────── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </main>

      {/* ── FOOTER ─────────────────────────────────────── */}
      <footer style={{
        borderTop: "2px solid var(--bg-border)",
        background: "var(--paper-warm)",
        padding: "1rem 1.5rem",
        textAlign: "center",
        color: "var(--text-faint)",
        fontSize: ".78rem",
        fontFamily: "var(--font-mono)",
      }}>
        Campus Reconnect — Helping students find what matters © {new Date().getFullYear()}
      </footer>

      {/* Responsive helper styles */}
      <style>{`
        @media (max-width: 640px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 641px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
