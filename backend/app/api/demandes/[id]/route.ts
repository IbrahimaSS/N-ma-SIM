import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, apiSuccess, apiError } from '@/lib/auth'
import { z } from 'zod'

const updateDemandeSchema = z.object({
  statut: z.enum(['EN_ATTENTE_VALIDATION', 'EN_COURS_DE_TRAITEMENT', 'VALIDEE', 'REJETEE']).optional(),
  commentaireAdmin: z.string().optional(),
  scoreVerification: z.number().optional(),
  verificationOCR: z.boolean().optional(),
  verificationSelfie: z.boolean().optional(),
})

/**
 * @swagger
 * /api/demandes/{id}:
 *   get:
 *     summary: Get SIM request by ID
 *     tags: [Demandes SIM]
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
 *         description: SIM request details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) return apiError('Non authentifié', 401)

    const { id } = await params

    const demande = await prisma.demandeSIM.findUnique({
      where: { id },
      include: {
        client: true,
        offre: true,
        paiement: true,
      }
    })

    if (!demande) return apiError('Demande introuvable', 404)

    return apiSuccess(demande)

  } catch (error) {
    console.error('[DEMANDE GET ID]', error)
    return apiError('Erreur interne', 500)
  }
}

/**
 * @swagger
 * /api/demandes/{id}:
 *   patch:
 *     summary: Update SIM request status
 *     description: Agent validates or rejects a SIM request (Auth required).
 *     tags: [Demandes SIM]
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
 *                 enum: [EN_ATTENTE_VALIDATION, EN_COURS_DE_TRAITEMENT, VALIDEE, REJETEE]
 *               commentaireAdmin:
 *                 type: string
 *               scoreVerification:
 *                 type: number
 *               verificationOCR:
 *                 type: boolean
 *               verificationSelfie:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Demande updated
 *       401:
 *         description: Unauthorized
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) return apiError('Non authentifié', 401)

    const { id } = await params
    const body = await request.json()
    const parsed = updateDemandeSchema.safeParse(body)

    if (!parsed.success) return apiError('Données invalides', 400, parsed.error.flatten())

    const demande = await prisma.demandeSIM.update({
      where: { id },
      data: {
        ...parsed.data,
        traitePar: authUser.email,
      },
      include: {
        client: { select: { nom: true, prenom: true } },
        offre: { select: { nom: true } },
      }
    })

    // Log
    if (parsed.data.statut) {
      await prisma.log.create({
        data: {
          type: `Demande ${parsed.data.statut}`,
          description: `Demande ${demande.numeroDossier} (${demande.client.nom} ${demande.client.prenom}) → ${parsed.data.statut} par ${authUser.email}`,
          entiteId: id,
          entiteType: 'DemandeSIM',
          utilisateurId: authUser.id,
        }
      })
    }

    return apiSuccess(demande, 'Demande mise à jour')

  } catch (error) {
    console.error('[DEMANDE PATCH]', error)
    return apiError('Erreur interne', 500)
  }
}
