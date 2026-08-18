"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Printer, CheckCircle2, XCircle, Clock,
  FileText, Zap, X, Loader2, RefreshCcw, User, CreditCard
} from "lucide-react";

const BACKEND = "http://localhost:3001";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const s = localStorage.getItem("admin_session");
  if (!s) return null;
  return JSON.parse(s).token ?? null;
}

async function apiFetch(path: string, opts?: RequestInit) {
  const token = getToken();
  const res = await fetch(`${BACKEND}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(opts?.headers || {}),
    },
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Erreur ${res.status}`);
  return data;
}

// ─── Badges ─────────────────────────────────────────────────────────────────
function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    VALIDEE:                { bg: "#DCFCE7", color: "#166534", label: "Validée" },
    EN_ATTENTE_VALIDATION:  { bg: "#FEF3C7", color: "#92400E", label: "En attente" },
    EN_COURS_DE_TRAITEMENT: { bg: "#EEF2FF", color: "#4338CA", label: "En cours" },
    REJETEE:                { bg: "#FEE2E2", color: "#991B1B", label: "Rejetée" },
  };
  const s = map[statut] || { bg: "#F3F4F6", color: "#374151", label: statut };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600 }}>
      {s.label}
    </span>
  );
}

function PaiementBadge({ statut }: { statut?: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    CONFIRME:  { bg: "#DCFCE7", color: "#166534", label: "Confirmé" },
    EN_ATTENTE: { bg: "#FEF3C7", color: "#92400E", label: "En attente" },
    ECHOUE:    { bg: "#FEE2E2", color: "#991B1B", label: "Échoué" },
  };
  const s = map[statut || ""] || { bg: "#F3F4F6", color: "#374151", label: statut || "—" };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600 }}>
      {s.label}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{value || "—"}</div>
    </div>
  );
}

export default function DetailDemande() {
  const router = useRouter();
  const { id } = useParams();
  const [demande, setDemande] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<"VALIDEE" | "REJETEE" | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const fetchDemande = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/demandes/${id}`);
      setDemande(res.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchDemande(); }, [fetchDemande]);

  const handleAction = async (_statut: "VALIDEE" | "REJETEE") => {
    // Les demandes sont validées automatiquement — cette fonction est conservée pour compatibilité
    console.info("[ADMIN] Traitement automatique, validation manuelle désactivée.");
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const isTerminal = demande?.statut === "VALIDEE" || demande?.statut === "REJETEE";
  const isRecharge = demande?.type === "RECHARGE";

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80, gap: 12 }}>
      <Loader2 size={28} style={{ color: "#1F0270", animation: "spin 1s linear infinite" }} />
      <span style={{ color: "#1F0270", fontWeight: 600 }}>Chargement...</span>
    </div>
  );

  if (error || !demande) return (
    <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: 24, color: "#991B1B" }}>
      ⚠️ {error || "Demande introuvable."}
      <button onClick={fetchDemande} style={{ marginLeft: 12, color: "#4F46E5", background: "none", border: "none", cursor: "pointer" }}>Réessayer</button>
    </div>
  );

  const client = demande.client || {};
  const offre = demande.offre || {};
  const paiement = Array.isArray(demande.paiement) ? demande.paiement[0] : (demande.paiement || {});

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, background: toast.ok ? "#059669" : "#DC2626", color: "white", padding: "12px 20px", borderRadius: 12, fontWeight: 600, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <button onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#6B7280", background: "none", border: "none", cursor: "pointer", marginBottom: 12 }}>
          <ArrowLeft size={16} /> Retour
        </button>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1F0270", margin: "0 0 8px" }}>Détail de la demande</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, color: "#6B7280" }}>
                {demande.numeroDossier} • Créée le {formatDate(demande.createdAt)}
              </span>
              <span style={{ background: demande.type === "NOUVELLE_SIM" ? "#F0FDF4" : demande.type === "RECHARGE" ? "#FFFBEB" : "#EEF2FF", color: demande.type === "NOUVELLE_SIM" ? "#166534" : demande.type === "RECHARGE" ? "#B45309" : "#4338CA", border: `1px solid ${demande.type === "NOUVELLE_SIM" ? "#BBF7D0" : demande.type === "RECHARGE" ? "#FDE68A" : "#C7D2FE"}`, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>
                {demande.type === "NOUVELLE_SIM" ? "Nouvelle SIM" : demande.type === "RECHARGE" ? "Recharge" : "Réactivation"}
              </span>
              <StatutBadge statut={demande.statut} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={fetchDemande} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", height: 38, borderRadius: 10, border: "1px solid #E5E7EB", background: "white", cursor: "pointer", fontSize: 13 }}>
              <RefreshCcw size={14} /> Actualiser
            </button>
            <button onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", height: 38, borderRadius: 10, border: "1px solid #E5E7EB", background: "white", cursor: "pointer", fontSize: 13, color: "#374151" }}>
              <Printer size={14} /> Imprimer
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
        {/* ── Colonne gauche ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Section Client — différente selon le type */}
          {isRecharge ? (
            /* Pour une recharge : afficher juste les infos essentielles */
            <div style={{ background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)", borderRadius: 16, padding: 24, border: "1px solid #FDE68A" }}>
              <h3 style={{ fontWeight: 700, color: "#92400E", margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8, fontSize: 16 }}>
                <span style={{ fontSize: 20 }}>⚡</span> Transaction de Recharge
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
                <div style={{ background: "white", borderRadius: 12, padding: "16px 20px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize: 11, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Numéro rechargé</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#1F0270" }}>+224 {demande.numeroAReactiver || "—"}</div>
                </div>
                <div style={{ background: "white", borderRadius: 12, padding: "16px 20px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize: 11, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Montant</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#059669" }}>
                    {paiement.montant
                      ? `${Number(paiement.montant).toLocaleString("fr-FR")} GNF`
                      : demande.motifReactivation?.replace("Recharge ", "") || "—"}
                  </div>
                </div>
                <div style={{ background: "white", borderRadius: 12, padding: "16px 20px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize: 11, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Statut</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#DCFCE7", color: "#166534", borderRadius: 20, padding: "4px 14px", fontSize: 13, fontWeight: 700 }}>
                    ✓ Validée
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <InfoRow label="Méthode de paiement" value={paiement.methodePaiement || "Lengo Pay"} />
                <InfoRow label="Référence" value={paiement.referenceExterne || demande.numeroDossier} />
              </div>
            </div>
          ) : (
            <>
              {/* Infos Réactivation — affiché uniquement si c'est une réactivation */}
              {demande.type === "REACTIVATION" && (
                <div style={{ background: "linear-gradient(135deg, #F5F3FF, #EDE9FE)", borderRadius: 16, padding: 24, border: "1px solid #DDD6FE", marginBottom: 16 }}>
                  <h3 style={{ fontWeight: 700, color: "#4C1D95", margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8, fontSize: 16 }}>
                    <span style={{ fontSize: 20 }}>🔄</span> Détails de la Réactivation
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <div style={{ background: "white", borderRadius: 12, padding: "16px 20px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                      <div style={{ fontSize: 11, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Numéro à réactiver</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#1F0270" }}>{demande.numeroAReactiver || "—"}</div>
                    </div>
                    <div style={{ background: "white", borderRadius: 12, padding: "16px 20px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                      <div style={{ fontSize: 11, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Motif</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#4F46E5" }}>{demande.motifReactivation || "—"}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Informations client */}
              <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <h3 style={{ fontWeight: 700, color: "#1F0270", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                    <User size={18} style={{ color: "#4F46E5" }} /> Informations client
                  </h3>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#4F46E5" }}>
                    {client.nom?.charAt(0) || "?"}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <InfoRow label="Nom" value={client.nom} />
                  <InfoRow label="Prénom" value={client.prenom} />
                  {client.telephone && <InfoRow label="Téléphone" value={client.telephone} />}
                  <InfoRow label="Date de naissance" value={client.dateNaissance ? new Date(client.dateNaissance).toLocaleDateString("fr-FR") : "—"} />
                  <InfoRow label="Type de pièce" value={
                    client.typePiece === "cni" ? "Carte Nationale d'Identité" :
                    client.typePiece === "carte_electeur" ? "Carte d'électeur" :
                    client.typePiece === "passeport" ? "Passeport" :
                    client.typePiece || "—"
                  } />
                  <InfoRow label="Numéro de pièce" value={client.numeroPiece} />
                  {client.nationalite && <InfoRow label="Nationalité" value={client.nationalite} />}
                  {client.lieuNaissance && <InfoRow label="Lieu de naissance" value={client.lieuNaissance} />}
                </div>
              </div>
            </>
          )}

          {/* Offre & Paiement — seulement pour non-recharge */}
          {!isRecharge && (
            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
              <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                <CreditCard size={18} style={{ color: "#4F46E5" }} /> Offre & Paiement
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {demande.type === "NOUVELLE_SIM" && (
                  <InfoRow label="Achat de base" value="Nouvelle Carte SIM" />
                )}
                {offre.nom && (
                  <InfoRow 
                    label={demande.type === "NOUVELLE_SIM" && !offre.type?.includes("SIM_") ? "Option ajoutée" : "Offre choisie"} 
                    value={offre.nom} 
                  />
                )}
                {offre.prix && (
                  <InfoRow 
                    label={demande.type === "NOUVELLE_SIM" && !offre.type?.includes("SIM_") ? "Prix de l'option" : "Prix de l'offre"} 
                    value={`${Number(offre.prix).toLocaleString("fr-FR")} GNF`} 
                  />
                )}
                {paiement.montant && (
                  <InfoRow 
                    label={demande.type === "NOUVELLE_SIM" ? "Montant TOTAL payé" : "Montant payé"} 
                    value={`${Number(paiement.montant).toLocaleString("fr-FR")} GNF`} 
                  />
                )}
                {paiement.methodePaiement && <InfoRow label="Méthode de paiement" value={paiement.methodePaiement} />}
                {paiement.statut && (
                  <div>
                    <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 4 }}>Statut paiement</div>
                    <PaiementBadge statut={paiement.statut} />
                  </div>
                )}
                {(paiement.referenceExterne || paiement.id) && (
                  <InfoRow label="Référence transaction" value={paiement.referenceExterne || paiement.id?.slice(0, 16)} />
                )}
                {!offre.nom && !paiement.montant && (
                  <div style={{ gridColumn: "1/-1", color: "#9CA3AF", fontSize: 13, fontStyle: "italic", padding: "8px 0" }}>
                    Aucun paiement enregistré pour cette demande.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Colonne droite ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Résultat IA — masqué pour les recharges */}
          {!isRecharge && (
          <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <Zap size={18} style={{ color: "#FFB800" }} /> Résultat IA
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Document lisible (OCR)", val: demande.verificationOCR, isBoolean: true },
                { label: "Selfie vérifié", val: demande.verificationSelfie, isBoolean: true },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
                  <span style={{ fontSize: 13, color: "#374151" }}>{item.label}</span>
                  {item.isBoolean ? (
                    <span style={{ fontSize: 12, fontWeight: 600, color: item.val ? "#059669" : item.val === false ? "#DC2626" : "#9CA3AF" }}>
                      {item.val === true ? "✓ Oui" : item.val === false ? "✗ Non" : "—"}
                    </span>
                  ) : (
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{item.val || "—"}</span>
                  )}
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                <span style={{ fontSize: 13, color: "#374151" }}>Score de vérification</span>
                <span style={{
                  background: demande.scoreVerification >= 80 ? "#DBEAFE" : "#FEF3C7",
                  color: demande.scoreVerification >= 80 ? "#1D4ED8" : "#92400E",
                  borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700
                }}>
                  {demande.scoreVerification != null ? `${demande.scoreVerification}%` : "—"}
                </span>
              </div>
              {demande.commentaireAdmin && (
                <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "10px 12px", marginTop: 4 }}>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>Commentaire admin</div>
                  <div style={{ fontSize: 13, color: "#374151" }}>{demande.commentaireAdmin}</div>
                </div>
              )}
              {demande.traitePar && (
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>Traité par : {demande.traitePar}</div>
              )}
            </div>
          </div>
          )}

          {/* Actions */}
          {/* Traitement automatique */}
          <div style={{ background: "#F0FDF4", borderRadius: 16, padding: 20, border: "1px solid #BBF7D0" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CheckCircle2 size={20} style={{ color: "#059669" }} />
              </div>
              <div>
                <p style={{ fontWeight: 700, color: "#166534", margin: 0, fontSize: 14 }}>Traitement automatique</p>
                <p style={{ color: "#6B7280", margin: "4px 0 0", fontSize: 12 }}>
                  Les demandes sont validées automatiquement dès que le paiement est confirmé. Aucune action manuelle requise.
                </p>
              </div>
            </div>
          </div>

          {/* Historique */}
          <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 16px", fontSize: 15 }}>🕐 Historique</h3>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 7, top: 0, bottom: 0, width: 2, background: "#E5E7EB" }} />
              {[
                { date: formatDate(demande.createdAt), label: "Demande créée", color: "#059669" },
                paiement.statut === "CONFIRME" && { date: formatDate(paiement.updatedAt || demande.createdAt), label: "Paiement confirmé", color: "#059669" },
                { date: formatDate(demande.updatedAt), label: demande.statut === "VALIDEE" ? "Demande validée" : demande.statut === "REJETEE" ? "Demande rejetée" : "En attente de validation", color: demande.statut === "VALIDEE" ? "#059669" : demande.statut === "REJETEE" ? "#DC2626" : "#D97706" },
              ].filter(Boolean).map((h: any, i: number) => (
                <div key={i} style={{ display: "flex", gap: 14, marginBottom: 14, position: "relative" }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: h.color, flexShrink: 0, zIndex: 1, marginTop: 2, border: "2px solid white", boxShadow: `0 0 0 2px ${h.color}` }} />
                  <div>
                    <div style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>{h.label}</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{h.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
