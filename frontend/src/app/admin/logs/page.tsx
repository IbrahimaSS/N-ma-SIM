"use client";
import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, Calendar, FileText, User, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import "../admin-responsive.css";

const BACKEND = "http://localhost:3001";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const s = localStorage.getItem("admin_session");
  if (!s) return null;
  return JSON.parse(s).token ?? null;
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${BACKEND}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Erreur ${res.status}`);
  return data;
}

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
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterNiveau, setFilterNiveau] = useState("Tous");

  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [viewMode, setViewMode] = useState<"logs" | "tentatives">("logs");
  const [hoveredSegment, setHoveredSegment] = useState<{ label: string; val: string } | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await apiFetch("/api/logs?limit=500");
        setLogs(data.data || []);
      } catch (e) {
        console.error("Erreur chargement logs:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const determineNiveau = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("échec") || t.includes("rejet")) return "Alerte";
    if (t.includes("suppression") || t.includes("erreur")) return "Critique";
    if (t.includes("création") || t.includes("validation")) return "Succès";
    return "Info";
  };

  const filtered = logs.filter(l => {
    const niveau = determineNiveau(l.type);
    const nom = l.utilisateur?.nom || "Système";
    const matchSearch = nom.toLowerCase().includes(search.toLowerCase()) ||
      (l.type && l.type.toLowerCase().includes(search.toLowerCase())) ||
      (l.description && l.description.toLowerCase().includes(search.toLowerCase()));
    const matchNiveau = filterNiveau === "Tous" || niveau === filterNiveau;
    let matchDate = true;
    if (startDate && endDate) {
      const logDate = new Date(l.createdAt);
      const start = new Date(startDate); start.setHours(0,0,0,0);
      const end = new Date(endDate); end.setHours(23,59,59,999);
      matchDate = logDate >= start && logDate <= end;
    } else if (startDate || endDate) {
      const dateCible = startDate || endDate;
      const logDateStr = new Date(l.createdAt).toISOString().split('T')[0];
      matchDate = logDateStr === dateCible;
    }
    return matchSearch && matchNiveau && matchDate;
  });

  // Pagination dynamique
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Graphique dynamique basé sur les vrais logs
  const nbConnexions = logs.filter(l => l.type?.toLowerCase().includes('connexion')).length;
  const nbEchecs = logs.filter(l => l.type?.toLowerCase().includes('échec') || l.type?.toLowerCase().includes('rejet')).length;
  const nbValidations = logs.filter(l => l.type?.toLowerCase().includes('validation')).length;
  const nbModifs = logs.filter(l => l.type?.toLowerCase().includes('modification')).length;
  const nbAutres = Math.max(0, logs.length - nbConnexions - nbEchecs - nbValidations - nbModifs);
  const totalSec = nbConnexions + nbEchecs + nbValidations + nbModifs + nbAutres || 1;
  const circ = 220;
  const toArr = (n: number) => `${Math.round((n / totalSec) * circ)} ${circ}`;
  const segments = [
    { label: "Connexions", val: nbConnexions.toString(), color: "#4F46E5", arr: toArr(nbConnexions) },
    { label: "Rejets/Échecs", val: nbEchecs.toString(), color: "#DC2626", arr: toArr(nbEchecs) },
    { label: "Validations", val: nbValidations.toString(), color: "#22C55E", arr: toArr(nbValidations) },
    { label: "Modifications", val: nbModifs.toString(), color: "#F59E0B", arr: toArr(nbModifs) },
    { label: "Autres", val: nbAutres.toString(), color: "#E5E7EB", arr: toArr(nbAutres) },
  ].reduce((acc: any[], seg) => {
    const prevOffset = acc.length > 0 ? (acc[acc.length-1]._nextOffset) : 0;
    return [...acc, { ...seg, offset: (-prevOffset).toString(), _nextOffset: prevOffset + Math.round((parseInt(seg.arr)/1)*1) }];
  }, []);

  // Alertes dérivées des vrais logs
  const dernieresAlertes = logs
    .filter(l => determineNiveau(l.type) === 'Alerte' || determineNiveau(l.type) === 'Critique')
    .slice(0, 5)
    .map(l => ({
      type: determineNiveau(l.type),
      title: l.type,
      desc: l.description,
      time: new Date(l.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }));

  // Tentatives filtrées depuis les vrais logs
  const tentatives = logs.filter(l =>
    l.type?.toLowerCase().includes('connexion') ||
    l.type?.toLowerCase().includes('échec') ||
    l.type?.toLowerCase().includes('session')
  );

  return (
    <div>
      <div className="logs-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1F0270", margin: 0 }}>Logs & Historique</h1>
          <p style={{ color: "#6B7280", marginTop: 4, fontSize: 14 }}>Traçabilité et audit système</p>
        </div>
        <div className="logs-filters" style={{ display: "flex", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
            <input className="logs-search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher (utilisateur, action, référence...)" style={{ paddingLeft: 36, paddingRight: 16, height: 40, borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 14, outline: "none", width: 300, background: "white" }} />
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={() => setIsDateFilterOpen(!isDateFilterOpen)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 40, borderRadius: 10, border: "1px solid #E5E7EB", background: isDateFilterOpen || startDate || endDate ? "#F3F4F6" : "white", cursor: "pointer", fontSize: 14, color: "#374151" }}>
              <Calendar size={16} />
              {startDate && endDate ? `Du ${startDate} au ${endDate}` : (startDate ? `Le ${startDate}` : (endDate ? `Le ${endDate}` : "Toutes les dates"))}
            </button>

            {isDateFilterOpen && (
              <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 8, background: "white", border: "1px solid #E5E7EB", borderRadius: 12, boxShadow: "0 10px 25px rgba(0,0,0,0.1)", width: 260, zIndex: 50, padding: 16 }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Date de début (ou date unique)</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, outline: "none", background: "#F9FAFB", color: "#111827", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Date de fin (facultatif)</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, outline: "none", background: "#F9FAFB", color: "#111827", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, borderTop: "1px solid #F3F4F6", paddingTop: 12 }}>
                  <button onClick={() => { setStartDate(""); setEndDate(""); }} style={{ fontSize: 12, color: "#4F46E5", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Réinitialiser</button>
                </div>
              </div>
            )}
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={() => setIsFilterOpen(!isFilterOpen)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 40, borderRadius: 10, border: "1px solid #E5E7EB", background: isFilterOpen ? "#F3F4F6" : "white", cursor: "pointer", fontSize: 14, color: "#374151" }}>
              <SlidersHorizontal size={16} /> Filtrer
              {filterNiveau !== "Tous" && (
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4F46E5', marginLeft: 4 }}></div>
              )}
            </button>

            {isFilterOpen && (
              <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 8, background: "white", border: "1px solid #E5E7EB", borderRadius: 12, boxShadow: "0 10px 25px rgba(0,0,0,0.1)", width: 220, zIndex: 50, padding: 16 }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Niveau d'alerte</label>
                  <select value={filterNiveau} onChange={e => setFilterNiveau(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, outline: "none", background: "#F9FAFB", color: "#111827" }}>
                    <option value="Tous">Tous les niveaux</option>
                    <option value="Succès">Succès</option>
                    <option value="Info">Info</option>
                    <option value="Alerte">Alerte</option>
                    <option value="Critique">Critique</option>
                  </select>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, borderTop: "1px solid #F3F4F6", paddingTop: 12 }}>
                  <button onClick={() => setFilterNiveau("Tous")} style={{ fontSize: 12, color: "#4F46E5", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Réinitialiser</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="logs-kpi-row" style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { icon: FileText, label: "Actions totales", value: logs.length, color: "#059669", bg: "#EEF2FF", iconColor: "#4F46E5" },
          { icon: User, label: "Connexions", value: logs.filter(l => l.type.toLowerCase().includes('connexion')).length, color: "#059669", bg: "#E0F2FE", iconColor: "#0284C7" },
          { icon: CheckCircle2, label: "Validations", value: logs.filter(l => l.type.toLowerCase().includes('validation')).length, color: "#059669", bg: "#DCFCE7", iconColor: "#166534" },
          { icon: XCircle, label: "Rejets / Échecs", value: logs.filter(l => l.type.toLowerCase().includes('rejet') || l.type.toLowerCase().includes('échec')).length, color: "#DC2626", bg: "#FEE2E2", iconColor: "#991B1B" },
          { icon: AlertTriangle, label: "Alertes sécurité", value: logs.filter(l => l.type.toLowerCase().includes('erreur') || l.type.toLowerCase().includes('suppression')).length, color: "#059669", bg: "#FEF3C7", iconColor: "#D97706" },
        ].map((k, i) => (
          <div className="logs-kpi-card" key={i} style={{ background: "white", borderRadius: 16, padding: "18px 22px", flex: 1, minWidth: 140, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ background: k.bg, borderRadius: 10, padding: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <k.icon size={18} style={{ color: k.iconColor }} />
              </div>
              <div style={{ fontSize: 12, color: "#1F0270", fontWeight: 700 }}>{k.label}</div>
            </div>
            <div className="logs-kpi-value" style={{ fontSize: 26, fontWeight: 800, color: "#1F0270" }}>{k.value}</div>
          </div>
        ))}
      </div>


      <div className="logs-grid" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
        {/* Colonne Gauche (Tableau + Graphique en bas) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {viewMode === "logs" ? (
            <div className="logs-table-wrapper" style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5", overflow: "hidden", height: "fit-content" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                  {["Date & heure", "Utilisateur", "Module", "Action", "Référence", "Détail", "Niveau"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "14px 20px", fontSize: 12, color: "#6B7280", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((l, i) => {
                  const nom = l.utilisateur?.nom || "Système";
                  const email = l.utilisateur?.email || "-";
                  const niveau = determineNiveau(l.type);
                  return (
                    <tr key={l.id || i} style={{ borderBottom: "1px solid #F9FAFB" }}>
                      <td style={{ padding: "14px 20px", fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>
                        {new Date(l.createdAt).toLocaleString('fr-FR')}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#4F46E5", flexShrink: 0 }}>
                            {nom.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{nom}</div>
                            <div style={{ fontSize: 11, color: "#9CA3AF" }}>{email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 12, color: "#374151" }}>{l.entiteType || "-"}</td>
                      <td style={{ padding: "14px 20px", fontSize: 12, color: "#374151" }}>{l.type}</td>
                      <td style={{ padding: "14px 20px", fontSize: 12, color: "#4F46E5", fontWeight: 500 }}>{l.entiteId || "-"}</td>
                      <td style={{ padding: "14px 20px", fontSize: 12, color: "#6B7280", maxWidth: 200 }}>{l.description}</td>
                      <td style={{ padding: "14px 20px" }}><NiveauBadge niveau={niveau} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #F3F4F6" }}>
              <span style={{ fontSize: 13, color: "#6B7280" }}>Affichage {Math.min((page-1)*PAGE_SIZE+1, filtered.length)} à {Math.min(page*PAGE_SIZE, filtered.length)} sur {filtered.length} logs</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} style={{ minWidth: 32, height: 32, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", color: "#374151", fontSize: 13, cursor: page===1?"default":"pointer", padding: "0 8px", opacity: page===1?0.4:1 }}>‹</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = totalPages <= 5 ? i+1 : page <= 3 ? i+1 : page >= totalPages-2 ? totalPages-4+i : page-2+i;
                  return <button key={p} onClick={() => setPage(p)} style={{ minWidth: 32, height: 32, borderRadius: 8, border: "1px solid #E5E7EB", background: p===page?"#1F0270":"white", color: p===page?"white":"#374151", fontSize: 13, cursor: "pointer", padding: "0 8px" }}>{p}</button>;
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} style={{ minWidth: 32, height: 32, borderRadius: 8, border: "1px solid #E5E7EB", background: "white", color: "#374151", fontSize: 13, cursor: page===totalPages?"default":"pointer", padding: "0 8px", opacity: page===totalPages?0.4:1 }}>›</button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5", overflow: "hidden", height: "fit-content", padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1F0270", margin: 0 }}>Tentatives de connexion</h2>
              <button onClick={() => setViewMode("logs")} style={{ fontSize: 13, color: "#4F46E5", background: "none", border: "1px solid #E5E7EB", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
                ← Retour aux logs
              </button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                  {["Date & heure", "Utilisateur", "Adresse IP", "Statut", "Appareil", "Localisation"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "14px 20px", fontSize: 12, color: "#6B7280", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tentatives.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>Aucune tentative enregistrée</td></tr>
                ) : tentatives.map((l, i) => {
                  const nom = l.utilisateur?.nom || "Système";
                  const email = l.utilisateur?.email || "-";
                  const niveau = determineNiveau(l.type);
                  return (
                    <tr key={l.id || i} style={{ borderBottom: "1px solid #F9FAFB" }}>
                      <td style={{ padding: "14px 20px", fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>{new Date(l.createdAt).toLocaleString('fr-FR')}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{nom}</div>
                        <div style={{ fontSize: 11, color: "#9CA3AF" }}>{email}</div>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 12, color: "#4F46E5", fontWeight: 500 }}>—</td>
                      <td style={{ padding: "14px 20px" }}><NiveauBadge niveau={niveau} /></td>
                      <td style={{ padding: "14px 20px", fontSize: 12, color: "#374151" }}>{l.type}</td>
                      <td style={{ padding: "14px 20px", fontSize: 12, color: "#6B7280" }}>{l.description}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Activité de sécurité (Déplacé au-dessous du tableau, SANS légende, taille augmentée) */}
        <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h3 style={{ fontWeight: 700, color: "#1F0270", margin: 0, fontSize: 15, width: "100%", textAlign: "left", marginBottom: 16 }}>Activité de sécurité</h3>
          
          {/* Donut Chart dynamique */}
          <div style={{ position: "relative", width: 200, height: 200, margin: "20px 0" }}>
            <svg width={200} height={200} viewBox="0 0 90 90" style={{ width: "100%", height: "100%" }}>
              {segments.map((seg: any, i: number) => (
                <circle
                  key={i}
                  cx="45" cy="45" r="35"
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={hoveredSegment?.label === seg.label ? "17" : "14"}
                  strokeDasharray={seg.arr}
                  strokeDashoffset={seg.offset}
                  transform="rotate(-90 45 45)"
                  onMouseEnter={() => setHoveredSegment({ label: seg.label, val: seg.val })}
                  onMouseLeave={() => setHoveredSegment(null)}
                  style={{ cursor: "pointer", transition: "stroke-width 0.2s ease" }}
                />
              ))}
            </svg>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#1F0270", lineHeight: 1.2 }}>
                {hoveredSegment ? hoveredSegment.val : logs.length.toString()}
              </div>
              <div style={{ fontSize: 14, color: "#6B7280", fontWeight: 500 }}>
                {hoveredSegment ? hoveredSegment.label : "événements"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, color: "#1F0270", margin: 0, fontSize: 15 }}>Dernières alertes</h3>
              <button onClick={() => setViewMode("tentatives")} style={{ fontSize: 12, color: "#4F46E5", background: "none", border: "none", cursor: "pointer" }}>Voir tout</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {dernieresAlertes.length === 0 ? (
                <div style={{ textAlign: "center", color: "#9CA3AF", fontSize: 13, padding: "16px 0" }}>Aucune alerte récente</div>
              ) : dernieresAlertes.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 12, paddingBottom: 12, borderBottom: i < dernieresAlertes.length - 1 ? "1px solid #F3F4F6" : "none" }}>
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
        </div>
      </div>
    </div>
  );
}
