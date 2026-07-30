"use client";
import { useState } from "react";
import { Search, SlidersHorizontal, Calendar, FileText, User, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { MOCK_LOGS } from "@/data/admin-mock-data";

function NiveauBadge({ niveau }: { niveau: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    "Succès": { bg: "#DCFCE7", color: "#166534" },
    "Info": { bg: "#EEF2FF", color: "#4338CA" },
    "Alerte": { bg: "#FEF3C7", color: "#92400E" },
    "Critique": { bg: "#FEE2E2", color: "#991B1B" },
  };
  const s = map[niveau] || { bg: "#F3F4F6", color: "#374151" };
  return <span style={{ ...s, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{niveau}</span>;
}

export default function LogsHistorique() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_LOGS.filter(l =>
    l.utilisateur.nom.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.detail.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1F0270", margin: 0 }}>Logs & Historique</h1>
          <p style={{ color: "#6B7280", marginTop: 4, fontSize: 14 }}>Traçabilité et audit système</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher (utilisateur, action, référence...)" style={{ paddingLeft: 36, paddingRight: 16, height: 40, borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 14, outline: "none", width: 300, background: "white" }} />
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 40, borderRadius: 10, border: "1px solid #E5E7EB", background: "white", cursor: "pointer", fontSize: 14, color: "#374151" }}>
            <Calendar size={16} /> 01/06/2026 - 08/06/2026
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 40, borderRadius: 10, border: "1px solid #E5E7EB", background: "white", cursor: "pointer", fontSize: 14, color: "#374151" }}>
            <SlidersHorizontal size={16} /> Filtrer
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { icon: FileText, label: "Actions totales", value: "1 248", sub: "100% du total", subSub: "↑ 18% vs période précédente", color: "#059669", bg: "#EEF2FF", iconColor: "#4F46E5" },
          { icon: User, label: "Connexions", value: "328", sub: "26,3% du total", subSub: "↑ 12% vs période précédente", color: "#059669", bg: "#E0F2FE", iconColor: "#0284C7" },
          { icon: CheckCircle2, label: "Validations", value: "562", sub: "45,0% du total", subSub: "↑ 22% vs période précédente", color: "#059669", bg: "#DCFCE7", iconColor: "#166534" },
          { icon: XCircle, label: "Rejets", value: "176", sub: "14,1% du total", subSub: "↓ 5% vs période précédente", color: "#DC2626", bg: "#FEE2E2", iconColor: "#991B1B" },
          { icon: AlertTriangle, label: "Alertes sécurité", value: "32", sub: "2,6% du total", subSub: "↑ 33% vs période précédente", color: "#059669", bg: "#FEF3C7", iconColor: "#D97706" },
        ].map((k, i) => (
          <div key={i} style={{ background: "white", borderRadius: 16, padding: "18px 22px", flex: 1, minWidth: 140, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ background: k.bg, borderRadius: 10, padding: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <k.icon size={18} style={{ color: k.iconColor }} />
              </div>
              <div style={{ fontSize: 12, color: "#1F0270", fontWeight: 700 }}>{k.label}</div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#1F0270" }}>{k.value}</div>
            <div style={{ fontSize: 11, color: "#6B7280" }}>{k.sub}</div>
            <div style={{ fontSize: 10, color: k.color, fontWeight: 500, marginTop: 4 }}>{k.subSub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
        {/* Table logs */}
        <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5", overflow: "hidden", height: "fit-content" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                {["Date & heure", "Utilisateur", "Module", "Action", "Référence", "Détail", "Niveau"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "14px 20px", fontSize: 12, color: "#6B7280", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #F9FAFB" }}>
                  <td style={{ padding: "14px 20px", fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>{l.date}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#4F46E5", flexShrink: 0 }}>
                        {l.utilisateur.nom.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{l.utilisateur.nom}</div>
                        <div style={{ fontSize: 11, color: "#9CA3AF" }}>{l.utilisateur.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 12, color: "#374151" }}>{l.module}</td>
                  <td style={{ padding: "14px 20px", fontSize: 12, color: "#374151" }}>{l.action}</td>
                  <td style={{ padding: "14px 20px", fontSize: 12, color: "#4F46E5", fontWeight: 500 }}>{l.reference}</td>
                  <td style={{ padding: "14px 20px", fontSize: 12, color: "#6B7280", maxWidth: 200 }}>{l.detail}</td>
                  <td style={{ padding: "14px 20px" }}><NiveauBadge niveau={l.niveau} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #F3F4F6" }}>
            <span style={{ fontSize: 13, color: "#6B7280" }}>Affichage 1 à {filtered.length} sur 1 248 logs</span>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3, "...", 125, ">"].map((p, i) => (
                <button key={i} style={{ minWidth: 32, height: 32, borderRadius: 8, border: "1px solid #E5E7EB", background: p === 1 ? "#1F0270" : "white", color: p === 1 ? "white" : "#374151", fontSize: 13, cursor: "pointer", padding: "0 8px" }}>{p}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Alerts */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, color: "#1F0270", margin: 0, fontSize: 15 }}>Dernières alertes</h3>
              <button style={{ fontSize: 12, color: "#4F46E5", background: "none", border: "none", cursor: "pointer" }}>Voir tout</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { type: "Critique", title: "Tentatives de connexion échouées", desc: "5 échecs consécutifs détectés", time: "14:32" },
                { type: "Alerte", title: "Paiement échoué", desc: "PAY-2026-004511 - Solde insuffisant", time: "12:18" },
                { type: "Critique", title: "Document suspect détecté", desc: "Demande NMA-2026-000119", time: "11:07" },
                { type: "Alerte", title: "Accès depuis nouvel appareil", desc: "Connexion inhabituelle détectée", time: "09:45" },
                { type: "Info", title: "Session expirée", desc: "Déconnexion automatique effectuée", time: "08:22" },
              ].map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 12, paddingBottom: 12, borderBottom: i < 4 ? "1px solid #F3F4F6" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: a.type === "Critique" ? "#FEE2E2" : (a.type === "Alerte" ? "#FEF3C7" : "#EEF2FF"), flexShrink: 0 }}>
                    {a.type === "Critique" ? <XCircle size={16} color="#DC2626" /> : (a.type === "Alerte" ? <AlertTriangle size={16} color="#D97706" /> : <span style={{ color: "#4F46E5", fontWeight: 700, fontSize: 12 }}>i</span>)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{a.desc}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "#9CA3AF" }}>{a.time}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, color: "#1F0270", margin: 0, fontSize: 15 }}>Activité de sécurité</h3>
              <button style={{ fontSize: 12, color: "#4F46E5", background: "none", border: "none", cursor: "pointer" }}>Voir tout</button>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16 }}>
              {/* Donut Chart */}
              <div style={{ position: "relative", width: 90, height: 90 }}>
                <svg width={90} height={90} viewBox="0 0 90 90">
                  <circle cx="45" cy="45" r="35" fill="none" stroke="#4F46E5" strokeWidth="14" strokeDasharray="96 220" strokeDashoffset="0" transform="rotate(-90 45 45)" />
                  <circle cx="45" cy="45" r="35" fill="none" stroke="#DC2626" strokeWidth="14" strokeDasharray="55 220" strokeDashoffset="-96" transform="rotate(-90 45 45)" />
                  <circle cx="45" cy="45" r="35" fill="none" stroke="#F59E0B" strokeWidth="14" strokeDasharray="27 220" strokeDashoffset="-151" transform="rotate(-90 45 45)" />
                  <circle cx="45" cy="45" r="35" fill="none" stroke="#8B5CF6" strokeWidth="14" strokeDasharray="24 220" strokeDashoffset="-178" transform="rotate(-90 45 45)" />
                  <circle cx="45" cy="45" r="35" fill="none" stroke="#E5E7EB" strokeWidth="14" strokeDasharray="18 220" strokeDashoffset="-202" transform="rotate(-90 45 45)" />
                </svg>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#1F0270", lineHeight: 1.2 }}>64</div>
                  <div style={{ fontSize: 9, color: "#6B7280" }}>événements</div>
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                {[
                  { label: "Connexions réussies", val: "28", pct: "(43,8%)", color: "#4F46E5" },
                  { label: "Échecs de connexion", val: "16", pct: "(25,0%)", color: "#DC2626" },
                  { label: "Alertes déclenchées", val: "8", pct: "(12,5%)", color: "#F59E0B" },
                  { label: "Accès inhabituels", val: "7", pct: "(10,9%)", color: "#8B5CF6" },
                  { label: "Autres", val: "5", pct: "(7,8%)", color: "#E5E7EB" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
                      <span style={{ color: "#374151" }}>{item.label}</span>
                    </div>
                    <div style={{ color: "#6B7280" }}>
                      <span style={{ color: "#111827", fontWeight: 600 }}>{item.val}</span> {item.pct}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ display: "inline-block", background: "#DCFCE7", color: "#166534", fontSize: 10, fontWeight: 600, padding: "4px 8px", borderRadius: 20 }}>
              ↑ 15% vs période précédente
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
