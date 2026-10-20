import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, apiSuccess, apiError } from '@/lib/auth'
import { z } from 'zod'

/**
 * Ce que chaque partenaire doit à N'ma SIM : l'hôtel encaisse le voyageur à la réservation,
 * puis reverse le montant des SIM effectivement retirées à la borne (réservations UTILISEE).
 */
export interface SoldePartenaire {
  partenaireNom: string
  utilisees: number
  montantTotal: number
  aRegler: number
  montantARegler: number
  dernierReglement: string | null
}

const regleSchema = z.object({ partenaireNom: z.string().trim().min(1) })

/**
 * @swagger
 * /api/reservations/soldes:
 *   get:
 *     summary: Montant dû par partenaire (admin = tous, partenaire = le sien)
 *     tags: [Reservations]
 *   post:
 *     summary: Marquer comme réglées toutes les réservations utilisées non réglées d'un partenaire (admin)
 *     tags: [Reservations]
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request, { autoriserPartenaire: true })
    if (!authUser) return apiError('Non authentifié', 401)
    if (!['ADMIN', 'PARTENAIRE'].includes(authUser.role)) return apiError('Accès refusé', 403)

    const portee = { statut: 'UTILISEE' as const, ...(authUser.role === 'PARTENAIRE' ? { creeParId: authUser.id } : {}) }
    const [totaux, nonRegles, reglements] = await Promise.all([
      prisma.reservationSIM.groupBy({ by: ['partenaireNom'], where: portee, _count: { _all: true }, _sum: { montant: true } }),
      prisma.reservationSIM.groupBy({ by: ['partenaireNom'], where: { ...portee, regleLe: null }, _count: { _all: true }, _sum: { montant: true } }),
      prisma.reservationSIM.groupBy({ by: ['partenaireNom'], where: { ...portee, regleLe: { not: null } }, _max: { regleLe: true } }),
    ])

    const soldes: SoldePartenaire[] = totaux.map((t) => {
      const nr = nonRegles.find((n) => n.partenaireNom === t.partenaireNom)
      const rg = reglements.find((g) => g.partenaireNom === t.partenaireNom)
      return {
        partenaireNom: t.partenaireNom,
        utilisees: t._count._all,
        montantTotal: t._sum.montant ?? 0,
        aRegler: nr?._count._all ?? 0,
        montantARegler: nr?._sum.montant ?? 0,
        dernierReglement: rg?._max.regleLe?.toISOString() ?? null,
      }
    }).sort((a, b) => b.montantARegler - a.montantARegler)

    return apiSuccess(soldes)
  } catch (error) {
    console.error('[RESERVATIONS SOLDES GET]', error)
    return apiError('Erreur interne', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) return apiError('Non authentifié', 401)
    if (authUser.role !== 'ADMIN') return apiError('Accès refusé', 403)

    const parsed = regleSchema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) return apiError('Partenaire manquant', 400)
    const { partenaireNom } = parsed.data

    // Liste figée avant la mise à jour : le montant noté correspond exactement aux réservations marquées
    const aRegler = await prisma.reservationSIM.findMany({
      where: { partenaireNom, statut: 'UTILISEE', regleLe: null },
      select: { id: true, montant: true },
    })
    if (!aRegler.length) return apiError('Rien à régler pour ce partenaire', 409)
    const maj = await prisma.reservationSIM.updateMany({
      where: { id: { in: aRegler.map((r) => r.id) }, regleLe: null },
      data: { regleLe: new Date() },
    })

    const montant = aRegler.reduce((s, r) => s + r.montant, 0)
    await prisma.log.create({
      data: {
        type: 'Réservation SIM',
        description: `Règlement de ${partenaireNom} enregistré : ${maj.count} réservation(s), ${montant.toLocaleString('fr-FR')} GNF, par ${authUser.email}`,
        entiteType: 'ReservationSIM',
        utilisateurId: authUser.id,
      },
    })
    return apiSuccess({ partenaireNom, reservations: maj.count, montant }, 'Règlement enregistré')
  } catch (error) {
    console.error('[RESERVATIONS SOLDES POST]', error)
    return apiError('Erreur interne', 500)
  }
}
