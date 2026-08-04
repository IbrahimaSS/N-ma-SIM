"use client";
import { useState } from "react";
import { Plus, Edit2, Power, Eye, Tag, X, CheckCircle2 } from "lucide-react";
import { MOCK_OFFRES_ADMIN } from "@/data/admin-mock-data";

// Composant générique pour les Modals
function Modal({ isOpen, onClose, title, children }: any) {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 500, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#1F0270", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -15, right: -15, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,184,0,0.10)" }} />
          <div style={{ position: "absolute", bottom: -20, left: -10, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <h3 style={{ fontWeight: 700, color: "#FFB800", margin: 0, fontSize: 18, position: "relative", zIndex: 1 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", color: "white", display: "flex", padding: 7, borderRadius: 8, position: "relative", zIndex: 1 }}><X size={18} /></button>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Offres() {
  const [offres, setOffres] = useState(MOCK_OFFRES_ADMIN);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editOffre, setEditOffre] = useState<any>(null);
  const [deactivateOffre, setDeactivateOffre] = useState<any>(null);

  const notifySuccess = () => {
    setIsAddOpen(false);
    setEditOffre(null);
    setDeactivateOffre(null);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1F0270", margin: 0 }}>Offres</h1>
          <p style={{ color: "#6B7280", marginTop: 4, fontSize: 14 }}>Gestion des offres SIM</p>
        </div>
        <button onClick={() => setIsAddOpen(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 40, borderRadius: 10, background: "#1F0270", color: "white", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
          <Plus size={16} /> Ajouter une offre
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { icon: Tag, label: "Offres actives", value: "4", sub: "100% des offres", color: "#059669", bg: "#DCFCE7", iconColor: "#166534" },
          { icon: Tag, label: "Offres inactives", value: "0", sub: "0% des offres", color: "#6B7280", bg: "#F3F4F6", iconColor: "#374151" },
          { icon: Plus, label: "Nouvelle SIM", value: "2", sub: "Types de service", color: "#4F46E5", bg: "#EEF2FF", iconColor: "#4338CA" },
          { icon: Plus, label: "Réactivation", value: "1", sub: "Type de service", color: "#D97706", bg: "#FEF3C7", iconColor: "#92400E" },
        ].map((k, i) => (
          <div key={i} style={{ background: "white", borderRadius: 16, padding: "18px 22px", flex: 1, minWidth: 160, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ background: k.bg, borderRadius: 10, padding: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <k.icon size={20} style={{ color: k.iconColor }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4, fontWeight: 500 }}>{k.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#1F0270" }}>{k.value}</div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
        {/* Liste des offres */}
        <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                {["Offre", "Prix", "Type de service", "Statut", "Actions"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "14px 20px", fontSize: 12, color: "#6B7280", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {offres.map((o) => (
                <tr key={o.id} style={{ borderBottom: "1px solid #F9FAFB", opacity: o.statut === "Inactive" ? 0.6 : 1 }}>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                        {o.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{o.nom}</div>
                        <div style={{ fontSize: 12, color: "#6B7280", maxWidth: 200, lineHeight: 1.4 }}>{o.description}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}>
                    {o.prix.toLocaleString("fr-FR")} GNF
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <span style={{ background: o.typeService === "Nouvelle SIM" ? "#EEF2FF" : "#F0FDF4", color: o.typeService === "Nouvelle SIM" ? "#4338CA" : "#166534", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600, border: `1px solid ${o.typeService === "Nouvelle SIM" ? "#C7D2FE" : "#BBF7D0"}` }}>
                      {o.typeService}
                    </span>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: o.statut === "Active" ? "#10B981" : "#EF4444" }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: o.statut === "Active" ? "#10B981" : "#EF4444" }}>{o.statut}</span>
                    </div>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setEditOffre(o)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, border: "1px solid #E5E7EB", background: "white", color: "#374151", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                          <Edit2 size={12} /> Modifier
                        </button>
                        <button onClick={() => setDeactivateOffre(o)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, border: "1px solid #FEE2E2", background: "white", color: "#DC2626", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                          <Power size={12} /> {o.statut === "Active" ? "Désactiver" : "Activer"}
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paramètres tarifaires */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 20px", fontSize: 15 }}>Paramètres tarifaires</h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Devise</label>
              <select style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 13, color: "#111827", background: "white", cursor: "pointer" }}>
                <option>GNF - Franc Guinéen</option>
                <option>XOF - Franc CFA</option>
                <option>USD - Dollar US</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>TVA applicable</label>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#6B7280" }}>?</div>
              </div>
              <input type="text" value="18 %" readOnly style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 13, color: "#111827", background: "#F9FAFB" }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Arrondi des prix</label>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#6B7280" }}>?</div>
              </div>
              <select style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 13, color: "#111827", background: "white", cursor: "pointer" }}>
                <option>À l'unité près</option>
                <option>À la dizaine près</option>
                <option>À la centaine près</option>
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Format d'affichage</label>
              <input type="text" value="10 000 GNF" readOnly style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 13, color: "#111827", background: "#F9FAFB" }} />
            </div>

            <div style={{ background: "#FEF3C7", borderRadius: 8, padding: 12, border: "1px solid #FDE68A" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <div style={{ color: "#D97706", marginTop: 2 }}>ℹ️</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#92400E" }}>Information</div>
                  <div style={{ fontSize: 11, color: "#92400E", marginTop: 2 }}>Les paramètres tarifaires sont appliqués automatiquement à toutes les offres.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Ajouter/Modifier une Offre */}
      <Modal isOpen={isAddOpen || !!editOffre} onClose={notifySuccess} title={editOffre ? "Modifier l'offre" : "Nouvelle offre"}>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Nom de l'offre</label>
          <input type="text" defaultValue={editOffre?.nom || ""} placeholder="Ex: SIM + Internet 5Go" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 14 }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Description</label>
          <textarea rows={3} defaultValue={editOffre?.description || ""} placeholder="Avantages de l'offre..." style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 14, resize: "none" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Prix (GNF)</label>
            <input type="number" defaultValue={editOffre?.prix || ""} placeholder="Ex: 10000" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 14 }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Type de service</label>
            <select defaultValue={editOffre?.typeService || "Nouvelle SIM"} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 14, background: "white" }}>
              <option value="Nouvelle SIM">Nouvelle SIM</option>
              <option value="Réactivation">Réactivation</option>
              <option value="Achat de pass">Achat de pass</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <button onClick={notifySuccess} style={{ flex: 1, padding: "12px", borderRadius: 8, background: "white", border: "1px solid #E5E7EB", color: "#374151", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
          <button onClick={notifySuccess} style={{ flex: 1, padding: "12px", borderRadius: 8, background: "#1F0270", border: "none", color: "white", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {editOffre ? <><CheckCircle2 size={16} /> Enregistrer</> : <><Plus size={16} /> Créer l'offre</>}
          </button>
        </div>
      </Modal>

      {/* Désactiver une Offre */}
      <Modal isOpen={!!deactivateOffre} onClose={() => setDeactivateOffre(null)} title={deactivateOffre?.statut === "Active" ? "Désactiver l'offre" : "Activer l'offre"}>
        <div style={{ background: deactivateOffre?.statut === "Active" ? "#FEE2E2" : "#DCFCE7", borderRadius: 8, padding: 16, display: "flex", gap: 12 }}>
          <Power size={24} color={deactivateOffre?.statut === "Active" ? "#DC2626" : "#166534"} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: deactivateOffre?.statut === "Active" ? "#991B1B" : "#166534" }}>
              Voulez-vous {deactivateOffre?.statut === "Active" ? "désactiver" : "activer"} "{deactivateOffre?.nom}" ?
            </div>
            <div style={{ fontSize: 12, color: deactivateOffre?.statut === "Active" ? "#B91C1C" : "#15803D", marginTop: 4 }}>
              {deactivateOffre?.statut === "Active" 
                ? "Cette offre ne sera plus visible sur les bornes Kiosk ni sur la plateforme web." 
                : "Cette offre sera à nouveau disponible pour les clients."}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <button onClick={() => setDeactivateOffre(null)} style={{ flex: 1, padding: "12px", borderRadius: 8, background: "white", border: "1px solid #E5E7EB", color: "#374151", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
          <button onClick={notifySuccess} style={{ flex: 1, padding: "12px", borderRadius: 8, background: deactivateOffre?.statut === "Active" ? "#DC2626" : "#166534", border: "none", color: "white", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Power size={16} /> {deactivateOffre?.statut === "Active" ? "Désactiver" : "Activer"}
          </button>
        </div>
      </Modal>

    </div>
  );
}
