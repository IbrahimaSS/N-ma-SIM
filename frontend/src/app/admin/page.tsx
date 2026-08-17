"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText, Clock, CheckCircle2, XCircle, CreditCard,
  TrendingUp, AlertTriangle, BarChart3, Users,
  User, Database, Shield, LogOut, Mail, Calendar, Key, Package,
  Layers, Check, RefreshCcw, Loader2
} from "lucide-react";
import "./admin-responsive.css";

const BACKEND = "http://localhost:3001";

// ─── Helpers ───────────────────────────────────────────────────────────────
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const s = localStorage.getItem("admin_session");
  if (!s) return null;
  return JSON.parse(s).token ?? null;
}

async function apiFetch(path: string) {
  const token = getToken();
  if (!token) throw new Error("AUTH_REQUIRED");
  const res = await fetch(`${BACKEND}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 401) throw new Error("AUTH_REQUIRED");
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

// ─── Mini composants ────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, subColor, badge, iconBg, loading }: any) {
  return (
    <div className="dash-kpi-card" style={{ background: "white", borderRadius: 16, padding: "20px 22px", flex: 1, minWidth: 140, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ background: iconBg || "#F0EEFF", borderRadius: 10, padding: 10, display: "flex" }}>
          <Icon size={20} style={{ color: "#1F0270" }} />
        </div>
        <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>{label}</span>
      </div>
      {loading
        ? <div style={{ height: 30, display: "flex", alignItems: "center" }}><Loader2 size={20} style={{ color: "#1F0270", animation: "spin 1s linear infinite" }} /></div>
        : <div style={{ fontSize: 30, fontWeight: 800, color: "#1F0270", lineHeight: 1 }}>{value}</div>
      }
      {sub && <div style={{ fontSize: 12, color: subColor || "#6B7280", marginTop: 6 }}>{sub}</div>}
      {badge && <div style={{ marginTop: 8, display: "inline-block", background: "#FFF3CD", color: "#92400E", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{badge}</div>}
    </div>
  );
}

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    "VALIDEE":                 { bg: "#DCFCE7", color: "#166534" },
    "Validée":                 { bg: "#DCFCE7", color: "#166534" },
    "EN_ATTENTE_VALIDATION":   { bg: "#FEF3C7", color: "#92400E" },
    "EN_COURS_DE_TRAITEMENT":  { bg: "#EEF2FF", color: "#4338CA" },
    "REJETEE":                 { bg: "#FEE2E2", color: "#991B1B" },
    "Rejetée":                 { bg: "#FEE2E2", color: "#991B1B" },
  };
  const label: Record<string, string> = {
    "VALIDEE":                "Validée",
    "EN_ATTENTE_VALIDATION":  "En attente",
    "EN_COURS_DE_TRAITEMENT": "En cours",
    "REJETEE":                "Rejetée",
  };
  const s = map[statut] || { bg: "#F3F4F6", color: "#374151" };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
      {label[statut] || statut}
    </span>
  );
}

// ─── Composant principal ────────────────────────────────────────────────────
function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTab = searchParams ? searchParams.get("tab") : null;

  const [activeTab, setActiveTab] = useState("apercu");
  const [admin, setAdmin] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [recentDemandes, setRecentDemandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (queryTab === "profil") setActiveTab("profil");
    else if (queryTab === "stock") setActiveTab("stock");
    else setActiveTab("apercu");
  }, [queryTab]);

  useEffect(() => {
    const session = localStorage.getItem("admin_session");
    if (!session) { router.push("/admin/login"); return; }
    const sessionData = JSON.parse(session);
    setAdmin(sessionData);
    // Fetch fresh profile data (including photoProfil) from backend
    if (sessionData.id) {
      apiFetch(`/api/utilisateurs/${sessionData.id}`)
        .then(res => { if (res.data) setAdmin((prev: any) => ({ ...prev, ...res.data })); })
        .catch(() => {}); // fallback to session data silently
    }
  }, [router]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, demandesRes] = await Promise.all([
        apiFetch("/api/stats"),
        apiFetch("/api/demandes?take=8&orderBy=createdAt&order=desc"),
      ]);
      setStats(statsRes.data);
      setRecentDemandes(demandesRes.data?.demandes || demandesRes.data || []);
    } catch (e: any) {
      if (e.message === "AUTH_REQUIRED") {
        // Session expirée ou token absent → redirection login
        localStorage.removeItem("admin_session");
        router.push("/admin/login");
        return;
      }
      setError("Impossible de charger les données. Vérifiez que le serveur backend est démarré.");
      console.error("[STATS]", e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (activeTab === "apercu") fetchStats();
  }, [activeTab, fetchStats]);

  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
    router.push(tabName === "apercu" ? "/admin" : `/admin?tab=${tabName}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_session");
    router.push("/admin/login");
  };

  const formatDate = (iso: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div>
      {/* En-tête */}
      <div className="dash-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1F0270", margin: 0 }}>
            {activeTab === "apercu" && "Tableau de bord"}
            {activeTab === "profil" && "Mon profil"}
          </h1>
          <p style={{ color: "#6B7280", marginTop: 4, fontSize: 14 }}>
            {activeTab === "apercu" && "Vue globale du système en temps réel"}
            {activeTab === "profil" && "Informations et sécurité de votre compte"}
          </p>
        </div>

        {/* Onglets */}
        <div style={{ display: "flex", background: "#EBEFF8", padding: 4, borderRadius: 12, gap: 4 }}>
          {[
            { id: "apercu", label: "Aperçu", icon: FileText },
            { id: "profil", label: "Mon profil", icon: User },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => handleTabChange(tab.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 10, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", transition: "all 0.2s", background: isActive ? "#FFBA08" : "transparent", color: isActive ? "#1F0270" : "#6B7280" }}>
                <tab.icon size={16} /><span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ONGLET APERÇU */}
      {activeTab === "apercu" && (
        <>
          {/* Bouton refresh */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button onClick={fetchStats} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 10, border: "1px solid #E5E7EB", background: "white", cursor: loading ? "not-allowed" : "pointer", fontSize: 13, color: "#374151" }}>
              <RefreshCcw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> Actualiser
            </button>
          </div>

          {error && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "14px 18px", color: "#991B1B", fontSize: 13, marginBottom: 20 }}>
              ⚠️ {error}
            </div>
          )}

          {/* KPIs */}
          <div className="dash-kpi-row" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
            <KpiCard icon={FileText}    label="Demandes totales"       value={stats?.demandes?.total ?? "—"}     sub={`${stats?.demandes?.enAttente ?? 0} en attente`}   iconBg="#EEF2FF"  loading={loading} />
            <KpiCard icon={Clock}       label="En attente validation"  value={stats?.demandes?.enAttente ?? "—"} badge={stats?.demandes?.enAttente > 0 ? "À traiter" : undefined} iconBg="#FEF3C7" loading={loading} />
            <KpiCard icon={CheckCircle2} label="Validées"              value={stats?.demandes?.validees ?? "—"}  subColor="#059669"                                          iconBg="#DCFCE7"  loading={loading} />
            <KpiCard icon={XCircle}     label="Rejetées"               value={stats?.demandes?.rejetees ?? "—"}  subColor="#DC2626"                                          iconBg="#FEE2E2"  loading={loading} />
            <KpiCard icon={CreditCard}  label="Paiements confirmés"    value={stats?.paiements?.confirmes ?? "—"} sub={`${(stats?.paiements?.montantTotal ?? 0).toLocaleString("fr-FR")} GNF`} iconBg="#EEF2FF" loading={loading} />
            <KpiCard icon={Users}       label="Clients enregistrés"    value={stats?.clients?.total ?? "—"}       iconBg="#EEF2FF" loading={loading} />
          </div>

          {/* Alertes + Activité récente */}
          <div className="dash-grid" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, marginBottom: 24 }}>
            {/* Demandes récentes */}
            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ fontWeight: 700, color: "#1F0270", margin: 0 }}>Dernières demandes</h3>
                <button onClick={() => router.push("/admin/demandes-sim")} style={{ fontSize: 13, color: "#4F46E5", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Voir tout</button>
              </div>
              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 32 }}><Loader2 size={28} style={{ color: "#1F0270", animation: "spin 1s linear infinite" }} /></div>
              ) : recentDemandes.length === 0 ? (
                <p style={{ color: "#9CA3AF", fontSize: 14, textAlign: "center", padding: 24 }}>Aucune demande pour le moment.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Dossier", "Client", "Offre", "Statut", "Date"].map(h => (
                        <th key={h} style={{ textAlign: "left", fontSize: 12, color: "#6B7280", fontWeight: 600, paddingBottom: 12, borderBottom: "1px solid #F3F4F6" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentDemandes.map((d: any) => (
                      <tr key={d.id} style={{ borderBottom: "1px solid #F9FAFB", cursor: "pointer" }} onClick={() => router.push(`/admin/demandes-sim/${d.id}`)}>
                        <td style={{ padding: "12px 0", fontSize: 13, color: "#4F46E5", fontWeight: 600 }}>{d.numeroDossier}</td>
                        <td style={{ padding: "12px 8px", fontSize: 13, color: "#374151" }}>
                          {d.client ? `${d.client.prenom || ""} ${d.client.nom || ""}`.trim() : "—"}
                        </td>
                        <td style={{ padding: "12px 8px", fontSize: 12, color: "#6B7280" }}>{d.offre?.nom || "—"}</td>
                        <td style={{ padding: "12px 8px" }}><StatutBadge statut={d.statut} /></td>
                        <td style={{ padding: "12px 0", fontSize: 12, color: "#9CA3AF" }}>{formatDate(d.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Alertes */}
            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
              <h3 style={{ fontWeight: 700, color: "#1F0270", marginBottom: 16, margin: "0 0 16px" }}>Alertes système</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {stats?.demandes?.enAttente > 0 && (
                  <div style={{ display: "flex", gap: 12, padding: "10px 12px", borderRadius: 10, border: "1px solid #FEF3C7", background: "#FFFBEB" }}>
                    <div style={{ background: "#FEF3C7", borderRadius: 8, padding: 8, flexShrink: 0, display: "flex" }}>
                      <Clock size={16} style={{ color: "#D97706" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#1F0270" }}>Demandes en attente</div>
                      <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{stats.demandes.enAttente} demandes à valider.</div>
                    </div>
                    <button onClick={() => router.push("/admin/demandes-sim")} style={{ fontSize: 11, color: "#4F46E5", background: "none", border: "none", cursor: "pointer" }}>Voir</button>
                  </div>
                )}
                {!loading && !error && (
                  <div style={{ display: "flex", gap: 12, padding: "10px 12px", borderRadius: 10, border: "1px solid #DCFCE7", background: "#F0FDF4" }}>
                    <div style={{ background: "#DCFCE7", borderRadius: 8, padding: 8, flexShrink: 0, display: "flex" }}>
                      <CheckCircle2 size={16} style={{ color: "#059669" }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#1F0270" }}>Système opérationnel</div>
                      <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>Backend et base de données connectés.</div>
                    </div>
                  </div>
                )}
                {error && (
                  <div style={{ display: "flex", gap: 12, padding: "10px 12px", borderRadius: 10, border: "1px solid #FEE2E2", background: "#FEF2F2" }}>
                    <div style={{ background: "#FEE2E2", borderRadius: 8, padding: 8, flexShrink: 0, display: "flex" }}>
                      <AlertTriangle size={16} style={{ color: "#DC2626" }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#991B1B" }}>Backend inaccessible</div>
                      <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>Démarrez le serveur sur le port 3001.</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ONGLET PROFIL */}
      {activeTab === "profil" && admin && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: 24, alignItems: "start" }} className="dash-grid">
          {/* Carte identité */}
          <div style={{ background: "white", borderRadius: 20, padding: 32, border: "1px solid #EAECF5", boxShadow: "0 1px 6px rgba(31,2,112,0.06)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ width: 100, height: 100, borderRadius: "50%", background: "linear-gradient(135deg, #1F0270, #3B0CB8)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 800, marginBottom: 16, border: "4px solid #FFBA08", overflow: "hidden" }}>
              {admin.photoProfil
                ? <img src={admin.photoProfil} alt={admin.name || admin.nom} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : (admin.name || admin.nom)?.split(" ").map((n: string) => n[0]).join("")
              }
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1F0270", margin: 0 }}>{admin.name}</h2>
            <div style={{ display: "inline-block", background: "#FFEAA7", color: "#B27A00", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700, marginTop: 8 }}>{admin.role}</div>
            <div style={{ width: "100%", height: "1px", background: "#E5E7EB", margin: "24px 0" }} />
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ background: "#F5F6FA", borderRadius: 10, padding: 8, color: "#1F0270" }}><Mail size={18} /></div>
                <div>
                  <span style={{ fontSize: 11, color: "#9CA3AF", display: "block" }}>Adresse Email</span>
                  <span style={{ fontSize: 14, color: "#374151", fontWeight: 600 }}>{admin.email}</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ background: "#F5F6FA", borderRadius: 10, padding: 8, color: "#1F0270" }}><Calendar size={18} /></div>
                <div>
                  <span style={{ fontSize: 11, color: "#9CA3AF", display: "block" }}>Dernière connexion</span>
                  <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>{admin.loginAt}</span>
                </div>
              </div>
            </div>
            <div style={{ width: "100%", height: "1px", background: "#E5E7EB", margin: "24px 0" }} />
            <button onClick={handleLogout} style={{ width: "100%", padding: "12px", borderRadius: 12, background: "#FEE2E2", color: "#DC2626", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <LogOut size={16} /> Déconnexion
            </button>
          </div>

          {/* Permissions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ background: "white", borderRadius: 20, padding: 28, border: "1px solid #EAECF5", boxShadow: "0 1px 6px rgba(31,2,112,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ background: "#FFF8E6", borderRadius: 10, padding: 10, color: "#FFBA08" }}><Shield size={20} /></div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1F0270", margin: 0 }}>Rôle & Permissions</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="dash-grid">
                {["Validation des demandes SIM", "Gestion des stocks", "Supervision des transactions", "Configuration des offres SIM", "Gestion des comptes utilisateurs", "Accès complet aux logs"].map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#F5F6FA", borderRadius: 10, fontSize: 13, color: "#374151", fontWeight: 500 }}>
                    <div style={{ background: "#DCFCE7", color: "#166534", width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Check size={14} />
                    </div>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "white", borderRadius: 20, padding: 28, border: "1px solid #EAECF5", boxShadow: "0 1px 6px rgba(31,2,112,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ background: "#EEF2FF", borderRadius: 10, padding: 10, color: "#4F46E5" }}><Key size={20} /></div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1F0270", margin: 0 }}>Sécurité de la session</h3>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <td style={{ padding: "12px 0", color: "#6B7280" }}>Type d&apos;authentification</td>
                    <td style={{ padding: "12px 0", color: "#374151", fontWeight: 600, textAlign: "right" }}>JWT Bearer (RS256)</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <td style={{ padding: "12px 0", color: "#6B7280" }}>Statut du compte</td>
                    <td style={{ padding: "12px 0", color: "#10B981", fontWeight: 600, textAlign: "right" }}>Actif</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 0", color: "#6B7280" }}>ID Utilisateur</td>
                    <td style={{ padding: "12px 0", color: "#374151", fontWeight: 600, textAlign: "right", fontFamily: "monospace", fontSize: 11 }}>{admin.id || "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Chargement...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
