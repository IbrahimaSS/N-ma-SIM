// ======================================================
// DONNÉES MOCKÉES — ESPACE ADMIN N'MA SIM
// ======================================================

export const MOCK_DEMANDES = [
  { id: "NMA-2026-000128", type: "Nouvelle SIM", client: { nom: "Camara Yamoussa", tel: "+224 620 12 34 56", avatar: null }, offre: "SIM + Internet", montant: 20000, paiement: "Payé", paiementStatut: "Confirmé", ia: "OK", iaDetail: "Identité valide", statut: "En attente de validation", date: "20/05/2026 10:24" },
  { id: "NMA-2026-000127", type: "Nouvelle SIM", client: { nom: "Mariama Diallo", tel: "+224 621 45 67 89", avatar: null }, offre: "SIM Standard", montant: 10000, paiement: "Payé", paiementStatut: "Confirmé", ia: "OK", iaDetail: "Identité valide", statut: "Validée", date: "20/05/2026 09:58" },
  { id: "NMA-2026-000126", type: "Réactivation", client: { nom: "Ibrahima Sylla", tel: "+224 624 33 22 11", avatar: null }, offre: "Réactivation", montant: 10000, paiement: "Payé", paiementStatut: "Confirmé", ia: "OK", iaDetail: "Identité valide", statut: "Validée", date: "20/05/2026 09:45" },
  { id: "NMA-2026-000125", type: "Nouvelle SIM", client: { nom: "Alhassane Camara", tel: "+224 622 98 76 54", avatar: null }, offre: "SIM + Internet", montant: 20000, paiement: "En attente", paiementStatut: "En attente de paiement", ia: "En attente", iaDetail: "Analyse en cours", statut: "En attente de validation", date: "20/05/2026 09:30" },
  { id: "NMA-2026-000124", type: "Nouvelle SIM", client: { nom: "Aissatou Bah", tel: "+224 623 11 22 33", avatar: null }, offre: "SIM Standard", montant: 10000, paiement: "Payé", paiementStatut: "Remboursé", ia: "Rejetée", iaDetail: "Document illisible", statut: "Rejetée", date: "20/05/2026 09:15" },
  { id: "NMA-2026-000123", type: "Réactivation", client: { nom: "Mamadou Keita", tel: "+224 620 44 55 66", avatar: null }, offre: "Réactivation", montant: 10000, paiement: "Payé", paiementStatut: "Confirmé", ia: "OK", iaDetail: "Identité valide", statut: "Validée", date: "20/05/2026 08:52" },
  { id: "NMA-2026-000122", type: "Nouvelle SIM", client: { nom: "Fatoumata Bangoura", tel: "+224 621 77 88 99", avatar: null }, offre: "SIM Étudiant", montant: 15000, paiement: "En attente", paiementStatut: "En attente de paiement", ia: "En attente", iaDetail: "Analyse en cours", statut: "En attente de validation", date: "20/05/2026 08:30" },
  { id: "NMA-2026-000121", type: "Réactivation", client: { nom: "Seynabou Diallo", tel: "+224 625 33 44 22", avatar: null }, offre: "Réactivation", montant: 10000, paiement: "Payé", paiementStatut: "Confirmé", ia: "OK", iaDetail: "Identité valide", statut: "Validée", date: "19/05/2026 16:45" },
];

export const MOCK_PAIEMENTS = [
  { ref: "PAY-2026-001248", ticket: "NMA-2026-000128", client: { nom: "Camara Yamoussa", tel: "+224 620 12 34 56" }, mode: "Orange Money", montant: 20000, service: "SIM + Internet", statut: "Confirmé", date: "12/06/2026 14:32" },
  { ref: "PAY-2026-001247", ticket: "NMA-2026-000127", client: { nom: "Mariama Diallo", tel: "+224 621 45 67 89" }, mode: "VISA", montant: 10000, service: "SIM Standard", statut: "Confirmé", date: "12/06/2026 14:10" },
  { ref: "PAY-2026-001246", ticket: "NMA-2026-000126", client: { nom: "Ibrahima Sylla", tel: "+224 624 33 22 11" }, mode: "Retrait numéro", montant: 10000, service: "Réactivation", statut: "Confirmé", date: "12/06/2026 13:58" },
  { ref: "PAY-2026-001245", ticket: "NMA-2026-000125", client: { nom: "Alhassane Camara", tel: "+224 622 98 76 54" }, mode: "Espèces", montant: 20000, service: "SIM + Internet", statut: "En attente", date: "12/06/2026 13:45" },
  { ref: "PAY-2026-001244", ticket: "NMA-2026-000124", client: { nom: "Aissatou Bah", tel: "+224 623 11 22 33" }, mode: "Orange Money", montant: 10000, service: "SIM Standard", statut: "Échoué", date: "12/06/2026 13:21" },
  { ref: "PAY-2026-001243", ticket: "NMA-2026-000123", client: { nom: "Mamadou Keita", tel: "+224 620 44 55 66" }, mode: "VISA", montant: 10000, service: "Réactivation", statut: "Remboursé", date: "12/06/2026 12:59" },
];

export const MOCK_CLIENTS = [
  { id: "CLI-001", nom: "Camara Yamoussa", tel: "+224 620 12 34 56", profil: "Résident", typePiece: "CNI", numeroPiece: "CNI-224-2021-001234", serviceRecent: "SIM + Internet", statut: "Validé", derniereActivite: "12 mai 2026 10:24" },
  { id: "CLI-002", nom: "Mariama Diallo", tel: "+224 621 45 67 89", profil: "Résidente", typePiece: "Passeport", numeroPiece: "P-224-2023-009876", serviceRecent: "SIM Standard", statut: "Validé", derniereActivite: "12 mai 2026 09:41" },
  { id: "CLI-003", nom: "Ibrahima Sylla", tel: "+224 624 33 22 11", profil: "Résident", typePiece: "CNI", numeroPiece: "CNI-224-2019-004567", serviceRecent: "Réactivation", statut: "En attente", derniereActivite: "12 mai 2026 08:15" },
  { id: "CLI-004", nom: "Alhassane Camara", tel: "+224 622 98 76 54", profil: "Résident", typePiece: "CNI", numeroPiece: "CNI-224-2020-002345", serviceRecent: "SIM + Internet", statut: "En attente", derniereActivite: "11 mai 2026 17:32" },
  { id: "CLI-005", nom: "Aissatou Bah", tel: "+224 623 11 22 33", profil: "Résidente", typePiece: "Passeport", numeroPiece: "P-224-2022-007654", serviceRecent: "SIM Standard", statut: "Validé", derniereActivite: "11 mai 2026 16:08" },
];

export const MOCK_UTILISATEURS = [
  { id: "USR-001", nom: "Camara Yamoussa", email: "yamoussa.camara@nmasim.gn", tel: "+224 620 12 34 56", role: "Admin", statut: "Actif", derniereConnexion: "Aujourd'hui à 09:42", permissions: ["Toutes"] },
  { id: "USR-002", nom: "Mariama Diallo", email: "mariama.diallo@nmasim.gn", tel: "+224 621 45 67 89", role: "Agent", statut: "Actif", derniereConnexion: "Aujourd'hui à 08:15", permissions: ["Demandes", "Clients", "Paiements"] },
  { id: "USR-003", nom: "Ibrahima Sylla", email: "Ibrahima.sylla@nmasim.gn", tel: "+224 624 33 22 11", role: "Technicien", statut: "Actif", derniereConnexion: "Hier à 16:30", permissions: ["Demandes", "Offres"] },
  { id: "USR-004", nom: "Alhassane Camara", email: "alhassane.camara@nmasim.gn", tel: "+224 622 98 76 54", role: "Agent", statut: "Actif", derniereConnexion: "Hier à 14:05", permissions: ["Demandes", "Clients"] },
  { id: "USR-005", nom: "Aissatou Bah", email: "aissatou.bah@nmasim.gn", tel: "+224 623 11 22 33", role: "Technicien", statut: "Inactif", derniereConnexion: "Il y a 3 jours", permissions: ["Demandes", "Offres"] },
];

export const MOCK_LOGS = [
  { date: "08/06/2026 14:35:22", utilisateur: { nom: "Camara Yamoussa", email: "admin@yamoussa.sn" }, module: "Demandes SIM", action: "Validation", reference: "NMA-2026-000128", detail: "Demande SIM validée pour Camara Yamoussa (20 000 GNF)", niveau: "Succès" },
  { date: "08/06/2026 14:22:11", utilisateur: { nom: "Mariama Diallo", email: "m.diallo@nmasim.sn" }, module: "Paiements", action: "Confirmation", reference: "PAY-2026-004512", detail: "Paiement confirmé par Orange Money (20 000 GNF)", niveau: "Succès" },
  { date: "08/06/2026 14:05:47", utilisateur: { nom: "Ibrahima Sylla", email: "i.sylla@nmasim.sn" }, module: "Utilisateurs", action: "Connexion", reference: "AUTH-2026-009871", detail: "Connexion réussie depuis 192.168.1.45", niveau: "Info" },
  { date: "08/06/2026 13:41:19", utilisateur: { nom: "Seynabou Diallo", email: "s.diallo@nmasim.sn" }, module: "Demandes SIM", action: "Rejet", reference: "NMA-2026-000124", detail: "Demande rejetée: Document illisible", niveau: "Critique" },
  { date: "08/06/2026 12:18:36", utilisateur: { nom: "Aissata Bah", email: "a.bah@nmasim.sn" }, module: "Paiements", action: "Échec", reference: "PAY-2026-004511", detail: "Échec de paiement: Solde insuffisant", niveau: "Alerte" },
];

export const MOCK_OFFRES_ADMIN = [
  { id: "off-1", nom: "SIM Standard", description: "Carte SIM basique pour appels, SMS et services essentiels.", prix: 10000, typeService: "Nouvelle SIM", statut: "Active", icon: "📱" },
  { id: "off-2", nom: "SIM + Internet", description: "Carte SIM avec forfait data et services internet inclus.", prix: 20000, typeService: "Nouvelle SIM", statut: "Active", icon: "🌐" },
  { id: "off-3", nom: "SIM Étudiant", description: "Offre spéciale étudiants avec tarifs préférentiels.", prix: 15000, typeService: "Nouvelle SIM", statut: "Active", icon: "🎓" },
  { id: "off-4", nom: "Réactivation de puce", description: "Réactivation d'une SIM existante avec conservation du numéro.", prix: 10000, typeService: "Réactivation", statut: "Active", icon: "🔄" },
];
