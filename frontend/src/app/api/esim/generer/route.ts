import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/esim/generer
 * ⚠️ PROTOTYPE — Génération simulée d'un profil eSIM.
 * La vraie intégration RSP/SM-DP+ avec l'opérateur sera réalisée en phase suivante.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { forfaitId, numeroDossier, nomClient } = body;

    // Simulation d'un délai de génération (1.5s)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Génération d'une référence unique
    const ref = `NMA-ESIM-${Date.now().toString(36).toUpperCase()}-DEMO`;
    const activationCode = `LPA:1$smdp.demo.nma-sim.gn$${ref}`;

    return NextResponse.json({
      success: true,
      demo: true, // Marqueur prototype explicite
      reference: ref,
      numeroDossier: numeroDossier || `NMA-${Date.now().toString().slice(-8)}`,
      nomClient: nomClient || "Client",
      forfaitId: forfaitId || "esim-pro",
      // Code d'activation eSIM (LPA = Local Profile Assistant)
      activationCode,
      qrString: activationCode,
      smdpAddress: "smdp.demo.nma-sim.gn",
      matchingId: ref,
      // Timestamp d'expiration (48h)
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      message: "Profil eSIM généré avec succès (données de démonstration)",
    });
  } catch (err) {
    console.error("[ESIM/GENERER]", err);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la génération eSIM" },
      { status: 500 }
    );
  }
}
