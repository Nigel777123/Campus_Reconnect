import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Minus, HelpCircle, Lock, CheckCircle } from "lucide-react";
import { api } from "../api";
import { useNotification } from "../components/Notification";
import ImageUpload from "../components/ImageUpload";
import { CATEGORY_META, CAMPUS_BUILDINGS } from "../types";
import type { Category } from "../types";

interface QAPair { question: string; answer: string; }

export default function PostItem() {
  const navigate = useNavigate();
  const { success, error } = useNotification();

  const [type, setType]               = useState<"lost" | "found">("lost");
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory]       = useState<Category>("other");
  const [location, setLocation]       = useState("");
  const [customLocation, setCustomLoc]= useState("");
  const [date, setDate]               = useState(new Date().toISOString().split("T")[0]);
  const [imageUrl, setImageUrl]       = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [qaPairs, setQaPairs]         = useState<QAPair[]>([{ question: "", answer: "" }]);
  const [loading, setLoading]         = useState(false);

  const isFound       = type === "found";
  const finalLocation = location === "Other / Unknown" ? customLocation : location;
  const CATEGORIES    = Object.entries(CATEGORY_META) as [Category, { label: string; emoji: string }][];

  const addQA    = () => { if (qaPairs.length < 3) setQaPairs((p) => [...p, { question: "", answer: "" }]); };
  const removeQA = (i: number) => setQaPairs((p) => p.filter((_, idx) => idx !== i));
  const updateQA = (i: number, f: "question" | "answer", v: string) =>
    setQaPairs((p) => p.map((qa, idx) => idx === i ? { ...qa, [f]: v } : qa));

  const validate = (): string | null => {
    if (!title.trim())         return "Item name is required";
    if (!finalLocation.trim()) return "Location is required";
    if (!date)                 return "Date is required";
    if (!contactInfo.trim())   return "Contact info is required";
    if (isFound) {
      for (let i = 0; i < qaPairs.length; i++) {
        if (!qaPairs[i].question.trim()) return `Question ${i + 1} is empty`;
        if (!qaPairs[i].answer.trim())   return `Answer to question ${i + 1} is empty`;
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
        type, title: title.trim(), description: description.trim(), category,
        location: finalLocation.trim(), date,
        image_url: imageUrl || undefined,
        contact_info: contactInfo.trim(),
        verification_questions: isFound ? qaPairs.map((qa) => ({ question: qa.question })) : [],
        verification_answers:   isFound ? qaPairs.map((qa) => qa.answer) : [],
      });
      success("Listing posted successfully! 🎉");
      navigate(`/items/${id}`);
    } catch (e: any) { error(e.message || "Failed to post listing"); }
    finally { setLoading(false); }
  };

  const section = (emoji: string, title: string, children: React.ReactNode) => (
    <div className="paper-surface" style={{ padding: "1.5rem", marginBottom: "1.125rem" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: ".95rem", fontWeight: 700, margin: "0 0 1.25rem", color: "var(--ink-navy)", display: "flex", alignItems: "center", gap: ".5rem" }}>
        {emoji} {title}
      </h2>
      {children}
    </div>
  );

  return (
    <div className="page" style={{ maxWidth: "680px" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 800, margin: "0 0 .375rem", color: "var(--ink-navy)" }}>
          Post a Listing
        </h1>
        <p style={{ color: "var(--text-muted)", margin: 0, fontSize: ".9rem" }}>
          {isFound ? "Help someone get their item back 🎉" : "Let the campus know what you're looking for 🔍"}
        </p>
      </div>

      {/* Type toggle */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".875rem", marginBottom: "1.75rem" }}>
        {(["lost", "found"] as const).map((t) => (
          <button
            key={t} type="button" onClick={() => setType(t)}
            style={{
              padding: "1.125rem", borderRadius: "2px", textAlign: "left", cursor: "pointer",
              border: `2px solid ${type === t ? (t === "lost" ? "var(--lost-rust)" : "var(--found-green)") : "var(--bg-border)"}`,
              background: type === t ? (t === "lost" ? "var(--lost-bg)" : "var(--found-bg)") : "var(--bg-card)",
              transition: "all .14s",
            }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: ".35rem" }}>{t === "lost" ? "🔍" : "✅"}</div>
            <div style={{ fontWeight: 700, color: t === type ? (t === "lost" ? "var(--lost-rust)" : "var(--found-green)") : "var(--text-primary)", fontSize: ".95rem", fontFamily: "var(--font-display)" }}>
              I {t === "lost" ? "Lost" : "Found"} Something
            </div>
            <div style={{ fontSize: ".78rem", color: "var(--text-muted)", marginTop: ".2rem" }}>
              {t === "lost" ? "Post what you're looking for" : "Return something to its owner"}
            </div>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Section 1: Item Details */}
        {section("📝", "Item Details",
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group">
              <label className="input-label">Item Name *</label>
              <input className="input" type="text" placeholder="e.g. Blue iPhone 14 Pro, Student ID…" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="input-label">Category</label>
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                {CATEGORIES.map(([key, { label, emoji }]) => <option key={key} value={key}>{emoji} {label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">Description</label>
              <textarea className="input" placeholder="Color, brand, distinguishing features, contents…" value={description} onChange={(e) => setDescription(e.target.value)} style={{ minHeight: "90px" }} />
            </div>
            <div className="form-group">
              <label className="input-label">Photo (optional)</label>
              <ImageUpload value={imageUrl} onChange={setImageUrl} />
            </div>
          </div>
        )}

        {/* Section 2: Location & Date */}
        {section("📍", isFound ? "Where You Found It" : "Where You Lost It",
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group">
              <label className="input-label">Building / Location *</label>
              <select className="input" value={location} onChange={(e) => setLocation(e.target.value)} required>
                <option value="">Select a location…</option>
                {CAMPUS_BUILDINGS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            {location === "Other / Unknown" && (
              <div className="form-group">
                <label className="input-label">Describe the location</label>
                <input className="input" type="text" placeholder="e.g. Near the east gate parking lot…" value={customLocation} onChange={(e) => setCustomLoc(e.target.value)} />
              </div>
            )}
            <div className="form-group">
              <label className="input-label">Date {isFound ? "Found" : "Lost"} *</label>
              <input className="input" type="date" value={date} max={new Date().toISOString().split("T")[0]} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>
        )}

        {/* Section 3: Verification Questions (Found only) */}
        {isFound && (
          <div className="paper-surface" style={{ padding: "1.5rem", marginBottom: "1.125rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: ".75rem" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: ".95rem", fontWeight: 700, margin: 0, color: "var(--ink-navy)", display: "flex", alignItems: "center", gap: ".5rem" }}>
                🔒 Verification Questions
              </h2>
              <span className="badge badge-found">Required</span>
            </div>
            <div style={{ background: "var(--brass-light)", border: "1.5px solid rgba(201,162,39,.25)", borderRadius: "2px", padding: ".625rem .875rem", marginBottom: "1rem", fontSize: ".82rem", color: "var(--brass-dark)", lineHeight: 1.6, display: "flex", gap: ".5rem" }}>
              <HelpCircle size={15} style={{ color: "var(--brass)", flexShrink: 0, marginTop: "2px" }} />
              <span>Add 1–3 questions only the true owner would know. Questions are shown publicly; answers are kept private and only revealed to you for comparison.</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {qaPairs.map((qa, i) => (
                <div key={i} style={{ background: "var(--paper-warm)", border: "1.5px solid var(--bg-border)", borderRadius: "2px", padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".625rem" }}>
                    <span style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".06em" }}>Question {i + 1}</span>
                    {qaPairs.length > 1 && (
                      <button type="button" onClick={() => removeQA(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--lost-rust)", display: "flex", padding: ".2rem" }}>
                        <Minus size={14} />
                      </button>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
                    <input className="input" type="text" placeholder='e.g. "What color is the phone case?"' value={qa.question} onChange={(e) => updateQA(i, "question", e.target.value)} />
                    <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
                      <Lock size={13} style={{ color: "var(--brass)", flexShrink: 0 }} />
                      <input className="input" type="text" placeholder="Your secret answer (only you see this)" value={qa.answer} onChange={(e) => updateQA(i, "answer", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {qaPairs.length < 3 && (
              <button type="button" onClick={addQA} className="btn btn-ghost btn-sm" style={{ marginTop: ".75rem" }}>
                <Plus size={14} /> Add Question
              </button>
            )}
          </div>
        )}

        {/* Section 4: Contact */}
        {section("📞", "Your Contact Info",
          <div className="form-group">
            <label className="input-label">Email / Phone *</label>
            <input className="input" type="text" placeholder="How should people reach you?" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} required />
            <div style={{ fontSize: ".72rem", color: "var(--text-faint)", marginTop: ".25rem", fontFamily: "var(--font-mono)" }}>
              {isFound ? "🔒 Shared only with approved claimants" : "👁 Visible on your listing"}
            </div>
          </div>
        )}

        {/* Submit */}
        <button type="submit" className={`btn btn-lg ${isFound ? "btn-found" : "btn-lost"}`} style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
          {loading ? "Posting…" : <>{isFound ? <CheckCircle size={18} /> : <Plus size={18} />} Post {isFound ? "Found" : "Lost"} Item</>}
        </button>
      </form>
    </div>
  );
}
