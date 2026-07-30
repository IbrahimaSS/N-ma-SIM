"use client";
import { useState } from "react";
import { Search, SlidersHorizontal, Eye } from "lucide-react";
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

export default function Paiements() {
  const [search, setSearch] = useState("");

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
                    <button style={{ background: "#EEF2FF", border: "none", borderRadius: 8, padding: "7px 10px", cursor: "pointer" }}>
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
    </div>
  );
}
