import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

/**
 * Route proxy : appelée par la borne pour une recharge.
 * Flux : Crée un client minimal → Crée une Demande RECHARGE → Enregistre le Paiement
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { numero, montant, methode = "ESPECES", reference } = body;

    if (!numero || !montant) {
      return NextResponse.json({ error: "Numéro et montant requis" }, { status: 400 });
    }

    // ─── 1. Créer un client minimal avec juste le numéro ──────────────────
    const clientRes = await fetch(`${BACKEND_URL}/api/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom: "Recharge",
        prenom: numero,
        telephone: numero,
        typeClient: "RESIDENT",
      }),
    });

    if (!clientRes.ok) {
      const err = await clientRes.json();
      console.error("[RECHARGE] Erreur création client:", err);
      return NextResponse.json({ error: "Erreur création client", details: err }, { status: 500 });
    }

    const clientData = await clientRes.json();
    const clientId = clientData.data?.id;
    if (!clientId) {
      return NextResponse.json({ error: "ID client non reçu" }, { status: 500 });
    }

    // ─── 2. Créer une demande de type RECHARGE ───────────────────────────
    const numeroDossier = `NMA-RC-${Date.now()}-${randomUUID().slice(0, 4).toUpperCase()}`;
    const demandeRes = await fetch(`${BACKEND_URL}/api/demandes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        type: "RECHARGE",
        numeroAReactiver: numero,
        motifReactivation: `Recharge ${Number(montant).toLocaleString("fr-FR")} GNF`,
        // La recharge est validée IMMÉDIATEMENT — pas besoin d'un agent admin
        statut: "VALIDEE",
      }),
    });

    if (!demandeRes.ok) {
      const err = await demandeRes.json();
      console.error("[RECHARGE] Erreur création demande:", err);
      return NextResponse.json({ error: "Erreur création demande", details: err }, { status: 500 });
    }

    const demandeData = await demandeRes.json();
    const demandeId = demandeData.data?.id;
    const numDossierRetour = demandeData.data?.numeroDossier || numeroDossier;

    if (!demandeId) {
      return NextResponse.json({ error: "ID demande non reçu" }, { status: 500 });
    }

    // ─── 3. Normaliser la méthode de paiement ────────────────────────────
    const methodMap: Record<string, string> = {
      "orange-money": "ORANGE_MONEY",
      "orange money": "ORANGE_MONEY",
      "ORANGE_MONEY": "ORANGE_MONEY",
      "lengo pay": "ORANGE_MONEY",
      "lengo pay (mode démo)": "ORANGE_MONEY",
      "mtn": "MTN_MOBILE_MONEY",
      "mtn mobile money": "MTN_MOBILE_MONEY",
      "MTN_MOBILE_MONEY": "MTN_MOBILE_MONEY",
      "wave": "WAVE",
      "WAVE": "WAVE",
      "espèces": "ESPECES",
      "especes": "ESPECES",
      "ESPECES": "ESPECES",
    };
    const rawMethode = (methode || "ESPECES").toString();
    const methodePaiement = methodMap[rawMethode] || methodMap[rawMethode.toLowerCase()] || "ESPECES";

    // ─── 4. Enregistrer le paiement ──────────────────────────────────────
    const paiementRes = await fetch(`${BACKEND_URL}/api/paiements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        demandeId,
        montant: Number(montant),
        devise: "GNF",
        methodePaiement,
        referenceExterne: reference || undefined,
        numeroPaieur: numero,
        statut: "CONFIRME",
      }),
    });

    if (!paiementRes.ok) {
      const err = await paiementRes.json();
      console.error("[RECHARGE] Erreur paiement:", err);
      // On ne bloque pas — la demande existe, le paiement peut être rattrapé
    }

    // ─── 5. Valider immédiatement (recharge = service immédiat) ──────────
    // Le backend mettra aussi à jour le statut du client → VALIDE automatiquement
    await fetch(`${BACKEND_URL}/api/demandes/${demandeId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-internal-service": "kiosk-borne",
      },
      body: JSON.stringify({ statut: "VALIDEE", traitePar: "borne" }),
    });

    return NextResponse.json({
      success: true,
      numeroDossier: numDossierRetour,
      clientId,
      demandeId,
      numero,
      montant: Number(montant),
    });

  } catch (error) {
    console.error("[RECHARGE ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur lors de la recharge" }, { status: 500 });
  }
}
