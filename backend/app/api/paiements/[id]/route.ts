import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, apiSuccess, apiError } from '@/lib/auth'

/**
 * @swagger
 * /api/paiements/{id}:
 *   patch:
 *     summary: Confirm or update a payment
 *     description: Confirm payment (set status to CONFIRME). Auth required.
 *     tags: [Paiements]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               statut:
 *                 type: string
 *                 enum: [EN_ATTENTE, CONFIRME, ECHOUE, REMBOURSE]
 *               referenceExterne:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) return apiError('Non authentifié', 401)

    const { id } = await params
    const body = await request.json()
    const { statut, referenceExterne } = body

    const paiement = await prisma.paiement.update({
      where: { id },
      data: {
        ...(statut ? { statut } : {}),
        ...(referenceExterne ? { referenceExterne } : {}),
        ...(statut === 'CONFIRME' ? { confirmedAt: new Date() } : {}),
      },
      include: {
        demande: {
          include: { client: { select: { nom: true, prenom: true } } }
        }
      }
    })

    // Si paiement confirmé, mettre la demande en cours de traitement
    if (statut === 'CONFIRME') {
      await prisma.demandeSIM.update({
        where: { id: paiement.demandeId },
        data: { statut: 'EN_COURS_DE_TRAITEMENT' }
      })

      await prisma.log.create({
        data: {
          type: 'Paiement confirmé',
          description: `Paiement de ${paiement.montant} GNF confirmé pour ${paiement.demande.client.nom} ${paiement.demande.client.prenom}`,
          entiteId: id,
          entiteType: 'Paiement',
          utilisateurId: authUser.id,
        }
      })
    }

    return apiSuccess(paiement, 'Paiement mis à jour')

  } catch (error) {
    console.error('[PAIEMENT PATCH]', error)
    return apiError('Erreur interne', 500)
  }
}

/**
 * @swagger
 * /api/paiements/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Paiements]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment details
 *       404:
 *         description: Not found
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) return apiError('Non authentifié', 401)

    const { id } = await params
    const paiement = await prisma.paiement.findUnique({
      where: { id },
      include: { demande: { include: { client: true, offre: true } } }
    })

    if (!paiement) return apiError('Paiement introuvable', 404)

    return apiSuccess(paiement)

  } catch (error) {
    console.error('[PAIEMENT GET]', error)
    return apiError('Erreur interne', 500)
  }
}
