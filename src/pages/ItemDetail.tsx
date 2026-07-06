import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  MapPin, Calendar, Tag, ArrowLeft, CheckCircle, XCircle,
  MessageCircle, Lock, Phone, RotateCcw, Trash2, Shield, Clock
} from "lucide-react";
import { api } from "../api";
import type { Item, Claim } from "../types";
import { CATEGORY_META } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../components/Notification";
import ClaimModal from "../components/ClaimModal";

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { success, error, info } = useNotification();

  const [item, setItem] = useState<Item | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [verificationAnswers, setVerificationAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [chatClaimId, setChatClaimId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [contactInfo, setContactInfo] = useState("");
  const [chatMsg, setChatMsg] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.items.get(Number(id))
      .then(setItem)
      .catch(() => { error("Item not found"); navigate("/"); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!item || !user) return;
    if (item.user_id === user.id || isAdmin) {
      setClaimsLoading(true);
      api.items.getClaims(item.id)
        .then(({ claims, verification_answers }) => {
          setClaims(claims);
          setVerificationAnswers(verification_answers);
        })
        .catch(() => {})
        .finally(() => setClaimsLoading(false));
    }
    // Check if user has an approved claim
    if (user && item.type === "found" && item.user_id !== user.id) {
      // Load approved claim for chat
    }
  }, [item, user]);

  const loadChat = async (claimId: number) => {
    try {
      const data = await api.messages.list(claimId);
      setMessages(data.messages);
      setContactInfo(data.contact_info);
      setChatClaimId(claimId);
    } catch (e: any) {
      error(e.message || "Cannot load chat");
    }
  };

  const handleSendMessage = async () => {
    if (!chatMsg.trim() || !chatClaimId) return;
    setSendingMsg(true);
    try {
      await api.messages.send(chatClaimId, chatMsg);
      setChatMsg("");
      loadChat(chatClaimId);
    } catch (e: any) {
      error(e.message || "Failed to send");
    } finally {
      setSendingMsg(false);
    }
  };

  const handleClaimAction = async (claimId: number, status: "approved" | "rejected") => {
    try {
      await api.claims.updateStatus(claimId, status);
      success(status === "approved" ? "Claim approved! 🎉 Chat is now open." : "Claim rejected.");
      setClaims((prev) => prev.map((c) => c.id === claimId ? { ...c, status } : c));
      if (status === "approved") {
        setItem((prev) => prev ? { ...prev, status: "resolved" } : prev);
      }
    } catch (e: any) {
      error(e.message || "Action failed");
    }
  };

  const handleReopen = async () => {
    try {
      await api.items.update(item!.id, { status: "active" });
      success("Listing reopened");
      setItem((prev) => prev ? { ...prev, status: "active" } : prev);
    } catch (e: any) {
      error(e.message || "Failed to reopen");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this listing permanently?")) return;
    try {
      await api.items.delete(item!.id);
      success("Listing deleted");
      navigate("/");
    } catch (e: any) {
      error(e.message || "Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ maxWidth: "800px" }}>
        <div className="skeleton" style={{ height: "400px", borderRadius: "1rem", marginBottom: "1rem" }} />
        <div className="skeleton" style={{ height: "200px", borderRadius: "1rem" }} />
      </div>
    );
  }
  if (!item) return null;

  const isOwner = user?.id === item.user_id;
  const catMeta = CATEGORY_META[item.category] ?? CATEGORY_META.other;
  const questions: Array<{ question: string }> = (() => {
    try { return JSON.parse(item.verification_questions || "[]"); } catch { return []; }
  })();
  const isFound = item.type === "found";
  const isResolved = item.status === "resolved";
  const canClaim = user && isFound && !isOwner && !isResolved;

  // Find if current user has an approved claim for this item
  const myApprovedClaim = claims.find((c) => c.claimant_id === user?.id && c.status === "approved");

  return (
    <div className="page" style={{ maxWidth: "900px" }}>
      {/* Back */}
      <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" style={{ marginBottom: "1.25rem" }}>
        <ArrowLeft size={15} /> Back
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.25rem" }}>
        {/* ── Main card ─────────────────────────────────────────────────── */}
        <div className={`glass ${isFound ? "found-glow" : "lost-glow"}`} style={{ borderRadius: "1.25rem", overflow: "hidden" }}>
          {/* Image */}
          {item.image_url && (
            <div style={{ height: "320px", overflow: "hidden" }}>
              <img src={item.image_url} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}

          <div style={{ padding: "1.75rem" }}>
            {/* Type + status badges */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              <span className={`badge badge-${item.type}`}>
                {isFound ? "✅ Found" : "🔍 Lost"}
              </span>
              {isResolved && <span className="badge badge-resolved">✓ Resolved</span>}
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "0.3rem",
                padding: "0.2rem 0.65rem", borderRadius: "99px",
                fontSize: "0.72rem", fontWeight: 600,
                background: "rgba(255,255,255,0.06)", color: "#64748b",
                border: "1px solid rgba(255,255,255,0.08)"
              }}>
                {catMeta.emoji} {catMeta.label}
              </span>
            </div>

            <h1 style={{
              fontFamily: "var(--font-display)", fontSize: "1.6rem",
              fontWeight: 800, margin: "0 0 0.875rem", color: "#f1f5f9"
            }}>{item.title}</h1>

            {item.description && (
              <p style={{ color: "#94a3b8", lineHeight: 1.7, marginBottom: "1.25rem", fontSize: "0.95rem" }}>
                {item.description}
              </p>
            )}

            {/* Meta grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {item.location && (
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", color: "#64748b", fontSize: "0.875rem" }}>
                  <MapPin size={15} style={{ flexShrink: 0, marginTop: "2px", color: "#6175f7" }} />
                  <div>
                    <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#475569" }}>
                      {isFound ? "Found at" : "Lost near"}
                    </div>
                    <div style={{ color: "#cbd5e1" }}>{item.location}</div>
                  </div>
                </div>
              )}
              {item.date && (
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", color: "#64748b", fontSize: "0.875rem" }}>
                  <Calendar size={15} style={{ flexShrink: 0, marginTop: "2px", color: "#6175f7" }} />
                  <div>
                    <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#475569" }}>Date</div>
                    <div style={{ color: "#cbd5e1" }}>{new Date(item.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}</div>
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", color: "#64748b", fontSize: "0.875rem" }}>
                <Clock size={15} style={{ flexShrink: 0, marginTop: "2px", color: "#6175f7" }} />
                <div>
                  <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#475569" }}>Posted by</div>
                  <div style={{ color: "#cbd5e1" }}>{item.poster_name} · {new Date(item.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {/* Owner contact (only visible to owner) */}
            {isOwner && item.contact_info && (
              <div style={{
                background: "rgba(97,117,247,0.08)", border: "1px solid rgba(97,117,247,0.2)",
                borderRadius: "0.75rem", padding: "0.875rem", marginBottom: "1.25rem",
                display: "flex", gap: "0.5rem", alignItems: "center"
              }}>
                <Phone size={15} style={{ color: "#6175f7" }} />
                <span style={{ fontSize: "0.875rem", color: "#a4bcfd" }}>Contact: {item.contact_info}</span>
              </div>
            )}

            {/* Verification questions (visible to all for found items) */}
            {isFound && questions.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  marginBottom: "0.75rem", fontSize: "0.82rem", fontWeight: 600,
                  color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em"
                }}>
                  <Lock size={14} /> Verification Questions
                  {!isOwner && <span style={{ color: "#475569", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>— answer these to claim</span>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {questions.map((q, i) => (
                    <div key={i} style={{
                      padding: "0.75rem 1rem",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "0.625rem",
                      fontSize: "0.875rem", color: "#cbd5e1"
                    }}>
                      <span style={{ color: "#6175f7", fontWeight: 600, marginRight: "0.375rem" }}>Q{i + 1}:</span>
                      {q.question}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA buttons */}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {canClaim && (
                <button className="btn btn-found btn-lg" onClick={() => setShowClaimModal(true)} style={{ flex: "1 1 auto" }}>
                  <CheckCircle size={18} /> Claim This Item
                </button>
              )}
              {isOwner && (
                <>
                  {isResolved && (
                    <button className="btn btn-ghost" onClick={handleReopen}>
                      <RotateCcw size={15} /> Reopen Listing
                    </button>
                  )}
                  <button className="btn btn-danger" onClick={handleDelete}>
                    <Trash2 size={15} /> Delete
                  </button>
                </>
              )}
              {isAdmin && !isOwner && (
                <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                  <Shield size={14} /> Admin: Delete
                </button>
              )}
              {!user && isFound && (
                <Link to="/login" className="btn btn-primary btn-lg" style={{ flex: "1 1 auto" }}>
                  Sign In to Claim
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── Claims panel (owner view) ─────────────────────────────────── */}
        {isOwner && (
          <div className="glass" style={{ borderRadius: "1.25rem", padding: "1.5rem" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, margin: "0 0 1.25rem", color: "#f1f5f9" }}>
              Claim Requests {claims.length > 0 && <span style={{ color: "#6175f7" }}>({claims.length})</span>}
            </h2>

            {claimsLoading ? (
              <div style={{ color: "#475569", fontSize: "0.875rem" }}>Loading claims...</div>
            ) : claims.length === 0 ? (
              <div className="empty-state" style={{ padding: "2rem" }}>
                <div style={{ fontSize: "2rem" }}>📭</div>
                <p style={{ color: "#475569", fontSize: "0.875rem" }}>No claims yet</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {claims.map((claim) => {
                  const submittedAnswers: string[] = (() => {
                    try { return JSON.parse(claim.submitted_answers || "[]"); } catch { return []; }
                  })();
                  const isPending = claim.status === "pending";
                  return (
                    <div key={claim.id} style={{
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "0.875rem", padding: "1.125rem", overflow: "hidden"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.875rem" }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#e2e8f0" }}>
                            {claim.claimant_name_display || claim.claimant_name}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#475569" }}>{new Date(claim.created_at).toLocaleString()}</div>
                        </div>
                        <span className={`badge badge-${claim.status}`}>{claim.status}</span>
                      </div>

                      {/* Q&A comparison */}
                      {questions.length > 0 && (
                        <div style={{ marginBottom: "0.875rem" }}>
                          <div style={{ fontSize: "0.75rem", color: "#475569", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Answer Comparison
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                            {questions.map((q, i) => (
                              <div key={i} style={{ fontSize: "0.8rem" }}>
                                <div style={{ color: "#64748b", marginBottom: "0.2rem" }}>Q{i + 1}: {q.question}</div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem" }}>
                                  <div style={{ padding: "0.375rem 0.625rem", background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: "0.375rem" }}>
                                    <div style={{ fontSize: "0.65rem", color: "#2dd4bf", marginBottom: "2px" }}>Your answer</div>
                                    <div style={{ color: "#f1f5f9" }}>{verificationAnswers[i] || "—"}</div>
                                  </div>
                                  <div style={{ padding: "0.375rem 0.625rem", background: "rgba(97,117,247,0.08)", border: "1px solid rgba(97,117,247,0.2)", borderRadius: "0.375rem" }}>
                                    <div style={{ fontSize: "0.65rem", color: "#a4bcfd", marginBottom: "2px" }}>Their answer</div>
                                    <div style={{ color: "#f1f5f9" }}>{submittedAnswers[i] || "—"}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {claim.claimant_contact && (
                        <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.875rem" }}>
                          📞 {claim.claimant_contact}
                        </div>
                      )}

                      {/* Actions */}
                      {isPending && (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button className="btn btn-found btn-sm" onClick={() => handleClaimAction(claim.id, "approved")}>
                            <CheckCircle size={13} /> Approve
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleClaimAction(claim.id, "rejected")}>
                            <XCircle size={13} /> Reject
                          </button>
                        </div>
                      )}
                      {claim.status === "approved" && (
                        <button className="btn btn-ghost btn-sm" onClick={() => loadChat(claim.id)}>
                          <MessageCircle size={13} /> Open Chat
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Chat panel ────────────────────────────────────────────────── */}
        {chatClaimId && (
          <div className="glass" style={{ borderRadius: "1.25rem", padding: "1.5rem" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.5rem", color: "#f1f5f9" }}>
              <MessageCircle size={18} style={{ display: "inline", marginRight: "0.5rem", color: "#14b8a6" }} />
              Handoff Chat
            </h2>
            {contactInfo && (
              <div style={{
                background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)",
                borderRadius: "0.625rem", padding: "0.625rem 0.875rem",
                fontSize: "0.82rem", color: "#5eead4", marginBottom: "1rem",
                display: "flex", alignItems: "center", gap: "0.5rem"
              }}>
                <Phone size={13} /> Contact: {contactInfo}
              </div>
            )}
            <div style={{
              maxHeight: "300px", overflowY: "auto",
              display: "flex", flexDirection: "column", gap: "0.5rem",
              marginBottom: "0.875rem", padding: "0.5rem"
            }}>
              {messages.length === 0 && (
                <div style={{ textAlign: "center", color: "#475569", fontSize: "0.85rem", padding: "1rem" }}>
                  No messages yet. Say hi! 👋
                </div>
              )}
              {messages.map((m) => {
                const isMine = m.sender_id === user?.id;
                return (
                  <div key={m.id} style={{
                    alignSelf: isMine ? "flex-end" : "flex-start",
                    maxWidth: "75%",
                    background: isMine ? "rgba(97,117,247,0.2)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${isMine ? "rgba(97,117,247,0.3)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: isMine ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
                    padding: "0.5rem 0.875rem",
                  }}>
                    <div style={{ fontSize: "0.7rem", color: "#475569", marginBottom: "2px" }}>{m.sender_name}</div>
                    <div style={{ fontSize: "0.875rem", color: "#e2e8f0" }}>{m.content}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                className="input"
                value={chatMsg}
                onChange={(e) => setChatMsg(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <button className="btn btn-primary" onClick={handleSendMessage} disabled={sendingMsg || !chatMsg.trim()}>
                Send
              </button>
            </div>
          </div>
        )}
      </div>

      {showClaimModal && item && (
        <ClaimModal
          item={item}
          onClose={() => setShowClaimModal(false)}
          onSuccess={() => setShowClaimModal(false)}
        />
      )}
    </div>
  );
}
