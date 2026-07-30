"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, Eye } from "lucide-react";
import { MOCK_DEMANDES } from "@/data/admin-mock-data";

function TypeBadge({ type }: { type: string }) {
  const isReact = type === "Réactivation";
  return (
    <span style={{
      background: isReact ? "#EEF2FF" : "#F0FDF4",
      color: isReact ? "#4338CA" : "#166534",
      border: `1px solid ${isReact ? "#C7D2FE" : "#BBF7D0"}`,
      borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600
    }}>{type}</span>
  );
}

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    "Validée": { bg: "#DCFCE7", color: "#166534" },
    "En attente de validation": { bg: "#FEF3C7", color: "#92400E" },
    "Rejetée": { bg: "#FEE2E2", color: "#991B1B" },
  };
  const s = map[statut] || { bg: "#F3F4F6", color: "#374151" };
  return <span style={{ ...s, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{statut}</span>;
}

function PaiementBadge({ statut }: { statut: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    "Confirmé": { bg: "#DCFCE7", color: "#166534" },
    "En attente de paiement": { bg: "#FEF3C7", color: "#92400E" },
    "Remboursé": { bg: "#EEF2FF", color: "#4338CA" },
  };
  const s = map[statut] || { bg: "#F3F4F6", color: "#374151" };
  return <span style={{ ...s, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{statut}</span>;
}

function IaBadge({ ia, detail }: { ia: string; detail: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    "OK": { bg: "#DCFCE7", color: "#166534" },
    "En attente": { bg: "#FEF3C7", color: "#92400E" },
    "Rejetée": { bg: "#FEE2E2", color: "#991B1B" },
  };
  const s = map[ia] || { bg: "#F3F4F6", color: "#374151" };
  return (
    <div>
      <span style={{ ...s, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>{ia}</span>
      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{detail}</div>
    </div>
  );
}

export default function DemandesSIM() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = MOCK_DEMANDES.filter(d =>
    d.client.nom.toLowerCase().includes(search.toLowerCase()) ||
    d.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1F0270", margin: 0 }}>Demandes SIM</h1>
          <p style={{ color: "#6B7280", marginTop: 4, fontSize: 14 }}>Dashboard administrateur</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un ticket, un client..." style={{ paddingLeft: 36, paddingRight: 16, height: 40, borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 14, outline: "none", width: 300, background: "white" }} />
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 40, borderRadius: 10, border: "1px solid #E5E7EB", background: "white", cursor: "pointer", fontSize: 14, color: "#374151" }}>
            <SlidersHorizontal size={16} /> Filtrer
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "En attente de validation", value: "52", sub: "40,6% du total", badge: "Priorité élevée", color: "#D97706" },
          { label: "Validées", value: "68", sub: "↑ 8 ce mois", color: "#059669" },
          { label: "Rejetées", value: "15", sub: "↓ 3 ce mois", color: "#DC2626" },
          { label: "Paiements confirmés", value: "113", sub: "↑ 12 ce mois", color: "#059669" },
        ].map(k => (
          <div key={k.label} style={{ background: "white", borderRadius: 16, padding: "18px 22px", flex: 1, minWidth: 160, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 8, fontWeight: 500 }}>{k.label}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: "#1F0270" }}>{k.value}</div>
            <div style={{ fontSize: 12, color: k.color, marginTop: 6 }}>{k.sub}</div>
            {k.badge && <div style={{ marginTop: 8, display: "inline-block", background: "#FEF3C7", color: "#92400E", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{k.badge}</div>}
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
              {["Ticket", "Type de service", "Client", "Offre", "Paiement", "Résultat IA", "Statut demande", "Statut paiement", "Action"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "14px 12px", fontSize: 12, color: "#6B7280", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, i) => (
              <tr key={d.id} style={{ borderBottom: "1px solid #F9FAFB", transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "14px 12px", fontSize: 13, color: "#4F46E5", fontWeight: 600, whiteSpace: "nowrap" }}>{d.id}</td>
                <td style={{ padding: "14px 12px" }}><TypeBadge type={d.type} /></td>
                <td style={{ padding: "14px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#4F46E5", flexShrink: 0 }}>
                      {d.client.nom.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{d.client.nom}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>{d.client.tel}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 12px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{d.offre}</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>{d.montant.toLocaleString("fr-FR")} GNF</div>
                </td>
                <td style={{ padding: "14px 12px" }}>
                  <span style={{ background: d.paiement === "Payé" ? "#DCFCE7" : "#FEF3C7", color: d.paiement === "Payé" ? "#166534" : "#92400E", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>{d.paiement}</span>
                </td>
                <td style={{ padding: "14px 12px" }}><IaBadge ia={d.ia} detail={d.iaDetail} /></td>
                <td style={{ padding: "14px 12px" }}><StatutBadge statut={d.statut} /></td>
                <td style={{ padding: "14px 12px" }}><PaiementBadge statut={d.paiementStatut} /></td>
                <td style={{ padding: "14px 12px" }}>
                  <button
                    onClick={() => router.push(`/admin/demandes-sim/${d.id}`)}
                    style={{ background: "#EEF2FF", border: "none", borderRadius: 8, padding: "8px 10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Eye size={16} style={{ color: "#4F46E5" }} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #F3F4F6" }}>
          <span style={{ fontSize: 13, color: "#6B7280" }}>Affichage 1 à {filtered.length} sur 135 demandes</span>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3, "...", 14].map((p, i) => (
              <button key={i} style={{ minWidth: 32, height: 32, borderRadius: 8, border: "1px solid #E5E7EB", background: p === 1 ? "#1F0270" : "white", color: p === 1 ? "white" : "#374151", fontSize: 13, cursor: "pointer", padding: "0 8px" }}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
