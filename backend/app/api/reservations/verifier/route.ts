import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/auth'
import { normaliserCode, passeportCorrespond, raisonIndisponible, expirerReservations } from '@/lib/reservations'
import { cleClient, blocageRestant, enregistrerEchec, enregistrerSucces } from '@/lib/limiteur'

/**
 * @swagger
 * /api/reservations/verifier:
 *   post:
 *     summary: Vérifie un code de réservation (borne, public, essais limités)
 *     description: |
 *       { code } → résumé MASQUÉ de la réservation (prénom + initiale du nom).
 *       { code, numeroPasseport } → vérifie en plus que le passeport scanné correspond.
 *     tags: [Reservations]
 */
export async function POST(request: NextRequest) {
  const cle = cleClient(request)
  const reste = blocageRestant(cle)
  if (reste > 0) {
    return apiError(`Trop d'essais. Réessayez dans ${Math.ceil(reste / 60000)} minute(s).`, 429)
  }

  try {
    const body = await request.json().catch(() => ({}))
    const code = normaliserCode(body?.code)
    if (!code) { enregistrerEchec(cle); return apiError('Ce code n\'est pas valide.', 404) }

    await expirerReservations()
    const r = await prisma.reservationSIM.findUnique({
      where: { code },
      include: { offre: { select: { id: true, nom: true, type: true, prix: true, data: true, appels: true, sms: true, duree: true } } },
    })
    if (!r) { enregistrerEchec(cle); return apiError('Ce code n\'est pas valide.', 404) }
    if (r.statut !== 'ACTIVE') return apiError(raisonIndisponible(r.statut), 410, { statut: r.statut })

    // Vérification du passeport (après le scan à la borne)
    if (body?.numeroPasseport !== undefined) {
      if (!passeportCorrespond(r.numeroPasseport, body.numeroPasseport)) {
        enregistrerEchec(cle)
        return apiError('Le passeport scanné ne correspond pas à cette réservation.', 403)
      }
    }

    enregistrerSucces(cle)
    return apiSuccess({
      code: r.code,
      prenom: r.prenom,
      nomInitiale: r.nom ? `${r.nom.charAt(0)}.` : '',
      formatSim: r.formatSim,
      offre: r.offre,
      montantRecharge: r.montantRecharge,
      partenaireNom: r.partenaireNom,
      expireLe: r.expireLe,
      passeportVerifie: body?.numeroPasseport !== undefined,
    })
  } catch (error) {
    console.error('[RESERVATION VERIFIER]', error)
    return apiError('Erreur interne', 500)
  }
}
