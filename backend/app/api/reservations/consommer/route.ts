import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/auth'
import { normaliserCode, passeportCorrespond, raisonIndisponible } from '@/lib/reservations'

/**
 * @swagger
 * /api/reservations/consommer:
 *   post:
 *     summary: Marque un code comme UTILISÉ au moment de la délivrance (appel interne de la borne)
 *     description: |
 *       { code, numeroPasseport } → réserve le code de façon atomique (une seule borne peut l'utiliser).
 *       { code, demandeId } (code déjà consommé) → rattache la demande SIM créée.
 *     tags: [Reservations]
 */
export async function POST(request: NextRequest) {
  if (request.headers.get('x-internal-service') !== 'kiosk-borne') return apiError('Non autorisé', 401)

  try {
    const body = await request.json().catch(() => ({}))
    const code = normaliserCode(body?.code)
    if (!code) return apiError('Code invalide', 400)

    // Étape 2 : rattacher la demande créée à la réservation consommée
    if (body?.demandeId) {
      const maj = await prisma.reservationSIM.updateMany({
        where: { code, statut: 'UTILISEE', demandeId: null },
        data: { demandeId: String(body.demandeId) },
      })
      return maj.count ? apiSuccess({ code }) : apiError('Réservation non rattachable', 409)
    }

    // Étape 1 : vérification + consommation atomique
    const r = await prisma.reservationSIM.findUnique({ where: { code } })
    if (!r) return apiError('Ce code n\'est pas valide.', 404)
    if (r.statut !== 'ACTIVE' || r.expireLe < new Date()) {
      return apiError(raisonIndisponible(r.statut === 'ACTIVE' ? 'EXPIREE' : r.statut), 410)
    }
    if (!passeportCorrespond(r.numeroPasseport, body?.numeroPasseport)) {
      return apiError('Le passeport scanné ne correspond pas à cette réservation.', 403)
    }

    // updateMany conditionnel : si deux bornes valident le même code en même temps,
    // une seule passe (l'autre obtient count = 0)
    const pris = await prisma.reservationSIM.updateMany({
      where: { code, statut: 'ACTIVE' },
      data: { statut: 'UTILISEE', utiliseeLe: new Date() },
    })
    if (!pris.count) return apiError('Ce code a déjà été utilisé.', 410)

    await prisma.log.create({
      data: {
        type: 'Réservation SIM',
        description: `Réservation ${code} utilisée à la borne par ${r.prenom} ${r.nom}`,
        entiteId: r.id,
        entiteType: 'ReservationSIM',
      },
    })

    return apiSuccess({
      code,
      formatSim: r.formatSim,
      offreId: r.offreId,
      montant: r.montant,
      montantRecharge: r.montantRecharge,
      partenaireNom: r.partenaireNom,
    })
  } catch (error) {
    console.error('[RESERVATION CONSOMMER]', error)
    return apiError('Erreur interne', 500)
  }
}
