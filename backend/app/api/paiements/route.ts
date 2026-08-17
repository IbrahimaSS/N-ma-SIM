import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, apiSuccess, apiError } from '@/lib/auth'
import { z } from 'zod'

const createPaiementSchema = z.object({
  demandeId: z.string(),
  montant: z.number().positive(),
  methodePaiement: z.enum(['ORANGE_MONEY', 'MTN_MOBILE_MONEY', 'WAVE', 'ESPECES']),
  numeroPaieur: z.string().optional(),
  referenceExterne: z.string().optional(),
  statut: z.enum(['EN_ATTENTE', 'CONFIRME', 'ECHOUE', 'REMBOURSE']).optional(),
})

/**
 * @swagger
 * /api/paiements:
 *   get:
 *     summary: List all payments
 *     description: Retrieve all payments (Auth required).
 *     tags: [Paiements]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [EN_ATTENTE, CONFIRME, ECHOUE, REMBOURSE]
 *       - in: query
 *         name: methode
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of payments
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) return apiError('Non authentifié', 401)

    const { searchParams } = new URL(request.url)
    const statut = searchParams.get('statut') || ''
    const methode = searchParams.get('methode') || ''

    const paiements = await prisma.paiement.findMany({
      where: {
        ...(statut ? { statut: statut as any } : {}),
        ...(methode ? { methodePaiement: methode as any } : {}),
      },
      include: {
        demande: {
          include: {
            client: { select: { nom: true, prenom: true } },
            offre: { select: { nom: true } },
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    return apiSuccess(paiements)

  } catch (error) {
    console.error('[PAIEMENTS GET]', error)
    return apiError('Erreur interne', 500)
  }
}

/**
 * @swagger
 * /api/paiements:
 *   post:
 *     summary: Create a payment
 *     description: Initiate payment for a SIM request from kiosk.
 *     tags: [Paiements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [demandeId, montant, methodePaiement]
 *             properties:
 *               demandeId:
 *                 type: string
 *               montant:
 *                 type: number
 *               methodePaiement:
 *                 type: string
 *                 enum: [ORANGE_MONEY, MTN_MOBILE_MONEY, WAVE, ESPECES]
 *               numeroPaieur:
 *                 type: string
 *               referenceExterne:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment created
 *       400:
 *         description: Invalid data or payment already exists
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createPaiementSchema.safeParse(body)

    if (!parsed.success) {
      return apiError('Données invalides', 400, parsed.error.flatten())
    }

    const { demandeId, montant, methodePaiement, numeroPaieur, referenceExterne } = parsed.data

    // Vérifier que la demande existe
    const demande = await prisma.demandeSIM.findUnique({
      where: { id: demandeId },
      include: { paiement: true }
    })
    if (!demande) return apiError('Demande introuvable', 404)
    if (demande.paiement) return apiError('Un paiement existe déjà pour cette demande', 409)

    const paiement = await prisma.paiement.create({
      data: {
        demandeId,
        montant,
        methodePaiement,
        numeroPaieur: numeroPaieur || undefined,
        referenceExterne: referenceExterne || undefined,
        statut: parsed.data.statut || 'EN_ATTENTE',
        confirmedAt: parsed.data.statut === 'CONFIRME' ? new Date() : undefined,
      }
    })

    return apiSuccess(paiement, 'Paiement initié avec succès', 201)

  } catch (error) {
    console.error('[PAIEMENTS POST]', error)
    return apiError('Erreur interne', 500)
  }
}
