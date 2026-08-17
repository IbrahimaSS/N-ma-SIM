import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, getAuthUser, apiSuccess, apiError } from '@/lib/auth'
import { z } from 'zod'

const createUserSchema = z.object({
  nom: z.string().min(2),
  email: z.string().email(),
  telephone: z.string().optional(),
  motDePasse: z.string().min(6),
  role: z.enum(['ADMIN', 'AGENT', 'TECHNICIEN', 'LECTURE_SEULE']),
  permissions: z.array(z.string()).optional(),
  photoProfil: z.string().optional(),
})

/**
 * @swagger
 * /api/utilisateurs:
 *   get:
 *     summary: List all users
 *     description: Retrieve a list of users with optional filtering.
 *     tags:
 *       - Utilisateurs
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by role
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 */
// =============================================
// GET /api/utilisateurs — Liste tous les users
// =============================================
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) return apiError('Non authentifié', 401)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const statut = searchParams.get('statut') || ''

    const utilisateurs = await prisma.utilisateur.findMany({
      where: {
        AND: [
          search ? {
            OR: [
              { nom: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ]
          } : {},
          role ? { role: role as any } : {},
          statut ? { statut: statut as any } : {},
        ]
      },
      select: {
        id: true,
        nom: true,
        email: true,
        telephone: true,
        role: true,
        statut: true,
        photoProfil: true,
        permissions: true,
        derniereConnexion: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return apiSuccess(utilisateurs)

  } catch (error) {
    console.error('[UTILISATEURS GET]', error)
    return apiError('Erreur interne', 500)
  }
}

/**
 * @swagger
 * /api/utilisateurs:
 *   post:
 *     summary: Create a user
 *     description: Create a new user (Admin only).
 *     tags:
 *       - Utilisateurs
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *               email:
 *                 type: string
 *               telephone:
 *                 type: string
 *               motDePasse:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, AGENT, TECHNICIEN, LECTURE_SEULE]
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not Admin)
 *       409:
 *         description: Email already exists
 */
// =============================================
// POST /api/utilisateurs — Créer un utilisateur
// =============================================
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) return apiError('Non authentifié', 401)
    if (authUser.role !== 'ADMIN') return apiError('Accès refusé', 403)

    const body = await request.json()
    const parsed = createUserSchema.safeParse(body)

    if (!parsed.success) {
      return apiError('Données invalides', 400, parsed.error.flatten())
    }

    const { nom, email, telephone, motDePasse, role, permissions, photoProfil } = parsed.data

    // Vérifier si l'email existe déjà
    const exists = await prisma.utilisateur.findUnique({ where: { email } })
    if (exists) return apiError('Un utilisateur avec cet email existe déjà', 409)

    const hashedPassword = await hashPassword(motDePasse)

    const newUser = await prisma.utilisateur.create({
      data: {
        nom,
        email,
        telephone,
        motDePasse: hashedPassword,
        role,
        permissions: permissions || [],
        photoProfil,
      },
      select: {
        id: true, nom: true, email: true, telephone: true,
        role: true, statut: true, createdAt: true, photoProfil: true,
      }
    })

    // Log
    await prisma.log.create({
      data: {
        type: 'Création utilisateur',
        description: `Utilisateur ${nom} (${role}) créé par ${authUser.email}`,
        entiteId: newUser.id,
        entiteType: 'Utilisateur',
        utilisateurId: authUser.id,
      }
    })

    return apiSuccess(newUser, 'Utilisateur créé avec succès', 201)

  } catch (error) {
    console.error('[UTILISATEURS POST]', error)
    return apiError('Erreur interne', 500)
  }
}
