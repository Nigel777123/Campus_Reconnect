import { Link } from "react-router-dom";
import { MapPin, Calendar, Tag, Clock } from "lucide-react";
import type { Item } from "../types";
import { CATEGORY_META } from "../types";

interface Props {
  item: Item;
}

export default function ItemCard({ item }: Props) {
  const isLost = item.type === "lost";
  const isResolved = item.status === "resolved";
  const catMeta = CATEGORY_META[item.category] ?? CATEGORY_META.other;
  const questions = (() => {
    try { return JSON.parse(item.verification_questions || "[]"); } catch { return []; }
  })();

  return (
    <Link
      to={`/items/${item.id}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        className={`card glass ${isLost ? "lost-glow" : "found-glow"}`}
        style={{ opacity: isResolved ? 0.65 : 1 }}
      >
        {/* Image */}
        <div style={{
          height: "180px", overflow: "hidden", position: "relative",
          background: isLost
            ? "linear-gradient(135deg, rgba(180,83,9,0.25), rgba(120,53,15,0.15))"
            : "linear-gradient(135deg, rgba(15,118,110,0.25), rgba(6,95,70,0.15))",
        }}>
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "3.5rem", opacity: 0.6
            }}>
              {catMeta.emoji}
            </div>
          )}
          {/* Type badge overlay */}
          <div style={{
            position: "absolute", top: "0.75rem", left: "0.75rem",
            display: "flex", gap: "0.375rem"
          }}>
            <span className={`badge badge-${item.type}`}>
              {isLost ? "🔍" : "✅"} {item.type}
            </span>
            {isResolved && <span className="badge badge-resolved">Resolved</span>}
          </div>
          {/* Verification Q count badge for found items */}
          {!isLost && questions.length > 0 && (
            <div style={{
              position: "absolute", top: "0.75rem", right: "0.75rem",
              background: "rgba(0,0,0,0.6)", borderRadius: "6px",
              padding: "0.2rem 0.5rem", fontSize: "0.7rem", color: "#94a3b8",
              display: "flex", alignItems: "center", gap: "0.3rem"
            }}>
              🔒 {questions.length} Q
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: "1rem" }}>
          {/* Category + title */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.375rem" }}>
            <span style={{ fontSize: "0.8rem" }}>{catMeta.emoji}</span>
            <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {catMeta.label}
            </span>
          </div>
          <h3 style={{
            margin: "0 0 0.5rem", fontSize: "0.975rem", fontWeight: 600,
            color: "#f1f5f9", lineHeight: 1.3,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden"
          }}>{item.title}</h3>

          {item.description && (
            <p style={{
              margin: "0 0 0.75rem", fontSize: "0.8rem", color: "#64748b",
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.5
            }}>{item.description}</p>
          )}

          {/* Meta row */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            {item.location && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.78rem", color: "#64748b" }}>
                <MapPin size={12} style={{ flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.location}</span>
              </div>
            )}
            {item.date && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.78rem", color: "#64748b" }}>
                <Calendar size={12} style={{ flexShrink: 0 }} />
                <span>{new Date(item.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: "0.875rem", paddingTop: "0.75rem",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <span style={{ fontSize: "0.75rem", color: "#475569" }}>
              by {item.poster_name || "Anonymous"}
            </span>
            <span style={{ fontSize: "0.72rem", color: "#334155" }}>
              {timeAgo(item.created_at)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
