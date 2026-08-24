import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    // Vérification de sécurité (pour une vraie prod, on vérifierait un token JWT admin)
    // Ici on suppose que la requête vient du panel admin sécurisé
    
    // Supprimer dans l'ordre inverse des relations pour éviter les erreurs de clés étrangères
    console.log("[SYSTEM] Début de la suppression des données...");
    
    // 1. Les Paiements (dépendent de DemandeSIM)
    const delPaiements = await prisma.paiement.deleteMany({});
    console.log(`[SYSTEM] ${delPaiements.count} paiements supprimés.`);

    // 2. Les Logs (dépendent potentiellement de DemandeSIM, Client, Utilisateur)
    // On pourrait garder les logs de connexion admin, mais pour l'instant on wipe tout ou presque
    const delLogs = await prisma.log.deleteMany({
      where: {
        type: {
          notIn: ["Connexion", "Déconnexion"] // On peut garder les logs de login admin si besoin, ou juste tout supprimer
        }
      }
    });
    console.log(`[SYSTEM] ${delLogs.count} logs de transaction supprimés.`);

    // 3. Les Demandes (dépendent de Client et Offre)
    const delDemandes = await prisma.demandeSIM.deleteMany({});
    console.log(`[SYSTEM] ${delDemandes.count} demandes supprimées.`);

    // 4. Les Clients
    const delClients = await prisma.client.deleteMany({});
    console.log(`[SYSTEM] ${delClients.count} clients supprimés.`);

    console.log("[SYSTEM] Nettoyage terminé avec succès.");

    return NextResponse.json({
      success: true,
      message: "Toutes les données de transaction ont été supprimées avec succès.",
      details: {
        paiements: delPaiements.count,
        logs: delLogs.count,
        demandes: delDemandes.count,
        clients: delClients.count
      }
    });
  } catch (error: any) {
    console.error("[SYSTEM WIPE ERROR]", error);
    return NextResponse.json({ success: false, message: "Erreur lors de la suppression des données.", error: error.message }, { status: 500 });
  }
}
