import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, apiSuccess, apiError } from '@/lib/auth'

/**
 * @swagger
 * /api/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Returns all KPI data for the admin dashboard.
 *     tags: [Stats]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) return apiError('Non authentifié', 401)

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Toutes les stats en parallèle
    const [
      totalClients,
      clientsThisMonth,
      clientsLastMonth,
      totalDemandes,
      demandesEnAttente,
      demandesValidees,
      demandesRejetees,
      totalPaiements,
      paiementsConfirmes,
      montantTotalConfirme,
      utilisateursActifs,
      demandesRecentes,
      paiementsRecents,
    ] = await Promise.all([
      // Clients
      prisma.client.count(),
      prisma.client.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.client.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),

      // Demandes
      prisma.demandeSIM.count(),
      prisma.demandeSIM.count({ where: { statut: 'EN_ATTENTE_VALIDATION' } }),
      prisma.demandeSIM.count({ where: { statut: 'VALIDEE' } }),
      prisma.demandeSIM.count({ where: { statut: 'REJETEE' } }),

      // Paiements
      prisma.paiement.count(),
      prisma.paiement.count({ where: { statut: 'CONFIRME' } }),
      prisma.paiement.aggregate({
        where: { statut: 'CONFIRME' },
        _sum: { montant: true }
      }),

      // Utilisateurs
      prisma.utilisateur.count({ where: { statut: 'ACTIF' } }),

      // Activité récente
      prisma.demandeSIM.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { nom: true, prenom: true } },
          offre: { select: { nom: true } }
        }
      }),
      prisma.paiement.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: { statut: 'CONFIRME' },
        include: {
          demande: {
            include: { client: { select: { nom: true, prenom: true } } }
          }
        }
      }),
    ])

    // Calcul de tendance clients (%)
    const clientsTrend = clientsLastMonth > 0
      ? Math.round(((clientsThisMonth - clientsLastMonth) / clientsLastMonth) * 100)
      : 0

    return apiSuccess({
      clients: {
        total: totalClients,
        cemois: clientsThisMonth,
        tendance: clientsTrend,
      },
      demandes: {
        total: totalDemandes,
        enAttente: demandesEnAttente,
        validees: demandesValidees,
        rejetees: demandesRejetees,
      },
      paiements: {
        total: totalPaiements,
        confirmes: paiementsConfirmes,
        montantTotal: montantTotalConfirme._sum.montant || 0,
      },
      utilisateurs: {
        actifs: utilisateursActifs,
      },
      activiteRecente: {
        demandes: demandesRecentes,
        paiements: paiementsRecents,
      }
    })

  } catch (error) {
    console.error('[STATS GET]', error)
    return apiError('Erreur interne', 500)
  }
}
