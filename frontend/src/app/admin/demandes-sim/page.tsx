"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, Eye, Loader2, RefreshCcw } from "lucide-react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

// ─── Helpers ───────────────────────────────────────────────────────────────
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const s = localStorage.getItem("admin_session");
  if (!s) return null;
  return JSON.parse(s).token ?? null;
}

async function apiFetch(path: string) {
  const token = getToken();
  const res = await fetch(`${BACKEND}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

// ─── Badges ─────────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: string }) {
  const bg = type === "NOUVELLE_SIM" ? "#F0FDF4" : type === "RECHARGE" ? "#FFFBEB" : "#EEF2FF";
  const color = type === "NOUVELLE_SIM" ? "#166534" : type === "RECHARGE" ? "#B45309" : "#4338CA";
  const border = type === "NOUVELLE_SIM" ? "#BBF7D0" : type === "RECHARGE" ? "#FDE68A" : "#C7D2FE";
  const label = type === "NOUVELLE_SIM" ? "Nouvelle SIM" : type === "REACTIVATION" ? "Réactivation" : "Recharge";
  return (
    <span style={{
      background: bg, color, border: `1px solid ${border}`,
      borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600
    }}>{label}</span>
  );
}

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    "VALIDEE":                 { bg: "#DCFCE7", color: "#166534" },
    "EN_ATTENTE_VALIDATION":   { bg: "#FEF3C7", color: "#92400E" },
    "EN_COURS_DE_TRAITEMENT":  { bg: "#EEF2FF", color: "#4338CA" },
    "REJETEE":                 { bg: "#FEE2E2", color: "#991B1B" },
  };
  const label: Record<string, string> = {
    "VALIDEE":                "Validée",
    "EN_ATTENTE_VALIDATION":  "En attente",
    "EN_COURS_DE_TRAITEMENT": "En cours",
    "REJETEE":                "Rejetée",
  };
  const s = map[statut] || { bg: "#F3F4F6", color: "#374151" };
  return (
    <span style={{ ...s, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
      {label[statut] || statut}
    </span>
  );
}

function PaiementBadge({ statut }: { statut: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    "CONFIRME": { bg: "#DCFCE7", color: "#166534" },
    "EN_ATTENTE": { bg: "#FEF3C7", color: "#92400E" },
    "ECHOUE": { bg: "#FEE2E2", color: "#991B1B" },
  };
  const label: Record<string, string> = {
    "CONFIRME": "Confirmé",
    "EN_ATTENTE": "En attente",
    "ECHOUE": "Échoué",
  }
  const s = map[statut] || { bg: "#F3F4F6", color: "#374151" };
  return <span style={{ ...s, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{label[statut] || statut}</span>;
}

function IaBadge({ ia, detail }: { ia: string; detail: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    "OK": { bg: "#DCFCE7", color: "#166534" },
    "WARNING": { bg: "#FEF3C7", color: "#92400E" },
    "REJECTED": { bg: "#FEE2E2", color: "#991B1B" },
  };
  const s = map[ia] || { bg: "#F3F4F6", color: "#374151" };
  return (
    <div>
      <span style={{ ...s, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>{ia === 'WARNING' ? 'Alerte' : ia === 'REJECTED' ? 'Rejetée' : 'OK'}</span>
      {detail && <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{detail}</div>}
    </div>
  );
}

function DemandesContent() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [demandes, setDemandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [demandesRes, statsRes] = await Promise.all([
        apiFetch("/api/demandes?orderBy=createdAt&order=desc"),
        apiFetch("/api/stats"),
      ]);
      setDemandes(demandesRes.data?.demandes || demandesRes.data || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = demandes.filter((d: any) => {
    const s = search.toLowerCase();
    const nom = d.client?.nom?.toLowerCase() || "";
    const prenom = d.client?.prenom?.toLowerCase() || "";
    const num = d.numeroDossier?.toLowerCase() || "";
    return nom.includes(s) || prenom.includes(s) || num.includes(s);
  });

  return (
    <div>
      {/* Header */}
      <div className="print:hidden" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1F0270", margin: 0 }}>Demandes SIM</h1>
          <p style={{ color: "#6B7280", marginTop: 4, fontSize: 14 }}>Dashboard administrateur</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={fetchData} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 40, borderRadius: 10, border: "1px solid #E5E7EB", background: "white", cursor: loading ? "not-allowed" : "pointer", fontSize: 14, color: "#374151" }}>
             <RefreshCcw size={16} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
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
      <div className="print:hidden" style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "En attente de validation", value: stats?.demandes?.enAttente ?? "-", sub: "À traiter d'urgence", badge: "Priorité élevée", color: "#D97706" },
          { label: "Validées", value: stats?.demandes?.validees ?? "-", sub: "Ce mois", color: "#059669" },
          { label: "Rejetées", value: stats?.demandes?.rejetees ?? "-", sub: "Ce mois", color: "#DC2626" },
          { label: "Paiements confirmés", value: stats?.paiements?.confirmes ?? "-", sub: "Transactions réussies", color: "#059669" },
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
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #EAECF5", overflow: "hidden" }} className="print:border-none print:shadow-none print:overflow-visible">
        {loading ? (
           <div style={{ padding: 40, display: "flex", justifyContent: "center" }}><Loader2 size={32} className="animate-spin" style={{ color: "#1F0270" }} /></div>
        ) : filtered.length === 0 ? (
           <div style={{ padding: 40, textAlign: "center", color: "#6B7280" }}>Aucune demande trouvée.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                {["Ticket", "Type de service", "Client", "Offre", "Paiement", "Score IA", "Statut demande", "Statut paiement"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "14px 12px", fontSize: 12, color: "#6B7280", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
                <th className="print:hidden" style={{ textAlign: "left", padding: "14px 12px", fontSize: 12, color: "#6B7280", fontWeight: 600, whiteSpace: "nowrap" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d: any) => (
                <tr key={d.id} style={{ borderBottom: "1px solid #F9FAFB", transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "14px 12px", fontSize: 13, color: "#4F46E5", fontWeight: 600, whiteSpace: "nowrap" }}>{d.numeroDossier}</td>
                  <td style={{ padding: "14px 12px" }}><TypeBadge type={d.type} /></td>
                  <td style={{ padding: "14px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#4F46E5", flexShrink: 0 }}>
                        {d.client?.nom?.charAt(0) || "?"}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{d.client?.prenom} {d.client?.nom}</div>
                        <div style={{ fontSize: 11, color: "#9CA3AF" }}>{d.client?.telephone || "Aucun N°"}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 12px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                      {d.type === "RECHARGE" ? "Crédit/Pass" : d.offre?.nom || "—"}
                    </div>
                    <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                      {(d.paiement?.montant || d.paiement?.[0]?.montant) ? (d.paiement?.montant || d.paiement?.[0]?.montant).toLocaleString("fr-FR") + " GNF" : "—"}
                    </div>
                  </td>
                  <td style={{ padding: "14px 12px" }}>
                    <span style={{ background: (d.paiement?.statut || d.paiement?.[0]?.statut) === "CONFIRME" ? "#DCFCE7" : "#FEF3C7", color: (d.paiement?.statut || d.paiement?.[0]?.statut) === "CONFIRME" ? "#166534" : "#92400E", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>
                      {(d.paiement?.methodePaiement || d.paiement?.[0]?.methodePaiement) || "—"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 12px" }}>
                     <IaBadge ia={d.scoreVerification >= 80 ? "OK" : d.scoreVerification > 0 ? "WARNING" : "EN_ATTENTE"} detail={d.scoreVerification > 0 ? `${d.scoreVerification}% match` : "-"} />
                  </td>
                  <td style={{ padding: "14px 12px" }}><StatutBadge statut={d.statut} /></td>
                  <td style={{ padding: "14px 12px" }}><PaiementBadge statut={(d.paiement?.statut || d.paiement?.[0]?.statut) || "EN_ATTENTE"} /></td>
                  <td className="print:hidden" style={{ padding: "14px 12px" }}>
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
        )}
        <div className="print:hidden" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #F3F4F6" }}>
          <span style={{ fontSize: 13, color: "#6B7280" }}>Affichage 1 à {filtered.length} sur {demandes.length} demandes</span>
        </div>
      </div>
    </div>
  );
}

export default function DemandesSIM() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <DemandesContent />
    </Suspense>
  );
}
