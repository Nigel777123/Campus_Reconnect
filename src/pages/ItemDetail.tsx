import React from "react";
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
  const { success, error } = useNotification();

  const [item, setItem]                       = useState<Item | null>(null);
  const [claims, setClaims]                   = useState<Claim[]>([]);
  const [verificationAnswers, setVA]          = useState<string[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [claimsLoading, setClaimsLoading]     = useState(false);
  const [showClaimModal, setShowClaimModal]   = useState(false);
  const [chatClaimId, setChatClaimId]         = useState<number | null>(null);
  const [messages, setMessages]               = useState<any[]>([]);
  const [contactInfo, setContactInfo]         = useState("");
  const [chatMsg, setChatMsg]                 = useState("");
  const [sendingMsg, setSendingMsg]           = useState(false);

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
        .then(({ claims, verification_answers }) => { setClaims(claims); setVA(verification_answers); })
        .catch(() => {})
        .finally(() => setClaimsLoading(false));
    }
  }, [item, user]);

  const loadChat = async (claimId: number) => {
    try {
      const data = await api.messages.list(claimId);
      setMessages(data.messages);
      setContactInfo(data.contact_info);
      setChatClaimId(claimId);
    } catch (e: any) { error(e.message || "Cannot load chat"); }
  };

  const handleSendMessage = async () => {
    if (!chatMsg.trim() || !chatClaimId) return;
    setSendingMsg(true);
    try { await api.messages.send(chatClaimId, chatMsg); setChatMsg(""); loadChat(chatClaimId); }
    catch (e: any) { error(e.message); }
    finally { setSendingMsg(false); }
  };

  const handleClaimAction = async (claimId: number, status: "approved" | "rejected") => {
    try {
      await api.claims.updateStatus(claimId, status);
      success(status === "approved" ? "Claim approved! 🎉 Chat is now open." : "Claim rejected.");
      setClaims((prev) => prev.map((c) => c.id === claimId ? { ...c, status } : c));
      if (status === "approved") setItem((prev) => prev ? { ...prev, status: "resolved" } : prev);
    } catch (e: any) { error(e.message); }
  };

  const handleReopen = async () => {
    try { await api.items.update(item!.id, { status: "active" }); success("Listing reopened"); setItem((p) => p ? { ...p, status: "active" } : p); }
    catch (e: any) { error(e.message); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this listing permanently?")) return;
    try { await api.items.delete(item!.id); success("Listing deleted"); navigate("/"); }
    catch (e: any) { error(e.message); }
  };

  if (loading) return (
    <div className="page" style={{ maxWidth: "800px" }}>
      <div className="skeleton" style={{ height: "400px", marginBottom: "1rem" }} />
      <div className="skeleton" style={{ height: "200px" }} />
    </div>
  );
  if (!item) return null;

  const isOwner    = user?.id === item.user_id;
  const catMeta    = CATEGORY_META[item.category] ?? CATEGORY_META.other;
  const questions: Array<{ question: string }> = (() => { try { return JSON.parse(item.verification_questions || "[]"); } catch { return []; } })();
  const isFound    = item.type === "found";
  const isResolved = item.status === "resolved";
  const canClaim   = user && isFound && !isOwner && !isResolved;

  const metaItem = (icon: React.ReactNode, label: string, value: string) => (
    <div style={{ display: "flex", gap: ".5rem", alignItems: "flex-start", fontSize: ".875rem" }}>
      <span style={{ marginTop: "2px", color: "var(--brass)", flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: ".68rem", textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-faint)", fontFamily: "var(--font-mono)", marginBottom: ".1rem" }}>{label}</div>
        <div style={{ color: "var(--text-secondary)" }}>{value}</div>
      </div>
    </div>
  );

  return (
    <div className="page" style={{ maxWidth: "900px" }}>
      <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" style={{ marginBottom: "1.25rem" }}>
        <ArrowLeft size={15} /> Back
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* ── Main card ──────────────────────────────────────────── */}
        <div className="paper-surface" style={{ overflow: "hidden" }}>
          {item.image_url && (
            <div style={{ height: "320px", overflow: "hidden" }}>
              <img src={item.image_url} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}

          <div style={{ padding: "1.75rem" }}>
            {/* Badges */}
            <div style={{ display: "flex", gap: ".5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              <span className={`badge badge-${item.type}`}>{isFound ? "✅ Found" : "🔍 Lost"}</span>
              {isResolved && <span className="badge badge-resolved">✓ Resolved</span>}
              <span className="badge badge-resolved">{catMeta.emoji} {catMeta.label}</span>
            </div>

            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 800, margin: "0 0 .875rem", color: "var(--ink-navy)", lineHeight: 1.15 }}>
              {item.title}
            </h1>

            {item.description && (
              <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "1.25rem", fontSize: ".95rem" }}>
                {item.description}
              </p>
            )}

            {/* Meta */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: ".875rem", marginBottom: "1.5rem" }}>
              {item.location && metaItem(<MapPin size={14} />, isFound ? "Found at" : "Lost near", item.location)}
              {item.date && metaItem(<Calendar size={14} />, "Date", new Date(item.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" }))}
              {metaItem(<Clock size={14} />, "Posted by", `${item.poster_name} · ${new Date(item.created_at).toLocaleDateString()}`)}
            </div>

            {/* Owner contact */}
            {isOwner && item.contact_info && (
              <div style={{ background: "var(--found-bg)", border: "1.5px solid rgba(47,93,80,.2)", borderRadius: "2px", padding: ".75rem 1rem", marginBottom: "1.25rem", display: "flex", gap: ".5rem", alignItems: "center" }}>
                <Phone size={14} style={{ color: "var(--found-green)" }} />
                <span style={{ fontSize: ".875rem", color: "var(--found-green)" }}>Contact: {item.contact_info}</span>
              </div>
            )}

            {/* Verification questions */}
            {isFound && questions.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: ".4rem", marginBottom: ".75rem", fontSize: ".72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".07em", fontFamily: "var(--font-mono)" }}>
                  <Lock size={13} style={{ color: "var(--brass)" }} /> Verification Questions
                  {!isOwner && <span style={{ color: "var(--text-faint)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>— answer these to claim</span>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
                  {questions.map((q, i) => (
                    <div key={i} style={{ padding: ".625rem .875rem", background: "var(--paper-warm)", border: "1.5px solid var(--bg-border)", borderRadius: "2px", fontSize: ".875rem", color: "var(--text-secondary)", fontStyle: "italic", fontFamily: "var(--font-display)" }}>
                      <span style={{ color: "var(--brass-dark)", fontWeight: 700, fontStyle: "normal", fontFamily: "var(--font-mono)", fontSize: ".7rem", marginRight: ".4rem" }}>Q{i + 1}:</span>
                      {q.question}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTAs */}
            <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
              {canClaim && (
                <button className="btn btn-found btn-lg" onClick={() => setShowClaimModal(true)} style={{ flex: "1 1 auto" }}>
                  <CheckCircle size={18} /> Claim This Item
                </button>
              )}
              {isOwner && (
                <>
                  {isResolved && <button className="btn btn-ghost" onClick={handleReopen}><RotateCcw size={15} /> Reopen</button>}
                  <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={15} /> Delete</button>
                </>
              )}
              {isAdmin && !isOwner && (
                <button className="btn btn-danger btn-sm" onClick={handleDelete}><Shield size={14} /> Admin: Delete</button>
              )}
              {!user && isFound && (
                <Link to="/login" className="btn btn-primary btn-lg" style={{ flex: "1 1 auto" }}>Sign In to Claim</Link>
              )}
            </div>
          </div>
        </div>

        {/* ── Claims panel (owner view) ──────────────────────────── */}
        {isOwner && (
          <div className="paper-surface" style={{ padding: "1.5rem" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, margin: "0 0 1.25rem", color: "var(--ink-navy)" }}>
              Claim Requests {claims.length > 0 && <span style={{ color: "var(--brass-dark)" }}>({claims.length})</span>}
            </h2>

            {claimsLoading ? (
              <div style={{ color: "var(--text-faint)", fontSize: ".875rem" }}>Loading claims…</div>
            ) : claims.length === 0 ? (
              <div className="empty-state" style={{ padding: "1.5rem" }}>
                <div className="empty-state-icon">📭</div>
                <p>No claims yet</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {claims.map((claim) => {
                  const submitted: string[] = (() => { try { return JSON.parse(claim.submitted_answers || "[]"); } catch { return []; } })();
                  const isPending = claim.status === "pending";
                  return (
                    <div key={claim.id} style={{ background: "var(--paper-warm)", border: "1.5px solid var(--bg-border)", borderRadius: "2px", padding: "1.125rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: ".875rem" }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: ".9rem", color: "var(--ink-navy)" }}>{claim.claimant_name_display || claim.claimant_name}</div>
                          <div style={{ fontSize: ".72rem", color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>{new Date(claim.created_at).toLocaleString()}</div>
                        </div>
                        <span className={`badge badge-${claim.status}`}>{claim.status}</span>
                      </div>

                      {/* Q&A comparison */}
                      {questions.length > 0 && (
                        <div style={{ marginBottom: ".875rem" }}>
                          <div style={{ fontSize: ".68rem", color: "var(--text-faint)", marginBottom: ".5rem", textTransform: "uppercase", letterSpacing: ".07em", fontFamily: "var(--font-mono)" }}>Answer Comparison</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: ".35rem" }}>
                            {questions.map((q, i) => (
                              <div key={i} style={{ fontSize: ".8rem" }}>
                                <div style={{ color: "var(--text-muted)", marginBottom: ".2rem", fontStyle: "italic", fontFamily: "var(--font-display)" }}>"{q.question}"</div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".35rem" }}>
                                  <div style={{ padding: ".35rem .625rem", background: "var(--found-bg)", border: "1.5px solid rgba(47,93,80,.2)", borderRadius: "2px" }}>
                                    <div style={{ fontSize: ".62rem", color: "var(--found-green)", marginBottom: "2px", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>Your answer</div>
                                    <div style={{ color: "var(--ink-navy)" }}>{verificationAnswers[i] || "—"}</div>
                                  </div>
                                  <div style={{ padding: ".35rem .625rem", background: "var(--brass-light)", border: "1.5px solid rgba(201,162,39,.25)", borderRadius: "2px" }}>
                                    <div style={{ fontSize: ".62rem", color: "var(--brass-dark)", marginBottom: "2px", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>Their answer</div>
                                    <div style={{ color: "var(--ink-navy)" }}>{submitted[i] || "—"}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {claim.claimant_contact && (
                        <div style={{ fontSize: ".8rem", color: "var(--text-muted)", marginBottom: ".875rem" }}>📞 {claim.claimant_contact}</div>
                      )}

                      {isPending && (
                        <div style={{ display: "flex", gap: ".5rem" }}>
                          <button className="btn btn-found btn-sm" onClick={() => handleClaimAction(claim.id, "approved")}><CheckCircle size={13} /> Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleClaimAction(claim.id, "rejected")}><XCircle size={13} /> Reject</button>
                        </div>
                      )}
                      {claim.status === "approved" && (
                        <button className="btn btn-ghost btn-sm" onClick={() => loadChat(claim.id)}><MessageCircle size={13} /> Open Chat</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Chat panel ────────────────────────────────────────── */}
        {chatClaimId && (
          <div className="paper-surface" style={{ padding: "1.5rem" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, margin: "0 0 .5rem", color: "var(--ink-navy)", display: "flex", alignItems: "center", gap: ".5rem" }}>
              <MessageCircle size={18} style={{ color: "var(--found-green)" }} /> Handoff Chat
            </h2>
            {contactInfo && (
              <div style={{ background: "var(--found-bg)", border: "1.5px solid rgba(47,93,80,.2)", borderRadius: "2px", padding: ".5rem .875rem", fontSize: ".82rem", color: "var(--found-green)", marginBottom: "1rem", display: "flex", gap: ".5rem", alignItems: "center" }}>
                <Phone size={13} /> Contact: {contactInfo}
              </div>
            )}
            <div style={{ maxHeight: "280px", overflowY: "auto", display: "flex", flexDirection: "column", gap: ".5rem", marginBottom: ".875rem", padding: ".25rem" }}>
              {messages.length === 0 && <div style={{ textAlign: "center", color: "var(--text-faint)", fontSize: ".85rem", padding: "1rem" }}>No messages yet. Say hi! 👋</div>}
              {messages.map((m) => {
                const isMine = m.sender_id === user?.id;
                return (
                  <div key={m.id} style={{
                    alignSelf: isMine ? "flex-end" : "flex-start", maxWidth: "75%",
                    background: isMine ? "var(--found-bg)" : "var(--paper-warm)",
                    border: `1.5px solid ${isMine ? "rgba(47,93,80,.25)" : "var(--bg-border)"}`,
                    borderRadius: isMine ? "1rem 1rem .25rem 1rem" : "1rem 1rem 1rem .25rem",
                    padding: ".5rem .875rem",
                  }}>
                    <div style={{ fontSize: ".68rem", color: "var(--text-faint)", marginBottom: "2px", fontFamily: "var(--font-mono)" }}>{m.sender_name}</div>
                    <div style={{ fontSize: ".875rem", color: "var(--ink-navy)" }}>{m.content}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: ".5rem" }}>
              <input className="input" value={chatMsg} onChange={(e) => setChatMsg(e.target.value)} placeholder="Type a message…" onKeyDown={(e) => e.key === "Enter" && handleSendMessage()} />
              <button className="btn btn-primary" onClick={handleSendMessage} disabled={sendingMsg || !chatMsg.trim()}>Send</button>
            </div>
          </div>
        )}
      </div>

      {showClaimModal && item && (
        <ClaimModal item={item} onClose={() => setShowClaimModal(false)} onSuccess={() => setShowClaimModal(false)} />
      )}
    </div>
  );
}
