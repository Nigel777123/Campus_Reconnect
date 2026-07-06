import { useState } from "react";
import { X, Lock, Send, AlertTriangle } from "lucide-react";
import type { Item } from "../types";
import { api } from "../api";
import { useNotification } from "./Notification";

interface Props {
  item: Item;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ClaimModal({ item, onClose, onSuccess }: Props) {
  const { success, error } = useNotification();
  const questions: Array<{ question: string }> = (() => {
    try { return JSON.parse(item.verification_questions || "[]"); } catch { return []; }
  })();

  const [answers, setAnswers] = useState<string[]>(questions.map(() => ""));
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emptyIdx = answers.findIndex((a) => !a.trim());
    if (emptyIdx !== -1) {
      error(`Please answer question ${emptyIdx + 1}`);
      return;
    }
    if (!contact.trim()) {
      error("Please provide your contact info");
      return;
    }
    setLoading(true);
    try {
      await api.items.submitClaim(item.id, answers, contact);
      success("Claim submitted! The finder will review your answers.");
      onSuccess();
    } catch (e: any) {
      error(e.message || "Failed to submit claim");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal glass" style={{ padding: "1.5rem" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700 }}>
              Claim This Item
            </h2>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "#64748b" }}>
              "{item.title}"
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "0.25rem", display: "flex" }}>
            <X size={20} />
          </button>
        </div>

        {/* Security notice */}
        <div style={{
          background: "rgba(97,117,247,0.08)", border: "1px solid rgba(97,117,247,0.2)",
          borderRadius: "0.75rem", padding: "0.875rem", marginBottom: "1.25rem",
          display: "flex", gap: "0.75rem", alignItems: "flex-start"
        }}>
          <Lock size={16} style={{ color: "#6175f7", flexShrink: 0, marginTop: "2px" }} />
          <div style={{ fontSize: "0.82rem", color: "#a4bcfd", lineHeight: 1.5 }}>
            Answer the verification questions below. The finder will compare your answers privately before deciding to approve or reject your claim. <strong>Contact info is only shared after approval.</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Verification questions */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
              Verification Questions
            </div>
            {questions.length === 0 ? (
              <div style={{
                padding: "1rem", background: "rgba(251,191,36,0.07)",
                border: "1px solid rgba(251,191,36,0.2)", borderRadius: "0.75rem",
                fontSize: "0.85rem", color: "#fbbf24", display: "flex", gap: "0.5rem", alignItems: "flex-start"
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
                No verification questions set. Proceed with your contact info.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {questions.map((q, i) => (
                  <div key={i} className="form-group">
                    <label className="input-label">
                      Q{i + 1}: {q.question}
                    </label>
                    <input
                      className="input"
                      type="text"
                      placeholder="Your answer..."
                      value={answers[i]}
                      onChange={(e) => {
                        const updated = [...answers];
                        updated[i] = e.target.value;
                        setAnswers(updated);
                      }}
                      required
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact info */}
          <div className="form-group" style={{ marginBottom: "1.25rem" }}>
            <label className="input-label">Your Contact Info</label>
            <input
              className="input"
              type="text"
              placeholder="Email or phone number (shared only after approval)"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
            />
            <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "0.25rem" }}>
              🔒 Only revealed to the finder if they approve your claim
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-found" style={{ flex: 2 }} disabled={loading}>
              {loading ? "Submitting..." : <><Send size={15} /> Submit Claim</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
