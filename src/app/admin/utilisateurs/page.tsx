"use client";
import { useState, useEffect } from "react";
import {
  Search, Plus, Edit2, MoreHorizontal, Shield, User, Wrench, Eye,
  Menu, Bell, ChevronDown, Check, Info, Lock, Unlock, Phone, Mail, EyeOff,
  Briefcase, X, UserPlus, CloudUpload, Camera, ShieldCheck, MessageSquare, Filter
} from "lucide-react";
import { MOCK_UTILISATEURS } from "@/data/admin-mock-data";

// Type definitions
interface Utilisateur {
  id: string;
  nom: string;
  email: string;
  tel: string;
  role: string;
  statut: string;
  derniereConnexion: string;
  permissions: string[];
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    "Admin": { bg: "#EEF2FF", color: "#4338CA" },
    "Agent": { bg: "#E0F2FE", color: "#0369A1" },
    "Technicien": { bg: "#DCFCE7", color: "#166534" },
    "Lecture seule": { bg: "#F3F4F6", color: "#4B5563" },
  };
  const s = map[role] || { bg: "#F3F4F6", color: "#374151" };
  return <span style={{ ...s, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>{role}</span>;
}

export default function Utilisateurs() {
  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [search, setSearch] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterRole, setFilterRole] = useState("Tous");
  const [filterStatut, setFilterStatut] = useState("Tous");

  // Form states
  const [nomComplet, setNomComplet] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState("");
  const [photoProfil, setPhotoProfil] = useState<string | null>(null);
  const [role, setRole] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(false);

  // Eye toggle for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Edit user state
  const [editingUser, setEditingUser] = useState<Utilisateur | null>(null);

  // Actions states
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [detailsUser, setDetailsUser] = useState<Utilisateur | null>(null);
  const [detailsTab, setDetailsTab] = useState<"infos" | "historique">("infos");

  // Init local storage
  useEffect(() => {
    const stored = localStorage.getItem("nma_sim_users");
    if (stored) {
      setUsers(JSON.parse(stored));
    } else {
      localStorage.setItem("nma_sim_users", JSON.stringify(MOCK_UTILISATEURS));
      setUsers(MOCK_UTILISATEURS);
    }
  }, []);

  // Sync back to local storage helper
  const saveUsers = (newUsers: Utilisateur[]) => {
    localStorage.setItem("nma_sim_users", JSON.stringify(newUsers));
    setUsers(newUsers);
  };

  const filtered = users.filter(u => {
    const matchSearch = u.nom.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "Tous" || u.role === filterRole;
    const matchStatut = filterStatut === "Tous" || u.statut === filterStatut;
    return matchSearch && matchRole && matchStatut;
  });

  // Dynamic permissions display based on selected role
  const getPermissionsForRole = (selectedRole: string) => {
    switch (selectedRole) {
      case "Admin":
        return ["Toutes les permissions administratives", "Gestion des utilisateurs et rôles", "Accès complet aux paramètres"];
      case "Agent":
        return ["Gestion et validation des demandes SIM", "Création et modification des clients", "Visualisation des paiements"];
      case "Technicien":
        return ["Gestion des bornes SIM", "Consultation des logs système", "Configuration des offres"];
      case "Lecture seule":
        return ["Consultation uniquement des statistiques", "Consultation des demandes SIM"];
      default:
        return [];
    }
  };

  // Image Upload handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validation de la taille (max 2 Mo)
      if (file.size > 2 * 1024 * 1024) {
        alert("L'image dépasse la taille maximale autorisée de 2 Mo.");
        return;
      }

      // Utilisation de URL.createObjectURL pour la prévisualisation immédiate
      setPhotoProfil(URL.createObjectURL(file));
    }
  };

  // Open edit modal and prefill form
  const handleStartEdit = (userToEdit: Utilisateur) => {
    setEditingUser(userToEdit);
    setNomComplet(userToEdit.nom);
    setTelephone(userToEdit.tel);
    setEmail(userToEdit.email);
    setService("");
    setRole(userToEdit.role);
    setUsername(userToEdit.email.split("@")[0] || userToEdit.nom.toLowerCase().replace(/\s+/g, "."));
    setPassword("password123");
    setConfirmPassword("password123");
    setIsAddingUser(true);
  };

  // Submit Handler (Create or Update)
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomComplet || !telephone || !email || !role || !username || !password) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }

    if (editingUser) {
      // Update existing user
      const updated = users.map(u => {
        if (u.id === editingUser.id) {
          return {
            ...u,
            nom: nomComplet,
            email: email,
            tel: telephone,
            role: role,
            permissions: getPermissionsForRole(role).map(p => p.split(" ")[0])
          };
        }
        return u;
      });
      saveUsers(updated);
    } else {
      // Create new user
      const newUser: Utilisateur = {
        id: `USR-${String(users.length + 1).padStart(3, "0")}`,
        nom: nomComplet,
        email: email,
        tel: telephone,
        role: role,
        statut: "Actif",
        derniereConnexion: "Jamais connecté",
        permissions: getPermissionsForRole(role).map(p => p.split(" ")[0])
      };
      saveUsers([newUser, ...users]);
    }

    // Reset fields
    setNomComplet("");
    setTelephone("");
    setEmail("");
    setService("");
    setPhotoProfil(null);
    setRole("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setSendEmail(true);
    setSendSms(false);
    setEditingUser(null);
    setIsAddingUser(false);
  };

  // Block/Unblock user
  const handleToggleBlock = (userId: string) => {
    const updated = users.map(u => {
      if (u.id === userId) {
        return { ...u, statut: u.statut === "Actif" ? "Bloqué" : "Actif" };
      }
      return u;
    });
    saveUsers(updated);

    // Mettre à jour la modale si elle est ouverte pour cet utilisateur
    if (detailsUser && detailsUser.id === userId) {
      setDetailsUser({ ...detailsUser, statut: detailsUser.statut === "Actif" ? "Bloqué" : "Actif" });
    }
  };

  return (
    <div style={{ minHeight: "100%", position: "relative" }}>
      {/* 1. TOP BAR (Breadcrumbs & User Profile) */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #E5E7EB",
        paddingBottom: 16,
        marginBottom: 28
      }}>
        {/* Left: Breadcrumbs */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Menu size={20} style={{ color: "#374151", cursor: "pointer" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500 }}>
            <span
              onClick={() => setIsAddingUser(false)}
              style={{ color: "#4F46E5", cursor: "pointer" }}
            >
              Utilisateurs
            </span>
            {isAddingUser && (
              <>
                <span style={{ color: "#9CA3AF" }}>&gt;</span>
                <span style={{ color: "#374151" }}>Ajouter un utilisateur</span>
              </>
            )}
          </div>
        </div>

        {/* Right: User Menu */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Notification Icon */}
          <div style={{ position: "relative", cursor: "pointer" }}>
            <Bell size={20} style={{ color: "#374151" }} />
            <span style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "#EF4444",
              color: "white",
              fontSize: 10,
              fontWeight: "bold",
              borderRadius: "50%",
              width: 16,
              height: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>5</span>
          </div>

          {/* Admin profile */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#EEF2FF", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src="/avatar-cartoon.png" alt="Admin Avatar" onError={(e) => { (e.target as HTMLElement).style.display = 'none' }} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <User size={18} style={{ color: "#4F46E5" }} />
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1F0270" }}>Admin Principal</div>
              <div style={{ fontSize: 11, color: "#6B7280" }}>Administrateur</div>
            </div>
            <ChevronDown size={14} style={{ color: "#6B7280", cursor: "pointer" }} />
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC CONTENT SECTION */}
      {!isAddingUser ? (
        /* ================= VUE TABLEAU & LISTE ================= */
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
              <div style={{ position: "relative" }}>
                <button onClick={() => setIsFilterOpen(!isFilterOpen)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 40, borderRadius: 10, background: isFilterOpen ? "#F3F4F6" : "white", border: "1px solid #E5E7EB", color: "#374151", fontSize: 14, fontWeight: 500, cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                  <Filter size={16} style={{ color: "#6B7280" }} /> Filtrer
                  {(filterRole !== "Tous" || filterStatut !== "Tous") && (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4F46E5', marginLeft: 4 }}></div>
                  )}
                </button>

                {isFilterOpen && (
                  <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 8, background: "white", border: "1px solid #E5E7EB", borderRadius: 12, boxShadow: "0 10px 25px rgba(0,0,0,0.1)", width: 220, zIndex: 50, padding: 16 }}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Rôle</label>
                      <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, outline: "none", background: "#F9FAFB", color: "#111827" }}>
                        <option value="Tous">Tous les rôles</option>
                        <option value="Admin">Admin</option>
                        <option value="Agent">Agent</option>
                        <option value="Technicien">Technicien</option>
                        <option value="Lecture seule">Lecture seule</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Statut</label>
                      <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, outline: "none", background: "#F9FAFB", color: "#111827" }}>
                        <option value="Tous">Tous les statuts</option>
                        <option value="Actif">Actif</option>
                        <option value="Bloqué">Bloqué</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, borderTop: "1px solid #F3F4F6", paddingTop: 12 }}>
                      <button onClick={() => { setFilterRole("Tous"); setFilterStatut("Tous"); }} style={{ fontSize: 12, color: "#4F46E5", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Réinitialiser</button>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsAddingUser(true)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 40, borderRadius: 10, background: "#1F0270", color: "white", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500 }}
              >
                <Plus size={16} /> Ajouter un utilisateur
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
            {[
              { icon: Shield, label: "Total utilisateurs", value: users.length.toString(), sub: `↑ ${users.filter(u => u.derniereConnexion.includes("Aujourd'hui")).length} actifs`, color: "#059669", bg: "#EEF2FF", iconColor: "#4F46E5" },
              { icon: Shield, label: "Administrateurs", value: users.filter(u => u.role === "Admin").length.toString(), sub: "Niveau max", color: "#059669", bg: "#FEF3C7", iconColor: "#D97706" },
              { icon: User, label: "Agents", value: users.filter(u => u.role === "Agent").length.toString(), sub: "Terrain & validation", color: "#059669", bg: "#E0F2FE", iconColor: "#0284C7" },
              { icon: Wrench, label: "Techniciens", value: users.filter(u => u.role === "Technicien").length.toString(), sub: "Maintenance", color: "#166534", bg: "#DCFCE7", iconColor: "#166534" },
              { icon: Shield, label: "Lecture seule", value: users.filter(u => u.role === "Lecture seule").length.toString(), sub: "Observateurs", color: "#6B7280", bg: "#F3F4F6", iconColor: "#4B5563" },
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
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#4F46E5", flexShrink: 0, overflow: 'hidden' }}>
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
                      <div style={{ display: "flex", gap: 6, position: "relative" }}>
                        <button onClick={() => handleStartEdit(u)} title="Modifier l'utilisateur" style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 8, padding: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#4F46E5" }}>
                          <Edit2 size={14} />
                        </button>

                        <div style={{ position: "relative" }}>
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === u.id ? null : u.id)}
                            style={{ background: openDropdownId === u.id ? "#F3F4F6" : "white", border: "1px solid #E5E7EB", borderRadius: 8, padding: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#4B5563" }}
                          >
                            <MoreHorizontal size={14} />
                          </button>

                          {/* Menu déroulant Actions */}
                          {openDropdownId === u.id && (
                            <div style={{ position: "absolute", right: 0, top: "100%", marginTop: 4, background: "white", border: "1px solid #E5E7EB", borderRadius: 8, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", zIndex: 10, minWidth: 180, overflow: "hidden" }}>
                              <button
                                onClick={() => { setDetailsUser(u); setDetailsTab("infos"); setOpenDropdownId(null); }}
                                style={{ width: "100%", textAlign: "left", padding: "10px 14px", fontSize: 13, fontWeight: 500, background: "white", border: "none", borderBottom: "1px solid #F3F4F6", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#374151" }}
                              >
                                <Eye size={14} className="text-gray-400" /> Voir les détails
                              </button>
                              <button
                                onClick={() => { handleToggleBlock(u.id); setOpenDropdownId(null); }}
                                style={{ width: "100%", textAlign: "left", padding: "10px 14px", fontSize: 13, fontWeight: 500, background: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: u.statut === "Actif" ? "#DC2626" : "#16A34A" }}
                              >
                                {u.statut === "Actif" ? <Lock size={14} className="text-red-600" /> : <Unlock size={14} className="text-green-600" />}
                                {u.statut === "Actif" ? "Bloquer l'utilisateur" : "Débloquer l'utilisateur"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #F3F4F6" }}>
              <span style={{ fontSize: 13, color: "#6B7280" }}>Affichage 1 à {filtered.length} sur {users.length} utilisateurs</span>
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
              { icon: Shield, bg: "#EEF2FF", color: "#4338CA", title: "Administrateur", users: `${users.filter(u => u.role === "Admin").length} utilisateurs`, perms: ["Accès complet à toutes les fonctionnalités", "Gestion des utilisateurs et rôles", "Paramètres système"], badge: "Toutes les permissions" },
              { icon: User, bg: "#E0F2FE", color: "#0369A1", title: "Agent", users: `${users.filter(u => u.role === "Agent").length} utilisateurs`, perms: ["Gestion des demandes SIM", "Gestion des clients", "Gestion des paiements"], badge: "7 permissions" },
              { icon: Wrench, bg: "#DCFCE7", color: "#166534", title: "Technicien", users: `${users.filter(u => u.role === "Technicien").length} utilisateurs`, perms: ["Gestion des demandes SIM", "Gestion des offres", "Consultation des clients"], badge: "5 permissions" },
              { icon: Eye, bg: "#F3F4F6", color: "#4B5563", title: "Lecture seule", users: `${users.filter(u => u.role === "Lecture seule").length} utilisateurs`, perms: ["Consultation des demandes", "Consultation des clients", "Consultation des paiements"], badge: "3 permissions" },
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
      ) : (
        /* ================= VUE FORMULAIRE D'AJOUT ================= */
        <form onSubmit={handleCreateUser} style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>

          {/* Main Form Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Title & Description inside form layout to match structure */}
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1F0270", margin: 0 }}>
                {editingUser ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}
              </h1>
              <p style={{ color: "#6B7280", marginTop: 4, fontSize: 14 }}>
                {editingUser ? `Modifiez les informations et le rôle de ${editingUser.nom}.` : "Créez un nouveau compte utilisateur et définissez son rôle et ses permissions."}
              </p>
            </div>

            {/* SECTION 1: Informations personnelles */}
            <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #EAECF5", boxShadow: "0 1px 6px rgba(31,2,112,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <span style={{ background: "#1F0270", color: "white", width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: "bold" }}>1</span>
                <User className="w-5 h-5 text-indigo-600" />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1F0270", margin: 0 }}>Informations personnelles</h3>
              </div>

              {/* 2x2 Grid of Fields */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#1F0270", marginBottom: 6 }}>Nom complet <span style={{ color: "#EF4444" }}>*</span></label>
                  <div style={{ position: "relative" }}>
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input required type="text" value={nomComplet} onChange={e => setNomComplet(e.target.value)} placeholder="Entrez le nom complet" style={{ width: "100%", padding: "10px 12px 10px 38px", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 14, outline: "none", background: "white" }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#1F0270", marginBottom: 6 }}>Téléphone <span style={{ color: "#EF4444" }}>*</span></label>
                  <div style={{ position: "relative" }}>
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input required type="tel" value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="Ex. : +224 620 12 34 56" style={{ width: "100%", padding: "10px 12px 10px 38px", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 14, outline: "none", background: "white" }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#1F0270", marginBottom: 6 }}>Email <span style={{ color: "#EF4444" }}>*</span></label>
                  <div style={{ position: "relative" }}>
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Entrez l'adresse email" style={{ width: "100%", padding: "10px 12px 10px 38px", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 14, outline: "none", background: "white" }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#1F0270", marginBottom: 6 }}>Service / Département</label>
                  <div style={{ position: "relative" }}>
                    <Briefcase className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select value={service} onChange={e => setService(e.target.value)} style={{ width: "100%", padding: "10px 12px 10px 38px", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 14, outline: "none", background: "white", appearance: "none" }}>
                      <option value="">Sélectionnez le service</option>
                      <option value="Administration">Administration</option>
                      <option value="Technique">Technique</option>
                      <option value="Support Client">Support Client</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Photo Upload Area - Positioned below fields as in mockup */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#1F0270", marginBottom: 8 }}>Photo de profil (optionnel)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <input id="photo-upload" type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />

                  {/* Upload Rectangle */}
                  <label htmlFor="photo-upload" style={{
                    width: 240,
                    height: 84,
                    border: "2px dashed #E0E7FF",
                    borderRadius: 14,
                    padding: "12px 16px",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 14,
                    cursor: "pointer",
                    background: "#F9FAFB",
                    transition: "all 0.2s"
                  }}>
                    <CloudUpload className="w-7 h-7 text-indigo-600 flex-shrink-0" />
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1F0270" }}>Choisir une image</span>
                      <span style={{ fontSize: 11, color: "#6B7280" }}>JPG, PNG (max. 2 Mo)</span>
                    </div>
                  </label>

                  {/* Avatar Circle with Badge */}
                  <label htmlFor="photo-upload" style={{ position: "relative", width: 96, height: 96, flexShrink: 0, cursor: "pointer" }}>
                    <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#E0E7FF", border: "2px solid #EEF2FF", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {photoProfil ? (
                        <img src={photoProfil} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <User className="w-12 h-12 text-indigo-600" />
                      )}
                    </div>

                    {/* Camera Badge */}
                    <div style={{
                      position: "absolute",
                      bottom: 2,
                      right: 2,
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "#4F46E5",
                      border: "2px solid white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.15)"
                    }}>
                      <Camera className="w-3.5 h-3.5 text-white" />
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* SECTION 2: Rôle et permissions */}
            <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #EAECF5", boxShadow: "0 1px 6px rgba(31,2,112,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <span style={{ background: "#1F0270", color: "white", width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: "bold" }}>2</span>
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1F0270", margin: 0 }}>Rôle et permissions</h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {/* Select Role */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#1F0270", marginBottom: 6 }}>Rôle de l'utilisateur <span style={{ color: "#EF4444" }}>*</span></label>
                  <div style={{ position: "relative" }}>
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select required value={role} onChange={e => setRole(e.target.value)} style={{ width: "100%", padding: "10px 12px 10px 38px", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 14, outline: "none", background: "white", appearance: "none" }}>
                      <option value="">Sélectionnez un rôle</option>
                      <option value="Admin">Administrateur</option>
                      <option value="Agent">Agent</option>
                      <option value="Technicien">Technicien</option>
                      <option value="Lecture seule">Lecture seule</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Selected permissions info */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#1F0270", marginBottom: 6 }}>Permissions incluses</label>
                  <div style={{
                    border: "1px solid #E0E7FF",
                    background: role ? "#EEF2FF" : "#F9FAFB",
                    borderRadius: 12,
                    padding: "12px 16px",
                    minHeight: 80,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    transition: "all 0.2s"
                  }}>
                    {role ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {getPermissionsForRole(role).map((p, idx) => (
                          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#4338CA", fontWeight: 500 }}>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#9CA3AF" }}>
                        <span style={{ fontSize: 13, color: "#4F46E5", fontWeight: 500 }}>Sélectionnez un rôle pour voir<br />les permissions associées.</span>
                        <Lock className="w-6 h-6 text-indigo-900 opacity-20" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: Informations de connexion */}
            <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #EAECF5", boxShadow: "0 1px 6px rgba(31,2,112,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <span style={{ background: "#1F0270", color: "white", width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: "bold" }}>3</span>
                <Lock className="w-5 h-5 text-indigo-600" />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1F0270", margin: 0 }}>Informations de connexion</h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
                {/* Username */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#1F0270", marginBottom: 6 }}>Nom d'utilisateur <span style={{ color: "#EF4444" }}>*</span></label>
                  <div style={{ position: "relative" }}>
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input required type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Entrez le nom d'utilisateur" style={{ width: "100%", padding: "10px 12px 10px 38px", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 14, outline: "none", background: "white" }} />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#1F0270", marginBottom: 6 }}>Mot de passe <span style={{ color: "#EF4444" }}>*</span></label>
                  <div style={{ position: "relative" }}>
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input required type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Créez un mot de passe" style={{ width: "100%", padding: "10px 34px 10px 38px", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 14, outline: "none", background: "white" }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                      {showPassword ? <Eye className="w-3.5 h-3.5 text-gray-500" /> : <EyeOff className="w-3.5 h-3.5 text-gray-500" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#1F0270", marginBottom: 6 }}>Confirmer le mot de passe <span style={{ color: "#EF4444" }}>*</span></label>
                  <div style={{ position: "relative" }}>
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input required type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmez le mot de passe" style={{ width: "100%", padding: "10px 34px 10px 38px", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 14, outline: "none", background: "white" }} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                      {showConfirmPassword ? <Eye className="w-3.5 h-3.5 text-gray-500" /> : <EyeOff className="w-3.5 h-3.5 text-gray-500" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Notification Toggles */}
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#1F0270", fontWeight: 500, cursor: "pointer" }}>
                  <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} style={{ width: 16, height: 16, accentColor: "#1F0270" }} />
                  Envoyer les identifiants à l'utilisateur par
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={() => setSendEmail(!sendEmail)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", border: sendEmail ? "1px solid #1F0270" : "1px solid #E5E7EB", borderRadius: 8, background: sendEmail ? "#EEF2FF" : "white", color: "#1F0270", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    <Mail className="w-3.5 h-3.5 text-indigo-900" /> Email
                  </button>
                  <button type="button" onClick={() => setSendSms(!sendSms)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", border: sendSms ? "1px solid #1F0270" : "1px solid #E5E7EB", borderRadius: 8, background: sendSms ? "#EEF2FF" : "white", color: "#1F0270", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-900" /> SMS
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: "flex", justifySelf: "flex-start", gap: 12, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => { setIsAddingUser(false); setEditingUser(null); }}
                style={{ height: 44, padding: "0 28px", borderRadius: 10, border: "1px solid #D1D5DB", background: "white", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
              >
                <X className="w-4 h-4 text-gray-700" /> Annuler
              </button>
              <button
                type="submit"
                style={{ height: 44, padding: "0 28px", borderRadius: 10, border: "none", background: "#FFB800", color: "#1F0270", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
              >
                <UserPlus className="w-4 h-4 text-indigo-950" /> {editingUser ? "Enregistrer les modifications" : "Créer l'utilisateur"}
              </button>
            </div>

          </div>

          {/* Right Sidebar ("À propos des rôles") - Matching exact mockup */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Roles Info Box */}
            <div style={{ background: "white", borderRadius: 16, padding: 22, border: "1px solid #EAECF5", boxShadow: "0 1px 6px rgba(31,2,112,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ background: "#EEF2FF", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Info className="w-4 h-4 text-indigo-600" />
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: "#1F0270", margin: 0 }}>À propos des rôles</h4>
              </div>
              <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 16px", lineHeight: 1.4 }}>
                Chaque rôle dispose de permissions spécifiques dans la plateforme.
              </p>

              {/* Roles Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                {/* Administrateur */}
                <div style={{ display: "flex", gap: 12, padding: "14px", borderRadius: 12, border: "1px solid #EEF2FF", background: "#F8FAFC" }}>
                  <div style={{ background: "#312E81", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1F0270" }}>Administrateur</div>
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4, lineHeight: 1.4 }}>Accès complet à toutes les fonctionnalités et aux paramètres du système.</div>
                  </div>
                </div>

                {/* Agent */}
                <div style={{ display: "flex", gap: 12, padding: "14px", borderRadius: 12, border: "1px solid #E0F2FE", background: "#F0F9FF" }}>
                  <div style={{ background: "#0284C7", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0369A1" }}>Agent</div>
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4, lineHeight: 1.4 }}>Peut gérer et valider les demandes SIM, les paiements et les clients.</div>
                  </div>
                </div>

                {/* Technicien */}
                <div style={{ display: "flex", gap: 12, padding: "14px", borderRadius: 12, border: "1px solid #DCFCE7", background: "#F0FDF4" }}>
                  <div style={{ background: "#166534", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Wrench className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#15803D" }}>Technicien</div>
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4, lineHeight: 1.4 }}>Peut gérer les bornes SIM, consulter les logs et effectuer la maintenance.</div>
                  </div>
                </div>

                {/* Lecture seule */}
                <div style={{ display: "flex", gap: 12, padding: "14px", borderRadius: 12, border: "1px solid #FFEDD5", background: "#FFF7ED" }}>
                  <div style={{ background: "#EA580C", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Eye className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#C2410C" }}>Lecture seule</div>
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4, lineHeight: 1.4 }}>Peut uniquement consulter les données sans possibilité de modification.</div>
                  </div>
                </div>

              </div>
            </div>

            {/* Bon à savoir Box */}
            <div style={{ background: "#FEF3C7", borderRadius: 16, padding: 18, border: "1px solid #FDE68A" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ background: "#F59E0B", borderRadius: 8, padding: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Info className="w-4 h-4 text-amber-950" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 4 }}>Bon à savoir</div>
                  <p style={{ fontSize: 11, color: "#B45309", margin: 0, lineHeight: 1.5 }}>
                    Vous pourrez modifier le rôle et les permissions de cet utilisateur à tout moment depuis la page "Utilisateurs".
                  </p>
                </div>
              </div>
            </div>

          </div>

        </form>
      )}
      {/* Modale de détails style "Champion" */}
      {detailsUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#F8FAFC", borderRadius: 24, width: "100%", maxWidth: 850, padding: 0, boxShadow: "0 8px 30px rgba(0,0,0,0.12)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "95vh" }}>

            {/* EN-TÊTE CONCENTRIQUE (Reproduction exacte de la capture) */}
            <div className="relative overflow-hidden" style={{
              backgroundColor: "#1E3A8A",
              backgroundImage: "radial-gradient(circle at calc(100% - 95px) 35%, #3D272B 0%, #3D272B 55px, transparent 55px), radial-gradient(circle at 100% 25%, #4C3236 0%, #4C3236 150px, #1E3A8A 150px, #1E3A8A 300px, transparent 300px)",
              padding: "28px 24px 80px 24px",
              flexShrink: 0
            }}>

              <div className="relative z-10" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 800, color: "#FFB800", margin: 0, marginBottom: 8, letterSpacing: "-0.5px" }}>Détail Utilisateur</h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#E5E7EB", fontSize: 13, fontWeight: 500, fontFamily: "monospace", letterSpacing: "0.5px" }}>{detailsUser.id || "USR-2026-0007"}</span>
                    <button style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, padding: "3px 10px", color: "#E5E7EB", fontSize: 11, fontWeight: 600, cursor: "pointer", backdropFilter: "blur(4px)" }}>
                      Copier
                    </button>
                  </div>
                </div>
                <button onClick={() => setDetailsUser(null)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white", backdropFilter: "blur(4px)", zIndex: 10 }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* CARTE FLOTTANTE (Profil & Contact - Reproduite de l'image) */}
            <div style={{ background: "white", borderRadius: 16, margin: "-50px 24px 24px 24px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", position: "relative", zIndex: 20, padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>

              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {/* Avatar */}
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "white" }}>
                  {detailsUser.nom.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                </div>

                {/* Infos */}
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#111827", marginBottom: 2 }}>
                    {detailsUser.nom}
                  </div>
                  <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 2 }}>
                    {detailsUser.email}
                  </div>
                  <div style={{ fontSize: 13, color: "#9CA3AF" }}>
                    {detailsUser.tel}
                  </div>
                </div>
              </div>

              {/* Badges à droite */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
                <span style={{ background: "#EFF6FF", color: "#3B82F6", padding: "4px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                  {detailsUser.role}
                </span>
                <span style={{ background: detailsUser.statut === "Actif" ? "#DCFCE7" : "#FEE2E2", color: detailsUser.statut === "Actif" ? "#166534" : "#991B1B", padding: "4px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                  {detailsUser.statut}
                </span>
              </div>
            </div>

            {/* CONTENU ONGLETS */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 24, padding: "0 24px", borderBottom: "1px solid #E5E7EB", flexShrink: 0 }}>
                <button
                  onClick={() => setDetailsTab("infos")}
                  style={{ background: "transparent", border: "none", borderBottom: detailsTab === "infos" ? "2px solid #0D0A35" : "2px solid transparent", color: detailsTab === "infos" ? "#0D0A35" : "#6B7280", fontWeight: 700, fontSize: 14, padding: "12px 0", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                >
                  <Info size={16} /> Informations système
                </button>
                <button
                  onClick={() => setDetailsTab("historique")}
                  style={{ background: "transparent", border: "none", borderBottom: detailsTab === "historique" ? "2px solid #0D0A35" : "2px solid transparent", color: detailsTab === "historique" ? "#0D0A35" : "#6B7280", fontWeight: 700, fontSize: 14, padding: "12px 0", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                >
                  <Briefcase size={16} /> Historique des actions
                </button>
              </div>

              {/* Scrollable Content */}
              <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>

                {detailsTab === "infos" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      {/* Connection */}
                      <div style={{ border: "1px solid #E5E7EB", borderRadius: 12, padding: 16, background: "white" }}>
                        <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}><CloudUpload size={14} /> Dernière connexion</div>
                        <div style={{ fontSize: 15, color: "#111827", fontWeight: 700 }}>{detailsUser.derniereConnexion}</div>
                      </div>

                      {/* Compte créé le */}
                      <div style={{ border: "1px solid #E5E7EB", borderRadius: 12, padding: 16, background: "white" }}>
                        <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}><Briefcase size={14} /> Compte créé le</div>
                        <div style={{ fontSize: 15, color: "#111827", fontWeight: 700 }}>14/01/2025</div>
                      </div>
                    </div>

                    {/* Permissions */}
                    <div style={{ border: "1px solid #E5E7EB", borderRadius: 12, padding: 16, background: "white" }}>
                      <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><ShieldCheck size={14} /> Permissions accordées ({detailsUser.permissions.length})</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {detailsUser.permissions.map((p, i) => (
                          <span key={i} style={{ background: "#EEF2FF", color: "#4338CA", border: "1px solid #C7D2FE", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600 }}>{p}</span>
                        ))}
                      </div>
                    </div>

                    {/* Connection */}
                    <div style={{ border: "1px solid #E5E7EB", borderRadius: 12, padding: 16, background: "white" }}>
                      <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><CloudUpload size={14} /> Dernière connexion</div>
                      <div style={{ fontSize: 14, color: "#111827", fontWeight: 600 }}>{detailsUser.derniereConnexion}</div>
                    </div>

                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 0, paddingLeft: 8 }}>
                    {/* Mock Timeline */}
                    {[
                      { action: "S'est connecté(e) au système", date: "Aujourd'hui, 08h30", icon: Unlock, bg: "#DCFCE7", color: "#166534" },
                      { action: "A consulté la liste des utilisateurs", date: "Aujourd'hui, 08h35", icon: Eye, bg: "#E0F2FE", color: "#0369A1" },
                      { action: "A modifié ses informations personnelles", date: "Hier, 15h20", icon: Edit2, bg: "#FEF3C7", color: "#B45309" },
                      { action: "A exporté le rapport d'activité mensuel", date: "Il y a 3 jours", icon: CloudUpload, bg: "#EEF2FF", color: "#4338CA" },
                      { action: "Compte créé par l'administrateur", date: "Il y a 1 mois", icon: UserPlus, bg: "#F3F4F6", color: "#4B5563" }
                    ].map((act, index, arr) => (
                      <div key={index} style={{ display: "flex", gap: 16, position: "relative", paddingBottom: index === arr.length - 1 ? 0 : 24 }}>
                        {/* Timeline line */}
                        {index !== arr.length - 1 && (
                          <div style={{ position: "absolute", left: 15, top: 32, bottom: 0, width: 2, background: "#E5E7EB" }} />
                        )}

                        {/* Timeline icon */}
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: act.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 2 }}>
                          <act.icon size={14} style={{ color: act.color }} />
                        </div>

                        {/* Timeline content */}
                        <div style={{ paddingTop: 4 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{act.action}</div>
                          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>{act.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Buttons style Champion */}
              <div style={{ padding: "16px 24px", background: "white", borderTop: "1px solid #F3F4F6", display: "flex", gap: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
                <button
                  onClick={() => {
                    handleStartEdit(detailsUser);
                    setDetailsUser(null);
                  }}
                  style={{ flex: 1, background: "#FFB800", color: "#1F0270", border: "none", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  <Edit2 size={16} /> Modifier
                </button>
                <button
                  onClick={() => handleToggleBlock(detailsUser.id)}
                  style={{ flex: 1, background: "white", color: detailsUser.statut === "Actif" ? "#DC2626" : "#16A34A", border: detailsUser.statut === "Actif" ? "1px solid #FECACA" : "1px solid #BBF7D0", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  {detailsUser.statut === "Actif" ? "Bloquer l'accès" : "Débloquer l'accès"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
