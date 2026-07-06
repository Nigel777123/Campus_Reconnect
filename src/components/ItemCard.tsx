import React from "react";
import { Link } from "react-router-dom";
import type { Item } from "../types";
import { MapPin, Clock } from "lucide-react";

const CATEGORY_ICONS: Record<string, string> = {
  electronics: "💻", "id/cards": "🪪", clothing: "👕",
  keys: "🔑", bags: "🎒", other: "📦",
};

const TILTS = [-1.8, 0.8, -0.5, 1.4, -1.2, 0.6, -0.3, 1.5, -0.9, 0.4];

interface Props {
  item: Item;
  index?: number;
  key?: React.Key;
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ItemCard({ item, index = 0 }: Props) {
  const tilt  = TILTS[item.id % TILTS.length];
  const delay = Math.min(index * 0.06, 0.6);
  const icon  = CATEGORY_ICONS[item.category?.toLowerCase() ?? ""] ?? "📦";

  return (
    <Link
      to={`/items/${item.id}`}
      className="item-card"
      style={{
        "--card-tilt":  `${tilt}deg`,
        "--card-delay": `${delay}s`,
      } as React.CSSProperties}
    >
      {/* Photo or category icon */}
      <div style={{ position: "relative" }}>
        {item.image_url ? (
          <div style={{ height: "160px", overflow: "hidden", background: "var(--paper-warm)" }}>
            <img
              src={item.image_url}
              alt={item.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              loading="lazy"
            />
          </div>
        ) : (
          <div style={{
            height: "100px", display: "flex", alignItems: "center", justifyContent: "center",
            background: item.type === "lost"
              ? "linear-gradient(135deg, var(--lost-bg), #F0DED7)"
              : "linear-gradient(135deg, var(--found-bg), #D0E8E0)",
            fontSize: "2.5rem",
          }}>
            {icon}
          </div>
        )}

        {/* Status badge — absolute top-left */}
        <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 4 }}>
          <span className={`badge badge-${item.type}`}>{item.type}</span>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: "1rem 1rem .875rem" }}>
        {/* Title */}
        <h3 style={{
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem",
          color: "var(--ink-navy)", margin: "0 0 .5rem", lineHeight: 1.3,
          paddingRight: "1rem", /* clear folded corner */
        }}>{item.title}</h3>

        {/* Description */}
        {item.description && (
          <p style={{
            fontSize: ".82rem", color: "var(--text-muted)",
            margin: "0 0 .75rem", lineHeight: 1.5,
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>{item.description}</p>
        )}

        {/* Metadata — mono font, like index card */}
        <div style={{ display: "flex", flexDirection: "column", gap: ".3rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: ".35rem", fontSize: ".72rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            <MapPin size={11} style={{ color: "var(--brass)", flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.location}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: ".35rem", fontSize: ".72rem", fontFamily: "var(--font-mono)", color: "var(--text-faint)" }}>
            <Clock size={11} style={{ flexShrink: 0 }} />
            {timeAgo(item.created_at)}
          </div>
        </div>
      </div>

      {/* Status ribbon for resolved items */}
      {item.status === "resolved" && (
        <div style={{
          background: "var(--found-bg)", borderTop: "1px solid rgba(47,93,80,.2)",
          padding: ".4rem 1rem", fontSize: ".7rem", fontFamily: "var(--font-mono)",
          color: "var(--found-green)", fontWeight: 600, letterSpacing: ".05em",
          textTransform: "uppercase",
        }}>
          ✓ Resolved
        </div>
      )}
    </Link>
  );
}
