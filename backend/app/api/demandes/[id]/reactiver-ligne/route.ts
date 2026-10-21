import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, apiSuccess, apiError } from '@/lib/auth'
import { operationSurLigne, normaliserImsi } from '@/lib/ops'

/**
 * @swagger
 * /api/demandes/{id}/reactiver-ligne:
 *   post:
 *     summary: Remet en service le numéro d'une demande de réactivation via OPS
 *     description: |
 *       Appel interne de la borne (x-internal-service) ou admin / agent (relance).
 *       { imsi } → nouvelle carte délivrée (motif perte) ; sans imsi → le client garde sa carte.
 *       Idempotent : une demande déjà réactivée renvoie son numéro.
 *     tags: [Demandes]
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = getAuthUser(request)
    const isInternalService = request.headers.get('x-internal-service') === 'kiosk-borne'
    if (!isInternalService && !(authUser && ['ADMIN', 'AGENT'].includes(authUser.role))) return apiError('Non autorisé', 401)

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const imsi = body?.imsi ? normaliserImsi(body.imsi) : null
    if (body?.imsi && !imsi) return apiError('IMSI de la carte invalide : 10 chiffres attendus.', 400)

    const demande = await prisma.demandeSIM.findUnique({
      where: { id },
      select: { id: true, numeroDossier: true, type: true, statut: true, numeroAReactiver: true, imsi: true, statutActivation: true, updatedAt: true },
    })
    if (!demande) return apiError('Demande introuvable', 404)
    if (demande.type !== 'REACTIVATION') return apiError('Cette demande n\'est pas une réactivation', 400)
    if (demande.statut === 'REJETEE') return apiError('Demande rejetée : la ligne ne peut pas être réactivée', 409)
    const numero = (demande.numeroAReactiver || '').replace(/\D/g, '')
    if (demande.statutActivation === 'ACTIVEE') return apiSuccess({ numero, dejaFaite: true }, 'Ligne déjà réactivée')

    if (imsi) {
      const autre = await prisma.demandeSIM.findFirst({ where: { imsi, NOT: { id } }, select: { numeroDossier: true } })
      if (autre) return apiError(`Cette carte a déjà été attribuée (dossier ${autre.numeroDossier}).`, 409)
    }

    const resultat = await operationSurLigne({ requestId: demande.numeroDossier, numero, imsi: imsi ?? undefined })
    const qui = authUser?.email || 'Borne automatique'
    const carte = imsi ? `nouvelle carte ${imsi}` : 'carte conservée'

    if (!resultat.ok) {
      await prisma.demandeSIM.update({
        where: { id },
        data: { statutActivation: 'ECHEC', messageActivation: `${carte} : ${resultat.message}`, updatedAt: demande.updatedAt },
      })
      await prisma.log.create({
        data: {
          type: 'Échec réactivation ligne',
          description: `Réactivation du ${numero} (${carte}) refusée pour le dossier ${demande.numeroDossier} : ${resultat.message}`,
          entiteId: id, entiteType: 'DemandeSIM', utilisateurId: authUser?.id,
        },
      })
      return apiError(resultat.message, resultat.simDejaUtilisee ? 409 : 502)
    }

    await prisma.demandeSIM.update({
      where: { id },
      data: {
        ...(imsi ? { imsi } : {}),
        statutActivation: 'ACTIVEE', messageActivation: resultat.message, activeeLe: new Date(), updatedAt: demande.updatedAt,
      },
    })
    await prisma.log.create({
      data: {
        type: 'Réactivation ligne',
        description: `Ligne ${numero} réactivée (${carte}) pour le dossier ${demande.numeroDossier} par ${qui}`,
        entiteId: id, entiteType: 'DemandeSIM', utilisateurId: authUser?.id,
      },
    })
    return apiSuccess({ numero, imsi }, 'Ligne réactivée')
  } catch (error) {
    console.error('[REACTIVER LIGNE]', error)
    return apiError('Erreur interne', 500)
  }
}
