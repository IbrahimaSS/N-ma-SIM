"use client";
import { Plus, Edit2, Power, Eye, Tag } from "lucide-react";
import { MOCK_OFFRES_ADMIN } from "@/data/admin-mock-data";

export default function Offres() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1F0270", margin: 0 }}>Offres</h1>
          <p style={{ color: "#6B7280", marginTop: 4, fontSize: 14 }}>Gestion des offres SIM</p>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 40, borderRadius: 10, background: "#1F0270", color: "white", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
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
              {MOCK_OFFRES_ADMIN.map((o) => (
                <tr key={o.id} style={{ borderBottom: "1px solid #F9FAFB" }}>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
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
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#10B981" }}>{o.statut}</span>
                    </div>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, border: "1px solid #E5E7EB", background: "white", color: "#374151", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                          <Edit2 size={12} /> Modifier
                        </button>
                        <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, border: "1px solid #FEE2E2", background: "white", color: "#DC2626", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                          <Power size={12} /> Désactiver
                        </button>
                      </div>
                      <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "6px 12px", borderRadius: 6, border: "1px solid #E5E7EB", background: "#F9FAFB", color: "#4F46E5", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        <Eye size={14} /> Voir détails
                      </button>
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
    </div>
  );
}
