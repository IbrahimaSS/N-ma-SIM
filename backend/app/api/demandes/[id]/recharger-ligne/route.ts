import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, apiSuccess, apiError } from '@/lib/auth'
import { operationSurLigne } from '@/lib/ops'

/**
 * @swagger
 * /api/demandes/{id}/recharger-ligne:
 *   post:
 *     summary: Crédite le numéro d'une demande de recharge (ligne confirmée via OPS, solde tenu par N'ma SIM)
 *     description: |
 *       Appel interne de la borne (x-internal-service) ou admin / agent (relance).
 *       Le montant est celui du paiement CONFIRMÉ de la demande (jamais envoyé par la borne).
 *       Idempotent : une recharge déjà créditée ne l'est pas deux fois.
 *     tags: [Demandes]
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = getAuthUser(request)
    const isInternalService = request.headers.get('x-internal-service') === 'kiosk-borne'
    if (!isInternalService && !(authUser && ['ADMIN', 'AGENT'].includes(authUser.role))) return apiError('Non autorisé', 401)

    const { id } = await params
    const demande = await prisma.demandeSIM.findUnique({
      where: { id },
      select: {
        id: true, numeroDossier: true, type: true, numeroAReactiver: true, statutActivation: true, updatedAt: true,
        paiement: { select: { montant: true, statut: true } },
      },
    })
    if (!demande) return apiError('Demande introuvable', 404)
    if (demande.type !== 'RECHARGE') return apiError('Cette demande n\'est pas une recharge', 400)
    const numero = (demande.numeroAReactiver || '').replace(/\D/g, '')

    if (demande.statutActivation === 'ACTIVEE') {
      const s = await prisma.soldeLigne.findUnique({ where: { numero } })
      return apiSuccess({ numero, montant: demande.paiement?.montant ?? 0, solde: s?.solde ?? null, dejaFaite: true }, 'Recharge déjà créditée')
    }
    if (demande.paiement?.statut !== 'CONFIRME' || !(demande.paiement.montant > 0)) {
      return apiError('Aucun paiement confirmé pour cette recharge', 409)
    }
    const montant = demande.paiement.montant

    const resultat = await operationSurLigne({ requestId: demande.numeroDossier, numero })
    const qui = authUser?.email || 'Borne automatique'

    if (!resultat.ok) {
      await prisma.demandeSIM.update({
        where: { id },
        data: { statutActivation: 'ECHEC', messageActivation: resultat.message, updatedAt: demande.updatedAt },
      })
      await prisma.log.create({
        data: {
          type: 'Échec recharge',
          description: `Recharge de ${montant.toLocaleString('fr-FR')} GNF sur le ${numero} refusée (dossier ${demande.numeroDossier}) : ${resultat.message}`,
          entiteId: id, entiteType: 'DemandeSIM', utilisateurId: authUser?.id,
        },
      })
      return apiError(resultat.message, 502)
    }

    // Marquage conditionnel : si deux appels arrivent en même temps, un seul crédite le solde
    const pris = await prisma.demandeSIM.updateMany({
      where: { id, statutActivation: { not: 'ACTIVEE' } },
      data: { statutActivation: 'ACTIVEE', messageActivation: resultat.message, activeeLe: new Date(), updatedAt: demande.updatedAt },
    })
    const solde = pris.count
      ? await prisma.soldeLigne.upsert({
          where: { numero },
          create: { numero, solde: montant },
          update: { solde: { increment: montant } },
        })
      : await prisma.soldeLigne.findUnique({ where: { numero } })

    if (pris.count) {
      await prisma.log.create({
        data: {
          type: 'Recharge',
          description: `${montant.toLocaleString('fr-FR')} GNF crédités sur le ${numero} (solde ${(solde?.solde ?? montant).toLocaleString('fr-FR')} GNF), dossier ${demande.numeroDossier}, par ${qui}`,
          entiteId: id, entiteType: 'DemandeSIM', utilisateurId: authUser?.id,
        },
      })
    }
    return apiSuccess({ numero, montant, solde: solde?.solde ?? null }, 'Recharge créditée')
  } catch (error) {
    console.error('[RECHARGER LIGNE]', error)
    return apiError('Erreur interne', 500)
  }
}
