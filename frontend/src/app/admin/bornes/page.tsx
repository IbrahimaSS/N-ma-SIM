"use client";
import { useState, useEffect } from "react";
import { Loader2, RefreshCcw, AlertTriangle, Search, Plus, MonitorSmartphone, Settings, Power, Lock, UserCog, Signal, SignalHigh, WifiOff, Wrench, X, CheckCircle2, MapPin, Key, Copy } from "lucide-react";

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

const STATUT_LABELS: Record<string, string> = {
  EN_LIGNE: "En ligne",
  HORS_LIGNE: "Hors ligne",
  EN_MAINTENANCE: "En maintenance"
};

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, { bg: string; color: string; icon: any }> = {
    "EN_LIGNE": { bg: "#DCFCE7", color: "#166534", icon: SignalHigh },
    "HORS_LIGNE": { bg: "#FEE2E2", color: "#991B1B", icon: WifiOff },
    "EN_MAINTENANCE": { bg: "#FEF3C7", color: "#92400E", icon: Wrench },
  };
  const s = map[statut] || { bg: "#F3F4F6", color: "#374151", icon: Signal };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
      <s.icon size={12} /> {STATUT_LABELS[statut] || statut}
    </span>
  );
}

// Composant générique pour les Modals
function Modal({ isOpen, onClose, title, children }: any) {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 500, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#1F0270", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -15, right: -15, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,184,0,0.10)" }} />
          <div style={{ position: "absolute", bottom: -20, left: -10, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
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

export default function BornesKiosk() {
  const [search, setSearch] = useState("");
  const [bornes, setBornes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States pour les Modals
  const [isAddBorneOpen, setIsAddBorneOpen] = useState(false);
  const [borneConfig, setBorneConfig] = useState<any>(null);
  const [showMap, setShowMap] = useState(false);
  const [configIp, setConfigIp] = useState("");
  const [borneAssign, setBorneAssign] = useState<any>(null);
  const [borneLock, setBorneLock] = useState<any>(null);
  const [bornePower, setBornePower] = useState<any>(null);

  const [newBorneNom, setNewBorneNom] = useState("");
  const [newBorneEmplacement, setNewBorneEmplacement] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const [selectedTechnicien, setSelectedTechnicien] = useState("");

  const fetchBornes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/bornes");
      setBornes(data.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBornes();
  }, []);

  const filtered = bornes.filter(b =>
    (b.nom || "").toLowerCase().includes(search.toLowerCase()) ||
    (b.emplacement || "").toLowerCase().includes(search.toLowerCase()) ||
    (b.numeroReference || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleAction = (e: React.MouseEvent, type: string, borne: any) => {
    e.stopPropagation();
    if (type === "config") {
      setBorneConfig(borne);
      setConfigIp(borne.ip || "");
    }
    if (type === "assign") {
      setBorneAssign(borne);
      setSelectedTechnicien(borne.technicien !== "Non assigné" ? borne.technicien : "");
    }
    if (type === "lock") setBorneLock(borne);
    if (type === "power") setBornePower(borne);
  };

  const handleAddBorne = async () => {
    if (!newBorneNom || !newBorneEmplacement) {
      setError("Le nom et l'emplacement sont requis.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch("/api/bornes", {
        method: "POST",
        body: JSON.stringify({ nom: newBorneNom, emplacement: newBorneEmplacement })
      });
      setCreatedKey(res.data.cleActivation);
      await fetchBornes();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const updateBorne = async (id: string, data: any) => {
    setSaving(true);
    try {
      await apiFetch(`/api/bornes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data)
      });
      await fetchBornes();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleAssignTechnicien = async () => {
    if (!borneAssign) return;
    const success = await updateBorne(borneAssign.id, { technicien: selectedTechnicien || "Non assigné" });
    if (success) setBorneAssign(null);
  };

  const handleLockBorne = async (nouveauStatut: "HORS_LIGNE" | "EN_MAINTENANCE" = "HORS_LIGNE") => {
    if (!borneLock) return;
    const success = await updateBorne(borneLock.id, { statut: nouveauStatut });
    if (success) setBorneLock(null);
  };

  const handleSaveConfig = async () => {
    if (!borneConfig) return;
    const success = await updateBorne(borneConfig.id, { ip: configIp });
    if (success) {
      setBorneConfig(null);
      setConfigIp("");
    }
  };

  const handlePowerAction = async (action: "shutdown" | "reboot" | "start") => {
    if (!bornePower) return;
    const newStatut = action === "start" ? "EN_LIGNE" : "HORS_LIGNE";
    const success = await updateBorne(bornePower.id, { statut: newStatut });
    if (success) setBornePower(null);
  };

  const closeAll = () => {
    setIsAddBorneOpen(false);
    setBorneConfig(null);
    setShowMap(false);
    setBorneAssign(null);
    setBorneLock(null);
    setBornePower(null);
    setCreatedKey(null);
    setNewBorneNom("");
    setNewBorneEmplacement("");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh", flexDirection: "column", gap: 16 }}>
        <Loader2 size={32} style={{ color: "#1F0270", animation: "spin 1s linear infinite" }} />
        <span style={{ color: "#6B7280", fontWeight: 600 }}>Chargement des bornes...</span>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1F0270", margin: 0 }}>Bornes Kiosk</h1>
          <p style={{ color: "#6B7280", marginTop: 4, fontSize: 14 }}>Gestion du parc matériel et configuration</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une borne, lieu..." style={{ paddingLeft: 36, paddingRight: 16, height: 40, borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 14, outline: "none", width: 280, background: "white" }} />
          </div>
          <button onClick={fetchBornes} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 40, borderRadius: 10, border: "1px solid #E5E7EB", background: "white", cursor: "pointer", fontSize: 14, color: "#374151" }}>
            <RefreshCcw size={16} /> Actualiser
          </button>
          <button onClick={() => setIsAddBorneOpen(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 40, borderRadius: 10, background: "#1F0270", color: "white", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
            <Plus size={16} /> Ajouter une borne
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "14px 18px", color: "#991B1B", fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { icon: MonitorSmartphone, label: "Total Bornes", value: bornes.length, sub: "Parc actif", bg: "#EEF2FF", color: "#4F46E5" },
          { icon: SignalHigh, label: "En ligne", value: bornes.filter(b=>b.statut==="EN_LIGNE").length, sub: "Actives", bg: "#DCFCE7", color: "#059669" },
          { icon: WifiOff, label: "Hors ligne", value: bornes.filter(b=>b.statut==="HORS_LIGNE").length, sub: "Nécessite attention", bg: "#FEE2E2", color: "#DC2626" },
          { icon: Wrench, label: "En maintenance", value: bornes.filter(b=>b.statut==="EN_MAINTENANCE").length, sub: "Intervention en cours", bg: "#FEF3C7", color: "#D97706" },
        ].map((k, i) => (
          <div key={i} style={{ background: "white", borderRadius: 16, padding: "18px 22px", flex: 1, minWidth: 160, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ background: k.bg, borderRadius: 10, padding: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <k.icon size={18} style={{ color: k.color }} />
              </div>
              <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{k.label}</div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#1F0270" }}>{k.value}</div>
            <div style={{ fontSize: 11, color: "#9CA3AF" }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
              {["ID & Nom", "Emplacement", "Statut", "Réseau / IP", "Dernière synchro", "Technicien", "Actions"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "14px 20px", fontSize: 12, color: "#6B7280", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} style={{ borderBottom: "1px solid #F9FAFB", opacity: b.statut === "HORS_LIGNE" ? 0.7 : 1 }}>
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#4F46E5", flexShrink: 0 }}>
                      <MonitorSmartphone size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{b.nom}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "monospace" }}>{b.numeroReference || b.id.substring(0,8)}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 20px", fontSize: 13, color: "#374151" }}>{b.emplacement}</td>
                <td style={{ padding: "14px 20px" }}><StatutBadge statut={b.statut} /></td>
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ fontSize: 12, color: "#374151", fontFamily: "monospace" }}>{b.ip || "—"}</div>
                </td>
                <td style={{ padding: "14px 20px", fontSize: 12, color: "#6B7280" }}>{b.derniereSynchro ? new Date(b.derniereSynchro).toLocaleDateString('fr-FR') : "Jamais"}</td>
                <td style={{ padding: "14px 20px" }}>
                  {!b.technicien || b.technicien === "Non assigné" ? (
                    <span style={{ color: "#9CA3AF", fontSize: 12, fontStyle: "italic", display: "inline-block", background: "#F3F4F6", padding: "2px 8px", borderRadius: 12 }}>Non assigné</span>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#4F46E5" }}>
                        {b.technicien.charAt(0)}
                      </div>
                      <span style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>{b.technicien}</span>
                    </div>
                  )}
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={(e) => handleAction(e, "config", b)} title="Paramétrer" style={{ width: 32, height: 32, background: "white", border: "1px solid #E5E7EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#4B5563", transition: "all 0.2s" }}>
                      <Settings size={14} />
                    </button>
                    <button onClick={(e) => handleAction(e, "assign", b)} title="Affecter un technicien" style={{ width: 32, height: 32, background: "white", border: "1px solid #E5E7EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#4F46E5", transition: "all 0.2s" }}>
                      <UserCog size={14} />
                    </button>
                    <button onClick={(e) => handleAction(e, "lock", b)} title="Verrouiller l'écran" style={{ width: 32, height: 32, background: "white", border: "1px solid #E5E7EB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#D97706", transition: "all 0.2s" }}>
                      <Lock size={14} />
                    </button>
                    <button onClick={(e) => handleAction(e, "power", b)} title="Éteindre / Redémarrer" style={{ width: 32, height: 32, background: "white", border: "1px solid #FCA5A5", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#DC2626", transition: "all 0.2s" }}>
                      <Power size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #F3F4F6" }}>
          <span style={{ fontSize: 13, color: "#6B7280" }}>Affichage de {filtered.length} borne(s)</span>
        </div>
      </div>

      {/* --- MODALS --- */}
      
      {/* Ajouter Borne */}
      <Modal isOpen={isAddBorneOpen} onClose={closeAll} title="Ajouter une nouvelle borne">
        <div style={{ marginBottom: 4, fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>
          Renseignez les informations de la nouvelle borne pour générer sa clé d'activation sécurisée.
        </div>
        
        <div style={{ background: "white", padding: 16, borderRadius: 12, border: "1px solid #EAECF5", boxShadow: "0 2px 10px rgba(31,2,112,0.05)", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1F0270", marginBottom: 6 }}>Nom de la borne</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <MonitorSmartphone size={18} color="#9CA3AF" style={{ position: "absolute", left: 12 }} />
              <input type="text" value={newBorneNom} onChange={e=>setNewBorneNom(e.target.value)} placeholder="Ex: Borne Agence Madina" style={{ width: "100%", padding: "12px 12px 12px 38px", borderRadius: 10, border: "1px solid #E5E7EB", outline: "none", fontSize: 14, background: "#F9FAFB", transition: "all 0.2s" }} onFocus={(e) => { e.target.style.background = "white"; e.target.style.borderColor = "#4F46E5"; e.target.style.boxShadow = "0 0 0 3px rgba(79, 70, 229, 0.1)"; }} onBlur={(e) => { e.target.style.background = "#F9FAFB"; e.target.style.borderColor = "#E5E7EB"; e.target.style.boxShadow = "none"; }} />
            </div>
          </div>
          
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#1F0270", marginBottom: 6 }}>Emplacement (Adresse / Lieu)</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <MapPin size={18} color="#9CA3AF" style={{ position: "absolute", left: 12 }} />
              <input type="text" value={newBorneEmplacement} onChange={e=>setNewBorneEmplacement(e.target.value)} placeholder="Ex: Marché Madina, Conakry" style={{ width: "100%", padding: "12px 12px 12px 38px", borderRadius: 10, border: "1px solid #E5E7EB", outline: "none", fontSize: 14, background: "#F9FAFB", transition: "all 0.2s" }} onFocus={(e) => { e.target.style.background = "white"; e.target.style.borderColor = "#4F46E5"; e.target.style.boxShadow = "0 0 0 3px rgba(79, 70, 229, 0.1)"; }} onBlur={(e) => { e.target.style.background = "#F9FAFB"; e.target.style.borderColor = "#E5E7EB"; e.target.style.boxShadow = "none"; }} />
            </div>
          </div>
        </div>
        
        {createdKey && (
          <div style={{ background: "#EEF2FF", borderRadius: 12, padding: 16, border: "1px dashed #C7D2FE", marginTop: 4 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#4338CA", marginBottom: 8 }}>
              <Key size={16} /> Clé d'activation (Token)
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="text" readOnly value={createdKey} style={{ flex: 1, padding: "12px", borderRadius: 8, border: "1px solid #C7D2FE", outline: "none", fontSize: 15, background: "white", fontFamily: "monospace", color: "#312E81", fontWeight: 700, letterSpacing: 1 }} />
              <button onClick={() => navigator.clipboard.writeText(createdKey)} title="Copier la clé" style={{ width: 44, height: 44, background: "#4F46E5", border: "none", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "white", cursor: "pointer", flexShrink: 0, boxShadow: "0 2px 4px rgba(79,70,229,0.3)" }}>
                <Copy size={18} />
              </button>
            </div>
            <p style={{ fontSize: 11, color: "#6366F1", marginTop: 8, margin: "8px 0 0 0", lineHeight: 1.4 }}>
              Veuillez copier cette clé. Elle sera requise pour associer physiquement la borne au système lors de son premier démarrage.
            </p>
          </div>
        )}
        
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <button onClick={closeAll} style={{ flex: 1, padding: "14px", borderRadius: 10, background: "white", border: "1px solid #E5E7EB", color: "#374151", fontWeight: 600, cursor: "pointer", fontSize: 14, transition: "all 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "#F9FAFB"} onMouseOut={(e) => e.currentTarget.style.background = "white"}>{createdKey ? "Fermer" : "Annuler"}</button>
          {!createdKey && (
            <button onClick={handleAddBorne} disabled={saving} style={{ flex: 1, padding: "14px", borderRadius: 10, background: "#1F0270", border: "none", color: "white", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14, opacity: saving ? 0.7 : 1 }}>
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Créer la borne
            </button>
          )}
        </div>
      </Modal>

      {/* Configurer Borne / Vue Carte */}
      <Modal isOpen={!!borneConfig} onClose={closeAll} title={showMap ? `Localisation - ${borneConfig?.nom}` : `Paramètres - ${borneConfig?.nom}`}>
        {showMap ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
             <div style={{ width: "100%", height: 350, borderRadius: 12, overflow: "hidden", position: "relative", background: "#E5E7EB" }}>
               {/* Iframe Google Maps centrée sur Conakry avec overlay pour empêcher le clic */}
               <div style={{ position: "absolute", inset: 0, zIndex: 10 }}></div>
               <iframe 
                 width="100%" 
                 height="100%" 
                 frameBorder="0" 
                 style={{ border: 0, opacity: 0.8 }} 
                 src={`https://maps.google.com/maps?q=${encodeURIComponent(borneConfig?.emplacement + ", Conakry")}&t=&z=15&ie=UTF8&iwloc=&output=embed`} 
                 allowFullScreen 
               />
               
               {/* Icône personnalisée de la borne (Jaune et Bleu) */}
               <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -100%)", zIndex: 20, display: "flex", flexDirection: "column", alignItems: "center" }}>
                 <div style={{ background: "#FFB800", padding: "10px", borderRadius: "50%", boxShadow: "0 4px 12px rgba(0,0,0,0.3)", border: "3px solid white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                   <MonitorSmartphone size={24} color="#1F0270" />
                 </div>
                 <div style={{ width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: "10px solid white", marginTop: "-2px" }}></div>
               </div>
               
               {/* Popup d'info sur la carte */}
               <div style={{ position: "absolute", bottom: 16, left: 16, right: 16, background: "white", padding: "12px 16px", borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 20, display: "flex", alignItems: "center", gap: 12 }}>
                 <div style={{ background: "#EEF2FF", padding: 8, borderRadius: 8 }}><MapPin size={18} color="#4F46E5" /></div>
                 <div>
                   <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{borneConfig?.nom}</div>
                   <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{borneConfig?.emplacement}</div>
                 </div>
               </div>
             </div>
             <button onClick={() => setShowMap(false)} style={{ width: "100%", padding: "12px", borderRadius: 8, background: "white", border: "1px solid #E5E7EB", color: "#374151", fontWeight: 600, cursor: "pointer" }}>Retour aux paramètres</button>
          </div>
        ) : (
          <>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Adresse IP</label>
              <input type="text" value={configIp} onChange={(e) => setConfigIp(e.target.value)} placeholder="Ex: 192.168.1.10" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 14, fontFamily: "monospace" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #F3F4F6" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Mode économie d'énergie</div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>Éteindre l'écran après 5 min d'inactivité</div>
              </div>
              <div style={{ width: 44, height: 24, background: "#1F0270", borderRadius: 12, position: "relative", cursor: "pointer" }}>
                <div style={{ width: 20, height: 20, background: "white", borderRadius: "50%", position: "absolute", top: 2, right: 2 }} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Mises à jour auto</div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>Télécharger le logiciel automatiquement</div>
              </div>
              <div style={{ width: 44, height: 24, background: "#1F0270", borderRadius: 12, position: "relative", cursor: "pointer" }}>
                <div style={{ width: 20, height: 20, background: "white", borderRadius: "50%", position: "absolute", top: 2, right: 2 }} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #F3F4F6", borderTop: "1px solid #F3F4F6" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Localisation GPS</div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>{borneConfig?.emplacement}</div>
              </div>
              <button onClick={() => setShowMap(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 8, background: "#EEF2FF", border: "none", color: "#4F46E5", fontWeight: 600, cursor: "pointer", fontSize: 12 }}>
                <MapPin size={14} /> Voir sur la carte
              </button>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              <button onClick={closeAll} style={{ flex: 1, padding: "12px", borderRadius: 8, background: "white", border: "1px solid #E5E7EB", color: "#374151", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>Annuler</button>
              <button onClick={handleSaveConfig} disabled={saving} style={{ flex: 1, padding: "12px", borderRadius: 8, background: "#1F0270", border: "none", color: "white", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : "Enregistrer"}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Affecter Technicien */}
      <Modal isOpen={!!borneAssign} onClose={closeAll} title={`Affectation - ${borneAssign?.nom}`}>
        <p style={{ fontSize: 13, color: "#4B5563", marginBottom: 10, lineHeight: 1.5 }}>
          Sélectionnez un technicien responsable de la maintenance et du suivi de cette borne.
        </p>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Technicien assigné</label>
          <select value={selectedTechnicien} onChange={e => setSelectedTechnicien(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 14, background: "white" }}>
            <option value="">Sélectionner un technicien...</option>
            <option value="Ahmed Diallo">Ahmed Diallo</option>
            <option value="Sekou Touré">Sekou Touré</option>
            <option value="Mamadou Sylla">Mamadou Sylla</option>
          </select>
        </div>
        <button onClick={handleAssignTechnicien} disabled={saving} style={{ width: "100%", marginTop: 12, padding: "12px", borderRadius: 8, background: "#1F0270", border: "none", color: "white", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : "Affecter"}
        </button>
      </Modal>

      {/* Verrouiller Borne */}
      <Modal isOpen={!!borneLock} onClose={closeAll} title="Verrouillage / Maintenance">
        <div style={{ background: "#FEF3C7", borderRadius: 8, padding: 16, display: "flex", gap: 12 }}>
          <Lock size={24} color="#D97706" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#92400E" }}>Changer le statut de "{borneLock?.nom}" ?</div>
            <div style={{ fontSize: 12, color: "#B45309", marginTop: 4 }}>L'écran de la borne affichera "Hors service" ou "En maintenance". Les clients ne pourront plus l'utiliser.</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          <button onClick={() => handleLockBorne("HORS_LIGNE")} disabled={saving} style={{ width: "100%", padding: "12px", borderRadius: 8, background: "white", border: "1px solid #FCA5A5", color: "#DC2626", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />} Mettre Hors Ligne
          </button>
          <button onClick={() => handleLockBorne("EN_MAINTENANCE")} disabled={saving} style={{ width: "100%", padding: "12px", borderRadius: 8, background: "white", border: "1px solid #FDE68A", color: "#D97706", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Wrench size={16} />} Mettre en Maintenance
          </button>
          <button onClick={closeAll} style={{ width: "100%", padding: "12px", borderRadius: 8, background: "transparent", border: "none", color: "#6B7280", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
        </div>
      </Modal>

      {/* Éteindre / Allumer Borne */}
      <Modal isOpen={!!bornePower} onClose={closeAll} title="Gestion de l'alimentation">
        {bornePower?.statut === "HORS_LIGNE" ? (
          // Borne éteinte → proposer d'allumer
          <>
            <div style={{ background: "#DCFCE7", borderRadius: 8, padding: 16, display: "flex", gap: 12 }}>
              <Power size={24} color="#166534" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#166534" }}>Allumer "{bornePower?.nom}" ?</div>
                <div style={{ fontSize: 12, color: "#15803D", marginTop: 4 }}>La borne sera remise en ligne et disponible pour les clients.</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
              <button onClick={() => handlePowerAction("start")} disabled={saving} style={{ width: "100%", padding: "12px", borderRadius: 8, background: "#166534", border: "none", color: "white", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />} ⚡ Allumer la borne
              </button>
              <button onClick={closeAll} style={{ width: "100%", padding: "12px", borderRadius: 8, background: "transparent", border: "none", color: "#6B7280", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
            </div>
          </>
        ) : (
          // Borne allumée → proposer d'éteindre ou redémarrer
          <>
            <div style={{ background: "#FEE2E2", borderRadius: 8, padding: 16, display: "flex", gap: 12 }}>
              <Power size={24} color="#DC2626" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#991B1B" }}>Action critique sur "{bornePower?.nom}"</div>
                <div style={{ fontSize: 12, color: "#B91C1C", marginTop: 4 }}>Vous êtes sur le point d'éteindre ou redémarrer cette borne à distance. Si une transaction est en cours, elle sera annulée.</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
              <button onClick={() => handlePowerAction("shutdown")} disabled={saving} style={{ width: "100%", padding: "12px", borderRadius: 8, background: "white", border: "1px solid #FCA5A5", color: "#DC2626", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />} Éteindre (Shutdown)
              </button>
              <button onClick={() => handlePowerAction("reboot")} disabled={saving} style={{ width: "100%", padding: "12px", borderRadius: 8, background: "white", border: "1px solid #C7D2FE", color: "#4F46E5", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <>🔄 Redémarrer (Reboot)</>}
              </button>
              <button onClick={closeAll} style={{ width: "100%", padding: "12px", borderRadius: 8, background: "transparent", border: "none", color: "#6B7280", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
