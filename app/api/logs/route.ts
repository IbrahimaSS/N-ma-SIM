import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, apiSuccess, apiError } from '@/lib/auth'

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Get system logs
 *     description: Retrieve system activity logs (Auth required, Admin/Technicien recommended).
 *     tags: [Logs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by log type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of logs to return (default 50)
 *     responses:
 *       200:
 *         description: List of logs
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) return apiError('Non authentifié', 401)

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''
    const limit = parseInt(searchParams.get('limit') || '50')

    const logs = await prisma.log.findMany({
      where: type ? { type: { contains: type, mode: 'insensitive' } } : {},
      include: {
        utilisateur: { select: { nom: true, email: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return apiSuccess(logs)

  } catch (error) {
    console.error('[LOGS GET]', error)
    return apiError('Erreur interne', 500)
  }
}
