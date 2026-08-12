import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

/**
 * Convertit une date du format JJ/MM/AAAA (sortie de l'OCR)
 * vers le format ISO YYYY-MM-DD attendu par Prisma/PostgreSQL.
 * Retourne undefined si la date est invalide ou absente.
 */
function parseOcrDate(dateStr: string | undefined): string | undefined {
  if (!dateStr) return undefined;
  // Essaie le format DD/MM/YYYY
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    const iso = `${year}-${month}-${day}`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return iso;
  }
  // Essaie si déjà au format YYYY-MM-DD
  const d2 = new Date(dateStr);
  if (!isNaN(d2.getTime())) return dateStr;
  // Date invalide — on n'envoie rien
  return undefined;
}

/**
 * Route proxy : appelée par la borne après paiement validé.
 * Elle orchestre dans l'ordre :
 *   1. Créer le Client dans la DB
 *   2. Créer la Demande SIM liée
 *   3. Enregistrer le Paiement
 *   4. Retourner le numéro de dossier (ticket)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { client_info, offre_id, paiement } = body;

    // ─── 1. Créer le client ───────────────────────────────────────────────
    const clientRes = await fetch(`${BACKEND_URL}/api/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom: client_info.nom || "Inconnu",
        prenom: client_info.prenom || "Inconnu",
        dateNaissance: parseOcrDate(client_info.date_naissance),
        lieuNaissance: client_info.lieu_naissance || undefined,
        nationalite: client_info.nationalite || "Guinéenne",
        typePiece: client_info.type_piece || undefined,
        numeroPiece: client_info.numero_piece || undefined,
        photoPiece: client_info.photo_piece || undefined,
        photoSelfie: client_info.photo_selfie || undefined,
        telephone: client_info.telephone || undefined,
      }),
    });

    if (!clientRes.ok) {
      const err = await clientRes.json();
      console.error("[SOUMISSION] Erreur création client:", err);
      return NextResponse.json({ error: "Erreur lors de la création du client", details: err }, { status: 500 });
    }

    const clientData = await clientRes.json();
    const clientId = clientData.data?.id;

    if (!clientId) {
      return NextResponse.json({ error: "ID client non reçu du backend" }, { status: 500 });
    }

    // ─── 2. Créer la demande SIM ─────────────────────────────────────────
    const demandeRes = await fetch(`${BACKEND_URL}/api/demandes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        type: "NOUVELLE_SIM",
        offreId: offre_id || undefined,
      }),
    });

    if (!demandeRes.ok) {
      const err = await demandeRes.json();
      console.error("[SOUMISSION] Erreur création demande:", err);
      return NextResponse.json({ error: "Erreur lors de la création de la demande", details: err }, { status: 500 });
    }

    const demandeData = await demandeRes.json();
    const demandeId = demandeData.data?.id;
    const numeroDossier = demandeData.data?.numeroDossier;

    if (!demandeId) {
      return NextResponse.json({ error: "ID demande non reçu du backend" }, { status: 500 });
    }

    // ─── 3. Enregistrer le paiement ──────────────────────────────────────
    const paiementRes = await fetch(`${BACKEND_URL}/api/paiements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        demandeId,
        montant: paiement.montant,
        devise: "GNF",
        methodePaiement: paiement.methode,
        referenceExterne: paiement.reference || undefined,
        statut: "CONFIRME",
      }),
    });

    if (!paiementRes.ok) {
      const err = await paiementRes.json();
      console.error("[SOUMISSION] Erreur enregistrement paiement:", err);
      // On ne bloque pas — la demande est créée, le paiement peut être rattrapé manuellement
    }

    // ─── 4. Retourner le numéro de ticket ─────────────────────────────────
    return NextResponse.json({
      success: true,
      numeroDossier: numeroDossier || "NMA-2026-0001",
      clientId,
      demandeId,
    });

  } catch (error) {
    console.error("[SOUMISSION ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur interne lors de la soumission" }, { status: 500 });
  }
}
