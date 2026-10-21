import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, apiSuccess, apiError } from '@/lib/auth'
import { activerLigne, normaliserImsi } from '@/lib/ops'

/**
 * @swagger
 * /api/demandes/{id}/activer-sim:
 *   post:
 *     summary: Active la ligne de la carte SIM délivrée (IMSI lu au code-barres) via OPS
 *     description: |
 *       Appel interne de la borne (x-internal-service) après la sortie de la carte, ou par un
 *       admin / agent pour relancer une activation en échec. { imsi } → numéro attribué.
 *       Idempotent : une demande déjà activée avec la même carte renvoie son numéro.
 *     tags: [Demandes]
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = getAuthUser(request)
    const isInternalService = request.headers.get('x-internal-service') === 'kiosk-borne'
    if (!isInternalService && !(authUser && ['ADMIN', 'AGENT'].includes(authUser.role))) return apiError('Non autorisé', 401)

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const imsi = normaliserImsi(body?.imsi)
    if (!imsi) return apiError('Code-barres illisible : l\'IMSI de la carte doit contenir 10 chiffres.', 400)

    const demande = await prisma.demandeSIM.findUnique({
      where: { id },
      select: { id: true, numeroDossier: true, type: true, formatSim: true, statut: true, imsi: true, numeroAttribue: true, statutActivation: true, updatedAt: true },
    })
    if (!demande) return apiError('Demande introuvable', 404)
    if (demande.type !== 'NOUVELLE_SIM' || demande.formatSim !== 'PHYSIQUE') return apiError('Seule une nouvelle SIM physique s\'active avec une carte', 400)
    if (demande.statut === 'REJETEE') return apiError('Demande rejetée : la carte ne peut pas être activée', 409)

    if (demande.statutActivation === 'ACTIVEE') {
      if (demande.imsi === imsi) return apiSuccess({ numero: demande.numeroAttribue, imsi, dejaActivee: true }, 'Ligne déjà activée')
      return apiError('Une autre carte est déjà activée pour cette demande', 409)
    }

    const autre = await prisma.demandeSIM.findFirst({ where: { imsi, NOT: { id } }, select: { numeroDossier: true } })
    if (autre) return apiError(`Cette carte a déjà été attribuée (dossier ${autre.numeroDossier}). Utilisez une autre carte.`, 409)

    const resultat = await activerLigne({ requestId: demande.numeroDossier, imsi })
    const qui = authUser?.email || 'Borne automatique'

    if (!resultat.ok) {
      await prisma.demandeSIM.update({
        where: { id },
        data: { statutActivation: 'ECHEC', messageActivation: `Carte ${imsi} : ${resultat.message}`, updatedAt: demande.updatedAt },
      })
      await prisma.log.create({
        data: {
          type: 'Échec activation SIM',
          description: `Activation de la carte ${imsi} refusée pour le dossier ${demande.numeroDossier} : ${resultat.message}`,
          entiteId: id, entiteType: 'DemandeSIM', utilisateurId: authUser?.id,
        },
      })
      return apiError(resultat.simDejaUtilisee ? 'Cette carte est déjà active chez l\'opérateur. Utilisez une autre carte.' : resultat.message, resultat.simDejaUtilisee ? 409 : 502)
    }

    await prisma.demandeSIM.update({
      where: { id },
      data: { imsi, numeroAttribue: resultat.numero, statutActivation: 'ACTIVEE', messageActivation: resultat.message, activeeLe: new Date(), updatedAt: demande.updatedAt },
    })
    await prisma.log.create({
      data: {
        type: 'Activation SIM',
        description: `Ligne ${resultat.numero} activée (carte ${imsi}) pour le dossier ${demande.numeroDossier} par ${qui}`,
        entiteId: id, entiteType: 'DemandeSIM', utilisateurId: authUser?.id,
      },
    })
    return apiSuccess({ numero: resultat.numero, imsi }, 'Ligne activée')
  } catch (error) {
    console.error('[ACTIVER SIM]', error)
    return apiError('Erreur interne', 500)
  }
}
