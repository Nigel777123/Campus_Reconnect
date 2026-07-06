import { Search, SlidersHorizontal, X } from "lucide-react";
import type { ItemFilters } from "../types";
import { CATEGORY_META } from "../types";

interface Props {
  filters: ItemFilters;
  onChange: (f: Partial<ItemFilters>) => void;
  onReset: () => void;
  total: number;
}

const CATEGORIES = Object.entries(CATEGORY_META) as [keyof typeof CATEGORY_META, { label: string; emoji: string }][];

export default function ItemFilters({ filters, onChange, onReset, total }: Props) {
  const hasActiveFilters = filters.q || filters.type || filters.category || filters.date_from || filters.date_to;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* Search bar */}
      <div style={{ position: "relative" }}>
        <Search size={16} style={{
          position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)",
          color: "#475569", pointerEvents: "none"
        }} />
        <input
          className="input"
          type="text"
          placeholder="Search items, descriptions, locations..."
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
          style={{ paddingLeft: "2.5rem", paddingRight: filters.q ? "2.5rem" : "0.875rem" }}
        />
        {filters.q && (
          <button onClick={() => onChange({ q: "" })} style={{
            position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", color: "#64748b",
            display: "flex", padding: 0
          }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter row */}
      <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap", alignItems: "center" }}>
        {/* Type filter */}
        <div style={{ display: "flex", gap: "0.375rem" }}>
          {["", "lost", "found"].map((t) => (
            <button
              key={t || "all"}
              onClick={() => onChange({ type: t })}
              className={`btn btn-sm ${filters.type === t ? (t === "lost" ? "btn-lost" : t === "found" ? "btn-found" : "btn-primary") : "btn-ghost"}`}
            >
              {t === "" ? "All" : t === "lost" ? "🔍 Lost" : "✅ Found"}
            </button>
          ))}
        </div>

        {/* Category select */}
        <select
          className="input"
          value={filters.category}
          onChange={(e) => onChange({ category: e.target.value })}
          style={{ width: "auto", minWidth: "150px" }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(([key, { label, emoji }]) => (
            <option key={key} value={key}>{emoji} {label}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          className="input"
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value })}
          style={{ width: "auto", minWidth: "130px" }}
        >
          <option value="active">Active Only</option>
          <option value="">All Statuses</option>
          <option value="resolved">Resolved</option>
        </select>

        {/* Date range */}
        <input
          className="input"
          type="date"
          value={filters.date_from}
          onChange={(e) => onChange({ date_from: e.target.value })}
          title="From date"
          style={{ width: "auto" }}
        />
        <input
          className="input"
          type="date"
          value={filters.date_to}
          onChange={(e) => onChange({ date_to: e.target.value })}
          title="To date"
          style={{ width: "auto" }}
        />

        {/* Reset */}
        {hasActiveFilters && (
          <button onClick={onReset} className="btn btn-ghost btn-sm" style={{ color: "#f87171" }}>
            <X size={13} /> Reset
          </button>
        )}
      </div>

      {/* Result count */}
      <div style={{ fontSize: "0.8rem", color: "#475569" }}>
        {total} {total === 1 ? "item" : "items"} found
        {hasActiveFilters && <span style={{ color: "#6175f7" }}> (filtered)</span>}
      </div>
    </div>
  );
}
