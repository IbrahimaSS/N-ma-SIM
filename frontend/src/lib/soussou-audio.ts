/**
 * Mapping complet : currentStep + service + extraKey → URL du fichier WAV Soussou
 * Les fichiers sont servis depuis /public/audio/sus/...
 * L'IA Groq n'est PAS appelée quand la langue est "sus" — l'audio remplace tout.
 */

const BASE = '/audio/sus';

// ─── Types ───────────────────────────────────────────────────────────────────
type SousouKey =
  | 'choix-service'
  | 'scan-piece'
  | 'scan-recto'
  | 'scan-verso'
  | 'selfie'
  | 'selfie-erreur'
  | 'choix-offre'
  | 'paiement'
  | 'paiement-om-confirm'
  | 'recu'
  | 'felicitations'
  | 'numero-reactivation-numero'
  | 'numero-reactivation-motif'
  | 'numero-reactivation-freq'
  | 'piece-identite'
  | 'piece-identite-recto'
  | 'piece-identite-verso';

// ─── Table de mapping Soussou ──────────────────────────────────────────────────
const SOUSSOU_MAP: Record<string, string> = {
  // ── Commun
  'choix-service': `${BASE}/commun/Choix_Service.wav`,
  'repeter': `${BASE}/commun/Veuillez_repeter.wav`,
  'non-compris': `${BASE}/commun/Je_nai_pas_compris.wav`,

  // ── Nouvelle SIM
  'nouvelle-sim:scan-piece':            `${BASE}/nouvelle_sim/Etape_1_Type_piece.wav`,
  'nouvelle-sim:scan-recto':            `${BASE}/nouvelle_sim/Etape_2_1_Scan_piece_recto.wav`,
  'nouvelle-sim:scan-verso':            `${BASE}/nouvelle_sim/Etape_2_2_Scan_piece_Verso_si_piece_n_est_pas_electeur.wav`,
  'nouvelle-sim:selfie':                `${BASE}/nouvelle_sim/Etape_3_1_Selfie_Scan.wav`,
  'nouvelle-sim:selfie-erreur':         `${BASE}/nouvelle_sim/Etape_3_2_erreur_lors_verification_visage.wav`,
  'nouvelle-sim:choix-offre':           `${BASE}/nouvelle_sim/Etape_4_choix_recharge_direct_facultatives.wav`,
  'nouvelle-sim:choix-montant':         `${BASE}/nouvelle_sim/Etape_4_1_choix_montant_recharge.m4a`,
  'nouvelle-sim:paiement':              `${BASE}/nouvelle_sim/Etape_5_Choix_de_moyen_paiement.wav`,
  'nouvelle-sim:paiement-om-confirm':   `${BASE}/nouvelle_sim/Etape_6_Confirmation_de_paiement_via_OM.wav`,
  'nouvelle-sim:recu':                  `${BASE}/nouvelle_sim/Etape_7_Recuperation_de_recu.wav`,
  'nouvelle-sim:felicitations':         `${BASE}/nouvelle_sim/Etape_8_Final_SIM_recupere_SIM.wav`,

  // ── Réactivation
  'reactivation:numero-reactivation':        `${BASE}/reactivation/Etape_1_1_mettre_le_numero_a_reactiver.wav`,
  'reactivation:numero-reactivation-numero': `${BASE}/reactivation/Etape_1_1_mettre_le_numero_a_reactiver.wav`,
  'reactivation:numero-reactivation-motif':  `${BASE}/reactivation/Etape_1_2_motif_reactivation.wav`,
  'reactivation:numero-reactivation-freq':   `${BASE}/reactivation/Etape_1_3_Mettre_les_2_numeros_favoris_pour_reactivation.wav`,
  'reactivation:piece-identite':             `${BASE}/reactivation/Etape_2_1_choix_de_type_piece.wav`,
  'reactivation:piece-identite-recto':       `${BASE}/reactivation/Etape_2_2_Scan_piece_recto - Copie.wav`,
  'reactivation:piece-identite-verso':       `${BASE}/reactivation/Etape_2_3_Scan_piece_Verso.wav`,
  'reactivation:selfie':                     `${BASE}/reactivation/Etape_3_1_Selfie_Scan.wav`,
  'reactivation:selfie-erreur':              `${BASE}/reactivation/Etape_3_2_erreur_lors_verification_visage.wav`,
  'reactivation:paiement':                   `${BASE}/reactivation/Etape_4_Choix_de_moyen_paiement.wav`,
  'reactivation:paiement-om-confirm':        `${BASE}/reactivation/Etape_5_Confirmation_de_paiement_via_OM.wav`,
  'reactivation:recu':                       `${BASE}/reactivation/Etape_6_Recuperation_de_recu.wav`,
  'reactivation:felicitations':              `${BASE}/reactivation/Etape_7_Final_SIM_recupere_SIM.wav`,
};

// ─── Table de mapping Poular ─────────────────────────────────────────────────
const BASE_POU = '/audio/pou';

const POULAR_MAP: Record<string, string> = {
  // ── Commun
  'choix-service': `${BASE_POU}/Les_1eres_etapes_apres_choix_langue/Etape_1_Choix_Service.mp3`,
  'repeter': `${BASE}/commun/Veuillez_repeter.wav`, // Fallback Soussou temporaire si manquant
  'non-compris': `${BASE}/commun/Je_nai_pas_compris.wav`, // Fallback

  // ── Nouvelle SIM
  'nouvelle-sim:scan-piece':            `${BASE_POU}/Nouvelle_SIM/Etape_1_1_Type_piece.mp3`,
  'nouvelle-sim:scan-recto':            `${BASE_POU}/Nouvelle_SIM/Etape_1_2_Scan_piece.mp3`,
  'nouvelle-sim:scan-verso':            `${BASE_POU}/Nouvelle_SIM/Etape_1_2_Scan_piece.mp3`,
  'nouvelle-sim:selfie':                `${BASE_POU}/Nouvelle_SIM/Etape_2_selfie.mp3`,
  'nouvelle-sim:selfie-erreur':         `${BASE_POU}/Nouvelle_SIM/Echec_de_Verification_Visage/Etape_3_2_erreur_lors_verification_visage.mp3`,
  'nouvelle-sim:choix-offre':           `${BASE_POU}/Nouvelle_SIM/Etape_3_recharge_facultatif_.mp3`,
  'nouvelle-sim:choix-montant':         `${BASE_POU}/Nouvelle_SIM/Etape_3_Interne_recharge/Etape_4_1_choix_montant_recharge.mp3`,
  'nouvelle-sim:paiement':              `${BASE_POU}/Nouvelle_SIM/Etape_4_choix_type_paiement.mp3`,
  'nouvelle-sim:paiement-om-confirm':   `${BASE_POU}/Nouvelle_SIM/Etape_6_Confirmation_de_paiement_OM.m4a`,
  'nouvelle-sim:recu':                  `${BASE_POU}/Nouvelle_SIM/Etape_7_ticket_reçu.m4a`,
  'nouvelle-sim:felicitations':         `${BASE_POU}/Nouvelle_SIM/Etape_8_FIN_recupere_SIM.m4a`,

  // ── Réactivation
  'reactivation:numero-reactivation':        `${BASE_POU}/Reactivation/Etape_1_1_entrer_le_numero_a_reactiver_V1.mp3`,
  'reactivation:numero-reactivation-numero': `${BASE_POU}/Reactivation/Etape_1_1_entrer_le_numero_a_reactiver_V1.mp3`,
  'reactivation:numero-reactivation-motif':  `${BASE_POU}/Reactivation/Etape_1_2_Motifs.mp3`,
  'reactivation:numero-reactivation-freq':   `${BASE_POU}/Reactivation/Etape_1_3_numero_frequements_appelés.mp3`,
  'reactivation:piece-identite':             `${BASE_POU}/Reactivation/Etape_2_1_Type_Piece.mp3`,
  'reactivation:piece-identite-recto':       `${BASE_POU}/Reactivation/Etape_2_2_Scan_Piece.mp3`,
  'reactivation:piece-identite-verso':       `${BASE_POU}/Reactivation/Etape_2_2_Scan_Piece.mp3`,
  'reactivation:selfie':                     `${BASE_POU}/Reactivation/Etape_3_Selfie.mp3`,
  'reactivation:selfie-erreur':              `${BASE_POU}/Reactivation/Echec_de_Verification_Visage/Etape_3_2_erreur_lors_verification_visage.mp3`,
  'reactivation:paiement':                   `${BASE_POU}/Reactivation/Etape_4_choix_type_paiement.mp3`,
  'reactivation:paiement-om-confirm':        `${BASE_POU}/Reactivation/Etape_6_Confirmation_de_paiement_OM.mp3`,
  'reactivation:recu':                       `${BASE_POU}/Reactivation/Etape_7_ticket_reçu.mp3`,
  'reactivation:felicitations':              `${BASE_POU}/Reactivation/Etape_8_FIN_recupere_SIM.mp3`,
};

// ─── Table de mapping Malinké ────────────────────────────────────────────────
// Fichiers fournis nommés par thème (pas par "Etape_X") — mapping déduit du nom
// de fichier faute de pouvoir écouter le contenu : à vérifier/corriger si un
// audio ne correspond pas à l'étape attendue.
const BASE_MAL = '/audio/mal';

const MALINKE_MAP: Record<string, string> = {
  // ── Commun
  'choix-service': `${BASE_MAL}/nouvelle_sim/1-quelle_service.m4a`,

  // ── Nouvelle SIM
  'nouvelle-sim:scan-piece':            `${BASE_MAL}/nouvelle_sim/2-quelle_piece.m4a`,
  'nouvelle-sim:scan-recto':            `${BASE_MAL}/nouvelle_sim/3-mettrepapier_scanner.m4a`,
  'nouvelle-sim:scan-verso':            `${BASE_MAL}/nouvelle_sim/4-scanner_carteIdentite.m4a`,
  'nouvelle-sim:selfie':                `${BASE_MAL}/nouvelle_sim/5-regarde_camera.m4a`,
  'nouvelle-sim:selfie-erreur':         `${BASE_MAL}/nouvelle_sim/6-echec_authentification.m4a`,
  'nouvelle-sim:choix-offre':           `${BASE_MAL}/nouvelle_sim/7-choix_credit.m4a`,
  'nouvelle-sim:choix-montant':         `${BASE_MAL}/nouvelle_sim/8-montant_credit.m4a`,
  'nouvelle-sim:paiement':              `${BASE_MAL}/nouvelle_sim/9-mode_paiement.m4a`,
  'nouvelle-sim:paiement-om-confirm':   `${BASE_MAL}/nouvelle_sim/10-lenumero_quidoitpayer.m4a`,
  'nouvelle-sim:paiement-erreur':       `${BASE_MAL}/nouvelle_sim/11-echec_depot.m4a`,
  'nouvelle-sim:recu':                  `${BASE_MAL}/nouvelle_sim/12-recuperer_reçu.m4a`,
  'nouvelle-sim:felicitations':         `${BASE_MAL}/nouvelle_sim/13-recuperer_puce.m4a`,

  // ── Réactivation
  'reactivation:numero-reactivation':        `${BASE_MAL}/reactivation/2-numero_reactiver.m4a`,
  'reactivation:numero-reactivation-numero': `${BASE_MAL}/reactivation/2-numero_reactiver.m4a`,
  'reactivation:numero-reactivation-motif':  `${BASE_MAL}/reactivation/3-motif_reactiver.m4a`,
  'reactivation:numero-reactivation-freq':   `${BASE_MAL}/reactivation/4-deux_numero.m4a`,
  'reactivation:piece-identite':             `${BASE_MAL}/reactivation/6-quelle_piece.m4a`,
  'reactivation:piece-identite-recto':       `${BASE_MAL}/reactivation/7-mettrepapier_scanner.m4a`,
  'reactivation:piece-identite-verso':       `${BASE_MAL}/reactivation/8-scanner_carteIdentite.m4a`,
  'reactivation:selfie':                     `${BASE_MAL}/reactivation/9-regarde_camera.m4a`,
  'reactivation:selfie-erreur':              `${BASE_MAL}/reactivation/10-echec_authentification.m4a`,
  'reactivation:choix-offre':                `${BASE_MAL}/reactivation/11-choix_credit.m4a`,
  'reactivation:choix-montant':              `${BASE_MAL}/reactivation/12-montant_credit.m4a`,
  'reactivation:paiement':                   `${BASE_MAL}/reactivation/13-mode_paiement.m4a`,
  'reactivation:paiement-om-confirm':        `${BASE_MAL}/reactivation/14-lenumero_quidoitpayer.m4a`,
  'reactivation:paiement-erreur':            `${BASE_MAL}/reactivation/15-echec_depot.m4a`,
  'reactivation:recu':                       `${BASE_MAL}/reactivation/16-recuperer_reçu.m4a`,
  'reactivation:felicitations':              `${BASE_MAL}/reactivation/17-recuperer_puce.m4a`,
  // Non mappé faute d'étape équivalente dans l'app : reactivation/5-unNumero_fonctionpas.m4a
};

/**
 * Retourne l'URL du fichier audio correspondant à l'étape, au service et à la langue.
 */
export function getAudioUrl(
  lang: string,
  step: string,
  service: string | null,
  extraKey?: string
): string | null {
  const suffix = extraKey ? `${step}-${extraKey}` : step;
  const composedKey = service ? `${service}:${suffix}` : suffix;

  if (lang === 'pou') {
    return POULAR_MAP[composedKey] ?? POULAR_MAP[step] ?? null;
  }
  if (lang === 'mal') {
    return MALINKE_MAP[composedKey] ?? MALINKE_MAP[step] ?? null;
  }
  return SOUSSOU_MAP[composedKey] ?? SOUSSOU_MAP[step] ?? null;
}

/**
 * Joue un fichier audio local (Soussou ou Poular) directement dans le navigateur.
 */
export function jouerAudioLocal(
  lang: string,
  step: string,
  service: string | null,
  extraKey?: string
): Promise<void> {
  return new Promise((resolve) => {
    const url = getAudioUrl(lang, step, service, extraKey);
    if (!url) { resolve(); return; }

    const audio = new Audio(url);
    audio.onended = () => resolve();
    audio.onerror = () => resolve(); // En cas d'erreur, on continue quand même
    audio.play().catch(() => resolve());
  });
}
