"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Power, Tag, X, CheckCircle2, Loader2, RefreshCcw, AlertTriangle } from "lucide-react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

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

// Type map for display
const TYPE_LABEL: Record<string, string> = {
  SIM_STANDARD: "Nouvelle SIM",
  SIM_INTERNET: "Nouvelle SIM",
  SIM_ETUDIANT: "Nouvelle SIM",
  SIM_ENTREPRISE: "Nouvelle SIM",
  RECHARGE: "Recharge",
  FORFAIT_PASS: "Forfait Pass",
  DEPOT: "Réactivation",
};
const TYPE_ICON: Record<string, string> = {
  SIM_STANDARD: "📱",
  SIM_INTERNET: "🌐",
  SIM_ETUDIANT: "🎓",
  SIM_ENTREPRISE: "🏢",
  RECHARGE: "⚡",
  FORFAIT_PASS: "📦",
  DEPOT: "🔄",
};

function Modal({ isOpen, onClose, title, children }: any) {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 500, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#1F0270", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -15, right: -15, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,184,0,0.10)" }} />
          <h3 style={{ fontWeight: 700, color: "#FFB800", margin: 0, fontSize: 18, position: "relative", zIndex: 1 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", color: "white", display: "flex", padding: 7, borderRadius: 8, position: "relative", zIndex: 1 }}><X size={18} /></button>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Offres() {
  const [offres, setOffres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editOffre, setEditOffre] = useState<any>(null);
  const [deactivateOffre, setDeactivateOffre] = useState<any>(null);

  // Form state
  const [form, setForm] = useState({ nom: "", description: "", prix: "", type: "SIM_STANDARD" });
  const [formError, setFormError] = useState<string | null>(null);

  const fetchOffres = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch ALL offres (actives + inactives) for admin view
      const token = getToken();
      const res = await fetch(`${BACKEND}/api/offres?all=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOffres(data.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOffres(); }, [fetchOffres]);

  const openAdd = () => {
    setForm({ nom: "", description: "", prix: "", type: "SIM_STANDARD" });
    setFormError(null);
    setIsAddOpen(true);
  };

  const openEdit = (o: any) => {
    setForm({ nom: o.nom, description: o.description || "", prix: String(o.prix), type: o.type });
    setFormError(null);
    setEditOffre(o);
  };

  const handleSave = async () => {
    if (!form.nom || !form.prix) { setFormError("Nom et prix sont requis."); return; }
    setSaving(true);
    setFormError(null);
    try {
      if (editOffre) {
        await apiFetch(`/api/offres?id=${editOffre.id}`, {
          method: "PATCH",
          body: JSON.stringify({ nom: form.nom, description: form.description, prix: parseFloat(form.prix), type: form.type }),
        });
      } else {
        await apiFetch("/api/offres", {
          method: "POST",
          body: JSON.stringify({ nom: form.nom, description: form.description, prix: parseFloat(form.prix), type: form.type as any }),
        });
      }
      setIsAddOpen(false);
      setEditOffre(null);
      fetchOffres();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!deactivateOffre) return;
    setSaving(true);
    try {
      await apiFetch(`/api/offres?id=${deactivateOffre.id}`, {
        method: "PATCH",
        body: JSON.stringify({ estActif: !deactivateOffre.estActif }),
      });
      setDeactivateOffre(null);
      fetchOffres();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // KPI calculations
  const actives = offres.filter(o => o.estActif).length;
  const inactives = offres.filter(o => !o.estActif).length;
  const total = offres.length;
  const nouvelles = offres.filter(o => ["SIM_STANDARD", "SIM_INTERNET", "SIM_ETUDIANT", "SIM_ENTREPRISE"].includes(o.type)).length;
  const reactivations = offres.filter(o => o.type === "DEPOT").length;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh", flexDirection: "column", gap: 16 }}>
        <Loader2 size={32} style={{ color: "#1F0270", animation: "spin 1s linear infinite" }} />
        <span style={{ color: "#6B7280", fontWeight: 600 }}>Chargement des offres...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1F0270", margin: 0 }}>Offres</h1>
          <p style={{ color: "#6B7280", marginTop: 4, fontSize: 14 }}>Gestion des offres SIM</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={fetchOffres} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 40, borderRadius: 10, border: "1px solid #E5E7EB", background: "white", cursor: "pointer", fontSize: 14, color: "#374151" }}>
            <RefreshCcw size={16} /> Actualiser
          </button>
          <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 40, borderRadius: 10, background: "#1F0270", color: "white", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
            <Plus size={16} /> Ajouter une offre
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "14px 18px", color: "#991B1B", fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* KPIs dynamiques */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { icon: Tag, label: "Offres actives", value: actives, iconColor: "#166534", bg: "#DCFCE7" },
          { icon: Tag, label: "Offres inactives", value: inactives, iconColor: "#374151", bg: "#F3F4F6" },
          { icon: Plus, label: "Nouvelle SIM", value: nouvelles, iconColor: "#4338CA", bg: "#EEF2FF" },
          { icon: Plus, label: "Réactivation", value: reactivations, iconColor: "#92400E", bg: "#FEF3C7" },
        ].map((k, i) => (
          <div key={i} style={{ background: "white", borderRadius: 16, padding: "18px 22px", flex: 1, minWidth: 160, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ background: k.bg, borderRadius: 10, padding: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <k.icon size={20} style={{ color: k.iconColor }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4, fontWeight: 500 }}>{k.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#1F0270" }}>{k.value}</div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>{total > 0 ? `${Math.round(k.value / total * 100)}% des offres` : "—"}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
        {/* Table des offres */}
        <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5", overflow: "hidden" }}>
          {offres.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "#9CA3AF" }}>
              <Tag size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontWeight: 600 }}>Aucune offre enregistrée</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Cliquez sur "Ajouter une offre" pour commencer.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                  {["Offre", "Prix", "Type de service", "Statut", "Actions"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "14px 20px", fontSize: 12, color: "#6B7280", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {offres.map((o) => (
                  <tr key={o.id} style={{ borderBottom: "1px solid #F9FAFB", opacity: o.estActif ? 1 : 0.55 }}>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                          {TYPE_ICON[o.type] || "📋"}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{o.nom}</div>
                          <div style={{ fontSize: 12, color: "#6B7280", maxWidth: 200, lineHeight: 1.4 }}>{o.description || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}>
                      {o.prix.toLocaleString("fr-FR")} GNF
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{ background: "#EEF2FF", color: "#4338CA", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600, border: "1px solid #C7D2FE" }}>
                        {TYPE_LABEL[o.type] || o.type}
                      </span>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: o.estActif ? "#10B981" : "#EF4444" }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: o.estActif ? "#10B981" : "#EF4444" }}>
                          {o.estActif ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => openEdit(o)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, border: "1px solid #E5E7EB", background: "white", color: "#374151", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                          <Edit2 size={12} /> Modifier
                        </button>
                        <button onClick={() => setDeactivateOffre(o)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, border: o.estActif ? "1px solid #FEE2E2" : "1px solid #DCFCE7", background: "white", color: o.estActif ? "#DC2626" : "#166534", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                          <Power size={12} /> {o.estActif ? "Désactiver" : "Activer"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paramètres tarifaires */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 20px", fontSize: 15 }}>Paramètres tarifaires</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Devise</label>
              <select style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 13, color: "#111827", background: "white", cursor: "pointer" }}>
                <option>GNF - Franc Guinéen</option>
                <option>XOF - Franc CFA</option>
                <option>USD - Dollar US</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>TVA applicable</label>
              <input type="text" value="18 %" readOnly style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 13, color: "#111827", background: "#F9FAFB" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Format d'affichage</label>
              <input type="text" value="10 000 GNF" readOnly style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 13, color: "#111827", background: "#F9FAFB" }} />
            </div>
            <div style={{ background: "#FEF3C7", borderRadius: 8, padding: 12, border: "1px solid #FDE68A" }}>
              <div style={{ fontSize: 11, color: "#92400E" }}>Les paramètres tarifaires s'appliquent automatiquement à toutes les offres.</div>
            </div>
          </div>

          {/* Résumé DB */}
          <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 16px", fontSize: 15 }}>Récapitulatif</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Total des offres", value: total },
                { label: "Actives", value: actives },
                { label: "Inactives", value: inactives },
                { label: "Types Nouvelle SIM", value: nouvelles },
                { label: "Types Réactivation", value: reactivations },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#374151" }}>
                  <span>{r.label}</span>
                  <span style={{ fontWeight: 700, color: "#1F0270" }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Ajouter / Modifier */}
      <Modal isOpen={isAddOpen || !!editOffre} onClose={() => { setIsAddOpen(false); setEditOffre(null); }} title={editOffre ? "Modifier l'offre" : "Nouvelle offre"}>
        {formError && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: 12, color: "#991B1B", fontSize: 13 }}>{formError}</div>}
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Nom de l'offre *</label>
          <input type="text" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Ex: SIM + Internet 5Go" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 14, boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Description</label>
          <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Avantages de l'offre..." style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 14, resize: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Prix (GNF) *</label>
            <input type="number" value={form.prix} onChange={e => setForm(f => ({ ...f, prix: e.target.value }))} placeholder="Ex: 10000" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 14, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 14, background: "white", boxSizing: "border-box" }}>
              <option value="SIM_STANDARD">SIM Standard</option>
              <option value="SIM_INTERNET">SIM + Internet</option>
              <option value="SIM_ETUDIANT">SIM Étudiant</option>
              <option value="SIM_ENTREPRISE">SIM Entreprise</option>
              <option value="DEPOT">Réactivation</option>
              <option value="RECHARGE">Recharge</option>
              <option value="FORFAIT_PASS">Forfait Pass</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
          <button onClick={() => { setIsAddOpen(false); setEditOffre(null); }} style={{ flex: 1, padding: "12px", borderRadius: 8, background: "white", border: "1px solid #E5E7EB", color: "#374151", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: "12px", borderRadius: 8, background: "#1F0270", border: "none", color: "white", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle2 size={16} />}
            {editOffre ? "Enregistrer" : "Créer l'offre"}
          </button>
        </div>
      </Modal>

      {/* Modal Activer / Désactiver */}
      <Modal isOpen={!!deactivateOffre} onClose={() => setDeactivateOffre(null)} title={deactivateOffre?.estActif ? "Désactiver l'offre" : "Activer l'offre"}>
        <div style={{ background: deactivateOffre?.estActif ? "#FEE2E2" : "#DCFCE7", borderRadius: 8, padding: 16, display: "flex", gap: 12 }}>
          <Power size={24} color={deactivateOffre?.estActif ? "#DC2626" : "#166534"} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: deactivateOffre?.estActif ? "#991B1B" : "#166534" }}>
              Voulez-vous {deactivateOffre?.estActif ? "désactiver" : "activer"} « {deactivateOffre?.nom} » ?
            </div>
            <div style={{ fontSize: 12, color: deactivateOffre?.estActif ? "#B91C1C" : "#15803D", marginTop: 4 }}>
              {deactivateOffre?.estActif
                ? "Cette offre ne sera plus visible sur les bornes Kiosk ni sur la plateforme web."
                : "Cette offre sera à nouveau disponible pour les clients."}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
          <button onClick={() => setDeactivateOffre(null)} style={{ flex: 1, padding: "12px", borderRadius: 8, background: "white", border: "1px solid #E5E7EB", color: "#374151", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
          <button onClick={handleToggle} disabled={saving} style={{ flex: 1, padding: "12px", borderRadius: 8, background: deactivateOffre?.estActif ? "#DC2626" : "#166634", border: "none", color: "white", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Power size={16} /> {deactivateOffre?.estActif ? "Désactiver" : "Activer"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
