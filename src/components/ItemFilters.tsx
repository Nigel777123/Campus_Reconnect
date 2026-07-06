import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import type { ItemFilters as Filters } from "../types";

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "electronics", label: "💻 Electronics" },
  { value: "id/cards",    label: "🪪 IDs & Cards" },
  { value: "clothing",    label: "👕 Clothing" },
  { value: "keys",        label: "🔑 Keys" },
  { value: "bags",        label: "🎒 Bags" },
  { value: "other",       label: "📦 Other" },
];

export default function ItemFilters({ filters, onChange }: Props) {
  const [showMore, setShowMore] = useState(false);
  const set = (partial: Partial<Filters>) => onChange({ ...filters, ...partial, page: 1 });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: ".875rem" }}>
      {/* Search bar */}
      <div style={{ position: "relative" }}>
        <Search size={15} style={{
          position: "absolute", left: ".875rem", top: "50%", transform: "translateY(-50%)",
          color: "var(--text-faint)", pointerEvents: "none",
        }} />
        <input
          className="input"
          type="text"
          placeholder="Search items, descriptions, locations..."
          value={filters.search ?? ""}
          onChange={(e) => set({ search: e.target.value })}
          style={{ paddingLeft: "2.5rem" }}
        />
      </div>

      {/* Quick chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem", alignItems: "center" }}>
        {/* Type chips */}
        {(["", "lost", "found"] as const).map((t) => (
          <button
            key={t || "all"}
            onClick={() => set({ type: t })}
            className={`filter-chip${filters.type === t
              ? t === "lost" ? " active-lost" : t === "found" ? " active-found" : " active"
              : ""}`}
          >
            {t === "" ? "All" : t === "lost" ? "🔍 Lost" : "✅ Found"}
          </button>
        ))}

        <span style={{ width: "1px", height: "20px", background: "var(--bg-border)", margin: "0 .1rem" }} />

        {/* Category chips */}
        {CATEGORIES.filter((c) => c.value).map((c) => (
          <button
            key={c.value}
            onClick={() => set({ category: filters.category === c.value ? "" : c.value })}
            className={`filter-chip${filters.category === c.value ? " active" : ""}`}
          >
            {c.label}
          </button>
        ))}

        {/* More toggle */}
        <button
          onClick={() => setShowMore((p) => !p)}
          className={`filter-chip${showMore ? " active" : ""}`}
          style={{ marginLeft: "auto" }}
        >
          <SlidersHorizontal size={11} /> {showMore ? "Less" : "Date Range"}
        </button>
      </div>

      {/* Status + date range */}
      {showMore && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: ".625rem", alignItems: "center" }}>
          <div style={{ display: "flex", gap: ".35rem" }}>
            {(["", "active", "resolved"] as const).map((s) => (
              <button
                key={s || "all-status"}
                onClick={() => set({ status: s })}
                className={`filter-chip${filters.status === s ? " active" : ""}`}
              >
                {s === "" ? "Any Status" : s === "active" ? "Active" : "Resolved"}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: ".5rem", alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="date" className="input"
              value={filters.dateFrom ?? ""}
              onChange={(e) => set({ dateFrom: e.target.value })}
              style={{ width: "150px" }}
            />
            <span style={{ color: "var(--text-faint)", fontSize: ".8rem", fontFamily: "var(--font-mono)" }}>to</span>
            <input
              type="date" className="input"
              value={filters.dateTo ?? ""}
              onChange={(e) => set({ dateTo: e.target.value })}
              style={{ width: "150px" }}
            />
            {(filters.dateFrom || filters.dateTo) && (
              <button onClick={() => set({ dateFrom: "", dateTo: "" })} className="btn btn-sm btn-ghost">
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
