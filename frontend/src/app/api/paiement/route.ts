import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, currency = "GNF" } = body;

    // Récupérer les clés depuis les variables d'environnement (ou utiliser celles de test)
    const licenseKey = process.env.LENGO_LICENSE_KEY || "VOTRE_LICENSE_KEY_TEST";
    const websiteId = process.env.LENGO_WEBSITE_ID || "ad8b9717"; // ID de test de la doc

    // L'URL de retour pointera vers notre page spéciale d'iframe-callback
    // On utilise l'origine de la requête entrante
    const url = new URL(request.url);
    const returnUrl = `${url.origin}/borne/nouvelle-sim/paiement-callback`;

    const payload = {
      websiteid: websiteId,
      amount: amount,
      currency: currency,
      return_url: returnUrl,
    };

    const response = await fetch("https://sandbox.lengopay.com/api/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${licenseKey}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || data.status !== "Success") {
      console.error("[LENGO PAY ERROR]", data);
      return NextResponse.json({ error: "Erreur lors de la génération du paiement Lengo Pay", details: data }, { status: 500 });
    }

    return NextResponse.json({
      pay_id: data.pay_id,
      payment_url: data.payment_url
    });

  } catch (error) {
    console.error("[API PAIEMENT ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}
