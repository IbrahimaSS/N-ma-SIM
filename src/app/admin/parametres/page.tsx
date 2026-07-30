"use client";
import { Settings, Shield, Bell, CreditCard, Box, FileText, Globe, PenTool as Tool, Check, Eye } from "lucide-react";

export default function Parametres() {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1F0270", margin: 0 }}>Paramètres</h1>
        <p style={{ color: "#6B7280", marginTop: 4, fontSize: 14 }}>Configuration de la plateforme</p>
      </div>

      {/* Navigation tabs */}
      <div style={{ display: "flex", gap: 32, borderBottom: "1px solid #E5E7EB", marginBottom: 32, overflowX: "auto" }}>
        {[
          { icon: Settings, label: "Informations générales", active: true },
          { icon: Shield, label: "Paramètres de sécurité" },
          { icon: Bell, label: "Notifications" },
          { icon: CreditCard, label: "Paiements" },
          { icon: Box, label: "API Orange simulée" },
          { icon: FileText, label: "Modèles de reçu" },
          { icon: Globe, label: "Langues" },
          { icon: Tool, label: "Maintenance" },
        ].map((tab, i) => (
          <button key={i} style={{ 
            display: "flex", alignItems: "center", gap: 8, padding: "0 4px 16px",
            background: "none", border: "none", borderBottom: tab.active ? "2px solid #1F0270" : "2px solid transparent",
            color: tab.active ? "#1F0270" : "#6B7280", fontWeight: tab.active ? 600 : 500,
            fontSize: 14, cursor: "pointer", whiteSpace: "nowrap"
          }}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 300px", gap: 20 }}>
        {/* Column 1 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Informations de l'organisation */}
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 20px", fontSize: 15 }}>Informations de l'organisation</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Nom de l'organisation", val: "N'ma SIM" },
                { label: "Email de contact", val: "contact@nmasim.com" },
                { label: "Téléphone", val: "+224 620 12 34 56" },
                { label: "Adresse", val: "Conakry, République de Guinée" },
              ].map(f => (
                <div key={f.label} style={{ display: "flex", alignItems: "center" }}>
                  <label style={{ width: 150, fontSize: 13, color: "#374151", fontWeight: 500 }}>{f.label}</label>
                  <input type="text" defaultValue={f.val} style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 13, color: "#111827" }} />
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <button style={{ background: "#1F0270", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Enregistrer</button>
              </div>
            </div>
          </div>

          {/* Paramètres de sécurité */}
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 20px", fontSize: 15 }}>Paramètres de sécurité</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Expiration de session (minutes)", val: "60" },
                { label: "Tentatives de connexion max.", val: "5" },
                { label: "Verrouillage de compte (minutes)", val: "15" },
              ].map(f => (
                <div key={f.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <label style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{f.label}</label>
                  <input type="text" defaultValue={f.val} style={{ width: 80, padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 13, color: "#111827", textAlign: "center" }} />
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
                <label style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>Exiger la 2FA pour les admins</label>
                <div style={{ width: 44, height: 24, background: "#1F0270", borderRadius: 12, position: "relative", cursor: "pointer" }}>
                  <div style={{ width: 20, height: 20, background: "white", borderRadius: "50%", position: "absolute", top: 2, right: 2 }} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <button style={{ background: "#1F0270", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Enregistrer</button>
              </div>
            </div>
          </div>

          {/* Modèles de reçu & Langues */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
              <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 20px", fontSize: 15 }}>Modèles de reçu</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <label style={{ fontSize: 13, color: "#374151" }}>Modèle par défaut</label>
                  <select style={{ width: 120, padding: "8px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 13 }}>
                    <option>Modèle standard</option>
                  </select>
                </div>
                {["Inclure QR Code", "Inclure logo"].map(l => (
                  <div key={l} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <label style={{ fontSize: 13, color: "#374151" }}>{l}</label>
                    <div style={{ width: 40, height: 20, background: "#1F0270", borderRadius: 10, position: "relative" }}>
                      <div style={{ width: 16, height: 16, background: "white", borderRadius: "50%", position: "absolute", top: 2, right: 2 }} />
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                  <button style={{ background: "#1F0270", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Enregistrer</button>
                </div>
              </div>
            </div>

            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
              <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 20px", fontSize: 15 }}>Langues</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <label style={{ fontSize: 13, color: "#374151" }}>Langue par défaut</label>
                  <select style={{ width: 120, padding: "8px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 13 }}>
                    <option>Français</option>
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <label style={{ fontSize: 13, color: "#374151" }}>Choix de langue</label>
                  <div style={{ width: 40, height: 20, background: "#1F0270", borderRadius: 10, position: "relative" }}>
                    <div style={{ width: 16, height: 16, background: "white", borderRadius: "50%", position: "absolute", top: 2, right: 2 }} />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 42 }}>
                  <button style={{ background: "#1F0270", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Enregistrer</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Paramètres généraux */}
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 20px", fontSize: 15 }}>Paramètres généraux</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Fuseau horaire", val: "(GMT) Afrique/Conakry" },
                { label: "Format de date", val: "DD/MM/YYYY" },
                { label: "Devise", val: "GNF - Franc guinéen" },
              ].map(f => (
                <div key={f.label} style={{ display: "flex", alignItems: "center" }}>
                  <label style={{ width: 150, fontSize: 13, color: "#374151", fontWeight: 500 }}>{f.label}</label>
                  <select style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 13, color: "#111827", appearance: "none", background: "white url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\") no-repeat right 12px center" }}>
                    <option>{f.val}</option>
                  </select>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
                <label style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>Activer le mode maintenance</label>
                <div style={{ width: 44, height: 24, background: "#E5E7EB", borderRadius: 12, position: "relative", cursor: "pointer" }}>
                  <div style={{ width: 20, height: 20, background: "white", borderRadius: "50%", position: "absolute", top: 2, left: 2 }} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <button style={{ background: "#1F0270", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Enregistrer</button>
              </div>
            </div>
          </div>

          {/* Notifications & Paiements */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
              <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 20px", fontSize: 15 }}>Notifications</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {["Nouvelles demandes SIM", "Validation de demande", "Paiements confirmés", "Rappels et échéances", "Alertes système"].map((l, i) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <label style={{ fontSize: 13, color: "#374151" }}>{l}</label>
                    <div style={{ width: 40, height: 20, background: i === 4 ? "#E5E7EB" : "#1F0270", borderRadius: 10, position: "relative" }}>
                      <div style={{ width: 16, height: 16, background: "white", borderRadius: "50%", position: "absolute", top: 2, [i === 4 ? 'left' : 'right']: 2 }} />
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                  <button style={{ background: "#1F0270", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Enregistrer</button>
                </div>
              </div>
            </div>

            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
              <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 20px", fontSize: 15 }}>Paiements</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <label style={{ fontSize: 13, color: "#374151" }}>Validation automatique</label>
                  <div style={{ width: 40, height: 20, background: "#1F0270", borderRadius: 10, position: "relative" }}>
                    <div style={{ width: 16, height: 16, background: "white", borderRadius: "50%", position: "absolute", top: 2, right: 2 }} />
                  </div>
                </div>
                {[
                  { label: "Délai conf. (min)", val: "10" },
                  { label: "Méthode défaut", val: "Orange Money" },
                  { label: "Montant min (GNF)", val: "1 000" },
                ].map(f => (
                  <div key={f.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <label style={{ fontSize: 13, color: "#374151" }}>{f.label}</label>
                    {f.label.includes("Méthode") ? (
                      <select style={{ width: 100, padding: "6px 8px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 12 }}>
                        <option>{f.val}</option>
                      </select>
                    ) : (
                      <input type="text" defaultValue={f.val} style={{ width: 80, padding: "6px 8px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 12, textAlign: "right" }} />
                    )}
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                  <button style={{ background: "#1F0270", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Enregistrer</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3 - Right Sidebar widgets */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Sécurité */}
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 20px", fontSize: 15 }}>Sécurité</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Shield size={24} color="#166534" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>Authentification sécurisée</div>
                <div style={{ fontSize: 12, color: "#6B7280", margin: "2px 0 6px" }}>JWT • RBAC • Bcrypt</div>
                <span style={{ background: "#DCFCE7", color: "#166534", borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>Actif</span>
              </div>
            </div>
            <button style={{ color: "#4F46E5", background: "none", border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              Voir les journaux de sécurité <span style={{ fontSize: 16 }}>→</span>
            </button>
          </div>

          {/* Système */}
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 20px", fontSize: 15 }}>Système</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Box size={24} color="#4F46E5" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: "#374151", fontWeight: 500 }}>Version</span>
                  <span style={{ color: "#6B7280" }}>v1.4.2</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: "#374151", fontWeight: 500 }}>Environnement</span>
                  <span style={{ background: "#DCFCE7", color: "#166534", borderRadius: 4, padding: "1px 6px", fontSize: 11, fontWeight: 600 }}>Production</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#374151", fontWeight: 500 }}>Dernière mise à jour</span>
                  <span style={{ color: "#6B7280" }}>15/05/2025 10:24</span>
                </div>
              </div>
            </div>
            <button style={{ color: "#4F46E5", background: "none", border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              Vérifier les mises à jour <span style={{ fontSize: 16 }}>→</span>
            </button>
          </div>

          {/* API Orange */}
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 20px", fontSize: 15 }}>API Orange simulée</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>Statut de l'API</span>
                <span style={{ background: "#DCFCE7", color: "#166534", borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>Activée</span>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#6B7280", marginBottom: 4 }}>Base URL</label>
                <input type="text" defaultValue="https://api.orange.simulator.local" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12, color: "#374151", background: "#F9FAFB" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ fontSize: 12, color: "#6B7280" }}>Timeout (secondes)</label>
                <input type="text" defaultValue="30" style={{ width: 60, padding: "8px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12, textAlign: "center", color: "#374151" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#6B7280", marginBottom: 4 }}>Clé API (token)</label>
                <div style={{ position: "relative" }}>
                  <input type="password" defaultValue="secret_token_123" style={{ width: "100%", padding: "8px 12px", paddingRight: 32, borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12, color: "#374151", letterSpacing: 2 }} />
                  <Eye size={14} color="#9CA3AF" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", cursor: "pointer" }} />
                </div>
              </div>
              <button style={{ background: "#1F0270", color: "white", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%", marginTop: 8 }}>Enregistrer</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
