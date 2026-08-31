import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Le backend FastAPI tourne sur le port 8100
    const vocalApiUrl = process.env.VOCAL_API_URL || "http://127.0.0.1:8100";
    
    // Proxy de la requête vers FastAPI
    const response = await fetch(`${vocalApiUrl}/comprendre`, {
      method: "POST",
      body: formData,
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
