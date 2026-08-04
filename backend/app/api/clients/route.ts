import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, apiSuccess, apiError } from '@/lib/auth'
import { z } from 'zod'

const createClientSchema = z.object({
  nom: z.string().min(2),
  prenom: z.string().min(2),
  dateNaissance: z.string().optional(),
  lieuNaissance: z.string().optional(),
  nationalite: z.string().optional(),
  profession: z.string().optional(),
  typeClient: z.enum(['RESIDENT', 'ETRANGER']).optional(),
  typePiece: z.string().optional(),
  numeroPiece: z.string().optional(),
  photoPiece: z.string().optional(),
  photoSelfie: z.string().optional(),
  telephone: z.string().optional(),
  email: z.string().email().optional(),
})

/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: List all clients
 *     description: Retrieve clients with optional search and status filters (Auth required).
 *     tags:
 *       - Clients
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, prenom or telephone
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [EN_ATTENTE, VALIDE, REJETE]
 *       - in: query
 *         name: typeClient
 *         schema:
 *           type: string
 *           enum: [RESIDENT, ETRANGER]
 *     responses:
 *       200:
 *         description: List of clients
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) return apiError('Non authentifié', 401)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const statut = searchParams.get('statut') || ''
    const typeClient = searchParams.get('typeClient') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {
      AND: [
        search ? {
          OR: [
            { nom: { contains: search, mode: 'insensitive' } },
            { prenom: { contains: search, mode: 'insensitive' } },
            { telephone: { contains: search } },
            { numeroPiece: { contains: search } },
          ]
        } : {},
        statut ? { statut } : {},
        typeClient ? { typeClient } : {},
      ]
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          demandes: {
            select: { id: true, type: true, statut: true, createdAt: true }
          }
        }
      }),
      prisma.client.count({ where })
    ])

    return apiSuccess({ clients, total, page, totalPages: Math.ceil(total / limit) })

  } catch (error) {
    console.error('[CLIENTS GET]', error)
    return apiError('Erreur interne', 500)
  }
}

/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Create a client
 *     description: Register a new client from the kiosk (borne). No auth required.
 *     tags:
 *       - Clients
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nom, prenom]
 *             properties:
 *               nom:
 *                 type: string
 *               prenom:
 *                 type: string
 *               dateNaissance:
 *                 type: string
 *               typeClient:
 *                 type: string
 *                 enum: [RESIDENT, ETRANGER]
 *               typePiece:
 *                 type: string
 *               numeroPiece:
 *                 type: string
 *               photoPiece:
 *                 type: string
 *               photoSelfie:
 *                 type: string
 *               telephone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Client created
 *       400:
 *         description: Invalid data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createClientSchema.safeParse(body)

    if (!parsed.success) {
      return apiError('Données invalides', 400, parsed.error.flatten())
    }

    const data = parsed.data

    const client = await prisma.client.create({
      data: {
        ...data,
        dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : undefined,
        statut: 'EN_ATTENTE',
      }
    })

    return apiSuccess(client, 'Client enregistré avec succès', 201)

  } catch (error) {
    console.error('[CLIENTS POST]', error)
    return apiError('Erreur interne', 500)
  }
}
