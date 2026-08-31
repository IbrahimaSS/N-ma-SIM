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

// ─── Table de mapping ────────────────────────────────────────────────────────
const AUDIO_MAP: Record<string, string> = {
  // ── Commun ────────────────────────────────────────────────────────────────
  'choix-service': `${BASE}/commun/Choix_Service.wav`,
  'repeter': `${BASE}/commun/Veuillez_repeter.wav`,
  'non-compris': `${BASE}/commun/Je_nai_pas_compris.wav`,

  // ── Nouvelle SIM ──────────────────────────────────────────────────────────
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

  // ── Réactivation ──────────────────────────────────────────────────────────
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

/**
 * Retourne l'URL du fichier WAV Soussou correspondant à l'étape et au service.
 * @param step       currentStep (ex: "scan-piece", "selfie", "paiement"...)
 * @param service    "nouvelle-sim" | "reactivation" | null
 * @param extraKey   clé optionnelle pour sous-étapes (ex: "motif", "freq", "recto", "verso")
 * @returns URL absolue du WAV, ou null si pas de fichier pour cette étape
 */
export function getSoussouAudioUrl(
  step: string,
  service: string | null,
  extraKey?: string
): string | null {
  // Clé composée : "service:step-extraKey" ou "service:step" ou "step" seul
  const suffix = extraKey ? `${step}-${extraKey}` : step;
  const composedKey = service ? `${service}:${suffix}` : suffix;

  return AUDIO_MAP[composedKey] ?? AUDIO_MAP[step] ?? null;
}

/**
 * Joue un fichier WAV Soussou directement dans le navigateur.
 * Retourne une Promise qui se résout quand l'audio est terminé.
 */
export function jouerSoussou(
  step: string,
  service: string | null,
  extraKey?: string
): Promise<void> {
  return new Promise((resolve) => {
    const url = getSoussouAudioUrl(step, service, extraKey);
    if (!url) { resolve(); return; }

    const audio = new Audio(url);
    audio.onended = () => resolve();
    audio.onerror = () => resolve(); // En cas d'erreur, on continue quand même
    audio.play().catch(() => resolve());
  });
}
