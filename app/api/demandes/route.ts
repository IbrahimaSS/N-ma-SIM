import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, apiSuccess, apiError } from '@/lib/auth'
import { z } from 'zod'
import { randomUUID } from 'crypto'

const createDemandeSchema = z.object({
  clientId: z.string(),
  type: z.enum(['NOUVELLE_SIM', 'REACTIVATION']),
  offreId: z.string().optional(),
  numeroAReactiver: z.string().optional(),
  motifReactivation: z.string().optional(),
})

/**
 * @swagger
 * /api/demandes:
 *   get:
 *     summary: List all SIM requests
 *     description: Retrieve SIM requests with optional filters (Auth required).
 *     tags: [Demandes SIM]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [EN_ATTENTE_VALIDATION, EN_COURS_DE_TRAITEMENT, VALIDEE, REJETEE]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [NOUVELLE_SIM, REACTIVATION]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by dossier number
 *     responses:
 *       200:
 *         description: List of SIM requests
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) return apiError('Non authentifié', 401)

    const { searchParams } = new URL(request.url)
    const statut = searchParams.get('statut') || ''
    const type = searchParams.get('type') || ''
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {
      AND: [
        statut ? { statut } : {},
        type ? { type } : {},
        search ? {
          OR: [
            { numeroDossier: { contains: search, mode: 'insensitive' } },
            { client: { nom: { contains: search, mode: 'insensitive' } } },
            { client: { prenom: { contains: search, mode: 'insensitive' } } },
          ]
        } : {},
      ]
    }

    const [demandes, total] = await Promise.all([
      prisma.demandeSIM.findMany({
        where,
        include: {
          client: { select: { id: true, nom: true, prenom: true, telephone: true } },
          offre: { select: { id: true, nom: true, prix: true } },
          paiement: { select: { id: true, statut: true, montant: true, methodePaiement: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.demandeSIM.count({ where })
    ])

    return apiSuccess({ demandes, total, page, totalPages: Math.ceil(total / limit) })

  } catch (error) {
    console.error('[DEMANDES GET]', error)
    return apiError('Erreur interne', 500)
  }
}

/**
 * @swagger
 * /api/demandes:
 *   post:
 *     summary: Create a SIM request
 *     description: Create a new SIM request from the kiosk (no auth) or admin.
 *     tags: [Demandes SIM]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clientId, type]
 *             properties:
 *               clientId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [NOUVELLE_SIM, REACTIVATION]
 *               offreId:
 *                 type: string
 *               numeroAReactiver:
 *                 type: string
 *               motifReactivation:
 *                 type: string
 *     responses:
 *       201:
 *         description: Request created
 *       400:
 *         description: Invalid data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createDemandeSchema.safeParse(body)

    if (!parsed.success) {
      return apiError('Données invalides', 400, parsed.error.flatten())
    }

    const { clientId, type, offreId, numeroAReactiver, motifReactivation } = parsed.data

    // Vérifier que le client existe
    const client = await prisma.client.findUnique({ where: { id: clientId } })
    if (!client) return apiError('Client introuvable', 404)

    // Vérifier l'offre si NOUVELLE_SIM
    if (type === 'NOUVELLE_SIM' && offreId) {
      const offre = await prisma.offre.findUnique({ where: { id: offreId } })
      if (!offre || !offre.estActif) return apiError('Offre introuvable ou inactive', 404)
    }

    // Générer un numéro de dossier unique
    const numeroDossier = `NMA-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`

    const demande = await prisma.demandeSIM.create({
      data: {
        numeroDossier,
        type,
        clientId,
        offreId: offreId || undefined,
        numeroAReactiver: numeroAReactiver || undefined,
        motifReactivation: motifReactivation || undefined,
        statut: 'EN_ATTENTE_VALIDATION',
      },
      include: {
        client: { select: { id: true, nom: true, prenom: true } },
        offre: true,
      }
    })

    return apiSuccess(demande, 'Demande créée avec succès', 201)

  } catch (error) {
    console.error('[DEMANDES POST]', error)
    return apiError('Erreur interne', 500)
  }
}
