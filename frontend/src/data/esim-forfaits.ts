/**
 * Données de démonstration — Forfaits eSIM N'ma SIM
 * ⚠️ PROTOTYPE : Ces données sont utilisées à des fins de démonstration uniquement.
 * La prochaine phase technique intégrera l'infrastructure eSIM/RSP de l'opérateur.
 */

export interface EsimForfait {
  id: string;
  nom: string;
  description: string;
  prixGNF: number;
  data: string;
  appels: string;
  sms: string;
  duree: string;
  couleur: string;
  populaire?: boolean;
}

export const ESIM_FORFAITS_DEMO: EsimForfait[] = [
  {
    id: "esim-starter",
    nom: "eSIM Starter",
    description: "Idéal pour commencer avec l'eSIM",
    prixGNF: 15000,
    data: "3 Go",
    appels: "100 min",
    sms: "50 SMS",
    duree: "30 jours",
    couleur: "#4F46E5",
  },
  {
    id: "esim-pro",
    nom: "eSIM Pro",
    description: "La solution équilibrée pour tous",
    prixGNF: 25000,
    data: "8 Go",
    appels: "Illimité",
    sms: "100 SMS",
    duree: "30 jours",
    couleur: "#1F0270",
    populaire: true,
  },
  {
    id: "esim-illimite",
    nom: "eSIM Illimité",
    description: "Pour les gros utilisateurs",
    prixGNF: 45000,
    data: "Illimité",
    appels: "Illimité",
    sms: "Illimité",
    duree: "30 jours",
    couleur: "#FFBA08",
  },
];
