"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, Eye, Loader2, RefreshCcw, Download, History, X, Calendar, Smartphone, RotateCcw, Wallet } from "lucide-react";
import { generateNmaSimPDF } from "@/lib/pdf-generator";

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
function TypeBadge({ type, formatSim }: { type: string; formatSim?: string }) {
  const isEsim = type === "NOUVELLE_SIM" && formatSim === "ESIM";
  const bg = type === "NOUVELLE_SIM" ? (isEsim ? "#EEF2FF" : "#F0FDF4") : type === "RECHARGE" ? "#FFFBEB" : "#EEF2FF";
  const color = type === "NOUVELLE_SIM" ? (isEsim ? "#3730A3" : "#166534") : type === "RECHARGE" ? "#B45309" : "#4338CA";
  const border = type === "NOUVELLE_SIM" ? (isEsim ? "#C7D2FE" : "#BBF7D0") : type === "RECHARGE" ? "#FDE68A" : "#C7D2FE";
  const label = type === "NOUVELLE_SIM"
    ? (isEsim ? "Nouvelle SIM · eSIM" : "Nouvelle SIM · Physique")
    : type === "REACTIVATION" ? "Réactivation" : "Recharge";
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

// ─── Regroupement par client ────────────────────────────────────────────────
// Une ligne par client au lieu d'une par transaction. Rien n'est caché : chaque
// groupe contient l'historique COMPLET du client (pas filtré par la recherche),
// consultable en un clic. La ligne représentative priorise une demande encore
// en attente/en cours, pour qu'aucune demande à traiter ne disparaisse de la vue.
interface ClientGroup {
  clientId: string;
  client: any;
  representative: any;
  hasPending: boolean;
  stats: { nouvelleSim: number; reactivation: number; recharge: number; total: number; premiere: string; derniere: string };
  demandes: any[];
}

// Clé de regroupement : le numéro de pièce d'identité (numeroPiece) est la vraie source de
// vérité d'une personne — plusieurs lignes Client historiques (doublons créés avant le fix
// de dédup) peuvent partager le même numeroPiece. On regroupe donc par ce numéro quand il
// est connu, avec repli sur l'ID client (isolé, pas de fusion à tort) sinon.
function clefClient(d: any): string | null {
  const numeroPiece = (d.client?.numeroPiece || "").trim();
  if (numeroPiece) return `piece:${numeroPiece}`;
  return d.client?.id ? `id:${d.client.id}` : null;
}

function grouperParClient(toutesLesDemandes: any[], demandesVisibles: any[]): ClientGroup[] {
  const clesVisibles = new Set(demandesVisibles.map(clefClient).filter(Boolean));
  const parClient = new Map<string, any[]>();

  for (const d of toutesLesDemandes) {
    const cle = clefClient(d);
    if (!cle || !clesVisibles.has(cle)) continue;
    if (!parClient.has(cle)) parClient.set(cle, []);
    parClient.get(cle)!.push(d);
  }

  const groupes: ClientGroup[] = [];
  for (const [clientId, demandesClient] of parClient) {
    const triees = [...demandesClient].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const enAttente = triees.filter(d => d.statut === "EN_ATTENTE_VALIDATION" || d.statut === "EN_COURS_DE_TRAITEMENT");
    const representative = enAttente[0] || triees[0];

    groupes.push({
      clientId,
      client: representative.client,
      representative,
      hasPending: enAttente.length > 0,
      stats: {
        nouvelleSim: triees.filter(d => d.type === "NOUVELLE_SIM" && d.statut === "VALIDEE").length,
        reactivation: triees.filter(d => d.type === "REACTIVATION" && d.statut === "VALIDEE").length,
        recharge: triees.filter(d => d.type === "RECHARGE" && d.statut === "VALIDEE").length,
        total: triees.length,
        premiere: triees[triees.length - 1]?.createdAt,
        derniere: triees[0]?.createdAt,
      },
      demandes: triees,
    });
  }

  groupes.sort((a, b) => {
    if (a.hasPending !== b.hasPending) return a.hasPending ? -1 : 1;
    return new Date(b.stats.derniere).getTime() - new Date(a.stats.derniere).getTime();
  });

  return groupes;
}

// ─── Modal historique client ────────────────────────────────────────────────
function HistoriqueClientModal({ groupe, onClose, onVoirDemande }: { groupe: ClientGroup | null; onClose: () => void; onVoirDemande: (id: string) => void }) {
  if (!groupe) return null;
  const { client, stats, demandes } = groupe;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 640, maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F9FAFB" }}>
          <div>
            <h3 style={{ fontWeight: 700, color: "#1F0270", margin: 0, fontSize: 18 }}>{client?.prenom} {client?.nom}</h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6B7280" }}>{client?.telephone || "Aucun numéro"}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280" }}><X size={20} /></button>
        </div>

        <div style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, borderBottom: "1px solid #F3F4F6" }}>
          {[
            { icon: Smartphone, label: "SIM achetées", value: stats.nouvelleSim },
            { icon: RotateCcw, label: "Réactivations", value: stats.reactivation },
            { icon: Wallet, label: "Recharges", value: stats.recharge },
            { icon: History, label: "Total opérations", value: stats.total },
          ].map(k => (
            <div key={k.label} style={{ background: "#F8F9FC", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
              <k.icon size={14} style={{ color: "#4F46E5", marginBottom: 4 }} />
              <div style={{ fontSize: 18, fontWeight: 800, color: "#1F0270" }}>{k.value}</div>
              <div style={{ fontSize: 10, color: "#6B7280" }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: "10px 24px", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6B7280", borderBottom: "1px solid #F3F4F6" }}>
          <Calendar size={13} />
          Client depuis le {new Date(stats.premiere).toLocaleDateString("fr-FR")} — dernière activité le {new Date(stats.derniere).toLocaleDateString("fr-FR")}
        </div>

        <div style={{ overflowY: "auto", padding: "8px 24px 20px" }}>
          {demandes.map((d: any) => (
            <div key={d.id} onClick={() => onVoirDemande(d.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 4px", borderBottom: "1px solid #F3F4F6", cursor: "pointer" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#4F46E5" }}>{d.numeroDossier}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{new Date(d.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</div>
              </div>
              <TypeBadge type={d.type} formatSim={d.formatSim} />
              <StatutBadge statut={d.statut} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DemandesContent() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [demandes, setDemandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [selectedGroup, setSelectedGroup] = useState<ClientGroup | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // ⚠️ L'API pagine par défaut à 20 résultats — sans limit explicite, la page ne verrait
      // que les 20 demandes les plus récentes et cacherait silencieusement le reste.
      const [demandesRes, statsRes] = await Promise.all([
        apiFetch("/api/demandes?orderBy=createdAt&order=desc&limit=100000"),
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

  // Une ligne par client (voir grouperParClient) — chaque groupe garde tout l'historique
  // complet de ce client, jamais restreint par la recherche une fois le détail ouvert.
  const clientGroups = grouperParClient(demandes, filtered);

  const generatePDF = useCallback(() => {
    if (filtered.length === 0) {
      alert("Aucune donnée à imprimer.");
      return;
    }

    const tableData = filtered.map((d: any) => [
      d.numeroDossier,
      d.type === "NOUVELLE_SIM"
        ? (d.formatSim === "ESIM" ? "Nouvelle SIM eSIM" : "Nouvelle SIM Physique")
        : d.type.replace(/_/g, ' '),
      d.client ? `${d.client.prenom} ${d.client.nom}` : "—",
      d.offre?.nom || (d.type === "RECHARGE" ? "Recharge" : "—"),
      (d.paiement?.montant || d.paiement?.[0]?.montant) ? (d.paiement?.montant || d.paiement?.[0]?.montant) + " GNF" : "—",
      d.statut.replace(/_/g, ' '),
      new Date(d.createdAt).toLocaleDateString('fr-FR')
    ]);

    generateNmaSimPDF({
      title: "Liste des Demandes",
      subtitle: `Total affiché : ${filtered.length} / ${demandes.length}`,
      columns: ['Ticket', 'Type', 'Client', 'Offre', 'Paiement', 'Statut', 'Date'],
      data: tableData,
      filename: "Demandes"
    });
  }, [filtered, demandes.length]);

  useEffect(() => {
    const handlePrintRequest = (e: any) => {
      if (e.detail?.action === "print") {
        e.preventDefault(); // Annule l'impression native
        generatePDF();
      }
    };
    document.addEventListener("admin-ai-action", handlePrintRequest);
    return () => document.removeEventListener("admin-ai-action", handlePrintRequest);
  }, [generatePDF]);

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
          <button onClick={generatePDF} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 40, borderRadius: 10, border: "1px solid #E5E7EB", background: "white", cursor: "pointer", fontSize: 14, color: "#1F0270", fontWeight: 600 }}>
             <Download size={16} /> Export PDF
          </button>
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
        ) : clientGroups.length === 0 ? (
           <div style={{ padding: 40, textAlign: "center", color: "#6B7280" }}>Aucune demande trouvée.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                {["Dernière action", "Type de service", "Client", "Offre", "Paiement", "Score IA", "Statut", "Opérations"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "14px 12px", fontSize: 12, color: "#6B7280", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
                <th className="print:hidden" style={{ textAlign: "left", padding: "14px 12px", fontSize: 12, color: "#6B7280", fontWeight: 600, whiteSpace: "nowrap" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {clientGroups.map((g) => {
                const d = g.representative;
                return (
                <tr key={g.clientId} style={{ borderBottom: "1px solid #F9FAFB", transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "14px 12px", fontSize: 13, color: "#4F46E5", fontWeight: 600, whiteSpace: "nowrap" }}>
                    {d.numeroDossier}
                    {g.hasPending && <div style={{ fontSize: 10, color: "#D97706", fontWeight: 700, marginTop: 2 }}>À traiter</div>}
                  </td>
                  <td style={{ padding: "14px 12px" }}><TypeBadge type={d.type} formatSim={d.formatSim} /></td>
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
                  <td style={{ padding: "14px 12px" }}>
                    <span style={{ background: "#F3F4F6", color: "#374151", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>{g.stats.total}</span>
                  </td>
                  <td className="print:hidden" style={{ padding: "14px 12px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => setSelectedGroup(g)}
                        title="Historique complet du client"
                        style={{ background: "#EEF2FF", border: "none", borderRadius: 8, padding: "8px 10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <History size={16} style={{ color: "#4F46E5" }} />
                      </button>
                      <button
                        onClick={() => router.push(`/admin/demandes-sim/${d.id}`)}
                        title="Voir cette demande"
                        style={{ background: "#F3F4F6", border: "none", borderRadius: 8, padding: "8px 10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <Eye size={16} style={{ color: "#374151" }} />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div className="print:hidden" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #F3F4F6" }}>
          <span style={{ fontSize: 13, color: "#6B7280" }}>{clientGroups.length} client{clientGroups.length > 1 ? "s" : ""} — {demandes.length} demande{demandes.length > 1 ? "s" : ""} au total</span>
        </div>
      </div>

      <HistoriqueClientModal
        groupe={selectedGroup}
        onClose={() => setSelectedGroup(null)}
        onVoirDemande={(id) => router.push(`/admin/demandes-sim/${id}`)}
      />
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
