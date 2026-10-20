import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, apiSuccess, apiError } from '@/lib/auth'
import { expirerReservations } from '@/lib/reservations'

/**
 * @swagger
 * /api/partenaires:
 *   get:
 *     summary: Liste des établissements partenaires (hôtels / agences) avec leurs chiffres (admin)
 *     description: |
 *       Un établissement = un nom (partenaireNom), qu'il ait des comptes PARTENAIRE ou seulement
 *       des réservations créées par l'admin pour lui.
 *     tags: [Partenaires]
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) return apiError('Non authentifié', 401)
    if (authUser.role !== 'ADMIN') return apiError('Accès refusé', 403)

    await expirerReservations()
    const [comptes, parStatut, nonRegles, dernieres] = await Promise.all([
      prisma.utilisateur.findMany({
        where: { role: 'PARTENAIRE' },
        select: { partenaireNom: true, statut: true, derniereConnexion: true },
      }),
      prisma.reservationSIM.groupBy({ by: ['partenaireNom', 'statut'], _count: { _all: true }, _sum: { montant: true } }),
      prisma.reservationSIM.groupBy({ by: ['partenaireNom'], where: { statut: 'UTILISEE', regleLe: null }, _sum: { montant: true } }),
      prisma.reservationSIM.groupBy({ by: ['partenaireNom'], _max: { createdAt: true } }),
    ])

    type Ligne = {
      nom: string; comptes: number; comptesActifs: number; derniereConnexion: Date | null
      actives: number; utilisees: number; expirees: number; annulees: number
      montantRetire: number; montantDu: number; derniereReservation: Date | null
    }
    const parNom = new Map<string, Ligne>()
    const ligne = (nom: string) => {
      if (!parNom.has(nom)) parNom.set(nom, {
        nom, comptes: 0, comptesActifs: 0, derniereConnexion: null,
        actives: 0, utilisees: 0, expirees: 0, annulees: 0, montantRetire: 0, montantDu: 0, derniereReservation: null,
      })
      return parNom.get(nom)!
    }

    for (const c of comptes) {
      if (!c.partenaireNom) continue
      const l = ligne(c.partenaireNom)
      l.comptes++
      if (c.statut === 'ACTIF') l.comptesActifs++
      if (c.derniereConnexion && (!l.derniereConnexion || c.derniereConnexion > l.derniereConnexion)) l.derniereConnexion = c.derniereConnexion
    }
    for (const g of parStatut) {
      const l = ligne(g.partenaireNom)
      const n = g._count._all
      if (g.statut === 'ACTIVE') l.actives += n
      if (g.statut === 'UTILISEE') { l.utilisees += n; l.montantRetire += g._sum.montant ?? 0 }
      if (g.statut === 'EXPIREE') l.expirees += n
      if (g.statut === 'ANNULEE') l.annulees += n
    }
    for (const g of nonRegles) ligne(g.partenaireNom).montantDu = g._sum.montant ?? 0
    for (const g of dernieres) ligne(g.partenaireNom).derniereReservation = g._max.createdAt

    const liste = [...parNom.values()].sort((a, b) => b.montantDu - a.montantDu || a.nom.localeCompare(b.nom))
    return apiSuccess(liste)
  } catch (error) {
    console.error('[PARTENAIRES GET]', error)
    return apiError('Erreur interne', 500)
  }
}
