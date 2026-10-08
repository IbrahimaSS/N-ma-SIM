import type { KycReponse } from "@/types/kyc";

type Langue = string | null | undefined;

/** Garde-fou de délivrance : seule une identité "ACCEPTÉ" par le KYC peut recevoir une SIM. */
export function identiteValidee(result: KycReponse | null | undefined): boolean {
  return (result?.decision ?? "").toUpperCase().includes("ACCEPTÉ");
}

export interface Explication {
  titre: string;
  message: string;
  /** Le problème vient du visage : reprendre le selfie peut le résoudre. */
  probleme_visage: boolean;
}

const NOMS_CHAMPS: Record<string, [string, string]> = {
  nom: ["le nom", "the last name"],
  prenom: ["le prénom", "the first name"],
  date_naissance: ["la date de naissance", "the date of birth"],
  numero_identite: ["le numéro de la pièce", "the document number"],
};

/** Raisons lisibles extraites du journal `details` (pénalités "(+N)" du moteur KYC). */
function raisonsDuJournal(details: string[], en: boolean): string[] {
  const raisons = new Set<string>();
  for (const d of details) {
    if (/très floue|netteté faible/i.test(d)) {
      raisons.add(en ? "the photo of your document is blurry" : "la photo de votre pièce est floue");
    } else if (/champ manquant/i.test(d)) {
      const cle = d.split(":")[1]?.replace(/\(.*\)/, "").trim() ?? "";
      const nom = NOMS_CHAMPS[cle]?.[en ? 1 : 0] ?? cle;
      raisons.add(en ? `${nom} could not be read` : `${nom} n'a pas pu être lu`);
    } else if (/âge non vérifiable/i.test(d)) {
      raisons.add(en ? "the date of birth is unreadable" : "la date de naissance est illisible");
    } else if (/^cohérence/i.test(d)) {
      raisons.add(en ? "some information on the voter card is inconsistent" : "certaines informations de la carte d'électeur sont incohérentes");
    } else if (/visage non concordant/i.test(d)) {
      raisons.add(en ? "your face does not match the photo on the document" : "votre visage ne correspond pas à la photo de la pièce");
    } else if (/visage non vérifiable/i.test(d)) {
      raisons.add(en ? "your face could not be checked" : "votre visage n'a pas pu être vérifié");
    }
  }
  return [...raisons];
}

/**
 * Traduit la décision du KYC en un message précis pour le client : la cause exacte
 * (lue dans `decision` et `details`) et ce qu'il doit faire.
 */
export function expliquerDecision(result: KycReponse, lang: Langue = "fr"): Explication {
  const en = lang === "en";
  const decision = (result.decision ?? "").toUpperCase();
  const details = result.details ?? [];
  const erreurVisage = (result.face ?? result.visage)?.erreur ?? "";
  const trouver = (re: RegExp) => details.map((d) => d.match(re)).find(Boolean);
  const e = (fr: string, anglais: string) => (en ? anglais : fr);
  const visageNonConcordant: Explication = {
    titre: e("Visage non concordant", "Face does not match"),
    message: e(
      "Votre selfie ne correspond pas à la photo de votre pièce d'identité. Placez-vous bien face à la caméra et reprenez le selfie.",
      "Your selfie does not match the photo on your ID. Face the camera and take the selfie again."
    ),
    probleme_visage: true,
  };

  if (decision.includes("REPRENDRE LE SELFIE")) {
    const restants = result.tentatives_restantes;
    return {
      ...visageNonConcordant,
      message:
        visageNonConcordant.message +
        (restants != null ? e(` (${restants} essai(s) restant(s))`, ` (${restants} attempt(s) left)`) : ""),
    };
  }

  if (decision.includes("TROP DE TENTATIVES")) {
    const fin = result.reessayer_apres ? new Date(result.reessayer_apres) : null;
    const locale = en ? "en-GB" : "fr-FR";
    const quand =
      fin && !isNaN(fin.getTime())
        ? `${fin.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" })} ${en ? "at" : "à"} ${fin.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}`
        : null;
    return {
      titre: e("Nombre de tentatives dépassé", "Too many attempts"),
      message: e(
        `Vous avez atteint le nombre maximal de 5 tentatives de vérification. Par sécurité, veuillez patienter 24 heures avant de réessayer${quand ? ` (à partir du ${quand})` : ""}.`,
        `You have reached the maximum of 5 verification attempts. For security reasons, please wait 24 hours before trying again${quand ? ` (from ${quand})` : ""}.`
      ),
      probleme_visage: false,
    };
  }

  if (decision.includes("REPRENDRE_PHOTO")) {
    if (details.some((d) => /floue/i.test(d))) {
      return {
        titre: e("Photo de la pièce trop floue", "Document photo too blurry"),
        message: e(
          "La photo de votre pièce est trop floue pour être lue. Posez la pièce bien à plat, sans reflet, et reprenez la photo.",
          "The photo of your document is too blurry to read. Lay it flat, avoid glare and take the photo again."
        ),
        probleme_visage: false,
      };
    }
    if (details.some((d) => /pays émetteur/i.test(d))) {
      return {
        titre: e("Mention « République de Guinée » illisible", "“Republic of Guinea” not readable"),
        message: e(
          "Nous n'arrivons pas à lire la mention « République de Guinée » sur votre pièce. Reprenez la photo en cadrant la pièce entière.",
          "We cannot read “Republic of Guinea” on your document. Take the photo again with the whole document in frame."
        ),
        probleme_visage: false,
      };
    }
    return {
      titre: e("Photo de la pièce à reprendre", "Document photo needs to be retaken"),
      message: e(
        "La photo de votre pièce n'a pas pu être lue correctement. Reprenez-la, bien à plat et bien éclairée.",
        "The photo of your document could not be read properly. Take it again, flat and well lit."
      ),
      probleme_visage: false,
    };
  }

  if (decision.includes("TYPE DE PIÈCE NON IDENTIFIÉ")) {
    return {
      titre: e("Pièce non reconnue", "Document not recognised"),
      message: e(
        "Nous n'avons pas reconnu votre pièce. Vérifiez que le type de pièce choisi est le bon et que la pièce entière est visible sur la photo.",
        "We did not recognise your document. Check that the selected document type is correct and the whole document is visible."
      ),
      probleme_visage: false,
    };
  }

  if (decision.includes("NON GUINÉENNE")) {
    return {
      titre: e("Pièce non acceptée", "Document not accepted"),
      message: e(
        "Seules les pièces guinéennes (CNI, carte d'électeur, permis) et les passeports sont acceptés.",
        "Only Guinean documents (ID card, voter card, driving licence) and passports are accepted."
      ),
      probleme_visage: false,
    };
  }

  if (decision.includes("ÂGE INSUFFISANT")) {
    const age = trouver(/(\d+) ans/)?.[1];
    return {
      titre: e("Âge insuffisant", "Too young"),
      message: e(
        `Vous devez avoir au moins 18 ans pour obtenir une SIM${age ? ` (âge lu sur la pièce : ${age} ans)` : ""}.`,
        `You must be at least 18 to get a SIM${age ? ` (age on the document: ${age})` : ""}.`
      ),
      probleme_visage: false,
    };
  }

  if (decision.includes("PIÈCE EXPIRÉE")) {
    const date = trouver(/(\d{2}\/\d{2}\/\d{4})/)?.[1];
    return {
      titre: e("Pièce expirée", "Expired document"),
      message: e(
        `Votre pièce a expiré${date ? ` le ${date}` : ""}. Utilisez une pièce d'identité en cours de validité.`,
        `Your document expired${date ? ` on ${date}` : ""}. Please use a valid ID document.`
      ),
      probleme_visage: false,
    };
  }

  if (decision.includes("SELFIE NON AUTHENTIQUE")) {
    return {
      titre: e("Selfie non accepté", "Selfie not accepted"),
      message: e(
        "Le selfie doit être pris en direct, face à la caméra. Une photo ou un écran présenté à la caméra n'est pas accepté.",
        "The selfie must be taken live, facing the camera. A photo or a screen shown to the camera is not accepted."
      ),
      probleme_visage: true,
    };
  }

  if (decision.includes("ANTI-SPOOFING NON VÉRIFIÉ")) {
    return {
      titre: e("Selfie à reprendre", "Selfie needs to be retaken"),
      message: e(
        "Nous n'avons pas pu confirmer que le selfie est pris en direct. Placez-vous face à la caméra, dans un endroit bien éclairé, et reprenez le selfie.",
        "We could not confirm the selfie was taken live. Face the camera in a well-lit place and take the selfie again."
      ),
      probleme_visage: true,
    };
  }

  if (decision.includes("VISAGE NON CONCORDANT")) {
    return visageNonConcordant;
  }

  if (decision.includes("VISAGE NON VÉRIFIABLE")) {
    if (/pièce/i.test(erreurVisage)) {
      return {
        titre: e("Visage de la pièce non détecté", "Face on the document not detected"),
        message: e(
          "Le visage sur la photo de votre pièce n'est pas détectable. Reprenez la photo de la pièce, bien nette et sans reflet sur la photo d'identité.",
          "The face on your document photo cannot be detected. Retake the document photo, sharp and without glare on the ID picture."
        ),
        probleme_visage: false,
      };
    }
    return {
      titre: e("Aucun visage détecté", "No face detected"),
      message: e(
        "Aucun visage n'a été détecté sur le selfie. Placez-vous bien face à la caméra, le visage entièrement visible.",
        "No face was detected on the selfie. Face the camera with your whole face visible."
      ),
      probleme_visage: true,
    };
  }

  if (decision.includes("REJETÉ")) {
    const raisons = raisonsDuJournal(details, en);
    return {
      titre: e("Vérification refusée", "Verification refused"),
      message: raisons.length
        ? e(
            `Motif : ${raisons.join(", ")}. Reprenez la photo de votre pièce, bien à plat et bien éclairée.`,
            `Reason: ${raisons.join(", ")}. Take the photo of your document again, flat and well lit.`
          )
        : e("La vérification a été refusée. Veuillez vous adresser à un agent.", "Verification was refused. Please contact an agent."),
      probleme_visage: raisons.some((r) => /visage|face/i.test(r)),
    };
  }

  return {
    titre: e("Vérification incomplète", "Verification incomplete"),
    message: result.message || e("Veuillez vous adresser à un agent.", "Please contact an agent."),
    probleme_visage: false,
  };
}

export type VerdictSelfie =
  | { valide: true }
  | { valide: false; message: string; relancerCamera: boolean };

/**
 * Interprète la décision KYC rendue après l'envoi du selfie.
 * Fail-closed : seule une décision "ACCEPTÉ" valide l'identité.
 */
export function interpreterDecisionSelfie(result: KycReponse, lang: Langue = "fr"): VerdictSelfie {
  if (identiteValidee(result)) return { valide: true };
  const { message, probleme_visage } = expliquerDecision(result, lang);
  return { valide: false, message, relancerCamera: probleme_visage };
}
