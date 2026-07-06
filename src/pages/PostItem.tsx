import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Minus, HelpCircle, Lock, AlertTriangle, CheckCircle } from "lucide-react";
import { api } from "../api";
import { useNotification } from "../components/Notification";
import ImageUpload from "../components/ImageUpload";
import { CATEGORY_META, CAMPUS_BUILDINGS } from "../types";
import type { Category } from "../types";

interface QAPair {
  question: string;
  answer: string;
}

export default function PostItem() {
  const navigate = useNavigate();
  const { success, error } = useNotification();

  const [type, setType] = useState<"lost" | "found">("lost");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("other");
  const [location, setLocation] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [imageUrl, setImageUrl] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [qaPairs, setQaPairs] = useState<QAPair[]>([{ question: "", answer: "" }]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const isFound = type === "found";
  const finalLocation = location === "Other / Unknown" ? customLocation : location;

  const addQA = () => {
    if (qaPairs.length < 3) setQaPairs((prev) => [...prev, { question: "", answer: "" }]);
  };
  const removeQA = (i: number) => setQaPairs((prev) => prev.filter((_, idx) => idx !== i));
  const updateQA = (i: number, field: "question" | "answer", val: string) => {
    setQaPairs((prev) => prev.map((qa, idx) => idx === i ? { ...qa, [field]: val } : qa));
  };

  const validate = (): string | null => {
    if (!title.trim()) return "Item name is required";
    if (!finalLocation.trim()) return "Location is required";
    if (!date) return "Date is required";
    if (!contactInfo.trim()) return "Contact info is required";
    if (isFound) {
      for (let i = 0; i < qaPairs.length; i++) {
        const qa = qaPairs[i];
        if (!qa.question.trim()) return `Question ${i + 1} is empty`;
        if (!qa.answer.trim()) return `Answer to question ${i + 1} is empty`;
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { error(err); return; }

    setLoading(true);
    try {
      const { id } = await api.items.create({
        type,
        title: title.trim(),
        description: description.trim(),
        category,
        location: finalLocation.trim(),
        date,
        image_url: imageUrl || undefined,
        contact_info: contactInfo.trim(),
        verification_questions: isFound ? qaPairs.map((qa) => ({ question: qa.question })) : [],
        verification_answers: isFound ? qaPairs.map((qa) => qa.answer) : [],
      });
      success("Listing posted successfully! 🎉");
      navigate(`/items/${id}`);
    } catch (e: any) {
      error(e.message || "Failed to post listing");
    } finally {
      setLoading(false);
    }
  };

  const CATEGORIES = Object.entries(CATEGORY_META) as [Category, { label: string; emoji: string }][];

  return (
    <div className="page" style={{ maxWidth: "680px" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{
          fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 800,
          margin: "0 0 0.5rem",
          background: isFound
            ? "linear-gradient(90deg, #f1f5f9, #5eead4)"
            : "linear-gradient(90deg, #f1f5f9, #fbbf24)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
        }}>
          Post a Listing
        </h1>
        <p style={{ color: "#64748b", margin: 0 }}>
          {isFound ? "Help someone get their item back 🎉" : "Let the campus know what you're looking for 🔍"}
        </p>
      </div>

      {/* Type toggle */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: "0.75rem", marginBottom: "2rem"
      }}>
        {(["lost", "found"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            style={{
              padding: "1rem",
              borderRadius: "0.875rem",
              border: `2px solid ${type === t
                ? (t === "lost" ? "rgba(245,158,11,0.6)" : "rgba(20,184,166,0.6)")
                : "rgba(255,255,255,0.06)"}`,
              background: type === t
                ? (t === "lost" ? "rgba(245,158,11,0.1)" : "rgba(20,184,166,0.1)")
                : "rgba(255,255,255,0.02)",
              cursor: "pointer",
              transition: "all 0.15s",
              textAlign: "left"
            }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: "0.375rem" }}>
              {t === "lost" ? "🔍" : "✅"}
            </div>
            <div style={{ fontWeight: 600, color: "#f1f5f9", fontSize: "0.95rem" }}>
              I {t === "lost" ? "Lost" : "Found"} Something
            </div>
            <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "0.2rem" }}>
              {t === "lost" ? "Post what you're looking for" : "Return something to its owner"}
            </div>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* ── Section 1: Item Details ──────────────────────────────────── */}
        <div className="glass" style={{ borderRadius: "1rem", padding: "1.5rem", marginBottom: "1rem" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, margin: "0 0 1.25rem", color: "#f1f5f9" }}>
            📝 Item Details
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group">
              <label className="input-label">Item Name *</label>
              <input
                className="input"
                type="text"
                placeholder="e.g. Blue iPhone 14 Pro, Student ID Card..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="input-label">Category</label>
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                {CATEGORIES.map(([key, { label, emoji }]) => (
                  <option key={key} value={key}>{emoji} {label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="input-label">Description</label>
              <textarea
                className="input"
                placeholder="Color, brand, distinguishing features, contents (for bags), etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ minHeight: "90px" }}
              />
            </div>

            <div className="form-group">
              <label className="input-label">Photo (optional)</label>
              <ImageUpload value={imageUrl} onChange={setImageUrl} />
            </div>
          </div>
        </div>

        {/* ── Section 2: Location & Date ───────────────────────────────── */}
        <div className="glass" style={{ borderRadius: "1rem", padding: "1.5rem", marginBottom: "1rem" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, margin: "0 0 1.25rem", color: "#f1f5f9" }}>
            📍 {isFound ? "Where You Found It" : "Where You Lost It"}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group">
              <label className="input-label">Building / Location *</label>
              <select className="input" value={location} onChange={(e) => setLocation(e.target.value)} required>
                <option value="">Select a location...</option>
                {CAMPUS_BUILDINGS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            {location === "Other / Unknown" && (
              <div className="form-group">
                <label className="input-label">Describe the location</label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. Near the east gate parking lot..."
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                />
              </div>
            )}
            <div className="form-group">
              <label className="input-label">Date {isFound ? "Found" : "Lost"} *</label>
              <input
                className="input"
                type="date"
                value={date}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* ── Section 3: Verification (Found only) ─────────────────────── */}
        {isFound && (
          <div className="glass" style={{ borderRadius: "1rem", padding: "1.5rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, margin: 0, color: "#f1f5f9" }}>
                🔒 Verification Questions
              </h2>
              <span style={{
                fontSize: "0.72rem", background: "rgba(20,184,166,0.12)",
                color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.25)",
                borderRadius: "99px", padding: "0.2rem 0.6rem"
              }}>Required</span>
            </div>
            <div style={{
              background: "rgba(97,117,247,0.07)", border: "1px solid rgba(97,117,247,0.18)",
              borderRadius: "0.625rem", padding: "0.75rem 0.875rem",
              marginBottom: "1rem", fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.6,
              display: "flex", gap: "0.5rem"
            }}>
              <HelpCircle size={15} style={{ color: "#6175f7", flexShrink: 0, marginTop: "2px" }} />
              <span>Add 1–3 questions only the true owner would know. Questions are shown publicly; answers are kept private and only revealed to you for comparison.</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {qaPairs.map((qa, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "0.75rem", padding: "1rem"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.625rem" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#94a3b8" }}>Question {i + 1}</span>
                    {qaPairs.length > 1 && (
                      <button type="button" onClick={() => removeQA(i)} style={{
                        background: "none", border: "none", cursor: "pointer", color: "#f87171",
                        display: "flex", padding: "0.2rem"
                      }}>
                        <Minus size={14} />
                      </button>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <input
                      className="input"
                      type="text"
                      placeholder='e.g. "What color is the phone case?"'
                      value={qa.question}
                      onChange={(e) => updateQA(i, "question", e.target.value)}
                    />
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <Lock size={13} style={{ color: "#475569", flexShrink: 0 }} />
                      <input
                        className="input"
                        type="text"
                        placeholder="Your secret answer (only you see this)"
                        value={qa.answer}
                        onChange={(e) => updateQA(i, "answer", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {qaPairs.length < 3 && (
              <button type="button" onClick={addQA} className="btn btn-ghost btn-sm" style={{ marginTop: "0.75rem" }}>
                <Plus size={14} /> Add Question
              </button>
            )}
          </div>
        )}

        {/* ── Section 4: Contact ───────────────────────────────────────── */}
        <div className="glass" style={{ borderRadius: "1rem", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, margin: "0 0 1rem", color: "#f1f5f9" }}>
            📞 Your Contact Info
          </h2>
          <div className="form-group">
            <label className="input-label">Email / Phone *</label>
            <input
              className="input"
              type="text"
              placeholder="How should people reach you?"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              required
            />
            <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "0.25rem" }}>
              {isFound ? "🔒 Shared only with approved claimants" : "👁 Visible on your listing"}
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className={`btn btn-lg ${isFound ? "btn-found" : "btn-lost"}`}
          style={{ width: "100%" }}
          disabled={loading}
        >
          {loading ? "Posting..." : (
            <>{isFound ? <CheckCircle size={18} /> : <Plus size={18} />}
              Post {isFound ? "Found" : "Lost"} Item</>
          )}
        </button>
      </form>
    </div>
  );
}
