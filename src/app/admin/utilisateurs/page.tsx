"use client";
import { useState } from "react";
import { Search, Plus, Edit2, MoreHorizontal, Shield, User, Wrench, Eye } from "lucide-react";
import { MOCK_UTILISATEURS } from "@/data/admin-mock-data";

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    "Admin": { bg: "#EEF2FF", color: "#4338CA" },
    "Agent": { bg: "#E0F2FE", color: "#0369A1" },
    "Technicien": { bg: "#DCFCE7", color: "#166534" },
  };
  const s = map[role] || { bg: "#F3F4F6", color: "#374151" };
  return <span style={{ ...s, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>{role}</span>;
}

export default function Utilisateurs() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_UTILISATEURS.filter(u =>
    u.nom.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1F0270", margin: 0 }}>Utilisateurs</h1>
          <p style={{ color: "#6B7280", marginTop: 4, fontSize: 14 }}>Gestion des comptes et rôles</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un utilisateur, un email..." style={{ paddingLeft: 36, paddingRight: 16, height: 40, borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 14, outline: "none", width: 300, background: "white" }} />
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 40, borderRadius: 10, background: "#1F0270", color: "white", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
            <Plus size={16} /> Ajouter un utilisateur
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { icon: Shield, label: "Total utilisateurs", value: "48", sub: "↑ 8 ce mois", color: "#059669", bg: "#EEF2FF", iconColor: "#4F46E5" },
          { icon: Shield, label: "Administrateurs", value: "5", sub: "↑ 1 ce mois", color: "#059669", bg: "#FEF3C7", iconColor: "#D97706" },
          { icon: User, label: "Agents", value: "28", sub: "↑ 5 ce mois", color: "#059669", bg: "#E0F2FE", iconColor: "#0284C7" },
          { icon: Wrench, label: "Techniciens", value: "10", sub: "↓ 1 ce mois", color: "#DC2626", bg: "#DCFCE7", iconColor: "#166534" },
          { icon: Shield, label: "Comptes actifs", value: "41", sub: "85,4% du total", color: "#6B7280", bg: "#F3F4F6", iconColor: "#4F46E5" },
        ].map((k, i) => (
          <div key={i} style={{ background: "white", borderRadius: 16, padding: "18px 22px", flex: 1, minWidth: 140, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ background: k.bg, borderRadius: 10, padding: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <k.icon size={18} style={{ color: k.iconColor }} />
              </div>
              <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{k.label}</div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#1F0270" }}>{k.value}</div>
            <div style={{ fontSize: 11, color: k.color, fontWeight: 500 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5", overflow: "hidden", marginBottom: 24 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
              {["Utilisateur", "Rôle", "Email", "Téléphone", "Statut", "Dernière connexion", "Permissions", "Action"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "14px 20px", fontSize: 12, color: "#6B7280", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid #F9FAFB" }}>
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#4F46E5", flexShrink: 0 }}>
                      {u.nom.charAt(0)}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{u.nom}</div>
                  </div>
                </td>
                <td style={{ padding: "14px 20px" }}><RoleBadge role={u.role} /></td>
                <td style={{ padding: "14px 20px", fontSize: 13, color: "#374151" }}>{u.email}</td>
                <td style={{ padding: "14px 20px", fontSize: 13, color: "#6B7280" }}>{u.tel}</td>
                <td style={{ padding: "14px 20px" }}>
                  <span style={{ background: u.statut === "Actif" ? "#DCFCE7" : "#FEE2E2", color: u.statut === "Actif" ? "#166534" : "#991B1B", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{u.statut}</span>
                </td>
                <td style={{ padding: "14px 20px", fontSize: 12, color: "#9CA3AF" }}>{u.derniereConnexion}</td>
                <td style={{ padding: "14px 20px", fontSize: 12, color: "#6B7280", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {u.permissions.join(", ")}
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 8, padding: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#4B5563" }}>
                      <Edit2 size={14} />
                    </button>
                    <button style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 8, padding: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#4B5563" }}>
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #F3F4F6" }}>
          <span style={{ fontSize: 13, color: "#6B7280" }}>Affichage 1 à {filtered.length} sur 48 utilisateurs</span>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3, 4, 5, ">"].map((p, i) => (
              <button key={i} style={{ minWidth: 32, height: 32, borderRadius: 8, border: "1px solid #E5E7EB", background: p === 1 ? "#1F0270" : "white", color: p === 1 ? "white" : "#374151", fontSize: 13, cursor: "pointer", padding: "0 8px" }}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Rôles & permissions explainer */}
      <div style={{ display: "grid", gridTemplateColumns: "250px 1fr 1fr 1fr 1fr", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h3 style={{ fontWeight: 700, color: "#1F0270", margin: "0 0 8px", fontSize: 15 }}>Rôles & permissions</h3>
          <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 16px", lineHeight: 1.4 }}>Aperçu des rôles définis et des permissions associées dans le système.</p>
          <button style={{ padding: "10px", borderRadius: 10, border: "1px solid #E5E7EB", background: "white", color: "#374151", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>⚙️ Gérer les rôles</button>
        </div>

        {[
          { icon: Shield, bg: "#EEF2FF", color: "#4338CA", title: "Administrateur", users: "5 utilisateurs", perms: ["Accès complet à toutes les fonctionnalités", "Gestion des utilisateurs et rôles", "Paramètres système"], badge: "Toutes les permissions" },
          { icon: User, bg: "#E0F2FE", color: "#0369A1", title: "Agent", users: "28 utilisateurs", perms: ["Gestion des demandes SIM", "Gestion des clients", "Gestion des paiements"], badge: "7 permissions" },
          { icon: Wrench, bg: "#DCFCE7", color: "#166534", title: "Technicien", users: "10 utilisateurs", perms: ["Gestion des demandes SIM", "Gestion des offres", "Consultation des clients"], badge: "5 permissions" },
          { icon: Eye, bg: "#F3F4F6", color: "#4B5563", title: "Lecture seule", users: "5 utilisateurs", perms: ["Consultation des demandes", "Consultation des clients", "Consultation des paiements"], badge: "3 permissions" },
        ].map((r, i) => (
          <div key={i} style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 1px 6px rgba(31,2,112,0.06)", border: "1px solid #EAECF5", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ background: r.bg, borderRadius: 8, padding: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <r.icon size={16} style={{ color: r.color }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{r.title}</div>
              </div>
              <span style={{ fontSize: 10, color: "#6B7280", background: "#F3F4F6", padding: "2px 6px", borderRadius: 4 }}>{r.users}</span>
            </div>
            <ul style={{ padding: 0, margin: "0 0 16px", listStyle: "none", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              {r.perms.map((p, j) => (
                <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 11, color: "#4B5563" }}>
                  <span style={{ color: "#10B981", fontSize: 14, lineHeight: 1 }}>✓</span> {p}
                </li>
              ))}
            </ul>
            <div style={{ display: "inline-block", alignSelf: "flex-start", background: r.bg, color: r.color, fontSize: 10, fontWeight: 600, padding: "4px 8px", borderRadius: 20 }}>
              {r.badge}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
