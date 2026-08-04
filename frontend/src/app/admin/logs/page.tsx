"use client";
import { useState } from "react";
import { Search, SlidersHorizontal, Calendar, FileText, User, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { MOCK_LOGS } from "@/data/admin-mock-data";
import "../admin-responsive.css";

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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterNiveau, setFilterNiveau] = useState("Tous");

  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [viewMode, setViewMode] = useState<"logs" | "tentatives">("logs");
  const [hoveredSegment, setHoveredSegment] = useState<{ label: string; val: string } | null>(null);

  const segments = [
    { label: "Connexions", val: "28", color: "#4F46E5", array: "96 220", offset: "0" },
    { label: "Échecs", val: "16", color: "#DC2626", array: "55 220", offset: "-96" },
    { label: "Alertes", val: "8", color: "#F59E0B", array: "27 220", offset: "-151" },
    { label: "Accès inhab.", val: "7", color: "#8B5CF6", array: "24 220", offset: "-178" },
    { label: "Autres", val: "5", color: "#E5E7EB", array: "18 220", offset: "-202" },
  ];

  const MOCK_TENTATIVES = [
    { date: "08/06/2026 14:32:10", utilisateur: { nom: "Camara Yamoussa", email: "admin@yamoussa.sn" }, ip: "192.168.1.102", statut: "Mot de passe incorrect", appareil: "Chrome / Windows", local: "Conakry, Guinée" },
    { date: "08/06/2026 14:31:55", utilisateur: { nom: "Camara Yamoussa", email: "admin@yamoussa.sn" }, ip: "192.168.1.102", statut: "Mot de passe incorrect", appareil: "Chrome / Windows", local: "Conakry, Guinée" },
    { date: "08/06/2026 14:31:40", utilisateur: { nom: "Camara Yamoussa", email: "admin@yamoussa.sn" }, ip: "192.168.1.102", statut: "Mot de passe incorrect", appareil: "Chrome / Windows", local: "Conakry, Guinée" },
    { date: "08/06/2026 14:30:12", utilisateur: { nom: "Utilisateur Inconnu", email: "hack@secure.com" }, ip: "185.220.101.5", statut: "Utilisateur inexistant", appareil: "Firefox / Linux", local: "Moscou, Russie" },
    { date: "08/06/2026 14:28:05", utilisateur: { nom: "Camara Yamoussa", email: "admin@yamoussa.sn" }, ip: "192.168.1.102", statut: "Mot de passe incorrect", appareil: "Chrome / Windows", local: "Conakry, Guinée" },
    { date: "08/06/2026 11:15:30", utilisateur: { nom: "Mariama Diallo", email: "m.diallo@nmasim.sn" }, ip: "197.149.200.12", statut: "Session expirée", appareil: "Safari / iPhone", local: "Kankan, Guinée" },
  ];

  const parseDate = (dateStr: string) => {
    const [datePart] = dateStr.split(" ");
    const [day, month, year] = datePart.split("/");
    return new Date(`${year}-${month}-${day}`);
  };

  const filtered = MOCK_LOGS.filter(l => {
    const matchSearch = l.utilisateur.nom.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.detail.toLowerCase().includes(search.toLowerCase());
    const matchNiveau = filterNiveau === "Tous" || l.niveau === filterNiveau;

    let matchDate = true;
    if (startDate && endDate) {
      // Intervalle
      const logDate = parseDate(l.date);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchDate = logDate >= start && logDate <= end;
    } else if (startDate || endDate) {
      // Une seule date exacte
      const dateCible = startDate || endDate;
      const [logDateStr] = l.date.split(" ");
      const [d, m, y] = logDateStr.split("/");
      const formattedLogDate = `${y}-${m}-${d}`;
      matchDate = formattedLogDate === dateCible;
    }

    return matchSearch && matchNiveau && matchDate;
  });

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
          { icon: FileText, label: "Actions totales", value: "1 248", sub: "100% du total", subSub: "↑ 18% vs période précédente", color: "#059669", bg: "#EEF2FF", iconColor: "#4F46E5" },
          { icon: User, label: "Connexions", value: "328", sub: "26,3% du total", subSub: "↑ 12% vs période précédente", color: "#059669", bg: "#E0F2FE", iconColor: "#0284C7" },
          { icon: CheckCircle2, label: "Validations", value: "562", sub: "45,0% du total", subSub: "↑ 22% vs période précédente", color: "#059669", bg: "#DCFCE7", iconColor: "#166534" },
          { icon: XCircle, label: "Rejets", value: "176", sub: "14,1% du total", subSub: "↓ 5% vs période précédente", color: "#DC2626", bg: "#FEE2E2", iconColor: "#991B1B" },
          { icon: AlertTriangle, label: "Alertes sécurité", value: "32", sub: "2,6% du total", subSub: "↑ 33% vs période précédente", color: "#059669", bg: "#FEF3C7", iconColor: "#D97706" },
        ].map((k, i) => (
          <div className="logs-kpi-card" key={i} style={{ background: "white", borderRadius: 16, padding: "18px 22px", flex: 1, minWidth: 140, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ background: k.bg, borderRadius: 10, padding: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <k.icon size={18} style={{ color: k.iconColor }} />
              </div>
              <div style={{ fontSize: 12, color: "#1F0270", fontWeight: 700 }}>{k.label}</div>
            </div>
            <div className="logs-kpi-value" style={{ fontSize: 26, fontWeight: 800, color: "#1F0270" }}>{k.value}</div>
            <div style={{ fontSize: 11, color: "#6B7280" }}>{k.sub}</div>
            <div style={{ fontSize: 10, color: k.color, fontWeight: 500, marginTop: 4 }}>{k.subSub}</div>
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
                {MOCK_TENTATIVES.map((t, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #F9FAFB" }}>
                    <td style={{ padding: "14px 20px", fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>{t.date}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{t.utilisateur.nom}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>{t.utilisateur.email}</div>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 12, color: "#4F46E5", fontWeight: 500 }}>{t.ip}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ background: "#FEE2E2", color: "#991B1B", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{t.statut}</span>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 12, color: "#374151" }}>{t.appareil}</td>
                    <td style={{ padding: "14px 20px", fontSize: 12, color: "#6B7280" }}>{t.local}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Activité de sécurité (Déplacé au-dessous du tableau, SANS légende, taille augmentée) */}
        <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h3 style={{ fontWeight: 700, color: "#1F0270", margin: 0, fontSize: 15, width: "100%", textAlign: "left", marginBottom: 16 }}>Activité de sécurité</h3>
          
          {/* Centered Donut Chart */}
          <div style={{ position: "relative", width: 200, height: 200, margin: "20px 0" }}>
            <svg width={200} height={200} viewBox="0 0 90 90" style={{ width: "100%", height: "100%" }}>
              {segments.map((seg, i) => (
                <circle
                  key={i}
                  cx="45"
                  cy="45"
                  r="35"
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={hoveredSegment?.label === seg.label ? "17" : "14"}
                  strokeDasharray={seg.array}
                  strokeDashoffset={seg.offset}
                  transform="rotate(-90 45 45)"
                  onMouseEnter={() => setHoveredSegment({ label: seg.label, val: seg.val })}
                  onMouseLeave={() => setHoveredSegment(null)}
                  style={{ cursor: "pointer", transition: "stroke-width 0.2s ease, stroke 0.2s ease" }}
                />
              ))}
            </svg>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#1F0270", lineHeight: 1.2 }}>
                {hoveredSegment ? hoveredSegment.val : "64"}
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
              {[
                { type: "Critique", title: "Tentatives de connexion échouées", desc: "5 échecs consécutifs détectés", time: "14:32" },
                { type: "Alerte", title: "Paiement échoué", desc: "PAY-2026-004511 - Solde insuffisant", time: "12:18" },
                { type: "Critique", title: "Document suspect détecté", desc: "Demande NMA-2026-000119", time: "11:07" },
                { type: "Alerte", title: "Accès depuis nouvel appareil", desc: "Connexion inhabituelle détectée", time: "09:45" },
                { type: "Info", title: "Session expirée", desc: "Déconnexion automatique effectuée", time: "08:22" },
              ].map((a, i) => (
                <div key={i} onClick={() => a.title.includes("Tentatives") && setViewMode("tentatives")} style={{ display: "flex", gap: 12, paddingBottom: 12, borderBottom: i < 4 ? "1px solid #F3F4F6" : "none", cursor: a.title.includes("Tentatives") ? "pointer" : "default" }}>
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
