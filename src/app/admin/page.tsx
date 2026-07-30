"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Clock, CheckCircle2, XCircle, CreditCard, RefreshCcw,
  Search, SlidersHorizontal, TrendingUp, TrendingDown, AlertTriangle,
  BarChart3, Eye
} from "lucide-react";

// --- Mini composants réutilisables ---
function KpiCard({ icon: Icon, label, value, sub, subColor, badge, badgeColor, iconBg }: any) {
  return (
    <div style={{ background: "white", borderRadius: 16, padding: "20px 22px", flex: 1, minWidth: 140, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ background: iconBg || "#F0EEFF", borderRadius: 10, padding: 10, display: "flex" }}>
          <Icon size={20} style={{ color: "#1F0270" }} />
        </div>
        <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: "#1F0270", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: subColor || "#6B7280", marginTop: 6 }}>{sub}</div>}
      {badge && <div style={{ marginTop: 8, display: "inline-block", background: badgeColor || "#FFF3CD", color: "#92400E", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{badge}</div>}
    </div>
  );
}

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    "Validée": { bg: "#DCFCE7", color: "#166534" },
    "En attente de validation": { bg: "#FEF3C7", color: "#92400E" },
    "Rejetée": { bg: "#FEE2E2", color: "#991B1B" },
    "Confirmé": { bg: "#DCFCE7", color: "#166534" },
    "En attente": { bg: "#FEF3C7", color: "#92400E" },
    "Échoué": { bg: "#FEE2E2", color: "#991B1B" },
  };
  const s = map[statut] || { bg: "#F3F4F6", color: "#374151" };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
      {statut}
    </span>
  );
}

const activiteRecente = [
  { id: "NMA-2026-000128", type: "Création de demande", desc: "Nouvelle demande SIM + Internet pour Camara Yamoussa", user: "Ibrahima Sylla", date: "20/05/2026 10:24", typeIcon: "+" },
  { id: "NMA-2026-000125", type: "Validation", desc: "Demande SIM + Internet validée pour Alhassane Camara", user: "Mariama Diallo", date: "20/05/2026 09:58", typeIcon: "✓" },
  { id: "PAY-2026-000113", type: "Paiement confirmé", desc: "Paiement de 20 000 GNF confirmé pour Camara Yamoussa", user: "Fatoumata Bangoura", date: "20/05/2026 09:45", typeIcon: "💳" },
  { id: "NMA-2026-000124", type: "Demande rejetée", desc: "Demande SIM Standard rejetée pour Aissatou Bah", user: "Seynabou Diallo", date: "20/05/2026 09:30", typeIcon: "✗" },
  { id: "NMA-2026-000123", type: "Réactivation", desc: "Réactivation de SIM pour Mamadou Keita", user: "Ibrahima Sylla", date: "20/05/2026 09:15", typeIcon: "↺" },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  return (
    <div>
      {/* En-tête */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1F0270", margin: 0 }}>Tableau de bord</h1>
          <p style={{ color: "#6B7280", marginTop: 4, fontSize: 14 }}>Vue globale du système</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un ticket, un client..."
              style={{ paddingLeft: 36, paddingRight: 16, height: 40, borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 14, color: "#374151", outline: "none", width: 300, background: "white" }}
            />
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 40, borderRadius: 10, border: "1px solid #E5E7EB", background: "white", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#374151" }}>
            <SlidersHorizontal size={16} /> Filtrer
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
        <KpiCard icon={FileText} label="Demandes totales" value="135" sub="↑ 12 ce mois" subColor="#059669" iconBg="#EEF2FF" />
        <KpiCard icon={Clock} label="En attente validation" value="52" sub="38,5% du total" badge="Priorité élevée" badgeColor="#FEF3C7" iconBg="#FEF3C7" />
        <KpiCard icon={CheckCircle2} label="Validées" value="68" sub="↑ 8 ce mois" subColor="#059669" iconBg="#DCFCE7" />
        <KpiCard icon={XCircle} label="Rejetées" value="15" sub="↓ 3 ce mois" subColor="#DC2626" iconBg="#FEE2E2" />
        <KpiCard icon={CreditCard} label="Paiements confirmés" value="113" sub="↑ 12 ce mois" subColor="#059669" iconBg="#EEF2FF" />
        <KpiCard icon={RefreshCcw} label="Réactivations" value="18" sub="↑ 5 ce mois" subColor="#059669" iconBg="#F0FDF4" />
      </div>

      {/* Graphiques + Alertes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 320px", gap: 16, marginBottom: 24 }}>
        {/* Demandes par service */}
        <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700, color: "#1F0270", margin: 0 }}>Demandes par service</h3>
            <button onClick={() => router.push("/admin/demandes-sim")} style={{ fontSize: 13, color: "#6B7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Voir le détail</button>
          </div>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            {/* Donut SVG simplifié */}
            <svg width={130} height={130} viewBox="0 0 130 130">
              <circle cx="65" cy="65" r="50" fill="none" stroke="#E5E7EB" strokeWidth="24" />
              <circle cx="65" cy="65" r="50" fill="none" stroke="#4F46E5" strokeWidth="24" strokeDasharray="148 165" strokeDashoffset="0" transform="rotate(-90 65 65)" />
              <circle cx="65" cy="65" r="50" fill="none" stroke="#FFB800" strokeWidth="24" strokeDasharray="74 239" strokeDashoffset="-148" transform="rotate(-90 65 65)" />
              <circle cx="65" cy="65" r="50" fill="none" stroke="#8B5CF6" strokeWidth="24" strokeDasharray="39 274" strokeDashoffset="-222" transform="rotate(-90 65 65)" />
              <circle cx="65" cy="65" r="50" fill="none" stroke="#10B981" strokeWidth="24" strokeDasharray="52 261" strokeDashoffset="-261" transform="rotate(-90 65 65)" />
              <text x="65" y="62" textAnchor="middle" fontSize="18" fontWeight="800" fill="#1F0270">135</text>
              <text x="65" y="78" textAnchor="middle" fontSize="10" fill="#6B7280">Total</text>
            </svg>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { color: "#4F46E5", label: "SIM + Internet", v: "64 (47,4%)" },
                { color: "#FFB800", label: "SIM Standard", v: "34 (25,2%)" },
                { color: "#8B5CF6", label: "Réactivation", v: "18 (13,3%)" },
                { color: "#10B981", label: "SIM Étudiant", v: "19 (14,1%)" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#374151" }}>{item.label}</span>
                  <span style={{ fontSize: 12, color: "#6B7280", marginLeft: "auto" }}>{item.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tendance hebdo - mini graphe en barres */}
        <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
          <h3 style={{ fontWeight: 700, color: "#1F0270", marginBottom: 4, margin: "0 0 4px" }}>Tendance hebdomadaire</h3>
          <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 16 }}>7 derniers jours</p>
          <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 120, marginBottom: 8 }}>
            {[
              { d: "Lun", dem: 18, val: 8 },
              { d: "Mar", dem: 25, val: 15 },
              { d: "Mer", dem: 22, val: 18 },
              { d: "Jeu", dem: 35, val: 20 },
              { d: "Ven", dem: 30, val: 22 },
              { d: "Sam", dem: 28, val: 16 },
              { d: "Dim", dem: 15, val: 10 },
            ].map(d => (
              <div key={d.d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 100 }}>
                  <div style={{ width: 10, background: "#4F46E5", borderRadius: 4, height: `${(d.dem / 40) * 100}%`, opacity: 0.8 }} />
                  <div style={{ width: 10, background: "#10B981", borderRadius: 4, height: `${(d.val / 40) * 100}%`, opacity: 0.8 }} />
                </div>
                <span style={{ fontSize: 10, color: "#9CA3AF" }}>{d.d}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151" }}>
              <div style={{ width: 10, height: 10, background: "#4F46E5", borderRadius: 2 }} /> Demandes
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151" }}>
              <div style={{ width: 10, height: 10, background: "#10B981", borderRadius: 2 }} /> Validées
            </div>
          </div>
        </div>

        {/* Alertes système */}
        <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
          <h3 style={{ fontWeight: 700, color: "#1F0270", marginBottom: 16, margin: "0 0 16px" }}>Alertes système</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { icon: AlertTriangle, color: "#D97706", bg: "#FEF3C7", titre: "Stock faible", desc: "Le stock de SIM est faible (42 unités restantes).", action: "Voir stock" },
              { icon: Clock, color: "#D97706", bg: "#FEF3C7", titre: "Demandes en attente", desc: "52 demandes sont en attente de validation.", action: "Voir demandes" },
              { icon: BarChart3, color: "#DC2626", bg: "#FEE2E2", titre: "Maintenance requise", desc: "Maintenance système prévue le 25/05/2026.", action: "Voir détails" },
            ].map(alert => (
              <div key={alert.titre} style={{ display: "flex", gap: 12, padding: "10px 12px", borderRadius: 10, border: "1px solid #F3F4F6", background: "#FAFAFA" }}>
                <div style={{ background: alert.bg, borderRadius: 8, padding: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <alert.icon size={16} style={{ color: alert.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#1F0270" }}>{alert.titre}</div>
                  <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{alert.desc}</div>
                </div>
                <button style={{ fontSize: 11, color: "#4F46E5", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>{alert.action}</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activité récente */}
      <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, color: "#1F0270", margin: 0 }}>Activité récente</h3>
          <button style={{ fontSize: 13, color: "#6B7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Voir tout</button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["ID", "Type d'événement", "Description", "Utilisateur", "Date & heure"].map(h => (
                <th key={h} style={{ textAlign: "left", fontSize: 12, color: "#6B7280", fontWeight: 600, paddingBottom: 12, borderBottom: "1px solid #F3F4F6" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activiteRecente.map((row, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #F9FAFB" }}>
                <td style={{ padding: "12px 0", fontSize: 13, color: "#4F46E5", fontWeight: 600 }}>{row.id}</td>
                <td style={{ padding: "12px 8px", fontSize: 13, color: "#374151" }}>{row.type}</td>
                <td style={{ padding: "12px 8px", fontSize: 13, color: "#6B7280", maxWidth: 300 }}>{row.desc}</td>
                <td style={{ padding: "12px 8px", fontSize: 13, color: "#374151" }}>{row.user}</td>
                <td style={{ padding: "12px 0", fontSize: 12, color: "#9CA3AF" }}>{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
          <span style={{ fontSize: 13, color: "#6B7280" }}>Affichage 1 à 5 sur 5 activités</span>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2].map(p => (
              <button key={p} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E5E7EB", background: p === 1 ? "#1F0270" : "white", color: p === 1 ? "white" : "#374151", fontSize: 13, cursor: "pointer" }}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
