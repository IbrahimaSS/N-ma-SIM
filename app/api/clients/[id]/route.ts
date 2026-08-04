import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, apiSuccess, apiError } from '@/lib/auth'
import { z } from 'zod'

const updateClientSchema = z.object({
  statut: z.enum(['EN_ATTENTE', 'VALIDE', 'REJETE']).optional(),
  nom: z.string().optional(),
  prenom: z.string().optional(),
  telephone: z.string().optional(),
  email: z.string().email().optional(),
  photoPiece: z.string().optional(),
  photoSelfie: z.string().optional(),
})

/**
 * @swagger
 * /api/clients/{id}:
 *   get:
 *     summary: Get client by ID
 *     tags: [Clients]
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
 *         description: Client details with demands
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client not found
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) return apiError('Non authentifié', 401)

    const { id } = await params

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        demandes: {
          include: { offre: true, paiement: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!client) return apiError('Client introuvable', 404)

    return apiSuccess(client)

  } catch (error) {
    console.error('[CLIENT GET ID]', error)
    return apiError('Erreur interne', 500)
  }
}

/**
 * @swagger
 * /api/clients/{id}:
 *   patch:
 *     summary: Update client status
 *     description: Allows an agent to validate or reject a client (Admin/Agent only).
 *     tags: [Clients]
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
 *                 enum: [EN_ATTENTE, VALIDE, REJETE]
 *     responses:
 *       200:
 *         description: Client updated
 *       401:
 *         description: Unauthorized
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) return apiError('Non authentifié', 401)

    const { id } = await params
    const body = await request.json()
    const parsed = updateClientSchema.safeParse(body)

    if (!parsed.success) return apiError('Données invalides', 400, parsed.error.flatten())

    const client = await prisma.client.update({
      where: { id },
      data: parsed.data,
    })

    // Log
    if (parsed.data.statut) {
      await prisma.log.create({
        data: {
          type: `Client ${parsed.data.statut}`,
          description: `Client ${client.nom} ${client.prenom} marqué comme ${parsed.data.statut} par ${authUser.email}`,
          entiteId: id,
          entiteType: 'Client',
          utilisateurId: authUser.id,
        }
      })
    }

    return apiSuccess(client, 'Client mis à jour')

  } catch (error) {
    console.error('[CLIENT PATCH]', error)
    return apiError('Erreur interne', 500)
  }
}
