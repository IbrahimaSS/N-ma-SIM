"use client";
import { useState } from "react";
import { Search, SlidersHorizontal, Eye } from "lucide-react";
import { MOCK_CLIENTS } from "@/data/admin-mock-data";

export default function Clients() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(MOCK_CLIENTS[0]);

  const filtered = MOCK_CLIENTS.filter(c =>
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    c.numeroPiece.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1F0270", margin: 0 }}>Clients</h1>
          <p style={{ color: "#6B7280", marginTop: 4, fontSize: 14 }}>Base clients et profils</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un client, nom, numéro de pièce..." style={{ paddingLeft: 36, paddingRight: 16, height: 40, borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 14, outline: "none", width: 300, background: "white" }} />
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 40, borderRadius: 10, border: "1px solid #E5E7EB", background: "white", cursor: "pointer", fontSize: 14, color: "#374151" }}>
            <SlidersHorizontal size={16} /> Filtrer
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Total clients", value: "5 240", sub: "↑ 8,2% ce mois", subColor: "#D97706" },
          { label: "Résidents", value: "4 120", sub: "↑ 6,4% ce mois", subColor: "#059669" },
          { label: "Étrangers", value: "1 120", sub: "↑ 12,7% ce mois", subColor: "#059669" },
          { label: "Documents validés", value: "4 812", sub: "↑ 7,1% ce mois", subColor: "#059669" },
        ].map(k => (
          <div key={k.label} style={{ background: "white", borderRadius: 16, padding: "18px 22px", flex: 1, minWidth: 160, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 8, fontWeight: 500 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#1F0270" }}>{k.value}</div>
            <div style={{ fontSize: 12, color: k.subColor || "#6B7280", marginTop: 6 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
        {/* Table */}
        <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                {["Client", "Profil", "Type de pièce", "Numéro de pièce", "Service récent", "Statut", "Dernière activité", "Action"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "14px 12px", fontSize: 12, color: "#6B7280", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}
                  style={{ borderBottom: "1px solid #F9FAFB", cursor: "pointer", background: selected.id === c.id ? "#F8F7FF" : "transparent" }}
                  onClick={() => setSelected(c)}
                >
                  <td style={{ padding: "13px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#4F46E5", flexShrink: 0 }}>
                        {c.nom.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{c.nom}</div>
                        <div style={{ fontSize: 11, color: "#9CA3AF" }}>{c.tel}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "13px 12px" }}>
                    <span style={{ background: "#EEF2FF", color: "#4338CA", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>{c.profil}</span>
                  </td>
                  <td style={{ padding: "13px 12px", fontSize: 13, color: "#374151" }}>{c.typePiece}</td>
                  <td style={{ padding: "13px 12px", fontSize: 12, color: "#6B7280", fontFamily: "monospace" }}>{c.numeroPiece}</td>
                  <td style={{ padding: "13px 12px", fontSize: 13, color: "#374151" }}>{c.serviceRecent}</td>
                  <td style={{ padding: "13px 12px" }}>
                    <span style={{ background: c.statut === "Validé" ? "#DCFCE7" : "#FEF3C7", color: c.statut === "Validé" ? "#166534" : "#92400E", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>{c.statut}</span>
                  </td>
                  <td style={{ padding: "13px 12px", fontSize: 12, color: "#9CA3AF" }}>{c.derniereActivite}</td>
                  <td style={{ padding: "13px 12px" }}>
                    <button style={{ background: "#EEF2FF", border: "none", borderRadius: 8, padding: "7px 10px", cursor: "pointer" }}>
                      <Eye size={15} style={{ color: "#4F46E5" }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #F3F4F6" }}>
            <span style={{ fontSize: 13, color: "#6B7280" }}>Affichage 1 à {filtered.length} sur 5 240 clients</span>
          </div>
        </div>

        {/* Fiche rapide */}
        <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5", height: "fit-content" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, color: "#1F0270", margin: 0, fontSize: 14 }}>Fiche rapide client</h3>
            <button style={{ fontSize: 12, color: "#4F46E5", background: "none", border: "none", cursor: "pointer" }}>▾</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #F3F4F6" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#4F46E5" }}>{selected.nom.charAt(0)}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{selected.nom}</div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>{selected.tel}</div>
              <span style={{ background: "#EEF2FF", color: "#4338CA", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 600 }}>{selected.profil}</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Type de pièce", val: selected.typePiece },
              { label: "Numéro de pièce", val: selected.numeroPiece },
              { label: "Statut KYC", val: selected.statut, isStatut: true },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>{item.label}</span>
                {item.isStatut ? (
                  <span style={{ background: selected.statut === "Validé" ? "#DCFCE7" : "#FEF3C7", color: selected.statut === "Validé" ? "#166534" : "#92400E", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 600 }}>{item.val}</span>
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#111827", fontFamily: item.label.includes("Numéro") ? "monospace" : "inherit" }}>{item.val}</span>
                )}
              </div>
            ))}
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1F0270" }}>Historique des demandes</span>
              <button style={{ fontSize: 12, color: "#4F46E5", background: "none", border: "none", cursor: "pointer" }}>Voir tout</button>
            </div>
            {[
              { id: "NMA-2026-000128", statut: "Validé", service: "SIM + Internet", date: "12 mai 2026" },
              { id: "NMA-2026-000045", statut: "Validé", service: "Réactivation", date: "18 avr. 2026" },
            ].map(h => (
              <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "8px 10px", borderRadius: 8, background: "#F9FAFB" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{h.id}</div>
                  <div style={{ fontSize: 11, color: "#6B7280" }}>{h.service}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>{h.statut}</div>
                  <div style={{ fontSize: 10, color: "#9CA3AF" }}>{h.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
