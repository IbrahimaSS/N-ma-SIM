"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText, Clock, CheckCircle2, XCircle, CreditCard, RefreshCcw,
  Search, SlidersHorizontal, AlertTriangle, BarChart3, Eye,
  User, Database, Shield, LogOut, Mail, Calendar, Key, Package,
  Layers, Check
} from "lucide-react";
import "./admin-responsive.css";

// --- Mini composants réutilisables ---
function KpiCard({ icon: Icon, label, value, sub, subColor, badge, badgeColor, iconBg }: any) {
  return (
    <div className="dash-kpi-card" style={{ background: "white", borderRadius: 16, padding: "20px 22px", flex: 1, minWidth: 140, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
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
    "En stock": { bg: "#DCFCE7", color: "#166534" },
    "Stock critique": { bg: "#FEF3C7", color: "#92400E" },
    "Rupture": { bg: "#FEE2E2", color: "#991B1B" },
  };
  const s = map[statut] || { bg: "#F3F4F6", color: "#374151" };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
      {statut}
    </span>
  );
}

const activiteRecente = [
  { id: "NMA-2026-000128", type: "Création de demande", desc: "Nouvelle demande SIM + Internet pour Camara Yamoussa", user: "Ibrahima Sylla", date: "20/05/2026 10:24" },
  { id: "NMA-2026-000125", type: "Validation", desc: "Demande SIM + Internet validée pour Alhassane Camara", user: "Mariama Diallo", date: "20/05/2026 09:58" },
  { id: "PAY-2026-000113", type: "Paiement confirmé", desc: "Paiement de 20 000 GNF confirmé pour Camara Yamoussa", user: "Fatoumata Bangoura", date: "20/05/2026 09:45" },
  { id: "NMA-2026-000124", type: "Demande rejetée", desc: "Demande SIM Standard rejetée pour Aissatou Bah", user: "Seynabou Diallo", date: "20/05/2026 09:30" },
  { id: "NMA-2026-000123", type: "Réactivation", desc: "Réactivation de SIM pour Mamadou Keita", user: "Ibrahima Sylla", date: "20/05/2026 09:15" },
];

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTab = searchParams ? searchParams.get("tab") : null;

  const [activeTab, setActiveTab] = useState("apercu");
  const [search, setSearch] = useState("");
  const [admin, setAdmin] = useState<any>(null);

  // Synchronisation de l'onglet actif avec les query params
  useEffect(() => {
    if (queryTab === "profil") {
      setActiveTab("profil");
    } else if (queryTab === "stock") {
      setActiveTab("stock");
    } else {
      setActiveTab("apercu");
    }
  }, [queryTab]);

  // Récupération de la session admin depuis localStorage
  useEffect(() => {
    const session = localStorage.getItem("admin_session");
    if (session) {
      setAdmin(JSON.parse(session));
    } else {
      router.push("/admin/login");
    }
  }, [activeTab, router]);

  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
    if (tabName === "apercu") {
      router.push("/admin");
    } else {
      router.push(`/admin?tab=${tabName}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_session");
    router.push("/admin/login");
  };

  return (
    <div>
      {/* En-tête avec les Onglets */}
      <div className="dash-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1F0270", margin: 0 }}>
            {activeTab === "apercu" && "Tableau de bord"}
            {activeTab === "profil" && "Mon profil"}
            {activeTab === "stock" && "Gestion des stocks"}
          </h1>
          <p style={{ color: "#6B7280", marginTop: 4, fontSize: 14 }}>
            {activeTab === "apercu" && "Vue globale du système"}
            {activeTab === "profil" && "Informations et sécurité de votre compte"}
            {activeTab === "stock" && "Supervision des cartes SIM physiques et virtuelles"}
          </p>
        </div>

        {/* Système d'onglets */}
        <div style={{
          display: "flex",
          background: "#EBEFF8",
          padding: 4,
          borderRadius: 12,
          gap: 4
        }}>
          {[
            { id: "apercu", label: "Aperçu", icon: FileText },
            { id: "profil", label: "Mon profil", icon: User },
            { id: "stock", label: "Stock SIM", icon: Database }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: isActive ? "#FFBA08" : "transparent",
                  color: isActive ? "#1F0270" : "#6B7280",
                  boxShadow: isActive ? "0 4px 10px rgba(255, 186, 8, 0.2)" : "none"
                }}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- ONGLET 1 : APERÇU (DASHBOARD EXISTANT) --- */}
      {activeTab === "apercu" && (
        <>
          {/* KPIs */}
          <div className="dash-kpi-row" style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
            <KpiCard icon={FileText} label="Demandes totales" value="135" sub="↑ 12 ce mois" subColor="#059669" iconBg="#EEF2FF" />
            <KpiCard icon={Clock} label="En attente validation" value="52" sub="38,5% du total" badge="Priorité élevée" badgeColor="#FEF3C7" iconBg="#FEF3C7" />
            <KpiCard icon={CheckCircle2} label="Validées" value="68" sub="↑ 8 ce mois" subColor="#059669" iconBg="#DCFCE7" />
            <KpiCard icon={XCircle} label="Rejetées" value="15" sub="↓ 3 ce mois" subColor="#DC2626" iconBg="#FEE2E2" />
            <KpiCard icon={CreditCard} label="Paiements confirmés" value="113" sub="↑ 12 ce mois" subColor="#059669" iconBg="#EEF2FF" />
            <KpiCard icon={RefreshCcw} label="Réactivations" value="18" sub="↑ 5 ce mois" subColor="#059669" iconBg="#F0FDF4" />
          </div>

          {/* Graphiques + Alertes */}
          <div className="dash-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 320px", gap: 16, marginBottom: 24 }}>
            {/* Demandes par service */}
            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <h3 style={{ fontWeight: 700, color: "#1F0270", margin: 0 }}>Demandes par service</h3>
                <button onClick={() => router.push("/admin/demandes-sim")} style={{ fontSize: 13, color: "#6B7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Voir le détail</button>
              </div>
              <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
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

            {/* Tendance hebdo */}
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
                    <button
                      onClick={() => alert.titre === "Stock faible" ? handleTabChange("stock") : router.push("/admin/demandes-sim")}
                      style={{ fontSize: 11, color: "#4F46E5", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      {alert.action}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activité récente */}
          <div className="dash-table-wrapper" style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
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
          </div>
        </>
      )}

      {/* --- ONGLET 2 : MON PROFIL --- */}
      {activeTab === "profil" && admin && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: 24, alignItems: "start" }} className="dash-grid">
          {/* Carte d'identité Admin */}
          <div style={{ background: "white", borderRadius: 20, padding: 32, border: "1px solid #EAECF5", boxShadow: "0 1px 6px rgba(31,2,112,0.06)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #1F0270, #3B0CB8)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 800,
              marginBottom: 16,
              border: "4px solid #FFBA08",
              boxShadow: "0 8px 16px rgba(31,2,112,0.15)"
            }}>
              {admin.name.split(" ").map((n: string) => n[0]).join("")}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1F0270", margin: 0 }}>{admin.name}</h2>
            <div style={{ display: "inline-block", background: "#FFEAA7", color: "#B27A00", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700, marginTop: 8 }}>
              {admin.role}
            </div>

            <div style={{ width: "100%", height: "1px", background: "#E5E7EB", margin: "24px 0" }} />

            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ background: "#F5F6FA", borderRadius: 10, padding: 8, color: "#1F0270" }}>
                  <Mail size={18} />
                </div>
                <div>
                  <span style={{ fontSize: 11, color: "#9CA3AF", display: "block" }}>Adresse Email</span>
                  <span style={{ fontSize: 14, color: "#374151", fontWeight: 600 }}>{admin.email}</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ background: "#F5F6FA", borderRadius: 10, padding: 8, color: "#1F0270" }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <span style={{ fontSize: 11, color: "#9CA3AF", display: "block" }}>Dernière connexion</span>
                  <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>{admin.loginAt}</span>
                </div>
              </div>
            </div>

            <div style={{ width: "100%", height: "1px", background: "#E5E7EB", margin: "24px 0" }} />

            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 12,
                background: "#FEE2E2",
                color: "#DC2626",
                fontWeight: 700,
                fontSize: 14,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#FCA5A5"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#FEE2E2"}
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>

          {/* Sécurité et permissions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ background: "white", borderRadius: 20, padding: 28, border: "1px solid #EAECF5", boxShadow: "0 1px 6px rgba(31,2,112,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ background: "#FFF8E6", borderRadius: 10, padding: 10, color: "#FFBA08" }}>
                  <Shield size={20} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1F0270", margin: 0 }}>Rôle & Permissions</h3>
              </div>
              <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 20px" }}>Votre compte administrateur possède des privilèges élevés pour piloter la plateforme de distribution N'ma SIM.</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="dash-grid">
                {[
                  "Validation des demandes SIM",
                  "Gestion des stocks et eSIM",
                  "Supervision des transactions",
                  "Configuration des offres SIM",
                  "Gestion des comptes utilisateurs",
                  "Accès complet aux logs d'activité"
                ].map((permission, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#F5F6FA", borderRadius: 10, fontSize: 13, color: "#374151", fontWeight: 500 }}>
                    <div style={{ background: "#DCFCE7", color: "#166534", width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Check size={14} style={{ margin: "auto" }} />
                    </div>
                    <span>{permission}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "white", borderRadius: 20, padding: 28, border: "1px solid #EAECF5", boxShadow: "0 1px 6px rgba(31,2,112,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ background: "#EEF2FF", borderRadius: 10, padding: 10, color: "#4F46E5" }}>
                  <Key size={20} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1F0270", margin: 0 }}>Sécurité de la session</h3>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <td style={{ padding: "12px 0", color: "#6B7280" }}>Type d&apos;authentification</td>
                    <td style={{ padding: "12px 0", color: "#374151", fontWeight: 600, textAlign: "right" }}>Locale (Simulée)</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <td style={{ padding: "12px 0", color: "#6B7280" }}>Statut du compte</td>
                    <td style={{ padding: "12px 0", color: "#10B981", fontWeight: 600, textAlign: "right" }}>Actif</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <td style={{ padding: "12px 0", color: "#6B7280" }}>Adresse IP courante</td>
                    <td style={{ padding: "12px 0", color: "#374151", fontWeight: 600, textAlign: "right" }}>192.168.1.105 (Local)</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 0", color: "#6B7280" }}>Navigateur web</td>
                    <td style={{ padding: "12px 0", color: "#374151", fontWeight: 600, textAlign: "right" }}>Chrome / Windows</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- ONGLET 3 : GESTION DES STOCKS --- */}
      {activeTab === "stock" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Métriques Stock */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }} className="dash-kpi-row">
            <KpiCard icon={Package} label="Total Cartes SIM" value="2,450" sub="Dans le dépôt central" subColor="#1F0270" iconBg="#EEF2FF" />
            <KpiCard icon={Layers} label="Cartes SIM Standard" value="850" sub="Seulement 42 en stock critique" subColor="#D97706" iconBg="#FEF3C7" />
            <KpiCard icon={Database} label="eSIM Disponibles" value="1,200" sub="Générées automatiquement" subColor="#059669" iconBg="#DCFCE7" />
            <KpiCard icon={AlertTriangle} label="Alerte Stock Critique" value="1" sub="Produits en sous-stock" subColor="#DC2626" iconBg="#FEE2E2" />
          </div>

          {/* Tableau de stock */}
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <h3 style={{ fontWeight: 700, color: "#1F0270", margin: 0 }}>Détail des stocks par type de service</h3>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  borderRadius: 10,
                  background: "#1F0270",
                  color: "white",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                  boxShadow: "0 4px 10px rgba(31, 2, 112, 0.15)"
                }}
              >
                + Ajouter du stock
              </button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Nom du produit", "Catégorie", "Stock actuel", "Seuil critique", "Statut", "Tendance"].map(h => (
                    <th key={h} style={{ textAlign: "left", fontSize: 12, color: "#6B7280", fontWeight: 600, paddingBottom: 12, borderBottom: "1px solid #F3F4F6" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { nom: "SIM + Internet 10 Go", cat: "SIM Physique", stock: 42, seuil: 50, statut: "Stock critique", progression: "25%", color: "#FFBA08" },
                  { nom: "SIM Standard prépayée", cat: "SIM Physique", stock: 808, seuil: 100, statut: "En stock", progression: "85%", color: "#10B981" },
                  { nom: "SIM Étudiant sans engagement", cat: "SIM Physique", stock: 400, seuil: 80, statut: "En stock", progression: "70%", color: "#10B981" },
                  { nom: "eSIM Internet Illimité", cat: "SIM Virtuelle (eSIM)", stock: 1200, seuil: 150, statut: "En stock", progression: "100%", color: "#10B981" },
                  { nom: "eSIM Standard", cat: "SIM Virtuelle (eSIM)", stock: 0, seuil: 50, statut: "Rupture", progression: "0%", color: "#DC2626" },
                ].map((item, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #F9FAFB" }}>
                    <td style={{ padding: "16px 0", fontSize: 13, color: "#1F0270", fontWeight: 600 }}>{item.nom}</td>
                    <td style={{ padding: "16px 8px", fontSize: 13, color: "#6B7280" }}>{item.cat}</td>
                    <td style={{ padding: "16px 8px", fontSize: 13, color: "#374151" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontWeight: 700 }}>{item.stock} u.</span>
                        <div style={{ width: 100, height: 6, background: "#E5E7EB", borderRadius: 10, overflow: "hidden", display: "inline-block" }}>
                          <div style={{ width: item.progression, height: "100%", background: item.color }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "16px 8px", fontSize: 13, color: "#6B7280" }}>{item.seuil} u.</td>
                    <td style={{ padding: "16px 8px", fontSize: 13 }}><StatutBadge statut={item.statut} /></td>
                    <td style={{ padding: "16px 0", fontSize: 12, color: item.stock === 0 ? "#DC2626" : "#10B981", fontWeight: 600 }}>
                      {item.stock === 0 ? "⚠️ À réapprovisionner" : "📈 Stable"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Chargement de l&apos;interface...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
