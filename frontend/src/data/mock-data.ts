import { Offer, User, DemandeSIM, Paiement } from "@/types";

export const MOCK_OFFERS: Offer[] = [
  {
    id: "off-1",
    titre: "SIM Standard",
    description: "Nouvelle SIM simple",
    prixGNF: 10000,
    type: "STANDARD",
  },
  {
    id: "off-2",
    titre: "SIM + Internet",
    description: "SIM avec forfait data",
    prixGNF: 20000,
    type: "INTERNET",
  },
  {
    id: "off-3",
    titre: "SIM Étudiant",
    description: "Offre adaptée aux étudiants",
    prixGNF: 15000,
    type: "ETUDIANT",
  }
];

export const MOCK_USERS: User[] = [
  {
    id: "usr-1",
    nomComplet: "Admin Principal",
    email: "admin@nmasim.gn",
    telephone: "0622001122",
    role: "ADMIN",
    departement: "Direction"
  },
  {
    id: "usr-2",
    nomComplet: "Agent Guichet",
    email: "agent@nmasim.gn",
    telephone: "0622003344",
    role: "AGENT",
    departement: "Service Client"
  }
];
