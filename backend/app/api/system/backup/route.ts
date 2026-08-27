import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    // Vérification de sécurité : seul un ADMIN authentifié peut exporter toute la base.
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 });
    }
    if (authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Accès refusé' }, { status: 403 });
    }

    // Récupérer toutes les données de toutes les tables importantes
    const utilisateurs = await prisma.utilisateur.findMany();
    const clients = await prisma.client.findMany();
    const offres = await prisma.offre.findMany();
    const demandes = await prisma.demandeSIM.findMany();
    const paiements = await prisma.paiement.findMany();
    const parametres = await prisma.parametreSysteme.findMany();
    const bornes = await prisma.borne.findMany();
    const logs = await prisma.log.findMany();

    const backupData = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      data: {
        utilisateurs,
        clients,
        offres,
        demandes,
        paiements,
        parametres,
        bornes,
        logs
      }
    };

    // Retourner les données sous forme de JSON téléchargeable
    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="nmasim_backup_${new Date().toISOString().split('T')[0]}.json"`
      }
    });

  } catch (error: any) {
    console.error("[SYSTEM BACKUP ERROR]", error);
    return NextResponse.json({ success: false, message: "Erreur lors de la génération de la sauvegarde.", error: error.message }, { status: 500 });
  }
}
