"use client";
import { useState } from "react";
import { Search, SlidersHorizontal, Eye, X, User, Phone, CheckCircle2, Clock, AlertCircle, Download } from "lucide-react";
import { MOCK_PAIEMENTS } from "@/data/admin-mock-data";

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    "Confirmé": { bg: "#DCFCE7", color: "#166534" },
    "En attente": { bg: "#FEF3C7", color: "#92400E" },
    "Échoué": { bg: "#FEE2E2", color: "#991B1B" },
    "Remboursé": { bg: "#EEF2FF", color: "#4338CA" },
  };
  const s = map[statut] || { bg: "#F3F4F6", color: "#374151" };
  return <span style={{ ...s, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>{statut}</span>;
}

function ModeBadge({ mode }: { mode: string }) {
  const colors: Record<string, { bg: string; color: string; label: string }> = {
    "Orange Money": { bg: "#FF6600", color: "white", label: "OM" },
    "VISA": { bg: "#1434CB", color: "white", label: "VISA" },
    "Espèces": { bg: "#059669", color: "white", label: "💵" },
    "Retrait numéro": { bg: "#7C3AED", color: "white", label: "📱" },
  };
  const c = colors[mode] || { bg: "#6B7280", color: "white", label: "?" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ background: c.bg, borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: c.color, flexShrink: 0 }}>{c.label}</div>
      <span style={{ fontSize: 13, color: "#374151" }}>{mode}</span>
    </div>
  );
}

const repartition = [
  { label: "Orange Money", pct: 45.2, n: 564, color: "#FF6600" },
  { label: "Visa", pct: 24.8, n: 309, color: "#1434CB" },
  { label: "Retrait numéro", pct: 16.1, n: 201, color: "#7C3AED" },
  { label: "Espèces", pct: 13.9, n: 174, color: "#059669" },
];

// Composant générique pour les Modals
function Modal({ isOpen, onClose, title, customUI, children }: any) {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: customUI ? "transparent" : "white", borderRadius: customUI ? 24 : 16, width: "100%", maxWidth: 460, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: customUI ? "none" : "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)" }} onClick={e => e.stopPropagation()}>
        {!customUI && (
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F9FAFB" }}>
            <h3 style={{ fontWeight: 700, color: "#1F0270", margin: 0, fontSize: 18 }}>{title}</h3>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", display: "flex", padding: 0 }}><X size={20} /></button>
          </div>
        )}
        <div style={customUI ? { width: "100%", overflowY: "auto", maxHeight: "90vh" } : { padding: 24, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Paiements() {
  const [search, setSearch] = useState("");
  const [selectedPaiement, setSelectedPaiement] = useState<any>(null);

  const filtered = MOCK_PAIEMENTS.filter(p =>
    p.client.nom.toLowerCase().includes(search.toLowerCase()) ||
    p.ref.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1F0270", margin: 0 }}>Paiements</h1>
          <p style={{ color: "#6B7280", marginTop: 4, fontSize: 14 }}>Suivi des transactions</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une référence, un client..." style={{ paddingLeft: 36, paddingRight: 16, height: 40, borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 14, outline: "none", width: 300, background: "white" }} />
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 40, borderRadius: 10, border: "1px solid #E5E7EB", background: "white", cursor: "pointer", fontSize: 14, color: "#374151" }}>
            <SlidersHorizontal size={16} /> Filtrer
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Transactions totales", value: "1 248", sub: "100% du total" },
          { label: "Paiements confirmés", value: "964", sub: "↑ 8,4% ce mois", subColor: "#059669" },
          { label: "En attente", value: "156", sub: "↑ 3,1% ce mois", subColor: "#D97706" },
          { label: "Échoués", value: "78", sub: "↓ 1,2% ce mois", subColor: "#DC2626" },
          { label: "Remboursés", value: "50", sub: "↑ 0,6% ce mois", subColor: "#4338CA" },
        ].map(k => (
          <div key={k.label} style={{ background: "white", borderRadius: 16, padding: "18px 22px", flex: 1, minWidth: 140, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 8, fontWeight: 500 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#1F0270" }}>{k.value}</div>
            <div style={{ fontSize: 12, color: (k as any).subColor || "#6B7280", marginTop: 6 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
        {/* Table */}
        <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                {["Référence", "Ticket", "Client", "Mode", "Montant", "Service", "Statut", "Date", "Action"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "14px 12px", fontSize: 12, color: "#6B7280", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.ref} style={{ borderBottom: "1px solid #F9FAFB" }}>
                  <td style={{ padding: "13px 12px", fontSize: 13, color: "#4F46E5", fontWeight: 600 }}>{p.ref}</td>
                  <td style={{ padding: "13px 12px", fontSize: 12, color: "#6B7280" }}>{p.ticket}</td>
                  <td style={{ padding: "13px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#4F46E5", flexShrink: 0 }}>
                        {p.client.nom.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{p.client.nom}</div>
                        <div style={{ fontSize: 11, color: "#9CA3AF" }}>{p.client.tel}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "13px 12px" }}><ModeBadge mode={p.mode} /></td>
                  <td style={{ padding: "13px 12px", fontSize: 13, fontWeight: 600, color: "#111827" }}>{p.montant.toLocaleString("fr-FR")} GNF</td>
                  <td style={{ padding: "13px 12px", fontSize: 13, color: "#374151" }}>{p.service}</td>
                  <td style={{ padding: "13px 12px" }}><StatutBadge statut={p.statut} /></td>
                  <td style={{ padding: "13px 12px", fontSize: 12, color: "#9CA3AF", whiteSpace: "nowrap" }}>{p.date}</td>
                  <td style={{ padding: "13px 12px" }}>
                    <button onClick={() => setSelectedPaiement(p)} style={{ background: "#EEF2FF", border: "none", borderRadius: 8, padding: "7px 10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#E0E7FF"} onMouseOut={e => e.currentTarget.style.background = "#EEF2FF"}>
                      <Eye size={15} style={{ color: "#4F46E5" }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #F3F4F6" }}>
            <span style={{ fontSize: 13, color: "#6B7280" }}>Affichage 1 à {filtered.length} sur 1 248 transactions</span>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3, "...", 125].map((p, i) => (
                <button key={i} style={{ minWidth: 32, height: 32, borderRadius: 8, border: "1px solid #E5E7EB", background: p === 1 ? "#1F0270" : "white", color: p === 1 ? "white" : "#374151", fontSize: 13, cursor: "pointer", padding: "0 8px" }}>{p}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Répartition */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 16px" }}>Répartition des modes</h3>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <svg width={120} height={120} viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="45" fill="none" stroke="#FF6600" strokeWidth="20" strokeDasharray="127 200" strokeDashoffset="0" transform="rotate(-90 60 60)" />
                <circle cx="60" cy="60" r="45" fill="none" stroke="#1434CB" strokeWidth="20" strokeDasharray="70 257" strokeDashoffset="-127" transform="rotate(-90 60 60)" />
                <circle cx="60" cy="60" r="45" fill="none" stroke="#7C3AED" strokeWidth="20" strokeDasharray="45 282" strokeDashoffset="-197" transform="rotate(-90 60 60)" />
                <circle cx="60" cy="60" r="45" fill="none" stroke="#059669" strokeWidth="20" strokeDasharray="39 288" strokeDashoffset="-242" transform="rotate(-90 60 60)" />
                <text x="60" y="57" textAnchor="middle" fontSize="14" fontWeight="800" fill="#1F0270">1 248</text>
                <text x="60" y="70" textAnchor="middle" fontSize="9" fill="#6B7280">Total</text>
              </svg>
            </div>
            {repartition.map(r => (
              <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#374151", flex: 1 }}>{r.label}</span>
                <span style={{ fontSize: 12, color: "#6B7280" }}>{r.pct}%</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{r.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Détails Paiement selon Maquette */}
      <Modal isOpen={!!selectedPaiement} onClose={() => setSelectedPaiement(null)} customUI>
        {selectedPaiement && (
          <div style={{ background: "#F8F9FC", width: "100%", overflow: "hidden", position: "relative" }}>
            {/* Header Section */}
            <div style={{ background: "#1F0270", padding: "24px 24px 48px", position: "relative", overflow: "hidden" }}>
              {/* Decorative circles */}
              <div style={{ position: "absolute", top: -30, right: -30, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,184,0,0.10)" }} />
              <div style={{ position: "absolute", top: 20, right: 20, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,184,0,0.07)" }} />
              <div style={{ position: "absolute", bottom: -10, left: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 10 }}>
                <div>
                  <h2 style={{ margin: 0, color: "#FFB800", fontSize: 22, fontWeight: 800 }}>Détail Paiement</h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <span style={{ color: "#9CA3AF", fontSize: 13, fontFamily: "monospace" }}>{selectedPaiement.ref}</span>
                    <button style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 4, padding: "2px 8px", color: "white", fontSize: 11, cursor: "pointer" }}>Copier</button>
                  </div>
                </div>
                <button onClick={() => setSelectedPaiement(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "white", cursor: "pointer" }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body Content overlapping the header */}
            <div style={{ padding: "0 24px 24px", marginTop: -32, position: "relative", zIndex: 20 }}>
              
              {/* Montant Payé Card */}
              <div style={{ background: "white", borderRadius: 16, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Montant Payé</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#1F0270" }}>{selectedPaiement.montant.toLocaleString("fr-FR")} <span style={{ fontSize: 14, color: "#6B7280" }}>GNF</span></div>
                </div>
                <StatutBadge statut={selectedPaiement.statut} />
              </div>

              {/* SUIVI DU PAIEMENT */}
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16, display: "flex", alignItems: "center" }}>
                  Suivi du Paiement
                  <div style={{ flex: 1, height: 1, background: "#E5E7EB", marginLeft: 12 }}></div>
                </div>
                
                {/* Horizontal Stepper */}
                <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
                  <div style={{ position: "absolute", top: 12, left: 24, right: 24, height: 2, background: "#10B981", zIndex: 0 }}></div>
                  {/* Step 1 */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10, background: "#F8F9FC", padding: "0 4px" }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><CheckCircle2 size={14} /></div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginTop: 8 }}>Initié</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>14:30</div>
                  </div>
                  {/* Step 2 */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10, background: "#F8F9FC", padding: "0 4px" }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><CheckCircle2 size={14} /></div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginTop: 8 }}>En traitement</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>14:31</div>
                  </div>
                  {/* Step 3 */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10, background: "#F8F9FC", padding: "0 4px" }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><CheckCircle2 size={14} /></div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginTop: 8 }}>Confirmé</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>14:32</div>
                  </div>
                </div>
              </div>

              {/* CLIENT */}
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16, display: "flex", alignItems: "center" }}>
                  Client
                  <div style={{ flex: 1, height: 1, background: "#E5E7EB", marginLeft: 12 }}></div>
                </div>
                <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #EAECF5", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#FF6600", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "white" }}>
                    {selectedPaiement.client.nom.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#1F0270" }}>{selectedPaiement.client.nom}</div>
                    <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>+224 {selectedPaiement.client.tel}</div>
                  </div>
                </div>
              </div>

              {/* TRANSACTION */}
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16, display: "flex", alignItems: "center" }}>
                  Transaction
                  <div style={{ flex: 1, height: 1, background: "#E5E7EB", marginLeft: 12 }}></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #EAECF5" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>Ticket</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1F0270" }}>{selectedPaiement.ticket || "NMA-2026-000128"}</div>
                  </div>
                  <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #EAECF5" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>Service</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1F0270" }}>{selectedPaiement.service}</div>
                  </div>
                  <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #EAECF5", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 6 }}>Mode de paiement</div>
                    <div style={{ margin: "-4px 0" }}><ModeBadge mode={selectedPaiement.mode} /></div>
                  </div>
                  <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #EAECF5" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>Date & Heure</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1F0270" }}>{selectedPaiement.date} - 14:32</div>
                  </div>
                </div>
                <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #EAECF5" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>ID Transaction Opérateur</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1F0270", fontFamily: "monospace" }}>OM-TXN-8842-XK71-2026</div>
                </div>
              </div>

              {/* DETAIL DU MONTANT */}
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16, display: "flex", alignItems: "center" }}>
                  Détail du Montant
                  <div style={{ flex: 1, height: 1, background: "#E5E7EB", marginLeft: 12 }}></div>
                </div>
                <div style={{ background: "white", borderRadius: 12, padding: "16px 20px", border: "1px solid #EAECF5" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: "#374151" }}>SIM + Internet</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1F0270" }}>{(selectedPaiement.montant - 500).toLocaleString("fr-FR")} GNF</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                    <span style={{ fontSize: 13, color: "#374151" }}>Frais de transaction</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1F0270" }}>500 GNF</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed #E5E7EB", paddingTop: 16 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#1F0270" }}>Total</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#1F0270" }}>{selectedPaiement.montant.toLocaleString("fr-FR")} GNF</span>
                  </div>
                </div>
              </div>

              {/* ACTIONS */}
              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                <button style={{ flex: 1, background: "#FFB800", color: "#111827", padding: "14px", borderRadius: 12, border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Download size={16} /> Télécharger le reçu
                </button>
                <button style={{ flex: 1, background: "white", color: "#DC2626", padding: "14px", borderRadius: 12, border: "1px solid #FCA5A5", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  Rembourser
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
