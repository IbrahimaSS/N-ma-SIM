"use client";
import { useState } from "react";
import { Search, Plus, MonitorSmartphone, Settings, Power, Lock, UserCog, Signal, SignalHigh, WifiOff, Wrench, X, CheckCircle2 } from "lucide-react";
import { MOCK_BORNES } from "@/data/admin-mock-data";

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, { bg: string; color: string; icon: any }> = {
    "En ligne": { bg: "#DCFCE7", color: "#166534", icon: SignalHigh },
    "Hors ligne": { bg: "#FEE2E2", color: "#991B1B", icon: WifiOff },
    "En maintenance": { bg: "#FEF3C7", color: "#92400E", icon: Wrench },
  };
  const s = map[statut] || { bg: "#F3F4F6", color: "#374151", icon: Signal };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
      <s.icon size={12} /> {statut}
    </span>
  );
}

// Composant générique pour les Modals
function Modal({ isOpen, onClose, title, children }: any) {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 500, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F9FAFB" }}>
          <h3 style={{ fontWeight: 700, color: "#1F0270", margin: 0, fontSize: 18 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", display: "flex" }}><X size={20} /></button>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function BornesKiosk() {
  const [search, setSearch] = useState("");
  const [bornes, setBornes] = useState(MOCK_BORNES);

  // States pour les Modals
  const [isAddBorneOpen, setIsAddBorneOpen] = useState(false);
  const [borneConfig, setBorneConfig] = useState<any>(null);
  const [borneAssign, setBorneAssign] = useState<any>(null);
  const [borneLock, setBorneLock] = useState<any>(null);
  const [bornePower, setBornePower] = useState<any>(null);

  const filtered = bornes.filter(b =>
    b.nom.toLowerCase().includes(search.toLowerCase()) ||
    b.emplacement.toLowerCase().includes(search.toLowerCase())
  );

  const handleAction = (e: React.MouseEvent, type: string, borne: any) => {
    e.stopPropagation();
    if (type === "config") setBorneConfig(borne);
    if (type === "assign") setBorneAssign(borne);
    if (type === "lock") setBorneLock(borne);
    if (type === "power") setBornePower(borne);
  };

  const notifySuccess = () => {
    // Dans la réalité, on utiliserait un toast. Ici on ferme juste la modale.
    setIsAddBorneOpen(false);
    setBorneConfig(null);
    setBorneAssign(null);
    setBorneLock(null);
    setBornePower(null);
  };

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
          <button onClick={() => setIsAddBorneOpen(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 40, borderRadius: 10, background: "#1F0270", color: "white", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
            <Plus size={16} /> Ajouter une borne
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { icon: MonitorSmartphone, label: "Total Bornes", value: bornes.length, sub: "Parc actif", bg: "#EEF2FF", color: "#4F46E5" },
          { icon: SignalHigh, label: "En ligne", value: bornes.filter(b=>b.statut==="En ligne").length, sub: "Actives", bg: "#DCFCE7", color: "#059669" },
          { icon: WifiOff, label: "Hors ligne", value: bornes.filter(b=>b.statut==="Hors ligne").length, sub: "Nécessite attention", bg: "#FEE2E2", color: "#DC2626" },
          { icon: Wrench, label: "En maintenance", value: bornes.filter(b=>b.statut==="En maintenance").length, sub: "Intervention en cours", bg: "#FEF3C7", color: "#D97706" },
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
              <tr key={b.id} style={{ borderBottom: "1px solid #F9FAFB", opacity: b.statut === "Hors ligne" ? 0.7 : 1 }}>
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#4F46E5", flexShrink: 0 }}>
                      <MonitorSmartphone size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{b.nom}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "monospace" }}>{b.id}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 20px", fontSize: 13, color: "#374151" }}>{b.emplacement}</td>
                <td style={{ padding: "14px 20px" }}><StatutBadge statut={b.statut} /></td>
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ fontSize: 12, color: "#374151", fontFamily: "monospace" }}>{b.ip}</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF" }}>{b.version}</div>
                </td>
                <td style={{ padding: "14px 20px", fontSize: 12, color: "#6B7280" }}>{b.derniereSynchro}</td>
                <td style={{ padding: "14px 20px" }}>
                  {b.technicien === "Non assigné" ? (
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
      <Modal isOpen={isAddBorneOpen} onClose={() => setIsAddBorneOpen(false)} title="Ajouter une nouvelle borne">
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Nom de la borne</label>
          <input type="text" placeholder="Ex: Borne Agence Madina" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 14 }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Emplacement (Adresse / Lieu)</label>
          <input type="text" placeholder="Ex: Marché Madina, Conakry" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 14 }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Clé d'activation (Token)</label>
          <input type="text" readOnly value="TKN-8F49-B2C1-90X7" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 14, background: "#F9FAFB", fontFamily: "monospace", color: "#4F46E5", fontWeight: 600 }} />
          <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>Utilisez cette clé pour enregistrer la borne lors de son premier allumage.</p>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <button onClick={() => setIsAddBorneOpen(false)} style={{ flex: 1, padding: "12px", borderRadius: 8, background: "white", border: "1px solid #E5E7EB", color: "#374151", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
          <button onClick={notifySuccess} style={{ flex: 1, padding: "12px", borderRadius: 8, background: "#1F0270", border: "none", color: "white", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Plus size={16} /> Créer la borne</button>
        </div>
      </Modal>

      {/* Configurer Borne */}
      <Modal isOpen={!!borneConfig} onClose={() => setBorneConfig(null)} title={`Paramètres - ${borneConfig?.nom}`}>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Adresse IP</label>
          <input type="text" defaultValue={borneConfig?.ip} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 14, fontFamily: "monospace" }} />
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
        <button onClick={notifySuccess} style={{ width: "100%", marginTop: 12, padding: "12px", borderRadius: 8, background: "#1F0270", border: "none", color: "white", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>Enregistrer</button>
      </Modal>

      {/* Affecter Technicien */}
      <Modal isOpen={!!borneAssign} onClose={() => setBorneAssign(null)} title={`Affectation - ${borneAssign?.nom}`}>
        <p style={{ fontSize: 13, color: "#4B5563", marginBottom: 10, lineHeight: 1.5 }}>
          Sélectionnez un technicien responsable de la maintenance et du suivi de cette borne.
        </p>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Technicien assigné</label>
          <select defaultValue={borneAssign?.technicien !== "Non assigné" ? borneAssign?.technicien : ""} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 14, background: "white" }}>
            <option value="">Sélectionner un technicien...</option>
            <option value="Ahmed Diallo">Ahmed Diallo</option>
            <option value="Sekou Touré">Sekou Touré</option>
            <option value="Mamadou Sylla">Mamadou Sylla</option>
          </select>
        </div>
        <button onClick={notifySuccess} style={{ width: "100%", marginTop: 12, padding: "12px", borderRadius: 8, background: "#1F0270", border: "none", color: "white", fontWeight: 600, cursor: "pointer" }}>Affecter</button>
      </Modal>

      {/* Verrouiller Borne */}
      <Modal isOpen={!!borneLock} onClose={() => setBorneLock(null)} title="Verrouillage à distance">
        <div style={{ background: "#FEF3C7", borderRadius: 8, padding: 16, display: "flex", gap: 12 }}>
          <Lock size={24} color="#D97706" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#92400E" }}>Voulez-vous vraiment verrouiller "{borneLock?.nom}" ?</div>
            <div style={{ fontSize: 12, color: "#B45309", marginTop: 4 }}>L'écran de la borne affichera "Hors service". Les clients ne pourront plus l'utiliser jusqu'à son déverrouillage manuel.</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <button onClick={() => setBorneLock(null)} style={{ flex: 1, padding: "12px", borderRadius: 8, background: "white", border: "1px solid #E5E7EB", color: "#374151", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
          <button onClick={notifySuccess} style={{ flex: 1, padding: "12px", borderRadius: 8, background: "#D97706", border: "none", color: "white", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Lock size={16} /> Verrouiller la borne</button>
        </div>
      </Modal>

      {/* Éteindre Borne */}
      <Modal isOpen={!!bornePower} onClose={() => setBornePower(null)} title="Gestion de l'alimentation">
        <div style={{ background: "#FEE2E2", borderRadius: 8, padding: 16, display: "flex", gap: 12 }}>
          <Power size={24} color="#DC2626" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#991B1B" }}>Action critique sur "{bornePower?.nom}"</div>
            <div style={{ fontSize: 12, color: "#B91C1C", marginTop: 4 }}>Vous êtes sur le point d'éteindre ou redémarrer cette borne à distance. Si une transaction est en cours, elle sera annulée.</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          <button onClick={notifySuccess} style={{ width: "100%", padding: "12px", borderRadius: 8, background: "white", border: "1px solid #FCA5A5", color: "#DC2626", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Power size={16} /> Éteindre (Shutdown)</button>
          <button onClick={notifySuccess} style={{ width: "100%", padding: "12px", borderRadius: 8, background: "white", border: "1px solid #C7D2FE", color: "#4F46E5", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>🔄 Redémarrer (Reboot)</button>
          <button onClick={() => setBornePower(null)} style={{ width: "100%", padding: "12px", borderRadius: 8, background: "transparent", border: "none", color: "#6B7280", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
        </div>
      </Modal>
    </div>
  );
}
