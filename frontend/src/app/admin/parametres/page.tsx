"use client";
import { useState, useEffect } from "react";
import { Settings, Shield, Bell, CreditCard, Box, FileText, Globe, PenTool as Tool, Check, Eye } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function Parametres() {
  const [activeTab, setActiveTab] = useState("Informations générales");
  
  // Unified state for all settings
  const [settings, setSettings] = useState<Record<string, any>>({
    // Text / Select values
    "Nom de l'organisation": "N'ma SIM",
    "Email de contact": "contact@nmasim.com",
    "Téléphone": "+224 620 12 34 56",
    "Adresse": "Conakry, République de Guinée",
    "Fuseau horaire": "(GMT) Afrique/Conakry",
    "Format de date": "DD/MM/YYYY",
    "Devise par défaut": "GNF - Franc guinéen",
    "Expiration de session (minutes)": "60",
    "Tentatives de connexion max.": "5",
    "Verrouillage de compte (minutes)": "15",
    "Délai d'attente (minutes)": "10",
    "Méthode par défaut": "Orange Money",
    "URL de l'Endpoint (Base URL)": "https://api.orange.simulator.local/v1",
    "Délai Timeout (secondes)": "30",
    "Environnement": "Sandbox / Test",
    "Clé secrète API (Token)": "secret_token_123456789",
    "Modèle par défaut": "Modèle Standard N'ma",
    "Langue principale": "Français (FR)",
    // Toggles
    "2FA": false,
    "Nouvelles demandes SIM": true,
    "Validation de demande": true,
    "Paiements confirmés": true,
    "Alertes système": false,
    "Validation automatique": true,
    "Orange Money": true,
    "MTN Mobile Money": true,
    "PayCard": true,
    "Cartes Bancaires (Visa, Mastercard)": false,
    "Inclure QR Code": true,
    "Inclure le logo N'ma": false,
    "Multi-langues": true,
    "Anglais": true,
    "Soussou": true,
    "Poular": false,
    "Malinké": false,
    "Maintenance": false,
    "Auto Backup": true
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiFetch('/api/parametres');
        if (res.data && Object.keys(res.data).length > 0) {
          setSettings(prev => ({ ...prev, ...res.data }));
        }
      } catch (err) {
        console.error("Erreur chargement paramètres", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleToggle = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (key: string, val: string) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert("L'image dépasse la taille maximale autorisée de 2 Mo.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleChange("Logo de l'organisation", event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiFetch('/api/parametres', {
        method: 'POST',
        body: JSON.stringify(settings)
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error("Erreur sauvegarde", err);
    } finally {
      setIsSaving(false);
    }
  };

  const ToggleSwitch = ({ active, onClick, disabled = false }: { active: boolean, onClick: () => void, disabled?: boolean }) => (
    <div onClick={disabled ? undefined : onClick} style={{ width: 44, height: 24, background: active ? "#1F0270" : "#E5E7EB", borderRadius: 12, position: "relative", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, transition: "background 0.2s" }}>
      <div style={{ width: 20, height: 20, background: "white", borderRadius: "50%", position: "absolute", top: 2, left: active ? 22 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />
    </div>
  );

  const SaveButton = ({ text = "Enregistrer les modifications" }: { text?: string }) => (
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
      <button onClick={handleSave} disabled={isSaving || loading} style={{ background: "#1F0270", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: (isSaving || loading) ? "not-allowed" : "pointer", opacity: (isSaving || loading) ? 0.7 : 1 }}>
        {isSaving ? "Enregistrement..." : text}
      </button>
    </div>
  );

  const tabs = [
    { icon: Settings, label: "Informations générales" },
    { icon: Shield, label: "Sécurité" },
    { icon: Bell, label: "Notifications" },
    { icon: CreditCard, label: "Paiements" },
    { icon: Box, label: "API & Intégrations" },
    { icon: FileText, label: "Modèles & Langues" },
    { icon: Tool, label: "Système & Maintenance" },
  ];

  return (
    <div style={{ paddingBottom: 60 }}>
      {showToast && (
        <div style={{ position: "fixed", bottom: 40, right: 40, background: "#10B981", color: "white", padding: "12px 24px", borderRadius: 8, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 4px 12px rgba(16,185,129,0.2)", zIndex: 1000, animation: "slideUp 0.3s ease-out" }}>
          <Check size={20} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Modifications enregistrées avec succès !</span>
        </div>
      )}

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1F0270", margin: 0 }}>Paramètres</h1>
        <p style={{ color: "#6B7280", marginTop: 4, fontSize: 14 }}>Configuration de la plateforme</p>
      </div>

      <div style={{ display: "flex", gap: 32, borderBottom: "1px solid #E5E7EB", marginBottom: 32, overflowX: "auto" }}>
        {tabs.map((tab, i) => (
          <button key={i} onClick={() => setActiveTab(tab.label)} style={{ 
            display: "flex", alignItems: "center", gap: 8, padding: "0 4px 16px",
            background: "none", border: "none", borderBottom: activeTab === tab.label ? "2px solid #1F0270" : "2px solid transparent",
            color: activeTab === tab.label ? "#1F0270" : "#6B7280", fontWeight: activeTab === tab.label ? 600 : 500,
            fontSize: 14, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s"
          }}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        
        {activeTab === "Informations générales" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: 24, alignItems: "start" }}>
            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
              <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 20px", fontSize: 15 }}>Informations de l'organisation</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { label: "Nom de l'organisation", val: "N'ma SIM" },
                  { label: "Email de contact", val: "contact@nmasim.com" },
                  { label: "Téléphone", val: "+224 620 12 34 56" },
                  { label: "Adresse", val: "Conakry, République de Guinée" },
                ].map(f => (
                  <div key={f.label} style={{ display: "grid", gridTemplateColumns: "200px 1fr", alignItems: "center" }}>
                    <label style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{f.label}</label>
                    <input type="text" value={settings[f.label] || ""} onChange={(e) => handleChange(f.label, e.target.value)} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 13, color: "#111827" }} />
                  </div>
                ))}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderTop: "1px solid #EAECF5", marginTop: 8 }}>
                  <div>
                    <label style={{ fontSize: 13, color: "#111827", fontWeight: 600, display: "block" }}>Logo de l'entreprise</label>
                    <span style={{ fontSize: 12, color: "#6B7280" }}>Mettez à jour le logo (Max 2 Mo)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {settings["Logo de l'organisation"] ? (
                      <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img src={settings["Logo de l'organisation"]} alt="Logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                      </div>
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: 8, background: "#1F0270", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 12 }}>N'ma</div>
                    )}
                    <label style={{ background: "#EEF2FF", color: "#4F46E5", border: "none", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-block" }}>
                      Modifier le logo
                      <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: "none" }} />
                    </label>
                  </div>
                </div>
                <SaveButton />
              </div>
            </div>

            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
              <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 20px", fontSize: 15 }}>Paramètres régionaux</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { label: "Fuseau horaire", val: "(GMT) Afrique/Conakry" },
                  { label: "Format de date", val: "DD/MM/YYYY" },
                  { label: "Devise par défaut", val: "GNF - Franc guinéen" },
                ].map(f => (
                  <div key={f.label} style={{ display: "grid", gridTemplateColumns: "200px 1fr", alignItems: "center" }}>
                    <label style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{f.label}</label>
                    <select value={settings[f.label] || f.val} onChange={(e) => handleChange(f.label, e.target.value)} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 13, color: "#111827", appearance: "none", background: "white url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\") no-repeat right 12px center" }}>
                      <option>{f.val}</option>
                      {/* Placeholder for real dynamic options if needed, here we just keep the base option + allow manual typing but it's a select. Usually we map options. */}
                      {settings[f.label] !== f.val && <option>{settings[f.label]}</option>}
                    </select>
                  </div>
                ))}
                <SaveButton />
              </div>
            </div>
          </div>
        )}

        {activeTab === "Sécurité" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: 24, alignItems: "start" }}>
            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
              <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 20px", fontSize: 15 }}>Règles d'authentification</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { label: "Expiration de session (minutes)", val: "60" },
                  { label: "Tentatives de connexion max.", val: "5" },
                  { label: "Verrouillage de compte (minutes)", val: "15" },
                ].map(f => (
                  <div key={f.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <label style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{f.label}</label>
                    <input type="text" value={settings[f.label] || ""} onChange={(e) => handleChange(f.label, e.target.value)} style={{ width: 100, padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 13, color: "#111827", textAlign: "center" }} />
                  </div>
                ))}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderTop: "1px solid #F3F4F6", marginTop: 8 }}>
                  <div>
                    <label style={{ fontSize: 13, color: "#111827", fontWeight: 600, display: "block" }}>Authentification à deux facteurs (2FA)</label>
                    <span style={{ fontSize: 12, color: "#6B7280" }}>Exiger la 2FA pour tous les administrateurs</span>
                  </div>
                  <ToggleSwitch active={settings["2FA"]} onClick={() => handleToggle("2FA")} />
                </div>
                <SaveButton />
              </div>
            </div>

            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
              <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 20px", fontSize: 15 }}>État de la sécurité</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shield size={24} color="#166534" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>Système de sécurité optimal</div>
                  <div style={{ fontSize: 12, color: "#6B7280", margin: "2px 0 6px" }}>Les protocoles JWT, RBAC et Bcrypt sont actifs.</div>
                  <span style={{ background: "#DCFCE7", color: "#166534", borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>Sécurisé</span>
                </div>
              </div>
              <button style={{ color: "#4F46E5", background: "none", border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                Voir les journaux de sécurité complets <span style={{ fontSize: 16 }}>→</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === "Notifications" && (
          <div style={{ maxWidth: 800, background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 20px", fontSize: 15 }}>Préférences de notification</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { title: "Nouvelles demandes SIM", desc: "Être alerté lors d'une nouvelle souscription depuis une borne" },
                { title: "Validation de demande", desc: "Notifications de succès ou d'échec de l'IA (KYC)" },
                { title: "Paiements confirmés", desc: "Recevoir une confirmation pour chaque transaction réussie" },
                { title: "Alertes système", desc: "Avertissements sur la connectivité des bornes ou de l'API Orange" },
              ].map((n, i) => (
                <div key={n.title} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 16, borderBottom: i === 3 ? "none" : "1px solid #F3F4F6" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 4 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>{n.desc}</div>
                  </div>
                  <ToggleSwitch active={settings[n.title]} onClick={() => handleToggle(n.title)} />
                </div>
              ))}
              <SaveButton text="Enregistrer les préférences" />
            </div>
          </div>
        )}

        {activeTab === "Paiements" && (
          <div style={{ maxWidth: 800, background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 20px", fontSize: 15 }}>Configuration des paiements</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 4 }}>Validation automatique</div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>Valider les demandes automatiquement après paiement confirmé</div>
                </div>
                <ToggleSwitch active={settings["Validation automatique"]} onClick={() => handleToggle("Validation automatique")} />
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#374151", fontWeight: 500, marginBottom: 8 }}>Délai d'attente (minutes)</label>
                  <input type="text" value={settings["Délai d'attente (minutes)"] || ""} onChange={(e) => handleChange("Délai d'attente (minutes)", e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#374151", fontWeight: 500, marginBottom: 8 }}>Méthode par défaut</label>
                  <select value={settings["Méthode par défaut"]} onChange={(e) => handleChange("Méthode par défaut", e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 13, appearance: "none", background: "white url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\") no-repeat right 12px center" }}>
                    <option value="Orange Money">Orange Money</option>
                    <option value="Carte Bancaire">Carte Bancaire</option>
                    <option value="MTN Mobile Money">MTN Mobile Money</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 8, paddingTop: 16, borderTop: "1px solid #EAECF5" }}>
                <h4 style={{ margin: "0 0 12px", fontSize: 13, color: "#111827", fontWeight: 600 }}>Modes de paiement acceptés</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {["Orange Money", "MTN Mobile Money", "PayCard", "Cartes Bancaires (Visa, Mastercard)"].map(pm => (
                    <div key={pm} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <label style={{ fontSize: 13, color: "#374151" }}>{pm}</label>
                      <ToggleSwitch active={settings[pm]} onClick={() => handleToggle(pm)} />
                    </div>
                  ))}
                </div>
              </div>
              
              <SaveButton />
            </div>
          </div>
        )}

        {activeTab === "API & Intégrations" && (
          <div style={{ maxWidth: 800, background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 20px", fontSize: 15 }}>API Orange (Simulée)</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 16, borderBottom: "1px solid #F3F4F6" }}>
                <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>Statut de connexion API</span>
                <span style={{ background: "#DCFCE7", color: "#166534", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>En ligne (Simulée)</span>
              </div>
              
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#374151", fontWeight: 500, marginBottom: 8 }}>URL de l'Endpoint (Base URL)</label>
                <input type="text" value={settings["URL de l'Endpoint (Base URL)"] || ""} onChange={(e) => handleChange("URL de l'Endpoint (Base URL)", e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, color: "#374151", background: "#F9FAFB", outline: "none" }} />
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#374151", fontWeight: 500, marginBottom: 8 }}>Délai Timeout (secondes)</label>
                  <input type="text" value={settings["Délai Timeout (secondes)"] || ""} onChange={(e) => handleChange("Délai Timeout (secondes)", e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, color: "#374151", outline: "none" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#374151", fontWeight: 500, marginBottom: 8 }}>Environnement</label>
                  <select value={settings["Environnement"]} onChange={(e) => handleChange("Environnement", e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 13, appearance: "none", background: "white url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\") no-repeat right 12px center" }}>
                    <option value="Sandbox / Test">Sandbox / Test</option>
                    <option value="Production">Production</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#374151", fontWeight: 500, marginBottom: 8 }}>Clé secrète API (Token)</label>
                <div style={{ position: "relative" }}>
                  <input type="password" value={settings["Clé secrète API (Token)"] || ""} onChange={(e) => handleChange("Clé secrète API (Token)", e.target.value)} style={{ width: "100%", padding: "10px 12px", paddingRight: 40, borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, color: "#374151", letterSpacing: 3, outline: "none" }} />
                  <Eye size={16} color="#9CA3AF" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer" }} />
                </div>
              </div>
              
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <button onClick={handleSave} disabled={isSaving} style={{ background: "#1F0270", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: isSaving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, opacity: isSaving ? 0.7 : 1 }}>
                  <Check size={16} /> {isSaving ? "Test en cours..." : "Tester et enregistrer"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Modèles & Langues" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
              <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 20px", fontSize: 15 }}>Modèles de reçu</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#374151", fontWeight: 500, marginBottom: 8 }}>Modèle par défaut</label>
                  <select value={settings["Modèle par défaut"]} onChange={(e) => handleChange("Modèle par défaut", e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 13, appearance: "none", background: "white url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\") no-repeat right 12px center" }}>
                    <option value="Modèle Standard N'ma">Modèle Standard N'ma</option>
                  </select>
                </div>
                {["Inclure QR Code", "Inclure le logo N'ma"].map(l => (
                  <div key={l} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <label style={{ fontSize: 13, color: "#374151" }}>{l}</label>
                    <ToggleSwitch active={settings[l]} onClick={() => handleToggle(l)} />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
              <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 20px", fontSize: 15 }}>Langues du système</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#374151", fontWeight: 500, marginBottom: 8 }}>Langue principale</label>
                  <select value={settings["Langue principale"]} onChange={(e) => handleChange("Langue principale", e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 13, appearance: "none", background: "white url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\") no-repeat right 12px center" }}>
                    <option value="Français (FR)">Français (FR)</option>
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, color: "#111827", fontWeight: 600 }}>Multi-langues</div>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>Permettre à l'utilisateur de choisir</div>
                  </div>
                  <ToggleSwitch active={settings["Multi-langues"]} onClick={() => handleToggle("Multi-langues")} />
                </div>

                <div style={{ marginTop: 8, paddingTop: 16, borderTop: "1px solid #EAECF5" }}>
                  <h4 style={{ margin: "0 0 12px", fontSize: 13, color: "#111827", fontWeight: 600 }}>Langues actives sur la borne</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { name: "Français (Défaut)", key: "Français (Défaut)", locked: true, active: true },
                      { name: "Anglais", key: "Anglais", locked: false },
                      { name: "Soussou", key: "Soussou", locked: false },
                      { name: "Poular", key: "Poular", locked: false },
                      { name: "Malinké", key: "Malinké", locked: false },
                    ].map(lang => (
                      <div key={lang.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", opacity: lang.locked ? 0.7 : 1 }}>
                        <label style={{ fontSize: 13, color: "#374151" }}>{lang.name}</label>
                        <ToggleSwitch 
                          active={lang.locked ? true : settings[lang.key]} 
                          disabled={lang.locked}
                          onClick={() => handleToggle(lang.key)} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ gridColumn: "1 / -1" }}>
              <SaveButton />
            </div>
          </div>
        )}

        {activeTab === "Système & Maintenance" && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5" }}>
            <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 20px", fontSize: 15 }}>À propos du système</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Box size={24} color="#4F46E5" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                    <span style={{ color: "#374151", fontWeight: 500 }}>Version courante</span>
                    <span style={{ color: "#111827", fontWeight: 600 }}>v1.4.2</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "#374151", fontWeight: 500 }}>Dernière MAJ</span>
                    <span style={{ color: "#6B7280" }}>15/05/2025</span>
                  </div>
                </div>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Tool size={24} color="#D97706" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                    <span style={{ color: "#374151", fontWeight: 500 }}>Environnement</span>
                    <span style={{ background: "#DCFCE7", color: "#166534", borderRadius: 4, padding: "1px 6px", fontSize: 11, fontWeight: 700 }}>Production</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "#374151", fontWeight: 500 }}>Base de données</span>
                    <span style={{ color: "#10B981", fontWeight: 600 }}>Connectée</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: 14, color: "#111827" }}>Mode Maintenance</h4>
                  <p style={{ margin: 0, fontSize: 12, color: "#6B7280" }}>Désactive l'accès aux bornes pour effectuer des opérations de maintenance. Les administrateurs gardent l'accès.</p>
                </div>
                <ToggleSwitch active={settings["Maintenance"]} onClick={() => handleToggle("Maintenance")} />
              </div>
            </div>

            <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid #F3F4F6" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h4 style={{ margin: 0, fontSize: 15, color: "#1F0270", fontWeight: 700 }}>Sauvegardes du Système (Backups)</h4>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>Sauvegarde auto. (Quotidienne)</span>
                  <ToggleSwitch active={settings["Auto Backup"]} onClick={() => handleToggle("Auto Backup")} />
                </div>
              </div>
              <div style={{ background: "#F9FAFB", borderRadius: 12, padding: 16, border: "1px solid #EAECF5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 4 }}>Dernière sauvegarde réussie</div>
                  <div style={{ fontSize: 12, color: "#10B981", fontWeight: 600 }}>Aujourd'hui, 03:00 AM (45.2 MB)</div>
                </div>
                <button onClick={handleSave} disabled={isSaving} style={{ background: "white", color: "#4F46E5", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: isSaving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                  {isSaving ? "Sauvegarde..." : "Créer une sauvegarde"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

