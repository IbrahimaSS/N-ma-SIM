import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Récupérer la langue depuis le FormData (sus par défaut)
    const lang = formData.get("lang") as string || "sus";
    
    // Nettoyer le formData pour ne pas envoyer 'lang' à FastAPI (qui ne l'attend pas forcément)
    const apiFormData = new FormData();
    apiFormData.append("page", formData.get("page") as string);
    apiFormData.append("audio", formData.get("audio") as Blob);
    
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
      { intention: null, raison: "erreur_proxy", message: "Impossible de joindre le service vocal (Python 8100)." },
      { status: 200 } // Retourne 200 pour éviter le crash front
    );
  }
}
