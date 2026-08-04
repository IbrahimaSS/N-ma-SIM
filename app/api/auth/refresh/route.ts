import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRefreshToken, generateAccessToken, apiSuccess, apiError } from '@/lib/auth'

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Issue a new access token using a valid refresh token.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       400:
 *         description: Missing refresh token
 *       401:
 *         description: Invalid session or expired token
 */
// =============================================
// POST /api/auth/refresh
// =============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return apiError('Refresh token manquant', 400)
    }

    const payload = verifyRefreshToken(refreshToken)
    if (!payload) {
      return apiError('Refresh token invalide ou expiré', 401)
    }

    const user = await prisma.utilisateur.findUnique({ where: { id: payload.id } })

    if (!user || user.refreshToken !== refreshToken) {
      return apiError('Session invalide', 401)
    }

    const accessToken = generateAccessToken({ id: user.id, role: user.role, email: user.email })

    return apiSuccess({ accessToken }, 'Token renouvelé')

  } catch (error) {
    console.error('[AUTH REFRESH]', error)
    return apiError('Erreur interne du serveur', 500)
  }
}

/**
 * @swagger
 * /api/auth/logout:
 *   delete:
 *     summary: User logout
 *     description: Clear the refresh token for a user.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 *       400:
 *         description: Missing userId
 */
// =============================================
// POST /api/auth/logout
// =============================================
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) return apiError('userId manquant', 400)

    await prisma.utilisateur.update({
      where: { id: userId },
      data: { refreshToken: null },
    })

    return apiSuccess(null, 'Déconnexion réussie')

  } catch (error) {
    console.error('[AUTH LOGOUT]', error)
    return apiError('Erreur interne du serveur', 500)
  }
}
