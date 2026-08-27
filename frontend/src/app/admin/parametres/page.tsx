"use client";
import { useState, useEffect } from "react";
import { Settings, Shield, Bell, CreditCard, Box, FileText, Globe, PenTool as Tool, Check, Eye, Download, Trash2, AlertTriangle, X, FileBarChart } from "lucide-react";
import { apiFetch, getToken } from "@/lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  const [toastMessage, setToastMessage] = useState("Modifications enregistrées avec succès !");
  const [loading, setLoading] = useState(true);
  
  // États spécifiques Backup & Wipe
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [wipeConfirmText, setWipeConfirmText] = useState("");
  const [isWiping, setIsWiping] = useState(false);

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
      setToastMessage("Modifications enregistrées avec succès !");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error("Erreur sauvegarde", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      // Téléchargement authentifié : l'API exige désormais un token admin (Bearer),
      // qu'une simple navigation <a href> ne peut pas transmettre.
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/system/backup`;
      const token = getToken();
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `nmasim_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      setToastMessage("Sauvegarde générée et téléchargée.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error("Erreur backup", err);
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handlePdfReport = async () => {
    setIsGeneratingPdf(true);
    try {
      const backupData = await apiFetch('/api/system/backup');
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // En-tête
      doc.setFillColor(31, 2, 112); // #1F0270
      doc.rect(0, 0, pageWidth, 40, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("N'ma SIM - Rapport d'Audit Système", 14, 25);
      
      // Infos générales
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Date de génération : ${new Date().toLocaleString('fr-FR')}`, 14, 55);
      doc.text(`Environnement : Production`, 14, 62);
      
      // Statistiques
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Statistiques Globales", 14, 80);
      
      const clients = backupData.data?.clients || [];
      const demandes = backupData.data?.demandes || [];
      const paiements = backupData.data?.paiements || [];
      const utilisateurs = backupData.data?.utilisateurs || [];
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Total Clients : ${clients.length}`, 14, 90);
      doc.text(`Total Demandes : ${demandes.length}`, 14, 96);
      doc.text(`Total Paiements : ${paiements.length}`, 14, 102);
      doc.text(`Total Comptes Admin : ${utilisateurs.length}`, 14, 108);
      
      // Tableau Demandes
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Dernières Demandes (Aperçu)", 14, 125);
      
      const demandesData = demandes.slice(0, 10).map((d: any) => [
        d.numeroDossier,
        d.type,
        d.statut,
        new Date(d.createdAt).toLocaleDateString('fr-FR')
      ]);

      autoTable(doc, {
        startY: 130,
        head: [['N° Dossier', 'Type', 'Statut', 'Date']],
        body: demandesData,
        theme: 'striped',
        headStyles: { fillColor: [31, 2, 112] },
        styles: { fontSize: 10 }
      });
      
      // Tableau Paiements
      const finalYDemandes = (doc as any).lastAutoTable.finalY || 130;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Derniers Paiements", 14, finalYDemandes + 15);
      
      const paiementsData = paiements.slice(0, 10).map((p: any) => [
        p.montant + " " + p.devise,
        p.methodePaiement,
        p.statut,
        new Date(p.createdAt).toLocaleDateString('fr-FR')
      ]);

      autoTable(doc, {
        startY: finalYDemandes + 20,
        head: [['Montant', 'Méthode', 'Statut', 'Date']],
        body: paiementsData,
        theme: 'striped',
        headStyles: { fillColor: [31, 2, 112] },
        styles: { fontSize: 10 }
      });

      // Tableau Clients
      const finalYPaiements = (doc as any).lastAutoTable.finalY || finalYDemandes + 40;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Derniers Clients Inscrits", 14, finalYPaiements + 15);
      
      const clientsData = clients.slice(0, 10).map((c: any) => [
        c.nom + " " + c.prenom,
        c.telephone || "N/A",
        c.typeClient,
        new Date(c.createdAt).toLocaleDateString('fr-FR')
      ]);

      autoTable(doc, {
        startY: finalYPaiements + 20,
        head: [['Nom & Prénom', 'Téléphone', 'Type', 'Inscrit le']],
        body: clientsData,
        theme: 'striped',
        headStyles: { fillColor: [31, 2, 112] },
        styles: { fontSize: 10 }
      });

      // Tableau Utilisateurs
      const finalYClients = (doc as any).lastAutoTable.finalY || finalYPaiements + 40;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Comptes Administrateurs & Agents", 14, finalYClients + 15);
      
      const utilisateursData = utilisateurs.map((u: any) => [
        u.nom,
        u.email,
        u.role,
        u.statut
      ]);

      autoTable(doc, {
        startY: finalYClients + 20,
        head: [['Nom', 'Email', 'Rôle', 'Statut']],
        body: utilisateursData,
        theme: 'striped',
        headStyles: { fillColor: [31, 2, 112] },
        styles: { fontSize: 10 }
      });
      
      // Pied de page
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`Rapport Généré par N'ma SIM - Page ${i}/${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
      }
      
      doc.save(`Rapport_Systeme_NmaSIM_${new Date().toISOString().split('T')[0]}.pdf`);
      setToastMessage("Rapport PDF généré avec succès !");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error("Erreur génération PDF", err);
      alert("Erreur lors de la génération du rapport PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleWipe = async () => {
    if (wipeConfirmText !== "CONFIRMER") {
      alert("Veuillez taper CONFIRMER en majuscules.");
      return;
    }
    setIsWiping(true);
    try {
      const res = await apiFetch('/api/system/wipe', { method: 'POST' });
      if (res.success) {
        setShowWipeModal(false);
        setWipeConfirmText("");
        setToastMessage("Données supprimées avec succès.");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
      } else {
        alert("Erreur : " + res.message);
      }
    } catch (err) {
      console.error("Erreur wipe", err);
      alert("Une erreur est survenue lors de la suppression.");
    } finally {
      setIsWiping(false);
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
          <span style={{ fontWeight: 600, fontSize: 14 }}>{toastMessage}</span>
        </div>
      )}

      {/* Modal Wipe */}
      {showWipeModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 450, padding: 32, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#FEE2E2", color: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={24} />
              </div>
              <button onClick={() => setShowWipeModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280" }}><X size={24} /></button>
            </div>
            <h3 style={{ margin: "0 0 12px", fontSize: 18, color: "#111827", fontWeight: 700 }}>Supprimer toutes les données ?</h3>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "#4B5563", lineHeight: 1.5 }}>
              Cette action va <strong style={{ color: "#DC2626" }}>définitivement effacer</strong> tous les clients, toutes les demandes SIM, tous les paiements et tous les logs de transactions. Vos configurations (Bornes, Offres, Administrateurs) seront conservées.
            </p>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Veuillez taper <strong style={{ color: "#111827" }}>CONFIRMER</strong> pour valider :</label>
              <input type="text" value={wipeConfirmText} onChange={e => setWipeConfirmText(e.target.value)} placeholder="CONFIRMER" style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #E5E7EB", outline: "none", fontSize: 14, fontWeight: 600, textAlign: "center" }} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setShowWipeModal(false)} style={{ flex: 1, padding: "12px", borderRadius: 8, border: "1px solid #E5E7EB", background: "white", color: "#374151", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
              <button onClick={handleWipe} disabled={wipeConfirmText !== "CONFIRMER" || isWiping} style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: "#DC2626", color: "white", fontWeight: 600, cursor: (wipeConfirmText !== "CONFIRMER" || isWiping) ? "not-allowed" : "pointer", opacity: (wipeConfirmText !== "CONFIRMER" || isWiping) ? 0.5 : 1 }}>
                {isWiping ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
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
              <div style={{ background: "#F9FAFB", borderRadius: 12, padding: 16, border: "1px solid #EAECF5", display: "flex", alignItems: "center", justifyItems: "center", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 4 }}>Rapport d'Audit (PDF)</div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>Rapport synthétique et lisible de l'état du système.</div>
                </div>
                <button onClick={handlePdfReport} disabled={isGeneratingPdf} style={{ background: "white", color: "#1F0270", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: isGeneratingPdf ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}>
                  <FileBarChart size={16} /> {isGeneratingPdf ? "Génération..." : "Télécharger PDF"}
                </button>
              </div>
              <div style={{ background: "#F9FAFB", borderRadius: 12, padding: 16, border: "1px solid #EAECF5", display: "flex", alignItems: "center", justifyItems: "center", gap: 16, marginTop: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 4 }}>Sauvegarde Technique Complète (JSON)</div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>Toutes les données brutes. Nécessaire pour une restauration de secours.</div>
                </div>
                <button onClick={handleBackup} disabled={isBackingUp} style={{ background: "white", color: "#4F46E5", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: isBackingUp ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}>
                  <Download size={16} /> {isBackingUp ? "Création..." : "Télécharger JSON"}
                </button>
              </div>
            </div>
            
            {/* Zone de Danger (WIPE) */}
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid #F3F4F6" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h4 style={{ margin: 0, fontSize: 15, color: "#DC2626", fontWeight: 700 }}>Zone de Danger</h4>
              </div>
              <div style={{ background: "#FEF2F2", borderRadius: 12, padding: 16, border: "1px solid #FECACA", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", marginBottom: 4 }}>Réinitialiser le système (Wipe)</div>
                  <div style={{ fontSize: 12, color: "#B91C1C", maxWidth: 400 }}>Supprime définitivement toutes les transactions, paiements et dossiers clients (les offres et les accès admins seront conservés).</div>
                </div>
                <button onClick={() => setShowWipeModal(true)} style={{ background: "#DC2626", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 2px 4px rgba(220,38,38,0.2)" }}>
                  <Trash2 size={16} /> Vider la base
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

