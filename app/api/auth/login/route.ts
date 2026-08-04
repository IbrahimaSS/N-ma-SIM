import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  hashPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyPassword,
  verifyRefreshToken,
  apiSuccess,
  apiError
} from '@/lib/auth'
import { z } from 'zod'

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and return access and refresh tokens.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               motDePasse:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Invalid credentials
 */
// =============================================
// POST /api/auth/login
// =============================================
const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  motDePasse: z.string().min(6, 'Mot de passe trop court'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return apiError('Données invalides', 400, parsed.error.flatten())
    }

    const { email, motDePasse } = parsed.data

    // Chercher l'utilisateur
    const user = await prisma.utilisateur.findUnique({ where: { email } })

    if (!user) {
      return apiError('Identifiants incorrects', 401)
    }

    if (user.statut === 'BLOQUE') {
      return apiError('Votre compte est bloqué. Contactez un administrateur.', 403)
    }

    // Vérifier le mot de passe
    const isValid = await verifyPassword(motDePasse, user.motDePasse)
    if (!isValid) {
      return apiError('Identifiants incorrects', 401)
    }

    // Générer les tokens
    const accessToken = generateAccessToken({ id: user.id, role: user.role, email: user.email })
    const refreshToken = generateRefreshToken({ id: user.id })

    // Sauvegarder le refresh token + dernière connexion
    await prisma.utilisateur.update({
      where: { id: user.id },
      data: { refreshToken, derniereConnexion: new Date() },
    })

    // Log de connexion
    await prisma.log.create({
      data: {
        type: 'Connexion',
        description: `${user.nom} s'est connecté`,
        entiteId: user.id,
        entiteType: 'Utilisateur',
        utilisateurId: user.id,
      },
    })

    return apiSuccess({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        photoProfil: user.photoProfil,
      },
    }, 'Connexion réussie')

  } catch (error) {
    console.error('[AUTH LOGIN]', error)
    return apiError('Erreur interne du serveur', 500)
  }
}
