export type UserRole = "ADMIN" | "AGENT" | "TECHNICIEN" | "LECTURE_SEULE";

export type RequestType = "NOUVELLE_SIM" | "REACTIVATION";

export type RequestStatus =
  | "EN_COURS"
  | "DOCUMENT_ANALYSE"
  | "INFOS_A_CONFIRMER"
  | "SELFIE_VALIDE"
  | "CONTROLE_LIGNE_EN_COURS"
  | "PAIEMENT_EN_ATTENTE"
  | "PAIEMENT_CONFIRME"
  | "EN_ATTENTE_VALIDATION"
  | "VALIDEE"
  | "REJETEE"
  | "TERMINEE";

export type PaymentStatus =
  | "EN_ATTENTE"
  | "CONFIRME"
  | "ECHOUE"
  | "REMBOURSE";

export type PaymentMethod = 
  | "ORANGE_MONEY" 
  | "NATIF" 
  | "VISA";

export type ProfileType = "RESIDENT" | "ETRANGER";

export interface User {
  id: string;
  nomComplet: string;
  email: string;
  telephone: string;
  role: UserRole;
  departement?: string;
  photoUrl?: string;
}

export interface Client {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  typePiece: string;
  numeroPiece: string;
}

export interface Offer {
  id: string;
  titre: string;
  description: string;
  prixGNF: number;
  type: "STANDARD" | "INTERNET" | "ETUDIANT" | "REACTIVATION";
  icone?: string;
}

export interface DemandeSIM {
  id: string;
  reference: string;
  type: RequestType;
  status: RequestStatus;
  dateCreation: string;
  client: Client;
  offre?: Offer;
  montantTotal?: number;
  paiementId?: string;
  
  // Spécifique Réactivation
  numeroAReactiver?: string;
  motifReactivation?: string;
  numerosFrequents?: [string, string]; // Les 2 numéros exigés
}

export interface Paiement {
  id: string;
  reference: string;
  montantGNF: number;
  methode: PaymentMethod;
  status: PaymentStatus;
  date: string;
  demandeId: string;
}
