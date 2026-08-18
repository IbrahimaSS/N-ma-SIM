"use client";
import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, Eye, X, Download, Loader2, RefreshCcw } from "lucide-react";

// Helpers
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const s = localStorage.getItem("admin_session");
  if (!s) return null;
  return JSON.parse(s).token ?? null;
}

// Composant générique pour les Modals
function Modal({ isOpen, onClose, title, customUI, children }: any) {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: customUI ? "transparent" : "white", borderRadius: customUI ? 24 : 16, width: "100%", maxWidth: 480, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: customUI ? "none" : "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)" }} onClick={e => e.stopPropagation()}>
        {!customUI && (
          <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#1F0270", position: "relative", overflow: "hidden" }}>
            <h3 style={{ fontWeight: 700, color: "white", margin: 0, fontSize: 18, position: "relative", zIndex: 1 }}>{title}</h3>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", color: "white", display: "flex", padding: 7, borderRadius: 8, position: "relative", zIndex: 1 }}><X size={18} /></button>
          </div>
        )}
        <div style={customUI ? { width: "100%", overflowY: "auto", maxHeight: "90vh" } : { padding: 24, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

const BACKEND = "http://localhost:3001";

export default function Clients() {
  const token = getToken();
  
  const [clients, setClients] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, residents: 0, etrangers: 0, valides: 0 });
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedModalClient, setSelectedModalClient] = useState<any>(null);

  const fetchClients = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      // Fetch clients list
      const res = await fetch(`${BACKEND}/api/clients?search=${encodeURIComponent(search)}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Erreur lors du chargement des clients");
      
      setClients(data.data.clients || []);
      
      // Update stats based on all clients (in a real app, this might be a separate API call)
      const resAll = await fetch(`${BACKEND}/api/clients?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataAll = await resAll.json();
      const allClients = dataAll.data.clients || [];
      
      setStats({
        total: allClients.length,
        residents: allClients.filter((c: any) => c.typeClient === 'RESIDENT').length,
        etrangers: allClients.filter((c: any) => c.typeClient === 'ETRANGER').length,
        valides: allClients.filter((c: any) => c.statut === 'VALIDE' || c.statut === 'VALIDEE').length
      });
      
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [token, search]); // Refetch when search changes

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1F0270", margin: 0 }}>Clients</h1>
          <p style={{ color: "#6B7280", marginTop: 4, fontSize: 14 }}>Base clients et profils</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Rechercher un client, nom, numéro..." 
              style={{ paddingLeft: 36, paddingRight: 16, height: 40, borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 14, outline: "none", width: 300, background: "white" }} 
            />
          </div>
          <button onClick={fetchClients} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 40, borderRadius: 10, border: "1px solid #E5E7EB", background: "white", cursor: "pointer", fontSize: 14, color: "#374151" }}>
             <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} /> Actualiser
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 40, borderRadius: 10, border: "1px solid #E5E7EB", background: "white", cursor: "pointer", fontSize: 14, color: "#374151" }}>
            <SlidersHorizontal size={16} /> Filtrer
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Total clients", value: stats.total.toString(), subColor: "#D97706" },
          { label: "Résidents", value: stats.residents.toString(), subColor: "#059669" },
          { label: "Étrangers", value: stats.etrangers.toString(), subColor: "#059669" },
          { label: "Validés", value: stats.valides.toString(), subColor: "#059669" },
        ].map(k => (
          <div key={k.label} style={{ background: "white", borderRadius: 16, padding: "18px 22px", flex: 1, minWidth: 160, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 8, fontWeight: 500 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#1F0270" }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        {/* Table */}
        <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5", overflow: "hidden" }}>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12">
               <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
               <p className="text-text-muted">Chargement des clients...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : clients.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucun client trouvé.</div>
          ) : (
            <>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                    {["Client", "Type", "Type de pièce", "Numéro de pièce", "Téléphone", "Statut", "Inscrit le", "Action"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "14px 12px", fontSize: 12, color: "#6B7280", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid #F9FAFB" }}>
                      <td style={{ padding: "13px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#4F46E5", flexShrink: 0 }}>
                            {c.nom.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{c.prenom} {c.nom}</div>
                            <div style={{ fontSize: 11, color: "#9CA3AF" }}>{c.id.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "13px 12px" }}>
                        <span style={{ background: "#EEF2FF", color: "#4338CA", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>{c.typeClient}</span>
                      </td>
                      <td style={{ padding: "13px 12px", fontSize: 13, color: "#374151" }}>{c.typePiece || '-'}</td>
                      <td style={{ padding: "13px 12px", fontSize: 12, color: "#6B7280", fontFamily: "monospace" }}>{c.numeroPiece || '-'}</td>
                      <td style={{ padding: "13px 12px", fontSize: 13, color: "#374151" }}>{c.telephone || '-'}</td>
                      <td style={{ padding: "13px 12px" }}>
                        <span style={{ background: c.statut === "VALIDE" || c.statut === "VALIDEE" ? "#DCFCE7" : c.statut === "REJETE" ? "#FEE2E2" : "#FEF3C7", color: c.statut === "VALIDE" || c.statut === "VALIDEE" ? "#166534" : c.statut === "REJETE" ? "#991B1B" : "#92400E", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>
                          {c.statut.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: "13px 12px", fontSize: 12, color: "#9CA3AF" }}>{new Date(c.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td style={{ padding: "13px 12px" }}>
                        <button onClick={() => setSelectedModalClient(c)} style={{ background: "#EEF2FF", border: "none", borderRadius: 8, padding: "7px 10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#E0E7FF"} onMouseOut={e => e.currentTarget.style.background = "#EEF2FF"}>
                          <Eye size={15} style={{ color: "#4F46E5" }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #F3F4F6" }}>
                <span style={{ fontSize: 13, color: "#6B7280" }}>Affichage 1 à {clients.length} sur {stats.total} clients</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Détails Client */}
      <Modal isOpen={!!selectedModalClient} onClose={() => setSelectedModalClient(null)} customUI>
        {selectedModalClient && (
          <div style={{ background: "#F8F9FC", width: "100%", overflow: "hidden", position: "relative" }}>
            {/* Header Section */}
            <div style={{ background: "#1F0270", padding: "24px 24px 48px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,184,0,0.10)" }} />
              <div style={{ position: "absolute", top: 20, right: 20, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,184,0,0.07)" }} />
              <div style={{ position: "absolute", bottom: -10, left: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 10 }}>
                <div>
                  <h2 style={{ margin: 0, color: "#FFB800", fontSize: 22, fontWeight: 800 }}>Détail Client</h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <span style={{ color: "#9CA3AF", fontSize: 13, fontFamily: "monospace" }}>{selectedModalClient.id}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedModalClient(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "white", cursor: "pointer" }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body Content */}
            <div style={{ padding: "0 24px 24px", marginTop: -32, position: "relative", zIndex: 20 }}>
              
              {/* Profile Card */}
              <div style={{ background: "white", borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FF6600", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "white", flexShrink: 0 }}>
                  {selectedModalClient.nom.substring(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#1F0270" }}>{selectedModalClient.prenom} {selectedModalClient.nom}</div>
                  <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{selectedModalClient.telephone || '-'}</div>
                  <div style={{ fontSize: 13, color: "#6B7280" }}>{selectedModalClient.nationalite || 'Guinéenne'}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                  <span style={{ background: "#DCFCE7", color: "#166534", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>{selectedModalClient.typeClient}</span>
                  <span style={{ background: "#EEF2FF", color: "#4338CA", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>KYC {selectedModalClient.statut}</span>
                </div>
              </div>

              {/* PIÈCE D'IDENTITÉ */}
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16, display: "flex", alignItems: "center" }}>
                  Pièce d'identité
                  <div style={{ flex: 1, height: 1, background: "#E5E7EB", marginLeft: 12 }}></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #EAECF5" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>Type de pièce</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1F0270" }}>{selectedModalClient.typePiece || '-'}</div>
                  </div>
                  <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #EAECF5" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>Numéro de pièce</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1F0270" }}>{selectedModalClient.numeroPiece || '-'}</div>
                  </div>
                  <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #EAECF5" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>Date de naissance</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1F0270" }}>{selectedModalClient.dateNaissance ? new Date(selectedModalClient.dateNaissance).toLocaleDateString('fr-FR') : '-'}</div>
                  </div>
                  <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #EAECF5" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", marginBottom: 4 }}>Enregistré le</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1F0270" }}>{new Date(selectedModalClient.createdAt).toLocaleDateString('fr-FR')}</div>
                  </div>
                </div>
              </div>

              {/* HISTORIQUE DES DEMANDES */}
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16, display: "flex", alignItems: "center" }}>
                  Historique des demandes
                  <div style={{ flex: 1, height: 1, background: "#E5E7EB", marginLeft: 12 }}></div>
                </div>
                <div style={{ background: "white", borderRadius: 16, border: "1px solid #EAECF5", padding: "8px 0" }}>
                  {selectedModalClient.demandes && selectedModalClient.demandes.length > 0 ? (
                    selectedModalClient.demandes.map((h: any, i: number, arr: any[]) => (
                      <div key={h.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: i === arr.length - 1 ? "none" : "1px dashed #E5E7EB" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: h.statut === "VALIDEE" ? "#10B981" : "#F59E0B" }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "#1F0270" }}>{h.id.substring(0, 10)}...</div>
                            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{h.type}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          <span style={{ background: h.statut === "VALIDEE" ? "#DCFCE7" : "#FEF3C7", color: h.statut === "VALIDEE" ? "#166534" : "#92400E", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>
                            {h.statut.replace(/_/g, ' ')}
                          </span>
                          <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "right", minWidth: 60 }}>
                            {new Date(h.createdAt).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "16px", textAlign: "center", color: "#6B7280", fontSize: 13 }}>Aucune demande enregistrée.</div>
                  )}
                </div>
              </div>

              {/* ACTIONS */}
              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                <button onClick={() => setSelectedModalClient(null)} style={{ flex: 1, background: "#FFB800", color: "#111827", padding: "14px", borderRadius: 12, border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <X size={16} /> Fermer
                </button>
                <button style={{ flex: 1, background: "white", color: "#1F0270", padding: "14px", borderRadius: 12, border: "1px solid #E5E7EB", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Download size={16} /> Télécharger la fiche
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
