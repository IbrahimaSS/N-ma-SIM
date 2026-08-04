import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, apiSuccess, apiError } from '@/lib/auth'
import { z } from 'zod'

/**
 * @swagger
 * /api/offres:
 *   get:
 *     summary: List all active offers
 *     description: Returns all SIM offers. Public endpoint (no auth needed for kiosk display).
 *     tags: [Offres]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [SIM_STANDARD, SIM_INTERNET, SIM_ETUDIANT, SIM_ENTREPRISE]
 *     responses:
 *       200:
 *         description: List of offers
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''

    const offres = await prisma.offre.findMany({
      where: {
        estActif: true,
        ...(type ? { type: type as any } : {}),
      },
      orderBy: { prix: 'asc' },
    })

    return apiSuccess(offres)

  } catch (error) {
    console.error('[OFFRES GET]', error)
    return apiError('Erreur interne', 500)
  }
}

/**
 * @swagger
 * /api/offres:
 *   post:
 *     summary: Create a new offer
 *     description: Create a SIM offer (Admin only).
 *     tags: [Offres]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nom, prix, type]
 *             properties:
 *               nom:
 *                 type: string
 *               description:
 *                 type: string
 *               prix:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [SIM_STANDARD, SIM_INTERNET, SIM_ETUDIANT, SIM_ENTREPRISE]
 *               duree:
 *                 type: string
 *               data:
 *                 type: string
 *               appels:
 *                 type: string
 *               sms:
 *                 type: string
 *               couleur:
 *                 type: string
 *     responses:
 *       201:
 *         description: Offer created
 *       403:
 *         description: Forbidden
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) return apiError('Non authentifié', 401)
    if (authUser.role !== 'ADMIN') return apiError('Accès refusé — Admin uniquement', 403)

    const body = await request.json()

    const schema = z.object({
      nom: z.string().min(2),
      description: z.string().optional(),
      prix: z.number().positive(),
      type: z.enum(['SIM_STANDARD', 'SIM_INTERNET', 'SIM_ETUDIANT', 'SIM_ENTREPRISE']),
      duree: z.string().optional(),
      data: z.string().optional(),
      appels: z.string().optional(),
      sms: z.string().optional(),
      couleur: z.string().optional(),
    })

    const parsed = schema.safeParse(body)
    if (!parsed.success) return apiError('Données invalides', 400, parsed.error.flatten())

    const offre = await prisma.offre.create({ data: { ...parsed.data, estActif: true } })

    return apiSuccess(offre, 'Offre créée avec succès', 201)

  } catch (error) {
    console.error('[OFFRES POST]', error)
    return apiError('Erreur interne', 500)
  }
}

/**
 * @swagger
 * /api/offres:
 *   patch:
 *     summary: Update an offer
 *     description: Update a SIM offer by ID (Admin only).
 *     tags: [Offres]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
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
 *               nom:
 *                 type: string
 *               prix:
 *                 type: number
 *               estActif:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Offer updated
 */
export async function PATCH(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) return apiError('Non authentifié', 401)
    if (authUser.role !== 'ADMIN') return apiError('Accès refusé — Admin uniquement', 403)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return apiError('ID de l\'offre manquant', 400)

    const body = await request.json()
    const offre = await prisma.offre.update({ where: { id }, data: body })

    return apiSuccess(offre, 'Offre mise à jour')

  } catch (error) {
    console.error('[OFFRES PATCH]', error)
    return apiError('Erreur interne', 500)
  }
}
