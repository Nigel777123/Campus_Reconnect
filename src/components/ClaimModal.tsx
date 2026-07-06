import React, { useState } from "react";

import { X, Lock, Send, Loader } from "lucide-react";
import { api } from "../api";
import type { Item } from "../types";
import { useNotification } from "./Notification";

interface Props {
  item: Item;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ClaimModal({ item, onClose, onSuccess }: Props) {
  const { error } = useNotification();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const questions: Array<{ question: string }> = (() => {
    try { return JSON.parse(item.verification_questions || "[]"); }
    catch { return []; }
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (questions.some((_, i) => !answers[i]?.trim())) {
      error("Please answer all verification questions"); return;
    }
    setSubmitting(true);
    try {
      await api.items.submitClaim(
        item.id,
        questions.map((_, i) => answers[i] ?? ""),
        contact.trim() || "See account email"
      );
      setDone(true);
      onSuccess?.();
    } catch (e: any) {
      error(e.message || "Failed to submit claim");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">

        {/* ── Close button ─────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: ".75rem .75rem 0" }}>
          <button onClick={onClose} style={{
            background: "none", border: "1.5px solid var(--bg-border)",
            borderRadius: "2px", cursor: "pointer", padding: ".3rem .4rem",
            color: "var(--text-muted)", display: "flex",
          }}>
            <X size={16} />
          </button>
        </div>

        {done ? (
          /* ── Success state ──────────────────────────── */
          <div style={{ padding: "1.5rem 2rem 2.5rem", textAlign: "center" }}>
            {/* Hand-drawn SVG checkmark */}
            <svg className="checkmark" viewBox="0 0 52 52" style={{ margin: "0 auto 1.25rem" }}>
              <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
              <path className="checkmark-check" fill="none" d="M14 27 L22 35 L38 18" />
            </svg>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 700, color: "var(--ink-navy)", margin: "0 0 .625rem" }}>
              Claim Submitted!
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: ".9rem", lineHeight: 1.6, margin: "0 0 1.5rem" }}>
              Your answers have been sent to the finder for review. If they match, the finder will approve your claim and you'll receive a notification to begin chatting.
            </p>
            <button onClick={onClose} className="btn btn-found">Back to Item</button>
          </div>
        ) : (
          /* ── Claim form ─────────────────────────────── */
          <div style={{ padding: ".75rem 1.75rem 2rem" }}>
            {/* Header */}
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".25rem" }}>
                <Lock size={14} style={{ color: "var(--brass)" }} />
                <span style={{ fontSize: ".72rem", fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--brass-dark)", textTransform: "uppercase", letterSpacing: ".07em" }}>
                  Verification Required
                </span>
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 700, color: "var(--ink-navy)", margin: "0 0 .375rem" }}>
                Claim: {item.title}
              </h2>
              <p style={{ fontSize: ".82rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                The finder has set verification questions that only the true owner would know. Your contact info stays private until the finder approves your claim.
              </p>
            </div>

            {/* Verification questions hint box */}
            <div style={{
              background: "var(--brass-light)", border: "1.5px solid rgba(201,162,39,.25)",
              borderRadius: "2px", padding: ".75rem 1rem", marginBottom: "1.25rem",
              fontSize: ".8rem", color: "var(--brass-dark)",
            }}>
              📋 Answer all {questions.length} question{questions.length > 1 ? "s" : ""} as accurately as possible. The finder will compare your answers to their private record.
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {questions.map((q, i) => (
                <div key={i} className="form-group">
                  <label className="input-label">
                    Question {i + 1} / {questions.length}
                  </label>
                  {/* The question itself — styled like a physical index card note */}
                  <div style={{
                    background: "var(--paper-warm)", border: "1.5px solid var(--bg-border)",
                    borderRadius: "2px", padding: ".625rem .875rem", marginBottom: ".375rem",
                    fontSize: ".88rem", color: "var(--ink-navy)", fontStyle: "italic",
                    fontFamily: "var(--font-display)",
                  }}>
                    "{q.question}"
                  </div>
                  <input
                    className="input"
                    type="text"
                    placeholder="Your answer..."
                    value={answers[i] ?? ""}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                    required
                  />
                </div>
              ))}

              <div className="form-group">
                <label className="input-label">Contact Info (Optional)</label>
                <input
                  className="input"
                  type="text"
                  placeholder="How should they reach you? (e.g., Phone #)"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: ".625rem", justifyContent: "flex-end", marginTop: ".5rem" }}>
                <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-found" disabled={submitting}>
                  {submitting ? <><Loader size={14} style={{ animation: "spin .7s linear infinite" }} /> Submitting…</> : <><Send size={14} /> Submit Claim</>}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
