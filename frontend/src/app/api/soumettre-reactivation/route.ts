import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

function parseOcrDate(dateStr: string | undefined): string | undefined {
  if (!dateStr) return undefined;
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    const iso = `${year}-${month}-${day}`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return iso;
  }
  const d2 = new Date(dateStr);
  if (!isNaN(d2.getTime())) return dateStr;
  return undefined;
}

/**
 * Route proxy : appelée par la borne pour une réactivation SIM.
 * Flux : Crée le Client (avec KYC) → Crée Demande REACTIVATION → Paiement
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { client_info, numero_a_reactiver, motif_reactivation, paiement, kyc_result } = body;

    // ─── 1. Créer le client avec ses infos KYC ───────────────────────────
    const clientRes = await fetch(`${BACKEND_URL}/api/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom: client_info?.nom || "Inconnu",
        prenom: client_info?.prenom || "Inconnu",
        dateNaissance: parseOcrDate(client_info?.date_naissance),
        lieuNaissance: client_info?.lieu_naissance || undefined,
        nationalite: client_info?.nationalite || "Guinéenne",
        typePiece: client_info?.typePiece || client_info?.type_piece || undefined,
        numeroPiece: client_info?.numeroPiece || client_info?.numero_piece || client_info?.numero_identite || client_info?.numero_carte || client_info?.nin || undefined,
        telephone: client_info?.telephone || numero_a_reactiver || undefined,
        typeClient: "RESIDENT",
      }),
    });

    if (!clientRes.ok) {
      const err = await clientRes.json();
      console.error("[REACTIVATION] Erreur création client:", err);
      return NextResponse.json({ error: "Erreur création client", details: err }, { status: 500 });
    }

    const clientData = await clientRes.json();
    const clientId = clientData.data?.id;
    if (!clientId) {
      return NextResponse.json({ error: "ID client non reçu" }, { status: 500 });
    }

    // ─── 2. Créer la demande REACTIVATION ────────────────────────────────
    const demandeRes = await fetch(`${BACKEND_URL}/api/demandes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        type: "REACTIVATION",
        numeroAReactiver: numero_a_reactiver || undefined,
        motifReactivation: motif_reactivation || "Non précisé",
      }),
    });

    if (!demandeRes.ok) {
      const err = await demandeRes.json();
      console.error("[REACTIVATION] Erreur création demande:", err);
      return NextResponse.json({ error: "Erreur création demande", details: err }, { status: 500 });
    }

    const demandeData = await demandeRes.json();
    const demandeId = demandeData.data?.id;
    const numeroDossier = demandeData.data?.numeroDossier;

    if (!demandeId) {
      return NextResponse.json({ error: "ID demande non reçu" }, { status: 500 });
    }

    // ─── 3. Mettre à jour le score KYC si disponible ─────────────────────
    if (kyc_result) {
      await fetch(`${BACKEND_URL}/api/demandes/${demandeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scoreVerification: kyc_result.score || null,
          verificationOCR: kyc_result.champs ? true : false,
          verificationSelfie: kyc_result.selfie?.verifie ?? null,
        }),
      });
    }

    // ─── 4. Normaliser et enregistrer le paiement ────────────────────────
    const methodMap: Record<string, string> = {
      "orange-money": "ORANGE_MONEY",
      "orange money": "ORANGE_MONEY",
      "ORANGE_MONEY": "ORANGE_MONEY",
      "lengo pay": "ORANGE_MONEY",
      "lengo pay (mode démo)": "ORANGE_MONEY",
      "mtn": "MTN_MOBILE_MONEY",
      "MTN_MOBILE_MONEY": "MTN_MOBILE_MONEY",
      "wave": "WAVE",
      "WAVE": "WAVE",
      "espèces": "ESPECES",
      "ESPECES": "ESPECES",
    };
    const rawMethode = (paiement?.methode || "ESPECES").toString();
    const methodePaiement = methodMap[rawMethode] || methodMap[rawMethode.toLowerCase()] || "ESPECES";

    if (paiement?.montant) {
      const paiementRes = await fetch(`${BACKEND_URL}/api/paiements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demandeId,
          montant: Number(paiement.montant),
          devise: "GNF",
          methodePaiement,
          referenceExterne: paiement.reference || undefined,
          numeroPaieur: numero_a_reactiver || undefined,
          statut: "CONFIRME",
        }),
      });

      if (!paiementRes.ok) {
        const err = await paiementRes.json();
        console.error("[REACTIVATION] Erreur paiement:", err);
      }
    }

    // ─── 5. Auto-validation : paiement confirmé = demande validée ────────
    await fetch(`${BACKEND_URL}/api/demandes/${demandeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: "VALIDEE" }),
    });

    return NextResponse.json({
      success: true,
      numeroDossier: numeroDossier || "NMA-RE-0000",
      clientId,
      demandeId,
    });

  } catch (error) {
    console.error("[REACTIVATION ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur lors de la réactivation" }, { status: 500 });
  }
}
