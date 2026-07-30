"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Printer, CheckCircle2, XCircle, Clock, FileText, Maximize2, Zap, AlertTriangle, X } from "lucide-react";
import { MOCK_DEMANDES } from "@/data/admin-mock-data";

export default function DetailDemande() {
  const router = useRouter();
  const { id } = useParams();
  const demande = MOCK_DEMANDES.find(d => d.id === id) || MOCK_DEMANDES[0];
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <button onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#6B7280", background: "none", border: "none", cursor: "pointer", marginBottom: 12 }}>
          <ArrowLeft size={16} /> Retour
        </button>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1F0270", margin: "0 0 6px" }}>Détail de la demande</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, color: "#6B7280" }}>{demande.id} • Créée le 12 mai 2026 à 10:24</span>
              <span style={{ background: "#F0FDF4", color: "#166534", border: "1px solid #BBF7D0", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>Nouvelle SIM</span>
              <span style={{ background: "#DCFCE7", color: "#166534", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>Paiement confirmé</span>
              <span style={{ background: "#FEF3C7", color: "#92400E", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>En attente de validation</span>
            </div>
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 40, borderRadius: 10, border: "1px solid #E5E7EB", background: "white", cursor: "pointer", fontSize: 14, color: "#374151" }}>
            <Printer size={16} /> Imprimer
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
        {/* Colonne gauche */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Informations client */}
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, color: "#1F0270", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <FileText size={18} style={{ color: "#4F46E5" }} /> Informations client
              </h3>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#4F46E5" }}>
                {demande.client.nom.charAt(0)}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { label: "Nom", val: demande.client.nom.split(" ")[0] || "Camara" },
                { label: "Type de pièce", val: "Carte Nationale d'Identité" },
                { label: "Prénom", val: demande.client.nom.split(" ")[1] || "Yamoussa" },
                { label: "Numéro de pièce", val: "CNI-0123456789" },
                { label: "Profil", val: "Particulier" },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{item.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pièce d'identité + Selfie */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
              <h4 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 12px", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                📄 Pièce d'identité
              </h4>
              <div style={{ background: "#1a4068", borderRadius: 12, padding: 16, minHeight: 160, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ color: "#FFB800", fontSize: 11, fontWeight: 600 }}>RÉPUBLIQUE DE GUINÉE</div>
                <div style={{ color: "white", fontSize: 10, fontWeight: 600 }}>Carte Nationale d'Identité</div>
                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  <div style={{ width: 50, height: 60, background: "#2d5f8a", borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👤</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ fontSize: 10, color: "#aaa" }}>Nom: <span style={{ color: "white", fontWeight: 600 }}>CAMARA</span></div>
                    <div style={{ fontSize: 10, color: "#aaa" }}>Prénom: <span style={{ color: "white", fontWeight: 600 }}>YAMOUSSA</span></div>
                    <div style={{ fontSize: 10, color: "#aaa" }}>Né(e) le: <span style={{ color: "white" }}>15/04/1992</span></div>
                    <div style={{ fontSize: 10, color: "#aaa" }}>N° CNI: <span style={{ color: "white" }}>CAU-01234567</span></div>
                  </div>
                </div>
              </div>
              <button onClick={() => setFullscreenImage("cni")} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 12, color: "#4F46E5", background: "none", border: "none", cursor: "pointer" }}>
                <Maximize2 size={12} /> Voir en plein écran
              </button>
            </div>

            <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
              <h4 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 12px", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                📷 Selfie
              </h4>
              <div style={{ background: "#1a2a1a", borderRadius: 12, minHeight: 160, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50 }}>
                😊
              </div>
              <button onClick={() => setFullscreenImage("selfie")} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 12, color: "#4F46E5", background: "none", border: "none", cursor: "pointer" }}>
                <Maximize2 size={12} /> Voir en plein écran
              </button>
            </div>
          </div>

          {/* Offre & Paiement */}
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
              💳 Offre & Paiement
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
              {[
                { label: "Offre", val: demande.offre },
                { label: "Montant", val: `${demande.montant.toLocaleString("fr-FR")} GNF` },
                { label: "Méthode de paiement", val: "Mobile Money (Orange Money)" },
                { label: "Type de service", val: "Prépayé" },
                { label: "Statut paiement", val: "Payé", isStatut: true },
                { label: "Référence transaction", val: "OM-20260512-9F7K3L" },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 4 }}>{item.label}</div>
                  {item.isStatut ? (
                    <span style={{ background: "#DCFCE7", color: "#166534", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>{item.val}</span>
                  ) : (
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{item.val}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Résultat IA */}
          <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <Zap size={18} style={{ color: "#FFB800" }} /> Résultat IA
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Document lisible", val: "Oui", ok: true },
                { label: "Visage détecté", val: "Oui", ok: true },
                { label: "Comparaison visage / document", val: "Correspondance", ok: true },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
                  <span style={{ fontSize: 13, color: "#374151" }}>{item.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: item.ok ? "#059669" : "#DC2626" }}>{item.val}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                <span style={{ fontSize: 13, color: "#374151" }}>Niveau de confiance</span>
                <span style={{ background: "#DBEAFE", color: "#1D4ED8", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>87%</span>
              </div>
            </div>
            {/* <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 10, padding: 12, marginTop: 10 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <AlertTriangle size={16} style={{ color: "#D97706", marginTop: 1, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#92400E" }}>Validation humaine requise</div>
                  <div style={{ fontSize: 12, color: "#92400E", marginTop: 2 }}>La confiance est inférieure au seuil recommandé (90%).</div>
                </div>
              </div>
            </div> */}
          </div>

          {/* Actions - Commentées temporairement car validation automatique */}
          {/* <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
              ⚡ Actions
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "13px", borderRadius: 12, background: "#059669", color: "white", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>
                <CheckCircle2 size={18} /> Valider
              </button>
              <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "13px", borderRadius: 12, background: "#FEE2E2", color: "#DC2626", border: "1px solid #FCA5A5", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>
                <XCircle size={18} /> Rejeter
              </button>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 12, background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                  <Clock size={14} /> Mettre en attente
                </button>
                <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 12, background: "#EEF2FF", color: "#4338CA", border: "1px solid #C7D2FE", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                  📄 Générer reçu
                </button>
              </div>
            </div>
          </div> */}

          {/* Historique */}
          <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 16px", fontSize: 15 }}>🕐 Historique de la demande</h3>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 7, top: 0, bottom: 0, width: 2, background: "#E5E7EB" }} />
              {[
                { date: "12 mai 2026 à 10:24", label: "Demande créée", who: "Système", color: "#059669" },
                { date: "12 mai 2026 à 10:25", label: "Paiement confirmé", who: "Système", color: "#059669" },
                { date: "12 mai 2026 à 10:26", label: "Analyse IA terminée", who: "Système", color: "#059669" },
                { date: "12 mai 2026 à 10:26", label: "En attente de validation", who: "En cours", color: "#D97706" },
              ].map((h, i) => (
                <div key={i} style={{ display: "flex", gap: 14, marginBottom: 14, position: "relative" }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: h.color, flexShrink: 0, zIndex: 1, marginTop: 2, border: "2px solid white", boxShadow: "0 0 0 2px " + h.color }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>{h.label}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                      <span style={{ fontSize: 11, color: "#9CA3AF" }}>{h.date}</span>
                      <span style={{ fontSize: 11, color: h.who === "En cours" ? "#D97706" : "#9CA3AF" }}>{h.who}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Plein Écran */}
      {fullscreenImage && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }} onClick={() => setFullscreenImage(null)}>
          <button onClick={() => setFullscreenImage(null)} style={{ position: "absolute", top: 24, right: 24, background: "white", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
            <X size={24} color="#111827" />
          </button>
          
          {fullscreenImage === "cni" && (
            <div style={{ background: "#1a4068", borderRadius: 16, padding: 32, width: "100%", maxWidth: 800, minHeight: 400, display: "flex", flexDirection: "column", gap: 16, cursor: "default" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ color: "#FFB800", fontSize: 18, fontWeight: 600 }}>RÉPUBLIQUE DE GUINÉE</div>
              <div style={{ color: "white", fontSize: 16, fontWeight: 600 }}>Carte Nationale d'Identité</div>
              <div style={{ display: "flex", gap: 24, marginTop: 16 }}>
                <div style={{ width: 120, height: 160, background: "#2d5f8a", borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>👤</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                  <div style={{ fontSize: 14, color: "#aaa" }}>Nom: <span style={{ color: "white", fontWeight: 600, fontSize: 18 }}>CAMARA</span></div>
                  <div style={{ fontSize: 14, color: "#aaa" }}>Prénom: <span style={{ color: "white", fontWeight: 600, fontSize: 18 }}>YAMOUSSA</span></div>
                  <div style={{ fontSize: 14, color: "#aaa" }}>Né(e) le: <span style={{ color: "white", fontSize: 16 }}>15/04/1992</span></div>
                  <div style={{ fontSize: 14, color: "#aaa" }}>N° CNI: <span style={{ color: "white", fontSize: 16 }}>CAU-01234567</span></div>
                </div>
              </div>
            </div>
          )}

          {fullscreenImage === "selfie" && (
            <div style={{ background: "#1a2a1a", borderRadius: 16, width: "100%", maxWidth: 600, minHeight: 600, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 120, cursor: "default" }} onClick={(e) => e.stopPropagation()}>
              😊
            </div>
          )}
        </div>
      )}
    </div>
  );
}
