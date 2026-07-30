"use client";
import { useState } from "react";
import { Search, SlidersHorizontal, Eye, X, Download } from "lucide-react";
import { MOCK_CLIENTS } from "@/data/admin-mock-data";

// Composant générique pour les Modals
function Modal({ isOpen, onClose, title, customUI, children }: any) {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: customUI ? "transparent" : "white", borderRadius: customUI ? 24 : 16, width: "100%", maxWidth: 480, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: customUI ? "none" : "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)" }} onClick={e => e.stopPropagation()}>
        {!customUI && (
          <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#1F0270", position: "relative", overflow: "hidden" }}>
            <h3 style={{ fontWeight: 700, color: "white", margin: 0, fontSize: 18, position: "relative", zIndex: 1 }}>{title}</h3>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", color: "white", display: "flex", padding: 7, borderRadius: 8, position: "relative", zIndex: 1 }}><X size={18} /></button>
          </div>
        )}
        <div style={customUI ? { width: "100%", overflowY: "auto", maxHeight: "90vh" } : { padding: 24, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Clients() {
  const [search, setSearch] = useState("");
  const [selectedModalClient, setSelectedModalClient] = useState<any>(null);

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

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
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
                <tr key={c.id} style={{ borderBottom: "1px solid #F9FAFB" }}>
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
                    <button onClick={() => setSelectedModalClient(c)} style={{ background: "#EEF2FF", border: "none", borderRadius: 8, padding: "7px 10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#E0E7FF"} onMouseOut={e => e.currentTarget.style.background = "#EEF2FF"}>
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
      </div>

      {/* Modal Détails Client */}
      <Modal isOpen={!!selectedModalClient} onClose={() => setSelectedModalClient(null)} customUI>
        {selectedModalClient && (
          <div style={{ background: "#F8F9FC", width: "100%", overflow: "hidden", position: "relative" }}>
            {/* Header Section */}
            <div style={{ background: "#1F0270", padding: "24px 24px 48px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,184,0,0.10)" }} />
              <div style={{ position: "absolute", top: 20, right: 20, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,184,0,0.07)" }} />
              <div style={{ position: "absolute", bottom: -10, left: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 10 }}>
                <div>
                  <h2 style={{ margin: 0, color: "#FFB800", fontSize: 22, fontWeight: 800 }}>Détail Client</h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <span style={{ color: "#9CA3AF", fontSize: 13, fontFamily: "monospace" }}>{selectedModalClient.id}</span>
                    <button style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 4, padding: "2px 8px", color: "white", fontSize: 11, cursor: "pointer" }}>Copier</button>
                  </div>
                </div>
                <button onClick={() => setSelectedModalClient(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "white", cursor: "pointer" }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body Content */}
            <div style={{ padding: "0 24px 24px", marginTop: -32, position: "relative", zIndex: 20 }}>
              
              {/* Profile Card */}
              <div style={{ background: "white", borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FF6600", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "white", flexShrink: 0 }}>
                  {selectedModalClient.nom.substring(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#1F0270" }}>{selectedModalClient.nom}</div>
                  <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{selectedModalClient.tel}</div>
                  <div style={{ fontSize: 13, color: "#6B7280" }}>{selectedModalClient.nom.split(' ')[0].toLowerCase()}@gmail.com</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                  <span style={{ background: "#DCFCE7", color: "#166534", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>{selectedModalClient.profil}</span>
                  <span style={{ background: "#EEF2FF", color: "#4338CA", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>KYC {selectedModalClient.statut}</span>
                </div>
              </div>

              {/* PIÈCE D'IDENTITÉ */}
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16, display: "flex", alignItems: "center" }}>
                  Pièce d'identité
                  <div style={{ flex: 1, height: 1, background: "#E5E7EB", marginLeft: 12 }}></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #EAECF5" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>Type de pièce</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1F0270" }}>{selectedModalClient.typePiece}</div>
                  </div>
                  <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #EAECF5" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>Numéro de pièce</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1F0270" }}>{selectedModalClient.numeroPiece}</div>
                  </div>
                  <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #EAECF5" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>Date de naissance</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1F0270" }}>12/04/1992</div>
                  </div>
                  <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #EAECF5" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>Adresse</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1F0270" }}>Ratoma, Conakry</div>
                  </div>
                  <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #EAECF5" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>Enregistré le</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1F0270" }}>05/03/2024</div>
                  </div>
                  <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #EAECF5", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>Statut KYC</div>
                    <div><span style={{ background: selectedModalClient.statut === "Validé" ? "#DCFCE7" : "#FEF3C7", color: selectedModalClient.statut === "Validé" ? "#166534" : "#92400E", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>{selectedModalClient.statut}</span></div>
                  </div>
                </div>
              </div>

              {/* HISTORIQUE DES DEMANDES */}
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16, display: "flex", alignItems: "center" }}>
                  Historique des demandes
                  <div style={{ flex: 1, height: 1, background: "#E5E7EB", marginLeft: 12 }}></div>
                </div>
                <div style={{ background: "white", borderRadius: 16, border: "1px solid #EAECF5", padding: "8px 0" }}>
                  {[
                    { id: "NMA-2026-000128", service: "SIM + Internet", statut: "Validé", date: "12 mai 2026" },
                    { id: "NMA-2026-000045", service: "Réactivation", statut: "Validé", date: "18 avr. 2026" },
                    { id: "NMA-2026-000012", service: "SIM Standard", statut: "Validé", date: "05 mars 2026" },
                    { id: "NMA-2026-000003", service: "SIM + Internet", statut: "En attente", date: "12 févr. 2026" },
                  ].map((h, i, arr) => (
                    <div key={h.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: i === arr.length - 1 ? "none" : "1px dashed #E5E7EB" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: h.statut === "Validé" ? "#10B981" : "#F59E0B" }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "#1F0270" }}>{h.id}</div>
                          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{h.service}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <span style={{ background: h.statut === "Validé" ? "#DCFCE7" : "#FEF3C7", color: h.statut === "Validé" ? "#166534" : "#92400E", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>{h.statut}</span>
                        <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "right", minWidth: 60 }}>
                          <span style={{ display: "block" }}>{h.date.substring(0, 6)}</span>
                          <span style={{ display: "block" }}>{h.date.substring(6)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ACTIVITÉ */}
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16, display: "flex", alignItems: "center" }}>
                  Activité
                  <div style={{ flex: 1, height: 1, background: "#E5E7EB", marginLeft: 12 }}></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #EAECF5" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>Dernière activité</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1F0270" }}>{selectedModalClient.derniereActivite}</div>
                  </div>
                  <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #EAECF5" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>Service récent</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1F0270" }}>{selectedModalClient.serviceRecent}</div>
                  </div>
                </div>
              </div>

              {/* ACTIONS */}
              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                <button onClick={() => setSelectedModalClient(null)} style={{ flex: 1, background: "#FFB800", color: "#111827", padding: "14px", borderRadius: 12, border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <X size={16} /> Fermer
                </button>
                <button style={{ flex: 1, background: "white", color: "#1F0270", padding: "14px", borderRadius: 12, border: "1px solid #E5E7EB", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Download size={16} /> Télécharger la fiche
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
