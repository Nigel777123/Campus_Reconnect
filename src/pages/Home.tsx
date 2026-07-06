import React from "react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, ChevronDown } from "lucide-react";
import { api } from "../api";
import type { Item, ItemFilters as Filters } from "../types";
import ItemCard from "../components/ItemCard";
import ItemFilters from "../components/ItemFilters";
import { useAuth } from "../contexts/AuthContext";

/* ── Static hero demo tags ───────────────────────────────────────── */
const HERO_TAGS = [
  {
    type: "lost" as const, emoji: "🔍",
    title: "iPhone 14 Pro",
    detail: "Black case, cracked corner",
    location: "Main Library",
    when: "2 days ago",
    tilt: "-3.5deg", delay: "0s",
  },
  {
    type: "found" as const, emoji: "✅",
    title: "Student ID Card",
    detail: "Name: J. Rivera",
    location: "Cafeteria",
    when: "3 hours ago",
    tilt: "2deg", delay: "0.18s",
  },
  {
    type: "lost" as const, emoji: "🔍",
    title: "Blue Northface Bag",
    detail: "With laptop + notebooks",
    location: "Engineering Bldg",
    when: "Yesterday",
    tilt: "-1.5deg", delay: "0.34s",
  },
  {
    type: "found" as const, emoji: "✅",
    title: "Silver AirPods",
    detail: "Pro, left & right",
    location: "Gymnasium",
    when: "3 days ago",
    tilt: "3deg", delay: "0.50s",
  },
];

const HOW_STEPS = [
  {
    icon: "📌",
    title: "Post to the Board",
    body: "Pin a 'Found' listing with 1–3 private verification questions. Or post a 'Lost' listing so finders can reach you.",
  },
  {
    icon: "🔐",
    title: "Verify Ownership",
    body: "Claimants answer your secret questions. You compare their answers to yours — no guessing, no spam.",
  },
  {
    icon: "💬",
    title: "Chat & Return",
    body: "Approve a correct claim to reveal contact info and open a private chat. Arrange the handoff on your terms.",
  },
];

export default function Home() {
  const { user } = useAuth();
  const [items, setItems]     = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [stats, setStats]     = useState({ lost: 0, found: 0, resolved: 0 });
  const [filters, setFilters] = useState<Filters>({
    search: "", type: "", category: "", status: "active",
    dateFrom: "", dateTo: "", page: 1, limit: 18,
  });

  useEffect(() => {
    setLoading(true);
    api.items.list(filters)
      .then((r) => { setItems(r); setTotal(r.length); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    // API stats requires admin, so default to 0 for users if missing
    api.admin.stats().then((s) => setStats({ lost: s.totalItems, found: 0, resolved: s.resolvedItems })).catch(() => {});
  }, []);

  const loadMore = () => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }));

  return (
    <div>
      {/* ══════════════════════════════════════════════════════
          CORK BOARD HERO
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: "2.5rem 1.25rem 3rem", background: "var(--paper-warm)", borderBottom: "2px solid var(--bg-border)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

          {/* Tagline above board */}
          <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <div style={{
              display: "inline-block", fontFamily: "var(--font-mono)", fontSize: ".72rem",
              fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase",
              color: "var(--brass-dark)", background: "var(--brass-light)",
              border: "1.5px solid rgba(201,162,39,.3)", borderRadius: "2px",
              padding: ".25rem .875rem", marginBottom: "1.1rem",
            }}>📋 Campus Lost &amp; Found Platform</div>

            <h1 style={{
              fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(2rem, 5vw, 3rem)",
              color: "var(--ink-navy)", margin: "0 0 .625rem", lineHeight: 1.1,
            }}>
              Lost Something?<br />
              <span style={{ fontStyle: "italic", color: "var(--cork-dark)" }}>We'll Help You Find It.</span>
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "1rem", maxWidth: "520px", margin: "0 auto" }}>
              A verified campus bulletin board — finders and owners connect through secure claims, no spam, no guessing.
            </p>
          </div>

          {/* THE CORK BOARD ────────────────────────────── */}
          <div
            className="corkboard corkboard-frame"
            style={{ padding: "2.5rem 1.5rem 2rem", margin: "0 auto", maxWidth: "960px" }}
          >
            {/* Board title strip */}
            <div style={{
              textAlign: "center", marginBottom: "2rem",
              fontFamily: "var(--font-display)", fontStyle: "italic",
              fontWeight: 700, fontSize: "1.05rem", color: "rgba(246,241,231,0.55)",
              letterSpacing: ".04em",
            }}>
              📋 What's pinned today
            </div>

            {/* Pins grid */}
            <div style={{
              display: "flex", flexWrap: "wrap", justifyContent: "center",
              gap: "1.5rem", paddingBottom: ".5rem",
            }}>
              {HERO_TAGS.map((tag, i) => (
                <div
                  key={i}
                  className="paper-tag"
                  style={{
                    "--tag-tilt": tag.tilt,
                    "--pin-delay": tag.delay,
                    minWidth: "160px", maxWidth: "200px",
                  } as React.CSSProperties}
                >
                  <div className="paper-pin" />

                  {/* Badge */}
                  <span className={`badge badge-${tag.type}`} style={{ marginBottom: ".5rem", display: "inline-flex" }}>
                    {tag.emoji} {tag.type}
                  </span>

                  {/* Title */}
                  <div style={{
                    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: ".95rem",
                    color: "var(--ink-navy)", marginBottom: ".25rem", lineHeight: 1.3,
                  }}>{tag.title}</div>

                  {/* Detail */}
                  <div style={{ fontSize: ".72rem", color: "var(--text-muted)", marginBottom: ".5rem", lineHeight: 1.4 }}>
                    {tag.detail}
                  </div>

                  {/* Metadata */}
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: ".62rem", color: "var(--text-faint)" }}>
                    📍 {tag.location}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: ".6rem", color: "var(--text-faint)" }}>
                    🕐 {tag.when}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA row */}
          <div style={{ display: "flex", gap: ".875rem", justifyContent: "center", marginTop: "1.75rem", flexWrap: "wrap" }}>
            {user ? (
              <Link to="/post" className="btn btn-brass btn-lg">
                <Plus size={17} /> Post to the Board
              </Link>
            ) : (
              <Link to="/register" className="btn btn-brass btn-lg">
                <Plus size={17} /> Get Started — It's Free
              </Link>
            )}
            <a href="#board" className="btn btn-ghost btn-lg" style={{ border: "1.5px solid var(--bg-border)" }}>
              Browse Items <ChevronDown size={16} />
            </a>
          </div>

          {/* Stats strip */}
          <div style={{ display: "flex", gap: "2.5rem", justifyContent: "center", marginTop: "2rem", flexWrap: "wrap" }}>
            {[
              { value: stats.lost,     label: "Lost Items" },
              { value: stats.found,    label: "Found Items" },
              { value: stats.resolved, label: "Reunited" },
            ].map(({ value, label }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.6rem", color: "var(--ink-navy)" }}>
                  {value}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: ".68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".07em" }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          ITEMS FEED
      ══════════════════════════════════════════════════════ */}
      <section id="board" style={{ maxWidth: "1280px", margin: "0 auto", padding: "2.25rem 1.25rem 3rem" }}>
        {/* Section heading */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: ".75rem" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.5rem", color: "var(--ink-navy)", margin: 0 }}>
            Browse the Board
          </h2>
          {user && (
            <Link to="/post" className="btn btn-brass btn-sm">
              <Plus size={14} /> Post Item
            </Link>
          )}
        </div>

        {/* Filters */}
        <div style={{ marginBottom: "1.5rem" }}>
          <ItemFilters filters={filters} onChange={setFilters} />
        </div>

        {/* Result count */}
        <div style={{ fontFamily: "var(--font-mono)", fontSize: ".72rem", color: "var(--text-faint)", marginBottom: "1.25rem", textTransform: "uppercase", letterSpacing: ".06em" }}>
          {loading ? "Searching…" : `${total} item${total !== 1 ? "s" : ""} found`}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="items-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: "240px" }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🪧</div>
            <h3>Nothing on the board yet</h3>
            <p style={{ marginBottom: "1.25rem" }}>Be the first to post a lost or found item!</p>
            {user ? (
              <Link to="/post" className="btn btn-brass"><Plus size={15} /> Post Item</Link>
            ) : (
              <Link to="/register" className="btn btn-primary">Sign up to post</Link>
            )}
          </div>
        ) : (
          <>
            <div className="items-grid">
              {items.map((item, i) => <ItemCard key={item.id} item={item} index={i} />)}
            </div>
            {items.length < total && (
              <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
                <button onClick={loadMore} className="btn btn-ghost btn-lg">
                  <ChevronDown size={16} /> Load more
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS — index-card explainer
      ══════════════════════════════════════════════════════ */}
      <section style={{ background: "var(--paper-warm)", borderTop: "2px solid var(--bg-border)", padding: "3.5rem 1.25rem" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.75rem",
            color: "var(--ink-navy)", textAlign: "center", margin: "0 0 .5rem",
          }}>How It Works</h2>
          <p style={{ textAlign: "center", color: "var(--text-muted)", margin: "0 0 2.5rem", fontSize: ".95rem" }}>
            Three steps — verified, private, campus-safe.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
            {HOW_STEPS.map((step, i) => {
              const tilts = ["-1.8deg", "1.4deg", "-0.9deg"];
              return (
                <div
                  key={i}
                  className="paper-surface paper-ruled"
                  style={{
                    padding: "1.5rem 1.375rem",
                    transform: `rotate(${tilts[i]})`,
                    transition: "transform .22s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "rotate(0deg) translateY(-4px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = `rotate(${tilts[i]})`)}
                >
                  <div style={{ fontSize: "2rem", marginBottom: ".875rem" }}>{step.icon}</div>
                  <h3 style={{
                    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem",
                    color: "var(--ink-navy)", margin: "0 0 .625rem",
                  }}>{step.title}</h3>
                  <p style={{ fontSize: ".875rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.65 }}>{step.body}</p>
                </div>
              );
            })}
          </div>

          {!user && (
            <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
              <Link to="/register" className="btn btn-primary btn-lg">
                Join Campus Reconnect
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
