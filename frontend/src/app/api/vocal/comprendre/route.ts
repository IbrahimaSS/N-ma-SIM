import { NextRequest, NextResponse } from "next/server";

// ─── Malinké : API dédiée (wav2vec2, /predict), contrat différent de l'API
// Soussou/Poular historique (/comprendre) — on adapte ici plutôt que de
// toucher au reste du front (AgentIA.tsx, soussou-vocal.ts).
const MALINKE_PAGE_MAP: Record<string, string> = {
  page_choix_du_service: "choix_service",
  page_type_de_piece: "type_piece",
  page_motif_reactivation: "motif_reactivation",
};

// Libellés du modèle Malinké → intentions génériques attendues par le front
// (mêmes noms que ceux utilisés pour le Soussou dans AgentIA.tsx).
const MALINKE_INTENT_MAP: Record<string, Record<string, string>> = {
  choix_service: { nouvelleSIM: "nouvelle_sim", reactivation: "reactivation_sim" },
  type_piece: { identite: "carte_nationale_identite", passport: "passeport", electeur: "carte_electeur" },
  motif_reactivation: { bloquer: "blocage", durer: "inactivite", voler: "perte" },
};

async function comprendreMalinke(page: string, audio: Blob) {
  const vocalApiUrl = process.env.VOCAL_API_URL_MALINKE || "http://127.0.0.1:8301";
  const malinkePage = MALINKE_PAGE_MAP[page];

  if (!malinkePage) {
    return { intention: null, raison: "page_inconnue", message: `Page non supportée en malinké : ${page}` };
  }

  const apiFormData = new FormData();
  apiFormData.append("audio", audio, "enregistrement.wav");
  apiFormData.append("langue", "malinke");
  apiFormData.append("page", malinkePage);

  const response = await fetch(`${vocalApiUrl}/predict`, { method: "POST", body: apiFormData });
  if (!response.ok) {
    const text = await response.text();
    console.error(`API Vocale Malinké a retourné ${response.status} :`, text);
    return { intention: null, raison: "erreur_api_vocal", message: `Erreur ${response.status} Python (malinké) : ${text}` };
  }

  const data = await response.json();

  // Silence / bruit (le modèle a lui-même prédit la classe "rien")
  if (data.raisons_rejet?.includes("classe_rien")) {
    return { intention: null, raison: "rien_detecte", scores: data.all_scores, message: "Rien détecté" };
  }

  // Pas reconnu (seuil de confiance ou marge top1/top2 insuffisants)
  if (!data.reconnu) {
    return { intention: null, raison: "non_compris", scores: data.all_scores, message: `Non compris (${data.label_brut}, confiance ${data.confidence?.toFixed(2)})` };
  }

  const intention = MALINKE_INTENT_MAP[malinkePage]?.[data.label] ?? null;
  return {
    intention,
    raison: intention ? "ok" : "label_non_mappe",
    scores: data.all_scores,
    message: `Intention détectée : ${data.label} (confiance ${data.confidence?.toFixed(2)})`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Récupérer la langue depuis le FormData (sus par défaut)
    const lang = (formData.get("lang") as string) || "sus";
    const page = formData.get("page") as string;
    const audio = formData.get("audio") as Blob;

    if (lang === "mal") {
      const data = await comprendreMalinke(page, audio);
      return NextResponse.json(data, { status: 200 });
    }

    // Nettoyer le formData pour ne pas envoyer 'lang' à FastAPI (qui ne l'attend pas forcément)
    const apiFormData = new FormData();
    apiFormData.append("page", page);
    apiFormData.append("audio", audio);

    // Déterminer l'URL du backend selon la langue
    let vocalApiUrl = process.env.VOCAL_API_URL || "http://127.0.0.1:8100";
    if (lang === "pou") {
      vocalApiUrl = process.env.VOCAL_API_URL_POULAR || "http://127.0.0.1:8200";
    }

    // Proxy de la requête vers FastAPI
    const response = await fetch(`${vocalApiUrl}/comprendre`, {
      method: "POST",
      body: apiFormData,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`API Vocale a retourné ${response.status} :`, text);
      return NextResponse.json(
        { intention: null, raison: "erreur_api_vocal", message: `Erreur ${response.status} Python : ${text}` },
        { status: 200 } // On met 200 pour que le front puisse lire le JSON sans crasher le fetch
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Erreur proxy API vocale:", error);
    return NextResponse.json(
      { intention: null, raison: "erreur_proxy", message: "Impossible de joindre le service vocal." },
      { status: 200 } // Retourne 200 pour éviter le crash front
    );
  }
}
