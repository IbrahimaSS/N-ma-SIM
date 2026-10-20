import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, apiSuccess, apiError } from '@/lib/auth'

/**
 * @swagger
 * /api/partenaires/detail:
 *   get:
 *     summary: Fiche d'un établissement partenaire (admin) — comptes, réservations, historique
 *     parameters:
 *       - in: query
 *         name: nom
 *         required: true
 *         schema: { type: string }
 *     tags: [Partenaires]
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) return apiError('Non authentifié', 401)
    if (authUser.role !== 'ADMIN') return apiError('Accès refusé', 403)

    const nom = new URL(request.url).searchParams.get('nom')?.trim()
    if (!nom) return apiError('Établissement manquant', 400)

    const [comptes, reservations] = await Promise.all([
      prisma.utilisateur.findMany({
        where: { role: 'PARTENAIRE', partenaireNom: nom },
        select: { id: true, nom: true, email: true, telephone: true, statut: true, derniereConnexion: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.reservationSIM.findMany({
        where: { partenaireNom: nom },
        include: { offre: { select: { nom: true } }, creePar: { select: { nom: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // Historique : actions de ses comptes (connexions comprises), actions sur ses réservations
    // (y compris le retrait à la borne et les annulations par l'admin), règlements enregistrés.
    const logs = await prisma.log.findMany({
      where: {
        OR: [
          ...(comptes.length ? [{ utilisateurId: { in: comptes.map((c) => c.id) } }] : []),
          ...(comptes.length ? [{ entiteType: 'Utilisateur', entiteId: { in: comptes.map((c) => c.id) } }] : []),
          ...(reservations.length ? [{ entiteType: 'ReservationSIM', entiteId: { in: reservations.map((r) => r.id) } }] : []),
          { type: 'Réservation SIM', description: { startsWith: `Règlement de ${nom} ` } },
        ],
      },
      include: { utilisateur: { select: { nom: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 300,
    })

    return apiSuccess({ nom, comptes, reservations, logs })
  } catch (error) {
    console.error('[PARTENAIRES DETAIL]', error)
    return apiError('Erreur interne', 500)
  }
}
